import { NextResponse } from 'next/server';
import { CONFIG } from '@/services/config';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 },
      );
    }

    if (password !== '123456') {
      return NextResponse.json(
        { error: '密码错误（演示密码：123456）' },
        { status: 401 },
      );
    }

    if (CONFIG.USE_MOCK) {
      const MOCK_USERS = [
        { id: '1', email: 'manager@beauty.com', name: '张店长', role: 'MANAGER', createdAt: new Date('2024-01-01') },
        { id: '2', email: 'tech1@beauty.com', name: '李美容师', role: 'TECHNICIAN', createdAt: new Date('2024-01-01') },
        { id: '3', email: 'tech2@beauty.com', name: '王美容师', role: 'TECHNICIAN', createdAt: new Date('2024-01-01') },
        { id: '4', email: 'tech3@beauty.com', name: '陈美容师', role: 'TECHNICIAN', createdAt: new Date('2024-01-01') },
      ];
      const found = MOCK_USERS.find(u => u.email === email);
      if (!found) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }
      return NextResponse.json({ user: found });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: `用户不存在，请先运行 npm run db:seed 初始化账号` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[auth/login]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '登录失败' },
      { status: 500 },
    );
  }
}
