import { buildPayload, contrastRatio, svgFromMatrix } from './qrify-core.mjs';

const form = document.querySelector('#qrForm');
const typeSelect = document.querySelector('#typeSelect');
const fieldGroups = [...document.querySelectorAll('[data-fields]')];
const urlInput = document.querySelector('#urlInput');
const textInput = document.querySelector('#textInput');
const emailInput = document.querySelector('#emailInput');
const phoneInput = document.querySelector('#phoneInput');
const ssidInput = document.querySelector('#ssidInput');
const passwordInput = document.querySelector('#passwordInput');
const securitySelect = document.querySelector('#securitySelect');
const passwordField = document.querySelector('#passwordField');
const firstNameInput = document.querySelector('#firstNameInput');
const lastNameInput = document.querySelector('#lastNameInput');
const organizationInput = document.querySelector('#organizationInput');
const contactPhoneInput = document.querySelector('#contactPhoneInput');
const contactEmailInput = document.querySelector('#contactEmailInput');
const foregroundInput = document.querySelector('#foregroundColor');
const backgroundInput = document.querySelector('#backgroundColor');
const sizeSelect = document.querySelector('#qrSize');
const canvas = document.querySelector('#qrCanvas');
const emptyPreview = document.querySelector('#emptyPreview');
const status = document.querySelector('#status');
const sizeReadout = document.querySelector('#sizeReadout');
const contrastWarning = document.querySelector('#contrastWarning');
const downloadPngButton = document.querySelector('#downloadPng');
const downloadSvgButton = document.querySelector('#downloadSvg');
const copyPayloadButton = document.querySelector('#copyPayload');
const clearButton = document.querySelector('#clearButton');
const exampleButton = document.querySelector('#exampleButton');

const quietZone = 4;
const generationDelay = 140;
let generationTimer = 0;
let currentPayload = null;
let currentMatrix = null;

function setStatus(message, state = '') {
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

function selectedFields() {
  switch (typeSelect.value) {
    case 'url':
      return { url: urlInput.value };
    case 'text':
      return { text: textInput.value };
    case 'email':
      return { email: emailInput.value };
    case 'phone':
      return { phone: phoneInput.value };
    case 'wifi':
      return {
        ssid: ssidInput.value,
        password: passwordInput.value,
        security: securitySelect.value,
      };
    case 'contact':
      return {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        organization: organizationInput.value,
        phone: contactPhoneInput.value,
        email: contactEmailInput.value,
      };
    default:
      return {};
  }
}

function syncModeFields() {
  const mode = typeSelect.value;
  for (const group of fieldGroups) group.hidden = group.dataset.fields !== mode;
  syncPasswordField();
}

function syncPasswordField() {
  const openNetwork = securitySelect.value === 'nopass';
  passwordField.hidden = openNetwork;
  if (openNetwork) passwordInput.value = '';
}

function updateContrastWarning() {
  const ratio = contrastRatio(foregroundInput.value, backgroundInput.value);
  contrastWarning.hidden = ratio >= 4.5;
  contrastWarning.setAttribute('aria-label', `Contrast ratio ${ratio.toFixed(2)} to 1.`);
}

function updateSizeReadout() {
  const size = Number(sizeSelect.value);
  sizeReadout.textContent = `${size} × ${size} px`;
}

function clearPreview(message, state = '') {
  currentPayload = null;
  currentMatrix = null;
  canvas.hidden = true;
  emptyPreview.hidden = false;
  downloadPngButton.disabled = true;
  downloadSvgButton.disabled = true;
  copyPayloadButton.disabled = true;
  setStatus(message, state);
}

function drawMatrix(matrix) {
  const size = Number(sizeSelect.value);
  const foreground = foregroundInput.value;
  const background = backgroundInput.value;
  const moduleCount = matrix.length;
  const totalModules = moduleCount + quietZone * 2;
  const context = canvas.getContext('2d', { alpha: false });

  canvas.width = size;
  canvas.height = size;
  canvas.style.width = `${size}px`;
  context.imageSmoothingEnabled = false;
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);
  context.fillStyle = foreground;

  for (let row = 0; row < moduleCount; row += 1) {
    const top = Math.round(((row + quietZone) * size) / totalModules);
    const bottom = Math.round(((row + quietZone + 1) * size) / totalModules);
    for (let column = 0; column < moduleCount; column += 1) {
      if (!matrix[row][column]) continue;
      const left = Math.round(((column + quietZone) * size) / totalModules);
      const right = Math.round(((column + quietZone + 1) * size) / totalModules);
      context.fillRect(left, top, right - left, bottom - top);
    }
  }
}

function generateNow() {
  window.clearTimeout(generationTimer);
  let payload;
  try {
    payload = buildPayload(typeSelect.value, selectedFields());
    if (typeof window.qrcode !== 'function' || typeof window.qrcode.stringToBytes !== 'function') {
      throw new Error('The QR code library could not be loaded. Refresh the page and try again.');
    }

    const code = window.qrcode(0, 'M');
    code.addData(payload, 'Byte');
    code.make();
    const moduleCount = code.getModuleCount();
    const matrix = Array.from({ length: moduleCount }, (_unused, row) => (
      Array.from({ length: moduleCount }, (_unusedColumn, column) => code.isDark(row, column))
    ));

    drawMatrix(matrix);
    currentPayload = payload;
    currentMatrix = matrix;
    canvas.hidden = false;
    emptyPreview.hidden = true;
    downloadPngButton.disabled = false;
    downloadSvgButton.disabled = false;
    copyPayloadButton.disabled = false;
    updateSizeReadout();
    setStatus('Your QR code is ready.', 'success');
  } catch (error) {
    const message = /overflow|too long|code length/i.test(error?.message || '')
      ? 'This content is too long for one QR code. Try shortening it.'
      : (error?.message || 'This content could not be turned into a QR code.');
    clearPreview(message, 'error');
  }
}

function scheduleGeneration() {
  window.clearTimeout(generationTimer);
  currentPayload = null;
  currentMatrix = null;
  downloadPngButton.disabled = true;
  downloadSvgButton.disabled = true;
  copyPayloadButton.disabled = true;
  setStatus('Updating preview…', 'pending');
  generationTimer = window.setTimeout(generateNow, generationDelay);
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function downloadPng() {
  if (!currentPayload) return;
  canvas.toBlob((blob) => {
    if (!blob) {
      setStatus('The PNG could not be created. Try downloading the SVG instead.', 'error');
      return;
    }
    downloadBlob(blob, 'qrify-code.png');
    setStatus('PNG downloaded.', 'success');
  }, 'image/png');
}

function downloadSvg() {
  if (!currentPayload || !currentMatrix) return;
  try {
    const svg = svgFromMatrix(currentMatrix, {
      size: Number(sizeSelect.value),
      foreground: foregroundInput.value,
      background: backgroundInput.value,
      quietZone,
    });
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'qrify-code.svg');
    setStatus('SVG downloaded.', 'success');
  } catch {
    setStatus('The SVG could not be created. Try downloading the PNG instead.', 'error');
  }
}

async function copyPayload() {
  if (!currentPayload) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable.');
    await navigator.clipboard.writeText(currentPayload);
    setStatus('Payload copied.', 'success');
  } catch {
    setStatus('Clipboard access is unavailable in this browser.', 'error');
  }
}

function clearAll() {
  window.clearTimeout(generationTimer);
  form.reset();
  typeSelect.value = 'url';
  securitySelect.value = 'WPA';
  sizeSelect.value = '256';
  foregroundInput.value = '#000000';
  backgroundInput.value = '#ffffff';
  syncModeFields();
  updateSizeReadout();
  updateContrastWarning();
  clearPreview('Enter content to create a QR code.');
}

form.addEventListener('input', scheduleGeneration);
form.addEventListener('submit', (event) => event.preventDefault());

typeSelect.addEventListener('change', () => {
  syncModeFields();
  scheduleGeneration();
});

securitySelect.addEventListener('change', () => {
  syncPasswordField();
  scheduleGeneration();
});

for (const control of [foregroundInput, backgroundInput]) {
  control.addEventListener('input', () => {
    updateContrastWarning();
    scheduleGeneration();
  });
  control.addEventListener('change', () => {
    updateContrastWarning();
    scheduleGeneration();
  });
}

sizeSelect.addEventListener('change', () => {
  updateSizeReadout();
  scheduleGeneration();
});

for (const preset of document.querySelectorAll('.preset-button')) {
  preset.addEventListener('click', () => {
    foregroundInput.value = preset.dataset.foreground;
    backgroundInput.value = preset.dataset.background;
    updateContrastWarning();
    scheduleGeneration();
  });
}

exampleButton.addEventListener('click', () => {
  typeSelect.value = 'url';
  syncModeFields();
  urlInput.value = 'https://example.com/qrify';
  generateNow();
  urlInput.focus();
});

clearButton.addEventListener('click', clearAll);
downloadPngButton.addEventListener('click', downloadPng);
downloadSvgButton.addEventListener('click', downloadSvg);
copyPayloadButton.addEventListener('click', copyPayload);

syncModeFields();
updateSizeReadout();
updateContrastWarning();
