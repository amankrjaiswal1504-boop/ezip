const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scrapmate';
  try {
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    console.error('[db] The server will keep running, but any DB-backed route will fail until MongoDB is reachable.');
  }
}

module.exports = connectDB;
