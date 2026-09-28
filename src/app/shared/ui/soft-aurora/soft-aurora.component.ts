import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  NgZone,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const VERTEX = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x); float cy = ceil(y); float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

@Component({
  selector: 'app-soft-aurora',
  standalone: true,
  template: `<div #container class="soft-aurora-container"></div>`,
  styleUrls: ['./soft-aurora.component.css']
})
export class SoftAuroraComponent implements AfterViewInit, OnDestroy {
  @Input() speed = 0.6;
  @Input() scale = 1.5;
  @Input() brightness = 1.0;
  @Input() color1 = '#f7f7f7';
  @Input() color2 = '#e100ff';
  @Input() noiseFrequency = 2.5;
  @Input() noiseAmplitude = 1.0;
  @Input() bandHeight = 0.5;
  @Input() bandSpread = 1.0;
  @Input() octaveDecay = 0.1;
  @Input() layerOffset = 0;
  @Input() colorSpeed = 1.0;
  @Input() enableMouseInteraction = true;
  @Input() mouseInfluence = 0.25;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private renderer: Renderer | null = null;
  private program: Program | null = null;
  private animationFrameId = 0;
  private currentMouse: [number, number] = [0.5, 0.5];
  private targetMouse: [number, number] = [0.5, 0.5];
  private resizeListener = () => this.resize();
  private mouseMoveListener = (e: MouseEvent) => this.handleMouseMove(e);
  private mouseLeaveListener = () => { this.targetMouse = [0.5, 0.5]; };

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => this.init());
  }

  private handleMouseMove(e: MouseEvent): void {
    const canvas = this.renderer?.gl.canvas as HTMLCanvasElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.targetMouse = [
      (e.clientX - rect.left) / rect.width,
      1.0 - (e.clientY - rect.top) / rect.height
    ];
  }

  private init(): void {
    const container = this.containerRef.nativeElement;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    this.renderer = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime:           { value: 0 },
        uResolution:     { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uSpeed:          { value: this.speed },
        uScale:          { value: this.scale },
        uBrightness:     { value: this.brightness },
        uColor1:         { value: hexToVec3(this.color1) },
        uColor2:         { value: hexToVec3(this.color2) },
        uNoiseFreq:      { value: this.noiseFrequency },
        uNoiseAmp:       { value: this.noiseAmplitude },
        uBandHeight:     { value: this.bandHeight },
        uBandSpread:     { value: this.bandSpread },
        uOctaveDecay:    { value: this.octaveDecay },
        uLayerOffset:    { value: this.layerOffset },
        uColorSpeed:     { value: this.colorSpeed },
        uMouse:          { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: this.mouseInfluence },
        uEnableMouse:    { value: this.enableMouseInteraction }
      }
    });
    this.program = program;

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    if (this.enableMouseInteraction) {
      gl.canvas.addEventListener('mousemove', this.mouseMoveListener);
      gl.canvas.addEventListener('mouseleave', this.mouseLeaveListener);
    }

    const update = (time: number) => {
      this.animationFrameId = requestAnimationFrame(update);
      program.uniforms['uTime'].value = time * 0.001;

      if (this.enableMouseInteraction) {
        this.currentMouse[0] += 0.05 * (this.targetMouse[0] - this.currentMouse[0]);
        this.currentMouse[1] += 0.05 * (this.targetMouse[1] - this.currentMouse[1]);
        program.uniforms['uMouse'].value[0] = this.currentMouse[0];
        program.uniforms['uMouse'].value[1] = this.currentMouse[1];
      }

      renderer.render({ scene: mesh });
    };
    this.animationFrameId = requestAnimationFrame(update);

    window.addEventListener('resize', this.resizeListener);
    this.resize();
  }

  private resize(): void {
    const container = this.containerRef?.nativeElement;
    if (!container || !this.renderer || !this.program) return;
    this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    const gl = this.renderer.gl;
    this.program.uniforms['uResolution'].value = [
      gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height
    ];
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeListener);

    const gl = this.renderer?.gl;
    const canvas = gl?.canvas as HTMLCanvasElement | undefined;
    if (canvas && this.enableMouseInteraction) {
      canvas.removeEventListener('mousemove', this.mouseMoveListener);
      canvas.removeEventListener('mouseleave', this.mouseLeaveListener);
    }
    const container = this.containerRef?.nativeElement;
    if (container && canvas && canvas.parentNode === container) {
      container.removeChild(canvas);
    }
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
