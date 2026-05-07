# DataSafe Room — Revisión Aegis/Security-OT

Actualizado: 2026-05-07

## 1. Veredicto de seguridad de producto

DataSafe Room debe tratarse como una **sala controlada de colaboración de datos industriales sensibles**, no como un repositorio documental genérico ni como un dataspace abierto. La superficie de riesgo incluye secretos industriales, datos de producción, posiciones comerciales, datos personales en evidencias, relaciones cliente-proveedor y posible exposición indirecta de entornos OT/IT.

**Principio rector:** el producto no debe abrir PLC/SCADA/MES/ERP al principio. El MVP y los primeros pilotos deben operar con **export controlado**, datos sintéticos, datos anonimizados, extractos CSV/Excel aprobados o evidencias manuales. Cualquier conector OT/IT queda fuera del piloto inicial salvo alcance formal, revisión de seguridad y aprobación explícita de IT/OT del cliente.

## 2. Activos que proteger

- **Secretos industriales:** recetas, BOM detallada, parámetros de proceso, rendimiento, scrap, consumos por línea/máquina, capacidad fina, costes, proveedores críticos, planificación y márgenes.
- **Datos de sostenibilidad/PCF:** factores de emisión, evidencias energéticas, volúmenes, materiales, supuestos metodológicos, incertidumbre y versiones.
- **Datos de calidad/trazabilidad:** lotes, certificados, no conformidades, fotos, informes, acciones correctivas, fichas técnicas y documentación de auditoría.
- **Datos Data Act readiness:** inventario de datasets, ubicación, owner, derechos/restricciones, decisiones de entrega/rechazo y justificaciones.
- **Identidades y relaciones comerciales:** usuarios externos, organizaciones, roles, comentarios, solicitudes, aprobaciones, timestamps y contratos/NDAs asociados.
- **Evidencias y exports:** PDF/ZIP/CSV, vistas compartidas, snapshots de sala y paquetes enviados a cliente/auditor.
- **Metadatos sensibles:** frecuencia de cambios, huecos de evidencia, retrasos de proveedores, acceso de usuarios, estructura organizativa y patrones operativos.

## 3. Modelo de amenazas específico

### 3.1 Amenazas OT/IT

- **Pivot OT/IT por integración prematura:** un conector mal diseñado a MES/ERP/SCADA puede abrir rutas laterales hacia redes industriales.
- **Exfiltración vía exports:** un paquete ZIP/PDF/CSV puede incluir campos internos, metadatos de archivos, nombres de ruta, autores o versiones no aprobadas.
- **Carga de archivos maliciosos:** PDFs, Excels, imágenes o ZIPs con malware, macros, payloads o contenido activo.
- **Compromiso de cuenta externa:** proveedor/cliente con contraseña débil, dispositivo comprometido o cuenta compartida.
- **Permisos excesivos por defecto:** un proveedor ve datos de otros proveedores, o un cliente ve campos internos antes de aprobación.
- **Logs incompletos o editables:** imposibilidad de reconstruir quién vio, cambió, aprobó o exportó un dato.
- **Retención indefinida:** evidencias sensibles quedan accesibles tras cierre de sala, fin de contrato o salida de usuario.

### 3.2 Amenazas de privacidad y secretos industriales

- **Inferencia competitiva:** datos aparentemente agregados permiten deducir costes, capacidad, rendimiento, proveedores o recetas.
- **Uso secundario no autorizado:** datos aportados para PCF se reutilizan para negociación, benchmarking, auditoría no pactada o presión comercial.
- **Reidentificación:** datos anonimizados combinados con producto, lote, fecha, geografía o volumen identifican a un proveedor o línea.
- **Sobrecompartición por urgencia:** usuarios suben excels completos, emails históricos o carpetas de auditoría sin revisión.
- **Datos personales en evidencias:** nombres, firmas, matrículas, imágenes, correos o certificados de empleados/proveedores.
- **Confusión de responsabilidad:** el producto parece certificar PCF, Data Act o cumplimiento legal cuando solo estructura evidencias y decisiones.

### 3.3 Amenazas de negocio y confianza

- **Repudio:** una parte niega haber aprobado o exportado una versión.
- **Error de versión:** se comparte una ficha/certificado obsoleto o evidencia no vigente.
- **Dependencia de consultor/admin:** facilitadores ven más datos de los necesarios durante piloto.
- **Fuga por colaboración externa:** links reenviados, descargas locales, capturas de pantalla o cuentas genéricas.
- **Escalada comercial insegura:** pasar de demo a piloto real sin QA, DPIA/TRA básico, NDA, reglas de salida y owner de seguridad.

## 4. Riesgos convertidos en características obligatorias

### R1 — Apertura prematura de sistemas OT/IT

**Control obligatorio:** modo `Controlled Export First`.

Requisitos:

- El MVP no incluye conectores directos a PLC/SCADA.
- ERP/MES/PLM solo mediante archivos exportados, estáticos, revisados y subidos manualmente en piloto inicial.
- Cada dataset importado debe tener owner, fuente, fecha, alcance, sensibilidad y aprobación de uso.
- Pantalla de onboarding debe explicar: “no conectes sistemas industriales ni subas dumps completos sin aprobación”.
- Backlog de conectores debe quedar v1+/enterprise, condicionado a threat model, segmentación, service account mínimo, allowlist, logs y plan de rollback.

### R2 — Acceso indebido entre organizaciones

**Control obligatorio:** IAM multi-organización con RBAC mínimo y ABAC por sensibilidad/contexto.

Requisitos:

- Modelo de tenants/organizaciones separado desde el MVP operativo.
- Roles base: Room Owner, Data Provider, Data Requester, Data Steward, Approver, Auditor/Viewer, Admin IT/Security, Consultant/Facilitator.
- Permisos explícitos por sala, evidencia, campo sensible, aprobación y export.
- ABAC obligatorio para decisiones por: organización, sala, rol, sensibilidad, estado de aprobación, finalidad, caducidad y tipo de export.
- Deny-by-default: usuario invitado no ve nada hasta asignación explícita.
- Impersonation de soporte deshabilitada por defecto; si existe, requiere aprobación, ventana temporal y log visible.

### R3 — Cuenta comprometida o usuario externo de bajo control

**Control obligatorio:** autenticación fuerte y gestión de sesión proporcional al riesgo.

Requisitos MVP:

- Invitaciones únicas, con caducidad y vínculo a organización.
- Verificación de email y bloqueo de dominios no autorizados cuando aplique.
- Revocación inmediata de usuario, sala y token/link.
- Sesiones con expiración y logout global.
- Registro de accesos, descargas y cambios.

Requisitos v1:

- SSO/SAML/OIDC para clientes enterprise.
- MFA/TOTP/WebAuthn para roles admin, owner, approver y usuarios externos con acceso a sensible.
- Políticas de contraseña si no hay SSO.
- Detección de anomalías básica: país/IP nueva, múltiples fallos, descarga masiva, acceso fuera de ventana.

### R4 — Exfiltración por export o vista externa

**Control obligatorio:** output controls y approval gate.

Requisitos:

- Ningún export externo sin política de salida aplicada y, para datos sensibles, aprobación explícita.
- Vista previa por rol: “esto verá cliente/proveedor/auditor”.
- Bloqueo si hay campos sin clasificación, evidencias sin owner, adjuntos no revisados o decisiones pendientes.
- Export debe incluir versión, fecha, finalidad, alcance, participantes, autorizaciones y disclaimers.
- Export debe excluir campos internos por regla técnica, no solo por copy.
- Historial de exports inmutable a nivel funcional: quién generó, aprobó, descargó, revocó y cuándo.
- Revocación de acceso a vistas online; para archivos descargados, advertencia clara de límite de control y watermarking v1.

### R5 — Sobrecompartición y exceso de datos

**Control obligatorio:** data minimization by design.

Requisitos:

- Plantillas PCF/Data Act/calidad deben pedir campos mínimos, no dumps completos.
- Cada campo debe tener finalidad, obligatoriedad, sensibilidad, owner y decisión de salida.
- Campos de alto riesgo deben ofrecer alternativas: rango, agregado, ratio, evidencia parcial, declaración, hash/referencia o “requiere revisión”.
- Indicador de “datos evitados” y “campos protegidos” como métrica de valor/control.
- Carga de Excel/CSV debe permitir mapeo selectivo de columnas y rechazo de columnas no mapeadas.
- Adjuntos deben tener checklist de revisión: metadatos, datos personales, secretos, versiones, firmas y ámbito.

### R6 — Integridad, versión y repudio

**Control obligatorio:** trazabilidad y audit log defensible.

Requisitos:

- Cada dato/evidencia/aprobación/export debe tener ID, versión, timestamp, actor, organización y motivo/comentario cuando proceda.
- Las acciones críticas deben ser append-only a nivel aplicación.
- Ediciones posteriores a aprobación invalidan o marcan como obsoleto el export relacionado.
- Export audit pack debe poder reconstruirse con versiones exactas.
- Aprobaciones/rechazos requieren comentario y no pueden hacerse por el mismo actor que subió evidencia sensible si la política exige separación de funciones.

### R7 — Malware y contenido activo en evidencias

**Control obligatorio:** file intake seguro.

Requisitos MVP/piloto:

- Tipos de archivo permitidos por política; bloquear ejecutables, macros y ZIP anidados en piloto salvo justificación.
- Límite de tamaño y número de archivos.
- Almacenamiento privado; nunca servir archivos subidos desde bucket público.
- Sanitización básica de nombre de archivo y metadatos visibles.
- Procedimiento manual de revisión antivirus si aún no hay motor automático.

Requisitos v1:

- Antivirus/sandbox para adjuntos.
- Conversión segura a PDF/imagen para preview cuando sea posible.
- Content Security Policy estricta y descarga forzada para tipos no previsualizables.
- Detección de documentos con macros o contenido activo.

### R8 — Privacidad y datos personales incidentales

**Control obligatorio:** privacy triage ligero antes de piloto real.

Requisitos:

- Clasificación por dataset: personal/no personal, industrial sensible, secreto comercial, contractual, técnico.
- Campos personales evitados por defecto; si aparecen, justificar finalidad y minimización.
- Redacción/ocultación de datos personales en evidencias cuando no sean necesarios.
- Retención por sala y borrado/cierre planificado.
- Registro de base/justificación operativa en pilotos; no prometer cumplimiento GDPR automático.
- Checklist de DPIA/TRA “lite” para decidir si se necesita revisión legal formal.

### R9 — Gestión insegura de secretos de aplicación

**Control obligatorio:** secret management y hardening de infraestructura.

Requisitos:

- No almacenar secretos en repo, frontend, logs ni exports.
- Variables de entorno gestionadas por plataforma/secret manager.
- Rotación de claves y credenciales antes de piloto real.
- Backups cifrados y acceso restringido.
- Separación de entornos demo/sandbox/piloto real.
- Principio de mínimo privilegio para base de datos, storage y tareas de background.

### R10 — Promesas excesivas de compliance o seguridad

**Control obligatorio:** disclaimers y review de claims.

Requisitos:

- UI, landing, propuesta y exports deben evitar “compliance automático”, “seguridad absoluta”, “Data Act compliant”, “PCF certificado” o “sin riesgo”.
- Lenguaje permitido: “preparación”, “trazabilidad”, “evidencias”, “controles”, “gap report”, “requiere revisión legal/sectorial”.
- Export PCF debe indicar metodología declarada, supuestos e incertidumbre; certificación solo si interviene tercero acreditado.
- Data Act readiness debe generar gap report, no dictamen legal.

## 5. Controles técnicos obligatorios por dominio

### 5.1 IAM, RBAC y ABAC

MVP operativo:

- Multi-tenant lógico con organización obligatoria por usuario.
- RBAC base por sala y permisos granulares: ver sala, crear solicitud, subir evidencia, ver sensible, comentar, aprobar, exportar, administrar participantes, ver audit log, configurar políticas.
- ABAC para sensibilidad, finalidad, estado y pertenencia a organización.
- Invitaciones con caducidad, revocación, estado y registro.
- Deny-by-default y tests de permisos cruzados entre organizaciones.

v1:

- SSO/OIDC/SAML, MFA por rol/riesgo, SCIM o import controlado de usuarios.
- Políticas por cliente: dominios permitidos, duración de sesión, IP allowlist opcional, separación de funciones.

### 5.2 Logs y auditoría

MVP operativo:

- Audit log de creación de sala, invitaciones, accesos, subida/edición de datos, cambios de sensibilidad, comentarios relevantes, aprobaciones, rechazos, exports y revocaciones.
- Logs visibles para Room Owner/Admin y exportables para revisión.
- IDs de correlación por export y evidencia.
- Reloj consistente y timestamps con zona horaria.

v1:

- Log append-only respaldado por almacenamiento inmutable o WORM lógico.
- Integración SIEM/webhook para clientes enterprise.
- Alertas por acceso anómalo, descarga masiva, export bloqueado, cambio posterior a aprobación.

### 5.3 Cifrado y almacenamiento

MVP operativo:

- TLS obligatorio en tránsito.
- Cifrado en reposo para base de datos, adjuntos y backups usando controles de plataforma/cloud.
- Storage privado con URLs firmadas y expiración corta.
- Separación clara demo/sintético vs piloto real.
- Backups con retención definida y restauración probada antes de piloto real.

v1:

- Claves por tenant o por cliente si el mercado lo exige.
- Rotación de claves documentada.
- Bring Your Own Key solo como v2/enterprise si hay demanda y madurez operativa.

### 5.4 Revocación y lifecycle

MVP operativo:

- Revocar usuario elimina acceso a salas, vistas online, invitaciones y nuevos exports.
- Cierre/archivo de sala con política de retención y owner responsable.
- Caducidad de enlaces y exports online.
- Registro de revocación en audit log.

v1:

- Legal hold por sala si aplica.
- Borrado verificable por tenant/sala según contrato.
- Workflow de offboarding por organización externa.

### 5.5 Output controls

MVP operativo:

- Motor de reglas: exacto, rango, agregado, anonimizar, ocultar, requiere revisión legal, no compartir.
- Export bloqueado si falta clasificación o aprobación.
- Preview por rol antes de exportar.
- Disclaimers obligatorios y versión/hash del paquete.

v1:

- Watermarking con usuario/organización/fecha en PDF.
- Políticas de no-descarga para vista online cuando sea viable.
- Redacción automática/asistida de metadatos y campos personales.
- DLP básico para patrones: emails, teléfonos, IBAN, costes, campos prohibidos configurados.

### 5.6 File intake y evidencias

MVP operativo:

- Allowlist de tipos de archivo.
- Bloqueo o cuarentena de archivos no permitidos.
- Metadatos obligatorios: owner, origen, fecha, versión, permiso, caducidad.
- Revisión manual documentada de adjuntos antes de export.

v1:

- Escaneo antimalware automático.
- Preview segura.
- Extracción/redacción de metadatos.

### 5.7 Integraciones OT/IT

MVP/piloto inicial:

- Sin integración directa a PLC/SCADA.
- Sin escritura hacia OT/ERP/MES/PLM.
- Solo import manual o CSV/Excel revisado.
- Si se usa ERP/MES, solo export generado por cliente y aprobado por owner interno.

v1/conectores selectivos:

- Read-only por defecto.
- Service account de mínimo privilegio.
- Segmentación de red y allowlist de endpoints.
- Sin credenciales compartidas.
- Rate limits y ventanas de sincronización.
- Logs de consulta y plan de desconexión.
- Revisión conjunta IT/OT y prueba en entorno no productivo.

## 6. Requisitos técnicos del MVP obligatorio

Para un MVP que pueda aspirar a piloto real controlado, las siguientes capacidades son **P1 obligatorias**, no extras:

1. **Tenancy y permisos**
   - Usuarios vinculados a organización.
   - Salas privadas por invitación.
   - RBAC granular y deny-by-default.
   - Test automatizado: proveedor A no ve proveedor B.

2. **Clasificación y minimización**
   - Sensibilidad por campo/evidencia: público de sala, restringido, interno, secreto industrial, personal, requiere legal.
   - Campos con owner, finalidad y decisión de salida.
   - Plantilla PCF con alternativas agregadas/rangos.

3. **Workflow de aprobación**
   - Estados: borrador, recogida, revisión, pendiente aprobación, aprobada, exportada, cerrada/archivada.
   - Aprobación/rechazo con comentario.
   - Bloqueo técnico de export si faltan decisiones.

4. **Audit log funcional**
   - Registro de eventos críticos.
   - No editable desde UI estándar.
   - Exportable para QA/revisión.

5. **Output controls**
   - Preview por rol.
   - Export PDF/ZIP/CSV con versión, alcance, participantes, fecha y disclaimers.
   - Exclusión técnica de campos internos.

6. **Revocación**
   - Revocar usuario/invitación/sala.
   - Expirar links.
   - Registrar revocación.

7. **Seguridad de adjuntos**
   - Tipos permitidos, límites, storage privado, metadatos obligatorios.
   - Proceso de revisión manual antes de export real.

8. **Infraestructura base**
   - TLS, cifrado en reposo de plataforma, backups, separación demo/piloto, gestión de secretos fuera de repo.
   - Headers de seguridad si hay web app: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors.

9. **Piloto controlado**
   - Import manual/export controlado.
   - Prohibición explícita de conectar PLC/SCADA/MES/ERP en fase inicial sin anexo de seguridad.
   - Datos sintéticos o anonimizados hasta pasar QA.

## 7. Requisitos v1 recomendados

- SSO/OIDC/SAML y MFA por riesgo.
- Antimalware/sandbox para adjuntos.
- Watermarking de exports y vistas online.
- DLP básico configurable por cliente.
- Logs append-only con retención configurable e integración SIEM/webhook.
- Claves por tenant si hay demanda enterprise.
- Conectores read-only a ERP/MES/PLM solo tras revisión IT/OT, nunca como promesa inicial.
- Workflow de privacidad: redacción, retención, legal hold y borrado verificable.
- Políticas ABAC avanzadas por contrato, cliente, producto, región y finalidad.
- Revisión de seguridad externa antes de manejar datos industriales reales de alto impacto.

## 8. Flujo seguro de piloto real

### Fase 0 — Demo comercial

- Datos 100% sintéticos.
- Sin usuarios externos reales si no es necesario.
- Sin adjuntos del cliente.
- Sin claims de compliance.

### Fase 1 — Discovery de seguridad y datos

- Identificar caso, finalidad y contraparte.
- Nombrar Room Owner, Data Steward, Approver, contacto IT/Security y contacto Legal/Compliance si aplica.
- Inventario mínimo de datasets y evidencias.
- Clasificación: compartible, agregable, interno, secreto industrial, personal, requiere legal.
- Definir reglas de salida y criterios de éxito.
- Firmar NDA/DPA/contrato si hay datos reales o personales.

### Fase 2 — Sandbox controlado

- Datos anonimizados o extractos no críticos.
- Import manual CSV/Excel validado.
- Usuarios externos limitados y con caducidad.
- QA de permisos, export, revocación y logs antes de abrir sala real.

### Fase 3 — Piloto real limitado

- Solo datasets aprobados.
- Sin conexión directa a OT/SCADA/PLC.
- Export bloqueado hasta aprobación.
- Monitorización de accesos y descargas.
- Reunión semanal de riesgos/gaps.

### Fase 4 — Cierre y decisión de escalado

- Generar audit pack final y gap report.
- Revocar usuarios externos que no continúen.
- Archivar o borrar sala según política.
- Documentar incidentes, near misses y mejoras.
- Solo plantear conectores si el valor quedó probado y QA/IT/OT aprueba alcance.

## 9. Criterios QA antes de piloto real

No abrir un piloto con datos reales hasta cumplir todos los criterios siguientes:

### 9.1 QA de permisos

- Usuario no autenticado no accede a ninguna sala ni archivo.
- Usuario de organización A no ve salas/datos de organización B.
- Data Provider solo ve sus tareas y evidencias permitidas.
- Data Requester no ve campos internos ni secretos industriales.
- Consultant/Facilitator tiene acceso mínimo y temporal.
- Revocar usuario corta acceso a sala, vistas online e invitaciones.

### 9.2 QA de output controls

- Export bloqueado con campos sin clasificación.
- Export bloqueado con evidencia no aprobada.
- Export externo excluye campos internos/secreto industrial por regla técnica.
- Preview por rol coincide con export final.
- Export incluye versión, fecha, alcance, participantes, aprobadores y disclaimers.
- Cambiar un dato tras aprobación invalida o marca obsoleto el export anterior.

### 9.3 QA de logs

- Log registra login/acceso, subida, edición, cambio de sensibilidad, aprobación, rechazo, export, descarga y revocación.
- Log incluye actor, organización, sala, objeto, timestamp y resultado.
- Log no es editable desde UI estándar.
- Se puede reconstruir el paquete exportado con versiones exactas.

### 9.4 QA de adjuntos

- Archivos no permitidos son bloqueados o puestos en cuarentena.
- Nombres de archivo no pueden romper rutas ni headers.
- Adjuntos se sirven desde storage privado, no público.
- Límite de tamaño funciona.
- Revisión manual/antivirus documentada antes de export real.

### 9.5 QA de privacidad y minimización

- Cada dataset tiene owner, finalidad y sensibilidad.
- Datos personales incidentales están redactados o justificados.
- Campos de alto riesgo tienen alternativa agregada/rango/ocultar.
- Política de retención definida antes de cargar datos reales.
- No hay datos reales en entornos demo públicos.

### 9.6 QA de infraestructura

- TLS activo.
- Secrets fuera del repo y del frontend.
- Backups configurados y restauración probada o plan documentado.
- Entornos demo/sandbox/piloto separados.
- Headers de seguridad configurados para web.
- Dependencias sin vulnerabilidades críticas conocidas antes de piloto.

## 10. No-promesas obligatorias

Mensajes que deben estar reflejados en landing, propuesta, contrato/piloto y exports:

- No prometemos cumplimiento automático de Data Act, CSRD, ESRS, GDPR, Catena-X, Gaia-X ni DPP.
- No prometemos PCF certificado ni auditoría válida sin tercero acreditado o revisión sectorial.
- No prometemos seguridad absoluta, imposibilidad de fuga ni control sobre archivos ya descargados.
- No conectamos PLC/SCADA/MES/ERP por defecto en pilotos iniciales.
- No sustituimos revisión legal, contractual, ciberseguridad corporativa ni validación OT/IT del cliente.
- No pedimos datos brutos si el objetivo puede cumplirse con agregados, rangos, evidencias parciales o declaraciones.
- No usamos datos aportados para finalidades secundarias sin autorización explícita.

## 11. Checklist de discovery Aegis/Security-OT

Antes de diseñar una sala:

- [ ] Caso de uso definido: PCF/sostenibilidad, Data Act readiness, calidad/trazabilidad u otro.
- [ ] Finalidad escrita y aceptada por las partes.
- [ ] Room Owner nombrado.
- [ ] Data Steward nombrado.
- [ ] Approver nombrado.
- [ ] Contacto IT/Security nombrado.
- [ ] Contacto Legal/Compliance identificado si hay datos reales/personales/contratos.
- [ ] Organizaciones y usuarios externos identificados.
- [ ] NDA/DPA/contrato revisado si procede.
- [ ] Datasets/evidencias inventariados.
- [ ] Sensibilidad clasificada.
- [ ] Datos personales incidentales identificados.
- [ ] Secretos industriales identificados.
- [ ] Campos prohibidos definidos.
- [ ] Reglas de salida definidas.
- [ ] Política de retención definida.
- [ ] Decisión explícita: sin conexión OT/SCADA/PLC.
- [ ] Si hay ERP/MES/PLM: solo export manual aprobado.
- [ ] Criterios de éxito y cierre definidos.

## 12. Checklist de configuración de sala

- [ ] Sala creada desde plantilla aprobada.
- [ ] Finalidad, alcance, producto/lote/familia y deadline configurados.
- [ ] Participantes asignados a organización y rol.
- [ ] Permisos revisados por Room Owner/Admin.
- [ ] Campos requeridos mínimos definidos.
- [ ] Sensibilidad por campo/evidencia configurada.
- [ ] Reglas de salida por campo/evidencia configuradas.
- [ ] Evidencias con owner, origen, versión, fecha y caducidad.
- [ ] Aprobador asignado para export.
- [ ] Preview por rol revisada.
- [ ] Disclaimers configurados.
- [ ] Retención/cierre configurados.

## 13. Checklist de export/audit pack

- [ ] Todos los campos incluidos tienen clasificación.
- [ ] No hay campos internos/secreto industrial en export externo.
- [ ] Evidencias incluidas están aprobadas y vigentes.
- [ ] Datos personales innecesarios están ocultos/redactados.
- [ ] Export muestra versión, fecha, finalidad, alcance y participantes.
- [ ] Export muestra aprobador, timestamp y comentario de aprobación.
- [ ] Export incluye disclaimer de no certificación/no compliance automático.
- [ ] Audit log referencia versiones exactas.
- [ ] Paquete revisado con preview de rol destinatario.
- [ ] Descarga/vista queda registrada.

## 14. Checklist de incidente

Preparar antes del piloto:

- [ ] Canal de reporte definido para cliente/proveedor/Etharlia.
- [ ] Severidades definidas: fuga confirmada, fuga potencial, acceso indebido, export erróneo, malware, disponibilidad, privacidad.
- [ ] Responsable de triage nombrado.
- [ ] Procedimiento de contención: revocar usuarios, expirar links, bloquear exports, cerrar sala, aislar adjuntos.
- [ ] Procedimiento de preservación: exportar logs, snapshot de permisos, versiones afectadas.
- [ ] Procedimiento de notificación contractual/legal definido con el cliente.
- [ ] Postmortem obligatorio con causa raíz, impacto, acciones y owners.

Durante un incidente:

- [ ] Contener antes de investigar en profundidad.
- [ ] Preservar logs y evidencias.
- [ ] Identificar salas, usuarios, archivos y exports afectados.
- [ ] Revocar accesos/tokens/links necesarios.
- [ ] Informar según contrato y sensibilidad.
- [ ] Documentar timeline y decisiones.
- [ ] Corregir control fallido antes de reabrir la sala.

## 15. Backlog de seguridad obligatorio

### P0 — Antes de enseñar demo con narrativa de seguridad

- Claims revisados: sin compliance automático ni seguridad absoluta.
- Guion `Controlled Export First` incluido.
- Dataset sintético sin datos reales.
- Matriz de sensibilidad y reglas de salida visible.
- Audit log funcional aunque sea mock.
- No-promesas incluidas en propuesta.

### P1 — Antes de piloto real limitado

- Multi-tenant/RBAC/ABAC básico.
- Invitaciones, caducidad y revocación.
- Clasificación por campo/evidencia.
- Output controls con bloqueo técnico.
- Audit log de eventos críticos.
- Storage privado y TLS.
- File intake con allowlist/límites.
- Política de retención por sala.
- QA completo de permisos/export/logs/adjuntos.
- Runbook de incidente y owner de seguridad.

### P2 — Para pilotos con clientes exigentes o múltiples organizaciones

- MFA para roles críticos y externos.
- SSO/OIDC/SAML.
- Antimalware automático.
- Watermarking.
- DLP básico configurable.
- Alertas de anomalía.
- Logs append-only reforzados.
- Backup/restore probado formalmente.

### P3 — Para conectores OT/IT o escalado enterprise

- Threat model por conector.
- Revisión IT/OT y arquitectura de red.
- Service accounts mínimos/read-only.
- Allowlist, rate limit, auditoría y rollback.
- Entorno de pruebas no productivo.
- Pentest/revisión externa según criticidad.
- Integración SIEM y procedimientos de cambio.

## 16. Criterio final Aegis

DataSafe Room es viable como propuesta de confianza si convierte la seguridad en producto visible: finalidad, mínimo dato, permisos, salida aprobada, trazabilidad y export controlado. No debe competir por “abrir datos”, sino por **reducir exposición frente a Excel/email**. El MVP que no implemente permisos, clasificación, logs, aprobación, revocación y controles de salida no debe tocar datos industriales reales.
