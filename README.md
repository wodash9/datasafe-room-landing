# DataSafe Room Landing

Landing estática React/Vite para validar la propuesta comercial de DataSafe Room: salas controladas de colaboración de datos industriales.

## Boundary

- Solo landing pública estática.
- Sin backend, formularios, analytics, cookies ni procesamiento de datos personales.
- No promete cumplimiento legal, certificación, seguridad absoluta ni integración OT/IT.
- CTA por `mailto:hola@etharlia.com`.

## Desarrollo

```bash
npm install
npm run typecheck
npm run build
```

## Deploy

El Dockerfile compila la app y sirve `dist/` con Nginx en el puerto 80 para Coolify.
