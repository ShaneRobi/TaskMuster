import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleAlert, Clock3, Cloud, FileCheck2, HardDrive, History, ListChecks,
  LockKeyhole, RotateCcw, Settings2, ShieldCheck, Target, TimerReset, TrendingUp,
} from 'lucide-react';
import { todayInTimeZone } from '../dateUtils';
import {
  TRACK_TEMPLATES, activateLearningItem, activateReview, applyCorrection, applyWaiver,
  blockMetrics, closeAccountabilityPlan, fetchAccountabilityState, getAssignment,
  getDueReviews, loadAccountabilityState, recordLearningOutcome, saveAccountabilityState,
  syncAccountabilityState, updatePlanningProfile, validateEvidence,
} from '../accountabilityStore';

const TRACKS_BY_ID = Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, track]));
const DAY_OPTIONS = [['S', 0], ['M', 1], ['T', 2], ['W', 3], ['T', 4], ['F', 5], ['S', 6]];

function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(minutes));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return hours ? (mins ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' });
}

function currentRoadmapWeek(startDate, currentDate) {
  const elapsed = Math.max(0, Math.floor((new Date(`${currentDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000));
  return Math.min(12, Math.floor(elapsed / 7) + 1);
}

function statusFor(block) {
  const metrics = blockMetrics(block);
  if (metrics.waived) return { label: 'Waived', className: 'idle' };
  if (metrics.complete) return { label: 'Complete', className: 'verified' };
  if (metrics.outputRecorded) return { label: 'Output saved', className: 'progress' };
  if (metrics.pendingEvidence) return { label: 'Evidence needed', className: 'pending' };
  if (metrics.logged > 0) return { label: 'In progress', className: 'progress' };
  return { label: 'Ready', className: 'idle' };
}

function EvidenceInput({ label, value, onChange, placeholder, multiline = false, type = 'text', min, max }) {
  return (
    <label className="ae-structured-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows="3" />
      ) : (
        <input type={type} min={min} max={max} value={value ?? ''} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function OutcomeField({ trackId, isReview, value, onChange }) {
  let options = [['', 'Choose outcome…']];
  if (trackId === 'algorithms') options = isReview
    ? [...options, ['review_passed', 'Review passed unaided'], ['review_failed', 'Review needs repair']]
    : [...options, ['attempted', 'Attempted honestly'], ['solved', 'Solved and tests pass']];
  else options = [...options, ['partial', 'Partial progress'], ['completed', 'Output completed']];
  return (
    <label className="ae-structured-field">
      <span>Outcome</span>
      <select value={value || ''} onChange={event => onChange(event.target.value)}>
        {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
    </label>
  );
}

function StructuredEvidence({ trackId, evidence, isReview, onChange }) {
  const set = (key, value) => onChange({ ...evidence, [key]: value, recordedAt: null, legacyAccepted: false });
  return (
    <div className="ae-structured-evidence">
      <OutcomeField trackId={trackId} isReview={isReview} value={evidence.outcome} onChange={value => set('outcome', value)} />
      {trackId === 'algorithms' && <>
        <EvidenceInput label="Solution or submission" value={evidence.artifact} onChange={value => set('artifact', value)} placeholder="LeetCode URL, repository link, or solution note" />
        <EvidenceInput label="Complexity" value={evidence.complexity} onChange={value => set('complexity', value)} placeholder="O(n) time · O(n) space" />
        <label className="ae-structured-field"><span>Assistance used</span><select value={evidence.assistance || ''} onChange={event => set('assistance', event.target.value)}><option value="">Disclose assistance…</option><option value="none">None</option><option value="small_hint">Small hint</option><option value="structured_hint">Structured hint</option><option value="solution_explanation">Solution explanation</option><option value="adapted_code">Copied/adapted code</option></select></label>
        <EvidenceInput label="Plain-English explanation" value={evidence.explanation} onChange={value => set('explanation', value)} placeholder="Pattern, invariant, edge cases, and why it works" multiline />
      </>}
      {trackId === 'math' && <>
        <EvidenceInput label="Attempted" type="number" min="1" value={evidence.attempted} onChange={value => set('attempted', value)} placeholder="20" />
        <EvidenceInput label="Correct" type="number" min="0" value={evidence.correct} onChange={value => set('correct', value)} placeholder="16" />
        <EvidenceInput label="Score / benchmark" value={evidence.score} onChange={value => set('score', value)} placeholder="Optional score or estimation error" />
        <EvidenceInput label="Strategy or correction" value={evidence.strategy} onChange={value => set('strategy', value)} placeholder="Explain the method—not just the answer" multiline />
      </>}
      {trackId === 'build' && <>
        <EvidenceInput label="Artifact" value={evidence.artifact} onChange={value => set('artifact', value)} placeholder="Commit, PR, screenshot, test output, or deployed behavior" />
        <EvidenceInput label="Behavior delivered" value={evidence.summary} onChange={value => set('summary', value)} placeholder="What changed and what acceptance check passed?" multiline />
        <EvidenceInput label="Test result" value={evidence.testResult} onChange={value => set('testResult', value)} placeholder="Tests passed, screenshot captured, or manual check" />
      </>}
      {trackId === 'sql' && <>
        <EvidenceInput label="Saved query link" value={evidence.artifact} onChange={value => set('artifact', value)} placeholder="Optional repository or saved-query link" />
        <EvidenceInput label="Query" value={evidence.query} onChange={value => set('query', value)} placeholder="Paste the SQL you wrote" multiline />
        <EvidenceInput label="Result" value={evidence.result} onChange={value => set('result', value)} placeholder="What rows or test fixture did it produce?" multiline />
        <EvidenceInput label="Concepts used" value={evidence.concepts} onChange={value => set('concepts', value)} placeholder="LEFT JOIN, GROUP BY, SUM…" />
      </>}
      {trackId === 'english' && <>
        <EvidenceInput label="Technical explanation" value={evidence.explanation} onChange={value => set('explanation', value)} placeholder="Explain the idea plainly enough for another developer" multiline />
        <EvidenceInput label="Clarity score (1–5)" type="number" min="1" max="5" value={evidence.clarity} onChange={value => set('clarity', value)} placeholder="4" />
      </>}
      {(trackId === 'algorithms' || trackId === 'math') && (
        <details className="ae-error-details">
          <summary>Log an error or misconception (optional)</summary>
          <div className="ae-structured-evidence">
            <EvidenceInput label="Category" value={evidence.errorCategory} onChange={value => set('errorCategory', value)} placeholder="Logic, edge case, math, process…" />
            <EvidenceInput label="What I believed" value={evidence.belief} onChange={value => set('belief', value)} placeholder="The mistaken belief" />
            <EvidenceInput label="What is true" value={evidence.truth} onChange={value => set('truth', value)} placeholder="The corrected rule" />
            <EvidenceInput label="Repair" value={evidence.correction} onChange={value => set('correction', value)} placeholder="How I will avoid this next time" />
          </div>
        </details>
      )}
    </div>
  );
}

function TrackEditor({ block, track, assignment, disabled, onChange, onRecord, onDone, onWaive }) {
  const [waiverReason, setWaiverReason] = useState('');
  const metrics = blockMetrics(block);
  const updateEvidence = evidence => onChange({ evidence, outputRecordedAt: null });
  return (
    <div className="ae-track-editor">
      <div className="ae-onboarding-note"><BookOpen size={14} /><p><strong>What counts here?</strong><span>{track.evidence} Evidence is self-recorded; Habit Rabbit does not authenticate external services.</span></p></div>
      <div className="ae-editor-grid ae-editor-grid-expanded">
        <div className="ae-field-group">
          <label className="ae-field-label" htmlFor={`minutes-${track.id}`}>Effort logged</label>
          <div className="ae-minute-control">
            <button type="button" onClick={() => onChange({ loggedMinutes: Math.max(0, metrics.logged - 15) })} disabled={disabled || metrics.logged === 0}>−</button>
            <input id={`minutes-${track.id}`} type="number" min="0" step="5" value={metrics.logged} disabled={disabled} onChange={event => onChange({ loggedMinutes: Math.max(0, Number(event.target.value) || 0) })} />
            <button type="button" onClick={() => onChange({ loggedMinutes: metrics.logged + 15 })} disabled={disabled}>+15</button>
          </div>
          <p className="ae-evidence-rule">Effort: {formatMinutes(metrics.credited)} / {formatMinutes(metrics.target)} credited</p>
        </div>
        <div className="ae-field-group ae-proof-field">
          <label className="ae-field-label">Output for {assignment?.title || track.name}</label>
          <StructuredEvidence trackId={track.id} evidence={block.evidence} isReview={assignment?.isReview} onChange={updateEvidence} />
        </div>
      </div>
      <div className="ae-editor-footer ae-editor-footer-wrap">
        <div className={`ae-proof-feedback ${metrics.validation.valid ? 'valid' : ''}`}>
          {metrics.validation.valid ? <><CheckCircle2 size={14} /> Evidence complete. Record the output to credit this session.</> : metrics.logged > 0 ? <><CircleAlert size={14} /> Still needed: {metrics.validation.missing.join(', ')}.</> : <><ShieldCheck size={14} /> Log effort and complete the output record.</>}
        </div>
        <div className="ae-editor-actions">
          {!disabled && <details className="ae-waiver-control"><summary>Waive</summary><div><input value={waiverReason} onChange={event => setWaiverReason(event.target.value)} placeholder="Required reason" /><button type="button" onClick={() => { onWaive(waiverReason); setWaiverReason(''); }}>Save waiver</button></div></details>}
          <button type="button" className="ae-secondary-button" onClick={onDone}>Done</button>
          {!disabled && <button type="button" className="ae-editor-done" disabled={!metrics.validation.valid || metrics.logged <= 0} onClick={onRecord}>{block.outputRecordedAt ? 'Update output' : 'Record output'}</button>}
        </div>
      </div>
    </div>
  );
}

function ContractRow({ block, assignment, planClosed, expanded, onToggle, onChange, onRecord, onWaive }) {
  const track = TRACKS_BY_ID[block.trackId];
  const metrics = blockMetrics(block);
  const status = statusFor(block);
  const progress = Math.min(100, Math.round((metrics.credited / Math.max(1, metrics.target)) * 100));
  return (
    <div className={`ae-contract-row ${expanded ? 'expanded' : ''}`} style={{ '--track-color': track.color }}>
      <div className="ae-contract-row-main">
        <div className="ae-track-mark">{track.name.slice(0, 2).toUpperCase()}</div>
        <div className="ae-track-copy"><div className="ae-track-title-line"><h3>{track.name}</h3><span>{track.eyebrow}</span>{block.carryIn > 0 && <span className="ae-recovery-tag"><RotateCcw size={11} /> +{block.carryIn}m recovery</span>}</div><p>{assignment?.title || (block.baseTarget === 0 ? 'Rest day' : 'No eligible item')}</p></div>
        <div className="ae-target-copy"><strong>{formatMinutes(metrics.target)}</strong><span>{block.carryIn > 0 ? `${block.baseTarget}m base` : 'effort target'}</span></div>
        <div className="ae-row-progress"><div className="ae-row-progress-label"><span>{formatMinutes(metrics.credited)} credited</span><span>{progress}%</span></div><div className="ae-row-progress-track"><span style={{ width: `${progress}%` }} /></div><small>{metrics.outputRecorded ? 'Output recorded' : 'Output not recorded'}</small></div>
        <span className={`ae-block-status ${status.className}`}>{status.label}</span>
        <button type="button" className="ae-proof-toggle" onClick={onToggle} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Open'} ${track.name} evidence`}><FileCheck2 size={16} /><span>{metrics.outputRecorded ? 'View output' : 'Log + output'}</span><ChevronDown size={15} /></button>
      </div>
      {expanded && <TrackEditor block={block} track={track} assignment={assignment} disabled={planClosed || block.baseTarget === 0} onChange={onChange} onRecord={onRecord} onDone={onToggle} onWaive={onWaive} />}
    </div>
  );
}

function AccountabilityCard({ status, progress, remaining, causes }) {
  return <section className="ae-card ae-status-card"><div className="ae-card-kicker"><ShieldCheck size={15} /> Accountability status</div><div className="ae-status-overview"><div className="ae-progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><strong>{progress}%</strong><span>credited</span></div></div><div><span className={`ae-overall-status ${status === 'Complete' ? 'clear' : status === 'Evidence Needed' ? 'risk' : 'progress'}`}>{status}</span><p>{status === 'Complete' ? 'Contract complete. Optional work stays optional.' : `${formatMinutes(remaining)} of effort remains, plus any missing outputs.`}</p></div></div>{causes.length ? <div className="ae-cause-list"><span>Next actions</span>{causes.slice(0, 3).map(cause => <div key={cause.id}><CircleAlert size={14} /><p>{cause.text}</p></div>)}{causes.length > 3 && <small>+ {causes.length - 3} more blocks</small>}</div> : <div className="ae-clear-message"><CheckCircle2 size={17} /> Every required block and output is complete.</div>}</section>;
}

function DebtCard({ rows, projectedDebt, ledger, selectedDate }) {
  const [showLedger, setShowLedger] = useState(false);
  const maxDebt = Math.max(1, ...rows.map(row => row.metrics.debtAfter));
  const transactions = ledger.filter(item => item.date === selectedDate).slice().reverse();
  return <section className="ae-card ae-debt-card"><div className="ae-card-heading"><div><div className="ae-card-kicker"><TimerReset size={15} /> Workload debt</div><h2>{formatMinutes(projectedDebt)} projected at close</h2></div><span className="ae-cap-pill">50% recovery cap</span></div><div className="ae-debt-list">{rows.map(({ block, track, metrics }) => <div className="ae-debt-row" key={track.id}><div><span className="ae-debt-dot" style={{ background: track.color }} /><strong>{track.name}</strong></div><div className="ae-debt-bar"><span style={{ width: `${(metrics.debtAfter / maxDebt) * 100}%`, background: track.color }} /></div><span>{formatMinutes(metrics.debtAfter)}</span><small>{block.debtIn ? `${formatMinutes(block.debtIn)} carried in` : 'new if missed'}</small></div>)}</div><button type="button" className="ae-ledger-toggle" onClick={() => setShowLedger(value => !value)}><History size={13} /> {showLedger ? 'Hide ledger' : 'View source ledger'}</button>{showLedger && <div className="ae-ledger-list">{transactions.length ? transactions.map(item => <div key={item.id}><span>{TRACKS_BY_ID[item.trackId]?.name}</span><strong className={item.amount < 0 ? 'credit' : ''}>{item.amount > 0 ? '+' : ''}{item.amount}m</strong><small>{item.kind.replaceAll('-', ' ')} · {item.reason}</small></div>) : <p>No posted transactions for this date. The projection above becomes history when the day closes.</p>}</div>}<p className="ae-debt-note"><LockKeyhole size={13} /> Full debt remains traceable; only capped recovery is scheduled.</p></section>;
}

function LearningQueue({ items, reviews, currentAssignmentId, onOpen }) {
  const active = items.filter(item => item.state === 'active');
  const nextPerTrack = TRACK_TEMPLATES.map(track => items.find(item => item.trackId === track.id && item.state === 'queued' && item.prerequisiteIds.every(id => items.find(candidate => candidate.id === id)?.state === 'complete'))).filter(Boolean);
  const reviewRows = reviews.map(review => { const source = items.find(item => item.id === review.itemId); return { ...source, id: review.id, sourceItemId: source?.id, type: `${review.intervalDays}-day review`, detail: `Due ${review.dueDate} · reproduce without the original answer`, isReview: true, state: 'active' }; }).filter(item => item.title);
  const visible = [...reviewRows, ...active, ...nextPerTrack].filter((item, index, array) => array.findIndex(candidate => candidate.id === item.id) === index).slice(0, 6);
  const openCount = items.filter(item => !['complete', 'mastered'].includes(item.state)).length + reviews.length;
  return <section className="ae-card ae-queue-card"><div className="ae-card-heading"><div><div className="ae-card-kicker"><ListChecks size={15} /> Curriculum debt</div><h2>Learning queue</h2><p>Reviews come first; prerequisites move while independent tracks continue.</p></div><span className="ae-count-pill">{openCount} open · {items.length} curriculum items</span></div><div className="ae-queue-list">{visible.map((item, index) => { const track = TRACKS_BY_ID[item.trackId]; const current = currentAssignmentId === item.id; const blocked = item.state === 'queued' && !item.prerequisiteIds.every(id => items.find(candidate => candidate.id === id)?.state === 'complete'); return <div className={`ae-queue-row ${blocked ? 'blocked' : ''}`} key={item.id}><div className="ae-queue-index">{String(index + 1).padStart(2, '0')}</div><div className="ae-queue-icon" style={{ '--track-color': track.color }}>{item.isReview ? <RotateCcw size={16} /> : blocked ? <LockKeyhole size={16} /> : <BookOpen size={16} />}</div><div className="ae-queue-copy"><div><span>{item.type}</span><span style={{ color: track.color }}>{track.name}</span></div><h3>{item.title}</h3><p>{item.detail}</p></div><span className="ae-queue-remaining">{item.topic || item.remaining}</span><span className={`ae-queue-state ${blocked ? 'blocked' : ''}`}>{current ? 'Current output' : blocked ? 'Waiting' : item.isReview ? 'Review due' : 'Ready now'}</span><button type="button" className="ae-queue-complete" disabled={blocked || current} onClick={() => onOpen(item)}><ArrowRight size={15} /><span>{current ? 'Current' : 'Open'}</span></button></div>; })}</div></section>;
}

function WeeklyReview({ data, selectedDate, rows, roadmapWeek }) {
  const dates = Object.keys(data.plans).filter(date => date <= selectedDate).sort().slice(-7);
  const blocks = dates.flatMap(date => data.plans[date].blocks).filter(block => block.baseTarget > 0);
  const planned = blocks.reduce((sum, block) => sum + block.baseTarget, 0);
  const baseCredited = blocks.reduce((sum, block) => sum + Math.min(blockMetrics(block).credited, block.baseTarget), 0);
  const recorded = blocks.filter(block => block.outputRecordedAt || block.waiver).length;
  const dueReviews = data.reviews.filter(review => review.dueDate <= selectedDate);
  const passedReviews = dueReviews.filter(review => review.state === 'passed').length;
  const roadmapComplete = data.roadmap.filter(item => item.state === 'complete').length;
  const dueMilestones = data.roadmap.filter(item => item.week <= roadmapWeek).length;
  const metrics = [
    { label: 'Base coverage', value: `${planned ? Math.round(baseCredited / planned * 100) : 0}%`, detail: `${formatMinutes(baseCredited)} verified`, icon: Target },
    { label: 'Output records', value: `${blocks.length ? Math.round(recorded / blocks.length * 100) : 0}%`, detail: `${recorded} of ${blocks.length} blocks`, icon: FileCheck2 },
    { label: 'Review compliance', value: dueReviews.length ? `${Math.round(passedReviews / dueReviews.length * 100)}%` : '—', detail: `${passedReviews} of ${dueReviews.length} due`, icon: RotateCcw },
    { label: 'Error recurrence', value: data.errors.filter(error => !error.resolved).length, detail: `${data.attempts.length} algorithm attempts`, icon: CircleAlert },
  ];
  return <section className="ae-card ae-review-card"><div className="ae-card-heading"><div><div className="ae-card-kicker"><CalendarDays size={15} /> Weekly review</div><h2>Capability, not just time</h2><p>Review proof, retention, recurring errors, and future scope.</p></div><span className="ae-count-pill">Week {roadmapWeek} · through {formatDate(selectedDate).split(',')[0]}</span></div><div className="ae-review-metrics">{metrics.map(metric => { const Icon = metric.icon; return <div className="ae-review-metric" key={metric.label}><Icon size={17} /><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>; })}</div><div className="ae-roadmap-strip"><div className="ae-roadmap-label"><span>12-week roadmap</span><strong>{roadmapComplete} / {dueMilestones || 24} proven</strong></div><div className="ae-roadmap-weeks">{Array.from({ length: 12 }, (_, index) => { const week = index + 1; const weekItems = data.roadmap.filter(item => item.week === week); const done = weekItems.length > 0 && weekItems.every(item => item.state === 'complete'); return <span key={week} className={`${week === roadmapWeek ? 'current' : ''} ${done ? 'done' : ''}`} title={`Week ${week}`}>{week}</span>; })}</div></div></section>;
}

function PlanningPanel({ profile, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(profile));
  const [reason, setReason] = useState('Adjust future workload');
  const toggleDay = day => setDraft(value => ({ ...value, activeDays: value.activeDays.includes(day) ? value.activeDays.filter(item => item !== day) : [...value.activeDays, day].sort() }));
  return <section className="ae-close-confirm ae-settings-panel"><div className="ae-settings-copy"><Settings2 size={18} /><p><strong>Future plan settings</strong><span>Changes apply prospectively. Existing daily snapshots do not change.</span></p></div><div className="ae-settings-form"><label><span>Active days</span><div className="ae-day-picker">{DAY_OPTIONS.map(([label, day], index) => <button type="button" key={`${label}-${index}`} className={draft.activeDays.includes(day) ? 'active' : ''} onClick={() => toggleDay(day)}>{label}</button>)}</div></label><label><span>Daily ceiling</span><input type="number" value={draft.maxDailyMinutes} onChange={event => setDraft(value => ({ ...value, maxDailyMinutes: Number(event.target.value) }))} /></label><div className="ae-target-settings">{TRACK_TEMPLATES.map(track => <label key={track.id}><span>{track.name}</span><input type="number" value={draft.trackTargets[track.id]} onChange={event => setDraft(value => ({ ...value, trackTargets: { ...value.trackTargets, [track.id]: Number(event.target.value) } }))} /></label>)}</div><label><span>Reason</span><input value={reason} onChange={event => setReason(event.target.value)} /></label><div className="ae-settings-actions"><button type="button" onClick={onClose}>Cancel</button><button type="button" className="confirm" onClick={() => onSave({ ...draft, reason })}>Save future plan</button></div></div></section>;
}

function CorrectionPanel({ onSave, onClose }) {
  const [trackId, setTrackId] = useState('algorithms');
  const [minutes, setMinutes] = useState(0);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  return <section className="ae-close-confirm ae-settings-panel"><div className="ae-settings-copy"><History size={18} /><p><strong>Add an auditable correction</strong><span>The original snapshot stays locked; this posts a separate debt credit.</span></p></div><div className="ae-settings-form"><label><span>Track</span><select value={trackId} onChange={event => setTrackId(event.target.value)}>{TRACK_TEMPLATES.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label><label><span>Credited minutes</span><input type="number" min="1" value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></label><label><span>Reason</span><input value={reason} onChange={event => setReason(event.target.value)} placeholder="Why is this being corrected late?" /></label><label><span>Evidence</span><textarea value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Link or describe the output" /></label><div className="ae-settings-actions"><button type="button" onClick={onClose}>Cancel</button><button type="button" className="confirm" onClick={() => onSave(trackId, minutes, reason, evidence)}>Post correction</button></div></div></section>;
}

export default function Accountability({ userId }) {
  const currentDate = todayInTimeZone('Asia/Singapore');
  const [data, setData] = useState(() => loadAccountabilityState(userId, currentDate));
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('checking');

  useEffect(() => { let active = true; fetchAccountabilityState(userId, currentDate).then(result => { if (!active) return; setData(result.state); setSyncStatus(result.cloudAvailable ? 'cloud' : 'local'); setCloudReady(true); }); return () => { active = false; }; }, [userId, currentDate]);
  useEffect(() => { const saved = saveAccountabilityState(userId, data); if (!cloudReady) return undefined; setSyncStatus('saving'); const timer = setTimeout(() => syncAccountabilityState(userId, saved).then(result => setSyncStatus(result.cloudAvailable ? 'cloud' : 'local')), 700); return () => clearTimeout(timer); }, [data, userId, cloudReady]);

  const planDates = Object.keys(data.plans).sort();
  const plan = data.plans[selectedDate] || data.plans[currentDate];
  const actualDate = plan.date;
  const roadmapWeek = currentRoadmapWeek(data.profile.startDate, actualDate);
  const rows = useMemo(() => plan.blocks.map(block => ({ block, track: TRACKS_BY_ID[block.trackId], assignment: getAssignment(data, block), metrics: blockMetrics(block) })), [data, plan]);
  const totalBase = rows.reduce((sum, row) => sum + row.block.baseTarget, 0);
  const totalCarry = rows.reduce((sum, row) => sum + row.block.carryIn, 0);
  const totalTarget = totalBase + totalCarry;
  const totalCredited = rows.reduce((sum, row) => sum + row.metrics.credited, 0);
  const totalLogged = rows.reduce((sum, row) => sum + row.metrics.logged, 0);
  const projectedDebt = rows.reduce((sum, row) => sum + row.metrics.debtAfter, 0);
  const completedBlocks = rows.filter(row => row.metrics.complete).length;
  const anyLogged = rows.some(row => row.metrics.logged > 0);
  const pendingEvidence = rows.some(row => row.metrics.pendingEvidence);
  const allComplete = completedBlocks === rows.length;
  const overallStatus = !plan.active ? 'Rest Day' : allComplete ? 'Complete' : pendingEvidence ? 'Evidence Needed' : anyLogged ? 'In Progress' : 'Ready';
  const progress = Math.min(100, Math.round(totalCredited / Math.max(1, totalTarget) * 100));
  const planClosed = plan.status === 'closed';
  const causes = rows.filter(row => !row.metrics.complete && row.block.baseTarget > 0).map(row => ({ id: row.track.id, text: row.metrics.waived ? `${row.track.name}: waived with an audit reason.` : !row.metrics.outputRecorded ? `${row.track.name}: record the required output.` : `${row.track.name}: ${formatMinutes(Math.max(0, row.metrics.target - row.metrics.credited))} effort remains.` }));
  const currentAssignmentId = plan.blocks.find(block => block.assignmentId)?.assignmentId;
  const dateIndex = planDates.indexOf(actualDate);

  const updateBlock = (trackId, patch) => { if (planClosed || actualDate !== currentDate) return; setData(previous => ({ ...previous, plans: { ...previous.plans, [actualDate]: { ...previous.plans[actualDate], blocks: previous.plans[actualDate].blocks.map(block => block.trackId === trackId ? { ...block, ...patch } : block) } } })); };
  const recordOutput = trackId => setData(previous => recordLearningOutcome(previous, actualDate, trackId));
  const openQueueItem = item => { setData(previous => item.isReview ? activateReview(previous, item.id, currentDate) : activateLearningItem(previous, item.id, currentDate)); setSelectedDate(currentDate); setExpandedTrack(item.trackId); };
  const closeDay = () => { setData(previous => closeAccountabilityPlan(previous, actualDate)); setConfirmClose(false); setExpandedTrack(null); };

  return <main className="accountability-page">
    <section className="ae-hero"><div><div className="ae-hero-eyebrow"><span /> Quant developer path · Week {roadmapWeek} of 12</div><h1>{actualDate === currentDate ? 'Today’s contract' : 'Daily snapshot'}</h1><p>{formatDate(actualDate)} <span>·</span> Asia/Singapore <span>·</span> {planClosed ? 'Closed snapshot' : `Generated ${new Date(plan.generatedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: plan.timezone })}`}</p><div className="ae-history-nav"><button type="button" disabled={dateIndex <= 0} onClick={() => setSelectedDate(planDates[dateIndex - 1])}><ChevronLeft size={14} /></button><span>{dateIndex + 1} / {planDates.length} saved days</span><button type="button" disabled={dateIndex >= planDates.length - 1} onClick={() => setSelectedDate(planDates[dateIndex + 1])}><ChevronRight size={14} /></button></div></div><div className="ae-hero-actions"><span className={`ae-sync-pill ${syncStatus}`} title={syncStatus === 'cloud' ? 'Synced to Supabase' : 'Saved on this device'}>{syncStatus === 'cloud' ? <Cloud size={14} /> : <HardDrive size={14} />}{syncStatus === 'cloud' ? 'Cloud saved' : syncStatus === 'saving' ? 'Saving…' : 'On-device'}</span><span className={`ae-hero-status ${overallStatus === 'Complete' ? 'clear' : overallStatus === 'Evidence Needed' ? 'risk' : 'ready'}`}>{overallStatus === 'Complete' ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}{overallStatus}</span>{actualDate === currentDate && !planClosed && <button type="button" className="ae-icon-button" onClick={() => setSettingsOpen(value => !value)} title="Future plan settings"><Settings2 size={16} /></button>}{planClosed ? <button type="button" className="ae-close-button" onClick={() => setCorrectionOpen(value => !value)}><History size={15} /> Correct record</button> : <button type="button" className="ae-close-button" onClick={() => setConfirmClose(true)}>Review day close <ArrowRight size={15} /></button>}</div></section>
    {settingsOpen && <PlanningPanel profile={data.profile} onClose={() => setSettingsOpen(false)} onSave={changes => { setData(previous => updatePlanningProfile(previous, changes)); setSettingsOpen(false); }} />}
    {correctionOpen && <CorrectionPanel onClose={() => setCorrectionOpen(false)} onSave={(trackId, minutes, reason, evidence) => { setData(previous => applyCorrection(previous, actualDate, trackId, minutes, reason, evidence)); setCorrectionOpen(false); }} />}
    {confirmClose && <section className="ae-close-confirm" role="alert"><div><CircleAlert size={18} /><p><strong>Close this immutable daily snapshot?</strong><span>{formatMinutes(projectedDebt)} of projected debt will remain visible. Corrections and waivers post as separate audit events.</span></p></div><div><button type="button" onClick={() => setConfirmClose(false)}>Keep working</button><button type="button" className="confirm" onClick={closeDay}>Close & carry debt</button></div></section>}
    <section className="ae-summary-grid" aria-label="Daily contract summary"><div><Clock3 size={17} /><span><small>Planned load</small><strong>{formatMinutes(totalTarget)}</strong></span><em>{formatMinutes(totalBase)} base</em></div><div><ShieldCheck size={17} /><span><small>Credited effort</small><strong>{formatMinutes(totalCredited)}</strong></span><em>{formatMinutes(totalLogged)} logged</em></div><div><RotateCcw size={17} /><span><small>Recovery today</small><strong>{formatMinutes(totalCarry)}</strong></span><em>capped by track</em></div><div><Target size={17} /><span><small>Complete blocks</small><strong>{completedBlocks} / {rows.length}</strong></span><em>effort + output</em></div></section>
    <div className="ae-dashboard-grid"><section className="ae-card ae-contract-card"><div className="ae-card-heading"><div><div className="ae-card-kicker"><Target size={15} /> Daily plan</div><h2>Effort + required outputs</h2><p>Time and curriculum outcomes are tracked separately.</p></div><span className="ae-count-pill">{completedBlocks} of {rows.length} complete</span></div><div className="ae-contract-list">{rows.map(row => <ContractRow key={row.track.id} block={row.block} assignment={row.assignment} planClosed={planClosed || actualDate !== currentDate} expanded={expandedTrack === row.track.id} onToggle={() => setExpandedTrack(current => current === row.track.id ? null : row.track.id)} onChange={patch => updateBlock(row.track.id, patch)} onRecord={() => recordOutput(row.track.id)} onWaive={reason => setData(previous => applyWaiver(previous, actualDate, row.track.id, reason))} />)}</div></section><aside className="ae-side-stack"><AccountabilityCard status={overallStatus} progress={progress} remaining={Math.max(0, totalTarget - totalCredited)} causes={causes} /><DebtCard rows={rows} projectedDebt={projectedDebt} ledger={data.debtLedger} selectedDate={actualDate} /></aside></div>
    <LearningQueue items={data.learningItems} reviews={getDueReviews(data, currentDate)} currentAssignmentId={currentAssignmentId} onOpen={openQueueItem} />
    <WeeklyReview data={data} selectedDate={actualDate} rows={rows} roadmapWeek={roadmapWeek} />
  </main>;
}

