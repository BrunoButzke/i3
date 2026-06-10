import { clearSessionCookie } from "@/lib/auth";
import { jsonOk } from "@/lib/api-utils";

export async function POST() {
  await clearSessionCookie();
  return jsonOk({ ok: true });
}
