"use client";

import { useState } from "react";
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
      {done ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

export function DeleteButton({ id, name, teacherKey }: { id: string; name: string; teacherKey?: string }) {
  const router = useRouter();
  return (
    <button
      className="btn small icon"
      aria-label={`Borrar el examen de ${name}`}
      title="Borrar"
      onClick={async () => {
        if (!confirm(`¿Borrar el examen de ${name}?`)) return;
        await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, key: teacherKey }),
        });
        router.refresh();
      }}
    >
      🗑
    </button>
  );
}
