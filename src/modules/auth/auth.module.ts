import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/shared/database/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from 'src/shared/redis/redis.module';

@Module({
    imports: [PrismaModule, RedisModule, JwtModule.register({})],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
