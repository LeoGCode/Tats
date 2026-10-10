import type { Page } from "@playwright/test";
import { QUESTIONS, type Question } from "../lib/exam.ts";
import { gradeAll } from "../lib/grade.ts";

/** Realistic mistakes students make, per question (choice questions use other option keys). */
const MISTAKES: Record<string, string[]> = {
  A1: ["sistr", "mother"], A2: ["diccionary", "dictionari"], A3: ["pencil", "pensils"],
  A4: ["headake", "head ache"], A5: ["ankel", "angle"],
  C1: ["Does"], C2: ["in"], C3: ["study", "studing"], C4: ["Do", "dose"], C5: ["Turning"],
  G1: ["may", "fever"], G2: ["daugther", "excuse"], G3: ["fevre"], G4: ["fever"], G5: ["Sincerly", "sincerely"],
  H1: ["Married", "He married.", "He is marrid."],
  H2: ["He have two children.", "2 children"],
  H3: ["He has two daughter.", "He have two daughters."],
  H4: ["He no have sons.", "He doesn't has sons.", "He don't have sons."],
  H5: ["He has two brothers and sisters.", "He have four brothers and sisters."],
  J1: ["post office clerk", "manicurist"], J2: ["parking atendant", "orderly"], J3: ["manicurest"],
  J4: ["ordely", "school office clerk"], J5: ["school ofice clerk"],
};

/** Questions Spanish speakers miss more often, so the teacher charts show a pattern. */
const DIFFICULTY: Record<string, number> = { C1: 2.6, C4: 2.4, C2: 2.2, H4: 2.5, H5: 2.2, C3: 1.8, D2: 1.6, D4: 1.8, G5: 1.7, I1: 1.5, I5: 1.7, F1: 1.6 };

export function correctAnswer(q: Question): string {
  if (q.kind === "text") return q.answers[0];
  if (q.kind === "sentence") return q.model;
  return q.answer;
}

export function wrongAnswer(q: Question, pick: number): string {
  if (q.kind === "choice") {
    const others = q.options.filter((o) => o.key !== q.answer);
    return others[pick % others.length].key;
  }
  const list = MISTAKES[q.id] ?? ["?"];
  return list[pick % list.length];
}

// Small deterministic PRNG so the demo class looks the same on every run.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Builds answers for a student who misses roughly `errorRate` of an average question. */
export function makeAnswers(seed: number, errorRate: number): Record<string, string> {
  const r = rng(seed);
  const answers: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const p = Math.min(0.95, errorRate * (DIFFICULTY[q.id] ?? 1));
    if (r() < 0.015) continue; // the odd blank
    answers[q.id] = r() < p ? wrongAnswer(q, Math.floor(r() * 10)) : correctAnswer(q);
  }
  return answers;
}

/** 14 classmates; together with the student who takes the test in the UI, 15 in total. */
export const CLASSMATES: { name: string; errorRate: number }[] = [
  { name: "José Hernández", errorRate: 0.12 },
  { name: "Ana Martínez", errorRate: 0.05 },
  { name: "Luis García", errorRate: 0.28 },
  { name: "Carmen Rodríguez", errorRate: 0.18 },
  { name: "Miguel Torres", errorRate: 0.35 },
  { name: "Sofía Ramírez", errorRate: 0.08 },
  { name: "Jorge Flores", errorRate: 0.22 },
  { name: "Lucía Morales", errorRate: 0.15 },
  { name: "Diego Castillo", errorRate: 0.4 },
  { name: "Valentina Cruz", errorRate: 0.1 },
  { name: "Andrés Reyes", errorRate: 0.25 },
  { name: "Gabriela Ortiz", errorRate: 0.2 },
  { name: "Ricardo Vargas", errorRate: 0.3 },
  { name: "Isabel Mendoza", errorRate: 0.13 },
];

// --- The student who takes the test through the UI ---

export const STUDENT = "María López";

// María gets most of it right, but makes the typical mistakes of a Spanish speaker.
export const MARIA_MISTAKES: Record<string, string> = {
  A2: "diccionary", // spelling
  C1: "Does", // be vs. do
  C2: "in", // in vs. on
  C3: "studing", // spelling of -ing
  C4: "Do", // do vs. does
  D2: "c", // "Are they eating?" → "Yes, they do."
  G1: "may", // month without a capital
  G2: "fever", // wrong word from the box
  H1: "He married.", // missing "is"
  H4: "He no have sons.", // negation without "doesn't"
  I5: "D", // next to vs. across from
  J1: "post office clerk", // missing a word
};
export const MARIA = Object.fromEntries(QUESTIONS.map((q) => [q.id, MARIA_MISTAKES[q.id] ?? correctAnswer(q)]));
export const MARIA_RESULT = gradeAll(MARIA);
export const SHOWCASE = !!process.env.SHOWCASE;
/** Lets the viewer of the showcase video read the screen; no-op in normal runs. */
export const beat = (page: Page, ms = 1500) => (SHOWCASE ? page.waitForTimeout(ms) : Promise.resolve());
export const pct = (score: number, total: number) => `${Math.round((score / total) * 100)}%`;

export async function answerEverything(page: Page, answers: Record<string, string>) {
  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (q.kind === "choice") {
      const radio = page.locator(`input[name="${q.id}"][value="${value}"]`);
      await radio.scrollIntoViewIfNeeded();
      await radio.check();
    } else {
      const field = page.getByLabel(`Question ${q.id}`, { exact: true });
      await field.scrollIntoViewIfNeeded();
      await field.fill(value);
    }
  }
}

