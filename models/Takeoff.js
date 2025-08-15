const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  cloudinaryPublicId: String,
  cloudinaryUrl: String,
  resourceType: String, // 'raw' for files, 'image' for images
  uploadDate: { type: Date, default: Date.now },
  // New field for PDF first page preview
  firstPagePreviewUrl: String,
  isPdf: { type: Boolean, default: false }
}, { _id: false });

const pdfPreviewSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  cloudinaryPublicId: String,
  cloudinaryUrl: String,
  resourceType: String,
  uploadDate: { type: Date, default: Date.now },
  firstPagePreviewUrl: String,
  isPdf: { type: Boolean, default: true }
}, { _id: false });

const takeoffSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  projectType: { type: String, enum: ['landscaping', 'irrigation', 'bundle'] },
  projectSize: { type: String, enum: ['small', 'medium', 'large', 'corporate'] },
  zipCode: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  features: { type: [String], required: true },
  specifications: {
    area: { type: Number, required: true },
    complexity: { type: String, enum: ['basic', 'intermediate', 'advanced'], required: true },
    materials: { type: [String], required: false },
    estimatedHours: { type: Number, required: false }
  },
  // General Contractor Contact Information
  generalContractor: {
    email: { type: String, required: false },
    phone: { type: String, required: false }
  },
  expirationDate: { type: Date, required: true },
  files: { type: [fileSchema], required: false, default: [] },
  pdfPreview: { type: [pdfPreviewSchema], required: false, default: [] },
  tags: { type: [String], required: true },
  isActive: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Takeoff', takeoffSchema); 