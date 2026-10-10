import { headers } from "next/headers";
import QRCode from "qrcode";
import { QUESTIONS, TOPICS, correctAnswerText, questionText, type TopicId } from "@/lib/exam.ts";
import { store } from "@/lib/store.ts";
import Dashboard, { type DashboardData } from "@/components/Dashboard.tsx";

export const dynamic = "force-dynamic";

export default async function Teacher({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (process.env.TEACHER_KEY && key !== process.env.TEACHER_KEY) {
    return (
      <div className="wrap"><div className="card"><h2>Enlace no válido</h2><p>Usa el enlace del profesor con la clave correcta.</p></div></div>
    );
  }

  const db = await store();
  const subs = await db.all();
  const n = subs.length;
  const h = await headers();
  const studentUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/`;

  const questions = QUESTIONS.map((q) => {
    let wrong = 0;
    let spelling = 0;
    let blank = 0;
    const answers = new Map<string, number>();
    for (const s of subs) {
      const g = s.result.items.find((i) => i.id === q.id);
      if (!g || g.status === "correct") continue;
      if (g.status === "spelling") spelling++;
      else if (g.status === "blank") blank++;
      else wrong++;
      const label = g.status === "blank" ? "(en blanco)" : g.given || g.key;
      answers.set(label, (answers.get(label) ?? 0) + 1);
    }
    return {
      id: q.id,
      text: questionText(q),
      correct: correctAnswerText(q),
      wrong,
      spelling,
      blank,
      common: [...answers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      topic: q.topic,
    };
  });

  const topics = (Object.keys(TOPICS) as TopicId[]).map((t) => {
    const rows = questions.filter((r) => r.topic === t);
    const slots = Math.max(1, rows.length * n);
    return {
      id: t,
      label: TOPICS[t],
      count: rows.length,
      wrong: rows.reduce((s, r) => s + r.wrong + r.blank, 0) / slots,
      spelling: rows.reduce((s, r) => s + r.spelling, 0) / slots,
    };
  });

  const data: DashboardData = {
    n,
    avg: n ? subs.reduce((s, x) => s + x.result.score / x.result.total, 0) / n : 0,
    studentUrl,
    qrSvg: await QRCode.toString(studentUrl, { type: "svg", margin: 1, color: { dark: "#000000", light: "#ffffff" } }),
    storeKind: db.kind,
    teacherKey: key,
    generatedAt: new Date().toISOString(),
    questions: questions.map(({ topic: _, ...q }) => q),
    topics,
    students: subs.map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      score: s.result.score,
      total: s.result.total,
      correct: s.result.counts.correct,
      spelling: s.result.counts.spelling,
      wrong: s.result.counts.wrong + s.result.counts.blank,
    })),
  };

  return <Dashboard data={data} />;
}
