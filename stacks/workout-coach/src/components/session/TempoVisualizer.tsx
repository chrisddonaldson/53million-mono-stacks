
import { createMemo, For, type Component } from "solid-js";
import type { StepPhase } from "../../types/session";

interface Props {
  repStructure?: StepPhase[];
  elapsedTime: number; // Seconds elapsed in the current step
  duration: number; // Total duration of the step
}

const TempoVisualizer: Component<Props> = (props) => {
  // Convert the flat rep structure into absolute time ranges
  const timelineItems = createMemo(() => {
    if (!props.repStructure) return [];
    
    let currentTime = 0;
    return props.repStructure.map(phase => {
        const start = currentTime;
        const end = currentTime + phase.duration;
        currentTime = end;
        return { ...phase, start, end };
    });
  });

  // Window of time to show (seconds)
  // const VIEW_WINDOW = 5; 
  const PIXELS_PER_SECOND = 100;

  return (
    <div class="relative w-full h-80 bg-gray-900 overflow-hidden border-2 border-gray-700 rounded-lg">
      {/* Target Line */}
      <div 
        class="absolute bottom-10 left-0 w-full h-1 bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      ></div>
      <div class="absolute bottom-2 left-2 text-xs text-gray-400">NOW</div>

      {/* Track */}
      <div class="absolute inset-0 flex justify-center">
          <div class="w-1/2 h-full bg-gray-800/50 border-x border-gray-700 relative">
             <For each={timelineItems()}>
                {(item) => {
                    // Calculate position relative to the target line
                    // We want: bottom = 10 + (item.start - elapsed) * PPS
                    // Wait, if item.start > elapsed, it's above.
                    // If item.start < elapsed, it's passed or passing.
                    
                    return (
                        <div
                            class="absolute w-full flex items-center justify-center text-xs font-bold uppercase transition-transform will-change-transform"
                            style={{
                                "bottom": `${40 + (item.start - props.elapsedTime) * PIXELS_PER_SECOND}px`,
                                "height": `${item.duration * PIXELS_PER_SECOND}px`,
                                "background-color": getColorForPhase(item.type),
                                "opacity": getOpacity(item.start, item.end, props.elapsedTime)
                            }}
                        >
                            {item.type}
                        </div>
                    );
                }}
             </For>
          </div>
      </div>
      
       {/* Debug / Status */}
       <div class="absolute top-2 right-2 text-white font-mono text-sm">
         {props.elapsedTime.toFixed(1)}s / {props.duration}s
       </div>
    </div>
  );
};

function getColorForPhase(type: StepPhase['type']) {
    switch(type) {
        case 'concentric': return 'rgba(57, 255, 20, 0.6)'; // Neon Green
        case 'eccentric': return 'rgba(255, 69, 0, 0.6)';  // Orange Red
        case 'hold': return 'rgba(0, 191, 255, 0.6)';      // Deep Sky Blue
        default: return 'gray';
    }
}

function getOpacity(_start: number, end: number, current: number) {
    // If fully passed, fade out
    if (current > end) return 0.2;
    return 1;
}

export default TempoVisualizer;
