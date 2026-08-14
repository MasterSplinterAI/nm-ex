import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "nm_ex_desk";
const MAX_AGE = 60 * 60 * 12;

function deskPassword(): string {
  return process.env.DESK_PASSWORD || "nm-ex-desk";
}

function sessionToken(): string {
  return createHmac("sha256", deskPassword())
    .update("nm-ex-desk-session")
    .digest("hex");
}

export function verifyDeskPassword(input: string): boolean {
  const expected = Buffer.from(deskPassword());
  const got = Buffer.from(input);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

export async function isDeskAuthed(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(sessionToken());
  const got = Buffer.from(value);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

export async function setDeskSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearDeskSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
