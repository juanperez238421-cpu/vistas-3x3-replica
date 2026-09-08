# Trazo Senior 3×3

El panel **Trazo** conserva el motor de dibujo, proyecciones y exportación existente, pero añade una capa de interfaz orientada a dibujo técnico.

## Retícula técnica

Cada zona activa de proyección —Lateral, Alzado y Planta— incorpora una retícula 3×3 alineada con el sistema de coordenadas del lienzo. Las divisiones principales marcan los tres módulos y las guías secundarias de medio módulo coinciden con el ajuste (`snap`) usado por el motor de dibujo. Los puntos centrales funcionan como referencias de registro visual.

La cuarta zona mantiene la referencia 3D y se identifica como `REF`. Al usar **Perfil**, la retícula y la referencia intercambian su posición de forma sincronizada con el comportamiento original.

## Herramientas

Los controles se separan visualmente en dos familias:

- **Dibujo:** Recta, Discontinua, Borrar y Perfil.
- **Documento:** Limpiar, exportación PNG, PNG de referencia y Ampliar.

Los botones conservan sus IDs y listeners originales; la mejora reorganiza los elementos existentes y no replica la lógica de `app.js`.

## Modo ampliado

**Ampliar trazo** utiliza el mismo panel y los mismos canvas. No se crea un segundo documento ni se copia el estado: se amplía el área real de trabajo y se dispara el resize existente para recalcular los canvas. `Esc` devuelve el panel a su tamaño normal.

## Arquitectura

- `trace-workbench-v2.js`: reorganización progresiva, retícula y expansión.
- `trace-workbench.css`: layout compacto, modo ampliado y responsive.
- `qa/trace-workbench-qa.mjs`: pruebas dedicadas de clipping, retícula, expansión y errores de runtime.

La matemática de proyección, Three.js, solución, trazos y exportación permanece en `app.js` sin modificaciones.