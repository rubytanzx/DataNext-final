import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

const ECONOMIES: Record<string, string> = {
  PNG: 'Papua New Guinea', FIJ: 'Fiji', VAN: 'Vanuatu', SOL: 'Solomon Islands',
  TON: 'Tonga', SAM: 'Samoa', KIR: 'Kiribati', TUV: 'Tuvalu',
  IND: 'India', PAK: 'Pakistan', BAN: 'Bangladesh', SRI: 'Sri Lanka',
  INO: 'Indonesia', PHI: 'Philippines', VIE: 'Viet Nam', THA: 'Thailand',
  PRC: 'China', JPN: 'Japan', KOR: 'Korea',
};

const STUB_BRIEFING = (country: string) => `ECONOMIC OVERVIEW

${country} has demonstrated moderate economic resilience in 2024–2025, with real GDP growth estimated at 3.2% — broadly in line with the ADB Asian Development Outlook forecast. The growth trajectory is underpinned by recovering tourism receipts, stabilizing commodity prices, and continued donor-supported infrastructure investment.

MONETARY AND FISCAL CONDITIONS

Headline inflation moderated to 4.1% year-on-year in Q3 2025, down from a peak of 7.2% in 2022, reflecting easing global food and fuel prices. The central bank maintained its accommodative policy stance, holding the policy rate steady. The fiscal deficit narrowed to an estimated 3.4% of GDP as revenue performance improved alongside growth recovery.

EXTERNAL SECTOR

The current account deficit widened slightly to 6.8% of GDP, driven by higher import volumes reflecting reconstruction activity. Remittance inflows remain a key stabilizer, contributing approximately 28% of GDP. FDI inflows rose 12% year-on-year, reflecting improved investor confidence in the post-COVID environment.

KEY RISKS

Downside risks include: (i) a sharper-than-expected slowdown in key trading partners Australia and New Zealand; (ii) continued climate-related natural disasters elevating fiscal reconstruction costs; (iii) global commodity price volatility affecting import costs and terms of trade.

POLICY RECOMMENDATIONS

ADB recommends prioritising fiscal consolidation to rebuild buffers, accelerating revenue mobilisation reforms, and scaling climate-resilient infrastructure investment. Continued focus on financial inclusion and remittance cost reduction would support household welfare.`;

interface BriefingSection {
  header: string;
  paras: string[];
}

function parseBriefing(text: string): BriefingSection[] {
  if (!text.trim()) return [];
  const sections: BriefingSection[] = [];
  let cur: BriefingSection = { header: '', paras: [] };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const isHeader = line === line.toUpperCase() && (line.match(/[A-Z]/g) ?? []).length >= 4;
    if (isHeader) {
      if (cur.header || cur.paras.length) sections.push(cur);
      cur = { header: line.charAt(0) + line.slice(1).toLowerCase().replace(/\b\w/g, l => l.toUpperCase()), paras: [] };
    } else {
      cur.paras.push(line);
    }
  }
  if (cur.header || cur.paras.length) sections.push(cur);
  return sections;
}

@Component({
  selector: 'app-briefing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './briefing.component.html',
  styleUrl: './briefing.component.scss',
})
export class BriefingComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  readonly router       = inject(Router);
  readonly route        = inject(ActivatedRoute);

  countryCode   = signal('PNG');
  countryName   = signal('Papua New Guinea');
  editorContent = signal('');
  sections      = signal<BriefingSection[]>([]);
  loading       = signal(false);
  chatInput     = '';
  chatMessages  = signal<Array<{ role: string; content: string }>>([]);
  chatLoading   = signal(false);
  copied        = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['country'] ?? 'PNG';
      this.countryCode.set(code);
      this.countryName.set(ECONOMIES[code] ?? code);
      this.generateBriefing();
    });
  }

  async generateBriefing() {
    this.loading.set(true);
    await new Promise(r => setTimeout(r, 1400));
    const text = STUB_BRIEFING(this.countryName());
    this.editorContent.set(text);
    this.sections.set(parseBriefing(text));
    this.loading.set(false);
  }

  async sendChat(e?: Event) {
    e?.preventDefault();
    const q = this.chatInput.trim();
    if (!q || this.chatLoading()) return;
    this.chatInput = '';
    this.chatLoading.set(true);
    this.chatMessages.update(h => [
      ...h,
      { role: 'user',      content: q },
      { role: 'assistant', content: '' },
    ]);
    await new Promise(r => setTimeout(r, 1000));
    const reply = `I've refined the briefing note based on your instruction: "${q}". The relevant section has been updated to reflect the latest available data from the ADB Key Indicators Database and Pacific Economic Monitor. Please review the changes above.`;
    this.chatMessages.update(h =>
      h.map((m, i) => i === h.length - 1 ? { ...m, content: reply } : m)
    );
    this.chatLoading.set(false);
  }

  async copyToClipboard() {
    await navigator.clipboard.writeText(this.editorContent()).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  downloadText() {
    const blob = new Blob([this.editorContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-note-${this.countryCode()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  today(): string {
    return new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  close() {
    this.router.navigate(['/']);
  }
}
