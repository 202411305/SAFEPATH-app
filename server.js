const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// SIMPLE REGISTER - para walang error
app.post('/api/register', async (req, res) => {
  console.log('Received request:', req.body);
  
  try {
    const { name, email, password } = req.body;
    
    // Simulate success without database
    res.json({ success: true, message: 'User created!' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simulate login success
  res.json({ success: true, user: { name: 'Juan dela Cruz', email } });
});

app.get('/', (req, res) => {
  res.json({ message: 'SafePath API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
