import { Component, Input, Output, EventEmitter, HostBinding, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-asset-card',
  standalone: true,
  imports: [],
  templateUrl: './asset-card.component.html',
  styleUrl: './asset-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetCardComponent {
  @Input() tag = '';
  @Input() tagColor: 'blue' | 'violet' | 'amber' | 'teal' = 'blue';
  @Input() rating?: string;
  @Input() title = '';
  @Input() description = '';
  @Input() users?: string;
  @Input() uses?: string;
  @Input() access = '';               // 'Restricted' | 'ADB Only' | 'Open' | ''
  @Input() restricted = false;        // backward compat — used when access is not passed
  @Input() rai = false;
  @Input() governanceVerified = false;
  @Input() verificationInProgress = false;
  @Input() selected = false;
  @Input() showToggle = false;
  @Input() saved = false;
  @Input() isNew = false;
  @Input() showFooter = true;
  @Input() unlisted = false;
  @Input() sectorTag = '';
  @Input() geoTag = '';
  @Input() themes: string[] = [];
  @Input() showAddToWorkspace = true;
  @Input() addToWorkspaceDisabled = false;
  @Input() ctaDisabled = false;
  @Input() ctaLabelOverride = '';
  @HostBinding('class.ac--unlisted') get unlistedClass() { return this.unlisted; }
  @Output() addClick  = new EventEmitter<MouseEvent>();
  @Output() saveClick = new EventEmitter<MouseEvent>();

  onAddClick(event: MouseEvent) {
    event.stopPropagation();
    this.addClick.emit(event);
  }

  onSaveClick(event: MouseEvent) {
    event.stopPropagation();
    this.saveClick.emit(event);
  }

  get tagChipStyle(): { background: string; color: string } {
    const map: Record<string, { background: string; color: string }> = {
      'Dataset':     { background: 'rgba(0, 125, 183, 0.08)',   color: '#007DB7' },  // ADB primary blue
      'Dashboard':   { background: 'rgba(99, 204, 236, 0.10)',  color: '#63CCEC' },  // accent.lightBlue
      'AI Agent':    { background: 'rgba(141, 198, 63, 0.10)',  color: '#8DC63F' },  // accent.green
      'AI Tool':     { background: 'rgba(245, 127, 41, 0.10)',  color: '#F57F29' },  // accent.orange
      'AI Product': { background: 'rgba(0, 182, 218, 0.10)',   color: '#00B6DA' },  // accent.cyan
      'API':         { background: 'rgba(242, 200, 0, 0.12)',   color: '#F2C800' },  // accent.yellow
    };
    return map[this.tag] ?? { background: 'rgba(0, 125, 183, 0.10)', color: '#005F8E' };
  }

  get ctaLabel(): string {
    if (this.ctaLabelOverride) return this.ctaLabelOverride;
    const map: Record<string, string> = {
      'Dataset':          'Download',
      'Corpus Document':  'Download',
      'API':              'Call API',
      'AI Agent':         'Request API Key',
      'AI Tool':          'Request API Key',
      'AI Product':    'Launch AI Product',
      'Dashboard':        'Request API Key',
    };
    return map[this.tag] ?? 'Open';
  }

  private get _visibleCount(): number {
    if (this.themes.length <= 1) return this.themes.length;
    // Estimate chip widths: ~5px per char at 10px font + 16px horizontal padding
    const chipW = (t: string) => t.length * 5 + 16;
    const gap = 5;
    const available = 240; // conservative themes container width
    const overflowChipW = this.themes.length > 2 ? gap + 28 : 0;
    return chipW(this.themes[0]) + gap + chipW(this.themes[1]) + overflowChipW <= available ? 2 : 1;
  }

  get visibleThemes(): string[]  { return this.themes.slice(0, this._visibleCount); }
  get themeOverflow(): number    { return Math.max(0, this.themes.length - this._visibleCount); }
  get themeOverflowTip(): string { return this.themes.slice(this._visibleCount).join(', '); }

  get effectiveCtaDisabled(): boolean {
    return this.ctaDisabled;
  }
}
