import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { config } from './config';
import { logger } from './utils/logger';

// Import models to ensure they are registered with Mongoose
import './modules/brand/brand.model';
import './modules/category/category.model';

const app = express();

// Trust proxy for Render (to fix express-rate-limit error)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: true, // Reflect request origin (Permissive for debugging, but handles credentials)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for testing
    message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Logger
// Always use morgan in production to see requests in Render logs
app.use(morgan('dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1', routes);

// Error Handler
app.use(errorHandler);

export default app;
