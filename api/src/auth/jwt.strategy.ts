import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-jwt';
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

const cookieExtractor = (req: Request): string | null => {
    const token = req?.cookies?.['access_token'];
    console.log('[JwtStrategy] access_token cookie present:', Boolean(token));
    if (token) {
        console.log('[JwtStrategy] access_token cookie (first 10):', token.substring(0, 10));
    }
    return token ?? null;
};


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(private prisma: PrismaService){
        super({
            jwtFromRequest: cookieExtractor,
            // AuthService/AuthModule JWTni SUPER_SECRET_KEY bilan sign qilayapti.
            // JwtStrategy ham aynan shuni ishlatishi kerak, aks holda /auth/profile 401 beradi.
            secretOrKey: process.env.SUPER_SECRET_KEY || 'NO_secret_KEY_$404',
        });
    }
    async validate(payload: { sub: string; email: string }){
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
        });

        if(!user){
            
            console.error("User not found for payload:", payload);
            throw new UnauthorizedException('User Not Found');
        }

        const { password, ...result } = user;
        return result;
    }
}
