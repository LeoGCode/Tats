"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, Languages, PencilLine, X } from "lucide-react";
import { QUESTION_BY_ID, SECTIONS, questionText } from "@/lib/exam.ts";
import type { Graded, Result, Status } from "@/lib/grade.ts";

const STATUS_LABEL: Record<Status, string> = {
  correct: "Correcta",
  spelling: "Ortografía",
  wrong: "Incorrecta",
  blank: "En blanco",
};

function MistakeCard({ g, dir }: { g: Graded; dir: 1 | -1 }) {
  const q = QUESTION_BY_ID[g.id];
  const section = SECTIONS.find((s) => s.id === q.section)!;
  const heading = useRef<HTMLHeadingElement>(null);
  // Each new mistake starts at the top, with focus on its question.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [g.id]);
  return (
    <div className="card step-enter" style={{ "--dir": dir } as React.CSSProperties}>
      <div className="pills" style={{ marginBottom: 10 }}>
        <span className="pill" style={{ background: "var(--surface-2)" }}>
          {section.id}. {section.title} · #{q.num}
        </span>
        <span className={`pill ${g.status}`}>{g.title ?? STATUS_LABEL[g.status]}</span>
      </div>
      <h3 ref={heading} tabIndex={-1}>{questionText(q)}</h3>
      {q.kind === "text" && q.hint && <div className="hint">({q.hint})</div>}
      <div className="answer-row">
        <span className="muted">Tu respuesta:</span>
        <span className={`yours ${g.status}`}>{g.given || "(en blanco)"}</span>
        <span className="muted">Respuesta correcta:</span>
        <span className="right">{g.correct}</span>
      </div>
      {g.explain && (
        <div className="box explain">
          <b><CircleX aria-hidden size={18} /> ¿Por qué está mal?</b>
          {g.explain}
        </div>
      )}
      {g.sounds && (
        <div className="box sounds">
          <b><Languages aria-hidden size={18} /> Así sonaría en español</b>
          {g.sounds}
        </div>
      )}
      {g.why && (
        <div className="box why">
          <b><CircleCheck aria-hidden size={18} /> La respuesta correcta</b>
          {g.why}
        </div>
      )}
    </div>
  );
}

export default function Review({ name, result }: { name: string; result: Result }) {
  const mistakes = result.items.filter((i) => i.status !== "correct");
  const tips = result.items.filter((i) => i.status === "correct" && i.tip);
  const [step, setStep] = useState(-1);
  const [dir, setDir] = useState<1 | -1>(1);
  const go = (to: number) => {
    setDir(to >= step ? 1 : -1);
    setStep(to);
    if (to < 0) window.scrollTo({ top: 0 });
  };
  const pct = Math.round((result.score / result.total) * 100);

  if (step >= 0 && step < mistakes.length) {
    return (
      <div className="wrap">
        <div className="step-top">
          <button className="btn small" onClick={() => go(-1)}><ArrowLeft aria-hidden size={16} /> Resumen</button>
          <span className="sub" style={{ margin: 0 }}>Error {step + 1} de {mistakes.length}</span>
        </div>
        <div
          className="progress"
          style={{ margin: "10px 0 16px" }}
          role="progressbar"
          aria-label="Errores revisados"
          aria-valuemin={1}
          aria-valuemax={mistakes.length}
          aria-valuenow={step + 1}
        >
          <div style={{ transform: `scaleX(${(step + 1) / mistakes.length})` }} />
        </div>
        <MistakeCard key={step} g={mistakes[step]} dir={dir} />
        <div className="stepper">
          <button className="btn" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft aria-hidden size={16} /> Anterior</button>
          {step < mistakes.length - 1 ? (
            <button className="btn primary" onClick={() => go(step + 1)}>Siguiente <ArrowRight aria-hidden size={16} /></button>
          ) : (
            <button className="btn primary" onClick={() => go(-1)}>Terminar <Check aria-hidden size={16} /></button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1>Resultados de {name}</h1>
      <p className="sub">Midterm Test · Units 1–5</p>
      <div className="card score-hero">
        <div>
          <div className="score-big">{pct}%</div>
          <div className="muted">{result.score} de {result.total} puntos</div>
        </div>
        <div className="pills">
          <span className="pill correct"><Check aria-hidden size={14} /> {result.counts.correct} correctas</span>
          <span className="pill spelling"><PencilLine aria-hidden size={14} /> {result.counts.spelling} ortografía (½ punto)</span>
          <span className="pill wrong"><X aria-hidden size={14} /> {result.counts.wrong} incorrectas</span>
          {result.counts.blank > 0 && <span className="pill blank">{result.counts.blank} en blanco</span>}
        </div>
      </div>

      {mistakes.length > 0 ? (
        <div className="card">
          <h2>Vamos a revisar tus errores</h2>
          <p className="muted">Uno por uno, con la explicación en español.</p>
          <button className="btn primary" onClick={() => go(0)}>Empezar la revisión ({mistakes.length}) <ArrowRight aria-hidden size={16} /></button>
        </div>
      ) : (
        <div className="card"><h2>Sin errores</h2><p>Todas tus respuestas están bien.</p></div>
      )}

      {tips.length > 0 && (
        <div className="card">
          <h3>Detalles para mejorar</h3>
          {tips.map((t) => (
            <div key={t.id} className="list-item small">
              <b>{t.id}</b><span>“{t.given}” — {t.tip}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Todas las respuestas</h3>
        {result.items.map((g) => (
          <div key={g.id} className="list-item small">
            <b style={{ minWidth: 28 }}>{g.id}</b>
            <span className={`pill ${g.status}`}>{STATUS_LABEL[g.status]}</span>
            <span style={{ flex: 1 }}>
              {g.given || "—"}
              {g.status !== "correct" && <span className="muted"> → {g.correct}</span>}
            </span>
            {g.status !== "correct" && (
              <button className="btn small" onClick={() => go(mistakes.indexOf(g))}>Ver</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
