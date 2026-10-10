// Answer key, prompts and Spanish explanations for the Ventures Level 1
// Midterm Test (Units 1–5). Everything a teacher may want to tweak lives here.

export const TOPICS = {
  vocab: "Vocabulario (familia, escuela, salud)",
  listening: "Comprensión auditiva",
  beDo: "Be vs. Do / Does",
  prepositions: "Preposiciones de lugar",
  continuous: "Presente continuo (-ing)",
  imperative: "Imperativo (instrucciones)",
  questions: "Preguntas y respuestas",
  form: "Leer un formulario",
  readingComp: "Comprensión de lectura",
  note: "Escribir una nota",
  sentences: "Oraciones completas",
  map: "Leer un mapa",
  jobs: "Ocupaciones",
} as const;

export type TopicId = keyof typeof TOPICS;

export type SectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type Section = {
  id: SectionId;
  title: string;
  instructions: string;
  instructionsEs: string;
  wordBank?: string[];
  figure?: "form" | "email" | "census" | "map";
};

export const SECTIONS: Section[] = [
  { id: "A", title: "Listening", instructions: "Listen. Write the words you hear.", instructionsEs: "Escucha. Escribe las palabras que oyes." },
  { id: "B", title: "Listening", instructions: "Listen. Choose the sentence you hear.", instructionsEs: "Escucha. Elige la oración que oyes." },
  { id: "C", title: "Grammar", instructions: "Write the correct word.", instructionsEs: "Escribe la palabra correcta." },
  { id: "D", title: "Grammar", instructions: "Match the questions with the answers.", instructionsEs: "Une las preguntas con las respuestas." },
  { id: "E", title: "Reading", instructions: "Look at the form. Read the questions. Choose the answers.", instructionsEs: "Mira el formulario. Lee las preguntas. Elige las respuestas.", figure: "form" },
  { id: "F", title: "Reading", instructions: "Read the email. Read the sentences. Are they correct? Choose Yes or No.", instructionsEs: "Lee el correo. ¿Las oraciones son correctas? Elige Yes (sí) o No.", figure: "email" },
  { id: "G", title: "Writing", instructions: "Complete the note. Use the words in the box.", instructionsEs: "Completa la nota. Usa las palabras de la caja.", wordBank: ["daughter", "excuse", "fever", "May", "Sincerely"] },
  { id: "H", title: "Writing", instructions: "Answer the questions. Use complete sentences.", instructionsEs: "Contesta las preguntas. Usa oraciones completas.", figure: "census" },
  { id: "I", title: "Life-skills reading", instructions: "Look at the map. Read the questions. Choose the answers.", instructionsEs: "Mira el mapa. Lee las preguntas. Elige las respuestas.", figure: "map" },
  { id: "J", title: "Career readiness", instructions: "Write. Complete the sentences.", instructionsEs: "Escribe. Completa las oraciones.", wordBank: ["school office clerk", "post office window clerk", "manicurist", "parking attendant", "orderly"] },
];

/** A known wrong answer and why it is wrong. `sounds` = how it would sound in Spanish. */
export type Mistake = { explain: string; sounds?: string };

type Base = {
  id: string;
  section: SectionId;
  num: number;
  topic: TopicId;
  /** Spanish explanation of the correct answer, shown whenever the student misses it. */
  why: string;
  /** Sentence read aloud (listening sections). */
  speak?: string;
};

export type TextQuestion = Base & {
  kind: "text";
  before: string;
  after: string;
  hint?: string;
  answers: string[];
  caseSensitive?: boolean;
  caseTip?: string;
  spellingTip?: string;
  mistakes?: Record<string, Mistake>;
  /** Renders a wrong word inside a Spanish sentence: template uses ___. */
  spanish?: { template: string; words: Record<string, string> };
};

export type ChoiceOption = {
  key: string;
  text: string;
  es?: string;
  /** What kind of answer this option is (used to compose the explanation). */
  answers?: string;
  why?: string;
  sounds?: string;
};

export type ChoiceQuestion = Base & {
  kind: "choice";
  prompt: string;
  /** Spanish translation of the prompt, to show how a wrong pairing sounds. */
  promptEs?: string;
  /** What the question is asking for. */
  asks?: string;
  options: ChoiceOption[];
  answer: string;
};

export type SentenceRule = { test: RegExp; explain: string; sounds?: string };

export type SentenceQuestion = Base & {
  kind: "sentence";
  prompt: string;
  model: string;
  accept: RegExp[];
  rules: SentenceRule[];
};

export type Question = TextQuestion | ChoiceQuestion | SentenceQuestion;

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const D_OPTIONS: ChoiceOption[] = [
  { key: "a", text: "They're on the table.", es: "Están sobre la mesa.", answers: "dice un lugar (dónde están las cosas)" },
  { key: "b", text: "They're from China.", es: "Son de China.", answers: "dice un país de origen" },
  { key: "c", text: "Yes, they do.", es: "Sí, sí tienen.", answers: "responde a una pregunta que empieza con Do" },
  { key: "d", text: "Yes, they are.", es: "Sí, sí están.", answers: "responde a una pregunta que empieza con Are" },
  { key: "e", text: "They're taking a break.", es: "Están tomando un descanso.", answers: "describe una acción en este momento (-ing)" },
];

const YES_NO: ChoiceOption[] = [
  { key: "yes", text: "Yes", es: "Sí" },
  { key: "no", text: "No", es: "No" },
];

const G_WORDS = { daughter: "hija", excuse: "disculpe", fever: "fiebre", may: "mayo", sincerely: "Atentamente" };

const J_WORDS = {
  "school office clerk": "secretario(a) de la escuela",
  "post office window clerk": "empleado(a) de ventanilla del correo",
  manicurist: "manicurista",
  "parking attendant": "empleado(a) del estacionamiento",
  orderly: "camillero(a)",
};

// Subject accepted in section H answers (after normalization).
const S = "(?:he|mr\\.? (?:jorge )?costa|jorge(?: costa)?)";
const re = (src: string) => new RegExp(src.replaceAll("S", S));

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export const QUESTIONS: Question[] = [
  // A — Listening (dictation)
  {
    id: "A1", section: "A", num: 1, kind: "text", topic: "vocab",
    speak: "Is your sister there?", before: "Is your", after: "there?",
    answers: ["sister"],
    why: "Se dijo: “Is your sister there?” = ¿Está tu hermana ahí? “sister” = hermana.",
  },
  {
    id: "A2", section: "A", num: 2, kind: "text", topic: "vocab",
    speak: "Where's the dictionary?", before: "Where's the", after: "?",
    answers: ["dictionary"],
    spellingTip: "En inglés se escribe dictionary: con “c” (no “cc”) y termina en “-ary”.",
    why: "Se dijo: “Where's the dictionary?” = ¿Dónde está el diccionario?",
  },
  {
    id: "A3", section: "A", num: 3, kind: "text", topic: "vocab",
    speak: "Are your pencils here?", before: "Are your", after: "here?",
    answers: ["pencils"],
    mistakes: {
      pencil: {
        explain: "Falta la “s” del plural. La pregunta empieza con “Are your…” (plural), así que la palabra es pencils.",
        sounds: "“Are your pencil here?” suena como “¿Están tu lápiz aquí?”",
      },
    },
    why: "Se dijo: “Are your pencils here?” = ¿Están tus lápices aquí? Como dice “Are”, es plural: pencils.",
  },
  {
    id: "A4", section: "A", num: 4, kind: "text", topic: "vocab",
    speak: "I have a bad headache.", before: "I have a bad", after: ".",
    answers: ["headache"],
    spellingTip: "headache se escribe junto: head (cabeza) + ache (dolor). La parte “ache” se pronuncia “eik”.",
    why: "Se dijo: “I have a bad headache.” = Tengo un fuerte dolor de cabeza.",
  },
  {
    id: "A5", section: "A", num: 5, kind: "text", topic: "vocab",
    speak: "I sprained my ankle.", before: "I sprained my", after: ".",
    answers: ["ankle"],
    why: "Se dijo: “I sprained my ankle.” = Me torcí el tobillo. “ankle” = tobillo.",
  },

  // B — Listening (choose the sentence)
  {
    id: "B1", section: "B", num: 1, kind: "choice", topic: "listening",
    speak: "It's on the shelf.", prompt: "Which sentence do you hear?", answer: "c",
    options: [
      { key: "a", text: "It's on the sofa.", why: "Se dijo “shelf” (estante), no “sofa” (sofá)." },
      { key: "b", text: "It's under the shelf.", why: "Se dijo “on” (sobre, encima), no “under” (debajo). “Under” tiene dos sílabas: UN-der." },
      { key: "c", text: "It's on the shelf." },
    ],
    why: "Se dijo: “It's on the shelf.” = Está sobre el estante.",
  },
  {
    id: "B2", section: "B", num: 2, kind: "choice", topic: "listening",
    speak: "I have a fever.", prompt: "Which sentence do you hear?", answer: "a",
    options: [
      { key: "a", text: "I have a fever." },
      { key: "b", text: "She has the flu.", why: "Se dijo “I have” (yo tengo), no “She has” (ella tiene). Y “fever” (fiebre), no “flu” (gripe)." },
      { key: "c", text: "I have the flu.", why: "Se dijo “a fever” (fiebre), no “the flu” (gripe)." },
    ],
    why: "Se dijo: “I have a fever.” = Tengo fiebre.",
  },
  {
    id: "B3", section: "B", num: 3, kind: "choice", topic: "listening",
    speak: "Yes, it is.", prompt: "Which sentence do you hear?", answer: "b",
    options: [
      { key: "a", text: "Yes, she is.", why: "Se dijo “it” (para cosas o animales), no “she” (ella). “She” empieza con el sonido “sh”." },
      { key: "b", text: "Yes, it is." },
      { key: "c", text: "Yes, they are.", why: "Se dijo “it is” (singular), no “they are” (plural: ellos/ellas)." },
    ],
    why: "Se dijo: “Yes, it is.” = Sí, lo es / sí está.",
  },
  {
    id: "B4", section: "B", num: 4, kind: "choice", topic: "listening",
    speak: "No, they aren't.", prompt: "Which sentence do you hear?", answer: "a",
    options: [
      { key: "a", text: "No, they aren't." },
      { key: "b", text: "Yes, they are.", why: "Es lo contrario: se dijo “No, they aren't” (No, no están). Escucha el “No” al principio y el “-n't” (not)." },
      { key: "c", text: "Yes, we are.", why: "Se dijo “No, they aren't”. “we” = nosotros, “they” = ellos." },
    ],
    why: "Se dijo: “No, they aren't.” = No, no lo están.",
  },
  {
    id: "B5", section: "B", num: 5, kind: "choice", topic: "listening",
    speak: "She's working.", prompt: "Which sentence do you hear?", answer: "b",
    options: [
      { key: "a", text: "He's working.", why: "Se dijo “She's” (ella), no “He's” (él). Fíjate en el sonido “sh” al principio." },
      { key: "b", text: "She's working." },
      { key: "c", text: "They're working.", why: "Se dijo “She's” (ella está), no “They're” (ellos están)." },
    ],
    why: "Se dijo: “She's working.” = Ella está trabajando.",
  },

  // C — Grammar (write the correct word)
  {
    id: "C1", section: "C", num: 1, kind: "text", topic: "beDo",
    before: "", after: "he from Russia?", hint: "Does / Is",
    answers: ["is"],
    mistakes: {
      does: {
        explain:
          "“From Russia” habla del origen. Para origen, nacionalidad, estados y lugares usamos el verbo be (am / is / are). “Does” solo se usa cuando hay otro verbo de acción, por ejemplo: “Does he live in Russia?”",
        sounds: "“Does he from Russia?” suena como “¿Hace él de Rusia?” — no tiene sentido porque no hay ninguna acción.",
      },
    },
    why: "Is he from Russia? = ¿Es él de Rusia?",
  },
  {
    id: "C2", section: "C", num: 2, kind: "text", topic: "prepositions",
    before: "The maps are", after: "the table.", hint: "in / on",
    answers: ["on"],
    mistakes: {
      in: {
        explain:
          "En español decimos “en la mesa” para todo, pero en inglés se distingue: on = encima de una superficie; in = dentro de algo (una caja, un cajón).",
        sounds: "“The maps are in the table” suena como “Los mapas están dentro de la mesa”, ¡como si la mesa estuviera hueca!",
      },
    },
    why: "The maps are on the table. = Los mapas están sobre la mesa.",
  },
  {
    id: "C3", section: "C", num: 3, kind: "text", topic: "continuous",
    before: "Are you", after: "?", hint: "study / studying",
    answers: ["studying"],
    spellingTip: "Con verbos que terminan en -y solo agregas -ing: study → studying (la “y” se queda).",
    mistakes: {
      study: {
        explain:
          "Después de am / is / are, para una acción que pasa ahora, el verbo lleva -ing (presente continuo): Are you studying?",
        sounds: "“Are you study?” suena como “¿Estás estudiar?” en vez de “¿Estás estudiando?”",
      },
    },
    why: "Are you studying? = ¿Estás estudiando?",
  },
  {
    id: "C4", section: "C", num: 4, kind: "text", topic: "beDo",
    before: "", after: "Mrs. Jones have a backache?", hint: "Do / Does",
    answers: ["does"],
    mistakes: {
      do: {
        explain:
          "Mrs. Jones es una sola persona (she = ella). Con he / she / it se usa does. Do es para I, you, we, they.",
        sounds: "“Do Mrs. Jones have a backache?” es como decir “¿Tienen la señora Jones dolor de espalda?” — verbo en plural para una sola persona.",
      },
    },
    why: "Does Mrs. Jones have a backache? = ¿La señora Jones tiene dolor de espalda?",
  },
  {
    id: "C5", section: "C", num: 5, kind: "text", topic: "imperative",
    before: "Go two blocks.", after: "left.", hint: "Turn / Turning",
    answers: ["turn"],
    mistakes: {
      turning: {
        explain:
          "Las instrucciones y direcciones usan el imperativo: el verbo en su forma simple, sin -ing (Go, Turn, Walk, Stop).",
        sounds: "“Go two blocks. Turning left.” suena como “Camina dos cuadras. Girando a la izquierda.” en vez de “Gira a la izquierda.”",
      },
    },
    why: "Go two blocks. Turn left. = Camina dos cuadras. Gira a la izquierda.",
  },

  // D — Grammar (match)
  {
    id: "D1", section: "D", num: 1, kind: "choice", topic: "questions",
    prompt: "Where are they from?", promptEs: "¿De dónde son?", answer: "b", options: D_OPTIONS,
    asks: "“Where … from?” pregunta por el origen (de qué país son).",
    why: "Where are they from? → They're from China. (¿De dónde son? → Son de China.)",
  },
  {
    id: "D2", section: "D", num: 2, kind: "choice", topic: "beDo",
    prompt: "Are they eating?", promptEs: "¿Están comiendo?", answer: "d", options: D_OPTIONS,
    asks: "Es una pregunta de sí / no que empieza con Are, así que se contesta con are: “Yes, they are.”",
    why: "Are they eating? → Yes, they are. (La pregunta usa Are, la respuesta también.)",
  },
  {
    id: "D3", section: "D", num: 3, kind: "choice", topic: "continuous",
    prompt: "What are they doing?", promptEs: "¿Qué están haciendo?", answer: "e", options: D_OPTIONS,
    asks: "“What are they doing?” pregunta qué acción hacen ahora; la respuesta lleva un verbo con -ing.",
    why: "What are they doing? → They're taking a break. (¿Qué están haciendo? → Están tomando un descanso.)",
  },
  {
    id: "D4", section: "D", num: 4, kind: "choice", topic: "beDo",
    prompt: "Do they have stomachaches?", promptEs: "¿Tienen dolor de estómago?", answer: "c", options: D_OPTIONS,
    asks: "Es una pregunta de sí / no que empieza con Do, así que se contesta con do: “Yes, they do.”",
    why: "Do they have stomachaches? → Yes, they do. (La pregunta usa Do, la respuesta también.)",
  },
  {
    id: "D5", section: "D", num: 5, kind: "choice", topic: "questions",
    prompt: "Where are the erasers?", promptEs: "¿Dónde están los borradores?", answer: "a", options: D_OPTIONS,
    asks: "“Where are the erasers?” pregunta por un lugar.",
    why: "Where are the erasers? → They're on the table. (¿Dónde están los borradores? → Están sobre la mesa.)",
  },

  // E — Reading (form)
  {
    id: "E1", section: "E", num: 1, kind: "choice", topic: "form",
    prompt: "What is their last name?", answer: "b",
    options: [
      { key: "a", text: "Abby", why: "Abby es un primer nombre (first name). “Last name” = apellido." },
      { key: "b", text: "Kent" },
      { key: "c", text: "Parents", why: "“Parents” (padres) es el título de una sección del formulario, no un nombre." },
      { key: "d", text: "Tom", why: "Tom es el primer nombre (first name) del papá, no el apellido." },
    ],
    why: "Last name = apellido. En la columna “Last name” todos dicen Kent.",
  },
  {
    id: "E2", section: "E", num: 2, kind: "choice", topic: "form",
    prompt: "How many children do Tom and Abby have?", answer: "c",
    options: [
      { key: "a", text: "1" }, { key: "b", text: "2" }, { key: "c", text: "3" },
      { key: "d", text: "4", why: "Tom y Abby son los padres (Parents); no se cuentan como hijos." },
    ],
    why: "Children = hijos. En la sección “Children” hay 3 nombres: Anthony, Kate y Susan.",
  },
  {
    id: "E3", section: "E", num: 3, kind: "choice", topic: "form",
    prompt: "How many daughters do they have?", answer: "b",
    options: [
      { key: "a", text: "1" }, { key: "b", text: "2" },
      { key: "c", text: "3", why: "3 son todos los hijos (children). Daughters son solo las hijas (mujeres)." },
      { key: "d", text: "4" },
    ],
    why: "Daughters = hijas. En “Children”, las que tienen marcado Female (mujer) son Kate y Susan → 2. Anthony es Male: es hijo (son).",
  },
  {
    id: "E4", section: "E", num: 4, kind: "choice", topic: "form",
    prompt: "Who is four years old?", answer: "c",
    options: [
      { key: "a", text: "Abby", why: "Abby tiene 36 años." },
      { key: "b", text: "Anthony", why: "Anthony tiene 11 años." },
      { key: "c", text: "Susan" },
      { key: "d", text: "Tom", why: "Tom tiene 40 años." },
    ],
    why: "Mira la columna Age (edad): Susan tiene 4 años.",
  },
  {
    id: "E5", section: "E", num: 5, kind: "choice", topic: "form",
    prompt: "Who is Tom's son?", answer: "b",
    options: [
      { key: "a", text: "Abby", why: "Abby es la esposa (wife) de Tom: está en “Parents”." },
      { key: "b", text: "Anthony" },
      { key: "c", text: "Kate", why: "Kate es hija (daughter): tiene marcado Female." },
      { key: "d", text: "Susan", why: "Susan es hija (daughter): tiene marcado Female." },
    ],
    why: "Son = hijo (hombre). El único hijo con Male marcado es Anthony.",
  },

  // F — Reading (email)
  {
    id: "F1", section: "F", num: 1, kind: "choice", topic: "readingComp",
    prompt: "The school is on Anne's street.", answer: "yes", options: YES_NO,
    why: "El correo dice: “The apartment is across the street from the school” = el apartamento está enfrente de la escuela, al otro lado de la calle. Entonces la escuela está en la calle de Anne.",
  },
  {
    id: "F2", section: "F", num: 2, kind: "choice", topic: "readingComp",
    prompt: "Anne works at the school.", answer: "no", options: YES_NO,
    why: "Anne dice “I work at the restaurant next to the school” = trabajo en el restaurante al lado de la escuela. No trabaja en la escuela.",
  },
  {
    id: "F3", section: "F", num: 3, kind: "choice", topic: "readingComp",
    prompt: "Today, Anne is at the restaurant.", answer: "no", options: YES_NO,
    why: "“Today, I'm not working” = hoy no estoy trabajando. Está en casa escribiendo correos porque su hijo está enfermo.",
  },
  {
    id: "F4", section: "F", num: 4, kind: "choice", topic: "readingComp",
    prompt: "Anne's son is sick.", answer: "yes", options: YES_NO,
    why: "“My son has a cough” = mi hijo tiene tos. Entonces sí está enfermo (sick).",
  },
  {
    id: "F5", section: "F", num: 5, kind: "choice", topic: "readingComp",
    prompt: "Anne's son has a fever.", answer: "no", options: YES_NO,
    why: "Su hijo tiene tos (cough), no fiebre (fever).",
  },

  // G — Writing (note)
  {
    id: "G1", section: "G", num: 1, kind: "text", topic: "note",
    before: "", after: "23, 2027", answers: ["May"], caseSensitive: true,
    caseTip: "Los meses en inglés siempre se escriben con mayúscula: May (no “may”).",
    spanish: { template: "___ 23 de 2027", words: G_WORDS },
    why: "Esta línea es la fecha, así que necesita un mes. De la caja, el único mes es May (mayo).",
  },
  {
    id: "G2", section: "G", num: 2, kind: "text", topic: "note",
    before: "Yoko is my", after: ".", answers: ["daughter"],
    spellingTip: "daughter se escribe con “augh”: d-a-u-g-h-t-e-r (la “gh” no suena).",
    spanish: { template: "Yoko es mi ___.", words: G_WORDS },
    why: "Después de “Yoko is my…” va una relación familiar: daughter (hija). Yoko is my daughter = Yoko es mi hija.",
  },
  {
    id: "G3", section: "G", num: 3, kind: "text", topic: "note",
    before: "She is sick. She has a", after: ".", answers: ["fever"],
    spanish: { template: "Está enferma. Tiene ___.", words: G_WORDS },
    why: "Está enferma, entonces tiene fiebre: She has a fever.",
  },
  {
    id: "G4", section: "G", num: 4, kind: "text", topic: "note",
    before: "Please", after: "her. Thank you.", answers: ["excuse"],
    spanish: { template: "Por favor, ___ su falta.", words: G_WORDS },
    why: "“Please excuse her” = Por favor, disculpe (justifique) su falta. Es la frase para pedir que no cuenten la ausencia.",
  },
  {
    id: "G5", section: "G", num: 5, kind: "text", topic: "note",
    before: "", after: ", Mrs. Uchida", answers: ["Sincerely"], caseSensitive: true,
    caseTip: "La despedida de una nota empieza con mayúscula: Sincerely,",
    spellingTip: "Sincerely se escribe s-i-n-c-e-r-e-l-y (sincere + ly). Un error común es escribir “Sincerly”.",
    spanish: { template: "___, Sra. Uchida", words: G_WORDS },
    why: "Para cerrar una nota formal se usa “Sincerely,” = Atentamente.",
  },

  // H — Writing (complete sentences)
  {
    id: "H1", section: "H", num: 1, kind: "sentence", topic: "sentences",
    prompt: "Is Mr. Costa married or single?", model: "He is married.",
    accept: [re("^S is married$")],
    rules: [
      { test: /^(married|single|yes|no)$/, explain: "Escribiste solo una palabra. Las instrucciones piden una oración completa: sujeto + verbo + información (He is married.)." },
      { test: /single/, explain: "Revisa el formulario: dice Married (casado), no single (soltero)." },
      { test: re("^S married$"), explain: "Falta el verbo is. Para el estado civil usamos be: He is married.", sounds: "“He married” significa “Él se casó” (pasado), no “Él está casado”." },
      { test: re("^S (has|have) married$"), explain: "Para el estado civil se usa is, no has: He is married.", sounds: "“He has married” suena como “Él se ha casado” en vez de “Él está casado”." },
    ],
    why: "El formulario dice Married. Respuesta: He is married. (Él está casado.)",
  },
  {
    id: "H2", section: "H", num: 2, kind: "sentence", topic: "sentences",
    prompt: "How many children does Mr. Costa have?", model: "He has two children.",
    accept: [re("^S has two (children|daughters)$")],
    rules: [
      { test: /^(two|2)( children)?$/, explain: "Escribiste solo la respuesta corta. Las instrucciones piden una oración completa: He has two children." },
      { test: re("^S have "), explain: "Con he / she se usa has, no have.", sounds: "“He have two children” suena como “Él tienen dos hijos”." },
      { test: /childs|two child$/, explain: "child es irregular: el plural es children (no “childs”)." },
      { test: re("^S is two"), explain: "Para decir cuántos hijos tiene se usa has (tiene), no is (es).", sounds: "“He is two children” suena como “Él es dos niños”." },
    ],
    why: "Tiene 2 hijas y 0 hijos → 2 children. Respuesta: He has two children. (Él tiene dos hijos.)",
  },
  {
    id: "H3", section: "H", num: 3, kind: "sentence", topic: "sentences",
    prompt: "How many daughters does Mr. Costa have?", model: "He has two daughters.",
    accept: [re("^S has two daughters$")],
    rules: [
      { test: /^(two|2)( daughters)?$/, explain: "Escribiste solo la respuesta corta. Las instrucciones piden una oración completa: He has two daughters." },
      { test: re("^S have "), explain: "Con he / she se usa has, no have.", sounds: "“He have two daughters” suena como “Él tienen dos hijas”." },
      { test: /two daughter$/, explain: "Con 2 o más se usa el plural: daughters (con -s)." },
      { test: re("^S is two"), explain: "Para decir cuántas hijas tiene se usa has (tiene), no is (es).", sounds: "“He is two daughters” suena como “Él es dos hijas”." },
    ],
    why: "El formulario dice 2 daughters. Respuesta: He has two daughters. (Él tiene dos hijas.)",
  },
  {
    id: "H4", section: "H", num: 4, kind: "sentence", topic: "sentences",
    prompt: "How many sons does Mr. Costa have?", model: "He doesn't have any sons.",
    accept: [
      re("^S does not have (any )?sons$"),
      re("^S has (no|zero) sons$"),
      re("^S does not have a son$"),
    ],
    rules: [
      { test: /^(no|zero|none)( sons)?$/, explain: "Escribiste solo la respuesta corta. Las instrucciones piden una oración completa: He doesn't have any sons." },
      { test: re("^S does not has"), explain: "Después de does not (doesn't) el verbo va en forma simple: have, no has. La “-s” ya está en does.", sounds: "Es como marcar dos veces que es “él”: “Él no tiene-tiene hijos”." },
      { test: re("^S do not ha"), explain: "Con he / she se usa doesn't (does not), no don't.", sounds: "“He don't have” suena como “Él no tienen”." },
      { test: re("^S (not have|no have|no has|not has|have not|has not)"), explain: "En inglés la negación necesita el auxiliar doesn't: He doesn't have any sons.", sounds: "Es traducir palabra por palabra “Él no tiene”; en inglés falta “does”." },
      { test: re("^S has (any|none) sons?$"), explain: "Para decir que no tiene, usa He has no sons o He doesn't have any sons. “any” va con oraciones negativas." },
    ],
    why: "El formulario dice 0 sons. Respuesta: He doesn't have any sons. (Él no tiene hijos varones.)",
  },
  {
    id: "H5", section: "H", num: 5, kind: "sentence", topic: "sentences",
    prompt: "How many brothers and sisters does Mr. Costa have?", model: "He has two brothers and two sisters.",
    accept: [
      re("^S has two brothers and two sisters$"),
      re("^S has two sisters and two brothers$"),
      re("^S has four (brothers and sisters|sisters and brothers|siblings)$"),
    ],
    rules: [
      { test: /^((two|four) ?(brothers)?( and )?(two)? ?(sisters)?)$/, explain: "Escribiste solo la respuesta corta. Las instrucciones piden una oración completa: He has two brothers and two sisters." },
      { test: re("^S have "), explain: "Con he / she se usa has, no have.", sounds: "“He have…” suena como “Él tienen…”." },
      { test: re("^S has two (brothers and sisters|sisters and brothers)$"), explain: "Tiene 2 hermanos y 2 hermanas: 4 en total. Di “two brothers and two sisters” o “four brothers and sisters”.", sounds: "“He has two brothers and sisters” se entiende como “Tiene dos hermanos en total”." },
      { test: re("^S is "), explain: "Para decir cuántos hermanos tiene se usa has (tiene), no is (es)." },
    ],
    why: "El formulario dice 2 sisters y 2 brothers. Respuesta: He has two brothers and two sisters.",
  },

  // I — Life-skills reading (map)
  {
    id: "I1", section: "I", num: 1, kind: "choice", topic: "map",
    prompt: "Where is the movie theater?", answer: "D",
    options: [
      { key: "A", text: "It's across from Mead Lake.", why: "Mead Lake está arriba a la derecha, en diagonal: entre los dos pasan dos calles. Across from = justo enfrente, al otro lado de una calle." },
      { key: "B", text: "It's on the corner of Park Avenue and Main Street.", why: "Esa esquina está a la izquierda del mapa. El cine está a la derecha, junto a Central Avenue." },
      { key: "C", text: "It's next to the hospital.", why: "El hospital está arriba a la izquierda, lejos del cine." },
      { key: "D", text: "It's on the corner of Central Avenue and Elm Street." },
    ],
    why: "El cine está donde se cruzan Central Avenue y Elm Street. “On the corner of X and Y” = en la esquina de X y Y.",
  },
  {
    id: "I2", section: "I", num: 2, kind: "choice", topic: "map",
    prompt: "Where is Elm Park?", answer: "B",
    options: [
      { key: "A", text: "It's between Elm Street and Main Street.", why: "Entre Elm Street y Main Street está la cuadra del cine. El parque está arriba de Elm Street." },
      { key: "B", text: "It's between Central Avenue and Park Avenue." },
      { key: "C", text: "It's on Main Street.", why: "Main Street está abajo; el parque no llega a Main Street." },
      { key: "D", text: "It's next to the movie theater.", why: "Elm Street pasa entre el parque y el cine: están en cuadras diferentes, no uno al lado del otro (next to)." },
    ],
    why: "Elm Park está entre (between) Park Avenue a la izquierda y Central Avenue a la derecha.",
  },
  {
    id: "I3", section: "I", num: 3, kind: "choice", topic: "map",
    prompt: "Where is Park Hospital?", answer: "C",
    options: [
      { key: "A", text: "It's across from the movie theater.", why: "El cine está al otro lado del mapa (a la derecha)." },
      { key: "B", text: "It's on the corner of Park Avenue and Main Street.", why: "El hospital está arriba, en Elm Street. Main Street está abajo." },
      { key: "C", text: "It's on Park Avenue." },
      { key: "D", text: "It's next to Mead Lake.", why: "Mead Lake está en el otro extremo del mapa (arriba a la derecha)." },
    ],
    why: "Park Hospital está arriba a la izquierda, sobre Park Avenue.",
  },
  {
    id: "I4", section: "I", num: 4, kind: "choice", topic: "map",
    prompt: "Where is Mead Lake?", answer: "B",
    options: [
      { key: "A", text: "It's on Main Street.", why: "Main Street está abajo; Mead Lake está arriba." },
      { key: "B", text: "It's on the corner of Central Avenue and Elm Street." },
      { key: "C", text: "It's across from Park Hospital.", why: "Park Hospital está en el otro extremo del mapa." },
      { key: "D", text: "It's in front of the movie theater.", why: "El cine está en diagonal, al otro lado de dos calles." },
    ],
    why: "Mead Lake está arriba a la derecha, en la esquina de Central Avenue y Elm Street.",
  },
  {
    id: "I5", section: "I", num: 5, kind: "choice", topic: "map",
    prompt: "Where is the senior center?", answer: "A",
    options: [
      { key: "A", text: "It's across from Mead Lake." },
      { key: "B", text: "It's next to Elm Park.", why: "Elm Park está lejos, al otro lado de Central Avenue y Elm Street." },
      { key: "C", text: "It's on Park Avenue.", why: "Park Avenue está a la izquierda; el Senior Center está a la derecha." },
      { key: "D", text: "It's next to the movie theater.", why: "Central Avenue pasa entre el cine y el Senior Center: están enfrente (across), no al lado (next to)." },
    ],
    why: "El Senior Center está enfrente de Mead Lake: solo los separa Elm Street. Across from = al otro lado de la calle.",
  },

  // J — Career readiness
  {
    id: "J1", section: "J", num: 1, kind: "text", topic: "jobs",
    before: "A", after: "sells stamps and sorts mail.", answers: ["post office window clerk"],
    mistakes: { "post office clerk": { explain: "Te faltó una palabra: es post office window clerk (el empleado de la ventanilla del correo)." } },
    spanish: { template: "Un(a) ___ vende estampillas y clasifica el correo.", words: J_WORDS },
    why: "Quien vende estampillas (stamps) y clasifica el correo (mail) es el post office window clerk (empleado de ventanilla del correo).",
  },
  {
    id: "J2", section: "J", num: 2, kind: "text", topic: "jobs",
    before: "A", after: "gives tickets to drivers at a garage.", answers: ["parking attendant"],
    spanish: { template: "Un(a) ___ da boletos a los conductores en un garaje.", words: J_WORDS },
    why: "En un garaje, quien da boletos a los conductores es el parking attendant (empleado del estacionamiento).",
  },
  {
    id: "J3", section: "J", num: 3, kind: "text", topic: "jobs",
    before: "A", after: "shapes and paints fingernails and toenails.", answers: ["manicurist"],
    spanish: { template: "Un(a) ___ da forma y pinta las uñas de las manos y de los pies.", words: J_WORDS },
    why: "Quien da forma y pinta las uñas es el / la manicurist (manicurista).",
  },
  {
    id: "J4", section: "J", num: 4, kind: "text", topic: "jobs",
    before: "An", after: "takes patients to different parts of a hospital.", answers: ["orderly"],
    spanish: { template: "Un(a) ___ lleva a los pacientes a diferentes partes del hospital.", words: J_WORDS },
    why: "Quien lleva pacientes dentro del hospital es el orderly (camillero). Pista: dice “An”, así que la palabra empieza con sonido de vocal: orderly.",
  },
  {
    id: "J5", section: "J", num: 5, kind: "text", topic: "jobs",
    before: "Parents usually talk to the", after: "when they pick up their children early from school.", answers: ["school office clerk"],
    spanish: { template: "Los padres hablan con el / la ___ cuando recogen temprano a sus hijos de la escuela.", words: J_WORDS },
    why: "Para recoger a un niño temprano, los padres hablan con el school office clerk (secretario de la escuela).",
  },
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export function questionLabel(q: Question) {
  return `${q.section}${q.num}`;
}

export function correctAnswerText(q: Question): string {
  if (q.kind === "text") return q.answers[0];
  if (q.kind === "sentence") return q.model;
  const o = q.options.find((o) => o.key === q.answer)!;
  return q.section === "D" || q.section === "I" ? `${o.key}. ${o.text}` : o.text;
}

/** One-line view of the question with a blank, for reports. */
export function questionText(q: Question): string {
  if (q.kind === "text") return [q.before, "____", q.after].filter(Boolean).join(" ").replace(" .", ".").replace(" ?", "?");
  if (q.kind === "choice" && q.speak) return `🔊 “${q.speak}”`;
  return q.prompt;
}
