// State Management
const AppState = {
  selectedFiles: [],
  extractedData: null,
  activeResultTab: 0,
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['.pdf', '.csv', '.png', '.jpg', '.jpeg'],
  allowedTypes: ['application/pdf', 'text/csv', 'image/png', 'image/jpeg']
};

// Webhook Configuration
const WEBHOOK_URL = 'https://n8n.flowgenicsent.com/webhook/invoice-extraction';

// DOM Elements
const elements = {
  viewMain: document.getElementById('view-main'),
  viewLoading: document.getElementById('view-loading'),
  viewResults: document.getElementById('view-results'),
  viewError: document.getElementById('view-error'),
  
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  selectedFilesContainer: document.getElementById('selected-files-container'),
  fileList: document.getElementById('file-list'),
  fileCount: document.getElementById('file-count'),
  
  btnClear: document.getElementById('btn-clear'),
  btnExtract: document.getElementById('btn-extract'),
  
  loadingStatus: document.getElementById('loading-status'),
  loadingTimer: document.getElementById('loading-timer'),
  
  resultsSidebar: document.getElementById('results-sidebar'),
  tabsContainer: document.getElementById('tabs-container'),
  btnUploadMore: document.getElementById('btn-upload-more'),
  
  resultFilename: document.getElementById('result-filename'),
  resultFilesize: document.getElementById('result-filesize'),
  btnCopyJson: document.getElementById('btn-copy-json'),
  btnDownloadJson: document.getElementById('btn-download-json'),
  btnDownloadCsv: document.getElementById('btn-download-csv'),
  
  extractedFieldsGrid: document.getElementById('extracted-fields-grid'),
  lineItemsContainer: document.getElementById('line-items-container'),
  lineItemsBody: document.getElementById('line-items-body'),
  rawJsonOutput: document.getElementById('raw-json-output'),
  
  errorMessage: document.getElementById('error-message'),
  errorDetails: document.getElementById('error-details'),
  btnErrorBack: document.getElementById('btn-error-back'),
  
  inputName: document.getElementById('input-name'),
  inputCompany: document.getElementById('input-company'),
  inputEmail: document.getElementById('input-email')
};

// Loading Screen messages rotator
let statusInterval = null;
let timerInterval = null;
let startTime = null;

const loadingMessages = [
  'Uploading invoice files...',
  'Analyzing document structures...',
  'Running optical character recognition (OCR)...',
  'Extracting invoice fields & metadata...',
  'Structuring key-value tables...',
  'Validating line items...',
  'Almost done, formatting results...'
];

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  setupFileSelection();
  setupActionButtons();
  setupFormValidation();
});

function setupFormValidation() {
  const inputs = [elements.inputName, elements.inputCompany, elements.inputEmail];
  inputs.forEach(input => {
    input.addEventListener('input', validateForm);
  });
}

function validateForm() {
  const fileCount = AppState.selectedFiles.length;
  const name = elements.inputName.value.trim();
  const company = elements.inputCompany.value.trim();
  const email = elements.inputEmail.value.trim();
  
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = name.length > 0 && company.length > 0 && isEmailValid;
  
  elements.btnExtract.disabled = !(fileCount > 0 && isFormValid);
}

// View Navigation Utility
function switchView(targetView) {
  const views = [elements.viewMain, elements.viewLoading, elements.viewResults, elements.viewError];
  views.forEach(view => {
    if (view === targetView) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });
}

// 1. Drag and Drop Logic
function setupDragAndDrop() {
  const dropZone = elements.dropZone;

  // Prevent default behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  // Toggle visual cues
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover');
    }, false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    handleFilesSelected(files);
  });

  // Click to browse
  dropZone.addEventListener('click', (e) => {
    if (e.target !== elements.fileInput) {
      elements.fileInput.click();
    }
  });
}

// 2. File Selection Logic
function setupFileSelection() {
  elements.fileInput.addEventListener('click', e => {
    e.stopPropagation();
  });

  elements.fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    handleFilesSelected(files);
    // Reset file input value so same file can be re-selected if removed
    elements.fileInput.value = '';
  });
}

// 3. Action Buttons Event Listeners
function setupActionButtons() {
  elements.btnClear.addEventListener('click', () => {
    AppState.selectedFiles = [];
    updateFileListUI();
  });

  elements.btnExtract.addEventListener('click', () => {
    startExtractionProcess();
  });

  elements.btnUploadMore.addEventListener('click', () => {
    AppState.selectedFiles = [];
    AppState.extractedData = null;
    updateFileListUI();
    switchView(elements.viewMain);
  });

  elements.btnErrorBack.addEventListener('click', () => {
    // Return to main uploader but preserve selected files so they can edit
    switchView(elements.viewMain);
  });

  // Results Actions
  elements.btnCopyJson.addEventListener('click', copyActiveJsonToClipboard);
  elements.btnDownloadJson.addEventListener('click', downloadActiveJson);
  elements.btnDownloadCsv.addEventListener('click', downloadActiveCsv);
}

// File Validation & Management
function handleFilesSelected(newFiles) {
  const errors = [];
  const validFilesToAdd = [];

  newFiles.forEach(file => {
    // Check extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const hasValidExt = AppState.allowedExtensions.includes(extension);
    const hasValidType = AppState.allowedTypes.includes(file.type);

    if (!hasValidExt && !hasValidType) {
      errors.push(`"${file.name}" has an unsupported format. Please upload PDF, CSV, PNG, or JPG.`);
      return;
    }

    // Check size limit (5MB)
    if (file.size > AppState.maxFileSize) {
      errors.push(`"${file.name}" exceeds the 5MB size limit.`);
      return;
    }

    // Check if file is already added
    const isDuplicate = AppState.selectedFiles.some(f => f.name === file.name && f.size === file.size);
    if (!isDuplicate) {
      validFilesToAdd.push(file);
    }
  });

  // Display errors if any
  if (errors.length > 0) {
    alert(errors.join('\n'));
  }

  // Check file count limit (max 5)
  const totalPotentialCount = AppState.selectedFiles.length + validFilesToAdd.length;
  if (totalPotentialCount > AppState.maxFiles) {
    alert(`Limit exceeded. You can only upload a maximum of ${AppState.maxFiles} files at a time.`);
    // Add only up to the limit
    const slotsLeft = AppState.maxFiles - AppState.selectedFiles.length;
    if (slotsLeft > 0) {
      AppState.selectedFiles.push(...validFilesToAdd.slice(0, slotsLeft));
    }
  } else {
    AppState.selectedFiles.push(...validFilesToAdd);
  }

  updateFileListUI();
}

function removeFile(index) {
  AppState.selectedFiles.splice(index, 1);
  updateFileListUI();
}

// UI Sync for selected files list
function updateFileListUI() {
  const fileList = elements.fileList;
  fileList.innerHTML = '';

  const count = AppState.selectedFiles.length;
  elements.fileCount.textContent = count;

  if (count === 0) {
    elements.selectedFilesContainer.classList.add('hidden');
  } else {
    elements.selectedFilesContainer.classList.remove('hidden');
  }

  validateForm();

  AppState.selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const extension = file.name.split('.').pop().toUpperCase();
    const formattedSize = formatBytes(file.size);

    fileItem.innerHTML = `
      <div class="file-item-info">
        <!-- SVG File Type Icon -->
        <svg class="file-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="9" y1="15" x2="15" y2="15"></line>
          <line x1="9" y1="11" x2="10" y2="11"></line>
          <line x1="9" y1="19" x2="12" y2="19"></line>
        </svg>
        <div class="file-details">
          <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <span class="file-size">${extension} • ${formattedSize}</span>
        </div>
      </div>
      <button class="btn-remove" title="Remove file" onclick="removeFile(${index})">
        <svg class="btn-remove-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    fileList.appendChild(fileItem);
  });
}

// Exposure to global scope for HTML onclick
window.removeFile = removeFile;

// 4. Loading States & Webhook Fetching
function startExtractionProcess() {
  switchView(elements.viewLoading);
  
  // Reset Timer
  startTime = Date.now();
  elements.loadingTimer.textContent = '0.0s';
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    elements.loadingTimer.textContent = elapsed.toFixed(1) + 's';
  }, 100);

  // Status message rotator
  let messageIndex = 0;
  elements.loadingStatus.textContent = loadingMessages[0];
  statusInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % loadingMessages.length;
    elements.loadingStatus.textContent = loadingMessages[messageIndex];
  }, 2500);

  // Prepare Multipart Data
  const formData = new FormData();
  
  // Append user metadata
  formData.append('name', elements.inputName.value.trim());
  formData.append('company', elements.inputCompany.value.trim());
  formData.append('email', elements.inputEmail.value.trim());

  AppState.selectedFiles.forEach((file) => {
    // Append files under key 'file'
    formData.append('file', file);
  });

  // Abort controller with 5-minute timeout to allow n8n enough processing time
  const controller = new AbortController();
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Call Webhook
  fetch(WEBHOOK_URL, {
    method: 'POST',
    body: formData,
    signal: controller.signal
  })
  .then(async response => {
    clearTimeout(timeoutId);
    stopLoadingProgress();

    // Always read body as text first to avoid crashing on empty responses
    const text = await response.text();
    console.log('Webhook response status:', response.status);
    console.log('Webhook response body:', text);

    if (!text || text.trim().length === 0) {
      displayError(
        'The server returned an empty response.',
        `Status: ${response.status}\n\nThe n8n workflow may not be sending data back through the "Respond to Webhook" node, or the request is being intercepted before reaching n8n.`
      );
      return;
    }

    let responseData = null;
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      displayError(
        'The server returned an invalid response.',
        `Status: ${response.status}\nBody: "${text.substring(0, 300)}"\n\nExpected JSON but could not parse the response.`
      );
      return;
    }

    if (!response.ok) {
      // If error payload is present
      const errorMsg = parseErrorFromPayload(responseData) || `Server responded with status ${response.status}`;
      displayError(errorMsg, JSON.stringify(responseData, null, 2));
      return;
    }

    // Check if the successful status code returned a webhook error representation
    const potentialError = parseErrorFromPayload(responseData);
    if (potentialError) {
      displayError(potentialError, JSON.stringify(responseData, null, 2));
      return;
    }

    // Process and display results
    handleExtractionSuccess(responseData);
  })
  .catch(error => {
    clearTimeout(timeoutId);
    stopLoadingProgress();
    console.error('Error during extraction request:', error);

    if (error.name === 'AbortError') {
      displayError(
        'Request timed out.',
        'The extraction is taking longer than 5 minutes. This may happen with large or complex invoices.\n\nPlease try again with fewer files, or contact support if the issue persists.'
      );
    } else {
      displayError(
        'Failed to connect to the extraction service.', 
        `${error.message}\n\nThis is likely a server timeout — the invoice processing took too long and the connection was closed.\n\nTry again with fewer or smaller files. If the problem persists, the server timeout may need to be increased.`
      );
    }
  });
}

function stopLoadingProgress() {
  clearInterval(timerInterval);
  clearInterval(statusInterval);
}

// Parses n8n error payload format dynamically
function parseErrorFromPayload(data) {
  if (!data) return null;

  // Checks for error field inside n8n response [{ json: { error: '...' } }] or { error: '...' }
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && item.json && item.json.error) {
        return item.json.error;
      }
      if (item && item.error) {
        return item.error;
      }
    }
  } else {
    if (data.json && data.json.error) {
      return data.json.error;
    }
    if (data.error) {
      return data.error;
    }
  }

  return null;
}

function displayError(message, details = '') {
  elements.errorMessage.textContent = message;
  elements.errorDetails.textContent = details;
  if (details) {
    elements.errorDetails.classList.remove('hidden');
  } else {
    elements.errorDetails.classList.add('hidden');
  }
  switchView(elements.viewError);
}

// 5. Success Payload Parsing & Rendering
function handleExtractionSuccess(responseData) {
  // Normalize response data into an array of file results
  // Handles your n8n workflow format: [{ finishedSet: [ {invoice1}, {invoice2} ] }]
  let normalizedData = [];

  if (Array.isArray(responseData)) {
    responseData.forEach(item => {
      const targetObj = item.json ? item.json : item;
      if (targetObj && Array.isArray(targetObj.finishedSet)) {
        normalizedData.push(...targetObj.finishedSet);
      } else {
        normalizedData.push(targetObj);
      }
    });
  } else {
    const targetObj = responseData.json ? responseData.json : responseData;
    if (targetObj && Array.isArray(targetObj.finishedSet)) {
      normalizedData.push(...targetObj.finishedSet);
    } else {
      normalizedData = [targetObj];
    }
  }

  // Correlate with selected files if possible, or create defaults
  AppState.extractedData = normalizedData.map((data, index) => {
    const fileRef = AppState.selectedFiles[index];
    return {
      fileName: data.fileName || data.filename || (fileRef ? fileRef.name : `extracted_invoice_${index + 1}`),
      fileSize: fileRef ? formatBytes(fileRef.size) : (data.fileSize ? data.fileSize : '—'),
      rawData: data,
      parsedFields: extractKeyValues(data),
      lineItems: extractLineItems(data)
    };
  });

  AppState.activeResultTab = 0;
  
  // Render Results UI
  renderResultsTabs();
  renderActiveResult();
  switchView(elements.viewResults);
}

// Helper to filter out key-value metadata
function extractKeyValues(obj) {
  const result = {};
  
  // Look for target fields in object
  // If the object has a nested 'fields' property (common in AI/OCR responses), inspect that
  const source = obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields) ? obj.fields : obj;

  for (const [key, val] of Object.entries(source)) {
    // Skip line items (arrays of objects) and highly nested objects for metadata
    if (Array.isArray(val)) {
      continue;
    }
    if (val !== null && typeof val === 'object') {
      // Flatten simple single-layer nested structures, or skip
      if (Object.keys(val).length <= 3) {
        for (const [subKey, subVal] of Object.entries(val)) {
          if (typeof subVal !== 'object') {
            result[`${key}_${subKey}`] = subVal;
          }
        }
      }
      continue;
    }
    // Skip internal n8n or file indicators unless useful
    if (['fileName', 'filename', 'fileSize', 'fileType', 'binaryKey'].includes(key)) {
      continue;
    }

    result[key] = val;
  }
  
  return result;
}

// Helper to identify and extract line items array
function extractLineItems(obj) {
  // Look for common keys representing arrays of line items
  const lineItemKeys = ['lineItems', 'line_items', 'items', 'invoiceItems', 'invoice_items', 'transactions', 'table'];
  
  for (const key of lineItemKeys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
      return obj[key];
    }
  }

  // Fallback: search for any array of objects inside the result
  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val;
    }
  }

  return null;
}

// Render tabs in sidebar
function renderResultsTabs() {
  const container = elements.tabsContainer;
  container.innerHTML = '';

  // Show/Hide sidebar depending on multiple files
  if (AppState.extractedData.length <= 1) {
    elements.resultsSidebar.classList.add('hidden');
    // Adjust layout columns for full width results
    document.querySelector('.results-layout').style.display = 'block';
  } else {
    elements.resultsSidebar.classList.remove('hidden');
    document.querySelector('.results-layout').style.display = 'flex';
  }

  AppState.extractedData.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${index === AppState.activeResultTab ? 'active' : ''}`;
    btn.textContent = item.fileName;
    btn.title = item.fileName;
    btn.addEventListener('click', () => {
      // Switch Active Tab
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeResultTab = index;
      renderActiveResult();
    });
    container.appendChild(btn);
  });
}

// Render active results screen
function renderActiveResult() {
  const item = AppState.extractedData[AppState.activeResultTab];
  if (!item) return;

  // Header Info
  elements.resultFilename.textContent = item.fileName;
  elements.resultFilename.title = item.fileName;
  elements.resultFilesize.textContent = item.fileSize;

  // Raw JSON Inspector
  elements.rawJsonOutput.textContent = JSON.stringify(item.rawData, null, 2);

  // Key Value Grid
  const grid = elements.extractedFieldsGrid;
  grid.innerHTML = '';

  const fields = item.parsedFields;
  const fieldKeys = Object.keys(fields);

  if (fieldKeys.length === 0) {
    grid.innerHTML = '<div class="field-value">No metadata fields extracted.</div>';
  } else {
    fieldKeys.forEach(key => {
      const card = document.createElement('div');
      card.className = 'extracted-field-card';

      const labelText = formatKeyLabel(key);
      const val = fields[key];
      const isHighlighted = isFinancialOrImportantField(key);

      card.innerHTML = `
        <span class="field-label">${escapeHtml(labelText)}</span>
        <span class="field-value ${isHighlighted ? 'highlight' : ''}">${escapeHtml(String(val !== null && val !== undefined ? val : '—'))}</span>
      `;
      grid.appendChild(card);
    });
  }

  // Line Items Table
  const lineItems = item.lineItems;
  if (lineItems && lineItems.length > 0) {
    elements.lineItemsContainer.classList.remove('hidden');
    
    // Identify columns dynamically
    const tableBody = elements.lineItemsBody;
    tableBody.innerHTML = '';
    
    // Collect all keys from all line items to form standard headers
    const allRowKeys = new Set();
    lineItems.forEach(row => Object.keys(row).forEach(k => allRowKeys.add(k)));
    
    // Filter and order columns for representation: description, qty, price, total
    const columns = Array.from(allRowKeys);
    
    // Render Rows
    lineItems.forEach(row => {
      const tr = document.createElement('tr');
      
      // We will look for common properties to map to Description, Quantity, Unit Price, Total
      const descVal = row.description || row.desc || row.name || row.item || row.title || Object.values(row)[0] || '';
      const qtyVal = row.quantity || row.qty || row.count || row.units || '';
      const priceVal = row.unitPrice || row.price || row.unit_price || row.rate || '';
      const totalVal = row.amount || row.total || row.price_total || row.lineTotal || '';

      tr.innerHTML = `
        <td><strong>${escapeHtml(String(descVal))}</strong></td>
        <td class="text-right">${escapeHtml(String(qtyVal))}</td>
        <td class="text-right">${escapeHtml(String(priceVal))}</td>
        <td class="text-right"><strong>${escapeHtml(String(totalVal))}</strong></td>
      `;
      tableBody.appendChild(tr);
    });
  } else {
    elements.lineItemsContainer.classList.add('hidden');
  }
}

// Formatter Helpers
function formatKeyLabel(key) {
  // Replace underscores/dashes with spaces, handle camelCase splits, capitalize
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isFinancialOrImportantField(key) {
  const lowercaseKey = key.toLowerCase();
  const searchTerms = ['total', 'amount', 'tax', 'subtotal', 'due', 'balance', 'price', 'vat', 'gst'];
  return searchTerms.some(term => lowercaseKey.includes(term));
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 6. Data Export Actions
function copyActiveJsonToClipboard() {
  const item = AppState.extractedData[AppState.activeResultTab];
  if (!item) return;

  const jsonStr = JSON.stringify(item.rawData, null, 2);
  navigator.clipboard.writeText(jsonStr)
    .then(() => {
      const originalText = elements.btnCopyJson.textContent;
      elements.btnCopyJson.textContent = 'Copied!';
      setTimeout(() => {
        elements.btnCopyJson.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      alert('Failed to copy JSON: ' + err);
    });
}

function downloadActiveJson() {
  const item = AppState.extractedData[AppState.activeResultTab];
  if (!item) return;

  const jsonStr = JSON.stringify(item.rawData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  // Rename extension to .json
  const originalName = item.fileName;
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  a.download = `${baseName}_extracted.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadActiveCsv() {
  const item = AppState.extractedData[AppState.activeResultTab];
  if (!item) return;

  // We will compile both metadata fields and line items into a single flat CSV structure
  // Row 1: Metadata Header
  // Row 2: Metadata Values
  // Row 4: Line Items Header
  // Row 5+: Line Items Rows
  
  let csvContent = 'data:text/csv;charset=utf-8,';

  // Section 1: Metadata
  const fields = item.parsedFields;
  const metadataHeaders = Object.keys(fields);
  const metadataValues = Object.values(fields).map(v => `"${String(v).replace(/"/g, '""')}"`);
  
  csvContent += 'METADATA FIELDS\n';
  csvContent += metadataHeaders.join(',') + '\n';
  csvContent += metadataValues.join(',') + '\n\n';

  // Section 2: Line Items
  const lineItems = item.lineItems;
  if (lineItems && lineItems.length > 0) {
    csvContent += 'LINE ITEMS\n';
    
    // Collect all headers
    const lineHeaders = new Set();
    lineItems.forEach(row => Object.keys(row).forEach(k => lineHeaders.add(k)));
    const headersArray = Array.from(lineHeaders);
    csvContent += headersArray.join(',') + '\n';

    lineItems.forEach(row => {
      const rowValues = headersArray.map(h => {
        const val = row[h] !== undefined ? row[h] : '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvContent += rowValues.join(',') + '\n';
    });
  }

  const encodedUri = encodeURI(csvContent);
  const a = document.createElement('a');
  a.setAttribute('href', encodedUri);
  
  const originalName = item.fileName;
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  a.setAttribute('download', `${baseName}_extracted.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
