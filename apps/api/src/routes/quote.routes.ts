import { Router } from 'express';
import { quoteService } from '../services/quote.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const search = req.query.search as string | undefined;
        const quotes = await quoteService.findAll(req.user!.userId, search);
        res.json({ success: true, data: quotes });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const quote = await quoteService.create(req.user!.userId, req.body);
        res.status(201).json({ success: true, data: quote });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const quote = await quoteService.findOne(req.user!.userId, req.params.id);
        if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: quote });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const quote = await quoteService.update(req.user!.userId, req.params.id, req.body);
        res.json({ success: true, data: quote });
    } catch (error) {
        next(error);
    }
});

export { router as quoteRouter };
