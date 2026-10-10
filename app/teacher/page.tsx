import { headers } from "next/headers";
import { QUESTIONS, TOPICS, correctAnswerText, questionText, type TopicId } from "@/lib/exam.ts";
import { store } from "@/lib/store.ts";
import { StackedBars, type BarRow } from "@/components/Bars.tsx";
import { CopyLink, DeleteButton, AutoRefresh } from "@/components/TeacherTools.tsx";

export const dynamic = "force-dynamic";

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default async function Teacher({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (process.env.TEACHER_KEY && key !== process.env.TEACHER_KEY) {
    return (
      <div className="wrap"><div className="card"><h2>Enlace no válido</h2><p>Usa el enlace del profesor con la clave correcta.</p></div></div>
    );
  }

  const db = await store();
  const subs = (await db.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const n = subs.length;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  // Per-question stats
  const perQ = QUESTIONS.map((q) => {
    let wrong = 0;
    let spelling = 0;
    const answers = new Map<string, number>();
    for (const s of subs) {
      const g = s.result.items.find((i) => i.id === q.id);
      if (!g || g.status === "correct") continue;
      if (g.status === "spelling") spelling++;
      else wrong++;
      const label = g.status === "blank" ? "(en blanco)" : g.given || g.key;
      answers.set(label, (answers.get(label) ?? 0) + 1);
    }
    const common = [...answers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { q, wrong, spelling, common };
  });

  // Per-topic stats
  const topics = (Object.keys(TOPICS) as TopicId[]).map((t) => {
    const rows = perQ.filter((r) => r.q.topic === t);
    const slots = Math.max(1, rows.length * n);
    return {
      t,
      count: rows.length,
      wrong: rows.reduce((s, r) => s + r.wrong, 0) / slots,
      spelling: rows.reduce((s, r) => s + r.spelling, 0) / slots,
    };
  });

  const avg = n ? subs.reduce((s, x) => s + x.result.score / x.result.total, 0) / n : 0;
  const hardest = [...perQ].sort((a, b) => b.wrong + b.spelling - (a.wrong + a.spelling))[0];
  const hardestTopic = [...topics].sort((a, b) => b.wrong + b.spelling - (a.wrong + a.spelling))[0];

  const qRows: BarRow[] = [...perQ]
    .filter((r) => r.wrong + r.spelling > 0)
    .sort((a, b) => b.wrong + b.spelling - (a.wrong + a.spelling))
    .map((r) => ({
      label: r.q.id,
      sub: questionText(r.q),
      a: n ? r.wrong / n : 0,
      b: n ? r.spelling / n : 0,
      title: `${r.q.id}: ${r.wrong} incorrectas / en blanco, ${r.spelling} ortografía de ${n}`,
    }));
  const tRows: BarRow[] = [...topics]
    .sort((a, b) => b.wrong + b.spelling - (a.wrong + a.spelling))
    .map((t) => ({
      label: TOPICS[t.t],
      sub: `${t.count} preg.`,
      a: t.wrong,
      b: t.spelling,
      title: `${TOPICS[t.t]}: ${pct(t.wrong)} incorrectas, ${pct(t.spelling)} ortografía`,
    }));

  const keyParam = key ? `?key=${encodeURIComponent(key)}` : "";

  return (
    <div className="wrap wide">
      <AutoRefresh seconds={30} />
      <h1>Panel del profesor</h1>
      <p className="sub">Midterm Test · Units 1–5 · se actualiza cada 30 s</p>

      {db.kind !== "redis" && (
        <div className="notice">
          {db.kind === "temporary"
            ? "⚠️ No hay base de datos conectada: las respuestas se pierden. En Vercel, agrega Upstash Redis en Storage y vuelve a desplegar."
            : "Modo local: las respuestas se guardan en un archivo de este equipo."}
        </div>
      )}

      <div className="card">
        <h3>Enlace para los estudiantes</h3>
        <div className="share">
          <code>{origin}/</code>
          <CopyLink url={`${origin}/`} />
        </div>
      </div>

      <div className="tiles">
        <div className="tile"><div className="label">Exámenes entregados</div><div className="value">{n}</div></div>
        <div className="tile"><div className="label">Promedio</div><div className="value">{n ? pct(avg) : "—"}</div></div>
        <div className="tile">
          <div className="label">Pregunta más difícil</div>
          <div className="value">{n && hardest.wrong + hardest.spelling ? hardest.q.id : "—"}</div>
          {n > 0 && hardest.wrong + hardest.spelling > 0 && (
            <div className="small muted">{pct((hardest.wrong + hardest.spelling) / n)} con error</div>
          )}
        </div>
        <div className="tile">
          <div className="label">Tema más difícil</div>
          <div className="value" style={{ fontSize: "1.1rem", paddingTop: 6 }}>
            {n && hardestTopic.wrong + hardestTopic.spelling ? TOPICS[hardestTopic.t] : "—"}
          </div>
        </div>
      </div>

      {n === 0 ? (
        <div className="card"><p>Todavía no hay exámenes. Comparte el enlace con los estudiantes.</p></div>
      ) : (
        <>
          <div className="card">
            <h2>Errores por tema</h2>
            <p className="muted small">Porcentaje de respuestas con error en cada tema.</p>
            <StackedBars rows={tRows} />
          </div>

          <div className="card">
            <h2>Preguntas con más errores</h2>
            <p className="muted small">Porcentaje de estudiantes que fallaron cada pregunta. Se muestran las 12 con más errores.</p>
            {qRows.length ? <StackedBars rows={qRows.slice(0, 12)} /> : <p>¡Nadie ha fallado ninguna pregunta!</p>}
            {qRows.length > 12 && (
              <details style={{ marginTop: 12 }}>
                <summary>Ver las otras {qRows.length - 12} preguntas</summary>
                <div style={{ marginTop: 10 }}><StackedBars rows={qRows.slice(12)} /></div>
              </details>
            )}
          </div>

          <div className="card">
            <h2>Respuestas equivocadas más comunes</h2>
            <div className="scroll-x">
              <table className="data">
                <thead><tr><th>#</th><th>Pregunta</th><th>Correcta</th><th>Errores</th><th>Lo que escribieron</th></tr></thead>
                <tbody>
                  {perQ.filter((r) => r.wrong + r.spelling > 0).map((r) => (
                    <tr key={r.q.id}>
                      <td><b>{r.q.id}</b></td>
                      <td>{questionText(r.q)}</td>
                      <td>{correctAnswerText(r.q)}</td>
                      <td>{r.wrong + r.spelling}/{n}</td>
                      <td>{r.common.map(([a, c]) => `“${a}” ×${c}`).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>Estudiantes</h2>
            <div className="scroll-x">
              <table className="data">
                <thead><tr><th>Nombre</th><th>Calificación</th><th>✓</th><th>✎</th><th>✗</th><th>Fecha</th><th></th></tr></thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td><b>{s.name}</b></td>
                      <td>{pct(s.result.score / s.result.total)} <span className="muted small">({s.result.score}/{s.result.total})</span></td>
                      <td>{s.result.counts.correct}</td>
                      <td>{s.result.counts.spelling}</td>
                      <td>{s.result.counts.wrong + s.result.counts.blank}</td>
                      <td className="small">{new Date(s.createdAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: process.env.TZ_DISPLAY ?? "America/Chicago" })}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <a className="btn small" href={`/review/${s.id}`} target="_blank">Ver</a>{" "}
                        <DeleteButton id={s.id} name={s.name} teacherKey={key} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <p className="small muted">Enlace de este panel: {origin}/teacher{keyParam}</p>
    </div>
  );
}
