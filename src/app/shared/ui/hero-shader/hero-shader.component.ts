import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  NgZone,
} from '@angular/core';

const VERT_SRC = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
  precision mediump float;

  uniform float u_time;
  uniform vec2  u_res;
  uniform vec2  u_cursor;

  // Light pastel tints derived from ADB brand palette
  vec3 base       = vec3(0.941, 0.961, 0.980);  // #F0F5FA  (page bg)
  vec3 tintBlue   = vec3(0.820, 0.914, 0.957);  // #D1E9F4
  vec3 tintGreen  = vec3(0.882, 0.949, 0.824);  // #E1F2D2
  vec3 tintTeal   = vec3(0.820, 0.933, 0.957);  // #D1EDF4
  vec3 tintNavy   = vec3(0.843, 0.875, 0.929);  // #D7DFED

  // Cursor highlight — slightly richer blue
  vec3 cursorTint = vec3(0.765, 0.886, 0.949);  // #C3E2F2

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),              hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0; float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * smoothNoise(p); p *= 2.1; amp *= 0.48;
    }
    return v;
  }

  void main() {
    vec2  uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.20;

    // Cursor soft bloom
    float cd          = length(uv - u_cursor);
    float cursor_blob = exp(-cd * cd * 3.5);

    // FBM layers — layer 2 is nudged by cursor
    float n1 = fbm(uv * 1.5 + vec2( t * 0.30,  t * 0.22));
    float n2 = fbm(uv * 1.9 + vec2(-t * 0.20,  t * 0.38) + u_cursor * 0.5);
    float n3 = fbm(uv * 1.1 + vec2( t * 0.15, -t * 0.28));

    // Build colour from pastel base
    vec3 col = base;
    col = mix(col, tintGreen,  clamp(n1 * 1.1,            0.0, 1.0));
    col = mix(col, tintBlue,   clamp(n2 * 0.9,            0.0, 1.0));
    col = mix(col, tintTeal,   clamp(n3 * 0.6,            0.0, 1.0));
    col = mix(col, tintNavy,   clamp((1.0 - uv.y) * 0.25, 0.0, 1.0));
    col = mix(col, cursorTint, cursor_blob * 0.55);

    // Fully opaque — the canvas IS the background
    gl_FragColor = vec4(col, 1.0);
  }
`;

@Component({
  selector: 'app-hero-shader',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
})
export class HeroShaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  private uTime!: WebGLUniformLocation | null;
  private uRes!: WebGLUniformLocation | null;
  private uCursor!: WebGLUniformLocation | null;

  private raf = 0;
  private startTime = Date.now();
  private cursor     = { x: 0.5, y: 0.5 };
  private target     = { x: 0.5, y: 0.5 };
  private ro!: ResizeObserver;

  constructor(private zone: NgZone) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.target.x = (e.clientX - rect.left) / rect.width;
    this.target.y = 1.0 - (e.clientY - rect.top) / rect.height;
  }

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      if (this.initGL()) this.loop();
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
  }

  private initGL(): boolean {
    const canvas = this.canvasRef.nativeElement;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return false;
    this.gl = gl;

    const vs = this.compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = this.compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return false;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    // Full-screen triangle strip
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  1, -1, -1,  1,  1,  1]),
      gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.uTime   = gl.getUniformLocation(prog, 'u_time');
    this.uRes    = gl.getUniformLocation(prog, 'u_res');
    this.uCursor = gl.getUniformLocation(prog, 'u_cursor');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    return true;
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement ?? canvas;
    const dpr    = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width  = parent.clientWidth  * dpr;
    canvas.height = parent.clientHeight * dpr;
    this.gl?.viewport(0, 0, canvas.width, canvas.height);
  }

  private compile(type: number, src: string): WebGLShader | null {
    const s = this.gl.createShader(type)!;
    this.gl.shaderSource(s, src);
    this.gl.compileShader(s);
    if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  private loop() {
    const ease = 0.055;
    this.cursor.x += (this.target.x - this.cursor.x) * ease;
    this.cursor.y += (this.target.y - this.cursor.y) * ease;

    const gl     = this.gl;
    const canvas = this.canvasRef.nativeElement;
    const t      = (Date.now() - this.startTime) / 1000;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.uTime,   t);
    gl.uniform2f(this.uRes,    canvas.width, canvas.height);
    gl.uniform2f(this.uCursor, this.cursor.x, this.cursor.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.raf = requestAnimationFrame(() => this.loop());
  }
}
