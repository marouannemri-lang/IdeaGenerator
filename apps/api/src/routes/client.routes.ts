import { Router } from 'express';
import { clientService } from '../services/client.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const clients = await clientService.findAll(req.user!.userId);
        res.json({ success: true, data: clients });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const client = await clientService.create(req.user!.userId, req.body);
        res.status(201).json({ success: true, data: client });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const client = await clientService.findOne(req.user!.userId, req.params.id);
        if (!client) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: client });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const client = await clientService.update(req.user!.userId, req.params.id, req.body);
        res.json({ success: true, data: client });
    } catch (error) {
        next(error);
    }
});

export { router as clientRouter };
