
import { Component, createResource, For, Show } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { api } from '../../services/api';

const CalendarWidget: Component = () => {
  const [events] = createResource(api.fetchCalendarEvents);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <WidgetContainer title="Calendar" className="row-span-2">
      <div class="relative h-full">
        <div class="absolute inset-0 overflow-y-auto pr-2 space-y-3">
          <For each={events()}>
            {(event, index) => (
              <div class="group relative pl-4 border-l-2 border-neutral-700 hover:border-blue-500 transition-colors">
                 {/* Visual indicator for 'next up' */}
                <Show when={index() === 0}>
                   <div class="absolute -left-[5px] top-0 h-full w-[2px] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </Show>

                <div class="flex justify-between items-start">
                  <h3 class="text-neutral-200 font-medium group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>
                  <span class="text-xs text-neutral-500 font-mono bg-neutral-800 px-2 py-0.5 rounded">
                    {formatTime(event.startTime)}
                  </span>
                </div>
                <div class="text-sm text-neutral-500 mt-0.5">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
              </div>
            )}
          </For>
          <Show when={events()?.length === 0}>
            <div class="text-neutral-500 text-center py-4">No upcoming events</div>
          </Show>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default CalendarWidget;
