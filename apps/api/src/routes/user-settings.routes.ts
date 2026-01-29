import { Router } from 'express';
import { userSettingsService } from '../services/user-settings.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const settings = await userSettingsService.getSettings(req.user!.userId);
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

router.patch('/', async (req, res, next) => {
    try {
        const settings = await userSettingsService.updateSettings(req.user!.userId, req.body);
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

export { router as userSettingsRouter };
