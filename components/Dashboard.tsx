"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, PencilLine, QrCode, RefreshCw, X } from "lucide-react";
import { StackedBars } from "./Bars.tsx";
import { CopyLink, DeleteButton } from "./TeacherTools.tsx";

type QuestionStat = {
  id: string;
  text: string;
  correct: string;
  wrong: number;
  spelling: number;
  blank: number;
  common: [string, number][];
};

type StudentRow = {
  id: string;
  name: string;
  createdAt: string;
  score: number;
  total: number;
  correct: number;
  spelling: number;
  wrong: number;
};

export type DashboardData = {
  n: number;
  avg: number;
  studentUrl: string;
  qrSvg: string;
  storeKind: string;
  teacherKey?: string;
  generatedAt: string;
  questions: QuestionStat[];
  topics: { id: string; label: string; count: number; wrong: number; spelling: number }[];
  students: StudentRow[];
};

type Tab = "resumen" | "preguntas" | "estudiantes";
const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "preguntas", label: "Preguntas" },
  { id: "estudiantes", label: "Estudiantes" },
];

const pct = (x: number) => `${Math.round(x * 100)}%`;
const errors = (q: QuestionStat) => q.wrong + q.spelling + q.blank;
const level = (ratio: number) => (ratio >= 0.8 ? "correct" : ratio >= 0.6 ? "spelling" : "wrong");

/** "hace 3 min" — rendered only after mount so server and client markup match. */
function Ago({ iso, now }: { iso: string; now: number | null }) {
  if (now === null) return null;
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return <>hace {s} s</>;
  if (s < 3600) return <>hace {Math.floor(s / 60)} min</>;
  if (s < 86400) return <>hace {Math.floor(s / 3600)} h</>;
  return <>{new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" })}</>;
}

function QuestionRow({ q, n }: { q: QuestionStat; n: number }) {
  const e = errors(q);
  return (
    <details className="qrow">
      <summary>
        <span className="qid">{q.id}</span>
        <span className="qmain">
          <span className="qtext">{q.text}</span>
          <span className="track" title={`${e} de ${n}`}>
            {q.wrong + q.blank > 0 && <span className="seg s1" style={{ width: `${((q.wrong + q.blank) / n) * 100}%` }} />}
            {q.spelling > 0 && <span className="seg s2" style={{ width: `${(q.spelling / n) * 100}%` }} />}
          </span>
        </span>
        <span className="qpct">{pct(n ? e / n : 0)}</span>
      </summary>
      <div className="qbody">
        <div><span className="muted">Correcta:</span> <b className="right">{q.correct}</b></div>
        <div className="small muted">
          {e} de {n} con error · {q.wrong} incorrectas · {q.spelling} ortografía · {q.blank} en blanco
        </div>
        {q.common.length > 0 && (
          <div className="answers">
            {q.common.map(([a, c]) => (
              <span key={a} className="chip">“{a}” <b>×{c}</b></span>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [onlyErrors, setOnlyErrors] = useState(true);
  const [sort, setSort] = useState<"recent" | "score" | "name">("recent");
  const [showQr, setShowQr] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const { n } = data;

  const refresh = () => startRefresh(() => router.refresh());

  useEffect(() => {
    const h = location.hash.slice(1);
    if (TABS.some((t) => t.id === h)) setTab(h as Tab);
    setNow(Date.now());
    const clock = setInterval(() => setNow(Date.now()), 15_000);
    const poll = setInterval(refresh, 30_000);
    return () => {
      clearInterval(clock);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setNow(Date.now()), [data.generatedAt]);

  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  };

  const byErrors = [...data.questions].sort((a, b) => errors(b) - errors(a));
  const shownQuestions = onlyErrors ? byErrors.filter((q) => errors(q) > 0) : data.questions;
  const hardest = byErrors[0];
  const topics = [...data.topics].sort((a, b) => b.wrong + b.spelling - (a.wrong + a.spelling));
  const students = [...data.students].sort((a, b) =>
    sort === "recent" ? b.createdAt.localeCompare(a.createdAt) : sort === "score" ? b.score - a.score : a.name.localeCompare(b.name, "es"),
  );

  return (
    <>
      <header className="dash-head">
        <div className="dash-head-inner">
          <div style={{ minWidth: 0 }}>
            <h1 className="dash-title">Panel del profesor</h1>
            <div className="small muted">
              {n} {n === 1 ? "examen" : "exámenes"} · actualizado <Ago iso={data.generatedAt} now={now} />
            </div>
          </div>
          <button className="btn small" onClick={refresh} disabled={refreshing} aria-label="Actualizar">
            <RefreshCw aria-hidden size={16} className={refreshing ? "spin" : ""} /> Actualizar
          </button>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => go(t.id)}>
              {t.label}
              {t.id === "estudiantes" && <span className="count">{n}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="wrap dash">
        {data.storeKind !== "redis" && (
          <div className="notice">
            {data.storeKind === "temporary"
              ? "⚠️ No hay base de datos conectada: las respuestas se pierden. En Vercel, agrega Upstash Redis en Storage y vuelve a desplegar."
              : "Modo local: las respuestas se guardan en un archivo de este equipo."}
          </div>
        )}

        {tab === "resumen" && (
          <>
            <div className="card share-card">
              <div className="share-row">
                <div style={{ minWidth: 0 }}>
                  <div className="small muted">Enlace para los estudiantes</div>
                  <div className="share-url">{data.studentUrl.replace(/^https?:\/\//, "")}</div>
                </div>
                <div className="share-actions">
                  <CopyLink url={data.studentUrl} />
                  <button className="btn small" onClick={() => setShowQr((v) => !v)}><QrCode aria-hidden size={16} /> {showQr ? "Ocultar QR" : "QR"}</button>
                </div>
              </div>
              {showQr && (
                <div className="qr">
                  <div dangerouslySetInnerHTML={{ __html: data.qrSvg }} />
                  <div className="small muted">Los estudiantes escanean este código con la cámara.</div>
                </div>
              )}
            </div>

            <div className="tiles">
              <div className="tile"><div className="label">Exámenes</div><div className="value">{n}</div></div>
              <div className="tile"><div className="label">Promedio</div><div className="value">{n ? pct(data.avg) : "—"}</div></div>
              <div className="tile">
                <div className="label">Pregunta más difícil</div>
                <div className="value">{n && errors(hardest) ? hardest.id : "—"}</div>
                {n > 0 && errors(hardest) > 0 && <div className="small muted">{pct(errors(hardest) / n)} con error</div>}
              </div>
              <div className="tile">
                <div className="label">Tema más difícil</div>
                <div className="value value-sm">{n && topics[0].wrong + topics[0].spelling ? topics[0].label : "—"}</div>
              </div>
            </div>

            {n === 0 ? (
              <div className="card"><p style={{ margin: 0 }}>Todavía no hay exámenes. Comparte el enlace o el QR con los estudiantes.</p></div>
            ) : (
              <>
                <section className="card">
                  <h2>Errores por tema</h2>
                  <p className="muted small">Porcentaje de respuestas con error en cada tema.</p>
                  <StackedBars
                    rows={topics.map((t) => ({
                      label: t.label,
                      sub: `${t.count} preg.`,
                      a: t.wrong,
                      b: t.spelling,
                      title: `${t.label}: ${pct(t.wrong)} incorrectas, ${pct(t.spelling)} ortografía`,
                    }))}
                  />
                </section>

                <section className="card">
                  <h2>Las 5 preguntas más difíciles</h2>
                  <p className="muted small">Toca una pregunta para ver qué escribieron.</p>
                  <div className="qlist">
                    {byErrors.slice(0, 5).filter((q) => errors(q) > 0).map((q) => <QuestionRow key={q.id} q={q} n={n} />)}
                  </div>
                  <button className="btn small" style={{ marginTop: 12 }} onClick={() => go("preguntas")}>Ver todas las preguntas →</button>
                </section>
              </>
            )}
          </>
        )}

        {tab === "preguntas" && (
          <section className="card">
            <div className="toolbar">
              <h2 style={{ margin: 0 }}>Preguntas</h2>
              <div className="seg-control">
                <button aria-pressed={onlyErrors} onClick={() => setOnlyErrors(true)}>Más errores</button>
                <button aria-pressed={!onlyErrors} onClick={() => setOnlyErrors(false)}>En orden</button>
              </div>
            </div>
            <div className="legend">
              <span><i style={{ background: "var(--series-1)" }} />Incorrecta / en blanco</span>
              <span><i style={{ background: "var(--series-2)" }} />Ortografía</span>
            </div>
            {n === 0 ? (
              <p className="muted">Todavía no hay exámenes.</p>
            ) : shownQuestions.length === 0 ? (
              <p>¡Nadie ha fallado ninguna pregunta!</p>
            ) : (
              <div className="qlist">{shownQuestions.map((q) => <QuestionRow key={q.id} q={q} n={n} />)}</div>
            )}
          </section>
        )}

        {tab === "estudiantes" && (
          <section>
            <div className="toolbar">
              <h2 style={{ margin: 0 }}>Estudiantes</h2>
              <div className="seg-control">
                <button aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Recientes</button>
                <button aria-pressed={sort === "score"} onClick={() => setSort("score")}>Nota</button>
                <button aria-pressed={sort === "name"} onClick={() => setSort("name")}>Nombre</button>
              </div>
            </div>
            {n === 0 && <div className="card"><p style={{ margin: 0 }}>Todavía no hay exámenes.</p></div>}
            <div className="slist">
              {students.map((s) => (
                <div key={s.id} className="scard">
                  <a className="scard-main" href={`/review/${s.id}`}>
                    <span className={`score-badge ${level(s.score / s.total)}`}>{pct(s.score / s.total)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="sname-row">
                        <span className="sname">{s.name}</span>
                        <span className="small muted nowrap"><Ago iso={s.createdAt} now={now} /></span>
                      </span>
                      <span className="small muted stats">
                        <span><Check aria-hidden size={13} /> {s.correct}</span>
                        <span><PencilLine aria-hidden size={13} /> {s.spelling}</span>
                        <span><X aria-hidden size={13} /> {s.wrong}</span>
                      </span>
                    </span>
                    <ChevronRight aria-hidden size={20} className="chev" />
                  </a>
                  <DeleteButton id={s.id} name={s.name} teacherKey={data.teacherKey} />
                </div>
              ))}
            </div>
            {n > 0 && (
              <p className="small muted">
                <Check aria-hidden size={13} /> correctas · <PencilLine aria-hidden size={13} /> ortografía · <X aria-hidden size={13} /> incorrectas o en blanco. Toca un estudiante para ver su examen con las explicaciones.
              </p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
