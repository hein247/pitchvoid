import React, { useEffect, useRef, useState } from 'react';

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      mql.removeEventListener('change', handler);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  /**
   * Fragment shader: domain-warped FBM "liquid smoke" with glowing wisp contours,
   * slow undulating twist, and visible film grain.
   * Palette: warm peach/amber → cool purple-blue on near-black.
   */
  const createFsSource = (octaves: number) => `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const int OCTAVES = ${octaves};

    /* ── noise primitives ── */

    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(
        mix(hash21(i),                hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0,1.0)),hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < OCTAVES; i++) {
        val += amp * noise(p * freq);
        freq *= 2.0;
        amp  *= 0.5;
      }
      return val;
    }

    /* ── rotation for the slow twist ── */

    mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    /* ── main ── */

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      vec2 p  = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

      float t = iTime * 0.12;   /* very slow for ethereal feel */

      /* slow, undulating twist that radiates from the centre */
      p *= rot(t * 0.3 + length(p) * 0.25);

      /* ── domain warping (two passes → deeply organic) ── */

      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + t * 0.6),
        fbm(p + vec2(5.2, 1.3) + t * 0.5)
      );

      vec2 r = vec2(
        fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.3),
        fbm(p + 3.5 * q + vec2(8.3, 2.8) + t * 0.35)
      );

      float f = fbm(p + 3.0 * r);

      /* ── wisp contour lines (neon outlines of the smoke) ── */

      float contour1 = pow(abs(sin(f * 6.2832 * 1.5)),        12.0);
      float contour2 = pow(abs(sin((f + q.x * 0.5) * 6.2832 * 2.0)), 8.0);
      float contour3 = pow(abs(sin((f + r.y * 0.3) * 6.2832)),       16.0);

      /* soft under-glow */
      float glow = smoothstep(0.2, 0.8, f * f * 1.5);

      /* ── brand palette ── */

      vec3 warmPeach   = vec3(0.85, 0.55, 0.35);          /* ≈ HSL 25 75% 65% */
      vec3 coolPurple  = vec3(0.40, 0.28, 0.72);          /* ≈ HSL 260 45% 50% */
      vec3 brightWhite = vec3(0.95, 0.92, 0.88);
      vec3 deepBlack   = vec3(0.020, 0.015, 0.030);       /* near-black */

      /* ── compositing ── */

      vec3 col = deepBlack;

      /* subtle ambient glow */
      col += warmPeach  * glow         * 0.06;
      col += coolPurple * (1.0 - glow) * 0.04;

      /* bright wisp lines */
      col += warmPeach   * contour1 * 0.70;
      col += coolPurple  * contour2 * 0.50;
      col += brightWhite * contour3 * 0.40;

      /* soft halo around wisp centres */
      float halo = smoothstep(0.5, 0.0, abs(f - 0.5)) * 0.15;
      col += mix(warmPeach, coolPurple, q.x) * halo;

      /* ── vignette ── */
      vec2 vigUv = uv * (1.0 - uv);
      float vig  = clamp(pow(vigUv.x * vigUv.y * 15.0, 0.25), 0.0, 1.0);
      col *= vig;

      /* ── film grain ── */
      float grain = (hash21(gl_FragCoord.xy + fract(iTime) * 1000.0) - 0.5) * 0.12;
      col += grain;

      col = clamp(col, 0.0, 1.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const initShaderProgram = (gl: WebGLRenderingContext, vs: string, fs: string) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  };

  const octaves = isMobile ? 4 : 6;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported.');
      return;
    }

    const fsSource = createFsSource(octaves);
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const info = {
      program: shaderProgram,
      attrib: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      uResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
      uTime: gl.getUniformLocation(shaderProgram, 'iTime'),
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio, isMobile ? 1 : 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();
    let animationId: number;

    const drawFrame = (time: number) => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(info.program);
      gl.uniform2f(info.uResolution, canvas.width, canvas.height);
      gl.uniform1f(info.uTime, time);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(info.attrib, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(info.attrib);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (reducedMotion) {
      drawFrame(2.0);
    } else {
      const render = () => {
        const currentTime = (Date.now() - startTime) / 1000;
        drawFrame(currentTime);
        animationId = requestAnimationFrame(render);
      };
      animationId = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [octaves, reducedMotion, isMobile]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Semi-transparent overlay for text readability */}
      <div
        className="fixed inset-0 pointer-events-none bg-black/40"
        style={{ zIndex: 1 }}
      />
    </>
  );
};

export default ShaderBackground;
