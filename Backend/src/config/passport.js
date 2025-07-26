import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email, authMethod: 'local' });
    
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email (different auth method)
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.avatar = user.avatar || profile.photos[0]?.value;
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Create new user
    const username = await generateUniqueUsername(profile.emails[0].value);
    
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      username: username,
      fullName: profile.displayName,
      avatar: profile.photos[0]?.value,
      authMethod: 'google',
      isVerified: true,
      lastLogin: new Date()
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this GitHub ID
    let user = await User.findOne({ githubId: profile.id });
    
    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email (different auth method)
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      
      if (user) {
        // Link GitHub account to existing user
        user.githubId = profile.id;
        user.githubUsername = profile.username;
        user.avatar = user.avatar || profile.photos[0]?.value;
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    const username = await generateUniqueUsername(email || profile.username);
    
    user = new User({
      githubId: profile.id,
      email: email,
      username: username,
      fullName: profile.displayName || profile.username,
      githubUsername: profile.username,
      avatar: profile.photos[0]?.value,
      authMethod: 'github',
      isVerified: true,
      lastLogin: new Date()
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Helper function to generate unique username
async function generateUniqueUsername(baseInput) {
  let baseUsername;
  
  if (baseInput.includes('@')) {
    // Email input
    baseUsername = baseInput.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  } else {
    // Username input
    baseUsername = baseInput.replace(/[^a-zA-Z0-9]/g, '');
  }

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

export default passport;