import { Router } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

router.post('/register', async (req, res, next) => {
    try {
        const tokens = await authService.register(req.body);
        res.status(201).json({ success: true, data: tokens });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const tokens = await authService.login(req.body);
        res.json({ success: true, data: tokens });
    } catch (error) {
        next(error);
    }
});

export { router as authRouter };
