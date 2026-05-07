---
title: DataSafe Room + EDC — Propuesta de despliegue y operación
project: datasafe-room
status: internal-proposal
updated: 2026-05-07
owner: Black Tower Consulting / Ventura
scope: de local/dev a piloto con EDC, sin backend productivo todavía
---

# DataSafe Room + EDC — Propuesta de despliegue y operación

## 0. Decisión recomendada

El repositorio actual es una landing estática; no existe todavía backend de producto. Por eso, EDC debe entrar primero como laboratorio de interoperabilidad y después como conector de piloto, no como backend de negocio de DataSafe Room.

Ruta recomendada:

- **Fase 0 — Landing/demo comercial:** Coolify + Nginx. Sin EDC productivo.
- **Fase 1 — Local/dev lab:** Docker Compose con dos participantes simulados, PostgreSQL, MinIO y observabilidad opcional.
- **Fase 2 — Demo integrada en VPS/Coolify:** DataSafe API cuando exista, EDC provider, consumer de demo, PostgreSQL, MinIO y exposición pública mínima.
- **Fase 3 — Piloto controlado:** zonas de red separadas, secrets gestionados, backups, métricas, logs, alertas y runbooks. Kubernetes/Helm solo si hay requisito real.

Principio rector: **Controlled Export First**. Ningún catálogo ni contrato debe exponer URLs internas de S3/MinIO ni datos crudos. La transferencia debe pasar por política, aprobación, auditoría y artefacto temporal controlado.

## 1. Bloques lógicos

- **DataSafe Room UI:** landing actual y futura UI de salas, catálogo, políticas, aprobaciones y auditoría.
- **DataSafe Room API / backend futuro:** monolito modular inicial para organizaciones, salas, participantes, activos, policies internas, export requests y audit log.
- **PostgreSQL:** persistencia para DataSafe y EDC; preferible bases/usuarios separados por servicio.
- **MinIO/S3:** object storage para manifests, datasets sintéticos, evidencias y artefactos aprobados.
- **EDC Control Plane:** catálogo DSP, assets, policies, contract definitions, negotiations y transfer processes.
- **EDC Data Plane:** transferencia controlada entre storage privado y consumidor autorizado.
- **IdentityHub:** solo cuando hagan falta DID/VC o onboarding formal de participantes.
- **Federated Catalog:** solo si hay múltiples providers y necesidad de búsqueda federada.
- **Secrets manager:** local con `.env` fuera de git; demo con Coolify secrets o SOPS/age; piloto con Vault, Infisical, Doppler, 1Password Connect o cloud secrets.
- **Observabilidad:** Micrometer/Prometheus/Grafana para métricas; Docker/Coolify logs en demo; Loki + Promtail/Vector en piloto.
- **Backups:** PostgreSQL dump/PITR según fase; MinIO/S3 con versioning, lifecycle y restore probado.

## 2. Fase 0 — Landing actual en Coolify

### Objetivo

Mostrar propuesta comercial sin operar datos ni conectores dataspace.

### Topología

- Internet → DNS → Coolify/Traefik → Nginx container → React/Vite estático.

### Servicios

- `datasafe-landing`.
- Coolify/Traefik para TLS y routing.

### Puertos y zonas

- Público:
  - `443/tcp`: landing HTTPS.
  - `80/tcp`: redirección a HTTPS.
- Interno:
  - Puerto Nginx del contenedor, no expuesto directamente.

### Configuración y operación

- Sin secrets de aplicación.
- Sin cookies, analytics ni captura de datos personales.
- Build por push/tag.
- Smoke test: HTTP 200, assets cargan, headers de seguridad y TLS válido.

### No desplegar todavía

- EDC Control Plane/Data Plane.
- PostgreSQL productivo.
- MinIO/S3 con datos reales.
- Vault.
- Grafana/Prometheus propios salvo necesidad concreta.

## 3. Fase 1 — Local/dev lab con Docker Compose

### Objetivo

Aprender y validar EDC sin riesgo: catálogo, contrato y transferencia de artefactos sintéticos.

### Topología

- Red Docker local `datasafe-dev`.
- Participante provider:
  - `edc-provider-control-plane`.
  - `edc-provider-data-plane`.
- Participante consumer simulado:
  - `edc-consumer-control-plane`.
  - `edc-consumer-data-plane` opcional.
- `postgres`.
- `minio`.
- `prometheus` y `grafana` opcionales.

### Servicios mínimos

- PostgreSQL:
  - Base `edc_provider`.
  - Base `edc_consumer`.
  - Base `datasafe_app` cuando exista backend.
- MinIO:
  - Bucket `datasafe-raw-dev` para datos sintéticos.
  - Bucket `datasafe-approved-dev` para outputs aprobados.
  - Bucket `datasafe-manifests-dev` para manifests y checksums.
- EDC Provider Control Plane:
  - Management API solo localhost/red interna.
  - DSP protocol endpoint accesible por el consumer.
  - Métricas Micrometer si se habilitan.
- EDC Provider Data Plane:
  - Endpoint público local para transferencia si se prueba HTTP.
  - Control API solo interna CP↔DP.
- EDC Consumer:
  - Puede omitirse el data plane si solo se valida catálogo/negociación.

### Puertos sugeridos local/dev

Todos son configurables; fijarlos en `.env.local` fuera de git:

- PostgreSQL: `127.0.0.1:5432`.
- MinIO API: `127.0.0.1:9000`.
- MinIO consola: `127.0.0.1:9001`.
- Provider Control Plane management: `127.0.0.1:8181`, nunca público.
- Provider Control Plane DSP/protocol: `127.0.0.1:8282`.
- Provider metrics: `127.0.0.1:9091`.
- Provider Data Plane public local: `127.0.0.1:8383`.
- Provider Data Plane control: interno Docker, por ejemplo `9191`.
- Consumer management: `127.0.0.1:8184`.
- Consumer DSP/protocol: `127.0.0.1:8284`.
- Consumer metrics: `127.0.0.1:9094`.
- Prometheus: `127.0.0.1:9090`.
- Grafana: `127.0.0.1:3000`.

### Configuración/secrets

- `.env.local` fuera de git.
- `.env.example` solo con nombres.
- Secrets mínimos:
  - `POSTGRES_PASSWORD` y usuarios por servicio.
  - `MINIO_ROOT_USER` y `MINIO_ROOT_PASSWORD` solo para bootstrap.
  - Access key/secret key específicos por servicio.
  - Tokens de EDC management API.
  - Claves/JWK de prueba si se ensaya identidad.

### Operación

- Levantar stack Compose local.
- Sembrar buckets MinIO.
- Crear asset/policy/contract definition en provider.
- Solicitar catálogo desde consumer.
- Negociar contrato.
- Ejecutar transferencia sintética y verificar checksum.
- Validar healthchecks, métricas y logs sin errores recurrentes.

### Coste/complejidad

- Coste: 0 € de infraestructura.
- Complejidad: media, por configuración EDC, datasources, endpoints y vault/secrets.

### No desplegar todavía

- Kubernetes.
- Vault HA.
- Federated Catalog.
- IdentityHub completo si basta con identidad estática.
- OpenTelemetry completo.
- Multi-tenancy real.

## 4. Fase 2 — Demo integrada en VPS/Coolify

### Objetivo

Demo end-to-end por URL pública con datos sintéticos y gestión mínima de operación.

### Topología

- Internet → DNS → Coolify/Traefik.
- Público:
  - UI/API demo.
  - EDC DSP protocol del provider.
  - EDC Data Plane public endpoint solo si se requiere transferencia pública.
- Privado:
  - PostgreSQL.
  - MinIO.
  - EDC management APIs.
  - EDC control APIs.
  - Métricas y logs.

### Servicios

- `datasafe-web`.
- `datasafe-api` cuando exista backend.
- `postgres`.
- `minio` o S3 compatible externo.
- `edc-provider-control-plane`.
- `edc-provider-data-plane`.
- `edc-consumer-demo` si se quiere demo autocontenida.
- `prometheus` + `grafana` recomendables.
- Logs Coolify; Loki si se necesita búsqueda/retención.

### Puertos y exposición

- Público vía `443/tcp`:
  - `datasafe-demo.<dominio>` para web/API.
  - `edc-provider-demo.<dominio>` para DSP protocol.
  - `edc-data-demo.<dominio>` para Data Plane public endpoint si aplica.
- Privado:
  - PostgreSQL `5432`, sin exposición pública.
  - MinIO `9000/9001`, consola cerrada o protegida.
  - EDC management APIs solo red privada, VPN o túnel SSH.
  - Métricas `909x` solo Prometheus interno.
  - Grafana detrás de SSO/basic auth/VPN.

### Configuración/secrets

- Coolify secrets como mínimo.
- Variables por servicio y por entorno.
- Usuarios PostgreSQL por componente.
- Access keys MinIO por servicio con least privilege por bucket/prefix.
- Tokens EDC management rotables.
- TLS gestionado por Traefik/Coolify.
- CORS limitado a dominios de demo.
- Catálogo sin metadatos sensibles ni URLs directas a storage.

### Operación

- Deploy por push/tag.
- Migraciones explícitas cuando exista backend.
- Healthchecks: web/API, EDC CP, EDC DP, PostgreSQL y MinIO.
- Smoke tests: carga UI, request de catálogo, negociación, transferencia sintética y checksum.
- Backups: PostgreSQL diario con 7-14 días de retención; MinIO mirror/snapshot si hay artefactos relevantes.

### Coste/complejidad

- Coste orientativo: 20-80 €/mes en VPS único con datos sintéticos.
- Complejidad: media-alta.
- Riesgo principal: exponer management APIs por error.

## 5. Fase 3 — Piloto controlado

### Objetivo

Operar con participantes reales, datasets acotados y procedimientos verificables.

### Opción A — VM/Coolify endurecido

Recomendable para primer piloto si:

- Hay un provider DataSafe principal.
- El consumer es controlado o externo con su propio conector.
- El volumen es bajo/moderado.
- Se acepta mantenimiento manual y recuperación no instantánea.

### Opción B — Kubernetes/Helm

Usar solo si hay:

- Múltiples conectores o tenants.
- Alta disponibilidad requerida.
- GitOps/Helm exigido por cliente.
- Necesidad de NetworkPolicies, external-secrets, cert-manager y Velero.
- Escalado independiente de API, workers, EDC CP y DP.

### Zonas de red piloto

- **DMZ pública:** UI/API autenticada, EDC DSP protocol, Data Plane public endpoint si aplica.
- **Aplicación privada:** DataSafe API, workers, EDC management, EDC CP↔DP control.
- **Datos privada:** PostgreSQL, MinIO/S3 private endpoint, backups.
- **Operación:** Prometheus, Grafana, Loki/Promtail o equivalente, bastion/VPN/SSO.
- **Secrets:** Vault/Infisical/Doppler/1Password Connect/cloud secrets.

### Servicios piloto

- DataSafe:
  - `datasafe-web`.
  - `datasafe-api`.
  - `datasafe-worker` para manifests, checksums, packaging de export, expiración y sincronización EDC.
  - PostgreSQL propio o base separada.
  - Object storage privado.
- EDC:
  - `edc-provider-control-plane`.
  - `edc-provider-data-plane`.
  - `edc-consumer-control-plane` solo si DataSafe también consume datos.
  - `edc-consumer-data-plane` solo si hay consumo real o test externo persistente.
  - `identityhub` si se requieren DID/VC.
  - `federated-catalog` si hay varios providers.
- Plataforma:
  - Prometheus, Grafana, Loki/Promtail o Vector.
  - Alertmanager o alertas Grafana.
  - Backup runner si no hay servicio gestionado.
  - Secret manager.
  - Reverse proxy/ingress con TLS.

### Puertos piloto

- Públicos únicamente por HTTPS `443`:
  - UI/API.
  - DSP protocol.
  - Data Plane public endpoint si aplica.
- Privados:
  - PostgreSQL `5432`.
  - MinIO/S3 private endpoint.
  - EDC management API.
  - EDC control API CP↔DP.
  - Prometheus, Loki y exporters.
  - Vault/secret manager.

### Secrets piloto

- Un secret por propósito; nada compartido entre servicios.
- Separar `dev`, `demo` y `pilot`.
- PostgreSQL: password por usuario/base y credenciales de backup separadas.
- MinIO/S3: access key por servicio, policies por bucket/prefix y cifrado si aplica.
- EDC: management tokens, datasource credentials, object storage credentials y claves/JWK/DID si aplica.
- DataSafe API: signing key JWT/sesión, OIDC client secret si aplica, encryption key para campos sensibles.
- Observabilidad: credenciales Grafana y tokens de alertas.
- Backups: credenciales de destino y passphrase si se cifran dumps.

### Vault o alternativa

- Local/dev: `.env.local` o Vault dev solo para aprendizaje.
- Demo: Coolify secrets o SOPS/age.
- Piloto pequeño: Infisical, Doppler, 1Password Connect, cloud secrets o SOPS+age suelen ser más simples.
- Piloto exigente: Vault con storage persistente, políticas por servicio, auditoría, backup y runbook de unseal.
- Vault HA: diferir hasta operación 24/7 o requisito corporativo.

## 6. Observabilidad

### Métricas

- Habilitar Micrometer en EDC CP/DP cuando se incluya la extensión correspondiente.
- Prometheus debe scrapear:
  - EDC Control Plane.
  - EDC Data Plane.
  - DataSafe API/backend.
  - PostgreSQL exporter.
  - MinIO exporter.
  - Node/cAdvisor si se opera VM.
- Dashboards mínimos:
  - Latencia y errores HTTP.
  - Contract negotiations por estado.
  - Transfer processes por estado.
  - Bytes transferidos.
  - Errores de policy/contract.
  - Salud PostgreSQL/storage.

### Logs

- JSON logs en servicios propios.
- Correlation ID por request y, si es posible, por negotiation/transfer.
- Retención:
  - Demo: 7-14 días.
  - Piloto: 30-90 días según acuerdo.
- No registrar tokens, URLs prefirmadas completas, credenciales ni payloads industriales.

### Alertas mínimas

- Servicio caído.
- Error rate alto.
- Backup fallido.
- Disco > 80%.
- PostgreSQL sin espacio/conexiones agotadas.
- MinIO/S3 inaccesible.
- Transfer failures repetidos.
- Certificado TLS próximo a expirar.

## 7. Backups y recuperación

### PostgreSQL

- Demo: dump diario, 7-14 días, restore manual probado.
- Piloto: dump diario + WAL/PITR si el RPO lo exige, cifrado y test de restore mensual o antes de hitos.

### MinIO/S3

- Versioning en buckets críticos.
- Lifecycle para artefactos temporales.
- Mirror/replicación si los datos no se pueden regenerar.
- Checksums en manifests para validar transferencias.

### Restore runbook

Orden recomendado:

1. Restaurar PostgreSQL.
2. Restaurar object storage.
3. Levantar EDC CP/DP.
4. Levantar DataSafe API/workers.
5. Ejecutar smoke tests de catálogo, contrato y transferencia sintética.

## 8. Integración DataSafe ↔ EDC

### Publicación

1. DataSafe registra Data Product interno.
2. Worker genera manifest con esquema, metadatos, checksum, tamaño, periodo, licencia y restricciones.
3. Responsable aprueba visibilidad dataspace.
4. Worker crea/actualiza en EDC: asset, policy definition y contract definition.
5. EDC expone catálogo DSP con metadatos no sensibles.

### Negociación

1. Consumer consulta catálogo.
2. Consumer inicia contract negotiation.
3. EDC valida oferta/policy.
4. DataSafe registra estado y bloquea export si requiere aprobación humana.
5. Aprobación humana habilita artefacto exportable.

### Transferencia

1. DataSafe crea paquete aprobado en bucket/prefix controlado.
2. Se registra checksum, destinatario y vencimiento.
3. EDC Data Plane transfiere o habilita acceso temporal controlado.
4. Auditoría registra resultado, bytes, checksum y expiry.
5. Worker expira/revoca artefactos temporales.

## 9. Kubernetes/Helm opcional

Si se adopta Kubernetes:

- Namespaces sugeridos:
  - `datasafe-app` para web/API/workers.
  - `datasafe-edc` para CP/DP/IdentityHub.
  - `datasafe-data` solo si PostgreSQL/MinIO no son gestionados.
  - `observability` para Prometheus/Grafana/Loki.
  - `security` para external-secrets/vault-agent.
- Componentes:
  - Ingress controller.
  - cert-manager.
  - External Secrets Operator.
  - NetworkPolicies.
  - PodDisruptionBudgets.
  - Resource requests/limits.
  - Helm values por entorno.
  - Velero si se respaldan recursos/volúmenes del cluster.

No usar Kubernetes solo por apariencia enterprise; para primer piloto bilateral suele añadir complejidad prematura.

## 10. Qué NO desplegar hasta que haga falta

- EDC productivo mientras solo exista landing.
- Federated Catalog para un piloto bilateral.
- IdentityHub completo sin requisito DID/VC.
- Vault HA sin equipo y runbooks de operación.
- Kubernetes si VM/Coolify endurecido cubre el piloto.
- Service mesh.
- Kafka/event streaming.
- SIEM enterprise.
- Multi-region.
- Data planes por tenant.
- Catálogo público abierto.
- Transferencias automáticas sin aprobación humana.
- URLs S3/MinIO directas en catálogo o contratos.
- Datos reales sensibles en demo comercial.

## 11. Próximos entregables

Para Fase 1:

- Compose local con provider/consumer/postgres/minio.
- `.env.example` sin valores reales.
- Scripts de seed para buckets, asset, policy, contract, catálogo, negociación y transferencia.
- README operativo local.
- Smoke test automatizado.

Para Fase 2:

- Dominios demo para UI/API, DSP provider y data plane si aplica.
- Plantillas Coolify por servicio.
- Política de exposición de puertos.
- Backups demo.
- Dashboard Grafana mínimo.
- Runbook de demo.

Para Fase 3:

- Alcance del piloto: participantes, datasets, clasificación, RPO/RTO, retención y aprobadores.
- Threat model ligero.
- Matriz de secrets y permisos.
- Runbooks de deploy, rollback, backup/restore, rotación de secretos e incidente de exposición accidental.
- Prueba de restore antes de abrir a terceros.
