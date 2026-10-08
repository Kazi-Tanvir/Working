import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

function parseDatabaseUrl(urlStr: string) {
  const parsed = new URL(urlStr)
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 3306,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
  }
}

const adapter = new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL!))
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clear existing database records
  await prisma.activityFeed.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.projectError.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.mediaEntry.deleteMany({})
  await prisma.material.deleteMany({})
  await prisma.assignment.deleteMany({})
  await prisma.classSchedule.deleteMany({})
  await prisma.exam.deleteMany({})
  await prisma.appSetting.deleteMany({})
  await prisma.globalNote.deleteMany({})

  // ─── ACADEMIC ────────────────────────────────────────────
  console.log('  Academic...')

  await prisma.exam.createMany({
    data: [
      {
        subject: 'Data Structures & Algorithms',
        syllabus: 'Ch 1-8, Trees, Graphs, Sorting, Hashing',
        date: new Date('2026-07-15'),
        result: null,
        status: 'PENDING',
        notes: 'Focus extra on graph traversal and dynamic programming',
      },
      {
        subject: 'Operating Systems',
        syllabus: 'Process management, Memory, File systems, Deadlocks',
        date: new Date('2026-07-20'),
        result: null,
        status: 'PENDING',
      },
      {
        subject: 'Database Systems',
        syllabus: 'ER models, SQL, Normalization, Transactions',
        date: new Date('2026-07-28'),
        result: null,
        status: 'PENDING',
      },
      {
        subject: 'Discrete Mathematics',
        syllabus: 'Full syllabus — Sets, Logic, Graph Theory',
        date: new Date('2026-06-10'),
        result: 3.75,
        maxResult: 4.0,
        status: 'COMPLETED',
      },
      {
        subject: 'Computer Networks',
        syllabus: 'TCP/IP, OSI Model, Routing, Security',
        date: new Date('2026-06-05'),
        result: 3.5,
        maxResult: 4.0,
        status: 'COMPLETED',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.classSchedule.createMany({
    data: [
      { subject: 'Data Structures', dayOfWeek: 1, startTime: '08:00', endTime: '09:30', room: 'Room 201', color: '#60A5FA' },
      { subject: 'Data Structures', dayOfWeek: 3, startTime: '08:00', endTime: '09:30', room: 'Room 201', color: '#60A5FA' },
      { subject: 'Algorithms',      dayOfWeek: 0, startTime: '10:00', endTime: '11:30', room: 'Room 302', color: '#A78BFA' },
      { subject: 'Algorithms',      dayOfWeek: 2, startTime: '10:00', endTime: '11:30', room: 'Room 302', color: '#A78BFA' },
      { subject: 'Algorithms',      dayOfWeek: 4, startTime: '10:00', endTime: '11:30', room: 'Room 302', color: '#A78BFA' },
      { subject: 'OS Lab',          dayOfWeek: 2, startTime: '14:00', endTime: '16:00', room: 'Lab 101', color: '#34D399' },
      { subject: 'Database',        dayOfWeek: 1, startTime: '13:00', endTime: '14:30', room: 'Room 404', color: '#FBBF24' },
      { subject: 'Database',        dayOfWeek: 4, startTime: '13:00', endTime: '14:30', room: 'Room 404', color: '#FBBF24' },
    ],
    skipDuplicates: true,
  })

  await prisma.assignment.createMany({
    data: [
      {
        subject: 'Mathematics',
        topic: 'Math HW #7 — Integration & Limits',
        deadline: new Date('2026-06-30'),
        completed: false,
        priority: 'HIGH',
      },
      {
        subject: 'Operating Systems',
        topic: 'OS Lab Report — Process Synchronization',
        deadline: new Date('2026-07-01'),
        completed: false,
        priority: 'MEDIUM',
      },
      {
        subject: 'Database Systems',
        topic: 'DB Project Phase 2 — Implementation',
        deadline: new Date('2026-07-10'),
        completed: false,
        priority: 'HIGH',
      },
      {
        subject: 'Algorithms',
        topic: 'Assignment 3 — Dynamic Programming Problems',
        deadline: new Date('2026-07-15'),
        completed: false,
        priority: 'MEDIUM',
      },
      {
        subject: 'Operating Systems',
        topic: 'OS Lab Report — Memory Management',
        deadline: new Date('2026-06-15'),
        completed: true,
        completedAt: new Date('2026-06-14'),
        priority: 'HIGH',
      },
      {
        subject: 'Data Structures',
        topic: 'Assignment 5 — Binary Trees Implementation',
        deadline: new Date('2026-06-10'),
        completed: true,
        completedAt: new Date('2026-06-09'),
        priority: 'MEDIUM',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.material.createMany({
    data: [
      { title: 'DSA Lecture 5 — Trees & BST',        type: 'LECTURE_SHEET', subject: 'Data Structures', tags: '["trees","bst","binary-search"]' },
      { title: 'Introduction to Algorithms (CLRS)',   type: 'BOOK',          subject: 'Algorithms',      tags: '["algorithms","dp","greedy"]' },
      { title: 'OS Lecture 12 — Deadlocks',           type: 'LECTURE_SHEET', subject: 'Operating Systems', tags: '["deadlock","mutex","semaphore"]' },
      { title: 'DSA Midterm 2024',                   type: 'PREVIOUS_QUESTION', subject: 'Data Structures', tags: '["midterm","2024"]' },
      { title: 'Database Design Notes',              type: 'NOTES',         subject: 'Database Systems', tags: '["er-diagram","normalization"]' },
      { title: 'Discrete Math — Graph Theory Notes', type: 'NOTES',         subject: 'Discrete Mathematics', tags: '["graphs","trees"]' },
      { title: 'Computer Networks Textbook',          type: 'BOOK',          subject: 'Computer Networks', tags: '["tcpip","osi"]' },
      { title: 'OS Final 2023',                      type: 'PREVIOUS_QUESTION', subject: 'Operating Systems', tags: '["final","2023"]' },
    ],
    skipDuplicates: true,
  })

  // ─── ENTERTAINMENT ────────────────────────────────────────
  console.log('  Entertainment...')

  await prisma.mediaEntry.createMany({
    data: [
      {
        title: 'Solo Leveling Season 2',
        type: 'ANIME',
        status: 'ONGOING',
        score: 8.5,
        progressCurrent: 8,
        progressTotal: 12,
        progressUnit: 'EPISODES',
        season: 'S2',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1241/142503l.jpg',
        startedAt: new Date('2026-05-12'),
        watchtime: 192,
        notes: 'Great animation quality. Shadow monarch arc is peak.',
        externalSource: 'anilist',
      },
      {
        title: 'Breaking Bad',
        type: 'SERIES',
        status: 'ONGOING',
        score: 9.2,
        progressCurrent: 3,
        progressTotal: 13,
        progressUnit: 'EPISODES',
        season: 'S4',
        coverUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        startedAt: new Date('2026-04-01'),
        watchtime: 720,
        externalSource: 'tmdb',
      },
      {
        title: 'Elden Ring',
        type: 'PC_GAME',
        status: 'ONGOING',
        score: 9.0,
        progressCurrent: 45,
        progressUnit: 'HOURS',
        coverUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
        startedAt: new Date('2026-03-15'),
        watchtime: 2700,
        externalSource: 'rawg',
      },
      {
        title: 'One Piece',
        type: 'ANIME',
        status: 'COMPLETED',
        score: 9.5,
        progressCurrent: 1100,
        progressTotal: 1100,
        progressUnit: 'EPISODES',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
        completedAt: new Date('2026-02-20'),
        watchtime: 30000,
        notes: 'Best story ever told. Worth every minute.',
        externalSource: 'anilist',
      },
      {
        title: 'Attack on Titan: Final Season',
        type: 'ANIME',
        status: 'COMPLETED',
        score: 9.8,
        progressCurrent: 16,
        progressTotal: 16,
        progressUnit: 'EPISODES',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1948/120625l.jpg',
        startedAt: new Date('2026-01-01'),
        completedAt: new Date('2026-01-25'),
        watchtime: 384,
        notes: 'The ending hit different.',
        externalSource: 'anilist',
      },
      {
        title: 'Jujutsu Kaisen Season 2',
        type: 'ANIME',
        status: 'COMPLETED',
        score: 9.3,
        progressCurrent: 23,
        progressTotal: 23,
        progressUnit: 'EPISODES',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1792/138022l.jpg',
        completedAt: new Date('2026-01-10'),
        watchtime: 552,
        externalSource: 'anilist',
      },
      {
        title: 'Cyberpunk 2077',
        type: 'PC_GAME',
        status: 'COMPLETED',
        score: 8.8,
        progressCurrent: 80,
        progressUnit: 'HOURS',
        coverUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg',
        completedAt: new Date('2025-12-20'),
        watchtime: 4800,
        externalSource: 'rawg',
      },
      {
        title: 'Chainsaw Man',
        type: 'ANIME',
        status: 'PLAN_TO_CONSUME',
        progressUnit: 'EPISODES',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
        externalSource: 'anilist',
      },
      {
        title: 'Demon Slayer: Hashira Training Arc',
        type: 'ANIME',
        status: 'PLAN_TO_CONSUME',
        progressUnit: 'EPISODES',
        externalSource: 'anilist',
      },
      {
        title: 'Berserk (Manga)',
        type: 'MANGA',
        status: 'ON_HOLD',
        score: 9.1,
        progressCurrent: 200,
        progressTotal: 374,
        progressUnit: 'CHAPTERS',
        externalSource: 'anilist',
        notes: 'On hold due to exam season. Will resume after finals.',
      },
      {
        title: 'Interstellar',
        type: 'MOVIE',
        status: 'COMPLETED',
        score: 9.5,
        progressCurrent: 1,
        progressTotal: 1,
        progressUnit: 'MOVIES',
        coverUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        completedAt: new Date('2025-11-15'),
        watchtime: 169,
        externalSource: 'tmdb',
      },
      {
        title: 'Your Name',
        type: 'ANIME_MOVIE',
        status: 'COMPLETED',
        score: 9.4,
        progressCurrent: 1,
        progressTotal: 1,
        progressUnit: 'MOVIES',
        completedAt: new Date('2025-10-05'),
        watchtime: 107,
        externalSource: 'anilist',
      },
    ],
    skipDuplicates: true,
  })

  // ─── PROJECTS ─────────────────────────────────────────────
  console.log('  Projects...')

  const shindb = await prisma.project.create({
    data: {
      name: 'shinDB',
      description: 'High-performance anime/media database engine with advanced query capabilities and API layer.',
      status: 'IN_PROGRESS',
      priority: 'P1',
      progress: 78,
      techStack: '["Rust","SQLite","React","TypeScript"]',
      githubUrl: 'https://github.com/tamim/shindb',
      startedAt: new Date('2026-01-15'),
      prd: '## shinDB — Product Requirements\n\n### Overview\nA high-performance local anime/media database.\n\n### Core Features\n- Fast fuzzy search across 50k+ entries\n- REST API with rate limiting\n- React dashboard\n- CSV/JSON import',
      documentation: '## Setup Guide\n\n```bash\ncargo build --release\n./shindb serve --port 3001\n```',
    },
  })

  await prisma.projectError.createMany({
    data: [
      {
        projectId: shindb.id,
        title: 'SQLite lock contention under concurrent writes',
        description: 'When multiple write operations happen simultaneously, getting database lock errors.',
        severity: 'HIGH',
        status: 'RESOLVED',
        resolution: 'Implemented WAL (Write-Ahead Logging) mode. Lock contention eliminated.',
        resolvedAt: new Date('2026-06-26'),
      },
      {
        projectId: shindb.id,
        title: 'API rate limiting not working for burst requests',
        description: 'The sliding window rate limiter fails under rapid burst traffic patterns.',
        severity: 'MEDIUM',
        status: 'INVESTIGATING',
      },
    ],
  })

  const vox = await prisma.project.create({
    data: {
      name: 'VOX Agent',
      description: 'AI-powered voice assistant with natural language processing and smart home integration.',
      status: 'IN_PROGRESS',
      priority: 'P1',
      progress: 45,
      techStack: '["Python","FastAPI","OpenAI","React","TypeScript"]',
      githubUrl: 'https://github.com/tamim/vox-agent',
      startedAt: new Date('2026-03-01'),
    },
  })

  await prisma.projectError.create({
    data: {
      projectId: vox.id,
      title: 'STT latency too high on long sentences',
      description: 'Speech-to-text takes 3+ seconds for sentences over 20 words.',
      severity: 'MEDIUM',
      status: 'OPEN',
    },
  })

  await prisma.project.createMany({
    data: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack online shop with Next.js, Stripe payments, and inventory management.',
        status: 'IN_PROGRESS',
        priority: 'P2',
        progress: 20,
        techStack: '["Next.js","TypeScript","Prisma","MySQL","Stripe"]',
        githubUrl: 'https://github.com/tamim/ecommerce',
        startedAt: new Date('2026-05-01'),
      },
      {
        name: 'Portfolio Website',
        description: 'Personal portfolio showcasing projects, skills, and blog posts.',
        status: 'COMPLETED',
        priority: 'P2',
        progress: 100,
        techStack: '["Next.js","TypeScript","Framer Motion"]',
        githubUrl: 'https://github.com/tamim/portfolio',
        startedAt: new Date('2025-09-01'),
        completedAt: new Date('2026-05-10'),
      },
      {
        name: 'Student Dashboard',
        description: 'Academic performance tracking dashboard for university students.',
        status: 'ARCHIVED',
        priority: 'P3',
        progress: 60,
        techStack: '["React","Firebase","Chart.js"]',
        startedAt: new Date('2025-06-01'),
        completedAt: new Date('2025-12-01'),
      },
      {
        name: 'ShareX for Mobile',
        description: 'Mobile screenshot and file sharing tool inspired by ShareX desktop app.',
        status: 'PLANNED',
        priority: 'P2',
        techStack: '["React Native","TypeScript","Expo"]',
      },
    ],
    skipDuplicates: true,
  })

  // ─── FINANCE ──────────────────────────────────────────────
  console.log('  Finance...')

  const financeData = [
    // Income
    { account: 'CASH',    amount: 10000, isIncome: true,  category: 'Income', subcategory: 'Mother',   date: new Date('2026-06-01'), note: 'Monthly support' },
    { account: 'CASH',    amount: 5000,  isIncome: true,  category: 'Income', subcategory: 'Father',   date: new Date('2026-06-05') },
    { account: 'BKASH',   amount: 2000,  isIncome: true,  category: 'Income', subcategory: 'APU',      date: new Date('2026-06-10'), note: 'Birthday gift' },
    { account: 'SAVINGS', amount: 500,   isIncome: true,  category: 'Income', subcategory: 'Savings',  date: new Date('2026-06-15'), note: 'Monthly interest' },
    // Expenses - Core
    { account: 'SAVINGS', amount: -4500, isIncome: false, category: 'Core expenses', subcategory: 'Rent',        date: new Date('2026-06-01') },
    { account: 'SAVINGS', amount: -2000, isIncome: false, category: 'Core expenses', subcategory: 'Chef',        date: new Date('2026-06-01') },
    { account: 'CASH',    amount: -550,  isIncome: false, category: 'Core expenses', subcategory: 'Electricity', date: new Date('2026-06-05') },
    { account: 'CASH',    amount: -150,  isIncome: false, category: 'Core expenses', subcategory: 'Water',       date: new Date('2026-06-05') },
    // Groceries
    { account: 'CASH',    amount: -480,  isIncome: false, category: 'Groceries', subcategory: 'Food',   date: new Date('2026-06-19'), note: 'Egg - 18 - 200\nBiscuits - 2x\nToothpaste' },
    { account: 'CASH',    amount: -320,  isIncome: false, category: 'Groceries', subcategory: 'Food',   date: new Date('2026-06-12'), note: 'Chicken 1kg, Rice 5kg, Oil' },
    { account: 'CASH',    amount: -150,  isIncome: false, category: 'Groceries', subcategory: 'Snacks', date: new Date('2026-06-14') },
    { account: 'CASH',    amount: -800,  isIncome: false, category: 'Groceries', subcategory: 'Chef',   date: new Date('2026-06-08'), note: 'Ingredients for cook' },
    { account: 'CASH',    amount: -250,  isIncome: false, category: 'Groceries', subcategory: 'Food',   date: new Date('2026-06-22') },
    // Travel
    { account: 'CASH',    amount: -180,  isIncome: false, category: 'Travel', subcategory: 'In Dhaka',  date: new Date('2026-06-20'), note: 'Metro + rickshaw' },
    { account: 'CASH',    amount: -220,  isIncome: false, category: 'Travel', subcategory: 'In Dhaka',  date: new Date('2026-06-15') },
    { account: 'BKASH',   amount: -800,  isIncome: false, category: 'Travel', subcategory: 'Out Dhaka', date: new Date('2026-06-10'), note: 'Bus to Chittagong (return)' },
    // Education
    { account: 'CASH',    amount: -200,  isIncome: false, category: 'Education', subcategory: 'Stationary', date: new Date('2026-06-03'), note: '2 pens, notebook, admit card print' },
    { account: 'BKASH',   amount: -500,  isIncome: false, category: 'Education', subcategory: 'Application', date: new Date('2026-06-08'), note: 'BUET admission fee' },
    { account: 'BKASH',   amount: -350,  isIncome: false, category: 'Education', subcategory: 'Books',       date: new Date('2026-06-20'), note: 'DSA book print' },
    // Other
    { account: 'BKASH',   amount: -300,  isIncome: false, category: 'Other', subcategory: 'Recharge',  date: new Date('2026-06-05'), note: 'Ammu 200, Abbu 100' },
    { account: 'CASH',    amount: -120,  isIncome: false, category: 'Other', subcategory: undefined,   date: new Date('2026-06-18'), note: 'Medicine - paracetamol' },
    // Balance corrections (internal transfers)
    { account: 'CASH',    amount: -2000, isIncome: false, category: 'Balance Correction', date: new Date('2026-06-01'), isBalanceCorrection: true },
    { account: 'BKASH',   amount: 2000,  isIncome: true,  category: 'Balance Correction', date: new Date('2026-06-01'), isBalanceCorrection: true },
    // Previous months
    { account: 'CASH',    amount: 10000, isIncome: true,  category: 'Income', subcategory: 'Mother',   date: new Date('2026-05-01') },
    { account: 'CASH',    amount: 5000,  isIncome: true,  category: 'Income', subcategory: 'Father',   date: new Date('2026-05-05') },
    { account: 'SAVINGS', amount: -4500, isIncome: false, category: 'Core expenses', subcategory: 'Rent', date: new Date('2026-05-01') },
    { account: 'CASH',    amount: -420,  isIncome: false, category: 'Groceries', subcategory: 'Food',   date: new Date('2026-05-10') },
    { account: 'CASH',    amount: -350,  isIncome: false, category: 'Travel', subcategory: 'In Dhaka', date: new Date('2026-05-15') },
    { account: 'BKASH',   amount: -600,  isIncome: false, category: 'Education', subcategory: 'Application', date: new Date('2026-05-20'), note: 'KUET application fee' },
    { account: 'CASH',    amount: 10000, isIncome: true,  category: 'Income', subcategory: 'Mother',   date: new Date('2026-04-01') },
    { account: 'SAVINGS', amount: -4500, isIncome: false, category: 'Core expenses', subcategory: 'Rent', date: new Date('2026-04-01') },
    { account: 'CASH',    amount: -1200, isIncome: false, category: 'Shopping', subcategory: undefined,  date: new Date('2026-04-15'), note: 'New hoodie' },
  ]

  for (const txn of financeData) {
    await prisma.transaction.create({
      data: {
        account: txn.account,
        amount: txn.amount,
        currency: 'BDT',
        isIncome: txn.isIncome,
        category: txn.category,
        subcategory: txn.subcategory ?? null,
        date: txn.date,
        note: txn.note ?? null,
        isBalanceCorrection: txn.isBalanceCorrection ?? false,
      },
    })
  }

  // ─── ACTIVITY FEED ────────────────────────────────────────
  console.log('  Activity Feed...')

  await prisma.activityFeed.createMany({
    data: [
      { section: 'academic',  type: 'assignment_complete', title: 'Completed: OS Lab Report — Memory Management', icon: 'DONE', linkTo: '/academic', timestamp: new Date('2026-06-27T10:15:00Z') },
      { section: 'finance',   type: 'expense',    title: 'Expense: ৳480 — Groceries/Food (CASH)',     icon: 'EXP', linkTo: '/finance',       timestamp: new Date('2026-06-27T09:30:00Z') },
      { section: 'entertainment', type: 'watch', title: 'Watched: Solo Leveling S2 Ep 8',             icon: 'VIEW', linkTo: '/entertainment', timestamp: new Date('2026-06-27T09:00:00Z') },
      { section: 'projects',  type: 'update',     title: 'Updated progress: shinDB → 78%',            icon: 'UPD', linkTo: '/projects',      timestamp: new Date('2026-06-26T14:00:00Z') },
      { section: 'finance',   type: 'income',     title: 'Income: ৳10,000 — Mother (CASH)',            icon: 'INC', linkTo: '/finance',       timestamp: new Date('2026-06-26T08:00:00Z') },
      { section: 'academic',  type: 'exam_added', title: 'Added exam: Data Structures — Jul 15',     icon: 'NEW', linkTo: '/academic',      timestamp: new Date('2026-06-25T12:00:00Z') },
      { section: 'entertainment', type: 'watch', title: 'Completed: Attack on Titan Final Season',    icon: 'FIN', linkTo: '/entertainment', timestamp: new Date('2026-06-25T08:00:00Z') },
      { section: 'projects',  type: 'error',      title: 'Resolved: SQLite lock contention in shinDB', icon: 'OK', linkTo: '/projects',    timestamp: new Date('2026-06-24T16:00:00Z') },
    ],
    skipDuplicates: true,
  })

  // ─── SETTINGS ─────────────────────────────────────────────
  await prisma.appSetting.createMany({
    data: [
      { key: 'user_name',         value: 'Tamim' },
      { key: 'currency',          value: 'BDT' },
      { key: 'obsidian_vault',    value: 'Academic' },
      { key: 'github_username',   value: 'tamim' },
      { key: 'shindb_api_url',    value: '' },
      { key: 'rawg_api_key',      value: '' },
      { key: 'tmdb_api_key',      value: '' },
    ],
    skipDuplicates: true,
  })

  // ─── GLOBAL NOTE ─────────────────────────────────────────
  await prisma.globalNote.upsert({
    where: { key: 'scratchpad' },
    update: {},
    create: {
      key: 'scratchpad',
      content: '# Scratch Pad\n\nYour quick notes go here...\n\n- [ ] Task 1\n- [ ] Task 2\n',
    },
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
