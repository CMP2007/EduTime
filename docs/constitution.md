# Constitución de StudyTrack

Principios innegociables que todo cambio en StudyTrack debe respetar; prevalecen sobre el resto de la documentación.

| Principio | Regla | Verificación |
|---|---|---|
| Dependencias y stack | Dependencia nueva o cambio: justificar que lo existente no basta, aprobación previa, versiones exactas en todos los `package.json`, sin rangos ni `@latest`. | `npm outdated` y `npm audit` limpios; diff de `package.json`/`package-lock.json` revisado; aprueba el mantenedor. |
| Spec y código | Cambio observable de comportamiento/contrato (API, datos, regla o UI): spec aprobada en `specs/<feature>/spec.md` con criterios verificables antes del código. | La spec existe con criterios verificables; el código no la contradice y sus criterios están cubiertos por `npm test`. |
| Separación de responsabilidades | Backend: HTTP, reglas y datos separados; frontend: HTTP, estado y UI en módulos distintos. Dependencias en un solo sentido; un archivo, una responsabilidad. | Revisión manual de imports y estructura por el mantenedor; ESLint no verifica capas. |
| Tests y lint | Todo cambio de comportamiento lleva test que falle sin él; `npm test` y `npm run lint` bloquean. Una corrección solo vale si su test falla al revertirla. | `npm test` y `npm run lint` desde la raíz; la mutación (el test falla al revertir la corrección) la comprueba el mantenedor a mano. |
| Datos y secretos | Solo los datos mínimos, en local; sin secretos ni datos personales en el repositorio, logs o terceros; exponer la API exige aprobación y control de acceso. | `git ls-files backend/data` vacío; `.env*` no versionado; revisión de logs y terceros; borrar una sesión la elimina del almacenamiento. |
| Idioma | Documentación, textos de interfaz y mensajes de error en español; identificadores, nombres técnicos y código en inglés. | Revisión manual del mantenedor en cada cambio; ESLint no lo comprueba. |

## Gobernanza

- Versión 1.0.0 · ratificación: 2026-10-22 · última enmienda: 2026-10-22.
- `AGENTS.md` es la guía operativa; esta constitución prevalece sobre él y sobre `README.md`, `MEMORY.md` y `DEUDA_TECNICA.md`.
- Ante conflicto, se sigue la constitución y se corrige el otro documento.
- Se modifica solo con aprobación explícita del mantenedor; cada cambio sube la versión y actualiza la fecha de la última enmienda.
- Patch: correcciones editoriales; menor: añadir o cambiar un principio; mayor: retirarlo o redefinirlo de forma incompatible.
- Se comprueba en cada cambio con las verificaciones de la tabla; una violación bloquea el cambio o exige enmendar la constitución.
- Sin CI: `npm test` y `npm run lint` los ejecuta el mantenedor en local antes del commit.
