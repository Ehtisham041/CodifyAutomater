import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },

  // Local authentication
  password: {
    type: String,
    required: function() {
      return this.authMethod === 'local';
    }
  },

  // OAuth information
  authMethod: {
    type: String,
    enum: ['local', 'google', 'github'],
    required: true
  },

  // Google OAuth
  googleId: {
    type: String,
    sparse: true
  },

  // GitHub OAuth
  githubId: {
    type: String,
    sparse: true
  },
  githubUsername: {
    type: String,
    sparse: true
  },

  // Additional user data
  isVerified: {
    type: Boolean,
    default: false
  },
  repositories: [{
    name: String,
    url: String,
    provider: String, // 'github' or 'uploaded'
    uploadedFiles: [String] // For local file uploads
  }],

  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.authMethod !== 'local') {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.authMethod !== 'local') {
    throw new Error('Password comparison not available for OAuth users');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate username from email
userSchema.statics.generateUsername = function(email) {
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  return baseUsername + Math.floor(Math.random() * 1000);
};

const User = mongoose.model('User', userSchema);

export default User;