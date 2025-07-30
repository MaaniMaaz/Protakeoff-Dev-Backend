const Takeoff = require('../models/Takeoff');
const cloudinary = require('../utils/cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');

// Helper: upload file to Cloudinary
async function uploadToCloudinary(filePath, resourceType = 'raw', folder = 'takeoffs') {
  return cloudinary.uploader.upload(filePath, {
    resource_type: resourceType,
    folder
  });
}

// CREATE Takeoff
exports.createTakeoff = async (req, res) => {
  try {
    const { title, description, projectType, projectSize, zipCode, address, price, features, specifications, tags, isActive, expirationDate, createdBy } = req.body;
    let files = [];
    let images = [];

    // Handle file uploads (pdf, doc, excel)
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        const result = await uploadToCloudinary(file.path, 'raw');
        files.push({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          cloudinaryPublicId: result.public_id,
          cloudinaryUrl: result.secure_url,
          resourceType: 'raw',
          uploadDate: new Date()
        });
        fs.unlinkSync(file.path);
      }
    }

    // Handle image uploads
    if (req.files && req.files.images) {
      for (const image of req.files.images) {
        const result = await uploadToCloudinary(image.path, 'image');
        images.push({
          cloudinaryPublicId: result.public_id,
          cloudinaryUrl: result.secure_url,
          thumbnailUrl: result.secure_url, // Optionally generate thumbnail
          width: result.width,
          height: result.height
        });
        fs.unlinkSync(image.path);
      }
    } else {
      // Add default image if no images provided
      images.push({
        cloudinaryPublicId: 'default-takeoff-image',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscape.jpg',
        thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscape.jpg',
        width: 800,
        height: 600
      });
    }

    // Parse features, specifications, tags if sent as JSON strings
    let parsedFeatures = features;
    let parsedSpecifications = specifications;
    let parsedTags = tags;
    if (typeof features === 'string') {
      try { parsedFeatures = JSON.parse(features); } catch {}
    }
    if (typeof specifications === 'string') {
      try { parsedSpecifications = JSON.parse(specifications); } catch {}
    }
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch {}
    }
    const takeoff = new Takeoff({
      title,
      description,
      projectType,
      projectSize,
      zipCode,
      address,
      price,
      features: parsedFeatures,
      specifications: parsedSpecifications,
      expirationDate,
      files,
      images,
      tags: parsedTags,
      isActive,
      createdBy
    });
    await takeoff.save();
    res.status(201).json(takeoff);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET all Takeoffs with filtering, sorting, and pagination
exports.getAllTakeoffs = async (req, res) => {
  try {
    const {
      zipCode,
      size,
      type,
      priceMin,
      priceMax,
      search,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    const filter = {};
    if (zipCode) filter.zipCode = zipCode;
    if (size) filter.projectSize = size.toLowerCase();
    if (type) {
      // type can be comma separated
      const types = type.split(',').map(t => t.trim().toLowerCase());
      filter.projectType = { $in: types };
    }
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { zipCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'size') sortOption = { projectSize: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const takeoffs = await Takeoff.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'email firstName lastName');
    res.json(takeoffs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single Takeoff
exports.getTakeoffById = async (req, res) => {
  try {
    const takeoff = await Takeoff.findById(req.params.id).populate('createdBy', 'email firstName lastName');
    if (!takeoff) return res.status(404).json({ error: 'Takeoff not found' });
    res.json(takeoff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE Takeoff
exports.updateTakeoff = async (req, res) => {
  try {
    const { title, description, projectType, projectSize, zipCode, address, price, features, specifications, tags, isActive, expirationDate } = req.body;
    let files = [];
    let images = [];

    // Handle new file uploads
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        const result = await uploadToCloudinary(file.path, 'raw');
        files.push({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          cloudinaryPublicId: result.public_id,
          cloudinaryUrl: result.secure_url,
          resourceType: 'raw',
          uploadDate: new Date()
        });
        fs.unlinkSync(file.path);
      }
    }

    // Handle new image uploads
    if (req.files && req.files.images) {
      for (const image of req.files.images) {
        const result = await uploadToCloudinary(image.path, 'image');
        images.push({
          cloudinaryPublicId: result.public_id,
          cloudinaryUrl: result.secure_url,
          thumbnailUrl: result.secure_url,
          width: result.width,
          height: result.height
        });
        fs.unlinkSync(image.path);
      }
    }

    // Parse features, specifications, tags if sent as JSON strings
    let parsedFeatures = features;
    let parsedSpecifications = specifications;
    let parsedTags = tags;
    if (typeof features === 'string') {
      try { parsedFeatures = JSON.parse(features); } catch {}
    }
    if (typeof specifications === 'string') {
      try { parsedSpecifications = JSON.parse(specifications); } catch {}
    }
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch {}
    }
    const update = {
      title,
      description,
      projectType,
      projectSize,
      zipCode,
      address,
      price,
      features: parsedFeatures,
      specifications: parsedSpecifications,
      tags: parsedTags,
      expirationDate,
      isActive,
      updatedAt: new Date()
    };
    if (files.length > 0) update.$push = { files: { $each: files } };
    if (images.length > 0) {
      if (!update.$push) update.$push = {};
      update.$push.images = { $each: images };
    }

    const takeoff = await Takeoff.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!takeoff) return res.status(404).json({ error: 'Takeoff not found' });
    res.json(takeoff);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE Takeoff
exports.deleteTakeoff = async (req, res) => {
  try {
    const takeoff = await Takeoff.findById(req.params.id);
    if (!takeoff) return res.status(404).json({ error: 'Takeoff not found' });

    // Delete files from Cloudinary
    for (const file of takeoff.files) {
      if (file.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(file.cloudinaryPublicId, { resource_type: 'raw' });
      }
    }
    // Delete images from Cloudinary
    for (const image of takeoff.images) {
      if (image.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId, { resource_type: 'image' });
      }
    }
    await takeoff.deleteOne();
    res.json({ message: 'Takeoff deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 