// Re-drawn versions of the test's form, email, census screen and map.

export function FormFigure() {
  const rows: [string, string, number, "M" | "F"][] = [
    ["Kent", "Tom", 40, "M"],
    ["Kent", "Abby", 36, "F"],
  ];
  const kids: [string, string, number, "M" | "F"][] = [
    ["Kent", "Anthony", 11, "M"],
    ["Kent", "Kate", 8, "F"],
    ["Kent", "Susan", 4, "F"],
  ];
  const row = ([l, f, a, s]: (typeof rows)[number]) => (
    <tr key={f}>
      <td>{l}</td>
      <td>{f}</td>
      <td>{a}</td>
      <td>{s === "M" ? "☒" : "☐"}</td>
      <td>{s === "F" ? "☒" : "☐"}</td>
    </tr>
  );
  return (
    <div className="figure">
      <table className="form">
        <caption style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700 }}>Medical Insurance Application Form</caption>
        <thead>
          <tr><th>Last name</th><th>First name</th><th>Age</th><th>Male</th><th>Female</th></tr>
        </thead>
        <tbody>
          <tr className="group"><td colSpan={5}>Parents</td></tr>
          {rows.map(row)}
          <tr className="group"><td colSpan={5}>Children</td></tr>
          {kids.map(row)}
        </tbody>
      </table>
    </div>
  );
}

export function EmailFigure() {
  return (
    <div className="figure email">
      <dl>
        <dt>From:</dt><dd>Anne</dd>
        <dt>To:</dt><dd>Cathy</dd>
        <dt>Subject:</dt><dd>My new neighborhood!</dd>
        <dt>Date:</dt><dd>January 14, 2028</dd>
      </dl>
      <p style={{ margin: "0 0 8px" }}>Dear Cathy,</p>
      <p style={{ margin: "0 0 8px" }}>
        I miss you, but I like my new neighborhood! The apartment is across the street from the school. The children walk
        to school. I work at the restaurant next to the school.
      </p>
      <p style={{ margin: "0 0 8px" }}>Today, I&apos;m not working. My son has a cough. I&apos;m writing emails to my friends!</p>
      <p style={{ margin: 0 }}>Your friend,<br />Anne</p>
    </div>
  );
}

export function CensusFigure() {
  const rows: [string, string][] = [
    ["What's your name?", "Jorge Costa"],
    ["Are you married or single?", "Married"],
    ["Do you have children?", "Yes"],
    ["   How many daughters?", "2"],
    ["   How many sons?", "0"],
    ["How many sisters do you have?", "2"],
    ["How many brothers do you have?", "2"],
  ];
  return (
    <div className="figure">
      <table className="form" style={{ minWidth: 0 }}>
        <caption style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700 }}>United States Census Bureau</caption>
        <tbody>
          {rows.map(([q, a]) => (
            <tr key={q}>
              <td style={{ paddingLeft: q.startsWith(" ") ? 28 : 10 }}>{q.trim()}</td>
              <td style={{ fontStyle: "italic", fontWeight: 600 }}>{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MapFigure() {
  const road = "var(--surface-2)";
  const block = "var(--surface)";
  const bld = "var(--border)";
  const text = { fill: "var(--text)", fontSize: 19, fontWeight: 700 } as const;
  const roadText = { fill: "var(--text-2)", fontSize: 17, fontWeight: 600 } as const;
  return (
    <div className="figure" style={{ background: road }}>
      <svg viewBox="0 0 600 370" role="img" aria-label="Map: Park Hospital, Elm Park, Mead Lake, Movie Theater, Senior Center" style={{ display: "block", width: "100%" }}>
        <rect width="600" height="370" fill={road} />
        {/* Top row */}
        <rect x="8" y="8" width="140" height="160" rx="6" fill={block} stroke={bld} />
        <rect x="24" y="40" width="108" height="80" rx="4" fill={bld} />
        <text x="78" y="32" textAnchor="middle" {...text} fontSize={16}>Park Hospital</text>
        <rect x="192" y="8" width="236" height="160" rx="6" fill="#3a9a5b" fillOpacity="0.28" stroke={bld} />
        {[230, 270, 330, 380, 300, 250, 400].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 120 : 75} r="14" fill="#2e7d47" fillOpacity="0.45" />
        ))}
        <text x="310" y="34" textAnchor="middle" {...text}>Elm Park</text>
        <rect x="472" y="8" width="120" height="160" rx="6" fill="#2a78d6" fillOpacity="0.28" stroke={bld} />
        <text x="532" y="34" textAnchor="middle" {...text}>Mead Lake</text>
        <path d="M490 140 q20 -30 45 -10 t40 -20" stroke="#2a78d6" strokeOpacity="0.6" fill="none" strokeWidth="2" />
        {/* Bottom row */}
        <rect x="8" y="212" width="140" height="106" rx="6" fill={block} stroke={bld} />
        <rect x="24" y="230" width="90" height="70" rx="4" fill={bld} />
        <rect x="192" y="212" width="236" height="106" rx="6" fill={block} stroke={bld} />
        <rect x="330" y="220" width="90" height="90" rx="4" fill={bld} />
        <text x="375" y="248" textAnchor="middle" {...text}>Movie</text>
        <text x="375" y="266" textAnchor="middle" {...text}>Theater</text>
        <rect x="472" y="212" width="120" height="106" rx="6" fill={block} stroke={bld} />
        <rect x="486" y="250" width="92" height="56" rx="4" fill={bld} />
        <text x="532" y="236" textAnchor="middle" {...text} fontSize={16}>Senior Center</text>
        {/* Street names */}
        <text x="310" y="195" textAnchor="middle" {...roadText}>Elm Street</text>
        <text x="310" y="350" textAnchor="middle" {...roadText}>Main Street</text>
        <text transform="translate(178 312) rotate(-90)" {...roadText}>Park Avenue</text>
        <text transform="translate(458 162) rotate(-90)" {...roadText}>Central Avenue</text>
      </svg>
    </div>
  );
}

export function Figure({ kind }: { kind?: string }) {
  if (kind === "form") return <FormFigure />;
  if (kind === "email") return <EmailFigure />;
  if (kind === "census") return <CensusFigure />;
  if (kind === "map") return <MapFigure />;
  return null;
}
