# Midterm Test · Ventures Level 1 (Units 1–5)

An online version of the Ventures Level 1 midterm, sections A–J (50 questions).

- **Students** open `/`, type their name and answer every question. When they submit, they see their score. Then
  they step through each mistake one at a time, with an explanation in Spanish. Where it helps, they also see
  how the wrong answer would sound in Spanish (for example, *“Does he from Russia?” suena como “¿Hace él de Rusia?”*).
- **The teacher** opens `/teacher` to see a summary: number of tests, the average, the hardest question and
  topic, charts of errors **by topic** and **by question**, the most common wrong answers, and each student's
  results.

There are no accounts: there is one link for students and one for the teacher.

## Grading

| Result | Points | Example |
|---|---|---|
| Correct | 1 | `studying` |
| Spelling (the right word, misspelled, or a capital-letter error) | ½ | `studing`, `may` → `May`, `Sincerly` |
| Incorrect / blank | 0 | `study`, `Does` (in C1) |

The Section H sentences are checked with patterns. They accept natural variations such as
“He's married.”, “Mr. Costa is married.” and “He has no sons.”. They also catch common mistakes
(“He have…”, “He doesn't has…”, “He married.”, an answer that is not a complete sentence).

The **answer key and all of the explanations are in [`lib/exam.ts`](lib/exam.ts)**.

> **Listening (A and B):** the test's original audio is not included. The 🔊 button reads the sentence
> with the browser's voice, and the answer key is built around those sentences. If you play the real
> recording in class, update `speak` / `answers` for A1–A5 and B1–B5 in `lib/exam.ts` to match it.

## Deploy for free on Vercel

1. Go to <https://vercel.com/new>, sign in with GitHub and **import this repository**. No settings are needed.
   Click **Deploy**.
2. In the project, open **Storage → Create / Connect → Upstash for Redis** (free plan). Connect it to the
   project, then go to **Deployments → ⋯ → Redeploy**.
3. Done:
   - Students: `https://YOUR-PROJECT.vercel.app/`
   - Teacher: `https://YOUR-PROJECT.vercel.app/teacher`

Optional: add the environment variable `TEACHER_KEY=something` to protect the teacher page. The teacher link then
becomes `/teacher?key=something`.

Without step 2 the app still works, but submissions are lost (the teacher page shows a warning).
The app reads `KV_REST_API_URL`/`KV_REST_API_TOKEN`, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`
or `REDIS_URL`, whichever the integration provides.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000 (saves to .data/submissions.json)
npm test         # grader test cases
npm run e2e      # Playwright end-to-end tests (builds and starts the app on port 3100)
npm run showcase # same tests, slowed down and recorded as video in test-results/
```

The end-to-end tests tell one story:

1. **`e2e/student.spec.ts`** (phone, Pixel 7): María López types her name, plays a listening sentence, answers
   all 50 questions with the typical mistakes of a Spanish speaker, and submits. She checks her score, then
   steps through all 12 mistakes and their Spanish explanations.
2. **`e2e/teacher.spec.ts`** (laptop): 14 more classmates submit through the API, for 15 students in total.
   The teacher dashboard is then checked: the summary tiles, the charts by topic and by question, the
   most common wrong answers, the student table, and María's review opened from it.

Each run starts with an empty class (in `.data-e2e/`). The classmates' answers are generated with a fixed seed in
`e2e/students.ts`, so the dashboard looks the same every time.
