import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type UseCase = {
  title: string;
  description: string;
  signal: string;
};

type TrustControl = {
  title: string;
  detail: string;
};

type Step = {
  label: string;
  title: string;
  detail: string;
};

const useCases: UseCase[] = [
  {
    title: 'Huella de carbono de producto',
    description:
      'Responde a clientes que piden PCF, evidencias ESG o Scope 3 sin enviar hojas completas ni información comercial sensible.',
    signal: 'Wedge recomendado',
  },
  {
    title: 'Calidad y trazabilidad multiempresa',
    description:
      'Comparte evidencia mínima para incidencias, no conformidades o reclamaciones sin abrir el proceso interno completo.',
    signal: 'Impacto medible',
  },
  {
    title: 'Riesgo de suministro y planificación',
    description:
      'Cruza previsión, capacidad agregada y alertas de suministro con partners sin revelar costes, recetas ni capacidad fina.',
    signal: 'Operaciones',
  },
  {
    title: 'Preparación Data Act',
    description:
      'Prepara catálogos, permisos y logs para acceso controlado a datos de maquinaria conectada sin improvisar APIs o excels.',
    signal: 'Regulación UE',
  },
];

const controls: TrustControl[] = [
  {
    title: 'Mínimo dato necesario',
    detail: 'Cada sala define qué campos entran, cuáles quedan fuera y qué nivel de agregación reduce exposición.',
  },
  {
    title: 'Finalidad limitada',
    detail: 'El caso de uso manda: PCF, calidad, trazabilidad, planificación o logística. Nada de cesión abierta.',
  },
  {
    title: 'Permisos por rol',
    detail: 'Cliente, proveedor, auditor e interno no ven lo mismo. Cada actor accede solo a lo necesario.',
  },
  {
    title: 'Reglas de salida',
    detail: 'Define qué puede exportarse: ficha, informe, dashboard, evidencia o solo lectura dentro de la sala.',
  },
  {
    title: 'Trazabilidad de accesos',
    detail: 'Registro de quién accedió, cuándo, qué consultó y qué resultado se generó.',
  },
  {
    title: 'Sin abrir OT por defecto',
    detail: 'El piloto empieza con datos exportados, agregados o sintéticos. Integraciones industriales solo con alcance aprobado.',
  },
];

const steps: Step[] = [
  {
    label: '01',
    title: 'Identificar caso y contraparte',
    detail:
      'Elegimos un problema multiempresa con valor real: PCF, calidad, trazabilidad, logística o previsión de demanda.',
  },
  {
    label: '02',
    title: 'Clasificar sensibilidad',
    detail:
      'Separamos datos compartibles, datos agregables y datos prohibidos: costes, recetas, capacidad fina o parámetros críticos.',
  },
  {
    label: '03',
    title: 'Configurar sala controlada',
    detail:
      'Definimos participantes, finalidad, permisos, reglas de salida y evidencias necesarias para el caso.',
  },
  {
    label: '04',
    title: 'Medir valor antes de escalar',
    detail:
      'El piloto demuestra si reduce reporting manual, acelera respuestas a cliente o evita integraciones punto a punto.',
  },
];

function App() {
  return (
    <main className="page-shell">
      <nav className="nav" aria-label="Navegación principal">
        <a className="brand" href="#top" aria-label="DataSafe Room inicio">
          <span className="brand-mark">DS</span>
          <span>DataSafe Room</span>
        </a>
        <div className="nav-links">
          <a href="#casos">Casos</a>
          <a href="#confianza">Controles</a>
          <a href="#piloto">Piloto</a>
        </div>
        <a className="nav-cta" href="mailto:hola@etharlia.com?subject=DataSafe%20Room%20-%20identificar%20caso%20de%20uso">
          Identificar caso
        </a>
      </nav>

      <section id="top" className="hero section-grid">
        <div className="hero-copy">
          <p className="eyebrow">Dataspace industrial sin cesión abierta de datos</p>
          <h1>Colabora con datos sensibles con más control y trazabilidad.</h1>
          <p className="hero-subtitle">
            Crea salas controladas de colaboración entre empresas industriales para resolver casos de sostenibilidad,
            calidad, logística, trazabilidad o planificación sin entregar datos brutos ni abrir tus sistemas de forma indiscriminada.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="mailto:hola@etharlia.com?subject=DataSafe%20Room%20-%20demo%20controlada">
              Solicitar demo controlada
            </a>
            <a className="secondary-button" href="#piloto">
              Ver piloto de 4-8 semanas
            </a>
          </div>
          <p className="risk-note">
            No prometemos control absoluto ni cumplimiento legal completo. Diseñamos pilotos acotados con mínima exposición, finalidad clara y QA antes de escalar.
          </p>
        </div>

        <div className="hero-card" role="group" aria-label="Vista conceptual de una sala controlada">
          <div className="card-header">
            <span className="status-dot" aria-hidden="true" />
            Sala: Huella de carbono producto X
          </div>
          <div className="participants">
            <span>Fabricante</span>
            <span>Proveedor</span>
            <span>Cliente</span>
            <span>Auditor</span>
          </div>
          <div className="rules-panel">
            <div>
              <strong>Visible</strong>
              <p>PCF aprobado, evidencia, estado de completitud.</p>
            </div>
            <div>
              <strong>Oculto</strong>
              <p>Costes, recetas, capacidad fina, parámetros internos.</p>
            </div>
          </div>
          <div className="audit-log">
            <span>09:12 Cliente abrió ficha PCF</span>
            <span>09:14 Export permitido: informe agregado</span>
            <span>09:15 Bloqueado: campo de coste interno</span>
          </div>
        </div>
      </section>

      <section className="problem section-grid">
        <div>
          <p className="eyebrow">El bloqueo no es técnico, es confianza</p>
          <h2>El valor está entre empresas. El riesgo también.</h2>
        </div>
        <div className="problem-copy">
          <p>
            Fabricantes, proveedores y operadores necesitan colaborar con datos para responder a clientes, reducir fricción operativa o preparar evidencias de sostenibilidad.
          </p>
          <p>
            Pero compartir datos industriales sigue dando miedo: ventaja competitiva, uso secundario, poder de negociación, ciberseguridad, secretos de proceso y responsabilidad legal.
          </p>
        </div>
      </section>

      <section id="casos" className="use-cases">
        <div className="section-heading">
          <p className="eyebrow">Casos que sí entiende la industria</p>
          <h2>No vendemos “compartir datos”. Vendemos resolver una presión concreta.</h2>
        </div>
        <div className="case-grid">
          {useCases.map((item) => (
            <article className="case-card" key={item.title}>
              <span>{item.signal}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="confianza" className="trust section-grid">
        <div>
          <p className="eyebrow">Diseñado para industrias reticentes</p>
          <h2>Compartir una respuesta controlada, no una base de datos.</h2>
          <p>
            DataSafe Room empieza con datos exportados, agregados o sintéticos si hace falta. La integración con sistemas críticos solo llega cuando el caso, el responsable técnico y el alcance están aprobados.
          </p>
        </div>
        <div className="control-grid">
          {controls.map((control) => (
            <article className="control-card" key={control.title}>
              <h3>{control.title}</h3>
              <p>{control.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="piloto" className="pilot">
        <div className="section-heading compact">
          <p className="eyebrow">Piloto controlado</p>
          <h2>Empieza pequeño, con una contraparte real y una salida medible.</h2>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <article className="step-card" key={step.label}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="offer section-grid">
        <div>
          <p className="eyebrow">Propuesta inicial</p>
          <h2>Discovery Use Case + Controlled Pilot</h2>
        </div>
        <div className="offer-panel">
          <div>
            <h3>Discovery de 1-2 semanas</h3>
            <p>Mapa de actores, sensibilidad, datos mínimos, reglas de salida y business case inicial.</p>
          </div>
          <div>
            <h3>Piloto de 4-8 semanas</h3>
            <p>Sala para 2-3 participantes, dataset limitado, permisos, logs, dashboard y decisión de escalado.</p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">La colaboración de datos no tiene que empezar con una cesión de datos</p>
        <h2>Identifica un caso donde compartir valor tenga menos exposición que seguir enviando Excels.</h2>
        <a className="primary-button" href="mailto:hola@etharlia.com?subject=DataSafe%20Room%20-%20quiero%20identificar%20un%20caso">
          Identificar un caso de uso
        </a>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
