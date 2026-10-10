import { test, expect } from "@playwright/test";
import { MARIA, MARIA_RESULT, STUDENT, answerEverything, beat, pct } from "./students.ts";

// Part 1 of the showcase: María takes the test on a phone (see playwright.config.ts).
test.describe("student", () => {

  test("takes the midterm on a phone and reviews each mistake in Spanish", async ({ page }, testInfo) => {
    page.on("dialog", (d) => d.accept()); // browser without a voice → alert

    await test.step("starts the test with their name", async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /Midterm Test/ })).toBeVisible();
      await page.getByLabel("Your name / Tu nombre").pressSequentially(STUDENT, { delay: 40 });
      await page.getByRole("button", { name: "Start / Empezar" }).click();
      await expect(page.getByText(`Name: ${STUDENT}`)).toBeVisible();
      await beat(page);
    });

    await test.step("listens to the first sentence", async () => {
      await page.getByRole("button", { name: "Escuchar", exact: true }).first().click();
    });

    await test.step("answers all 50 questions", async () => {
      await answerEverything(page, MARIA);
      await expect(page.locator(".sticky-bar")).toContainText("50/50");
    });

    await test.step("submits and sees the score", async () => {
      await page.getByRole("button", { name: "Finish / Entregar" }).click();
      await page.waitForURL(/\/review\//);
      await expect(page.getByRole("heading", { name: `Resultados de ${STUDENT}` })).toBeVisible();
      await expect(page.locator(".score-big")).toHaveText(pct(MARIA_RESULT.score, MARIA_RESULT.total));
      await expect(page.locator(".pill.spelling").first()).toContainText(`${MARIA_RESULT.counts.spelling} ortografía`);
      await beat(page, 2500);
      await testInfo.attach("student-score", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    });

    await test.step("steps through every mistake", async () => {
      const mistakes = MARIA_RESULT.items.filter((i) => i.status !== "correct");
      await page.getByRole("button", { name: /Empezar la revisión/ }).click();
      const seen: string[] = [];
      for (let i = 0; i < mistakes.length; i++) {
        await expect(page.getByText(`Error ${i + 1} de ${mistakes.length}`)).toBeVisible();
        const card = page.locator(".card").first();
        await expect(card.locator(".right")).toHaveText(mistakes[i].correct);
        seen.push(await card.innerText());
        await beat(page, 2200);
        if (mistakes[i].id === "C1") {
          await testInfo.attach("mistake-C1", { body: await page.screenshot(), contentType: "image/png" });
        }
        const next = i < mistakes.length - 1 ? "Siguiente" : "Terminar";
        await page.getByRole("button", { name: next }).click();
      }
      const all = seen.join("\n");
      // Spanish explanations, including how the wrong answer sounds in Spanish.
      expect(all).toContain("Error de ortografía");
      expect(all).toContain("¿Hace él de Rusia?");
      expect(all).toContain("Los mapas están dentro de la mesa");
      expect(all).toContain("Yoko es mi fiebre.");
      expect(all).toContain("Los meses en inglés siempre se escriben con mayúscula");
      expect(all).toContain("“He married” significa “Él se casó”");
      expect(all).toContain("falta “does”");
      await expect(page.getByRole("heading", { name: `Resultados de ${STUDENT}` })).toBeVisible();
    });
  });

  test("is asked inside the bar before submitting with blanks", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Your name / Tu nombre").fill("Pedro");
    await page.getByRole("button", { name: "Start / Empezar" }).click();
    await page.getByLabel("Question A2", { exact: true }).fill("dictionary");
    await page.getByRole("button", { name: "Finish / Entregar" }).click();
    await expect(page.locator(".sticky-bar")).toContainText("Te faltan 49 preguntas");
    await page.getByRole("button", { name: "Ir a la primera" }).click();
    await expect(page.getByLabel("Question A1", { exact: true })).toBeFocused();
    await expect(page.locator(".sticky-bar")).toContainText("1/50");
  });
});
