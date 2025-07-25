document.addEventListener('DOMContentLoaded', function() {
  const subjectInput = document.getElementById('subject');
  const bodyTextarea = document.getElementById('body');
  const composeBtn = document.getElementById('compose-btn');
  const status = document.getElementById('status');

  // Load saved data from storage
  chrome.storage.sync.get(['subject', 'body'], function(result) {
    if (result.subject) {
      subjectInput.value = result.subject;
    }
    if (result.body) {
      bodyTextarea.value = result.body;
    }
  });

  // Save data on input
  subjectInput.addEventListener('input', function() {
    chrome.storage.sync.set({ subject: subjectInput.value });
  });

  bodyTextarea.addEventListener('input', function() {
    chrome.storage.sync.set({ body: bodyTextarea.value });
  });

  // Handle compose button click
  composeBtn.addEventListener('click', function() {
    const subject = subjectInput.value.trim();
    const body = bodyTextarea.value.trim();

    if (!subject && !body) {
      showStatus('Please enter a subject or body text', 'error');
      return;
    }

    composeBtn.disabled = true;
    composeBtn.textContent = 'Processing...';

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'composeEmail',
        subject: subject,
        body: body
      }, function(response) {
        composeBtn.disabled = false;
        composeBtn.textContent = 'Compose Email';

        if (chrome.runtime.lastError) {
          showStatus('Error: Make sure you are on Gmail compose page', 'error');
          return;
        }

        if (response && response.success) {
          showStatus('Email composed successfully!', 'success');
          // Close popup after success
          setTimeout(() => window.close(), 1500);
        } else {
          showStatus(response?.error || 'Failed to compose email', 'error');
        }
      });
    });
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 5000);
  }
});