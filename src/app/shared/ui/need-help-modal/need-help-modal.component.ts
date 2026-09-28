import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-need-help-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './need-help-modal.component.html',
  styleUrl: './need-help-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeedHelpModalComponent {
  private readonly router = inject(Router);

  @Input() open = false;
  @Output() closeModal = new EventEmitter<void>();

  readonly categories = [
    'Feedback on experience',
    'Request for more assets',
    'Report issues with asset',
    'Others',
  ];

  selectedCategory = '';
  message = '';
  submitted = false;
  includePageContext = true;

  get currentPage(): string {
    const url = this.router.url;
    const map: Record<string, string> = {
      '/home': 'Discover',
      '/catalogue': 'Assets Catalog',
      '/notebooks': 'My Library',
      '/whats-new': 'Get Started',
      '/faq': 'FAQ',
      '/contribute': 'Contribute',
      '/search': 'Search',
      '/chat': 'Chat',
      '/spaces': 'Workspaces',
    };
    for (const [path, label] of Object.entries(map)) {
      if (url.startsWith(path)) return label;
    }
    return url;
  }

  get canSubmit(): boolean {
    return !!this.selectedCategory && this.message.trim().length > 0;
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('nh-overlay')) {
      this.close();
    }
  }

  close() {
    this.closeModal.emit();
  }

  submit() {
    if (!this.canSubmit) return;
    this.submitted = true;
  }

  reset() {
    this.selectedCategory = '';
    this.message = '';
    this.submitted = false;
    this.includePageContext = true;
    this.close();
  }
}
