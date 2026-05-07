# Arquitectura — DataSafe Room Landing

## Boundary

Aplicación estática React/Vite servida por Nginx en Coolify.

```text
Browser -> Coolify/Traefik -> Nginx container -> static HTML/CSS/JS
```

## Componentes

- `src/main.tsx`: contenido y estructura de landing.
- `src/styles.css`: diseño responsive sin dependencias externas.
- `Dockerfile`: build Node 22 + runtime Nginx.
- `ops/nginx/app.conf`: headers de seguridad y fallback SPA.

## Seguridad / privacidad

- Sin backend.
- Sin cookies.
- Sin analytics.
- Sin captura de datos personales.
- CTA mediante cliente de correo del usuario.

## Deploy esperado

- Dominio objetivo: `https://datasafe.etharlia.com`.
- DNS necesario: A record `datasafe.etharlia.com -> 178.104.87.248`.
