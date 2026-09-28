import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ia-skeleton',
  standalone: true,
  template: '',
  styles: [`
    :host {
      display: block;
      animation: ia-skeleton-pulse 1.4s ease-in-out infinite;
      background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
      background-size: 200% 100%;
    }
    @keyframes ia-skeleton-pulse {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
  host: {
    '[style.width]':         'width()',
    '[style.height]':        'height()',
    '[style.border-radius]': 'borderRadius()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonPlaceholderComponent {
  width        = input<string>('100%');
  height       = input<string>('16px');
  borderRadius = input<string>('4px');
}
