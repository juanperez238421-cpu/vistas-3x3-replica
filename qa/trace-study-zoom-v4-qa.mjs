import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.QA_BASE_URL || "http://127.0.0.1:4173/";
const outDir = path.resolve("qa-artifacts");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: "source-1909x958", width: 1909, height: 958 },
  { name: "desktop-1728x900", width: 1728, height: 900 },
  { name: "laptop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
];

const checks = [];
const add = (viewport, name, pass, detail) => checks.push({ viewport, name, pass, detail });
const rect = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const runtimeErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.waitForSelector("#toggle-board-expand");
  await page.waitForSelector("#senior-grid-overlay");
  await page.waitForTimeout(500);

  const staticState = await page.evaluate(() => ({
    htmlVersion: document.querySelector(".board-panel")?.dataset.traceVersion,
    runtimeVersion: window.__VISTAS_TRACE_WORKBENCH__?.version,
    buttonText: document.querySelector("#toggle-board-expand .trace-tool-label")?.textContent?.trim(),
    gridMode: document.querySelector("#paper-shell")?.dataset.gridMode,
    gridDefinition: document.querySelector("#senior-grid-overlay")?.dataset.gridDefinition,
    headerLabels: document.querySelector("#senior-grid-overlay")?.dataset.headerLabels,
  }));
  add(
    viewport.name,
    "Trazo V4 is wired statically with study zoom and labeled Senior grid",
    staticState.htmlVersion === "3x3-senior-v4-study-zoom" &&
      staticState.runtimeVersion === "3x3-senior-v4-study-zoom" &&
      staticState.buttonText === "Zoom figura + trazo" &&
      staticState.gridMode === "senior-3x3-v4" &&
      staticState.gridDefinition === "3x3-v4-study" &&
      staticState.headerLabels === "4",
    JSON.stringify(staticState),
  );

  const normalGeometry = await page.evaluate(() => {
    const get = (selector) => document.querySelector(selector)?.getBoundingClientRect();
    const board = get(".board-panel");
    const title = get(".trace-title-block");
    const toolbar = get(".trace-toolbar-v3");
    const guide = get(".trace-guide-row-v3");
    const solution = get(".solution-controls");
    const paper = get("#paper-shell");
    const viewer = get("#three-stage");
    return {
      board: board && { left: board.left, top: board.top, right: board.right, bottom: board.bottom, width: board.width, height: board.height },
      title: title && { left: title.left, top: title.top, right: title.right, bottom: title.bottom, width: title.width, height: title.height },
      toolbar: toolbar && { left: toolbar.left, top: toolbar.top, right: toolbar.right, bottom: toolbar.bottom, width: toolbar.width, height: toolbar.height },
      guide: guide && { left: guide.left, top: guide.top, right: guide.right, bottom: guide.bottom, width: guide.width, height: guide.height },
      solution: solution && { left: solution.left, top: solution.top, right: solution.right, bottom: solution.bottom, width: solution.width, height: solution.height },
      paper: paper && { left: paper.left, top: paper.top, right: paper.right, bottom: paper.bottom, width: paper.width, height: paper.height, area: paper.width * paper.height },
      viewer: viewer && { left: viewer.left, top: viewer.top, right: viewer.right, bottom: viewer.bottom, width: viewer.width, height: viewer.height, area: viewer.width * viewer.height },
    };
  });

  const within = (child, parent) =>
    child.left >= parent.left - 1 && child.right <= parent.right + 1 && child.top >= parent.top - 1 && child.bottom <= parent.bottom + 1;
  const noVerticalOverlap =
    normalGeometry.toolbar.bottom <= normalGeometry.guide.top + 1 &&
    normalGeometry.guide.bottom <= normalGeometry.solution.top + 1 &&
    normalGeometry.solution.bottom <= normalGeometry.paper.top + 2;
  add(
    viewport.name,
    "Trazo header groups do not overlap the drawing sheet",
    within(normalGeometry.toolbar, normalGeometry.board) &&
      within(normalGeometry.guide, normalGeometry.board) &&
      within(normalGeometry.solution, normalGeometry.board) &&
      within(normalGeometry.paper, normalGeometry.board) &&
      noVerticalOverlap,
    JSON.stringify(normalGeometry),
  );

  const buttons = await page.locator(".trace-tool-grid-v3 .tool-button").evaluateAll((els) =>
    els.map((el) => ({
      id: el.id,
      text: el.textContent.trim(),
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      rect: (() => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })(),
      parent: (() => { const r = el.parentElement.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })(),
    })),
  );
  const clipped = buttons.filter((b) =>
    b.scrollWidth > b.clientWidth + 1 ||
    b.scrollHeight > b.clientHeight + 1 ||
    b.rect.left < b.parent.left - 1 || b.rect.right > b.parent.right + 1 ||
    b.rect.top < b.parent.top - 1 || b.rect.bottom > b.parent.bottom + 1
  );
  add(
    viewport.name,
    "All Trazo buttons and labels remain inside their margins",
    buttons.length === 8 && clipped.length === 0,
    clipped.length ? JSON.stringify(clipped) : "8 buttons fit without clipping",
  );

  const minimumPaperHeight = viewport.width >= 1700 ? 390 : viewport.width >= 1400 ? 360 : 280;
  add(
    viewport.name,
    "Normal drawing sheet retains useful vertical workspace",
    normalGeometry.paper.height >= minimumPaperHeight,
    `paper=${Math.round(normalGeometry.paper.width)}×${Math.round(normalGeometry.paper.height)} threshold=${minimumPaperHeight}`,
  );

  const grid = await page.locator("#senior-grid-overlay").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    const sampleWidth = Math.max(1, Math.min(canvas.width, 800));
    const sampleHeight = Math.max(1, Math.min(canvas.height, 600));
    const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent += 1;
    return {
      width: canvas.width,
      height: canvas.height,
      nonTransparent,
      headerLabels: canvas.dataset.headerLabels,
      z: getComputedStyle(canvas).zIndex,
      pointerEvents: getComputedStyle(canvas).pointerEvents,
      solutionZ: getComputedStyle(document.querySelector("#solution-canvas")).zIndex,
      solutionBackground: getComputedStyle(document.querySelector("#solution-canvas")).backgroundColor,
    };
  });
  add(
    viewport.name,
    "Senior grid and four projection header bands render below the transparent solution layer",
    grid.nonTransparent > 100 && grid.headerLabels === "4" && grid.z === "1" && grid.solutionZ === "2" && grid.pointerEvents === "none" && /rgba\(0, 0, 0, 0\)|transparent/.test(grid.solutionBackground),
    JSON.stringify(grid),
  );

  if (viewport.name === "source-1909x958") {
    await page.screenshot({ path: path.join(outDir, "trace-v4-1909x958-normal.png"), fullPage: false });
  }

  const pieceBefore = await page.locator("#piece-label").textContent();
  await page.locator("#toggle-board-expand").click();
  await page.waitForTimeout(550);

  const zoom = await page.evaluate(() => {
    const get = (selector) => document.querySelector(selector)?.getBoundingClientRect();
    const shell = get("#main-content");
    const viewerPanel = get(".viewer-panel");
    const boardPanel = get(".board-panel");
    const viewer = get("#three-stage");
    const paper = get("#paper-shell");
    const library = document.querySelector(".library-panel");
    const button = document.querySelector("#toggle-board-expand");
    return {
      bodyClass: document.body.classList.contains("trace-study-zoom"),
      shellClass: document.querySelector("#main-content").classList.contains("is-study-zoom"),
      shell: shell && { left: shell.left, top: shell.top, right: shell.right, bottom: shell.bottom, width: shell.width, height: shell.height },
      viewerPanel: viewerPanel && { left: viewerPanel.left, top: viewerPanel.top, right: viewerPanel.right, bottom: viewerPanel.bottom, width: viewerPanel.width, height: viewerPanel.height },
      boardPanel: boardPanel && { left: boardPanel.left, top: boardPanel.top, right: boardPanel.right, bottom: boardPanel.bottom, width: boardPanel.width, height: boardPanel.height },
      viewer: viewer && { left: viewer.left, top: viewer.top, right: viewer.right, bottom: viewer.bottom, width: viewer.width, height: viewer.height, area: viewer.width * viewer.height },
      paper: paper && { left: paper.left, top: paper.top, right: paper.right, bottom: paper.bottom, width: paper.width, height: paper.height, area: paper.width * paper.height },
      libraryDisplay: getComputedStyle(library).display,
      ariaExpanded: button.getAttribute("aria-expanded"),
      buttonText: button.querySelector(".trace-tool-label")?.textContent?.trim(),
      paperCanvasCount: document.querySelectorAll("#paper-canvas").length,
      viewerLayerCount: document.querySelectorAll("#viewer-render-layer").length,
      piece: document.querySelector("#piece-label")?.textContent,
    };
  });

  const sideBySide = viewport.width > 900
    ? zoom.viewerPanel.right <= zoom.boardPanel.left + 1 && zoom.viewerPanel.top === zoom.boardPanel.top
    : true;
  add(
    viewport.name,
    "Study zoom opens one enlarged Figure + Trazo workspace",
    zoom.bodyClass && zoom.shellClass && zoom.libraryDisplay === "none" && zoom.ariaExpanded === "true" && zoom.buttonText === "Salir del zoom" && sideBySide,
    JSON.stringify(zoom),
  );

  add(
    viewport.name,
    "Study zoom preserves the original live figure and drawing canvases",
    zoom.paperCanvasCount === 1 && zoom.viewerLayerCount === 1 && zoom.piece === pieceBefore,
    `paperCanvasCount=${zoom.paperCanvasCount}, viewerLayerCount=${zoom.viewerLayerCount}, piece=${zoom.piece}`,
  );

  const paperGrowth = zoom.paper.area / normalGeometry.paper.area;
  const viewerGrowth = zoom.viewer.area / normalGeometry.viewer.area;
  add(
    viewport.name,
    "Study zoom materially enlarges the drawing workspace",
    paperGrowth >= (viewport.width >= 1400 ? 1.55 : 1.25),
    `normal=${Math.round(normalGeometry.paper.area)}px² zoom=${Math.round(zoom.paper.area)}px² ratio=${paperGrowth.toFixed(2)}`,
  );
  add(
    viewport.name,
    "Figure remains large and usable beside the drawing sheet",
    zoom.viewer.width >= 330 && zoom.viewer.height >= 280 && viewerGrowth >= 0.92,
    `viewer=${Math.round(zoom.viewer.width)}×${Math.round(zoom.viewer.height)} ratio=${viewerGrowth.toFixed(2)}`,
  );

  const zoomButtons = await page.locator(".trace-tool-grid-v3 .tool-button").evaluateAll((els) =>
    els.map((el) => ({ id: el.id, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight })),
  );
  const zoomClipped = zoomButtons.filter((b) => b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1);
  add(
    viewport.name,
    "Study zoom toolbar remains unclipped",
    zoomClipped.length === 0,
    zoomClipped.length ? JSON.stringify(zoomClipped) : "all zoom toolbar labels fit",
  );

  if (viewport.name === "source-1909x958") {
    await page.screenshot({ path: path.join(outDir, "trace-v4-1909x958-study-zoom.png"), fullPage: false });
  }
  if (viewport.name === "laptop-1440x900") {
    await page.screenshot({ path: path.join(outDir, "trace-v4-1440x900-study-zoom.png"), fullPage: false });
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({
    bodyClass: document.body.classList.contains("trace-study-zoom"),
    shellClass: document.querySelector("#main-content").classList.contains("is-study-zoom"),
    ariaExpanded: document.querySelector("#toggle-board-expand").getAttribute("aria-expanded"),
    buttonText: document.querySelector("#toggle-board-expand .trace-tool-label")?.textContent?.trim(),
  }));
  add(
    viewport.name,
    "Escape closes study zoom and restores normal controls",
    !closed.bodyClass && !closed.shellClass && closed.ariaExpanded === "false" && closed.buttonText === "Zoom figura + trazo",
    JSON.stringify(closed),
  );

  add(viewport.name, "No uncaught runtime errors", runtimeErrors.length === 0, runtimeErrors.join(" | ") || "none");
  add(viewport.name, "No console errors", consoleErrors.length === 0, consoleErrors.join(" | ") || "none");

  await page.close();
}

const passed = checks.filter((check) => check.pass).length;
const failed = checks.length - passed;
const report = { generated: new Date().toISOString(), passed, failed, checks };
const markdown = [
  "# Vistas 3x3 · Trazo Senior V4 Figure + Trace Study Zoom QA",
  "",
  `**Checks:** ${passed} passed · ${failed} failed`,
  "",
  ...viewports.flatMap((viewport) => [
    `## ${viewport.name}`,
    "",
    ...checks.filter((check) => check.viewport === viewport.name).map((check) => `${check.pass ? "✅" : "❌"} **${check.name}** — ${check.detail}`),
    "",
  ]),
  "Frames: `trace-v4-1909x958-normal.png`, `trace-v4-1909x958-study-zoom.png`, `trace-v4-1440x900-study-zoom.png`",
  "",
].join("\n");

await fs.writeFile(path.join(outDir, "trace-study-zoom-v4-report.json"), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(outDir, "trace-study-zoom-v4-report.md"), markdown);
console.log(markdown);

await browser.close();
if (failed > 0) process.exit(1);
