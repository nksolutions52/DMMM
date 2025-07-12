const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different document types
const documentTypes = ['puc', 'insurance', 'fitness', 'permit', 'tax', 'rc'];
documentTypes.forEach(type => {
  const typeDir = path.join(uploadsDir, type);
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract document type from fieldname (e.g., 'puc_documents', 'insurance_documents')
    const documentType = file.fieldname.split('_')[0];
    const uploadPath = path.join(uploadsDir, documentType);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: vehicleId_documentType_timestamp_originalname
    const vehicleId = req.body.vehicleId || 'new';
    const documentType = file.fieldname.split('_')[0];
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${vehicleId}_${documentType}_${timestamp}_${name}${ext}`;
    cb(null, filename);
  }
});

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20 // Maximum 20 files per request
  },
  fileFilter: fileFilter
});

// Middleware to handle multiple document types
const uploadDocuments = upload.fields([
  { name: 'puc_documents', maxCount: 5 },
  { name: 'insurance_documents', maxCount: 5 },
  { name: 'fitness_documents', maxCount: 5 },
  { name: 'permit_documents', maxCount: 5 },
  { name: 'tax_documents', maxCount: 5 },
  { name: 'rc_documents', maxCount: 5  }
]);

module.exports = {
  uploadDocuments,
  uploadsDir
};