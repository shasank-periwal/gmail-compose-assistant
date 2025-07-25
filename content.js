// Gmail Compose Assistant Content Script
class GmailComposeAssistant {
  constructor() {
    this.isReady = false;
    this.init();
  }

  init() {
    // Wait for Gmail to load
    this.waitForGmail().then(() => {
      this.isReady = true;
      console.log('Gmail Compose Assistant: Ready');
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'composeEmail') {
        this.handleComposeEmail(request, sendResponse);
        return true; // Keep message channel open for async response
      }
    });
  }

  async waitForGmail() {
    return new Promise((resolve) => {
      const checkGmail = () => {
        if (document.querySelector('[role="main"]') || document.querySelector('.nH')) {
          resolve();
        } else {
          setTimeout(checkGmail, 500);
        }
      };
      checkGmail();
    });
  }

  async handleComposeEmail(request, sendResponse) {
    try {
      console.log('🚀 Starting compose email process...');
      
      if (!this.isReady) {
        await this.waitForGmail();
      }

      // Wait a bit for Gmail to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      const composeWindow = this.findActiveComposeWindow();
      if (!composeWindow) {
        sendResponse({ success: false, error: 'No compose window found. Please open a compose window first.' });
        return;
      }

      console.log('✅ Found compose window:', composeWindow);

      // Step 1: Extract recipient name FIRST (before any injection)
      console.log('📧 Extracting recipient name...');
      const recipientName = this.extractRecipientName(composeWindow);
      console.log('📧 Recipient name result:', recipientName);
      
      // Step 2: Inject subject
      if (request.subject) {
        console.log('📝 Injecting subject:', request.subject);
        this.injectSubject(composeWindow, request.subject);
      }

      // Step 3: Create body with greeting
      let finalBody = request.body || '';
      if (recipientName) {
        console.log('👋 Adding greeting for:', recipientName);
        finalBody = `Hi ${recipientName},\n\n${request.body || ''}`;
      } else {
        console.log('❌ No recipient name found, using generic greeting');
        finalBody = `Hi,\n\n${request.body || ''}`;
      }

      // Step 4: Inject the complete body
      if (finalBody.trim()) {
        console.log('📄 Injecting final body:', finalBody.substring(0, 100) + '...');
        this.injectBody(composeWindow, finalBody);
      }

      // Step 5: Attach file
      console.log('📎 Attempting to attach file...');
      await this.attachFile(composeWindow);

      console.log('✅ All compose operations completed successfully');
      
      // Provide detailed feedback
      const resultMessage = recipientName 
        ? `Email composed with greeting for ${recipientName}!`
        : 'Email composed (no recipient name found for personalization)';
        
      sendResponse({ success: true, message: resultMessage });
    } catch (error) {
      console.error('❌ Gmail Compose Assistant Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  findActiveComposeWindow() {
    console.log('Looking for active compose window...');
    
    // Method 1: Look for compose windows using various selectors
    const selectors = [
      // New Gmail compose dialog
      '[role="dialog"][aria-label*="compose" i]',
      '[role="dialog"] .nH',
      // Classic Gmail compose
      '.nH .if',
      '.nH .iN',
      // Alternative selectors
      '.nH .n3',
      '.M9',
      // Look for any container with compose elements
      '.T-I-J3.J-J5-Ji.T-I-Js-Gs.aaq.T-I-ax7.L3'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (this.isComposeWindow(element)) {
          console.log('Found compose window with selector:', selector);
          return element;
        }
      }
    }

    // Method 2: Look for compose elements and find their container
    const composeElements = [
      'input[name="to"]',
      'input[name="subject"]',
      '[role="textbox"]',
      '[aria-label*="To" i]',
      '[aria-label*="Subject" i]'
    ];

    for (const selector of composeElements) {
      const element = document.querySelector(selector);
      if (element) {
        // Find the closest compose container
        const containers = ['.nH', '[role="dialog"]', '.M9', '.T-I-J3'];
        for (const containerSelector of containers) {
          const container = element.closest(containerSelector);
          if (container) {
            console.log('Found compose window via element container:', selector);
            return container;
          }
        }
        
        // If no specific container, return a reasonable parent
        const parent = element.closest('div[class*="n"], div[role="dialog"]');
        if (parent) {
          console.log('Found compose window via parent element');
          return parent;
        }
      }
    }

    // Method 3: Use document as fallback (for global selectors)
    console.log('Using document as compose window fallback');
    return document;
  }

  isComposeWindow(element) {
    // Check if element contains compose-like elements
    const hasTo = element.querySelector('[name="to"], [aria-label*="To" i], .vR, input[type="text"], input[type="email"]');
    const hasSubject = element.querySelector('[name="subject"], [aria-label*="Subject" i], .aoT, input[placeholder*="Subject" i]');
    const hasBody = element.querySelector('[role="textbox"], .Am, [aria-label*="Message Body" i], [contenteditable="true"]');
    
    const composeScore = (hasTo ? 1 : 0) + (hasSubject ? 1 : 0) + (hasBody ? 1 : 0);
    
    // If we have at least 2 out of 3 compose elements, consider it a compose window
    return composeScore >= 2;
  }

  extractRecipientName(composeWindow) {
    try {
      console.log('Starting name extraction...');
      
      // More comprehensive selectors for Gmail's To field
      const selectors = [
        // Standard input field
        'input[name="to"]',
        'input[aria-label*="To" i]',
        // Gmail's recipient display elements (chips/tags)
        '.vR .vN',
        '.vR .go .vN', 
        '.oL.aDm .vN',
        'span.vN',
        // Contenteditable fields
        '[contenteditable="true"][aria-label*="To" i]',
        // Search in broader compose area
        '.aoD .vR input',
        '.GS .vR input',
        '.vR input',
        // Alternative selectors
        '[role="textbox"][aria-label*="To" i]',
        '.vR [email]',
        '.vR span[email]',
        'span[email]',
        // Direct email attributes
        '[data-hovercard-id*="@"]',
        '[title*="@"]'
      ];

      let email = '';
      
      // Try each selector on the entire document (not just compose window)
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Trying selector: ${selector}, found ${elements.length} elements`);
        
        for (const element of elements) {
          const value = element.value || 
                       element.textContent || 
                       element.innerText || 
                       element.getAttribute('email') ||
                       element.getAttribute('data-hovercard-id') ||
                       element.getAttribute('title') || 
                       '';
          
          console.log('  Element value:', value.substring(0, 100));
          
          if (value && value.includes('@')) {
            email = value.trim();
            console.log('Found email with selector:', selector, 'Email:', email);
            break;
          }
        }
        if (email.includes('@')) break;
      }

      // If still no email, search for any text containing @ symbol
      if (!email.includes('@')) {
        console.log('Trying broader email search...');
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent || element.innerText || '';
          const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
          if (emailMatch && text.length < 200) { // Avoid long text blocks
            email = emailMatch[0];
            console.log('Found email in text content:', email);
            break;
          }
        }
      }

      // Try to find in input values
      if (!email.includes('@')) {
        console.log('Checking all input values...');
        const allInputs = document.querySelectorAll('input');
        for (const input of allInputs) {
          const value = input.value || '';
          if (value.includes('@')) {
            email = value;
            console.log('Found email in input value:', email);
            break;
          }
        }
      }

      if (!email || !email.includes('@')) {
        console.log('❌ No email found in To field after all attempts');
        return null;
      }

      console.log('✅ Raw email found:', email);

      // Clean up email (remove extra text, spaces, etc.)
      const emailMatch = email.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      if (emailMatch) {
        email = emailMatch[0];
        console.log('Cleaned email:', email);
      }

      // Extract name from email
      const emailPart = email.split('@')[0];
      const nameParts = emailPart.split(/[._-]/);
      const firstName = nameParts[0];
      
      // Capitalize first letter and make rest lowercase
      const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      console.log('✅ Final extracted name:', formattedName);
      
      return formattedName;
    } catch (error) {
      console.error('❌ Error in name extraction:', error);
      return null;
    }
  }

  injectSubject(composeWindow, subject) {
    console.log('Attempting to inject subject:', subject);
    
    const selectors = [
      // Standard input selectors
      'input[name="subject"]',
      'input[aria-label*="Subject" i]',
      'input[placeholder*="Subject" i]',
      // Gmail specific selectors
      '.aoT input[name="subject"]',
      '.aoT input',
      '.aoT [contenteditable="true"]',
      // Broader selectors
      '[data-tooltip*="Subject" i]',
      '.Ha .aoT input',
      // Alternative approaches
      '[aria-label="Subject"]',
      'input[type="text"][aria-label*="Subject" i]'
    ];

    let subjectField = null;

    // Try to find subject field
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Check if this element is visible and likely the subject field
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          subjectField = element;
          console.log('Found subject field with selector:', selector);
          break;
        }
      }
      if (subjectField) break;
    }

    // If still not found, try broader search
    if (!subjectField) {
      const allInputs = document.querySelectorAll('input[type="text"], [contenteditable="true"]');
      for (const input of allInputs) {
        const label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
        if (label.toLowerCase().includes('subject')) {
          subjectField = input;
          console.log('Found subject field in broader search');
          break;
        }
      }
    }

    if (!subjectField) {
      console.error('Could not find subject field');
      throw new Error('Could not find subject field. Make sure the compose window is fully loaded.');
    }

    // Inject the subject
    if (subjectField.tagName === 'INPUT') {
      // Regular input field
      subjectField.focus();
      subjectField.value = subject;
      
      // Trigger various events to ensure Gmail recognizes the change
      subjectField.dispatchEvent(new Event('focus', { bubbles: true }));
      subjectField.dispatchEvent(new Event('input', { bubbles: true }));
      subjectField.dispatchEvent(new Event('change', { bubbles: true }));
      subjectField.dispatchEvent(new Event('blur', { bubbles: true }));
    } else if (subjectField.contentEditable === 'true') {
      // Contenteditable field
      subjectField.focus();
      subjectField.textContent = subject;
      
      // Trigger events for contenteditable
      subjectField.dispatchEvent(new Event('focus', { bubbles: true }));
      subjectField.dispatchEvent(new Event('input', { bubbles: true }));
      subjectField.dispatchEvent(new Event('keyup', { bubbles: true }));
      subjectField.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    console.log('Subject injected successfully');
    return true;
  }

  injectBody(composeWindow, bodyText) {
    console.log('Attempting to inject body:', bodyText.substring(0, 50) + '...');
    
    const selectors = [
      // Primary Gmail body selectors
      '[role="textbox"]',
      'div[contenteditable="true"][role="textbox"]',
      '.Am.Al.editable',
      '.Am[contenteditable="true"]',
      // Alternative selectors
      '[aria-label*="Message Body" i]',
      '[aria-label*="Message body" i]',
      '.editable[contenteditable="true"]',
      // Broader selectors
      'div[contenteditable="true"]',
      '[contenteditable="true"]'
    ];

    let bodyField = null;

    // Try to find the body field
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Check if this looks like a message body (has reasonable size)
        const rect = element.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 50 && element.isContentEditable) {
          bodyField = element;
          console.log('Found body field with selector:', selector);
          break;
        }
      }
      if (bodyField) break;
    }

    // If not found, try a different approach - look for the largest contenteditable
    if (!bodyField) {
      const contentEditables = document.querySelectorAll('[contenteditable="true"]');
      let largestArea = 0;
      
      for (const element of contentEditables) {
        const rect = element.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > largestArea && area > 10000) { // Minimum reasonable size
          largestArea = area;
          bodyField = element;
        }
      }
      
      if (bodyField) {
        console.log('Found body field by size heuristic');
      }
    }

    if (!bodyField) {
      console.error('Could not find message body field');
      throw new Error('Could not find message body field. Make sure the compose window is focused.');
    }

    // Clear existing content and inject new content
    bodyField.focus();
    
    // Method 1: Direct innerHTML replacement
    bodyField.innerHTML = bodyText.replace(/\n/g, '<br>');
    
    // Method 2: Also try setting textContent as fallback
    if (!bodyField.innerHTML) {
      bodyField.textContent = bodyText;
    }
    
    // Trigger comprehensive events to ensure Gmail recognizes the change
    const events = ['focus', 'input', 'keydown', 'keyup', 'change', 'blur'];
    events.forEach(eventType => {
      bodyField.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Also trigger a keyboard event that Gmail often listens for
    bodyField.dispatchEvent(new KeyboardEvent('keyup', {
      bubbles: true,
      key: ' ',
      code: 'Space'
    }));

    // Keep focus on the body field
    setTimeout(() => {
      bodyField.focus();
    }, 100);

    console.log('Body injected successfully');
    return true;
  }

  async attachFile(composeWindow) {
    try {
      // Find attach button
      const attachSelectors = [
        '[aria-label*="Attach" i]',
        '.a1.aaA.aMZ',
        'input[type="file"]',
        '[title*="Attach" i]',
        '.T-I.J-J5-Ji.aFf.T-I-atl'
      ];

      let attachButton = null;
      for (const selector of attachSelectors) {
        attachButton = composeWindow.querySelector(selector);
        if (attachButton) break;
      }

      if (!attachButton) {
        // Look in parent containers
        attachButton = document.querySelector('[aria-label*="Attach" i], .a1.aaA.aMZ');
      }

      if (!attachButton) {
        throw new Error('Could not find attach button');
      }

      // Create file input if we found a button but it's not a file input
      if (attachButton.type !== 'file') {
        const fileInput = composeWindow.querySelector('input[type="file"]') || 
                         document.querySelector('input[type="file"]');
        if (fileInput) {
          attachButton = fileInput;
        }
      }

      // Create and attach file
      const file = await this.createSampleFile();
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      if (attachButton.type === 'file') {
        attachButton.files = dataTransfer.files;
        attachButton.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // Simulate drag and drop
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          dataTransfer: dataTransfer
        });
        
        const targetArea = composeWindow.querySelector('[role="textbox"], .Am') || composeWindow;
        targetArea.dispatchEvent(dropEvent);
      }

      return true;
    } catch (error) {
      console.warn('Could not attach file:', error);
      // Don't throw error for attachment failure
      return false;
    }
  }

  async createSampleFile() {
    // Create a sample PDF file
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Sample Resume) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    return new File([pdfContent], 'sample-resume.pdf', { type: 'application/pdf' });
  }
}

// Initialize the assistant
new GmailComposeAssistant();