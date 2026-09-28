import {
  Component, ElementRef, ViewChild, input, output,
  AfterViewInit, OnDestroy, signal,
  inject, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ISO_TO_REGION,
  LEAFLET_FLAG_ISO,
  ISO2_TO_ADB,
  REGION_FILLS,
  REGION_FILLS_DARK,
  COUNTRY_NAMES,
} from './world-map.data';

interface Tooltip { visible: boolean; x: number; y: number; label: string; }

interface CountryCard {
  iso2: string;
  name: string;
  adb: string;
  region: string;
  regionName: string;
  accentColor: string;
  badgeBg: string;
}

const REGION_NAMES: Record<string, string> = {
  cwrd: 'Central & West Asia',
  sard: 'South Asia',
  eard: 'East Asia',
  serd: 'Southeast Asia',
  pard: 'Pacific',
};

@Component({
  selector: 'app-world-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldMapComponent implements AfterViewInit, OnDestroy {
  activeEconomies  = input<string[]>([]);
  isDark           = input<boolean>(false);
  viewBoxOverride  = input<string | null>(null);
  markers          = input<Array<{ left: number; top: number; label: string }>>([]);
  hideCard         = input<boolean>(false);

  countrySelect = output<string>();
  regionSelect  = output<string>();

  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLDivElement>;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr       = inject(ChangeDetectorRef);

  safeHtml       = signal<SafeHtml>('');
  mapTransform   = signal('translate(0px,0px) scale(1)');
  tooltip        = signal<Tooltip>({ visible: false, x: 0, y: 0, label: '' });
  selectedCard   = signal<CountryCard | null>(null);

  private scale           = 1;
  private dx              = 0;
  private dy              = 0;
  private panning         = false;
  private hasPanned       = false;
  private panStartX       = 0;
  private panStartY       = 0;
  private panStartDx      = 0;
  private panStartDy      = 0;
  private selectedIso2    = '';

  private readonly onDocMouseMove = (e: MouseEvent): void => {
    if (!this.panning) return;
    const mdx = e.clientX - this.panStartX;
    const mdy = e.clientY - this.panStartY;
    if (Math.abs(mdx) > 4 || Math.abs(mdy) > 4) this.hasPanned = true;
    this.dx = this.panStartDx + mdx;
    this.dy = this.panStartDy + mdy;
    this.updateTransform();
    this.cdr.markForCheck();
  };

  private readonly onDocMouseUp = (): void => {
    this.panning = false;
    if (this.wrapperRef) this.wrapperRef.nativeElement.style.cursor = 'grab';
  };

  ngAfterViewInit(): void {
    document.addEventListener('mousemove', this.onDocMouseMove);
    document.addEventListener('mouseup', this.onDocMouseUp);

    fetch('/world-map-coded.svg')
      .then(r => r.text())
      .then(svg => {
        let clean = svg
          .replace(/<\?xml[^>]*\?>/g, '')
          .replace(/<!DOCTYPE[^>[\]]*(?:\[[^\]]*\])?\s*>/g, '');
        const vbo = this.viewBoxOverride();
        if (vbo) {
          clean = clean.replace(/(<svg[^>]*)\bviewBox="[^"]*"/, `$1viewBox="${vbo}"`);
          // Remove any existing preserveAspectRatio then force "none" so marker %
          // positions map directly to SVG coordinates without letterboxing
          clean = clean.replace(/\s*preserveAspectRatio="[^"]*"/, '');
          clean = clean.replace('<svg ', '<svg preserveAspectRatio="none" ');
        }
        this.safeHtml.set(this.sanitizer.bypassSecurityTrustHtml(clean));
        this.cdr.markForCheck();
        setTimeout(() => this.applyMapDecorations(), 0);
      });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDocMouseMove);
    document.removeEventListener('mouseup', this.onDocMouseUp);
  }

  private updateTransform(): void {
    this.mapTransform.set(`translate(${this.dx}px,${this.dy}px) scale(${this.scale})`);
  }

  private getFill(iso2: string, active: boolean): string {
    const isDark = this.isDark();
    const fills  = isDark ? REGION_FILLS_DARK : REGION_FILLS;
    const region = ISO_TO_REGION[iso2];
    const rc     = region && region !== 'nmem' ? fills[region] : null;
    if (!rc) return isDark ? '#1e2d3e' : '#e6eaee';
    return active ? rc[0] : rc[1];
  }

  private paintPaths(iso2: string, active: boolean): void {
    const el = this.wrapperRef?.nativeElement;
    if (!el) return;
    const fill   = this.getFill(iso2, active);
    const border = this.isDark() ? 'rgba(12,27,54,0.4)' : 'rgba(255,255,255,0.9)';
    const applyTo = (path: SVGPathElement) => {
      path.setAttribute('fill', fill);
      path.setAttribute('stroke', border);
      path.setAttribute('stroke-width', '0.5');
    };
    const direct = el.querySelector<SVGPathElement>(`path#${CSS.escape(iso2)}`);
    if (direct) applyTo(direct);
    const group = el.querySelector<SVGGElement>(`g#${CSS.escape(iso2)}`);
    if (group) group.querySelectorAll<SVGPathElement>('path').forEach(applyTo);
  }

  private applyMapDecorations(): void {
    const el = this.wrapperRef?.nativeElement;
    if (!el) return;
    const isDark  = this.isDark();
    const fills   = isDark ? REGION_FILLS_DARK : REGION_FILLS;
    const neutral = isDark ? '#1e2d3e' : '#e6eaee';
    const border  = isDark ? 'rgba(12,27,54,0.4)' : 'rgba(255,255,255,0.9)';
    const activeSet = new Set(
      this.activeEconomies().map(c => LEAFLET_FLAG_ISO[c]).filter(Boolean)
    );

    const paint = (path: SVGPathElement, iso2: string) => {
      const region = ISO_TO_REGION[iso2];
      const rc     = region && region !== 'nmem' ? fills[region] : null;
      const isSelected = iso2 === this.selectedIso2;
      const fill   = rc ? (isSelected || activeSet.has(iso2) ? rc[0] : rc[1]) : neutral;
      path.setAttribute('fill', fill);
      path.setAttribute('stroke', border);
      path.setAttribute('stroke-width', '0.5');
    };

    el.querySelectorAll<SVGPathElement>('path[id]').forEach(path => {
      paint(path, path.id.toLowerCase());
    });

    el.querySelectorAll<SVGGElement>('g[id]').forEach(g => {
      const iso2 = g.id.toLowerCase();
      g.querySelectorAll<SVGPathElement>('path').forEach(path => paint(path, iso2));
    });
  }

  onPanStart(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.panning    = true;
    this.hasPanned  = false;
    this.panStartX  = e.clientX;
    this.panStartY  = e.clientY;
    this.panStartDx = this.dx;
    this.panStartDy = this.dy;
    this.wrapperRef.nativeElement.style.cursor = 'grabbing';
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const rect   = this.wrapperRef.nativeElement.getBoundingClientRect();
    const cx     = e.clientX - rect.left;
    const cy     = e.clientY - rect.top;
    this.scale   = Math.max(0.5, Math.min(10, this.scale * factor));
    this.dx      = cx - (cx - this.dx) * factor;
    this.dy      = cy - (cy - this.dy) * factor;
    this.updateTransform();
    this.cdr.markForCheck();
  }

  private getIso2(e: MouseEvent): string | null {
    const el = (e.target as Element).closest('[id]') as Element | null;
    return el ? el.id.toLowerCase() : null;
  }

  onMapClick(e: MouseEvent): void {
    if (this.hasPanned) return;
    const iso2   = this.getIso2(e);
    if (!iso2) return;
    const region = ISO_TO_REGION[iso2];
    if (!region || region === 'nmem') return;

    // Deselect same country toggle
    if (this.selectedIso2 === iso2) {
      this.closeCard();
      return;
    }

    // Restore previous highlight
    if (this.selectedIso2) this.paintPaths(this.selectedIso2, false);

    // Highlight new selection
    this.selectedIso2 = iso2;
    this.paintPaths(iso2, true);

    const fills  = this.isDark() ? REGION_FILLS_DARK : REGION_FILLS;
    const rc     = fills[region];
    const card: CountryCard = {
      iso2,
      name:        COUNTRY_NAMES[iso2] ?? iso2.toUpperCase(),
      adb:         ISO2_TO_ADB[iso2]   ?? iso2.toUpperCase(),
      region,
      regionName:  REGION_NAMES[region] ?? region,
      accentColor: rc?.[0] ?? '#007DB7',
      badgeBg:     rc?.[1] ?? '#bde3f5',
    };
    this.selectedCard.set(card);
    this.cdr.markForCheck();

    this.countrySelect.emit(card.adb);
    this.regionSelect.emit(region);
  }

  closeCard(): void {
    if (this.selectedIso2) {
      this.paintPaths(this.selectedIso2, false);
      this.selectedIso2 = '';
    }
    this.selectedCard.set(null);
    this.cdr.markForCheck();
  }

  onHoverMove(e: MouseEvent): void {
    const iso2  = this.getIso2(e);
    const label = iso2 ? COUNTRY_NAMES[iso2] : null;
    if (!label) { this.tooltip.set({ visible: false, x: 0, y: 0, label: '' }); return; }
    const rect  = this.wrapperRef.nativeElement.getBoundingClientRect();
    this.tooltip.set({ visible: true, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 28, label });
    this.cdr.markForCheck();
  }

  onMouseLeave(): void {
    this.panning = false;
    this.tooltip.set({ visible: false, x: 0, y: 0, label: '' });
    if (this.wrapperRef) this.wrapperRef.nativeElement.style.cursor = 'grab';
  }

  zoomIn():  void { this.scale = Math.min(10, this.scale * 1.3); this.updateTransform(); this.cdr.markForCheck(); }
  zoomOut(): void { this.scale = Math.max(0.5, this.scale / 1.3); this.updateTransform(); this.cdr.markForCheck(); }
}
