import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, createAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, displayName, password } = await req.json();

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
      },
    });

    const token = await signToken({ userId: user.id, username: user.username });
    const cookie = createAuthCookie(token);

    const response = NextResponse.json(
      { user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
