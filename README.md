# DataSafe Room Landing

Landing estática React/Vite para validar la propuesta comercial de DataSafe Room: salas controladas de colaboración de datos industriales.

## Boundary

- Solo landing pública estática.
- Sin backend, formularios, analytics, cookies ni procesamiento de datos personales.
- No promete cumplimiento legal, certificación, seguridad absoluta ni integración OT/IT.
- CTA por `mailto:hola@etharlia.com`.


## Documentación de producto

- `docs/datasafe-room-dataspace-characteristics-2026-05-07.md`: PRD interno consolidado del dataspace DataSafe Room, con características, arquitectura, legal/security, MVP, backlog y QA gate.
- `docs/datasafe-room-dataspace-characteristics-2026-05-07.pdf`: versión PDF del PRD consolidado.
- `docs/software/datasafe-room-technical-specification-2026-05-07.md`: especificación técnica consolidada de componentes, backend, datos, APIs, workers, seguridad, infra, QA y diagramas.
- `docs/software/datasafe-room-technical-specification-2026-05-07.pdf`: versión PDF de la especificación técnica con gráficos embebidos.
- `docs/software/datasafe-room-dsp-alignment-proposal-2026-05-07.md`: propuesta de alineación con IDSA Dataspace Protocol 2024-1/Eclipse DSP sin convertir el MVP en federación completa.
- `docs/software/datasafe-room-dsp-alignment-proposal-2026-05-07.pdf`: versión PDF de la propuesta de alineación DSP.
- `docs/software/datasafe-room-edc-implementation-plan-2026-05-07.md`: propuesta consolidada de implementación con Eclipse Dataspace Components / EDC, sus frameworks, fases P0-P3, arquitectura, seguridad, despliegue y criterios de aceptación.
- `docs/software/datasafe-room-edc-implementation-plan-2026-05-07.pdf`: versión PDF de la propuesta EDC.
- `docs/software/datasafe-room-edc-implementation-proposal-2026-05-07.md`: apéndice Daedalus/backend EDC.
- `docs/software/datasafe-room-edc-deployment-operations-proposal-2026-05-07.md`: apéndice Hephaestus/DevOps EDC.
- `docs/software/datasafe-room-edc-trust-security-analysis-2026-05-07.md`: apéndice Aegis/security-trust EDC.
- `docs/software/datasafe-room-edc-technical-diagrams-ux-2026-05-07.md`: apéndice Mimir/diagramas y UX EDC.
- `docs/software/datasafe-room-technical-diagrams-ux-flow-2026-05-07.md`: esquemas técnicos/UX de DataSafe Room con arquitectura, flujo PCF, dominio, estados, permisos, infra y roadmap.
- `docs/software/datasafe-room-technical-diagrams-ux-flow-2026-05-07.pdf`: versión PDF con gráficos para revisión ejecutiva/técnica.
- `docs/product-strategy-backlog.md`: estrategia, paquetes, UX y backlog vendible.
- `docs/security-ot-review.md`: revisión Aegis/Security-OT con amenazas, controles obligatorios, requisitos MVP/v1 y checklists para piloto seguro.

## Desarrollo

```bash
npm install
npm run typecheck
npm run build
```

## Deploy

El Dockerfile compila la app y sirve `dist/` con Nginx en el puerto 80 para Coolify.
