/* Vistas 3x3 · Trazo Senior V4 · Figure + Trace Study Zoom */

const q = (selector, root = document) => root.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function requestAppResize() {
  window.dispatchEvent(new Event("resize"));
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 180);
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 420);
}

function setupStudyZoom() {
  const appShell = q("#main-content");
  const libraryPanel = q(".library-panel");
  const viewerPanel = q(".viewer-panel");
  const boardPanel = q(".board-panel");
  const button = q("#toggle-board-expand");
  if (!appShell || !viewerPanel || !boardPanel || !button) return null;

  const label = q(".trace-tool-label", button);
  button.setAttribute("aria-controls", "main-content");
  button.setAttribute("aria-label", "Abrir modo estudio con figura 3D y trazo ampliados");
  if (label) label.textContent = "Zoom figura + trazo";

  function setStudyZoom(active) {
    document.body.classList.toggle("trace-study-zoom", active);
    appShell.classList.toggle("is-study-zoom", active);
    viewerPanel.classList.toggle("is-study-zoom-peer", active);
    boardPanel.classList.toggle("is-study-zoom-peer", active);
    button.setAttribute("aria-expanded", String(active));
    button.setAttribute(
      "aria-label",
      active ? "Cerrar modo estudio de figura y trazo" : "Abrir modo estudio con figura 3D y trazo ampliados",
    );
    if (label) label.textContent = active ? "Salir del zoom" : "Zoom figura + trazo";

    if (active) {
      appShell.setAttribute("role", "dialog");
      appShell.setAttribute("aria-modal", "true");
      appShell.setAttribute("aria-label", "Modo estudio · figura 3D y lámina de trazo ampliadas");
      appShell.dataset.studyZoom = "figure-trace";
    } else {
      appShell.removeAttribute("role");
      appShell.removeAttribute("aria-modal");
      appShell.removeAttribute("aria-label");
      delete appShell.dataset.studyZoom;
    }

    if (libraryPanel) libraryPanel.setAttribute("aria-hidden", String(active));
    requestAppResize();
  }

  button.addEventListener("click", () => setStudyZoom(!appShell.classList.contains("is-study-zoom")));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !appShell.classList.contains("is-study-zoom")) return;
    event.preventDefault();
    setStudyZoom(false);
    button.focus({ preventScroll: true });
  });

  return { appShell, viewerPanel, boardPanel, button, setStudyZoom };
}

function computePaperLayout(width, height) {
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
    gap,
    topLeft: { x: originX, y: originY, size: gridSize },
    topRight: { x: originX + gridSize + gap, y: originY, size: gridSize },
    bottomLeft: { x: originX, y: originY + gridSize + gap, size: gridSize },
    bottomRight: { x: originX + gridSize + gap, y: originY + gridSize + gap, size: gridSize },
  };
}

function drawProjectionHeader(ctx, rect, label, badge) {
  const fontSize = clamp(rect.size * 0.043, 8, 11);
  const bandHeight = fontSize + 6;
  const legacyMaskHeight = clamp(rect.size * 0.11, 25, 38);
  const maskTop = Math.max(0, rect.y - legacyMaskHeight);
  const labelY = Math.max(maskTop + 2, rect.y - bandHeight - 3);

  ctx.save();

  /*
   * app.js still paints its historic projection label on the drawing canvas.
   * V4 keeps that canvas untouched for compatibility, then masks the complete
   * historic label zone on this transparent overlay before drawing the new
   * technical header. The taller mask is important in enlarged study mode,
   * where the inherited label font also scales up.
   */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(rect.x - 4, maskTop, rect.size + 8, rect.y - maskTop + 1);

  ctx.strokeStyle = "rgba(17,17,17,.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y - 1);
  ctx.lineTo(rect.x + rect.size, rect.y - 1);
  ctx.stroke();

  ctx.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = "rgba(17,17,17,.82)";
  ctx.textBaseline = "top";
  ctx.fillText(label, rect.x + 2, labelY);

  if (badge) {
    ctx.font = `700 ${Math.max(7, fontSize - 1)}px "Segoe UI", Arial, sans-serif`;
    const metrics = ctx.measureText(badge);
    const badgeWidth = metrics.width + 8;
    const bx = rect.x + rect.size - badgeWidth - 2;
    ctx.fillStyle = "rgba(17,17,17,.06)";
    ctx.fillRect(bx, labelY - 1, badgeWidth, bandHeight - 2);
    ctx.strokeStyle = "rgba(17,17,17,.22)";
    ctx.strokeRect(bx + .5, labelY - .5, badgeWidth - 1, bandHeight - 3);
    ctx.fillStyle = "rgba(17,17,17,.72)";
    ctx.fillText(badge, bx + 4, labelY);
  }
  ctx.restore();
}

function drawSeniorGrid(ctx, rect) {
  const major = rect.size / 3;
  const minor = rect.size / 6;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.size, rect.size);
  ctx.clip();

  /* Half-module snap guides. */
  ctx.strokeStyle = "rgba(17,17,17,.11)";
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

  /* Main 3×3 modules. */
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(17,17,17,.32)";
  ctx.lineWidth = Math.max(1, rect.size * 0.0042);
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

  /* Technical perimeter. */
  ctx.strokeStyle = "rgba(17,17,17,.48)";
  ctx.lineWidth = Math.max(1.1, rect.size * 0.005);
  ctx.strokeRect(rect.x + .5, rect.y + .5, rect.size - 1, rect.size - 1);

  /* Cell registration points. */
  ctx.fillStyle = "rgba(17,17,17,.28)";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      ctx.beginPath();
      ctx.arc(
        rect.x + major * (col + .5),
        rect.y + major * (row + .5),
        clamp(rect.size * .0055, 1, 2.2),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

function setupSeniorGrid() {
  const shell = q("#paper-shell");
  const overlay = q("#senior-grid-overlay");
  const profileButton = q("#toggle-profile");
  if (!shell || !overlay) return null;

  shell.dataset.gridMode = "senior-3x3-v4";
  shell.dataset.snapMode = "half-module";
  overlay.dataset.gridDefinition = "3x3-v4-study";
  overlay.dataset.projectionGrids = "3";
  overlay.dataset.headerLabels = "4";

  const ctx = overlay.getContext("2d");
  let frame = 0;

  function renderNow() {
    frame = 0;
    const width = Math.max(Math.round(shell.clientWidth), 1);
    const height = Math.max(Math.round(shell.clientHeight), 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    overlay.width = Math.max(Math.round(width * dpr), 1);
    overlay.height = Math.max(Math.round(height * dpr), 1);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const layout = computePaperLayout(width, height);
    const swapped = profileButton?.classList.contains("is-active") ?? false;
    const bottomProjection = swapped ? layout.bottomRight : layout.bottomLeft;
    const reference = swapped ? layout.bottomLeft : layout.bottomRight;

    drawSeniorGrid(ctx, layout.topLeft);
    drawSeniorGrid(ctx, layout.topRight);
    drawSeniorGrid(ctx, bottomProjection);

    drawProjectionHeader(ctx, layout.topLeft, "LATERAL", "3×3");
    drawProjectionHeader(ctx, layout.topRight, "ALZADO", "3×3");
    drawProjectionHeader(ctx, bottomProjection, "PLANTA", "3×3");
    drawProjectionHeader(ctx, reference, "REFERENCIA", "REF");

    overlay.dataset.renderWidth = String(width);
    overlay.dataset.renderHeight = String(height);
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(renderNow);
  }

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(shell);
  window.addEventListener("resize", schedule);

  if (profileButton) {
    const profileObserver = new MutationObserver(schedule);
    profileObserver.observe(profileButton, {
      attributes: true,
      attributeFilter: ["class", "aria-pressed"],
    });
  }

  schedule();
  return { overlay, schedule };
}

const studyZoom = setupStudyZoom();
const grid = setupSeniorGrid();

window.__VISTAS_TRACE_WORKBENCH__ = {
  version: "3x3-senior-v4-study-zoom",
  studyZoom: () => studyZoom?.appShell.classList.contains("is-study-zoom") ?? false,
  expanded: () => studyZoom?.appShell.classList.contains("is-study-zoom") ?? false,
  gridReady: () => Boolean(grid?.overlay?.dataset.gridDefinition),
};
