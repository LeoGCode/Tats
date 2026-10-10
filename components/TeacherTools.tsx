"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

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
      className="btn small"
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
      Borrar
    </button>
  );
}
