import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve(process.cwd(), "qa-artifacts");

const viewports = [
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "laptop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

await fs.mkdir(outputDir, { recursive: true });

function intersectionArea(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

const browser = await chromium.launch({ headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewports: [],
  summary: { passed: 0, warned: 0, failed: 0 },
};

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const result = {
    ...viewport,
    checks: [],
    consoleErrors,
    pageErrors,
    metrics: {},
  };

  const check = (name, pass, details = "", severity = "fail") => {
    result.checks.push({ name, pass, details, severity });
    if (pass) report.summary.passed += 1;
    else if (severity === "warn") report.summary.warned += 1;
    else report.summary.failed += 1;
  };

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForSelector("#three-stage canvas", { timeout: 30_000 });
    await page.waitForTimeout(1800);

    const geometry = await page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      };
      const buttons = [...document.querySelectorAll("button")].map((button) => {
        const r = button.getBoundingClientRect();
        return {
          text: (button.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
          width: r.width,
          height: r.height,
          visible: Boolean(r.width && r.height),
        };
      });
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyScrollWidth: document.body.scrollWidth,
        shell: rect(".app-shell"),
        library: rect(".library-panel"),
        viewer: rect(".viewer-panel"),
        board: rect(".board-panel"),
        stage: rect("#three-stage"),
        status: rect("#viewer-status-card"),
        viewcube: rect(".viewcube-shell"),
        paper: rect("#paper-shell"),
        toolRow: rect(".tool-row"),
        visibleButtons: buttons.filter((button) => button.visible),
      };
    });

    result.metrics.geometry = geometry;
    const horizontalOverflow = Math.max(geometry.scrollWidth, geometry.bodyScrollWidth) - geometry.innerWidth;
    check(
      "No horizontal page overflow",
      horizontalOverflow <= 2,
      `overflow=${horizontalOverflow}px (scrollWidth=${geometry.scrollWidth}, viewport=${geometry.innerWidth})`,
    );

    for (const [name, panel] of [["library", geometry.library], ["viewer", geometry.viewer], ["board", geometry.board]]) {
      check(`${name} panel rendered`, Boolean(panel && panel.width > 200 && panel.height > 200), JSON.stringify(panel));
    }

    check(
      "3D stage has usable area",
      Boolean(geometry.stage && geometry.stage.width >= 300 && geometry.stage.height >= 300),
      JSON.stringify(geometry.stage),
    );
    check(
      "Drawing board has usable area",
      Boolean(geometry.paper && geometry.paper.width >= 300 && geometry.paper.height >= 260),
      JSON.stringify(geometry.paper),
    );

    if (geometry.status && geometry.viewcube) {
      const overlap = intersectionArea(geometry.status, geometry.viewcube);
      check("Viewer status does not collide with view cube", overlap <= 1, `overlap=${overlap.toFixed(1)}px²`);
    }

    const smallButtons = geometry.visibleButtons.filter((button) => button.height < 40 || button.width < 40);
    check(
      "Interactive targets are at least 40px",
      smallButtons.length === 0,
      smallButtons.length ? JSON.stringify(smallButtons.slice(0, 8)) : "all visible buttons >= 40px",
      "warn",
    );

    await page.locator('[data-sidebar-tab="guide"]').click();
    check(
      "Guide tab activates correctly",
      await page.locator("#sidebar-guide").evaluate((el) => el.classList.contains("is-active")),
    );
    await page.locator('[data-sidebar-tab="theory"]').click();
    check(
      "Theory tab activates correctly",
      await page.locator("#sidebar-theory").evaluate((el) => el.classList.contains("is-active")),
    );
    await page.locator('[data-sidebar-tab="figures"]').click();

    await page.locator("#viewer-status-card").click();
    await page.locator('[data-view="front"]').click();
    await page.waitForTimeout(250);
    check(
      "Front-view preset updates label",
      (await page.locator("#current-view-label").innerText()).trim() === "Alzado",
      `label=${(await page.locator("#current-view-label").innerText()).trim()}`,
    );

    const solutionToggle = page.locator("#toggle-solution");
    await solutionToggle.check();
    await page.waitForTimeout(250);
    const solutionPixels = await page.locator("#solution-canvas").evaluate((canvas) => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx || canvas.width < 1 || canvas.height < 1) return { width: canvas.width, height: canvas.height, sampled: false };
        const sampleWidth = Math.min(canvas.width, 200);
        const sampleHeight = Math.min(canvas.height, 200);
        const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
        let nonTransparent = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent += 1;
        return { width: canvas.width, height: canvas.height, sampled: true, nonTransparent };
      } catch (error) {
        return { sampled: false, error: String(error) };
      }
    });
    result.metrics.solutionCanvas = solutionPixels;
    check(
      "Solution canvas initializes",
      Boolean(solutionPixels.width > 0 && solutionPixels.height > 0),
      JSON.stringify(solutionPixels),
    );

    await page.screenshot({
      path: path.join(outputDir, `${viewport.name}-viewport.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(outputDir, `${viewport.name}-fullpage.png`),
      fullPage: true,
    });

    check(
      "No uncaught runtime errors",
      pageErrors.length === 0,
      pageErrors.join(" | ") || "none",
    );
    check(
      "No console errors",
      consoleErrors.length === 0,
      consoleErrors.join(" | ") || "none",
      "warn",
    );
  } catch (error) {
    check("Viewport run completed", false, error.stack || String(error));
  } finally {
    report.viewports.push(result);
    await context.close();
  }
}

await browser.close();

const reportJsonPath = path.join(outputDir, "visual-qa-report.json");
await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);

const markdown = [
  "# Vistas 3x3 · Visual QA",
  "",
  `Generated: ${report.generatedAt}`,
  `Base URL: ${baseUrl}`,
  "",
  `**Checks:** ${report.summary.passed} passed · ${report.summary.warned} warnings · ${report.summary.failed} failed`,
  "",
  ...report.viewports.flatMap((viewport) => [
    `## ${viewport.name}`,
    "",
    ...viewport.checks.map((item) => `${item.pass ? "✅" : item.severity === "warn" ? "⚠️" : "❌"} **${item.name}**${item.details ? ` — ${item.details}` : ""}`),
    "",
    `Frames: \`${viewport.name}-viewport.png\`, \`${viewport.name}-fullpage.png\``,
    "",
  ]),
];
await fs.writeFile(path.join(outputDir, "visual-qa-report.md"), `${markdown.join("\n")}\n`);

console.log(markdown.join("\n"));

if (report.summary.failed > 0) process.exitCode = 1;
