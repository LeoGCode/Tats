import { test, expect } from "@playwright/test";
import { CLASSMATES, MARIA_RESULT, STUDENT, beat, makeAnswers, pct } from "./students.ts";

// Part 2 of the showcase: runs after student.spec.ts, so María plus 14 classmates = 15 students.
test.describe("teacher", () => {

  test("sees the class summary and charts for 15 students", async ({ page, request }, testInfo) => {
    await test.step("14 classmates submit their tests", async () => {
      for (const [i, s] of CLASSMATES.entries()) {
        const res = await request.post("/api/submit", { data: { name: s.name, answers: makeAnswers(i + 1, s.errorRate) } });
        expect(res.ok()).toBeTruthy();
      }
    });

    await test.step("opens the dashboard", async () => {
      await page.goto("/teacher");
      await expect(page.getByRole("heading", { name: "Panel del profesor" })).toBeVisible();
      await expect(page.locator(".tile", { hasText: "Exámenes entregados" }).locator(".value")).toHaveText("15");
      await expect(page.locator(".tile", { hasText: "Promedio" }).locator(".value")).toHaveText(/\d+%/);
      await expect(page.locator(".tile", { hasText: "Pregunta más difícil" }).locator(".value")).toHaveText(/^[A-J]\d$/);
      await beat(page, 2500);
      await testInfo.attach("teacher-top", { body: await page.screenshot(), contentType: "image/png" });
    });

    await test.step("reviews errors by topic and by question", async () => {
      const topics = page.locator(".card", { has: page.getByRole("heading", { name: "Errores por tema", exact: true }) });
      await topics.scrollIntoViewIfNeeded();
      await expect(topics.locator(".track")).toHaveCount(13);
      await beat(page, 2500);

      const questions = page.locator(".card", { has: page.getByRole("heading", { name: "Preguntas con más errores", exact: true }) });
      await questions.scrollIntoViewIfNeeded();
      await expect(questions.locator(".bars").first().locator(".track")).toHaveCount(12);
      await beat(page, 2500);
      await questions.getByText(/Ver las otras \d+ preguntas/).click();
      await page.mouse.wheel(0, 600);
      await beat(page);

      const common = page.locator(".card", { has: page.getByRole("heading", { name: "Respuestas equivocadas más comunes", exact: true }) });
      await common.scrollIntoViewIfNeeded();
      await expect(common.locator("tr", { hasText: "C1" }).first()).toContainText("Does");
      await beat(page, 2500);
    });

    await test.step("sees all 15 students and opens María's review", async () => {
      const students = page.locator(".card", { has: page.getByRole("heading", { name: "Estudiantes", exact: true }) });
      await students.scrollIntoViewIfNeeded();
      await expect(students.locator("tbody tr")).toHaveCount(15);
      const maria = students.locator("tr", { hasText: STUDENT });
      await expect(maria).toContainText(pct(MARIA_RESULT.score, MARIA_RESULT.total));
      await maria.hover();
      await beat(page, 2500);
      await testInfo.attach("teacher-full", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

      const [review] = await Promise.all([page.waitForEvent("popup"), maria.getByRole("link", { name: "Ver" }).click()]);
      await expect(review.getByRole("heading", { name: `Resultados de ${STUDENT}` })).toBeVisible();
      await beat(review, 2000);
    });
  });
});
