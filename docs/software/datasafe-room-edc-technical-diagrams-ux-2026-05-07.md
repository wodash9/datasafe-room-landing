---
title: DataSafe Room + EDC — Diagramas técnicos y UX para Ventura
project: datasafe-room
status: internal-draft-diagrams
updated: 2026-05-07
owner: Black Tower Consulting / Ventura
profile: Mimir / Technical Diagrams + UX
scope: propuesta visual para explicar DataSafe Room con Eclipse Dataspace Components sin sobrecargar el MVP
---

# DataSafe Room + EDC — Diagramas técnicos y UX para Ventura

## 0. Mensaje visual principal

La propuesta debe enseñar a Ventura una evolución en dos velocidades:

- **Producto DataSafe Room:** salas, participantes, evidencias, policies, aprobaciones, controlled export y audit pack. Es el núcleo del MVP.
- **Interoperabilidad EDC/DSP:** catálogo, negociación, contrato, transfer process, data plane, IdentityHub/DCP y catálogo federado. Se activa por fases cuando exista contraparte real.

Regla de narrativa en todos los diagramas: **Controlled Export First**. EDC no abre buckets ni datos crudos; EDC coordina contratos y transferencias de artefactos ya aprobados por DataSafe.

## 1. Set de diagramas a crear

### Diagrama A — Arquitectura de componentes DataSafe + EDC por fases

**Objetivo:** explicar que DataSafe Core sigue siendo la fuente de verdad de negocio y que EDC entra como sidecar/frontera de interoperabilidad, no como sustituto del producto.

**Nivel:** C4 Container / logical architecture.

**Fase recomendada:** P0/P1 como diseño; EDC real a partir de P2.

**Nodos:**

- Usuarios humanos: requester/OEM, provider/proveedor, approver/auditor, room operator.
- DataSafe UI: wizard, workspace, approvals, audit pack.
- DataSafe API/Core: room service, data product registry, policy/agreement service, output request service, approval service, audit service, export builder, EDC sync worker.
- Persistencia: PostgreSQL, object storage privado, audit ledger.
- Identidad humana: OIDC/SAML/MFA.
- EDC provider connector: Control Plane, Management API privada, DSP Protocol API pública controlada.
- EDC Data Plane: export pack data plane, endpoint pull HTTPS, data plane signaling.
- Consumer externo: EDC connector / dataspace participant.
- Identidad dataspace P3: IdentityHub, Issuer Service, DID Web/VC/DCP.
- Observabilidad/seguridad: WAF/API gateway, secrets/KMS, SIEM.

**Flechas clave:**

- Usuario → UI → DataSafe API: operación del producto.
- DataSafe API → Policy Engine/Audit/Storage: enforcement y trazabilidad.
- EDC Sync Worker → EDC Management API: publica asset/policy/contract definition cuando `interop_enabled=true`.
- Consumer EDC ↔ Provider EDC DSP API: catálogo, negociación y transferencia.
- EDC Control Plane → Data Plane: signaling de transferencia.
- Data Plane → DataSafe API/Policy/Export Builder: resuelve solo export pack aprobado.
- Data Plane → Object Storage: acceso interno, nunca URL cruda al consumidor.
- IdentityHub/DCP → EDC Policy Engine: credenciales y confianza de participante solo en fases P2/P3.

```mermaid
flowchart LR
  subgraph Humans[Usuarios y organizaciones]
    req[Requester / OEM]
    prov[Provider / proveedor]
    appr[Approver / auditor]
    op[Room operator]
  end

  subgraph DataSafe[DataSafe Room Core - fuente de verdad P0/P1]
    ui[DataSafe UI\nwizard, workspace, approvals, audit pack]
    api[DataSafe API / monolito modular]
    room[Room Service]
    registry[Data Product Registry]
    policy[Policy + Agreement Service]
    output[Output Request + Approval Service]
    audit[Audit Service]
    builder[Export Builder Worker]
    sync[EDC Sync Worker\nfeature flag P2]
  end

  subgraph Storage[Zona de datos protegida]
    pg[(PostgreSQL\nmetadata, grants, snapshots)]
    obj[(MinIO/S3 privado\nevidence + approved exports)]
    ledger[(Audit ledger\nappend-only/hash refs)]
  end

  subgraph IdentityHuman[Identidad humana]
    oidc[OIDC/SAML/MFA\nKeycloak/Entra/etc.]
  end

  subgraph EDCProvider[EDC Provider Connector - P2]
    cp[EDC Control Plane\nCatalog, Policy, Negotiation, TransferProcess]
    mgmt[Management API\nprivada]
    dsp[DSP Protocol API\npública controlada]
    dp[EDC Data Plane\nDataSafe Export Pack Pull HTTPS]
  end

  subgraph TrustP3[Trust dataspace - P2/P3]
    ih[IdentityHub]
    issuer[Issuer Service]
    did[DID Web + VC + DCP]
  end

  consumer[External Dataspace Participant\nConsumer EDC Connector]
  sec[WAF/API Gateway + TLS + rate limit]
  kms[KMS/Secrets]
  siem[SIEM/monitoring]

  req --> ui
  prov --> ui
  appr --> ui
  op --> ui
  ui --> sec --> api
  ui -. login .-> oidc
  api --> room
  api --> registry
  api --> policy
  api --> output
  api --> audit
  api --> builder
  room --> pg
  registry --> pg
  policy --> pg
  output --> pg
  audit --> ledger
  builder --> obj
  sync --> mgmt --> cp
  cp --> dsp
  consumer <--> dsp
  cp -- Data Plane Signaling --> dp
  dp -- policy/export check --> api
  dp -- stream interno --> obj
  dp -- events --> audit
  issuer --> ih --> did
  did -. credentials/presentation .-> cp
  kms -. secrets .-> api
  kms -. secrets .-> cp
  kms -. secrets .-> dp
  ledger --> siem
```

---

### Diagrama B — Secuencia provider/consumer: catalog → negotiation → transfer

**Objetivo:** mostrar el flujo interoperable EDC completo sin perder la decisión de producto: la transferencia solo llega a un artefacto aprobado.

**Nivel:** sequence diagram.

**Fase recomendada:** P2 sandbox/piloto privado.

**Participantes/nodos:**

- Provider DataSafe Core.
- Provider EDC Control Plane.
- Provider EDC Data Plane.
- Consumer EDC Control Plane.
- Consumer App/DataSafe UI externa.
- Policy Engine/Audit.
- Object Storage privado.

**Mensajes principales:**

1. DataSafe marca `DataProductVersion` o `ExportContract` como publicable.
2. EDC Sync Worker crea/actualiza `Asset`, `PolicyDefinition` y `ContractDefinition` en Management API.
3. Consumer solicita catálogo por DSP.
4. Provider responde `Catalog`/DCAT con `Dataset`, `Distribution`, `Policy Offer`; sin URL de storage.
5. Consumer inicia `ContractNegotiation`.
6. Provider evalúa access policy y contract policy contra DataSafe.
7. Se crea `ContractAgreement`.
8. Consumer inicia `TransferProcess`.
9. Provider Control Plane valida acuerdo y dispara Data Plane Signaling.
10. Data Plane emite EDR/endpoint pull temporal o stream controlado.
11. Consumer descarga export pack.
12. Provider registra eventos de transferencia y checksum.

```mermaid
sequenceDiagram
  autonumber
  participant DS as Provider DataSafe Core
  participant PE as Policy/Audit Service
  participant PCP as Provider EDC Control Plane
  participant PDP as Provider EDC Data Plane
  participant CCP as Consumer EDC Control Plane
  participant CAPP as Consumer App/UI
  participant S3 as Private Object Storage

  DS->>PE: Approve ExportContract / interop_enabled=true
  DS->>PCP: Management API: upsert Asset + PolicyDefinition + ContractDefinition
  CCP->>PCP: DSP CatalogRequest(participant, purpose, credentials/ref)
  PCP->>PE: Evaluate access policy(room, participant, purpose, classification)
  PE-->>PCP: Permit catalog metadata only
  PCP-->>CCP: Catalog/DCAT + Policy Offer (no raw URL)

  CAPP->>CCP: Select offer and request contract
  CCP->>PCP: DSP ContractNegotiationRequest(offerId, participant, purpose)
  PCP->>PE: Evaluate contract policy + agreement prerequisites
  PE-->>PCP: Permit / obligations / expiry
  PCP-->>CCP: ContractAgreement(agreementId, ODRL snapshot)
  PCP->>PE: audit contract.agreement.created

  CAPP->>CCP: Start transfer for approved agreement
  CCP->>PCP: DSP TransferProcessRequest(agreementId, DataSafeExportPack, pull)
  PCP->>PE: Validate agreement still active + output approved
  PE-->>PCP: Permit transfer
  PCP->>PDP: Data Plane Signaling: provision pull endpoint
  PDP->>DS: Resolve approved export artifact(agreementId, transferId)
  DS->>PE: Final policy check + audit transfer.started
  DS-->>PDP: Artifact descriptor + short TTL
  PDP->>S3: Internal read/stream approved ZIP/PDF/CSV
  PDP-->>CCP: Endpoint Data Reference / HTTPS pull endpoint
  CCP->>PDP: GET export pack with EDR token
  PDP->>PE: audit artifact.downloaded + bytes + hash_ref
  PDP-->>CCP: Approved export pack stream
  CCP-->>CAPP: Transfer completed + checksum
```

---

### Diagrama C — Data Plane Pull Export: detalle Controlled Export First

**Objetivo:** explicar a negocio y seguridad que el Data Plane no es una puerta al bucket. Es un proxy/control de descarga de export packs aprobados.

**Nivel:** sequence diagram técnico-operativo.

**Fase recomendada:** P2 inicial.

**Nodos:**

- Consumer EDC/Data Plane client.
- Provider EDC Control Plane.
- Provider EDC Data Plane.
- DataSafe Policy Engine.
- Export Builder Worker.
- Storage privado.
- Audit Ledger.
- Revocation/TTL guard.

**Mensajes/flechas:**

- Consumer pide pull transfer.
- Control Plane valida `ContractAgreement` y `TransferPolicy`.
- Data Plane solicita un artifact descriptor a DataSafe.
- Policy Engine comprueba room, purpose, participant, classification, expiry, download count, approved output.
- Si el export pack no existe o está obsoleto, Export Builder lo genera.
- Data Plane entrega stream o URL firmada de 5–15 min, nunca `minio://bucket/key`.
- Cada descarga registra bytes, hash, acuerdo, participante y resultado.
- Revocación invalida EDR/token y bloquea descargas posteriores.

```mermaid
sequenceDiagram
  autonumber
  participant C as Consumer Connector
  participant CP as Provider EDC Control Plane
  participant DP as Provider EDC Data Plane
  participant P as DataSafe Policy Engine
  participant W as Export Builder Worker
  participant O as Object Storage privado
  participant A as Audit Ledger
  participant R as Revocation/TTL Guard

  C->>CP: TransferProcessRequest(agreementId, assetId, pull)
  CP->>P: Check transfer policy(agreement, participant, purpose, expiry)
  P-->>CP: Permit transfer process
  CP->>DP: Signal provision(assetId, agreementId, transferId)
  DP->>P: Resolve export authorization(assetId, agreementId, transferId)
  P->>A: audit transfer.started
  P-->>DP: Permit + exportPackId or requires_build

  alt Export pack missing or stale
    DP->>W: Build approved export pack(manifest, allowed fields)
    W->>O: Write ZIP/PDF/CSV + manifest + checksum
    W->>A: audit export_pack.generated(hash_ref)
    W-->>DP: exportPackId + hash_ref
  else Export pack already approved
    DP->>O: Open internal object by exportPackId
  end

  DP->>R: Mint EDR token(TTL 5-15m, bound to agreement/transfer/participant)
  DP-->>C: EDR/HTTPS endpoint(no raw storage URL)
  C->>DP: GET /edr/{transferId} Authorization: token
  DP->>R: Validate TTL, audience, scope, revocation, download count
  R-->>DP: OK
  DP->>O: Internal read approved object
  DP->>A: audit artifact.downloaded(bytes, hash_ref, participant)
  DP-->>C: Stream approved export pack

  opt Contract/room/user revoked later
    P->>R: Revoke EDR/token/agreement
    C->>DP: Retry GET
    DP->>R: Validate token
    R-->>DP: Deny revoked/expired
    DP->>A: audit transfer.denied
    DP-->>C: 403 with safe reason code
  end
```

---

### Diagrama D — Trust e identidad: DCP / IdentityHub / DID Web

**Objetivo:** separar identidad humana de identidad de participante dataspace. Ventura debe ver que Keycloak/OIDC no sustituye DCP/IdentityHub cuando haya interoperabilidad real, y que DCP no sustituye approvals de DataSafe.

**Nivel:** trust flow / sequence diagram.

**Fase recomendada:** diseño P1, piloto acotado P2, operación completa P3.

**Nodos:**

- Participant admin / onboarding.
- Issuer Service DataSafe o trust anchor.
- IdentityHub del provider/consumer.
- DID Web documents.
- Consumer EDC Connector.
- Provider EDC Control Plane.
- DataSafe Policy Engine.
- Audit/SIEM.

**Mensajes/flechas:**

1. Organización se da de alta y demuestra dominio/control legal.
2. Issuer emite credenciales verificables: `DataSafeParticipantCredential`, `ConnectorCredential`, `RoomMembershipCredential`, `DataProviderRole`/`DataConsumerRole`.
3. IdentityHub custodia credenciales.
4. En una petición DSP/DCP, el consumer presenta VC(s) y DID.
5. Provider resuelve DID Web, valida firma, issuer, schema, status/revocación, expiración y audience.
6. EDC Policy Engine llama a DataSafe para mapear claims a room/participant/purpose/agreement.
7. Si todo coincide, catálogo/contrato/transferencia continúa; si no, falla cerrado.
8. Se auditan decisiones sin loggear tokens completos ni secretos.

```mermaid
sequenceDiagram
  autonumber
  participant Admin as Participant Admin
  participant Issuer as Issuer Service / Trust Anchor
  participant IH_C as Consumer IdentityHub
  participant DID as DID Web / VC Status
  participant CEDC as Consumer EDC Connector
  participant PEDC as Provider EDC Control Plane
  participant Policy as DataSafe Policy Engine
  participant Audit as Audit/SIEM

  Admin->>Issuer: Onboarding request(domain, legal entity, connector env)
  Issuer->>DID: Verify DID Web document + keys + domain ownership
  DID-->>Issuer: DID resolved and valid
  Issuer-->>IH_C: Issue VC: participant, connector, room role, capability
  Issuer->>Audit: audit credential.issued(schema, subject, expiry)

  CEDC->>IH_C: Request presentation for DSP operation(catalog/contract/transfer)
  IH_C-->>CEDC: Verifiable Presentation(bound audience, nonce, expiry)
  CEDC->>PEDC: DSP/DCP request + presentation
  PEDC->>DID: Resolve DID + public keys + status list
  DID-->>PEDC: DID doc + credential status
  PEDC->>PEDC: Verify signature, issuer allowlist, schema, expiry, audience
  PEDC->>Policy: Map claims to DataSafe participant/room/purpose/agreement
  Policy-->>PEDC: Permit / Deny + safe reason
  PEDC->>Audit: audit dcp.decision(no token/secret payload)

  alt Permit
    PEDC-->>CEDC: Continue catalog/contract/transfer
  else Deny
    PEDC-->>CEDC: 403 fail closed(reason_code)
  end
```

---

### Diagrama E — UX de sala: lo que ve Ventura vs lo que hace EDC detrás

**Objetivo:** traducir EDC a experiencia de producto. Los usuarios no deben operar conceptos de EDC directamente salvo en una pantalla avanzada de interoperabilidad.

**Nivel:** product/UX flow.

**Fase recomendada:** P0/P1 para MVP; anotaciones P2 detrás de feature flag.

**Pantallas/nodos UX:**

- Crear sala.
- Definir finalidad, participantes y retención.
- Solicitar/aportar campos y evidencias.
- Clasificar sensibilidad.
- Crear Output Request.
- Preview por rol.
- Approval gate.
- Export/Audit Pack.
- Opcional P2: publicar como oferta EDC.
- Opcional P2: ver contratos/transferencias EDC.
- Cierre/revocación.

**Flechas UX y backend:**

- Crear sala → acuerdos humanos → grants internos.
- Subir evidencia → clasificación → no publicable por defecto.
- Output Request → policy check → revisión humana → export pack aprobado.
- Botón avanzado “Publicar oferta interoperable” solo si export pack aprobado y `interop_enabled=true`.
- EDC Sync Worker crea asset/policy/contract definition.
- Transferencias externas aparecen como eventos del audit pack.

```mermaid
flowchart LR
  A[Crear Room\nfinalidad, alcance, retención] --> B[Invitar organizaciones\nroles + acuerdos]
  B --> C[Solicitar/aportar datos\nformularios, CSV/XLSX/PDF]
  C --> D[Clasificar sensibilidad\nowner, secreto, exportable]
  D --> E[Output Request\nqué salida se pide y para quién]
  E --> F[Preview por rol\ncliente/proveedor/auditor]
  F --> G{Approval Gate\npolicy + humano}
  G -- rechazo/corrección --> E
  G -- aprobado --> H[Export Pack + Audit Pack\nPDF/CSV/ZIP + hashes]
  H --> I{Interop EDC habilitado?\nP2 feature flag}
  I -- no --> J[Descarga controlada DataSafe\nlink revocable]
  I -- sí --> K[Publicar oferta EDC\nAsset + ODRL + ContractDefinition]
  K --> L[Catálogo/negociación/transferencia\nvisible como timeline]
  L --> M[Cierre/revocación\nretención + EDR invalidado]
  J --> M

  P[[Policy Engine + Audit Ledger\ndeny by default]] -. gobierna .-> A
  P -. gobierna .-> D
  P -. bloquea .-> G
  P -. registra .-> H
  P -. registra .-> L
```

**Copy UX recomendado para Ventura:**

- En pantallas normales usar “salida aprobada”, “paquete de auditoría”, “oferta interoperable”, “participante externo”.
- En modo avanzado usar términos EDC entre paréntesis: “Oferta interoperable (EDC Asset + Contract Definition)”, “Acuerdo técnico (Contract Agreement)”, “Transferencia controlada (Transfer Process)”.
- Evitar vender “conexión automática al ERP/MES” en MVP. Decir “subida o exportación controlada primero; conectores después”.

---

### Diagrama F — Roadmap P0–P3: Controlled Export First → EDC completo

**Objetivo:** ordenar ambición y coste. EDC completo se gana por gates, no se promete desde el día uno.

**Nodos/fases:**

- **P0 — Landing/demo comercial:** narrativa, mockups, documentos, sin datos reales ni EDC productivo.
- **P1 — MVP Controlled Export:** salas, uploads, approvals, export/audit pack; shadow model DCAT/ODRL/DSP; Management API/EDC no productivo.
- **P2 — Piloto EDC privado:** provider connector, consumer de demo o contraparte real, Control Plane/Data Plane separados, pull HTTPS, políticas EDC delegadas a DataSafe, management privada.
- **P3 — Dataspace federado:** IdentityHub/DCP, issuer, DID/VC, catálogo federado, multi-participante, hardening, conformance/TCK si aplica.

**Flechas/gates:**

- P0 → P1: caso de negocio y UX validada.
- P1 → P2: export pack estable, policy engine maduro, threat model, contraparte técnica.
- P2 → P3: contratos reales, operación 24/7, seguridad/compliance revisados, necesidad federada.
- Cada fase tiene un “no-go” para evitar sobrepromesa.

```mermaid
flowchart LR
  P0[P0 Landing/demo\nPropuesta visual\nDatos sintéticos\nSin EDC productivo]
  G01{Gate 0\nCaso comercial + UX aprobada}
  P1[P1 MVP Controlled Export\nRooms + uploads/forms\nApproval gate\nExport/Audit Pack\nShadow DCAT/ODRL/DSP]
  G12{Gate 1\nPolicy engine estable\nExport pack aprobado\nThreat model\nContraparte técnica}
  P2[P2 Piloto EDC privado\nProvider/Consumer CP\nData Plane Pull HTTPS\nDSP catalog/negotiation/transfer\nManagement API privada]
  G23{Gate 2\nDemanda repetida\nOperación madura\nTrust framework\nCompliance review}
  P3[P3 Dataspace completo\nIdentityHub/DCP\nIssuer + DID/VC\nFederated Catalog\nHardening + conformance]

  P0 --> G01 --> P1 --> G12 --> P2 --> G23 --> P3
  N0[No-go P0:\nno datos reales, no compliance claims] -.-> P0
  N1[No-go P1:\nno raw buckets, no ERP/MES directo] -.-> P1
  N2[No-go P2:\nno management API pública, no EDR largo] -.-> P2
  N3[No-go P3:\nno certificación sin TCK/auditoría] -.-> P3
```

## 2. Orden recomendado dentro del Markdown/PDF final

1. **Página 1 — Decisión ejecutiva:** DataSafe Core primero, EDC progresivo, Controlled Export First.
2. **Página 2 — Arquitectura de componentes:** Diagrama A.
3. **Página 3 — Flujo interoperable EDC:** Diagrama B.
4. **Página 4 — Pull export seguro:** Diagrama C.
5. **Página 5 — Trust e identidad:** Diagrama D.
6. **Página 6 — UX de usuario:** Diagrama E.
7. **Página 7 — Roadmap:** Diagrama F.
8. **Apéndice — Glosario:** Asset, PolicyDefinition, ContractDefinition, ContractAgreement, TransferProcess, EDR, IdentityHub, DCP, DID Web, VC.

## 3. Glosario visual corto para Ventura

- **DataSafe Room:** sala de colaboración con finalidad, participantes, políticas, aprobaciones y auditoría.
- **Controlled Export:** salida concreta aprobada, empaquetada y trazable; no acceso libre al dato crudo.
- **Export Pack:** ZIP/PDF/CSV autorizado, con manifest, checksum y restricciones.
- **Audit Pack:** evidencia de quién pidió, quién aprobó, qué se exportó, hashes y eventos.
- **EDC Control Plane:** componente que publica catálogo, negocia contratos y controla transferencias.
- **EDC Data Plane:** componente que entrega el artefacto aprobado mediante endpoint temporal/controlado.
- **DSP:** protocolo de interoperabilidad entre conectores dataspace.
- **ODRL:** lenguaje de políticas machine-readable usado para ofertas/acuerdos.
- **DCAT:** modelo de catálogo/dataset/distribution.
- **EDR:** Endpoint Data Reference; referencia temporal para descargar/consumir un artefacto autorizado.
- **IdentityHub/DCP:** wallet y protocolo para presentar/verificar credenciales de participante.
- **DID Web/VC:** identidad descentralizada y credenciales verificables para organizaciones/conectores.

## 4. Decisiones de diseño que deben quedar visibles

- **EDC no reemplaza la UI ni los workflows de aprobación.** Coordina interoperabilidad.
- **EDC Management API nunca es pública.** Solo la toca el worker interno.
- **El catálogo nunca publica URLs internas ni keys de storage.** Publica metadatos y políticas.
- **El Data Plane entrega export packs aprobados.** No datos crudos por defecto.
- **DCP/IdentityHub se separa de OIDC humano.** OIDC autentica usuarios; DCP acredita participantes/conectores.
- **MVP no necesita EDC productivo.** Debe ser EDC-ready: DCAT/ODRL/DSP shadow model, IDs, snapshots y políticas limpias.
- **EDC completo requiere gates.** Contraparte real, threat model, operación, secretos, logs, revocación y compliance review.

## 5. Checklist para pasar estos diagramas a arte final

- Usar color por capa:
  - Azul: UX/DataSafe Core.
  - Morado: EDC Control Plane.
  - Naranja: EDC Data Plane.
  - Verde: trust/identity.
  - Gris: storage/audit/infra.
- Marcar P0/P1/P2/P3 en cada caja opcional.
- Poner candados en Management API, Object Storage y KMS.
- Poner etiqueta “no raw storage URL” en catálogo y data plane.
- En secuencias, resaltar con borde grueso: `Policy check`, `Approval gate`, `Audit event`, `Short TTL`.
- En la versión ejecutiva, mantener máximo 6 diagramas; mover detalles de payload/API a apéndice.
