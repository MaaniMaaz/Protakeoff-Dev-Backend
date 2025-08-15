const Takeoff = require('../models/Takeoff');
const cloudinary = require('../utils/cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || 
                    process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL_ENV || 
                    process.env.VERCEL_URL;

// Ensure uploads directory exists (only for local development)
if (!isServerless) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Helper: upload file to Cloudinary
async function uploadToCloudinary(filePath, resourceType = 'raw', folder = 'takeoffs') {
  try {
    // Check if file exists before uploading (only for disk storage)
    if (!isServerless && !fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// Helper: upload buffer to Cloudinary (for memory storage)
async function uploadBufferToCloudinary(buffer, originalname, resourceType = 'raw', folder = 'takeoffs') {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder,
          public_id: `${Date.now()}-${originalname}`
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      stream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading buffer to Cloudinary:', error);
    throw error;
  }
}

// Helper: generate PDF first page preview
async function generatePdfPreview(pdfPath, outputPath) {
  try {
    // Check if PDF file exists (only for disk storage)
    if (!isServerless && !fs.existsSync(pdfPath)) {
      console.error('PDF file not found:', pdfPath);
      return null;
    }

    const options = {
      density: 150,
      saveFilename: "preview",
      savePath: path.dirname(outputPath),
      format: "png",
      width: 800,
      height: 600
    };
    
    const convert = fromPath(pdfPath, options);
    const pageData = await convert(1); // Convert first page only
    
    if (pageData && pageData.length > 0) {
      const previewPath = path.join(path.dirname(outputPath), pageData[0].name);
      return previewPath;
    }
    return null;
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return null;
  }
}

// Helper: generate PDF preview from buffer (for memory storage)
async function generatePdfPreviewFromBuffer(buffer, originalname) {
  try {
    // For serverless environments, we'll skip PDF preview generation
    // as it requires file system access which is read-only
    console.log('PDF preview generation skipped in serverless environment');
    return null;
  } catch (error) {
    console.error('Error generating PDF preview from buffer:', error);
    return null;
  }
}

// Helper: safely delete file
function safeDeleteFile(filePath) {
  try {
    if (!isServerless && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', filePath, error);
  }
}

// CREATE Takeoff
exports.createTakeoff = async (req, res) => {
  try {
    console.log('Environment:', isServerless ? 'Serverless' : 'Local Development');
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    
    const { title, projectType, projectSize, zipCode, address, price, features, specifications, tags, isActive, expirationDate, createdBy, generalContractor } = req.body;
    
    // Debug logging for generalContractor
    console.log('Received generalContractor:', generalContractor);
    console.log('Type of generalContractor:', typeof generalContractor);
    let files = [];
    let pdfPreview = [];

    // Handle file uploads (pdf, doc, excel)
    if (req.files && req.files.files) {
      console.log('Processing', req.files.files.length, 'files');
      for (const file of req.files.files) {
        try {
          console.log('Processing file:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
          
          let result;
          let firstPagePreviewUrl = null;
          let isPdf = false;
          
          if (isServerless) {
            // Handle memory storage (serverless environment)
            console.log('Using memory storage for serverless environment');
            result = await uploadBufferToCloudinary(file.buffer, file.originalname, 'raw');
            
            // Check if file is PDF
            if (file.mimetype === 'application/pdf') {
              isPdf = true;
              // Skip PDF preview generation in serverless environment
              console.log('PDF preview generation skipped for serverless environment');
            }
          } else {
            // Handle disk storage (local development)
            console.log('Using disk storage for local development');
            const filePath = path.isAbsolute(file.path) ? file.path : path.join(__dirname, '..', file.path);
            result = await uploadToCloudinary(filePath, 'raw');
            
            // Check if file is PDF and generate first page preview
            if (file.mimetype === 'application/pdf') {
              isPdf = true;
              const previewPath = await generatePdfPreview(filePath, filePath);
              if (previewPath) {
                const previewResult = await uploadToCloudinary(previewPath, 'image', 'pdf-previews');
                firstPagePreviewUrl = previewResult.secure_url;
                // Clean up preview file
                safeDeleteFile(previewPath);
              }
            }
            
            // Clean up uploaded file
            safeDeleteFile(filePath);
          }
          
          const fileObject = {
            filename: file.filename || `${Date.now()}-${file.originalname}`,
            originalName: file.originalname,
            size: file.size,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.secure_url,
            resourceType: 'raw',
            uploadDate: new Date(),
            firstPagePreviewUrl,
            isPdf
          };
          
          files.push(fileObject);
          
          // If it's a PDF, also add it to pdfPreview array
          if (isPdf) {
            pdfPreview.push(fileObject);
          }
          
          console.log('Successfully processed file:', file.originalname);
        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
          throw error;
        }
      }
    }

    // Handle PDF preview uploads
    if (req.files && req.files.pdfPreview) {
      console.log('Processing', req.files.pdfPreview.length, 'PDF previews');
      for (const pdf of req.files.pdfPreview) {
        try {
          console.log('Processing PDF preview:', pdf.originalname, 'Size:', pdf.size, 'Type:', pdf.mimetype);
          
          let result;
          let firstPagePreviewUrl = null;
          
          if (isServerless) {
            // Handle memory storage (serverless environment)
            console.log('Using memory storage for PDF preview in serverless environment');
            result = await uploadBufferToCloudinary(pdf.buffer, pdf.originalname, 'raw');
            // Skip PDF preview generation in serverless environment
            console.log('PDF preview generation skipped for serverless environment');
          } else {
            // Handle disk storage (local development)
            console.log('Using disk storage for PDF preview in local development');
            const filePath = path.isAbsolute(pdf.path) ? pdf.path : path.join(__dirname, '..', pdf.path);
            result = await uploadToCloudinary(filePath, 'raw');
            
            // Generate first page preview for PDF
            if (pdf.mimetype === 'application/pdf') {
              const previewPath = await generatePdfPreview(filePath, filePath);
              if (previewPath) {
                const previewResult = await uploadToCloudinary(previewPath, 'image', 'pdf-previews');
                firstPagePreviewUrl = previewResult.secure_url;
                // Clean up preview file
                safeDeleteFile(previewPath);
              }
            }
            
            // Clean up uploaded file
            safeDeleteFile(filePath);
          }
          
          const pdfObject = {
            filename: pdf.filename || `${Date.now()}-${pdf.originalname}`,
            originalName: pdf.originalname,
            size: pdf.size,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.secure_url,
            resourceType: 'raw',
            uploadDate: new Date(),
            firstPagePreviewUrl,
            isPdf: true
          };
          
          pdfPreview.push(pdfObject);
          
          // Also add PDF to files array
          files.push(pdfObject);
          
          console.log('Successfully processed PDF preview:', pdf.originalname);
        } catch (error) {
          console.error('Error processing PDF preview:', pdf.originalname, error);
          throw error;
        }
      }
    }

    // Parse features, specifications, tags, generalContractor if sent as JSON strings
    let parsedFeatures = features;
    let parsedSpecifications = specifications;
    let parsedTags = tags;
    let parsedGeneralContractor = generalContractor;
    
    if (typeof features === 'string') {
      try { parsedFeatures = JSON.parse(features); } catch {}
    }
    if (typeof specifications === 'string') {
      try { parsedSpecifications = JSON.parse(specifications); } catch {}
    }
    
    // Ensure specifications has the required structure
    if (parsedSpecifications && typeof parsedSpecifications === 'object') {
      parsedSpecifications = {
        area: parsedSpecifications.area,
        complexity: parsedSpecifications.complexity,
        materials: parsedSpecifications.materials || [],
        estimatedHours: parsedSpecifications.estimatedHours
      };
    }
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch {}
    }
    if (typeof generalContractor === 'string') {
      try { parsedGeneralContractor = JSON.parse(generalContractor); } catch {}
    }
    
    // Debug logging after parsing
    console.log('Parsed generalContractor:', parsedGeneralContractor);
    
    // Parse boolean fields
    const parsedIsActive = isActive === 'string' ? isActive === 'true' : Boolean(isActive);
    
    // Parse numeric fields
    const parsedPrice = Number(price);
    
    // Parse date fields
    const parsedExpirationDate = new Date(expirationDate);
    
    const takeoffData = {
      title,
      projectType,
      projectSize,
      zipCode,
      address,
      price: parsedPrice,
      features: parsedFeatures,
      specifications: parsedSpecifications,
      expirationDate: parsedExpirationDate,
      files,
      pdfPreview,
      tags: parsedTags,
      isActive: parsedIsActive,
      createdBy,
      generalContractor: parsedGeneralContractor
    };
    
    console.log('Final takeoff data before saving:', JSON.stringify(takeoffData, null, 2));
    
    const takeoff = new Takeoff(takeoffData);
    await takeoff.save();
    
    console.log('Saved takeoff object:', JSON.stringify(takeoff.toObject(), null, 2));
    
    res.status(201).json(takeoff);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET all Takeoffs with filtering, sorting, and pagination (for users - excludes expired)
exports.getAllTakeoffs = async (req, res) => {
  try {
    console.log('Received query params:', req.query)
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
    // Only show active takeoffs to users that haven't expired
    filter.isActive = true;
    // Filter out expired takeoffs
    filter.expirationDate = { $gt: new Date() };
    if (zipCode) filter.zipCode = zipCode;
    if (size) {
      filter.projectSize = size.toLowerCase();
      console.log('Size filter applied:', filter.projectSize)
    }
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
    console.log('Final filter:', JSON.stringify(filter, null, 2))
    const takeoffs = await Takeoff.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'email firstName lastName');
    console.log('Found takeoffs:', takeoffs.length)
    res.json(takeoffs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all Takeoffs for admin (includes expired takeoffs)
exports.getAllTakeoffsAdmin = async (req, res) => {
  try {
    console.log('Received admin query params:', req.query)
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
    // Admin can see all takeoffs (including expired ones)
    if (zipCode) filter.zipCode = zipCode;
    if (size) {
      filter.projectSize = size.toLowerCase();
      console.log('Size filter applied:', filter.projectSize)
    }
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
    console.log('Final admin filter:', JSON.stringify(filter, null, 2))
    const takeoffs = await Takeoff.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'email firstName lastName');
    console.log('Found takeoffs for admin:', takeoffs.length)
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
    
    // Check if user is admin (you can implement your own admin check logic here)
    // For now, we'll allow access to all takeoffs, but you can add admin check later
    // const isAdmin = req.user && req.user.role === 'admin';
    // if (!isAdmin && !takeoff.isActive) {
    //   return res.status(404).json({ error: 'Takeoff not found' });
    // }
    
    res.json(takeoff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE Takeoff
exports.updateTakeoff = async (req, res) => {
  try {
    const { title, description, projectType, projectSize, zipCode, address, price, features, specifications, tags, isActive, expirationDate, generalContractor } = req.body;
    let files = [];
    let pdfPreview = [];

    // Handle new file uploads
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        try {
          let result;
          let firstPagePreviewUrl = null;
          let isPdf = false;
          
          if (isServerless) {
            // Handle memory storage (serverless environment)
            result = await uploadBufferToCloudinary(file.buffer, file.originalname, 'raw');
            
            // Check if file is PDF
            if (file.mimetype === 'application/pdf') {
              isPdf = true;
              // Skip PDF preview generation in serverless environment
              console.log('PDF preview generation skipped for serverless environment');
            }
          } else {
            // Handle disk storage (local development)
            const filePath = path.isAbsolute(file.path) ? file.path : path.join(__dirname, '..', file.path);
            result = await uploadToCloudinary(filePath, 'raw');
            
            // Check if file is PDF and generate first page preview
            if (file.mimetype === 'application/pdf') {
              isPdf = true;
              const previewPath = await generatePdfPreview(filePath, filePath);
              if (previewPath) {
                const previewResult = await uploadToCloudinary(previewPath, 'image', 'pdf-previews');
                firstPagePreviewUrl = previewResult.secure_url;
                // Clean up preview file
                safeDeleteFile(previewPath);
              }
            }
            
            // Clean up uploaded file
            safeDeleteFile(filePath);
          }
          
          const fileObject = {
            filename: file.filename || `${Date.now()}-${file.originalname}`,
            originalName: file.originalname,
            size: file.size,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.secure_url,
            resourceType: 'raw',
            uploadDate: new Date(),
            firstPagePreviewUrl,
            isPdf
          };
          
          files.push(fileObject);
          
          // If it's a PDF, also add it to pdfPreview array
          if (isPdf) {
            pdfPreview.push(fileObject);
          }
        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
          throw error;
        }
      }
    }

    // Handle new PDF preview uploads
    if (req.files && req.files.pdfPreview) {
      for (const pdf of req.files.pdfPreview) {
        try {
          let result;
          let firstPagePreviewUrl = null;
          
          if (isServerless) {
            // Handle memory storage (serverless environment)
            result = await uploadBufferToCloudinary(pdf.buffer, pdf.originalname, 'raw');
            // Skip PDF preview generation in serverless environment
            console.log('PDF preview generation skipped for serverless environment');
          } else {
            // Handle disk storage (local development)
            const filePath = path.isAbsolute(pdf.path) ? pdf.path : path.join(__dirname, '..', pdf.path);
            result = await uploadToCloudinary(filePath, 'raw');
            
            // Generate first page preview for PDF
            if (pdf.mimetype === 'application/pdf') {
              const previewPath = await generatePdfPreview(filePath, filePath);
              if (previewPath) {
                const previewResult = await uploadToCloudinary(previewPath, 'image', 'pdf-previews');
                firstPagePreviewUrl = previewResult.secure_url;
                // Clean up preview file
                safeDeleteFile(previewPath);
              }
            }
            
            // Clean up uploaded file
            safeDeleteFile(filePath);
          }
          
          const pdfObject = {
            filename: pdf.filename || `${Date.now()}-${pdf.originalname}`,
            originalName: pdf.originalname,
            size: pdf.size,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.secure_url,
            resourceType: 'raw',
            uploadDate: new Date(),
            firstPagePreviewUrl,
            isPdf: true
          };
          
          pdfPreview.push(pdfObject);
          
          // Also add PDF to files array
          files.push(pdfObject);
        } catch (error) {
          console.error('Error processing PDF preview:', pdf.originalname, error);
          throw error;
        }
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
      generalContractor,
      updatedAt: new Date()
    };
    if (files.length > 0) update.$push = { files: { $each: files } };
    if (pdfPreview.length > 0) {
      if (!update.$push) update.$push = {};
      update.$push.pdfPreview = { $each: pdfPreview };
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
    // Delete PDF preview from Cloudinary
    for (const pdf of takeoff.pdfPreview) {
      if (pdf.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(pdf.cloudinaryPublicId, { resource_type: 'raw' });
      }
    }
    await takeoff.deleteOne();
    res.json({ message: 'Takeoff deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 