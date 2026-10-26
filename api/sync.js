/**
 * UNIDAD CANINA K9 - API SERVERLESS DE SINCRONIZACIÓN EN LA NUBE (VERCEL)
 * Permite almacenar y sincronizar el estado global de la unidad K9 entre
 * múltiples navegadores, ordenadores y dispositivos en tiempo real.
 *  <!-- Actualizacion K9 Supabase -->
 * Compatible con:
 * - Vercel KV / Upstash Redis (variables KV_REST_API_URL o UPSTASH_REDIS_REST_URL)
 * - Persistencia local /tmp y en memoria con soporte de expulsiones permanentes y purga de logs
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_DOGS = [
  {
    id: 'k9_rex',
    name: 'Rex',
    breed: 'Pastor Belga Malinois',
    tag: 'K9-R01',
    specialty: 'Intervención Táctica & Asalto',
    handlerId: null,
    handlerName: 'Pendiente de Asignación',
    age: '4 años',
    healthStatus: 'Apto Operativo',
    syncLevel: 98,
    photo: 'assets/images/k9_rex.jpg',
    weight: '34 kg',
    bloodType: 'DEA 1.1 Negativo',
    emergencyCallsign: 'ALPHA-K9-01',
    trainingNotes: 'Máxima obediencia y fijación en mordida. Comandos verbales en alemán (Fass, Aus, Voran).'
  },
  {
    id: 'k9_thor',
    name: 'Thor',
    breed: 'Pastor Alemán Sable',
    tag: 'K9-T02',
    specialty: 'Detección de Explosivos & IED',
    handlerId: null,
    handlerName: 'Pendiente de Asignación',
    age: '3 años',
    healthStatus: 'Apto Operativo',
    syncLevel: 95,
    photo: 'assets/images/k9_thor.jpg',
    weight: '37 kg',
    bloodType: 'Universal Canino',
    emergencyCallsign: 'BRAVO-K9-04',
    trainingNotes: 'Marcaje pasivo (se sienta en silencio ante foco de olor). Certificación TEDAX superada.'
  },
  {
    id: 'k9_ghost',
    name: 'Ghost',
    breed: 'Pastor Belga Malinois',
    tag: 'K9-G03',
    specialty: 'Detección de Estupefacientes & Sustancias',
    handlerId: null,
    handlerName: 'Pendiente de Asignación',
    age: '2.5 años',
    healthStatus: 'Apto Operativo',
    syncLevel: 91,
    photo: 'assets/images/k9_rex.jpg',
    weight: '31 kg',
    bloodType: 'DEA 1.1 Negativo',
    emergencyCallsign: 'CHARLIE-K9-09',
    trainingNotes: 'Olfato extraordinario en registros de vehículos y compartimentos ocultos. Muy ágil.'
  },
  {
    id: 'k9_valkyrie',
    name: 'Valkyrie',
    breed: 'Bloodhound (Sabueso)',
    tag: 'K9-V04',
    specialty: 'Búsqueda & Rastreo de Personas',
    handlerId: null,
    handlerName: 'Pendiente de Asignación',
    age: '2 años',
    healthStatus: 'En Entrenamiento',
    syncLevel: 82,
    photo: 'assets/images/hero_dog.jpg',
    weight: '42 kg',
    bloodType: 'Universal',
    emergencyCallsign: 'DELTA-K9-12',
    trainingNotes: 'Rastreo por olor de referencia hasta 48h de retraso. Fase final de adiestramiento.'
  },
  {
    id: 'k9_brutus',
    name: 'Brutus',
    breed: 'Rottweiler Táctico',
    tag: 'K9-B05',
    specialty: 'Control de Masas & Seguridad Perimetral',
    handlerId: null,
    handlerName: 'Pendiente de Asignación',
    age: '5 años',
    healthStatus: 'En Recuperación',
    syncLevel: 89,
    photo: 'assets/images/k9_thor.jpg',
    weight: '46 kg',
    bloodType: 'Universal',
    emergencyCallsign: 'ECHO-K9-15',
    trainingNotes: 'Imponente presencia disuasoria. Tratamiento veterinario menor por esguince articular.'
  }
];

const DEFAULT_NORMATIVES = [
  {
    id: 'norm_01',
    chapter: 'CAPÍTULO I — DISPOSICIONES GENERALES',
    articles: [
      {
        num: 'Art. 1',
        title: 'Objeto',
        text: 'El presente reglamento establece las bases organizativas, administrativas y operativas de la Unidad Canina K9, en adelante denominada «Unidad K9». Su finalidad es regular la incorporación, formación, organización y actuación de los agentes que desarrollen funciones policiales con perros asignados.'
      },
      {
        num: 'Art. 2',
        title: 'Finalidad de la unidad',
        text: 'La Unidad K9 tiene como finalidad reforzar las capacidades del Departamento de Policía mediante la utilización de perros policiales. Sus funciones comprenden: rastreo y localización de personas; detección de sustancias u otros elementos; apoyo en intervenciones policiales autorizadas; entrenamiento, obediencia y control del perro; colaboración con otras divisiones policiales; y participación en dispositivos especiales bajo autorización del mando.'
      },
      {
        num: 'Art. 3',
        title: 'Ámbito de aplicación',
        text: 'Este reglamento será aplicable a todos los agentes admitidos en la Unidad K9, con independencia de su rango policial. Los agentes deberán cumplir tanto estas disposiciones como la normativa general del servidor y del Departamento de Policía.'
      },
      {
        num: 'Art. 4',
        title: 'Principios de actuación',
        text: 'La actividad de la unidad se regirá por los siguientes principios: respeto a la cadena de mando; profesionalidad y disciplina; proporcionalidad en las intervenciones; responsabilidad del agente guía; protección del perro y de las personas; coordinación con las demás unidades; registro de las actuaciones relevantes; y cumplimiento de la normativa del servidor.'
      }
    ]
  },
  {
    id: 'norm_02',
    chapter: 'CAPÍTULO II — ORGANIZACIÓN Y CADENA DE MANDO',
    articles: [
      {
        num: 'Art. 5',
        title: 'Dependencia orgánica',
        text: 'La Unidad K9 dependerá de la Jefatura del Departamento de Policía o de la persona en quien esta delegue formalmente sus competencias. La creación de la unidad no modificará los rangos policiales existentes ni permitirá eludir las órdenes legítimas de los superiores.'
      },
      {
        num: 'Art. 6',
        title: 'Coordinador K9',
        text: 'El coordinador será el responsable de la organización y supervisión interna de la unidad. Sus funciones son: organizar el funcionamiento de la unidad; proponer candidatos y gestionar las incorporaciones; supervisar los entrenamientos y evaluaciones; mantener actualizados los registros de agentes y perros; revisar los informes de servicio; comunicar incidencias a la jefatura; proponer modificaciones de la normativa; y presentar informes periódicos sobre la actividad de la unidad.'
      },
      {
        num: 'Art. 7',
        title: 'Instructor K9',
        text: 'El instructor será responsable de la preparación y evaluación de los aspirantes y agentes guía. Podrá impartir formación, organizar pruebas prácticas y recomendar la certificación o la repetición de un módulo formativo. No podrá otorgar certificaciones ni imponer medidas fuera de las competencias que le hayan sido concedidas.'
      },
      {
        num: 'Art. 8',
        title: 'Agente Guía K9',
        text: 'El agente guía será el miembro de la unidad autorizado para trabajar con un perro asignado. Deberá mantener el control del animal durante el servicio, respetar los procedimientos establecidos y documentar las intervenciones que así lo requieran.'
      },
      {
        num: 'Art. 9',
        title: 'Aspirante K9',
        text: 'El aspirante será el agente que se encuentre realizando el proceso de formación. Durante este periodo actuará bajo supervisión y no podrá desarrollar de manera independiente funciones para las que todavía no haya sido autorizado.'
      }
    ]
  },
  {
    id: 'norm_03',
    chapter: 'CAPÍTULO III — INGRESO Y PERMANENCIA',
    articles: [
      {
        num: 'Art. 10',
        title: 'Requisitos de acceso',
        text: 'Para solicitar el ingreso en la Unidad K9 será necesario: mantener un historial disciplinario compatible con las responsabilidades de la unidad; conocer los procedimientos policiales básicos; mostrar disponibilidad para participar en la formación; aceptar el presente reglamento; y tener el rango mínimo de Oficial II.'
      },
      {
        num: 'Art. 11',
        title: 'Proceso de selección',
        text: 'El proceso podrá incluir: solicitud formal de ingreso; psicotécnico; revisión de los requisitos; entrevista o valoración del candidato; formación teórica y práctica; evaluación final; y resolución de admisión.'
      },
      {
        num: 'Art. 12',
        title: 'Formación continua',
        text: 'Los agentes guía deberán participar en las sesiones de entrenamiento que establezca la coordinación. La falta reiterada de participación sin justificación podrá dar lugar a una revisión de su habilitación operativa.'
      },
      {
        num: 'Art. 13',
        title: 'Baja de la unidad',
        text: 'La baja podrá producirse por solicitud voluntaria, traslado, pérdida de los requisitos de acceso o decisión disciplinaria adoptada por la autoridad competente. Toda baja deberá registrarse y conllevará la revisión de las autorizaciones y asignaciones correspondientes.'
      }
    ]
  },
  {
    id: 'norm_04',
    chapter: 'CAPÍTULO IV — PERROS ASIGNADOS',
    articles: [
      {
        num: 'Art. 14',
        title: 'Registro canino',
        text: 'Cada perro incorporado a la unidad contará con una ficha de identificación que incluirá: nombre y código identificativo; tipo o raza; agente guía asignado; especialidad autorizada; estado de formación; fecha de incorporación; y observaciones relevantes.'
      },
      {
        num: 'Art. 15',
        title: 'Asignación y responsabilidad',
        text: 'La asignación de un perro deberá quedar registrada. El agente guía será responsable de su control durante el servicio y de comunicar cualquier incidencia relacionada con su utilización. La reasignación de un perro requerirá autorización y actualización del registro.'
      },
      {
        num: 'Art. 16',
        title: 'Especialidades',
        text: 'Las especialidades reconocidas por la unidad podrán incluir rastreo, detección y apoyo operativo. La asignación de una especialidad dependerá de las capacidades reales. No se atribuirán al perro capacidades que no estén disponibles o reconocidas dentro del rol.'
      }
    ]
  },
  {
    id: 'norm_05',
    chapter: 'CAPÍTULO V — DISPOSICIONES FINALES',
    articles: [
      {
        num: 'Art. 17',
        title: 'Incumplimientos',
        text: 'Los incumplimientos del presente reglamento serán comunicados a la coordinación o a la jefatura, según su gravedad. Las medidas correctivas y disciplinarias se aplicarán de acuerdo con la normativa general del Departamento SAPD.'
      },
      {
        num: 'Art. 18',
        title: 'Modificaciones',
        text: 'La coordinación podrá proponer modificaciones para mejorar el funcionamiento de la unidad. Toda modificación que afecte a las normas oficiales deberá ser aprobada por la autoridad competente antes de entrar en vigor.'
      }
    ]
  }
];

const DEFAULT_MANUALS = [
  {
    id: 'man_01',
    title: 'Manual Personal K9 — Programa de Entrenamiento',
    category: 'Formación & Adiestramiento',
    items: [
      { command: 'OBJETIVO', trans: 'Propósito del programa', desc: 'Este programa sirve para practicar el manejo del perro y mejorar la coordinación entre el guía y el K9 antes de participar en intervenciones. El entrenamiento se adaptará a las opciones disponibles en el servidor.' },
      { command: 'FASE 1 — Familiarización', trans: 'Conocer las mecánicas', desc: 'Aprender a manejar el perro y conocer sus mecánicas. Ejercicios: sacar y guardar al perro; caminar con él; comprobar cómo sigue al guía; practicar cómo detenerlo y hacerlo regresar; aprender a utilizar el menú K9. Criterio: el guía puede manejar al perro sin perderlo ni activar órdenes por error.' },
      { command: 'FASE 2 — Obediencia', trans: 'Control en servicio', desc: 'Controlar al perro durante el servicio. Ejercicios: permanecer quieto mientras el guía se desplaza; seguir al guía durante una patrulla; regresar cuando se le ordene; permanecer junto al agente durante una conversación; repetir las órdenes disponibles hasta conocer su funcionamiento. Criterio: el guía controla al perro en situaciones normales de patrulla.' },
      { command: 'FASE 3 — Trabajo en equipo', trans: 'Coordinación conjunta', desc: 'Coordinar al guía, al perro y a los demás agentes. Ejercicios: avisar por radio antes de desplegar el K9; mantener al perro junto al guía mientras otros agentes hablan; realizar una búsqueda simulada con compañeros; practicar la retirada del perro cuando termine su función; coordinar la actuación sin interrumpir otras escenas.' },
      { command: 'FASE 4A — Simulacro: Control rutinario', trans: 'Patrulla con K9', desc: 'Patrullar con el perro; recibir una solicitud de apoyo; llegar al lugar; mantener al perro controlado; finalizar el servicio.' },
      { command: 'FASE 4B — Simulacro: Búsqueda', trans: 'Localización de sospechoso', desc: 'Recibir información sobre una búsqueda; desplazarse hasta la zona; aplicar la mecánica disponible; comunicar el resultado real del ejercicio.' },
      { command: 'FASE 4C — Simulacro: Apoyo policial', trans: 'Intervención coordinada', desc: 'Recibir una llamada de apoyo; coordinarse con los agentes; desplegar el perro solo si procede; retirarlo al terminar la intervención.' }
    ]
  },
  {
    id: 'man_02',
    title: 'Funciones de la Unidad K9',
    category: 'Operativa & Funciones',
    items: [
      { command: 'FUNCIÓN A — Detección de sustancias', trans: 'Apoyo en controles', desc: 'Cuando el servidor disponga de estas mecánicas, el perro podrá ayudar a localizar sustancias ilegales durante controles o búsquedas autorizadas dentro del rol. Ejemplos: apoyo en controles de vehículos; búsqueda en zonas señaladas durante una investigación.' },
      { command: 'FUNCIÓN B — Seguimiento de sospechosos', trans: 'Rastreo y localización', desc: 'El perro puede ayudar a seguir un rastro dentro de una escena. Si no existe esa mecánica, el seguimiento podrá interpretarse mediante rol acordado con los participantes.' },
      { command: 'FUNCIÓN C — Apoyo en intervenciones', trans: 'Refuerzo policial', desc: 'La presencia del K9 puede ayudar a reforzar una intervención en la que exista un riesgo razonable. No implica que el perro deba atacar ni que se utilice en todas las detenciones.' },
      { command: 'FUNCIÓN D — Patrullaje preventivo', trans: 'Presencia disuasoria', desc: 'El guía podrá patrullar con el perro, realizar comprobaciones rutinarias y estar disponible para apoyar a otras unidades.' },
      { command: 'SERVICIO: Patrulla ordinaria', trans: 'Objetivo: apoyo general', desc: 'Dar apoyo a las unidades policiales durante el patrullaje habitual.' },
      { command: 'SERVICIO: Detección', trans: 'Búsqueda de sustancias', desc: 'Buscar sustancias mediante las mecánicas disponibles en el servidor.' },
      { command: 'SERVICIO: Seguimiento', trans: 'Localización de sospechoso', desc: 'Apoyar la localización de un sospechoso mediante rastreo K9.' },
      { command: 'SERVICIO: Apoyo operativo', trans: 'Intervención de riesgo', desc: 'Colaborar en intervenciones de mayor riesgo junto a otras unidades policiales.' },
      { command: 'LÍMITES DEL K9', trans: 'Lo que NO corresponde', desc: 'El perro no sustituye al agente investigador, no decide por sí mismo si una persona es culpable y no garantiza que una búsqueda vaya a tener éxito.' }
    ]
  },
  {
    id: 'man_03',
    title: 'Guía Práctica de Intervenciones K9',
    category: 'Procedimientos Operativos',
    items: [
      { command: 'PREPARACIÓN', trans: 'Antes del servicio', desc: 'Comprobar que el perro puede desplegarse; comprobar que sabes cómo guardarlo; preparar la radio y el indicativo; confirmar si el servicio requiere alguna especialidad concreta.' },
      { command: 'INTERVENCIÓN A — Patrulla ordinaria', trans: 'Radio: «Central, unidad K9 en servicio»', desc: 'Desplazarte al lugar indicado; informar a los compañeros de que vas acompañado por un K9; mantener al perro controlado mientras recibes información; valorar si el perro es útil para esa intervención; continuar la actuación con el resto de la unidad.' },
      { command: 'INTERVENCIÓN B — Búsqueda de sustancias', trans: 'Radio: «Unidad K9 en posición»', desc: 'Confirmar con los agentes qué se necesita buscar y dónde; informar de que vas a iniciar la búsqueda; utilizar la función correspondiente del script si existe; interpretar el resultado que proporcione la mecánica; comunicar el resultado. IMPORTANTE: no inventar un resultado positivo para justificar una detención.' },
      { command: 'INTERVENCIÓN C — Búsqueda de sospechoso', trans: 'Radio: «Unidad K9 incorporándose a la búsqueda»', desc: 'Recibir la descripción y la última ubicación conocida; coordinarse con los agentes participantes; utilizar las funciones de seguimiento disponibles; comunicar cualquier resultado; mantener al perro controlado durante la localización. Una vez localizado, seguir las instrucciones policiales y las normas del servidor.' },
      { command: 'INTERVENCIÓN D — Apoyo en detención', trans: 'Coordinación con agentes', desc: 'Llegar al lugar y recibir instrucciones; informar de que se dispone del K9; valorar si desplegar al perro es apropiado; mantener la coordinación con los demás agentes; utilizar únicamente las acciones permitidas por el servidor. El perro no debe atacar automáticamente por el mero hecho de que una persona se resista.' },
      { command: 'FINALIZACIÓN DE INTERVENCIÓN', trans: 'Cierre del servicio', desc: 'Guardar al perro mediante el sistema disponible; registrar el entrenamiento o la actuación; comprobar que el perro está listo para el siguiente servicio.' },
      { command: 'PRINCIPIOS DE ROL K9', trans: 'Buenas prácticas', desc: 'Dar protagonismo al trabajo conjunto entre guía y animal; respetar las mecánicas y las normas del servidor; comunicar las actuaciones por radio; no utilizar al perro para forzar resultados; buscar escenas interesantes para todos los participantes, no solo para el guía.' }
    ]
  },
  {
    id: 'man_04',
    title: 'Ficha de Identificación del Binomio K9',
    category: 'Registro & Documentación',
    items: [
      { command: 'DATOS GENERALES', trans: 'Identificación del perro', desc: 'La ficha incluirá: nombre del perro; indicativo K9; raza; sexo; edad dentro del rol; guía asignado; unidad policial; y fecha de incorporación.' },
      { command: 'ESPECIALIDAD', trans: 'Capacidad principal', desc: 'Especialidades reconocidas: detección de sustancias; búsqueda de personas; seguimiento de sospechosos; multipropósito. Cada can puede tener una especialidad secundaria complementaria.' },
      { command: 'NIVEL DE ENTRENAMIENTO', trans: 'Grado de formación', desc: 'Niveles reconocidos: Inicial (fase de familiarización completada); Intermedio (fase de obediencia y trabajo en equipo completadas); Avanzado (todos los simulacros completados y evaluación superada).' },
      { command: 'CAPACIDADES DISPONIBLES', trans: 'Acciones del K9', desc: 'Seguir al guía; sentarse o quedarse quieto; buscar; detectar sustancias; sujetar o morder; regresar al guía. Cada capacidad debe marcarse como disponible o no según las mecánicas reales del servidor.' },
      { command: 'EL BINOMIO', trans: 'Guía + Perro K9', desc: 'El binomio está formado por el agente guía y su perro. Ambos trabajan de manera coordinada y el guía es responsable de controlar al animal durante el servicio. La ficha de cada binomio debe mantenerse actualizada con el historial de servicio.' }
    ]
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ann_01',
    title: 'ACTUALIZACIÓN DE PROTOCOLOS DE MORDIDA Y SUJECIÓN TÁCTICA',
    priority: 'URGENTE',
    date: '24/10/2026',
    author: 'Jefatura K9 - Comandante M. Valdés',
    pinned: true,
    content: 'Se recuerda a todos los Guías Caninos que la orden de ataque "Fass" solo podrá ser emitida bajo amenaza inminente a la vida de los agentes o de terceros tras haber agotado las advertencias radiales y verbales de alto. Tras la neutralización del sospechoso, el comando "Aus" debe ser ejecutado de forma instantánea.'
  },
  {
    id: 'ann_02',
    title: 'CAMPAÑA DE REVISIÓN VETERINARIA TRIMESTRAL & VACUNACIÓN',
    priority: 'OFICIAL',
    date: '20/10/2026',
    author: 'Servicio Veterinario Central K9',
    pinned: false,
    content: 'A partir del lunes 27 de octubre se realizarán los chequeos osteoarticulares y vacunas de refuerzo para todos los canes operativos en el Chenil Central. Todos los guías deberán acudir con la cartilla sanitaria al día.'
  }
];

const DEFAULT_PROMOTIONS = [
  {
    id: 'promo_01',
    agentId: 'ag_carlos',
    agentName: 'Carlos Santana',
    placa: 'K-12',
    oldRank: 'Oficial Guía Canino',
    newRank: 'Instructor & Guía Canino',
    date: '22/10/2026',
    publishedBy: 'Jefatura de División K9',
    citation: 'Por su dedicación excepcional en el adiestramiento y certificación operativa del can Thor (K9-T02), demostrando maestría en técnicas de rastreo y obediencia táctica.'
  }
];

// Estado inicial con datos completos por defecto
let memoryStore = {
  users: [],
  presets: [],
  dogs: DEFAULT_DOGS,
  dogRequests: [],
  announcements: DEFAULT_ANNOUNCEMENTS,
  disciplinary: [],
  reports: [],
  badges: [],
  normatives: DEFAULT_NORMATIVES,
  manuals: DEFAULT_MANUALS,
  promotions: DEFAULT_PROMOTIONS,
  logs: [],
  expelledUserIds: [],
  webhookUrl: null,
  updatedAt: Date.now()
};

// Intento de persistencia local en archivo (/tmp o directorio actual)
const LOCAL_STORE_FILE = process.env.TMPDIR
  ? path.join(process.env.TMPDIR, 'k9_cloud_store.json')
  : path.join('/tmp', 'k9_cloud_store.json');

try {
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      memoryStore = Object.assign({}, memoryStore, parsed);
    }
  }
} catch (e) {
  // Ignorar fallos de fs en entornos de solo lectura
}

function saveLocalFile(data) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data), 'utf8');
  } catch (e) {
    // Silencioso
  }
}

function mergeDatasets(existing, incoming) {
  if (!existing) existing = {};
  if (!incoming) return existing;

  const result = Object.assign({}, existing);

  // 0. Lista de usuarios expulsados (autoritativa si incoming la envía, permitiendo readmisiones)
  if (Array.isArray(incoming.expelledUserIds)) {
    result.expelledUserIds = incoming.expelledUserIds;
  } else if (!Array.isArray(result.expelledUserIds)) {
    result.expelledUserIds = [];
  }
  const expelledSet = new Set(result.expelledUserIds);

  // 1. Directorio de usuarios: autoritativo si incoming lo envía
  if (Array.isArray(incoming.users)) {
    result.users = incoming.users;
  }

  // 2. Presets de Jefatura
  if (Array.isArray(incoming.presets)) {
    result.presets = incoming.presets.filter(p => !expelledSet.has(p.discordId));
  }

  // 3. Canes K9
  if (Array.isArray(incoming.dogs) && incoming.dogs.length > 0) {
    result.dogs = incoming.dogs;
  } else if (!result.dogs || result.dogs.length === 0) {
    result.dogs = DEFAULT_DOGS;
  }

  // 4. Solicitudes de Canes
  if (Array.isArray(incoming.dogRequests)) {
    result.dogRequests = incoming.dogRequests;
  }

  // 5. Expedientes Disciplinarios
  if (Array.isArray(incoming.disciplinary)) {
    result.disciplinary = incoming.disciplinary;
  }

  // 6. Informes Semanales
  if (Array.isArray(incoming.reports)) {
    result.reports = incoming.reports;
  }

  // 7. Comunicados oficiales
  if (Array.isArray(incoming.announcements)) {
    result.announcements = incoming.announcements;
  }

  // 8. Mensajes de Chat de Despacho
  if (Array.isArray(incoming.chatMessages)) {
    result.chatMessages = incoming.chatMessages.slice(-60);
  }

  // 9. Badges e insignias
  if (Array.isArray(incoming.badges) && incoming.badges.length > 0) {
    result.badges = incoming.badges;
  }

  // 10. Normativas Oficiales
  if (Array.isArray(incoming.normatives) && incoming.normatives.length > 0) {
    result.normatives = incoming.normatives;
  } else if (!result.normatives || result.normatives.length === 0) {
    result.normatives = DEFAULT_NORMATIVES;
  }

  // 11. Manuales y Guías
  if (Array.isArray(incoming.manuals) && incoming.manuals.length > 0) {
    result.manuals = incoming.manuals;
  } else if (!result.manuals || result.manuals.length === 0) {
    result.manuals = DEFAULT_MANUALS;
  }

  // 12. Ascensos Oficiales
  if (Array.isArray(incoming.promotions)) {
    result.promotions = incoming.promotions;
  }

  // 13. Logs tácticos internos: Asignación directa (permite purgar y borrar logs sin que vuelvan)
  if (Array.isArray(incoming.logs)) {
    result.logs = incoming.logs.slice(0, 150);
  }

  // 14. Webhook URL
  if (incoming.webhookUrl) {
    result.webhookUrl = incoming.webhookUrl;
  }

  result.updatedAt = incoming.updatedAt || Date.now();
  return result;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Si existe Vercel KV o Upstash Redis configurado
  if (kvUrl && kvToken) {
    try {
      if (req.method === 'POST' || req.method === 'PUT') {
        const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        const getRes = await fetch(`${kvUrl}/get/k9_shared_database`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getJson = await getRes.json();
        let existing = {};
        if (getJson && getJson.result) {
          existing = typeof getJson.result === 'string' ? JSON.parse(getJson.result) : getJson.result;
        }

        const merged = mergeDatasets(existing, incoming);
        memoryStore = merged;
        saveLocalFile(merged);

        await fetch(`${kvUrl}/set/k9_shared_database`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(merged)
        });

        return res.status(200).json({ ok: true, source: 'kv_merged', data: merged });
      } else {
        const getRes = await fetch(`${kvUrl}/get/k9_shared_database`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getJson = await getRes.json();
        let data = null;
        if (getJson && getJson.result) {
          data = typeof getJson.result === 'string' ? JSON.parse(getJson.result) : getJson.result;
        }
        return res.status(200).json(data || memoryStore || {});
      }
    } catch (err) {
      console.error('[API Sync KV Error]:', err);
    }
  }

  // Fallback: Memoria del proceso Serverless con guardado en archivo local
  if (req.method === 'POST' || req.method === 'PUT') {
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    memoryStore = mergeDatasets(memoryStore, incoming);
    saveLocalFile(memoryStore);
    return res.status(200).json({ ok: true, source: 'memory_merged', data: memoryStore });
  }

  return res.status(200).json(memoryStore || {});
};
