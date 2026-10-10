import {
  QUESTIONS,
  correctAnswerText,
  type ChoiceQuestion,
  type Question,
  type SentenceQuestion,
  type TextQuestion,
} from "./exam.ts";

export type Status = "correct" | "spelling" | "wrong" | "blank";

export type Graded = {
  id: string;
  status: Status;
  points: number;
  given: string;
  /** Normalized answer, used to group common wrong answers for the teacher. */
  key: string;
  correct: string;
  /** Short title for the error, in Spanish. */
  title?: string;
  explain?: string;
  sounds?: string;
  why?: string;
  /** Small writing tip shown even when the answer is accepted. */
  tip?: string;
};

export type Result = {
  score: number;
  total: number;
  counts: Record<Status, number>;
  items: Graded[];
};

/** Points for an answer that is right except for its spelling. */
export const SPELLING_POINTS = 0.5;

/** Edit distance where swapping two neighbouring letters ("dose"/"does") counts as one typo. */
export function levenshtein(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** How many typos still count as "the same word, misspelled". */
function tolerance(word: string) {
  if (word.length <= 3) return 0;
  if (word.length <= 5) return 1;
  if (word.length <= 9) return 2;
  return 3;
}

const clean = (s: string) =>
  s
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s.,!?;:"]+|[\s.,!?;:"]+$/g, "");

function gradeText(q: TextQuestion, raw: string): Graded {
  const given = clean(raw);
  const lower = given.toLowerCase();
  const correct = q.answers[0];
  const base: Graded = { id: q.id, status: "wrong", points: 0, given: raw.trim(), key: lower, correct, why: q.why };

  if (q.answers.includes(given) || (!q.caseSensitive && q.answers.some((a) => a.toLowerCase() === lower))) {
    return { ...base, status: "correct", points: 1, key: correct.toLowerCase() };
  }
  if (q.answers.some((a) => a.toLowerCase() === lower)) {
    return {
      ...base,
      status: "spelling",
      points: SPELLING_POINTS,
      key: `${lower} (mayúscula)`,
      title: "Error de mayúscula",
      explain: q.caseTip ?? `Se escribe con mayúscula: ${correct}.`,
    };
  }

  // Closest candidate: a correct answer, a known mistake, or another word from the bank.
  const candidates: { word: string; kind: "answer" | "mistake" | "bank" }[] = [
    ...q.answers.map((w) => ({ word: w.toLowerCase(), kind: "answer" as const })),
    ...Object.keys(q.mistakes ?? {}).map((w) => ({ word: w, kind: "mistake" as const })),
    ...Object.keys(q.spanish?.words ?? {})
      .filter((w) => !q.answers.some((a) => a.toLowerCase() === w))
      .map((w) => ({ word: w, kind: "bank" as const })),
  ];
  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(lower, c.word);
    // Prefer known mistakes on ties so "do" vs "does" is never read as a typo.
    if (d < bestDist || (d === bestDist && c.kind !== "answer")) {
      best = c;
      bestDist = d;
    }
  }
  const close = bestDist <= tolerance(best.word);
  const typo = bestDist > 0;
  const spellNote = typo && close ? ` (Además, revisa la ortografía: se escribe “${best.word}”.)` : "";

  if (close && best.kind === "answer") {
    return {
      ...base,
      status: "spelling",
      points: SPELLING_POINTS,
      key: lower,
      title: "Error de ortografía",
      explain: q.spellingTip ?? `La palabra correcta es “${correct}”. Revisa letra por letra.`,
    };
  }
  if (close && best.kind === "mistake") {
    const m = q.mistakes![best.word];
    return { ...base, key: best.word, title: "Respuesta incorrecta", explain: m.explain + spellNote, sounds: m.sounds };
  }
  if (close && best.kind === "bank") {
    const es = q.spanish!.words[best.word];
    return {
      ...base,
      key: best.word,
      title: "Palabra equivocada",
      explain: `Escribiste “${best.word}” (${es}), pero aquí no tiene sentido.${spellNote}`,
      sounds: `Sonaría así: “${q.spanish!.template.replace("___", es)}”`,
    };
  }
  return { ...base, title: "Respuesta incorrecta", explain: `Escribiste “${given}”, pero la respuesta es “${correct}”.` };
}

function gradeChoice(q: ChoiceQuestion, raw: string): Graded {
  const correct = correctAnswerText(q);
  const opt = q.options.find((o) => o.key === raw);
  if (!opt) return { id: q.id, status: "blank", points: 0, given: "", key: "(en blanco)", correct, why: q.why };
  const given = q.section === "D" || q.section === "I" ? `${opt.key}. ${opt.text}` : opt.text;
  const base: Graded = { id: q.id, status: "wrong", points: 0, given, key: given, correct, why: q.why };
  if (raw === q.answer) return { ...base, status: "correct", points: 1 };
  const explain = opt.why ?? (q.asks && opt.answers ? `${q.asks} Tu respuesta “${opt.text}” ${opt.answers}.` : undefined);
  const sounds =
    opt.sounds ?? (q.promptEs && opt.es ? `Sonaría así: “${q.promptEs}” — “${opt.es}”` : undefined);
  return { ...base, title: "Respuesta incorrecta", explain, sounds };
}

const NUMBERS: Record<string, string> = { "0": "zero", "2": "two", "4": "four", "1": "one", "3": "three" };

/** Lower-case, expand contractions and digits so rules can stay simple. */
export function normalizeSentence(s: string) {
  return clean(s)
    .toLowerCase()
    .replace(/\b(\d)\b/g, (d) => NUMBERS[d] ?? d)
    .replace(/\bhe's\b/g, "he is")
    .replace(/\bcosta's\b/g, "costa is")
    .replace(/\bdoesn'?t\b/g, "does not")
    .replace(/\bdon'?t\b/g, "do not")
    .replace(/\bhasn'?t\b/g, "has not")
    .replace(/[,.!?;:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceVocab(q: SentenceQuestion) {
  const words = new Set<string>();
  for (const s of [q.model, "he has have is does not any no zero two four married single children daughters sons brothers sisters siblings and mr costa jorge"]) {
    for (const w of normalizeSentence(s).split(" ")) if (w.length > 3) words.add(w);
  }
  return [...words];
}

function gradeSentence(q: SentenceQuestion, raw: string): Graded {
  const base: Graded = { id: q.id, status: "wrong", points: 0, given: raw.trim(), key: "", correct: q.model, why: q.why };
  let norm = normalizeSentence(raw);
  base.key = norm;

  // Fix small typos in known words (e.g. "marrid", "dauhgters") before checking grammar.
  const vocab = sentenceVocab(q);
  const fixes: string[] = [];
  norm = norm
    .split(" ")
    .map((w) => {
      if (w.length <= 3 || vocab.includes(w)) return w;
      let best = w;
      let bestD = Infinity;
      for (const v of vocab) {
        const d = levenshtein(w, v);
        if (d < bestD) [best, bestD] = [v, d];
      }
      if (bestD > 0 && bestD <= tolerance(best)) {
        fixes.push(`“${w}” → “${best}”`);
        return best;
      }
      return w;
    })
    .join(" ");

  const t = raw.trim();
  const tip =
    !/^[A-Z]/.test(t) || !/[.!]$/.test(t)
      ? "Recuerda: una oración completa empieza con mayúscula y termina con punto."
      : undefined;

  if (q.accept.some((r) => r.test(norm))) {
    if (fixes.length) {
      return {
        ...base,
        status: "spelling",
        points: SPELLING_POINTS,
        key: norm,
        title: "Error de ortografía",
        explain: `La oración está bien construida, pero revisa la ortografía: ${fixes.join(", ")}.`,
        tip,
      };
    }
    return { ...base, status: "correct", points: 1, key: norm, tip };
  }
  const rule = q.rules.find((r) => r.test.test(norm));
  const spell = fixes.length ? ` Ortografía: ${fixes.join(", ")}.` : "";
  if (rule) return { ...base, key: norm, title: "Revisa la gramática", explain: rule.explain + spell, sounds: rule.sounds };
  return {
    ...base,
    key: norm,
    title: "Respuesta incorrecta",
    explain: `Una oración completa necesita sujeto + verbo + la información del formulario. Respuesta modelo: “${q.model}”.${spell}`,
  };
}

export function gradeOne(q: Question, raw: string | undefined): Graded {
  const value = (raw ?? "").toString();
  if (!value.trim()) {
    return { id: q.id, status: "blank", points: 0, given: "", key: "(en blanco)", correct: correctAnswerText(q), title: "Sin respuesta", why: q.why };
  }
  if (q.kind === "text") return gradeText(q, value);
  if (q.kind === "choice") return gradeChoice(q, value);
  return gradeSentence(q, value);
}

export function gradeAll(answers: Record<string, string>): Result {
  const items = QUESTIONS.map((q) => gradeOne(q, answers[q.id]));
  const counts: Record<Status, number> = { correct: 0, spelling: 0, wrong: 0, blank: 0 };
  for (const i of items) counts[i.status]++;
  const score = items.reduce((s, i) => s + i.points, 0);
  return { score, total: QUESTIONS.length, counts, items };
}
