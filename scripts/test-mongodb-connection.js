const mongoose = require('mongoose');

// MongoDB connection string
// Defaults to local Docker MongoDB, can be overridden with MONGODB_URI env variable
const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/laundry_backend?authSource=admin';

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/:[^:@]+@/, ':****@'));
console.log('');

const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
};

mongoose
  .connect(uri, options)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Check if MongoDB server is running at 13.201.184.91:27017');
    console.error('2. Verify network connectivity: ping 13.201.184.91');
    console.error('3. Check firewall rules allow connection on port 27017');
    console.error('4. Verify credentials are correct');
    console.error('5. Check if MongoDB server allows connections from your IP');
    process.exit(1);
  });

// Close connection after 5 seconds if still connecting
setTimeout(() => {
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 2) {
    console.error('❌ Connection timeout after 10 seconds');
    process.exit(1);
  }
}, 10000);

