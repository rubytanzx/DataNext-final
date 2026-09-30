import { Component, input, computed } from '@angular/core';

const FONT = 'var(--font, "Inter", "Helvetica Neue", Arial, sans-serif)';

@Component({
  selector: 'erdi-watchlist-card',
  standalone: true,
  template: `
    <div [style]="containerStyle()">
      <span [style]="labelStyle()">{{ label() }}</span>
      <span [style]="valueStyle()">{{ value() }}</span>
      @if (status()) {
        <span [style]="statusStyle()">{{ status() }}</span>
      }
    </div>
  `,
})
export class WatchlistCardComponent {
  readonly label       = input.required<string>();
  readonly value       = input.required<string>();
  readonly status      = input<string>('');
  readonly statusColor = input<string>('#007DB7');
  readonly isDark      = input<boolean>(false);

  protected readonly containerStyle = computed(() => ({
    background:    this.isDark() ? '#132040' : '#f8fbfd',
    border:        '1px solid ' + (this.isDark() ? '#1a2d51' : '#e4edf5'),
    borderRadius:  '8px',
    padding:       '10px 12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    fontFamily:    FONT,
    minWidth:      '0',
    overflow:      'hidden',
    boxSizing:     'border-box',
    width:         '100%',
  }));

  protected readonly labelStyle = computed(() => ({
    fontSize:     '12px',
    fontWeight:   400,
    color:        this.isDark() ? '#7fa8c4' : '#5A7A96',
    lineHeight:   1.3,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  }));

  protected readonly valueStyle = computed(() => ({
    fontSize:            '18px',
    fontWeight:          400,
    color:               this.statusColor(),
    fontFeatureSettings: "'lnum' 1, 'tnum' 1",
    lineHeight:          1,
  }));

  protected readonly statusStyle = computed(() => ({
    fontSize:            '12px',
    color:               this.statusColor(),
    fontFeatureSettings: "'lnum' 1",
  }));
}
