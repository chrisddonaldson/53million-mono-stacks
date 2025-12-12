
import { Component, createResource, createEffect, For } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { api } from '../../services/api';
import { useLocation } from '../../context/LocationContext';

const WeatherWidget: Component = () => {
  const { state } = useLocation();
  // We refetch when location changes
  const [data, { refetch }] = createResource(api.fetchWeather);

  createEffect(() => {
      // Trigger refetch when lat/lng changes
      // In a real app we'd pass these coords to the fetcher
      state(); 
      refetch();
  })

  return (
    <WidgetContainer title="Weather">
      <div class="flex flex-col h-full justify-between">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-5xl font-bold text-white">
              {data()?.temp}&deg;
            </div>
            <div class="text-neutral-400 text-lg mt-1">
              {data()?.condition}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-neutral-500 uppercase tracking-wide">High</div>
            <div class="text-xl font-medium text-neutral-200">{data()?.high}&deg;</div>
            <div class="text-sm text-neutral-500 uppercase tracking-wide mt-2">Low</div>
            <div class="text-xl font-medium text-neutral-200">{data()?.low}&deg;</div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-neutral-700/50 flex items-center text-sm text-neutral-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {state().name}
        </div>

        {/* Forecast Section */}
        <div class="mt-4 grid grid-cols-4 gap-2">
            <For each={data()?.forecast}>
                {(item) => (
                    <div class="flex flex-col items-center bg-neutral-800/50 rounded p-2">
                        <span class="text-[10px] text-neutral-400 font-mono mb-1">{item.time}</span>
                        <span class="text-sm font-bold text-white mb-1">{item.temp}&deg;</span>
                        <div class="text-[10px] text-neutral-500" title={item.condition}>
                            {/* Simple icon mapping based on condition */}
                            {item.condition === 'Sunny' && (
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                            {item.condition === 'Cloudy' && (
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 011-7.874V7a5 5 0 019.863-2.687A5 5 0 0118.84 8 8.84 8 0 0121 17a4 4 0 01-4 4H7a4 4 0 01-4-4z" />
                                </svg>
                            )}
                             {item.condition === 'Partly Cloudy' && (
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 011-7.874V7a5 5 0 019.863-2.687A5 5 0 0118.84 8 8.84 8 0 0121 17a4 4 0 01-4 4H7a4 4 0 01-4-4z" />
                                </svg>
                            )}
                            {item.condition === 'Rain' && (
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 16.2A4.5 4.5 0 001.4 16.2H2.6a4.5 4.5 0 008.8-1.2 4.5 4.5 0 00-6.8-3.6V11a5.002 5.002 0 00-3.6-4.6 4.98 4.98 0 00-4-2.4 4.98 4.98 0 00-4 2.4V11.2a4.5 4.5 0 001.4 5z" />
                                </svg>
                            )}
                        </div>
                    </div>
                )}
            </For>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default WeatherWidget;
