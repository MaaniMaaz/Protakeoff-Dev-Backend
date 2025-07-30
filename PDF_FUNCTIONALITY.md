# PDF First Page Preview Functionality

## Overview

The ProTakeoff system now supports PDF files with automatic first page preview generation. When users upload PDF files, the system automatically generates a preview of the first page and displays it in the frontend, while keeping the full PDF document behind a paywall.

## Features

### Backend Changes

1. **Updated Takeoff Model** (`models/Takeoff.js`):
   - Added `firstPagePreviewUrl` field to store the preview image URL
   - Added `isPdf` boolean field to identify PDF files

2. **Enhanced File Upload** (`controllers/takeoffController.js`):
   - Automatic PDF detection using MIME type
   - First page preview generation using `pdf2pic` library
   - Preview image upload to Cloudinary
   - Cleanup of temporary preview files

3. **New Dependencies**:
   - `pdf2pic`: For converting PDF pages to images
   - `pdf-poppler`: Alternative PDF processing library

### Frontend Changes

1. **TakeOffDetails Component**:
   - Displays PDF first page previews instead of images
   - Shows "Preview Only" message with lock icon
   - Fallback to images if no PDFs are available
   - Purchase prompt for full document access

2. **FindTakeoffs Component**:
   - Shows PDF previews in takeoff cards
   - PDF indicator badge on cards with PDF files
   - Fallback to images if no PDF previews available

3. **Cart Integration**:
   - Uses PDF preview images in cart items
   - Maintains existing cart functionality

## How It Works

### PDF Upload Process

1. User uploads PDF file(s) when creating/updating a takeoff
2. Backend detects PDF files using MIME type (`application/pdf`)
3. System generates first page preview using `pdf2pic`
4. Preview image is uploaded to Cloudinary in `pdf-previews` folder
5. Preview URL is stored in `firstPagePreviewUrl` field
6. Original PDF remains accessible only after purchase

### Frontend Display

1. **Takeoff Details Page**:
   - Shows PDF first page previews in a grid layout
   - Displays file information (name, size)
   - Shows "Preview Only" message with lock icon
   - Hover effects indicate purchase requirement

2. **Takeoff Listing**:
   - PDF previews shown in takeoff cards
   - PDF badge indicator for files with PDFs
   - Fallback to images if no PDFs available

3. **Cart Integration**:
   - PDF preview images used in cart items
   - Maintains existing cart functionality

## Security & Access Control

- **Preview Only**: Users can only see the first page of PDFs
- **Full Access**: Complete PDF documents are only available after purchase
- **Paywall**: Clear messaging about purchase requirement
- **Visual Indicators**: Lock icons and "Preview Only" messages

## Technical Implementation

### PDF Processing Options

```javascript
const options = {
  density: 150,        // DPI for image quality
  saveFilename: "preview",
  savePath: path.dirname(outputPath),
  format: "png",       // Output format
  width: 800,          // Preview width
  height: 600          // Preview height
};
```

### File Structure

```
files: [
  {
    filename: "document.pdf",
    originalName: "Project Plans.pdf",
    size: 1024000,
    cloudinaryPublicId: "takeoffs/abc123",
    cloudinaryUrl: "https://res.cloudinary.com/...",
    resourceType: "raw",
    uploadDate: "2024-01-01T00:00:00.000Z",
    firstPagePreviewUrl: "https://res.cloudinary.com/...", // NEW
    isPdf: true // NEW
  }
]
```

## Installation

1. Install new dependencies:
   ```bash
   npm install pdf2pic pdf-poppler
   ```

2. Ensure ImageMagick is installed on the server (required by pdf2pic):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install imagemagick
   
   # macOS
   brew install imagemagick
   
   # Windows
   # Download from https://imagemagick.org/
   ```

## Testing

Run the test script to verify PDF preview functionality:

```bash
node test-pdf-preview.js
```

## Future Enhancements

1. **Multiple Page Previews**: Show previews of multiple pages
2. **Thumbnail Generation**: Create smaller thumbnails for faster loading
3. **PDF Metadata**: Extract and display PDF metadata (page count, etc.)
4. **Watermarking**: Add watermarks to preview images
5. **Caching**: Implement preview image caching for better performance

## Troubleshooting

### Common Issues

1. **PDF Preview Not Generated**:
   - Check if ImageMagick is installed
   - Verify PDF file is not corrupted
   - Check file permissions

2. **Preview Quality Issues**:
   - Adjust `density` option for better quality
   - Modify `width` and `height` for different sizes

3. **Memory Issues**:
   - Reduce `density` for large PDFs
   - Implement file size limits

### Error Handling

The system includes comprehensive error handling:
- PDF processing errors are caught and logged
- Fallback to placeholder images if preview generation fails
- Graceful degradation if PDF libraries are unavailable 