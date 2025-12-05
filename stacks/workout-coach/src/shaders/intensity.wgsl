// Intensity-based visual shader for workout coaching
// Creates pulsing, arcade-style visuals that sync with workout intensity

struct Uniforms {
  time: f32,
  intensity: f32,     // 0-1 (rest=0.2, work=0.7-1.0)
  tempo_phase: f32,   // 0-1 within current tempo phase
  padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  // Fullscreen quad
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  output.uv = pos[vertexIndex] * 0.5 + 0.5;
  return output;
}

// Utility functions
fn hash(p: vec2<f32>) -> f32 {
  var p3 = fract(vec3<f32>(p.xyx) * 0.13);
  p3 += dot(p3, p3.yzx + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(hash(i + vec2<f32>(0.0, 0.0)), hash(i + vec2<f32>(1.0, 0.0)), u.x),
    mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x),
    u.y
  );
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Center coordinates (-1 to 1)
  let uv = input.uv * 2.0 - 1.0;
  let aspect = 1.0; // Will need to pass actual aspect ratio
  let coord = vec2<f32>(uv.x * aspect, uv.y);
  
  let dist = length(coord);
  let angle = atan2(coord.y, coord.x);
  
  // Base color scheme
  let baseColor = vec3<f32>(0.1, 0.05, 0.15); // Dark purple
  let accentColor = vec3<f32>(0.3, 0.6, 1.0); // Bright blue
  let highIntensityColor = vec3<f32>(1.0, 0.3, 0.2); // Red-orange
  
  // Pulsing rings from center
  let pulseSpeed = 2.0 + uniforms.intensity * 3.0;
  let pulseFreq = 3.0 + uniforms.intensity * 5.0;
  let pulse = sin(dist * pulseFreq - uniforms.time * pulseSpeed);
  
  // Tempo-synced wave
  let tempoWave = sin(uniforms.tempo_phase * 6.28318); // 2*PI
  
  // Radial gradient with intensity
  let radialGlow = 1.0 - smoothstep(0.0, 1.5, dist);
  
  // Combine effects
  let ringPattern = smoothstep(0.4, 0.6, pulse) * uniforms.intensity;
  let centerGlow = radialGlow * (0.3 + uniforms.intensity * 0.7);
  
  // Add noise for texture
  let noiseVal = noise(coord * 5.0 + uniforms.time * 0.5) * 0.1;
  
  // Color mixing based on intensity
  var color = mix(baseColor, accentColor, ringPattern + centerGlow);
  
  // High intensity adds red/orange
  if (uniforms.intensity > 0.8) {
    color = mix(color, highIntensityColor, (uniforms.intensity - 0.8) * 5.0);
  }
  
  // Tempo pulse brightens the whole scene
  color += vec3<f32>(tempoWave * uniforms.intensity * 0.2);
  
  // Add noise
  color += vec3<f32>(noiseVal);
  
  // Vignette
  let vignette = smoothstep(1.5, 0.5, dist);
  color *= vignette;
  
  return vec4<f32>(color, 1.0);
}
