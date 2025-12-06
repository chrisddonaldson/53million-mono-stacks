import type { RenderUniforms } from "../../types/webgpu";

export class WebGLEngine {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private uniformLocations: {
    time: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
    tempoPhase: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
  } = {
    time: null,
    intensity: null,
    tempoPhase: null,
    resolution: null,
  };
  private animationFrameId: number | null = null;

  checkSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  init(canvas: HTMLCanvasElement, vertexShader: string, fragmentShader: string): boolean {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }
    this.gl = gl as WebGLRenderingContext;

    // Compile shaders
    const vs = this.compileShader(vertexShader, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(fragmentShader, this.gl.FRAGMENT_SHADER);
    
    if (!vs || !fs) {
      console.error('Failed to compile shaders');
      return false;
    }

    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) {
      console.error('Failed to create program');
      return false;
    }

    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return false;
    }

    this.gl.useProgram(this.program);

    // Get uniform locations
    this.uniformLocations.time = this.gl.getUniformLocation(this.program, 'u_time');
    this.uniformLocations.intensity = this.gl.getUniformLocation(this.program, 'u_intensity');
    this.uniformLocations.tempoPhase = this.gl.getUniformLocation(this.program, 'u_tempo_phase');
    this.uniformLocations.resolution = this.gl.getUniformLocation(this.program, 'u_resolution');

    // Create fullscreen quad
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    return true;
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  render(uniforms: RenderUniforms): void {
    if (!this.gl || !this.program) return;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.program);

    // Update uniforms
    if (this.uniformLocations.time) {
      this.gl.uniform1f(this.uniformLocations.time, uniforms.time);
    }
    if (this.uniformLocations.intensity) {
      this.gl.uniform1f(this.uniformLocations.intensity, uniforms.intensity);
    }
    if (this.uniformLocations.tempoPhase) {
      this.gl.uniform1f(this.uniformLocations.tempoPhase, uniforms.tempoPhase);
    }
    if (this.uniformLocations.resolution) {
      this.gl.uniform2f(this.uniformLocations.resolution, this.gl.canvas.width, this.gl.canvas.height);
    }

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  startRenderLoop(getUniforms: () => RenderUniforms): void {
    const loop = () => {
      this.render(getUniforms());
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy(): void {
    this.stopRenderLoop();
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
