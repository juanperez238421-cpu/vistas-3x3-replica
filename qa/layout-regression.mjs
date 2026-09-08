import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/";
const outDir = path.resolve("qa-artifacts");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1728, height: 900 }, deviceScaleFactor: 1 });
const runtimeErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(String(error)));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(baseURL, { waitUntil: "networkidle" });
await page.waitForSelector(".piece-card.is-active");
await page.waitForTimeout(500);

const checks = [];
const add = (name, pass, detail) => checks.push({ name, pass, detail });

const library = await page.locator("#piece-library").evaluate((el) => ({
  clientWidth: el.clientWidth,
  scrollWidth: el.scrollWidth,
  clientHeight: el.clientHeight,
  scrollHeight: el.scrollHeight,
}));
add(
  "Figure library has no horizontal scrollbar",
  library.scrollWidth <= library.clientWidth + 1,
  `scrollWidth=${library.scrollWidth}, clientWidth=${library.clientWidth}`,
);

const activeContainment = await page.evaluate(() => {
  const lib = document.querySelector("#piece-library").getBoundingClientRect();
  const card = document.querySelector(".piece-card.is-active").getBoundingClientRect();
  return {
    lib: { left: lib.left, right: lib.right },
    card: { left: card.left, right: card.right },
    contained: card.left >= lib.left - 1 && card.right <= lib.right + 1,
  };
});
add(
  "Selected figure card stays inside catalogue scrollport",
  activeContainment.contained,
  JSON.stringify(activeContainment),
);

const toolbarButtons = await page.locator(".tool-row .tool-button").evaluateAll((buttons) =>
  buttons.map((button) => ({
    id: button.id,
    text: button.textContent.trim(),
    clientWidth: button.clientWidth,
    scrollWidth: button.scrollWidth,
    clientHeight: button.clientHeight,
    scrollHeight: button.scrollHeight,
  })),
);
const clippedToolbar = toolbarButtons.filter(
  (button) => button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1,
);
add(
  "Drawing toolbar labels are not clipped at 1728px",
  clippedToolbar.length === 0,
  clippedToolbar.length ? JSON.stringify(clippedToolbar) : "all toolbar labels fit",
);

const toolbarGrid = await page.locator(".tool-row").evaluate((el) => {
  const style = getComputedStyle(el);
  return {
    columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
    template: style.gridTemplateColumns,
    height: el.getBoundingClientRect().height,
  };
});
add(
  "1728px toolbar uses wrapped desktop layout",
  toolbarGrid.columns === 4,
  JSON.stringify(toolbarGrid),
);

await page.locator("#face-editor-panel").evaluate((el) => {
  el.hidden = false;
});
await page.waitForTimeout(50);
const facePanel = await page.evaluate(() => {
  const stage = document.querySelector("#three-stage").getBoundingClientRect();
  const panel = document.querySelector("#face-editor-panel").getBoundingClientRect();
  const coverage = (panel.width * panel.height) / (stage.width * stage.height);
  return {
    stage: { width: stage.width, height: stage.height },
    panel: { width: panel.width, height: panel.height },
    coverage,
  };
});
add(
  "Face editor remains compact over the 3D stage",
  facePanel.panel.width <= 270 && facePanel.panel.height <= 340 && facePanel.coverage <= 0.18,
  JSON.stringify(facePanel),
);

function isGray(rgb) {
  const match = rgb.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return Math.max(r, g, b) - Math.min(r, g, b) <= 3;
}

const chromeColors = await page.evaluate(() => {
  const color = (selector) => getComputedStyle(document.querySelector(selector)).backgroundColor;
  return {
    body: getComputedStyle(document.body).backgroundColor,
    sidebarActive: color('[data-sidebar-tab="figures"]'),
    difficultyActive: color('[data-difficulty="basico"]'),
    lineActive: color("#tool-line"),
  };
});
add(
  "Primary UI chrome remains monochrome",
  Object.values(chromeColors).every(isGray),
  JSON.stringify(chromeColors),
);

add("No uncaught runtime errors", runtimeErrors.length === 0, runtimeErrors.join(" | ") || "none");
add("No console errors", consoleErrors.length === 0, consoleErrors.join(" | ") || "none");

await page.screenshot({
  path: path.join(outDir, "regression-1728x900-viewport.png"),
  fullPage: false,
});

const passed = checks.filter((check) => check.pass).length;
const failed = checks.length - passed;
const report = {
  generated: new Date().toISOString(),
  viewport: "1728x900",
  passed,
  failed,
  checks,
};

const markdown = [
  "# Vistas 3x3 · 1728px layout regression QA",
  "",
  `**Checks:** ${passed} passed · ${failed} failed`,
  "",
  ...checks.map((check) => `${check.pass ? "✅" : "❌"} **${check.name}** — ${check.detail}`),
  "",
  "Frame: `regression-1728x900-viewport.png`",
  "",
].join("\n");

await fs.writeFile(path.join(outDir, "layout-regression-report.json"), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(outDir, "layout-regression-report.md"), markdown);
console.log(markdown);

await browser.close();
if (failed > 0) process.exit(1);
