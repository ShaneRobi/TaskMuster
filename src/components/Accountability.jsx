import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  ListChecks,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import { todayInTimeZone } from '../dateUtils';
import {
  TRACK_TEMPLATES,
  advanceLearningItem,
  blockMetrics,
  closeAccountabilityPlan,
  evidencePasses,
  loadAccountabilityState,
  saveAccountabilityState,
} from '../accountabilityStore';

const TRACKS_BY_ID = Object.fromEntries(TRACK_TEMPLATES.map(track => [track.id, track]));

function formatMinutes(minutes) {
  const value = Math.max(0, Math.round(minutes));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (!hours) return `${mins}m`;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function currentRoadmapWeek(startDate, currentDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const current = new Date(`${currentDate}T00:00:00`);
  const elapsedDays = Math.max(0, Math.floor((current - start) / 86400000));
  return Math.min(12, Math.floor(elapsedDays / 7) + 1);
}

function statusFor(block) {
  const metrics = blockMetrics(block);
  if (metrics.complete) return { label: 'Verified', className: 'verified' };
  if (metrics.pendingEvidence) return { label: 'Pending proof', className: 'pending' };
  if (metrics.logged > 0) return { label: 'In progress', className: 'progress' };
  return { label: 'Not started', className: 'idle' };
}

function TrackEditor({ block, track, disabled, onChange, onDone }) {
  const metrics = blockMetrics(block);
  const changeMinutes = amount => {
    onChange({ loggedMinutes: Math.max(0, metrics.logged + amount) });
  };

  return (
    <div className="ae-track-editor">
      <div className="ae-editor-grid">
        <div className="ae-field-group">
          <label className="ae-field-label" htmlFor={`minutes-${track.id}`}>Minutes logged</label>
          <div className="ae-minute-control">
            <button type="button" onClick={() => changeMinutes(-15)} disabled={disabled || metrics.logged === 0}>−</button>
            <input
              id={`minutes-${track.id}`}
              type="number"
              min="0"
              step="5"
              value={metrics.logged}
              disabled={disabled}
              onChange={event => onChange({ loggedMinutes: Math.max(0, Number(event.target.value) || 0) })}
            />
            <button type="button" onClick={() => changeMinutes(15)} disabled={disabled}>+15</button>
          </div>
        </div>

        <div className="ae-field-group ae-proof-field">
          <label className="ae-field-label" htmlFor={`evidence-${track.id}`}>Evidence</label>
          <textarea
            id={`evidence-${track.id}`}
            value={block.evidence}
            disabled={disabled}
            onChange={event => onChange({ evidence: event.target.value })}
            placeholder="Paste a link or describe the output you produced…"
            rows="3"
          />
          <p className="ae-evidence-rule"><FileCheck2 size={13} /> {track.evidence}</p>
        </div>
      </div>

      <div className="ae-editor-footer">
        <div className={`ae-proof-feedback ${evidencePasses(block.evidence) ? 'valid' : ''}`}>
          {evidencePasses(block.evidence) ? (
            <><CheckCircle2 size={14} /> Proof accepted. {formatMinutes(metrics.logged)} can be credited.</>
          ) : metrics.logged > 0 ? (
            <><CircleAlert size={14} /> Minutes are saved but remain uncredited until proof is added.</>
          ) : (
            <><ShieldCheck size={14} /> Proof is required before effort reduces debt.</>
          )}
        </div>
        <button type="button" className="ae-editor-done" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

function ContractRow({ block, item, planClosed, expanded, onToggle, onChange }) {
  const track = TRACKS_BY_ID[block.trackId];
  const metrics = blockMetrics(block);
  const status = statusFor(block);
  const progress = Math.min(100, Math.round((metrics.credited / Math.max(1, metrics.target)) * 100));

  return (
    <div className={`ae-contract-row ${expanded ? 'expanded' : ''}`} style={{ '--track-color': track.color }}>
      <div className="ae-contract-row-main">
        <div className="ae-track-mark">{track.name.slice(0, 2).toUpperCase()}</div>
        <div className="ae-track-copy">
          <div className="ae-track-title-line">
            <h3>{track.name}</h3>
            <span>{track.eyebrow}</span>
            {block.carryIn > 0 && <span className="ae-recovery-tag"><RotateCcw size={11} /> +{block.carryIn}m recovery</span>}
          </div>
          <p>{item?.title || 'Choose the next eligible learning item'}</p>
        </div>
        <div className="ae-target-copy">
          <strong>{formatMinutes(metrics.target)}</strong>
          <span>{block.carryIn > 0 ? `${block.baseTarget}m base` : 'base target'}</span>
        </div>
        <div className="ae-row-progress">
          <div className="ae-row-progress-label">
            <span>{formatMinutes(metrics.credited)} credited</span>
            <span>{progress}%</span>
          </div>
          <div className="ae-row-progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <span className={`ae-block-status ${status.className}`}>{status.label}</span>
        <button
          type="button"
          className="ae-proof-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Hide' : 'Open'} ${track.name} evidence`}
        >
          {metrics.complete ? <Check size={16} /> : <FileCheck2 size={16} />}
          <span>{metrics.complete ? 'View proof' : 'Log + proof'}</span>
          <ChevronDown size={15} />
        </button>
      </div>

      {expanded && (
        <TrackEditor
          block={block}
          track={track}
          disabled={planClosed}
          onChange={onChange}
          onDone={onToggle}
        />
      )}
    </div>
  );
}

function AccountabilityCard({ status, progress, totalTarget, totalCredited, causes }) {
  return (
    <section className="ae-card ae-status-card">
      <div className="ae-card-kicker"><ShieldCheck size={15} /> Accountability status</div>
      <div className="ae-status-overview">
        <div className="ae-progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}>
          <div><strong>{progress}%</strong><span>credited</span></div>
        </div>
        <div>
          <span className={`ae-overall-status ${status === 'Clear' ? 'clear' : status === 'At Risk' ? 'risk' : 'owe'}`}>{status}</span>
          <p>{status === 'Clear' ? 'Contract complete. Optional work stays optional.' : `${formatMinutes(totalTarget - totalCredited)} of verified work remains.`}</p>
        </div>
      </div>

      {causes.length > 0 ? (
        <div className="ae-cause-list">
          <span>Exact causes</span>
          {causes.slice(0, 3).map(cause => (
            <div key={cause.id}><CircleAlert size={14} /><p>{cause.text}</p></div>
          ))}
          {causes.length > 3 && <small>+ {causes.length - 3} more block{causes.length - 3 === 1 ? '' : 's'}</small>}
        </div>
      ) : (
        <div className="ae-clear-message"><CheckCircle2 size={17} /> Every required block has passing evidence.</div>
      )}
    </section>
  );
}

function DebtCard({ rows, projectedDebt }) {
  const maxDebt = Math.max(1, ...rows.map(row => row.metrics.debtAfter));

  return (
    <section className="ae-card ae-debt-card">
      <div className="ae-card-heading">
        <div>
          <div className="ae-card-kicker"><TimerReset size={15} /> Workload debt</div>
          <h2>{formatMinutes(projectedDebt)} projected at close</h2>
        </div>
        <span className="ae-cap-pill">50% recovery cap</span>
      </div>
      <div className="ae-debt-list">
        {rows.map(({ block, track, metrics }) => (
          <div className="ae-debt-row" key={track.id}>
            <div><span className="ae-debt-dot" style={{ background: track.color }} /><strong>{track.name}</strong></div>
            <div className="ae-debt-bar"><span style={{ width: `${(metrics.debtAfter / maxDebt) * 100}%`, background: track.color }} /></div>
            <span>{formatMinutes(metrics.debtAfter)}</span>
            <small>{block.debtIn ? `${formatMinutes(block.debtIn)} carried in` : 'new if missed'}</small>
          </div>
        ))}
      </div>
      <p className="ae-debt-note"><LockKeyhole size={13} /> Full debt stays visible. Only capped recovery is added to a future day.</p>
    </section>
  );
}

function LearningQueue({ items, blocks, onComplete }) {
  const visibleItems = items.filter(item => item.state !== 'complete').slice(0, 6);
  const completedCount = items.filter(item => item.state === 'complete').length;

  return (
    <section className="ae-card ae-queue-card">
      <div className="ae-card-heading">
        <div>
          <div className="ae-card-kicker"><ListChecks size={15} /> Curriculum debt</div>
          <h2>Learning queue</h2>
          <p>Items retain their identity; dependants wait and independent tracks continue.</p>
        </div>
        <span className="ae-count-pill">{visibleItems.length} open · {completedCount} done</span>
      </div>

      <div className="ae-queue-list">
        {visibleItems.map((item, index) => {
          const track = TRACKS_BY_ID[item.trackId];
          const block = blocks.find(candidate => candidate.trackId === item.trackId);
          const blockComplete = block ? blockMetrics(block).complete : false;
          const isBlocked = item.state === 'queued';
          return (
            <div className={`ae-queue-row ${isBlocked ? 'blocked' : ''}`} key={item.id}>
              <div className="ae-queue-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="ae-queue-icon" style={{ '--track-color': track.color }}>
                {isBlocked ? <LockKeyhole size={16} /> : <BookOpen size={16} />}
              </div>
              <div className="ae-queue-copy">
                <div><span>{item.type}</span><span style={{ color: track.color }}>{track.name}</span></div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
              <span className="ae-queue-remaining">{item.remaining}</span>
              <span className={`ae-queue-state ${isBlocked ? 'blocked' : ''}`}>{isBlocked ? 'Waiting on prerequisite' : 'Ready now'}</span>
              <button
                type="button"
                className="ae-queue-complete"
                onClick={() => onComplete(item.id)}
                disabled={!blockComplete || isBlocked}
                title={isBlocked ? 'Complete the prerequisite first' : !blockComplete ? `Verify today’s ${track.name} block first` : 'Mark learning item complete'}
              >
                <Check size={15} /> <span>Complete</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyReview({ data, currentDate, rows, roadmapWeek }) {
  const planDates = Object.keys(data.plans).sort().slice(-7);
  const periodPlans = planDates.map(date => data.plans[date]);
  const historicalBlocks = periodPlans.flatMap(plan => plan.blocks);
  const plannedBase = historicalBlocks.reduce((sum, block) => sum + block.baseTarget, 0);
  const credited = historicalBlocks.reduce((sum, block) => sum + blockMetrics(block).credited, 0);
  const baseCoverage = plannedBase ? Math.min(100, Math.round((credited / plannedBase) * 100)) : 0;
  const passingEvidence = historicalBlocks.filter(block => blockMetrics(block).credited > 0).length;
  const evidenceRate = historicalBlocks.length ? Math.round((passingEvidence / historicalBlocks.length) * 100) : 0;
  const roadmapComplete = data.roadmap.filter(item => item.state === 'complete').length;
  const dueMilestones = data.roadmap.filter(item => item.week <= roadmapWeek).length;
  const proofRate = dueMilestones ? Math.round((roadmapComplete / dueMilestones) * 100) : 0;
  const openQueue = data.learningItems.filter(item => item.state !== 'complete').length;
  const currentCredited = rows.reduce((sum, row) => sum + row.metrics.credited, 0);

  const metrics = [
    { label: 'Base coverage', value: `${baseCoverage}%`, detail: `${formatMinutes(credited)} verified this period`, icon: Target },
    { label: 'Evidence rate', value: `${evidenceRate}%`, detail: `${passingEvidence} of ${historicalBlocks.length} blocks`, icon: FileCheck2 },
    { label: 'Roadmap proof', value: `${proofRate}%`, detail: `${roadmapComplete} of ${dueMilestones} due milestones`, icon: TrendingUp },
    { label: 'Curriculum queue', value: openQueue, detail: `${formatMinutes(currentCredited)} credited today`, icon: ListChecks },
  ];

  return (
    <section className="ae-card ae-review-card">
      <div className="ae-card-heading">
        <div>
          <div className="ae-card-kicker"><CalendarDays size={15} /> Weekly review</div>
          <h2>Capability, not just time</h2>
          <p>Review proof, backlog movement, retention, and the next deliberate scope decision.</p>
        </div>
        <span className="ae-count-pill">Week {roadmapWeek} · through {formatDate(currentDate).split(',')[0]}</span>
      </div>

      <div className="ae-review-metrics">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div className="ae-review-metric" key={metric.label}>
              <Icon size={17} />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </div>
          );
        })}
      </div>

      <div className="ae-roadmap-strip">
        <div className="ae-roadmap-label"><span>12-week roadmap</span><strong>{roadmapComplete} / 24 proven</strong></div>
        <div className="ae-roadmap-weeks">
          {Array.from({ length: 12 }, (_, index) => {
            const week = index + 1;
            const weekItems = data.roadmap.filter(item => item.week === week);
            const done = weekItems.length > 0 && weekItems.every(item => item.state === 'complete');
            return <span key={week} className={`${week === roadmapWeek ? 'current' : ''} ${done ? 'done' : ''}`} title={`Week ${week}`}>{week}</span>;
          })}
        </div>
      </div>
    </section>
  );
}

export default function Accountability({ userId }) {
  const currentDate = todayInTimeZone('Asia/Singapore');
  const [data, setData] = useState(() => loadAccountabilityState(userId, currentDate));
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    saveAccountabilityState(userId, data);
  }, [data, userId]);

  const plan = data.plans[currentDate];
  const roadmapWeek = currentRoadmapWeek(data.profile.startDate, currentDate);
  const rows = useMemo(() => plan.blocks.map(block => {
    const track = TRACKS_BY_ID[block.trackId];
    const item = data.learningItems
      .filter(candidate => candidate.trackId === block.trackId && candidate.state === 'active')
      .sort((a, b) => a.order - b.order)[0];
    return { block, track, item, metrics: blockMetrics(block) };
  }), [data.learningItems, plan.blocks]);

  const totalBase = rows.reduce((sum, row) => sum + row.block.baseTarget, 0);
  const totalCarry = rows.reduce((sum, row) => sum + row.block.carryIn, 0);
  const totalTarget = totalBase + totalCarry;
  const totalCredited = rows.reduce((sum, row) => sum + row.metrics.credited, 0);
  const totalLogged = rows.reduce((sum, row) => sum + row.metrics.logged, 0);
  const projectedDebt = rows.reduce((sum, row) => sum + row.metrics.debtAfter, 0);
  const completedBlocks = rows.filter(row => row.metrics.complete).length;
  const pendingEvidence = rows.some(row => row.metrics.pendingEvidence);
  const allComplete = completedBlocks === rows.length;
  const overallStatus = allComplete ? 'Clear' : pendingEvidence ? 'At Risk' : 'Owe Work';
  const progress = Math.min(100, Math.round((totalCredited / Math.max(1, totalTarget)) * 100));
  const planClosed = plan.status === 'closed';

  const causes = rows.filter(row => !row.metrics.complete).map(row => ({
    id: row.track.id,
    text: row.metrics.pendingEvidence
      ? `${row.track.name}: add acceptable proof for ${formatMinutes(row.metrics.logged)} logged.`
      : `${row.track.name}: ${formatMinutes(Math.max(0, row.metrics.target - row.metrics.credited))} plus passing proof owed.`,
  }));

  const updateBlock = (trackId, patch) => {
    if (planClosed) return;
    setData(previous => ({
      ...previous,
      plans: {
        ...previous.plans,
        [currentDate]: {
          ...previous.plans[currentDate],
          blocks: previous.plans[currentDate].blocks.map(block => (
            block.trackId === trackId ? { ...block, ...patch } : block
          )),
        },
      },
    }));
  };

  const completeQueueItem = itemId => {
    setData(previous => advanceLearningItem(previous, itemId));
  };

  const closeDay = () => {
    setData(previous => closeAccountabilityPlan(previous, currentDate));
    setConfirmClose(false);
    setExpandedTrack(null);
  };

  return (
    <main className="accountability-page">
      <section className="ae-hero">
        <div>
          <div className="ae-hero-eyebrow"><span /> Quant developer path · Week {roadmapWeek} of 12</div>
          <h1>Today’s contract</h1>
          <p>{formatDate(currentDate)} <span>·</span> Asia/Singapore <span>·</span> Snapshot generated {new Date(plan.generatedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', timeZone: plan.timezone })}</p>
        </div>
        <div className="ae-hero-actions">
          <span className={`ae-hero-status ${overallStatus === 'Clear' ? 'clear' : overallStatus === 'At Risk' ? 'risk' : ''}`}>
            {overallStatus === 'Clear' ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}{overallStatus}
          </span>
          {planClosed ? (
            <span className="ae-closed-pill"><LockKeyhole size={15} /> Day closed</span>
          ) : (
            <button type="button" className="ae-close-button" onClick={() => setConfirmClose(true)}>
              Review day close <ArrowRight size={15} />
            </button>
          )}
        </div>
      </section>

      {confirmClose && (
        <section className="ae-close-confirm" role="alert">
          <div><CircleAlert size={18} /><p><strong>Close this immutable daily snapshot?</strong><span>{formatMinutes(projectedDebt)} of projected debt will remain visible and roll forward with a 50% per-track recovery cap.</span></p></div>
          <div><button type="button" onClick={() => setConfirmClose(false)}>Keep working</button><button type="button" className="confirm" onClick={closeDay}>Close & carry debt</button></div>
        </section>
      )}

      <section className="ae-summary-grid" aria-label="Daily contract summary">
        <div><Clock3 size={17} /><span><small>Planned load</small><strong>{formatMinutes(totalTarget)}</strong></span><em>{formatMinutes(totalBase)} base</em></div>
        <div><ShieldCheck size={17} /><span><small>Credited effort</small><strong>{formatMinutes(totalCredited)}</strong></span><em>{formatMinutes(totalLogged)} logged</em></div>
        <div><RotateCcw size={17} /><span><small>Recovery today</small><strong>{formatMinutes(totalCarry)}</strong></span><em>capped by track</em></div>
        <div><Target size={17} /><span><small>Verified blocks</small><strong>{completedBlocks} / {rows.length}</strong></span><em>{rows.length - completedBlocks} still owed</em></div>
      </section>

      <div className="ae-dashboard-grid">
        <section className="ae-card ae-contract-card">
          <div className="ae-card-heading">
            <div>
              <div className="ae-card-kicker"><Target size={15} /> Daily plan</div>
              <h2>Base work + capped recovery</h2>
              <p>Minutes count only after track-specific proof passes.</p>
            </div>
            <span className="ae-count-pill">{completedBlocks} of {rows.length} verified</span>
          </div>

          <div className="ae-contract-list">
            {rows.map(row => (
              <ContractRow
                key={row.track.id}
                block={row.block}
                item={row.item}
                planClosed={planClosed}
                expanded={expandedTrack === row.track.id}
                onToggle={() => setExpandedTrack(current => current === row.track.id ? null : row.track.id)}
                onChange={patch => updateBlock(row.track.id, patch)}
              />
            ))}
          </div>
        </section>

        <aside className="ae-side-stack">
          <AccountabilityCard
            status={overallStatus}
            progress={progress}
            totalTarget={totalTarget}
            totalCredited={totalCredited}
            causes={causes}
          />
          <DebtCard rows={rows} projectedDebt={projectedDebt} />
        </aside>
      </div>

      <LearningQueue items={data.learningItems} blocks={plan.blocks} onComplete={completeQueueItem} />
      <WeeklyReview data={data} currentDate={currentDate} rows={rows} roadmapWeek={roadmapWeek} />
    </main>
  );
}
