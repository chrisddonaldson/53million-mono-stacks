import { createSignal, onCleanup, Component } from 'solid-js';

const App: Component = () => {
  const [time, setTime] = createSignal(new Date());

  const timer = setInterval(() => setTime(new Date()), 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <div class="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <header class="mb-8">
        <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Personal Dashboard
        </h1>
      </header>
      
      <main class="w-full max-w-md p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
        <div class="text-center">
          <h2 class="text-lg text-slate-400 uppercase tracking-wider mb-2">Current Time</h2>
          <div class="text-6xl font-mono font-light tracking-tight tabular-nums" aria-label="Current time">
            {time().toLocaleTimeString([], { hour12: false })}
          </div>
          <div class="mt-2 text-slate-500">
            {time().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
