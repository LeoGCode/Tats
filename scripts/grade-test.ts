// Quick checks for the grader: node --experimental-strip-types scripts/grade-test.ts
import { QUESTION_BY_ID } from "../lib/exam.ts";
import { gradeOne, gradeAll } from "../lib/grade.ts";

const cases: [string, string, string][] = [
  ["A1", "sister", "correct"], ["A1", "Sister", "correct"], ["A1", "sistr", "spelling"], ["A1", "mother", "wrong"],
  ["A2", "diccionary", "spelling"], ["A3", "pencil", "wrong"], ["A4", "head ache", "spelling"], ["A4", "headake", "spelling"],
  ["C1", "Is", "correct"], ["C1", "does", "wrong"], ["C1", "dos", "wrong"], ["C2", "in", "wrong"], ["C2", "on", "correct"],
  ["C3", "studying", "correct"], ["C3", "studing", "spelling"], ["C3", "study", "wrong"],
  ["C4", "Does", "correct"], ["C4", "Do", "wrong"], ["C4", "dose", "spelling"], ["C5", "turning", "wrong"], ["C5", "Turn", "correct"],
  ["D1", "b", "correct"], ["D1", "a", "wrong"], ["D2", "", "blank"], ["E3", "b", "correct"], ["I5", "A", "correct"], ["F1", "yes", "correct"],
  ["G1", "May", "correct"], ["G1", "may", "spelling"], ["G1", "fever", "wrong"], ["G2", "daugther", "spelling"], ["G2", "fever", "wrong"],
  ["G5", "Sincerly", "spelling"], ["G5", "Sincerely", "correct"], ["G4", "excuse", "correct"],
  ["J1", "post office window clerk", "correct"], ["J1", "manicurist", "wrong"], ["J3", "manicurest", "spelling"], ["J4", "ordely", "spelling"],
  ["J1", "post office clerk", "wrong"],
  ["H1", "He is married.", "correct"], ["H1", "He's married", "correct"], ["H1", "Mr. Costa is married.", "correct"], ["H1", "Married", "wrong"],
  ["H1", "He married.", "wrong"], ["H1", "He is marrid.", "spelling"], ["H1", "He is single.", "wrong"],
  ["H2", "He has two children.", "correct"], ["H2", "He has 2 children.", "correct"], ["H2", "He have two children.", "wrong"], ["H2", "He has two childs.", "wrong"],
  ["H3", "He has two daughters.", "correct"], ["H3", "He has two daugthers.", "spelling"],
  ["H4", "He doesn't have any sons.", "correct"], ["H4", "He has no sons.", "correct"], ["H4", "He has 0 sons.", "correct"],
  ["H4", "He doesn't has any sons.", "wrong"], ["H4", "He no have sons.", "wrong"], ["H4", "He don't have sons.", "wrong"],
  ["H5", "He has two brothers and two sisters.", "correct"], ["H5", "He has 4 brothers and sisters.", "correct"], ["H5", "He has two brothers and sisters.", "wrong"],
  ["H5", "Jorge Costa has two sisters and two brothers.", "correct"],
];

let fail = 0;
for (const [id, ans, expected] of cases) {
  const g = gradeOne(QUESTION_BY_ID[id], ans);
  const ok = g.status === expected;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${id} ${JSON.stringify(ans)} -> ${g.status}${ok ? "" : ` (expected ${expected})`}  ${g.explain ?? ""} ${g.sounds ?? ""}`);
}
const r = gradeAll({});
console.log(`empty test: ${r.score}/${r.total}, blanks ${r.counts.blank}`);
if (fail) {
  console.error(`${fail} failing case(s)`);
  process.exit(1);
}
