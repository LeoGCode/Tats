import { promises as fs } from "fs";
import path from "path";
import type { Result } from "./grade.ts";

export type Submission = {
  id: string;
  name: string;
  createdAt: string;
  answers: Record<string, string>;
  result: Result;
};

const HASH = "midterm:submissions";

interface Store {
  kind: string;
  save(s: Submission): Promise<void>;
  get(id: string): Promise<Submission | null>;
  all(): Promise<Submission[]>;
  remove(id: string): Promise<void>;
}

const parse = (v: unknown): Submission => (typeof v === "string" ? JSON.parse(v) : (v as Submission));

/** Upstash / Vercel KV over REST (env vars injected by the Vercel integration). */
async function restStore(url: string, token: string): Promise<Store> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url, token });
  return {
    kind: "redis",
    async save(s) {
      await redis.hset(HASH, { [s.id]: JSON.stringify(s) });
    },
    async get(id) {
      const v = await redis.hget(HASH, id);
      return v ? parse(v) : null;
    },
    async all() {
      const v = (await redis.hgetall(HASH)) ?? {};
      return Object.values(v).map(parse);
    },
    async remove(id) {
      await redis.hdel(HASH, id);
    },
  };
}

/** Any Redis reachable through a redis:// URL (e.g. Vercel's Redis integration). */
async function urlStore(url: string): Promise<Store> {
  const { createClient } = await import("redis");
  const g = globalThis as unknown as { __redis?: ReturnType<typeof createClient> };
  if (!g.__redis) {
    g.__redis = createClient({ url });
    await g.__redis.connect();
  }
  const r = g.__redis;
  return {
    kind: "redis",
    async save(s) {
      await r.hSet(HASH, s.id, JSON.stringify(s));
    },
    async get(id) {
      const v = await r.hGet(HASH, id);
      return v ? parse(v) : null;
    },
    async all() {
      return Object.values(await r.hGetAll(HASH)).map(parse);
    },
    async remove(id) {
      await r.hDel(HASH, id);
    },
  };
}

/** Local JSON file for development. On Vercel it lives in /tmp and does not persist. */
function fileStore(): Store {
  const dir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data");
  const file = path.join(dir, "submissions.json");
  const read = async (): Promise<Record<string, Submission>> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (data: Record<string, Submission>) => {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  };
  return {
    kind: process.env.VERCEL ? "temporary" : "file",
    async save(s) {
      const d = await read();
      d[s.id] = s;
      await write(d);
    },
    async get(id) {
      return (await read())[id] ?? null;
    },
    async all() {
      return Object.values(await read());
    },
    async remove(id) {
      const d = await read();
      delete d[id];
      await write(d);
    },
  };
}

let cached: Promise<Store> | undefined;

export function store(): Promise<Store> {
  if (!cached) {
    const e = process.env;
    const restUrl = e.UPSTASH_REDIS_REST_URL ?? e.KV_REST_API_URL;
    const restToken = e.UPSTASH_REDIS_REST_TOKEN ?? e.KV_REST_API_TOKEN;
    const url = e.REDIS_URL ?? e.KV_URL;
    cached = restUrl && restToken ? restStore(restUrl, restToken) : url ? urlStore(url) : Promise.resolve(fileStore());
  }
  return cached;
}
