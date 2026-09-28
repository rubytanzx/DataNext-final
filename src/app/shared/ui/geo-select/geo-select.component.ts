import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  model,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GeoGroup {
  name: string;
  countries: string[];
}

const GEO_GROUPS: GeoGroup[] = [
  {
    name: 'Central and West Asia',
    countries: ['Afghanistan', 'Armenia', 'Azerbaijan', 'Georgia', 'Kazakhstan',
      'Kyrgyz Republic', 'Pakistan', 'Tajikistan', 'Türkiye', 'Turkmenistan', 'Uzbekistan'],
  },
  {
    name: 'East Asia',
    countries: ['Mongolia', "People's Republic of China"],
  },
  {
    name: 'South Asia',
    countries: ['Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Sri Lanka'],
  },
  {
    name: 'Southeast Asia',
    countries: ['Cambodia', 'Indonesia', "Lao People's Democratic Republic",
      'Myanmar', 'Philippines', 'Thailand', 'Timor-Leste', 'Viet Nam'],
  },
  {
    name: 'The Pacific',
    countries: ['Cook Islands', 'Federated States of Micronesia', 'Fiji', 'Kiribati',
      'Marshall Islands', 'Nauru', 'Niue', 'Palau', 'Papua New Guinea',
      'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'],
  },
];

@Component({
  selector: 'adb-geo-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './geo-select.component.scss',
  template: `
    <div class="gs__wrap" (mousedown)="onWrapClick($event)">
      @for (chip of value(); track chip) {
        <span class="gs__chip">
          {{ chip }}
          <button type="button" class="gs__chip-rm"
            (mousedown)="removeChip(chip, $event)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </span>
      }
      @if (!value().length) {
        <span class="gs__placeholder">Select regions or countries…</span>
      }
    </div>

    @if (dropdownOpen()) {
      <div class="gs__dropdown">
        <div class="gs__search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9eaab5"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="gs__search" type="text"
            [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
            placeholder="Search regions or countries…"
            autocomplete="off" />
        </div>

        <div class="gs__list">
          @if (isSearching()) {
            <!-- Flat search results -->
            @for (item of searchResults(); track item.label) {
              <div class="gs__option" [class.gs__option--selected]="isSelected(item.label)"
                (mousedown)="toggle(item.label, $event)">
                <span class="gs__checkbox" [class.gs__checkbox--on]="isSelected(item.label)">
                  @if (isSelected(item.label)) {
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="2,6 5,9 10,3"/>
                    </svg>
                  }
                </span>
                <span class="gs__option-text">
                  {{ item.label }}
                  @if (item.group) { <span class="gs__option-group">{{ item.group }}</span> }
                </span>
              </div>
            }
            @if (!searchResults().length) {
              <div class="gs__empty">No matches</div>
            }
          } @else {
            <!-- Grouped regions -->
            @for (group of groups; track group.name) {
              <div class="gs__group-row" (mousedown)="toggleGroupExpand(group.name, $event)">
                <span class="gs__expand-btn">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round"
                    [style.transform]="isExpanded(group.name) ? 'rotate(90deg)' : 'rotate(0deg)'">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </span>
                <span class="gs__checkbox" [class.gs__checkbox--on]="isSelected(group.name)"
                  (mousedown)="toggleRegion(group.name, $event)">
                  @if (isSelected(group.name)) {
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="2,6 5,9 10,3"/>
                    </svg>
                  }
                </span>
                <span class="gs__group-name">{{ group.name }}</span>
              </div>
              @if (isExpanded(group.name)) {
                @for (country of group.countries; track country) {
                  <div class="gs__country-row" [class.gs__option--selected]="isSelected(country)"
                    (mousedown)="toggle(country, $event)">
                    <span class="gs__checkbox" [class.gs__checkbox--on]="isSelected(country)">
                      @if (isSelected(country)) {
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="2,6 5,9 10,3"/>
                        </svg>
                      }
                    </span>
                    {{ country }}
                  </div>
                }
              }
            }
          }
        </div>
      </div>
    }
  `,
})
export class GeoSelectComponent {
  value = model<string[]>([]);

  readonly groups = GEO_GROUPS;

  dropdownOpen  = signal(false);
  searchQuery   = signal('');
  expandedGroups = signal<Set<string>>(new Set());

  private el = inject(ElementRef);

  @HostListener('document:mousedown', ['$event'])
  onDocMousedown(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.dropdownOpen.set(false);
    }
  }

  readonly isSearching = computed(() => this.searchQuery().trim().length > 0);

  readonly searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const results: { label: string; group?: string }[] = [];
    for (const group of GEO_GROUPS) {
      if (group.name.toLowerCase().includes(q)) results.push({ label: group.name });
      for (const country of group.countries) {
        if (country.toLowerCase().includes(q)) results.push({ label: country, group: group.name });
      }
    }
    return results;
  });

  isSelected(item: string): boolean {
    return this.value().includes(item);
  }

  isExpanded(groupName: string): boolean {
    return this.expandedGroups().has(groupName);
  }

  onWrapClick(e: MouseEvent): void {
    e.preventDefault();
    this.dropdownOpen.set(true);
  }

  removeChip(chip: string, e: MouseEvent): void {
    e.stopPropagation();
    this.value.set(this.value().filter(v => v !== chip));
  }

  toggle(item: string, e: MouseEvent): void {
    e.preventDefault();
    const cur = this.value();
    this.value.set(cur.includes(item) ? cur.filter(v => v !== item) : [...cur, item]);
  }

  toggleRegion(regionName: string, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.toggle(regionName, e);
  }

  toggleGroupExpand(groupName: string, e: MouseEvent): void {
    e.preventDefault();
    const cur = new Set(this.expandedGroups());
    cur.has(groupName) ? cur.delete(groupName) : cur.add(groupName);
    this.expandedGroups.set(cur);
  }
}
