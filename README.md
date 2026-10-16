# QRify

**Free QR code generator. Private by design.** QRify creates QR codes for websites, text, Wi-Fi networks, email addresses, phone numbers, and contact cards. Customize colors and size, then download PNG or SVG. Generation and downloads run in your browser; no account or paid service is required.

[Open the live QRify generator](https://melvinvarghese.github.io/QRify/)

![QRify desktop interface showing the generator and a sample QR code](docs/images/qrify-preview.png)

## Features

- Six formats: website URL, plain text, email, phone, Wi-Fi, and vCard contact.
- Live QR preview with medium error correction and a quiet zone.
- PNG and SVG downloads, plus a button to copy the encoded payload.
- Four output sizes (192, 256, 384, or 512 px), color controls, and three high-contrast presets.
- Input validation, clear/reset controls, and a contrast warning.
- Responsive layout, keyboard-visible focus, reduced-motion support, and system light/dark appearance.
- No build step, backend, analytics, advertising, or external runtime dependencies.

## Privacy and safe sharing

QRify runs its generator in the page you opened. The app does not send entered content to a server, use analytics, or save it to local or session storage. The page and its locally hosted assets are downloaded from GitHub Pages; the QR payload itself stays in browser memory. Copying uses the browser clipboard only after you choose **Copy payload**, and downloads are created on your device.

A QR code is not encrypted. Anyone who scans it may be able to read its contents. In particular, a Wi-Fi QR code includes the network password in its encoded payload. Check the code’s content before sharing it. QRify does not check whether a URL is safe or where it will lead.

## Use QRify

1. Choose the kind of information to encode.
2. Enter the content and review the preview.
3. Optionally change the size or colors. QRify warns when the color contrast is low, but that warning cannot guarantee that every scanner will read a code.
4. Download PNG or SVG, or copy the exact payload encoded in the QR code.

URL mode accepts HTTP or HTTPS and adds `https://` if you omit a scheme. Email and phone modes also accept `mailto:` and `tel:` links. Wi-Fi supports WPA/WPA2, WEP, and open networks. A contact card uses the vCard 3.0 format.

## Limitations

QRify creates codes; it does not scan them, encrypt their contents, verify a destination, or guarantee compatibility with every scanner. If the entered data exceeds the QR standard’s capacity, shorten it and try again. Always inspect a code before distributing it.

## Contributing

Issues and pull requests are welcome. Keep generation local to the browser, avoid adding trackers or external runtime requests, and run the core tests before submitting a change. Include a browser smoke-test result when changing the interface or QR output.
