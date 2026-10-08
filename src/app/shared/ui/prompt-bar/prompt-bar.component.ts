import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'adb-prompt-bar',
  standalone: true,
  template: `
    <div class="search-input" [class.search-input--loading]="loading()" [class.search-input--disabled]="disabled()">
      <div class="search-input__uploads">
        <ng-content select="[slot=uploads]" />
      </div>
      <div class="search-input__row">
        <textarea
          #field
          class="search-input__field"
          rows="1"
          [placeholder]="placeholder()"
          [disabled]="disabled() || loading()"
          (input)="onTextInput(field)"
          (keydown.enter)="onEnterKey($event)"
          aria-label="AI prompt input"
        ></textarea>

        <div class="search-input__actions">
          @if (text().length > 0) {
            <button
              class="search-input__clear-btn"
              type="button"
              title="Clear input"
              aria-label="Clear input"
              (click)="onClear()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          }

          <button
            class="search-input__attach-btn"
            type="button"
            title="Attach file"
            aria-label="Attach file"
            [disabled]="disabled() || loading()"
            (click)="fileInput.click()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          @if (loading()) {
            <button
              class="search-input__send-btn search-input__send-btn--active"
              type="button"
              aria-label="Stop generation"
              (click)="stop.emit()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                   fill="currentColor" aria-hidden="true">
                <rect x="5" y="5" width="14" height="14" rx="2"/>
              </svg>
            </button>
          } @else {
            <button
              class="search-input__send-btn"
              [class.search-input__send-btn--active]="canSubmit()"
              type="button"
              aria-label="Send prompt"
              [disabled]="!canSubmit()"
              (click)="onSubmit()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          }
        </div>
      </div>
    </div>

    <input
      #fileInput
      type="file"
      hidden
      multiple
      accept=".pdf,.txt,.docx"
      (change)="onFileChange($event)"
    />
  `,
  styleUrl: './prompt-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptBarComponent {
  placeholder = input<string>('Ask me anything');
  disabled    = input<boolean>(false);
  loading     = input<boolean>(false);

  submit     = output<string>();
  stop       = output<void>();
  attach     = output<FileList>();
  textChange = output<string>();

  @ViewChild('field') private fieldRef!: ElementRef<HTMLTextAreaElement>;

  protected text      = signal('');
  protected canSubmit = computed(() => this.text().trim().length > 0 && !this.disabled() && !this.loading());

  private readonly LINE_HEIGHT = 24;  // px — matches font-size 16 * line-height 1.5
  private readonly MAX_LINES   = 4;

  private resize(): void {
    const el = this.fieldRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = this.LINE_HEIGHT * this.MAX_LINES;
    const clamped   = Math.min(el.scrollHeight, maxHeight);
    el.style.height   = clamped + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  protected onTextInput(el: HTMLTextAreaElement): void {
    this.text.set(el.value);
    this.textChange.emit(el.value);
    this.resize();
  }

  protected onEnterKey(event: Event): void {
    if ((event as KeyboardEvent).shiftKey) return; // shift+enter = newline
    event.preventDefault();
    if (this.canSubmit()) this.onSubmit();
  }

  protected onSubmit(): void {
    const value = this.text().trim();
    if (!value) return;
    this.submit.emit(value);
    this.text.set('');
    this.textChange.emit('');
    const el = this.fieldRef?.nativeElement;
    if (el) {
      el.value = '';
      el.style.height = 'auto';
      el.style.overflowY = 'hidden';
    }
  }

  populate(text: string): void {
    this.text.set(text);
    const el = this.fieldRef?.nativeElement;
    if (el) {
      el.value = text;
      setTimeout(() => { this.resize(); el.focus(); });
    }
  }

  protected onClear(): void {
    this.text.set('');
    this.textChange.emit('');
    const el = this.fieldRef?.nativeElement;
    if (el) {
      el.value = '';
      el.style.height = 'auto';
      el.style.overflowY = 'hidden';
      el.focus();
    }
  }

  protected onFileChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.attach.emit(files);
  }
}
