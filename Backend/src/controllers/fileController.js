import User from '../models/User.js';
import path from 'path';
import fs from 'fs';

// Upload files for analysis
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Update user's uploaded files in database
    const user = await User.findById(req.user._id);
    
    // Create or update repository entry for uploaded files
    const existingRepo = user.repositories.find(repo => repo.provider === 'uploaded');
    
    if (existingRepo) {
      // Add new files to existing uploaded repository
      existingRepo.uploadedFiles.push(...uploadedFiles.map(file => file.path));
    } else {
      // Create new uploaded repository entry
      user.repositories.push({
        name: 'Uploaded Files',
        url: null,
        provider: 'uploaded',
        uploadedFiles: uploadedFiles.map(file => file.path)
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: uploadedFiles,
        totalFiles: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
};

// Get user's uploaded files
export const getUserFiles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const uploadedRepo = user.repositories.find(repo => repo.provider === 'uploaded');

    if (!uploadedRepo || !uploadedRepo.uploadedFiles.length) {
      return res.json({
        success: true,
        data: { files: [] }
      });
    }

    // Get file information
    const files = uploadedRepo.uploadedFiles.map(filePath => {
      const filename = path.basename(filePath);
      const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
      
      return {
        filename,
        path: filePath,
        size: stats ? stats.size : 0,
        uploadDate: stats ? stats.birthtime : null,
        exists: !!stats
      };
    });

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    });
  }
};

// Delete uploaded file
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);
    
    const uploadedRepo = user.repositories.find(repo => repo.provider === 'uploaded');
    
    if (!uploadedRepo) {
      return res.status(404).json({
        success: false,
        message: 'No uploaded files found'
      });
    }

    // Find the file path
    const filePath = uploadedRepo.uploadedFiles.find(path => 
      path.includes(filename)
    );

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    uploadedRepo.uploadedFiles = uploadedRepo.uploadedFiles.filter(
      path => path !== filePath
    );

    await user.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};

// Download file
export const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);
    
    const uploadedRepo = user.repositories.find(repo => repo.provider === 'uploaded');
    
    if (!uploadedRepo) {
      return res.status(404).json({
        success: false,
        message: 'No uploaded files found'
      });
    }

    // Find the file path
    const filePath = uploadedRepo.uploadedFiles.find(path => 
      path.includes(filename)
    );

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Send file
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to download file'
        });
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
};

// Clear all uploaded files
export const clearAllFiles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const uploadedRepo = user.repositories.find(repo => repo.provider === 'uploaded');

    if (!uploadedRepo) {
      return res.json({
        success: true,
        message: 'No files to clear'
      });
    }

    // Delete all files from filesystem
    uploadedRepo.uploadedFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Clear from database
    uploadedRepo.uploadedFiles = [];
    await user.save();

    // Remove user upload directory if empty
    const userUploadDir = path.join('uploads', req.user._id.toString());
    if (fs.existsSync(userUploadDir)) {
      const files = fs.readdirSync(userUploadDir);
      if (files.length === 0) {
        fs.rmdirSync(userUploadDir);
      }
    }

    res.json({
      success: true,
      message: 'All files cleared successfully'
    });
  } catch (error) {
    console.error('Clear files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear files'
    });
  }
};