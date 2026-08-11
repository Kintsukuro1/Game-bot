export interface NPCTieredQuotes {
  inicio: string[];
  mitad: string[];
  final: string[];
  rare: string[];
}

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
  quotes: NPCTieredQuotes;
  reactions: NPCReaction;
}

export const NPCS: Record<string, NPCDefinition> = {
  tony: {
    id: 'tony',
    name: 'Tony "El Músculo" Rossi',
    role: 'Dueño del Gimnasio',
    emoji: '🏋️',
    location: 'GYM',
    personality: 'Musculitos fanfarrón, competitivo, simple, motivador cómico.',
    quotes: {
      inicio: [
        '¿Tú vienes a entrenar? Pensé que eras el nuevo repartidor de pizzas.',
        'No te preocupes, campeón. Todos empezamos siendo débiles.',
        '¿Cuánto levantas? ...Ah. Bueno. Técnicamente también puedo levantar una mochila.',
        'No necesitas motivación. Necesitas músculo.',
        'Tu cuerpo está diciendo "ayuda". Yo estoy diciendo "pesas".',
        'No pienses demasiado. Te veo pensando y ya me preocupa.',
        'Si no puedes levantarlo, hazte más fuerte.',
        '¿Duele? Bien. Ahora tienes una excusa para llorar.',
        'Primero aprende a entrenar. Después hablamos de músculos.',
        'Algún día quizá puedas levantar algo que yo no pueda.',
      ],
      mitad: [
        'Mira quién volvió. Ya no pareces completamente indefenso.',
        'Eso estuvo bastante bien. No perfecto. Pero bastante bien.',
        '¡Eso! ¡Así se hace! Sabía que había algo debajo de toda esa debilidad.',
        'Ya estás empezando a verte fuerte. No te emociones.',
        'Tu técnica sigue siendo horrible, pero al menos ahora levantas suficiente peso para que importe.',
        '¿Ves? El músculo funciona. Yo siempre tuve razón.',
        'Te estás poniendo grande, campeón. Me gusta.',
        'Ya no necesito explicarte cada cosa. Eso me hace feliz.',
        'Si sigues así, algún día podrás darme un golpe que me haga sentir algo.',
        'Estoy orgulloso de ti. No me hagas repetirlo.',
      ],
      final: [
        'Mírate... ya no eres el tipo flaco que entró por esa puerta.',
        'No sé si puedo seguir llamándote débil. Me está empezando a doler el orgullo.',
        'Ahora entrenas conmigo. Los demás pueden esperar.',
        'Hay gente fuerte en esta ciudad. Tú eres una de ellas.',
        'No necesitas que te enseñe a ser fuerte. Solo necesitas no volverte estúpido.',
        'Si algún día quieres levantar más que yo... avísame.',
        'No estoy preocupado porque seas fuerte. Estoy preocupado porque ya lo sabes.',
        'Te convertiste en el monstruo que siempre quise fabricar.',
        'Buen trabajo, campeón.',
        'Ahora sal ahí fuera y haz que alguien más necesite un hospital.',
      ],
      rare: [
        '¿Sabías que los músculos pesan? ...Espera, ¿eso ya lo sabías?',
        'Una vez levanté un coche. ¿Fue impresionante? Sí. ¿Estaba el coche vacío? ...Detalles.',
      ],
    },
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
    personality: 'Arrogante, brillante, sarcástico, cínico, estilo Dr. House.',
    quotes: {
      inicio: [
        'Déjame adivinar: hiciste algo estúpido.',
        'No, no necesito tus antecedentes médicos. Tu cara ya me cuenta suficiente.',
        'Tienes suerte. La estupidez rara vez es mortal... todavía.',
        '¿Quieres que te cure o vas a seguir explicándome cómo fue culpa de otro?',
        'He tratado heridas más graves. En personas más interesantes.',
        '¿Cuánto te duele? Del uno al "voy a demandar al hospital".',
        'No estás muriendo. Intenta disfrutarlo.',
        'La próxima vez intenta evitar el objeto que viene hacia tu cara.',
        '¿Otra herida? Qué sorpresa. Pensé que aprenderías.',
      ],
      mitad: [
        'Ah, tú otra vez. Empiezo a pensar que esto es una relación.',
        'Al menos tus heridas están mejorando. Tu criterio sigue igual.',
        'Ya no vienes aquí por cualquier rasguño. Estoy orgulloso.',
        'Mira eso. Estás aprendiendo a no morir.',
        'No te felicitaré. No quiero fomentar conductas peligrosas.',
        'Tu historial médico empieza a ser impresionantemente estúpido.',
        'Te estás volviendo resistente. Eso, o simplemente estás dejando de sentir dolor.',
        '¿Otra vez herido? Qué persistencia tan admirablemente inútil.',
        'Ya sé lo que vas a decir. No fue tu culpa. Claro. Y yo soy astronauta.',
      ],
      final: [
        'Vaya. El paciente que nunca aprende finalmente aprendió.',
        'He visto tu historial. Técnicamente deberías estar muerto.',
        'Si alguien logra matarte, quiero conocerlo. Profesionalmente.',
        'No necesitas un médico. Necesitas una autopsia preventiva.',
        'Ya ni siquiera me sorprende verte aquí.',
        'Tu cuerpo es una colección de malas decisiones que se niega a rendirse.',
        'Admito que eres difícil de matar. Eso es casi un cumplido viniendo de mí.',
        'No te mueras. Me acostumbré a verte. Y no, eso no significa que me importes.',
      ],
      rare: [
        'La anestesia de hoy sabe a manzana ácida. No preguntes de dónde la saqué.',
        'Si ves dos médicos idénticos, parpadea. El de la izquierda es una alucinación.',
      ],
    },
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
    personality: 'Caótico, raro, impredecible, paranoico, estilo DJ Spit.',
    quotes: {
      inicio: [
        '¿Tú eres nuevo? Pareces nuevo. Sí, definitivamente eres nuevo.',
        'Tengo un trabajito para ti. Es fácil. Probablemente.',
        'No te preocupes por la policía... Bueno, sí. Preocúpate un poquito.',
        '¿Sabes correr? Perfecto. Eso es básicamente todo lo que necesitas.',
        'Si sale mal, no me conoces. Si sale bien, tampoco.',
      ],
      mitad: [
        '¡Ey! ¡Mira quién volvió! Ya no pareces tan nuevo.',
        'He escuchado cosas sobre ti. Algunas buenas. Otras muy buenas.',
        'Tengo un trabajo. Pensé en ti porque eres... reemplazable. Es broma. Creo.',
        'Ya sabes cómo funciona esto. Tú haces la parte peligrosa, yo hago la parte inteligente.',
      ],
      final: [
        'Ah. Tú. Pensé que estabas ocupado siendo famoso.',
        'Ya nadie quiere trabajar contigo. Todos te tienen miedo... Yo no. Bueno, un poquito.',
        'Tengo un trabajo que solo tú puedes hacer. Y si dices que no, tengo otro trabajo que solo tú puedes hacer.',
        'Es muy importante que entiendas que eso no fue una amenaza.',
      ],
      rare: [
        'Wooooah, ¿viste ese gato? No tenía sombra. No confíes en él.',
        'El secreto para que no te atrapen es gritar "¡FUEGO!" y correr en la dirección opuesta.',
      ],
    },
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
    personality: 'Carismático, elegante, apasionado por el dinero, pragmático.',
    quotes: {
      inicio: [
        '¡Bienvenido! ¿Tiene una cuenta? ¿No? Bueno, podemos arreglar eso.',
        'No importa cuánto dinero tenga. Lo importante es que empiece a tener más.',
        'Todos empiezan pequeños. Incluso las grandes fortunas. Aunque algunas empiezan mucho más grandes.',
        '¿Un depósito pequeño? ¡Magnífico! Pequeño hoy. Enorme mañana. O pequeño para siempre. Pero mantengamos el optimismo.',
        'El dinero habla. Y el suyo está susurrando.',
      ],
      mitad: [
        '¡Ah, usted! Su cuenta está creciendo. Qué hermosa vista.',
        'Me alegra ver que está aprendiendo a hacer dinero. Antes venía por unos pocos billetes.',
        'Ahora trae cantidades que hacen que mi contador sonría. Ya podemos hablar de inversiones serias.',
        'El dinero atrae dinero. Y aparentemente usted está empezando a atraer bastante.',
        'Me gusta hacer negocios con personas exitosas. Sobre todo cuando regresan.',
      ],
      final: [
        'Ah... mi cliente VIP. Siempre es un placer verlo. Su saldo es verdaderamente hermoso.',
        'Hay personas que vienen al banco a pedir dinero. Usted viene a decirnos cuánto dinero quiere guardar. Eso es clase.',
        'Si alguna vez necesita algo, llámeme. Cualquier cosa... Bueno, cualquier cosa que pueda comprar. Y con su cuenta, eso es prácticamente todo.',
      ],
      rare: [
        'Hueles a billetes recién impresos. Ese es el perfume del éxito.',
        'Una vez vi a un hombre intentar depositar un saco de botones dorados. Aún lo conservo.',
      ],
    },
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
    personality: 'Burocrática, seca, cansada, profesional sin entusiasmo.',
    quotes: {
      inicio: [
        '¿Buscas trabajo? Perfecto. Necesito tus datos. Sí, todos. No, ese no. No sé para qué lo necesitan, pero lo necesitan.',
        'Firma en la casilla amarilla. Si manchas el papel, empezamos desde cero.',
      ],
      mitad: [
        'Otra vez tú. Ya tienes experiencia. Eso es bueno. También significa que tengo que darte un salario ligeramente menos miserable. No te acostumbres.',
        'Veo que aún no te han despedido. Eso te pone en el 10% superior de empleados.',
      ],
      final: [
        'Tú otra vez. ¿Sabes? Ya eres bastante conocido por aquí. No preguntaré por qué, mientras sigas pagando impuestos.',
        '¿No pagas impuestos? Entonces sí tenemos un problema.',
      ],
      rare: [
        'Traje café de la máquina del pasillo. Sabe a aceite de motor, pero me mantiene viva.',
      ],
    },
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
    emoji: '🤠',
    location: 'BOUNTIES',
    personality: 'Estilo western clásico: tranquilo, seco, honorable, observador.',
    quotes: {
      inicio: [
        '¿Buscas una recompensa? Aquí tienes una. No parece difícil. Eso dicen todos.',
        'Primero aprende a seguir huellas. Después aprende a no dejar las tuyas.',
      ],
      mitad: [
        'Te he visto por ahí. Has mejorado. Tus objetivos también lo han notado. Eso los pone nerviosos. Bien.',
        'Un cazador debe hacer que su presa tenga miedo. Ya tienes nombre en estas calles. Ahora asegúrate de que sea un buen nombre.',
      ],
      final: [
        'Hace tiempo que no veo una recompensa que te parezca difícil. La ciudad habla de ti. Los objetivos también.',
        'Eso significa que estás haciendo algo bien. O algo muy mal. Depende de quién pregunte.',
        'Si algún día aparece una recompensa con tu nombre... espero que no me toque cobrarla. Aunque si paga bien... ya sabes cómo funciona.',
      ],
      rare: [
        'En el oeste solíamos contar las moscas sobre los sombreros. Aquí cuento los agujeros de bala.',
      ],
    },
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
    personality: 'Mafioso elegante, paternal, paciente, estilo Don Corleone.',
    quotes: {
      inicio: [
        'Ah... un rostro nuevo. Siéntate. No tengas miedo. Si quisiera hacerte daño, no estaríamos conversando... Todavía.',
        'Aquí respetamos a todos. Pero el respeto se construye. Y los negocios ayudan mucho.',
      ],
      mitad: [
        'Ah, querido amigo. Ya he oído tu nombre. Eso es bueno. Aunque depende de quién lo pronunció.',
        'Has hecho negocios con nosotros antes. Eso significa que existe confianza. No la desperdicies.',
        'La confianza tarda años en construirse. Y segundos en destruirse. Pero suficiente filosofía. Hablemos de dinero.',
      ],
      final: [
        'Mi querido amigo... Ya no eres un cliente. Eres un hombre de negocios.',
        'La ciudad ha empezado a respetarte. Eso es algo peligroso. El respeto atrae enemigos. Y los enemigos atraen oportunidades.',
        'Cuando estés listo para hacer negocios grandes... Ven a verme. Las puertas estarán abiertas. Para ti.',
      ],
      rare: [
        'Croac... Un sapo inteligente nunca salta al agua antes de saber qué tan profunda es.',
      ],
    },
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
    emoji: '🔫',
    location: 'SHOP',
    personality: 'Agresivo, ambicioso, paranoico, apasionado estilo Tony Montana.',
    quotes: {
      inicio: [
        '¡Eh! ¿Qué quieres? ¿Una pistola? Tengo una. ¿Una mejor? Tengo una mejor. ¿Una GRANDE? ¡Tengo una GRANDE!',
        'Dinero primero. Preguntas después. ¡O nunca! ¡Mejor!',
      ],
      mitad: [
        '¡Mira quién volvió! Sabía que ibas a volver. Una vez pruebas algo bueno, no vuelves a lo barato.',
        'Ahora ya sabes lo que quieres. ¡Eso me gusta! Quieres poder. Yo vendo poder. Tú ganas dinero, yo gano dinero. ¡Todos felices!',
      ],
      final: [
        '¡Ahora sí! ¡Mira ese equipo! Ya no eres un cliente. Eres un coleccionista. ¡Eso es lo que quiero ver!',
        'Armas grandes. Problemas grandes. Dinero grande. Si quieres lo mejor, ya sabes dónde encontrarme. Y trae una billetera grande.',
      ],
      rare: [
        '¡Tengo un lanzallamas en el sótano que huele a perfume de rosas! No preguntes por qué.',
      ],
    },
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
    personality: 'Extremadamente alegre, optimista e inocente estilo Ned Flanders.',
    quotes: {
      inicio: [
        '¡Hola, amiguito! ¡Qué maravilla verte interesado en estudiar! ¡La educación es importantísima!',
        'Especialmente si quieres conseguir un buen trabajo. ¡Aunque algunos trabajos son un poquito ilegales! ...¡Pero eso no lo escuchaste de mí! ¡Je, je! ¿Listo para aprender?',
      ],
      mitad: [
        '¡Oh, tú otra vez! ¡Mira cuánto has aprendido! ¡Estoy muy orgulloso! Bueno... académicamente hablando.',
        '¡Tus notas están mejorando! ¡Y tu cuenta bancaria también, espero! ¡Recuerda estudiar mucho! ¡El conocimiento nunca puede hacerte daño! Bueno... salvo que estudies medicina. ¡Je, je!',
      ],
      final: [
        '¡Oh, cielos! ¡Mírate! ¡Has crecido muchísimo! ¡Casi parece que ayer eras un estudiante nuevo! ¡Ahora eres prácticamente un experto!',
        '¡Estoy tan orgulloso! ¡Aunque tus métodos de aplicación del conocimiento son... cuestionables! ¡Pero conocimiento es conocimiento! ¡Sigue aprendiendo! ¡Y recuerda! ¡Nunca es demasiado tarde para volver a la universidad! ¡Excepto cuando tienes una deuda universitaria!',
      ],
      rare: [
        '¡Hornee galletas de avena con chispas de chocolate para la clase! ¡Si alguien quiere, están sobre el microscopio!',
      ],
    },
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

  // Obtener frase contextualmente adecuada según el nivel del jugador (Inicio / Mitad / Final / ⭐ Rara)
  static getRandomQuote(npcId: string, playerLevel: number = 1): string {
    const npc = this.getNPC(npcId);
    if (!npc) return '';

    // 1. Probabilidad del 8% de activar una frase ⭐ Rara
    if (npc.quotes.rare && npc.quotes.rare.length > 0 && Math.random() < 0.08) {
      const rareIndex = Math.floor(Math.random() * npc.quotes.rare.length);
      return `${npc.emoji} **${npc.name}** \`[⭐ RARA]\`: *"${npc.quotes.rare[rareIndex]}"*`;
    }

    // 2. Selección por etapa de nivel (Inicio: Nv. 1-4, Mitad: Nv. 5-9, Final: Nv. 10+)
    let quoteList = npc.quotes.inicio;
    if (playerLevel >= 10 && npc.quotes.final && npc.quotes.final.length > 0) {
      quoteList = npc.quotes.final;
    } else if (playerLevel >= 5 && npc.quotes.mitad && npc.quotes.mitad.length > 0) {
      quoteList = npc.quotes.mitad;
    }

    if (!quoteList || quoteList.length === 0) {
      quoteList = npc.quotes.inicio;
    }

    const randomIndex = Math.floor(Math.random() * quoteList.length);
    return `${npc.emoji} **${npc.name}:** *"${quoteList[randomIndex]}"*`;
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
