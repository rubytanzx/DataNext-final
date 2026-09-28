import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Publication {
  id: string;
  type: string;
  typeBg: string;
  coverBg: string;
  title: string;
  subtitle: string;
  date: string;
  abstract: string;
  url: string;
  pdfUrl?: string;
  pages?: number;
  series: string;
  keyPage?: number;
}

const ADB_PUBS: Publication[] = [
  {
    id: 'ado-2024',
    type: 'Economics', typeBg: '#68C5EA', coverBg: '#062030',
    title: 'Asian Development Outlook',
    subtitle: 'April 2024 — Pacific Supplement',
    date: 'April 2024',
    abstract: 'Pacific developing economies grew 3.9% in 2024, supported by tourism recovery and infrastructure investment. PNG leads regional growth at 4.3%, underpinned by LNG production.',
    url: 'https://www.adb.org/publications/asian-development-outlook-2024',
    pages: 264, series: 'Asian Development Outlook',
  },
  {
    id: 'pacific-monitor-dec-2025',
    type: 'Regional Monitor', typeBg: '#00A5D2', coverBg: '#062030',
    title: 'Pacific Economic Monitor',
    subtitle: 'December 2025 Edition',
    date: 'December 2025',
    abstract: 'Bi-annual review of economic conditions across 14 Pacific developing member countries. Covers growth, inflation, fiscal positions, and ADB portfolio updates.',
    url: 'https://www.adb.org/publications/pacific-economic-monitor',
    pages: 52, series: 'Pacific Economic Monitor',
  },
  {
    id: 'key-indicators-2024',
    type: 'Statistical Compendium', typeBg: '#007DB7', coverBg: '#00256C',
    title: 'Key Indicators for Asia and the Pacific 2024',
    subtitle: '56th Edition',
    date: 'August 2024',
    abstract: 'Comprehensive economic, financial, social, and environmental statistics for 49 ADB member economies. Includes KIDB data underlying this platform.',
    url: 'https://www.adb.org/publications/key-indicators-asia-pacific',
    pages: 448, series: 'Key Indicators',
  },
  {
    id: 'adr-2025',
    type: 'Journal', typeBg: '#E9532B', coverBg: '#2a0e00',
    title: 'Asian Development Review',
    subtitle: 'Vol. 42, No. 2 — 2025',
    date: 'September 2025',
    abstract: 'Peer-reviewed journal of economics and development. Features papers on Pacific labour mobility, climate adaptation financing, and Central Asia trade corridors.',
    url: 'https://www.adb.org/publications/asian-development-review',
    pages: 180, series: 'Asian Development Review',
  },
  {
    id: 'pacmon-jun-2025',
    type: 'Regional Monitor', typeBg: '#00A5D2', coverBg: '#062030',
    title: 'Pacific Economic Monitor',
    subtitle: 'July 2025 Edition',
    date: 'July 2025',
    abstract: 'Mid-year review covering tourism recovery in Fiji, reconstruction progress in Vanuatu post-cyclone, and remittance trends for Samoa and Tonga in H1 2025.',
    url: 'https://www.adb.org/publications/pacific-economic-monitor',
    pages: 48, series: 'Pacific Economic Monitor',
  },
  {
    id: 'adb-blogs',
    type: 'Blog', typeBg: '#007DB7', coverBg: '#00256C',
    title: 'ADB Blogs',
    subtitle: 'Ideas, analysis, and perspectives from ADB economists',
    date: 'Ongoing',
    abstract: 'Expert commentary and analysis on development economics, climate change, infrastructure, and poverty reduction across Asia and the Pacific. Updated weekly.',
    url: 'https://blogs.adb.org/', series: 'ADB Blogs',
  },
];

const MEDIA_PUBS: Publication[] = [
  {
    id: 'rnz-pacific',
    type: 'News', typeBg: '#00A5D2', coverBg: '#021d30',
    title: 'RNZ Pacific',
    subtitle: 'Radio New Zealand — Pacific News Hub',
    date: 'Daily',
    abstract: "New Zealand's public broadcaster covering Pacific Island nations daily. Reporting on politics, economics, climate, and development across the region.",
    url: 'https://www.rnz.co.nz/international/pacific-news', series: 'Radio New Zealand',
  },
  {
    id: 'abc-pacific',
    type: 'News', typeBg: '#007DB7', coverBg: '#001a30',
    title: 'ABC Pacific',
    subtitle: 'Australian Broadcasting Corporation — Pacific Beat',
    date: 'Daily',
    abstract: "Australia's public broadcaster with dedicated Pacific coverage via Pacific Beat. Reporting on politics, economics, and development across Melanesia, Polynesia, and Micronesia.",
    url: 'https://www.abc.net.au/pacific', series: 'ABC International',
  },
  {
    id: 'islands-business',
    type: 'Magazine', typeBg: '#8DC63F', coverBg: '#0d2a14',
    title: 'Islands Business',
    subtitle: "The Pacific's Business & Political Magazine",
    date: 'Monthly',
    abstract: "Fiji-based regional magazine covering Pacific business, politics, and economics since 1975. The primary English-language business publication across Pacific Island nations.",
    url: 'https://islandsbusiness.com/', series: 'Islands Business',
  },
];

@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss',
})
export class PublicationsComponent {
  readonly router = inject(Router);

  adbPubs  = ADB_PUBS;
  mediaPubs = MEDIA_PUBS;

  selectedPub = signal<Publication | null>(null);
  pubChat = signal<Array<{ role: string; content: string }>>([]);
  pubInput = '';
  pubLoading = signal(false);

  openPub(pub: Publication) {
    this.selectedPub.set(pub);
    this.pubChat.set([]);
  }

  closePub() {
    this.selectedPub.set(null);
    this.pubChat.set([]);
  }

  async askPub(e?: Event) {
    e?.preventDefault();
    const q = this.pubInput.trim();
    if (!q || !this.selectedPub()) return;
    this.pubInput = '';
    this.pubLoading.set(true);
    this.pubChat.update(h => [...h, { role: 'user', content: q }, { role: 'assistant', content: '' }]);
    await new Promise(r => setTimeout(r, 1200));
    const answer = `Based on "${this.selectedPub()!.title}" (${this.selectedPub()!.date}): This publication provides detailed analysis relevant to your query about ${q.slice(0, 60)}. Key findings include economic indicators for the Pacific DMCs and relevant policy recommendations from ADB economists.`;
    this.pubChat.update(h =>
      h.map((m, i) => i === h.length - 1 ? { ...m, content: answer } : m)
    );
    this.pubLoading.set(false);
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
