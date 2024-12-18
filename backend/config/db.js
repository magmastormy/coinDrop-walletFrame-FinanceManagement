//config/db.js

const mongoose = require('mongoose');

// Mongoose connection function
const connectDB = async () => {
    try {
        // Use environment variable for connection string
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error('MongoDB connection string is not defined');
        }

        // Connection options
        const options = {
            // Remove deprecated options
            // useNewUrlParser and useUnifiedTopology are no longer needed in recent mongoose versions
        };

        // Attempt connection
        const connection = await mongoose.connect(mongoURI, options);

        // Log successful connection details
        console.log('🟢 MongoDB Connection Established 🌐');
        console.log(`📍 Connected to Database: ${connection.connection.db.databaseName}`);
        console.log(`🔗 Host: ${connection.connection.host}`);
        console.log(`📊 Connection State: ${mongoose.ConnectionStates[connection.connection.readyState]}`);

        // Optional: Log when connection is fully open
        connection.connection.on('open', () => {
            console.log('📨 MongoDB Connection Fully Initialized');
        });

        return connection;
    } catch (error) {
        console.error('🔴 MongoDB Connection Error:', error.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;