import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);

app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`🚀 Server on port ${config.port}`);
});
