import { Component, input, output } from '@angular/core';
import { WatchlistCardComponent } from '../watchlist-card/watchlist-card.component';
import { PrimaryBtnDirective } from '../primary-btn/primary-btn.directive';

export interface WatchlistItem {
  key: string;
  label: string;
  value: string;
  status: string;
  statusColor: string;
}

export interface WatchlistCat {
  id: string;
  label: string;
  items: WatchlistItem[];
}

export interface CountryFacts {
  population: string;
  area: string;
  capital: string;
  currency: string;
}

@Component({
  selector: 'erdi-watchlist-panel',
  standalone: true,
  imports: [WatchlistCardComponent, PrimaryBtnDirective],
  templateUrl: './watchlist-panel.component.html',
  styleUrl: './watchlist-panel.component.scss',
})
export class WatchlistPanelComponent {
  readonly mode         = input.required<'country' | 'region' | 'none'>();
  readonly title        = input.required<string>();
  readonly subtitle     = input<string>('');
  readonly countryFlag  = input<string>('');
  readonly countryFacts = input<CountryFacts | null>(null);
  readonly cats         = input.required<WatchlistCat[]>();
  readonly isDark       = input<boolean>(false);
  readonly pacificCount = input<number>(0);
  readonly openCats     = input<Set<string>>(new Set());

  readonly closed       = output<void>();
  readonly briefingNote = output<void>();
  readonly catToggled   = output<string>();

  isCatOpen(id: string): boolean {
    return this.openCats().has(id);
  }
}
