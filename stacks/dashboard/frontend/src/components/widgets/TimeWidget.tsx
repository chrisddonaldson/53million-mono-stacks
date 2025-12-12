
import { Component, createSignal, onCleanup } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { useLocation } from '../../context/LocationContext';

const TimeWidget: Component = () => {
  const { state } = useLocation();
  const [now, setNow] = createSignal(new Date());

  const timer = setInterval(() => {
    setNow(new Date());
  }, 1000);

  onCleanup(() => clearInterval(timer));

  const timeString = () => now().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    timeZone: state().timezone
  });

  const dateString = () => now().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    timeZone: state().timezone
  });

  return (
    <WidgetContainer className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-700">
      <div class="flex flex-col items-center justify-center h-full py-6">
        <div class="text-6xl md:text-8xl font-bold tracking-tighter text-white font-mono tabular-nums">
          {timeString()}
        </div>
        <div class="text-xl md:text-2xl text-neutral-400 font-medium mt-2">
          {dateString()}
        </div>
        <div class="text-xs text-neutral-600 mt-2 font-mono">
            {state().timezone}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default TimeWidget;
