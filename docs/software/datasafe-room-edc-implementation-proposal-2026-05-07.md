---
title: DataSafe Room — Propuesta de implementación con Eclipse Dataspace Components
project: datasafe-room
status: internal-proposal
updated: 2026-05-07
owner: Black Tower Consulting / Ventura
scope: arquitectura backend propuesta usando EDC/XID sin sobrecargar MVP
---

# DataSafe Room — Propuesta de implementación con Eclipse Dataspace Components

## 0. Decisión ejecutiva

Ventura pide usar “XID”; para esta propuesta se interpreta como **Eclipse Dataspace Components / Eclipse Dataspace Connector (EDC)** y su ecosistema.

La recomendación es **no reescribir DataSafe Room como un EDC puro desde P0/P1**. EDC es una caja de herramientas para construir componentes de dataspace, no una aplicación lista para el caso de negocio DataSafe. DataSafe debe mantener un **core de producto** propio —rooms, evidencias, políticas humanas, aprobación y export pack— y añadir EDC como **capa de interoperabilidad progresiva**.

Principio recomendado:

- **P0/P1:** DataSafe Core + modelo EDC/DSP shadow. Sin runtime EDC en producción MVP.
- **P2:** EDC Connector sidecar en sandbox/piloto privado, con Control Plane + Data Plane custom para export packs aprobados.
- **P3:** IdentityHub/DCP, Issuer Service, Federated Catalog y extensiones cloud/Tractus-X solo si hay contraparte real y caso comercial validado.

No se debe prometer certificación IDSA, Catena-X, Gaia-X ni federación completa hasta validar TCK/conformance, threat model, operación y contraparte real.

## 1. Arquitectura recomendada

### 1.1 Vista lógica

```text
Usuarios / Organizaciones
  -> Frontend DataSafe
  -> DataSafe API monolito modular
      - Room Service
      - Data Product Registry
      - Asset and Evidence Service
      - Policy and Agreement Service
      - Output Request Service
      - Approval Service
      - Audit Service
      - Export Builder Worker
      - Dataspace Interop Adapter
      - EDC Sync Worker / EDC Bridge
  -> PostgreSQL
  -> MinIO/S3 privado

Opcional P2/P3:
External Dataspace Participant / EDC Connector
  <-> DSP 2024-1 HTTPS
  <-> DataSafe EDC Connector Runtime
        - EDC Control Plane
        - EDC Management API
        - EDC Policy Engine extensions
        - EDC Data Plane Framework custom/export-pack data plane
        - optional IdentityHub/DCP
        - optional Federated Catalog node/cache
  <-> DataSafe API / Policy Engine / Export Pack Service
  <-> MinIO/S3 privado
```

### 1.2 Decisión de despliegue

- **DataSafe Core** es la fuente de verdad de negocio: quién puede pedir datos, quién aprueba, qué se exporta, qué evidencias quedan.
- **EDC Connector** es una frontera de interoperabilidad: publica ofertas, negocia contratos DSP y coordina transferencias, pero **no decide saltarse approval**.
- **Data Plane** nunca entrega objetos crudos del bucket. Solo entrega export packs aprobados o streams controlados por DataSafe.
- **Control Plane y Data Plane** deben desplegarse separados en P2. EDC permite colocalizar, pero no es lo recomendable si se quiere aislar transferencia, escalado y blast radius.
- **Management API** no se expone a Internet. Solo la usa el `EDC Sync Worker` desde red privada.
- **Protocol/DSP API** se expone solo en sandbox/piloto con allowlist, mTLS/OAuth2/DCP según fase.

### 1.3 DataSafe Core vs EDC

- **DataSafe Core mantiene:**
  - Rooms, organizaciones, miembros y roles.
  - Data products, versiones, campos, clasificación y evidencias.
  - Política UX-friendly, approval workflows y acuerdos humanos/legales.
  - Output requests, export contracts, export packs, audit packs.
  - Storage privado en MinIO/S3 y generación de ZIP/PDF/CSV.
  - Audit log de producto y evidencia de aprobación.

- **EDC aporta progresivamente:**
  - Catálogo DSP/DCAT de assets publicables.
  - Contract negotiation DSP entre participantes.
  - Contract agreements con políticas ODRL.
  - Transfer process controlado.
  - Policy Engine extensible con policy functions.
  - Data Plane Framework para transferencias HTTP/S3/Blob/custom.
  - IdentityHub/DCP para identidad organizacional y credenciales verificables.
  - Issuer Service para emisión/revocación de credenciales si se opera un ecosistema.
  - Federated Catalog para crawling/cache de catálogos si existe red de participantes.

## 2. Componentes EDC y uso recomendado

### 2.1 EDC Connector

Uso recomendado:

- Construir una **distribución custom DataSafe EDC Connector** en Java/Gradle, no depender de un binario genérico.
- Arrancar primero un conector **provider-side** para publicar ofertas de DataSafe.
- Añadir modo **consumer-side** solo si DataSafe necesita consumir catálogos/activos externos.
- Mantener un único conector por deployment DataSafe en P2; no crear un conector por room ni por organización en MVP.

Extensiones DataSafe necesarias:

- `datasafe-edc-asset-sync`: sincroniza assets desde DataSafe hacia EDC.
- `datasafe-edc-policy-functions`: funciones de política para purpose, room, clasificación, destinatario, expiración y export contract.
- `datasafe-edc-dataaddress-resolver`: traduce un asset EDC a endpoint DataSafe/export pack sin revelar bucket/key.
- `datasafe-edc-events`: consume eventos de negociación/transferencia para actualizar `OutputRequest`, `ExportContract` y `AuditEvent`.
- `datasafe-edc-auth`: integración con red privada, tokens de servicio, mTLS u OAuth2 según deployment.

### 2.2 Control Plane

Responsabilidad en DataSafe:

- Gestionar `Asset`, `PolicyDefinition`, `ContractDefinition`, `ContractNegotiation`, `ContractAgreement` y `TransferProcess` desde EDC.
- Publicar catálogo de ofertas solo para assets que DataSafe marque como `interop_enabled` y `published`.
- Delegar o comprobar decisiones sensibles contra DataSafe Policy Engine.

APIs EDC a usar desde `EDC Sync Worker`:

- `POST /management/v3/assets` — crear/actualizar asset EDC desde `DataProductVersion` o `ExportContract` publicable.
- `DELETE /management/v3/assets/{id}` — retirar asset si se revoca o despublica.
- `POST /management/v3/policydefinitions` — publicar política ODRL generada por DataSafe.
- `POST /management/v3/contractdefinitions` — vincular assets seleccionados con access policy y contract policy.
- `POST /management/v3/catalog/request` — consultar catálogo remoto en modo consumer/sandbox.
- `POST /management/v3/contractnegotiations` — iniciar negociación saliente si DataSafe consume assets de otro participante.
- `GET /management/v3/contractnegotiations/{id}` — leer estado de negociación.
- `POST /management/v3/transferprocesses` — iniciar transferencia sobre un `ContractAgreement`.
- `GET /management/v3/transferprocesses/{id}` — leer estado de transferencia.

Nota: confirmar nombres exactos de path y payload contra la versión EDC fijada antes de implementación; la propuesta asume la familia Management API v3.

### 2.3 Data Plane Framework

Uso recomendado:

- Implementar un **DataSafe Export Pack Data Plane** con EDC Data Plane Framework.
- Soportar primero **Consumer Pull sobre HTTPS**.
- El Data Plane recibe instrucciones del Control Plane vía Data Plane Signaling y resuelve el artefacto aprobado llamando a DataSafe.
- El Data Plane puede:
  - Hacer streaming del ZIP desde MinIO usando credenciales internas.
  - O generar una URL firmada de corta duración y devolverla como endpoint controlado.

Tipos de transferencia recomendados:

- P2 inicial: `HttpData` / `DataSafeExportPack` con pull HTTPS.
- P2/P3 si AWS real: S3 data plane o S3 copy extension validada contra bucket AWS.
- P2/P3 si Azure real: Azure Blob Storage data plane.
- No usar Kafka/streaming en MVP: el producto es controlled export, no streaming operacional.

Reglas de seguridad:

- El Data Plane no conoce reglas de negocio completas; consulta DataSafe Policy Engine antes de entregar.
- No debe exponer `minio://bucket/key`, credenciales S3, rutas internas ni URLs de larga duración.
- TTL recomendado para URLs firmadas: 5–15 minutos.
- Registrar `transfer.started`, `transfer.completed`, `transfer.failed`, `artifact.downloaded` en Audit Service.

### 2.4 Policy Engine

Uso recomendado:

- **P0/P1:** el enforcement principal sigue siendo DataSafe Policy Engine interno, con proyección ODRL limitada.
- **P2:** EDC Policy Engine evalúa políticas ODRL en catálogo/negociación/transferencia y llama a funciones DataSafe para constraints de negocio.
- **P3:** ampliar policy functions o integrar un PDP especializado solo si las políticas son más complejas.

Policy functions DataSafe mínimas:

- `datasafe.purpose.eq`: finalidad de uso coincide con room/agreement.
- `datasafe.room.allowed`: participante autorizado en la room.
- `datasafe.organization.eq`: destinatario coincide con organización aprobada.
- `datasafe.classification.max`: clasificación permitida para export.
- `datasafe.field.allowed_export`: no incluye campos bloqueados.
- `datasafe.export_contract.valid`: existe `ExportContract` aprobado, vigente y no revocado.
- `datasafe.expiry.before`: contrato/transferencia dentro de ventana temporal.
- `datasafe.download.count.lt`: límite de descargas no excedido.

Scope de políticas:

- **Access policy:** determina si un asset aparece en catálogo para un participante.
- **Contract policy:** determina si se puede negociar/firmar un acuerdo.
- **Transfer policy:** determina si se puede iniciar/continuar la transferencia del export pack.

### 2.5 DSP Protocol 2024-1

Uso recomendado:

- Target obligatorio: **IDSA/Eclipse Dataspace Protocol 2024-1**, validado antes de exposición pública.
- P1 conserva `/.well-known/dspace-version` detrás de feature flag y reporta `partial-profile-controlled-export`.
- P2 deja que EDC gestione los endpoints DSP entre conectores.
- DataSafe no debe mantener una façade DSP propia si EDC ya cubre el caso; solo conservar adaptadores internos y snapshots para export pack.

Flujos DSP alineados:

- **Catalog:** EDC expone DataSafe Data Products como ofertas DCAT/ODRL.
- **Contract Negotiation:** una negociación entrante se mapea a `OutputRequest` y dispara approval humano si aplica.
- **Contract Agreement:** un acuerdo DSP se mapea a `ExportContract` aprobado, versionado y auditado.
- **Transfer Process:** una transferencia se mapea a descarga de export pack aprobado sobre HTTPS.

### 2.6 Management API

Uso recomendado:

- Crear un módulo `edc_bridge` dentro de DataSafe API y un worker `edc_sync_worker`.
- El worker publica/actualiza/revoca entidades en EDC usando la Management API.
- La Management API queda en red privada, con auth fuerte de servicio y sin acceso de usuarios finales.

Responsabilidades del bridge:

- Materializar assets EDC desde `DataProductVersion` y/o `ExportContract`.
- Publicar `PolicyDefinition` desde `odrl_jsonld_snapshot`.
- Publicar `ContractDefinition` solo cuando room/product/policy esté listo.
- Sincronizar estados de negociación y transferencia.
- Reintentos idempotentes, outbox pattern y auditoría de errores.

### 2.7 Federated Catalog

Uso recomendado:

- **No P0/P1.** Un catálogo federado sin red de participantes reales no valida el MVP.
- **P2 opcional:** Federated Catalog Cache con allowlist de 1–2 conectores de prueba.
- **P3:** Federated Catalog Node/Cache si DataSafe entra en un dataspace con crawling y búsqueda entre organizaciones.

Regla de exposición:

- Catálogo global público prohibido en MVP.
- Catálogo siempre room-scoped o participant-scoped.
- Cada publicación queda registrada en `interop_publications` y `audit_events`.

### 2.8 IdentityHub y DCP

Uso recomendado:

- **P0/P1:** Keycloak/OIDC para usuarios humanos y service accounts. Guardar campos preparados (`dataspace_participant_id`, `did_web`) sin exigir DCP.
- **P2 sandbox:** `did:web` para el deployment DataSafe y una contraparte de prueba si el piloto lo exige.
- **P3:** IdentityHub para identidad organizacional M2M, almacenamiento de VCs, presentación DCP y gestión de claves/DID documents.

Mapeo:

- `organizations.dataspace_participant_id` → EDC Participant ID.
- `organizations.did_web` → DID usado por IdentityHub/DCP.
- `room_participants` → claims/credentials de participación si se emiten VCs.
- `agreement_parties` → sujetos/holders que pueden recibir credenciales.

No confundir:

- IdentityHub no sustituye Keycloak para usuarios humanos.
- DCP no debe entrar en P1 si no hay contraparte que lo demande.

### 2.9 Issuer Service

Uso recomendado:

- **No P0/P1.** Emitir VCs sin ecosistema de confianza real aporta complejidad y poca validación.
- **P2 lab:** Issuer Service privado para credenciales sintéticas: `DataSafeParticipantCredential`, `RoomMembershipCredential`, `ExportApprovalCredential`.
- **P3:** Issuer Service operativo solo si DataSafe actúa como autoridad de un ecosistema o se integra con un issuer externo.

Credenciales candidatas:

- `DataSafeParticipantCredential`: organización admitida en el dataspace DataSafe.
- `RoomParticipantCredential`: organización autorizada para una room concreta.
- `DataProviderCredential`: rol de proveedor de datos.
- `ExportApproverCredential`: rol para aprobar exportaciones.
- `ComplianceAttestationCredential`: atestación limitada si legal/compliance lo valida.

Regla crítica: no emitir credenciales con claims legales/compliance no validados por el cliente o autoridad correspondiente.

### 2.10 Technology extensions AWS, Azure y Tractus-X

Uso recomendado:

- **AWS Technology extensions:** usar si el deployment está en AWS/S3 real. Candidatas:
  - Vault/secrets AWS.
  - Data plane AWS S3 / S3 copy.
  - Validar compatibilidad con MinIO antes de asumir que “S3-compatible” basta.
- **Azure Technology extensions:** usar si el cliente exige Azure:
  - Azure Blob Storage data plane.
  - Azure Key Vault.
  - CosmosDB/store extensions si se adopta ese patrón.
- **MinIO local/on-prem:** preferir un custom DataAddress + DataSafe Export Pack Data Plane; tratar MinIO como storage privado, no como data plane federado inicial.
- **Tractus-X EDC:** considerar solo para automoción/Catena-X o si la contraparte usa ese stack. Aporta distribuciones Docker/Helm de control/data plane y convenciones Catena-X, pero puede arrastrar supuestos sectoriales no deseados para DataSafe genérico.

Decisión para MVP: no meter AWS/Azure/Tractus-X por defecto. Preparar interfaces y elegir extensión según entorno real del piloto.

## 3. Modelo y mapping DataSafe ↔ EDC

### 3.1 Asset

DataSafe origen:

- `DataProductVersion` publicado.
- En algunos casos, `ExportContract`/`OutputArtifact` aprobado si se quiere publicar un artefacto concreto.

EDC destino:

- `Asset` con propiedades DCAT/DCT y `DataAddress` no sensible.

Mapping recomendado:

- `data_product_versions.dsp_asset_id` → `edc:Asset.@id`.
- `data_products.title/description` → `dct:title`, `dct:description`.
- `data_products.dcat_keywords/theme` → `dcat:keyword`, `dcat:theme`.
- `data_product_versions.version` → `dcat:version`.
- `assets.media_type` → `dcat:mediaType`.
- `assets.checksum/manifest_hash` → checksum del manifest/export pack, no del dataset bruto si es sensible.
- `DataAddress.type` → `DataSafeExportPack` o `HttpData` controlado.
- `DataAddress.endpoint` → endpoint interno del Data Plane/DataSafe, nunca URL MinIO directa.

Regla: el Asset EDC describe una oferta controlada, no publica datos crudos.

### 3.2 Policy / PolicyDefinition

DataSafe origen:

- `policies`, `policy_rules`, `agreements`, snapshots ODRL.

EDC destino:

- `PolicyDefinition` con ODRL.

Mapping recomendado:

- `policies.odrl_policy_id` → `PolicyDefinition.@id`.
- `policy_rules` → ODRL permissions/prohibitions/duties/constraints.
- `agreement.acceptances` → evidencia humana; no se pierde aunque EDC cree `ContractAgreement`.
- `odrl_jsonld_snapshot` → payload publicado vía Management API.

Separar al menos:

- `access_policy_id`: controla visibilidad en catálogo.
- `contract_policy_id`: controla uso/negociación.
- `transfer_policy_id` o constraint adicional: controla descarga final.

### 3.3 ContractDefinition

DataSafe origen:

- Combinación de room + data product/version + política activa + visibilidad.

EDC destino:

- `ContractDefinition` que selecciona assets y asocia access/contract policies.

Mapping recomendado:

- `room_id + data_product_version_id + policy_id` → `ContractDefinition.@id` estable.
- `assetSelector` → `dsp_asset_id`, `room_id`, `interop_enabled=true`, `status=published`.
- `accessPolicyId` → política de catálogo room/participant-scoped.
- `contractPolicyId` → política de uso/export controlado.

Regla: no crear ContractDefinition si falta owner, finalidad, clasificación, policy activa o aprobación de publicación.

### 3.4 ContractNegotiation

DataSafe origen/destino:

- `OutputRequest`.

EDC destino/origen:

- `ContractNegotiation` provider/consumer.

Mapping de estados recomendado:

- `OutputRequest.draft/submitted` → negotiation requested/initial.
- `policy_check_pending` → negotiation under evaluation.
- `approval_pending` → negotiation offered/requested but blocked by human approval.
- `approved` → agreement can be finalized.
- `rejected/revoked/expired` → negotiation terminated.

Regla: una negociación DSP entrante **crea o referencia un OutputRequest**, pero nunca genera export sin approval cuando la política exige approval.

### 3.5 ContractAgreement / ExportContract

DataSafe origen/destino:

- `ExportContract` y `Agreement`.

EDC destino/origen:

- `ContractAgreement`.

Mapping recomendado:

- `export_contracts.contract_agreement_id` → EDC `ContractAgreement.@id`.
- `agreement.odrl_agreement_jsonld_snapshot` → ODRL agreement machine-readable.
- `export_contracts.odrl_policy_snapshot` → política congelada en el momento de aprobación.
- `approved_by`, `approved_at`, `expires_at`, `max_download_count` → constraints y audit metadata.

Regla: el acuerdo EDC no sustituye al acuerdo humano/legal; lo representa para interoperabilidad.

### 3.6 TransferProcess

DataSafe origen/destino:

- `ExportContract`, `OutputArtifact`, `download-url`.

EDC destino/origen:

- `TransferProcess`.

Mapping recomendado:

- `export_contracts.dsp_transfer_process_id` → EDC `TransferProcess.@id`.
- `transfer_type=https_signed_url` → EDC transfer type HTTP pull.
- `export_ready` → transfer startable.
- `download_url.created` → transfer started/provisioned.
- `artifact.downloaded` → transfer completed.
- `revoked/expired` → transfer terminated.

Regla: una transferencia solo se inicia si existe export pack aprobado y vigente.

## 4. APIs y contratos internos

### 4.1 APIs DataSafe para EDC Bridge

Endpoints internos recomendados; red privada y service auth:

```text
POST /api/internal/edc/assets/sync
GET  /api/internal/edc/assets/{dsp_asset_id}/data-address
POST /api/internal/edc/policies/{policy_id}/evaluate
POST /api/internal/edc/negotiations/events
POST /api/internal/edc/transfers/events
GET  /api/internal/edc/export-contracts/{contract_agreement_id}
POST /api/internal/edc/export-contracts/{id}/prepare-transfer
GET  /api/internal/edc/output-artifacts/{artifact_id}/stream-token
```

### 4.2 APIs DataSafe públicas/admin de interoperabilidad

Mantener bajo `/api/v1`, autenticadas y room-scoped:

```text
GET  /api/v1/interop/status
GET  /api/v1/rooms/{room_id}/interop/catalog/dcat
POST /api/v1/rooms/{room_id}/interop/publish
POST /api/v1/rooms/{room_id}/interop/revoke
GET  /api/v1/rooms/{room_id}/data-products/{id}/versions/{version_id}/dcat
GET  /api/v1/rooms/{room_id}/policies/{policy_id}/odrl
GET  /api/v1/rooms/{room_id}/output-requests/{id}/dsp-negotiation
GET  /api/v1/rooms/{room_id}/export-contracts/{id}/dsp-transfer
```

### 4.3 Well-known

```text
GET /.well-known/dspace-version
```

Respuesta P1/P2 solo si `INTEROP_ENABLED=true`:

```json
{
  "service": "DataSafe Room",
  "mode": "partial-profile-controlled-export",
  "targetProtocol": "dataspace-protocol-2024-1",
  "connector": {
    "runtime": "edc-sidecar",
    "enabled": false
  },
  "capabilities": [
    "dcat.catalog.projection",
    "odrl.policy.projection",
    "contract.negotiation.shadow",
    "transfer.process.https-controlled-export"
  ],
  "conformance": "not-certified"
}
```

En P2, cuando EDC esté activo, `connector.enabled=true` y el endpoint puede apuntar al base URL DSP del conector si se valida el schema exacto.

## 5. Integración con export pack y MinIO

### 5.1 Flujo provider-side recomendado

1. Data provider sube datos/evidencias a DataSafe.
2. DataSafe guarda objetos en MinIO privado:
   - `rooms/{room_id}/data-products/{data_product_id}/versions/{version_id}/...`
   - `rooms/{room_id}/outputs/{output_request_id}/...`
3. Usuario crea `OutputRequest`.
4. Policy Engine evalúa reglas internas.
5. Approval Service recoge decisiones humanas.
6. Export Builder Worker genera ZIP/PDF/CSV autorizado.
7. Se calcula checksum y se guarda `manifest.json` + carpeta `dataspace/`:

```text
export-{output_request_id}.zip
├── manifest.json
├── data/...
├── evidence/...
├── audit/...
└── dataspace/
    ├── dcat_dataset.jsonld
    ├── odrl_policy.jsonld
    ├── contract_agreement.jsonld
    └── transfer_process.jsonld
```

8. `EDC Sync Worker` publica/actualiza Asset + PolicyDefinition + ContractDefinition en EDC solo si la publicación interop está habilitada.
9. Contraparte negocia vía DSP.
10. EDC Control Plane coordina `TransferProcess`.
11. DataSafe Export Pack Data Plane consulta a DataSafe y entrega el ZIP aprobado por HTTPS pull o URL firmada corta.
12. DataSafe registra audit events.

### 5.2 Reglas para MinIO

- Buckets privados siempre.
- Sin acceso directo desde navegadores o conectores externos.
- URLs firmadas solo por `Asset and Evidence Service` o Data Plane y solo tras policy check.
- Server-side encryption si el entorno lo soporta.
- Lifecycle/retention por room y export contract.
- Hash del export pack y manifest guardado en PostgreSQL y audit pack.

### 5.3 DataAddress recomendado

No usar bucket/key real como `DataAddress` público. Usar un descriptor opaco:

```json
{
  "type": "DataSafeExportPack",
  "datasafe:assetId": "urn:datasafe:asset:...",
  "datasafe:exportContractRequired": true,
  "datasafe:endpoint": "https://edc-dataplane.example.com/public/export-packs/{token}",
  "datasafe:mediaType": "application/zip"
}
```

El resolver interno traduce ese descriptor a MinIO solo dentro de red privada.

## 6. Plan por fases P0–P3

### P0 — Preparación EDC-ready sin runtime EDC

Objetivo: no bloquear el MVP, pero evitar deuda de modelo.

Implementar:

- IDs estables URN para room, org, data product, data product version, asset, policy, agreement, output request, export contract.
- Campos `dsp_asset_id`, `odrl_policy_id`, `contract_agreement_id`, `dsp_negotiation_id`, `dsp_transfer_process_id` en el modelo o migrations planificadas.
- Generadores DCAT/ODRL JSON-LD con fixtures sintéticos.
- `interop_publications` como tabla de snapshots si el backend ya existe; si no, especificación de migración.
- Export manifest con bloque `interop`.
- ADR: “EDC sidecar deferred until P2”.

No incluir:

- Runtime EDC.
- DSP público.
- IdentityHub/DCP.
- Federated Catalog.
- Cloud-specific data planes.

Criterios de aceptación P0:

- Un Data Product sintético genera `dcat_dataset.jsonld` reproducible.
- Una Policy sintética genera `odrl_policy.jsonld` con permissions/prohibitions/duties mínimas.
- Un export pack sintético incluye carpeta `dataspace/`.
- Ninguna URL MinIO aparece en JSON-LD o manifest público.

### P1 — MVP piloto real Controlled Export First

Objetivo: producto útil con interoperabilidad preparada, sin federación real.

Implementar:

- DataSafe Core: rooms, assets, policies, approval, output requests, export builder, audit.
- MinIO/S3 privado.
- Policy Engine interno ABAC/RBAC.
- Proyecciones DCAT/ODRL autenticadas bajo `/api/v1/.../interop`.
- Contract Negotiation shadow sobre `OutputRequest`.
- Transfer Process shadow sobre `ExportContract`.
- `/.well-known/dspace-version` desactivado por defecto.
- Outbox/events para futura sincronización EDC.

No incluir:

- EDC Connector en producción.
- Management API sync real.
- DSP façade pública.
- Federated Catalog.
- DID/VC obligatorio.
- Tractus-X/AWS/Azure salvo requisito explícito del piloto.

Criterios de aceptación P1:

- Export aprobado requiere policy check + approval humano si aplica.
- Export pack contiene `manifest.json`, audit summary y `dataspace/*.jsonld`.
- Se puede inspeccionar una negociación/transfer shadow desde API interna.
- Revocar un export invalida nuevas descargas.
- Logs prueban que no se exponen datos crudos por endpoints interop.

### P2 — EDC sandbox / interoperabilidad privada

Objetivo: validar EDC con una contraparte real o simulada sin abrir federación.

Implementar:

- DataSafe EDC Connector distribution.
- EDC Control Plane con PostgreSQL y vault/secrets.
- EDC Data Plane separado usando Data Plane Framework.
- `EDC Sync Worker` usando Management API.
- Policy functions DataSafe para constraints mínimas.
- DSP 2024-1 con allowlist de participantes.
- Consumer Pull HTTPS de export packs aprobados.
- Eventos EDC → DataSafe Audit Service.
- Tests de contrato contra fixtures DSP/EDC seleccionados.

Opcional P2:

- Federated Catalog Cache con una allowlist pequeña.
- did:web + IdentityHub en laboratorio si la contraparte lo exige.
- mTLS/OAuth2 más estricto para conectores.

No incluir:

- Catálogo público.
- Transferencia de datasets brutos.
- Multi-conector por organización.
- Certificación/compliance claims.
- Issuer Service productivo.

Criterios de aceptación P2:

- DataSafe publica un Asset EDC desde un DataProductVersion/ExportContract aprobado.
- Un conector de prueba obtiene catálogo por DSP.
- Una negociación entrante crea/actualiza `OutputRequest` sin saltarse approval.
- Un `ContractAgreement` aprobado se refleja en `ExportContract`.
- Un `TransferProcess` entrega solo el export pack aprobado.
- Revocación en DataSafe se propaga a EDC o bloquea transferencias posteriores.

### P3 — Dataspace avanzado / ecosistema

Objetivo: operar en un dataspace real si hay demanda repetida.

Implementar según necesidad validada:

- IdentityHub/DCP con did:web y VCs organizacionales.
- Issuer Service para credenciales propias o integración con issuer externo.
- Federated Catalog Node/Cache para crawling y búsqueda.
- Extensiones AWS o Azure según cloud del cliente.
- Tractus-X EDC si el caso es Catena-X/automoción.
- Policy Engine más rico y policy monitor si se requieren obligaciones post-transferencia.
- Conformance/TCK y hardening operativo.

No avanzar a P3 sin:

- Threat model específico.
- Contraparte real identificada.
- Requisitos de identidad/trust claros.
- Decisión legal sobre claims, credenciales y obligaciones.
- Operación/soporte definidos.

Criterios de aceptación P3:

- Participantes se identifican con DID/VC o mecanismo trust validado.
- Catálogo federado funciona con allowlist y reglas de visibilidad.
- Transferencias cloud usan extensiones validadas en el entorno real.
- Hay resultados documentados de conformance tests; sin usar “certificado” salvo certificación formal.

## 7. No-go explícitos para MVP

- No EDC Connector productivo en P0/P1.
- No Federated Catalog en MVP.
- No IdentityHub/DCP obligatorio en MVP.
- No Issuer Service productivo en MVP.
- No catálogo público global.
- No URLs directas a MinIO/S3 en catálogos o payloads externos.
- No transferencias de datos brutos sin export pack aprobado.
- No conectores ERP/MES/PLM read-write.
- No streaming/Kafka en el primer caso.
- No prometer IDSA/Gaia-X/Catena-X certification.
- No usar Tractus-X salvo necesidad sectorial real.
- No implementar AWS/Azure extensions antes de saber el entorno del cliente.

## 8. Criterios de aceptación transversales

- **Alineación DSP:** todos los IDs y snapshots usan target DSP 2024-1, validado antes de exposición pública.
- **Control de salida:** ninguna transferencia EDC puede saltarse DataSafe approval/export contract.
- **Privacidad:** catálogos solo contienen metadatos permitidos, no datos crudos ni secretos.
- **Revocación:** revocar policy/export/asset en DataSafe bloquea nuevas negociaciones o transferencias.
- **Auditoría:** cada publicación, negociación, acuerdo y transferencia produce `audit_events`.
- **Reproducibilidad:** snapshots DCAT/ODRL/Contract/Transfer se guardan y se incluyen en export pack.
- **Idempotencia:** `EDC Sync Worker` puede reintentar sin duplicar assets/contracts.
- **Operación:** Management API y Data Plane admin APIs no están expuestas públicamente.
- **Conformance honesta:** usar “DSP-ready”, “partial-profile” o “sandbox interoperability” hasta pasar validaciones formales.

## 9. Riesgos y mitigaciones

- **Riesgo: EDC absorbe el producto.**
  - Mitigación: DataSafe Core sigue siendo fuente de verdad; EDC es adaptador.
- **Riesgo: políticas duplicadas divergen.**
  - Mitigación: generar ODRL desde policy snapshot DataSafe; no editar policies manualmente en EDC.
- **Riesgo: publicar demasiado en catálogo.**
  - Mitigación: catalog visibility por room, allowlist, tests que detecten URLs internas/PII.
- **Riesgo: transferencia evita approval.**
  - Mitigación: Data Plane consulta `export_contract.valid` en DataSafe en cada start/download.
- **Riesgo: Identity/DCP se vuelve proyecto propio.**
  - Mitigación: diferir IdentityHub/Issuer a P3 salvo contraparte real.
- **Riesgo: cloud extensions no funcionan con MinIO.**
  - Mitigación: custom DataSafe Data Plane para MVP/P2; validar AWS/Azure solo en cloud real.
- **Riesgo: claims comerciales excesivos.**
  - Mitigación: documentos y UI deben decir “alineado/preparado”, no “certificado”.

## 10. Backlog técnico inicial

### Backend DataSafe

- Crear módulo `dataspace_interop`.
- Crear módulo `edc_bridge`.
- Añadir tabla `interop_publications`.
- Añadir campos interop a organizaciones, rooms, data products, versions, assets, policies, agreements, output requests y export contracts.
- Implementar generadores DCAT/ODRL.
- Implementar export pack `dataspace/`.
- Implementar outbox para eventos interop.

### EDC P2

- Crear repo/distribución `datasafe-edc-connector`.
- Añadir control plane runtime con PostgreSQL/vault.
- Añadir data plane runtime con DPF.
- Añadir extensiones DataSafe.
- Configurar DSP 2024-1 y endpoints públicos controlados.
- Configurar Management API privada.
- Crear docker-compose/helm sandbox.
- Crear tests de negociación/transfer end-to-end.

## 11. Recomendación final

La implementación más segura y vendible es:

1. **Vender y construir DataSafe como sala controlada de colaboración/exportación**, no como dataspace genérico.
2. **Diseñar el modelo para EDC desde el día uno** con IDs, DCAT, ODRL y shadow states.
3. **Activar EDC solo cuando aporte validación real**: una contraparte, un piloto privado o un requisito del cliente.
4. **Usar EDC para interoperabilidad, no para reemplazar el dominio DataSafe**.
5. **Mantener Controlled Export First**: toda transferencia EDC debe terminar en un export pack aprobado, trazado y revocable.
