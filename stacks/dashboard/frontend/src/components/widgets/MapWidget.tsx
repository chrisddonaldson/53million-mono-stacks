
import { Component } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { useLocation } from '../../context/LocationContext';

const MapWidget: Component = () => {
  const { state, useDeviceLocation, resetToDefault } = useLocation();
  
  // Construct URL dynamically based on state
  const mapUrl = () => {
      const { lat, lng } = state();
      return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <WidgetContainer title="Location" className="h-full relative group">
      <div class="h-full w-full rounded-lg overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
        <iframe
          width="100%"
          height="100%"
          src={mapUrl()}
          style={{ border: 0 }}
          loading="lazy"
          allowfullscreen={false}
          referrerpolicy="no-referrer-when-downgrade"
          class="absolute inset-0 w-full h-full"
        ></iframe>
        
        {/* Overlay Controls */}
        <div class="absolute bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur border-t border-neutral-700/50 p-3 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div>
                <div class="text-xs font-bold text-white">{state().name}</div>
                <div class="text-[10px] text-neutral-400 font-mono">
                    {state().lat.toFixed(4)}, {state().lng.toFixed(4)}
                </div>
            </div>
            
             <div class="flex gap-2">
                {!state().isAuto ? (
                    <button 
                    onClick={useDeviceLocation}
                    class="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider rounded transition-colors flex items-center gap-1"
                    title="Use Device Location"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    GPU
                    </button>
                ) : (
                    <button 
                    onClick={resetToDefault}
                    class="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-[10px] uppercase font-bold tracking-wider rounded transition-colors"
                    >
                    Reset
                    </button>
                )}
            </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default MapWidget;
