import { Router } from 'express';
import { invoiceService } from '../services/invoice.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const invoices = await invoiceService.findAll(req.user!.userId);
        res.json({ success: true, data: invoices });
    } catch (error) {
        next(error);
    }
});

router.post('/from-quote/:quoteId', async (req, res, next) => {
    try {
        const invoice = await invoiceService.createFromQuote(req.user!.userId, req.params.quoteId);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', async (req, res, next) => {
    try {
        const invoice = await invoiceService.updateStatus(req.user!.userId, req.params.id, req.body.status);
        res.json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
});

export { router as invoiceRouter };
