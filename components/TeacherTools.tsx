"use client";

import { useEffect, useState } from "react";
import { Check, Copy, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          prompt("Copia el enlace:", url);
        }
      }}
    >
      {done ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />} {done ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

/** Two taps instead of a browser dialog: the first arms it for a few seconds, the second deletes. */
export function DeleteButton({ id, name, teacherKey }: { id: string; name: string; teacherKey?: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  async function onClick() {
    if (!armed) return setArmed(true);
    setBusy(true);
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, key: teacherKey }),
    });
    router.refresh();
  }

  return (
    <button
      className={`btn small${armed ? " danger" : " icon"}`}
      aria-label={armed ? `Confirmar: borrar el examen de ${name}` : `Borrar el examen de ${name}`}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? <LoaderCircle aria-hidden size={16} className="spin" /> : <Trash2 aria-hidden size={16} />}
      {armed && !busy && "Borrar"}
    </button>
  );
}
