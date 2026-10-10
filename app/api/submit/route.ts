import { NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/exam.ts";
import { gradeAll } from "@/lib/grade.ts";
import { store } from "@/lib/store.ts";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { name?: unknown; answers?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });

  // Keep only known question ids and short string values.
  const raw = (body?.answers ?? {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const v = raw[q.id];
    if (typeof v === "string") answers[q.id] = v.slice(0, 300);
  }

  const id = crypto.randomUUID().slice(0, 8);
  const submission = { id, name, createdAt: new Date().toISOString(), answers, result: gradeAll(answers) };
  const db = await store();
  await db.save(submission);
  return NextResponse.json({ id });
}
