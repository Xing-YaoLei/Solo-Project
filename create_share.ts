import { prisma } from './lib/prisma';
import { generateToken } from './lib/utils';

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'investor' } });
  console.log('Found user:', user?.id, user?.email);
  
  const token = `investor_${generateToken().slice(0, 20)}`;
  
  const hotels = await prisma.hotel.findMany({ take: 5, select: { id: true, name: true } });
  
  const created = await prisma.shareLink.create({
    data: {
      token,
      userId: user!.id,
      role: 'investor',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      dataScope: {
        role: 'investor',
        hotelIds: hotels.map(h => h.id),
        canViewAllHotels: true,
        canViewDetails: true,
        canExport: true,
      },
    },
  });
  
  console.log('\nCreated ShareLink:');
  console.log('  token:', token);
  console.log('  id:', created.id);
  console.log('  expiresAt:', created.expiresAt);
  console.log('\n测试命令:');
  console.log(`curl -s -H "X-Share-Token: ${token}" http://localhost:3000/api/dashboard | python3 -m json.tool`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
