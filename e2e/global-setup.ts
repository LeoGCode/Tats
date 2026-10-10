import { rm } from "fs/promises";

// Every run starts with an empty class.
export default async function globalSetup() {
  await rm(".data-e2e", { recursive: true, force: true });
}
