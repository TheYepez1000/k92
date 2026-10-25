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
  AGENT_PRESETS: 'k9_agent_presets'
};

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

// Normativas Oficiales K9
const DEFAULT_NORMATIVES = [
  {
    id: 'norm_01',
    chapter: 'CAPÍTULO I - PRINCIPIOS GENERALES Y ÉTICA CANINA',
    articles: [
      {
        num: 'Art. 1',
        title: 'Del Bienestar y Cuidado del Can',
        text: 'El perro de servicio K9 es considerado un miembro de pleno derecho de la unidad policial. Queda terminantemente prohibido cualquier trato desproporcionado, negligencia en su alimentación, hidratación o confinamiento prolongado en el vehículo policial sin ventilación climatizada.'
      },
      {
        num: 'Art. 2',
        title: 'El Binomio Policial Indivisible',
        text: 'El vínculo entre el Guía y su can es inalterable. El guía es el responsable directo de la conducta, salud, custodia y adiestramiento continuo del canino asignado tanto en servicio como en traslados.'
      }
    ]
  },
  {
    id: 'norm_02',
    chapter: 'CAPÍTULO II - PROTOCOLO DE DESPLIEGUE OPERATIVO Y FUERZA',
    articles: [
      {
        num: 'Art. 3',
        title: 'Uso Gradual de la Fuerza Canina',
        text: 'La presencia del can es una herramienta de disuasión visual prioritaria. Antes de desplegar al perro sin correa, el agente debe advertir en voz alta: "¡Policía Unidad K9, deténgase o soltaré al perro!".'
      },
      {
        num: 'Art. 4',
        title: 'Control Posterior a la Mordida',
        text: 'En caso de impacto y mordida, en cuanto el sospechoso cese la resistencia violenta y se encuentre engrilletado, se ordenará inmediatamente la sujeción del perro, comprobando lesiones y solicitando asistencia sanitaria.'
      }
    ]
  },
  {
    id: 'norm_03',
    chapter: 'CAPÍTULO III - OBLIGACIONES Y DOCUMENTACIÓN DE JEFATURA',
    articles: [
      {
        num: 'Art. 5',
        title: 'Presentación de Informes Semanales',
        text: 'Cada domingo antes de las 23:59h, todo Guía Canino en activo debe registrar su informe semanal en la plataforma digital para su validación por Jefatura.'
      },
      {
        num: 'Art. 6',
        title: 'Régimen Sancionador',
        text: 'Las faltas leves prescribirán a los 6 meses, las graves a los 2 años y las muy graves conllevan la retirada cautelar inmediata del can y la inhabilitación del guía.'
      }
    ]
  }
];

// Manuales de Instrucción y Adiestramiento
const DEFAULT_MANUALS = [
  {
    id: 'man_01',
    title: 'Manual de Comandos Operativos Caninos (Alemán / Holandés)',
    category: 'Adiestramiento & Órdenes',
    items: [
      { command: 'SITZ', trans: 'Sentado', desc: 'Posición de espera y atención inmediata al guía.' },
      { command: 'PLATZ', trans: 'Tierra / Echado', desc: 'Can cuerpo a tierra en estado de alerta máxima.' },
      { command: 'FASS', trans: 'Ataque / Mordida', desc: 'Orden de neutralización directa del objetivo hostil.' },
      { command: 'AUS', trans: 'Soltar / Alto', desc: 'Liberación instantánea de la mordida y retroceso al guía.' },
      { command: 'HIER', trans: 'Aquí / Junto', desc: 'Acude rápidamente a la pierna izquierda del guía.' },
      { command: 'SUCH', trans: 'Busca / Rastreo', desc: 'Activación del modo de detección de sustancias u olor.' },
      { command: 'VORAN', trans: 'Adelante / Entrada', desc: 'Ingreso táctico para despeje perimetral de habitáculo.' },
      { command: 'REVIER', trans: 'Ladrido de Marcaje', desc: 'Intimidación y aviso sin contacto físico.' }
    ]
  },
  {
    id: 'man_02',
    title: 'Protocolo Táctico K9-TCCC (Primeros Auxilios de Combate Canino)',
    category: 'Medicina Veterinaria Táctica',
    items: [
      { command: 'FASE 1: CUIDADO BAJO FUEGO', trans: 'Seguridad de la Escena', desc: 'Retirar al binomio de la línea de tiro. Colocar bozal táctico suave antes de cualquier cura para evitar mordidas por dolor reflejo.' },
      { command: 'FASE 2: CONTROL DE HEMORRAGIAS', trans: 'Torniquete y Vendaje Israelí', desc: 'Compresión en heridas penetrantes de extremidades. Uso de gasas hemostáticas homologadas (sin caolín libre).' },
      { command: 'FASE 3: VÍA AÉREA & TÓRAX', trans: 'Neumotórax y Dificultad', desc: 'Limpieza de hocico y detección de heridas soplantes en caja torácica. Colocación de parche torácico con válvula.' },
      { command: 'FASE 4: SHOCK & EVACUACIÓN', trans: 'Traslado Prioritario', desc: 'Abrigado térmico y transporte urgente a clínica de traumatología veterinaria designada.' }
    ]
  }
];

// Clase Gestora del Estado
class K9DataStore {
  constructor() {
    this.init();
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
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // Métodos de acceso rápido
  getUsers() { return this.get(STORAGE_KEYS.USERS) || []; }
  getDogs() { return this.get(STORAGE_KEYS.DOGS) || DEFAULT_DOGS; }
  getReports() { return this.get(STORAGE_KEYS.REPORTS) || []; }
  getDisciplinary() { return this.get(STORAGE_KEYS.DISCIPLINARY) || []; }
  getBadges() { return this.get(STORAGE_KEYS.BADGES) || DEFAULT_BADGES; }
  getAnnouncements() { return this.get(STORAGE_KEYS.ANNOUNCEMENTS) || DEFAULT_ANNOUNCEMENTS; }
  getNormatives() { return this.get(STORAGE_KEYS.NORMATIVES) || DEFAULT_NORMATIVES; }
  getManuals() { return this.get(STORAGE_KEYS.MANUALS) || DEFAULT_MANUALS; }
  getDogRequests() { return this.get(STORAGE_KEYS.DOG_REQUESTS) || []; }
  getAgentPresets() { return this.get(STORAGE_KEYS.AGENT_PRESETS) || []; }

  getCurrentUserId() {
    return this.get(STORAGE_KEYS.CURRENT_USER) || null;
  }

  getCurrentUser() {
    const id = this.getCurrentUserId();
    if (!id) return null;
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  setCurrentUser(id) {
    if (id) {
      this.save(STORAGE_KEYS.CURRENT_USER, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  resetAll() {
    localStorage.clear();
    this.init();
  }
}

// Exportar instancia global
window.K9Store = new K9DataStore();
window.SYSTEM_PERMISSIONS = SYSTEM_PERMISSIONS;
