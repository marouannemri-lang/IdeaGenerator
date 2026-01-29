import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3001'),
    databaseUrl: process.env.DATABASE_URL!,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'secret_access',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'secret_refresh',
        accessExpiresIn: '1h',
        refreshExpiresIn: '7d',
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    },
};
