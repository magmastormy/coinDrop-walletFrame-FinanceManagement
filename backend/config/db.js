//config/db.js

const mongoose = require('mongoose');
//const isOnline = require('is-online');

// Mongoose connection function with optimized connection pooling
const connectDB = async () => {
    try {
        // Connection options with optimized pooling for high load
        const connectionOptions = {
            // Connection pool settings
            maxPoolSize: 50,           // Increase from default 5 to handle more concurrent operations
            minPoolSize: 5,            // Maintain at least 5 connections in the pool
            socketTimeoutMS: 45000,    // Socket timeout
            connectTimeoutMS: 30000,   // Connection timeout
            serverSelectionTimeoutMS: 30000, // Server selection timeout
            heartbeatFrequencyMS: 10000,     // How often to check server status
            family: 4                  // Force IPv4
        };

        // Use your remote database
        const mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI, connectionOptions);
         
        // Log successful connection details
        console.log('🟢 MongoDB Connection Established 🌐');
        console.log(`📍 Connected to Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        console.log(`📊 Connection State: ${mongoose.ConnectionStates[mongoose.connection.readyState]}`);
        console.log(`🔄 Pool Size: Max ${connectionOptions.maxPoolSize}, Min ${connectionOptions.minPoolSize}`);

        // Set up event listeners for connection monitoring
        mongoose.connection.on('open', () => {
            console.log('📨 MongoDB Connection Fully Initialized');
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB Connection Disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB Connection Reconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Connection Error:', err);
        });

        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB Remote Connection Error:', error);
        console.log('Attempting local MongoDB fallback...');
        const localURI = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/coinDrip';
        try {
            // Use same connection options for local connection
            const connectionOptions = {
                maxPoolSize: 50,
                minPoolSize: 5,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
                serverSelectionTimeoutMS: 30000,
                heartbeatFrequencyMS: 10000,
                family: 4
            };
            await mongoose.connect(localURI, connectionOptions);
            console.log('🟢 Local MongoDB Connection Established 🏠');
        } catch (localError) {
            console.error('Local MongoDB Connection Error:', localError);
            process.exit(1);
        }
    }
};

module.exports = connectDB;