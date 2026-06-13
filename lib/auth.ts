"use server";

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { AuthUser, SessionData, ROLES, UserRole } from "./permissions";

const SESSION_COOKIE = "coffee_session";
const SESSION_TTL = 1000 * 60 * 60 * 8;

export async function login(email: string, password: string): Promise<AuthUser | null> {
  const staff = await prisma.staff.findUnique({
    where: { email },
  });

  if (!staff || staff.password !== password) {
    return null;
  }

  const user: AuthUser = {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role as UserRole,
    storeId: staff.storeId,
  };

  const session: SessionData = {
    user,
    expiresAt: new Date(Date.now() + SESSION_TTL),
  };

  cookies().set(SESSION_COOKIE, Buffer.from(JSON.stringify(session)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return user;
}

export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie) return null;

  try {
    const session = JSON.parse(
      Buffer.from(cookie.value, "base64").toString("utf-8")
    ) as SessionData;

    if (new Date(session.expiresAt) < new Date()) {
      cookies().delete(SESSION_COOKIE);
      return null;
    }

    return session.user;
  } catch {
    cookies().delete(SESSION_COOKIE);
    return null;
  }
}


