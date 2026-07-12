// api/src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './types/chat.types'; // Use 'import type'
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';


// DTO for a new message
class SendMessageDto {
  conversationId: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', // Your frontend's origin
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  /**
   * Runs when a user connects (after our AuthSocketAdapter authenticated them)
   */
  async handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id} - User: ${client.user.userName}`);

    // 1. Set user status to ONLINE in the database
    const user = await this.prisma.user.update({
      where: { id: client.user.id },
      data: { status: 'ONLINE' },
    });

    // 2. Broadcast to everyone *else* that this user is now online
    client.broadcast.emit('userStatusChange', {
      userId: user.id,
      status: 'ONLINE',
    });

    // 3. Find all conversations this user is a part of
    const conversations = await this.prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: client.user.id,
          },
        },
      },
      select: {
        id: true, // Just get the IDs
      },
    });

    // 4. Have the socket "join" a Socket.IO room for each conversation
    conversations.forEach((convo) => {
      client.join(convo.id);
      console.log(`User ${client.user.userName} joined room: ${convo.id}`);
    });
  }

  /**
   * Runs when a user disconnects
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id} - User: ${client.user.userName}`);
    
    // Check if client.user exists (it might not if auth failed)
    if (client.user) {
      // 1. Set user status to OFFLINE
      const user = await this.prisma.user.update({
        where: { id: client.user.id },
        data: { status: 'OFFLINE' },
      });

      // 2. Broadcast to everyone else that this user is now offline
      client.broadcast.emit('userStatusChange', {
        userId: user.id,
        status: 'OFFLINE',
      });
    }
  }

  /**
   * This is our main message listener
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket, // Get the client's socket
  ) {
    try {
      const user = client.user;

      // 1. Save the new message to the database
      const newMessage = await this.prisma.message.create({
        data: {
          content: dto.content,
          type: 'TEXT', // Default to TEXT
          senderId: user.id,
          conversationId: dto.conversationId,
        },
        include: {
          // Include the sender's info for the frontend
          sender: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
      });

      // 2. Emit the new message *only* to the room for that conversation
      // This sends the message to everyone in the room (including the sender)
      this.server.to(dto.conversationId).emit('newMessage', newMessage);

      console.log(
        `User ${user.userName} sent message to room ${dto.conversationId}`,
      );
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', 'There was an error sending your message.');
    }
  }
}