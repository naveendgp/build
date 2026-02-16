// ============================================================================
// REFACTORED: tracking.gateway.ts — Prisma version
// Replaces @InjectModel(Order) with PrismaService
// ============================================================================
//
// BEFORE (Mongoose):
//   @InjectModel(Order.name) private orderModel: Model<OrderDocument>
//   const activeOrders = await this.orderModel.find(query).select('_id').lean();
//
// AFTER (Prisma):
//   private readonly prisma: PrismaService
//   const activeOrders = await this.prisma.order.findMany({ where, select: { id: true } });
// ============================================================================

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtHelper } from '../auth/jwt.helper';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtHelper: JwtHelper,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers['authorization']?.toString().replace('Bearer ', '');
    const connectionType: any = client.handshake.query.target;

    if (!token) {
      console.log('Unauthorized user tried to connect:', client.id);
      client.disconnect();
      return;
    }

    try {
      const decoded = await this.jwtHelper.verify(token, connectionType);
      client.join((decoded as any).id?.toString() || (decoded as any)._id?.toString());
      console.log(`User ${(decoded as any).id} connected. Socket: ${client.id}`);
    } catch (err) {
      console.log('Invalid token for socket:', client.id);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  publishEventToGroup(groupId: string, payload: any, event: string) {
    this.server.to(groupId).emit(event, payload);
    console.log(`Event '${event}' published to group: ${groupId}`);
  }

  joinUserToGroup(userId: string, groupId: string) {
    const sockets = this.server.sockets.sockets;
    let joinedCount = 0;
    sockets.forEach((socket) => {
      if (socket.rooms.has(userId)) {
        socket.join(groupId);
        joinedCount++;
      }
    });
    console.log(`User ${userId} joined group ${groupId} (${joinedCount} socket(s))`);
    return joinedCount;
  }

  createGroup(socketId: string, groupId: string): boolean {
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) {
      console.log(`Socket ${socketId} not found. Cannot create group ${groupId}`);
      return false;
    }
    socket.join(groupId);
    console.log(`Group '${groupId}' created/joined by socket ${socketId}`);
    return true;
  }

  removeFromGroup(socketId: string, groupId: string): boolean {
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) {
      console.log(`Socket ${socketId} not found. Cannot remove from group ${groupId}`);
      return false;
    }
    socket.leave(groupId);
    console.log(`Socket ${socketId} left group ${groupId}`);
    return true;
  }

  removeUserFromGroup(userId: string, groupId: string): number {
    const sockets = this.server.sockets.sockets;
    let leftCount = 0;
    sockets.forEach((socket) => {
      if (socket.rooms.has(userId) && socket.rooms.has(groupId)) {
        socket.leave(groupId);
        leftCount++;
      }
    });
    console.log(`User ${userId} left group ${groupId} (${leftCount} socket(s))`);
    return leftCount;
  }

  deleteGroup(groupId: string): number {
    const socketsInRoom = this.server.sockets.adapter.rooms.get(groupId);
    if (!socketsInRoom) {
      console.log(`Group ${groupId} does not exist or is already empty`);
      return 0;
    }
    const socketIds = Array.from(socketsInRoom);
    socketIds.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) socket.leave(groupId);
    });
    console.log(`Group '${groupId}' deleted (removed ${socketIds.length} socket(s))`);
    return socketIds.length;
  }

  getGroupMembers(groupId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(groupId);
    return room ? Array.from(room) : [];
  }

  groupExists(groupId: string): boolean {
    const room = this.server.sockets.adapter.rooms.get(groupId);
    return room ? room.size > 0 : false;
  }

  getGroupSize(groupId: string): number {
    const room = this.server.sockets.adapter.rooms.get(groupId);
    return room ? room.size : 0;
  }

  /**
   * Auto-rejoin active order groups on reconnect
   *
   * BEFORE (Mongoose):
   *   const query = { status: { $in: activeStatuses } };
   *   if (role === 'user') query.user_id = userId;
   *   else if (role === 'delivery') query.$or = [{ driver_id_1: userId }, { driver_id_2: userId }];
   *   const activeOrders = await this.orderModel.find(query).select('_id').lean();
   *
   * AFTER (Prisma):
   *   const where = { status: { in: activeStatuses }, ... };
   *   const activeOrders = await this.prisma.order.findMany({ where, select: { id: true } });
   */
  async rejoinActiveOrderGroups(client: Socket, userId: string, role: string) {
    try {
      const activeStatuses = [
        'accepted',
        'driver_assigned',
        'picked_up',
        'out_for_delivery',
        'reached_to_user',
        'reached_to_vendor',
        'processing',
        'verified',
        'delivery_OTP_verified',
      ] as any[];

      let where: any = { status: { in: activeStatuses } };

      if (role === 'user') {
        where.userId = userId;
      } else if (role === 'delivery') {
        where.OR = [{ driverId1: userId }, { driverId2: userId }];
      } else {
        return;
      }

      const activeOrders = await this.prisma.order.findMany({
        where,
        select: { id: true },
      });

      if (activeOrders.length > 0) {
        const orderIds = activeOrders.map((o) => o.id);
        client.join(orderIds);
        console.log(
          `User ${userId} (${role}) auto-joined active order groups: ${orderIds.join(', ')}`,
        );
      }
    } catch (error) {
      console.error(`Error rejoining active order groups for user ${userId}:`, error);
    }
  }
}
