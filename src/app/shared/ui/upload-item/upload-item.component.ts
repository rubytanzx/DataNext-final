import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type UploadItemStatus = 'success' | 'loading' | 'failed';

@Component({
  selector: 'adb-upload-item',
  standalone: true,
  template: `
    <div class="upload-item" [class.upload-item--loading]="status() === 'loading'">
      <div class="upload-item__row">
        @if (status() === 'success') {
          <svg class="upload-item__status-icon upload-item__status-icon--success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        } @else if (status() === 'loading') {
          <svg class="upload-item__status-icon upload-item__status-icon--loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        } @else {
          <svg class="upload-item__status-icon upload-item__status-icon--failed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        }
        <div class="upload-item__content">
          <p class="upload-item__name" [class.upload-item__name--failed]="status() === 'failed'">{{ filename() }}</p>
          <div class="upload-item__meta">
            <span class="upload-item__size">{{ size() }}</span>
            @if (status() === 'loading') {
              <span class="upload-item__processing">
                <span class="upload-item__spinner" aria-hidden="true">
                  @for (t of ticks; track $index) {
                    <span class="upload-item__spinner-tick"></span>
                  }
                </span>
                Processing
              </span>
            }
          </div>
        </div>
        <button type="button" title="Remove file" class="upload-item__remove-btn"
                aria-label="Remove file" (click)="remove.emit()">
          <svg class="upload-item__remove" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      @if (status() === 'loading') {
        <div class="upload-item__progress">
          <div class="upload-item__progress-fill"></div>
        </div>
      }
    </div>
  `,
  styleUrl: './upload-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadItemComponent {
  filename = input.required<string>();
  size     = input.required<string>();
  status   = input<UploadItemStatus>('success');

  remove = output<void>();

  protected readonly ticks = Array(8).fill(0);
}
