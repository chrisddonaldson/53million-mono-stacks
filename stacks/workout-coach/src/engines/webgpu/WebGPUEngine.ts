import type { RenderUniforms, WebGPUCapabilities } from "../../types/webgpu";

export class WebGPUEngine {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private animationFrameId: number | null = null;

  async checkSupport(): Promise<WebGPUCapabilities> {
    if (!navigator.gpu) {
      return {
        supported: false,
        adapter: null,
        device: null,
        error: "WebGPU is not supported in this browser. Please use Chrome 113+ or Edge 113+.",
      };
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          adapter: null,
          device: null,
          error: "Failed to get GPU adapter",
        };
      }

      const device = await adapter.requestDevice();
      return {
        supported: true,
        adapter,
        device,
      };
    } catch (error) {
      return {
        supported: false,
        adapter: null,
        device: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async init(canvas: HTMLCanvasElement, shaderCode: string): Promise<boolean> {

    const capabilities = await this.checkSupport();
    if (!capabilities.supported || !capabilities.device) {
      console.error("WebGPU not supported:", capabilities.error);
      return false;
    }

    this.device = capabilities.device;

    // Configure canvas context
    const context = canvas.getContext("webgpu");
    if (!context) {
      console.error("Failed to get WebGPU context");
      return false;
    }
    this.context = context;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    // Create uniform buffer (4 floats: time, intensity, tempoPhase, padding)
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // 4 * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });

    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    });

    // Create pipeline layout
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    // Create render pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: presentationFormat }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    return true;
  }

  render(uniforms: RenderUniforms): void {
    if (!this.device || !this.context || !this.pipeline || !this.uniformBuffer || !this.bindGroup) {
      return;
    }

    // Update uniforms
    const uniformData = new Float32Array([
      uniforms.time,
      uniforms.intensity,
      uniforms.tempoPhase,
      0.0, // padding
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    // Get current texture
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.draw(6); // Two triangles (fullscreen quad)
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
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
    this.uniformBuffer?.destroy();
    this.device?.destroy();
  }
}
