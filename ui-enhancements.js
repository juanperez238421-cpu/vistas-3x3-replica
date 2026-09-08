import "./trace-workbench-v2.js";
import "./trace-workbench-responsive.js";

/* Progressive, non-destructive UI semantics for the existing Vistas 3x3 app. */

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

function syncPressedState(selector) {
  qa(selector).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });
}

function syncSidebarState() {
  qa("[data-sidebar-tab]").forEach((button) => {
    const active = button.classList.contains("is-active");
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });

  qa("[data-sidebar-panel]").forEach((panel) => {
    const active = panel.classList.contains("is-active");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-hidden", String(!active));
  });
}

function syncPieceCards() {
  qa(".piece-card").forEach((card) => {
    const active = card.classList.contains("is-active");
    if (active) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  });
}

function syncViewerMenuState() {
  const trigger = q("#viewer-status-card");
  const panel = q("#viewer-context-menu");
  if (!trigger || !panel) return;

  trigger.setAttribute("aria-controls", "viewer-context-menu");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", String(!panel.hidden));
}

function syncAllStates() {
  syncPressedState("[data-difficulty]");
  syncPressedState("#tool-line, #toggle-dashed, #tool-erase, #toggle-profile");
  syncPressedState("#toggle-grid-3d, #toggle-axes-3d, [data-view]");
  syncSidebarState();
  syncPieceCards();
  syncViewerMenuState();
}

function applyStaticSemantics() {
  const sidebarTabs = q(".sidebar-tabs");
  sidebarTabs?.setAttribute("role", "tablist");
  sidebarTabs?.setAttribute("aria-label", "Secciones de aprendizaje");

  const difficultyTabs = q(".difficulty-tabs");
  difficultyTabs?.setAttribute("role", "group");
  difficultyTabs?.setAttribute("aria-label", "Nivel de dificultad");

  const pieceMeta = q("#piece-meta");
  pieceMeta?.setAttribute("aria-live", "polite");

  const viewLabel = q("#current-view-label");
  viewLabel?.setAttribute("aria-live", "polite");

  q("#prev-piece")?.setAttribute("aria-keyshortcuts", "Alt+ArrowLeft");
  q("#next-piece")?.setAttribute("aria-keyshortcuts", "Alt+ArrowRight");

  const viewShortcuts = {
    isometric: "Alt+1",
    front: "Alt+2",
    top: "Alt+3",
    right: "Alt+4",
    left: "Alt+5",
  };
  qa("[data-view]").forEach((button) => {
    const shortcut = viewShortcuts[button.dataset.view];
    if (shortcut) button.setAttribute("aria-keyshortcuts", shortcut);
  });

  qa('.color-control input[type="color"]').forEach((input) => {
    const labelText = input.closest("label")?.querySelector("span")?.textContent?.trim();
    if (labelText && !input.getAttribute("aria-label")) input.setAttribute("aria-label", labelText);
  });
}

function isTypingTarget(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function bindKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      q("#prev-piece")?.click();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      q("#next-piece")?.click();
      return;
    }

    const shortcutMap = {
      "1": "isometric",
      "2": "front",
      "3": "top",
      "4": "right",
      "5": "left",
    };
    const view = shortcutMap[event.key];
    if (view) {
      event.preventDefault();
      q(`[data-view="${view}"]`)?.click();
    }
  });
}

function bindTabKeyboardNavigation() {
  q(".sidebar-tabs")?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = qa("[data-sidebar-tab]");
    if (!tabs.length) return;

    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;

    event.preventDefault();
    let next = current;
    if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();
  });
}

function observeDynamicUi() {
  let pending = false;
  const scheduleSync = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      syncAllStates();
    });
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "hidden", "disabled"],
  });
}

applyStaticSemantics();
bindKeyboardShortcuts();
bindTabKeyboardNavigation();
observeDynamicUi();
syncAllStates();
