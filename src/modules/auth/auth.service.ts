import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/shared/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RedisService } from 'src/shared/redis/redis.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private jwtService: JwtService,
    ) {}

    async register(email: string, password: string) {
        const hashed = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: { email, password: hashed },
        });

        return user;
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.password);
        return valid ? user : null;
    }

    async login(user: { id: string; email: string }) {
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        await this.redis.set(
            `refresh:${user.id}`,
            refreshToken,
            7 * 24 * 60 * 60,
        );

        return { accessToken, refreshToken };
    }

    async refreshToken(userId: string, token: string) {
        const stored = await this.redis.get(`refresh:${userId}`);
        if (stored !== token) throw new Error('Invalid refresh token');

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new Error('User not found');

        return this.login(user);
    }
}
