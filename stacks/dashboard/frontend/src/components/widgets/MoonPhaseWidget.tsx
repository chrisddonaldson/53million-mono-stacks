
import { Component, createSignal, onCleanup } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import SunCalc from 'suncalc';

const MoonPhaseWidget: Component = () => {
  const [moonData, setMoonData] = createSignal(SunCalc.getMoonIllumination(new Date()));

  // Update infrequently
  const timer = setInterval(() => {
    setMoonData(SunCalc.getMoonIllumination(new Date()));
  }, 60000 * 60); // Hourly

  onCleanup(() => clearInterval(timer));

  const getPhaseName = (phase: number) => {
    if (phase === 0 || phase === 1) return 'New Moon';
    if (phase < 0.25) return 'Waxing Crescent';
    if (phase === 0.25) return 'First Quarter';
    if (phase < 0.5) return 'Waxing Gibbous';
    if (phase === 0.5) return 'Full Moon';
    if (phase < 0.75) return 'Waning Gibbous';
    if (phase === 0.75) return 'Last Quarter';
    return 'Waning Crescent';
  };

  const fractionPercent = () => Math.round(moonData().fraction * 100);

  return (
    <WidgetContainer title="Moon Phase">
      <div class="flex flex-col items-center justify-center h-full">
        <div class="relative w-16 h-16 rounded-full bg-neutral-900 border-2 border-neutral-700 mb-3 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
           {/* Simple visual approximation of illumination */}
           <div 
             class="absolute inset-0 bg-neutral-200"
             style={{ 
               opacity: moonData().fraction,
               "mask-image": "linear-gradient(to right, black 50%, white 50%)" // simplistic mask
             }}
           ></div>
           {/* Better visualization requires complex SVG paths or icon set */}
        </div>
        
        <div class="text-lg font-medium text-white text-center">
          {getPhaseName(moonData().phase)}
        </div>
        <div class="text-sm text-neutral-400 mt-1">
          {fractionPercent()}% Illumination
        </div>
      </div>
    </WidgetContainer>
  );
};

export default MoonPhaseWidget;
