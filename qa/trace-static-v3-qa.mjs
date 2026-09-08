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
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const runtimeErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(String(error)));
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForSelector('.board-panel[data-trace-version="3x3-senior-v3-static"]');
  await page.waitForSelector("#senior-grid-overlay");
  await page.waitForTimeout(450);

  const integration = await page.evaluate(() => ({
    versionAttr: document.querySelector(".board-panel")?.dataset.traceVersion,
    runtimeVersion: window.__VISTAS_TRACE_WORKBENCH__?.version,
    cssHref: [...document.styleSheets].map((sheet) => sheet.href || "").find((href) => href.includes("trace-workbench-v3.css")) || "",
    oldDynamicToolbar: Boolean(document.querySelector(".trace-toolbar:not(.trace-toolbar-v3)")),
  }));
  add(viewport.name, "Trazo V3 is integrated statically in production HTML",
    integration.versionAttr === "3x3-senior-v3-static" && integration.runtimeVersion === "3x3-senior-v3-static" && integration.cssHref.includes("trace-workbench-v3.css") && !integration.oldDynamicToolbar,
    JSON.stringify(integration));

  const toolbar = await page.evaluate(() => {
    const board = document.querySelector(".board-panel").getBoundingClientRect();
    const groups = [...document.querySelectorAll(".trace-tool-grid-v3")];
    const buttons = [...document.querySelectorAll(".trace-tool-grid-v3 .tool-button")];
    return {
      board: { left: board.left, right: board.right, width: board.width },
      groups: groups.map((group) => {
        const rect = group.getBoundingClientRect();
        const columns = getComputedStyle(group).gridTemplateColumns.split(" ").filter(Boolean).length;
        return { left: rect.left, right: rect.right, width: rect.width, columns };
      }),
      buttons: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const parent = button.closest(".trace-tool-grid-v3").getBoundingClientRect();
        const label = button.querySelector(".trace-tool-label");
        return {
          id: button.id,
          text: label?.textContent?.trim() || button.textContent.trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          parentLeft: parent.left,
          parentRight: parent.right,
          clientWidth: button.clientWidth,
          scrollWidth: button.scrollWidth,
          clientHeight: button.clientHeight,
          scrollHeight: button.scrollHeight,
          labelClientWidth: label?.clientWidth || 0,
          labelScrollWidth: label?.scrollWidth || 0,
          labelClientHeight: label?.clientHeight || 0,
          labelScrollHeight: label?.scrollHeight || 0,
        };
      }),
    };
  });

  const toolbarProblems = toolbar.buttons.filter((button) =>
    button.left < button.parentLeft - 1 ||
    button.right > button.parentRight + 1 ||
    button.scrollWidth > button.clientWidth + 1 ||
    button.scrollHeight > button.clientHeight + 1 ||
    button.labelScrollWidth > button.labelClientWidth + 1 ||
    button.labelScrollHeight > button.labelClientHeight + 1
  );
  add(viewport.name, "All 8 Trazo buttons and labels stay inside their margins",
    toolbar.buttons.length === 8 && toolbarProblems.length === 0,
    toolbarProblems.length ? JSON.stringify(toolbarProblems) : `${toolbar.buttons.length} buttons fit without clipping`);

  add(viewport.name, "Toolbar groups use readable multi-column geometry",
    toolbar.groups.length === 2 && toolbar.groups.every((group) => group.columns >= 2 && group.width > 0),
    JSON.stringify(toolbar.groups));

  const solution = await page.evaluate(() => {
    const parent = document.querySelector(".solution-controls").getBoundingClientRect();
    const children = [...document.querySelectorAll(".solution-controls > *, .trace-check-group > *")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.id || el.className || el.tagName,
          contained: rect.left >= parent.left - 1 && rect.right <= parent.right + 1 && rect.top >= parent.top - 1 && rect.bottom <= parent.bottom + 1,
        };
      });
    return { children };
  });
  const outside = solution.children.filter((child) => !child.contained);
  add(viewport.name, "Solution controls stay inside the Trazo panel", outside.length === 0,
    outside.length ? JSON.stringify(outside) : "all solution controls contained");

  const grid = await page.locator("#senior-grid-overlay").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const data = ctx.getImageData(0, 0, Math.max(1, Math.min(width, 700)), Math.max(1, Math.min(height, 520))).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent += 1;
    return {
      mode: canvas.closest("#paper-shell")?.dataset.gridMode,
      definition: canvas.dataset.gridDefinition,
      projections: canvas.dataset.projectionGrids,
      width,
      height,
      nonTransparent,
      paperZ: getComputedStyle(document.querySelector("#paper-canvas")).zIndex,
      gridZ: getComputedStyle(canvas).zIndex,
      solutionZ: getComputedStyle(document.querySelector("#solution-canvas")).zIndex,
      pointerEvents: getComputedStyle(canvas).pointerEvents,
    };
  });
  add(viewport.name, "Senior 3x3 grid is visibly rendered between drawing and solution layers",
    grid.mode === "senior-3x3" && grid.definition === "3x3-major-6-snap" && grid.projections === "3" && grid.nonTransparent > 150 && Number(grid.paperZ) < Number(grid.gridZ) && Number(grid.gridZ) < Number(grid.solutionZ) && grid.pointerEvents === "none",
    JSON.stringify(grid));

  const before = await page.locator("#paper-shell").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height, area: rect.width * rect.height };
  });

  await page.screenshot({ path: path.join(outDir, `trace-v3-${viewport.name}-normal.png`), fullPage: false });

  await page.locator("#toggle-board-expand").click();
  await page.waitForTimeout(420);

  const expanded = await page.evaluate(() => {
    const board = document.querySelector(".board-panel");
    const boardRect = board.getBoundingClientRect();
    const paperRect = document.querySelector("#paper-shell").getBoundingClientRect();
    const badButtons = [...document.querySelectorAll(".trace-tool-grid-v3 .tool-button")].filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map((el) => el.id);
    return {
      active: board.classList.contains("is-expanded"),
      ariaExpanded: document.querySelector("#toggle-board-expand").getAttribute("aria-expanded"),
      board: { left: boardRect.left, top: boardRect.top, width: boardRect.width, height: boardRect.height },
      paper: { width: paperRect.width, height: paperRect.height, area: paperRect.width * paperRect.height },
      badButtons,
    };
  });

  add(viewport.name, "Expanded Trazo opens as a near-fullscreen subwindow",
    expanded.active && expanded.ariaExpanded === "true" && expanded.board.width >= viewport.width * .94 && expanded.board.height >= viewport.height * .94,
    JSON.stringify(expanded.board));
  add(viewport.name, "Expanded drawing surface is materially larger",
    expanded.paper.area > before.area * 1.25,
    `normal=${Math.round(before.area)}px² expanded=${Math.round(expanded.paper.area)}px²`);
  add(viewport.name, "Expanded toolbar remains unclipped",
    expanded.badButtons.length === 0,
    expanded.badButtons.length ? JSON.stringify(expanded.badButtons) : "all expanded buttons fit");

  await page.screenshot({ path: path.join(outDir, `trace-v3-${viewport.name}-expanded.png`), fullPage: false });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(220);
  const collapsed = await page.evaluate(() => ({
    active: document.querySelector(".board-panel").classList.contains("is-expanded"),
    ariaExpanded: document.querySelector("#toggle-board-expand").getAttribute("aria-expanded"),
  }));
  add(viewport.name, "Escape restores normal Trazo mode", !collapsed.active && collapsed.ariaExpanded === "false", JSON.stringify(collapsed));

  add(viewport.name, "No uncaught runtime errors", runtimeErrors.length === 0, runtimeErrors.join(" | ") || "none");
  add(viewport.name, "No console errors", consoleErrors.length === 0, consoleErrors.join(" | ") || "none");

  await page.close();
}

const passed = checks.filter((check) => check.pass).length;
const failed = checks.length - passed;
const markdown = [
  "# Vistas 3x3 · Trazo Senior V3 Static QA",
  "",
  `**Checks:** ${passed} passed · ${failed} failed`,
  "",
  ...viewports.flatMap((viewport) => [
    `## ${viewport.name}`,
    "",
    ...checks.filter((check) => check.viewport === viewport.name).map((check) => `${check.pass ? "✅" : "❌"} **${check.name}** — ${check.detail}`),
    "",
  ]),
].join("\n");

await fs.writeFile(path.join(outDir, "trace-v3-static-report.json"), JSON.stringify({ generated: new Date().toISOString(), passed, failed, checks }, null, 2));
await fs.writeFile(path.join(outDir, "trace-v3-static-report.md"), markdown);
console.log(markdown);

await browser.close();
if (failed > 0) process.exit(1);