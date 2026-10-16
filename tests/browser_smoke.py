#!/usr/bin/env python3
"""Optional browser smoke test; requires Python Playwright and local Chromium."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
import shutil
import struct

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT.parent), **kwargs)

    def log_message(self, _format, *_args):
        pass


def main():
    executable = shutil.which('chromium') or shutil.which('google-chrome')
    if not executable:
        raise SystemExit('Chromium is required for this optional browser smoke test.')

    server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f'http://127.0.0.1:{server.server_port}/QRify/'
    origin = f'http://127.0.0.1:{server.server_port}'
    errors = []
    requests = []

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=executable)
            context = browser.new_context(accept_downloads=True, viewport={"width": 1365, "height": 1000})
            context.grant_permissions(['clipboard-read', 'clipboard-write'], origin=origin)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            page.on('request', lambda request: requests.append(request.url))

            response = page.goto(base_url, wait_until='networkidle')
            assert response is not None and response.status == 200, f'{base_url} did not return HTTP 200'
            assert page.title().startswith('QRify')

            black_white = page.get_by_role('button', name='Black & white')
            pine = page.get_by_role('button', name='Pine')
            expect(black_white).to_have_attribute('aria-pressed', 'true')
            expect(pine).to_have_attribute('aria-pressed', 'false')
            pine.click()
            expect(pine).to_have_attribute('aria-pressed', 'true')
            expect(pine).to_have_css('border-color', 'rgb(14, 117, 103)')
            page.get_by_label('Foreground color').fill('#1767b1')
            expect(pine).to_have_attribute('aria-pressed', 'false')
            expect(black_white).to_have_attribute('aria-pressed', 'false')
            expect(page.get_by_role('heading', name='QR codes, made simple.')).to_be_visible()
            assert page.locator('.builder-pane .customization').count() == 1, 'customization controls must stay in the configuration pane'

            status = page.get_by_role('status')
            png_button = page.get_by_role('button', name='Download PNG')
            svg_button = page.get_by_role('button', name='Download SVG')
            expect(png_button).to_be_disabled()
            expect(svg_button).to_be_disabled()

            page.get_by_label('QR code type').select_option('url')
            page.get_by_label('Website URL').fill('qrify.app/demo?source=browser-test')
            expect(status).to_contain_text('ready', timeout=5000)
            canvas = page.get_by_label('Generated QR code preview')
            expect(canvas).to_be_visible()
            assert page.evaluate("""() => {
              const c = document.querySelector('canvas[aria-label="Generated QR code preview"]');
              return c && c.width > 0 && c.height > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((value, i) => i % 4 === 3 && value > 0);
            }"""), 'QR preview canvas was empty'

            page.get_by_label('Foreground color').fill('#1767b1')
            page.get_by_label('Background color').fill('#ffffff')
            page.get_by_label('QR code size').select_option('384')
            expect(status).to_contain_text('ready', timeout=5000)
            with page.expect_download() as png_info:
                png_button.click()
            png = png_info.value
            png_bytes = Path(png.path()).read_bytes()
            assert png.suggested_filename.endswith('.png')
            assert png_bytes[:8] == b'\x89PNG\r\n\x1a\n', 'PNG download has an invalid signature'
            assert struct.unpack('>II', png_bytes[16:24]) == (384, 384), 'PNG dimensions do not match selected size'

            with page.expect_download() as svg_info:
                svg_button.click()
            svg = svg_info.value
            svg_text = Path(svg.path()).read_text(encoding='utf-8')
            assert svg.suggested_filename.endswith('.svg')
            assert '<svg' in svg_text and 'width="384"' in svg_text
            assert '#1767b1' in svg_text and '#ffffff' in svg_text

            page.get_by_label('Foreground color').fill('#777777')
            expect(page.get_by_text('contrast', exact=False)).to_be_visible(timeout=3000)
            page.get_by_label('Foreground color').fill('#000000')

            page.get_by_label('QR code type').select_option('text')
            page.get_by_label('Text to encode').fill('QRify नमस्ते')
            expect(status).to_contain_text('ready', timeout=5000)
            encoded = page.evaluate("Array.from(qrcode.stringToBytes('QRify नमस्ते'))")
            assert encoded == list('QRify नमस्ते'.encode('utf-8')), 'QR library is not using UTF-8 bytes'

            page.get_by_label('QR code type').select_option('email')
            page.get_by_label('Email address').fill('melvin@example.com')
            expect(status).to_contain_text('ready', timeout=5000)
            page.get_by_role('button', name='Copy payload').click()
            expect(status).to_contain_text('copied', timeout=3000)
            assert page.evaluate('navigator.clipboard.readText()') == 'mailto:melvin@example.com'

            page.get_by_label('QR code type').select_option('phone')
            page.get_by_label('Phone number').fill('+1 (555) 010-0200')
            expect(status).to_contain_text('ready', timeout=5000)

            page.get_by_label('QR code type').select_option('wifi')
            page.get_by_label('Wi-Fi name (SSID)').fill('Cafe;Guest')
            page.get_by_label('Wi-Fi password').fill('secret-password')
            page.get_by_label('Wi-Fi security').select_option('WPA')
            expect(status).to_contain_text('ready', timeout=5000)

            page.get_by_label('QR code type').select_option('contact')
            page.get_by_label('First name').fill('Ada')
            page.get_by_label('Last name').fill('Lovelace')
            page.get_by_label('Contact email').fill('ada@example.test')
            expect(status).to_contain_text('ready', timeout=5000)

            page.get_by_label('QR code type').select_option('url')
            page.get_by_label('Website URL').fill('javascript:alert(1)')
            expect(status).to_contain_text('HTTP', timeout=3000)
            expect(png_button).to_be_disabled()
            expect(svg_button).to_be_disabled()
            page.get_by_role('button', name='Clear all').click()
            expect(png_button).to_be_disabled()
            expect(svg_button).to_be_disabled()
            expect(black_white).to_have_attribute('aria-pressed', 'true')

            for width in (320, 375, 768):
                page.set_viewport_size({"width": width, "height": 812})
                assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'{width}px layout overflows horizontally'
            assert not errors, f'browser errors: {errors}'
            assert requests and all(urlparse(url).netloc == f'127.0.0.1:{server.server_port}' for url in requests), 'unexpected external request'

            print('Browser smoke passed: root subpath, all six modes, UTF-8, validation, contrast warning, PNG/SVG, copy/reset, local requests, mobile layout, and console.')
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


if __name__ == '__main__':
    main()
