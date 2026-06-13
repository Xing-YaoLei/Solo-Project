import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const mockUsers = [
      { id: '1', email: 'manager@beauty.com', name: '张店长', role: 'MANAGER' },
      { id: '2', email: 'tech1@beauty.com', name: '李美容师', role: 'TECHNICIAN' },
      { id: '3', email: 'tech2@beauty.com', name: '王美容师', role: 'TECHNICIAN' },
      { id: '4', email: 'tech3@beauty.com', name: '陈美容师', role: 'TECHNICIAN' },
    ];

    const user = mockUsers.find(u => u.email === email);

    if (!user || password !== '123456') {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        createdAt: new Date(),
      },
      token: 'mock-jwt-token',
    });
  } catch (error) {
    return NextResponse.json(
      { error: '请求参数错误' },
      { status: 400 }
    );
  }
}
