// Mapa de pantallas del wizard "una pregunta por pantalla".
// Cada pantalla referencia uno o más ids de `questions` (data/questions.ts).
// No duplica textos de opciones/validación: eso sigue viviendo en questions.ts;
// aquí solo se define cómo se agrupan y presentan en el flujo.

export type CampoSpec = {
  questionId: string | number
  label: string
  type: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'select-search' | 'readonly'
  placeholder?: string
}

export type ScreenContent =
  | { kind: 'opciones'; questionId: string | number; multi: boolean }
  | { kind: 'campos'; items: CampoSpec[] }

export interface FormScreen {
  id: string
  section: string
  title: string
  help?: string
  content: ScreenContent
  /** Si devuelve true, la pantalla se salta automáticamente en la navegación. */
  skip?: (values: Record<string, any>) => boolean
}

export const formScreens: FormScreen[] = [
  {
    id: 'autorizacion_menor',
    section: 'Autorización de datos',
    title:
      'En caso de ser menor de edad (menor de 18 años), indique si cuenta con la autorización de su padre, madre o acudiente para el tratamiento de sus datos personales con los fines relacionados en la presente encuesta, de conformidad con la Ley 1581 de 2012 y demás normas sobre protección de datos personales.',
    content: { kind: 'opciones', questionId: 'autorizacion_menor', multi: false },
  },
  {
    id: 'q_2',
    section: 'Datos personales',
    title: 'Nombre completo',
    content: {
      kind: 'campos',
      items: [{ questionId: 2, label: 'Nombre completo', type: 'text' }],
    },
  },
  {
    id: 'q_3',
    section: 'Datos personales',
    title: 'Género',
    content: { kind: 'opciones', questionId: 3, multi: false },
  },
  {
    id: 'q_4_5',
    section: 'Datos personales',
    title: 'Fecha de nacimiento y número de celular',
    content: {
      kind: 'campos',
      items: [
        { questionId: 4, label: 'Fecha de nacimiento', type: 'date' },
        { questionId: 5, label: 'Número de celular', type: 'text', placeholder: '300 000 0000' },
      ],
    },
  },
  {
    id: 'group_6',
    section: 'Datos personales',
    title: 'Documento de identidad',
    help: 'Escribe el número sin puntos ni espacios.',
    content: {
      kind: 'campos',
      items: [
        { questionId: 'tipoDocumento', label: 'Tipo de documento', type: 'select' },
        { questionId: 'numeroDocumento', label: 'Número de documento', type: 'number' },
      ],
    },
  },
  {
    id: 'q_7',
    section: 'Caracterización',
    title: '¿Haces parte de alguno de estos grupos poblacionales?',
    help: 'Selecciona una opción.',
    content: { kind: 'opciones', questionId: 7, multi: false },
  },
  {
    id: 'q_8',
    section: 'Ubicación',
    title: '¿En qué municipio vives?',
    content: { kind: 'opciones', questionId: 8, multi: false },
  },
  {
    id: 'q_8b_8c',
    section: 'Ubicación',
    title: 'Barrio y comuna',
    help: 'Selecciona tu barrio; la comuna se completa automáticamente.',
    content: {
      kind: 'campos',
      items: [
        { questionId: '8b', label: 'Barrio', type: 'select-search' },
        { questionId: '8c', label: 'Comuna', type: 'readonly' },
      ],
    },
  },
  {
    id: 'q_9',
    section: 'Ubicación',
    title: 'Dirección',
    content: {
      kind: 'campos',
      items: [{ questionId: 9, label: 'Dirección', type: 'text', placeholder: 'Ej: Calle 51 Nº 40 - 159' }],
    },
  },
  {
    id: 'q_10',
    section: 'Servicio militar',
    title: '¿Cuentas con libreta militar?',
    content: { kind: 'opciones', questionId: 10, multi: false },
  },
  {
    id: 'q_11',
    section: 'Educación',
    title:
      '¿Estás estudiando? (Bachillerato, carrera profesional, técnica, tecnológica, cursos, diplomados, especializaciones, etc.)',
    content: { kind: 'opciones', questionId: 11, multi: false },
  },
  {
    id: 'q_12',
    section: 'Educación',
    title: '¿En que institucion estudias?',
    content: {
      kind: 'campos',
      items: [{ questionId: 12, label: 'Institución', type: 'text', placeholder: 'ej: UdeA, Pascual Bravo' }],
    },
  },
  {
    id: 'q_13',
    section: 'Educación',
    title: "En caso de que tu respuesta sea 'No', cuéntanos qué te gustaría estudiar",
    content: { kind: 'campos', items: [{ questionId: 13, label: 'Qué te gustaría estudiar', type: 'textarea' }] },
    skip: (values) => values.q_11 === 'Sí',
  },
  {
    id: 'q_14',
    section: 'Educación',
    title: "En caso de que tu respuesta sea 'Sí', cuéntanos qué estás estudiando",
    content: { kind: 'campos', items: [{ questionId: 14, label: 'Qué estás estudiando', type: 'textarea' }] },
    skip: (values) => values.q_11 === 'No',
  },
  {
    id: 'q_15',
    section: 'Actividades e intereses',
    title: '¿Cuál o cuáles de las siguientes actividades deportivas practicas o has practicado?',
    content: { kind: 'opciones', questionId: 15, multi: true },
  },
  {
    id: 'q_16',
    section: 'Actividades e intereses',
    title:
      '¿Cuál o cuáles de las siguientes actividades políticas o de participación ciudadana practicas o has practicado?',
    content: { kind: 'opciones', questionId: 16, multi: true },
  },
  {
    id: 'q_17',
    section: 'Actividades e intereses',
    title: '¿Cuál o cuáles de las siguientes actividades sociales o cívicas practicas o has practicado?',
    content: { kind: 'opciones', questionId: 17, multi: true },
  },
  {
    id: 'q_18',
    section: 'Actividades e intereses',
    title: '¿Sabes o estás aprendiendo algún idioma?',
    content: {
      kind: 'campos',
      items: [
        { questionId: 18, label: 'Idiomas', type: 'text', placeholder: 'Ej: Inglés, Francés, Portugués, Italiano...' },
      ],
    },
  },
  {
    id: 'q_19',
    section: 'Tecnología y redes',
    title: '¿Tienes redes sociales? ¿Cuáles utilizas?',
    content: { kind: 'opciones', questionId: 19, multi: true },
  },
  {
    id: 'q_20',
    section: 'Tecnología y redes',
    title: '¿Tienes conocimientos en las siguientes áreas tecnológicas?',
    content: { kind: 'opciones', questionId: 20, multi: true },
  },
  {
    id: 'q_21',
    section: 'Emprendimiento',
    title: '¿Tienes algún emprendimiento?',
    content: { kind: 'opciones', questionId: 21, multi: false },
  },
  {
    id: 'q_22',
    section: 'Emprendimiento',
    title: "Si tu respuesta es 'Sí', cuéntanos cuál es tu emprendimiento",
    content: { kind: 'campos', items: [{ questionId: 22, label: 'Cuál emprendimiento', type: 'textarea' }] },
    skip: (values) => values.q_21 === 'No',
  },
  {
    id: 'q_23',
    section: 'Comunidad de fe',
    title: '¿Hace cuánto tiempo conoces la Iglesia de Dios Ministerial de Jesucristo Internacional?',
    content: {
      kind: 'campos',
      items: [
        { questionId: 23, label: 'Tiempo conociendo la iglesia', type: 'text', placeholder: 'Ej: 2 años, 6 meses, desde 2019...' },
      ],
    },
  },
  {
    id: 'q_24',
    section: 'Comunidad de fe',
    title: '¿En qué horario te queda más fácil asistir al culto?',
    content: { kind: 'opciones', questionId: 24, multi: false },
  },
  {
    id: 'q_25',
    section: 'Experiencia y conocimiento',
    title: '¿En cual de estas áreas has trabajado o tienes conocimiento?',
    content: { kind: 'opciones', questionId: 25, multi: true },
  },
]

export function getTitleSize(title: string): number {
  if (title.length <= 40) return 30
  if (title.length <= 90) return 28
  return 23
}
