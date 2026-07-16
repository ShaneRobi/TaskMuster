import test from 'node:test';
import assert from 'node:assert/strict';
import { blockMetrics, closeAccountabilityPlan, createPlan } from '../src/accountabilityStore.js';
import { todayInTimeZone } from '../src/dateUtils.js';

test('schedules the full 60 minute debt when it is below the recovery cap', () => {
  const plan = createPlan('2026-07-16', { algorithms: 60 });
  const block = plan.blocks.find(candidate => candidate.trackId === 'algorithms');

  assert.equal(block.baseTarget, 150);
  assert.equal(block.carryIn, 60);
  assert.equal(blockMetrics(block).target, 210);
});

test('caps 200 minutes of debt at 50 percent of the base target', () => {
  const plan = createPlan('2026-07-16', { algorithms: 200 });
  const block = plan.blocks.find(candidate => candidate.trackId === 'algorithms');

  assert.equal(block.carryIn, 75);
  assert.equal(blockMetrics(block).target, 225);
});

test('credits verified effort and leaves the remaining debt visible', () => {
  const plan = createPlan('2026-07-16', { algorithms: 60 });
  const block = plan.blocks.find(candidate => candidate.trackId === 'algorithms');
  const result = blockMetrics({
    ...block,
    loggedMinutes: 180,
    evidence: 'Passing solution, tests, complexity, and explanation attached.',
  });

  assert.equal(result.credited, 180);
  assert.equal(result.debtAfter, 30);
});

test('keeps minutes uncredited while required evidence is missing', () => {
  const plan = createPlan('2026-07-16');
  const block = plan.blocks.find(candidate => candidate.trackId === 'math');
  const result = blockMetrics({ ...block, loggedMinutes: 90, evidence: '' });

  assert.equal(result.credited, 0);
  assert.equal(result.pendingEvidence, true);
  assert.equal(result.debtAfter, 90);
});

test('never posts a debt credit larger than the available balance', () => {
  const date = '2026-07-16';
  const plan = createPlan(date);
  plan.blocks = plan.blocks.map(block => block.trackId === 'algorithms' ? {
    ...block,
    loggedMinutes: 500,
    evidence: 'Passing solution, tests, complexity, and explanation attached.',
  } : block);
  const state = {
    plans: { [date]: plan },
    debtBalances: {},
    debtLedger: [],
    learningItems: [],
    roadmap: [],
  };

  const closed = closeAccountabilityPlan(state, date);
  const algorithmTransactions = closed.debtLedger.filter(item => item.trackId === 'algorithms');

  assert.deepEqual(algorithmTransactions.map(item => item.amount), [150, -150]);
  assert.equal(closed.debtBalances.algorithms, 0);
});

test('uses the configured Singapore day boundary', () => {
  const utcEvening = new Date('2026-07-15T18:30:00.000Z');
  assert.equal(todayInTimeZone('Asia/Singapore', utcEvening), '2026-07-16');
});
