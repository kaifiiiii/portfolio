// GPU side of the intro. Every particle carries four target positions
// (ring, funnel, helix, landscape); uniforms say how far along each transformation we are.

export const VERT = /* glsl */ `
  attribute float aSeed;
  attribute vec3 aFun;
  attribute vec3 aHelix;
  attribute vec3 aLand;
  attribute vec3 aCol;
  attribute vec3 aColH;

  uniform float uTime;
  uniform float uM1;
  uniform float uM2;
  uniform float uM3;
  uniform float uShape;
  uniform float uRot;
  uniform float uHelixShift;
  uniform float uHelixK;
  uniform float uHelixHalf;
  uniform float uHelixTiles; // how many helix lengths are stacked, so tall (phone) screens stay filled
  uniform float uStretch; // vertical stretch for tall screens (1 on desktop)
  uniform vec3 uLandScale; // keeps the landscape looking the same on any screen shape
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uBright;
  uniform float uFade;
  uniform float uLandY;
  uniform float uCamZ;

  varying vec3 vColor;
  varying float vAlpha;

  const float PI = 3.14159265;

  // Each particle starts and finishes a transformation at its own moment
  float stage(float m, float seed) {
    float d = seed * 0.4;
    float x = clamp((m - d) / 0.6, 0.0, 1.0);
    return x * x * (3.0 - 2.0 * x);
  }

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  // One broad, smooth dome with slow rolling undulations (no sharp ripples)
  float landH(vec2 xz, float t) {
    float x = xz.x;
    float z = xz.y;
    // Hill at the far side, flattening a little toward the viewer
    float near = smoothstep(-3.0, -0.2, z);
    float dome = (0.9 * exp(-pow((x - 0.4) / 6.5, 2.0)) - 0.05) * (1.0 - 0.55 * near);
    float waves = 0.100 * sin(x * 0.80 + z * 1.5 + t * 0.35)
                + 0.075 * sin(x * 1.50 - z * 2.2 - t * 0.50)
                + 0.037 * sin(x * 2.90 + z * 3.1 + t * 0.70)
                + 0.016 * sin(x * 5.00 - z * 3.6 - t * 1.00);
    return dome + waves * (1.0 - 0.2 * near);
  }

  // Funnel (wide top, narrow bottom) that turns into a rippling barrel
  vec3 funnelPos(vec3 f, float t) {
    float u = (f.y + 2.9) / 5.8;
    float coneR = 0.3 + 2.6 * pow(u, 1.6);
    float barrelR = 1.9 + 0.18 * sin(u * 6.0 + t * 0.9) + 0.12 * sin(u * 11.0 - t * 0.6);
    float r = mix(coneR, barrelR, uShape);
    return vec3(r * cos(f.x), f.y * uStretch, r * sin(f.x));
  }

  void main() {
    float t = uTime;
    float seed = aSeed;

    // 1. Ring: the whole band ripples together; seeds add only a fine shimmer
    vec3 ring = position;
    float ang = atan(ring.y, ring.x);
    vec2 dir = normalize(ring.xy);
    float wob = sin(ang * 4.0 + t * 0.9) * 0.06
              + sin(ang * 9.0 - t * 1.3) * 0.03
              + sin(seed * 40.0 + t * 2.0) * 0.006;
    ring.xy += dir * wob;
    ring.z += sin(ang * 3.0 + t * 1.1) * 0.22;

    // 2. Funnel / barrel: lattice twists slowly and breathes vertically
    vec3 fun = funnelPos(aFun, t);
    fun += vec3(sin(seed * 91.0), sin(seed * 57.0), sin(seed * 33.0)) * 0.006;
    fun.y *= 1.0 + 0.05 * sin(t * 1.1);
    fun = rotY(fun, t * 0.35 + (fun.y / uStretch) * 0.22);

    // 3. Helix: turns around its axis
    // The whole helix flows up or down along its axis. It is one full turn per 5 units,
    // so wrapping at the ends is seamless; particles fade out near the ends while they wrap.
    float tiles = uHelixTiles;
    float span = 2.0 * uHelixHalf * tiles;
    float halfSpan = 0.5 * span;
    float tile = floor(seed * tiles); // each particle belongs to one of the stacked lengths
    vec3 hel;
    if (aHelix.y > 50.0) {
      // Bright knot: sits where the two strands cross, and flows with them
      float n = floor((aHelix.y - 100.0) / 10.0);
      float gy = aHelix.y - 100.0 - n * 10.0 - 5.0;
      float y0 = uHelixShift + (PI * 0.5) / uHelixK + (n + 2.0 * tile) * (PI / uHelixK);
      y0 = mod(y0 + halfSpan, span) - halfSpan;
      hel = vec3(aHelix.x, y0 + gy, aHelix.z);
    } else {
      float yb = aHelix.y + 2.0 * uHelixHalf * (tile - floor(tiles * 0.5));
      float y1 = mod(yb + uHelixShift + halfSpan, span) - halfSpan;
      hel = vec3(aHelix.x, y1, aHelix.z);
    }
    hel += vec3(sin(t * 1.7 + seed * 30.0), sin(t * 1.3 + seed * 17.0), sin(t * 1.9 + seed * 11.0)) * 0.015;

    // 4. Landscape: slow waves
    vec3 land = vec3(
      aLand.x * uLandScale.x,
      (uLandY + landH(aLand.xz, t) + aLand.y) * uLandScale.y,
      aLand.z * uLandScale.z
    );

    float e1 = stage(uM1, seed);
    float e2 = stage(uM2, seed);
    float e3 = stage(uM3, seed);

    vec3 p = mix(ring, fun, e1);
    p = mix(p, hel, e2);
    p = mix(p, land, e3);

    // While travelling, particles bend away from a straight line, and fall a little on the way down
    vec3 sw = vec3(sin(seed * 37.0 + t * 0.7), cos(seed * 53.0 + t * 0.6), sin(seed * 71.0 - t * 0.5));
    p += sw * 0.22 * uStretch * (sin(PI * e1) + sin(PI * e2) + sin(PI * e3));
    p.y -= 0.9 * uStretch * seed * sin(PI * e3);

    // Colour
    vec3 col = mix(aCol, aColH, e2);
    // Landscape colour follows the screen position: blue on the left, coral-red on the right
    float camD = 5.0 - aLand.z; // colours follow the screen position the same way on every screen
    float lx = smoothstep(-0.95, 0.95, aLand.x / (camD * 0.83));
    vec3 lc = mix(vec3(0.3, 0.45, 1.0), vec3(0.52, 0.5, 1.0), smoothstep(0.0, 0.5, lx));
    lc = mix(lc, vec3(1.0, 0.5, 0.42), smoothstep(0.48, 0.7, lx));
    lc = mix(lc, vec3(1.0, 0.38, 0.3), smoothstep(0.7, 1.0, lx));
    // The far rows form a soft glowing band (the crest); rows below it get dimmer and dimmer
    float depthB = exp(-(aLand.z + 3.0) * 2.2);
    float haze = smoothstep(0.03, 0.35, aLand.y);
    float rowFade = 1.0 - 0.5 * smoothstep(-2.4, 0.4, aLand.z);
    float edgeFade = 0.35 + 0.65 * smoothstep(0.0, 0.28, lx) * (1.0 - smoothstep(0.78, 1.0, lx));
    float lb = (0.32 * rowFade + 1.0 * depthB * (1.0 - 0.85 * haze)) * edgeFade;
    col = mix(col, lc * lb, e3);

    float denseBoost = 1.0 + 0.15 * (uHelixTiles - 1.0); // fewer particles per length, so a little brighter
    float phaseBright = mix(mix(mix(1.0, 0.45, e1), 1.15 * denseBoost, e2), 0.9, e3);
    float landSize = 1.0 + 0.5 * exp(-(aLand.z + 3.0) * 2.2); // crest particles are larger, so they bloom
    float sizeMul = mix(mix(mix(1.0, 1.5, e1), 1.1, e2), landSize, e3);

    // The helix glitters
    float helixW = e2 * (1.0 - e3);
    float tw = 0.5 + 0.5 * sin(t * 6.5 + seed * 97.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * sizeMul * uPixelRatio * (0.55 + seed * 0.9) * (uCamZ * 1.2 / depth);

    vColor = col;
    float helixEdge = 1.0 - smoothstep(halfSpan - 0.25, halfSpan, abs(hel.y));
    float transit = 1.0 - 0.5 * max(sin(PI * e1), sin(PI * e3)); // dimmer while in motion, so it stays crisp
    vAlpha = uFade * uBright * phaseBright * transit * mix(1.0, helixEdge * (0.4 + 0.9 * tw), helixW);
  }
`

export const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * 0.65 + a * 0.35; // bright core with a soft halo
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`