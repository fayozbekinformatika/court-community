// api/src/conversations/conversations.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  private async isUserInConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: { select: { id: true } } },
    });
    if (!conversation || !conversation.users.some(u => u.id === userId)) {
      throw new ForbiddenException('You are not part of this conversation.');
    }
  }

  /**
   * Finds or creates a 1-on-1 conversation between two users.
   */
  async findOrCreate(currentUserId: string, otherUserId: string) {
    // 1. Try to find an existing 1-on-1 conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false, // Must be a 1-on-1 chat
        AND: [
          { users: { some: { id: currentUserId } } }, // User A is in the chat
          { users: { some: { id: otherUserId } } }, // User B is in the chat
        ],
      },
      include: {
        users: { // Include user details
          select: { id: true, userName: true, profileImage: true },
        },
      },
    });

    // 2. If no conversation exists, create one
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          isGroup: false,
          users: {
            // Connect both users to this new conversation
            connect: [{ id: currentUserId }, { id: otherUserId }],
          },
        },
        include: {
          users: {
            select: { id: true, userName: true, profileImage: true },
          },
        },
      });
    }

    // 3. Return the conversation
    return conversation;
  }

  async getMessages(userId: string, conversationId: string) {
    // 1. Check if the user is allowed to see these messages
    await this.isUserInConversation(userId, conversationId);

    // 2. Fetch all messages for that conversation
    return this.prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        // Include the sender's details
        sender: {
          select: {
            id: true,
            userName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Show oldest messages first
      },
    });
  }
}