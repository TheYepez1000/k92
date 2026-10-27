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
  MAP_MARKERS: 'k9_data_map_markers',
  TEN_CODES: 'k9_data_ten_codes'
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
    chapter: 'CAPÍTULO I. DISPOSICIONES GENERALES',
    articles: [
      {
        num: 'Artículo 1',
        title: 'Objeto',
        text: 'El presente reglamento establece las bases organizativas, administrativas y operativas de la Unidad Canina K9, en adelante denominada «Unidad K9».\n\nSu finalidad es regular la incorporación, formación, organización y actuación de los agentes que desarrollen funciones policiales con perros asignados.'
      },
      {
        num: 'Artículo 2',
        title: 'Finalidad de la unidad',
        text: 'La Unidad K9 tiene como finalidad reforzar las capacidades del Departamento de Policía mediante la utilización de perros policiales dentro de las mecánicas y logica.\n\nSus funciones podrán comprender:\n• Rastreo y localización de personas.\n• Detección de sustancias u otros elementos, cuando exista soporte técnico.\n• Apoyo en intervenciones policiales autorizadas.\n• Entrenamiento, obediencia y control del perro.\n• Colaboración con otras divisiones policiales.\n• Participación en dispositivos especiales bajo autorización del mando.'
      },
      {
        num: 'Artículo 3',
        title: 'Ámbito de aplicación',
        text: 'Este reglamento será aplicable a todos los agentes admitidos en la Unidad K9, con independencia de su rango policial.\n\nLos agentes deberán cumplir tanto estas disposiciones como la normativa general del servidor y del Departamento de Policía.'
      },
      {
        num: 'Artículo 4',
        title: 'Principios de actuación',
        text: 'La actividad de la unidad se regirá por los siguientes principios:\n• Respeto a la cadena de mando.\n• Profesionalidad y disciplina.\n• Proporcionalidad en las intervenciones.\n• Responsabilidad del agente guía.\n• Protección del perro y de las personas.\n• Coordinación con las demás unidades.\n• Registro de las actuaciones relevantes.\n• Cumplimiento de la normativa del servidor.'
      }
    ]
  },
  {
    id: 'norm_02',
    chapter: 'CAPÍTULO II. ORGANIZACIÓN Y CADENA DE MANDO',
    articles: [
      {
        num: 'Artículo 5',
        title: 'Dependencia orgánica',
        text: 'La Unidad K9 dependerá de la Jefatura del Departamento de Policía o de la persona en quien esta delegue formalmente sus competencias.\n\nLa creación de la unidad no modificará los rangos policiales existentes ni permitirá eludir las órdenes legítimas de los superiores.'
      },
      {
        num: 'Artículo 6',
        title: 'Coordinador K9',
        text: 'El coordinador será el responsable de la organización y supervisión interna de la unidad, siempre dentro de las competencias que le hayan sido concedidas.\n\nSus funciones serán:\n• Organizar el funcionamiento de la unidad.\n• Proponer candidatos y gestionar las incorporaciones.\n• Supervisar los entrenamientos y las evaluaciones.\n• Mantener actualizados los registros de agentes y perros.\n• Revisar los informes de servicio.\n• Comunicar incidencias a la jefatura.\n• Proponer modificaciones de la normativa.\n• Presentar informes periódicos sobre la actividad de la unidad.'
      },
      {
        num: 'Artículo 7',
        title: 'Instructor K9',
        text: 'El instructor será responsable de la preparación y evaluación de los aspirantes y agentes guía.\n\nPodrá impartir formación, organizar pruebas prácticas y recomendar la certificación o la repetición de un módulo formativo.\n\nNo podrá otorgar certificaciones ni imponer medidas fuera de las competencias que le hayan sido concedidas.'
      },
      {
        num: 'Artículo 8',
        title: 'Agente guía K9',
        text: 'El agente guía será el miembro de la unidad autorizado para trabajar con un perro asignado.\n\nDeberá mantener el control del animal durante el servicio, respetar los procedimientos establecidos y documentar las intervenciones que así lo requieran.'
      },
      {
        num: 'Artículo 9',
        title: 'Aspirante K9',
        text: 'El aspirante será el agente que se encuentre realizando el proceso de formación.\n\nDurante este periodo actuará bajo supervisión y no podrá desarrollar de manera independiente funciones para las que todavía no haya sido autorizado.'
      }
    ]
  },
  {
    id: 'norm_03',
    chapter: 'CAPÍTULO III. INGRESO Y PERMANENCIA',
    articles: [
      {
        num: 'Artículo 10',
        title: 'Requisitos de acceso',
        text: 'Para solicitar el ingreso en la Unidad K9 será necesario:\n• Mantener un historial disciplinario compatible con las responsabilidades de la unidad.\n• Conocer los procedimientos policiales básicos.\n• Mostrar disponibilidad para participar en la formación.\n• Aceptar el presente reglamento.\n• Tener el rango mínimo de Oficial II'
      },
      {
        num: 'Artículo 11',
        title: 'Proceso de selección',
        text: 'El proceso podrá incluir:\n• Solicitud formal de ingreso.\n• Psicotécnico\n• Revisión de los requisitos.\n• Entrevista o valoración del candidato.\n• Formación teórica y práctica.\n• Evaluación final.\n• Resolución de admisión.'
      },
      {
        num: 'Artículo 12',
        title: 'Formación continua',
        text: 'Los agentes guía deberán participar en las sesiones de entrenamiento que establezca la coordinación.\n\nLa falta reiterada de participación sin justificación podrá dar lugar a una revisión de su habilitación operativa.'
      },
      {
        num: 'Artículo 13',
        title: 'Baja de la unidad',
        text: 'La baja podrá producirse por solicitud voluntaria, traslado, pérdida de los requisitos de acceso o decisión disciplinaria adoptada por la autoridad competente.\n\nToda baja deberá registrarse y conllevará la revisión de las autorizaciones y asignaciones correspondientes.'
      }
    ]
  },
  {
    id: 'norm_04',
    chapter: 'CAPÍTULO IV. PERROS ASIGNADOS',
    articles: [
      {
        num: 'Artículo 14',
        title: 'Registro canino',
        text: 'Cada perro incorporado a la unidad contará con una ficha de identificación que incluirá, cuando corresponda:\n• Nombre y código identificativo.\n• Tipo o raza.\n• Agente guía asignado.\n• Especialidad autorizada.\n• Estado de formación.\n• Fecha de incorporación.\n• Observaciones relevantes.'
      },
      {
        num: 'Artículo 15',
        title: 'Asignación y responsabilidad',
        text: 'La asignación de un perro deberá quedar registrada.\n\nEl agente guía será responsable de su control durante el servicio y de comunicar cualquier incidencia relacionada con su utilización.\n\nLa reasignación de un perro requerirá autorización y actualización del registro.'
      },
      {
        num: 'Artículo 16',
        title: 'Especialidades',
        text: 'Las especialidades reconocidas por la unidad podrán incluir rastreo, detección y apoyo operativo.\n\nLa asignación de una especialidad dependerá de las capacidades reales.\n\nNo se atribuirán al perro capacidades que no estén disponibles o reconocidas dentro del rol.'
      }
    ]
  },
  {
    id: 'norm_05',
    chapter: 'CAPÍTULO V. DISPOSICIONES FINALES',
    articles: [
      {
        num: 'Artículo 17',
        title: 'Incumplimientos',
        text: 'Los incumplimientos del presente reglamento serán comunicados a la coordinación o a la jefatura, según su gravedad.\n\nLas medidas correctivas y disciplinarias se aplicarán de acuerdo con la normativa general del Departamento SAPD.'
      },
      {
        num: 'Artículo 18',
        title: 'Modificaciones',
        text: 'La coordinación podrá proponer modificaciones para mejorar el funcionamiento de la unidad.\n\nToda modificación que afecte a las normas oficiales deberá ser aprobada por la autoridad competente antes de entrar en vigor.'
      }
    ]
  }
];

// Manuales Oficiales K9 - Manual Personal, Funciones de la Unidad y Guía Práctica de Intervenciones
const DEFAULT_MANUALS = [
  {
    id: 'man_01',
    title: 'Manual Personal K9',
    category: 'Formación & Adiestramiento',
    items: [
      {
        command: '1. OBJETIVO',
        trans: 'Finalidad del Programa',
        desc: 'Este programa sirve para practicar el manejo del perro y mejorar la coordinación entre el guía y el K9 antes de participar en intervenciones.\n\nEl entrenamiento se adaptará a las opciones disponibles en el servidor.'
      },
      {
        command: '2. FASE 1 — FAMILIARIZACIÓN',
        trans: 'Manejo y Mecánicas',
        desc: 'Objetivo: Aprender a manejar el perro y conocer sus mecánicas.\n\nEjercicios:\n• Sacar y guardar al perro.\n• Caminar con él.\n• Comprobar cómo sigue al guía.\n• Practicar cómo detenerlo y hacerlo regresar.\n• Aprender a utilizar el menú K9.\n• Comprobar qué acciones funcionan realmente.\n\nCriterio para avanzar: El guía puede manejar al perro sin perderlo ni activar órdenes por error.'
      },
      {
        command: '3. FASE 2 — OBEDIENCIA',
        trans: 'Control en Servicio',
        desc: 'Objetivo: Controlar al perro durante el servicio.\n\nEjercicios:\n• Permanecer quieto mientras el guía se desplaza.\n• Seguir al guía durante una patrulla.\n• Regresar cuando se le ordene.\n• Permanecer junto al agente durante una conversación.\n• Repetir las órdenes disponibles hasta conocer su funcionamiento.\n\nCriterio para avanzar: El guía controla al perro en situaciones normales de patrulla.'
      },
      {
        command: '4. FASE 3 — TRABAJO EN EQUIPO',
        trans: 'Coordinación con Agentes',
        desc: 'Objetivo: Coordinar al guía, al perro y a los demás agentes.\n\nEjercicios:\n• Avisar por radio antes de desplegar el K9.\n• Mantener al perro junto al guía mientras otros agentes hablan.\n• Realizar una búsqueda simulada con compañeros.\n• Practicar la retirada del perro cuando termine su función.\n• Coordinar la actuación sin interrumpir otras escenas.'
      },
      {
        command: '5. FASE 4 — SIMULACROS',
        trans: 'Escenarios Operativos',
        desc: 'Realizar tres simulacros obligatorios:\n\n• Simulacro A: Control rutinario\n  - Patrullar con el perro.\n  - Recibir una solicitud de apoyo.\n  - Llegar al lugar.\n  - Mantener al perro controlado.\n  - Finalizar el servicio.\n\n• Simulacro B: Búsqueda\n  - Recibir información sobre una búsqueda.\n  - Desplazarse hasta la zona.\n  - Aplicar la mecánica disponible.\n  - Comunicar el resultado real del ejercicio.\n\n• Simulacro C: Apoyo policial\n  - Recibir una llamada de apoyo.\n  - Coordinarse con los agentes.\n  - Desplegar el perro solo si procede.\n  - Retirarlo al terminar la intervención.'
      },
      {
        command: '7. REGISTRO DE ENTRENAMIENTO',
        trans: 'Hoja de Prácticas',
        desc: 'Tabla de control y seguimiento de sesiones prácticas:\n\n• Obediencia:\n  Fecha: Por completar | Resultado: Por completar | Aspectos a mejorar: Por completar\n\n• Búsqueda:\n  Fecha: Por completar | Resultado: Por completar | Aspectos a mejorar: Por completar\n\n• Simulacro:\n  Fecha: Por completar | Resultado: Por completar | Aspectos a mejorar: Por completar'
      },
      {
        command: '8. EVALUACIÓN PERSONAL',
        trans: 'Verificación Operativa',
        desc: 'Antes de considerar que estás preparado, comprueba que puedes:\n\n☑️ Manejar las órdenes básicas.\n☑️ Desplegar y guardar al perro.\n☑️ Utilizar las funciones de búsqueda disponibles.\n☑️ Coordinarte por radio.'
      }
    ]
  },
  {
    id: 'man_02',
    title: 'Funciones de la Unidad',
    category: 'Competencias & Operativa',
    items: [
      {
        command: '1. OBJETIVO',
        trans: 'Misión Policial',
        desc: 'La unidad K9 tiene como objetivo apoyar a las patrullas policiales mediante las capacidades de un perro adiestrado y la coordinación con su guía.'
      },
      {
        command: '2. FUNCIONES PRINCIPALES',
        trans: 'Especialidades de Campo',
        desc: 'A. Detección de sustancias:\nCuando el servidor disponga de estas mecánicas, el perro podrá ayudar a localizar sustancias ilegales durante controles o búsquedas autorizadas dentro del rol.\nEjemplos: Apoyo en controles de vehículos; búsqueda en zonas señaladas durante una investigación.\n\nB. Seguimiento de sospechosos:\nEl perro puede ayudar a seguir un rastro dentro de una escena. Si no existe esa mecánica, el seguimiento podrá interpretarse mediante rol acordado con los participantes.\n\nC. Apoyo en intervenciones:\nLa presencia del K9 puede ayudar a reforzar una intervención en la que exista un riesgo razonable. No implica que el perro deba atacar ni que se utilice en todas las detenciones.\n\nE. Patrullaje preventivo:\nEl guía podrá patrullar con el perro, realizar comprobaciones rutinarias y estar disponible para apoyar a otras unidades.'
      },
      {
        command: '3. TIPOS DE SERVICIO',
        trans: 'Despliegues Oficiales',
        desc: 'Catálogo de servicios y objetivos:\n\n• Patrulla ordinaria → Dar apoyo a las unidades policiales\n• Detección → Buscar sustancias mediante las mecánicas disponibles\n• Seguimiento → Apoyar la localización de un sospechoso\n• Apoyo operativo → Colaborar en intervenciones de mayor riesgo'
      },
      {
        command: '4. FUNCIONES DEL GUÍA',
        trans: 'Responsabilidad del Agente',
        desc: 'El guía será responsable de:\n\n• Manejar al perro.\n• Elegir cuándo desplegarlo.\n• Informar a sus compañeros.\n• Mantener el control durante la intervención.\n• Interpretar las señales o resultados de la mecánica K9.\n• Finalizar el servicio y guardar al perro correctamente.'
      },
      {
        command: '5. LÍMITES DEL K9',
        trans: 'Lo que NO corresponde',
        desc: 'El perro no sustituye al agente investigador, no decide por sí mismo si una persona es culpable y no garantiza que una búsqueda vaya a tener éxito.'
      },
      {
        command: '6. PRIORIDAD DE LA UNIDAD',
        trans: 'Criterio Fundamental',
        desc: 'La prioridad es apoyar a la policía y mejorar las escenas de rol, utilizando al perro de forma coherente con sus capacidades y con las reglas del servidor.'
      }
    ]
  },
  {
    id: 'man_03',
    title: 'Guía Práctica de Intervenciones',
    category: 'Procedimientos de Rol',
    items: [
      {
        command: '1. OBJETIVO',
        trans: 'Propósito de la Guía',
        desc: 'Esta guía sirve como referencia para saber cómo interpretar las intervenciones en las que participa la unidad K9. Los procedimientos concretos dependerán de las normas de la policía del servidor y de las mecánicas del script.'
      },
      {
        command: '2. PREPARACIÓN DEL SERVICIO',
        trans: 'Antes de Patrullar',
        desc: 'Antes de salir de patrulla:\n\n• Comprobar que el perro puede desplegarse.\n• Comprobar que sabes cómo guardar al perro.\n• Preparar la radio y el indicativo.\n• Confirmar si el servicio requiere alguna especialidad concreta.'
      },
      {
        command: '3. INTERVENCIÓN A — PATRULLA ORDINARIA',
        trans: 'Radio & Procedimiento',
        desc: 'Situación: Estás patrullando con tu perro y recibes una llamada policial.\n\nDesarrollo del rol:\n• Desplazarte al lugar indicado.\n• Informar a los compañeros de que vas acompañado por un K9.\n• Mantener al perro controlado mientras recibes información.\n• Valorar si el perro es útil para esa intervención.\n• Continuar la actuación con el resto de la unidad.\n\n📻 Ejemplo de radio:\n«Central, unidad K9 en servicio, disponible para apoyo y búsquedas».'
      },
      {
        command: '4. INTERVENCIÓN B — BÚSQUEDA DE SUSTANCIAS',
        trans: 'Detección en Escena',
        desc: 'Situación: Durante una intervención se solicita una búsqueda K9 y las normas del servidor permiten realizarla.\n\nDesarrollo del rol:\n• Confirmar con los agentes qué se necesita buscar y dónde.\n• Informar de que vas a iniciar la búsqueda.\n• Utilizar la función correspondiente del script, si existe.\n• Interpretar el resultado que proporcione la mecánica.\n• Comunicar el resultado a los compañeros.\n• Continuar según las normas del servidor.\n\n📻 Ejemplo de radio:\n«Unidad K9 en posición. Vamos a realizar la búsqueda solicitada».\n\n⚠️ Importante: No inventar un resultado positivo para justificar una detención. Si la mecánica no funciona, se debe seguir el procedimiento de rol acordado en el servidor.'
      },
      {
        command: '5. INTERVENCIÓN C — BÚSQUEDA DE UN SOSPECHOSO',
        trans: 'Rastreo y Localización',
        desc: 'Situación: Un sospechoso huye y se solicita apoyo K9.\n\nDesarrollo del rol:\n• Recibir la descripción y la última ubicación conocida.\n• Coordinarse con los agentes que participan en la búsqueda.\n• Utilizar las funciones de seguimiento disponibles.\n• Comunicar cualquier resultado obtenido mediante el sistema o el rol acordado.\n• Mantener al perro controlado durante la localización.\n• Una vez localizado el sospechoso, seguir las instrucciones policiales y las normas del servidor.\n\n📻 Ejemplo de radio:\n«Unidad K9 incorporándose a la búsqueda. Necesito última posición y descripción del sospechoso».'
      },
      {
        command: '6. INTERVENCIÓN D — APOYO EN UNA DETENCIÓN',
        trans: 'Situaciones de Riesgo',
        desc: 'Situación: Los agentes solicitan apoyo durante una detención potencialmente peligrosa.\n\nDesarrollo del rol:\n• Llegar al lugar y recibir instrucciones.\n• Informar de que se dispone del K9.\n• Valorar si desplegar al perro es apropiado.\n• Mantener la coordinación con los demás agentes.\n• Utilizar únicamente las acciones permitidas por el servidor.\n\n⚠️ Criterio de uso: El perro no debe atacar automáticamente por el mero hecho de que una persona se resista o huya. La actuación dependerá del contexto de la escena y de las reglas aplicables.'
      },
      {
        command: '7. FINALIZACIÓN DE LA INTERVENCIÓN',
        trans: 'Cierre del Servicio',
        desc: 'Al finalizar cualquier servicio:\n\n• Guardar al perro mediante el sistema disponible.\n• Registrar el entrenamiento o la actuación.\n• Comprobar que el perro está listo para el siguiente servicio.'
      },
      {
        command: '8. PLANTILLA DE INFORME K9',
        trans: 'Estructura Oficial',
        desc: 'Formato estándar de informe de servicio:\n\nNúmero de intervención: ____________________\nFecha y hora: ______________________________\nGuía K9: ___________________________________\nPerro: _____________________________________\nMotivo del servicio: ________________________\nLugar: _____________________________________\nAcciones realizadas: _______________________\nObservaciones: _____________________________'
      },
      {
        command: '9. PRINCIPIOS PARA UN BUEN ROL K9',
        trans: 'Código Deontológico',
        desc: '• Dar protagonismo al trabajo conjunto entre guía y animal.\n• Respetar las mecánicas y las normas del servidor.\n• Comunicar las actuaciones por radio.\n• No utilizar al perro para forzar resultados.\n• Buscar escenas interesantes para todos los participantes, no solo para el guía.'
      }
    ]
  }
];

// Códigos 10 Policiales Oficiales y Especialidades K9
const DEFAULT_TEN_CODES = [
  // --- Códigos Especiales K9 ---
  {
    id: 'code_10_8k',
    code: '10-8K',
    title: 'Binomio K9 En Servicio',
    category: 'K9',
    meaning: 'Agente guía y can operativo en servicio activo y disponibles para llamadas de apoyo, controles o intervenciones.',
    radio: '«Central, K-01 en 10-8K, can disponible para intervención y rastreo»'
  },
  {
    id: 'code_10_14k',
    code: '10-14K',
    title: 'Despliegue Canino / Búsqueda en Perímetro',
    category: 'K9',
    meaning: 'El perro ha sido sacado del vehículo y desplegado en el perímetro para rastreo, inspección o contención.',
    radio: '«Unidad K9 en 10-20 Pillbox Hill, procediendo con 10-14K en callejón lateral»'
  },
  {
    id: 'code_10_15k',
    code: '10-15K',
    title: 'Marcaje Positivo de Sustancias / Foco Oloroso',
    category: 'K9',
    meaning: 'El can se sienta o realiza marcaje pasivo/activo indicando presencia de estupefacientes, pólvora o explosivos.',
    radio: '«Central, 10-15K confirmado en maletero del vehículo sospechoso. Solicitamos unidad de apoyo»'
  },
  {
    id: 'code_10_16k',
    code: '10-16K',
    title: 'Marcaje Negativo / Zona Despejada',
    category: 'K9',
    meaning: 'Inspección canina finalizada sin detección de elementos ilícitos. Zona o vehículo limpio.',
    radio: '«Búsqueda canina finalizada en almacén, resultado 10-16K, zona despejada»'
  },
  {
    id: 'code_10_17k',
    code: '10-17K',
    title: 'Neutralización por Mordida Canina',
    category: 'K9',
    meaning: 'El can ha interceptado e inmovilizado físicamente al sospechoso en fuga tras orden legítima del guía.',
    radio: '«10-17K efectivo en Strawberry. Sospechoso inmovilizado y bajo control del can»'
  },
  {
    id: 'code_10_18k',
    code: '10-18K',
    title: 'Can Herido en Acto de Servicio (Emergencia)',
    category: 'K9',
    meaning: 'Emergencia veterinaria crítica. El perro ha recibido disparos, atropello o ataque grave. Traslado prioritario.',
    radio: '«🚨 10-18K! Can herido por impacto balístico en tiroteo. Requerimos escolta inmediata a clínica veterinaria»'
  },
  {
    id: 'code_10_23k',
    code: '10-23K',
    title: 'Binomio K9 en Escena y Listo',
    category: 'K9',
    meaning: 'Llegada de la patrulla K9 al lugar del incidente, listo para coordinar con el oficial a cargo.',
    radio: '«Unidad K-02 en 10-23K sobre la escena. Coordinando despliegue con mando en el lugar»'
  },
  {
    id: 'code_10_32k',
    code: '10-32K',
    title: 'Solicitud de Perro de Asalto / Tirador Atrincherado',
    category: 'K9',
    meaning: 'Petición prioritaria de unidad canina táctica para apoyo en brecha, reducción armada o situación de rehenes.',
    radio: '«Central, sujeto hostil armado en vivienda. Solicitamos 10-32K para intervención táctica»'
  },
  {
    id: 'code_10_70k',
    code: '10-70K',
    title: 'Rastreo de Rastro Biológico / Fuga a Pie',
    category: 'K9',
    meaning: 'Inicio de seguimiento por rastro de olor de referencia tras fuga de sospechoso o persona extraviada.',
    radio: '«Iniciando 10-70K desde última posición conocida del sospechoso en Little Seoul hacia el norte»'
  },
  {
    id: 'code_10_97k',
    code: '10-97K',
    title: 'Can Asegurado en Vehículo / Fin de Intervención',
    category: 'K9',
    meaning: 'El perro ha sido retornado y asegurado en el transportín reglamentario del patrulla. Escena segura.',
    radio: '«Intervención concluida, can en 10-97K. Unidad K9 disponible para nuevo servicio»'
  },

  // --- Estados de Patrulla ---
  {
    id: 'code_10_4',
    code: '10-4',
    title: 'Entendido / Afirmativo',
    category: 'Patrulla',
    meaning: 'Mensaje o instrucción recibida y comprendida correctamente.',
    radio: '«10-4 Central, procedemos hacia la ubicación»'
  },
  {
    id: 'code_10_6',
    code: '10-6',
    title: 'Ocupado / No Disponible',
    category: 'Patrulla',
    meaning: 'Agente ocupado temporalmente en diligencias o informe salvo emergencia vital.',
    radio: '«K-01 en 10-6 redactando diligencias en comisaría central»'
  },
  {
    id: 'code_10_7',
    code: '10-7',
    title: 'Fuera de Servicio',
    category: 'Patrulla',
    meaning: 'Finalización de turno operativo o salida de servicio reglamentaria.',
    radio: '«K-03 finaliza turno, pasando a 10-7. Dejando can en perreras departamentales»'
  },
  {
    id: 'code_10_8',
    code: '10-8',
    title: 'En Servicio / Disponible',
    category: 'Patrulla',
    meaning: 'Unidad patrullando activamente y disponible para asignaciones de despacho.',
    radio: '«K-02 en 10-8 asignado a patrullaje preventivo en Los Santos sur»'
  },
  {
    id: 'code_10_10',
    code: '10-10',
    title: 'Pelea o Disturbio en Curso',
    category: 'Patrulla',
    meaning: 'Altercado físico o reyerta entre civiles en vía pública.',
    radio: '«10-10 multitudinario en Legion Square, solicitamos unidades de apoyo perimetral»'
  },
  {
    id: 'code_10_19',
    code: '10-19',
    title: 'Retorno a Comisaría / Central',
    category: 'Patrulla',
    meaning: 'En trayecto de regreso a la estación policial.',
    radio: '«Unidad K9 en 10-19 hacia Mission Row para cambio de equipamiento»'
  },
  {
    id: 'code_10_20',
    code: '10-20',
    title: 'Ubicación Actual',
    category: 'Patrulla',
    meaning: 'Posición exacta o vía donde se encuentra la patrulla.',
    radio: '«¿Cuál es su 10-20 actual para enviar refuerzos?»'
  },
  {
    id: 'code_10_22',
    code: '10-22',
    title: 'Cancelar Mensaje / Desestimar',
    category: 'Patrulla',
    meaning: 'Anulación de la orden, aviso o llamada de apoyo previa.',
    radio: '«10-22 requerimiento de K9, el sospechoso ya se ha entregado pacíficamente»'
  },

  // --- Operativos & Emergencias ---
  {
    id: 'code_10_33',
    code: '10-33',
    title: '🚨 EMERGENCIA MÁXIMA / OFICIAL EN PELIGRO',
    category: 'Emergencias',
    meaning: 'Oficial o patrulla bajo ataque inminente con riesgo de vida. Silencio de radio absoluto para el resto de unidades.',
    radio: '«🚨 10-33! 10-33! Strawberry Avenue, nos disparan con armas automáticas!»'
  },
  {
    id: 'code_10_50',
    code: '10-50',
    title: 'Accidente de Tráfico',
    category: 'Operativos',
    meaning: 'Colisión vehicular en vía pública con o sin heridos.',
    radio: '«10-50 con vehículo sospechoso en Del Perro Freeway, solicitamos ambulancia»'
  },
  {
    id: 'code_10_76',
    code: '10-76',
    title: 'En Camino / Respondiendo al Aviso',
    category: 'Operativos',
    meaning: 'La unidad se encuentra en trayecto activo hacia el punto del incidente.',
    radio: '«K-01 en 10-76 con Código 3 hacia su posición»'
  },
  {
    id: 'code_10_80',
    code: '10-80',
    title: 'Persecución Vehicular Activa',
    category: 'Operativos',
    meaning: 'Persecución a alta velocidad de vehículo fugitivo.',
    radio: '«10-80 activo sobre deportivo negro en dirección norte por Vinewood Boulevard»'
  },
  {
    id: 'code_10_90',
    code: '10-90',
    title: 'Atraco a Establecimiento / Banco',
    category: 'Operativos',
    meaning: 'Robo a mano armada en progreso en sucursal bancaria o comercio.',
    radio: '«10-90 en Fleeca Bank Hawick, binomio K9 en posición perimetral»'
  },
  {
    id: 'code_10_99',
    code: '10-99',
    title: 'Situación Resuelta / Concluida',
    category: 'Operativos',
    meaning: 'Incidente controlado y finalizado satisfactoriamente.',
    radio: '«Situación en 10-99, perímetro levantado, zona segura»'
  },
  {
    id: 'code_cod_0',
    code: 'Código 0',
    title: 'Caída de Oficial / Asistencia Inmediata',
    category: 'Emergencias',
    meaning: 'Oficial abatido o herido crítico. Todas las unidades del servidor deben acudir de inmediato.',
    radio: '«Código 0 en Paleto Bay! Agente abatido, todos los binomios respondan ya!»'
  },
  {
    id: 'code_cod_3',
    code: 'Código 3',
    title: 'Respuesta de Emergencia con Sirenas',
    category: 'Operativos',
    meaning: 'Desplazamiento prioritario utilizando sirenas acústicas y luces de emergencia.',
    radio: '«Binomio K-04 acudiendo en Código 3 al tiroteo de Davis»'
  },
  {
    id: 'code_cod_4',
    code: 'Código 4',
    title: 'Bajo Control / Sin Novedad',
    category: 'Operativos',
    meaning: 'Escena controlada y sin peligro. Unidades secundarias pueden desconvocarse.',
    radio: '«Código 4 en la escena, sospechoso custodiado en celda»'
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
    lat: -40.0,
    lng: -20.0,
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
    lat: 25.0,
    lng: 15.0,
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
    lat: -42.0,
    lng: -55.0,
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
    // Sincronización oficial de normativas y manuales LSPD K9
    const NORMATIVES_SYNC_VERSION = 'v2_lspd_official_oct2026';
    if (localStorage.getItem('k9_normatives_version') !== NORMATIVES_SYNC_VERSION) {
      this.save(STORAGE_KEYS.NORMATIVES, DEFAULT_NORMATIVES);
      this.save(STORAGE_KEYS.MANUALS, DEFAULT_MANUALS);
      localStorage.setItem('k9_normatives_version', NORMATIVES_SYNC_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.NORMATIVES)) {
        this.save(STORAGE_KEYS.NORMATIVES, DEFAULT_NORMATIVES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.MANUALS)) {
        this.save(STORAGE_KEYS.MANUALS, DEFAULT_MANUALS);
      }
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
    // Sincronización oficial de Códigos 10 Policiales y K9
    const CODES_SYNC_VERSION = 'v1_lspd_tencodes_oct2026';
    if (localStorage.getItem('k9_codes_version') !== CODES_SYNC_VERSION) {
      this.save(STORAGE_KEYS.TEN_CODES, DEFAULT_TEN_CODES);
      localStorage.setItem('k9_codes_version', CODES_SYNC_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.TEN_CODES)) {
        this.save(STORAGE_KEYS.TEN_CODES, DEFAULT_TEN_CODES);
      }
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

  getTenCodes() {
    const codes = this.get(STORAGE_KEYS.TEN_CODES);
    return (Array.isArray(codes) && codes.length > 0) ? codes : DEFAULT_TEN_CODES;
  }

  saveTenCodes(codes) {
    this.save(STORAGE_KEYS.TEN_CODES, codes);
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
    if (!Array.isArray(list) || list.length === 0) return DEFAULT_MAP_MARKERS;
    // Migración automática de coordenadas de versiones anteriores
    return list.map(m => {
      if (m.lat < -100) {
        if (m.id === 'marker_k9_hq') return Object.assign({}, m, { lat: -40.0, lng: -20.0 });
        if (m.id === 'marker_k9_train') return Object.assign({}, m, { lat: 25.0, lng: 15.0 });
        if (m.id === 'marker_k9_check') return Object.assign({}, m, { lat: -42.0, lng: -55.0 });
        return Object.assign({}, m, { lat: -40.0, lng: -20.0 });
      }
      return m;
    });
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
