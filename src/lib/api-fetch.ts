"use client";

import { useAuthStore } from "@/lib/auth-store";

export function useAuthHeaders() {
  const user = useAuthStore((s) => s.user);
  return {
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id || "",
  } as Record<string, string>;
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (typeof window === "undefined") return fetch(url, options);
  const role = localStorage.getItem("pharmacy_auth_user");
  let roleValue = "";
  let userId = "";
  if (role) {
    try {
      const parsed = JSON.parse(role);
      roleValue = parsed.role;
      userId = parsed.id;
    } catch {}
  }
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (roleValue) headers.set("x-user-role", roleValue);
  if (userId) headers.set("x-user-id", userId);
  return fetch(url, { ...options, headers });
}
