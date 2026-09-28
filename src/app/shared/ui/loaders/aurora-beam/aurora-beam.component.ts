import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ia-aurora-beam',
  standalone: true,
  template: `
    <div class="stripe"></div>
    <div class="blob blob-a"></div>
    <div class="blob blob-b"></div>
  `,
  styleUrl: './aurora-beam.component.scss',
  host: {
    'class': 'ia-aurora-beam',
    '[class.aurora--green]':  "variant() === 'green'",
    '[class.aurora--purple]': "variant() === 'purple'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuroraBeamComponent {
  variant = input<'green' | 'purple'>('green');
}
