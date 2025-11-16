export type Field = {
  name: string;
  label?: string;
  type: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type Question = {
  id: number | string;
  question?: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'date' | 'group' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  fields?: Field[];
  message?: string;
  dependsOn?: string;
  readOnly?: boolean;
};

export const neighborhoodsByMunicipality: { [key: string]: { [key: string]: string } } = {
  "Itagüí": {
    "Zona Industrial 01": "Comuna 1",
    "Zona Industrial 02": "Comuna 1",
    "La Independencia": "Comuna 1",
    "San Juan Bautista": "Comuna 1",
    "San José": "Comuna 1",
    "Araucaria": "Comuna 1",
    "La Gloria": "Comuna 1",
    "Las Mercedes": "Comuna 1",
    "Centro": "Comuna 1",
    "Asturias": "Comuna 1",
    "Los Naranjos": "Comuna 1",
    "Villa Paula": "Comuna 1",
    "Artex": "Comuna 1",
    "Playa Rica": "Comuna 1",
    "Satexco": "Comuna 1",
    "San Isidro": "Comuna 1",
    "La Santa Cruz": "Comuna 1",
    "Santa Catalina": "Comuna 2",
    "Samaria": "Comuna 2",
    "La Finca": "Comuna 2",
    "Yarumito": "Comuna 2",
    "El Palmar": "Comuna 2",
    "Santa Ana": "Comuna 2",
    "Samaria 01": "Comuna 2",
    "Las Margaritas": "Comuna 2",
    "Pilsen": "Comuna 2",
    "Malta": "Comuna 2",
    "Glorieta Pilsen": "Comuna 2",
    "Monte Verde": "Comuna 2",
    "Camparola": "Comuna 2",
    "San Pío X": "Comuna 2",
    "La Palma": "Comuna 2",
    "Jardines Montesacro": "Comuna 2",
    "Zona Industrial 03": "Comuna 2",
    "Las Brisas": "Comuna 3",
    "San Javier": "Comuna 3",
    "Villa Lia": "Comuna 3",
    "19 de Abril": "Comuna 3",
    "San Gabriel": "Comuna 3",
    "San Antonio": "Comuna 3",
    "Triana": "Comuna 3",
    "Ditaires": "Comuna 3",
    "San Francisco": "Comuna 3",
    "Santa María 01 El Guayabo": "Comuna 4",
    "Santa María 2": "Comuna 4",
    "Santa María 3": "Comuna 4",
    "Colinas del Sur": "Comuna 4",
    "Central Mayorista": "Comuna 4",
    "San Fernando": "Comuna 4",
    "La Raya (Guayabal)": "Comuna 4",
    "Simón Bolívar": "Comuna 4",
    "Las Acacias": "Comuna 5",
    "Las Américas": "Comuna 5",
    "El Tablazo": "Comuna 5",
    "Calatrava": "Comuna 5",
    "Loma Linda": "Comuna 5",
    "Terranova": "Comuna 5",
    "La Aldea": "Comuna 5",
    "La Ferrara": "Comuna 5",
    "Balcones de Sevilla": "Comuna 5",
    "Fátima": "Comuna 6",
    "El Rosario": "Comuna 6",
    "La Unión": "Comuna 6",
    "Santa María La Nueva": "Comuna 6",
    "La Verde (La María)": "Vereda",
    "Los Olivales": "Vereda",
    "El Pedregal": "Vereda",
    "Loma de Los Zuleta": "Vereda",
    "El Progreso": "Vereda",
    "Los Gómez": "Vereda",
    "El Ajizal": "Vereda",
    "El Porvenir": "Vereda",
  },
  "Sabaneta": {
    // Comité San José
    "Las Lomitas": "Comité San José",
    "San José": "Comité San José",
    "La Doctora": "Comité San José",
    "Cañaveralejo": "Comité San José",
    "San Isidro": "Comité San José",
    // Comité María Auxiliadora
    "María Auxiliadora parte alta": "Comité María Auxiliadora",
    "Palenque": "Comité María Auxiliadora",
    // Comité Betania
    "Betania": "Comité Betania",
    "Calle del Banco": "Comité Betania",
    "Entre Amigos": "Comité Betania",
    "Santa Ana": "Comité Betania",
    "Ave María": "Comité Betania",
    "San Joaquín": "Comité Betania",
    // Comité Calle Larga
    "Metropolitano": "Comité Calle Larga",
    "Prados de Sabaneta": "Comité Calle Larga",
    "Cerámica": "Comité Calle Larga",
    "Carmelo 2": "Comité Calle Larga",
    "Calle Larga": "Comité Calle Larga",
    "Carmelo 1": "Comité Calle Larga",
    // Comité Villas del Carmen
    "Mayorca": "Comité Villas del Carmen",
    "La Florida": "Comité Villas del Carmen",
    "María Auxiliadora parte baja": "Comité Villas del Carmen",
    "Restrepo Naranjo": "Comité Villas del Carmen",
    "Villas del Carmen": "Comité Villas del Carmen",
  },
  "San Antonio de Prado": {
    // Comité El Salado
    "Vereda El Salado": "Comité El Salado",
    // Comité Palo Blanco
    "Palo Blanco": "Comité Palo Blanco",
    "Los Salinas": "Comité Palo Blanco",
    "La Capilla": "Comité Palo Blanco",
    // Comité Vergel
    "El Vergel": "Comité Vergel",
    "Los Quintana": "Comité Vergel",
    "La Palomera": "Comité Vergel",
    // Comité Barichara
    "Barichara": "Comité Barichara",
    "Prados del Campo": "Comité Barichara",
    "San José": "Comité Barichara",
    "Prados de María": "Comité Barichara",
    "Limonar 1": "Comité Barichara",
    // Comité Pallavecine
    "Urbanización Villa Pallavecine": "Comité Pallavecine",
    "Pradito Parte Alta": "Comité Pallavecine",
    "Horizontes": "Comité Pallavecine",
    "Los Mesas": "Comité Pallavecine",
    "Santa Rita": "Comité Pallavecine",
    // Comité Aragón
    "Aragón": "Comité Aragón",
    "Rosaleda": "Comité Aragón",
    "La Pradera": "Comité Aragón",
    "Florida Blanca": "Comité Aragón",
    "Limonar 2": "Comité Aragón",
    // Comité Vegas de Alcalá
    "La Verde": "Comité Vegas de Alcalá",
    "Campiñas": "Comité Vegas de Alcalá",
    "Ciudadela": "Comité Vegas de Alcalá",
    "Urbanización Vegas de Alcalá": "Comité Vegas de Alcalá",
    "Urbanización El Recreo": "Comité Vegas de Alcalá",
    "Villa Loma": "Comité Vegas de Alcalá",
    "Pradito": "Comité Vegas de Alcalá",
    "El Descanso": "Comité Vegas de Alcalá",
  },
  "La Estrella": {
    // Comité - Alto de Los Ospina
    "Ancón San Martín": "Comité Alto de Los Ospina",
    "Barrio Camilo Torres": "Comité Alto de Los Ospina",
    
    // Comité - Campo Alegre
    "Barrio Ancón La Playa": "Comité Campo Alegre",
    "Barrio Centro": "Comité Campo Alegre",
    "Barrio Los Ospina": "Comité Campo Alegre",
    "Barrio Caquetá": "Comité Campo Alegre",
    "Barrio Bellavista": "Comité Campo Alegre",
    "Barrio La Esperanza": "Comité Campo Alegre",
    
    // Comité - Tarapaca
    "Vereda Toledo": "Comité Tarapaca",
    "Barrio Nuevo": "Comité Tarapaca",
    "Barrio Villa Mira (Tarapaca)": "Comité Tarapaca",
    "Barrio El Chispero": "Comité Tarapaca",
    "Barrio El Dorado": "Comité Tarapaca",
    "Vereda El Guayabo": "Comité Tarapaca",
    "Barrio El Pedrero": "Comité Tarapaca",
    
    // Comité - Comfama
    "Barrio Horizontes": "Comité Comfama",
    "Barrio Juan XXIII": "Comité Comfama",
    "Vereda La Bermejala": "Comité Comfama",
    "Barrio La Chinca": "Comité Comfama",
    "Vereda La Culebra": "Comité Comfama",
    "Barrio La Ferreria": "Comité Comfama",
    
    // Comité - Bariloche
    "Bariloche": "Comité Bariloche",
    
    // Comité - La Inmaculada II
    "La Inmaculada II": "Comité La Inmaculada II",
    "La Inmaculada I": "Comité La Inmaculada II",
    "Barrio Los Chanos": "Comité La Inmaculada II",
    
    // Comité - Vereda Calle Vieja
    "Vereda Calle Vieja": "Comité Vereda Calle Vieja",
    "Barrio La Ospina": "Comité Vereda Calle Vieja",
    "Barrio La Raya": "Comité Vereda Calle Vieja",
    
    // Comité - Vereda La Tablacita
    "Vereda La Tablacita": "Comité Vereda La Tablacita",
    "Barrio Monterrey": "Comité Vereda La Tablacita",
    "Barrio Pan de Azúcar": "Comité Vereda La Tablacita",
    "Barrio Peñas Blancas": "Comité Vereda La Tablacita",
    "Barrio Primavera": "Comité Vereda La Tablacita",
    
    // Comité - Vereda Pueblo Viejo
    "Vereda Pueblo Viejo": "Comité Vereda Pueblo Viejo",
    "Barrio Quebrada Grande": "Comité Vereda Pueblo Viejo",
    "Vereda Sagrada Familia": "Comité Vereda Pueblo Viejo",
    "Barrio San Andrés": "Comité Vereda Pueblo Viejo",
    "Barrio San Cayetano": "Comité Vereda Pueblo Viejo",
    "Barrio San Isidro": "Comité Vereda Pueblo Viejo",
    "Vereda San José": "Comité Vereda Pueblo Viejo",
    
    // Comité - Meleguindo
    "Barrio San Miguel": "Comité Meleguindo",
    "Barrio San Vicente": "Comité Meleguindo",
    "Barrio Sierra Morena": "Comité Meleguindo",
    "Vereda Tierra Amarilla": "Comité Meleguindo",
    "Vereda Tablaza": "Comité Meleguindo",
    "Barrio Bellos Aires": "Comité Meleguindo",
    "Villa Alicia": "Comité Meleguindo",
    "Barrio San Diego": "Comité Meleguindo",
    "Ancón Sur": "Comité Meleguindo",
    "Barrios Unidos": "Comité Meleguindo",
    "Barrio Bavaria": "Comité Meleguindo",
    "Barrio Industrial": "Comité Meleguindo",
    "Barrio San Agustín-Industrial": "Comité Meleguindo",
    "Vereda San José Barrio": "Comité Meleguindo",
    
    // Comité - Septima
    "Villa Mira (Septima)": "Comité Septima",
    "Barrio San Agustín (Septima)": "Comité Septima",
    "Barrio Escobar": "Comité Septima",
    "Barrio Suramérica": "Comité Septima",
    "Barrio Las Brisas": "Comité Septima",
    "Barrio Monterrey (Septima)": "Comité Septima",
  },
};

export const questions: Question[] = [
  /* {
    id: 1,
    question:
      "En cumplimiento a la Ley 1581 de 2012 de Protección de Datos Personales (Habeas Data), informamos que los datos suministrados en este formulario serán tratados conforme a las disposiciones legales. Al diligenciar y enviar este formulario, autorizas de manera expresa el manejo de tu información dentro de una base de datos privada y protegida.\n\n¿Aceptas la política de tratamiento de datos personales?",
    type: "radio",
    options: ["Sí", "No"],
    required: true,
  }, */
  {
    id: 2,
    question: "Nombre completo",
    type: "text",
    required: true,
  },
  {
    id: 3,
    question: "Género",
    type: "radio",
    options: ["Femenino", "Masculino", "Otro"],
    required: true,
  },
  {
    id: 4,
    question: "Fecha de nacimiento",
    type: "date",
    required: true,
  },
  {
    id: 5,
    question: "Número de celular",
    type: "text",
    required: true,
  },
  {
    id: 6,
    question: "Documento de identidad",
    type: "group",
    fields: [
      {
        name: "tipoDocumento",
        label: "Tipo de documento",
        type: "select",
        options: ["C.C.", "T.I.", "Pasaporte", "Otro"],
        required: true,
      },
      {
        name: "numeroDocumento",
        label: "Número de documento",
        type: "number",
        required: true,
      }
    ]
  },
  {
    id: 7,
    question: "¿Haces parte de alguno de estos grupos poblacionales?",
    type: "radio",
    options: [
      "Negritudes, Afrocolombianos, Raizales y Palenqueros (NARP)",
      "Indígenas",
      "Migrantes",
      "Víctimas del conflicto armado",
      "Personas en condición de discapacidad (PCD)",
      "No aplica",
      "Otro",
    ],
    required: true,
  },
  {
    id: 8,
    question: "¿En qué municipio vives?",
    type: "radio",
    options: [
      "Itagüí",
      "Sabaneta",
      "La Estrella",
      "San Antonio de Prado",
      "Envigado",
      "Medellín",
      "Otro",
    ],
    required: true,
  },
  {
    id: "8b",
    question: "Barrio",
    type: "select",
    placeholder: "Selecciona tu barrio",
    required: true,
    dependsOn: "q_8",
  },
  {
    id: "8c",
    question: "Comuna",
    type: "text",
    placeholder: "Se llenará automáticamente",
    required: false,
    readOnly: true,
  },
  {
    id: 9,
    question: "Dirección",
    type: "text",
    placeholder: "Ej: Calle 51 Nº 40 - 159",
    required: true,
  },
  {
    id: 10,
    question: "¿Cuentas con libreta militar?",
    type: "radio",
    options: ["Sí", "No", "No aplica"],
    required: true,
  },
  {
    id: 11,
    question:
      "¿Estás estudiando? (Bachillerato, carrera profesional, técnica, tecnológica, cursos, diplomados, especializaciones, etc.)",
    type: "radio",
    options: ["Sí", "No"],
    required: true,
  },
  {
    id: 12,
    question:
      "En caso de que tu respuesta sea 'No', cuéntanos qué te gustaría estudiar",
    type: "textarea",
    required: false,
  },
  {
    id: 13,
    question:
      "En caso de que tu respuesta sea 'Sí', cuéntanos qué estás estudiando",
    type: "textarea",
    required: false,
  },
  {
    id: 14,
    question:
      "¿Cuál o cuáles de las siguientes actividades deportivas practicas o has practicado?",
    type: "checkbox",
    options: [
      "Ajedrez",
      "Actividades subacuáticas",
      "Artes marciales",
      "Arquería",
      "BMX",
      "Gimnasia",
      "Fútbol",
      "Ninguna",
      "Otro",
    ],
    required: true,
  },
  {
    id: 15,
    question:
      "¿Cuál o cuáles de las siguientes actividades políticas o de participación ciudadana practicas o has practicado?",
    type: "checkbox",
    options: [
      "Militancia en un partido político",
      "Consejero Municipal de Juventudes (CMJ)",
      "Junta de Acción Comunal (JAC)",
      "Junta Administradora Local (JAL)",
      "Ninguna",
      "Otro",
    ],
    required: true,
  },
  {
    id: 16,
    question:
      "¿Cuál o cuáles de las siguientes actividades sociales o cívicas practicas o has practicado?",
    type: "checkbox",
    options: [
      "Ambientalista",
      "Bomberos",
      "Cruz Roja",
      "Defensa Civil",
      "Policía Juvenil",
      "Scout",
      "Ninguna",
      "Otro",
    ],
    required: true,
  },
  {
    id: 17,
    question: "¿Sabes o estás aprendiendo algún idioma?",
    type: "text",
    placeholder: "Ej: Inglés, Francés, Portugués, Italiano...",
    required: false,
  },
  {
    id: 18,
    question: "¿Tienes redes sociales? ¿Cuáles utilizas?",
    type: "checkbox",
    options: [
      "Instagram",
      "X",
      "WhatsApp",
      "Threads",
      "Facebook",
      "TikTok",
      "Telegram",
      "No uso redes sociales",
      "Otro",
    ],
    required: false,
  },
  {
    id: 19,
    question: "¿Tienes conocimientos en las siguientes áreas tecnológicas?",
    type: "checkbox",
    options: [
      "Adobe (Photoshop, Illustrator)",
      "Diseño gráfico",
      "Edición de video o audio",
      "Ofimática (Word, Excel, PowerPoint)",
      "Programación",
      "Ninguna",
      "Otro",
    ],
    required: false,
  },
  {
    id: 20,
    question: "¿Tienes algún emprendimiento?",
    type: "radio",
    options: ["Sí", "No"],
    required: true,
  },
  {
    id: 21,
    question: "Si tu respuesta es 'Sí', cuéntanos cuál es tu emprendimiento",
    type: "textarea",
    required: false,
  },
  {
    id: 22,
    question:
      "¿Hace cuánto tiempo conoces la Iglesia de Dios Ministerial de Jesucristo Internacional?",
    type: "text",
    placeholder: "Ej: 2 años, 6 meses, desde 2019...",
    required: true,
  },
  {
    id: 23,
    question:
      "¿En qué horario te queda más fácil asistir al culto?",
    type: "radio",
    options: [
      "Culto de la mañana - 7:00 AM",
      "Culto de la tarde - 6:30 PM"
    ],
    required: true,
  }
];
