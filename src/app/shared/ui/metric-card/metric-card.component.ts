import { Component, computed, input, output, signal } from '@angular/core';
import type { KidbObs } from '../world-map/world-map.types';

const FONT = '"Ideal Sans", "Helvetica Neue", Arial, sans-serif';

interface SparklineResult {
  path: string;
  coords: { x: number; y: number }[];
  firstYear: string;
  lastYear: string;
}

function cardColor(key: string, val: number | null): string {
  if (val === null) return '#9ab0c0';
  switch (key) {
    case 'GDP_GROWTH':   return val >= 4 ? '#8DC63F' : val >= 0 ? '#FDB915' : '#E9532B';
    case 'CPI':          return val <= 3 ? '#8DC63F' : val <= 6 ? '#FDB915' : '#E9532B';
    case 'DEBT_GDP':     return val < 50  ? '#8DC63F' : val < 70  ? '#FDB915' : '#E9532B';
    case 'UNEMPLOYMENT': return val < 4   ? '#8DC63F' : val < 7   ? '#FDB915' : '#E9532B';
    case 'CURRENT_ACCT': return val > 0   ? '#8DC63F' : val > -5  ? '#FDB915' : '#E9532B';
    case 'GDP_PC':       return val > 5000 ? '#8DC63F' : val > 2500 ? '#FDB915' : '#E9532B';
    case 'M2_GROWTH':   return val < 8   ? '#8DC63F' : val < 12  ? '#FDB915' : '#E9532B';
    default:             return '#007DB7';
  }
}

function fmtVal(key: string, val: number | null): string {
  if (val === null) return '—';
  if (key === 'REMITTANCES' || key === 'FDI') return `$${Math.round(val)}M`;
  if (key === 'GDP_PC') return `$${Math.round(val).toLocaleString()}`;
  if (key === 'EXCHANGE_RATE') return val.toFixed(2);
  return `${val.toFixed(1)}%`;
}

function isHigherBetter(key: string): boolean {
  return ['GDP_GROWTH', 'REMITTANCES', 'FDI', 'GDP_PC', 'CURRENT_ACCT'].includes(key);
}

function isRatePct(key: string): boolean {
  return !['REMITTANCES', 'FDI', 'GDP_PC', 'EXCHANGE_RATE'].includes(key);
}

function buildSparkline(obs: KidbObs[], economy: string): SparklineResult | null {
  const pts = obs
    .filter(o => o.economy === economy && o.value !== null && /^\d{4}$/.test(o.period))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-5);
  if (pts.length < 2) return null;
  const vals = pts.map(p => p.value!);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const rng = hi - lo || 1;
  const W = 100, H = 40, pad = 6;
  const coords = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: H - pad - ((v - lo) / rng) * (H - pad * 2),
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  return { path, coords, firstYear: pts[0].period.slice(0, 4), lastYear: pts[pts.length - 1].period.slice(0, 4) };
}

function getDelta(obs: KidbObs[], economy: string): { delta: number; prevYear: string } | null {
  const sorted = obs
    .filter(o => o.economy === economy && o.value !== null && /^\d{4}$/.test(o.period))
    .sort((a, b) => b.period.localeCompare(a.period));
  const latest = sorted[0], prev = sorted[1];
  if (!latest || !prev || latest.value === null || prev.value === null) return null;
  return { delta: latest.value - prev.value, prevYear: prev.period.slice(0, 4) };
}

function getRegionalStats(
  obs: KidbObs[],
  economy: string,
  allEconomies: string[],
): { avg: number; rank: number | null; total: number } | null {
  const latestVals = allEconomies.map(code => {
    const e = obs
      .filter(o => o.economy === code && o.value !== null && /^\d{4}$/.test(o.period))
      .sort((a, b) => b.period.localeCompare(a.period))[0];
    return { code, value: e?.value ?? null };
  }).filter((x): x is { code: string; value: number } => x.value !== null);

  if (!latestVals.length) return null;
  const avg = latestVals.reduce((s, x) => s + x.value, 0) / latestVals.length;
  const sorted = [...latestVals].sort((a, b) => b.value - a.value);
  const rank = sorted.findIndex(x => x.code === economy) + 1;
  return { avg, rank: rank > 0 ? rank : null, total: latestVals.length };
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
})
export class MetricCardComponent {
  readonly indKey       = input.required<string>();
  readonly label        = input.required<string>();
  readonly unit         = input<string>('');
  readonly obs          = input<KidbObs[]>([]);
  readonly economy      = input.required<string>();
  readonly allEconomies = input<string[]>([]);
  readonly isDark       = input<boolean>(false);
  readonly aiInsight    = input<string | undefined>(undefined);

  readonly remove = output<void>();

  readonly insightOpen = signal(false);

  protected readonly font = FONT;

  protected readonly bg    = computed(() => this.isDark() ? '#0c1b36' : '#ffffff');
  protected readonly bdr   = computed(() => this.isDark() ? '#1a3050' : '#e4edf5');
  protected readonly txt   = computed(() => this.isDark() ? '#d0e4f4' : '#1e3a5f');
  protected readonly muted = computed(() => this.isDark() ? '#5a7a96' : '#7a98b4');

  protected readonly latestVal = computed(() => {
    const entry = this.obs()
      .filter(o => o.economy === this.economy() && o.value !== null && /^\d{4}$/.test(o.period))
      .sort((a, b) => b.period.localeCompare(a.period))[0];
    return entry?.value ?? null;
  });

  protected readonly col      = computed(() => cardColor(this.indKey(), this.latestVal()));
  protected readonly spark    = computed(() => buildSparkline(this.obs(), this.economy()));
  protected readonly delta    = computed(() => getDelta(this.obs(), this.economy()));
  protected readonly regional = computed(() => getRegionalStats(this.obs(), this.economy(), this.allEconomies()));

  protected readonly isUp = computed(() => (this.delta()?.delta ?? 0) > 0);

  protected readonly dCol = computed(() => {
    const d = this.delta();
    if (!d) return this.muted();
    return isHigherBetter(this.indKey())
      ? (d.delta > 0 ? '#8DC63F' : '#E9532B')
      : (d.delta < 0 ? '#8DC63F' : '#E9532B');
  });

  protected readonly dStr = computed(() => {
    const d = this.delta();
    if (!d) return null;
    const up = this.isUp();
    return isRatePct(this.indKey())
      ? `${up ? '+' : ''}${d.delta.toFixed(1)} pp`
      : `${up ? '+' : ''}${Math.abs(d.delta).toFixed(1)}`;
  });

  protected readonly latestValStr   = computed(() => fmtVal(this.indKey(), this.latestVal()));
  protected readonly regionalAvgStr = computed(() => {
    const r = this.regional();
    return r ? fmtVal(this.indKey(), r.avg) : '';
  });
  protected readonly rankStr = computed(() => {
    const r = this.regional();
    return r && r.rank !== null ? `${r.rank} / ${r.total}` : '—';
  });
  protected readonly rankTooltip = computed(() => {
    const r = this.regional();
    return r ? `Ranked by latest available value among ${r.total} Pacific ADB member economies` : '';
  });
  protected readonly numFmt  = "'lnum' 1, 'tnum' 1";
  protected readonly lnumFmt = "'lnum' 1";

  protected readonly fillGradientId = computed(() => `fill-${this.indKey()}`);
  protected readonly sparkFillPath  = computed(() => {
    const sp = this.spark();
    return sp ? `${sp.path} L100,40 L0,40 Z` : '';
  });
}
