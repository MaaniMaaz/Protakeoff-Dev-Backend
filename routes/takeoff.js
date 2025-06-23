const express = require('express');
const router = express.Router();
const takeoffController = require('../controllers/takeoffController');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create Takeoff
router.post('/', upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'images', maxCount: 10 }
]), takeoffController.createTakeoff);

// Get all Takeoffs
router.get('/', takeoffController.getAllTakeoffs);

// Get single Takeoff
router.get('/:id', takeoffController.getTakeoffById);

// Update Takeoff
router.put('/:id', upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'images', maxCount: 10 }
]), takeoffController.updateTakeoff);

// Delete Takeoff
router.delete('/:id', takeoffController.deleteTakeoff);

module.exports = router; 