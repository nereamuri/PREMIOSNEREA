"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  createSessionCookieValue,
} from "@/lib/admin-session";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  callbackUrl: string,
  _prev: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const password = (formData.get("password") as string) ?? "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      ok: false,
      error: "ADMIN_PASSWORD no está configurado en el servidor.",
    };
  }

  if (password !== expected) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días, igual que la duración de la firma
  });

  redirect(callbackUrl || "/admin/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/login");
}
