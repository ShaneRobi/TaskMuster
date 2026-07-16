import { addDays, todayInTimeZone } from './dateUtils.js';

const STORAGE_VERSION = 1;
const EVIDENCE_MIN_LENGTH = 12;

export const TRACK_TEMPLATES = [
  {
    id: 'algorithms',
    name: 'Algorithms',
    eyebrow: 'Blind 75',
    baseTarget: 150,
    color: '#69d486',
    evidence: 'Attempt, code or link, complexity, explanation, and hints used',
  },
  {
    id: 'math',
    name: 'Quant math',
    eyebrow: 'Number sense',
    baseTarget: 90,
    color: '#a78bfa',
    evidence: 'Drill result plus a strategy, derivation, or corrected error',
  },
  {
    id: 'build',
    name: 'Build',
    eyebrow: 'Engineering',
    baseTarget: 60,
    color: '#60a5fa',
    evidence: 'Commit, test output, pull request, screenshot, or shipped behavior',
  },
  {
    id: 'sql',
    name: 'SQL',
    eyebrow: 'Data',
    baseTarget: 30,
    color: '#f59e0b',
    evidence: 'Saved query and result, including the joins or aggregation used',
  },
  {
    id: 'english',
    name: 'English',
    eyebrow: 'Explanation',
    baseTarget: 30,
    color: '#fb7185',
    evidence: 'A clear written or recorded technical explanation',
  },
];

const ROADMAP_TITLES = [
  'Python through problems', 'Arrays & strings',
  'Arithmetic foundations', 'Clean functions & tests',
  'Hashing & two pointers', 'Core SQL',
  'Sliding window & search', 'Market-data importer',
  'Stacks, queues & lists', 'Probability foundations',
  'Trees, BFS & DFS', 'SQLite persistence',
  'Heaps & intervals', 'Statistics foundations',
  'Graphs & greedy', 'Backtesting module',
  'Dynamic programming I', 'Linear algebra',
  'Dynamic programming II', 'Technical reporting',
  'Mixed timed sets', 'C++ evaluation',
  'Re-solve failures', 'Project release',
];

const DEFAULT_QUEUE = [
  {
    id: 'w1-python-problems',
    trackId: 'algorithms',
    type: 'Lesson',
    title: 'Python through problems',
    detail: 'Trace one solution and name two edge cases',
    remaining: '1 exercise',
    state: 'active',
    prerequisiteIds: [],
    order: 1,
  },
  {
    id: 'blind-contains-duplicate',
    trackId: 'algorithms',
    type: 'Blind 75',
    title: 'Contains Duplicate',
    detail: 'Arrays & Hashing · Easy · 30 minute attempt',
    remaining: '1 problem',
    state: 'queued',
    prerequisiteIds: ['w1-python-problems'],
    order: 2,
  },
  {
    id: 'math-arithmetic-baseline',
    trackId: 'math',
    type: 'Diagnostic',
    title: 'Arithmetic baseline',
    detail: '120-second mixed arithmetic, then record one shortcut',
    remaining: '1 drill',
    state: 'active',
    prerequisiteIds: [],
    order: 1,
  },
  {
    id: 'build-edge-cases',
    trackId: 'build',
    type: 'Build proof',
    title: 'Tests and edge cases',
    detail: 'Add a test for the failure path and capture the output',
    remaining: '1 deliverable',
    state: 'active',
    prerequisiteIds: [],
    order: 1,
  },
  {
    id: 'sql-select-basics',
    trackId: 'sql',
    type: 'SQL drill',
    title: 'SELECT, filter, and aggregate',
    detail: 'Save the query, result, and a one-sentence explanation',
    remaining: '3 queries',
    state: 'active',
    prerequisiteIds: [],
    order: 1,
  },
  {
    id: 'english-explain-solution',
    trackId: 'english',
    type: 'Explanation',
    title: 'Explain today’s algorithm',
    detail: 'State the pattern, invariant, complexity, and rejected alternative',
    remaining: '1 explanation',
    state: 'active',
    prerequisiteIds: [],
    order: 1,
  },
];

function storageKey(userId) {
  return `habit-rabbit:accountability:v${STORAGE_VERSION}:${userId}`;
}

function createRoadmap(startDate) {
  return ROADMAP_TITLES.map((title, index) => ({
    id: `roadmap-${index + 1}`,
    week: Math.floor(index / 2) + 1,
    title,
    state: 'not-started',
    completedAt: null,
    startDate,
  }));
}

export function evidencePasses(value) {
  return typeof value === 'string' && value.trim().length >= EVIDENCE_MIN_LENGTH;
}

export function blockMetrics(block) {
  const logged = Math.max(0, Number(block.loggedMinutes) || 0);
  const target = block.baseTarget + block.carryIn;
  const hasEvidence = evidencePasses(block.evidence);
  const credited = hasEvidence ? logged : 0;
  const complete = credited >= target;

  return {
    target,
    logged,
    credited,
    complete,
    pendingEvidence: logged > 0 && !hasEvidence,
    debtAfter: Math.max(0, block.debtIn + block.baseTarget - credited),
  };
}

export function createPlan(date, debtBalances = {}) {
  return {
    date,
    timezone: 'Asia/Singapore',
    generatedAt: new Date().toISOString(),
    status: 'open',
    blocks: TRACK_TEMPLATES.map(track => {
      const debtIn = Math.max(0, Number(debtBalances[track.id]) || 0);
      return {
        trackId: track.id,
        baseTarget: track.baseTarget,
        debtIn,
        carryIn: Math.min(debtIn, Math.round(track.baseTarget * 0.5)),
        loggedMinutes: 0,
        evidence: '',
      };
    }),
  };
}

function createInitialState(date = todayInTimeZone()) {
  const debtBalances = Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, 0]));

  return {
    version: STORAGE_VERSION,
    profile: {
      timezone: 'Asia/Singapore',
      startDate: date,
      recoveryCapRate: 0.5,
    },
    debtBalances,
    plans: { [date]: createPlan(date, debtBalances) },
    debtLedger: [],
    learningItems: DEFAULT_QUEUE,
    roadmap: createRoadmap(date),
  };
}

function closePlanMutable(state, date, reason = 'day-close') {
  const plan = state.plans[date];
  if (!plan || plan.status === 'closed') return;

  let ledgerTime = Date.now();
  const debtBalances = { ...state.debtBalances };
  const closedBlocks = plan.blocks.map(block => {
    const metrics = blockMetrics(block);
    const additionBalance = block.debtIn + block.baseTarget;

    state.debtLedger.push({
      id: `${date}-${block.trackId}-add-${ledgerTime++}`,
      date,
      trackId: block.trackId,
      kind: 'addition',
      amount: block.baseTarget,
      balanceAfter: additionBalance,
      reason,
      timestamp: new Date().toISOString(),
    });

    const debtCredit = Math.min(metrics.credited, additionBalance);
    if (debtCredit > 0) {
      state.debtLedger.push({
        id: `${date}-${block.trackId}-credit-${ledgerTime++}`,
        date,
        trackId: block.trackId,
        kind: 'credit',
        amount: -debtCredit,
        balanceAfter: metrics.debtAfter,
        reason: 'evidence-accepted',
        timestamp: new Date().toISOString(),
      });
    }

    debtBalances[block.trackId] = metrics.debtAfter;
    return { ...block, debtAfter: metrics.debtAfter, creditedMinutes: metrics.credited };
  });

  state.debtBalances = debtBalances;
  state.plans[date] = {
    ...plan,
    blocks: closedBlocks,
    status: 'closed',
    closedAt: new Date().toISOString(),
  };
}

function rollForward(state, currentDate) {
  const planDates = Object.keys(state.plans || {}).sort();
  if (!planDates.length) {
    state.plans = { [currentDate]: createPlan(currentDate, state.debtBalances) };
    return state;
  }

  const latestDate = planDates[planDates.length - 1];
  if (latestDate >= currentDate) return state;

  closePlanMutable(state, latestDate, 'automatic-local-day-close');
  let cursor = addDays(latestDate, 1);

  while (cursor <= currentDate) {
    state.plans[cursor] = createPlan(cursor, state.debtBalances);
    if (cursor < currentDate) closePlanMutable(state, cursor, 'missed-day-close');
    cursor = addDays(cursor, 1);
  }

  return state;
}

function hydrateState(parsed, currentDate) {
  const initial = createInitialState(currentDate);
  const hydrated = {
    ...initial,
    ...parsed,
    profile: { ...initial.profile, ...(parsed.profile || {}) },
    debtBalances: { ...initial.debtBalances, ...(parsed.debtBalances || {}) },
    plans: parsed.plans || initial.plans,
    debtLedger: Array.isArray(parsed.debtLedger) ? parsed.debtLedger : [],
    learningItems: Array.isArray(parsed.learningItems) ? parsed.learningItems : initial.learningItems,
    roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : initial.roadmap,
  };

  return rollForward(hydrated, currentDate);
}

export function loadAccountabilityState(userId, currentDate = todayInTimeZone()) {
  if (typeof window === 'undefined') return createInitialState(currentDate);

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return createInitialState(currentDate);
    return hydrateState(JSON.parse(raw), currentDate);
  } catch {
    return createInitialState(currentDate);
  }
}

export function saveAccountabilityState(userId, state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export function closeAccountabilityPlan(state, date) {
  const next = structuredClone(state);
  closePlanMutable(next, date);
  return next;
}

export function advanceLearningItem(state, itemId) {
  const next = structuredClone(state);
  const completed = next.learningItems.find(item => item.id === itemId);
  if (!completed) return state;

  completed.state = 'complete';
  completed.completedAt = new Date().toISOString();

  const matchingMilestone = next.roadmap.find(item => (
    item.title.toLowerCase() === completed.title.toLowerCase() && item.state !== 'complete'
  ));
  if (matchingMilestone) {
    matchingMilestone.state = 'complete';
    matchingMilestone.completedAt = completed.completedAt;
  }

  const nextItem = next.learningItems
    .filter(item => item.trackId === completed.trackId && item.state === 'queued')
    .sort((a, b) => a.order - b.order)
    .find(item => item.prerequisiteIds.every(id => (
      next.learningItems.find(candidate => candidate.id === id)?.state === 'complete'
    )));

  if (nextItem) nextItem.state = 'active';
  return next;
}
