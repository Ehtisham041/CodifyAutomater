import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMultiple, handleUploadErrors } from '../config/multer.js';
import {
  uploadFiles,
  getUserFiles,
  deleteFile,
  downloadFile,
  clearAllFiles
} from '../controllers/fileController.js';

const router = express.Router();

// All file routes require authentication
router.use(authenticateToken);

// Upload files
router.post('/upload', 
  uploadMultiple, 
  handleUploadErrors, 
  uploadFiles
);

// Get user's uploaded files
router.get('/', getUserFiles);

// Download specific file
router.get('/download/:filename', downloadFile);

// Delete specific file
router.delete('/:filename', deleteFile);

// Clear all uploaded files
router.delete('/', clearAllFiles);

export default router;