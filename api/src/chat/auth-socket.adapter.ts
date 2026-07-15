// api/src/chat/auth-socket.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { Server, ServerOptions } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as cookie from 'cookie';
import { AuthenticatedSocket } from './types/chat.types';

export class AuthSocketAdapter extends IoAdapter {
  private readonly jwtService: JwtService;
  private readonly prisma: PrismaService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.jwtService = this.app.get(JwtService);
    this.prisma = this.app.get(PrismaService);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server: Server = super.createIOServer(port, options);

    server.use(async (socket: any, next) => {
      console.log('--- New WebSocket Connection Attempt ---');
      try {
        // 1. Try to get token from cookie, then headers/auth
        const cookieString = socket.handshake.headers.cookie;

        let token: string | undefined;

        // Try cookie first
        if (cookieString) {
          console.log('Found cookie header:', cookieString);
          const parsedCookies = cookie.parse(cookieString);
          token = parsedCookies['access_token'];
        }

        // If no cookie token, try socket.handshake.auth.token
        if (!token && (socket.handshake as any)?.auth?.token) {
          token = (socket.handshake as any).auth.token;
        }

        // If still no token, try Authorization header
        if (!token) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader && typeof authHeader === 'string') {
            // expected: "Bearer <token>" or just token
            token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : authHeader;
          }
        }

        if (!token) {
          console.error('Auth Error: No token found in cookie/headers/auth.');
          return next(new Error('Authentication error: No token provided.'));
        }

        console.log('Extracted token:', token.substring(0, 10) + '...');

        // 2. Verify the JWT
        console.log('Verifying token...');
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        console.log('Token valid. Payload:', payload);

        // 3. Find the user
        console.log(`Finding user with ID: ${payload.sub}`);
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });


        if (!user) {
          console.error('Auth Error: User not found in database.');
          return next(new Error('Authentication error: User not found.'));
        }
        console.log('User found:', user.email);

        // 5. ATTACH THE USER
        socket.user = user;
        console.log('--- Authentication Successful ---');
        next(); // Handshake successful!
      } catch (error: any) {
        console.error('Auth Error (Catch Block):', error?.message ?? error);
        next(new Error('Authentication error: Invalid token.'));
      }
    });

    return server;
  }
}
