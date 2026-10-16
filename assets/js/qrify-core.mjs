const HEX_COLOR = /^#[\da-f]{6}$/i;
const EMAIL_ADDRESS = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;
const PHONE_CHARACTERS = /^\+?[\d(). -]+$/u;

function requiredText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function emailAddress(value) {
  const email = requiredText(value, 'Email address').replace(/^mailto:/i, '');
  if (!EMAIL_ADDRESS.test(email)) throw new Error('Enter a valid email address.');
  return email;
}

function phoneNumber(value) {
  const phone = requiredText(value, 'Phone number').replace(/^tel:/i, '');
  const digits = phone.replace(/\D/gu, '');
  if (!PHONE_CHARACTERS.test(phone) || digits.length < 3) {
    throw new Error('Enter a valid phone number.');
  }
  return phone;
}

function escapeWifi(value) {
  return value
    .replace(/[\\;,:]/gu, '\\$&')
    .replaceAll('\"', '\\$&');
}

function escapeVCard(value) {
  return value
    .replace(/\\/gu, '\\\\')
    .replace(/\r\n|\r|\n/gu, '\\n')
    .replace(/([;,])/gu, '\\$1');
}

export function buildPayload(mode, fields = {}) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new Error('Enter valid QR code content.');
  }

  switch (mode) {
    case 'url': {
      const value = requiredText(fields.url, 'URL');
      const bareHostPort = /^(?:localhost|(?:[a-z\d-]+\.)+[a-z\d.-]+):\d+(?:[/?#]|$)/iu.test(value);
      const candidate = /^[a-z][\da-z+.-]*:/iu.test(value) && !bareHostPort ? value : `https://${value}`;
      let url;
      try {
        url = new URL(candidate);
      } catch {
        throw new Error('Enter a valid URL, such as example.com.');
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('URL must use HTTP or HTTPS and cannot contain login credentials.');
      }
      return url.href;
    }
    case 'text': {
      if (typeof fields.text !== 'string' || fields.text.trim() === '') {
        throw new Error('Text is required.');
      }
      return fields.text;
    }
    case 'email':
      return `mailto:${emailAddress(fields.email)}`;
    case 'phone':
      return `tel:${phoneNumber(fields.phone).replace(/[(). -]/gu, '')}`;
    case 'wifi': {
      const ssid = requiredText(fields.ssid, 'Wi-Fi name (SSID)');
      const security = fields.security || 'WPA';
      if (!['WPA', 'WEP', 'nopass'].includes(security)) {
        throw new Error('Choose WPA, WEP, or an open network.');
      }
      const password = security === 'nopass' ? '' : requiredText(fields.password, 'Wi-Fi password');
      return `WIFI:T:${security};S:${escapeWifi(ssid)};${security === 'nopass' ? '' : `P:${escapeWifi(password)};`};`;
    }
    case 'contact': {
      const firstName = typeof fields.firstName === 'string' ? fields.firstName.trim() : '';
      const lastName = typeof fields.lastName === 'string' ? fields.lastName.trim() : '';
      if (!firstName && !lastName) throw new Error('Enter a first or last name.');

      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
        `FN:${escapeVCard(fullName)}`,
      ];
      if (typeof fields.organization === 'string' && fields.organization.trim()) {
        lines.push(`ORG:${escapeVCard(fields.organization.trim())}`);
      }
      if (typeof fields.phone === 'string' && fields.phone.trim()) {
        lines.push(`TEL;TYPE=CELL:${escapeVCard(phoneNumber(fields.phone))}`);
      }
      if (typeof fields.email === 'string' && fields.email.trim()) {
        lines.push(`EMAIL:${escapeVCard(emailAddress(fields.email))}`);
      }
      lines.push('END:VCARD');
      return lines.join('\r\n');
    }
    default:
      throw new Error('Choose a supported QR code type.');
  }
}

function luminance(hex) {
  if (!HEX_COLOR.test(hex)) throw new Error('Colors must be six-digit hexadecimal values.');
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(foregroundHex, backgroundHex) {
  const foreground = luminance(foregroundHex);
  const background = luminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

export function svgFromMatrix(matrix, options = {}) {
  const { size = 256, foreground = '#000000', background = '#ffffff', quietZone = 4 } = options;
  if (!Array.isArray(matrix) || matrix.length === 0
      || matrix.some((row) => !Array.isArray(row) || row.length !== matrix.length
        || row.some((module) => typeof module !== 'boolean'))) {
    throw new Error('QR matrix must be a non-empty square array of booleans.');
  }
  if (!Number.isInteger(size) || size < 1) throw new Error('SVG size must be a positive integer.');
  if (!Number.isInteger(quietZone) || quietZone < 0) throw new Error('Quiet zone must be a non-negative integer.');
  if (!HEX_COLOR.test(foreground) || !HEX_COLOR.test(background)) {
    throw new Error('Colors must be six-digit hexadecimal values.');
  }

  const modules = matrix.length;
  const dimension = modules + quietZone * 2;
  const paths = [];
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      if (matrix[row][column]) {
        const x = column + quietZone;
        const y = row + quietZone;
        paths.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${dimension}" height="${dimension}" fill="${background}"/><path fill="${foreground}" d="${paths.join('')}"/></svg>`;
}
