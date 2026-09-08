# Vistas 3x3 · Senior Engineering Color System

This layer preserves the existing CAD workflow and uses color only to communicate hierarchy, state, projection type and action semantics.

## Core palette

| Role | Color | Use |
| --- | --- | --- |
| App background | `#EAF0F6` | Neutral workspace around panels |
| Ink | `#182230` | Primary text / structure |
| Muted ink | `#667085` | Secondary information |
| Border | `#C8D3DF` | Panels, cards and controls |
| Primary | `#2563EB` | Selected navigation, alzado, focus and primary state |
| Teal | `#0F8A70` | Planta, basic level, positive/export affordances |
| Amber | `#D97706` | Lateral projection and intermediate level |
| Danger | `#BE4057` | Erase/clear and advanced level |
| Indigo | `#6558D3` | Dashed-line drawing mode |

## Projection semantics

- **Lateral:** amber `#D97706`
- **Alzado:** blue `#2563EB`
- **Planta:** teal `#0F8A70`

The same projection colors are used in the solution overlay, legend and solution toggles.

## 3D defaults

- Figure: `#D8E0E8`
- Grid: `#B9C7D6`
- Background: `#F2F6FA`
- Accent: `#2563EB`
- Face paint: `#D97706`

## Interaction principles

1. White/neutral surfaces remain the dominant canvas.
2. Blue is reserved for primary selection and navigation.
3. Projection colors stay consistent across 2D and 3D contexts.
4. Difficulty buttons use semantic color only when active/hovered.
5. Destructive controls use rose/red only on activation or hover.
6. Focus remains highly visible with a blue ring.
7. `prefers-contrast: more` strengthens borders and secondary text.
8. Existing responsive, keyboard, drawing, geometry and export logic is unchanged.

Implementation lives in `ui-color-system.css`, loaded after `styles.css` and `ui-enhancements.css` so it remains independently reviewable and reversible.
