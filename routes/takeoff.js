const express = require('express');
const router = express.Router();
const takeoffController = require('../controllers/takeoffController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config with error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX, XLS, XLSX files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Create Takeoff
router.post('/', upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'pdfPreview', maxCount: 5 }
]), handleMulterError, takeoffController.createTakeoff);

// Get all Takeoffs
router.get('/', takeoffController.getAllTakeoffs);

// Get single Takeoff
router.get('/:id', takeoffController.getTakeoffById);

// Update Takeoff
router.put('/:id', upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'pdfPreview', maxCount: 5 }
]), takeoffController.updateTakeoff);

// Delete Takeoff
router.delete('/:id', takeoffController.deleteTakeoff);

module.exports = router; 