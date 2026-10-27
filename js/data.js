/**
 * UNIDAD CANINA K9 - DATA STORE & PERSISTENCE
 * Base de datos táctica de agentes, canes, informes semanales, faltas, insignias y normativas.
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'k9_current_user_id',
  USERS: 'k9_data_users',
  DOGS: 'k9_data_dogs',
  REPORTS: 'k9_data_reports',
  DISCIPLINARY: 'k9_data_disciplinary',
  BADGES: 'k9_data_badges',
  ANNOUNCEMENTS: 'k9_data_announcements',
  NORMATIVES: 'k9_data_normatives',
  MANUALS: 'k9_data_manuals',
  DISCORD_CONFIG: 'k9_discord_config',
  DOG_REQUESTS: 'k9_dog_requests',
  AGENT_PRESETS: 'k9_agent_presets',
  CHAT_MESSAGES: 'k9_chat_messages',
  PROMOTIONS: 'k9_data_promotions',
  LOGS: 'k9_data_logs',
  EXPELLED_USERS: 'k9_expelled_users',
  LAST_UPDATE: 'k9_last_local_update',
  TASKS: 'k9_data_tasks',
  EVENTS: 'k9_data_events',
  NOTIFICATIONS: 'k9_data_notifications',
  UNIFORMS: 'k9_data_uniforms',
  MAP_MARKERS: 'k9_data_map_markers'
};
if (typeof window !== 'undefined') window.STORAGE_KEYS = STORAGE_KEYS;

// Mensajes por defecto del chat de despacho con Jefatura
const DEFAULT_CHAT_MESSAGES = [
  {
    id: 'msg_welcome',
    authorId: 'jefatura_k01',
    authorName: 'Coordinador K9',
    authorPlaca: 'K-01',
    authorRank: 'Coordinador K9',
    authorAvatar: 'assets/images/emblem.jpg',
    isJefatura: true,
    text: 'Canal oficial de despacho de la Jefatura K9 abierto. Los miembros de la división pueden utilizar este espacio para comunicarse directamente con los mandos, realizar consultas operativas o coordinar patrullajes.',
    timestamp: 'Oficial · Despacho K9'
  }
];

// Lista Maestra de Permisos de Jefatura
const SYSTEM_PERMISSIONS = [
  { id: 'view_jefatura', label: 'Acceso a Panel Jefatura', desc: 'Permite visualizar y entrar al centro de mando de jefatura' },
  { id: 'manage_reports', label: 'Informes Semanales', desc: 'Crear, revisar, calificar y aprobar informes de patrulla y rendimiento' },
  { id: 'manage_agents', label: 'Directorio de Agentes', desc: 'Dar de alta agentes, editar rangos, placas y estados de servicio' },
  { id: 'manage_k9', label: 'Gestión Canina K9', desc: 'Registrar canes, editar fichas médicas, adiestramiento y asignación' },
  { id: 'manage_disciplinary', label: 'Régimen Disciplinario', desc: 'Aperturar expedientes de faltas leves, graves o muy graves y aplicar sanciones' },
  { id: 'manage_badges', label: 'Condecoraciones & Insignias', desc: 'Otorgar o revocar medallas oficiales a los miembros con citación' },
  { id: 'manage_bulletins', label: 'Anuncios & Normativas', desc: 'Publicar anuncios oficiales de jefatura y actualizar reglamentos/manuales' },
  { id: 'manage_permissions', label: 'Administrar Permisos', desc: 'Modificar la matriz de permisos de los agentes y coordinadores' }
];

// Insignias Oficiales de la Unidad K9
const DEFAULT_BADGES = [
  {
    id: 'badge_valor',
    name: 'Cruz de Honor al Valor K9',
    category: 'Máximo Honor',
    image: 'assets/images/medal_valor.jpg',
    desc: 'Condecoración suprema otorgada por actos de heroísmo excepcional e intervención directa salvando vidas en binomio.',
    ribbonColor: '#ffd166'
  },
  {
    id: 'badge_master',
    name: 'Maestro Guía Canino',
    category: 'Especialidad',
    image: 'assets/images/emblem.jpg',
    desc: 'Distintivo de maestría por haber liderado más de 100 intervenciones operativas caninas con éxito sin incidentes.',
    ribbonColor: '#00e5ff'
  },
  {
    id: 'badge_ied',
    name: 'Especialista Detección TEDAX/IED',
    category: 'Técnica',
    image: 'assets/images/emblem.jpg',
    desc: 'Certificación de élite en rastreo y localización de explosivos, trampas de impacto y artificios pirotécnicos.',
    ribbonColor: '#ff2a5f'
  },
  {
    id: 'badge_tccc',
    name: 'Primeros Auxilios TCCC-K9',
    category: 'Médica',
    image: 'assets/images/emblem.jpg',
    desc: 'Capacitación acreditada en soporte vital y estabilización médica de combate para el can en zona hostil.',
    ribbonColor: '#00e676'
  },
  {
    id: 'badge_tactical',
    name: 'Fuerza de Choque & Neutralización',
    category: 'Operativa',
    image: 'assets/images/hero_dog.jpg',
    desc: 'Aptitud táctica demostrada en entradas de asalto, reducción de tiradores activos y contención perimetral.',
    ribbonColor: '#7209b7'
  },
  {
    id: 'badge_veteran',
    name: 'Escudo de Lealtad & Mando K9',
    category: 'Jefatura',
    image: 'assets/images/emblem.jpg',
    desc: 'Otorgado a mandos y coordinadores por su dedicación ejemplar, ética intachable y dirección de la unidad.',
    ribbonColor: '#f77f00'
  }
];

// Perros K9 de la Unidad
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

// Agentes de la Unidad K9 (Inician vacíos hasta autenticación con Discord)
const DEFAULT_USERS = [];

// Informes Semanales de Agentes (Inician vacíos hasta registro de servicios)
const DEFAULT_REPORTS = [];

// Régimen Disciplinario / Faltas (Inician vacíos)
const DEFAULT_DISCIPLINARY = [];

// Anuncios Oficiales de Jefatura
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
  },
  {
    id: 'ann_03',
    title: 'APERTURA DE CONVOCATORIA PARA ASPIRANTES A GUÍAS CANINOS',
    priority: 'INFORMATIVO',
    date: '15/10/2026',
    author: 'Coordinación de Formación e Instrucción',
    pinned: false,
    content: 'Se abre el plazo de inscripción para oficiales del cuerpo que deseen optar a la plaza de Guía Canino en la especialidad de Detección de Acelerantes y Rastreo. Pruebas físicas y de afinidad canina darán comienzo el próximo mes.'
  }
];

// Ascensos Oficiales publicados por Jefatura
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

// Registro de Logs tácticos internos (solo visible para Jefatura)
const DEFAULT_LOGS = [
  {
    id: 'log_init_01',
    type: 'config',
    emoji: '⚙️',
    title: 'Portal K9 Inicializado',
    description: 'Sistema táctico de Jefatura K9 operativo y conectado a la red departamental.',
    author: 'Jefatura K9',
    timestamp: new Date().toISOString(),
    displayTime: '24/10/2026 10:00:00'
  }
];

// Normativas Oficiales K9 - Reglamento General LSPD Unidad Canina
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

// Manuales de Instrucción, Adiestramiento y Guías Operativas
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

// Preset de Jefatura predefinido para Discord IDs oficiales
const DEFAULT_AGENT_PRESETS = [
  {
    discordId: '578954458948698122',
    discordUsername: 'Jefatura K9',
    placa: 'K-01',
    rank: 'Coordinador K9',
    isJefatura: true,
    permissions: ['*'],
    serviceStatus: 'En Activo / Mando',
    createdAt: '25/10/2026'
  },
  {
    discordId: '760159743616090164',
    discordUsername: 'Coordinador K9',
    placa: 'K-01',
    rank: 'Coordinador K9',
    isJefatura: true,
    permissions: ['*'],
    serviceStatus: 'En Activo / Mando',
    createdAt: '25/10/2026'
  }
];

// Tareas tácticas por defecto (personales y oficiales)
const DEFAULT_TASKS = [
  {
    id: 'task_def_01',
    userId: 'all',
    agentName: 'Toda la Unidad',
    title: 'Inspección de equipamiento y arneses tácticos K9',
    description: 'Comprobar mosquetones, linternas tácticas para perro y chalecos balísticos antes del despliegue del fin de semana.',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    priority: 'urgente',
    status: 'pendiente',
    category: 'operativa',
    type: 'oficial',
    createdBy: 'Jefatura K9',
    creatorPlaca: 'K-01',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: null,
    inAgenda: false
  },
  {
    id: 'task_def_02',
    userId: 'all',
    agentName: 'Guías Caninos',
    title: 'Revisión y pesaje trimestral en clínica veterinaria',
    description: 'Actualizar la cartilla sanitaria del can asignado, comprobar peso, desparasitación y estado de almohadillas.',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    priority: 'alta',
    status: 'pendiente',
    category: 'veterinaria',
    type: 'oficial',
    createdBy: 'Jefatura K9',
    creatorPlaca: 'K-01',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    completedAt: null,
    inAgenda: false
  }
];

// Eventos y agenda de servicio por defecto
const DEFAULT_EVENTS = [
  {
    id: 'event_def_01',
    userId: 'all',
    title: 'Simulacro de búsqueda y rescate en estructuras colapsadas',
    description: 'Entrenamiento conjunto con bomberos y guías caninos en la zona portuaria.',
    date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    time: '19:30',
    location: 'Sector Portuario / Terminal B',
    category: 'adiestramiento',
    type: 'oficial',
    createdAt: new Date().toISOString()
  }
];

// Notificaciones por defecto
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_def_01',
    recipientId: 'all',
    title: '📢 Centro de Tareas y Buscador Global Habilitados',
    message: 'Ya puedes organizar tus tareas operativas, convertirlas en eventos de agenda y utilizar el buscador global (Ctrl + K).',
    category: 'avisos',
    type: 'aviso_oficial',
    targetView: 'tareas',
    targetSubtab: null,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Catálogo Oficial de Vestimenta & Uniformidad K9
const DEFAULT_UNIFORMS = [
  {
    id: 'unif_01',
    title: 'Uniforme de Patrulla Ordinaria K9',
    category: 'Patrulla Ordinaria',
    description: 'Equipamiento estándar de servicio en vehículo y a pie. Incluye funda antihurto, chaleco balístico ergonómico y arnés de patrulla rápida para el can.',
    image: 'assets/images/k9_patrol_officers.jpg',
    authorizedRanks: 'Todos los Guías Caninos',
    pinned: true,
    components: [
      'Polo táctico azul marino con insignia K9 Unit en pecho y espalda',
      'Pantalón táctico reforzado en rodillas (Ripstop 5.11)',
      'Chaleco balístico exterior nivel IIIA con porta-emisora y linterna',
      'Cinturón de dotación con funda Safariland y correa canina de sujeción rápida',
      'Arnés reflectante K-9 Police para el can detector'
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unif_02',
    title: 'Indumentaria de Intervención Táctica & Asalto',
    category: 'Intervención Táctica',
    description: 'Uniformidad reforzada para allanamientos, controles de alto riesgo, entradas en naves industriales y operativos de asalto con canes de presa.',
    image: 'assets/images/hero_dog.jpg',
    authorizedRanks: 'Agente Guia, Instructor K9, Subcoordinador K9, Coordinador K9',
    pinned: true,
    components: [
      'Mono táctico ignífugo negro con velcro para parches de identificación',
      'Chaleco porta-placas táctico pesado con camelbak integrado',
      'Casco balístico FAST con montura para cámara táctica',
      'Gafas de protección balística y guantes anticorte',
      'Arnés táctico canino con asa de elevación y placa balística canina',
      'Bolsa táctica de pernera con botiquín hemostático TCCC-K9'
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unif_03',
    title: 'Indumentaria de Adiestramiento & Cuidados de Chenil',
    category: 'Adiestramiento / Chenil',
    description: 'Equipamiento para sesiones de obediencia, mordida táctica, ejercicios de rastro en campo y mantenimiento diario del can.',
    image: 'assets/images/k9_rex.jpg',
    authorizedRanks: 'Todos los miembros acreditados',
    pinned: false,
    components: [
      'Polo táctico transpirable K9 Unit alta visibilidad / oscuro',
      'Pantalón de faena resistente a manchas y mordiscos superficiales',
      'Chaleco de adiestramiento con bolsillos para señuelos, premios y mordedores',
      'Manga de mordida y traje de protección integral (cuando proceda)',
      'Correa de rastreo larga de 10 metros y arnés de tracción canino'
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unif_04',
    title: 'Uniforme de Gala & Protocolo Policial',
    category: 'Gala & Ceremonial',
    description: 'Indumentaria de etiqueta para ceremonias oficiales, entrega de despachos, medallas y homenajes oficiales.',
    image: 'assets/images/emblem.jpg',
    authorizedRanks: 'Agente Guia, Instructor K9, Subcoordinador K9, Coordinador K9, Jefatura LSPD',
    pinned: false,
    components: [
      'Guerrera de gala azul oscuro con distintivos dorados de la División K9',
      'Pantalón recto de gala con vivos reglamentarios',
      'Gorra de plato policial con escarapela metálica dorada',
      'Guantes blancos ceremoniales',
      'Pasador de condecoraciones y medallas en el pecho',
      'Corbata negra y cordón de mando (según rango)'
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'unif_05',
    title: 'Uniformidad de Alto Mando & Staff LSPD',
    category: 'Mando & Jefatura',
    description: 'Vestimenta distintiva para Jefatura de División y Mandos Superiores de la LSPD en supervisión de unidades caninas.',
    image: 'assets/images/emblem.jpg',
    authorizedRanks: 'Subcoordinador K9, Coordinador K9, Jefatura LSPD',
    pinned: false,
    components: [
      'Camisa de mando blanca / azul noche con hombreras de rango dorado',
      'Placa dorada de Jefatura LSPD y distintivos de mando supremo',
      'Chaleco ejecutivo de supervisión táctica con leyenda JEFATURA',
      'Distintivo dorado de Coordinación Suprema K9 / LSPD'
    ],
    updatedAt: new Date().toISOString()
  }
];

// Puntos tácticos y entrenamientos en el Mapa de Los Santos
const DEFAULT_MAP_MARKERS = [
  {
    id: 'marker_k9_hq',
    title: 'Base Central de Operaciones K9 · Comisaría Mission Row',
    category: 'base',
    description: 'Cuartel general de la División Canina K9. Perreras climatizadas, sala de briefing táctico y armero oficial.',
    date: 'Permanente',
    time: '24/7',
    lat: -700,
    lng: 380,
    priority: 'oficial',
    status: 'en_curso',
    guides: 'Toda la plantilla K9',
    author: 'Jefatura K9',
    createdBy: 'Jefatura K9',
    createdAt: new Date().toISOString()
  },
  {
    id: 'marker_k9_train',
    title: 'Campo de Adiestramiento y Pistas K9 · Sandy Shores',
    category: 'entrenamiento',
    description: 'Circuito de saltos y obstáculos, detección de narcóticos y explosivos en naves industriales, y prácticas de presa y mordida controlada.',
    date: 'Miércoles y Sábados',
    time: '19:00',
    lat: -280,
    lng: 520,
    priority: 'importante',
    status: 'programado',
    guides: 'Instructores y Guías K9',
    author: 'Jefatura K9',
    createdBy: 'Jefatura K9',
    createdAt: new Date().toISOString()
  },
  {
    id: 'marker_k9_check',
    title: 'Punto de Control Táctico y Filtro K9 · Autovía Del Perro',
    category: 'control',
    description: 'Dispositivo estático de inspección vehicular canina. Búsqueda de sustancias ilícitas y armamento en maleteros y dobles fondos.',
    date: 'Convocatoria Oficial',
    time: '21:30',
    lat: -750,
    lng: 180,
    priority: 'urgente',
    status: 'programado',
    guides: 'Binomios de Intervención',
    author: 'Jefatura K9',
    createdBy: 'Jefatura K9',
    createdAt: new Date().toISOString()
  }
];



// Clase Gestora del Estado
class K9DataStore {
  constructor() {
    this._isInitializing = true;
    try {
      this.init();
    } finally {
      this._isInitializing = false;
    }
  }

  init() {
    const legacyMockIds = ['user_valdes', 'user_navarro', 'user_vega', 'user_morales'];

    // Limpieza de perfiles demo previos en localStorage
    const storedUsers = this.get(STORAGE_KEYS.USERS);
    if (Array.isArray(storedUsers)) {
      const filtered = storedUsers.filter(u => !legacyMockIds.includes(u.id));
      this.save(STORAGE_KEYS.USERS, filtered);
    } else {
      this.save(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }

    // Si había una sesión de demo activa, desconectarla
    const currentUid = this.get(STORAGE_KEYS.CURRENT_USER);
    if (currentUid && (legacyMockIds.includes(currentUid) || currentUid === 'user_valdes')) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    // Perros K9
    if (!localStorage.getItem(STORAGE_KEYS.DOGS)) {
      this.save(STORAGE_KEYS.DOGS, DEFAULT_DOGS);
    } else {
      const storedDogs = this.get(STORAGE_KEYS.DOGS);
      if (Array.isArray(storedDogs)) {
        let modified = false;
        storedDogs.forEach(d => {
          if (legacyMockIds.includes(d.handlerId)) {
            d.handlerId = null;
            d.handlerName = 'Pendiente de Asignación';
            modified = true;
          }
        });
        if (modified) this.save(STORAGE_KEYS.DOGS, storedDogs);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      this.save(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISCIPLINARY)) {
      this.save(STORAGE_KEYS.DISCIPLINARY, DEFAULT_DISCIPLINARY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BADGES)) {
      this.save(STORAGE_KEYS.BADGES, DEFAULT_BADGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      this.save(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NORMATIVES)) {
      this.save(STORAGE_KEYS.NORMATIVES, DEFAULT_NORMATIVES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MANUALS)) {
      this.save(STORAGE_KEYS.MANUALS, DEFAULT_MANUALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
      this.save(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      this.save(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      this.save(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.save(STORAGE_KEYS.EVENTS, DEFAULT_EVENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.save(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.UNIFORMS)) {
      this.save(STORAGE_KEYS.UNIFORMS, DEFAULT_UNIFORMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAP_MARKERS)) {
      this.save(STORAGE_KEYS.MAP_MARKERS, DEFAULT_MAP_MARKERS);
    }

    // Asegurar que el ID oficial de Jefatura nunca esté en la lista de expulsados
    let expelled = this.get(STORAGE_KEYS.EXPELLED_USERS);
    if (Array.isArray(expelled) && expelled.includes('578954458948698122')) {
      expelled = expelled.filter(id => id !== '578954458948698122');
      this.save(STORAGE_KEYS.EXPELLED_USERS, expelled);
    }

    // Función de normalización de rangos oficiales K9 y Staff LSPD:
    const normalizeK9Rank = (r) => {
      if (!r) return 'Sin Rango';
      const s = String(r).trim();
      if (s.includes('LSPD') || s.includes('Staff') || s.includes('Jefe de Policía')) return 'Jefatura LSPD';
      if (s.includes('Jefe de División') || s.includes('Coordinador K9') || s === 'Coordinador K9') return 'Coordinador K9';
      if (s.includes('Subjefe') || s.includes('Subcoordinador') || s.includes('Inspector') || s.includes('Coordinador Operativo')) return 'Subcoordinador K9';
      if (s.includes('Instructor') || s.includes('Instuctor')) return 'Instructor K9';
      if (s.includes('Oficial') || s.includes('Guía') || s.includes('Guia') || s === 'Agente Guia' || s === 'Agente Guía') return 'Agente Guia';
      if (s.includes('Aspirante')) return 'Aspirante K9';
      if (s === 'Sin Rango' || s.includes('Sin Rango')) return 'Sin Rango';
      return s;
    };

    // Asegurar que los presets de Jefatura oficial siempre estén presentes y activos con rangos actualizados
    const existingPresets = this.get(STORAGE_KEYS.AGENT_PRESETS) || [];
    const adminIds = ['578954458948698122', '760159743616090164'];
    let presetsModified = false;

    // Normalizar rangos de todos los presets existentes
    existingPresets.forEach(p => {
      const normalized = normalizeK9Rank(p.rank);
      if (p.rank !== normalized) {
        p.rank = normalized;
        presetsModified = true;
      }
    });

    adminIds.forEach(admId => {
      const found = existingPresets.find(p => p.discordId === admId);
      if (!found) {
        const def = DEFAULT_AGENT_PRESETS.find(p => p.discordId === admId);
        if (def) {
          existingPresets.unshift(def);
          presetsModified = true;
        }
      } else {
        found.isJefatura = true;
        found.permissions = ['*'];
        found.rank = 'Coordinador K9';
        found.placa = 'K-01';
        presetsModified = true;
      }
    });
    if (presetsModified || !localStorage.getItem(STORAGE_KEYS.AGENT_PRESETS)) {
      localStorage.setItem(STORAGE_KEYS.AGENT_PRESETS, JSON.stringify(existingPresets));
    }

    // Normalizar rangos de todos los agentes existentes y proteger Jefatura
    const usersList = this.get(STORAGE_KEYS.USERS);
    if (Array.isArray(usersList)) {
      let modUsers = false;
      usersList.forEach(u => {
        const norm = normalizeK9Rank(u.rank);
        if (u.rank !== norm) {
          u.rank = norm;
          modUsers = true;
        }
        if (u.discordId === '578954458948698122' || u.discordId === '760159743616090164') {
          u.isExpelled = false;
          u.isJefatura = true;
          u.isVerified = true;
          u.rank = 'Coordinador K9';
          u.placa = 'K-01';
          u.serviceStatus = 'En Activo / Mando';
          u.permissions = ['*'];
          modUsers = true;
        }
      });
      if (modUsers) {
        this.save(STORAGE_KEYS.USERS, usersList);
      }
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      if (key !== STORAGE_KEYS.CURRENT_USER) {
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
        // NO sincronizar a la nube durante la inicialización interna del dataStore
        if (this._isInitializing) return;

        // Sincronizar automáticamente en la nube cuando se modifica cualquier dato compartido por el usuario local
        if (window.K9CloudSync && !window.K9CloudSync._isApplyingRemote && typeof window.K9CloudSync.schedulePush === 'function') {
          window.K9CloudSync.schedulePush();
        } else if (!window.K9CloudSync && window.K9Supabase && window.K9Supabase.hasInitialPullCompleted && typeof window.K9Supabase.push === 'function' && window.K9Supabase.isConfigured()) {
          window.K9Supabase.push();
        }
      }
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  getLastUpdate() {
    const ts = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    return ts ? parseInt(ts, 10) : 0;
  }

  // Gestión de agentes expulsados (Tombstones y readmisión)
  getExpelledUserIds() {
    const list = this.get(STORAGE_KEYS.EXPELLED_USERS);
    return Array.isArray(list) ? list : [];
  }

  addExpelledUserId(id, discordId) {
    const list = this.getExpelledUserIds();
    let changed = false;
    if (id && !list.includes(id)) { list.push(id); changed = true; }
    if (discordId && !list.includes(discordId)) { list.push(discordId); changed = true; }
    if (changed) {
      this.save(STORAGE_KEYS.EXPELLED_USERS, list);
    }
  }

  removeExpelledUserId(idOrDiscordId) {
    if (!idOrDiscordId) return;
    const list = this.getExpelledUserIds();
    // Encontrar posibles IDs cruzados en la lista de usuarios
    const users = this.get(STORAGE_KEYS.USERS) || [];
    const idsToRemove = [idOrDiscordId];
    users.forEach(u => {
      if (u.id === idOrDiscordId && u.discordId) idsToRemove.push(u.discordId);
      if (u.discordId === idOrDiscordId && u.id) idsToRemove.push(u.id);
    });
    const updated = list.filter(item => !idsToRemove.includes(item));
    if (updated.length !== list.length) {
      this.save(STORAGE_KEYS.EXPELLED_USERS, updated);
    }
  }

  clearExpelledUser(id, discordId) {
    let list = this.getExpelledUserIds();
    const originalLen = list.length;
    const idsToRemove = [];
    if (id) idsToRemove.push(id);
    if (discordId) idsToRemove.push(discordId);

    const users = this.get(STORAGE_KEYS.USERS) || [];
    users.forEach(u => {
      if ((id && u.id === id) || (discordId && u.discordId === discordId)) {
        if (u.id) idsToRemove.push(u.id);
        if (u.discordId) idsToRemove.push(u.discordId);
      }
    });

    list = list.filter(item => !idsToRemove.includes(item));
    if (list.length !== originalLen) {
      this.save(STORAGE_KEYS.EXPELLED_USERS, list);
    }
  }

  isExpelled(id, discordId) {
    if (id === '578954458948698122' || discordId === '578954458948698122') return false;
    if (id === '760159743616090164' || discordId === '760159743616090164') return false;
    const list = this.getExpelledUserIds();
    return Boolean((id && list.includes(id)) || (discordId && list.includes(discordId)));
  }

  // Métodos de acceso rápido con protección contra listas vacías accidentales
  getAllUsers() {
    return this.get(STORAGE_KEYS.USERS) || [];
  }

  getUsers(includeExpelled = false) {
    const users = this.get(STORAGE_KEYS.USERS) || [];
    if (includeExpelled) return users;
    return users.filter(u => !u.isExpelled && !this.isExpelled(u.id, u.discordId));
  }

  getDogs() {
    const dogs = this.get(STORAGE_KEYS.DOGS);
    return (Array.isArray(dogs) && dogs.length > 0) ? dogs : DEFAULT_DOGS;
  }

  getReports() { return this.get(STORAGE_KEYS.REPORTS) || []; }
  getDisciplinary() { return this.get(STORAGE_KEYS.DISCIPLINARY) || []; }
  getBadges() { return this.get(STORAGE_KEYS.BADGES) || DEFAULT_BADGES; }
  getAnnouncements() { return this.get(STORAGE_KEYS.ANNOUNCEMENTS) || DEFAULT_ANNOUNCEMENTS; }

  getNormatives() {
    const norms = this.get(STORAGE_KEYS.NORMATIVES);
    return (Array.isArray(norms) && norms.length > 0) ? norms : DEFAULT_NORMATIVES;
  }

  getManuals() {
    const manuals = this.get(STORAGE_KEYS.MANUALS);
    return (Array.isArray(manuals) && manuals.length > 0) ? manuals : DEFAULT_MANUALS;
  }

  getDogRequests() { return this.get(STORAGE_KEYS.DOG_REQUESTS) || []; }
  getAgentPresets() {
    const presets = this.get(STORAGE_KEYS.AGENT_PRESETS) || DEFAULT_AGENT_PRESETS;
    const expelled = this.getExpelledUserIds();
    return presets.filter(p => !expelled.includes(p.discordId));
  }
  getChatMessages() { return this.get(STORAGE_KEYS.CHAT_MESSAGES) || DEFAULT_CHAT_MESSAGES; }
  getPromotions() { return this.get(STORAGE_KEYS.PROMOTIONS) || DEFAULT_PROMOTIONS; }
  getLogs() {
    const logs = this.get(STORAGE_KEYS.LOGS);
    // Si la clave existe en localStorage como un array (incluso vacío []), respetarlo
    return Array.isArray(logs) ? logs : DEFAULT_LOGS;
  }

  addLog(entry) {
    try {
      const logs = this.getLogs();
      const now = new Date();
      const newEntry = Object.assign({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: 'info',
        emoji: 'ℹ️',
        title: 'Registro de Actividad',
        description: '',
        author: 'Sistema K9',
        timestamp: now.toISOString(),
        displayTime: now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('es-ES')
      }, entry);
      const updated = [newEntry, ...logs].slice(0, 150);
      this.save(STORAGE_KEYS.LOGS, updated);
      return newEntry;
    } catch (e) {
      console.warn('Error recording log:', e);
    }
  }

  getCurrentUserId() {
    return this.get(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('k9_auth_discord_id') || null;
  }

  getCurrentUser() {
    const id = this.getCurrentUserId();
    const discordId = localStorage.getItem('k9_auth_discord_id');
    if (!id && !discordId) return null;

    const allUsers = this.getAllUsers();
    // 1. Buscar por ID interno del sistema
    let user = id ? allUsers.find(u => u.id === id) : null;
    // 2. Si no se encuentra, buscar por Discord ID guardado
    if (!user && (discordId || id)) {
      const searchDiscordId = discordId || id;
      user = allUsers.find(u => u.discordId === searchDiscordId);
    }
    // 3. Sincronizar identificadores si difieren para mantener consistencia
    if (user) {
      if (user.id && user.id !== id) {
        this.save(STORAGE_KEYS.CURRENT_USER, user.id);
      }
      if (user.discordId && user.discordId !== discordId) {
        localStorage.setItem('k9_auth_discord_id', user.discordId);
      }
    }
    return user || null;
  }

  setCurrentUser(id, discordId = null) {
    if (id) {
      this.save(STORAGE_KEYS.CURRENT_USER, id);
      if (discordId) {
        localStorage.setItem('k9_auth_discord_id', discordId);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('k9_auth_discord_id');
    }
  }

  // ─── CENTRO DE TAREAS ───
  getRawTasks() {
    const tasks = this.get(STORAGE_KEYS.TASKS);
    return Array.isArray(tasks) ? tasks : DEFAULT_TASKS;
  }

  getTasks(user = null) {
    const list = this.getRawTasks();
    if (!user) {
      return list.filter(t => t.type === 'oficial' || t.userId === 'all');
    }
    return list.filter(t => {
      // Tareas oficiales visibles para toda la unidad
      if (t.type === 'oficial' || t.userId === 'all') return true;
      // Tareas personales estrictamente privadas: solo para el usuario propietario
      if (t.userId === user.id || (user.discordId && t.userId === user.discordId)) return true;
      return false;
    });
  }

  saveTask(taskData) {
    const list = this.getRawTasks();
    let savedItem = null;
    if (taskData.id) {
      const idx = list.findIndex(t => t.id === taskData.id);
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], taskData, { updatedAt: new Date().toISOString() });
        savedItem = list[idx];
      }
    }
    if (!savedItem) {
      savedItem = Object.assign({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: 'Nueva Tarea',
        description: '',
        dueDate: null,
        priority: 'normal',
        status: 'pendiente',
        category: 'operativa',
        type: 'personal',
        createdAt: new Date().toISOString(),
        completedAt: null,
        inAgenda: false
      }, taskData);
      list.unshift(savedItem);
    }
    this.save(STORAGE_KEYS.TASKS, list);
    return savedItem;
  }

  deleteTask(taskId, currentUserId, isJefatura = false) {
    const list = this.getRawTasks();
    const item = list.find(t => t.id === taskId);
    if (!item) return false;
    const isOwner = item.userId === currentUserId || (item.createdBy && item.createdBy === currentUserId);
    if (!isOwner && !(isJefatura && item.type === 'oficial')) {
      return false;
    }
    const filtered = list.filter(t => t.id !== taskId);
    this.save(STORAGE_KEYS.TASKS, filtered);
    return true;
  }

  toggleTaskComplete(taskId, currentUserId) {
    const list = this.getRawTasks();
    const item = list.find(t => t.id === taskId);
    if (!item) return null;
    if (item.status === 'completada') {
      item.status = 'pendiente';
      item.completedAt = null;
    } else {
      item.status = 'completada';
      item.completedAt = new Date().toISOString();
    }
    this.save(STORAGE_KEYS.TASKS, list);
    return item;
  }

  // ─── EVENTOS Y AGENDA ───
  getRawEvents() {
    const events = this.get(STORAGE_KEYS.EVENTS);
    return Array.isArray(events) ? events : DEFAULT_EVENTS;
  }

  getEvents(user = null) {
    const list = this.getRawEvents();
    // Toda la plantilla de la Unidad K9 puede consultar los eventos de la agenda operativa
    return list;
  }

  saveEvent(eventData) {
    const list = this.getRawEvents();
    let savedItem = null;
    if (eventData.id) {
      const idx = list.findIndex(e => e.id === eventData.id);
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], eventData);
        savedItem = list[idx];
      }
    }
    if (!savedItem) {
      savedItem = Object.assign({
        id: 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        type: 'personal'
      }, eventData);
      list.push(savedItem);
    }
    this.save(STORAGE_KEYS.EVENTS, list);
    return savedItem;
  }

  deleteEvent(eventId, currentUserId) {
    const list = this.getRawEvents();
    const filtered = list.filter(e => e.id !== eventId);
    this.save(STORAGE_KEYS.EVENTS, filtered);
    return true;
  }

  // ─── CENTRO DE NOTIFICACIONES ───
  getRawNotifications() {
    const notifs = this.get(STORAGE_KEYS.NOTIFICATIONS);
    return Array.isArray(notifs) ? notifs : DEFAULT_NOTIFICATIONS;
  }

  getNotifications(user = null) {
    const list = this.getRawNotifications();
    if (!user) return list.filter(n => n.recipientId === 'all');
    const isJef = user.isJefatura || (user.permissions && user.permissions.includes('*'));
    return list.filter(n => {
      if (n.recipientId === 'all') return true;
      if (n.recipientId === 'jefatura' && isJef) return true;
      if (n.recipientId === user.id || (user.discordId && n.recipientId === user.discordId)) return true;
      return false;
    });
  }

  saveNotification(notifData) {
    const list = this.getRawNotifications();
    const item = Object.assign({
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: 'Notificación',
      message: '',
      category: 'general',
      type: 'aviso_oficial',
      targetView: null,
      targetSubtab: null,
      isRead: false,
      createdAt: new Date().toISOString()
    }, notifData);
    list.unshift(item);
    this.save(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 80));
    return item;
  }

  markNotificationRead(notifId, currentUserId) {
    const list = this.getRawNotifications();
    const item = list.find(n => n.id === notifId);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      this.save(STORAGE_KEYS.NOTIFICATIONS, list);
    }
    return item;
  }

  markAllNotificationsRead(currentUserId) {
    const list = this.getRawNotifications();
    let count = 0;
    list.forEach(n => {
      const match = n.recipientId === 'all' || (currentUserId && n.recipientId === currentUserId);
      if (match && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) {
      this.save(STORAGE_KEYS.NOTIFICATIONS, list);
    }
    return count;
  }

  deleteNotification(notifId, currentUserId) {
    const list = this.getRawNotifications();
    const filtered = list.filter(n => n.id !== notifId);
    this.save(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return true;
  }

  // ─── CÓDIGO DE VESTIMENTA & UNIFORMIDAD K9 ───
  getUniforms() {
    const list = this.get(STORAGE_KEYS.UNIFORMS);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_UNIFORMS;
  }

  saveUniform(uniformData) {
    const list = [...this.getUniforms()];
    const index = list.findIndex(u => u.id === uniformData.id);
    const item = Object.assign({
      id: 'unif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: 'Uniforme K9',
      category: 'Patrulla Ordinaria',
      description: '',
      image: 'assets/images/k9_patrol_officers.jpg',
      components: [],
      authorizedRanks: 'Todos los Guías Caninos',
      pinned: false,
      updatedAt: new Date().toISOString()
    }, uniformData);

    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    this.save(STORAGE_KEYS.UNIFORMS, list);
    return item;
  }

  deleteUniform(uniformId) {
    const list = this.getUniforms().filter(u => u.id !== uniformId);
    this.save(STORAGE_KEYS.UNIFORMS, list);
    return true;
  }

  togglePinUniform(uniformId) {
    const list = [...this.getUniforms()];
    const item = list.find(u => u.id === uniformId);
    if (item) {
      item.pinned = !item.pinned;
      item.updatedAt = new Date().toISOString();
      this.save(STORAGE_KEYS.UNIFORMS, list);
      return item.pinned;
    }
    return false;
  }

  // ─── MAPA TÁCTICO DE LOS SANTOS (OPERACIONES & ENTRENAMIENTOS) ───
  getMapMarkers() {
    const list = this.get(STORAGE_KEYS.MAP_MARKERS);
    return Array.isArray(list) ? list : DEFAULT_MAP_MARKERS;
  }

  saveMapMarker(markerData) {
    const list = [...this.getMapMarkers()];
    const index = list.findIndex(m => m.id === markerData.id);
    const item = Object.assign({
      id: 'marker_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: 'Punto Operativo K9',
      category: 'entrenamiento',
      description: '',
      date: 'Fecha por definir',
      time: 'Hora por definir',
      lat: -155.5,
      lng: 118.2,
      priority: 'oficial',
      status: 'programado',
      guides: 'Toda la plantilla K9',
      author: 'Jefatura K9',
      createdBy: 'Jefatura K9',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, markerData);

    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    this.save(STORAGE_KEYS.MAP_MARKERS, list);
    return item;
  }

  deleteMapMarker(markerId) {
    const list = this.getMapMarkers().filter(m => m.id !== markerId);
    this.save(STORAGE_KEYS.MAP_MARKERS, list);
    return true;
  }

  resetAll() {
    localStorage.clear();
    this.init();
  }
}

// Exportar instancia global
window.K9Store = new K9DataStore();
window.SYSTEM_PERMISSIONS = SYSTEM_PERMISSIONS;
