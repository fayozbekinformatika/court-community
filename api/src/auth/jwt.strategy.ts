import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-jwt';
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

const cookieExtractor = (req: Request): string | null => {
    if(req && req.cookies){
        return req.cookies['access_token'];
    }
    return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(private prisma: PrismaService){
        super({
            jwtFromRequest: cookieExtractor,
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
