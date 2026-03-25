// Simple Express Server File , uses cors to allow requests from frontend,
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const playerRoutes = require('./routes/players');
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use('/api/players', playerRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'La Fabrica API is running' });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
