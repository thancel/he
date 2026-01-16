const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('../config.json');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'hefang-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60000 * 60 * 24 * 7 // 7 days
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('✅ Web: Connected to MongoDB'))
  .catch(err => console.error('❌ Web: MongoDB Error:', err));

// Passport Discord Strategy
passport.use(new DiscordStrategy({
  clientID: config.clientId,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Middleware to check if user is owner
function isOwner(req, res, next) {
  if (req.isAuthenticated() && req.user.id === config.ownerId) {
    return next();
  }
  res.status(403).json({ error: 'Unauthorized: Owner only' });
}

// Routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: 'http://localhost:3001' }),
  (req, res) => {
    if (req.user.id === config.ownerId) {
      res.redirect('http://localhost:3001/dashboard');
    } else {
      req.logout(() => {
        res.redirect('http://localhost:3001?error=not_owner');
      });
    }
  }
);

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        discriminator: req.user.discriminator,
        avatar: req.user.avatar
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3001');
  });
});

// API Routes (Owner only)
app.get('/api/stats', isOwner, async (req, res) => {
  try {
    const User = require('../src/models/User');
    const Giveaway = require('../src/models/Giveaway');
    const TempVoice = require('../src/models/TempVoice');
    
    const totalUsers = await User.countDocuments();
    const totalGiveaways = await Giveaway.countDocuments();
    const activeGiveaways = await Giveaway.countDocuments({ ended: false });
    const tempVoiceSetups = await TempVoice.countDocuments();
    
    res.json({
      users: totalUsers,
      giveaways: totalGiveaways,
      activeGiveaways,
      tempVoiceSetups
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', isOwner, async (req, res) => {
  try {
    const User = require('../src/models/User');
    const users = await User.find().limit(100).sort({ balance: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/giveaways', isOwner, async (req, res) => {
  try {
    const Giveaway = require('../src/models/Giveaway');
    const giveaways = await Giveaway.find().sort({ createdAt: -1 }).limit(50);
    res.json(giveaways);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = config.webPort || 3000;
app.listen(PORT, () => {
  console.log(`✅ Web server running on http://localhost:${PORT}`);
});