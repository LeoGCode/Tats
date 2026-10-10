"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, SECTIONS, type ChoiceQuestion, type Question } from "@/lib/exam.ts";
import { ArrowRight, LoaderCircle, RotateCw, Send, Snail, Volume2 } from "lucide-react";
import { Figure } from "./Figures.tsx";

const DRAFT_KEY = "midterm-draft-v1";

/** Reads the sentence aloud. Returns false when this browser has no voice. */
function speak(text: string, rate: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("en-US")) ?? synth.getVoices().find((v) => v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  synth.speak(u);
  return true;
}

function Listen({ text }: { text: string }) {
  const [unsupported, setUnsupported] = useState(false);
  const play = (rate: number) => setUnsupported(!speak(text, rate));
  return (
    <>
      <div className="listen">
        <button type="button" className="btn listen-btn" onClick={() => play(0.9)} aria-label="Escuchar">
          <Volume2 aria-hidden size={18} /> Listen
        </button>
        <button type="button" className="btn listen-btn" onClick={() => play(0.6)} aria-label="Escuchar despacio">
          <Snail aria-hidden size={18} /> Slow
        </button>
      </div>
      {unsupported && (
        <p className="listen-note" role="status">Este navegador no puede leer en voz alta. Pide al profesor que lea la oración.</p>
      )}
    </>
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

/** Text after a blank: no space before punctuation ("?", ".", ", Mrs. Uchida"). */
const joinAfter = (after: string) => (/^[.,?!]/.test(after) ? after : ` ${after}`);

function QuestionInput({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  const label = `Question ${q.section}${q.num}`;
  return (
    <div className="q" id={`q-${q.id}`}>
      <span className="num" aria-hidden>{q.num}</span>
      <div className="q-body">
        {q.speak && <Listen text={q.speak} />}

        {q.kind === "text" && (
          <>
            {/* The blank sits inside the sentence, like the printed test. */}
            <p className="sentence-line">
              {q.before && `${q.before} `}
              <PlainInput
                className={`blank${q.section === "J" ? " long" : ""}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
              />
              {q.after && joinAfter(q.after)}
            </p>
            {q.hint && (
              <p className="hint">
                {q.hint.split(" / ").map((h, i) => (
                  <span key={h}>{i > 0 && <span className="hint-sep">or</span>}<b>{h}</b></span>
                ))}
              </p>
            )}
          </>
        )}

        {q.kind === "sentence" && (
          <>
            <p className="prompt">{q.prompt}</p>
            <PlainInput
              className="blank full"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write a complete sentence…"
              aria-label={label}
            />
          </>
        )}

        {q.kind === "choice" && <Choices q={q} value={value} onChange={onChange} />}
      </div>
    </div>
  );
}

function Choices({ q, value, onChange }: { q: ChoiceQuestion; value: string; onChange: (v: string) => void }) {
  // D: pick a letter from the list above. F: Yes / No. Others: full options with their letter.
  const variant = q.section === "D" ? "letters" : q.section === "F" ? "yesno" : "list";
  const picked = q.options.find((o) => o.key === value);
  return (
    <>
      {!q.speak && <p className="prompt">{q.prompt}</p>}
      <div className={`choices ${variant}`} role="radiogroup" aria-label={`Question ${q.section}${q.num}`}>
        {q.options.map((o) => (
          <label key={o.key} className="choice">
            <input type="radio" className="choice-input" name={q.id} value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} />
            {variant !== "yesno" && <span className="key">{o.key}</span>}
            {variant !== "letters" && <span className="choice-text">{o.text}</span>}
          </label>
        ))}
      </div>
      {variant === "letters" && picked && (
        <p className="picked"><ArrowRight aria-hidden size={14} /> {picked.text}</p>
      )}
    </>
  );
}

export default function Exam() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

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

  const missing = QUESTIONS.length - answered;

  function goToFirstBlank() {
    setConfirming(false);
    const q = QUESTIONS.find((x) => !(answers[x.id] ?? "").trim());
    const el = q && document.getElementById(`q-${q.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLInputElement>("input:not([type=radio])")?.focus({ preventScroll: true });
  }

  async function submit(force = false) {
    // With blanks left, the first tap asks inside the bar instead of a browser dialog.
    if (missing > 0 && !force) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
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
      setError(e instanceof Error && e.message !== "Error" ? e.message : "No se pudo entregar. Revisa tu conexión.");
      setSending(false);
    }
  }

  if (!started) {
    return (
      <main className="wrap start">
        <h1 className="display">Midterm Test<br />Units 1–5</h1>
        <p className="lead">
          50 questions: listening, grammar, reading and writing. When you finish, you&apos;ll see your score and an
          explanation in Spanish for every mistake.
        </p>
        <p className="es">
          50 preguntas. Al terminar verás tu calificación y una explicación en español de cada error. En Listening, toca
          <span className="inline-icon"><Volume2 aria-hidden size={16} /> Listen</span> para escuchar (usa audífonos).
        </p>
        <form
          className="start-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStarted(true);
          }}
        >
          <label className="field-label" htmlFor="student-name">Your name / Tu nombre</label>
          <input
            id="student-name"
            type="text"
            className="field"
            placeholder="e.g. María López"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <button className="btn primary big" disabled={!name.trim()}>
            Start / Empezar <ArrowRight aria-hidden size={18} />
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <main className="wrap exam">
        <header className="exam-head">
          <h1 className="display small-display">Midterm Test · Units 1–5</h1>
          <p className="muted">Name: <b className="ink">{name}</b></p>
        </header>
        {SECTIONS.map((s) => (
          <section key={s.id} className="section" id={`section-${s.id}`} aria-labelledby={`title-${s.id}`}>
            <header className="section-head">
              <span className="badge" aria-hidden>{s.id}</span>
              <div>
                <h2 id={`title-${s.id}`}>{s.title}</h2>
                <p className="instructions">{s.instructions}</p>
                <p className="es">{s.instructionsEs}</p>
              </div>
            </header>
            {s.wordBank && (
              <div className="bank" aria-label="Word box">
                {s.wordBank.map((w) => <span key={w} className="chip">{w}</span>)}
              </div>
            )}
            {s.id === "G" && <p className="small muted">A note to the teacher, Mrs. Spencer, from Mrs. Uchida.</p>}
            {s.id === "D" && (
              <ol className="answer-list" aria-label="Answers">
                {(QUESTIONS.find((q) => q.id === "D1") as ChoiceQuestion).options.map((o) => (
                  <li key={o.key}><span className="key">{o.key}</span>{o.text}</li>
                ))}
              </ol>
            )}
            <Figure kind={s.figure} />
            <div className="questions">
              {QUESTIONS.filter((q) => q.section === s.id).map((q) => (
                <QuestionInput key={q.id} q={q} value={answers[q.id] ?? ""} onChange={(v) => {
                    setConfirming(false);
                    setAnswers((a) => ({ ...a, [q.id]: v }));
                  }} />
              ))}
            </div>
          </section>
        ))}
      </main>
      <div className="sticky-bar">
        <div className="inner" aria-live="polite">
          {confirming ? (
            <>
              <p className="bar-message"><b>Te faltan {missing} {missing === 1 ? "pregunta" : "preguntas"}</b>¿Entregar de todos modos?</p>
              <div className="bar-actions">
                <button className="btn" onClick={goToFirstBlank}>Ir a la primera</button>
                <button className="btn primary" onClick={() => submit(true)}>Entregar</button>
              </div>
            </>
          ) : error ? (
            <>
              <p className="bar-message bar-error" role="alert"><b>No se entregó</b>{error}</p>
              <button className="btn primary" onClick={() => submit(true)}><RotateCw aria-hidden size={16} /> Reintentar</button>
            </>
          ) : (
            <>
              <span className="count" aria-label={`${answered} of ${QUESTIONS.length} answered`}>{answered}/{QUESTIONS.length}</span>
              <div className={`progress${missing === 0 ? " done" : ""}`} aria-hidden>
                <div style={{ transform: `scaleX(${answered / QUESTIONS.length})` }} />
              </div>
              <button className="btn primary submit-btn" onClick={() => submit()} disabled={sending} aria-busy={sending}>
                {sending ? <><LoaderCircle aria-hidden size={16} className="spin" /> Enviando…</> : <>Finish / Entregar <Send aria-hidden size={16} /></>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
