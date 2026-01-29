import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
    try {
        const stats = await dashboardService.getStats(req.user!.userId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

export { router as dashboardRouter };
