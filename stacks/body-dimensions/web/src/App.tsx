import { createSignal, createResource, For, Show, createMemo } from 'solid-js';
import { DateTime } from 'luxon';
import './App.css';
import { AnatomicalSilhouette } from './components/AnatomicalSilhouette';
import { BodyMetricsChart } from './components/BodyMetricsChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

const InfoTip = (props: { text: string }) => (
  <div class="group relative inline-block ml-1">
    <div class="cursor-help text-zinc-600 hover:text-[#00d2ff] transition-colors">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl text-[10px] text-zinc-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 shadow-2xl">
      {props.text}
      <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90"></div>
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = createSignal('dashboard');
  const [measurements, setMeasurements] = createSignal<Record<string, number>>({});
  const [weight, setWeight] = createSignal<number | null>(null);
  const [bodyFat, setBodyFat] = createSignal<number | null>(null);
  const [notes, setNotes] = createSignal('');
  const [editingId, setEditingId] = createSignal<string | null>(null);

  // Projections
  const [dailyDeficit, setDailyDeficit] = createSignal(500);
  const [projectionWeeks, setProjectionWeeks] = createSignal(12);
  const [targetBodyFat, setTargetBodyFat] = createSignal(15);
  const [plannerDeficit, setPlannerDeficit] = createSignal(500);

  // Profile / Calculator State
  const [age, setAge] = createSignal(30);
  const [gender, setGender] = createSignal<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = createSignal(180);

  // Macro State
  const [activityLevel, setActivityLevel] = createSignal(1.55); // 1.2: Sedentary, 1.55: Moderate, 1.9: Extreme
  const [bodybuildingPhase, setBodybuildingPhase] = createSignal<'cut' | 'bulk' | 'maintenance'>('cut');

  // Meal Planner State
  const [wakeTime, setWakeTime] = createSignal("07:00");
  const [bedTime, setBedTime] = createSignal("23:00");
  const [workoutTime, setWorkoutTime] = createSignal("17:00");
  const [mealCount, setMealCount] = createSignal(5);

  const mealSchedule = createMemo(() => {
    const wake = DateTime.fromFormat(wakeTime(), "HH:mm");
    let bed = DateTime.fromFormat(bedTime(), "HH:mm");
    if (bed < wake) bed = bed.plus({ days: 1 });
    
    const workout = DateTime.fromFormat(workoutTime(), "HH:mm");
    const count = mealCount();
    const wakingDuration = bed.diff(wake, 'minutes').minutes;
    const interval = count > 1 ? wakingDuration / (count - 1) : 0;
    
    const meals = [];
    for (let i = 0; i < count; i++) {
      const time = wake.plus({ minutes: i * interval });
      const diffMinutes = time.diff(workout, 'minutes').minutes;
      
      let type: 'Standard' | 'Pre-Workout' | 'Post-Workout' | 'Wake' | 'Sleep' = 'Standard';
      
      if (i === 0) type = 'Wake';
      else if (i === count - 1) type = 'Sleep';
      
      // Proximity overrides
      if (diffMinutes >= -150 && diffMinutes < -30) type = 'Pre-Workout';
      if (diffMinutes >= 30 && diffMinutes <= 180) type = 'Post-Workout';

      meals.push({
        idx: i + 1,
        time,
        type,
        diffMinutes
      });
    }
    return meals;
  });



  // Fetch latest entry
  const [latestData, { refetch: refetchLatest }] = createResource(async () => {
    const res = await fetch(`${API_URL}/entries/latest`);
    if (!res.ok) return null;
    return res.json();
  });

  // Fetch history
  const [history, { refetch: refetchHistory }] = createResource(async () => {
    const res = await fetch(`${API_URL}/entries?limit=30`);
    return res.json();
  });

  const goalResult = createMemo(() => {
    const latest = latestData()?.entry;
    if (!latest || !latest.weightKg || !latest.bodyFatPercent) return null;

    const currentWeight = latest.weightKg;
    const currentBF = latest.bodyFatPercent;
    const targetBF = targetBodyFat();
    const deficit = plannerDeficit();

    if (deficit <= 0) return null;

    // Lean mass preservation model
    const leanMass = currentWeight * (1 - (currentBF / 100));
    const targetWeight = leanMass / (1 - (targetBF / 100));
    const weightToLose = currentWeight - targetWeight;
    
    if (weightToLose <= 0) return { targetWeight, weightToLose: 0, days: 0, date: DateTime.now() };

    const days = (weightToLose * 7700) / deficit;
    const targetDate = DateTime.now().plus({ days: Math.ceil(days) });

    return {
      targetWeight,
      weightToLose,
      days: Math.ceil(days),
      date: targetDate
    };
  });

  const handleUpdate = (id: string, val: number) => {
    setMeasurements({ ...measurements(), [id]: val });
  };

  const getProjectionData = () => {
    const latest = latestData()?.entry;
    if (!latest || !latest.weightKg) return [];

    const weightProj = [];
    const kgPerKcal = 1 / 7700;
    const kgLossPerDay = dailyDeficit() * kgPerKcal;
    
    // Start from today
    const start = DateTime.now();
    for (let i = 0; i <= projectionWeeks() * 7; i++) {
        const d = start.plus({ days: i });
        weightProj.push({
            date: d.toJSDate(),
            value: latest.weightKg - (i * kgLossPerDay)
        });
    }
    return weightProj;
  };

  const submitEntry = async () => {
    const skinfolds = Object.entries(measurements())
      .filter(([id]) => id.includes('fold'))
      .map(([id, mm]) => ({ site: id.replace('_fold', ''), mm }));
    
    const circumferences = Object.entries(measurements())
      .filter(([id]) => !id.includes('fold'))
      .map(([id, cm]) => ({ site: id, cm }));

    const payload = {
      weightKg: weight(),
      bodyFatPercent: bodyFat(),
      notes: notes(),
      skinfolds,
      circumferences,
      measuredAt: new Date().toISOString()
    };

    const res = await fetch(editingId() ? `${API_URL}/entries/${editingId()}` : `${API_URL}/entries`, {
      method: editingId() ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setMeasurements({});
      setWeight(null);
      setBodyFat(null);
      setNotes('');
      setEditingId(null);
      setActiveTab('dashboard');
      refetchLatest();
      refetchHistory();
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    const res = await fetch(`${API_URL}/entries/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      refetchLatest();
      refetchHistory();
    }
  };

  const startEdit = (row: any) => {
    setEditingId(row._id);
    setWeight(row.weightKg);
    setBodyFat(row.bodyFatPercent);
    setNotes(row.notes || '');
    
    const m: Record<string, number> = {};
    row.circumferences?.forEach((c: any) => m[c.site] = c.cm);
    row.skinfolds?.forEach((s: any) => m[`${s.site}_fold`] = s.mm);
    setMeasurements(m);
    
    setActiveTab('log');
  };

  return (
    <div class="layout min-h-screen bg-[#0a0a0c] text-white">
      <header class="navbar sticky top-0 z-50 px-8 py-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <h1 class="text-2xl font-bold tracking-tight">
          <span class="text-[#00d2ff]">Body</span>Dimensions
        </h1>
        
        <nav class="flex items-center gap-2">
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'dashboard' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </div>
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'log' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('log')}
          >
            Log Entry
          </div>
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'history' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </div>
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'calculator' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('calculator')}
          >
            Calculator
          </div>
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'macros' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('macros')}
          >
            Macros
          </div>
          <div 
            class={`nav-item px-4 py-2 rounded-lg cursor-pointer transition-all ${activeTab() === 'projections' ? 'active bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setActiveTab('projections')}
          >
            Goal Planner
          </div>
        </nav>

        <div class="glass px-4 py-1.5 flex items-center gap-2 text-xs font-medium">
          <div class="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></div>
          <span class="text-zinc-300">System Online</span>
        </div>
      </header>

      <main class="content p-8 max-w-7xl mx-auto w-full">
        <Show when={activeTab() === 'dashboard'}>
          <div class="glass p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 mb-10 overflow-hidden">
            <div class="flex-1">
              <span class="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Latest Weight</span>
              <div class="text-5xl font-black font-mono flex items-baseline gap-2">
                {latestData()?.entry?.weightKg?.toFixed(2) || '--'} 
                <span class="text-base font-normal text-zinc-600 font-sans">KG</span>
              </div>
              <div class="text-[#3aedc8] text-xs font-bold mt-2 flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-[#3aedc8]"></div>
                STABILIZING TREND
              </div>
            </div>

            <div class="hidden md:block w-px self-stretch bg-white/5 mx-4"></div>

            <div class="flex-1">
              <span class="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Body Fat</span>
              <div class="text-5xl font-black font-mono flex items-baseline gap-2">
                {latestData()?.entry?.bodyFatPercent?.toFixed(2) || '--'} 
                <span class="text-base font-normal text-zinc-600 font-sans">%</span>
              </div>
              <div class="text-zinc-500 text-xs font-bold mt-2">
                VIA {latestData()?.entry?.skinfolds?.length || 0} POINT ANALYSIS
              </div>
            </div>

            <div class="hidden md:block w-px self-stretch bg-white/5 mx-4"></div>

            <div class="flex-1">
              <span class="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold block mb-2">Last Session</span>
              <div class="text-2xl font-bold mt-2">
                {latestData()?.entry?.measuredAt ? DateTime.fromISO(latestData().entry.measuredAt).toLocaleString(DateTime.DATE_MED) : '---'}
              </div>
              <div class="text-zinc-500 text-xs mt-2 italic truncate max-w-xs">
                "{latestData()?.entry?.notes || 'No session notes recorded'}"
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            <div class="lg:col-span-2">
              <Show when={history() && history().length > 0} fallback={
                <div class="glass p-10 h-[400px] flex flex-col items-center justify-center text-center">
                  <h3 class="text-xl font-bold mb-2 text-zinc-200">No Data Available</h3>
                  <p class="text-zinc-400 max-w-md">Start logging sessions to see your body dimension trends.</p>
                </div>
              }>
                <BodyMetricsChart 
                  data={history()} 
                  title="Weight Trend & Goal Projection (kg)" 
                  color="#00d2ff" 
                  projection={getProjectionData()}
                />
              </Show>
            </div>

            <div class="glass p-6 flex flex-col gap-6">
              <div class="flex items-center gap-2 mb-2">
                <div class="p-2 rounded-lg bg-[#00d2ff]/10">
                  <svg class="w-5 h-5 text-[#00d2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-white uppercase tracking-wider">Goal Projections</h3>
              </div>

              <div class="space-y-4">
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="text-[10px] text-zinc-500 font-bold uppercase">Daily Calorie Deficit</label>
                    <span class="text-xs font-mono text-[#00d2ff]">{dailyDeficit()} kcal</span>
                  </div>
                  <input 
                    type="range" min="0" max="1500" step="50" 
                    value={dailyDeficit()} 
                    onInput={e => setDailyDeficit(parseInt(e.currentTarget.value))}
                    class="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00d2ff]"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="text-[10px] text-zinc-500 font-bold uppercase">Timeline</label>
                    <span class="text-xs font-mono text-zinc-300">{projectionWeeks()} Weeks</span>
                  </div>
                  <input 
                    type="range" min="4" max="26" step="1" 
                    value={projectionWeeks()} 
                    onInput={e => setProjectionWeeks(parseInt(e.currentTarget.value))}
                    class="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                  />
                </div>
              </div>

              <div class="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-zinc-500 font-medium">Projected Loss/Week</span>
                  <span class="text-sm font-mono font-bold text-[#3aedc8]">{((dailyDeficit() * 7) / 7700).toFixed(2)}kg</span>
                </div>
                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div class="text-[10px] text-zinc-500 font-bold uppercase mb-1">Target Weight</div>
                  <div class="text-2xl font-black font-mono">
                    {getProjectionData().length > 0 ? getProjectionData()[getProjectionData().length-1].value.toFixed(2) : '--'}
                    <span class="text-xs font-normal text-zinc-600 ml-1">KG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'log'}>
          <div class="flex flex-col lg:flex-row gap-8">
            <div class="w-full lg:w-[500px] flex-shrink-0">
               <AnatomicalSilhouette values={measurements()} onUpdate={handleUpdate} />
            </div>
            
            <div class="flex-1 flex flex-col gap-6">
              <div class="glass p-8 flex flex-col gap-6">
                <h3 class="text-xl font-bold text-[#00d2ff]">
                  {editingId() ? 'Update Measurement Session' : 'Core Metrics'}
                  {editingId() && (
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setWeight(null);
                        setBodyFat(null);
                        setNotes('');
                        setMeasurements({});
                      }}
                      class="ml-4 text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded hover:bg-red-500/30 transition-all uppercase font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={weight() || ''} 
                      onInput={e => setWeight(parseFloat(e.currentTarget.value))}
                      class="form-input w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-bold font-mono focus:border-[#00d2ff] outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Body Fat %</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={bodyFat() || ''} 
                      onInput={e => setBodyFat(parseFloat(e.currentTarget.value))}
                      class="form-input w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xl font-bold font-mono focus:border-[#00d2ff] outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Notes</label>
                  <input 
                    type="text" 
                    value={notes()} 
                    onInput={e => setNotes(e.currentTarget.value)} 
                    class="form-input w-full bg-black/40 border border-white/10 rounded-xl p-4 text-lg focus:border-[#00d2ff] outline-none transition-all"
                    placeholder="e.g. Morning fasted, post-workout" 
                  />
                </div>
              </div>

              <button class="btn-primary w-full py-5 text-lg rounded-2xl group relative overflow-hidden" onClick={submitEntry}>
                <span class="relative z-10 flex items-center justify-center gap-2">
                  {editingId() ? 'Update Entry' : 'Log Measurement Session'}
                </span>
                <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'history'}>
          <div class="glass overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-white/10 bg-white/5">
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Weight</th>
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Body Fat</th>
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Metrics</th>
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Notes</th>
                    <th class="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <For each={history()}>
                    {(row) => (
                      <tr class="hover:bg-white/[0.02] transition-colors">
                        <td class="p-4 font-medium">{DateTime.fromISO(row.measuredAt).toLocaleString(DateTime.DATE_SHORT)}</td>
                        <td class="p-4 font-bold text-[#3aedc8] font-mono">{row.weightKg?.toFixed(2)} <span class="text-[10px] text-zinc-500 font-sans">kg</span></td>
                        <td class="p-4 font-bold text-[#00d2ff] font-mono">{row.bodyFatPercent?.toFixed(2) || '--'} <span class="text-[10px] text-zinc-500 font-sans">%</span></td>
                        <td class="p-4">
                          <div class="flex gap-2">
                            <span class="px-2 py-0.5 rounded-full bg-[#00d2ff]/10 text-[#00d2ff] text-[10px] font-bold font-mono">
                              {row.circumferences?.length || 0} SITES
                            </span>
                            <span class="px-2 py-0.5 rounded-full bg-[#3aedc8]/10 text-[#3aedc8] text-[10px] font-bold font-mono">
                              {row.skinfolds?.length || 0} FOLDS
                            </span>
                          </div>
                        </td>
                        <td class="p-4 text-sm text-zinc-400 italic">"{row.notes || '---'}"</td>
                        <td class="p-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => startEdit(row)}
                              class="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 transition-all"
                              title="Edit Entry"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => deleteEntry(row._id)}
                              class="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Delete Entry"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'calculator'}>
          <div class="max-w-6xl mx-auto space-y-8">
            <div class="header-section mb-10">
              <h2 class="text-3xl font-black text-white mb-2">BF% <span class="text-[#00d2ff]">Multi-Formula</span> Analyzer</h2>
              <p class="text-zinc-500">Calculate your body fat percentage using standard clinical formulas.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="glass p-6 space-y-6">
                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-4">Personal Metrics</h3>
                
                <div class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] text-zinc-500 font-bold uppercase flex items-center">
                      Gender
                      <InfoTip text="Biological gender is required to select the correct body density regression equations." />
                    </label>
                    <div class="flex bg-white/5 p-1 rounded-xl">
                      <button 
                        class={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${gender() === 'male' ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                        onClick={() => setGender('male')}
                      >MALE</button>
                      <button 
                        class={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${gender() === 'female' ? 'bg-[#ff52af] text-black shadow-[0_0_15px_rgba(255,82,175,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                        onClick={() => setGender('female')}
                      >FEMALE</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase flex items-center">
                        Age
                        <InfoTip text="Age is a key variable in the Jackson-Pollock formula to account for changes in body density over time." />
                      </label>
                      <input type="number" value={age()} onInput={e => setAge(parseInt(e.currentTarget.value))} class="bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono focus:border-[#00d2ff] outline-none" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase flex items-center">
                        Height (cm)
                        <InfoTip text="Height is required for the U.S. Navy circumference-based calculation." />
                      </label>
                      <input type="number" value={heightCm()} onInput={e => setHeightCm(parseInt(e.currentTarget.value))} class="bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono focus:border-[#00d2ff] outline-none" />
                    </div>
                  </div>
                </div>

                <div class="mt-8">
                  <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Quick Measurements</h3>
                  <div class="space-y-4">
                    <Show when={gender() === 'male'}>
                      {[
                        { id: 'chest_fold', tip: 'Diagonal fold midway between the anterior axillary line and the nipple.' },
                        { id: 'abdomen_fold', tip: 'Vertical fold 2cm to the right of the umbilicus.' },
                        { id: 'thigh_fold', tip: 'Vertical fold on the anterior midline of the thigh.' }
                      ].map(item => (
                        <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#00d2ff]/30 transition-all">
                          <span class="text-xs text-zinc-400 uppercase tracking-tighter flex items-center">
                            {item.id.replace('_fold', '')}
                            <InfoTip text={item.tip} />
                          </span>
                          <div class="flex items-center gap-2">
                             <input type="number" step="any" value={measurements()[item.id] || ''} onInput={e => setMeasurements({...measurements(), [item.id]: parseFloat(e.currentTarget.value)})} class="w-16 bg-transparent text-right font-mono font-bold text-[#00d2ff] focus:outline-none" placeholder="0.0" />
                             <span class="text-[8px] text-zinc-600 font-bold">MM</span>
                          </div>
                        </div>
                      ))}
                    </Show>
                    <Show when={gender() === 'female'}>
                      {[
                        { id: 'triceps_fold', tip: 'Vertical fold on the posterior midline of the upper arm, midway between shoulder and elbow.' },
                        { id: 'suprailiac_fold', tip: 'Diagonal fold in line with the natural angle of the iliac crest.' },
                        { id: 'thigh_fold', tip: 'Vertical fold on the anterior midline of the thigh.' }
                      ].map(item => (
                        <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#ff52af]/30 transition-all">
                          <span class="text-xs text-zinc-400 uppercase tracking-tighter flex items-center">
                            {item.id.replace('_fold', '')}
                            <InfoTip text={item.tip} />
                          </span>
                          <div class="flex items-center gap-2">
                             <input type="number" step="any" value={measurements()[item.id] || ''} onInput={e => setMeasurements({...measurements(), [item.id]: parseFloat(e.currentTarget.value)})} class="w-16 bg-transparent text-right font-mono font-bold text-[#ff52af] focus:outline-none" placeholder="0.0" />
                             <span class="text-[8px] text-zinc-600 font-bold">MM</span>
                          </div>
                        </div>
                      ))}
                    </Show>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-2 space-y-6">
                 {/* Jackson-Pollock 3-Site Card */}
                 <div class="glass p-8 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
                    </div>
                    
                    <div class="flex justify-between items-start mb-6">
                      <div>
                        <h4 class="text-lg font-bold text-white">Jackson-Pollock 3-Site</h4>
                        <p class="text-xs text-zinc-500 font-medium">Standard clinical skinfold method</p>
                      </div>
                      <div class="text-right">
                        <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Estimated BF%</span>
                        <div class="text-4xl font-black font-mono text-[#3aedc8]">
                          {(() => {
                            const m = measurements();
                            const sum = gender() === 'male' ? (m.chest_fold || 0) + (m.abdomen_fold || 0) + (m.thigh_fold || 0) : (m.triceps_fold || 0) + (m.suprailiac_fold || 0) + (m.thigh_fold || 0);
                            if (sum === 0) return '--';
                            
                            let bd = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age());
                            if (gender() === 'female') {
                                bd = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age());
                            }
                            const bf = (495 / bd) - 450;
                            return bf.toFixed(2) + '%';
                          })()}
                        </div>
                      </div>
                    </div>
                 </div>

                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Navy Method */}
                    <div class="glass p-6">
                       <h4 class="text-sm font-bold text-white mb-1">U.S. Navy Method</h4>
                       <p class="text-[10px] text-zinc-500 mb-6 font-medium">Circumference-based analysis</p>
                       
                       <div class="space-y-4 mb-6">
                          {[
                            { id: 'waist', tip: 'Measure at the narrowest point of the torso, typically just above the navel.' },
                            { id: 'neck', tip: 'Measure just below the larynx (Adam\'s apple), keeping the tape horizontal.' }
                          ].map(item => (
                            <div class="flex justify-between items-center text-xs">
                              <span class="text-zinc-400 capitalize flex items-center">
                                {item.id}
                                <InfoTip text={item.tip} />
                              </span>
                              <div class="flex items-center gap-2 border-b border-white/10 pb-1">
                                <input type="number" step="any" value={measurements()[item.id] || ''} onInput={e => setMeasurements({...measurements(), [item.id]: parseFloat(e.currentTarget.value)})} class="w-12 bg-transparent text-right font-mono font-bold text-white focus:outline-none" placeholder="0.0" />
                                <span class="text-[8px] text-zinc-600 font-bold">CM</span>
                              </div>
                            </div>
                          ))}
                          <Show when={gender() === 'female'}>
                            <div class="flex justify-between items-center text-xs">
                              <span class="text-zinc-400 capitalize flex items-center">
                                hips
                                <InfoTip text="Measure at the widest part of the buttocks/hips. Required for the female Navy formula." />
                              </span>
                              <div class="flex items-center gap-2 border-b border-white/10 pb-1">
                                <input type="number" step="any" value={measurements()['hips'] || ''} onInput={e => setMeasurements({...measurements(), ['hips']: parseFloat(e.currentTarget.value)})} class="w-12 bg-transparent text-right font-mono font-bold text-white focus:outline-none" placeholder="0.0" />
                                <span class="text-[8px] text-zinc-600 font-bold">CM</span>
                              </div>
                            </div>
                          </Show>
                       </div>

                       <div class="text-2xl font-black font-mono text-[#00d2ff]">
                          {(() => {
                             const m = measurements();
                             const w = m.waist || 0;
                             const n = m.neck || 0;
                             const hip = m.hips || 0;
                             const h = heightCm();
                             
                             if (gender() === 'male') {
                                if (!w || !n || !h) return '--';
                                const bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
                                return bf.toFixed(2) + '%';
                             } else {
                                if (!w || !n || !h || !hip) return '--';
                                const bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.22100 * Math.log10(h)) - 450;
                                return bf.toFixed(2) + '%';
                             }
                          })()}
                       </div>
                    </div>

                    {/* Weight Sync Card */}
                    <div class="glass p-6 flex flex-col justify-between border-dashed border-[#3aedc8]/20 bg-[#3aedc8]/[0.02]">
                       <div>
                         <h4 class="text-sm font-bold text-[#3aedc8] mb-1">Set Result as Active</h4>
                         <p class="text-[10px] text-zinc-500 leading-tight">Apply the calculated body fat to your current log session.</p>
                       </div>
                       <button 
                         class="w-full py-3 rounded-xl bg-[#3aedc8] text-black font-black text-xs mt-4 shadow-[0_4px_20px_rgba(58,237,200,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                         onClick={() => {
                            const m = measurements();
                            const sum = gender() === 'male' ? (m.chest_fold || 0) + (m.abdomen_fold || 0) + (m.thigh_fold || 0) : (m.triceps_fold || 0) + (m.suprailiac_fold || 0) + (m.thigh_fold || 0);
                            if (sum > 0) {
                               let bd = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age());
                               if (gender() === 'female') bd = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age());
                               const bf = (495 / bd) - 450;
                               setBodyFat(parseFloat(bf.toFixed(2)));
                               setActiveTab('log');
                            }
                         }}
                       >APPLY TO LOG</button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'macros'}>
          <div class="max-w-6xl mx-auto space-y-8">
            <div class="header-section mb-10">
              <h2 class="text-3xl font-black text-white mb-2">Macro <span class="text-[#3aedc8]">Blueprint</span> Builder</h2>
              <p class="text-zinc-500">Calculate precision bodybuilding macros based on your lean mass and training intensity.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="glass p-6 space-y-6">
                 <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-4">Activity & Phase</h3>
                 
                 <div class="space-y-6">
                    <div class="space-y-3">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase flex items-center">
                        Training Intensity
                        <InfoTip text="Moderate: 3-5 days/week. Extreme: High-intensity bodybuilding 6-7 days/week." />
                      </label>
                      <select 
                        value={activityLevel()} 
                        onInput={e => setActivityLevel(parseFloat(e.currentTarget.value))}
                        class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-[#3aedc8] outline-none transition-all text-white"
                      >
                        <option value="1.2">Sedentary (Office job)</option>
                        <option value="1.375">Lightly Active (1-3 days/week)</option>
                        <option value="1.55">Moderately Active (3-5 days/week)</option>
                        <option value="1.725">Very Active (Hard training 6-7 days/week)</option>
                        <option value="1.9">Extreme Athlete (Pro Bodybuilder/Athlete)</option>
                      </select>
                    </div>

                    <div class="space-y-3">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase">Current Phase</label>
                      <div class="grid grid-cols-3 gap-2">
                        {['cut', 'maintenance', 'bulk'].map(p => (
                          <button 
                            class={`py-2 rounded-lg text-[10px] font-bold transition-all ${bodybuildingPhase() === p ? 'bg-[#3aedc8] text-black shadow-[0_0_15px_rgba(58,237,200,0.4)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                            onClick={() => setBodybuildingPhase(p as any)}
                          >
                            {p.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>

                  <div class="p-4 rounded-xl bg-[#3aedc8]/5 border border-[#3aedc8]/10 mt-auto">
                    <h4 class="text-[10px] font-bold text-[#3aedc8] uppercase mb-1">Bodybuilder Model</h4>
                    <p class="text-[10px] text-zinc-500 italic">High protein (2.5g/kg LBM) to preserve muscle tissue during deficit.</p>
                 </div>

                 <div class="space-y-4 pt-4 border-t border-white/5">
                    <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Meal Timing</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-600 font-bold uppercase">Wake Up</label>
                        <input type="time" value={wakeTime()} onInput={e => setWakeTime(e.currentTarget.value)} class="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-600 font-bold uppercase">Bed Time</label>
                        <input type="time" value={bedTime()} onInput={e => setBedTime(e.currentTarget.value)} class="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-[10px] text-zinc-600 font-bold uppercase">Workout Time</label>
                      <input type="time" value={workoutTime()} onInput={e => setWorkoutTime(e.currentTarget.value)} class="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <label class="text-[10px] text-zinc-600 font-bold uppercase">Meals Per Day</label>
                      <input type="number" min="2" max="8" value={mealCount()} onInput={e => setMealCount(parseInt(e.currentTarget.value))} class="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                 </div>
              </div>

              <div class="lg:col-span-2 space-y-6">
                {(() => {
                  const entry = latestData()?.entry;
                  if (!entry || !entry.weightKg || !entry.bodyFatPercent) {
                    return (
                      <div class="glass p-12 flex flex-col items-center justify-center text-center">
                        <svg class="w-12 h-12 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <p class="text-zinc-500 italic">Log your latest weight and body fat to generate macros.</p>
                      </div>
                    );
                  }

                  const lbm = entry.weightKg * (1 - (entry.bodyFatPercent / 100));
                  const bmr = 370 + (21.6 * lbm); // Katch-McArdle
                  const tdee = bmr * activityLevel();
                  
                  let goalKcal = tdee;
                  if (bodybuildingPhase() === 'cut') goalKcal -= 500;
                  if (bodybuildingPhase() === 'bulk') goalKcal += 300;

                  // Bodybuilder Macro Strategy:
                  // Protein: 2.5g per kg of LBM
                  // Fat: 0.8g per kg of total bodyweight (hormonal floor)
                  // Carbs: Remainder
                  const protG = lbm * 2.5;
                  const fatG = entry.weightKg * 0.8;
                  const carbG = (goalKcal - (protG * 4) - (fatG * 9)) / 4;

                  return (
                    <>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass p-8 relative overflow-hidden">
                           <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Target Daily Energy</div>
                           <div class="text-5xl font-black font-mono text-white mb-2">
                             {Math.round(goalKcal)}
                             <span class="text-sm font-normal text-zinc-600 ml-2">KCAL</span>
                           </div>
                           <div class="text-[#3aedc8] text-xs font-bold tracking-tighter">
                             {bodybuildingPhase() === 'cut' ? `-${Math.round(tdee - goalKcal)}` : bodybuildingPhase() === 'bulk' ? `+${Math.round(goalKcal - tdee)}` : 'MAINTENANCE'} 
                             FROM TDEE ({Math.round(tdee)})
                           </div>
                        </div>

                        <div class="glass p-8">
                           <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Metabolic Info</div>
                           <div class="space-y-4">
                              <div class="flex justify-between items-center text-sm">
                                <span class="text-zinc-400">Lean Mass</span>
                                <span class="font-bold font-mono">{lbm.toFixed(1)} <span class="text-[8px]">KG</span></span>
                              </div>
                              <div class="flex justify-between items-center text-sm">
                                <span class="text-zinc-400">BMR (Katch-McArdle)</span>
                                <span class="font-bold font-mono">{Math.round(bmr)} <span class="text-[8px]">KCAL</span></span>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="glass p-6 text-center border-b-4 border-[#ff3d71]">
                           <div class="text-[10px] text-[#ff3d71] font-bold uppercase mb-2">Protein</div>
                           <div class="text-4xl font-black font-mono text-white mb-1">{Math.round(protG)}<span class="text-xs">G</span></div>
                           <div class="text-zinc-600 text-[10px] font-bold">~{Math.round((protG * 4 / goalKcal) * 100)}%</div>
                        </div>
                        <div class="glass p-6 text-center border-b-4 border-[#00d2ff]">
                           <div class="text-[10px] text-[#00d2ff] font-bold uppercase mb-2">Carbs</div>
                           <div class="text-4xl font-black font-mono text-white mb-1">{Math.round(carbG)}<span class="text-xs">G</span></div>
                           <div class="text-zinc-600 text-[10px] font-bold">~{Math.round((carbG * 4 / goalKcal) * 100)}%</div>
                        </div>
                        <div class="glass p-6 text-center border-b-4 border-[#ffaa00]">
                           <div class="text-[10px] text-[#ffaa00] font-bold uppercase mb-2">Fats</div>
                           <div class="text-4xl font-black font-mono text-white mb-1">{Math.round(fatG)}<span class="text-xs">G</span></div>
                           <div class="text-zinc-600 text-[10px] font-bold">~{Math.round((fatG * 9 / goalKcal) * 100)}%</div>
                        </div>
                      </div>

                      {/* Meal Schedule & Graph */}
                      <div class="glass p-8 space-y-8">
                        <div class="flex justify-between items-end">
                           <div>
                             <h4 class="text-sm font-bold text-white uppercase tracking-widest mb-1">Meal Sequence Graph</h4>
                             <p class="text-[10px] text-zinc-500 font-medium italic">Temporal distribution of nourishment relative to training stimulus.</p>
                           </div>
                        </div>

                        {/* Horizontal Time Graph */}
                        <div class="relative h-24 bg-white/5 rounded-2xl border border-white/5 mt-4 flex items-center overflow-hidden">
                          {/* Time scale 0-24h background */}
                          <div class="absolute inset-0 flex justify-between px-4 opacity-10">
                             {[...Array(7).keys()].map(_ => <div class="w-px h-full bg-white"></div>)}
                          </div>
                          
                          {(() => {
                            const wake = DateTime.fromFormat(wakeTime(), "HH:mm");
                            let bed = DateTime.fromFormat(bedTime(), "HH:mm");
                            if (bed < wake) bed = bed.plus({ days: 1 });
                            const duration = bed.diff(wake, 'minutes').minutes;
                            
                            const getPos = (timeStr: string) => {
                               let t = DateTime.fromFormat(timeStr, "HH:mm");
                               if (t < wake) t = t.plus({ days: 1 });
                               const diff = t.diff(wake, 'minutes').minutes;
                               return (diff / duration) * 100;
                            };

                            const workoutPos = getPos(workoutTime());

                            return (
                              <div class="absolute inset-x-8 inset-y-0">
                                {/* Waking Span */}
                                <div class="absolute inset-y-8 left-0 right-0 bg-[#3aedc8]/10 rounded-full border border-[#3aedc8]/20"></div>
                                
                                {/* Workout Zone */}
                                <div 
                                  class="absolute top-4 bottom-4 w-12 -ml-6 bg-[#ff3d71]/20 border border-[#ff3d71]/40 rounded-xl flex items-center justify-center transition-all animate-pulse"
                                  style={{ left: `${workoutPos}%` }}
                                >
                                   <svg class="w-4 h-4 text-[#ff3d71]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </div>

                                {/* Meals */}
                                <For each={mealSchedule()}>
                                  {(meal) => {
                                     const pos = getPos(meal.time.toFormat("HH:mm"));
                                     return (
                                       <div 
                                         class={`absolute top-1/2 -translate-y-1/2 w-4 h-4 -ml-2 rounded-full border-2 transition-all hover:scale-150 cursor-pointer ${meal.type === 'Pre-Workout' || meal.type === 'Post-Workout' ? 'bg-[#3aedc8] border-white' : 'bg-white/20 border-white/40'}`}
                                         style={{ left: `${pos}%` }}
                                       >
                                          <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-zinc-500 uppercase">
                                            {meal.time.toFormat("HH:mm")}
                                          </div>
                                       </div>
                                     );
                                  }}
                                </For>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Breakdown Table */}
                        <div class="overflow-hidden rounded-xl border border-white/5">
                          <table class="w-full text-left text-[10px]">
                            <thead>
                              <tr class="bg-white/5 text-zinc-400 font-bold uppercase tracking-widest border-b border-white/5">
                                <th class="p-4">Meal</th>
                                <th class="p-4">Time</th>
                                <th class="p-4">Type</th>
                                <th class="p-4">Strategy</th>
                                <th class="p-4 text-right">Target Goals</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                              <For each={mealSchedule()}>
                                {(meal) => (
                                  <tr class={`transition-colors ${meal.type === 'Pre-Workout' || meal.type === 'Post-Workout' ? 'bg-[#3aedc8]/5' : ''}`}>
                                    <td class="p-4 font-black text-zinc-300">#{meal.idx}</td>
                                    <td class="p-4 font-mono text-zinc-400">{meal.time.toFormat("hh:mm a")}</td>
                                    <td class="p-4">
                                      <span class={`px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                                        meal.type === 'Pre-Workout' ? 'bg-orange-500/20 text-orange-500' :
                                        meal.type === 'Post-Workout' ? 'bg-[#3aedc8]/20 text-[#3aedc8]' :
                                        'bg-white/5 text-zinc-500'
                                      }`}>
                                        {meal.type}
                                      </span>
                                    </td>
                                    <td class="p-4 text-zinc-500 italic">
                                      {meal.type === 'Wake' && "Metabolic prime. High protein, moderate fat."}
                                      {meal.type === 'Pre-Workout' && "Complex carbs for glycogen. Low fat for digestion."}
                                      {meal.type === 'Post-Workout' && "Anabolic window. Simple carbs + fast protein."}
                                      {meal.type === 'Sleep' && "Slow-release protein for overnight recovery."}
                                      {meal.type === 'Standard' && "Steady-state steady nutrition."}
                                    </td>
                                    <td class="p-4 text-right">
                                       <div class="flex flex-col gap-1 items-end">
                                          <div class="flex gap-2">
                                             <span class="text-zinc-600 uppercase font-black">P:</span>
                                             <span class="text-white font-mono">{(protG / mealCount()).toFixed(0)}g</span>
                                          </div>
                                          <div class="flex gap-2">
                                             {meal.type === 'Post-Workout' || meal.type === 'Pre-Workout' ? (
                                               <span class="text-[#3aedc8] animate-pulse">OPTIMIZED CARB LOAD</span>
                                             ) : (
                                               <>
                                                 <span class="text-zinc-600 uppercase font-black">C:</span>
                                                 <span class="text-white font-mono">{(carbG / mealCount()).toFixed(0)}g</span>
                                               </>
                                             )}
                                          </div>
                                       </div>
                                    </td>
                                  </tr>
                                )}
                              </For>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Show>

        <Show when={activeTab() === 'projections'}>


          <div class="max-w-4xl mx-auto space-y-10">
            <div class="text-center space-y-4">
              <h2 class="text-4xl font-black text-white">Project Your <span class="text-[#00d2ff]">Peak Physique</span></h2>
              <p class="text-zinc-500 max-w-xl mx-auto">Calculate precisely when you'll hit your target body fat percentage based on lean mass preservation and caloric deficit.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="glass p-8 space-y-8">
                <div class="space-y-6">
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Target Body Fat</label>
                      <span class="text-2xl font-black font-mono text-[#00d2ff]">{targetBodyFat()}%</span>
                    </div>
                    <input 
                      type="range" min="5" max="30" step="0.5" 
                      value={targetBodyFat()} 
                      onInput={e => setTargetBodyFat(parseFloat(e.currentTarget.value))}
                      class="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00d2ff]"
                    />
                  </div>

                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Daily Calorie Deficit</label>
                      <span class="text-2xl font-black font-mono text-[#3aedc8]">{plannerDeficit()} <span class="text-xs">kcal</span></span>
                    </div>
                    <input 
                      type="range" min="100" max="1500" step="50" 
                      value={plannerDeficit()} 
                      onInput={e => setPlannerDeficit(parseInt(e.currentTarget.value))}
                      class="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#3aedc8]"
                    />
                  </div>
                </div>

                <div class="p-6 rounded-2xl bg-[#00d2ff]/5 border border-[#00d2ff]/10 space-y-4">
                  <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <svg class="w-4 h-4 text-[#00d2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Calculation Logic
                  </h4>
                  <p class="text-xs text-zinc-500 leading-relaxed italic">
                    Assumes 100% lean mass preservation. 1kg of fat loss requires a cumulative ~7,700 kcal deficit.
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <Show when={goalResult()} fallback={
                  <div class="glass p-12 flex flex-col items-center justify-center text-center">
                    <p class="text-zinc-500 italic">Log your latest weight and body fat to see projections.</p>
                  </div>
                }>
                    <>
                      <div class="glass p-8 border-b-4 border-[#00d2ff]/30">
                        <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] block mb-2">Target Date</span>
                        <div class="text-5xl font-black text-white mb-2 font-mono">
                          {goalResult()?.date.toLocaleString(DateTime.DATE_MED)}
                        </div>
                        <div class="text-[#00e676] text-xs font-bold font-mono tracking-widest uppercase">
                          IN {goalResult()?.days} DAYS
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div class="glass p-6">
                          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Target Weight</span>
                          <div class="text-3xl font-black font-mono">
                            {goalResult()?.targetWeight.toFixed(2)}<span class="text-xs text-zinc-600 ml-1">KG</span>
                          </div>
                        </div>
                        <div class="glass p-6">
                          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Weight To Lose</span>
                          <div class="text-3xl font-black font-mono text-[#ff5252]">
                            {goalResult()?.weightToLose.toFixed(2)}<span class="text-xs text-zinc-600 ml-1">KG</span>
                          </div>
                        </div>
                      </div>

                      <div class="glass p-6 flex items-center justify-between">
                        <span class="text-xs text-zinc-400 font-medium">Weekly Progress</span>
                        <div class="text-lg font-black font-mono text-[#3aedc8]">
                          -{((plannerDeficit() * 7) / 7700).toFixed(2)} <span class="text-xs opacity-50">KG/WK</span>
                        </div>
                      </div>
                    </>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </main>
    </div>
  );
}

export default App;
