import { Router } from 'express';
import { externalCatalogService } from '../services/external-catalog.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', async (req, res, next) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query parameter required' });
        }

        const products = await externalCatalogService.searchLeroyMerlin(query);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
});

export { router as externalCatalogRouter };
