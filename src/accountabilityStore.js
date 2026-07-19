import { supabase } from './supabaseClient.js';
import { addDays, fromDateStr, todayInTimeZone } from './dateUtils.js';
import { createDefaultLearningItems, createDefaultRoadmap } from './accountabilityCurriculum.js';

const STORAGE_VERSION = 2;
const REVIEW_INTERVALS = [1, 7, 21];

export const TRACK_TEMPLATES = [
  { id: 'algorithms', name: 'Algorithms', eyebrow: 'Blind 75', baseTarget: 150, color: '#69d486', evidence: 'Record the problem outcome, solution, complexity, assistance, and explanation.' },
  { id: 'math', name: 'Quant math', eyebrow: 'Number sense', baseTarget: 90, color: '#a78bfa', evidence: 'Record attempted/correct results and the strategy or correction you learned.' },
  { id: 'build', name: 'Build', eyebrow: 'Engineering', baseTarget: 60, color: '#60a5fa', evidence: 'Link or describe the artifact, test result, and shipped behavior.' },
  { id: 'sql', name: 'SQL', eyebrow: 'Data', baseTarget: 30, color: '#f59e0b', evidence: 'Save the query or link, result, and joins/aggregation used.' },
  { id: 'english', name: 'English', eyebrow: 'Explanation', baseTarget: 30, color: '#fb7185', evidence: 'Save the explanation and rate its clarity.' },
];

const TRACKS = Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, track]));

function id(prefix = 'event') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function storageKey(userId) {
  return `habit-rabbit:accountability:v${STORAGE_VERSION}:${userId}`;
}

function legacyStorageKey(userId) {
  return `habit-rabbit:accountability:v1:${userId}`;
}

function isActiveDate(date, activeDays) {
  return activeDays.includes(fromDateStr(date).getDay());
}

export function createEmptyEvidence(trackId) {
  const shared = { outcome: '', summary: '', artifact: '', recordedAt: null, legacyAccepted: false };
  if (trackId === 'algorithms') return { ...shared, complexity: '', assistance: '', explanation: '', errorCategory: '', belief: '', truth: '', correction: '' };
  if (trackId === 'math') return { ...shared, attempted: '', correct: '', score: '', strategy: '', errorCategory: '', belief: '', truth: '', correction: '' };
  if (trackId === 'build') return { ...shared, testResult: '' };
  if (trackId === 'sql') return { ...shared, query: '', result: '', concepts: '' };
  return { ...shared, explanation: '', clarity: '' };
}

export function validateEvidence(trackId, evidence = {}) {
  if (evidence.legacyAccepted) return { valid: true, missing: [], legacy: true };
  const missing = [];
  const text = (key, min, label) => {
    if (String(evidence[key] || '').trim().length < min) missing.push(label);
  };
  text('outcome', 2, 'outcome');

  if (trackId === 'algorithms') {
    text('artifact', 8, 'solution or submission link');
    text('complexity', 3, 'time and space complexity');
    text('assistance', 2, 'assistance used');
    text('explanation', 20, 'plain-English explanation');
  } else if (trackId === 'math') {
    if (Number(evidence.attempted) <= 0) missing.push('attempted count');
    if (evidence.correct === '' || Number(evidence.correct) < 0) missing.push('correct count');
    text('strategy', 20, 'strategy or correction');
  } else if (trackId === 'build') {
    text('artifact', 8, 'artifact or commit');
    text('summary', 20, 'behavior delivered');
    text('testResult', 8, 'test or acceptance result');
  } else if (trackId === 'sql') {
    if (String(evidence.query || '').trim().length < 20 && String(evidence.artifact || '').trim().length < 8) missing.push('query or saved-query link');
    text('result', 10, 'query result');
    text('concepts', 3, 'joins or aggregation used');
  } else if (trackId === 'english') {
    text('explanation', 40, 'technical explanation');
    if (Number(evidence.clarity) < 1) missing.push('clarity score');
  }
  return { valid: missing.length === 0, missing, legacy: false };
}

export function blockMetrics(block) {
  const logged = Math.max(0, Number(block.loggedMinutes) || 0);
  const target = Math.max(0, Number(block.baseTarget) + Number(block.carryIn));
  const validation = validateEvidence(block.trackId, block.evidence);
  const credited = validation.valid ? logged : 0;
  const waived = Boolean(block.waiver);
  const effortComplete = waived || target === 0 || credited >= target;
  const outputRecorded = waived || Boolean(block.outputRecordedAt);
  return {
    target,
    logged,
    credited,
    waived,
    validation,
    effortComplete,
    outputRecorded,
    complete: effortComplete && outputRecorded,
    pendingEvidence: logged > 0 && !validation.valid,
    debtAfter: waived ? block.debtIn : Math.max(0, block.debtIn + block.baseTarget - credited),
  };
}

function defaultProfile(date) {
  return {
    timezone: 'Asia/Singapore',
    startDate: date,
    recoveryCapRate: 0.5,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    maxDailyMinutes: 480,
    trackTargets: Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, track.baseTarget])),
  };
}

export function createPlan(date, debtBalances = {}, profile = defaultProfile(date)) {
  const active = isActiveDate(date, profile.activeDays);
  const targets = TRACK_TEMPLATES.map(track => active ? Number(profile.trackTargets[track.id] ?? track.baseTarget) : 0);
  let recoveryRoom = Math.max(0, Number(profile.maxDailyMinutes) - targets.reduce((sum, value) => sum + value, 0));
  const blocks = TRACK_TEMPLATES.map((track, index) => {
    const baseTarget = targets[index];
    const debtIn = Math.max(0, Number(debtBalances[track.id]) || 0);
    const capped = Math.min(debtIn, Math.round(baseTarget * profile.recoveryCapRate));
    const carryIn = Math.min(capped, recoveryRoom);
    recoveryRoom -= carryIn;
    return {
      trackId: track.id,
      baseTarget,
      debtIn,
      carryIn,
      loggedMinutes: 0,
      recordedMinutes: 0,
      evidence: createEmptyEvidence(track.id),
      outputRecordedAt: null,
      assignmentId: null,
      assignmentType: null,
      waiver: null,
      corrections: [],
    };
  });
  return { date, timezone: profile.timezone, generatedAt: new Date().toISOString(), status: 'open', active, blocks };
}

function createInitialState(date = todayInTimeZone()) {
  const profile = defaultProfile(date);
  const debtBalances = Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, 0]));
  const state = {
    version: STORAGE_VERSION,
    meta: { updatedAt: new Date().toISOString() },
    profile,
    debtBalances,
    plans: { [date]: createPlan(date, debtBalances, profile) },
    debtLedger: [],
    learningItems: createDefaultLearningItems(),
    roadmap: createDefaultRoadmap(date),
    attempts: [],
    reviews: [],
    errors: [],
    sessions: [],
    outputs: [],
    auditEvents: [],
  };
  assignPlan(state, date);
  return state;
}

export function getAssignment(state, block) {
  if (!block?.assignmentId) return null;
  if (block.assignmentType === 'review') {
    const review = state.reviews.find(item => item.id === block.assignmentId);
    const source = state.learningItems.find(item => item.id === review?.itemId);
    return review && source ? { ...source, id: review.id, sourceItemId: source.id, type: `${review.intervalDays}-day review`, detail: `Reproduce ${source.title} without the original solution`, isReview: true } : null;
  }
  return state.learningItems.find(item => item.id === block.assignmentId) || null;
}

export function getDueReviews(state, date) {
  return state.reviews.filter(review => review.state === 'scheduled' && review.dueDate <= date);
}

function eligibleLearningItem(state, trackId) {
  return state.learningItems
    .filter(item => item.trackId === trackId && item.state === 'active')
    .sort((a, b) => a.order - b.order)[0] || null;
}

function assignPlan(state, date) {
  const plan = state.plans[date];
  if (!plan) return;
  const due = getDueReviews(state, date);
  plan.blocks.forEach(block => {
    if (block.assignmentId || block.baseTarget === 0) return;
    const review = due.find(item => item.trackId === block.trackId);
    const learningItem = eligibleLearningItem(state, block.trackId);
    block.assignmentId = review?.id || learningItem?.id || null;
    block.assignmentType = review ? 'review' : learningItem ? 'learning' : null;
  });
}

function closePlanMutable(state, date, reason = 'day-close') {
  const plan = state.plans[date];
  if (!plan || plan.status === 'closed') return;
  const debtBalances = { ...state.debtBalances };
  plan.blocks = plan.blocks.map(block => {
    const metrics = blockMetrics(block);
    if (block.waiver) {
      state.debtLedger.push({ id: id('debt'), date, trackId: block.trackId, kind: 'waiver', amount: 0, balanceAfter: block.debtIn, reason: block.waiver.reason, timestamp: new Date().toISOString() });
    } else {
      const additionBalance = block.debtIn + block.baseTarget;
      if (block.baseTarget > 0) state.debtLedger.push({ id: id('debt'), date, trackId: block.trackId, kind: 'addition', amount: block.baseTarget, balanceAfter: additionBalance, reason, timestamp: new Date().toISOString() });
      const debtCredit = Math.min(metrics.credited, additionBalance);
      if (debtCredit > 0) state.debtLedger.push({ id: id('debt'), date, trackId: block.trackId, kind: 'credit', amount: -debtCredit, balanceAfter: metrics.debtAfter, reason: 'structured-evidence-recorded', timestamp: new Date().toISOString() });
    }
    debtBalances[block.trackId] = metrics.debtAfter;
    return { ...block, debtAfter: metrics.debtAfter, creditedMinutes: metrics.credited };
  });
  state.debtBalances = debtBalances;
  state.plans[date] = { ...plan, status: 'closed', closedAt: new Date().toISOString() };
}

function rollForward(state, currentDate) {
  const dates = Object.keys(state.plans || {}).sort();
  if (!dates.length) state.plans[currentDate] = createPlan(currentDate, state.debtBalances, state.profile);
  let latest = Object.keys(state.plans).sort().at(-1);
  if (latest >= currentDate) {
    assignPlan(state, currentDate);
    return state;
  }
  closePlanMutable(state, latest, 'automatic-local-day-close');
  let cursor = addDays(latest, 1);
  while (cursor <= currentDate) {
    state.plans[cursor] = createPlan(cursor, state.debtBalances, state.profile);
    assignPlan(state, cursor);
    if (cursor < currentDate) closePlanMutable(state, cursor, 'missed-day-close');
    cursor = addDays(cursor, 1);
  }
  return state;
}

function migrateEvidence(trackId, evidence) {
  if (typeof evidence !== 'string') return { ...createEmptyEvidence(trackId), ...(evidence || {}) };
  return { ...createEmptyEvidence(trackId), summary: evidence, artifact: evidence, legacyAccepted: evidence.trim().length >= 12 };
}

function hydrateState(parsed, currentDate) {
  const initial = createInitialState(currentDate);
  const profile = { ...initial.profile, ...(parsed.profile || {}), trackTargets: { ...initial.profile.trackTargets, ...(parsed.profile?.trackTargets || {}) } };
  const defaultItems = createDefaultLearningItems();
  const priorByTitle = new Map((parsed.learningItems || []).map(item => [item.title.toLowerCase(), item]));
  const learningItems = defaultItems.map(item => ({ ...item, ...(priorByTitle.get(item.title.toLowerCase()) || {}) }));
  const plans = parsed.plans || initial.plans;
  Object.values(plans).forEach(plan => {
    plan.active = plan.active ?? true;
    plan.blocks = (plan.blocks || []).map(block => ({
      recordedMinutes: 0,
      outputRecordedAt: typeof block.evidence === 'string' && block.evidence.trim().length >= 12 ? block.generatedAt || plan.generatedAt : null,
      assignmentId: null,
      assignmentType: null,
      waiver: null,
      corrections: [],
      ...block,
      evidence: migrateEvidence(block.trackId, block.evidence),
    }));
  });
  const hydrated = {
    ...initial,
    ...parsed,
    version: STORAGE_VERSION,
    profile,
    plans,
    debtBalances: { ...initial.debtBalances, ...(parsed.debtBalances || {}) },
    learningItems,
    roadmap: Array.isArray(parsed.roadmap) && parsed.roadmap.length === 24 ? parsed.roadmap : initial.roadmap,
    debtLedger: parsed.debtLedger || [], attempts: parsed.attempts || [], reviews: parsed.reviews || [], errors: parsed.errors || [], sessions: parsed.sessions || [], outputs: parsed.outputs || [], auditEvents: parsed.auditEvents || [],
  };
  return rollForward(hydrated, currentDate);
}

export function loadAccountabilityState(userId, currentDate = todayInTimeZone()) {
  if (typeof window === 'undefined') return createInitialState(currentDate);
  try {
    const raw = window.localStorage.getItem(storageKey(userId)) || window.localStorage.getItem(legacyStorageKey(userId));
    return raw ? hydrateState(JSON.parse(raw), currentDate) : createInitialState(currentDate);
  } catch {
    return createInitialState(currentDate);
  }
}

export function saveAccountabilityState(userId, state) {
  if (typeof window === 'undefined') return state;
  const saved = { ...state, version: STORAGE_VERSION, meta: { ...state.meta, updatedAt: new Date().toISOString() } };
  window.localStorage.setItem(storageKey(userId), JSON.stringify(saved));
  return saved;
}

export async function fetchAccountabilityState(userId, currentDate = todayInTimeZone()) {
  const local = loadAccountabilityState(userId, currentDate);
  const { data, error } = await supabase.from('accountability_states').select('state, updated_at').eq('user_id', userId).maybeSingle();
  if (error) return { state: local, cloudAvailable: false, error };
  if (!data?.state) return { state: local, cloudAvailable: true, error: null };
  const remote = hydrateState(data.state, currentDate);
  const localTime = new Date(local.meta?.updatedAt || 0).getTime();
  const remoteTime = new Date(data.updated_at || remote.meta?.updatedAt || 0).getTime();
  return { state: remoteTime >= localTime ? remote : local, cloudAvailable: true, error: null };
}

export async function syncAccountabilityState(userId, state) {
  const saved = saveAccountabilityState(userId, state);
  const { error } = await supabase.from('accountability_states').upsert({ user_id: userId, schema_version: STORAGE_VERSION, state: saved, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return { cloudAvailable: !error, error };
}

function activateNext(state, completed) {
  const next = state.learningItems
    .filter(item => item.trackId === completed.trackId && item.state === 'queued')
    .sort((a, b) => a.order - b.order)
    .find(item => item.prerequisiteIds.every(prerequisite => state.learningItems.find(candidate => candidate.id === prerequisite)?.state === 'complete'));
  if (next) next.state = 'active';
}

function recordError(state, item, evidence, date) {
  if (!evidence.errorCategory) return;
  const key = `${item?.topic || item?.trackId || 'general'}:${evidence.errorCategory}`.toLowerCase();
  const prior = state.errors.filter(error => error.recurrenceKey === key);
  state.errors.push({ id: id('error'), date, itemId: item?.id || null, category: evidence.errorCategory, belief: evidence.belief, truth: evidence.truth, correction: evidence.correction, recurrenceKey: key, recurrenceCount: prior.length + 1, resolved: false, reviewDate: addDays(date, 7) });
}

export function recordLearningOutcome(state, date, trackId) {
  const next = structuredClone(state);
  const block = next.plans[date]?.blocks.find(item => item.trackId === trackId);
  if (!block || !validateEvidence(trackId, block.evidence).valid) return state;
  const now = new Date().toISOString();
  const assignment = getAssignment(next, block);
  const newMinutes = Math.max(0, Number(block.loggedMinutes) - Number(block.recordedMinutes || 0));
  if (newMinutes > 0) next.sessions.push({ id: id('session'), date, trackId, itemId: assignment?.sourceItemId || assignment?.id || null, minutes: newMinutes, source: 'manual', evidenceState: 'recorded', timestamp: now });
  block.recordedMinutes = block.loggedMinutes;
  block.outputRecordedAt = now;
  block.evidence.recordedAt = now;
  next.outputs.push({ id: id('output'), date, trackId, assignmentId: block.assignmentId, evidence: structuredClone(block.evidence), timestamp: now });

  if (block.assignmentType === 'review' && assignment) {
    const review = next.reviews.find(item => item.id === block.assignmentId);
    const source = next.learningItems.find(item => item.id === review?.itemId);
    const passed = ['review_passed', 'solved', 'completed'].includes(block.evidence.outcome);
    review.state = passed ? 'passed' : 'failed';
    review.completedAt = now;
    if (source) source.state = passed ? (review.intervalDays === 21 ? 'mastered' : 'reviewed') : 'active';
  } else if (assignment) {
    const item = next.learningItems.find(candidate => candidate.id === assignment.id);
    if (item) {
      item.attempts = Number(item.attempts || 0) + 1;
      const completeOutcome = ['solved', 'completed'].includes(block.evidence.outcome);
      item.state = completeOutcome ? 'complete' : 'active';
      item.completedAt = completeOutcome ? now : null;
      if (completeOutcome) activateNext(next, item);
      if (trackId === 'algorithms') {
        const attemptId = id('attempt');
        next.attempts.push({ id: attemptId, itemId: item.id, date, duration: block.loggedMinutes, outcome: block.evidence.outcome, artifact: block.evidence.artifact, complexity: block.evidence.complexity, assistance: block.evidence.assistance, explanation: block.evidence.explanation, timestamp: now });
        if (block.evidence.outcome === 'solved' && !next.reviews.some(review => review.itemId === item.id)) REVIEW_INTERVALS.forEach(intervalDays => next.reviews.push({ id: id('review'), itemId: item.id, trackId, sourceAttemptId: attemptId, intervalDays, dueDate: addDays(date, intervalDays), state: 'scheduled', completedAt: null }));
      }
      recordError(next, item, block.evidence, date);
    }
  }
  next.auditEvents.push({ id: id('audit'), kind: 'output-recorded', date, trackId, assignmentId: block.assignmentId, timestamp: now });
  return next;
}

export function activateLearningItem(state, itemId, date) {
  const next = structuredClone(state);
  const item = next.learningItems.find(candidate => candidate.id === itemId);
  const block = next.plans[date]?.blocks.find(candidate => candidate.trackId === item?.trackId);
  if (!item || !block) return state;
  if (!item.prerequisiteIds.every(prerequisite => next.learningItems.find(candidate => candidate.id === prerequisite)?.state === 'complete')) return state;
  next.learningItems.filter(candidate => candidate.trackId === item.trackId && candidate.state === 'active').forEach(candidate => { candidate.state = 'queued'; });
  item.state = 'active';
  block.assignmentId = item.id;
  block.assignmentType = 'learning';
  block.evidence = createEmptyEvidence(item.trackId);
  block.outputRecordedAt = null;
  return next;
}

export function activateReview(state, reviewId, date) {
  const next = structuredClone(state);
  const review = next.reviews.find(candidate => candidate.id === reviewId);
  const block = next.plans[date]?.blocks.find(candidate => candidate.trackId === review?.trackId);
  if (!review || !block || review.state !== 'scheduled') return state;
  block.assignmentId = review.id;
  block.assignmentType = 'review';
  block.evidence = createEmptyEvidence(review.trackId);
  block.outputRecordedAt = null;
  return next;
}

export function applyWaiver(state, date, trackId, reason) {
  if (!reason.trim()) return state;
  const next = structuredClone(state);
  const plan = next.plans[date];
  const block = plan?.blocks.find(item => item.trackId === trackId);
  if (!block) return state;
  const waiver = { reason: reason.trim(), timestamp: new Date().toISOString(), actor: 'user' };
  block.waiver = waiver;
  if (plan.status === 'closed') {
    const amount = Math.min(Math.max(0, block.baseTarget - Number(block.creditedMinutes || 0)), Number(next.debtBalances[trackId] || 0));
    next.debtBalances[trackId] -= amount;
    next.debtLedger.push({ id: id('debt'), date, trackId, kind: 'waiver', amount: -amount, balanceAfter: next.debtBalances[trackId], reason: waiver.reason, timestamp: waiver.timestamp });
  }
  next.auditEvents.push({ id: id('audit'), kind: 'waiver', date, trackId, reason: waiver.reason, timestamp: waiver.timestamp });
  return next;
}

export function applyCorrection(state, date, trackId, minutes, reason, evidence) {
  if (Number(minutes) <= 0 || !reason.trim() || evidence.trim().length < 12) return state;
  const next = structuredClone(state);
  const block = next.plans[date]?.blocks.find(item => item.trackId === trackId);
  if (!block) return state;
  const amount = Math.min(Number(minutes), Number(next.debtBalances[trackId] || 0));
  const correction = { id: id('correction'), minutes: Number(minutes), creditedMinutes: amount, reason: reason.trim(), evidence: evidence.trim(), timestamp: new Date().toISOString() };
  block.corrections = [...(block.corrections || []), correction];
  next.debtBalances[trackId] -= amount;
  next.debtLedger.push({ id: id('debt'), date, trackId, kind: 'correction-credit', amount: -amount, balanceAfter: next.debtBalances[trackId], reason: correction.reason, timestamp: correction.timestamp });
  next.auditEvents.push({ id: id('audit'), kind: 'correction', date, trackId, reason: correction.reason, timestamp: correction.timestamp });
  return next;
}

export function updatePlanningProfile(state, changes) {
  const next = structuredClone(state);
  next.profile = { ...next.profile, ...changes, trackTargets: { ...next.profile.trackTargets, ...(changes.trackTargets || {}) } };
  next.auditEvents.push({ id: id('audit'), kind: 'plan-change', before: state.profile, after: next.profile, reason: changes.reason || 'User updated future plan', timestamp: new Date().toISOString() });
  return next;
}

export function closeAccountabilityPlan(state, date) {
  const next = structuredClone(state);
  closePlanMutable(next, date);
  return next;
}

export function getTrack(trackId) {
  return TRACKS[trackId];
}
