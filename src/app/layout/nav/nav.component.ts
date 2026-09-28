import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ThemeService } from '../../services/theme.service';
import { NavService } from '../../services/nav.service';
import { ChatService, summarizeTitle } from '../../services/chat.service';
import { NeedHelpModalComponent } from '../../shared/ui/need-help-modal/need-help-modal.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NeedHelpModalComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  readonly themeService = inject(ThemeService);
  readonly navService   = inject(NavService);
  readonly chatService  = inject(ChatService);
  readonly router       = inject(Router);

  searchQuery = '';
  readonly showNeedHelp = signal(false);

  private readonly activeRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isHome = computed(() => this.activeRoute() === '/home' || this.activeRoute() === '/whats-new');

  readonly filteredHistory = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const h = this.chatService.history();
    return q ? h.filter(item => item.question.toLowerCase().includes(q)) : h;
  });

  isActive(path: string): boolean {
    const route = this.activeRoute();
    return route === path || route.startsWith(path + '/');
  }

  startNewChat() {
    this.chatService.reset();
    this.router.navigate(['/home']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  chatTitle(item: any): string {
    return item.title || summarizeTitle(item.question);
  }

  openHistoryItem(item: any) {
    this.router.navigate(['/chat', item.id]);
  }
}
