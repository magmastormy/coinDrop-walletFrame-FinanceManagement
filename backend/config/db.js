//config/db.js

const mongoose = require('mongoose');
//const isOnline = require('is-online');

// Mongoose connection function
const connectDB = async () => {
    try {
        //const online = await isOnline();

        // Use your remote database
        const mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

        // Log successful connection details
        console.log('🟢 MongoDB Connection Established 🌐');
        console.log(`📍 Connected to Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        console.log(`📊 Connection State: ${mongoose.ConnectionStates[mongoose.connection.readyState]}`);

        // Optional: Log when connection is fully open
        mongoose.connection.on('open', () => {
            console.log('📨 MongoDB Connection Fully Initialized');
        });

        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;