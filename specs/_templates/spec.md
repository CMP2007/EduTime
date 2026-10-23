# Spec NNN — {{título de la funcionalidad}}

> Origen: {{DEUDA_TECNICA.md · Bn-m | petición | idea}}
> Estado: {{propuesta | aprobada}} ({{AAAA-MM-DD}})

## Contexto y objetivo

{{Qué problema existe hoy y qué debe cambiar. Sin archivos, funciones ni decisiones técnicas.}}

## Usuarios / actores

{{Quién lo usa y en qué situación.}}

## Historias de usuario

- H1: Como {{actor}} quiero {{necesidad}} para {{beneficio}}.

## Requisitos funcionales (EARS)

<!-- Un requisito por comportamiento observable, en español:
     CUANDO {{disparador}}, EL SISTEMA {{respuesta}}.
     MIENTRAS {{estado}}, EL SISTEMA {{respuesta}}.
     SI {{condición}}, ENTONCES EL SISTEMA {{respuesta}}.
     No citar archivos, hooks, endpoints, tablas ni librerías. -->

- RF-1: CUANDO {{disparador}}, EL SISTEMA {{respuesta}}.
- RF-2: {{...}}

## Requisitos no funcionales

- {{Accesibilidad, rendimiento, seguridad, idioma o compatibilidad que apliquen.}}

## Casos límite

- {{Estado vacío, error, dato ausente, concurrencia, desmontaje…}}

## Fuera de alcance

- {{Lo que podría esperarse pero no se hará en esta iteración.}}

## Criterios de finalización

- RF-1 a RF-N cubiertos por tests en {{ruta o módulo}}.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- {{Comprobación manual, si aplica.}}

## Dudas abiertas

- {{Pregunta que debe resolver el mantenedor. Marcar [NO BLOQUEANTE] si no impide empezar.}}
