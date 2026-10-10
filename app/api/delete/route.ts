import { NextResponse } from "next/server";
import { store } from "@/lib/store.ts";

export async function POST(req: Request) {
  const { id, key } = ((await req.json().catch(() => ({}))) ?? {}) as { id?: string; key?: string };
  const required = process.env.TEACHER_KEY;
  if (required && key !== required) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await (await store()).remove(id);
  return NextResponse.json({ ok: true });
}
