import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "./auth";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return jsonError("Não autenticado", 401);
  }
  return session;
}

export function isSession(
  value: SessionPayload | NextResponse,
): value is SessionPayload {
  return "empresaId" in value;
}
