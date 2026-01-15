import { For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { Exercise, ExerciseStage, SubSection, Workout, WorkoutConfig } from './types';

const PLACEHOLDER = 'https://placehold.co/200x200/EEE/31343C';
const DEFAULT_WORK_SEC = 60;
const DEFAULT_REST_SEC = 120;

type Stats = {
  totalSets: number;
  doneSets: number;
  totalSeconds: number;
  remainingSeconds: number;
  isDone: boolean;
};

function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function etaLabelFromSeconds(remaining: number, now: Date) {
  const seconds = Math.max(0, Math.round(remaining || 0));
  const eta = new Date(now.getTime() + seconds * 1000);
  const label = seconds ? eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'now';
  return `ETA ${label}`;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = createSignal(new Date());
  createEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    onCleanup(() => clearInterval(id));
  });
  return now;
}

const SetTable = (props: {
  exercise: Exercise;
  onStats?: (stats: Stats) => void;
  now: () => Date;
}) => {
  const setsCount = Math.max(props.exercise.sets ?? 3, 1);
  const [done, setDone] = createSignal<boolean[]>(Array.from({ length: setsCount }, () => false));
  const workSeconds = props.exercise.work_seconds ?? DEFAULT_WORK_SEC;
  const restSeconds = props.exercise.rest_seconds ?? DEFAULT_REST_SEC;
  const repsText = props.exercise.reps !== undefined ? String(props.exercise.reps) : '10–12';

  const totalSeconds = setsCount * (workSeconds + restSeconds);
  const doneSets = createMemo(() => done().filter(Boolean).length);
  const remainingSeconds = createMemo(() => Math.max(setsCount - doneSets(), 0) * (workSeconds + restSeconds));

  createEffect(() => {
    props.onStats?.({
      totalSets: setsCount,
      doneSets: doneSets(),
      totalSeconds,
      remainingSeconds: remainingSeconds(),
      isDone: setsCount > 0 && doneSets() === setsCount,
    });
  });

  const toggle = (index: number) => {
    setDone((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  return (
    <div class="space-y-2">
      <div class="flex flex-wrap gap-2 summary-pills" data-cy="exercise-summary">
        <span class={`summary-pill ${doneSets() === setsCount ? 'summary-pill-done' : ''}`}>
          {doneSets() === setsCount ? 'Completed' : `Done ${doneSets()}/${setsCount}`}
        </span>
        <span class="summary-pill">Sets {setsCount}</span>
        <span class="summary-pill">{`${formatClock(totalSeconds - remainingSeconds())}/${formatClock(totalSeconds)} (rem ${formatClock(remainingSeconds())})`}</span>
        <span class="summary-pill">{etaLabelFromSeconds(remainingSeconds(), props.now())}</span>
      </div>
      <table class="set-table w-full text-sm border-2 border-slate-300 rounded-lg overflow-hidden mt-1 shadow-sm">
        <thead class="bg-slate-50 text-slate-700">
          <tr>
            <th class="px-3 py-2 text-left font-semibold">Done</th>
            <th class="px-3 py-2 text-left font-semibold">Set</th>
            <th class="px-3 py-2 text-left font-semibold">Weight</th>
            <th class="px-3 py-2 text-left font-semibold">Reps/Target</th>
            <th class="px-3 py-2 text-left font-semibold hidden lg:table-cell">Work (s)</th>
            <th class="px-3 py-2 text-left font-semibold hidden lg:table-cell">Rest (s)</th>
          </tr>
        </thead>
        <tbody>
          <For each={Array.from({ length: setsCount })}>
            {(_, idx) => {
              const i = idx();
              return (
                <tr class={`border-t border-slate-200 ${done()[i] ? 'set-complete bg-green-50' : ''}`}>
                  <td class="px-3 py-2">
                    <input
                      type="checkbox"
                      class="set-done h-4 w-4 rounded border-slate-300 text-slate-800"
                      checked={done()[i]}
                      onChange={() => toggle(i)}
                    />
                  </td>
                  <td class="px-3 py-2 text-slate-800 font-semibold">{i + 1}</td>
                  <td class="px-3 py-2 text-slate-700">
                    <input
                      type="text"
                      class="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                      placeholder="—"
                      aria-label={`Weight for set ${i + 1}`}
                    />
                  </td>
                  <td class="px-3 py-2 text-slate-800">{repsText}</td>
                  <td class="px-3 py-2 text-slate-800 hidden lg:table-cell">{workSeconds}</td>
                  <td class="px-3 py-2 text-slate-800 hidden lg:table-cell">{restSeconds}</td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
};

const StagePill = (props: { stage?: ExerciseStage }) => {
  const map = {
    neural: { label: 'Neural Activation', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    stability: { label: 'Stability & Control', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    mechanical: { label: 'Mechanical Tension', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    metabolic: { label: 'Metabolic Finisher', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  } as const;
  const cfg = props.stage ? map[props.stage] : null;
  if (!cfg) return null;
  return <span class={`summary-pill text-xs ${cfg.color}`}>{cfg.label}</span>;
};

const ExerciseCard = (props: {
  exercise: Exercise;
  onStats?: (stats: Stats) => void;
  now: () => Date;
}) => {
  const e = props.exercise;
  const thumb = e.thumbnail || `${PLACEHOLDER}?text=${encodeURIComponent(e.name)}`;
  const [stats, setStats] = createSignal<Stats | null>(null);
  const exerciseDone = () => stats()?.isDone ?? false;

  return (
    <div
      class={`exercise-card border-0 shadow-none px-0 py-0 space-y-2 pb-3 ${exerciseDone() ? 'exercise-done' : ''}`}
      data-cy="exercise-card"
      role="article"
    >
      <div class="flex items-start gap-3">
        <img src={thumb} alt={e.name} class="exercise-thumb w-20 h-20 object-cover rounded-lg border border-slate-200" loading="lazy" />
        <div class="space-y-1">
          <h4 class="exercise-title text-base font-semibold text-slate-900">{e.name}</h4>
          <Show when={e.prescription}>
            {(p) => <p class="text-sm text-slate-700 font-semibold">{p}</p>}
          </Show>
          <div class="flex flex-wrap gap-2 items-center">
            <Show when={e.reps || e.sets}>
              <p class="text-xs text-slate-600 uppercase tracking-wide">Sets/Reps: {e.sets ? `${e.sets} × ` : ''}{e.reps ?? '—'}</p>
            </Show>
            <Show when={e.at_home}>
              {(a) => <span class="summary-pill text-xs">At-home: {a}</span>}
            </Show>
            <StagePill stage={e.stage} />
          </div>
        </div>
      </div>
      <SetTable
        exercise={e}
        onStats={(s) => {
          setStats(s);
          props.onStats?.(s);
        }}
        now={props.now}
      />
      <label class="flex flex-col gap-1 text-sm text-slate-700">
        <span class="font-semibold">Notes:</span>
        <textarea
          class="w-full border border-slate-300 rounded-lg p-2 text-sm"
          rows={3}
          placeholder="Add exercise notes (not saved)"
          aria-label={`Notes for exercise ${e.name}`}
        />
      </label>
      <Show when={e.notes?.length}>
        <ul class="list-disc list-inside text-sm text-slate-700 space-y-1">
          <For each={e.notes}>{(note) => <li>{note}</li>}</For>
        </ul>
      </Show>
      <Show when={e.video}>
        {(v) => (
          <a href={v} target="_blank" rel="noreferrer" class="text-sm font-semibold text-blue-700 hover:underline">
            Video
          </a>
        )}
      </Show>
    </div>
  );
};


const SubSectionView = (props: {
  subsection: SubSection;
  onExerciseStats: (id: string, stats: Stats) => void;
  now: () => Date;
  groupName: string;
  workoutName: string;
  generatedAt: string;
}) => {
  const [exerciseStats, setExerciseStats] = createSignal<Record<string, Stats>>({});

  const updateStats = (id: string, stats: Stats) => {
    setExerciseStats((prev) => ({ ...prev, [id]: stats }));
    props.onExerciseStats(id, stats);
  };

  const summary = createMemo(() => {
    const stats = Object.values(exerciseStats());
    return stats.reduce(
      (acc, s) => {
        acc.totalSets += s.totalSets;
        acc.doneSets += s.doneSets;
        acc.totalSeconds += s.totalSeconds;
        acc.remainingSeconds += s.remainingSeconds;
        acc.isDone = acc.isDone && s.isDone;
        return acc;
      },
      { totalSets: 0, doneSets: 0, totalSeconds: 0, remainingSeconds: 0, isDone: stats.length > 0 }
    );
  });

  const isDone = createMemo(() => summary().totalSets > 0 && summary().isDone);

  return (
    <details class={`group rounded-lg print-break-after ${isDone() ? 'section-done' : ''}`}>
      <summary class={`flex items-center gap-2 py-3 font-semibold text-slate-800 cursor-pointer ${isDone() ? 'summary-pill-done' : ''}`}>
        <h4 class="flex items-center gap-2 text-lg font-semibold text-slate-800 m-0">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">S</span>
          <span>{props.subsection.name}</span>
        </h4>
        <div class="flex flex-wrap gap-2 ml-auto summary-pills" data-cy="subsection-summary">
          <span class={`summary-pill ${isDone() ? 'summary-pill-done' : ''}`}>
            {isDone() ? 'Completed' : `Done ${summary().doneSets}/${summary().totalSets || 0}`}
          </span>
          <span class="summary-pill">Sets {summary().totalSets || 0}</span>
          <span class="summary-pill">{`${formatClock(Math.max(summary().totalSeconds - summary().remainingSeconds, 0))}/${formatClock(summary().totalSeconds)} (rem ${formatClock(summary().remainingSeconds)})`}</span>
          <span class="summary-pill">{etaLabelFromSeconds(summary().remainingSeconds, props.now())}</span>
        </div>
        <span class="text-slate-400 transition-transform group-open:-rotate-90">▸</span>
      </summary>
      <div class="pb-4 space-y-3">
        <div class="print-breadcrumb print-flex items-center justify-between text-xs text-slate-700">
          <span>{props.groupName} / {props.workoutName} / {props.subsection.name}</span>
          <span>{props.generatedAt}</span>
        </div>
        <Show when={props.subsection.focus || props.subsection.role || props.subsection.notes?.length}>
          <div class="text-sm text-slate-700 space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <Show when={props.subsection.focus}>
              {(f) => (
                <p><span class="font-semibold">Focus:</span> {f}</p>
              )}
            </Show>
            <Show when={props.subsection.role}>
              {(r) => (
                <p><span class="font-semibold">Role:</span> {r}</p>
              )}
            </Show>
            <Show when={props.subsection.notes?.length}>
              <ul class="list-disc list-inside space-y-1">
                <For each={props.subsection.notes}>{(n) => <li>{n}</li>}</For>
              </ul>
            </Show>
          </div>
        </Show>
        <div class="grid gap-8 md:grid-cols-2 gap-y-8">
          <For each={props.subsection.exercises}>
            {(exercise) => (
              <ExerciseCard
                exercise={exercise}
                now={props.now}
                onStats={(stats) => updateStats(exercise.id, stats)}
              />
            )}
          </For>
        </div>
      </div>
    </details>
  );
};

const WorkoutView = (props: { workout: Workout; now: () => Date; groupName: string; generatedAt: string }) => {
  const [exerciseStats, setExerciseStats] = createSignal<Record<string, Stats>>({});

  const updateStats = (id: string, stats: Stats) => {
    setExerciseStats((prev) => ({ ...prev, [id]: stats }));
  };

  const summary = createMemo(() => {
    const stats = Object.values(exerciseStats());
    const totals = stats.reduce(
      (acc, s) => {
        acc.totalSets += s.totalSets;
        acc.doneSets += s.doneSets;
        acc.totalSeconds += s.totalSeconds;
        acc.remainingSeconds += s.remainingSeconds;
        return acc;
      },
      { totalSets: 0, doneSets: 0, totalSeconds: 0, remainingSeconds: 0 }
    );
    return totals;
  });

  const isDone = createMemo(() => summary().totalSets > 0 && summary().doneSets === summary().totalSets);

  return (
    <details open class={`group rounded-lg ${isDone() ? 'section-done' : ''}`}>
      <summary class={`flex items-center gap-2 py-3 font-semibold text-slate-900 cursor-pointer ${isDone() ? 'summary-pill-done' : ''}`}>
        <h3 class="flex items-center gap-2 text-xl font-bold text-slate-900 m-0">
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold">W</span>
          <span>{props.workout.name}</span>
        </h3>
        <div class="flex flex-wrap gap-2 ml-auto summary-pills" data-cy="workout-summary">
          <span class="summary-pill">{isDone() ? 'Completed' : `Done ${summary().doneSets}/${summary().totalSets || 0}`}</span>
          <span class="summary-pill">Sets {summary().totalSets || 0}</span>
          <span class="summary-pill">{`${formatClock(Math.max(summary().totalSeconds - summary().remainingSeconds, 0))}/${formatClock(summary().totalSeconds)} (rem ${formatClock(summary().remainingSeconds)})`}</span>
          <span class="summary-pill">{etaLabelFromSeconds(summary().remainingSeconds, props.now())}</span>
        </div>
        <span class="text-slate-400 transition-transform group-open:-rotate-90">▸</span>
      </summary>
      <div class="pb-4 space-y-3">
        <For each={props.workout.subsections}>
          {(sub) => (
            <div class="pt-3 first:pt-0">
              <SubSectionView
                subsection={sub}
                now={props.now}
                onExerciseStats={updateStats}
                groupName={props.groupName}
                workoutName={props.workout.name}
                generatedAt={props.generatedAt}
              />
            </div>
          )}
        </For>
      </div>
    </details>
  );
};

export const WorkoutRootView = (props: { config: WorkoutConfig }) => {
  const now = useNow(1000);
  const generatedAt = new Date().toLocaleString();

  return (
    <div class="space-y-6">
      <For each={props.config.workout_groups}>
        {(group) => (
          <section class="space-y-3" aria-labelledby={`group-${group.id}`}>
            <header class="flex items-center gap-3">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">G</span>
              <div>
                <h2 id={`group-${group.id}`} class="text-2xl font-bold text-slate-900">
                  {group.name}
                </h2>
                <p class="text-xs uppercase tracking-wide text-slate-500">{group.workouts.length} workouts</p>
              </div>
            </header>
            <div class="space-y-4">
              <For each={group.workouts}>
                {(workout) => <WorkoutView workout={workout} now={now} groupName={group.name} generatedAt={generatedAt} />}
              </For>
            </div>
          </section>
        )}
      </For>
    </div>
  );
};
