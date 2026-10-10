import { notFound } from "next/navigation";
import { store } from "@/lib/store.ts";
import Review from "@/components/Review.tsx";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await (await store()).get(id);
  if (!sub) notFound();
  return <Review name={sub.name} result={sub.result} />;
}
