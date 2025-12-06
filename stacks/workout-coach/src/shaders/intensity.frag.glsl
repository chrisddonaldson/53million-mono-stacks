// Intensity-based visual shader for workout coaching
// Creates pulsing, arcade-style visuals that sync with workout intensity

precision highp float;

uniform float u_time;
uniform float u_intensity;     // 0-1 (rest=0.2, work=0.7-1.0)
uniform float u_tempo_phase;   // 0-1 within current tempo phase
uniform vec2 u_resolution;

varying vec2 v_uv;

// Utility functions
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.13);
  p3 += dot(p3, p3.yzx + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  // Center coordinates (-1 to 1)
  vec2 uv = v_uv * 2.0 - 1.0;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 coord = vec2(uv.x * aspect, uv.y);
  
  float dist = length(coord);
  float angle = atan(coord.y, coord.x);
  
  // Base color scheme
  vec3 baseColor = vec3(0.1, 0.05, 0.15); // Dark purple
  vec3 accentColor = vec3(0.3, 0.6, 1.0); // Bright blue
  vec3 highIntensityColor = vec3(1.0, 0.3, 0.2); // Red-orange
  
  // Pulsing rings from center
  float pulseSpeed = 2.0 + u_intensity * 3.0;
  float pulseFreq = 3.0 + u_intensity * 5.0;
  float pulse = sin(dist * pulseFreq - u_time * pulseSpeed);
  
  // Tempo-synced wave
  float tempoWave = sin(u_tempo_phase * 6.28318); // 2*PI
  
  // Radial gradient with intensity
  float radialGlow = 1.0 - smoothstep(0.0, 1.5, dist);
  
  // Combine effects
  float ringPattern = smoothstep(0.4, 0.6, pulse) * u_intensity;
  float centerGlow = radialGlow * (0.3 + u_intensity * 0.7);
  
  // Add noise for texture
  float noiseVal = noise(coord * 5.0 + u_time * 0.5) * 0.1;
  
  // Color mixing based on intensity
  vec3 color = mix(baseColor, accentColor, ringPattern + centerGlow);
  
  // High intensity adds red/orange
  if (u_intensity > 0.8) {
    color = mix(color, highIntensityColor, (u_intensity - 0.8) * 5.0);
  }
  
  // Tempo pulse brightens the whole scene
  color += vec3(tempoWave * u_intensity * 0.2);
  
  // Add noise
  color += vec3(noiseVal);
  
  // Vignette
  float vignette = smoothstep(1.5, 0.5, dist);
  color *= vignette;
  
  gl_FragColor = vec4(color, 1.0);
}
