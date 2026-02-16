const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const connectDB = require('./src/config/db');

let server;

// Connect to MongoDB
connectDB().then(() => {
    server = app.listen(config.port, () => {
        logger.info(`Server listening on port ${config.port}`);
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
