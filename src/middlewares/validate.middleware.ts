import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiResponse } from '../utils/response';

export const validate = (schema: z.Schema) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error: any) {
        if (error instanceof ZodError) {
            const errorMessages = error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return res.status(400).json(ApiResponse.error('Validation Error', 400, errorMessages));
        }
        return next(error);
    }
};
