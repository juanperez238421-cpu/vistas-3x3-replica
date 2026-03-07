import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/environments/RoomEnvironment.js";

const VIEW_FRUSTUM = 7.2;
const CAMERA_DISTANCE = 18;
const CAMERA_DIRECTION = new THREE.Vector3(1, 1, -1).normalize();
const ZOOM_LIMITS = {
  minRatio: 0.52,
  maxRatio: 1.92,
};

const PRESET_VIEWS = {
  isometric: {
    label: "Isometrica",
    direction: CAMERA_DIRECTION.clone(),
    up: new THREE.Vector3(0, 1, 0),
    padding: { x: 1.12, y: 1.14 },
  },
  front: {
    label: "Alzado",
    direction: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0),
    padding: { x: 1.1, y: 1.12 },
  },
  back: {
    label: "Posterior",
    direction: new THREE.Vector3(0, 0, 1),
    up: new THREE.Vector3(0, 1, 0),
    padding: { x: 1.1, y: 1.12 },
  },
  right: {
    label: "Lateral der.",
    direction: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    padding: { x: 1.1, y: 1.12 },
  },
  left: {
    label: "Lateral izq.",
    direction: new THREE.Vector3(-1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    padding: { x: 1.1, y: 1.12 },
  },
  top: {
    label: "Planta",
    direction: new THREE.Vector3(0, 1, 0),
    /* Keep planta folded in technical-drawing convention: screen-up follows the front edge and the TOP label stays upright. */
    up: new THREE.Vector3(0, 0, -1),
    padding: { x: 1.08, y: 1.08 },
  },
  bottom: {
    label: "Inferior",
    direction: new THREE.Vector3(0, -1, 0),
    up: new THREE.Vector3(0, 0, 1),
    padding: { x: 1.08, y: 1.08 },
  },
};

const VIEW_MATCH_THRESHOLDS = {
  orthographic: 0.985,
  isometric: 0.94,
};

const BOARD_LABELS = {
  topLeft: "Lateral",
  topRight: "Alzado",
  bottom: "Planta",
  preview: "Referencia",
};

const SOLUTION_VIEW_CONFIG = {
  lateral: { preset: "right", color: "#B88A5E" },
  alzado: { preset: "front", color: "#5B7DC8" },
  planta: { preset: "top", color: "#5F8D76" },
};
const SOLUTION_EDGE_THRESHOLD = 1;
const SOLUTION_SEGMENT_EPSILON = 0.0008;
const SOLUTION_FACE_FILL_ALPHA = 0.46;
const SOLUTION_FACE_STROKE_ALPHA = 0.58;

const VIEWER_DEFAULT_COLORS = {
  figure: "#C7CDD3",
  grid: "#CBD3DC",
  background: "#FDFEFF",
  accent: "#1A2735",
  facePaint: "#B87333",
};

const ORIENTATION_LABELS = {
  top: "Superior",
  bottom: "Inferior",
  right: "Lateral derecha",
  left: "Lateral izquierda",
  back: "Posterior",
  front: "Frontal",
};

const METALLIC_SWATCHES = {
  gold: { color: "#D4AF37", metalness: 0.94, roughness: 0.24 },
  silver: { color: "#C9D1D9", metalness: 0.91, roughness: 0.2 },
  copper: { color: "#B66A3C", metalness: 0.93, roughness: 0.28 },
  bronze: { color: "#8F6B3E", metalness: 0.89, roughness: 0.32 },
  titanium: { color: "#95A5B1", metalness: 0.85, roughness: 0.27 },
  blue_steel: { color: "#5B7C99", metalness: 0.9, roughness: 0.25 },
  graphite: { color: "#4D5863", metalness: 0.82, roughness: 0.35 },
};

const METAL_ORIENTATION_SHIFT = {
  top: 0.08,
  front: 0.02,
  right: -0.03,
  left: 0.04,
  back: -0.06,
  bottom: -0.12,
};

const FIGURE_MATERIAL_PRESETS = {
  cool_core: {
    top: "silver",
    front: "graphite",
    left: "copper",
    right: "blue_steel",
    back: "bronze",
    bottom: "titanium",
    secondary: ["gold", "silver", "copper"],
  },
  titanium_mix: {
    top: "titanium",
    front: "blue_steel",
    left: "silver",
    right: "graphite",
    back: "bronze",
    bottom: "graphite",
    secondary: ["copper", "gold", "silver"],
  },
  warm_contrast: {
    top: "silver",
    front: "bronze",
    left: "copper",
    right: "titanium",
    back: "graphite",
    bottom: "blue_steel",
    secondary: ["gold", "copper", "silver"],
  },
  engineering_blue: {
    top: "silver",
    front: "blue_steel",
    left: "graphite",
    right: "titanium",
    back: "copper",
    bottom: "graphite",
    secondary: ["bronze", "silver", "gold"],
  },
  graphite_gold: {
    top: "gold",
    front: "graphite",
    left: "blue_steel",
    right: "silver",
    back: "bronze",
    bottom: "graphite",
    secondary: ["titanium", "gold", "copper"],
  },
  studio_metal: {
    top: "silver",
    front: "titanium",
    left: "blue_steel",
    right: "copper",
    back: "graphite",
    bottom: "bronze",
    secondary: ["gold", "silver", "graphite"],
  },
};

const FIGURE_MATERIALS = {
  B01: FIGURE_MATERIAL_PRESETS.cool_core,
  B02: FIGURE_MATERIAL_PRESETS.warm_contrast,
  B03: FIGURE_MATERIAL_PRESETS.engineering_blue,
  B04: FIGURE_MATERIAL_PRESETS.titanium_mix,
  B05: FIGURE_MATERIAL_PRESETS.studio_metal,
  I01: FIGURE_MATERIAL_PRESETS.cool_core,
  I02: FIGURE_MATERIAL_PRESETS.titanium_mix,
  I03: FIGURE_MATERIAL_PRESETS.warm_contrast,
  I04: FIGURE_MATERIAL_PRESETS.engineering_blue,
  I05: FIGURE_MATERIAL_PRESETS.graphite_gold,
  I06: FIGURE_MATERIAL_PRESETS.studio_metal,
  I07: FIGURE_MATERIAL_PRESETS.cool_core,
  I08: FIGURE_MATERIAL_PRESETS.titanium_mix,
  I09: FIGURE_MATERIAL_PRESETS.warm_contrast,
  I10: FIGURE_MATERIAL_PRESETS.engineering_blue,
  I11: FIGURE_MATERIAL_PRESETS.graphite_gold,
  I12: FIGURE_MATERIAL_PRESETS.studio_metal,
  A01: FIGURE_MATERIAL_PRESETS.graphite_gold,
  A02: FIGURE_MATERIAL_PRESETS.engineering_blue,
  A03: FIGURE_MATERIAL_PRESETS.studio_metal,
  A04: FIGURE_MATERIAL_PRESETS.titanium_mix,
  A05: FIGURE_MATERIAL_PRESETS.cool_core,
};

const FACE_TONE_VARIANTS = [0.18, -0.12, 0.08, -0.18, 0.14, -0.05];

function voxelPiece(id, title, difficulty, summary, cells) {
  return {
    id,
    title,
    difficulty,
    summary,
    source: "voxel",
    cells,
  };
}

const INTERMEDIATE_CATALOG = [
  { number: 1, title: "Modelo 01", summary: "Cambios de nivel centrales y lectura axial." },
  { number: 2, title: "Modelo 02", summary: "Retranqueo frontal con apoyo continuo." },
  { number: 3, title: "Modelo 03", summary: "Lectura compacta con cambio de masa lateral." },
  { number: 4, title: "Modelo 04", summary: "Masa alta con recorte visible en una esquina." },
  { number: 5, title: "Modelo 05", summary: "Escalonamiento cruzado y aristas interiores." },
  { number: 6, title: "Modelo 06", summary: "Desfase entre base, plano superior y profundidad." },
  { number: 7, title: "Modelo 07", summary: "Huella irregular con alturas intermedias." },
  { number: 8, title: "Modelo 08", summary: "Contraste entre llenos, cortes y perfiles." },
  { number: 9, title: "Modelo 09", summary: "Apoyo continuo con muesca superior." },
  { number: 10, title: "Modelo 10", summary: "Volumen compuesto en tres niveles." },
  { number: 11, title: "Modelo 11", summary: "Seccion lateral mas exigente que el contorno frontal." },
  { number: 12, title: "Modelo 12", summary: "Lectura espacial con varias aristas ocultas." },
];

function jsonPiece(entry) {
  const code = String(entry.number).padStart(2, "0");
  return {
    id: `I${code}`,
    title: entry.title,
    difficulty: "intermedio",
    summary: entry.summary,
    source: "json",
    url: `./piezas3x3/piezas_${entry.number}.json`,
  };
}

const BASIC_PIECES = [
  voxelPiece(
    "B01",
    "Escalon frontal",
    "basico",
    "Lectura directa con tres alturas claras.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 0],
      [1, 1, 0],
      [0, 2, 0],
    ],
  ),
  voxelPiece(
    "B02",
    "Esquina en L",
    "basico",
    "Base simple con giro lateral muy visible.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
  ),
  voxelPiece(
    "B03",
    "Plataforma y torre",
    "basico",
    "Masa base con una elevacion concentrada.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
      [2, 0, 1],
      [1, 1, 1],
      [2, 1, 1],
      [1, 2, 1],
    ],
  ),
  voxelPiece(
    "B04",
    "Grada lateral",
    "basico",
    "Secuencia ascendente apoyada sobre un borde.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [1, 1, 0],
      [2, 1, 0],
      [2, 2, 0],
      [2, 0, 1],
      [2, 1, 1],
    ],
  ),
  voxelPiece(
    "B05",
    "Esquina doble",
    "basico",
    "Cambio simple de masa en dos direcciones.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
      [1, 2, 1],
      [2, 0, 1],
      [2, 0, 2],
    ],
  ),
];

const INTERMEDIATE_PIECES = INTERMEDIATE_CATALOG.map((entry) => jsonPiece(entry));

const ADVANCED_PIECES = [
  voxelPiece(
    "A01",
    "Puente central",
    "avanzado",
    "Dos apoyos laterales unidos por una masa superior.",
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
      [2, 0, 0],
      [2, 1, 0],
      [2, 2, 0],
      [0, 2, 1],
      [1, 2, 1],
      [2, 2, 1],
      [1, 0, 2],
      [1, 1, 2],
    ],
  ),
  voxelPiece(
    "A02",
    "Patio escalonado",
    "avanzado",
    "Perimetro con vacio interior y lectura por capas.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 0, 1],
      [2, 0, 1],
      [0, 0, 2],
      [1, 0, 2],
      [2, 0, 2],
      [0, 1, 0],
      [2, 1, 0],
      [0, 1, 2],
      [2, 1, 2],
      [0, 1, 1],
      [2, 1, 1],
      [0, 2, 1],
      [1, 2, 1],
      [2, 2, 1],
    ],
  ),
  voxelPiece(
    "A03",
    "Muesca compuesta",
    "avanzado",
    "Desfase frontal con remate posterior mas complejo.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 1, 0],
      [2, 1, 0],
      [0, 2, 0],
      [2, 2, 0],
      [1, 0, 1],
      [1, 0, 2],
      [1, 1, 2],
      [1, 2, 2],
      [2, 2, 2],
    ],
  ),
  voxelPiece(
    "A04",
    "Doble vacio",
    "avanzado",
    "Lectura compleja con huecos laterales y remate superior.",
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 1, 0],
      [2, 1, 0],
      [0, 2, 0],
      [2, 2, 0],
      [0, 0, 1],
      [2, 0, 1],
      [0, 0, 2],
      [1, 0, 2],
      [2, 0, 2],
      [1, 1, 2],
      [1, 2, 2],
    ],
  ),
  voxelPiece(
    "A05",
    "Torre cruzada",
    "avanzado",
    "Masa vertical con brazos visibles en las tres vistas.",
    [
      [1, 0, 0],
      [1, 1, 0],
      [1, 2, 0],
      [0, 0, 1],
      [1, 0, 1],
      [2, 0, 1],
      [1, 1, 1],
      [1, 2, 1],
      [1, 0, 2],
      [1, 1, 2],
      [1, 2, 2],
    ],
  ),
];

const PIECES = [...BASIC_PIECES, ...INTERMEDIATE_PIECES, ...ADVANCED_PIECES];

const LEVEL_COPY = {
  basico: {
    flow: [
      "Figuras: elige una pieza de lectura directa.",
      "Guia: identifica contornos exteriores y alturas.",
      "Teoria: revisa errores tipicos antes de trazar.",
      "Seleccion multiple: refuerza la lectura espacial.",
      "Trazo: resuelve lateral, alzado y planta.",
    ],
    observe: {
      alzado: "Fija primero la silueta frontal y la altura maxima antes de cerrar detalles interiores.",
      planta: "Marca la huella base completa para evitar desplazar aristas cuando proyectes.",
      lateral: "Usa esta vista para comprobar profundidad y confirmar donde cambian los niveles.",
    },
    mistakes: [
      "Cerrar lineas interiores antes de asegurar el contorno principal.",
      "Mover una arista en planta sin haber verificado su profundidad.",
      "Confundir un cambio de altura con un desplazamiento lateral.",
    ],
    tips: [
      "Traza primero los limites exteriores y luego los quiebres internos.",
      "Compara de dos en dos las vistas antes de dibujar lineas ocultas.",
      "Cuando dudes, vuelve a la huella en planta y desde ahi proyecta alturas.",
    ],
  },
  intermedio: {
    flow: [
      "Figuras: selecciona un modelo original del banco 3x3.",
      "Guia: localiza retranqueos, cortes y cambios de nivel.",
      "Teoria: identifica que vista resuelve mejor cada duda.",
      "Seleccion multiple: valida interpretacion y secuencia.",
      "Trazo: construye las tres vistas con comparacion constante.",
    ],
    observe: {
      alzado: "Separa silueta general y recortes; no todas las aristas interiores se leen igual de claro.",
      planta: "La planta te ayuda a ordenar retranqueos y a distinguir llenos de vacios parciales.",
      lateral: "El lateral confirma profundidad, continuidad vertical y posibles lineas ocultas.",
    },
    mistakes: [
      "Copiar una arista visible en una vista como si tambien lo fuera en otra.",
      "No comprobar si un retranqueo entra o sale respecto del observador.",
      "Resolver demasiado pronto las lineas ocultas sin verificar continuidad.",
    ],
    tips: [
      "Trabaja por bloques: silueta general, vacios, despues remates menores.",
      "Si dos vistas no coinciden, vuelve a la que define mejor profundidad.",
      "Usa trazos discontinuos solo cuando el volumen este ya estabilizado.",
    ],
  },
  avanzado: {
    flow: [
      "Figuras: elige una pieza con puentes, vacios o desfases compuestos.",
      "Guia: separa apoyos, conexiones y huecos antes de dibujar.",
      "Teoria: revisa continuidad, lectura de vacio y prioridad entre vistas.",
      "Seleccion multiple: comprueba interpretacion avanzada.",
      "Trazo: resuelve las vistas desde estructura a detalle.",
    ],
    observe: {
      alzado: "Busca continuidad vertical, apoyos y cortes aparentes antes de dibujar aristas secundarias.",
      planta: "La planta aclara puentes, patios, brazos y la posicion real de los vacios.",
      lateral: "El lateral suele confirmar profundidad efectiva y continuidad entre niveles separados.",
    },
    mistakes: [
      "Tratar un vacio como si fuera una arista exterior.",
      "Perder la continuidad de un apoyo al proyectar hacia la tercera vista.",
      "No distinguir entre una union superior y dos masas independientes.",
    ],
    tips: [
      "Resume primero la estructura resistente: apoyos, huecos y remates.",
      "Comprueba si una cara conecta o solo se superpone visualmente.",
      "Antes de cerrar la vista, revisa si cada quiebre aparece en al menos dos proyecciones.",
    ],
  },
};

const FACE_DEFINITIONS = [
  { neighbor: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { neighbor: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { neighbor: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { neighbor: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { neighbor: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { neighbor: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

const state = {
  currentPieceIndex: 0,
  activeDifficulty: PIECES[0].difficulty,
  activeTool: "line",
  dashed: false,
  profileSwapped: false,
  sidebarTab: "figures",
  lines: [],
  pendingLineStart: null,
  previewLine: null,
  paperImage: null,
  loadToken: 0,
  fitZoom: 1,
  zoomRatio: 1,
  paper: {
    width: 0,
    height: 0,
    dpr: 1,
    layout: null,
  },
  solution: {
    visible: false,
    lateral: true,
    alzado: true,
    planta: true,
  },
  viewer: {
    showGrid: true,
    showAxes: false,
    currentView: "isometric",
    menuOpen: false,
    faceEditorOpen: false,
    colors: { ...VIEWER_DEFAULT_COLORS },
    figureColorOverrides: {},
    pointerDown: null,
    dragDistance: 0,
    contextDrag: false,
    focusPoint: new THREE.Vector3(),
    hasSelection: false,
    selectedClusters: [],
    activeClusterId: null,
  },
  quiz: {
    questionIndex: 0,
    selectedOption: null,
    validated: false,
    feedback: null,
  },
};

const dom = {
  stage: document.querySelector("#three-stage"),
  viewerRenderLayer: document.querySelector("#viewer-render-layer"),
  viewerStatusCard: document.querySelector("#viewer-status-card"),
  viewerContextMenu: document.querySelector("#viewer-context-menu"),
  closeToolsPanelButton: document.querySelector("#close-tools-panel"),
  currentViewLabel: document.querySelector("#current-view-label"),
  gridToggle: document.querySelector("#toggle-grid-3d"),
  axesToggle: document.querySelector("#toggle-axes-3d"),
  resetViewButton: document.querySelector("#reset-view-3d"),
  viewCubeCanvas: document.querySelector("#viewcube-canvas"),
  presetButtons: Array.from(document.querySelectorAll("[data-view]")),
  figureColorInput: document.querySelector("#color-figure"),
  gridColorInput: document.querySelector("#color-grid"),
  backgroundColorInput: document.querySelector("#color-background"),
  accentColorInput: document.querySelector("#color-accent"),
  faceEditorPanel: document.querySelector("#face-editor-panel"),
  closeFaceEditorButton: document.querySelector("#close-face-editor"),
  faceEditorTitle: document.querySelector("#face-editor-title"),
  faceEditorMeta: document.querySelector("#face-editor-meta"),
  faceCurrentColorChip: document.querySelector("#face-current-color-chip"),
  faceCurrentColorText: document.querySelector("#face-current-color-text"),
  facePaintColorInput: document.querySelector("#color-face-paint"),
  applyFacePaintButton: document.querySelector("#apply-face-paint"),
  clearFaceSelectionButton: document.querySelector("#clear-face-selection"),
  resetFacePaintButton: document.querySelector("#reset-face-paint"),
  faceSelectionStatus: document.querySelector("#face-selection-status"),
  paperShell: document.querySelector("#paper-shell"),
  paper: document.querySelector("#paper-canvas"),
  solution: document.querySelector("#solution-canvas"),
  solutionToggle: document.querySelector("#toggle-solution"),
  solutionViewLateral: document.querySelector("#toggle-solution-lateral"),
  solutionViewAlzado: document.querySelector("#toggle-solution-alzado"),
  solutionViewPlanta: document.querySelector("#toggle-solution-planta"),
  pieceLabel: document.querySelector("#piece-label"),
  pieceMeta: document.querySelector("#piece-meta"),
  sidebarPieceCode: document.querySelector("#sidebar-piece-code"),
  sidebarPieceCaption: document.querySelector("#sidebar-piece-caption"),
  lineButton: document.querySelector("#tool-line"),
  dashedButton: document.querySelector("#toggle-dashed"),
  eraseButton: document.querySelector("#tool-erase"),
  profileButton: document.querySelector("#toggle-profile"),
  clearButton: document.querySelector("#clear-board"),
  saveButton: document.querySelector("#save-image"),
  saveReferenceButton: document.querySelector("#save-reference-image"),
  saveReferenceInlineButton: document.querySelector("#save-reference-image-inline"),
  prevButton: document.querySelector("#prev-piece"),
  nextButton: document.querySelector("#next-piece"),
  difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty]")),
  sidebarButtons: Array.from(document.querySelectorAll("[data-sidebar-tab]")),
  sidebarPanels: Array.from(document.querySelectorAll("[data-sidebar-panel]")),
  pieceLibrary: document.querySelector("#piece-library"),
  guideCards: document.querySelector("#guide-cards"),
  theoryCards: document.querySelector("#theory-cards"),
  quizPanel: document.querySelector("#quiz-panel"),
};

const paperCtx = dom.paper.getContext("2d");
const solutionCtx = dom.solution.getContext("2d");
const geometryLoader = new THREE.BufferGeometryLoader();
const pieceAnalysisCache = new Map();
const quizCache = new Map();
const solutionCache = new Map();
const geometryCache = new Map();
const displayGeometryCache = new Map();

let scene;
let renderer;
let camera;
let controls;
let pieceGroup;
let pieceFillMesh;
let pieceOutline;
let sharedPieceFillMaterial;
let sharedPieceOutlineMaterial;
let gridHelper;
let axesHelper;
let hoverFaceMesh;
let selectedFaceMesh;
let raycaster;
let viewCubeRenderer;
let viewCubeScene;
let viewCubeCamera;
let viewCubeMesh;
let viewerEnvironmentMap;
let layoutFrame = 0;
let viewerFrame = 0;

function getActivePiece() {
  return PIECES[state.currentPieceIndex];
}

function resolveFigureMaterialConfig(pieceId = getActivePiece()?.id) {
  return FIGURE_MATERIALS[pieceId] || FIGURE_MATERIAL_PRESETS.cool_core;
}

function defaultFigureColorForPiece(piece = getActivePiece()) {
  if (!piece?.id) {
    return VIEWER_DEFAULT_COLORS.figure;
  }

  const figureConfig = resolveFigureMaterialConfig(piece.id);
  const swatchName = figureConfig.top || figureConfig.front || "silver";
  return METALLIC_SWATCHES[swatchName]?.color || VIEWER_DEFAULT_COLORS.figure;
}

function getFigureColorForPiece(piece = getActivePiece()) {
  if (!piece?.id) {
    return VIEWER_DEFAULT_COLORS.figure;
  }

  return state.viewer.figureColorOverrides[piece.id] || defaultFigureColorForPiece(piece);
}

function syncActivePieceFigureColor(piece = getActivePiece()) {
  const nextColor = getFigureColorForPiece(piece);
  state.viewer.colors.figure = nextColor;
  if (dom.figureColorInput.value.toUpperCase() !== nextColor.toUpperCase()) {
    dom.figureColorInput.value = nextColor;
  }
}

function difficultyLabel(value) {
  if (value === "basico") return "Basico";
  if (value === "intermedio") return "Intermedio";
  return "Avanzado";
}

function getPiecesByDifficulty(difficulty = state.activeDifficulty) {
  return PIECES.filter((piece) => piece.difficulty === difficulty);
}

function findPieceIndex(pieceId) {
  return PIECES.findIndex((piece) => piece.id === pieceId);
}

function activePiecePosition() {
  const piece = getActivePiece();
  const group = getPiecesByDifficulty(piece.difficulty);
  return group.findIndex((item) => item.id === piece.id) + 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mixHexColors(colorA, colorB, factor) {
  const mixed = new THREE.Color(colorA).lerp(new THREE.Color(colorB), clamp(factor, 0, 1));
  return `#${mixed.getHexString()}`;
}

function shiftHexLightness(colorValue, amount) {
  const color = new THREE.Color(colorValue);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, clamp(hsl.s * 0.95, 0, 1), clamp(hsl.l + amount, 0, 1));
  return `#${color.getHexString()}`;
}

function hexToRgba(colorValue, alpha) {
  const color = new THREE.Color(colorValue);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShuffle(items, seedValue) {
  const copy = [...items];
  let seed = hashString(seedValue);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function analyzePiece(piece) {
  if (pieceAnalysisCache.has(piece.id)) {
    return pieceAnalysisCache.get(piece.id);
  }

  let analysis;

  if (piece.source === "voxel") {
    const xs = piece.cells.map(([x]) => x);
    const ys = piece.cells.map(([, y]) => y);
    const zs = piece.cells.map(([, , z]) => z);
    const columns = new Map();
    let leftMass = 0;
    let rightMass = 0;
    let frontMass = 0;
    let backMass = 0;

    piece.cells.forEach(([x, y, z]) => {
      const key = `${x},${z}`;
      const current = columns.get(key) || 0;
      columns.set(key, Math.max(current, y + 1));

      if (x <= 1) leftMass += 1;
      else rightMass += 1;

      if (z <= 1) frontMass += 1;
      else backMass += 1;
    });

    const columnHeights = [...columns.values()];
    const maxHeight = Math.max(...columnHeights);

    analysis = {
      maxHeight,
      widthSpan: Math.max(...xs) - Math.min(...xs) + 1,
      depthSpan: Math.max(...zs) - Math.min(...zs) + 1,
      footprint: columns.size,
      dominantAxis: Math.abs(leftMass - rightMass) > Math.abs(frontMass - backMass) ? "x" : "z",
      asymmetry: leftMass !== rightMass || frontMass !== backMass,
      hasVoid: /vacio|patio|puente|muesca/i.test(`${piece.title} ${piece.summary}`),
    };
  } else {
    analysis = {
      maxHeight: 3,
      widthSpan: 3,
      depthSpan: 3,
      footprint: "irregular",
      dominantAxis: "z",
      asymmetry: true,
      hasVoid: /muesca|vacio|corte|recorte/i.test(`${piece.title} ${piece.summary}`),
    };
  }

  pieceAnalysisCache.set(piece.id, analysis);
  return analysis;
}

function buildGuideCards(piece) {
  const level = LEVEL_COPY[piece.difficulty];
  const analysis = analyzePiece(piece);
  const footprintText =
    piece.source === "voxel"
      ? `Huella aproximada de ${analysis.widthSpan} x ${analysis.depthSpan} modulos.`
      : "Huella variable dentro del cubo 3x3 base.";

  return [
    {
      eyebrow: "Flujo",
      title: "Secuencia sugerida",
      list: level.flow,
    },
    {
      eyebrow: "Observa",
      title: "Alzado",
      paragraphs: [
        `En ${piece.id}, el alzado te ayuda a fijar la altura maxima de ${analysis.maxHeight} modulos y la silueta frontal.`,
        level.observe.alzado,
      ],
    },
    {
      eyebrow: "Observa",
      title: "Planta",
      paragraphs: [footprintText, level.observe.planta],
    },
    {
      eyebrow: "Observa",
      title: "Lateral",
      paragraphs: [
        `La lectura lateral es clave para confirmar profundidad y orden de planos en ${piece.title.toLowerCase()}.`,
        level.observe.lateral,
      ],
    },
  ];
}

function buildTheoryCards(piece) {
  const level = LEVEL_COPY[piece.difficulty];
  const analysis = analyzePiece(piece);
  const structureNote =
    piece.source === "voxel"
      ? `La pieza ocupa ${analysis.footprint} apoyos visibles y alcanza ${analysis.maxHeight} modulos de altura.`
      : "La pieza proviene del banco original 3x3 y requiere comparar llenos, retranqueos y aristas menos obvias.";

  return [
    {
      eyebrow: "Descripcion",
      title: `${piece.id} - ${piece.title}`,
      paragraphs: [
        `${piece.summary} ${structureNote}`,
        `Nivel ${difficultyLabel(piece.difficulty).toLowerCase()}. El objetivo es interpretar la masa antes de dibujarla.`,
      ],
    },
    {
      eyebrow: "Lectura",
      title: "Que observar en cada vista",
      list: [
        "Alzado: determina la altura dominante y la silueta principal.",
        "Planta: organiza la huella y ubica desplazamientos sobre la base.",
        "Lateral: comprueba profundidad, apoyos y continuidad vertical.",
      ],
    },
    {
      eyebrow: "Errores comunes",
      title: "Lo que suele fallar",
      list: level.mistakes,
    },
    {
      eyebrow: "Consejos",
      title: "Trazado y comprobacion",
      list: level.tips,
      action: {
        label: "Practicar seleccion multiple",
        onClick: () => setSidebarTab("quiz"),
      },
    },
  ];
}

function buildQuestion(seed, prompt, options, correctOption, explanation) {
  const shuffled = stableShuffle(options, seed);
  return {
    prompt,
    options: shuffled,
    correctIndex: shuffled.indexOf(correctOption),
    explanation,
  };
}

function buildQuizQuestions(piece) {
  if (quizCache.has(piece.id)) {
    return quizCache.get(piece.id);
  }

  const analysis = analyzePiece(piece);
  const heightValues = stableShuffle(
    [1, 2, 3, 4].filter((value) => value !== analysis.maxHeight).slice(0, 3),
    `${piece.id}-heights`,
  );
  heightValues.push(analysis.maxHeight);

  const questions = [
    buildQuestion(
      `${piece.id}-footprint`,
      `Para ${piece.id}, ¿que vista conviene fijar primero para asegurar la huella base?`,
      ["Planta", "Alzado", "Lateral", "Las lineas ocultas"],
      "Planta",
      "La planta ordena la ocupacion sobre la base y evita desplazar aristas al proyectar.",
    ),
    buildQuestion(
      `${piece.id}-silhouette`,
      `Verdadero o falso: en ${piece.id}, es mejor cerrar detalles interiores antes de comprobar la silueta exterior.`,
      ["Verdadero", "Falso"],
      "Falso",
      "Primero se asegura el contorno general; despues se agregan retranqueos y lineas internas.",
    ),
    piece.source === "voxel"
      ? buildQuestion(
          `${piece.id}-height`,
          `En ${piece.id}, la altura maxima inicial se resume mejor como:`,
          heightValues.map((value) => `${value} modulos`),
          `${analysis.maxHeight} modulos`,
          "La lectura inicial debe reconocer la altura dominante antes de resolver detalles menores.",
        )
      : buildQuestion(
          `${piece.id}-depth`,
          `En ${piece.id}, ¿que vista suele confirmar mejor la profundidad y los retranqueos?`,
          ["Lateral", "Solo la planta", "Ninguna vista", "El boton PNG"],
          "Lateral",
          "La vista lateral ayuda a confirmar profundidad efectiva y continuidad entre planos.",
        ),
  ];

  if (piece.difficulty === "avanzado" || analysis.hasVoid) {
    questions.push(
      buildQuestion(
        `${piece.id}-voids`,
        `Si aparece un vacio o una union dudosa en ${piece.id}, ¿que debes comprobar antes de dibujarla como exterior?`,
        [
          "Si esa arista se confirma en al menos dos vistas",
          "Si cabe dentro de la miniatura",
          "Si el borde se ve mas oscuro",
          "Si cambia el grosor de linea",
        ],
        "Si esa arista se confirma en al menos dos vistas",
        "En piezas complejas, una sola vista puede engañar. La comprobacion cruzada evita inventar aristas exteriores.",
      ),
    );
  }

  quizCache.set(piece.id, questions);
  return questions;
}

function resetQuizState() {
  state.quiz.questionIndex = 0;
  state.quiz.selectedOption = null;
  state.quiz.validated = false;
  state.quiz.feedback = null;
}

function renderToolbar() {
  dom.paper.classList.toggle("is-erase", state.activeTool === "erase");
  dom.lineButton.classList.toggle("is-active", state.activeTool === "line");
  dom.eraseButton.classList.toggle("is-active", state.activeTool === "erase");
  dom.dashedButton.classList.toggle("is-active", state.dashed);
  dom.profileButton.classList.toggle("is-active", state.profileSwapped);
}

function renderSolutionControls() {
  dom.solutionToggle.checked = state.solution.visible;
  dom.solutionViewLateral.checked = state.solution.lateral;
  dom.solutionViewAlzado.checked = state.solution.alzado;
  dom.solutionViewPlanta.checked = state.solution.planta;

  const disabled = !state.solution.visible;
  dom.solutionViewLateral.disabled = disabled;
  dom.solutionViewAlzado.disabled = disabled;
  dom.solutionViewPlanta.disabled = disabled;
}

function renderSidebarTabs() {
  dom.sidebarButtons.forEach((button) => {
    const isActive = button.dataset.sidebarTab === state.sidebarTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function renderSidebarPanels() {
  dom.sidebarPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.sidebarPanel === state.sidebarTab);
  });
}

function renderDifficultyTabs() {
  dom.difficultyButtons.forEach((button) => {
    const difficulty = button.dataset.difficulty;
    const total = getPiecesByDifficulty(difficulty).length;
    const active = difficulty === state.activeDifficulty;
    button.classList.toggle("is-active", active);
    button.textContent = `${difficultyLabel(difficulty)} (${total})`;
  });
}

function renderPieceLibrary() {
  const activePiece = getActivePiece();
  const pieces = getPiecesByDifficulty();
  const fragment = document.createDocumentFragment();

  pieces.forEach((piece) => {
    const card = document.createElement("button");
    const title = document.createElement("strong");
    const detail = document.createElement("span");

    card.type = "button";
    card.className = "piece-card";
    card.classList.toggle("is-active", piece.id === activePiece.id);

    title.textContent = `${piece.id} - ${piece.title}`;
    detail.textContent = piece.summary;

    card.append(title, detail);
    card.addEventListener("click", () => {
      void setPiece(findPieceIndex(piece.id));
    });

    fragment.appendChild(card);
  });

  dom.pieceLibrary.replaceChildren(fragment);
}

function createContentCard(card) {
  const article = document.createElement("article");
  article.className = "content-card";

  if (card.eyebrow) {
    const kicker = document.createElement("p");
    kicker.className = "card-kicker";
    kicker.textContent = card.eyebrow;
    article.appendChild(kicker);
  }

  const title = document.createElement("h4");
  title.textContent = card.title;
  article.appendChild(title);

  if (card.paragraphs) {
    card.paragraphs.forEach((paragraph) => {
      const text = document.createElement("p");
      text.textContent = paragraph;
      article.appendChild(text);
    });
  }

  if (card.list) {
    const list = document.createElement("ul");
    list.className = "content-list";
    card.list.forEach((item) => {
      const line = document.createElement("li");
      line.textContent = item;
      list.appendChild(line);
    });
    article.appendChild(list);
  }

  if (card.action) {
    const actions = document.createElement("div");
    actions.className = "content-actions";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tool-button";
    button.textContent = card.action.label;
    button.addEventListener("click", card.action.onClick);
    actions.appendChild(button);
    article.appendChild(actions);
  }

  return article;
}

function renderGuideCards() {
  const cards = buildGuideCards(getActivePiece());
  const fragment = document.createDocumentFragment();
  cards.forEach((card) => fragment.appendChild(createContentCard(card)));
  dom.guideCards.replaceChildren(fragment);
}

function renderTheoryCards() {
  const cards = buildTheoryCards(getActivePiece());
  const fragment = document.createDocumentFragment();
  cards.forEach((card) => fragment.appendChild(createContentCard(card)));
  dom.theoryCards.replaceChildren(fragment);
}

function renderQuiz() {
  const piece = getActivePiece();
  const questions = buildQuizQuestions(piece);
  const question = questions[state.quiz.questionIndex];
  const isLast = state.quiz.questionIndex === questions.length - 1;
  const fragment = document.createDocumentFragment();

  const pieceCard = document.createElement("article");
  pieceCard.className = "quiz-card";
  const pieceKicker = document.createElement("p");
  pieceKicker.className = "card-kicker";
  pieceKicker.textContent = "Refuerzo";
  const pieceTitle = document.createElement("h4");
  pieceTitle.textContent = `${piece.id} - ${piece.title}`;
  const pieceCopy = document.createElement("p");
  pieceCopy.textContent = piece.summary;
  pieceCard.append(pieceKicker, pieceTitle, pieceCopy);
  fragment.appendChild(pieceCard);

  const questionCard = document.createElement("article");
  questionCard.className = "quiz-card";

  const progress = document.createElement("p");
  progress.className = "quiz-progress";
  progress.textContent = `Pregunta ${state.quiz.questionIndex + 1} de ${questions.length}`;

  const prompt = document.createElement("p");
  prompt.className = "quiz-question";
  prompt.textContent = question.prompt;

  const options = document.createElement("div");
  options.className = "quiz-options";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option;

    if (index === state.quiz.selectedOption) button.classList.add("is-selected");
    if (state.quiz.validated && index === question.correctIndex) button.classList.add("is-correct");
    if (state.quiz.validated && index === state.quiz.selectedOption && index !== question.correctIndex) {
      button.classList.add("is-incorrect");
    }

    button.disabled = state.quiz.validated;
    button.addEventListener("click", () => {
      state.quiz.selectedOption = index;
      state.quiz.validated = false;
      state.quiz.feedback = null;
      renderQuiz();
    });

    options.appendChild(button);
  });

  const actions = document.createElement("div");
  actions.className = "quiz-actions";

  const validateButton = document.createElement("button");
  validateButton.type = "button";
  validateButton.className = "tool-button";
  validateButton.textContent = "Comprobar";
  validateButton.disabled = state.quiz.selectedOption === null || state.quiz.validated;
  validateButton.addEventListener("click", () => {
    const correct = state.quiz.selectedOption === question.correctIndex;
    state.quiz.validated = true;
    state.quiz.feedback = { correct, text: question.explanation };
    renderQuiz();
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "tool-button";
  nextButton.textContent = isLast ? "Reiniciar" : "Siguiente";
  nextButton.disabled = !state.quiz.validated;
  nextButton.addEventListener("click", () => {
    if (isLast) {
      resetQuizState();
    } else {
      state.quiz.questionIndex += 1;
      state.quiz.selectedOption = null;
      state.quiz.validated = false;
      state.quiz.feedback = null;
    }
    renderQuiz();
  });

  actions.append(validateButton, nextButton);
  questionCard.append(progress, prompt, options, actions);
  fragment.appendChild(questionCard);

  if (state.quiz.feedback) {
    const feedback = document.createElement("article");
    feedback.className = "quiz-feedback";

    const feedbackTitle = document.createElement("p");
    feedbackTitle.className = "card-kicker";
    feedbackTitle.textContent = state.quiz.feedback.correct ? "Correcta" : "Incorrecta";

    const feedbackBody = document.createElement("p");
    feedbackBody.textContent = state.quiz.feedback.text;

    feedback.append(feedbackTitle, feedbackBody);
    fragment.appendChild(feedback);
  }

  dom.quizPanel.replaceChildren(fragment);
}

function updatePieceLabels() {
  const piece = getActivePiece();
  const position = activePiecePosition();
  const piecesInDifficulty = getPiecesByDifficulty(piece.difficulty).length;

  dom.pieceLabel.textContent = piece.id;
  dom.pieceMeta.textContent =
    `${difficultyLabel(piece.difficulty)} - ${piece.title} - Figura ${position} de ${piecesInDifficulty}`;
  dom.sidebarPieceCode.textContent = piece.id;
  dom.sidebarPieceCaption.textContent = piece.summary;
}

function setSidebarTab(tab) {
  state.sidebarTab = tab;
  renderSidebarTabs();
  renderSidebarPanels();
}

function clearDrawing(needsConfirm = true) {
  if (needsConfirm && state.lines.length > 0) {
    const confirmed = window.confirm("Se borrara el trazo actual. Continuar?");
    if (!confirmed) return false;
  }

  state.lines = [];
  state.pendingLineStart = null;
  state.previewLine = null;
  renderPaper();
  return true;
}

function activeBottomGrid(layout = state.paper.layout) {
  return state.profileSwapped ? layout.bottomRight : layout.bottomLeft;
}

function activeMiniCell(layout = state.paper.layout) {
  return state.profileSwapped ? layout.bottomLeft : layout.bottomRight;
}

/* The board now scales from the available panel size instead of a fixed drawing sheet. */
function computePaperLayout(width, height) {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 420);
  const paddingX = clamp(safeWidth * 0.055, 22, 40);
  const paddingTop = clamp(safeHeight * 0.06, 22, 40);
  const paddingBottom = clamp(safeHeight * 0.05, 18, 32);
  const gap = clamp(Math.min(safeWidth, safeHeight) * 0.035, 16, 28);
  const labelOffset = clamp(Math.min(safeWidth, safeHeight) * 0.02, 10, 16);
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
    snap: gridSize / 6,
    labelOffset,
    topLeft: { x: originX, y: originY, size: gridSize, label: BOARD_LABELS.topLeft },
    topRight: {
      x: originX + gridSize + gap,
      y: originY,
      size: gridSize,
      label: BOARD_LABELS.topRight,
    },
    bottomLeft: {
      x: originX,
      y: originY + gridSize + gap,
      size: gridSize,
      label: BOARD_LABELS.bottom,
    },
    bottomRight: {
      x: originX + gridSize + gap,
      y: originY + gridSize + gap,
      size: gridSize,
      label: BOARD_LABELS.bottom,
    },
  };
}

function traceRectForSolutionView(viewKey, layout = state.paper.layout) {
  if (!layout) {
    return null;
  }

  if (viewKey === "lateral") {
    return layout.topLeft;
  }
  if (viewKey === "alzado") {
    return layout.topRight;
  }
  if (viewKey === "planta") {
    return activeBottomGrid(layout);
  }
  return null;
}

function clearSolutionOverlay() {
  if (!state.paper.layout) {
    return;
  }

  solutionCtx.clearRect(0, 0, state.paper.layout.width, state.paper.layout.height);
}

function quantizeSolutionValue(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function projectPointToSolutionView(point, viewKey, box, size) {
  const spanX = Math.max(size.x, 0.0001);
  const spanY = Math.max(size.y, 0.0001);
  const spanZ = Math.max(size.z, 0.0001);

  if (viewKey === "alzado") {
    return {
      x: (point.x - box.min.x) / spanX,
      y: (box.max.y - point.y) / spanY,
    };
  }

  if (viewKey === "planta") {
    return {
      x: (point.x - box.min.x) / spanX,
      /* Planta stays aligned with the viewer preset: the front edge remains near the upper edge of the panel. */
      y: (point.z - box.min.z) / spanZ,
    };
  }

  return {
    x: (box.max.z - point.z) / spanZ,
    y: (box.max.y - point.y) / spanY,
  };
}

function polygonArea2D(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function canonicalProjectedSegment(segment) {
  const a = {
    x: quantizeSolutionValue(segment.x1),
    y: quantizeSolutionValue(segment.y1),
  };
  const b = {
    x: quantizeSolutionValue(segment.x2),
    y: quantizeSolutionValue(segment.y2),
  };
  const swapNeeded = a.x > b.x || (a.x === b.x && a.y > b.y);
  const start = swapNeeded ? b : a;
  const end = swapNeeded ? a : b;

  return `${segment.lineType}|${start.x}|${start.y}|${end.x}|${end.y}`;
}

function mergeProjectionSegments(segments) {
  const groups = new Map();

  segments.forEach((segment) => {
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const length = Math.hypot(dx, dy);
    if (length < SOLUTION_SEGMENT_EPSILON) {
      return;
    }

    let ux = dx / length;
    let uy = dy / length;
    if (ux < -SOLUTION_SEGMENT_EPSILON || (Math.abs(ux) < SOLUTION_SEGMENT_EPSILON && uy < 0)) {
      ux *= -1;
      uy *= -1;
    }

    const nx = -uy;
    const ny = ux;
    const intercept = nx * segment.x1 + ny * segment.y1;
    let start = ux * segment.x1 + uy * segment.y1;
    let end = ux * segment.x2 + uy * segment.y2;

    if (start > end) {
      [start, end] = [end, start];
    }

    const key = [
      segment.lineType,
      quantizeSolutionValue(ux),
      quantizeSolutionValue(uy),
      quantizeSolutionValue(intercept),
    ].join("|");
    const bucket = groups.get(key) || {
      lineType: segment.lineType,
      ux,
      uy,
      nx,
      ny,
      intercept,
      intervals: [],
    };
    bucket.intervals.push({ start, end });
    groups.set(key, bucket);
  });

  const merged = [];

  groups.forEach((bucket) => {
    bucket.intervals.sort((a, b) => a.start - b.start);
    const intervals = [];

    bucket.intervals.forEach((interval) => {
      const previous = intervals[intervals.length - 1];
      if (!previous || interval.start > previous.end + SOLUTION_SEGMENT_EPSILON) {
        intervals.push({ ...interval });
        return;
      }

      previous.end = Math.max(previous.end, interval.end);
    });

    intervals.forEach((interval) => {
      const x1 = bucket.ux * interval.start + bucket.nx * bucket.intercept;
      const y1 = bucket.uy * interval.start + bucket.ny * bucket.intercept;
      const x2 = bucket.ux * interval.end + bucket.nx * bucket.intercept;
      const y2 = bucket.uy * interval.end + bucket.ny * bucket.intercept;
      merged.push({
        x1: clamp(x1, 0, 1),
        y1: clamp(y1, 0, 1),
        x2: clamp(x2, 0, 1),
        y2: clamp(y2, 0, 1),
        lineType: bucket.lineType,
      });
    });
  });

  return merged;
}

function buildProjectionSegments(displayGeometry, viewKey) {
  const box = displayGeometry.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const edgeGeometry = new THREE.EdgesGeometry(displayGeometry, SOLUTION_EDGE_THRESHOLD);
  const position = edgeGeometry.getAttribute("position");
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const deduped = new Map();

  for (let index = 0; index < position.count; index += 2) {
    start.fromBufferAttribute(position, index);
    end.fromBufferAttribute(position, index + 1);
    const projectedStart = projectPointToSolutionView(start, viewKey, box, size);
    const projectedEnd = projectPointToSolutionView(end, viewKey, box, size);
    const segment = {
      x1: projectedStart.x,
      y1: projectedStart.y,
      x2: projectedEnd.x,
      y2: projectedEnd.y,
      lineType: "solid",
    };

    if (Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) < SOLUTION_SEGMENT_EPSILON) {
      continue;
    }

    deduped.set(canonicalProjectedSegment(segment), segment);
  }

  edgeGeometry.dispose();
  return mergeProjectionSegments([...deduped.values()]);
}

function buildProjectionFills(selectionInfo, displayGeometry, viewKey) {
  const box = displayGeometry.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const viewDirection = PRESET_VIEWS[SOLUTION_VIEW_CONFIG[viewKey].preset].direction.clone().normalize();
  const fills = [];

  /* Visible solution planes reuse the same deterministic cool palette as the 3D viewer. */
  selectionInfo.clusters.forEach((cluster) => {
    if (cluster.normal.dot(viewDirection) < 0.2) {
      return;
    }

    const points = cluster.vertices.map((vertex) =>
      projectPointToSolutionView(vertex, viewKey, box, size),
    );
    if (Math.abs(polygonArea2D(points)) < SOLUTION_SEGMENT_EPSILON) {
      return;
    }

    fills.push({
      clusterId: cluster.id,
      orientationKey: cluster.orientationKey,
      toneIndex: cluster.toneIndex,
      depth: cluster.centroid.dot(viewDirection),
      points,
    });
  });

  fills.sort((a, b) => a.depth - b.depth);
  return fills;
}

function buildPieceSolutionEntry(piece, sourceGeometry) {
  const displayGeometry = ensureDisplayGeometry(piece, sourceGeometry);
  const selectionInfo = applyPieceColorSeed(createFaceSelectionData(displayGeometry), piece.id);
  const solution = {};

  Object.entries(SOLUTION_VIEW_CONFIG).forEach(([viewKey, viewConfig]) => {
    solution[viewKey] = {
      color: viewConfig.color,
      fills: buildProjectionFills(selectionInfo, displayGeometry, viewKey),
      segments: buildProjectionSegments(displayGeometry, viewKey),
    };
  });

  return {
    figureId: piece.id,
    clusterLookup: Object.fromEntries(
      selectionInfo.clusters.map((cluster) => [
        cluster.id,
        {
          id: cluster.id,
          pieceId: cluster.pieceId,
          orientationKey: cluster.orientationKey,
          toneIndex: cluster.toneIndex,
        },
      ]),
    ),
    solution,
  };
}

/* Each figure caches its own orthographic segments so every toggle redraw stays cheap. */
function ensurePieceSolution(piece, sourceGeometry, force = false) {
  if (!force && solutionCache.has(piece.id)) {
    return solutionCache.get(piece.id);
  }

  const entry = buildPieceSolutionEntry(piece, sourceGeometry);
  solutionCache.set(piece.id, entry);
  return entry;
}

async function preloadAllSolutions() {
  for (const piece of PIECES) {
    if (solutionCache.has(piece.id)) {
      continue;
    }

    try {
      const geometry = await resolvePieceGeometry(piece);
      ensurePieceSolution(piece, geometry);
    } catch (error) {
      console.error(`No se pudo generar la solucion de ${piece.id}.`, error);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
}

function resolveSolutionFillColor(entry, fill) {
  const clusterMeta = entry.clusterLookup?.[fill.clusterId] || fill;
  return buildDefaultClusterColor(clusterMeta);
}

function drawSolutionFills(rect, fills, entry) {
  if (!rect || !fills?.length) {
    return;
  }

  solutionCtx.save();
  solutionCtx.beginPath();
  solutionCtx.rect(rect.x, rect.y, rect.size, rect.size);
  solutionCtx.clip();

  fills.forEach((fill) => {
    const fillColor = resolveSolutionFillColor(entry, fill);
    const strokeColor = shiftHexLightness(fillColor, -0.12);

    solutionCtx.beginPath();
    fill.points.forEach((point, index) => {
      const px = rect.x + point.x * rect.size;
      const py = rect.y + point.y * rect.size;
      if (index === 0) {
        solutionCtx.moveTo(px, py);
      } else {
        solutionCtx.lineTo(px, py);
      }
    });
    solutionCtx.closePath();
    solutionCtx.fillStyle = hexToRgba(fillColor, SOLUTION_FACE_FILL_ALPHA);
    solutionCtx.fill();
    solutionCtx.strokeStyle = hexToRgba(strokeColor, SOLUTION_FACE_STROKE_ALPHA);
    solutionCtx.lineWidth = Math.max(1.1, rect.size * 0.006);
    solutionCtx.stroke();
  });

  solutionCtx.restore();
}

function drawSolutionSegments(rect, segments, color) {
  if (!rect || !segments?.length) {
    return;
  }

  solutionCtx.save();
  solutionCtx.beginPath();
  solutionCtx.rect(rect.x, rect.y, rect.size, rect.size);
  solutionCtx.clip();
  solutionCtx.strokeStyle = color;
  solutionCtx.lineWidth = Math.max(1.6, rect.size * 0.012);
  solutionCtx.lineCap = "round";
  solutionCtx.lineJoin = "round";
  solutionCtx.globalAlpha = 0.9;

  segments.forEach((segment) => {
    solutionCtx.setLineDash(segment.lineType === "hidden" ? [rect.size * 0.04, rect.size * 0.03] : []);
    solutionCtx.beginPath();
    solutionCtx.moveTo(rect.x + segment.x1 * rect.size, rect.y + segment.y1 * rect.size);
    solutionCtx.lineTo(rect.x + segment.x2 * rect.size, rect.y + segment.y2 * rect.size);
    solutionCtx.stroke();
  });

  solutionCtx.restore();
}

/* Solution overlay is rendered from real per-piece projection segments, not from a decorative raster image. */
function renderSolutionOverlay() {
  if (!state.paper.layout) {
    return;
  }

  clearSolutionOverlay();
  if (!state.solution.visible) {
    return;
  }

  const entry = solutionCache.get(getActivePiece().id);
  if (!entry) {
    return;
  }

  Object.keys(SOLUTION_VIEW_CONFIG).forEach((viewKey) => {
    if (!state.solution[viewKey]) {
      return;
    }

    const rect = traceRectForSolutionView(viewKey);
    const viewSolution = entry.solution[viewKey];
    drawSolutionFills(rect, viewSolution?.fills, entry);
    drawSolutionSegments(rect, viewSolution?.segments, viewSolution?.color);
  });
}

function resizePaperCanvas() {
  const width = Math.max(Math.round(dom.paperShell.clientWidth), 1);
  const height = Math.max(Math.round(dom.paperShell.clientHeight), 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  state.paper.width = width;
  state.paper.height = height;
  state.paper.dpr = dpr;
  state.paper.layout = computePaperLayout(width, height);

  dom.paper.width = Math.round(width * dpr);
  dom.paper.height = Math.round(height * dpr);
  dom.paper.style.width = `${width}px`;
  dom.paper.style.height = `${height}px`;
  dom.solution.width = Math.round(width * dpr);
  dom.solution.height = Math.round(height * dpr);
  dom.solution.style.width = `${width}px`;
  dom.solution.style.height = `${height}px`;

  paperCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  solutionCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderPaper();
}

function snapToBoard(value, step) {
  return Math.round(value / step) * step;
}

function pointFromEvent(event) {
  const rect = dom.paper.getBoundingClientRect();
  const metrics = state.paper.layout;
  const x = clamp(event.clientX - rect.left, 0, metrics.width);
  const y = clamp(event.clientY - rect.top, 0, metrics.height);
  const snappedX = clamp(snapToBoard(x, metrics.snap), 0, metrics.width);
  const snappedY = clamp(snapToBoard(y, metrics.snap), 0, metrics.height);

  return {
    x: snappedX / metrics.width,
    y: snappedY / metrics.height,
  };
}

function lineToPixels(line) {
  return {
    x1: line.x1 * state.paper.width,
    y1: line.y1 * state.paper.height,
    x2: line.x2 * state.paper.width,
    y2: line.y2 * state.paper.height,
    dashed: line.dashed,
  };
}

function drawGrid(rect) {
  const { snap, labelOffset } = state.paper.layout;

  paperCtx.save();
  paperCtx.strokeStyle = "#111111";
  paperCtx.lineWidth = 1.6;
  paperCtx.strokeRect(rect.x, rect.y, rect.size, rect.size);

  paperCtx.globalAlpha = 0.18;
  paperCtx.setLineDash([snap * 0.55, snap * 0.75]);

  for (let offset = snap * 2; offset < rect.size; offset += snap * 2) {
    paperCtx.beginPath();
    paperCtx.moveTo(rect.x + offset, rect.y);
    paperCtx.lineTo(rect.x + offset, rect.y + rect.size);
    paperCtx.stroke();

    paperCtx.beginPath();
    paperCtx.moveTo(rect.x, rect.y + offset);
    paperCtx.lineTo(rect.x + rect.size, rect.y + offset);
    paperCtx.stroke();
  }

  for (let col = 0; col < 3; col += 1) {
    for (let row = 0; row < 3; row += 1) {
      paperCtx.beginPath();
      paperCtx.arc(
        rect.x + snap + col * snap * 2,
        rect.y + snap + row * snap * 2,
        Math.max(1.5, snap * 0.08),
        0,
        Math.PI * 2,
      );
      paperCtx.fillStyle = "#111111";
      paperCtx.fill();
    }
  }

  paperCtx.globalAlpha = 1;
  paperCtx.setLineDash([]);
  paperCtx.font = `${Math.max(12, rect.size * 0.055)}px "Segoe UI", Arial, sans-serif`;
  paperCtx.fillStyle = "#111111";
  paperCtx.fillText(rect.label.toUpperCase(), rect.x, rect.y - labelOffset);
  paperCtx.restore();
}

function drawReferenceFrame(ctx, rect) {
  if (!ctx || !rect) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = Math.max(1.5, rect.size * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.size, rect.size);
  ctx.restore();
}

function drawReferenceImage(ctx, rect, imageSource) {
  if (!ctx || !rect || !imageSource) {
    return;
  }

  const innerPadding = rect.size * 0.14;
  ctx.drawImage(
    imageSource,
    rect.x + innerPadding,
    rect.y + innerPadding,
    rect.size - innerPadding * 2,
    rect.size - innerPadding * 2,
  );
}

function drawPreviewCell(rect) {
  const labelOffset = state.paper.layout.labelOffset;

  drawReferenceFrame(paperCtx, rect);
  paperCtx.save();
  paperCtx.font = `${Math.max(12, rect.size * 0.055)}px "Segoe UI", Arial, sans-serif`;
  paperCtx.fillStyle = "#111111";
  paperCtx.fillText(BOARD_LABELS.preview.toUpperCase(), rect.x, rect.y - labelOffset);
  paperCtx.restore();
}

function drawLine(line, preview = false) {
  const px = lineToPixels(line);

  paperCtx.save();
  paperCtx.strokeStyle = "#111111";
  paperCtx.lineWidth = preview ? 2 : 2.6;
  paperCtx.lineCap = "round";
  if (preview) {
    paperCtx.globalAlpha = 0.5;
  }
  if (px.dashed) {
    paperCtx.setLineDash([state.paper.layout.snap * 0.7, state.paper.layout.snap * 0.7]);
  }
  paperCtx.beginPath();
  paperCtx.moveTo(px.x1, px.y1);
  paperCtx.lineTo(px.x2, px.y2);
  paperCtx.stroke();
  paperCtx.restore();
}

function drawMiniature() {
  if (!state.paperImage || !state.paper.layout) {
    return;
  }

  drawReferenceImage(paperCtx, activeMiniCell(), state.paperImage);
}

function renderPaper() {
  if (!state.paper.layout) {
    return;
  }

  const metrics = state.paper.layout;
  paperCtx.clearRect(0, 0, metrics.width, metrics.height);
  paperCtx.fillStyle = "#ffffff";
  paperCtx.fillRect(0, 0, metrics.width, metrics.height);

  drawGrid(metrics.topLeft);
  drawGrid(metrics.topRight);
  drawGrid(activeBottomGrid(metrics));
  drawPreviewCell(activeMiniCell(metrics));
  drawMiniature();

  state.lines.forEach((line) => drawLine(line, false));
  if (state.previewLine) {
    drawLine(state.previewLine, true);
  }

  renderSolutionOverlay();
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const px = start.x + dx * clamped;
  const py = start.y + dy * clamped;

  return Math.hypot(point.x - px, point.y - py);
}

function lineHitTest(point) {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  const pxPoint = {
    x: point.x * state.paper.width,
    y: point.y * state.paper.height,
  };

  state.lines.forEach((line, index) => {
    const pxLine = lineToPixels(line);
    const distance = distanceToSegment(
      pxPoint,
      { x: pxLine.x1, y: pxLine.y1 },
      { x: pxLine.x2, y: pxLine.y2 },
    );
    if (distance < state.paper.layout.snap * 0.45 && distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });

  return bestIndex;
}

function handlePaperClick(event) {
  const point = pointFromEvent(event);

  if (state.activeTool === "erase") {
    const hitIndex = lineHitTest(point);
    if (hitIndex >= 0) {
      state.lines.splice(hitIndex, 1);
      renderPaper();
    }
    return;
  }

  if (!state.pendingLineStart) {
    state.pendingLineStart = point;
    state.previewLine = null;
    renderPaper();
    return;
  }

  state.lines.push({
    x1: state.pendingLineStart.x,
    y1: state.pendingLineStart.y,
    x2: point.x,
    y2: point.y,
    dashed: state.dashed,
  });
  state.pendingLineStart = null;
  state.previewLine = null;
  renderPaper();
}

function handlePaperMove(event) {
  if (state.activeTool !== "line" || !state.pendingLineStart) {
    return;
  }

  const point = pointFromEvent(event);
  state.previewLine = {
    x1: state.pendingLineStart.x,
    y1: state.pendingLineStart.y,
    x2: point.x,
    y2: point.y,
    dashed: state.dashed,
  };
  renderPaper();
}

function downloadCanvasPng() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = dom.paper.width;
  exportCanvas.height = dom.paper.height;
  const exportCtx = exportCanvas.getContext("2d");

  exportCtx.drawImage(dom.paper, 0, 0);
  if (state.solution.visible) {
    exportCtx.drawImage(dom.solution, 0, 0);
  }

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = `${getActivePiece().id.toLowerCase()}_vistas.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadReferencePng() {
  const referenceSource = syncMiniature();
  if (!referenceSource) {
    return;
  }

  const exportCanvas = buildReferenceExportCanvas(referenceSource);
  if (!exportCanvas) {
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = `pieza-${getActivePiece().id}-referencia.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function loadGeometry(url) {
  return new Promise((resolve, reject) => {
    geometryLoader.load(url, resolve, undefined, reject);
  });
}

function buildVoxelGeometry(cells) {
  const filled = new Set(cells.map(([x, y, z]) => `${x},${y},${z}`));
  const positions = [];

  function pushVertex(x, y, z) {
    positions.push(x, y, z);
  }

  function pushFace(x, y, z, corners) {
    const x0 = -3 + x * 2;
    const y0 = -3 + y * 2;
    const z0 = -3 + z * 2;
    const points = corners.map(([ox, oy, oz]) => [
      x0 + ox * 2,
      y0 + oy * 2,
      z0 + oz * 2,
    ]);

    pushVertex(...points[0]);
    pushVertex(...points[1]);
    pushVertex(...points[2]);
    pushVertex(...points[0]);
    pushVertex(...points[2]);
    pushVertex(...points[3]);
  }

  cells.forEach(([x, y, z]) => {
    FACE_DEFINITIONS.forEach((face) => {
      const [dx, dy, dz] = face.neighbor;
      const neighborKey = `${x + dx},${y + dy},${z + dz}`;
      if (!filled.has(neighborKey)) {
        pushFace(x, y, z, face.corners);
      }
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return geometry;
}

async function resolvePieceGeometry(piece) {
  if (geometryCache.has(piece.id)) {
    return geometryCache.get(piece.id);
  }

  let geometry;
  if (piece.source === "json") {
    geometry = await loadGeometry(piece.url);
  } else {
    geometry = buildVoxelGeometry(piece.cells);
  }

  geometry.computeBoundingBox();
  geometryCache.set(piece.id, geometry);
  return geometry;
}

function createDisplayGeometry(sourceGeometry) {
  const geometry = sourceGeometry.index
    ? sourceGeometry.toNonIndexed()
    : sourceGeometry.clone();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  geometry.translate(-center.x, -box.min.y, -center.z);

  const scale = 8.8 / Math.max(size.x || 1, size.y || 1, size.z || 1);
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return geometry;
}

function ensureDisplayGeometry(piece, sourceGeometry) {
  if (displayGeometryCache.has(piece.id)) {
    return displayGeometryCache.get(piece.id);
  }

  /* Viewer, picking, fitting and orthographic solutions all share this normalized display geometry. */
  const geometry = createDisplayGeometry(sourceGeometry);
  displayGeometryCache.set(piece.id, geometry);
  return geometry;
}

function ensureSharedPieceMaterials() {
  if (!sharedPieceFillMaterial) {
    sharedPieceFillMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.88,
      roughness: 0.26,
      envMapIntensity: 1.05,
      flatShading: true,
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    sharedPieceFillMaterial.userData.sharedMaterial = true;
  }

  if (viewerEnvironmentMap && sharedPieceFillMaterial.envMap !== viewerEnvironmentMap) {
    sharedPieceFillMaterial.envMap = viewerEnvironmentMap;
    sharedPieceFillMaterial.needsUpdate = true;
  }

  if (!sharedPieceOutlineMaterial) {
    sharedPieceOutlineMaterial = new THREE.LineBasicMaterial({ color: 0x111111 });
    sharedPieceOutlineMaterial.userData.sharedMaterial = true;
  }
}

function buildPieceGroup(displayGeometry, pieceId) {
  ensureSharedPieceMaterials();
  const geometry = displayGeometry.clone();
  geometry.computeBoundingBox();

  const fill = new THREE.Mesh(
    geometry,
    sharedPieceFillMaterial,
  );

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 15),
    sharedPieceOutlineMaterial,
  );

  prepareFaceSelectionData(fill, pieceId);
  initializeFaceColors(fill);

  const group = new THREE.Group();
  group.add(fill, outline);
  group.userData.displayBox = geometry.boundingBox.clone();
  pieceFillMesh = fill;
  pieceOutline = outline;
  return group;
}

function disposeGroup(group) {
  if (!group) {
    return;
  }

  group.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (!material.userData?.sharedMaterial) {
            material.dispose();
          }
        });
      } else {
        if (!child.material.userData?.sharedMaterial) {
          child.material.dispose();
        }
      }
    }
  });
}

function disposeObject3D(object) {
  if (!object) {
    return;
  }

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (!material.userData?.sharedMaterial) {
            material.dispose();
          }
        });
      } else {
        if (!child.material.userData?.sharedMaterial) {
          child.material.dispose();
        }
      }
    }
  });
}

function setAccentCssVar(color) {
  document.documentElement.style.setProperty("--viewer-accent", color);
}

function selectionData() {
  return pieceFillMesh?.userData?.faceSelection || null;
}

function formatFaceCode(clusterId) {
  return `F${String(clusterId + 1).padStart(2, "0")}`;
}

function orientationKeyFromNormal(normal) {
  const absolute = {
    x: Math.abs(normal.x),
    y: Math.abs(normal.y),
    z: Math.abs(normal.z),
  };

  if (absolute.y >= absolute.x && absolute.y >= absolute.z) {
    return normal.y >= 0 ? "top" : "bottom";
  }
  if (absolute.x >= absolute.z) {
    return normal.x >= 0 ? "right" : "left";
  }
  return normal.z >= 0 ? "back" : "front";
}

function describeFaceOrientation(normalOrKey) {
  const key =
    typeof normalOrKey === "string" ? normalOrKey : orientationKeyFromNormal(normalOrKey);
  return ORIENTATION_LABELS[key] || "Cara";
}

function toneVariantForCluster(cluster) {
  const signature = Math.round(
    (cluster.centroid.x + 12) * 11 +
      (cluster.centroid.y + 7) * 13 +
      (cluster.centroid.z + 3) * 17 +
      cluster.vertices.length * 5 +
      cluster.id * 7,
  );
  return Math.abs(signature) % FACE_TONE_VARIANTS.length;
}

function applyPieceColorSeed(selectionInfo, pieceId) {
  if (!selectionInfo) {
    return selectionInfo;
  }

  selectionInfo.pieceId = pieceId;
  selectionInfo.clusters.forEach((cluster) => {
    cluster.pieceId = pieceId;
  });
  return selectionInfo;
}

function resolveClusterMetalName(clusterLike) {
  const figureConfig = resolveFigureMaterialConfig(clusterLike.pieceId);
  const orientationKey = clusterLike.orientationKey || "front";
  const baseMetal = figureConfig[orientationKey] || figureConfig.front || "silver";
  const secondaryMetals = figureConfig.secondary || [];
  const metalCycle = [baseMetal, ...secondaryMetals.filter((metalName) => metalName !== baseMetal)];
  const cycleIndex =
    Math.abs(
      hashString(`${clusterLike.pieceId || "piece"}-${orientationKey}`) +
        (clusterLike.id ?? 0) +
        (clusterLike.toneIndex ?? 0),
    ) % metalCycle.length;
  return metalCycle[cycleIndex];
}

function buildDefaultClusterColor(clusterLike) {
  const metalName = resolveClusterMetalName(clusterLike);
  const swatch = METALLIC_SWATCHES[metalName] || METALLIC_SWATCHES.silver;
  const orientationShift = METAL_ORIENTATION_SHIFT[clusterLike.orientationKey || "front"] || 0;
  const mixedWithFigure = mixHexColors(swatch.color, state.viewer.colors.figure, 0.08);
  return shiftHexLightness(
    mixedWithFigure,
    orientationShift + FACE_TONE_VARIANTS[(clusterLike.toneIndex ?? 0) % FACE_TONE_VARIANTS.length],
  );
}

function resolveClusterColor(selectionInfo, clusterId) {
  if (!selectionInfo?.clusters?.[clusterId]) {
    return state.viewer.colors.figure;
  }

  return (
    selectionInfo.clusterColors?.[clusterId] ||
    buildDefaultClusterColor(selectionInfo.clusters[clusterId])
  );
}

function colorToHexString(value) {
  return new THREE.Color(value).getHexString().toUpperCase();
}

function getClusterCurrentColor(clusterId) {
  const data = selectionData();
  if (!data || clusterId == null || !data.clusters[clusterId]) {
    return state.viewer.colors.figure;
  }

  return resolveClusterColor(data, clusterId);
}

function initializeFaceColors(mesh) {
  if (!mesh?.geometry?.attributes?.position) {
    return;
  }

  const position = mesh.geometry.getAttribute("position");
  const colorAttribute = new THREE.Float32BufferAttribute(position.count * 3, 3);
  mesh.geometry.setAttribute("color", colorAttribute);

  refreshPieceSurfaceColors(mesh);
}

function getSelectedClusterSet() {
  return new Set(state.viewer.selectedClusters);
}

function createHighlightMesh(opacity) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3));

  const material = new THREE.MeshBasicMaterial({
    color: state.viewer.colors.accent,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.renderOrder = 12;
  return mesh;
}

function faceVertexKey(vector) {
  return `${vector.x.toFixed(4)}|${vector.y.toFixed(4)}|${vector.z.toFixed(4)}`;
}

function faceEdgeKey(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function buildClusterPolygon(triangleIndices, triangles, vertexPositions) {
  const baseTriangle = triangles[triangleIndices[0]];
  const boundaryMap = new Map();

  triangleIndices.forEach((triangleIndex) => {
    const triangle = triangles[triangleIndex];
    triangle.edges.forEach((edgeKey, edgeIndex) => {
      const existing = boundaryMap.get(edgeKey);
      if (existing) {
        existing.count += 1;
      } else {
        boundaryMap.set(edgeKey, {
          count: 1,
          pair: triangle.edgePairs[edgeIndex],
        });
      }
    });
  });

  const boundaryEdges = [...boundaryMap.values()]
    .filter((entry) => entry.count === 1)
    .map((entry) => entry.pair);

  if (boundaryEdges.length < 3) {
    return {
      vertices: baseTriangle.keys.map((key) => vertexPositions.get(key).clone()),
      normal: baseTriangle.normal.clone(),
    };
  }

  const vertexLinks = new Map();
  boundaryEdges.forEach(([a, b]) => {
    if (!vertexLinks.has(a)) {
      vertexLinks.set(a, []);
    }
    if (!vertexLinks.has(b)) {
      vertexLinks.set(b, []);
    }
    vertexLinks.get(a).push(b);
    vertexLinks.get(b).push(a);
  });

  const startVertex = boundaryEdges[0][0];
  const orderedKeys = [startVertex];
  let previousVertex = null;
  let currentVertex = startVertex;

  for (let step = 0; step < boundaryEdges.length + 2; step += 1) {
    const candidates = vertexLinks.get(currentVertex) || [];
    const nextVertex = candidates.find((candidate) => candidate !== previousVertex);

    if (!nextVertex || nextVertex === startVertex) {
      break;
    }

    orderedKeys.push(nextVertex);
    previousVertex = currentVertex;
    currentVertex = nextVertex;
  }

  if (orderedKeys.length < 3) {
    return {
      vertices: baseTriangle.keys.map((key) => vertexPositions.get(key).clone()),
      normal: baseTriangle.normal.clone(),
    };
  }

  return {
    vertices: orderedKeys.map((key) => vertexPositions.get(key).clone()),
    normal: baseTriangle.normal.clone(),
  };
}

function createFaceSelectionData(geometry) {
  if (!geometry?.attributes?.position) {
    return null;
  }

  const position = geometry.getAttribute("position");
  const index = geometry.index ? geometry.index.array : null;
  const triangleCount = index ? index.length / 3 : position.count / 3;
  const triangles = [];
  const adjacency = Array.from({ length: triangleCount }, () => new Set());
  const edgeOwners = new Map();
  const vertexPositions = new Map();

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const offset = triangleIndex * 3;
    const vertexIndices = index
      ? [index[offset], index[offset + 1], index[offset + 2]]
      : [offset, offset + 1, offset + 2];
    const vertices = vertexIndices.map((vertexIndex) =>
      new THREE.Vector3().fromBufferAttribute(position, vertexIndex),
    );
    const normal = new THREE.Vector3()
      .subVectors(vertices[1], vertices[0])
      .cross(new THREE.Vector3().subVectors(vertices[2], vertices[0]))
      .normalize();
    const plane = normal.dot(vertices[0]);
    const keys = vertices.map((vertex) => {
      const key = faceVertexKey(vertex);
      if (!vertexPositions.has(key)) {
        vertexPositions.set(key, vertex.clone());
      }
      return key;
    });
    const edgePairs = [
      [keys[0], keys[1]],
      [keys[1], keys[2]],
      [keys[2], keys[0]],
    ];
    const edges = edgePairs.map(([a, b]) => faceEdgeKey(a, b));

    triangles.push({ normal, plane, keys, edgePairs, edges });

    edges.forEach((edgeKey, edgeIndex) => {
      const owners = edgeOwners.get(edgeKey) || [];
      owners.push({ triangleIndex, edgeIndex });
      edgeOwners.set(edgeKey, owners);
    });
  }

  edgeOwners.forEach((owners) => {
    if (owners.length < 2) {
      return;
    }

    owners.forEach((owner) => {
      owners.forEach((other) => {
        if (owner.triangleIndex !== other.triangleIndex) {
          adjacency[owner.triangleIndex].add(other.triangleIndex);
        }
      });
    });
  });

  const clusters = [];
  const triangleToCluster = Array(triangleCount).fill(-1);
  const visited = Array(triangleCount).fill(false);
  const planeEpsilon = 0.0001;

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    if (visited[triangleIndex]) {
      continue;
    }

    const baseTriangle = triangles[triangleIndex];
    const stack = [triangleIndex];
    const clusterTriangles = [];
    visited[triangleIndex] = true;

    while (stack.length > 0) {
      const currentIndex = stack.pop();
      clusterTriangles.push(currentIndex);

      adjacency[currentIndex].forEach((neighborIndex) => {
        if (visited[neighborIndex]) {
          return;
        }

        const candidate = triangles[neighborIndex];
        if (baseTriangle.normal.dot(candidate.normal) < 0.9995) {
          return;
        }

        if (Math.abs(baseTriangle.plane - candidate.plane) > planeEpsilon) {
          return;
        }

        visited[neighborIndex] = true;
        stack.push(neighborIndex);
      });
    }

    const polygon = buildClusterPolygon(clusterTriangles, triangles, vertexPositions);
    const clusterId = clusters.length;
    const centroid = polygon.vertices.reduce(
      (sum, vertex) => sum.add(vertex),
      new THREE.Vector3(),
    ).multiplyScalar(1 / Math.max(polygon.vertices.length, 1));
    clusterTriangles.forEach((currentTriangleIndex) => {
      triangleToCluster[currentTriangleIndex] = clusterId;
    });
    clusters.push({
      id: clusterId,
      code: formatFaceCode(clusterId),
      triangleIndices: clusterTriangles,
      vertices: polygon.vertices,
      normal: polygon.normal,
      orientationKey: orientationKeyFromNormal(polygon.normal),
      orientation: describeFaceOrientation(polygon.normal),
      toneIndex: 0,
      centroid,
    });
  }

  clusters.forEach((cluster) => {
    cluster.toneIndex = toneVariantForCluster(cluster);
  });

  return {
    triangles,
    adjacency,
    vertexPositions,
    clusters,
    triangleToCluster,
    clusterColors: Array(clusters.length).fill(null),
  };
}

function prepareFaceSelectionData(mesh, pieceId = getActivePiece()?.id) {
  if (!mesh?.geometry?.attributes?.position) {
    return;
  }

  mesh.userData.faceSelection = applyPieceColorSeed(createFaceSelectionData(mesh.geometry), pieceId);
}

function buildFacePolygonFromIntersection(intersection) {
  const faceData = intersection.object?.userData?.faceSelection;
  const startIndex = intersection.faceIndex;

  if (!faceData || startIndex == null) {
    return null;
  }

  const clusterId = faceData.triangleToCluster[startIndex];
  const cluster = faceData.clusters[clusterId];
  if (!cluster) {
    return null;
  }
  return {
    clusterId,
    code: cluster.code,
    orientation: cluster.orientation,
    vertices: cluster.vertices.map((vertex) => vertex.clone()),
    normal: cluster.normal.clone(),
  };
}

function refreshPieceSurfaceColors(mesh = pieceFillMesh) {
  const selectionData = mesh?.userData?.faceSelection;
  const colorAttribute = mesh?.geometry?.getAttribute("color");

  if (!selectionData || !colorAttribute) {
    return;
  }

  selectionData.clusters.forEach((cluster, clusterIndex) => {
    const clusterColor = new THREE.Color(resolveClusterColor(selectionData, clusterIndex));

    cluster.triangleIndices.forEach((triangleIndex) => {
      const vertexOffset = triangleIndex * 3;
      for (let localIndex = 0; localIndex < 3; localIndex += 1) {
        colorAttribute.setXYZ(
          vertexOffset + localIndex,
          clusterColor.r,
          clusterColor.g,
          clusterColor.b,
        );
      }
    });
  });

  colorAttribute.needsUpdate = true;
  if (mesh.material) {
    mesh.material.needsUpdate = true;
  }
}

function buildOverlayTrianglesFromClusters(mesh, clusterIds) {
  const selectionData = mesh?.userData?.faceSelection;
  if (!selectionData || clusterIds.length === 0) {
    return [];
  }

  const trianglePositions = [];

  clusterIds.forEach((clusterId) => {
    const cluster = selectionData.clusters[clusterId];
    if (!cluster || cluster.vertices.length < 3) {
      return;
    }

    const worldNormal = cluster.normal
      .clone()
      .transformDirection(mesh.matrixWorld)
      .normalize()
      .multiplyScalar(0.05);
    const worldVertices = cluster.vertices.map((vertex) =>
      vertex.clone().applyMatrix4(mesh.matrixWorld).add(worldNormal),
    );

    for (let index = 1; index < worldVertices.length - 1; index += 1) {
      const a = worldVertices[0];
      const b = worldVertices[index];
      const c = worldVertices[index + 1];
      trianglePositions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  });

  return trianglePositions;
}

function updateSelectedOverlay() {
  if (!selectedFaceMesh || !pieceFillMesh) {
    return;
  }

  const selectedTriangles = buildOverlayTrianglesFromClusters(
    pieceFillMesh,
    state.viewer.selectedClusters,
  );

  if (selectedTriangles.length === 0) {
    clearHighlight(selectedFaceMesh);
    return;
  }

  selectedFaceMesh.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(selectedTriangles, 3),
  );
  selectedFaceMesh.geometry.computeBoundingSphere();
  selectedFaceMesh.material.color.set(state.viewer.colors.accent);
  selectedFaceMesh.visible = true;
}

function updateFaceSelectionStatus() {
  renderFaceEditor();
}

function clearFaceSelection() {
  state.viewer.selectedClusters = [];
  state.viewer.activeClusterId = null;
  state.viewer.hasSelection = false;
  updateSelectedOverlay();
  updateFaceSelectionStatus();
}

function applyPaintToSelectedFaces() {
  if (!pieceFillMesh || state.viewer.selectedClusters.length === 0) {
    return;
  }

  const selectionData = pieceFillMesh.userData.faceSelection;
  state.viewer.selectedClusters.forEach((clusterId) => {
    selectionData.clusterColors[clusterId] = state.viewer.colors.facePaint;
  });
  refreshPieceSurfaceColors();
  renderFaceEditor();
  syncMiniature();
}

function resetPaintedFaces() {
  if (!pieceFillMesh?.userData?.faceSelection) {
    return;
  }

  const data = pieceFillMesh.userData.faceSelection;
  const targetClusters =
    state.viewer.selectedClusters.length > 0
      ? state.viewer.selectedClusters
      : data.clusters.map((cluster) => cluster.id);

  targetClusters.forEach((clusterId) => {
    data.clusterColors[clusterId] = null;
  });
  refreshPieceSurfaceColors();
  renderFaceEditor();
  syncMiniature();
}

function clearHighlight(mesh) {
  if (mesh) {
    mesh.visible = false;
  }
}

function setHighlightFromIntersection(mesh, intersection) {
  if (
    !mesh ||
    !intersection?.face ||
    !intersection.object?.geometry?.attributes?.position
  ) {
    clearHighlight(mesh);
    return;
  }

  const facePolygon = buildFacePolygonFromIntersection(intersection);
  const localVertices =
    facePolygon?.vertices?.length >= 3
      ? facePolygon.vertices
      : [
          new THREE.Vector3()
            .fromBufferAttribute(intersection.object.geometry.getAttribute("position"), intersection.face.a),
          new THREE.Vector3()
            .fromBufferAttribute(intersection.object.geometry.getAttribute("position"), intersection.face.b),
          new THREE.Vector3()
            .fromBufferAttribute(intersection.object.geometry.getAttribute("position"), intersection.face.c),
        ];

  const worldNormal = (facePolygon?.normal || intersection.face.normal)
    .clone()
    .transformDirection(intersection.object.matrixWorld)
    .normalize()
    .multiplyScalar(0.05);
  const trianglePositions = [];
  const worldVertices = localVertices.map((vertex) =>
    vertex.clone().applyMatrix4(intersection.object.matrixWorld).add(worldNormal),
  );

  for (let index = 1; index < worldVertices.length - 1; index += 1) {
    const a = worldVertices[0];
    const b = worldVertices[index];
    const c = worldVertices[index + 1];
    trianglePositions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }

  mesh.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(trianglePositions, 3),
  );
  mesh.geometry.computeBoundingSphere();
  mesh.material.color.set(state.viewer.colors.accent);
  mesh.visible = true;
}

function createViewCubeTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = "#111111";
  ctx.font = '700 40px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function initViewCube() {
  viewCubeScene = new THREE.Scene();
  viewCubeCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  viewCubeCamera.position.set(0, 0, 4.4);

  viewCubeRenderer = new THREE.WebGLRenderer({
    canvas: dom.viewCubeCanvas,
    antialias: true,
    alpha: true,
  });
  viewCubeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const materials = ["RIGHT", "LEFT", "TOP", "BOTTOM", "BACK", "FRONT"].map((label) => {
    const texture = createViewCubeTexture(label);
    return new THREE.MeshBasicMaterial({ map: texture });
  });

  viewCubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), materials);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(viewCubeMesh.geometry),
    new THREE.LineBasicMaterial({ color: 0x111111 }),
  );
  viewCubeMesh.add(edges);

  viewCubeScene.add(viewCubeMesh);
  viewCubeScene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 0.65);
  key.position.set(2, 3, 4);
  viewCubeScene.add(key);
}

function resizeViewCube() {
  if (!viewCubeRenderer || !dom.viewCubeCanvas) {
    return;
  }

  const width = Math.max(Math.round(dom.viewCubeCanvas.clientWidth), 1);
  const height = Math.max(Math.round(dom.viewCubeCanvas.clientHeight), 1);
  viewCubeRenderer.setSize(width, height, false);
  viewCubeCamera.aspect = width / height;
  viewCubeCamera.updateProjectionMatrix();
}

function renderViewCube() {
  if (!viewCubeRenderer || !viewCubeScene || !viewCubeMesh || !camera) {
    return;
  }

  viewCubeMesh.quaternion.copy(camera.quaternion).invert();
  viewCubeRenderer.render(viewCubeScene, viewCubeCamera);
}

function getViewerDirection() {
  if (!camera || !controls) {
    return CAMERA_DIRECTION.clone();
  }

  const offset = camera.position.clone().sub(controls.target);
  if (offset.lengthSq() < 0.0001) {
    return CAMERA_DIRECTION.clone();
  }
  return offset.normalize();
}

function detectCurrentView() {
  const direction = getViewerDirection();
  const orthographicKeys = ["front", "back", "right", "left", "top", "bottom"];

  for (const key of orthographicKeys) {
    if (direction.dot(PRESET_VIEWS[key].direction) >= VIEW_MATCH_THRESHOLDS.orthographic) {
      return key;
    }
  }

  if (direction.dot(PRESET_VIEWS.isometric.direction) >= VIEW_MATCH_THRESHOLDS.isometric) {
    return "isometric";
  }

  return "free";
}

function refreshViewerUi() {
  const viewKey = state.viewer.currentView;
  dom.currentViewLabel.textContent = PRESET_VIEWS[viewKey]?.label || "Libre";
  dom.gridToggle.classList.toggle("is-active", state.viewer.showGrid);
  dom.axesToggle.classList.toggle("is-active", state.viewer.showAxes);
  dom.presetButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewKey);
  });
}

function positionFloatingPanel(panel, clientX, clientY, minWidth = 260, minHeight = 180) {
  const stageRect = dom.stage.getBoundingClientRect();
  const panelWidth = Math.max(panel.offsetWidth, minWidth);
  const panelHeight = Math.max(panel.offsetHeight, minHeight);
  const relativeX = clientX - stageRect.left;
  const relativeY = clientY - stageRect.top;
  const maxX = Math.max(stageRect.width - panelWidth - 10, 10);
  const maxY = Math.max(stageRect.height - panelHeight - 10, 10);
  const nextX = clamp(relativeX, 10, maxX);
  const nextY = clamp(relativeY, 10, maxY);

  panel.style.left = `${nextX}px`;
  panel.style.top = `${nextY}px`;
}

function closeViewerContextMenu() {
  state.viewer.menuOpen = false;
  dom.viewerContextMenu.hidden = true;
}

function openViewerContextMenu(clientX, clientY) {
  state.viewer.menuOpen = true;
  dom.viewerContextMenu.hidden = false;
  positionFloatingPanel(dom.viewerContextMenu, clientX, clientY, 280, 220);
  resizeViewCube();
  renderThree();
}

function openToolsPanelNearStatus() {
  const rect = dom.viewerStatusCard.getBoundingClientRect();
  openViewerContextMenu(rect.left + 14, rect.bottom + 10);
}

function closeFaceEditor() {
  state.viewer.faceEditorOpen = false;
  dom.faceEditorPanel.hidden = true;
}

function openFaceEditor() {
  state.viewer.faceEditorOpen = true;
  dom.faceEditorPanel.hidden = false;
}

function renderFaceEditor() {
  const data = selectionData();
  const count = state.viewer.selectedClusters.length;
  const activeCluster =
    data && state.viewer.activeClusterId != null
      ? data.clusters[state.viewer.activeClusterId]
      : null;

  if (!data || count === 0 || !activeCluster) {
    dom.faceEditorTitle.textContent = "Cara";
    dom.faceEditorMeta.textContent = "Selecciona una cara para editarla.";
    dom.faceSelectionStatus.textContent = "Sin caras seleccionadas";
    dom.faceSelectionStatus.classList.remove("has-selection");
    dom.faceCurrentColorChip.style.background = state.viewer.colors.figure;
    dom.faceCurrentColorText.textContent = `#${colorToHexString(state.viewer.colors.figure)}`;
    closeFaceEditor();
    return;
  }

  openFaceEditor();

  const clusterCodes = state.viewer.selectedClusters.map((clusterId) => data.clusters[clusterId]?.code);
  const currentColor = getClusterCurrentColor(activeCluster.id);
  const uniqueColors = new Set(
    state.viewer.selectedClusters.map((clusterId) => getClusterCurrentColor(clusterId).toLowerCase()),
  );

  if (count === 1) {
    dom.faceEditorTitle.textContent = `Cara ${activeCluster.code}`;
    dom.faceEditorMeta.textContent = `${activeCluster.orientation} · seleccion individual`;
  } else {
    dom.faceEditorTitle.textContent = `${count} caras seleccionadas`;
    dom.faceEditorMeta.textContent =
      `${clusterCodes.join(", ")} · ${activeCluster.code} activa · ${activeCluster.orientation}`;
  }

  dom.faceSelectionStatus.textContent =
    count === 1
      ? "Click izquierdo selecciona. Shift + click suma o quita."
      : `${count} caras listas para pintar en conjunto.`;
  dom.faceSelectionStatus.classList.add("has-selection");
  dom.faceCurrentColorChip.style.background = uniqueColors.size === 1 ? currentColor : "linear-gradient(135deg, #111111 0%, #ffffff 100%)";
  dom.faceCurrentColorText.textContent =
    uniqueColors.size === 1 ? `#${colorToHexString(currentColor)}` : "Mixto";
}

function updateCurrentViewState() {
  const nextView = detectCurrentView();
  if (nextView !== state.viewer.currentView) {
    state.viewer.currentView = nextView;
    refreshViewerUi();
  }
}

function updateViewerZoomRatio() {
  if (!camera || !state.fitZoom) {
    return;
  }

  state.zoomRatio = clamp(camera.zoom / state.fitZoom, ZOOM_LIMITS.minRatio, ZOOM_LIMITS.maxRatio);
}

function zoomBounds() {
  return {
    min: state.fitZoom * ZOOM_LIMITS.minRatio,
    max: state.fitZoom * ZOOM_LIMITS.maxRatio,
  };
}

function clampCameraZoom() {
  if (!camera || !state.fitZoom) {
    return;
  }

  const bounds = zoomBounds();
  const nextZoom = clamp(camera.zoom, bounds.min, bounds.max);
  if (nextZoom !== camera.zoom) {
    camera.zoom = nextZoom;
    camera.updateProjectionMatrix();
  }
  updateViewerZoomRatio();
}

function buildGridHelper(size) {
  const color = new THREE.Color(state.viewer.colors.grid);
  const helper = new THREE.GridHelper(size, size, color, color);
  const materials = Array.isArray(helper.material) ? helper.material : [helper.material];
  materials.forEach((material) => {
    material.opacity = 0.42;
    material.transparent = true;
  });
  helper.visible = state.viewer.showGrid;
  return helper;
}

function rebuildViewerHelpers(box = pieceGroup ? new THREE.Box3().setFromObject(pieceGroup) : null) {
  if (!scene || !box) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z, 10);
  const helperSize = Math.max(12, Math.ceil(span + 6));
  const floorY = box.min.y - 0.05;

  if (gridHelper) {
    scene.remove(gridHelper);
    disposeObject3D(gridHelper);
  }
  gridHelper = buildGridHelper(helperSize);
  gridHelper.position.set(center.x, floorY, center.z);
  scene.add(gridHelper);

  if (axesHelper) {
    scene.remove(axesHelper);
    disposeObject3D(axesHelper);
  }
  axesHelper = new THREE.AxesHelper(Math.max(4.8, Math.max(size.x, size.y, size.z) * 0.55));
  axesHelper.position.set(box.min.x - 0.9, floorY, box.max.z + 0.9);
  axesHelper.visible = state.viewer.showAxes;
  scene.add(axesHelper);
}

function applyViewerColors(options = {}) {
  const { rebuildHelpers = false } = options;
  const { figure, background, accent } = state.viewer.colors;

  setAccentCssVar(accent);

  if (scene) {
    scene.background = new THREE.Color(background);
  }

  if (renderer) {
    renderer.setClearColor(background, 1);
  }

  if (dom.stage) {
    dom.stage.style.background = background;
  }

  if (pieceFillMesh?.material) {
    pieceFillMesh.material.color.set(0xffffff);
    refreshPieceSurfaceColors();
  }

  if (hoverFaceMesh?.material) {
    hoverFaceMesh.material.color.set(accent);
  }

  if (selectedFaceMesh?.material) {
    selectedFaceMesh.material.color.set(accent);
  }
  updateSelectedOverlay();
  renderFaceEditor();

  if (rebuildHelpers && pieceGroup) {
    rebuildViewerHelpers(new THREE.Box3().setFromObject(pieceGroup));
  } else {
    if (gridHelper) {
      gridHelper.visible = state.viewer.showGrid;
    }
    if (axesHelper) {
      axesHelper.visible = state.viewer.showAxes;
    }
  }

  refreshViewerUi();
  renderSolutionOverlay();
}

function renderThree() {
  if (!renderer || !camera) {
    return;
  }

  updateCurrentViewState();
  renderer.render(scene, camera);
  renderViewCube();
}

function captureReferenceSnapshot() {
  if (!renderer?.domElement) {
    return null;
  }

  renderThree();

  const snapshot = document.createElement("canvas");
  snapshot.width = renderer.domElement.width;
  snapshot.height = renderer.domElement.height;
  const snapshotCtx = snapshot.getContext("2d");
  if (!snapshotCtx) {
    return null;
  }

  snapshotCtx.drawImage(renderer.domElement, 0, 0);
  return snapshot;
}

function buildReferenceExportCanvas(referenceSource) {
  if (!referenceSource) {
    return null;
  }

  const previewCell = state.paper.layout ? activeMiniCell() : { size: 256 };
  const baseSize = Math.max(
    Math.round(previewCell.size * Math.max(state.paper.dpr || 1, 1)),
    256,
  );
  const outputSize = Math.max(baseSize, 768);
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = outputSize;
  exportCanvas.height = outputSize;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) {
    return null;
  }

  exportCtx.fillStyle = "#ffffff";
  exportCtx.fillRect(0, 0, outputSize, outputSize);
  drawReferenceFrame(exportCtx, { x: 0, y: 0, size: outputSize });
  drawReferenceImage(exportCtx, { x: 0, y: 0, size: outputSize }, referenceSource);
  return exportCanvas;
}

function syncMiniature() {
  const snapshot = captureReferenceSnapshot();
  if (!snapshot) {
    return null;
  }

  state.paperImage = snapshot;
  renderPaper();
  return snapshot;
}

function setCameraFrustum(width, height) {
  const aspect = width / height;
  camera.left = -VIEW_FRUSTUM * aspect;
  camera.right = VIEW_FRUSTUM * aspect;
  camera.top = VIEW_FRUSTUM;
  camera.bottom = -VIEW_FRUSTUM;
}

function getBoxCorners(box) {
  return [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];
}

function getProjectedPieceExtents() {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const point = new THREE.Vector3();
  const data = selectionData();

  pieceGroup.updateWorldMatrix(true, true);

  if (data?.clusters?.length && pieceFillMesh) {
    data.clusters.forEach((cluster) => {
      cluster.vertices.forEach((vertex) => {
        point.copy(vertex);
        point.applyMatrix4(pieceFillMesh.matrixWorld);
        point.applyMatrix4(camera.matrixWorldInverse);
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
  } else {
    pieceGroup.traverse((child) => {
      if (!child.isMesh || !child.geometry?.attributes?.position) {
        return;
      }

      const positions = child.geometry.getAttribute("position");
      for (let index = 0; index < positions.count; index += 1) {
        point.fromBufferAttribute(positions, index);
        point.applyMatrix4(child.matrixWorld);
        point.applyMatrix4(camera.matrixWorldInverse);
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    });
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY)
  ) {
    const box = new THREE.Box3().setFromObject(pieceGroup);
    const corners = getBoxCorners(box);
    corners.forEach((corner) => {
      const projected = corner.clone().applyMatrix4(camera.matrixWorldInverse);
      minX = Math.min(minX, projected.x);
      maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y);
      maxY = Math.max(maxY, projected.y);
    });
  }

  return { minX, maxX, minY, maxY };
}

/* The stage fit uses only camera math; it never writes back measured heights into the layout. */
function fitPieceInView(options = {}) {
  if (!pieceGroup) {
    return;
  }

  const {
    direction = getViewerDirection(),
    up = camera.up.clone(),
    resetZoom = false,
    viewKey = null,
  } = options;
  const preset = viewKey ? PRESET_VIEWS[viewKey] : null;
  const padding = preset?.padding || PRESET_VIEWS.isometric.padding;
  const box = pieceGroup.userData.displayBox?.clone() || new THREE.Box3().setFromObject(pieceGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const width = Math.max(dom.viewerRenderLayer.clientWidth || dom.stage.clientWidth, 1);
  const height = Math.max(dom.viewerRenderLayer.clientHeight || dom.stage.clientHeight, 1);
  const distance = Math.max(size.length() * 1.34, CAMERA_DISTANCE);
  const safeDirection = direction.clone().normalize();

  state.viewer.focusPoint.copy(center);
  controls.target.copy(center);
  camera.up.copy(up).normalize();
  camera.position.copy(center).addScaledVector(safeDirection, distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);

  let extents = getProjectedPieceExtents();
  const offsetX = (extents.minX + extents.maxX) / 2;
  const offsetY = (extents.minY + extents.maxY) / 2;

  if (offsetX !== 0 || offsetY !== 0) {
    const right = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    const forward = new THREE.Vector3();
    camera.matrixWorld.extractBasis(right, camUp, forward);

    const worldOffset = right.multiplyScalar(offsetX).add(camUp.multiplyScalar(offsetY));
    camera.position.add(worldOffset);
    controls.target.add(worldOffset);
    state.viewer.focusPoint.copy(controls.target);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld(true);
    extents = getProjectedPieceExtents();
  }

  const fitWidth = Math.max(extents.maxX - extents.minX, 1);
  const fitHeight = Math.max(extents.maxY - extents.minY, 1);
  const aspect = width / height;
  const paddedWidth = fitWidth * padding.x;
  const paddedHeight = fitHeight * padding.y;
  const zoomForWidth = (VIEW_FRUSTUM * 2 * aspect) / paddedWidth;
  const zoomForHeight = (VIEW_FRUSTUM * 2) / paddedHeight;
  const previousRatio = resetZoom
    ? 1
    : clamp(state.zoomRatio, ZOOM_LIMITS.minRatio, ZOOM_LIMITS.maxRatio);

  state.fitZoom = Math.min(zoomForWidth, zoomForHeight);
  camera.zoom = clamp(state.fitZoom * previousRatio, zoomBounds().min, zoomBounds().max);
  camera.updateProjectionMatrix();
  /* Sync OrbitControls after programmatic camera jumps so planta/top does not keep drift from the previous orbit state. */
  controls.update();
  updateViewerZoomRatio();
  rebuildViewerHelpers(box);
  updateCurrentViewState();
  refreshViewerUi();
}

function setPresetView(viewKey, options = {}) {
  const preset = PRESET_VIEWS[viewKey];
  if (!preset || !pieceGroup) {
    return;
  }

  fitPieceInView({
    direction: preset.direction,
    up: preset.up,
    resetZoom: options.resetZoom ?? true,
    viewKey,
  });
  state.viewer.currentView = viewKey;
  controls.update();
  refreshViewerUi();

  if (options.syncMiniature !== false) {
    syncMiniature();
  }
}

function pickPieceFace(event) {
  if (!raycaster || !renderer || !camera || !pieceFillMesh) {
    return null;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(pieceFillMesh, false);
  return hits[0] || null;
}

function handleViewerPointerDown(event) {
  state.viewer.pointerDown = { x: event.clientX, y: event.clientY, button: event.button };
  state.viewer.dragDistance = 0;
  if (event.button === 2) {
    state.viewer.contextDrag = false;
  }
}

function handleViewerPointerMove(event) {
  if (state.viewer.pointerDown) {
    state.viewer.dragDistance = Math.max(
      state.viewer.dragDistance,
      Math.hypot(
        event.clientX - state.viewer.pointerDown.x,
        event.clientY - state.viewer.pointerDown.y,
      ),
    );

    if (state.viewer.pointerDown.button === 2 && state.viewer.dragDistance > 4) {
      state.viewer.contextDrag = true;
    }
  }

  const intersection = pickPieceFace(event);
  setHighlightFromIntersection(hoverFaceMesh, intersection);
}

function handleViewerPointerUp(event) {
  const intersection = pickPieceFace(event);
  if (event.button === 0 && state.viewer.dragDistance < 5 && intersection) {
    const facePolygon = buildFacePolygonFromIntersection(intersection);
    const clusterId = facePolygon?.clusterId;

    if (clusterId != null) {
      const selectedClusters = getSelectedClusterSet();
      if (event.shiftKey) {
        if (selectedClusters.has(clusterId)) {
          selectedClusters.delete(clusterId);
        } else {
          selectedClusters.add(clusterId);
        }
      } else {
        selectedClusters.clear();
        selectedClusters.add(clusterId);
      }

      state.viewer.selectedClusters = [...selectedClusters].sort((a, b) => a - b);
      state.viewer.activeClusterId = state.viewer.selectedClusters.includes(clusterId)
        ? clusterId
        : state.viewer.selectedClusters.length > 0
          ? state.viewer.selectedClusters[state.viewer.selectedClusters.length - 1]
          : null;
      state.viewer.hasSelection = state.viewer.selectedClusters.length > 0;
      updateSelectedOverlay();
      updateFaceSelectionStatus();
    }
  } else if (event.button === 0 && state.viewer.dragDistance < 5 && !event.shiftKey) {
    clearFaceSelection();
  }
  if (event.button === 2 && state.viewer.dragDistance > 4) {
    window.setTimeout(() => {
      state.viewer.contextDrag = false;
    }, 0);
  }
  state.viewer.pointerDown = null;
  state.viewer.dragDistance = 0;
}

function handleViewerPointerLeave() {
  clearHighlight(hoverFaceMesh);
  state.viewer.pointerDown = null;
  state.viewer.dragDistance = 0;
}

function handleControlsChange() {
  clampCameraZoom();
}

function handleViewCubeClick(event) {
  if (!viewCubeRenderer || !viewCubeCamera || !viewCubeMesh || !raycaster) {
    return;
  }

  const rect = dom.viewCubeCanvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );

  raycaster.setFromCamera(ndc, viewCubeCamera);
  const hit = raycaster.intersectObject(viewCubeMesh, false)[0];
  if (!hit?.face) {
    return;
  }

  const faceMap = {
    0: "right",
    1: "left",
    2: "top",
    3: "bottom",
    4: "back",
    5: "front",
  };

  const nextView = faceMap[hit.face.materialIndex];
  if (nextView) {
    setPresetView(nextView);
  }
}

function resizeThree() {
  if (!renderer || !camera) {
    return;
  }

  const width = Math.max(dom.viewerRenderLayer.clientWidth || dom.stage.clientWidth, 1);
  const height = Math.max(dom.viewerRenderLayer.clientHeight || dom.stage.clientHeight, 1);
  renderer.setSize(width, height, false);
  setCameraFrustum(width, height);
  camera.updateProjectionMatrix();
  resizeViewCube();

  if (pieceGroup) {
    fitPieceInView({
      direction: getViewerDirection(),
      up: camera.up.clone(),
      resetZoom: false,
    });
    syncMiniature();
  } else {
    renderThree();
  }
}

function requestLayoutResize() {
  window.cancelAnimationFrame(layoutFrame);
  layoutFrame = window.requestAnimationFrame(() => {
    resizePaperCanvas();
    resizeThree();
  });
}

async function loadCurrentPiece() {
  const piece = getActivePiece();
  const token = ++state.loadToken;
  dom.stage.classList.add("is-loading");
  clearSolutionOverlay();

  try {
    const geometry = await resolvePieceGeometry(piece);
    if (token !== state.loadToken) {
      return;
    }

    const displayGeometry = ensureDisplayGeometry(piece, geometry);
    ensurePieceSolution(piece, geometry, true);
    syncActivePieceFigureColor(piece);

    if (pieceGroup) {
      scene.remove(pieceGroup);
      disposeGroup(pieceGroup);
      pieceFillMesh = null;
      pieceOutline = null;
    }

    clearHighlight(hoverFaceMesh);
    clearHighlight(selectedFaceMesh);
    state.viewer.hasSelection = false;
    state.viewer.selectedClusters = [];
    state.viewer.activeClusterId = null;
    closeFaceEditor();

    pieceGroup = buildPieceGroup(displayGeometry, piece.id);
    scene.add(pieceGroup);
    applyViewerColors();
    updateFaceSelectionStatus();

    const nextView = PRESET_VIEWS[state.viewer.currentView] ? state.viewer.currentView : "isometric";
    setPresetView(nextView, { resetZoom: true, syncMiniature: false });
    syncMiniature();
    renderSolutionOverlay();
  } finally {
    if (token === state.loadToken) {
      window.setTimeout(() => {
        dom.stage.classList.remove("is-loading");
      }, 40);
    }
  }
}

async function setPiece(index, needsConfirm = true) {
  if (index < 0 || index >= PIECES.length || index === state.currentPieceIndex) {
    return;
  }

  if (!clearDrawing(needsConfirm)) {
    return;
  }

  state.currentPieceIndex = index;
  state.activeDifficulty = PIECES[index].difficulty;
  state.zoomRatio = 1;
  closeViewerContextMenu();
  clearSolutionOverlay();
  resetQuizState();
  updatePieceLabels();
  renderDifficultyTabs();
  renderPieceLibrary();
  renderGuideCards();
  renderTheoryCards();
  renderQuiz();
  await loadCurrentPiece();
}

async function setDifficulty(difficulty, needsConfirm = true) {
  if (!difficulty) {
    return;
  }

  if (getActivePiece().difficulty === difficulty) {
    state.activeDifficulty = difficulty;
    renderDifficultyTabs();
    renderPieceLibrary();
    updatePieceLabels();
    return;
  }

  const firstPiece = getPiecesByDifficulty(difficulty)[0];
  if (!firstPiece) {
    return;
  }

  await setPiece(findPieceIndex(firstPiece.id), needsConfirm);
}

function stepVisiblePiece(offset) {
  const visiblePieces = getPiecesByDifficulty();
  if (visiblePieces.length === 0) {
    return;
  }

  const activeId = getActivePiece().id;
  const currentIndex = visiblePieces.findIndex((piece) => piece.id === activeId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextPiece =
    visiblePieces[(safeIndex + offset + visiblePieces.length) % visiblePieces.length];

  void setPiece(findPieceIndex(nextPiece.id));
}

function animateViewer() {
  viewerFrame = window.requestAnimationFrame(animateViewer);
  controls?.update();
  renderThree();
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(state.viewer.colors.background);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(state.viewer.colors.background, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  dom.viewerRenderLayer.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  viewerEnvironmentMap = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = viewerEnvironmentMap;
  pmremGenerator.dispose();

  camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 120);
  camera.position.copy(CAMERA_DIRECTION.clone().multiplyScalar(CAMERA_DISTANCE));
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = true;
  /* Allow exact orthographic top/bottom presets; OrbitControls internally keeps them numerically safe. */
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;
  controls.rotateSpeed = 0.78;
  controls.panSpeed = 0.8;
  controls.zoomSpeed = 0.95;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };

  const ambient = new THREE.AmbientLight(0xffffff, 1.08);
  const key = new THREE.DirectionalLight(0xffffff, 1.08);
  key.position.set(8, 10, -6);
  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-6, 8, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 0.34);
  rim.position.set(5, 3, 9);
  scene.add(ambient, key, fill, rim);

  hoverFaceMesh = createHighlightMesh(0.18);
  selectedFaceMesh = createHighlightMesh(0.3);
  scene.add(hoverFaceMesh, selectedFaceMesh);

  raycaster = new THREE.Raycaster();
  initViewCube();
  applyViewerColors();

  renderer.domElement.addEventListener("pointerdown", handleViewerPointerDown);
  renderer.domElement.addEventListener("pointermove", handleViewerPointerMove);
  renderer.domElement.addEventListener("pointerup", handleViewerPointerUp);
  renderer.domElement.addEventListener("pointerleave", handleViewerPointerLeave);

  controls.addEventListener("change", handleControlsChange);
  controls.addEventListener("end", () => {
    clampCameraZoom();
    syncMiniature();
  });

  resizeThree();
  animateViewer();
}

function bindEvents() {
  dom.lineButton.addEventListener("click", () => {
    state.activeTool = "line";
    state.pendingLineStart = null;
    state.previewLine = null;
    renderToolbar();
    renderPaper();
  });

  dom.eraseButton.addEventListener("click", () => {
    state.activeTool = "erase";
    state.pendingLineStart = null;
    state.previewLine = null;
    renderToolbar();
    renderPaper();
  });

  dom.dashedButton.addEventListener("click", () => {
    state.dashed = !state.dashed;
    renderToolbar();
    renderPaper();
  });

  dom.profileButton.addEventListener("click", () => {
    state.profileSwapped = !state.profileSwapped;
    renderToolbar();
    renderPaper();
  });

  dom.clearButton.addEventListener("click", () => {
    clearDrawing(true);
  });

  dom.saveButton.addEventListener("click", downloadCanvasPng);
  dom.saveReferenceButton.addEventListener("click", downloadReferencePng);
  dom.saveReferenceInlineButton.addEventListener("click", downloadReferencePng);
  dom.solutionToggle.addEventListener("change", (event) => {
    state.solution.visible = event.target.checked;
    renderSolutionControls();
    renderSolutionOverlay();
  });
  dom.solutionViewLateral.addEventListener("change", (event) => {
    state.solution.lateral = event.target.checked;
    renderSolutionOverlay();
  });
  dom.solutionViewAlzado.addEventListener("change", (event) => {
    state.solution.alzado = event.target.checked;
    renderSolutionOverlay();
  });
  dom.solutionViewPlanta.addEventListener("change", (event) => {
    state.solution.planta = event.target.checked;
    renderSolutionOverlay();
  });
  dom.prevButton.addEventListener("click", () => stepVisiblePiece(-1));
  dom.nextButton.addEventListener("click", () => stepVisiblePiece(1));

  dom.difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      void setDifficulty(button.dataset.difficulty);
    });
  });

  dom.sidebarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSidebarTab(button.dataset.sidebarTab);
    });
  });

  dom.paper.addEventListener("click", handlePaperClick);
  dom.paper.addEventListener("mousemove", handlePaperMove);
  dom.paper.addEventListener("mouseleave", () => {
    if (state.previewLine) {
      state.previewLine = null;
      renderPaper();
    }
  });

  dom.viewerStatusCard.addEventListener("click", () => {
    if (state.viewer.menuOpen) {
      closeViewerContextMenu();
      return;
    }
    openToolsPanelNearStatus();
  });

  dom.closeToolsPanelButton.addEventListener("click", () => {
    closeViewerContextMenu();
  });

  dom.resetViewButton.addEventListener("click", () => {
    setPresetView("isometric");
  });

  dom.gridToggle.addEventListener("click", () => {
    state.viewer.showGrid = !state.viewer.showGrid;
    applyViewerColors({ rebuildHelpers: true });
    syncMiniature();
  });

  dom.axesToggle.addEventListener("click", () => {
    state.viewer.showAxes = !state.viewer.showAxes;
    applyViewerColors();
    syncMiniature();
  });

  dom.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPresetView(button.dataset.view);
    });
  });

  dom.figureColorInput.addEventListener("input", (event) => {
    state.viewer.figureColorOverrides[getActivePiece().id] = event.target.value;
    syncActivePieceFigureColor();
    applyViewerColors();
    syncMiniature();
  });

  dom.gridColorInput.addEventListener("input", (event) => {
    state.viewer.colors.grid = event.target.value;
    applyViewerColors({ rebuildHelpers: true });
    syncMiniature();
  });

  dom.backgroundColorInput.addEventListener("input", (event) => {
    state.viewer.colors.background = event.target.value;
    applyViewerColors();
    syncMiniature();
  });

  dom.accentColorInput.addEventListener("input", (event) => {
    state.viewer.colors.accent = event.target.value;
    applyViewerColors();
    syncMiniature();
  });

  dom.facePaintColorInput.addEventListener("input", (event) => {
    state.viewer.colors.facePaint = event.target.value;
  });

  dom.applyFacePaintButton.addEventListener("click", () => {
    applyPaintToSelectedFaces();
  });

  dom.clearFaceSelectionButton.addEventListener("click", () => {
    clearFaceSelection();
    renderThree();
  });

  dom.resetFacePaintButton.addEventListener("click", () => {
    resetPaintedFaces();
  });

  dom.closeFaceEditorButton.addEventListener("click", () => {
    clearFaceSelection();
  });

  dom.viewCubeCanvas.addEventListener("click", handleViewCubeClick);
  dom.viewerContextMenu.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  dom.stage.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (state.viewer.contextDrag) {
      state.viewer.contextDrag = false;
      return;
    }
    openViewerContextMenu(event.clientX, event.clientY);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!state.viewer.menuOpen) {
      return;
    }

    if (
      dom.viewerStatusCard.contains(event.target) ||
      dom.viewerContextMenu.contains(event.target) ||
      (dom.stage.contains(event.target) && event.button === 2)
    ) {
      return;
    }

    closeViewerContextMenu();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.viewer.menuOpen) {
      closeViewerContextMenu();
    }
  });

  /* Avoid observing the panels themselves: canvas resizing against a padded/content-driven parent caused a feedback loop. */
  window.addEventListener("resize", requestLayoutResize);
}

async function init() {
  syncActivePieceFigureColor();
  dom.gridColorInput.value = state.viewer.colors.grid;
  dom.backgroundColorInput.value = state.viewer.colors.background;
  dom.accentColorInput.value = state.viewer.colors.accent;
  dom.facePaintColorInput.value = state.viewer.colors.facePaint;
  renderToolbar();
  renderSolutionControls();
  updatePieceLabels();
  renderSidebarTabs();
  renderSidebarPanels();
  renderDifficultyTabs();
  renderPieceLibrary();
  renderGuideCards();
  renderTheoryCards();
  renderQuiz();
  updateFaceSelectionStatus();
  resizePaperCanvas();
  initThree();
  bindEvents();
  await loadCurrentPiece();
  void preloadAllSolutions();
}

init().catch((error) => {
  console.error(error);
});
