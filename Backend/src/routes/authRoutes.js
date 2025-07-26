import express from 'express';
import passport from '../config/passport.js';
import {
  register,
  login,
  oauthSuccess,
  oauthFailure,
  getCurrentUser,
  updateProfile,
  logout,
  refreshToken
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Local Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    session: false 
  }),
  oauthSuccess
);

// GitHub OAuth Routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/auth/failure',
    session: false 
  }),
  oauthSuccess
);

// OAuth Success/Failure Routes
router.get('/success', oauthSuccess);
router.get('/failure', oauthFailure);

// Protected Routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;