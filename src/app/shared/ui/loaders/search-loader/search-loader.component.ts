import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ia-search-loader',
  standalone: true,
  template: `
    <div
      class="search-loader"
      role="status"
      aria-label="Loading"
      [style.width]="width()"
      [style.height]="height()"
      [style.--play-state]="autoplay() ? 'running' : 'paused'"
      [style.--iteration-count]="loop() ? 'infinite' : '1'"
    >
      <svg class="dome-bg" viewBox="0 0 670 382" fill="none" aria-hidden="true">
        <g opacity="0.14" [attr.filter]="'url(#' + uid + '-dome-blur)'">
          <path
            d="M335 90C199.69 90 90 197.452 90 330H580C580 197.452 470.31 90 335 90Z"
            [attr.fill]="'url(#' + uid + '-dome-grad)'"
          />
        </g>
        <defs>
          <filter
            [attr.id]="uid + '-dome-blur'"
            x="0" y="0" width="670" height="420"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feGaussianBlur stdDeviation="45" result="effect1_foregroundBlur"/>
          </filter>
          <linearGradient
            [attr.id]="uid + '-dome-grad'"
            x1="90" y1="210" x2="705.611" y2="210"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#8DC63F"/>
            <stop offset="1" stop-color="#007DB7"/>
          </linearGradient>
          <linearGradient
            [attr.id]="uid + '-sg'"
            x1="0" y1="0" x2="1" y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stop-color="#8dc63f"/>
            <stop offset="100%" stop-color="#46c8d9"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="bars-viewport">
        <div class="bars-track">
          @for (bar of bars; track $index) {
            <div class="bar"
                 [class.bar--dim]="bar.dimmed"
                 [style.--bar-anim]="bar.anim ?? 'none'">
              <svg class="icon" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="9.5" cy="9.5" r="6.5" [attr.stroke]="'url(#' + uid + '-sg)'" stroke-width="2"/>
                <path d="M14.5 14.5L19.5 19.5" [attr.stroke]="'url(#' + uid + '-sg)'" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './search-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchLoaderComponent {
  width    = input<string>('560px');
  height   = input<string>('320px');
  autoplay = input<boolean>(true);
  loop     = input<boolean>(true);

  protected readonly uid = `ia-${Math.random().toString(36).slice(2, 8)}`;

  protected readonly bars: { anim: string | null; dimmed: boolean }[] = [
    { anim: null,       dimmed: true  },
    { anim: 'ia-op-2', dimmed: false },
    { anim: 'ia-op-3', dimmed: false },
    { anim: 'ia-op-4', dimmed: false },
    { anim: 'ia-op-5', dimmed: false },
    { anim: null,       dimmed: true  },
  ];
}
