---
title: DataSafe Room — Technical Diagrams + UX Flow
project: datasafe-room
status: internal-spec-diagrams
updated: 2026-05-07
owner: Black Tower Consulting / Ventura
profile: Mimir / Technical Diagrams + UX Flow
---

# DataSafe Room — Technical Diagrams + UX Flow

> Documento interno para explicar a Ventura la arquitectura técnica y el flujo UX de DataSafe Room. El objetivo es que producto, negocio, seguridad y desarrollo compartan el mismo mapa mental antes de construir el MVP.

## Lectura ejecutiva

DataSafe Room se modela como una **sala controlada de colaboración industrial**: cada sala tiene finalidad, participantes, datos mínimos, políticas, acuerdos, aprobaciones de salida y auditabilidad. El MVP debe evitar integraciones OT/ERP directas: empieza con **controlled export first** mediante formularios y uploads aprobados.

## Entidades clave

- **Room:** sala/caso con finalidad, alcance, participantes, estado y retención.
- **Participants:** organizaciones y usuarios con rol por sala.
- **Data Products:** datasets lógicos solicitados o aportados.
- **Assets/Evidence:** archivos, certificados, tablas, declaraciones o documentos versionados.
- **Policies:** permisos, prohibiciones, obligaciones y condiciones machine-readable.
- **Agreements:** aceptación humana/legal versionada.
- **Output Requests:** solicitudes de informe, vista, CSV/PDF/ZIP o audit pack.
- **Approval:** revisión y aprobación/rechazo de salida.
- **Audit Log:** eventos no editables desde UI.
- **Audit Pack:** paquete final con output, evidencias autorizadas, versiones, aprobaciones, hashes y logs.

## Flujo PCF de referencia

Crear sala → invitar proveedor/cliente → solicitar campos → subir evidencia → clasificar sensibilidad → preview por rol → aprobar output → export/audit pack → cierre/retención.


## 1. Arquitectura C4 / Container

![1. Arquitectura C4 / Container](datasafe-room-diagrams-assets/01-c4-container.svg)

**Qué comunica:** Muestra los contenedores lógicos que debe entender Ventura: Web App, API, servicios de sala/catálogo/políticas/workflow, almacenamiento, auditoría e identidad. La decisión técnica principal es que ningún acceso vaya directo a datos: todo pasa por API + Policy Engine.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/01-c4-container.mmd`

```mermaid
flowchart LR
  requester[Requester / OEM
cliente, auditor, comprador]
  provider[Provider
proveedor / fabricante]
  operator[Room Operator
Black Tower / admin]
  web[Web App
wizard PCF, workspace, preview por rol]
  api[API Gateway
auth, rate limit, tenant boundary]
  room[Room Service
salas, participantes, estados]
  catalog[Catalog Service
data products, campos, evidencias]
  policy[Policy Engine
RBAC + ABAC + reglas de salida]
  workflow[Workflow Service
output request, review, approval]
  db[(Relational DB
metadata, policies, grants)]
  obj[(Object Storage
assets, evidence, exports)]
  audit[(Audit Ledger
append-only log + hashes v1)]
  idp[Identity Provider
OIDC/SAML/MFA]
  siem[Notification / SIEM
alerts + monitoring]
  requester --> web
  provider --> web
  operator --> web
  web --> api
  api --> room
  api --> catalog
  api --> policy
  api --> workflow
  room --> db
  catalog --> obj
  policy --> db
  workflow --> audit
  workflow --> obj
  web -. auth .-> idp
  audit --> siem
```


## 2. Flujo de datos PCF / UX end-to-end

![2. Flujo de datos PCF / UX end-to-end](datasafe-room-diagrams-assets/02-data-flow-pcf.svg)

**Qué comunica:** Traduce el caso PCF en una experiencia completa. El usuario no piensa en “dataspaces”; piensa en una sala, campos solicitados, evidencias, clasificación, preview, aprobación y pack final.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/02-data-flow-pcf.mmd`

```mermaid
flowchart LR
  A[Crear sala
finalidad, alcance, retención] --> B[Invitar proveedor/cliente
deny by default]
  B --> C[Solicitar campos PCF
unidad, periodo, factores, evidencias]
  C --> D[Subir evidencia
CSV/XLSX/PDF/ZIP]
  D --> E[Clasificar sensibilidad
owner, secreto, exportable]
  E --> F[Preview por rol
cliente/proveedor/auditor]
  F --> G[Aprobar output
approver + policy checks]
  G --> H[Export + audit pack
PDF/CSV/ZIP + hash/log]
  P[[Políticas + acuerdos + data grants + audit log]] -. gobierna .-> A
  P -. gobierna .-> D
  P -. bloquea si falta aprobación .-> G
```


## 3. Secuencia de aprobación y export

![3. Secuencia de aprobación y export](datasafe-room-diagrams-assets/03-approval-export-sequence.svg)

**Qué comunica:** Aclara quién interviene cuando alguien pide una salida. La exportación no es un botón simple: crea solicitud, evalúa política, revisa steward, aprueba approver, genera hash y registra eventos.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/03-approval-export-sequence.mmd`

```mermaid
sequenceDiagram
  participant R as Requester
  participant API as API Gateway
  participant P as Policy Engine
  participant S as Provider Steward
  participant A as Approver
  participant L as Audit/Storage
  R->>API: Solicita output
  API->>P: Evalúa rol, finalidad, sensibilidad
  P-->>API: Permitido crear OutputRequest
  API->>L: Evento + snapshot
  API->>S: Notifica revisión
  S-->>API: Marca campos/evidencias
  API->>A: Envía a aprobación
  A->>P: Check policy final
  P-->>A: OK o bloqueo explicado
  A-->>API: Aprueba o rechaza
  API->>L: Genera export + hash + audit pack
  API-->>R: Link revocable / descarga controlada
```


## 4. Modelo de dominio / ER conceptual

![4. Modelo de dominio / ER conceptual](datasafe-room-diagrams-assets/04-domain-er-model.svg)

**Qué comunica:** Define el núcleo de datos del MVP. Room es el aggregate operativo; Policies/Agreements/DataGrant separan contrato, regla y autorización concreta; OutputRequest y AuditEvent cierran la trazabilidad.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/04-domain-er-model.mmd`

```mermaid
erDiagram
  ROOM ||--o{ PARTICIPANT_ORG : includes
  PARTICIPANT_ORG ||--o{ USER : has
  ROOM ||--o{ DATA_PRODUCT : contains
  DATA_PRODUCT ||--o{ FIELD_DEFINITION : defines
  DATA_PRODUCT ||--o{ ASSET_EVIDENCE : supports
  ROOM ||--o{ POLICY : applies
  POLICY ||--o{ AGREEMENT : versioned_by
  POLICY ||--o{ DATA_GRANT : emits
  USER ||--o{ DATA_GRANT : receives
  DATA_GRANT }o--|| DATA_PRODUCT : scopes
  ROOM ||--o{ OUTPUT_REQUEST : receives
  OUTPUT_REQUEST ||--o{ OUTPUT_APPROVAL : reviewed_by
  OUTPUT_REQUEST ||--o{ AUDIT_EVENT : logs
  ASSET_EVIDENCE ||--o{ AUDIT_EVENT : versions
  OUTPUT_APPROVAL ||--o{ AUDIT_EVENT : logs
```


## 5. Máquina de estados

![5. Máquina de estados](datasafe-room-diagrams-assets/05-state-machines.svg)

**Qué comunica:** Evita ambigüedad de producto: una sala pasa de Draft a Active, Review, Closing y Archived. Un OutputRequest puede quedar Requested, UnderReview, Rejected, Approved o Exported.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/05-state-machines.mmd`

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Active: participantes + acuerdos
  Active --> Review: output requested
  Review --> Active: rechazo / corrección
  Review --> Closing: aprobación + export
  Closing --> Archived: cierre + retención
  Archived --> [*]

  state OutputRequest {
    [*] --> Requested
    Requested --> UnderReview
    UnderReview --> Rejected
    UnderReview --> Approved
    Rejected --> UnderReview: corregir
    Approved --> Exported
    Exported --> [*]
  }
```


## 6. Matriz de permisos MVP

![6. Matriz de permisos MVP](datasafe-room-diagrams-assets/06-permission-matrix.svg)

**Qué comunica:** Da una vista comprensible de RBAC para negocio y recuerda que el enforcement real debe ser ABAC: organización, sala, finalidad, sensibilidad, estado, caducidad y acuerdos aceptados.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/06-permission-matrix.mmd`

```mermaid
flowchart TB
  owner[Room Owner
configura sala, invita, cierra]
  steward[Data Steward
clasifica, revisa, ve crudo autorizado]
  contributor[Provider Contributor
sube evidencia propia]
  requester[Requester Viewer
ve outputs aprobados]
  approver[Approver
aprueba/rechaza salida]
  auditor[Auditor
lee logs y evidencias autorizadas]
  admin[Admin IT/Security
SSO, dominios, revocación, retención]
  abac[[ABAC: organización + sala + finalidad + sensibilidad + estado + caducidad + acuerdo]]
  owner --> abac
  steward --> abac
  contributor --> abac
  requester --> abac
  approver --> abac
  auditor --> abac
  admin --> abac
  abac --> deny[Deny by default si falta regla explícita]
```


## 7. Arquitectura de infraestructura

![7. Arquitectura de infraestructura](datasafe-room-diagrams-assets/07-infra-architecture.svg)

**Qué comunica:** Plantea una infraestructura cloud/VPC segura para MVP: zona pública controlada, zona privada de aplicación, zona de datos protegida, KMS, SIEM y backups. Se explicita “sin OT directo” para reducir riesgo.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/07-infra-architecture.mmd`

```mermaid
flowchart LR
  subgraph Pub[Zona pública controlada]
    waf[WAF/CDN/TLS]
    web[Web App]
  end
  subgraph App[Zona privada aplicación]
    api[API / Services]
    pdp[Policy Decision Point]
    workers[Workers: hash, PDF/ZIP, retention]
  end
  subgraph Data[Zona datos protegida]
    pg[(Postgres/RLS)]
    obj[(Object Storage encrypted)]
    ledger[(Audit ledger append-only)]
    kms[KMS / Secrets]
  end
  export[Fuentes MVP: CSV/XLSX/PDF aprobados
sin OT directo] --> waf --> web --> api
  api --> pdp
  api --> pg
  api --> obj
  workers --> obj
  workers --> ledger
  kms --> pg
  kms --> obj
  idp[OIDC/SAML/MFA] -.-> web
  siem[SIEM/alerts/backups] -.-> ledger
```


## 8. Evolución MVP / V1 / V2

![8. Evolución MVP / V1 / V2](datasafe-room-diagrams-assets/08-roadmap-mvp-v1-v2.svg)

**Qué comunica:** Ordena la ambición: MVP vendible con exports controlados; V1 enterprise con SSO, watermark, hash chain, WORM y APIs; V2 dataspace-ready con conectores y estándares si el mercado lo justifica.

**Fuente Mermaid editable:** `docs/software/datasafe-room-diagrams-assets/08-roadmap-mvp-v1-v2.mmd`

```mermaid
flowchart LR
  MVP[MVP piloto
Controlled export first
Wizard PCF
RBAC + audit log
Manual approval
CSV/XLSX/PDF/ZIP]
  V1[V1 enterprise
SSO/MFA
Watermark + hash chain
Object lock/WORM
API scoped tokens
SFTP/bucket privado]
  V2[V2 dataspace-ready
Conectores ERP/MES aprobados
ODRL/DCAT completo
EDC/DSP opcional
Catálogo federado opcional]
  MVP --> V1 --> V2
  Gate[[Avanzar solo si hay demanda repetida, contratos claros y threat model aprobado]]
  Gate -. gobierna .-> MVP
  Gate -. gobierna .-> V1
  Gate -. gobierna .-> V2
```


## Decisiones técnicas que se desprenden de los diagramas

- **Controlled Export First:** el MVP acepta uploads/formularios y exports aprobados; evita conexiones directas a PLC/SCADA/MES/ERP.
- **Deny by default:** invitación no implica acceso; cada permiso depende de sala, rol, finalidad, sensibilidad y estado.
- **Separar ver, revisar y aprobar:** quien aporta evidencia no necesariamente aprueba salida; quien ve output no ve datos crudos.
- **Policy Engine desde el MVP:** aunque sea simple, debe existir como punto explícito de decisión para no mezclar reglas en pantallas.
- **Audit log no editable desde UI:** MVP funcional; V1 con hash chain/WORM/SIEM.
- **Preview por rol obligatorio:** reduce errores antes de compartir con cliente/proveedor/auditor.
- **Audit Pack como producto final:** no vender “cumplimiento garantizado”; vender trazabilidad revisable.

## Backlog UX mínimo derivado

1. Wizard de creación de sala: finalidad, alcance, fechas, owner, retención y participantes.
2. Plantilla PCF configurable: campos, unidad, obligatoriedad, fuente, salida permitida.
3. Upload de evidencia con versión, owner, sensibilidad y relación con campos.
4. Clasificación guiada: baja/media/alta, secreto comercial, personal data, raw/aggregate.
5. Preview por rol: “esto verá el cliente/proveedor/auditor”.
6. Bandeja de Output Requests: requested → under review → approved/rejected → exported.
7. Export/audit pack: output + evidencias autorizadas + decisiones + log + hashes.
8. Cierre/retención: bloquear edición, revocar accesos, conservar lo pactado.
