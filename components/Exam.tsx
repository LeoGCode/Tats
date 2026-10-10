"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, SECTIONS, type ChoiceQuestion, type Question } from "@/lib/exam.ts";
import { Figure } from "./Figures.tsx";

const DRAFT_KEY = "midterm-draft-v1";

function speak(text: string, rate: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    alert("Tu navegador no puede leer en voz alta. Pide al profesor que lea la oración.");
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("en-US")) ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  synth.speak(u);
}

function Listen({ text }: { text: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button type="button" className="btn small" onClick={() => speak(text, 0.9)} aria-label="Escuchar">🔊 Listen</button>
      <button type="button" className="btn small" onClick={() => speak(text, 0.6)} aria-label="Escuchar despacio">🐢 Slow</button>
    </span>
  );
}

/**
 * A text field the phone keyboard won't correct or suggest words for.
 * autoCorrect / spellCheck alone are ignored by Gboard, but Chromium tells the keyboard a field is a
 * "visible password" once it has ever been type=password, and keyboards then turn off suggestions,
 * autocorrect and learning. So we flip the type to password and straight back to text on mount.
 */
function PlainInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.type = "password";
    el.type = "text";
  }, []);
  return (
    <input
      ref={ref}
      type="text"
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-lpignore="true"
      data-1p-ignore="true"
      data-form-type="other"
      // Turns off inline (grey) predictions in Safari 18+ and Chrome 124+; not in React's types yet.
      {...{ writingsuggestions: "false" }}
      {...props}
    />
  );
}

function QuestionInput({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  if (q.kind === "text") {
    const long = q.section === "J";
    return (
      <div className="q">
        <div className="q-line">
          <span className="num">{q.num}.</span>
          {q.speak && <Listen text={q.speak} />}
          {q.before && <span>{q.before}</span>}
          <span style={{ display: "inline-flex", flexDirection: "column" }}>
            <PlainInput
              className={`blank${long ? " long" : ""}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`Question ${q.section}${q.num}`}
            />
            {q.hint && <span className="hint">({q.hint})</span>}
          </span>
          {q.after && <span>{q.after}</span>}
        </div>
      </div>
    );
  }
  if (q.kind === "sentence") {
    return (
      <div className="q">
        <div className="q-line" style={{ marginBottom: 6 }}>
          <span className="num">{q.num}.</span>
          <span>{q.prompt}</span>
        </div>
        <PlainInput
          className="sentence"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a complete sentence."
          aria-label={`Question ${q.section}${q.num}`}
        />
      </div>
    );
  }
  const showKey = q.section === "D" || q.section === "I" || q.section === "E";
  return (
    <div className="q">
      <div className="q-line">
        <span className="num">{q.num}.</span>
        {q.speak ? <Listen text={q.speak} /> : <span>{q.prompt}</span>}
      </div>
      <div className={`options${["E", "F"].includes(q.section) ? " row" : q.section === "D" ? " letters" : ""}`} role="radiogroup">
        {q.options.map((o) => (
          <label key={o.key} className="opt">
            <input type="radio" name={q.id} checked={value === o.key} onChange={() => onChange(o.key)} />
            {/* Section D lists the answers once above; each question only picks a letter. */}
            <span>{q.section === "D" ? <b>{o.key}</b> : <>{showKey && <b>{o.key}. </b>}{o.text}</>}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Exam() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (d?.name) setName(d.name);
      if (d?.answers) setAnswers(d.answers);
      if (d?.started) setStarted(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, answers, started }));
    } catch {}
  }, [name, answers, started]);

  const answered = useMemo(() => QUESTIONS.filter((q) => (answers[q.id] ?? "").trim()).length, [answers]);

  async function submit() {
    const missing = QUESTIONS.length - answered;
    if (missing > 0 && !confirm(`Te faltan ${missing} pregunta(s). ¿Quieres entregar de todos modos?`)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push(`/review/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Intenta otra vez.");
      setSending(false);
    }
  }

  if (!started) {
    return (
      <div className="wrap">
        <h1>Midterm Test · Units 1–5</h1>
        <p className="sub">Ventures Level 1</p>
        <div className="card">
          <h2>Welcome! / ¡Bienvenido(a)!</h2>
          <p>
            Answer all the questions. At the end you will see your score and an explanation in Spanish for every mistake.
          </p>
          <p className="es">
            Contesta todas las preguntas. Al final verás tu calificación y una explicación en español de cada error. En las
            secciones de Listening, presiona 🔊 para escuchar (usa audífonos).
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStarted(true);
            }}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}
          >
            <input type="text" placeholder="Your name / Tu nombre" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: "1 1 220px" }} autoFocus />
            <button className="btn primary" disabled={!name.trim()}>Start / Empezar →</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrap">
        <h1>Midterm Test · Units 1–5</h1>
        <p className="sub">Name: <b>{name}</b></p>
        {SECTIONS.map((s) => (
          <section key={s.id} className="card" id={`section-${s.id}`}>
            <div className="section-head">
              <span className="badge">{s.id}</span>
              <div>
                <h2>{s.title}</h2>
                <div><b>{s.instructions}</b></div>
                <div className="es">{s.instructionsEs}</div>
              </div>
            </div>
            {s.wordBank && (
              <div className="bank">
                {s.wordBank.map((w) => <span key={w} className="chip">{w}</span>)}
              </div>
            )}
            {s.id === "G" && <p className="small muted" style={{ margin: "0 0 4px" }}>A note to the teacher, Mrs. Spencer, from Mrs. Uchida.</p>}
            {s.id === "D" && (
              <div className="bank" style={{ display: "grid", gap: 4 }}>
                {(QUESTIONS.find((q) => q.id === "D1") as ChoiceQuestion).options.map((o) => (
                  <span key={o.key}><b>{o.key}.</b> {o.text}</span>
                ))}
              </div>
            )}
            <Figure kind={s.figure} />
            {QUESTIONS.filter((q) => q.section === s.id).map((q) => (
              <QuestionInput key={q.id} q={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            ))}
          </section>
        ))}
        {error && <div className="notice">{error}</div>}
      </div>
      <div className="sticky-bar">
        <div className="inner">
          <span className="small">{answered}/{QUESTIONS.length}</span>
          <div className="progress"><div style={{ width: `${(answered / QUESTIONS.length) * 100}%` }} /></div>
          <button className="btn primary" onClick={submit} disabled={sending}>{sending ? "Enviando…" : "Finish / Entregar"}</button>
        </div>
      </div>
    </>
  );
}
