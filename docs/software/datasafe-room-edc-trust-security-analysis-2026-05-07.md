---
title: DataSafe Room + EDC — análisis identidad, trust y seguridad
project: datasafe-room
status: internal-security-analysis
updated: 2026-05-07
owner: Aegis / Black Tower Consulting
---

# DataSafe Room — análisis Aegis de identidad, trust, seguridad y compliance para EDC/IdentityHub/DCP

## 0. Veredicto ejecutivo

La propuesta puede evolucionar hacia una DataSafe Room **DSP-ready** usando Eclipse Dataspace Components (EDC), pero debe separarse claramente entre:

- **Identidad humana y operación interna:** Keycloak/Entra/OIDC, MFA, RBAC/ABAC, API interna y workflows.
- **Identidad de participante/conector en dataspace:** DID Web, W3C Verifiable Credentials, IdentityHub, DCP y políticas evaluadas por EDC.
- **Autorización de datos y outputs:** contratos/policies EDC + enforcement propio de sala + output review; EDC no sustituye el control de salida ni el cumplimiento legal.

Recomendación: construir el piloto con EDC **acotado**: catálogo, contract negotiation y transferencia controlada para 1 caso/1 sala/2–3 organizaciones, sin prometer certificación, Gaia-X compliance, GDPR/Data Act/NIS2 compliance automático ni seguridad absoluta.

## 1. Modelo objetivo de componentes

### Componentes EDC/Dataspace

- **EDC Control Plane por participante**: catálogo, contract offers, contract negotiation, transfer process, policy evaluation.
- **EDC Data Plane por participante o gestionado por la sala**: emisión de Endpoint Data References (EDR), acceso temporal a datos/artefactos, proxy/control de transferencias.
- **DSP endpoint público**: único endpoint interoperable expuesto a otros conectores. Debe ir por TLS y no revelar hosts internos.
- **IdentityHub**: wallet/servicio de identidad de participante para presentar credenciales verificables vía DCP.
- **IssuerService**: emite VCs de pertenencia/roles/capacidades bajo aprobación de onboarding.
- **DID Web**: identificador resoluble por HTTPS para cada participante/conector/issuer, con claves públicas y servicios mínimos.
- **Vault/KMS/HSM**: custodia de claves de firma, secretos EDC, claves OIDC, credenciales de storage y certificados.

### Componentes DataSafe Room no sustituidos por EDC

- **Keycloak/OIDC** para usuarios humanos, operadores, approvers y UI interna.
- **Room API / Policy service** para autorización por sala, propósito, contrato, clasificación y salida.
- **Workspace controlado** para compute-to-data, con egress restringido.
- **Output gate** con DLP/checks + revisión humana.
- **Audit/lineage service** independiente, exportable a SIEM.
- **API Management/WAF** para UI/API públicas y rate limiting; las APIs de management de EDC nunca deben exponerse a internet.

## 2. Perfil de trust por fases

### Fase 0 — Diagnóstico/demo sintética

- **Objetivo:** narrativa, mock o demo con datos sintéticos/anonimizados aprobados.
- **Identidad:** Keycloak/OIDC local o gestionado; MFA para admins si hay acceso externo.
- **Trust dataspace:** no hay confianza federada real. DID/VC/DCP pueden aparecer como modelo documental o mock.
- **EDC:** opcional en sandbox; no vender interoperabilidad productiva.
- **Controles mínimos:** no datos reales sensibles, no endpoints productivos, no credenciales reales en demo, audit básico de acciones demo.
- **Lenguaje seguro:** “preparado para mapear a EDC/DSP”; no “compliant” ni “certificado”.

### Fase 1 — MVP operativo controlado, EDC-ready

- **Objetivo:** 1 sala, 2–3 participantes, datasets exportados, control de acceso y salidas.
- **Identidad humana:** Keycloak/Entra/OIDC con MFA, roles por sala y organización.
- **Trust técnico:** registro manual de participantes y dominios; DID Web por organización/conector si se activa EDC.
- **VCs:** credenciales cortas y explícitas: `DataSafeParticipantCredential`, `RoomMembershipCredential`, `DataProviderRole`, `DataConsumerRole`. Evitar PII innecesaria en VCs.
- **IdentityHub/IssuerService:** puede operar gestionado por DataSafe Room para simplificar el piloto; emisión manual aprobada por onboarding.
- **EDC:** catálogo/asset/policy/contract/transfer para un flujo limitado; management API privada.
- **Autorización:** RBAC/ABAC propio + políticas EDC. La UI no decide; todo server-side.
- **Data plane:** EDR de corta duración; endpoints públicos controlados por gateway; no raw export por defecto.
- **Audit:** eventos de identidad, contrato, policy decision, transferencia, EDR emitido/usado/revocado y output review.

### Fase 2 — Piloto DSP-ready con DCP real

- **Objetivo:** interoperar con conectores externos usando DSP/DCP en un caso acotado.
- **Trust framework:** reglas de admisión documentadas: dominios DID, issuer aceptado, schemas VC aceptados, expiración, revocación, evidencias de onboarding.
- **DID Web:** cada participante hospeda su DID document en dominio controlado; TLS válido; claves rotables; sin endpoints internos en documentos.
- **DCP:** presentación de VCs en interacciones DSP; decisión de acceso basada en credenciales, policy y contrato.
- **IssuerService:** emite credenciales firmadas; operación separada de administración ordinaria; logs de emisión/revocación.
- **IdentityHub:** custodia credenciales de participante; acceso administrativo segregado; backup cifrado; rotación y revocación probadas.
- **EDC policies:** ODRL-compatible; constraints por purpose, room, participant, role, agreement, expiry, asset sensitivity y output restrictions.
- **EDR/data plane tokens:** TTL corto, audiencia/asset/contract/transfer-bound, no loggable, revocables, rate-limited.
- **Observabilidad:** SIEM para IdP, EDC control plane, data plane, API gateway, Vault/KMS, storage y workspace.

### Fase 3 — Federación/producción controlada

- **Objetivo:** múltiples salas/participantes, conectores externos recurrentes, controles operativos maduros.
- **Trust distribuido:** posibilidad de issuer externo o trust anchor; proceso formal de onboarding/offboarding; review periódico de participantes y credenciales.
- **Claves:** HSM/KMS gestionado, separación de claves de firma DID/VC, TLS, data-plane token signing y cifrado storage.
- **Seguridad:** pentest, hardening Kubernetes/service mesh, WORM/hash-chain para auditoría crítica si el requisito lo exige, DR probado.
- **Compliance:** evidencias para revisión legal/auditoría; no afirmar cumplimiento normativo sin evaluación externa y alcance explícito.

## 3. Decisiones de identidad y autorización

### Keycloak/OIDC

Usar Keycloak/OIDC para:

- Login de usuarios humanos en UI/API de DataSafe Room.
- MFA, grupos/roles, sesiones, refresh tokens y revocación.
- SSO empresarial por organización si se integra con Entra/IdP externo.
- Claims mínimos: `sub`, `org_id`, `room_id`, `roles`, `mfa`, `acr/amr`, `purpose_id`, `agreement_id`, `exp`, `aud`.

No usar Keycloak como único mecanismo para:

- Trust federado entre conectores EDC.
- Autorización de acceso a assets EDC sin validar contrato/policy.
- Sustituir VCs/DCP cuando el requisito sea DSP-ready.

### DID Web

Controles mínimos:

- DID por participante/conector/issuer: `did:web:<dominio-controlado>`.
- DID document servido solo por HTTPS con TLS válido.
- Claves públicas rotables; procedimientos de rotación y compromiso.
- No publicar URLs internas, nombres de pods, IPs privadas, puertos de administración ni endpoints no públicos.
- DNS ownership y protección frente a takeover de subdominios.
- Separar DID de demo/sandbox/prod.

### W3C Verifiable Credentials

VCs recomendadas para piloto:

- **Participant credential:** organización admitida en el dataspace/sala.
- **Connector credential:** conector autorizado, environment y dominio.
- **Role/membership credential:** provider/consumer/approver por sala.
- **Capability credential:** permisos de alto nivel, por ejemplo publicar catálogo o consumir un asset class.

Controles:

- Expiración corta o media según riesgo; no credenciales perpetuas.
- Revocación/status list definida antes de datos reales.
- Claims mínimos; evitar datos personales si no son necesarios.
- Issuer allowlist por entorno.
- Validación de schema, issuer, signature, status, expiry y audience.

### DCP

DCP debe ser el mecanismo de presentación/verificación de credenciales entre conectores/IdentityHub cuando se active DSP real. Reglas:

- Fallar cerrado si no se puede verificar VC/DID/status.
- No aceptar credenciales de issuers no registrados.
- Vincular presentación DCP a contexto: conector, participante, operación, asset/policy y ventana temporal.
- Registrar decisión DCP sin almacenar secretos/tokens completos.

## 4. Seguridad de EDC Control Plane y APIs

- **Management API de EDC:** solo red privada/VPN/bastion; nunca internet; protegida con auth fuerte y allowlist.
- **DSP API:** pública solo si se requiere interoperabilidad; detrás de gateway/WAF/LB con TLS, rate limit y logs.
- **Control Plane callbacks:** configurar URLs públicas explícitas; validar que no se emiten URLs internas en mensajes DSP.
- **Policy enforcement:** cada oferta/contrato/transferencia debe evaluar participant credential + room/purpose/agreement + asset sensitivity + expiry.
- **Admin separation:** operadores de plataforma no deben poder aprobar su propio acceso a datos ni salidas.
- **CORS/CSRF:** deny-by-default; cookies seguras si UI usa sesiones; tokens `aud` y `iss` verificados.
- **Errores:** no devolver stack traces, hostnames internos, IDs de infraestructura o rutas de storage.

## 5. Seguridad de Data Plane, EDR y tokens

Amenaza principal: el EDR o token de data plane se convierte en “llave de descarga”. Por tanto:

- EDR solo tras contract agreement válido y policy positiva.
- Endpoint del EDR debe ser URL pública controlada/gateway, nunca URL interna de storage, pod, service mesh o DB.
- Token/authorization en EDR con TTL corto, `aud` específico, `asset_id`, `contract_agreement_id`, `transfer_process_id`, `participant_id` y scope mínimo.
- No loggear EDR completo, access tokens, auth codes, presigned URLs ni headers `Authorization`.
- Revocación de EDR/token al suspender contrato, cerrar sala, revocar usuario/participante o detectar incidente.
- Rate limit y cuotas por agreement/participant/asset.
- Preferir streaming/proxy controlado frente a presigned URLs directas si hay datos sensibles.
- Storage privado; acceso desde data plane con credenciales workload de mínimo privilegio.
- Firmar/hashear transferencias y registrar `hash_ref`, bytes, tiempo, consumidor y contrato.

## 6. Gestión de secretos, claves y certificados

### Secretos que deben estar en Vault/Secret Manager

- Private keys DID/VC/JWT signing.
- Client secrets OIDC.
- Credenciales DB/storage.
- Certificados mTLS/TLS privados.
- API Management keys.
- Webhook secrets.
- Tokens de CI/CD y registry.

### Controles mínimos

- Secretos fuera de repositorio, imágenes y logs.
- Separación por entorno: demo/sandbox/piloto/prod.
- Rotación documentada y probada para API keys, OIDC secrets, certs y signing keys.
- Acceso a secretos auditado; alertas por lecturas anómalas.
- Claves de firma de issuer/DID protegidas con KMS/HSM o Vault transit en fases avanzadas.
- No compartir claves entre issuer, IdentityHub, EDC control plane y data plane si pueden separarse.
- Break-glass con MFA, tiempo limitado y revisión posterior.

## 7. TLS, mTLS y red

- TLS 1.2+ mínimo, preferir TLS 1.3, HSTS en UI pública.
- mTLS interno para comunicación entre EDC control plane, data plane, IdentityHub, IssuerService y servicios críticos, o service mesh equivalente.
- Certificados por entorno y servicio; rotación automatizada.
- Network policies deny-by-default.
- Workspaces sin internet por defecto; egress allowlist explícita.
- DB/storage/management APIs en subred privada.
- Bloquear metadata services desde workloads no privilegiados.

## 8. API Management key

Si se usa API Management key:

- Solo para server-to-server, integraciones técnicas o bootstrap controlado; no como identidad de usuario final.
- Scope por endpoint/cliente/entorno; TTL/rotación; rate limit; IP allowlist si aplica.
- Almacenada en Vault; nunca en frontend, notebooks, documentación o logs.
- Complementarla con OIDC/mTLS/DCP según flujo; una API key no demuestra autorización contractual ni pertenencia al dataspace.

## 9. Amenazas principales

- **Suplantación de participante/conector:** DID mal controlado, DNS takeover, issuer falso, VC no verificada.
- **Credenciales obsoletas o revocadas:** VCs sin expiry/status, usuario dado de baja con token activo.
- **Confusión de tokens:** aceptar token OIDC humano como prueba de conector EDC o viceversa.
- **Fuga de EDR/token:** logs, navegador, notebooks, tickets, SIEM sin redacción.
- **Reutilización/replay de EDR:** token largo o no bound a asset/agreement/audience.
- **Bypass del data plane:** acceso directo a bucket/DB/presigned URL sin policy enforcement.
- **Leakage de URLs internas:** Catálogo, contract negotiation, EDR, errores, redirects o DID document exponiendo hostnames internos.
- **BOLA/IDOR multi-organización:** Org A accede a sala, contrato o output de Org B.
- **Exfiltración por salida aprobada o notebook:** agregaciones pequeñas, URLs internas, secretos, PII o datos crudos en outputs.
- **Admin abuse:** operador lee datos o emite credenciales/contratos sin aprobación.
- **Supply chain:** imágenes EDC/IdentityHub/servicios con CVEs o dependencias comprometidas.
- **Misconfiguración cloud/Kubernetes:** bucket público, management API abierta, secrets en variables visibles.
- **Auditoría incompleta o alterable:** no poder reconstruir quién accedió a qué, bajo qué contrato y qué salió.

## 10. Controles mínimos para piloto con datos reales

- Keycloak/OIDC con MFA para admins y usuarios externos; sesiones revocables.
- Management APIs privadas; DSP/Data Plane públicos solo donde sea necesario.
- DID Web validado por dominio y entorno; sin endpoints internos.
- IssuerService con emisión aprobada y auditada; VCs con expiry/status/revocation.
- IdentityHub con acceso administrativo segregado y backup cifrado.
- Vault/Secret Manager obligatorio; secret scanning en CI.
- TLS externo y mTLS interno/service mesh para servicios críticos.
- Policies EDC + autorización propia por sala/propósito/acuerdo/sensibilidad.
- EDR/tokens cortos, mínimos, revocables y no loggeados.
- Output gate obligatorio; raw export denegado por defecto.
- Audit log de eventos funcionales y técnicos; export a SIEM si hay datos sensibles.
- Tests negativos multi-tenant, BOLA, token replay, leakage de URLs internas y revocación.

## 11. Decisiones abiertas

- **Topología EDC:** conector por participante, conector gestionado por DataSafe Room, o híbrido.
- **Gobernanza de issuer:** issuer único gestionado por DataSafe Room vs issuer por participante/trust anchor externo.
- **DID domains:** dominios propios de cada participante o subdominios gestionados para el piloto.
- **IdentityHub hosting:** gestionado centralmente en piloto o desplegado por cada participante.
- **Revocación VC:** mecanismo exacto de status list/revocation y frecuencia de comprobación.
- **Policy model:** alcance de ODRL/EDC policy vs policy service propio; fuente de verdad de contratos.
- **Data transfer mode:** proxy/streaming, provider-push, consumer-pull, presigned URL controlada o no transfer/compute-only.
- **API Gateway:** producto elegido y patrón para DSP/data plane/UI; reglas de redacción de logs.
- **Key custody:** Vault software, cloud KMS, HSM; separación de duties para signing keys.
- **Nivel de audit immutability:** hash-chain diario, WORM/Object Lock, SIEM, retención por contrato.
- **Workspace scope:** solo preview/SQL/jobs predefinidos o notebooks; si notebooks, aislamiento y egress probado.

## 12. QA/security gates para piloto

### Gate A — Trust onboarding

Pasa si:

- Participantes, dominios, DIDs, issuer y roles aprobados.
- DID documents no contienen URLs internas ni endpoints administrativos.
- VCs de prueba validan schema, issuer, firma, expiry, status y audience.
- Revocación de VC probada y auditada.

No pasa si hay DID de dominio no controlado, VC sin expiración/revocación o issuer no aprobado.

### Gate B — Identity/AuthN/AuthZ

Pasa si:

- MFA activo para admins/externos o excepción documentada.
- Claims OIDC verificados por `iss`, `aud`, `exp` y `mfa/acr`.
- Tests negativos: Org A no accede a sala/catalog/contract/output de Org B.
- EDC contract negotiation falla sin credencial DCP válida.

No pasa si la UI/frontend puede elevar permisos o si un token humano permite acceso de conector.

### Gate C — EDC exposure and URL hygiene

Pasa si:

- Management API solo privada.
- DSP/Data Plane detrás de TLS/gateway con rate limit.
- Catalog, contract offers, transfer responses, EDR, errores y redirects no exponen hostnames internos, IPs privadas, nombres de pods, buckets internos ni puertos de admin.
- Logs del gateway redaccionan `Authorization`, EDR, tokens y presigned URLs.

No pasa si aparece cualquier URL interna en respuestas externas o audit packs entregables.

### Gate D — EDR/data plane

Pasa si:

- EDR se emite solo con agreement válido.
- Token TTL corto, bound a asset/agreement/transfer/audience.
- Revocación de contrato invalida nuevos accesos y bloquea EDR activo según ventana definida.
- Storage no es accesible directamente desde internet.
- Prueba de replay/uso fuera de scope falla.

No pasa si una URL/token permite descarga fuera de contrato, usuario, sala o ventana.

### Gate E — Secrets/keys

Pasa si:

- Secret scan limpio.
- Secrets en Vault/Secret Manager.
- Rotación probada para al menos una API key y un certificado no productivo.
- Acceso a signing keys auditado.

No pasa si hay secretos en repo, imágenes, variables expuestas, notebooks o logs.

### Gate F — Output and compliance evidence

Pasa si:

- Output review probado con caso permitido y caso bloqueado.
- DLP/checklist detecta PII/secrets/URLs internas al menos en fixtures.
- Audit pack reconstruye: participante, credential/policy/agreement, dataset, transfer, workspace/job, output y aprobación.
- Se documenta riesgo residual y límites legales.

No pasa si se promete cumplimiento/certificación o si raw export queda habilitado por defecto.

## 13. Lenguaje de compliance recomendado

Usar:

- “DSP-ready en piloto acotado usando EDC/DCP/VC cuando se activen conectores externos.”
- “Evidencias técnicas y operativas para revisión legal/compliance.”
- “Controles de acceso, trazabilidad definida y reglas de salida verificables.”
- “Alineado/mapeable a conceptos DSSC/IDSA/EDC según alcance.”

Evitar:

- “Cumple GDPR/Data Act/NIS2/CSRD/Gaia-X.”
- “Certificado PCF/Gaia-X/IDSA.”
- “Seguridad garantizada” o “sin riesgo de fuga.”
- “Anonimización irreversible” sin análisis experto.
- “EDC resuelve el compliance.”

## 14. Recomendación final

Para el piloto, adoptar EDC sin sobredimensionar: **EDC Control Plane + Data Plane + IdentityHub + IssuerService + DID Web + VCs + DCP**, pero bajo una trust policy cerrada y manualmente gobernada. Mantener Keycloak/OIDC como identidad humana y los controles propios de DataSafe Room para sala, outputs, auditoría y retención. El éxito del piloto debe medirse por interoperabilidad DSP acotada, ausencia de fugas de URLs internas/secretos, revocación efectiva, trazabilidad reconstruible y output gate probado, no por claims legales o certificaciones.
