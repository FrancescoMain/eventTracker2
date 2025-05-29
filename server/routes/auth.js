const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user && user.email !== 'admin@admin.it') {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (email === 'admin@admin.it') {
      if (user) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({ email, password: hashedPassword });
      await user.save();
      return res.status(201).json({ message: 'Admin user registered successfully' });
    } else {
      // For now, only admin can register
      return res.status(403).json({ message: 'User registration not allowed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (email === 'admin@admin.it' && password === 'francesco.1') {
      const payload = {
        user: {
          id: user.id,
          email: user.email,
        },
      };
      // In a real application, use a strong, environment-variable-stored secret
      const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' }); 
      return res.json({ token });
    } else {
        // For now, only admin can login
        return res.status(403).json({ message: 'Login not allowed for this user' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
