/*
 * Vistas 3x3 · Senior trace workbench
 * Progressive enhancement: no projection geometry or drawing-state logic is replaced.
 */

const CSS_HREF = "./trace-workbench.css";
const q = (selector, root = document) => root.querySelector(selector);

function ensureStylesheet() {
  if (q(`link[href="${CSS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_HREF;
  document.head.appendChild(link);
}

function toolMark(kind) {
  const mark = document.createElement("span");
  mark.className = `trace-tool-mark trace-tool-mark-${kind}`;
  mark.setAttribute("aria-hidden", "true");
  return mark;
}

function enhanceExistingButton(button, { label, kind, ariaLabel = label }) {
  if (!button) return;
  const text = document.createElement("span");
  text.className = "trace-tool-label";
  text.textContent = label;
  button.replaceChildren(toolMark(kind), text);
  button.setAttribute("aria-label", ariaLabel);
}

function buildToolbarGroup(labelText, row) {
  const group = document.createElement("section");
  group.className = "trace-toolbar-group";
  group.setAttribute("aria-label", labelText);

  const label = document.createElement("p");
  label.className = "trace-group-label";
  label.textContent = labelText;

  group.append(label, row);
  return group;
}

function buildGuideRow() {
  const row = document.createElement("div");
  row.className = "trace-guide-row";
  row.setAttribute("role", "note");

  const items = [
    ["Retícula", "3×3"],
    ["Ajuste", "½ módulo"],
    ["Segmento", "clic inicial + clic final"],
  ];

  items.forEach(([name, value]) => {
    const chip = document.createElement("span");
    chip.className = "trace-guide-chip";
    const strong = document.createElement("strong");
    strong.textContent = `${name}:`;
    chip.append(strong, document.createTextNode(` ${value}`));
    row.appendChild(chip);
  });

  const hint = document.createElement("span");
  hint.className = "trace-expanded-hint";
  hint.textContent = " · Esc para volver al panel normal";
  row.appendChild(hint);
  return row;
}

function buildExpandButton() {
  const button = document.createElement("button");
  button.id = "toggle-board-expand";
  button.className = "tool-button";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "paper-shell");
  button.setAttribute("aria-keyshortcuts", "Escape");

  const label = document.createElement("span");
  label.className = "trace-tool-label";
  label.textContent = "Ampliar trazo";
  button.append(toolMark("expand"), label);
  button.setAttribute("aria-label", "Ampliar panel de trazo");
  return button;
}

function requestAppResize() {
  window.dispatchEvent(new Event("resize"));
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 180);
}

function setupToolbarAndExpansion() {
  const boardPanel = q(".board-panel");
  const boardHead = q(".board-head", boardPanel || document);
  const sourceRow = q(":scope > .tool-row", boardHead || document);
  const solutionControls = q(".solution-controls", boardHead || document);
  if (!boardPanel || !boardHead || !sourceRow || !solutionControls) return null;

  const titleBlock = boardHead.firstElementChild;
  titleBlock?.classList.add("trace-title-block");
  if (titleBlock && !q(".trace-board-subtitle", titleBlock)) {
    const subtitle = document.createElement("p");
    subtitle.className = "trace-board-subtitle";
    subtitle.textContent = "Lámina ortográfica 3×3 · dibuja Lateral, Alzado y Planta con ajuste técnico.";
    titleBlock.appendChild(subtitle);
  }

  const drawingIds = ["tool-line", "toggle-dashed", "tool-erase", "toggle-profile"];
  const documentIds = ["clear-board", "save-image", "save-reference-image"];
  const drawingRow = sourceRow;
  drawingRow.classList.add("trace-tool-grid", "trace-tool-grid-drawing");
  const drawingButtons = drawingIds.map((id) => q(`#${id}`)).filter(Boolean);
  drawingRow.replaceChildren(...drawingButtons);

  const documentRow = document.createElement("div");
  documentRow.className = "tool-row trace-tool-grid trace-tool-grid-document";
  const documentButtons = documentIds.map((id) => q(`#${id}`)).filter(Boolean);
  documentRow.append(...documentButtons);

  enhanceExistingButton(q("#tool-line"), { label: "Recta", kind: "line", ariaLabel: "Herramienta recta" });
  enhanceExistingButton(q("#toggle-dashed"), { label: "Discontinua", kind: "dashed", ariaLabel: "Alternar línea discontinua" });
  enhanceExistingButton(q("#tool-erase"), { label: "Borrar", kind: "erase", ariaLabel: "Borrar segmento" });
  enhanceExistingButton(q("#toggle-profile"), { label: "Perfil", kind: "profile", ariaLabel: "Intercambiar posición de perfil y referencia" });
  enhanceExistingButton(q("#clear-board"), { label: "Limpiar", kind: "clear", ariaLabel: "Limpiar trazo" });
  enhanceExistingButton(q("#save-image"), { label: "Exportar PNG", kind: "png", ariaLabel: "Exportar lámina como PNG" });
  enhanceExistingButton(q("#save-reference-image"), { label: "PNG referencia", kind: "ref", ariaLabel: "Exportar referencia 3D como PNG" });

  const expandButton = buildExpandButton();
  documentRow.appendChild(expandButton);

  const toolbar = document.createElement("div");
  toolbar.className = "trace-toolbar";
  toolbar.append(
    buildToolbarGroup("Dibujo", drawingRow),
    buildToolbarGroup("Documento", documentRow),
  );

  const guideRow = buildGuideRow();
  sourceRow.replaceWith(toolbar);
  boardHead.insertBefore(guideRow, solutionControls);

  function setExpanded(expanded) {
    boardPanel.classList.toggle("is-expanded", expanded);
    document.body.classList.toggle("trace-board-expanded", expanded);
    expandButton.setAttribute("aria-expanded", String(expanded));
    expandButton.setAttribute(
      "aria-label",
      expanded ? "Reducir panel de trazo" : "Ampliar panel de trazo",
    );
    const label = q(".trace-tool-label", expandButton);
    if (label) label.textContent = expanded ? "Reducir" : "Ampliar trazo";

    if (expanded) {
      boardPanel.setAttribute("role", "dialog");
      boardPanel.setAttribute("aria-modal", "true");
      boardPanel.setAttribute("aria-label", "Trazo ampliado · lámina ortográfica 3 por 3");
    } else {
      boardPanel.removeAttribute("role");
      boardPanel.removeAttribute("aria-modal");
      boardPanel.removeAttribute("aria-label");
    }

    requestAppResize();
  }

  expandButton.addEventListener("click", () => {
    setExpanded(!boardPanel.classList.contains("is-expanded"));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !boardPanel.classList.contains("is-expanded")) return;
    event.preventDefault();
    setExpanded(false);
    expandButton.focus({ preventScroll: true });
  });

  return { boardPanel, boardHead, expandButton, setExpanded };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computePaperLayout(width, height) {
  /* Mirrors app.js so the senior overlay stays exactly aligned with the live board. */
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 420);
  const paddingX = clamp(safeWidth * 0.055, 22, 40);
  const paddingTop = clamp(safeHeight * 0.06, 22, 40);
  const paddingBottom = clamp(safeHeight * 0.05, 18, 32);
  const gap = clamp(Math.min(safeWidth, safeHeight) * 0.035, 16, 28);
  const boardWidth = safeWidth - paddingX * 2;
  const boardHeight = safeHeight - paddingTop - paddingBottom;
  const gridSize = Math.min((boardWidth - gap) / 2, (boardHeight - gap) / 2);
  const contentWidth = gridSize * 2 + gap;
  const contentHeight = gridSize * 2 + gap;
  const originX = (safeWidth - contentWidth) / 2;
  const originY = paddingTop + (boardHeight - contentHeight) / 2;

  return {
    width: safeWidth,
    height: safeHeight,
    topLeft: { x: originX, y: originY, size: gridSize },
    topRight: { x: originX + gridSize + gap, y: originY, size: gridSize },
    bottomLeft: { x: originX, y: originY + gridSize + gap, size: gridSize },
    bottomRight: { x: originX + gridSize + gap, y: originY + gridSize + gap, size: gridSize },
  };
}

function drawBadge(ctx, rect, text) {
  const fontSize = clamp(rect.size * 0.045, 8, 12);
  ctx.save();
  ctx.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const padX = 5;
  const padY = 3;
  const width = metrics.width + padX * 2;
  const height = fontSize + padY * 2;
  const x = rect.x + rect.size - width - 5;
  const y = rect.y + 5;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(17,17,17,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "rgba(17,17,17,0.62)";
  ctx.textBaseline = "top";
  ctx.fillText(text, x + padX, y + padY);
  ctx.restore();
}

function drawSeniorGrid(ctx, rect) {
  const major = rect.size / 3;
  const minor = rect.size / 6;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.size, rect.size);
  ctx.clip();

  /* Half-module snap guides: intentionally faint. */
  ctx.strokeStyle = "rgba(17,17,17,0.09)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  [1, 3, 5].forEach((step) => {
    const offset = minor * step;
    ctx.beginPath();
    ctx.moveTo(rect.x + offset, rect.y);
    ctx.lineTo(rect.x + offset, rect.y + rect.size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + offset);
    ctx.lineTo(rect.x + rect.size, rect.y + offset);
    ctx.stroke();
  });

  /* True 3×3 module boundaries. */
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(17,17,17,0.36)";
  ctx.lineWidth = Math.max(1, rect.size * 0.0045);
  [1, 2].forEach((step) => {
    const offset = major * step;
    ctx.beginPath();
    ctx.moveTo(rect.x + offset, rect.y);
    ctx.lineTo(rect.x + offset, rect.y + rect.size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + offset);
    ctx.lineTo(rect.x + rect.size, rect.y + offset);
    ctx.stroke();
  });

  /* Cell-center registration points support visual alignment without dominating the drawing. */
  ctx.fillStyle = "rgba(17,17,17,0.28)";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      ctx.beginPath();
      ctx.arc(
        rect.x + major * (col + 0.5),
        rect.y + major * (row + 0.5),
        clamp(rect.size * 0.006, 1, 2.3),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.restore();
  drawBadge(ctx, rect, "3×3");
}

function drawReferenceBadge(ctx, rect) {
  drawBadge(ctx, rect, "REF");
}

function setupSeniorGridOverlay() {
  const paperShell = q("#paper-shell");
  const paperStack = q(".paper-stack", paperShell || document);
  const paperCanvas = q("#paper-canvas", paperStack || document);
  const solutionCanvas = q("#solution-canvas", paperStack || document);
  const profileButton = q("#toggle-profile");
  if (!paperShell || !paperStack || !paperCanvas || !solutionCanvas) return null;

  paperShell.dataset.gridMode = "senior-3x3";
  paperShell.dataset.snapMode = "half-module";

  const overlay = document.createElement("canvas");
  overlay.id = "senior-grid-overlay";
  overlay.className = "paper-canvas senior-grid-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.gridDefinition = "3x3-major-6-snap";
  overlay.dataset.projectionGrids = "3";
  paperStack.insertBefore(overlay, solutionCanvas);

  const ctx = overlay.getContext("2d");
  let frame = 0;

  function render() {
    frame = 0;
    const width = Math.max(Math.round(paperShell.clientWidth), 1);
    const height = Math.max(Math.round(paperShell.clientHeight), 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    overlay.width = Math.max(Math.round(width * dpr), 1);
    overlay.height = Math.max(Math.round(height * dpr), 1);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const layout = computePaperLayout(width, height);
    const swapped = profileButton?.classList.contains("is-active") ?? false;
    const activeBottom = swapped ? layout.bottomRight : layout.bottomLeft;
    const reference = swapped ? layout.bottomLeft : layout.bottomRight;

    drawSeniorGrid(ctx, layout.topLeft);
    drawSeniorGrid(ctx, layout.topRight);
    drawSeniorGrid(ctx, activeBottom);
    drawReferenceBadge(ctx, reference);

    overlay.dataset.renderWidth = String(width);
    overlay.dataset.renderHeight = String(height);
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(paperShell);
  window.addEventListener("resize", schedule);

  if (profileButton) {
    const profileObserver = new MutationObserver(schedule);
    profileObserver.observe(profileButton, { attributes: true, attributeFilter: ["class", "aria-pressed"] });
  }

  schedule();
  return { overlay, render: schedule };
}

ensureStylesheet();
const workbench = setupToolbarAndExpansion();
const gridOverlay = setupSeniorGridOverlay();

/* Expose only QA-safe semantic state, never application geometry/state internals. */
window.__VISTAS_TRACE_WORKBENCH__ = {
  version: "3x3-senior-1",
  expanded: () => workbench?.boardPanel.classList.contains("is-expanded") ?? false,
  gridReady: () => Boolean(gridOverlay?.overlay?.dataset.gridDefinition),
};
