/* ============================================================
   FLOWGENICS — Bank Statement Anomaly Detector
   View management, form handling, n8n webhook integration
   ============================================================ */

(function () {
  'use strict';

  // -------------------------------------------------------
  // CONFIG
  // -------------------------------------------------------
  const WEBHOOK_URL = 'https://n8n.flowgenicsent.com/webhook/bank-statement-anomaly-detector';

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.xlsx'];

  // -------------------------------------------------------
  // DOM References
  // -------------------------------------------------------
  const views = document.querySelectorAll('[data-view]');
  const form = document.getElementById('analysis-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnLabel = submitBtn.querySelector('.btn__label');

  // Form fields
  const fieldName = document.getElementById('field-name');
  const fieldEmail = document.getElementById('field-email');
  const fieldCompany = document.getElementById('field-company');
  const fieldFile = document.getElementById('field-file');

  // Error spans
  const errorName = document.getElementById('error-name');
  const errorEmail = document.getElementById('error-email');
  const errorCompany = document.getElementById('error-company');
  const errorFile = document.getElementById('error-file');

  // Dropzone
  const dropzone = document.getElementById('dropzone');
  const dropzoneDefault = document.getElementById('dropzone-default');
  const dropzonePreview = document.getElementById('dropzone-preview');
  const dropzoneFilename = document.getElementById('dropzone-filename');
  const dropzoneFilesize = document.getElementById('dropzone-filesize');
  const dropzoneRemove = document.getElementById('dropzone-remove');

  // Results
  const resultsTitle = document.getElementById('results-title');
  const resultsSubtitle = document.getElementById('results-subtitle');
  const resultsRiskBadge = document.getElementById('results-risk-badge');
  const resultsTotal = document.getElementById('results-total');
  const resultsFlagged = document.getElementById('results-flagged');
  const resultsFlaggedStat = document.getElementById('results-flagged-stat');
  const resultsInsights = document.getElementById('results-insights');
  const resultsInsightsList = document.getElementById('results-insights-list');
  const resultsFlags = document.getElementById('results-flags');
  const resultsClean = document.getElementById('results-clean');
  const resultsEmailNotice = document.getElementById('results-email-notice');
  const resultsEmailText = document.getElementById('results-email-text');

  // Currently selected files (stored separately since we need drag-and-drop)
  let selectedFiles = [];

  // -------------------------------------------------------
  // VIEW MANAGEMENT
  // -------------------------------------------------------

  function showView(viewId) {
    views.forEach(function (v) {
      v.classList.remove('view--active');
    });
    var target = document.querySelector('[data-view="' + viewId + '"]');
    if (target) {
      target.classList.add('view--active');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // Navigation buttons (all "return to main" or "analyse another" buttons)
  document.querySelectorAll('[data-navigate]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dest = btn.getAttribute('data-navigate');
      showView(dest);
      if (dest === 'main') {
        resetForm();
      }
    });
  });

  // -------------------------------------------------------
  // FORM RESET
  // -------------------------------------------------------

  function resetForm() {
    form.reset();
    selectedFiles = [];
    clearAllErrors();
    showDropzoneDefault();
    submitBtn.classList.remove('btn--loading');
    submitBtn.disabled = false;
    btnLabel.textContent = 'Analyse Statement';
  }

  // -------------------------------------------------------
  // FILE UPLOAD — Drag & Drop + Click
  // -------------------------------------------------------

  // Prevent default drag behaviors on the whole page
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (evt) {
    document.body.addEventListener(evt, function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Dropzone drag events
  ['dragenter', 'dragover'].forEach(function (evt) {
    dropzone.addEventListener(evt, function () {
      dropzone.classList.add('dropzone--dragover');
    });
  });

  ['dragleave', 'drop'].forEach(function (evt) {
    dropzone.addEventListener(evt, function () {
      dropzone.classList.remove('dropzone--dragover');
    });
  });

  dropzone.addEventListener('drop', function (e) {
    var files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  });

  fieldFile.addEventListener('change', function () {
    if (fieldFile.files.length > 0) {
      handleFilesSelect(fieldFile.files);
    }
  });

  dropzoneRemove.addEventListener('click', function (e) {
    e.stopPropagation();
    selectedFiles = [];
    fieldFile.value = '';
    showDropzoneDefault();
    clearError(fieldFile, errorFile);
  });

  function handleFilesSelect(files) {
    // Support older browsers by borrowing slice from Array.prototype
    selectedFiles = Array.prototype.slice.call(files, 0, 5);
    
    if (selectedFiles.length === 1) {
      dropzoneFilename.textContent = selectedFiles[0].name;
      dropzoneFilesize.textContent = formatFileSize(selectedFiles[0].size);
    } else {
      dropzoneFilename.textContent = selectedFiles.length + ' files selected';
      var totalSize = selectedFiles.reduce(function(acc, file) { return acc + file.size; }, 0);
      dropzoneFilesize.textContent = formatFileSize(totalSize);
    }
    
    showDropzonePreview();
    clearError(fieldFile, errorFile);
  }

  function showDropzoneDefault() {
    dropzoneDefault.style.display = '';
    dropzonePreview.classList.remove('dropzone__preview--visible');
    fieldFile.style.display = '';
  }

  function showDropzonePreview() {
    dropzoneDefault.style.display = 'none';
    dropzonePreview.classList.add('dropzone__preview--visible');
    fieldFile.style.display = 'none';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // -------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------

  function validateForm() {
    var valid = true;

    // Name
    if (!fieldName.value.trim()) {
      showError(fieldName, errorName);
      valid = false;
    } else {
      clearError(fieldName, errorName);
    }

    // Email
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fieldEmail.value.trim() || !emailPattern.test(fieldEmail.value.trim())) {
      showError(fieldEmail, errorEmail);
      valid = false;
    } else {
      clearError(fieldEmail, errorEmail);
    }

    // Company
    if (!fieldCompany.value.trim()) {
      showError(fieldCompany, errorCompany);
      valid = false;
    } else {
      clearError(fieldCompany, errorCompany);
    }

    // File
    if (selectedFiles.length === 0) {
      showError(fieldFile, errorFile);
      dropzone.classList.add('dropzone--error');
      valid = false;
    } else {
      var allAllowed = true;
      var allUnderSize = true;
      for (var i = 0; i < selectedFiles.length; i++) {
        if (!isFileAllowed(selectedFiles[i])) allAllowed = false;
        if (selectedFiles[i].size > MAX_FILE_SIZE) allUnderSize = false;
      }
      
      if (!allAllowed) {
        errorFile.textContent = 'Unsupported format. Please upload PDF, CSV, or XLSX files only.';
        showError(fieldFile, errorFile);
        dropzone.classList.add('dropzone--error');
        valid = false;
      } else if (!allUnderSize) {
        errorFile.textContent = 'One or more files exceed 5 MB. Please upload smaller files.';
        showError(fieldFile, errorFile);
        dropzone.classList.add('dropzone--error');
        valid = false;
      } else {
        clearError(fieldFile, errorFile);
        dropzone.classList.remove('dropzone--error');
      }
    }

    return valid;
  }

  function isFileAllowed(file) {
    // Check MIME type
    if (ALLOWED_TYPES.indexOf(file.type) !== -1) return true;
    // Fallback: check extension
    var ext = '.' + file.name.split('.').pop().toLowerCase();
    return ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
  }

  function showError(input, errorEl) {
    if (input.classList) input.classList.add('form-input--error');
    errorEl.classList.add('form-error--visible');
  }

  function clearError(input, errorEl) {
    if (input.classList) input.classList.remove('form-input--error');
    errorEl.classList.remove('form-error--visible');
  }

  function clearAllErrors() {
    [fieldName, fieldEmail, fieldCompany].forEach(function (f) {
      f.classList.remove('form-input--error');
    });
    [errorName, errorEmail, errorCompany, errorFile].forEach(function (e) {
      e.classList.remove('form-error--visible');
    });
    dropzone.classList.remove('dropzone--error');
    // Reset file error message to default
    errorFile.textContent = 'Please upload a PDF, CSV, or XLSX file (max 5 MB)';
  }

  // Clear individual field errors on input
  fieldName.addEventListener('input', function () { clearError(fieldName, errorName); });
  fieldEmail.addEventListener('input', function () { clearError(fieldEmail, errorEmail); });
  fieldCompany.addEventListener('input', function () { clearError(fieldCompany, errorCompany); });

  // -------------------------------------------------------
  // FORM SUBMISSION
  // -------------------------------------------------------

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    // Set loading state
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;
    btnLabel.textContent = 'Analysing…';

    // Show loading view
    showView('loading');

    // Build FormData
    var formData = new FormData();
    formData.append('name', fieldName.value.trim());
    formData.append('email', fieldEmail.value.trim());
    formData.append('company', fieldCompany.value.trim());
    selectedFiles.forEach(function(file) {
      formData.append('file', file);
    });

    // POST to n8n webhook
    fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        handleWebhookResponse(data);
      })
      .catch(function (err) {
        console.error('Webhook request failed:', err);
        showView('error');
      })
      .finally(function () {
        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
        btnLabel.textContent = 'Analyse Statement';
      });
  });

  // -------------------------------------------------------
  // RESPONSE ROUTING
  // -------------------------------------------------------

  function handleWebhookResponse(data) {
    if (data.success === true) {
      renderResults(data);
      showView('results');
    } else {
      // Route by error_type
      var errorType = data.error_type || 'error_occured';
      console.warn('Webhook error:', errorType, data.error);

      switch (errorType) {
        case 'unsupported_format':
          showView('unsupported');
          break;
        case 'no_transactions':
          showView('no_transactions');
          break;
        case 'error_occured':
        default:
          showView('error');
          break;
      }
    }
  }

  // -------------------------------------------------------
  // RESULTS RENDERING
  // -------------------------------------------------------

  /**
   * Expected success payload structure:
   * {
   *   success: true,
   *   data: {
   *     total_transactions: number,
   *     flagged_transactions: number,
   *     risk_level: "High risk" | "Medium risk" | "Low risk",
   *     key_insights: string[],             // 2-4 items, may be empty/absent
   *     flags: [{                           // may be empty/absent
   *       risk_level: "High risk" | "Medium risk" | "Low risk",
   *       flag_type: string,
   *       date: string,
   *       description: string
   *     }],
   *     email: string
   *   }
   * }
   *
   * Adjust field names in this function if your n8n payload differs.
   */

  function renderResults(response) {
    var d = response.data || response;

    var totalTx = d.total_transactions || 0;
    var flaggedTx = d.flagged_transactions || 0;
    var riskLevel = d.risk_level || '';
    var insights = d.key_insights || [];
    var flags = d.flags || [];
    var email = d.email || fieldEmail.value.trim();
    var isFlagged = flaggedTx > 0;

    // Title and subtitle
    if (isFlagged) {
      resultsTitle.textContent = 'Your risk report is ready';
      resultsSubtitle.textContent = 'We checked 10 risk categories against the uploaded statement.';
    } else {
      resultsTitle.textContent = 'Your bank statement is clear';
      resultsSubtitle.textContent = 'We checked 10 risk categories against the uploaded statement and found nothing to flag.';
    }

    // Risk badge
    if (isFlagged && riskLevel) {
      resultsRiskBadge.textContent = riskLevel;
      resultsRiskBadge.className = 'risk-badge ' + getRiskBadgeClass(riskLevel);
      resultsRiskBadge.classList.remove('hidden');
    } else {
      resultsRiskBadge.classList.add('hidden');
    }

    // Stats
    resultsTotal.textContent = totalTx;
    resultsFlagged.textContent = flaggedTx;
    if (isFlagged) {
      resultsFlaggedStat.classList.remove('hidden');
    } else {
      resultsFlaggedStat.classList.add('hidden');
    }

    // Key Insights
    if (insights.length > 0) {
      resultsInsightsList.innerHTML = '';
      insights.forEach(function (insight) {
        var div = document.createElement('div');
        div.className = 'results-insights__item';
        div.textContent = insight;
        resultsInsightsList.appendChild(div);
      });
      resultsInsights.classList.remove('hidden');
    } else {
      resultsInsights.classList.add('hidden');
    }

    // Flags or clean state
    if (isFlagged && flags.length > 0) {
      resultsFlags.innerHTML = '';
      flags.forEach(function (flag) {
        var row = document.createElement('div');
        row.className = 'results-flag';

        var top = document.createElement('div');
        top.className = 'results-flag__top';

        var badge = document.createElement('span');
        badge.className = 'risk-badge ' + getRiskBadgeClass(flag.risk_level);
        badge.textContent = flag.risk_level;

        var type = document.createElement('span');
        type.className = 'results-flag__type';
        type.textContent = flag.flag_type;

        var date = document.createElement('span');
        date.className = 'results-flag__date';
        date.textContent = flag.date;

        top.appendChild(badge);
        top.appendChild(type);
        top.appendChild(date);

        var desc = document.createElement('p');
        desc.className = 'results-flag__desc';
        desc.textContent = flag.description;

        row.appendChild(top);
        row.appendChild(desc);
        resultsFlags.appendChild(row);
      });
      resultsFlags.classList.remove('hidden');
      resultsClean.classList.add('hidden');
    } else {
      resultsFlags.classList.add('hidden');
      resultsClean.classList.remove('hidden');
    }

    // Email notice
    if (isFlagged) {
      resultsEmailText.innerHTML =
        'The full report — with transaction amounts, references, and a detailed explanation for every flag — has been sent to <span class="results-email-notice__email">' +
        escapeHtml(email) +
        '</span>. Check spam if it doesn\'t arrive in a few minutes.';
    } else {
      resultsEmailText.innerHTML =
        'A copy of this report has been sent to <span class="results-email-notice__email">' +
        escapeHtml(email) +
        '</span> for your records.';
    }
  }

  function getRiskBadgeClass(level) {
    if (!level) return 'risk-badge--low';
    var l = level.toLowerCase();
    if (l.indexOf('high') !== -1) return 'risk-badge--high';
    if (l.indexOf('medium') !== -1) return 'risk-badge--medium';
    return 'risk-badge--low';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})();
