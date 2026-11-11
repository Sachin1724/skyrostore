import { NextResponse } from "next/server";

/** Ends the admin session: the topbar's Sign out posts here, then returns to /login. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin_token");
  return response;
}
