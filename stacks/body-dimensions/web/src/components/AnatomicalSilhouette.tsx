import { For } from 'solid-js';

type MeasurementPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'circumference' | 'skinfold';
  unit: string;
};

const POINTS: MeasurementPoint[] = [
  { id: 'neck', name: 'Neck', x: 50, y: 15, type: 'circumference', unit: 'cm' },
  { id: 'chest', name: 'Chest', x: 50, y: 30, type: 'circumference', unit: 'cm' },
  { id: 'waist', name: 'Waist', x: 50, y: 45, type: 'circumference', unit: 'cm' },
  { id: 'hips', name: 'Hips', x: 50, y: 55, type: 'circumference', unit: 'cm' },
  { id: 'upper_arm_l', name: 'L Arm', x: 30, y: 30, type: 'circumference', unit: 'cm' },
  { id: 'upper_arm_r', name: 'R Arm', x: 70, y: 30, type: 'circumference', unit: 'cm' },
  { id: 'forearm_l', name: 'L Forearm', x: 25, y: 45, type: 'circumference', unit: 'cm' },
  { id: 'forearm_r', name: 'R Forearm', x: 75, y: 45, type: 'circumference', unit: 'cm' },
  { id: 'thigh_l', name: 'L Thigh', x: 40, y: 65, type: 'circumference', unit: 'cm' },
  { id: 'thigh_r', name: 'R Thigh', x: 60, y: 65, type: 'circumference', unit: 'cm' },
  { id: 'calf_l', name: 'L Calf', x: 40, y: 85, type: 'circumference', unit: 'cm' },
  { id: 'calf_r', name: 'R Calf', x: 60, y: 85, type: 'circumference', unit: 'cm' },
  // Skinfolds
  { id: 'chest_fold', name: 'Chest Fold', x: 40, y: 35, type: 'skinfold', unit: 'mm' },
  { id: 'triceps_fold', name: 'Tricep Fold', x: 25, y: 35, type: 'skinfold', unit: 'mm' },
  { id: 'subscapular_fold', name: 'Subscap Fold', x: 35, y: 38, type: 'skinfold', unit: 'mm' },
  { id: 'abdomen_fold', name: 'Abdomen Fold', x: 55, y: 48, type: 'skinfold', unit: 'mm' },
  { id: 'suprailiac_fold', name: 'Suprailiac Fold', x: 65, y: 48, type: 'skinfold', unit: 'mm' },
  { id: 'thigh_fold', name: 'Thigh Fold', x: 45, y: 68, type: 'skinfold', unit: 'mm' },
];

export function AnatomicalSilhouette(props: { 
  values: Record<string, number>, 
  onUpdate: (id: string, val: number) => void 
}) {
  return (
    <div class="relative w-[500px] h-[800px] border border-white/10 mx-auto rounded-3xl bg-black/20 overflow-hidden shadow-2xl">
      {/* Basic Silhouette SVG */}
      <svg viewBox="0 0 100 100" class="w-full h-full opacity-10 p-10">
        <path fill="white" d="M50 5 C45 5 40 8 40 15 C40 20 45 25 50 25 C55 25 60 20 60 15 C60 8 55 5 50 5 Z M40 25 C30 25 25 35 25 50 L25 55 L30 55 L30 50 C30 40 35 30 45 30 L55 30 C65 30 70 40 70 50 L70 55 L75 55 L75 50 C75 35 70 25 60 25 Z" />
        <rect x="42" y="30" width="16" height="30" rx="4" fill="white" />
        <rect x="40" y="60" width="8" height="35" rx="3" fill="white" />
        <rect x="52" y="60" width="8" height="35" rx="3" fill="white" />
      </svg>

      <For each={POINTS}>
        {(point) => (
          <div 
            class="absolute flex flex-col items-center gap-1.5 transition-all hover:z-10"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div class="glass px-3 py-2 flex flex-col items-center min-w-[80px] group transition-all hover:scale-105 hover:bg-white/[0.08]">
              <span class="text-[10px] uppercase tracking-wider text-[#a0a0ab] font-medium mb-1 font-sans">{point.name}</span>
              <div class="flex items-center gap-1">
                <input 
                  type="number" 
                  step="any"
                  value={props.values[point.id] || ''} 
                  onInput={(e) => props.onUpdate(point.id, parseFloat(e.currentTarget.value))}
                  class="w-12 bg-transparent border-none p-0 text-right text-sm font-bold text-white focus:ring-0 placeholder-white/20 font-mono"
                  placeholder="..."
                />
                <span class="text-[10px] font-bold text-[#3aedc8] font-sans">{point.unit}</span>
              </div>
            </div>
            {/* Connector dot */}
            <div class="w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_10px_#00d2ff]"></div>
          </div>
        )}
      </For>
    </div>
  );
}
