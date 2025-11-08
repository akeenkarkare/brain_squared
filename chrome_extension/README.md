# Chrome History Downloader Extension

A Chrome extension that allows you to save and download your browsing history in multiple formats (JSON, CSV, TXT, HTML).

## Features

- **Multiple Export Formats**: Export history as JSON, CSV, plain text, or HTML
- **Flexible Time Ranges**: Choose from preset ranges or set custom date/time ranges
  - Last Hour
  - Last 24 Hours
  - Last Week
  - Last 30 Days
  - All Time
  - Custom Range
- **Customizable Output**: Choose to include/exclude visit count and typed count
- **User-Friendly Interface**: Clean, modern popup interface
- **Progress Tracking**: See how many items are being exported

## Installation

### Method 1: Load Unpacked Extension (For Development/Testing)

1. **Generate Icons** (Required before loading the extension):
   - Open `create_icons.html` in your Chrome browser
   - Right-click each canvas and select "Save image as..."
   - Save them as `icon16.png`, `icon48.png`, and `icon128.png` in the `chrome_extension` folder

2. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Or click Menu (three dots) → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Navigate to the `g:\brain_squared\chrome_extension` folder
   - Click "Select Folder"

5. **Verify Installation**:
   - You should see the "History Downloader" extension in your extensions list
   - The extension icon should appear in your Chrome toolbar

### Method 2: Create and Install as Package (Optional)

1. Complete step 1 from Method 1 (generate icons)
2. Go to `chrome://extensions/`
3. Enable Developer Mode
4. Click "Pack extension"
5. Select the extension directory
6. Click "Pack Extension"
7. Install the generated `.crx` file

## Usage

1. **Click the Extension Icon** in your Chrome toolbar
2. **Configure Export Settings**:
   - Select a time range (or choose custom for specific dates)
   - Choose your preferred export format
   - Toggle options for visit count and typed count
3. **Click "Download History"**
4. **Choose Save Location** when prompted
5. **Access Your File** at the location you selected

## Export Formats

### JSON
```json
[
  {
    "url": "https://example.com",
    "title": "Example Site",
    "lastVisitTime": "2025-11-08T12:00:00.000Z",
    "visitCount": 5,
    "typedCount": 2
  }
]
```

### CSV
Spreadsheet-friendly format with headers and comma-separated values.

### TXT
Human-readable text format with numbered entries.

### HTML
Beautiful, formatted HTML page with sortable table and statistics.

## Permissions

This extension requires the following permissions:

- **history**: To read your browsing history
- **downloads**: To save the exported files to your computer

## Privacy

- All data processing happens locally in your browser
- No data is sent to external servers
- No tracking or analytics
- Your history data stays on your computer

## File Structure

```
chrome_extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Main functionality
├── popup.css             # Styling
├── icon.svg              # Source icon (SVG)
├── create_icons.html     # Icon generator tool
├── icon16.png            # 16x16 icon (generated)
├── icon48.png            # 48x48 icon (generated)
├── icon128.png           # 128x128 icon (generated)
└── README.md             # This file
```

## Troubleshooting

### Extension won't load
- Make sure you've generated the icon files (icon16.png, icon48.png, icon128.png)
- Check that all required files are present in the folder
- Try reloading the extension from `chrome://extensions/`

### No history showing up
- Check the time range selection
- Verify that you have browsing history for the selected period
- Check browser console for errors (right-click extension popup → Inspect)

### Download not starting
- Check Chrome's download settings
- Ensure the extension has the "downloads" permission
- Try a different export format

## Development

To modify this extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the History Downloader extension
4. Test your changes

## License

This project is open source and available for personal and educational use.

## Support

For issues or feature requests, please check the main project repository.
