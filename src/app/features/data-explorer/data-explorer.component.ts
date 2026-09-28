import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, computed, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService, SUGGESTIONS } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';

export interface Citation {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  date: string;
  series?: string;
  pdfUrl?: string;
  url?: string;
  keyPage?: number;
}

// Mock publications available for citation sidebar
const MOCK_PUBS: Citation[] = [
  {
    id: 'ado-2024',
    title: 'Asian Development Outlook',
    subtitle: 'April 2024 — Pacific Supplement',
    type: 'Flagship Report',
    date: 'April 2024',
    series: 'ADO 2024',
    url: 'https://www.adb.org/publications/asian-development-outlook-2024',
    keyPage: 185,
  },
  {
    id: 'pacific-monitor-dec-2025',
    title: 'Pacific Economic Monitor',
    subtitle: 'December 2025 Edition',
    type: 'Regional Monitor',
    date: 'December 2025',
    series: 'Pacific Economic Monitor',
    url: 'https://www.adb.org/publications/pacific-economic-monitor',
    keyPage: 1,
  },
  {
    id: 'key-indicators-2024',
    title: 'Key Indicators for Asia and the Pacific 2024',
    subtitle: '56th Edition',
    type: 'Statistical Compendium',
    date: 'August 2024',
    series: 'Key Indicators',
    url: 'https://www.adb.org/publications/key-indicators-asia-pacific',
    keyPage: 185,
  },
];

@Component({
  selector: 'app-data-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-explorer.component.html',
  styleUrl: './data-explorer.component.scss',
})
export class DataExplorerComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatEnd') chatEnd!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef;

  readonly chatService  = inject(ChatService);
  readonly themeService = inject(ThemeService);
  readonly route        = inject(ActivatedRoute);

  inputValue    = '';
  editingTitle  = signal(false);
  titleValue    = signal('');
  pdfOpen       = signal(false);
  pdfTitle      = signal('');
  pdfSubtitle   = signal('');
  sidebarOpen   = signal(false);
  activeCitation = signal<Citation | null>(null);
  private prevMsgLen = 0;

  readonly messages    = this.chatService.messages;
  readonly loading     = this.chatService.loading;
  readonly convTitle   = this.chatService.convTitle;
  readonly suggestions = SUGGESTIONS;
  readonly citations   = MOCK_PUBS;

  ngOnInit() {
    // Accept a pending query via queryParam (from home page suggestion)
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.inputValue = params['q'];
      }
    });
  }

  ngAfterViewChecked() {
    const msgs = this.messages();
    if (msgs.length !== this.prevMsgLen) {
      this.prevMsgLen = msgs.length;
      this.chatEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async send(e?: Event) {
    e?.preventDefault();
    const q = this.inputValue.trim();
    if (!q || this.loading()) return;
    this.inputValue = '';
    await this.chatService.ask(q, 'explorer');
  }

  useSuggestion(q: string) {
    this.inputValue = q;
    this.inputRef?.nativeElement?.focus();
  }

  startTitleEdit() {
    this.titleValue.set(this.convTitle());
    this.editingTitle.set(true);
  }

  finishTitleEdit() {
    const v = this.titleValue().trim();
    if (v) this.chatService.convTitle.set(v);
    this.editingTitle.set(false);
  }

  openPdf(citation: Citation) {
    this.activeCitation.set(citation);
    this.pdfTitle.set(citation.title);
    this.pdfSubtitle.set(citation.subtitle ?? '');
    this.pdfOpen.set(true);
  }

  closePdf() {
    this.pdfOpen.set(false);
    this.activeCitation.set(null);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }
}
