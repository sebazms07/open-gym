// Traducciones al español de los valores controlados del catálogo openGym.

export const BODY_PARTS: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  'upper legs': 'Piernas',
  'lower legs': 'Pantorrillas',
  waist: 'Abdomen',
  neck: 'Cuello',
  'full body': 'Cuerpo completo',
  cardio: 'Cardio',
}

export const CATEGORIES: Record<string, string> = {
  strength: 'Fuerza',
  calisthenics: 'Calistenia',
  mobility: 'Movilidad',
  stretching: 'Estiramiento',
  plyometrics: 'Pliometría',
  isometric: 'Isométrico',
  cardio: 'Cardio',
  olympic: 'Halterofilia',
  yoga: 'Yoga',
  pilates: 'Pilates',
  rehab: 'Rehabilitación',
  combat: 'Combate',
}

export const MUSCLES: Record<string, string> = {
  abs: 'Abdominales',
  biceps: 'Bíceps',
  lats: 'Dorsales',
  pectorals: 'Pectorales',
  hamstrings: 'Isquiotibiales',
  triceps: 'Tríceps',
  quads: 'Cuádriceps',
  'upper back': 'Espalda alta',
  'lower back': 'Zona lumbar',
  glutes: 'Glúteos',
  delts: 'Deltoides',
  shoulders: 'Hombros',
  'rear deltoids': 'Deltoides posterior',
  'serratus anterior': 'Serrato anterior',
  forearms: 'Antebrazos',
  wrists: 'Muñecas',
  calves: 'Gemelos',
  traps: 'Trapecios',
  trapezius: 'Trapecios',
  adductors: 'Aductores',
  abductors: 'Abductores',
  'inner thighs': 'Aductores',
  'hip flexors': 'Flexores de cadera',
  'levator scapulae': 'Elevador de la escápula',
  'cardiovascular system': 'Sistema cardiovascular',
  spine: 'Columna',
  chest: 'Pecho',
  'upper chest': 'Pecho superior',
  obliques: 'Oblicuos',
  core: 'Core',
  rhomboids: 'Romboides',
  'rotator cuff': 'Manguito rotador',
  shins: 'Tibiales',
  ankles: 'Tobillos',
  feet: 'Pies',
  hands: 'Manos',
  grip: 'Agarre',
  neck: 'Cuello',
  sternocleidomastoid: 'Esternocleidomastoideo',
  back: 'Espalda',
  quadriceps: 'Cuádriceps',
  hips: 'Caderas',
  'grip muscles': 'Músculos del agarre',
  'lower abs': 'Abdominales inferiores',
  brachialis: 'Braquial',
  soleus: 'Sóleo',
  'wrist flexors': 'Flexores de muñeca',
  'wrist extensors': 'Extensores de muñeca',
  groin: 'Ingle',
  deltoids: 'Deltoides',
  'latissimus dorsi': 'Dorsal ancho',
  'ankle stabilizers': 'Estabilizadores del tobillo',
  abdominals: 'Abdominales',
}

export const EQUIPMENT: Record<string, string> = {
  'body weight': 'Peso corporal',
  dumbbell: 'Mancuernas',
  barbell: 'Barra',
  'ez barbell': 'Barra EZ',
  'olympic barbell': 'Barra olímpica',
  'trap bar': 'Barra hexagonal',
  cable: 'Polea',
  'leverage machine': 'Máquina',
  'smith machine': 'Máquina Smith',
  'sled machine': 'Prensa / trineo',
  kettlebell: 'Kettlebell',
  band: 'Banda',
  'resistance band': 'Banda de resistencia',
  weighted: 'Con lastre',
  'suspension trainer': 'TRX / suspensión',
  roller: 'Rodillo',
  'wheel roller': 'Rueda abdominal',
  'stability ball': 'Fitball',
  'bosu ball': 'Bosu',
  'medicine ball': 'Balón medicinal',
  'weight plate': 'Disco',
  rope: 'Cuerda',
  assisted: 'Asistido',
  landmine: 'Landmine',
  sandbag: 'Saco de arena',
  tire: 'Neumático',
  macebell: 'Maza',
  hammer: 'Martillo',
  'elliptical machine': 'Elíptica',
  'stationary bike': 'Bicicleta estática',
  'stepmill machine': 'Escaladora',
  'upper body ergometer': 'Ergómetro de brazos',
  'skierg machine': 'SkiErg',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const label = (map: Record<string, string>) => (v: string | undefined) => (v ? (map[v] ?? cap(v)) : '')

export const bodyPartLabel = label(BODY_PARTS)
export const categoryLabel = label(CATEGORIES)
export const muscleLabel = label(MUSCLES)
export const equipmentLabel = label(EQUIPMENT)

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Índice del día de hoy con lunes = 0. */
export const todayIndex = (d = new Date()) => (d.getDay() + 6) % 7

/** Partes del cuerpo que reciben el incremento de tren inferior. */
export const LOWER_BODY = new Set(['upper legs', 'lower legs'])
