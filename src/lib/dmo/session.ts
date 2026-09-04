import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { DEMO_PASSWORD_DEFAULT } from "./seed";
import { WorkflowError, type Role } from "./types";

const COOKIE = "nm_ex_portal";
const MAX_AGE = 60 * 60 * 12;

export type Session = { participantId: string; role: Role; exp: number };

export function demoPassword(): string {
  return process.env.DEMO_PASSWORD || DEMO_PASSWORD_DEFAULT;
}

function secret(): string {
  return process.env.DEMO_SESSION_SECRET || demoPassword();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): Session | null {
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(mac);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (typeof session.exp !== "number" || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifyDemoPassword(input: string): boolean {
  const expected = Buffer.from(demoPassword());
  const got = Buffer.from(input);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function createSession(participantId: string, role: Role): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encode({ participantId, role, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return value ? decode(value) : null;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireSession(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new WorkflowError("Not signed in.");
  if (roles.length && !roles.includes(session.role)) {
    throw new WorkflowError("Your role is not permitted to do this.");
  }
  return session;
}

export function roleHome(role: Role): string {
  switch (role) {
    case "supplier":
      return "/portal/supplier";
    case "smelter":
      return "/portal/smelter";
    case "buyer":
      return "/portal/buyer";
    case "officer":
      return "/portal/admin";
    case "verifier":
      return "/portal/verify";
  }
}
