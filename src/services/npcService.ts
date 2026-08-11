export interface NPCReaction {
  onSuccess: string[];
  onFailure: string[];
}

export interface NPCDefinition {
  id: string;
  name: string;
  role: string;
  emoji: string;
  location: 'HUB' | 'GYM' | 'HOSPITAL' | 'SHOP' | 'CRIME' | 'BANK' | 'JOBS' | 'EDUCATION' | 'FACTION' | 'BOUNTIES' | 'SECRET_ALLEY';
  personality: string;
  quotes: string[];
  reactions: NPCReaction;
}

export const NPCS: Record<string, NPCDefinition> = {
  tony: {
    id: 'tony',
    name: 'Tony "El Músculo" Rossi',
    role: 'Dueño del Gimnasio',
    emoji: '🏋️',
    location: 'GYM',
    personality: 'Obsesionado con el fitness extremo, ruidoso y motivador con el dinero.',
    quotes: [
      'El dolor es temporal. La membresía del gimnasio vence mañana: si no pagas, el dolor vuelve a ser permanente.',
      '¿Sudor? Eso es solo la grasa llorando porque sabe que voy a cobrarle la cuota del mes.',
      'Si no puedes levantar ese peso, levanta tus ganas de vivir y vuelve a intentarlo.',
      'Aquí no vendemos milagros, vendemos ácido láctico y disciplina a buen precio.',
    ],
    reactions: {
      onSuccess: [
        '¡Así me gusta! ¡Rompe esas fibras musculares como rompes tus promesas de año nuevo!',
        '¡Siente el ardor! Esos bíceps van a asustar a los cobradores.',
        '¡Impresionante repetición! Casi parece que no te vas a desmayar.',
      ],
      onFailure: [
        '¿Eso fue un entrenamiento o una siesta con mancuernas? ¡Ponte a sudar!',
        'Te falta energía. Ve a comer algo antes de que la barra te aplaste las costillas.',
      ],
    },
  },

  martinez: {
    id: 'martinez',
    name: 'Dr. Héctor Martínez',
    role: 'Cirujano del Hospital',
    emoji: '🏥',
    location: 'HOSPITAL',
    personality: 'Cínico, desapegado y ve a los heridos como clientes recurrentes.',
    quotes: [
      'Buenas noticias: vas a vivir. Malas noticias: tu seguro no cubre mordeduras de bate de béisbol.',
      'Tranquilo, la anestesia es 100% efectiva. Si no despiertas, te devolvemos el 10% del costo.',
      'Veo más fracturas aquí que en la moral de la policía de la ciudad.',
      'Si necesitas una transfusión, avísame. Hoy la sangre tipo O está en oferta de dos por uno.',
    ],
    reactions: {
      onSuccess: [
        '¡Vuelves a la vida! Intenta no regresar en menos de 20 minutos, el suelo está recién trapeado.',
        'Heridas suturadas. La cicatriz te dará puntos de estilo en las calles.',
      ],
      onFailure: [
        'Aún necesitas reposo. Si sales así, las moscas van a seguirte hasta tu casa.',
      ],
    },
  },

  charly: {
    id: 'charly',
    name: 'El Flaco Charly',
    role: 'Contacto Criminal',
    emoji: '🕵️',
    location: 'CRIME',
    personality: 'Paranoico, susurrante y vendedor de cosas sospechosas.',
    quotes: [
      'Yo no vendo cosas ilegales. Yo vendo cosas que casualmente son ilegales cuando las compras.',
      'Si la policía me pregunta, tú y yo nos conocimos en un curso de cocina vegetariana. ¿Entendido?',
      'En esta calle no hay cámaras, pero hay tres francotiradores mirando. Mantén las manos visibles.',
      'El crimen no paga... a menos que seas muy bueno en lo que haces.',
    ],
    reactions: {
      onSuccess: [
        '¡Limpio y rápido! Toma tu botín y desaparece antes de que lleguen las sirenas.',
        'Buen trabajo con las manos. Nadie vio nada, nadie supo nada.',
      ],
      onFailure: [
        '¡Te dije que miraras a ambos lados! El guardia estaba justo al frente, genio.',
        'La policía te atrapó. Espero que te guste la comida de la cárcel.',
      ],
    },
  },

  salieri: {
    id: 'salieri',
    name: 'Don Salieri',
    role: 'Director del Banco Central',
    emoji: '🏦',
    location: 'BANK',
    personality: 'Elegante, distinguido y con pasado oscuro en el crimen organizado.',
    quotes: [
      'En el banco tu dinero está más seguro que en tu colchón. Principalmente porque sabemos dónde vives.',
      'Un depósito a plazo fijo es como un matrimonio: si lo rompes antes de tiempo, pierdes la mitad.',
      'Los billetes no tienen memoria, pero nuestro libro contable sí.',
    ],
    reactions: {
      onSuccess: [
        'Fondos acreditados en bóveda. Tu saldo cuenta con la garantía de Don Salieri.',
        'Transacción monetaria impecable. Es un placer hacer negocios contigo.',
      ],
      onFailure: [
        'Fondos insuficientes. No intentes emitir cheques sin fondo en mi banco.',
      ],
    },
  },

  marta: {
    id: 'marta',
    name: 'Doña Marta',
    role: 'Inspectora del Centro Laboral',
    emoji: '💼',
    location: 'JOBS',
    personality: 'Burocrática, fuma sin parar, odia los lunes y entrega el sueldo con desgano.',
    quotes: [
      'Firma aquí, pon tu huella acá y no me pidas aumento hasta que inventen el billete de tres dólares.',
      '¿Quieres trabajar en el Casino? Espero que sepas contar cartas sin que te corten los dedos.',
      'Aquí se trabaja de sol a sol. Bueno, en realidad de 9 a 5, pero se siente como de sol a sol.',
    ],
    reactions: {
      onSuccess: [
        'Aquí está tu sueldo diario. Descuenta los impuestos y no lo gastes todo en cerveza.',
        'Contratado. Mañana a primera hora con el uniforme limpio.',
      ],
      onFailure: [
        'No cumples los requisitos de Working Stats. Vuelve cuando sepas usar una calculadora.',
      ],
    },
  },

  callahan: {
    id: 'callahan',
    name: 'El "Juez" Callahan',
    role: 'Agente de Cazarecompensas',
    emoji: '🎯',
    location: 'BOUNTIES',
    personality: 'Frío, veterano tuerto que colecciona recuerdos de víctimas.',
    quotes: [
      'En esta ciudad la justicia se cobra por adelantado y con un 10% de comisión.',
      'No me importa qué te hizo ese tipo. Solo me importa que su cabeza valga más de $5,000.',
      'Cazar hombres es un arte; cobrar la recompensa es la pintura.',
    ],
    reactions: {
      onSuccess: [
        'Objetivo eliminado. Aquí está tu recompensa en efectivo bien merecida.',
      ],
      onFailure: [
        'Ese objetivo te superó en combate. Entrena más antes de volver a perseguirlo.',
      ],
    },
  },

  corleone: {
    id: 'corleone',
    name: 'Don Corleone "El Sapo"',
    role: 'Rey del Callejón Secreto',
    emoji: '🐸',
    location: 'SECRET_ALLEY',
    personality: 'Rana antropomórfica gigante con smoking y puro que habla como mafioso de los 30.',
    quotes: [
      'Te voy a hacer una oferta que no podrás rechazar... principalmente porque mi compadre atrás tiene un RPG-7.',
      'Croac. En este callejón no hay policías, solo moscas y billetes de cien dólares.',
      'Si entraste aquí es porque buscas cosas que la policía no debe ver jamás.',
    ],
    reactions: {
      onSuccess: [
        'Trato hecho. Un placer hacer negocios en las sombras.',
      ],
      onFailure: [
        'No juegues conmigo. En este callejón las ranas no solo croan, también disparan.',
      ],
    },
  },

  jimmy: {
    id: 'jimmy',
    name: 'Jimmy "Dos Cañones"',
    role: 'Vendedor de la Armería',
    emoji: '🔪',
    location: 'SHOP',
    personality: 'Despreocupado, obsesionado con las armas de fuego y las pólvoras.',
    quotes: [
      'No pregunto para qué quieres la pistola. Tú tampoco preguntes por qué tengo 37 en la bodega.',
      'Un arma no mata gente; la bala sí, y yo vendo las mejores balas de la ciudad.',
      'Tengo desde tirachinas de madera hasta lanzacohetes antitanque. Elige tu veneno.',
    ],
    reactions: {
      onSuccess: [
        '¡Excelente compra! Mantén el seguro puesto hasta que llegues a la calle.',
      ],
      onFailure: [
        'Te falta efectivo o nivel para llevarte este juguetito.',
      ],
    },
  },

  prof_albert: {
    id: 'prof_albert',
    name: 'Profesor Albert',
    role: 'Decano de la Universidad',
    emoji: '🎓',
    location: 'EDUCATION',
    personality: 'Académico distraído con tazas de café eternas y frases sabias.',
    quotes: [
      'El conocimiento es poder, pero un título universitario en Sinford te da un +10% de salario pasivo.',
      'Estudiar de noche desarrolla la mente... y las ojeras.',
      'Un libro abierto vale más que mil puñetazos bien dados.',
    ],
    reactions: {
      onSuccess: [
        'Matrícula aceptada. Que la sabiduría guíe tus estudios.',
      ],
      onFailure: [
        'No tienes los fondos o el tiempo necesario para este curso.',
      ],
    },
  },
};

export class NPCService {
  // Obtener definición de NPC por ID
  static getNPC(id: string): NPCDefinition | null {
    return NPCS[id] || null;
  }

  // Obtener NPC representativo según la ubicación/sistema
  static getNPCByLocation(location: NPCDefinition['location']): NPCDefinition | null {
    return Object.values(NPCS).find((npc) => npc.location === location) || null;
  }

  // Obtener frase aleatoria de un NPC
  static getRandomQuote(npcId: string): string {
    const npc = this.getNPC(npcId);
    if (!npc || npc.quotes.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * npc.quotes.length);
    return `${npc.emoji} **${npc.name}:** *"${npc.quotes[randomIndex]}"*`;
  }

  // Obtener reacción aleatoria de un NPC ante un evento
  static getReaction(npcId: string, eventType: 'success' | 'failure'): string {
    const npc = this.getNPC(npcId);
    if (!npc) return '';
    const list = eventType === 'success' ? npc.reactions.onSuccess : npc.reactions.onFailure;
    if (!list || list.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * list.length);
    return `${npc.emoji} **${npc.name}:** *"${list[randomIndex]}"*`;
  }
}
