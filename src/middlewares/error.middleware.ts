import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/response';
import { config } from '../config';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let { statusCode, message } = err;

    if (!statusCode) {
        statusCode = 500;
    }

    const response = ApiResponse.error(
        message || 'Internal Server Error',
        statusCode,
        config.env === 'development' ? { stack: err.stack } : null
    );

    console.error(err);

    res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};
