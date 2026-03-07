require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const ensureUploadDirectories = require('./utils/ensureUploadDirs');
const { initCloudinary } = require('./config/cloudinary');
const categoryInit = require('./config/categoryInit');
const { createApp } = require('./app');

const app = createApp();

connectDB();
initCloudinary();
categoryInit();

ensureUploadDirectories()
    .then(() => console.log('Upload directories ready'))
    .catch(err => console.error('Error setting up upload directories:', err));

const PORT = process.env.PORT || 5001;
const serverConfig = {
    timeout: 120000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000
};

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Server timeout: ${serverConfig.timeout}ms, Keep-alive: ${serverConfig.keepAliveTimeout}ms`);
});

server.timeout = serverConfig.timeout;
server.keepAliveTimeout = serverConfig.keepAliveTimeout;
server.headersTimeout = serverConfig.headersTimeout;

const connections = {};
let connectionCounter = 0;

server.on('connection', conn => {
    const id = connectionCounter++;
    connections[id] = conn;

    conn.on('close', () => {
        delete connections[id];
    });
});

function gracefulShutdown(signal) {
    console.log(`${signal} signal received: initiating graceful shutdown`);

    server.close(() => {
        console.log('HTTP server closed, no longer accepting connections');

        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    setTimeout(() => {
        console.log('Graceful shutdown timed out, forcing exit');
        process.exit(1);
    }, 30000);

    Object.keys(connections).forEach(key => {
        const conn = connections[key];
        conn.end();
        setTimeout(() => {
            if (!conn.destroyed) {
                conn.destroy();
            }
        }, 5000);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
