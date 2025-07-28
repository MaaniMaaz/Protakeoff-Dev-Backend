const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  cloudinaryPublicId: String,
  cloudinaryUrl: String,
  resourceType: String, // 'raw' for files, 'image' for images
  uploadDate: { type: Date, default: Date.now }
}, { _id: false });

const imageSchema = new mongoose.Schema({
  cloudinaryPublicId: String,
  cloudinaryUrl: String,
  thumbnailUrl: String,
  width: Number,
  height: Number
}, { _id: false });

const takeoffSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  projectType: { type: String, enum: ['landscaping', 'irrigation', 'bundle'] },
  projectSize: { type: String, enum: ['small', 'medium', 'large'] },
  zipCode: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  features: { type: [String], required: true },
  specifications: {
    area: { type: Number, required: true },
    complexity: { type: String, enum: ['basic', 'intermediate', 'advanced'], required: true },
    materials: { type: [String], required: true },
    estimatedHours: { type: Number, required: true }
  },
  expirationDate: { type: Date, required: true },
  files: { type: [fileSchema], required: false, default: [] },
  images: { type: [imageSchema], required: false, default: [] },
  tags: { type: [String], required: true },
  isActive: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Takeoff', takeoffSchema); 