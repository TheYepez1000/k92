/**
 * UNIDAD CANINA K9 - API SERVERLESS DE SINCRONIZACIÓN EN LA NUBE (VERCEL)
 * Permite almacenar y sincronizar el estado global de la unidad K9 entre
 * múltiples navegadores, ordenadores y dispositivos en tiempo real.
 *
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

const DEFAULT_TEN_CODES = [
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
  ten_codes: DEFAULT_TEN_CODES,
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
  // Asegurar que el ID oficial de Jefatura (578954458948698122) nunca permanezca en la lista de expulsados
  result.expelledUserIds = result.expelledUserIds.filter(id => id !== '578954458948698122' && id !== '760159743616090164');
  const expelledSet = new Set(result.expelledUserIds);

  // 1. Directorio de usuarios: autoritativo si incoming lo envía
  if (Array.isArray(incoming.users)) {
    result.users = incoming.users;
    result.users.forEach(u => {
      if (u.discordId === '578954458948698122' || u.discordId === '760159743616090164') {
        u.isExpelled = false;
        u.isJefatura = true;
        u.isVerified = true;
        u.rank = 'Coordinador K9';
        u.placa = 'K-01';
        u.serviceStatus = 'En Activo / Mando';
      }
    });
  }

  // 2. Presets de Jefatura
  if (Array.isArray(incoming.presets)) {
    result.presets = incoming.presets.filter(p => !expelledSet.has(p.discordId));
  } else if (!Array.isArray(result.presets)) {
    result.presets = [];
  }
  const adminIds = ['578954458948698122', '760159743616090164'];
  adminIds.forEach(admId => {
    if (!result.presets.some(p => p.discordId === admId)) {
      result.presets.unshift({
        discordId: admId,
        discordUsername: 'Jefatura K9',
        placa: 'K-01',
        rank: 'Coordinador K9',
        isJefatura: true,
        permissions: ['*'],
        serviceStatus: 'En Activo / Mando',
        createdAt: '25/10/2026'
      });
    }
  });

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

  // 11b. Códigos 10 Policiales y K9
  if (Array.isArray(incoming.ten_codes) && incoming.ten_codes.length > 0) {
    result.ten_codes = incoming.ten_codes;
  } else if (!result.ten_codes || result.ten_codes.length === 0) {
    result.ten_codes = DEFAULT_TEN_CODES;
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

  // 15. Centro de Tareas
  if (Array.isArray(incoming.tasks)) {
    result.tasks = incoming.tasks;
  }

  // 16. Eventos y Agenda de Servicio
  if (Array.isArray(incoming.events)) {
    result.events = incoming.events;
  }

  // 17. Centro de Notificaciones
  if (Array.isArray(incoming.notifications)) {
    result.notifications = incoming.notifications.slice(0, 100);
  }

  // 18. Código de Vestimenta & Uniformes
  if (Array.isArray(incoming.uniforms)) {
    result.uniforms = incoming.uniforms;
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

  // Prioridad: Sincronización directa con Supabase PostgreSQL (persistencia permanente)
  const supabaseUrl = process.env.SUPABASE_URL || 'https://lokfaliwnnfqmachndwv.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxva2ZhbGl3bm5mcW1hY2huZHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTgxNDEsImV4cCI6MjEwODU3NDE0MX0.7YVbrxy_hi3drFl4wUFVmr8xMZHBUgchhzvmOiUr0cg';

  if (supabaseUrl && supabaseKey) {
    try {
      if (req.method === 'POST' || req.method === 'PUT') {
        const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const upsertRes = await fetch(`${supabaseUrl}/rest/v1/k9_app_state`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: 'k9_global_state',
            payload: incoming,
            updated_at: new Date().toISOString(),
            updated_by: 'API Sync Bridge'
          })
        });
        if (upsertRes.ok) {
          return res.status(200).json({ ok: true, source: 'supabase', data: incoming });
        }
      } else {
        const getRes = await fetch(`${supabaseUrl}/rest/v1/k9_app_state?id=eq.k9_global_state&select=payload`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'application/json'
          }
        });
        if (getRes.ok) {
          const rows = await getRes.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].payload && Object.keys(rows[0].payload).length > 0) {
            return res.status(200).json(rows[0].payload);
          }
        }
      }
    } catch (errSupabase) {
      console.warn('[API Sync Supabase Bridge Error]:', errSupabase);
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
