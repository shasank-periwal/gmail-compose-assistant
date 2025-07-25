# Gmail Compose Assistant Chrome Extension

A powerful Chrome extension that automates Gmail compose functionality with personalized greetings, subject injection, body replacement, and automatic file attachments.

## Features

- **Personalized Greetings**: Automatically extracts the recipient's first name from the email address and adds a personalized greeting
- **Subject Injection**: Easy-to-use interface for injecting custom subjects into Gmail drafts
- **Body Replacement**: Replace or insert custom email body content with preserved formatting
- **Automatic Attachments**: Attach predefined files (sample resume PDF) automatically
- **Persistent Storage**: Saves your subject and body templates for reuse
- **Multiple Draft Support**: Handles multiple open Gmail compose windows gracefully

## Installation

### Method 1: Developer Mode (Recommended)

1. **Download the Extension Files**
   - Create a new folder called `gmail-compose-assistant`
   - Save all the provided files in this folder:
     - `manifest.json`
     - `popup.html`
     - `popup.js`
     - `content.js`

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" ON (top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `gmail-compose-assistant` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "Gmail Compose Assistant" and pin it for easy access

## Usage

### Basic Workflow

1. **Open Gmail** and navigate to `mail.google.com`
2. **Start a New Compose** window or reply to an email
3. **Add a recipient** in the "To" field (required for name extraction)
4. **Click the extension icon** in the Chrome toolbar
5. **Fill in your content**:
   - Enter your desired subject line
   - Enter your email body content
6. **Click "Compose Email"** to automatically:
   - Extract the recipient's name and add greeting
   - Inject the subject
   - Insert the body content
   - Attach the sample resume file

### Features in Detail

#### Name Extraction
- The extension parses email addresses like `jane.doe@company.com`
- Extracts "Jane" as the first name
- Automatically capitalizes the first letter
- Adds greeting: "Hi Jane,"

#### Subject & Body Persistence
- Your subject and body templates are automatically saved
- They persist between browser sessions
- Templates are restored when you reopen the extension

#### File Attachment
- Automatically creates and attaches a sample PDF resume
- The file is generated programmatically (no external files needed)
- Works with Gmail's drag-and-drop attachment system

## Technical Implementation

### Architecture
- **Manifest V3** compliant for future compatibility
- **Content Scripts** for DOM manipulation
- **Chrome Storage API** for data persistence
- **Mutation Observers** ready for dynamic UI changes

### Permissions
- `storage`: For saving subject/body templates
- `activeTab`: For interacting with the current Gmail tab
- `host_permissions`: Limited to `https://mail.google.com/*`

### Browser Compatibility
- Chrome 88+ (Manifest V3 requirement)
- Compatible with Gmail's latest interface
- Handles both classic and new Gmail layouts

## Troubleshooting

### Common Issues

**"No compose window found" Error**
- Make sure you have a Gmail compose window open
- Ensure you're on `mail.google.com` (not other Gmail domains)
- Try refreshing the Gmail page and reopening the compose window

**Name Extraction Not Working**
- Ensure there's a valid email address in the "To" field
- The email must contain an "@" symbol
- Name extraction works best with standard email formats

**Subject/Body Not Injecting**
- Gmail's interface may have changed; try refreshing the page
- Ensure the compose window is focused and active
- Check browser console for any error messages

**Attachment Issues**
- The sample PDF is generated automatically
- If attachment fails, check Gmail's file size limits
- Ensure you're not in Gmail's "Basic HTML" mode

### Development Mode Debugging

1. **Open Chrome DevTools** (F12) on the Gmail page
2. **Check Console** for error messages from the content script
3. **Inspect Extension**:
   - Go to `chrome://extensions/`
   - Click "Details" on the extension
   - Click "Inspect views: popup" to debug the popup

## Customization

### Modifying the Attachment
To change the attached file, modify the `createSampleFile()` function in `content.js`:

```javascript
async createSampleFile() {
  // Create your custom file content here
  const fileContent = "Your custom content";
  return new File([fileContent], 'your-filename.txt', { type: 'text/plain' });
}
```

### Customizing the Greeting Format
Modify the greeting format in the `handleComposeEmail()` function:

```javascript
const greeting = recipientName ? `Dear ${recipientName},\n\n` : 'Dear Hiring Manager,\n\n';
```

### Adding More Fields
You can extend the popup UI to include additional fields like CC, BCC, or signature by modifying `popup.html` and adding corresponding injection logic in `content.js`.

## Security & Privacy

- **No Data Collection**: The extension doesn't collect or transmit any personal data
- **Local Storage Only**: All data is stored locally using Chrome's storage API
- **Minimal Permissions**: Only requests necessary permissions for Gmail interaction
- **No External Requests**: All functionality works offline

## Browser Support

- **Chrome 88+** (Primary support)
- **Edge 88+** (Chromium-based, should work)
- **Other Chromium browsers** (May work with minor modifications)

## Version History

### v1.0
- Initial release
- Core functionality: name extraction, subject/body injection, file attachment
- Persistent storage for templates
- Gmail interface compatibility

## Contributing

To contribute to this project:

1. Fork the repository
2. Make your changes
3. Test thoroughly with different Gmail interfaces
4. Submit a pull request with detailed description

## License

This project is released under the MIT License. Feel free to modify and distribute as needed.

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Inspect browser console for error messages
3. Test with a fresh Gmail compose window
4. Verify all extension files are properly loaded