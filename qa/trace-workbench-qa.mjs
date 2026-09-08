import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/";
const outDir = path.resolve("qa-artifacts");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: "desktop-1728x900", width: 1728, height: 900 },
  { name: "laptop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
];

const checks = [];
const add = (viewport, name, pass, detail) => checks.push({ viewport, name, pass, detail });

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const runtimeErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForSelector("#toggle-board-expand");
  await page.waitForSelector("#senior-grid-overlay");
  await page.waitForTimeout(350);

  const toolbar = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".trace-tool-grid")];
    const buttons = [...document.querySelectorAll(".trace-tool-grid .tool-button")];
    return {
      rows: rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      }),
      buttons: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const rowRect = button.closest(".trace-tool-grid").getBoundingClientRect();
        return {
          id: button.id,
          text: button.textContent.trim(),
          left: rect.left,
          right: rect.right,
          rowLeft: rowRect.left,
          rowRight: rowRect.right,
          clientWidth: button.clientWidth,
          scrollWidth: button.scrollWidth,
          clientHeight: button.clientHeight,
          scrollHeight: button.scrollHeight,
        };
      }),
    };
  });
  const toolbarProblems = toolbar.buttons.filter(
    (button) =>
      button.left < button.rowLeft - 1 ||
      button.right > button.rowRight + 1 ||
      button.scrollWidth > button.clientWidth + 1 ||
      button.scrollHeight > button.clientHeight + 1,
  );
  add(
    viewport.name,
    "Trace toolbar buttons stay inside margins without text clipping",
    toolbarProblems.length === 0,
    toolbarProblems.length ? JSON.stringify(toolbarProblems) : `${toolbar.buttons.length} buttons fit`,
  );

  const solutionContainment = await page.evaluate(() => {
    const parent = document.querySelector(".solution-controls").getBoundingClientRect();
    const children = [...document.querySelectorAll(".solution-controls > *, .trace-check-group > *")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.id || el.className || el.tagName,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          contained:
            rect.left >= parent.left - 1 &&
            rect.right <= parent.right + 1 &&
            rect.top >= parent.top - 1 &&
            rect.bottom <= parent.bottom + 1,
        };
      });
    return { parent: { left: parent.left, right: parent.right, top: parent.top, bottom: parent.bottom }, children };
  });
  const solutionOutside = solutionContainment.children.filter((child) => !child.contained);
  add(
    viewport.name,
    "Solution labels and controls remain inside the Trazo control box",
    solutionOutside.length === 0,
    solutionOutside.length ? JSON.stringify(solutionOutside) : "all controls contained",
  );

  const grid = await page.locator("#senior-grid-overlay").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const sampleWidth = Math.max(1, Math.min(width, 640));
    const sampleHeight = Math.max(1, Math.min(height, 480));
    const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let nonTransparent = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 0) nonTransparent += 1;
    }
    return {
      mode: canvas.closest("#paper-shell")?.dataset.gridMode,
      definition: canvas.dataset.gridDefinition,
      projectionGrids: canvas.dataset.projectionGrids,
      renderWidth: canvas.dataset.renderWidth,
      renderHeight: canvas.dataset.renderHeight,
      width,
      height,
      nonTransparent,
    };
  });
  add(
    viewport.name,
    "Senior 3x3 projection grid is rendered",
    grid.mode === "senior-3x3" &&
      grid.definition === "3x3-major-6-snap" &&
      grid.projectionGrids === "3" &&
      grid.nonTransparent > 80,
    JSON.stringify(grid),
  );

  const before = await page.evaluate(() => {
    const board = document.querySelector(".board-panel").getBoundingClientRect();
    const paper = document.querySelector("#paper-shell").getBoundingClientRect();
    return {
      board: { width: board.width, height: board.height },
      paper: { width: paper.width, height: paper.height, area: paper.width * paper.height },
    };
  });

  if (viewport.name === "desktop-1728x900") {
    await page.screenshot({
      path: path.join(outDir, "trace-senior-1728x900-normal.png"),
      fullPage: false,
    });
  }

  await page.locator("#toggle-board-expand").click();
  await page.waitForTimeout(420);

  const expanded = await page.evaluate(() => {
    const board = document.querySelector(".board-panel");
    const boardRect = board.getBoundingClientRect();
    const paperRect = document.querySelector("#paper-shell").getBoundingClientRect();
    const button = document.querySelector("#toggle-board-expand");
    const clippedButtons = [...document.querySelectorAll(".trace-tool-grid .tool-button")]
      .map((el) => ({
        id: el.id,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }))
      .filter((item) => item.scrollWidth > item.clientWidth + 1 || item.scrollHeight > item.clientHeight + 1);
    return {
      expanded: board.classList.contains("is-expanded"),
      ariaExpanded: button.getAttribute("aria-expanded"),
      board: {
        left: boardRect.left,
        top: boardRect.top,
        right: boardRect.right,
        bottom: boardRect.bottom,
        width: boardRect.width,
        height: boardRect.height,
      },
      paper: {
        width: paperRect.width,
        height: paperRect.height,
        area: paperRect.width * paperRect.height,
      },
      clippedButtons,
      bodyOverflow: getComputedStyle(document.body).overflow,
    };
  });

  const nearFullscreen =
    expanded.board.width >= viewport.width * 0.94 &&
    expanded.board.height >= viewport.height * 0.94;
  add(
    viewport.name,
    "Expanded Trazo subwindow occupies a substantially larger workspace",
    expanded.expanded && expanded.ariaExpanded === "true" && nearFullscreen,
    JSON.stringify(expanded.board),
  );

  add(
    viewport.name,
    "Expanded paper area grows relative to normal mode",
    expanded.paper.area > before.paper.area * 1.25,
    `normal=${Math.round(before.paper.area)}px² expanded=${Math.round(expanded.paper.area)}px²`,
  );

  add(
    viewport.name,
    "Expanded toolbar remains unclipped",
    expanded.clippedButtons.length === 0,
    expanded.clippedButtons.length ? JSON.stringify(expanded.clippedButtons) : "all expanded buttons fit",
  );

  if (viewport.name === "desktop-1728x900") {
    await page.screenshot({
      path: path.join(outDir, "trace-senior-1728x900-expanded.png"),
      fullPage: false,
    });
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(240);
  const collapsed = await page.evaluate(() => ({
    expanded: document.querySelector(".board-panel").classList.contains("is-expanded"),
    ariaExpanded: document.querySelector("#toggle-board-expand").getAttribute("aria-expanded"),
  }));
  add(
    viewport.name,
    "Escape closes expanded Trazo subwindow",
    !collapsed.expanded && collapsed.ariaExpanded === "false",
    JSON.stringify(collapsed),
  );

  add(viewport.name, "No uncaught runtime errors", runtimeErrors.length === 0, runtimeErrors.join(" | ") || "none");
  add(viewport.name, "No console errors", consoleErrors.length === 0, consoleErrors.join(" | ") || "none");

  await page.close();
}

const passed = checks.filter((check) => check.pass).length;
const failed = checks.length - passed;
const report = {
  generated: new Date().toISOString(),
  passed,
  failed,
  checks,
};

const markdown = [
  "# Vistas 3x3 · Senior Trazo Workbench QA",
  "",
  `**Checks:** ${passed} passed · ${failed} failed`,
  "",
  ...viewports.flatMap((viewport) => [
    `## ${viewport.name}`,
    "",
    ...checks
      .filter((check) => check.viewport === viewport.name)
      .map((check) => `${check.pass ? "✅" : "❌"} **${check.name}** — ${check.detail}`),
    "",
  ]),
  "Frames: `trace-senior-1728x900-normal.png`, `trace-senior-1728x900-expanded.png`",
  "",
].join("\n");

await fs.writeFile(path.join(outDir, "trace-workbench-report.json"), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(outDir, "trace-workbench-report.md"), markdown);
console.log(markdown);

await browser.close();
if (failed > 0) process.exit(1);
