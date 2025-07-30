// Test script to verify serverless environment detection
const fs = require('fs');
const path = require('path');

// Check environment variables
console.log('Environment Variables:');
console.log('VERCEL:', process.env.VERCEL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('VERCEL_URL:', process.env.VERCEL_URL);

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || 
                    process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL_ENV || 
                    process.env.VERCEL_URL;
console.log('Is Serverless:', isServerless);

// Test file system access
console.log('\nFile System Test:');
const testDir = path.join(__dirname, 'test-uploads');
console.log('Test directory:', testDir);

try {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log('✅ Successfully created test directory');
  } else {
    console.log('✅ Test directory already exists');
  }
  
  // Try to write a test file
  const testFile = path.join(testDir, 'test.txt');
  fs.writeFileSync(testFile, 'test content');
  console.log('✅ Successfully wrote test file');
  
  // Clean up
  fs.unlinkSync(testFile);
  fs.rmdirSync(testDir);
  console.log('✅ Successfully cleaned up test files');
  
} catch (error) {
  console.log('❌ File system error:', error.message);
  console.log('This indicates a read-only file system (serverless environment)');
}

console.log('\nEnvironment Detection Summary:');
if (isServerless) {
  console.log('🔧 Serverless environment detected - will use memory storage');
} else {
  console.log('🏠 Local environment detected - will use disk storage');
} 