import { test, expect } from "@playwright/test";
import { CLASSMATES, MARIA_RESULT, STUDENT, beat, makeAnswers, pct } from "./students.ts";

// Part 2 of the showcase: runs after student.spec.ts, so María plus 14 classmates = 15 students.
// The teacher follows the class from a phone too.
test.describe("teacher", () => {
  test("sees the class summary and charts for 15 students", async ({ page, request }, testInfo) => {
    await test.step("14 classmates submit their tests", async () => {
      for (const [i, s] of CLASSMATES.entries()) {
        const res = await request.post("/api/submit", { data: { name: s.name, answers: makeAnswers(i + 1, s.errorRate) } });
        expect(res.ok()).toBeTruthy();
      }
    });

    await test.step("opens the dashboard and shows the QR for the class", async () => {
      await page.goto("/teacher");
      await expect(page.getByRole("heading", { name: "Panel del profesor" })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Estudiantes/ })).toContainText("15");
      await page.getByRole("button", { name: "QR", exact: true }).click();
      await expect(page.locator(".qr svg")).toBeVisible();
      await beat(page, 2500);
      await page.getByRole("button", { name: "Ocultar QR" }).click();

      await expect(page.locator(".tile", { hasText: "Exámenes" }).locator(".value")).toHaveText("15");
      await expect(page.locator(".tile", { hasText: "Promedio" }).locator(".value")).toHaveText(/\d+%/);
      await expect(page.locator(".tile", { hasText: "Pregunta más difícil" }).locator(".value")).toHaveText(/^[A-J]\d$/);
      await beat(page, 2000);
      await testInfo.attach("teacher-summary", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    });

    await test.step("reviews errors by topic and the hardest questions", async () => {
      const topics = page.locator(".card", { has: page.getByRole("heading", { name: "Errores por tema", exact: true }) });
      await topics.scrollIntoViewIfNeeded();
      await expect(topics.locator(".track")).toHaveCount(13);
      await beat(page, 2500);

      const hardest = page.locator(".card", { has: page.getByRole("heading", { name: "Las 5 preguntas más difíciles" }) });
      await hardest.scrollIntoViewIfNeeded();
      await expect(hardest.locator(".qrow")).toHaveCount(5);
      await beat(page);
    });

    await test.step("opens a question to see what students wrote", async () => {
      await page.getByRole("tab", { name: "Preguntas" }).click();
      const c1 = page.locator(".qrow", { has: page.locator(".qid", { hasText: /^C1$/ }) });
      await c1.locator("summary").click();
      await expect(c1.locator(".qbody")).toContainText("Correcta: is");
      await expect(c1.locator(".answers")).toContainText("“Does”");
      await beat(page, 2500);
      await page.getByRole("button", { name: "En orden" }).click();
      await expect(page.locator(".qrow")).toHaveCount(50);
      await beat(page);
    });

    await test.step("sees all 15 students and opens María's review", async () => {
      await page.getByRole("tab", { name: /Estudiantes/ }).click();
      await expect(page.locator(".scard")).toHaveCount(15);
      await page.getByRole("button", { name: "Nota", exact: true }).click();
      const scores = await page.locator(".score-badge").allInnerTexts();
      const values = scores.map((s) => parseInt(s));
      expect(values).toEqual([...values].sort((a, b) => b - a));
      await beat(page, 2500);
      await testInfo.attach("teacher-students", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

      const maria = page.locator(".scard", { hasText: STUDENT });
      await expect(maria.locator(".score-badge")).toHaveText(pct(MARIA_RESULT.score, MARIA_RESULT.total));
      await maria.locator(".scard-main").click();
      await expect(page.getByRole("heading", { name: `Resultados de ${STUDENT}` })).toBeVisible();
      await beat(page, 2000);
    });
  });
});
