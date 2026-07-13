const logger = require('../utils/logger');

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connectionOptions = {
            maxPoolSize: 50,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            family: 4,
            ...(process.env.MONGO_REPLICA_SET ? {
                replicaSet: process.env.MONGO_REPLICA_SET,
                readPreference: 'secondaryPreferred',
                retryWrites: true,
                w: 'majority',
                wtimeoutMS: 5000
            } : {})
        };

        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_REPLICA_SET_URI;
        if (!mongoURI) {
            throw new Error('No MongoDB URI provided - set MONGODB_URI environment variable');
        }

        await mongoose.connect(mongoURI, connectionOptions);

        logger.info('MongoDB connected');

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        return mongoose.connection;
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;