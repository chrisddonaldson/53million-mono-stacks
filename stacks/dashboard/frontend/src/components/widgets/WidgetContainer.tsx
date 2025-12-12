
import { ParentComponent, ErrorBoundary, Suspense, JSX } from "solid-js";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface WidgetContainerProps {
  title?: string;
  className?: string;
  children: JSX.Element;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const WidgetContainer: ParentComponent<WidgetContainerProps> = (props) => {
  return (
    <div class={cn("bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl p-6 flex flex-col h-full shadow-lg transition-all hover:bg-neutral-800/70", props.className)}>
      {props.title && (
        <h2 class="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-4">
          {props.title}
        </h2>
      )}
      <div class="flex-1 min-h-0 overflow-y-auto">
        <ErrorBoundary fallback={(err) => (
          <div class="h-full flex flex-col items-center justify-center text-red-400 p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-xs">Widget Failed</span>
            <span class="text-[10px] opacity-70 mt-1">{err.message}</span>
          </div>
        )}>
          <Suspense fallback={
            <div class="h-full flex items-center justify-center">
               <div class="animate-pulse flex space-x-2">
                  <div class="h-2 w-2 bg-neutral-600 rounded-full"></div>
                  <div class="h-2 w-2 bg-neutral-600 rounded-full"></div>
                  <div class="h-2 w-2 bg-neutral-600 rounded-full"></div>
               </div>
            </div>
          }>
            {props.children}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default WidgetContainer;
