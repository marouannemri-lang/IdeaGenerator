import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

declare global {
    namespace Express {
        interface Request {
            user?: { userId: string; email: string; plan: string };
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('No token');

        const payload = jwt.verify(token, config.jwt.accessSecret) as any;
        req.user = { userId: payload.userId, email: payload.email, plan: payload.plan };

        next();
    } catch (error) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }
};
