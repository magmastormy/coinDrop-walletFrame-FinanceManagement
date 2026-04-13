const logger = require('../utils/logger');

//config/db.js

const mongoose = require('mongoose');
//const isOnline = require('is-online');

// Mongoose connection function with optimized connection pooling and replica set support
const connectDB = async () => {
    try {
        logger.debug('🔄 Attempting MongoDB connection...');
        
        // Connection options with optimized pooling for high load and replica set support
        const connectionOptions = {
            // Connection pool settings
            maxPoolSize: 50,           // Increase from default 5 to handle more concurrent operations
            minPoolSize: 5,            // Maintain at least 5 connections in the pool
            socketTimeoutMS: 45000,    // Socket timeout
            connectTimeoutMS: 30000,   // Connection timeout
            serverSelectionTimeoutMS: 10000, // Reduced server selection timeout to fail faster
            heartbeatFrequencyMS: 10000,     // How often to check server status
            family: 4,                 // Force IPv4
            // Replica set options
            replicaSet: process.env.MONGO_REPLICA_SET || 'rs0',
            readPreference: 'secondaryPreferred', // Distribute read operations across replica set
            retryWrites: true,         // Retry write operations on transient errors
            w: 'majority',             // Wait for majority of replica set members to acknowledge writes
            wtimeoutMS: 5000           // Write timeout
        };

        // Use your remote database with replica set
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_REPLICA_SET_URI;
        if (mongoURI) {
            logger.debug(`📍 Connecting to: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
        } else {
            logger.debug('📍 No remote MongoDB URI found, will use local fallback');
        }
        
        if (mongoURI) {
            await mongoose.connect(mongoURI, connectionOptions);
        } else {
            throw new Error('No MongoDB URI provided');
        }
         
        // Log successful connection details
        logger.debug('🟢 MongoDB Connection Established 🌐');
        logger.debug(`📍 Connected to Database: ${mongoose.connection.db.databaseName}`);
        logger.debug(`🔗 Host: ${mongoose.connection.host}`);
        logger.debug(`📊 Connection State: ${mongoose.ConnectionStates[mongoose.connection.readyState]}`);
        logger.debug(`🔄 Pool Size: Max ${connectionOptions.maxPoolSize}, Min ${connectionOptions.minPoolSize}`);
        logger.debug(`🔄 Read Preference: ${connectionOptions.readPreference}`);

        // Set up event listeners for connection monitoring
        mongoose.connection.on('open', () => {
            logger.debug('📨 MongoDB Connection Fully Initialized');
        });

        mongoose.connection.on('disconnected', () => {
            logger.debug('⚠️ MongoDB Connection Disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.debug('🔄 MongoDB Connection Reconnected');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB Connection Error:', err);
        });

        // Monitor replica set status
        mongoose.connection.on('topologyDescriptionChanged', (event) => {
            logger.debug('🔄 MongoDB Topology Changed:', event.newDescription.type);
        });

        return mongoose.connection;
    } catch (error) {
        logger.error('MongoDB Remote Connection Error:', error);
        logger.debug('Attempting local MongoDB fallback...');
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
            logger.debug('🟢 Local MongoDB Connection Established 🏠');
        } catch (localError) {
            logger.error('Local MongoDB Connection Error:', localError);
            process.exit(1);
        }
    }
};

module.exports = connectDB;