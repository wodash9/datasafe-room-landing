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
