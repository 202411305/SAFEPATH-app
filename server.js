const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS configuration - payagan ang Live Server
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Local MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/safepath_db";

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  age: Number,
  birthday: Date,
  phone: String,
  status: { type: String, default: 'Online' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to Local MongoDB!');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => console.error('❌ MongoDB error:', err.message));

// REGISTER API
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, age, birthday, phone, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      age,
      birthday,
      phone
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'my_super_secret_key_12345',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id: user._id, name, email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (role && user.role !== role) {
      return res.status(401).json({ error: 'Wrong account type' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'my_super_secret_key_12345',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEST API
app.get('/', (req, res) => {
  res.json({ message: 'SafePath API is running locally!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});