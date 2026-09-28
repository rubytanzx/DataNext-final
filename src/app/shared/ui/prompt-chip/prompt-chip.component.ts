import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type PromptChipVariant = 'ai' | 'default';

@Component({
  selector: 'adb-prompt-chip',
  standalone: true,
  template: `
    <button
      class="prompt-chip"
      [class.prompt-chip--ai]="variant() === 'ai'"
      type="button"
      (click)="chipClick.emit()"
    >
      @if (variant() === 'ai') {
        <svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="adb-prompt-chip-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#46C8D9"/>
              <stop offset="100%" stop-color="#AE5DED"/>
            </linearGradient>
          </defs>
        </svg>
      }
      <span class="prompt-chip__icon"><ng-content select="[slot=icon]" /></span>
      <span class="prompt-chip__label">{{ label() }}</span>
    </button>
  `,
  styleUrl: './prompt-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptChipComponent {
  label   = input.required<string>();
  variant = input<PromptChipVariant>('default');

  chipClick = output<void>();
}
