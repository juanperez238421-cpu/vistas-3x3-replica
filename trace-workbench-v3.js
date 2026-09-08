/* Vistas 3x3 · Trazo Senior V3 static controller */

const q = (selector, root = document) => root.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function requestAppResize() {
  window.dispatchEvent(new Event("resize"));
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 180);
}

function setupExpansion() {
  const boardPanel = q(".board-panel");
  const button = q("#toggle-board-expand");
  if (!boardPanel || !button) return null;

  const label = q(".trace-tool-label", button);

  function setExpanded(expanded) {
    boardPanel.classList.toggle("is-expanded", expanded);
    document.body.classList.toggle("trace-board-expanded", expanded);
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-label", expanded ? "Reducir panel de trazo" : "Ampliar panel de trazo");
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

  button.addEventListener("click", () => setExpanded(!boardPanel.classList.contains("is-expanded")));
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !boardPanel.classList.contains("is-expanded")) return;
    event.preventDefault();
    setExpanded(false);
    button.focus({ preventScroll: true });
  });

  return { boardPanel, button, setExpanded };
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
    topLeft: { x: originX, y: originY, size: gridSize },
    topRight: { x: originX + gridSize + gap, y: originY, size: gridSize },
    bottomLeft: { x: originX, y: originY + gridSize + gap, size: gridSize },
    bottomRight: { x: originX + gridSize + gap, y: originY + gridSize + gap, size: gridSize },
  };
}

function drawBadge(ctx, rect, text) {
  const fontSize = clamp(rect.size * 0.047, 8, 12);
  ctx.save();
  ctx.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const px = 5;
  const py = 3;
  const width = metrics.width + px * 2;
  const height = fontSize + py * 2;
  const x = rect.x + rect.size - width - 5;
  const y = rect.y + 5;
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(17,17,17,.32)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "rgba(17,17,17,.72)";
  ctx.textBaseline = "top";
  ctx.fillText(text, x + px, y + py);
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
  ctx.strokeStyle = "rgba(17,17,17,.14)";
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

  /* Main 3x3 modules. */
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(17,17,17,.42)";
  ctx.lineWidth = Math.max(1.1, rect.size * 0.0045);
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

  /* Outer technical frame. */
  ctx.strokeStyle = "rgba(17,17,17,.56)";
  ctx.lineWidth = Math.max(1.2, rect.size * 0.0055);
  ctx.strokeRect(rect.x + .5, rect.y + .5, rect.size - 1, rect.size - 1);

  /* Cell registration points. */
  ctx.fillStyle = "rgba(17,17,17,.34)";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      ctx.beginPath();
      ctx.arc(
        rect.x + major * (col + .5),
        rect.y + major * (row + .5),
        clamp(rect.size * .006, 1, 2.4),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.restore();
  drawBadge(ctx, rect, "3×3");
}

function setupSeniorGrid() {
  const shell = q("#paper-shell");
  const overlay = q("#senior-grid-overlay");
  const profileButton = q("#toggle-profile");
  if (!shell || !overlay) return null;

  shell.dataset.gridMode = "senior-3x3";
  shell.dataset.snapMode = "half-module";
  overlay.dataset.gridDefinition = "3x3-major-6-snap";
  overlay.dataset.projectionGrids = "3";

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
    const activeBottom = swapped ? layout.bottomRight : layout.bottomLeft;
    const reference = swapped ? layout.bottomLeft : layout.bottomRight;

    drawSeniorGrid(ctx, layout.topLeft);
    drawSeniorGrid(ctx, layout.topRight);
    drawSeniorGrid(ctx, activeBottom);
    drawBadge(ctx, reference, "REF");

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

const expansion = setupExpansion();
const grid = setupSeniorGrid();

window.__VISTAS_TRACE_WORKBENCH__ = {
  version: "3x3-senior-v3-static",
  expanded: () => expansion?.boardPanel.classList.contains("is-expanded") ?? false,
  gridReady: () => Boolean(grid?.overlay?.dataset.gridDefinition),
};