// WebGPU rendering types

export interface RenderUniforms {
  time: number; // Elapsed time in seconds
  intensity: number; // 0-1 intensity level
  tempoPhase: number; // 0-1 progress within current tempo phase
  screenSize: [number, number]; // [width, height]
}

export interface ShaderConfig {
  name: string;
  code: string;
  entryPoint: string;
}

export interface WebGPUCapabilities {
  supported: boolean;
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  error?: string;
}
