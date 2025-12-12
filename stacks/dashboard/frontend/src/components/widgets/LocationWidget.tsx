
import { Component, Show } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { useLocation } from '../../context/LocationContext';

const LocationWidget: Component = () => {
  const { state, useDeviceLocation, resetToDefault } = useLocation();

  return (
    <WidgetContainer title="Location Control">
      <div class="flex flex-col items-center justify-center h-full space-y-3 p-2">
        <div class="text-center">
          <div class="text-xs text-neutral-400 mb-1">Active Location</div>
          <div class="font-medium text-lg leading-tight text-white mb-2">{state().name}</div>
          <div class="text-[0.65rem] font-mono text-neutral-500">
            {state().lat.toFixed(4)}, {state().lng.toFixed(4)}
          </div>
        </div>

        <Show when={state().error}>
           <div class="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
             {state().error}
           </div>
        </Show>

        <div class="flex gap-2">
          {!state().isAuto ? (
            <button 
              onClick={useDeviceLocation}
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              Use My GPU
            </button>
          ) : (
             <button 
              onClick={resetToDefault}
              class="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded transition-colors"
            >
              Reset to London
            </button>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default LocationWidget;
