import { PrismaClient, UserRole, RoomStatus, OrderStatus, CleaningStatus, ChannelType, ConflictRiskLevel, ConflictStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@rms.com',
      passwordHash: hashedPassword,
      fullName: '系统管理员',
      phone: '13800000000',
      role: UserRole.ADMIN,
      department: '技术部',
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@rms.com',
      passwordHash: hashedPassword,
      fullName: '张经理',
      phone: '13800000001',
      role: UserRole.MANAGER,
      department: '运营部',
    },
  });

  const frontline1 = await prisma.user.upsert({
    where: { username: 'frontline1' },
    update: {},
    create: {
      username: 'frontline1',
      email: 'frontline1@rms.com',
      passwordHash: hashedPassword,
      fullName: '李前台',
      phone: '13800000002',
      role: UserRole.FRONTLINE,
      department: '前台组',
    },
  });

  const frontline2 = await prisma.user.upsert({
    where: { username: 'frontline2' },
    update: {},
    create: {
      username: 'frontline2',
      email: 'frontline2@rms.com',
      passwordHash: hashedPassword,
      fullName: '王保洁',
      phone: '13800000003',
      role: UserRole.FRONTLINE,
      department: '保洁组',
    },
  });

  const property1 = await prisma.property.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '海景度假民宿',
      address: '三亚市海棠湾海景路88号',
      city: '三亚',
      district: '海棠区',
      totalRooms: 10,
      description: '一线海景豪华民宿',
      managerId: manager.id,
    },
  });

  const property2 = await prisma.property.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '山景雅居',
      address: '杭州市西湖区龙井路168号',
      city: '杭州',
      district: '西湖区',
      totalRooms: 8,
      description: '茶山竹海间的雅致民宿',
      managerId: manager.id,
    },
  });

  const roomTypes = ['豪华海景大床房', '标准双床房', '家庭套房', '蜜月房'];
  for (let i = 1; i <= 10; i++) {
    await prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property1.id, roomNumber: `H${100 + i}` } },
      update: {},
      create: {
        propertyId: property1.id,
        roomNumber: `H${100 + i}`,
        roomType: roomTypes[i % roomTypes.length],
        floor: Math.floor(i / 4) + 1,
        pricePerNight: 580 + (i % 3) * 100,
      },
    });
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: property2.id, roomNumber: `S${200 + i}` } },
      update: {},
      create: {
        propertyId: property2.id,
        roomNumber: `S${200 + i}`,
        roomType: roomTypes[i % roomTypes.length],
        floor: Math.floor(i / 4) + 1,
        pricePerNight: 480 + (i % 3) * 80,
      },
    });
  }

  const today = new Date();
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    
    for (let r = 1; r <= 10; r++) {
      const statusSeed = (d + r) % 7;
      let status = RoomStatus.AVAILABLE;
      if (statusSeed === 0 || statusSeed === 1) status = RoomStatus.OCCUPIED;
      else if (statusSeed === 2) status = RoomStatus.CLEANING;

      await prisma.roomCalendar.upsert({
        where: { roomId_date: { roomId: r, date } },
        update: {},
        create: {
          propertyId: property1.id,
          roomId: r,
          date,
          status,
          price: 580 + (r % 3) * 100,
        },
      });
    }
  }

  const channels: ChannelType[] = [ChannelType.AIRBNB, ChannelType.BOOKING_COM, ChannelType.MEITUAN, ChannelType.DIRECT];
  const statuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.CHECKED_IN, OrderStatus.PENDING, OrderStatus.CHECKED_OUT];

  for (let i = 1; i <= 15; i++) {
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + (i % 10) - 3);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 2 + (i % 3));
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    await prisma.channelOrder.upsert({
      where: { orderNo: `ORD${2024000 + i}` },
      update: {},
      create: {
        orderNo: `ORD${2024000 + i}`,
        propertyId: property1.id,
        roomId: (i % 10) + 1,
        channel: channels[i % channels.length],
        channelOrderNo: `CH${10000 + i}`,
        guestName: `客人${i}`,
        guestPhone: `1390000${String(i).padStart(4, '0')}`,
        guestCount: 1 + (i % 4),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights,
        totalAmount: 580 * nights,
        status: statuses[i % statuses.length],
        specialRequests: i % 3 === 0 ? '需要加床' : null,
        createdById: frontline1.id,
      },
    });
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.cleaningTask.upsert({
      where: { taskNo: `CLN${2024000 + i}` },
      update: {},
      create: {
        taskNo: `CLN${2024000 + i}`,
        propertyId: property1.id,
        roomId: (i % 10) + 1,
        status: [CleaningStatus.PENDING, CleaningStatus.ASSIGNED, CleaningStatus.IN_PROGRESS, CleaningStatus.COMPLETED][i % 4],
        priority: i % 3,
        assignedToId: i % 2 === 0 ? frontline2.id : null,
        createdById: frontline1.id,
        scheduledAt: new Date(today.getTime() + i * 3600000),
        remarks: i % 4 === 0 ? '重点清洁卫生间' : null,
      },
    });
  }

  const conflictTypes = ['日期重叠', '渠道冲突', '房型不匹配', '价格异常'];
  const riskLevels: ConflictRiskLevel[] = [ConflictRiskLevel.LOW, ConflictRiskLevel.MEDIUM, ConflictRiskLevel.HIGH, ConflictRiskLevel.CRITICAL];

  for (let i = 1; i <= 6; i++) {
    await prisma.roomConflict.upsert({
      where: { conflictNo: `CNF${2024000 + i}` },
      update: {},
      create: {
        conflictNo: `CNF${2024000 + i}`,
        propertyId: property1.id,
        roomId: (i % 10) + 1,
        orderId: i <= 5 ? i : null,
        conflictType: conflictTypes[i % conflictTypes.length],
        description: `${conflictTypes[i % conflictTypes.length]} - 需要立即处理`,
        riskLevel: riskLevels[i % riskLevels.length],
        status: i % 3 === 0 ? ConflictStatus.RESOLVED : ConflictStatus.OPEN,
        createdById: frontline1.id,
        handledById: i > 3 ? manager.id : null,
      },
    });
  }

  console.log('数据播种完成!');
  console.log('测试账号:');
  console.log('  管理员: admin / password123');
  console.log('  经理: manager / password123');
  console.log('  前台: frontline1 / password123');
  console.log('  保洁: frontline2 / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
