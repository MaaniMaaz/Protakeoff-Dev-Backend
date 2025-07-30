const path = require('path');
const fs = require('fs');
const { fromPath } = require('pdf2pic');

// Test PDF preview generation
async function testPdfPreview() {
  try {
    const pdfPath = path.join(__dirname, 'uploads', '1750757437538-Protakeoff.ai Technical Documentation - Phase 1.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found:', pdfPath);
      return;
    }

    console.log('Testing PDF preview generation...');
    console.log('PDF path:', pdfPath);

    const options = {
      density: 150,
      saveFilename: "preview",
      savePath: path.join(__dirname, 'uploads'),
      format: "png",
      width: 800,
      height: 600
    };
    
    const convert = fromPath(pdfPath, options);
    const pageData = await convert(1); // Convert first page only
    
    if (pageData && pageData.length > 0) {
      const previewPath = path.join(__dirname, 'uploads', pageData[0].name);
      console.log('✅ PDF preview generated successfully!');
      console.log('Preview path:', previewPath);
      console.log('Preview file size:', fs.statSync(previewPath).size, 'bytes');
      
      // Clean up test file
      fs.unlinkSync(previewPath);
      console.log('✅ Test file cleaned up');
    } else {
      console.error('❌ Failed to generate PDF preview');
    }
  } catch (error) {
    console.error('❌ Error testing PDF preview:', error);
  }
}

// Run the test
testPdfPreview(); 