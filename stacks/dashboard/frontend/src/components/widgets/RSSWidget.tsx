
import { Component, createResource, For } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { api } from '../../services/api';

const RSSWidget: Component = () => {
  const [items] = createResource(api.fetchRSSHeadlines);

  return (
    <WidgetContainer title="Latest News" className="h-full">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <For each={items()}>
          {(item) => (
            <div class="bg-neutral-800/30 p-4 rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer border border-transparent hover:border-neutral-700">
              <div class="text-xs text-blue-400 font-medium tracking-wide mb-2 uppercase">
                {item.source}
              </div>
              <h3 class="text-neutral-300 font-medium leading-snug mb-3">
                {item.title}
              </h3>
              <div class="text-[10px] text-neutral-500">
                {item.publishedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          )}
        </For>
      </div>
    </WidgetContainer>
  );
};

export default RSSWidget;
