const mongoose = require('mongoose');

let isConnected = false;

const DEFAULT_MONGO_URI = 'mongodb+srv://alonesurvivor03_db_user:Anuj1234@cluster0.qwgai2u.mongodb.net/deceptor?appName=Cluster0';

const connectDB = async () => {
  if (isConnected || mongoose.connection?.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
