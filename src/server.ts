import app from './app';
import { config } from './config';
import { connectDB } from './database/connection';
import { eventBus, Events } from './events/eventBus';

const startServer = async () => {
    await connectDB();

    // Example Event Listener Registration
    eventBus.on(Events.USER_CREATED, (user) => {
        console.log(`[EVENT] New user registered: ${user.email}`);
        // Send welcome email logic here
    });

    eventBus.on(Events.PRODUCT_CREATED, (product) => {
        console.log(`[EVENT] New product added: ${product.name}`);
    });

    const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`
      ################################################
      🚀 Server listening on port: ${config.port}
      🔊 Environment: ${config.env}
      📧 Email Service: ${config.email.auth.user ? 'Configured ✅' : 'Missing Credentials ❌'}
      📱 WhatsApp Service: ${config.whatsapp.accessToken ? 'Configured ✅' : 'Missing Credentials ❌'}
      ################################################
    `);
    });

    const exitHandler = () => {
        if (server) {
            server.close(() => {
                console.log('Server closed');
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    };

    const unexpectedErrorHandler = (error: Error) => {
        console.error(error);
        // exitHandler();
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => {
        console.log('SIGTERM received');
        if (server) {
            server.close();
        }
    });
};

startServer();