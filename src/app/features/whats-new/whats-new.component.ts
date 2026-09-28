import {
  Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuroraLightComponent } from '../../shared/ui/aurora-light/aurora-light.component';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// ── Particle-fabric shaders ───────────────────────────────────────────────────
// Geometry: spherical UV grid (sPhi, sTheta) used purely as a 2D parameter
// domain. All three axes are displaced independently with layered sinusoidal
// noise — this breaks spherical symmetry completely, creating irregular lobes,
// concave/convex folds, and overlapping sections.
const SPHERE_VERT = `
attribute float sPhi;
attribute float sTheta;
uniform float uTime;
uniform float uDpr;
varying float vCamZ;
varying float vColorT;

// Layered 3-axis displacement. Each axis gets different frequencies/phases so
// the three components deform independently — the silhouette becomes irregular
// and sections fold around each other rather than inflating uniformly.
vec3 deform(float phi, float theta, float t) {
  // Low frequency — large folds (dominant visual structure)
  float dx = sin(phi * 1.7 + theta * 0.9 + t * 0.29) * 0.40
           + sin(phi * 0.6 - theta * 1.5 - t * 0.22) * 0.26;
  float dy = sin(theta * 1.5 + phi * 1.2 - t * 0.25) * 0.40
           + sin(phi * 2.1 - theta * 0.7 + t * 0.20) * 0.26;
  float dz = sin(phi * 1.3 + theta * 2.0 + t * 0.23) * 0.40
           + sin(theta * 0.8 - phi * 1.8 - t * 0.18) * 0.26;

  // Medium frequency — secondary undulations
  dx += sin(phi * 3.1 + theta * 1.8 - t * 0.40) * 0.13
      + sin(phi * 2.4 - theta * 2.7 + t * 0.33) * 0.08;
  dy += sin(theta * 3.4 - phi * 1.4 + t * 0.37) * 0.13
      + sin(phi * 3.7 + theta * 0.9 - t * 0.28) * 0.08;
  dz += sin(phi * 2.7 + theta * 3.1 - t * 0.34) * 0.13
      + sin(theta * 2.5 + phi * 2.2 + t * 0.26) * 0.08;

  // High frequency — surface micro-detail
  dx += sin(phi * 5.2 + theta * 3.9 + t * 0.58) * 0.04;
  dy += sin(theta * 4.8 - phi * 4.3 - t * 0.53) * 0.04;
  dz += sin(phi * 4.6 + theta * 5.1 + t * 0.49) * 0.04;

  return vec3(dx, dy, dz);
}

void main() {
  float t = uTime;

  // Base unit-sphere surface — serves only as the 2D parameter domain
  float bx = sin(sPhi) * cos(sTheta);
  float by = cos(sPhi);
  float bz = sin(sPhi) * sin(sTheta);

  vec3 d = deform(sPhi, sTheta, t);

  float R = 155.0;
  // Subtle breathing — ±4 % scale over ~35 s period
  float breathe = 1.0 + sin(t * 0.18) * 0.04;
  vec3 pos = vec3(R * (bx + d.x), R * (by + d.y), R * (bz + d.z)) * breathe;

  // Very slow overall drift — not perceptible as rotation, just organic motion
  float a   = t * 0.035;
  float cosA = cos(a), sinA = sin(a);
  pos = vec3(pos.x * cosA - pos.z * sinA, pos.y, pos.x * sinA + pos.z * cosA);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vCamZ = mvPos.z;

  // Color coordinate: primarily y-based (top=cyan, bottom=violet),
  // with slight theta modulation for visual interest within each row.
  float yNorm    = clamp(pos.y / (R * 1.9) + 0.5, 0.0, 1.0);
  float thetaNorm = sTheta / 6.2832;
  vColorT = yNorm * 0.82 + thetaNorm * 0.18;

  // Perspective point-size attenuation — front: ~8 px, center: ~4 px, back: ~2.5 px
  gl_PointSize = 2.0 * (500.0 / -mvPos.z) * uDpr;
  gl_Position  = projectionMatrix * mvPos;
}
`;

const SPHERE_FRAG = `
varying float vCamZ;
varying float vColorT;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;

  // Crisp dot — only a thin soft feather at the very edge
  float edge = 1.0 - smoothstep(0.40, 0.50, d);

  // 4-stop gradient matching the hero aurora: sky-blue → ADB blue → teal → aurora-green
  vec3 skyBlue  = vec3(0.329, 0.769, 0.929); // #54c4ed  aurora blue
  vec3 adbBlue  = vec3(0.0,   0.490, 0.718); // #007DB7  ADB brand blue
  vec3 teal     = vec3(0.220, 0.690, 0.580); // #38B094  blue-green bridge
  vec3 green    = vec3(0.643, 0.820, 0.396); // #a4d165  aurora green

  vec3 color;
  float t = clamp(vColorT, 0.0, 1.0);
  if (t < 0.333) {
    color = mix(green, teal, t / 0.333);
  } else if (t < 0.667) {
    color = mix(teal, adbBlue, (t - 0.333) / 0.334);
  } else {
    color = mix(adbBlue, skyBlue, (t - 0.667) / 0.333);
  }

  // Depth-based opacity — back particles fade but stay visible (min 0.22)
  // so folds read as genuinely 3D rather than as a transparent shell.
  // Near: z_cam ≈ -240, Far: z_cam ≈ -850 → span ≈ 610
  float depth = clamp((-vCamZ - 240.0) / 610.0, 0.0, 1.0);
  float alpha  = mix(0.95, 0.22, depth) * edge;

  gl_FragColor = vec4(color, alpha);
}
`;

// ── Gradient shader ──────────────────────────────────────────────────────────
// A single fullscreen-triangle WebGL canvas spans from the hero's gradient
// start through the unlocks section's fade-out point (positioned/sized by
// initGradientCanvas). Rendering both zones from one shader — instead of two
// independently-tuned CSS gradients on separate elements — guarantees the
// color field is pixel-continuous across the section boundary; two hand-tuned
// CSS layers kept drifting out of sync at the seam.

const GRADIENT_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const GRADIENT_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec4 uAlphaStops; // fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd (local uv.y, 0=top)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // Organic flow field — two octave-shifted fbm samples drifting at
  // different rates so the blend line never looks like a static gradient.
  vec2 flowP = vec2(uv.x * 2.4, uv.y * 3.2) + vec2(uTime * 0.055, -uTime * 0.032);
  float n  = fbm(flowP);
  float n2 = fbm(flowP * 1.8 + 7.3 - uTime * 0.028);

  float diag = uv.x * 0.7 + uv.y * 0.3;
  diag += (n - 0.5) * 0.4 + (n2 - 0.5) * 0.18;
  diag = clamp(diag, 0.0, 1.0);

  vec3 blue  = vec3(0.0, 0.4902, 0.7176);  // #007DB7
  vec3 teal  = vec3(0.2275, 0.6118, 0.5804);
  vec3 green = vec3(0.5529, 0.7765, 0.2471); // #8DC63F

  vec3 color = mix(blue, teal, smoothstep(0.0, 0.55, diag));
  color = mix(color, green, smoothstep(0.45, 1.0, diag));

  float alphaIn  = smoothstep(uAlphaStops.x, uAlphaStops.y, uv.y);
  float alphaOut = 1.0 - smoothstep(uAlphaStops.z, uAlphaStops.w, uv.y);
  float intensity = clamp(alphaIn * alphaOut, 0.0, 1.0);

  // Breathing shimmer, phase-shifted by position so it ripples rather
  // than pulsing uniformly.
  intensity *= 0.78 + 0.22 * sin(uTime * 0.28 + uv.y * 4.0 + uv.x * 2.0);
  intensity *= 0.52;

  // Blend against white in the shader and output fully opaque — avoids the
  // double-darkening caused by premultiplied-alpha mismatch on canvas compositing.
  gl_FragColor = vec4(mix(vec3(1.0), color, intensity), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

type UnlocksTab = 'discover' | 'connect' | 'reuse';

interface RoadmapItem {
  quarter: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-whats-new',
  standalone: true,
  imports: [CommonModule, AuroraLightComponent],
  templateUrl: './whats-new.component.html',
  styleUrl: './whats-new.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsNewComponent implements AfterViewInit, OnDestroy {
  readonly router = inject(Router);
  readonly el     = inject(ElementRef<HTMLElement>);

  @ViewChild('heroVideo') heroVideoRef?: ElementRef<HTMLVideoElement>;

  activeTab = signal<UnlocksTab>('discover');

  readonly tabs: { id: UnlocksTab; label: string }[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'connect',  label: 'Connect' },
    { id: 'reuse',    label: 'Reuse' },
  ];

  readonly intentWords = ['Discovery', 'Connection', 'Reuse', 'Impact'] as const;

  readonly tabContent: Record<UnlocksTab, { accent: string; titleRest: string; body: string[] }> = {
    discover: {
      accent: 'Discover',
      titleRest: ' existing capabilities',
      body: [
        'Discover assets across ADB and connect with the people behind them. DataNex+ brings data, AI tools and other assets into one place, with clear ownership so you can find what already exists and who to engage.',
        'Make better-informed decisions and build on what already exists instead of starting from scratch.',
      ],
    },
    connect: {
      accent: 'Connect',
      titleRest: ' people, data and ways of working',
      body: [
        'Connect people around the data, assets and repeatable approaches that support their work. DataNex+ makes it easier to share knowledge, collaborate through Workspaces, and carry proven ways of working across teams.',
        'Spend less time rebuilding context and make successful approaches easier to repeat across ADB.',
      ],
    },
    reuse: {
      accent: 'Reuse',
      titleRest: ' and contribute back',
      body: [
        'Turn data held across ADB into shared, reusable value. By giving people a unified place to contribute and publish the data they hold, DataNex+ makes institutional knowledge available beyond the teams that created it.',
        'Reduce duplication and unlock greater value from data already held across ADB.',
      ],
    },
  };

  readonly roadmapItems: RoadmapItem[] = [
    {
      quarter: 'Milestone 1',
      title: 'Richer Assets, Effortless Discovery',
      desc: 'Expand the catalog with richer data products and additional reusable capabilities such as eligible models and dashboards.\n\nDeeper ADB context, semantic retrieval, and richer filters make discovery more relevant, while supported assets can increasingly be explored or interacted with directly within DataNex+ before users decide how to access or reuse them.',
    },
    {
      quarter: 'Milestone 2',
      title: 'From Discovery to Action',
      desc: 'Move beyond finding assets to reusing them in ADB\'s work via APIs, connectors, and approved integration patterns. Use Cases show how ADB has applied capabilities before, while curated Collections feature assets around common needs.\n\nAsset owners can also contribute reusable capabilities through a streamlined onboarding process with governance, access, and Responsible AI embedded into the workflow.',
    },
    {
      quarter: 'Milestone 3',
      title: 'Build Smarter, Orchestrate with Trust',
      desc: 'Build new solutions and workflows by combining trusted datasets, models, agents, tools, and other reusable capabilities already available across ADB.\n\nDataNex+ evolves into a governed orchestration environment for multi-model and agentic workflows, with human oversight, governance standards, and Responsible AI applied throughout execution.',
    },
  ];

  ngAfterViewInit(): void {
    const video = this.heroVideoRef?.nativeElement;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }

    const host = this.el.nativeElement;

    // Paint the same gradient on the app-shell so the glass nav has something to blur.
    // app-shell lives outside this component (sibling of app-content), so its background
    // would otherwise be the plain --th-bg token. background-attachment:fixed keeps it
    // viewport-anchored so it matches the :host gradient exactly.
    const appShell = document.querySelector('.app-shell') as HTMLElement | null;
    if (appShell) {
      appShell.style.background = 'linear-gradient(160deg, #eaf5fb 0%, #eaf7f5 50%, #eef9ee 100%)';
      appShell.style.backgroundAttachment = 'fixed';
      this.gradientCleanupFns.push(() => {
        appShell.style.removeProperty('background');
        appShell.style.removeProperty('background-attachment');
      });
    }

    // Track nav width so the fixed sphere stays centred in the content area
    const navEl = document.querySelector('.nav') as HTMLElement | null;
    const syncNavW = () =>
      host.style.setProperty('--nav-w', (navEl?.offsetWidth ?? 260) + 'px');
    syncNavW();
    if (navEl) {
      const navRO = new ResizeObserver(syncNavW);
      navRO.observe(navEl);
      this.gradientCleanupFns.push(() => navRO.disconnect());
    }

    ScrollTrigger.defaults({ scroller: host });

    // Hero entrance — staggered lines
    gsap.from(['.wn__hero-badge', '.wn__hero-h1', '.wn__hero-sub', '.wn__hero-cta', '.wn__hero-frame'], {
      y: 36, opacity: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out', delay: 0.15,
    });

    // Generic section reveals
    gsap.utils.toArray<HTMLElement>('.wn__reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        y: 22, opacity: 0, duration: 0.65, ease: 'power2.out',
      });
    });

    // Value cards — staggered reveal one by one
    const cards = host.querySelectorAll('.wn__value-card') as NodeListOf<HTMLElement>;
    if (cards.length) {
      gsap.from(Array.from(cards), {
        scrollTrigger: { trigger: host.querySelector('.wn__value-cards'), start: 'top 82%', toggleActions: 'play none none none' },
        y: 36, opacity: 0, duration: 0.9, ease: 'power2.out', stagger: 0.2,
      });
    }

    this.initGradientCanvas();
    this.initParticleSphere();
    this.initSphereSharpObserver();
    this.initAssetCounters();
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this.gradientRaf !== undefined) cancelAnimationFrame(this.gradientRaf);
    if (this.sphereRaf   !== undefined) cancelAnimationFrame(this.sphereRaf);
    this.sphereRenderer?.dispose();
    this.gradientCleanupFns.forEach(fn => fn());
  }

  setTab(id: UnlocksTab): void {
    this.activeTab.set(id);
  }

  signIn(): void {
    this.router.navigate(['/']);
  }

  navigateToDiscover()   { this.router.navigate(['/home']); }
  navigateToAssets()     { this.router.navigate(['/catalogue']); }
  navigateToContribute() { this.router.navigate(['/contribute']); }

  private gradientRaf?: number;
  private sphereRaf?: number;
  private sphereRenderer?: THREE.WebGLRenderer;
  private readonly gradientCleanupFns: Array<() => void> = [];

  private initParticleSphere(): void {
    const host   = this.el.nativeElement;
    const canvas = host.querySelector('.wn__sphere') as HTMLCanvasElement | null;
    if (!canvas) return;

    const size = 640;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    this.sphereRenderer = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 1, 2000);
    camera.position.z = 540;

    // Dense UV grid — 105×105 = ~11 k particles.
    // Skipping poles avoids crowding at the convergence points while keeping
    // the lat/lon parameterisation for the deform() function in the shader.
    const N_LAT = 105, N_LON = 105;
    const count = (N_LAT - 1) * N_LON;
    const phiArr   = new Float32Array(count);
    const thetaArr = new Float32Array(count);
    let idx = 0;
    for (let lat = 1; lat < N_LAT; lat++) {
      for (let lon = 0; lon < N_LON; lon++) {
        phiArr[idx]   = (lat / N_LAT) * Math.PI;
        thetaArr[idx] = (lon / N_LON) * Math.PI * 2;
        idx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    // Dummy zero positions — actual world positions are computed entirely in
    // the vertex shader from sPhi/sTheta. frustumCulled is disabled below.
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('sPhi',   new THREE.BufferAttribute(phiArr,   1));
    geo.setAttribute('sTheta', new THREE.BufferAttribute(thetaArr, 1));

    const dpr = Math.min(window.devicePixelRatio, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms:       { uTime: { value: 0 }, uDpr: { value: dpr } },
      vertexShader:   SPHERE_VERT,
      fragmentShader: SPHERE_FRAG,
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();

    // Pause rendering when canvas is fully off-screen (IntersectionObserver)
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    this.gradientCleanupFns.push(() => io.disconnect());

    const animate = (): void => {
      this.sphereRaf = requestAnimationFrame(animate);
      if (!visible) return;
      if (!reduceMotion) mat.uniforms['uTime'].value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    };
    animate();
  }

  private initGradientCanvas(): void {
    const host = this.el.nativeElement;
    const canvas    = host.querySelector('.wn__gradient') as HTMLCanvasElement | null;
    const wnEl      = host.querySelector('.wn') as HTMLElement | null;
    const heroEl    = host.querySelector('.wn__hero') as HTMLElement | null;
    const unlocksEl = host.querySelector('.wn__unlocks') as HTMLElement | null;
    if (!canvas || !wnEl || !heroEl || !unlocksEl) return;

    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return; // no WebGL support — page still reads fine on plain white

    const vert = compileShader(gl, gl.VERTEX_SHADER, GRADIENT_VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FRAG);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    // One oversized triangle covering clip space — cheaper than a quad, no index buffer needed.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime       = gl.getUniformLocation(program, 'uTime');
    const uAlphaStops = gl.getUniformLocation(program, 'uAlphaStops');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const reposition = (): void => {
      const wnRect      = wnEl.getBoundingClientRect();
      const heroRect    = heroEl.getBoundingClientRect();
      const unlocksRect = unlocksEl.getBoundingClientRect();

      const bandHeight = window.innerWidth <= 960 ? 380 : 620;
      const topPx     = (heroRect.bottom - wnRect.top) - bandHeight;
      const fadeEndPx = (unlocksRect.top - wnRect.top) + unlocksRect.height * 0.62;
      const heightPx  = Math.max(fadeEndPx - topPx, 1);

      canvas.style.top    = `${topPx}px`;
      canvas.style.height = `${heightPx}px`;
      canvas.width  = Math.round(wnRect.width * dpr);
      canvas.height = Math.round(heightPx * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      const fadeInEnd    = Math.min((bandHeight * 0.55) / heightPx, 1);
      const fadeOutSpan  = (unlocksRect.height * 0.62) / heightPx;
      const fadeOutStart = Math.max(1 - fadeOutSpan, fadeInEnd);
      gl.uniform4f(uAlphaStops, 0, fadeInEnd, fadeOutStart, 1);
    };

    reposition();
    const ro = new ResizeObserver(() => reposition());
    ro.observe(wnEl);
    this.gradientCleanupFns.push(() => ro.disconnect());

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    const draw = (t: number): void => {
      gl.uniform1f(uTime, reduceMotion ? 0 : (t - start) / 1000);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduceMotion) this.gradientRaf = requestAnimationFrame(draw);
    };
    draw(start);
  }

  private initAssetCounters(): void {
    const host = this.el.nativeElement;
    const counters = host.querySelectorAll('.wn__assets-count') as NodeListOf<HTMLElement>;
    if (!counters.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset['target'] ?? '0', 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 3.2,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.val).toString() + (el.dataset['suffix'] ?? ''); },
          onComplete: () => { el.textContent = target.toString() + (el.dataset['suffix'] ?? ''); },
        });
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });

    Array.from<HTMLElement>(counters).forEach(el => obs.observe(el));
    this.gradientCleanupFns.push(() => obs.disconnect());
  }

  private initSphereSharpObserver(): void {
    const host = this.el.nativeElement;
    const heroEl   = host.querySelector('.wn__hero') as HTMLElement | null;
    const sphereEl = host.querySelector('.wn__sphere') as HTMLCanvasElement | null;
    if (!heroEl || !sphereEl) return;

    // Sharp when hero has scrolled mostly out of view; blurry when hero is prominent
    const obs = new IntersectionObserver(
      ([entry]) => sphereEl.classList.toggle('wn__sphere--sharp', entry.intersectionRatio < 0.72),
      { threshold: [0, 0.1, 0.4, 0.72, 1] }
    );
    obs.observe(heroEl);

    // Fade sphere further when assets section is in view
    const assetsEl = host.querySelector('.wn__assets') as HTMLElement | null;
    if (assetsEl && sphereEl) {
      const assetsObs = new IntersectionObserver(
        ([entry]) => sphereEl.classList.toggle('wn__sphere--faded', entry.isIntersecting),
        { threshold: 0.1 }
      );
      assetsObs.observe(assetsEl);
      this.gradientCleanupFns.push(() => assetsObs.disconnect());
    }
    this.gradientCleanupFns.push(() => obs.disconnect());
  }
}
