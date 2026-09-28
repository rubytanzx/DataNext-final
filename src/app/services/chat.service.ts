import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: string;
  chartConfig?: any;
}

export interface ChatHistoryItem {
  id: string;
  source: 'home' | 'explorer' | 'search' | 'contribute';
  question: string;
  answer: string;
  ts: string;
  title?: string;
  notebookId?: string;
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','for','in','on','at','to','of','is','are','was','were',
  'with','by','from','do','that','which','what','how','can','me','i','my','this',
  'it','its','their','above','below','show','find','get','give','tell','list',
]);

export function summarizeTitle(question: string): string {
  const cleaned = question.replace(/[?!.]+$/, '').trim();
  const words = cleaned.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()) && w.length > 1);
  const short = words.slice(0, 5).join(' ');
  return short.length > 44 ? short.slice(0, 42) + '…' : short || cleaned.slice(0, 44);
}

// ── Mock suggestions ──────────────────────────────────────────────────────
export const SUGGESTIONS = [
  'GDP growth for India, China, and Indonesia since 2010',
  'Compare debt-to-GDP across Pacific SIDS',
  'Inflation trends in Tonga, Fiji, and Samoa',
  'Remittance inflows for Philippines, Bangladesh, and Pakistan',
  'Which Pacific country has the highest unemployment rate?',
  'FDI inflows for Southeast Asia since 2010',
  'GDP per capita for South Asian economies',
  'Current account balance for Korea and Malaysia over time',
  'Exchange rate trends for Indonesia and Vietnam',
  'Household consumption growth across Pacific islands',
];

// ── Stub responses for mock data ──────────────────────────────────────────
const STUB_RESPONSES: Record<string, string> = {
  default: `Based on available KIDB data, Pacific developing member countries have shown resilience in recent years. Real GDP growth averaged 3.4% across the subregion in 2025, led by Fiji's tourism recovery and Papua New Guinea's LNG and mining exports.

Key observations from the data:
- Fiji recorded the strongest growth at 3.5%, supported by 961,000 tourist arrivals surpassing pre-pandemic peaks
- Papua New Guinea grew 4.3%, underpinned by LNG production and gold exports
- Smaller island economies face continued vulnerability to climate shocks and remittance dependency

The ADB Asian Development Outlook projects continued moderate growth for the Pacific subregion through 2026, contingent on stable global commodity prices and continued tourism recovery. [1]`,
};

const PRESET_HISTORY: ChatHistoryItem[] = [
  {
    id: 'preset-2',
    source: 'search',
    question: 'Climate risk and flood exposure data for Pacific island states',
    answer: 'Surfaced 8 climate datasets covering Pacific SIDS — Tonga, Vanuatu, Cook Islands, and Fiji. Includes coastal inundation risk, cyclone ARI500 projections, and earthquake risk results. 5 assets selected.',
    ts: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    title: 'Climate Risk: Pacific SIDS',
  },
  {
    id: 'preset-1',
    source: 'search',
    question: 'Transport projects in Southeast Asia above $100m',
    answer: 'Found 14 active transport projects across the region, totalling $2.8B in ADB commitments. Philippines, Indonesia, and Viet Nam account for 74% of the portfolio. 4 assets selected.',
    ts: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    title: 'SE Asia Transport Projects',
  },
];

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly messages    = signal<ChatMessage[]>([]);
  readonly history     = signal<ChatHistoryItem[]>(PRESET_HISTORY);
  readonly loading     = signal<boolean>(false);
  readonly convTitle   = signal<string>('');

  async ask(question: string, source: 'home' | 'explorer' = 'explorer'): Promise<string> {
    if (!question.trim()) return '';

    this.loading.set(true);

    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now()}`;
    const ts  = new Date().toISOString();

    this.messages.update(msgs => [
      ...msgs,
      { id: uid, role: 'user',      content: question, ts },
      { id: aid, role: 'assistant', content: '',        ts },
    ]);

    // Simulate streaming with stub response
    await new Promise(r => setTimeout(r, 800));

    const answer = STUB_RESPONSES['default'];

    // Simulate character streaming
    let partial = '';
    for (let i = 0; i < answer.length; i += 8) {
      partial = answer.slice(0, i + 8);
      this.messages.update(msgs =>
        msgs.map(m => m.id === aid ? { ...m, content: partial } : m)
      );
      await new Promise(r => setTimeout(r, 12));
    }

    const final = answer;
    this.messages.update(msgs =>
      msgs.map(m => m.id === aid ? { ...m, content: final } : m)
    );

    // Auto-generate conversation title
    if (!this.convTitle()) {
      const words = question.split(' ').slice(0, 6).join(' ');
      this.convTitle.set(words + (question.split(' ').length > 6 ? '…' : ''));
    }

    // Add to history with auto-generated title
    this.history.update(h => [
      { id: uid, source, question, answer: final, ts, title: summarizeTitle(question) },
      ...h,
    ]);

    this.loading.set(false);
    return final;
  }

  startNewChat(question: string): string {
    const id = `chat-${Date.now()}`;
    this.history.update(h => [
      { id, source: 'explorer' as const, question, answer: '', ts: new Date().toISOString(), title: summarizeTitle(question) },
      ...h,
    ]);
    return id;
  }

  updateTitle(id: string, title: string): void {
    this.history.update(h => h.map(item => item.id === id ? { ...item, title } : item));
  }

  addContributeItem(title: string, summary: string): void {
    const id = `contrib-${Date.now()}`;
    this.history.update(h => [
      { id, source: 'contribute', question: title, answer: summary, ts: new Date().toISOString() },
      ...h,
    ]);
  }

  reset() {
    this.messages.set([]);
    this.convTitle.set('');
  }
}
