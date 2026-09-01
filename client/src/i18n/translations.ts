export type Language = 'es' | 'en' | 'pt' | 'fr' | 'de';

export interface TranslationDictionary {
  // Sidebar categories
  cat_district: string;
  cat_activities: string;
  cat_commerce: string;
  cat_career: string;
  cat_syndicate: string;
  cat_system: string;

  // Tabs
  hub: string;
  profile: string;
  gym: string;
  crimes: string;
  bounties: string;
  boss: string;
  jail: string;
  inventory: string;
  market: string;
  bank: string;
  shop: string;
  education: string;
  property: string;
  profession: string;
  missions: string;
  faction: string;
  casino: string;
  travel: string;
  racing: string;
  mastery: string;
  company: string;
  duels: string;
  admin: string;
  loader_demo: string;

  // General UI & Stats
  energy: string;
  nerve: string;
  happy: string;
  life: string;
  health: string;
  cash: string;
  bank_balance: string;
  level: string;
  heat: string;
  profession_title: string;
  syndicate: string;
  next_regen_in: string;
  full_regen_in: string;
  energy_regen: string;
  next_tick: string;
  full_regen: string;
  full: string;
  energy_note: string;
  health_info_title: string;
  health_info_desc: string;
  nerve_info_title: string;
  nerve_info_desc: string;
  heat_info_title: string;
  heat_info_desc: string;
  active: string;
  boss_badge: string;
  claimed: string;
  buy: string;
  in_progress: string;
  completed: string;
  select_language: string;
  module_locked: string;
  level_req: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  es: {
    cat_district: 'DISTRITO CENTRAL',
    cat_activities: 'ACTIVIDADES & COMBATE',
    cat_commerce: 'COMERCIO & FINANZAS',
    cat_career: 'CARRERA & DESARROLLO',
    cat_syndicate: 'SINDICATO & OCIO',
    cat_system: 'SISTEMA',

    hub: 'Distrito Central',
    profile: 'Centro de Operaciones',
    gym: 'Gimnasio Sinford',
    crimes: 'Callejones Criminales',
    bounties: 'Caza de Recompensas',
    boss: 'World Boss Raid',
    jail: 'Prisión del Condado',
    inventory: 'Armería e Inventario',
    market: 'Mercado Negro',
    bank: 'Banco Central & Bóveda',
    shop: 'Tienda & Farmacia',
    education: 'Cursos Universitarios',
    property: 'Bienes Raíces',
    profession: 'Especialización',
    missions: 'Misiones Diarias',
    faction: 'Cuartel de Sindicato',
    casino: 'Casino Subterráneo',
    travel: 'Vuelos Internacionales',
    racing: 'Drag Racing Ilegal',
    mastery: 'Árbol de Maestrías',
    company: 'Empresas de Ciudad',
    duels: 'Duelos PvP & Retos',
    admin: 'Panel Admin Dev',
    loader_demo: 'Demostración Loader',

    energy: 'Energía',
    nerve: 'Nerve',
    happy: 'Felicidad',
    life: 'Salud',
    health: 'Salud',
    cash: 'Efectivo',
    bank_balance: 'Banco',
    level: 'Nivel',
    heat: 'Heat',
    profession_title: 'Profesión',
    syndicate: 'Sindicato',
    next_regen_in: 'Próxima recarga (+5⚡) en:',
    full_regen_in: 'Regeneración 100% llena en:',
    energy_regen: 'Recarga de Energía',
    next_tick: 'Próximo tick (+5⚡)',
    full_regen: 'Recarga 100%',
    full: 'Máximo (100%)',
    energy_note: '⚡ Se regeneran +5⚡ cada 5 minutos automáticamente.',
    health_info_title: 'Salud del Personaje',
    health_info_desc: 'Representa la vitalidad física de tu personaje. Si cae a 0 por combates o sobredosis, serás ingresado de urgencia al Hospital.',
    nerve_info_title: 'Nerve (Astucia Criminal)',
    nerve_info_desc: 'Puntos de audacia requeridos para cometer delitos y robos en los Callejones Criminales. Se regenera progresivamente.',
    heat_info_title: 'Heat (Nivel de Alerta Policial)',
    heat_info_desc: 'Nivel de búsqueda policial por crímenes cometidos. Un Heat elevado aumenta el riesgo de arresto e ingreso a Prisión.',
    active: 'Activo',
    boss_badge: 'JEFE',
    claimed: 'Cobrado',
    buy: 'Comprar',
    in_progress: 'En Curso',
    completed: 'Completado',
    select_language: 'Idioma',
    module_locked: '🔒 Módulo Bloqueado',
    level_req: 'Nivel {req}',
  },
  en: {
    cat_district: 'CENTRAL DISTRICT',
    cat_activities: 'ACTIVITIES & COMBAT',
    cat_commerce: 'COMMERCE & FINANCE',
    cat_career: 'CAREER & DEVELOPMENT',
    cat_syndicate: 'SYNDICATE & LEISURE',
    cat_system: 'SYSTEM',

    hub: 'Central District',
    profile: 'Operations Center',
    gym: 'Sinford Iron Gym',
    crimes: 'Criminal Backalleys',
    bounties: 'Bounty Terminal',
    boss: 'World Boss Raid',
    jail: 'County Jail',
    inventory: 'Armory & Inventory',
    market: 'Black Market',
    bank: 'Central Bank & Vault',
    shop: 'City Shop & Pharmacy',
    education: 'University Courses',
    property: 'Real Estate Properties',
    profession: 'Career Specialization',
    missions: 'Daily Missions',
    faction: 'Syndicate HQ',
    casino: 'Underground Casino',
    travel: 'International Flights',
    racing: 'Illegal Drag Racing',
    mastery: 'Mastery Perks Tree',
    company: 'City Companies',
    duels: 'PvP Duels & Wagers',
    admin: 'Dev Admin Panel',
    loader_demo: 'Loader Demo',

    energy: 'Energy',
    nerve: 'Nerve',
    happy: 'Happy',
    life: 'Health',
    health: 'Health',
    cash: 'Cash',
    bank_balance: 'Bank',
    level: 'Level',
    heat: 'Heat',
    profession_title: 'Profession',
    syndicate: 'Syndicate',
    next_regen_in: 'Next (+5⚡) regen in:',
    full_regen_in: 'Full 100% energy in:',
    energy_regen: 'Energy Recharge',
    next_tick: 'Next tick (+5⚡)',
    full_regen: 'Full 100% recharge',
    full: 'Full (100%)',
    energy_note: '⚡ Regenerates +5⚡ every 5 minutes automatically.',
    health_info_title: 'Player Health',
    health_info_desc: 'Represents physical vitality. If it reaches 0 from combat or overdoses, you will be hospitalized.',
    nerve_info_title: 'Nerve (Criminal Audacity)',
    nerve_info_desc: 'Required points to attempt crimes and heists in Criminal Backalleys. Regenerates automatically over time.',
    heat_info_title: 'Heat (Wanted Level)',
    heat_info_desc: 'Police alert level for committed crimes. High Heat increases the chance of arrest and Jail.',
    active: 'Active',
    boss_badge: 'BOSS',
    claimed: 'Claimed',
    buy: 'Buy',
    in_progress: 'In Progress',
    completed: 'Completed',
    select_language: 'Language',
    module_locked: '🔒 Module Locked',
    level_req: 'Level {req}',
  },
  pt: {
    cat_district: 'DISTRITO CENTRAL',
    cat_activities: 'ATIVIDADES E COMBATE',
    cat_commerce: 'COMÉRCIO E FINANÇAS',
    cat_career: 'CARREIRA E DESENVOLVIMENTO',
    cat_syndicate: 'SINDICATO E LAZER',
    cat_system: 'SISTEMA',

    hub: 'Distrito Central',
    profile: 'Centro de Operações',
    gym: 'Academia Sinford',
    crimes: 'Bieco dos Crimes',
    bounties: 'Terminal de Recompensas',
    boss: 'Incursão de Chefe',
    jail: 'Cadeia do Condado',
    inventory: 'Armaria e Inventário',
    market: 'Mercado Negro',
    bank: 'Banco Central e Cofre',
    shop: 'Loja e Farmácia',
    education: 'Cursos Universitários',
    property: 'Imóveis e Propriedades',
    profession: 'Especialização Profissional',
    missions: 'Missões Diárias',
    faction: 'QG do Sindicato',
    casino: 'Cassino Clandestino',
    travel: 'Voos Internacionais',
    racing: 'Corridas Ilegais Drag',
    mastery: 'Árvore de Maestria',
    company: 'Empresas da Cidade',
    duels: 'Duelos PvP e Apostas',
    admin: 'Painel Admin Dev',
    loader_demo: 'Demonstração de Carregador',

    energy: 'Energia',
    nerve: 'Nerve',
    happy: 'Felicidade',
    life: 'Saúde',
    health: 'Saúde',
    cash: 'Dinheiro',
    bank_balance: 'Banco',
    level: 'Nível',
    heat: 'Heat',
    profession_title: 'Profissão',
    syndicate: 'Sindicato',
    next_regen_in: 'Próxima recarga (+5⚡) em:',
    full_regen_in: 'Regeneração 100% cheia em:',
    energy_regen: 'Recarga de Energia',
    next_tick: 'Próximo tick (+5⚡)',
    full_regen: 'Recarga 100%',
    full: 'Máximo (100%)',
    energy_note: '⚡ Regenera +5⚡ a cada 5 minutos automaticamente.',
    health_info_title: 'Saúde do Jogador',
    health_info_desc: 'Representa a vitalidade física. Se chegar a 0 por combate ou overdose, você irá para o Hospital de urgência.',
    nerve_info_title: 'Nerve (Astúcia Criminal)',
    nerve_info_desc: 'Pontos necessários para cometer crimes e assaltos nos Beco Criminosos. Regenera-se progressivamente.',
    heat_info_title: 'Heat (Nível de Alerta Policial)',
    heat_info_desc: 'Nível de busca policial. Um Heat elevado aumenta significativamente o risco de prisão.',
    active: 'Ativo',
    boss_badge: 'CHEFE',
    claimed: 'Resgatado',
    buy: 'Comprar',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    select_language: 'Idioma',
    module_locked: '🔒 Módulo Bloqueado',
    level_req: 'Nivel {req}',
  },
  fr: {
    cat_district: 'DISTRICT CENTRAL',
    cat_activities: 'ACTIVITÉS & COMBAT',
    cat_commerce: 'COMMERCE & FINANCE',
    cat_career: 'CARRIÈRE & DÉVELOPPEMENT',
    cat_syndicate: 'SYNDICAT & LOISIRS',
    cat_system: 'SYSTÈME',

    hub: 'District Central',
    profile: 'Centre d\'Opérations',
    gym: 'Gymnase Sinford',
    crimes: 'Ruelles Criminelles',
    bounties: 'Terminal de Primes',
    boss: 'Raid de Boss',
    jail: 'Prison du Comté',
    inventory: 'Armurerie & Inventaire',
    market: 'Marché Noir',
    bank: 'Banque Centrale & Coffre',
    shop: 'Boutique & Pharmacie',
    education: 'Cours Universitaires',
    property: 'Propriétés Immobilières',
    profession: 'Spécialisation',
    missions: 'Missions Quotidiennes',
    faction: 'QG du Syndicat',
    casino: 'Casino Clandestin',
    travel: 'Vols Internationaux',
    racing: 'Courses Illégales Drag',
    mastery: 'Arbre de Maîtrise',
    company: 'Entreprises de la Ville',
    duels: 'Duels PvP & Paris',
    admin: 'Panneau Admin Dev',
    loader_demo: 'Démo de Chargement',

    energy: 'Énergie',
    nerve: 'Nerve',
    happy: 'Bonheur',
    life: 'Santé',
    health: 'Santé',
    cash: 'Argent',
    bank_balance: 'Banque',
    level: 'Niveau',
    heat: 'Recherche',
    profession_title: 'Profession',
    syndicate: 'Syndicat',
    next_regen_in: 'Prochaine recharge (+5⚡) dans:',
    full_regen_in: 'Énergie 100% dans:',
    energy_regen: 'Recharge d\'Énergie',
    next_tick: 'Prochain tick (+5⚡)',
    full_regen: 'Recharge 100%',
    full: 'Plein (100%)',
    energy_note: '⚡ Se régénère de +5⚡ toutes les 5 minutes automatiquement.',
    health_info_title: 'Santé du Joueur',
    health_info_desc: 'Représente la vitalité physique. Si elle tombe à 0, vous serez hospitalisé d\'urgence au Hospital.',
    nerve_info_title: 'Nerve (Audace Criminelle)',
    nerve_info_desc: 'Points requis pour commettre des crimes dans les Ruelles Criminelles. Se régénère avec le temps.',
    heat_info_title: 'Heat (Niveau de Recherche)',
    heat_info_desc: 'Niveau d\'alerte de la police. Un Heat élevé augmente le risque d\'arrestation et de Prison.',
    active: 'Actif',
    boss_badge: 'BOSS',
    claimed: 'Réclamé',
    buy: 'Acheter',
    in_progress: 'En Cours',
    completed: 'Terminé',
    select_language: 'Langue',
    module_locked: '🔒 Module Verrouillé',
    level_req: 'Niveau {req}',
  },
  de: {
    cat_district: 'ZENTRALBEZIRK',
    cat_activities: 'AKTIVITÄTEN & KAMPF',
    cat_commerce: 'HANDEL & FINANZEN',
    cat_career: 'KARRIERE & ENTWICKLUNG',
    cat_syndicate: 'SYNDIKAT & FREIZEIT',
    cat_system: 'SYSTEM',

    hub: 'Zentralbezirk',
    profile: 'Operationszentrum',
    gym: 'Sinford Fitnessstudio',
    crimes: 'Kriminelle Gassen',
    bounties: 'Kopfgeld-Terminal',
    boss: 'Weltboss-Raid',
    jail: 'Kreisgefängnis',
    inventory: 'Waffenkammer & Inventar',
    market: 'Schwarzmarkt',
    bank: 'Zentralbank & Tresor',
    shop: 'Stadtladen & Apotheke',
    education: 'Universitätskurse',
    property: 'Immobilien',
    profession: 'Karrierespezialisierung',
    missions: 'Tägliche Missionen',
    faction: 'Syndikat-Hauptquartier',
    casino: 'Untergrund-Casino',
    travel: 'Internationale Flüge',
    racing: 'Illegale Drag-Rennen',
    mastery: 'Meisterschafts-Baum',
    company: 'Stadtunternehmen',
    duels: 'PvP-Duelle & Wetteinsätze',
    admin: 'Dev-Admin-Panel',
    loader_demo: 'Lade-Demo',

    energy: 'Energie',
    nerve: 'Nerven',
    happy: 'Glück',
    life: 'Gesundheit',
    health: 'Gesundheit',
    cash: 'Bargeld',
    bank_balance: 'Bank',
    level: 'Stufe',
    heat: 'Fahndung',
    profession_title: 'Beruf',
    syndicate: 'Syndikat',
    next_regen_in: 'Nächste (+5⚡) aufladung in:',
    full_regen_in: 'Volle 100% energie in:',
    energy_regen: 'Energieaufladung',
    next_tick: 'Nächster Tick (+5⚡)',
    full_regen: 'Volle 100% Aufladung',
    full: 'Voll (100%)',
    energy_note: '⚡ Regeneriert automatisch alle 5 Minuten +5⚡.',
    health_info_title: 'Spielergesundheit',
    health_info_desc: 'Stellt die physische Vitalität dar. Fällt sie auf 0, wirst du ins Krankenhaus eingeliefert.',
    nerve_info_title: 'Nerve (Krimineller Mut)',
    nerve_info_desc: 'Erforderliche Punkte für Verbrechen in den kriminellen Gassen. Regeneriert sich im Laufe der Zeit.',
    heat_info_title: 'Heat (Fahndungslevel)',
    heat_info_desc: 'Polizeiliches Fahndungslevel. Ein hoher Heat erhöht das Risiko einer Festnahme und Gefängnisstrafe.',
    active: 'Aktiv',
    boss_badge: 'BOSS',
    claimed: 'Eingefordert',
    buy: 'Kaufen',
    in_progress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    select_language: 'Sprache',
    module_locked: '🔒 Modul Gesperrt',
    level_req: 'Stufe {req}',
  },
};
