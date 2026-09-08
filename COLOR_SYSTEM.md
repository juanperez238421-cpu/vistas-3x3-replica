# Vistas 3x3 · Monochrome Production UI

The production interface intentionally uses a restrained **black / white / gray CAD language**. Color is not used for ordinary navigation, difficulty, drawing-tool, hover or focus states.

## Core UI palette

| Role | Value |
| --- | --- |
| App background | `#FFFFFF` |
| Primary ink / active controls | `#111111` |
| Structural border | `#1C1C1C` |
| Soft surface | `#F3F3F3` |
| Secondary surface | `#FAFAFA` |
| Muted text | `#666666` |

## Production rules

1. Active navigation and tools use black with white text.
2. Hover states use neutral gray only.
3. Focus rings remain monochrome and high-contrast.
4. The figure catalogue must never create horizontal scrolling.
5. Selected figure cards must not translate outside the scrollport.
6. The drawing toolbar must wrap before labels clip.
7. The face editor must remain compact enough that it does not dominate the 3D geometry.
8. Responsive, keyboard, drawing, geometry and export behavior remain unchanged.

Projection swatches and user-selected face/material colors are domain content, not interface chrome, so they may remain colored where they communicate the drawing/model itself.

Implementation lives in `ui-color-system.css`, loaded after `styles.css` and `ui-enhancements.css` as the final production visual/containment layer.
