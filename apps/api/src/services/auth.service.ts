import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@talentflow/database';
import { CreateUserDto, LoginDto, AuthTokens } from '@talentflow/shared';
import { config } from '../config';

export class AuthService {
    async register(data: CreateUserDto): Promise<AuthTokens> {
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) throw new Error('Email already exists');

        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                businessName: data.businessName,
                settings: { create: {} },
            },
        });

        return this.generateTokens(user.id, user.email, user.plan);
    }

    async login(data: LoginDto): Promise<AuthTokens> {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) throw new Error('Invalid credentials');

        const valid = await bcrypt.compare(data.password, user.passwordHash);
        if (!valid) throw new Error('Invalid credentials');

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return this.generateTokens(user.id, user.email, user.plan);
    }

    private generateTokens(userId: string, email: string, plan: string): AuthTokens {
        const payload = { userId, email, plan };

        const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiresIn,
        });

        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        });

        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();
