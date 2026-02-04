import { Router } from 'express';
import { settingsService } from '../services/settings.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Global Config (GET /api/settings)
router.get('/', async (req, res, next) => {
    try {
        const settings = await settingsService.getAllSettings(req.user!.userId);
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

// Update General Info (Legacy support for businessName, email, smsTemplate)
router.patch('/', async (req, res, next) => {
    try {
        const updated = await settingsService.updateGeneralInfo(req.user!.userId, req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// Update Business Settings
router.put('/business', async (req, res, next) => {
    try {
        const updated = await settingsService.updateBusinessSettings(req.user!.userId, req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// Update AI Settings
router.put('/ai', async (req, res, next) => {
    try {
        const updated = await settingsService.updateAiSettings(req.user!.userId, req.body);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// Services Management
router.get('/services', async (req, res, next) => {
    try {
        const services = await settingsService.getServices(req.user!.userId);
        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
});

router.post('/services', async (req, res, next) => {
    try {
        const service = await settingsService.createService(req.user!.userId, req.body);
        res.json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

router.patch('/services/:id', async (req, res, next) => {
    try {
        const service = await settingsService.updateService(req.user!.userId, req.params.id, req.body);
        res.json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

router.delete('/services/:id', async (req, res, next) => {
    try {
        await settingsService.deleteService(req.user!.userId, req.params.id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export { router as settingsRouter };
