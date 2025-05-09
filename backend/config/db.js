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
        console.error('MongoDB Remote Connection Error:', error);
        console.log('Attempting local MongoDB fallback...');
        const localURI = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/coinDrip';
        try {
            await mongoose.connect(localURI, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log('🟢 Local MongoDB Connection Established 🏠');
        } catch (localError) {
            console.error('Local MongoDB Connection Error:', localError);
            process.exit(1);
        }
    }
};

module.exports = connectDB;