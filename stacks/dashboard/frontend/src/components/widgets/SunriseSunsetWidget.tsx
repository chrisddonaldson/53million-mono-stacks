
import { Component, createSignal, onCleanup, createEffect } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import SunCalc from 'suncalc';
import { useLocation } from '../../context/LocationContext';

const SunriseSunsetWidget: Component = () => {
  const { state } = useLocation();
  const [times, setTimes] = createSignal(SunCalc.getTimes(new Date(), state().lat, state().lng));

  createEffect(() => {
    setTimes(SunCalc.getTimes(new Date(), state().lat, state().lng));
  });

  // Update daily (or reasonably often to catch date changes)
  const timer = setInterval(() => {
    setTimes(SunCalc.getTimes(new Date(), state().lat, state().lng));
  }, 60000 * 15); // Every 15 mins

  onCleanup(() => clearInterval(timer));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <WidgetContainer title="Sun Cycle">
      <div class="flex flex-col items-center justify-center h-full space-y-4">
        <div class="flex items-center justify-between w-full px-4">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="text-xs text-neutral-500 uppercase tracking-wide">Sunrise</span>
            <span class="text-xl font-medium text-white">{formatTime(times().sunrise)}</span>
          </div>
          
          <div class="h-10 w-px bg-neutral-700"></div>

          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
             {/* Using moon icon for sunset as it's night-time adjacent, or could use sunset specific icon if preferred */}
             <span class="text-xs text-neutral-500 uppercase tracking-wide">Sunset</span>
            <span class="text-xl font-medium text-white">{formatTime(times().sunset)}</span>
          </div>
        </div>
        <div class="text-xs text-neutral-600">{state().name}</div>
      </div>
    </WidgetContainer>
  );
};

export default SunriseSunsetWidget;
