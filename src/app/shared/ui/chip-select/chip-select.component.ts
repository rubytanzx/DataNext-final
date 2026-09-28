import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'adb-chip-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chip-select.component.scss',
  template: `
    <div class="cs__wrap" (click)="open()">
      @for (chip of value(); track chip; let i = $index) {
        <span class="cs__chip">
          {{ chip }}
          <button type="button" class="cs__chip-rm" (click)="remove(i); $event.stopPropagation()">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </span>
      }
      @if (!value().length) {
        <span class="cs__placeholder">{{ placeholder() }}</span>
      }
    </div>

    @if (dropdownOpen()) {
      <div class="cs__dropdown">
        <div class="cs__search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9eaab5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="cs__search"
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search…"
            (blur)="dropdownOpen.set(false)"
            autofocus
            autocomplete="off"
          />
        </div>
        <div class="cs__list">
          @for (opt of filtered(); track opt) {
            <div class="cs__option" (mousedown)="add(opt)">
              <span class="cs__option-key">{{ opt }}</span>
              @if (optionLabels()[opt]) {
                <span class="cs__option-desc">{{ optionLabels()[opt] }}</span>
              }
            </div>
          }
          @if (!filtered().length) {
            <div class="cs__empty">No matches</div>
          }
        </div>
      </div>
    }
  `,
})
export class ChipSelectComponent {
  options      = input<string[]>([]);
  placeholder  = input('Select options…');
  value        = model<string[]>([]);
  optionLabels = input<Record<string, string>>({});

  readonly selectionChange = output<string[]>();

  searchQuery  = signal('');
  dropdownOpen = signal(false);

  filtered = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const labels = this.optionLabels();
    return this.options().filter(o => {
      if (this.value().includes(o)) return false;
      if (!q) return true;
      return o.toLowerCase().includes(q) || (labels[o] ?? '').toLowerCase().includes(q);
    });
  });

  open(): void { this.dropdownOpen.set(true); }

  add(opt: string): void {
    const next = [...this.value(), opt];
    this.value.set(next);
    this.selectionChange.emit(next);
    this.searchQuery.set('');
    this.dropdownOpen.set(false);
  }

  remove(i: number): void {
    const next = this.value().filter((_, idx) => idx !== i);
    this.value.set(next);
    this.selectionChange.emit(next);
  }
}
