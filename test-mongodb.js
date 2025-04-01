require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('Node.js version:', process.version);
console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
}).then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test database operations
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(collection => console.log(`- ${collection.name}`));
        
        // Get database statistics
        const stats = await mongoose.connection.db.stats();
        console.log('\nDatabase statistics:');
        console.log(`- Database: ${mongoose.connection.name}`);
        console.log(`- Collections: ${stats.collections}`);
        console.log(`- Documents: ${stats.objects}`);
    } catch (err) {
        console.error('Error testing database operations:', err);
    }
    
    process.exit(0);
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    if (err.cause) {
        console.error('Underlying error:', err.cause);
    }
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if MongoDB Atlas is accessible (try pinging cluster0.gcqrs.mongodb.net)');
    console.log('2. Verify IP address is whitelisted in MongoDB Atlas');
    console.log('3. Try updating Node.js to the latest LTS version');
    console.log('4. Check if your network allows MongoDB Atlas connections (port 27017)');
    process.exit(1);
});
