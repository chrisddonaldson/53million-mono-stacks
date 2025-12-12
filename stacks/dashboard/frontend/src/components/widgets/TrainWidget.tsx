
import { Component, createResource, For, Show } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { api } from '../../services/api';

const TrainWidget: Component = () => {
  const [departures] = createResource(api.fetchTrainDepartures);

  return (
    <WidgetContainer title="Elizabeth Line" className="h-full border-t-4 border-t-[#6950a1]">
      <div class="flex flex-col h-full">
         <div class="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">West Ealing &rarr; East</div>
         <div class="flex-grow space-y-2 overflow-y-auto pr-1">
             <For each={departures()}>
                 {(train) => (
                     <div class="flex justify-between items-center bg-neutral-800/40 p-2 rounded">
                         <div>
                             <div class="text-sm font-bold text-white leading-none">{train.destination}</div>
                             <div class="text-[10px] text-neutral-500 mt-1">Plat {train.platform}</div>
                         </div>
                         <div class="text-right">
                             <div class="text-lg font-mono font-medium text-white leading-none">{train.dueInMinutes} <span class="text-[10px] text-neutral-500 font-sans">min</span></div>
                             <div class={`text-[10px] font-bold mt-1 ${train.status === 'On Time' ? 'text-green-400' : 'text-orange-400'}`}>
                                 {train.status}
                             </div>
                         </div>
                     </div>
                 )}
             </For>
             <Show when={departures()?.length === 0}>
                 <div class="text-center text-neutral-500 text-xs py-4">No trains scheduled</div>
             </Show>
         </div>
      </div>
    </WidgetContainer>
  );
};

export default TrainWidget;
