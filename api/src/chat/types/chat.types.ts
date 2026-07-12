import { Socket } from 'socket.io';
import type { User } from '@prisma/client';

// This is our custom socket that includes the user
export type AuthenticatedSocket = Socket & {
  user: User;
};
