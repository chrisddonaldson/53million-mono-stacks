
import { Component, createResource } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { api } from '../../services/api';

const WeatherWidget: Component = () => {
  const [data] = createResource(api.fetchWeather);

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
          {data()?.location}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default WeatherWidget;
