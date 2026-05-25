/**
 * ============================================================================
 *  SEED — popula o banco SkillEx com dados fictícios para demonstração.
 *  Inclui categorias, catálogo de habilidades, usuários com matches perfeitos
 *  (ex.: violino ↔ tricô), solicitações em vários estados, transações de
 *  moedas e avaliações.
 *
 *  Senha padrão de todos os usuários: "senha123"
 *  Usuário administrador: ana@skillex.com
 * ============================================================================
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const json = (arr: string[]) => JSON.stringify(arr);

async function clean() {
  console.log('🧹 Limpando dados existentes...');
  await prisma.chatMessage.deleteMany();
  await prisma.exchangeRequestEvent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.exchangeRequest.deleteMany();
  await prisma.userTeachingSkill.deleteMany();
  await prisma.userLearningSkill.deleteMany();
  await prisma.match.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
}

const CATEGORIES = [
  { name: 'Música', slug: 'musica', icon: '🎵', color: '#F97316' },
  { name: 'Idiomas', slug: 'idiomas', icon: '🗣️', color: '#0EA5E9' },
  { name: 'Tecnologia', slug: 'tecnologia', icon: '💻', color: '#6366F1' },
  { name: 'Artesanato', slug: 'artesanato', icon: '🧶', color: '#EC4899' },
  { name: 'Culinária', slug: 'culinaria', icon: '🍳', color: '#EF4444' },
  { name: 'Fotografia', slug: 'fotografia', icon: '📷', color: '#8B5CF6' },
  { name: 'Negócios', slug: 'negocios', icon: '📈', color: '#10B981' },
  { name: 'Design', slug: 'design', icon: '🎨', color: '#F59E0B' },
  { name: 'Esportes', slug: 'esportes', icon: '⚽', color: '#22C55E' },
  { name: 'Bem-estar', slug: 'bem-estar', icon: '🧘', color: '#14B8A6' },
  { name: 'Acadêmico', slug: 'academico', icon: '📚', color: '#3B82F6' },
  { name: 'Outros', slug: 'outros', icon: '✨', color: '#9CA3AF' },
];

const SKILLS: { name: string; category: string }[] = [
  { name: 'Violino', category: 'musica' },
  { name: 'Violão', category: 'musica' },
  { name: 'Piano', category: 'musica' },
  { name: 'Canto', category: 'musica' },
  { name: 'Bateria', category: 'musica' },
  { name: 'Inglês', category: 'idiomas' },
  { name: 'Espanhol', category: 'idiomas' },
  { name: 'Francês', category: 'idiomas' },
  { name: 'Alemão', category: 'idiomas' },
  { name: 'Programação JavaScript', category: 'tecnologia' },
  { name: 'Programação Python', category: 'tecnologia' },
  { name: 'Desenvolvimento Web', category: 'tecnologia' },
  { name: 'Excel', category: 'tecnologia' },
  { name: 'Banco de Dados', category: 'tecnologia' },
  { name: 'Tricô', category: 'artesanato' },
  { name: 'Crochê', category: 'artesanato' },
  { name: 'Bordado', category: 'artesanato' },
  { name: 'Marcenaria', category: 'artesanato' },
  { name: 'Culinária', category: 'culinaria' },
  { name: 'Confeitaria', category: 'culinaria' },
  { name: 'Cozinha Vegana', category: 'culinaria' },
  { name: 'Fotografia', category: 'fotografia' },
  { name: 'Edição de Fotos', category: 'fotografia' },
  { name: 'Marketing Digital', category: 'negocios' },
  { name: 'Gestão Financeira', category: 'negocios' },
  { name: 'Empreendedorismo', category: 'negocios' },
  { name: 'Design Gráfico', category: 'design' },
  { name: 'UI/UX Design', category: 'design' },
  { name: 'Ilustração Digital', category: 'design' },
  { name: 'Yoga', category: 'esportes' },
  { name: 'Musculação', category: 'esportes' },
  { name: 'Futebol', category: 'esportes' },
  { name: 'Meditação', category: 'bem-estar' },
  { name: 'Nutrição', category: 'bem-estar' },
  { name: 'Matemática', category: 'academico' },
  { name: 'Redação', category: 'academico' },
  { name: 'História', category: 'academico' },
];

interface TeachSpec {
  skill: string;
  level: string;
  description?: string;
  years?: number;
  modality?: string;
  acceptsCoins?: boolean;
  acceptsExchange?: boolean;
  coinPrice?: number;
  availability?: string[];
  tags?: string[];
}
interface LearnSpec {
  skill: string;
  currentLevel?: string;
  goal?: string;
  modality?: string;
}
interface UserSpec {
  key: string;
  name: string;
  email: string;
  role?: string;
  bio: string;
  city: string;
  state: string;
  avatarSeed: string;
  gender: string;
  birthDate: string;
  nationality: string;
  languages: string[];
  availability: string[];
  modality: string;
  activeDaysAgo: number;
  balance: number;
  teach: TeachSpec[];
  learn: LearnSpec[];
}

const USERS: UserSpec[] = [
  {
    key: 'ana',
    name: 'Ana Beatriz',
    email: 'ana@skillex.com',
    role: 'ADMIN',
    bio: 'Violinista há 10 anos. Apaixonada por ensinar música e curiosa para aprender artesanato.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'ana',
    gender: 'FEMALE',
    birthDate: '1994-03-15',
    nationality: 'Brasileira',
    languages: ['Português', 'Inglês'],
    availability: ['MORNING', 'NIGHT'],
    modality: 'BOTH',
    activeDaysAgo: 0,
    balance: 250,
    teach: [
      {
        skill: 'Violino',
        level: 'EXPERT',
        description: 'Aulas de violino do básico ao avançado, técnica e repertório.',
        years: 10,
        coinPrice: 60,
        availability: ['MORNING', 'NIGHT'],
        tags: ['clássico', 'iniciantes'],
      },
    ],
    learn: [{ skill: 'Tricô', currentLevel: 'NONE', goal: 'Aprender a fazer um cachecol.' }],
  },
  {
    key: 'bruno',
    name: 'Bruno Carvalho',
    email: 'bruno@skillex.com',
    bio: 'Artesão de tricô e crochê. Quero realizar o sonho de tocar violino.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'bruno',
    gender: 'MALE',
    birthDate: '1990-07-22',
    nationality: 'Brasileiro',
    languages: ['Português'],
    availability: ['NIGHT', 'WEEKEND'],
    modality: 'BOTH',
    activeDaysAgo: 1,
    balance: 100,
    teach: [
      {
        skill: 'Tricô',
        level: 'ADVANCED',
        description: 'Ensino tricô para iniciantes, do ponto básico às peças completas.',
        years: 6,
        coinPrice: 30,
        availability: ['NIGHT', 'WEEKEND'],
        tags: ['iniciantes', 'inverno'],
      },
    ],
    learn: [{ skill: 'Violino', currentLevel: 'NONE', goal: 'Tocar minhas primeiras músicas.' }],
  },
  {
    key: 'carla',
    name: 'Carla Mendes',
    email: 'carla@skillex.com',
    bio: 'Professora de inglês e fotógrafa nas horas vagas. Sonho em programar.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'carla',
    gender: 'FEMALE',
    birthDate: '1996-11-02',
    nationality: 'Brasileira',
    languages: ['Português', 'Inglês'],
    availability: ['AFTERNOON', 'NIGHT'],
    modality: 'ONLINE',
    activeDaysAgo: 0,
    balance: 100,
    teach: [
      {
        skill: 'Inglês',
        level: 'ADVANCED',
        description: 'Conversação e gramática para todos os níveis.',
        years: 5,
        coinPrice: 50,
        availability: ['AFTERNOON', 'NIGHT'],
        tags: ['conversação'],
      },
      { skill: 'Fotografia', level: 'INTERMEDIATE', years: 3, coinPrice: 45 },
    ],
    learn: [
      { skill: 'Programação JavaScript', currentLevel: 'BEGINNER', goal: 'Criar meu site.' },
    ],
  },
  {
    key: 'diego',
    name: 'Diego Souza',
    email: 'diego@skillex.com',
    bio: 'Desenvolvedor full-stack. Adoro ensinar código e quero destravar o inglês.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'diego',
    gender: 'MALE',
    birthDate: '1993-01-18',
    nationality: 'Brasileiro',
    languages: ['Português'],
    availability: ['NIGHT'],
    modality: 'ONLINE',
    activeDaysAgo: 2,
    balance: 100,
    teach: [
      {
        skill: 'Programação JavaScript',
        level: 'ADVANCED',
        description: 'Do zero ao primeiro projeto web com JavaScript.',
        years: 7,
        coinPrice: 70,
        availability: ['NIGHT'],
        tags: ['web', 'iniciantes'],
      },
      { skill: 'Programação Python', level: 'INTERMEDIATE', years: 4, coinPrice: 60 },
    ],
    learn: [{ skill: 'Inglês', currentLevel: 'INTERMEDIATE', goal: 'Fluência para entrevistas.' }],
  },
  {
    key: 'elena',
    name: 'Elena Rossi',
    email: 'elena@skillex.com',
    bio: 'Chef de cozinha italiana. Quero aprender design para meu restaurante.',
    city: 'Rio de Janeiro',
    state: 'RJ',
    avatarSeed: 'elena',
    gender: 'FEMALE',
    birthDate: '1988-09-30',
    nationality: 'Italiana',
    languages: ['Português', 'Italiano'],
    availability: ['MORNING', 'AFTERNOON'],
    modality: 'IN_PERSON',
    activeDaysAgo: 3,
    balance: 100,
    teach: [
      {
        skill: 'Culinária',
        level: 'ADVANCED',
        description: 'Massas e pratos italianos autênticos.',
        years: 12,
        coinPrice: 80,
        availability: ['MORNING', 'AFTERNOON'],
        tags: ['italiana', 'massas'],
      },
      { skill: 'Confeitaria', level: 'INTERMEDIATE', years: 5 },
    ],
    learn: [{ skill: 'Design Gráfico', currentLevel: 'NONE', goal: 'Criar o cardápio.' }],
  },
  {
    key: 'felipe',
    name: 'Felipe Andrade',
    email: 'felipe@skillex.com',
    bio: 'Designer gráfico e ilustrador. Apaixonado por gastronomia.',
    city: 'Rio de Janeiro',
    state: 'RJ',
    avatarSeed: 'felipe',
    gender: 'MALE',
    birthDate: '1991-05-12',
    nationality: 'Brasileiro',
    languages: ['Português', 'Inglês'],
    availability: ['AFTERNOON', 'NIGHT'],
    modality: 'BOTH',
    activeDaysAgo: 1,
    balance: 100,
    teach: [
      {
        skill: 'Design Gráfico',
        level: 'EXPERT',
        description: 'Identidade visual, logotipos e materiais gráficos.',
        years: 9,
        coinPrice: 75,
        availability: ['AFTERNOON', 'NIGHT'],
        tags: ['branding'],
      },
      { skill: 'UI/UX Design', level: 'ADVANCED', years: 6, coinPrice: 80 },
    ],
    learn: [
      { skill: 'Culinária', currentLevel: 'BEGINNER', goal: 'Cozinhar pratos italianos.' },
      { skill: 'Marketing Digital', currentLevel: 'BEGINNER' },
    ],
  },
  {
    key: 'gabriela',
    name: 'Gabriela Lima',
    email: 'gabriela@skillex.com',
    bio: 'Especialista em marketing digital. Quero melhorar minhas fotos.',
    city: 'Rio de Janeiro',
    state: 'RJ',
    avatarSeed: 'gabriela',
    gender: 'FEMALE',
    birthDate: '1997-02-08',
    nationality: 'Brasileira',
    languages: ['Português'],
    availability: ['MORNING', 'NIGHT'],
    modality: 'ONLINE',
    activeDaysAgo: 4,
    balance: 60,
    teach: [
      {
        skill: 'Marketing Digital',
        level: 'ADVANCED',
        description: 'Estratégias de redes sociais e tráfego pago.',
        years: 5,
        coinPrice: 65,
        availability: ['MORNING', 'NIGHT'],
        tags: ['redes sociais'],
      },
    ],
    learn: [{ skill: 'Fotografia', currentLevel: 'BEGINNER', goal: 'Fotos para o Instagram.' }],
  },
  {
    key: 'henrique',
    name: 'Henrique Oliveira',
    email: 'henrique@skillex.com',
    bio: 'Analista de dados. Domino Excel e matemática. Foco em aprender inglês.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'henrique',
    gender: 'MALE',
    birthDate: '1989-12-01',
    nationality: 'Brasileiro',
    languages: ['Português'],
    availability: ['NIGHT', 'WEEKEND'],
    modality: 'BOTH',
    activeDaysAgo: 5,
    balance: 50,
    teach: [
      {
        skill: 'Excel',
        level: 'EXPERT',
        description: 'Planilhas, fórmulas, dashboards e automações.',
        years: 8,
        coinPrice: 55,
        availability: ['NIGHT', 'WEEKEND'],
        tags: ['planilhas', 'dados'],
      },
      { skill: 'Matemática', level: 'ADVANCED', years: 6 },
    ],
    learn: [{ skill: 'Inglês', currentLevel: 'BEGINNER', goal: 'Ler documentação técnica.' }],
  },
  {
    key: 'isabela',
    name: 'Isabela Castro',
    email: 'isabela@skillex.com',
    bio: 'Professora de espanhol e instrutora de yoga. Quero aprender violão.',
    city: 'Belo Horizonte',
    state: 'MG',
    avatarSeed: 'isabela',
    gender: 'FEMALE',
    birthDate: '1992-06-25',
    nationality: 'Brasileira',
    languages: ['Português', 'Espanhol'],
    availability: ['MORNING', 'AFTERNOON'],
    modality: 'BOTH',
    activeDaysAgo: 2,
    balance: 100,
    teach: [
      {
        skill: 'Espanhol',
        level: 'EXPERT',
        description: 'Espanhol para viagens e negócios.',
        years: 8,
        coinPrice: 50,
        availability: ['MORNING', 'AFTERNOON'],
        tags: ['conversação'],
      },
      { skill: 'Yoga', level: 'ADVANCED', years: 5, coinPrice: 40 },
    ],
    learn: [{ skill: 'Violão', currentLevel: 'NONE', goal: 'Tocar para relaxar.' }],
  },
  {
    key: 'joao',
    name: 'João Pedro',
    email: 'joao@skillex.com',
    bio: 'Músico e programador. Toco violão e quero aprender espanhol.',
    city: 'Belo Horizonte',
    state: 'MG',
    avatarSeed: 'joao',
    gender: 'MALE',
    birthDate: '1995-08-14',
    nationality: 'Brasileiro',
    languages: ['Português'],
    availability: ['AFTERNOON', 'NIGHT'],
    modality: 'BOTH',
    activeDaysAgo: 1,
    balance: 100,
    teach: [
      {
        skill: 'Violão',
        level: 'ADVANCED',
        description: 'Violão popular, acordes e ritmos brasileiros.',
        years: 7,
        coinPrice: 45,
        availability: ['AFTERNOON', 'NIGHT'],
        tags: ['MPB', 'iniciantes'],
      },
      { skill: 'Programação Python', level: 'INTERMEDIATE', years: 3, coinPrice: 55 },
    ],
    learn: [{ skill: 'Espanhol', currentLevel: 'BEGINNER', goal: 'Conversar em viagens.' }],
  },
  {
    key: 'karina',
    name: 'Karina Alves',
    email: 'karina@skillex.com',
    bio: 'Artesã de tricô e crochê. Quero aprender fotografia e inglês.',
    city: 'Belo Horizonte',
    state: 'MG',
    avatarSeed: 'karina',
    gender: 'FEMALE',
    birthDate: '1986-04-19',
    nationality: 'Brasileira',
    languages: ['Português'],
    availability: ['MORNING', 'WEEKEND'],
    modality: 'IN_PERSON',
    activeDaysAgo: 6,
    balance: 100,
    teach: [
      {
        skill: 'Tricô',
        level: 'EXPERT',
        description: 'Tricô avançado e peças sob medida.',
        years: 15,
        coinPrice: 35,
        availability: ['MORNING', 'WEEKEND'],
        tags: ['avançado'],
      },
      { skill: 'Crochê', level: 'ADVANCED', years: 12 },
    ],
    learn: [
      { skill: 'Fotografia', currentLevel: 'NONE', goal: 'Fotografar minhas peças.' },
      { skill: 'Inglês', currentLevel: 'BEGINNER' },
    ],
  },
  {
    key: 'lucas',
    name: 'Lucas Ferreira',
    email: 'lucas@skillex.com',
    bio: 'Fotógrafo profissional. Curioso para aprender tricô com a vovó.',
    city: 'São Paulo',
    state: 'SP',
    avatarSeed: 'lucas',
    gender: 'MALE',
    birthDate: '1994-10-05',
    nationality: 'Brasileiro',
    languages: ['Português', 'Inglês'],
    availability: ['AFTERNOON', 'WEEKEND'],
    modality: 'BOTH',
    activeDaysAgo: 0,
    balance: 140,
    teach: [
      {
        skill: 'Fotografia',
        level: 'ADVANCED',
        description: 'Fotografia de retrato e produtos, do clique à edição.',
        years: 8,
        coinPrice: 40,
        availability: ['AFTERNOON', 'WEEKEND'],
        tags: ['retrato', 'produtos'],
      },
    ],
    learn: [{ skill: 'Tricô', currentLevel: 'NONE', goal: 'Fazer um presente artesanal.' }],
  },
];

async function main() {
  await clean();

  console.log('📁 Criando categorias...');
  const categoryMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: c });
    categoryMap[c.slug] = created.id;
  }

  console.log('🛠️  Criando catálogo de habilidades...');
  const skillMap: Record<string, string> = {};
  for (const s of SKILLS) {
    const created = await prisma.skill.create({
      data: { name: s.name, slug: slugify(s.name), categoryId: categoryMap[s.category] },
    });
    skillMap[s.name] = created.id;
  }

  console.log('👥 Criando usuários, perfis, carteiras e habilidades...');
  const passwordHash = await bcrypt.hash('senha123', 10);
  const userMap: Record<string, string> = {};

  for (const u of USERS) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role ?? 'USER',
        bio: u.bio,
        city: u.city,
        state: u.state,
        avatarUrl: `https://i.pravatar.cc/300?u=${u.avatarSeed}`,
        onboardingCompleted: true,
        lastActiveAt: daysAgo(u.activeDaysAgo),
        profile: {
          create: {
            gender: u.gender,
            birthDate: new Date(u.birthDate),
            nationality: u.nationality,
            languages: json(u.languages),
            learningPrefs: json(['Prático', 'Online']),
            availability: json(u.availability),
            preferredModality: u.modality,
          },
        },
        wallet: { create: { balance: u.balance, lockedBalance: 0 } },
      },
    });
    userMap[u.key] = user.id;

    // Transações iniciais da carteira (bônus + eventual recarga)
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    await prisma.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: 100,
        type: 'BONUS',
        balanceAfter: 100,
        description: 'Bônus de boas-vindas',
        createdAt: daysAgo(30),
      },
    });
    if (u.balance > 100) {
      await prisma.coinTransaction.create({
        data: {
          walletId: wallet.id,
          amount: u.balance - 100,
          type: 'PURCHASE',
          balanceAfter: u.balance,
          description: 'Compra de moedas',
          createdAt: daysAgo(10),
        },
      });
    }

    for (const t of u.teach) {
      await prisma.userTeachingSkill.create({
        data: {
          userId: user.id,
          skillId: skillMap[t.skill],
          level: t.level,
          description: t.description,
          experienceYears: t.years,
          modality: t.modality ?? u.modality,
          acceptsCoins: t.acceptsCoins ?? true,
          acceptsExchange: t.acceptsExchange ?? true,
          coinPrice: t.coinPrice ?? null,
          availability: t.availability ? json(t.availability) : json(u.availability),
          tags: t.tags ? json(t.tags) : null,
        },
      });
    }
    for (const l of u.learn) {
      await prisma.userLearningSkill.create({
        data: {
          userId: user.id,
          skillId: skillMap[l.skill],
          currentLevel: l.currentLevel ?? 'NONE',
          goal: l.goal,
          modality: l.modality ?? u.modality,
        },
      });
    }
  }

  console.log('🤝 Criando solicitações de troca/aula...');

  // R1 — Troca concluída: Bruno (tricô) ↔ Ana (violino)
  const r1 = await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.bruno,
      recipientId: userMap.ana,
      requestedSkillId: skillMap['Violino'],
      offeredSkillId: skillMap['Tricô'],
      type: 'EXCHANGE',
      status: 'COMPLETED',
      message: 'Oi Ana! Topa trocar aulas? Te ensino tricô e você me ensina violino 🎻',
      suggestedDate: daysAgo(7),
      createdAt: daysAgo(12),
      events: {
        create: [
          { status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(12) },
          { status: 'ACCEPTED', note: 'Solicitação aceita', createdAt: daysAgo(11) },
          { status: 'COMPLETED', note: 'Troca concluída', createdAt: daysAgo(6) },
        ],
      },
    },
  });

  // R2 — Troca aceita: Carla (inglês) ↔ Diego (JS)
  const r2 = await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.carla,
      recipientId: userMap.diego,
      requestedSkillId: skillMap['Programação JavaScript'],
      offeredSkillId: skillMap['Inglês'],
      type: 'EXCHANGE',
      status: 'ACCEPTED',
      message: 'Diego, bora trocar? Inglês por JavaScript 😄',
      suggestedDate: daysAgo(-2),
      createdAt: daysAgo(4),
      events: {
        create: [
          { status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(4) },
          { status: 'ACCEPTED', note: 'Solicitação aceita', createdAt: daysAgo(3) },
        ],
      },
    },
  });
  await prisma.chatMessage.createMany({
    data: [
      {
        requestId: r2.id,
        senderId: userMap.carla,
        content: 'Oi Diego! Que dia fica melhor pra você?',
        read: true,
        createdAt: daysAgo(3),
      },
      {
        requestId: r2.id,
        senderId: userMap.diego,
        content: 'Quinta à noite? Podemos começar pelo básico de JS.',
        read: false,
        createdAt: daysAgo(2),
      },
    ],
  });

  // R3 — Troca pendente: Elena (culinária) ↔ Felipe (design)
  const r3 = await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.elena,
      recipientId: userMap.felipe,
      requestedSkillId: skillMap['Design Gráfico'],
      offeredSkillId: skillMap['Culinária'],
      type: 'EXCHANGE',
      status: 'PENDING',
      message: 'Felipe, posso te ensinar culinária italiana em troca de design?',
      createdAt: daysAgo(1),
      events: { create: [{ status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(1) }] },
    },
  });

  // R4 — Aula paga pendente: Henrique paga Carla (inglês), moedas reservadas
  const r4 = await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.henrique,
      recipientId: userMap.carla,
      requestedSkillId: skillMap['Inglês'],
      type: 'COIN',
      status: 'PENDING',
      coinAmount: 50,
      message: 'Carla, quero aulas de inglês técnico. Pago com moedas!',
      createdAt: daysAgo(2),
      events: { create: [{ status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(2) }] },
    },
  });
  // Reserva (LOCK) das moedas do Henrique
  const henriqueWallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId: userMap.henrique },
  });
  await prisma.wallet.update({
    where: { id: henriqueWallet.id },
    data: { lockedBalance: 50 },
  });
  await prisma.coinTransaction.create({
    data: {
      walletId: henriqueWallet.id,
      amount: -50,
      type: 'LOCK',
      balanceAfter: 50,
      description: 'Reserva de moedas para aula',
      relatedRequestId: r4.id,
      createdAt: daysAgo(2),
    },
  });

  // R5 — Aula paga concluída: Gabriela paga Lucas (fotografia)
  const r5 = await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.gabriela,
      recipientId: userMap.lucas,
      requestedSkillId: skillMap['Fotografia'],
      type: 'COIN',
      status: 'COMPLETED',
      coinAmount: 40,
      message: 'Lucas, preciso melhorar minhas fotos de produto!',
      suggestedDate: daysAgo(5),
      createdAt: daysAgo(9),
      events: {
        create: [
          { status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(9) },
          { status: 'ACCEPTED', note: 'Solicitação aceita', createdAt: daysAgo(8) },
          { status: 'COMPLETED', note: 'Aula concluída', createdAt: daysAgo(5) },
        ],
      },
    },
  });
  // Ledger do pagamento concluído (Gabriela → Lucas)
  const gabrielaWallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId: userMap.gabriela },
  });
  const lucasWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: userMap.lucas } });
  await prisma.coinTransaction.createMany({
    data: [
      {
        walletId: gabrielaWallet.id,
        amount: -40,
        type: 'LOCK',
        balanceAfter: 60,
        description: 'Reserva de moedas para aula',
        relatedRequestId: r5.id,
        createdAt: daysAgo(9),
      },
      {
        walletId: gabrielaWallet.id,
        amount: 0,
        type: 'SPEND',
        balanceAfter: 60,
        description: 'Aula concluída — 40 moedas pagas ao professor',
        relatedRequestId: r5.id,
        createdAt: daysAgo(5),
      },
      {
        walletId: lucasWallet.id,
        amount: 40,
        type: 'EARNING',
        balanceAfter: 140,
        description: 'Recebimento por aula concluída',
        relatedRequestId: r5.id,
        createdAt: daysAgo(5),
      },
    ],
  });

  // R6 — Troca aceita: Isabela (espanhol) ↔ João (violão)
  await prisma.exchangeRequest.create({
    data: {
      requesterId: userMap.isabela,
      recipientId: userMap.joao,
      requestedSkillId: skillMap['Violão'],
      offeredSkillId: skillMap['Espanhol'],
      type: 'EXCHANGE',
      status: 'ACCEPTED',
      message: 'João, troco aulas de espanhol pelas suas de violão? 🎸',
      createdAt: daysAgo(3),
      events: {
        create: [
          { status: 'PENDING', note: 'Solicitação criada', createdAt: daysAgo(3) },
          { status: 'ACCEPTED', note: 'Solicitação aceita', createdAt: daysAgo(2) },
        ],
      },
    },
  });

  console.log('⭐ Criando avaliações...');
  await prisma.review.createMany({
    data: [
      {
        requestId: r1.id,
        authorId: userMap.bruno,
        targetId: userMap.ana,
        skillId: skillMap['Violino'],
        rating: 5,
        comment: 'A Ana é uma excelente professora! Muito paciente e didática.',
        createdAt: daysAgo(5),
      },
      {
        requestId: r1.id,
        authorId: userMap.ana,
        targetId: userMap.bruno,
        skillId: skillMap['Tricô'],
        rating: 5,
        comment: 'Bruno explica tricô de um jeito super claro. Recomendo!',
        createdAt: daysAgo(5),
      },
      {
        requestId: r5.id,
        authorId: userMap.gabriela,
        targetId: userMap.lucas,
        skillId: skillMap['Fotografia'],
        rating: 4,
        comment: 'Ótimas dicas de fotografia de produto. Minhas fotos melhoraram muito!',
        createdAt: daysAgo(4),
      },
    ],
  });

  console.log('💚 Criando favoritos...');
  await prisma.favorite.createMany({
    data: [
      { userId: userMap.ana, favoriteUserId: userMap.carla },
      { userId: userMap.carla, favoriteUserId: userMap.diego },
      { userId: userMap.lucas, favoriteUserId: userMap.karina },
    ],
  });

  console.log('🔔 Criando notificações...');
  await prisma.notification.createMany({
    data: [
      {
        userId: userMap.felipe,
        type: 'REQUEST_RECEIVED',
        title: 'Nova solicitação recebida',
        message: 'Elena Rossi propôs uma troca de habilidades',
        link: `/requests/${r3.id}`,
        createdAt: daysAgo(1),
      },
      {
        userId: userMap.carla,
        type: 'REQUEST_RECEIVED',
        title: 'Nova solicitação recebida',
        message: 'Henrique Oliveira quer agendar uma aula com você',
        link: `/requests/${r4.id}`,
        createdAt: daysAgo(2),
      },
      {
        userId: userMap.bruno,
        type: 'REVIEW_RECEIVED',
        title: 'Nova avaliação ⭐',
        message: 'Você recebeu uma avaliação de 5 estrelas.',
        read: true,
        link: `/profile/${userMap.bruno}`,
        createdAt: daysAgo(5),
      },
    ],
  });

  console.log('\n✅ Seed concluído com sucesso!');
  console.log('   Usuários criados:', USERS.length);
  console.log('   Login de teste: ana@skillex.com / senha123 (admin)');
  console.log('   Outros: bruno@skillex.com, carla@skillex.com ... (senha: senha123)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
