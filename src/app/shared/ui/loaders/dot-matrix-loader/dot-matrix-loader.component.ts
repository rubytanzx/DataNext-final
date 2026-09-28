import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ia-dot-matrix-loader',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath [attr.id]="clipId">
          <rect width="24" height="24" rx="8.47059" fill="white" />
        </clipPath>
      </defs>
      <g [attr.clip-path]="clipPathRef">
        <circle class="ia-dm-1" transform="translate(2.82353 2.82353)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-2" transform="translate(9.88235 2.82353)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-3" transform="translate(16.9412 2.82353)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-4" transform="translate(2.82353 9.88235)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-5" transform="translate(9.88235 9.88235)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-6" transform="translate(16.9412 9.88235)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-7" transform="translate(2.82353 16.9412)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-8" transform="translate(9.88235 16.9412)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
        <circle class="ia-dm-9" transform="translate(16.9412 16.9412)"  cx="2.11765" cy="2.11765" r="2.11765" [attr.fill]="color()" />
      </g>
    </svg>
  `,
  styleUrl: './dot-matrix-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotMatrixLoaderComponent {
  size  = input<number>(24);
  color = input<string>('#007DB7');

  private static nextId = 0;
  protected readonly clipId      = `ia-dm-clip-${++DotMatrixLoaderComponent.nextId}`;
  protected readonly clipPathRef = `url(#${this.clipId})`;
}
