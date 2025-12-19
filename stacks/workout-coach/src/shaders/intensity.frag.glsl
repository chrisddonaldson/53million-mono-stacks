// Intensity-based visual shader for workout coaching
// Creates pulsing, arcade-style visuals that sync with workout intensity

precision highp float;

uniform float u_time;
uniform float u_intensity;     // 0-1 (rest=0.2, work=0.7-1.0)
uniform float u_tempo_phase;   // 0-1 within current tempo phase
uniform vec3 u_phase_color;    // RGB color for current phase
uniform float u_phase_type;    // 0 up, 1 hold, 2 down, 3 rest, 4 setup/other
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
  
  // Base scene color
  vec3 baseColor = vec3(0.04, 0.04, 0.05);
  vec3 phaseColor = u_phase_color * (0.35 + 0.65 * u_intensity);

  float angle = atan(coord.y, coord.x);
  float normalizedAngle = (angle + 3.14159265) / 6.2831853;
  float progressMask = smoothstep(u_tempo_phase, u_tempo_phase - 0.02, normalizedAngle);
  float ringBand = smoothstep(0.78, 0.72, dist) * smoothstep(0.58, 0.54, dist);
  float coreGlow = smoothstep(1.0, 0.0, dist);
  float shimmer = sin(u_time * (1.2 + u_intensity) + dist * 9.0) * 0.05;
  float noiseVal = noise(coord * 5.0 + u_time * 0.3) * 0.06;

  vec3 color = baseColor;

  if (u_phase_type >= 3.0) {
    color += phaseColor * coreGlow * 0.35;
    color += phaseColor * ringBand * (0.25 + 0.75 * progressMask);
    color += phaseColor * (shimmer + noiseVal);
  } else {
    float ballX = 0.0;
    float ballY = -0.7;
    if (u_phase_type < 0.5) {
      ballY = mix(-0.7, 0.7, u_tempo_phase);
    } else if (u_phase_type < 1.5) {
      ballY = 0.7;
    } else {
      ballY = mix(0.7, -0.7, u_tempo_phase);
    }
    vec2 ballPos = vec2(ballX, ballY);
    float ballDist = length(coord - ballPos);
    float ballRadius = 0.12 + u_intensity * 0.06;
    float ball = smoothstep(ballRadius, ballRadius - 0.02, ballDist);
    float trail = smoothstep(0.18, 0.0, abs(coord.x)) * smoothstep(ballY - 0.4, ballY, coord.y);

    color += phaseColor * (ball * 0.9 + trail * 0.2);
    color += phaseColor * (shimmer + noiseVal) * 0.6;
    color += phaseColor * coreGlow * 0.15;
  }

  float vignette = smoothstep(1.3, 0.4, dist);
  color *= vignette;
  
  gl_FragColor = vec4(color, 1.0);
}
