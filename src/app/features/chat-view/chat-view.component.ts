import {
  Component, computed, inject, signal, ElementRef, ViewChild, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService, summarizeTitle } from '../../services/chat.service';
import { RouterModule } from '@angular/router';
import { PromptBarComponent } from '../../shared/ui/prompt-bar/prompt-bar.component';
import { AIReasoningLoaderComponent } from '../../shared/ui/loaders/ai-reasoning-loader/ai-reasoning-loader.component';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';

export interface AssetRef {
  tag: string;
  tagColor: 'blue' | 'violet' | 'amber' | 'teal';
  title: string;
  description: string;
  access: string;
  users?: string;
  uses?: string;
  rai?: boolean;
  governanceVerified?: boolean;
  verificationInProgress?: boolean;
  sector?: string;
  region?: string;
}

export interface ChatTurn {
  role: 'user' | 'ai';
  text: string;
  assets?: AssetRef[];
  loading?: boolean;
  feedback?: 'up' | 'down';
}

interface FeedbackPanel {
  key: string;
  type: 'up' | 'down';
  input: string;
  selectedChips: string[];
  status: 'idle' | 'success' | 'error';
}

// ── Mock AI responses ─────────────────────────────────────────────────────
const MOCK_RESPONSES: { match: RegExp; text: string; assets?: AssetRef[] }[] = [
  {
    match: /climate|flood|sea.?level|cyclone|environment/i,
    text: 'I found 21 relevant results across the catalogue for climate and environmental risk — showing the top 6 most relevant. They cover coastal inundation, cyclone projections, and historical climate indicators across Pacific and Asia-Pacific economies. Would you like to see more results, or filter by a specific region or data type?',
    assets: [
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Asia-Pacific Climate Indicators',
        description: 'Comprehensive dataset tracking temperature, precipitation, and sea-level metrics across 48 Asia-Pacific member economies.',
        access: 'ADB Only', users: '4.2k', uses: '1.3k', governanceVerified: true,
        sector: 'Agriculture, Natural Resources, and Rural Development', region: 'Asia-Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Pacific Coastal Inundation Risk',
        description: 'Coastal inundation risk projections under 1.5°C and 2°C warming scenarios for low-lying Pacific island states.',
        access: 'ADB Only', users: '2.1k', uses: '870',
        sector: 'Water and Other Urban Infrastructure and Services', region: 'Pacific',
      },
      {
        tag: 'Dashboard', tagColor: 'teal',
        title: 'Asia-Pacific Climate Indicators Dashboard',
        description: 'Publicly accessible dashboard of key climate indicators across Asia-Pacific economies, updated quarterly.',
        access: 'Public', users: '3.8k', governanceVerified: true,
        sector: 'Agriculture, Natural Resources, and Rural Development', region: 'Asia-Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Cyclone ARI500 Risk — Pacific',
        description: 'Annual recurrence interval projections for tropical cyclone wind speeds across Pacific island states, supporting infrastructure design standards.',
        access: 'ADB Only', users: '1.4k', uses: '530',
        sector: 'Water and Other Urban Infrastructure and Services', region: 'Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Sea Surface Temperature Anomalies',
        description: 'Monthly sea surface temperature anomaly records for the Indo-Pacific region, derived from satellite observations since 1982.',
        access: 'Public', users: '2.9k', uses: '1.1k',
        sector: 'Agriculture, Natural Resources, and Rural Development', region: 'Asia-Pacific',
      },
      {
        tag: 'API', tagColor: 'teal',
        title: 'Climate Indicators API',
        description: 'RESTful API providing programmatic access to ADB climate and environmental indicator time series for Asia-Pacific member economies.',
        access: 'ADB Only', users: '890', uses: '2.4k', governanceVerified: true,
        sector: 'Information and Communication Technology', region: 'Asia-Pacific',
      },
    ],
  },
  {
    match: /gdp|growth|economy|economic|inflation|cpi|debt/i,
    text: 'I found 34 relevant results for macroeconomic data — showing the top 6 most relevant. GDP growth across developing Asia averaged 4.2% in 2025, led by India (6.5%) and Vietnam (6.1%). Inflation has moderated in most economies following rate tightening cycles. Would you like more results, or should I narrow by economy or indicator?',
    assets: [
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'KIDB — Key Indicators for Asia and the Pacific',
        description: 'ADB\'s flagship statistical publication covering economic, social, and environmental indicators for 49 regional member economies.',
        access: 'Public', users: '18.4k', uses: '6.2k', governanceVerified: true, rai: true,
        sector: 'Multisector', region: 'Asia-Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Asia-Pacific Economic Outlook',
        description: 'Annual macroeconomic forecasts for 46 ADB developing member economies covering GDP, inflation, and external accounts.',
        access: 'ADB Only', users: '9.1k', uses: '3.4k',
        sector: 'Finance', region: 'Asia-Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Social Protection Indicators',
        description: 'Indicator data tracking social protection program coverage, expenditure, and beneficiary outcomes across Asia-Pacific.',
        access: 'ADB Only', users: '1.7k', uses: '460',
        sector: 'Health', region: 'Asia-Pacific',
      },
      {
        tag: 'Dashboard', tagColor: 'teal',
        title: 'Macroeconomic Monitoring Dashboard',
        description: 'Interactive dashboard for tracking real-time macroeconomic signals across ADB developing member economies.',
        access: 'ADB Only', users: '5.2k', governanceVerified: true,
        sector: 'Finance', region: 'Asia-Pacific',
      },
      {
        tag: 'Dataset', tagColor: 'blue',
        title: 'Nighttime Lights — Asia-Pacific',
        description: 'Satellite imagery tracking nighttime luminosity as a proxy for economic activity, electrification, and urban growth.',
        access: 'Restricted', users: '11.0k', uses: '364',
        sector: 'Energy', region: 'Asia-Pacific',
      },
      {
        tag: 'API', tagColor: 'teal',
        title: 'ADB Open Data API',
        description: 'RESTful API providing programmatic access to ADB macroeconomic indicators, project data, and statistical tables in JSON and CSV formats.',
        access: 'Public', users: '3.8k', uses: '5.4k', governanceVerified: true,
        sector: 'Public Sector Management', region: 'Asia-Pacific',
      },
    ],
  },
  {
    match: /agent|tool|ai|search|find|assist/i,
    text: 'I found 9 relevant AI tools and agents in the catalogue — showing the top 6 most relevant to your query. All are available to ADB staff. Would you like to see the full list, or filter by a specific capability?',
    assets: [
      {
        tag: 'AI Agent', tagColor: 'violet',
        title: 'ADB Navigator',
        description: 'Internal search and knowledge retrieval tool for ADB personnel to quickly locate relevant information across organisational systems.',
        access: 'ADB Only', users: '6.4k', uses: '259', rai: true,
        sector: 'Public Sector Management', region: 'Asia-Pacific',
      },
      {
        tag: 'AI Tool', tagColor: 'violet',
        title: 'Intelligent File Search',
        description: 'Enterprise search capability enabling semantic retrieval of documents, files, reports, and knowledge assets.',
        access: 'ADB Only', users: '11.3k', uses: '1.8k', verificationInProgress: true,
        sector: 'Information and Communication Technology', region: 'Asia-Pacific',
      },
      {
        tag: 'AI Platform', tagColor: 'violet',
        title: 'ADB Genie',
        description: 'Enterprise generative AI assistant unlocking development insights from thousands of trusted ADB documents and sources.',
        access: 'ADB Only', users: '9.1k', uses: '1.8k', rai: true,
        sector: 'Multisector', region: 'Asia-Pacific',
      },
      {
        tag: 'AI Agent', tagColor: 'violet',
        title: 'Document Summariser',
        description: 'AI agent that generates concise summaries of lengthy reports, policy documents, and project appraisal documents on demand.',
        access: 'ADB Only', users: '4.7k', uses: '980', verificationInProgress: true,
        sector: 'Public Sector Management', region: 'Asia-Pacific',
      },
      {
        tag: 'AI Tool', tagColor: 'violet',
        title: 'Translation Assistant',
        description: 'Multilingual document translation tool supporting ADB\'s 68 member language contexts for operational and knowledge products.',
        access: 'ADB Only', users: '3.2k', uses: '710', verificationInProgress: true,
        sector: 'Information and Communication Technology', region: 'Asia-Pacific',
      },
      {
        tag: 'AI Platform', tagColor: 'violet',
        title: 'eGIS Platform',
        description: 'Enterprise geographic information system platform providing ADB-wide access to spatial data, mapping tools, and geospatial analytics.',
        access: 'Restricted', users: '8.6k', uses: '2.3k', governanceVerified: true,
        sector: 'Information and Communication Technology', region: 'Asia-Pacific',
      },
    ],
  },
  {
    match: /.*/,
    text: `Based on available data, I've reviewed the relevant records across the ADB catalogue.

Key observations:
— The query spans multiple sectors and data domains within the ADB data ecosystem.
— Most related datasets are available to ADB staff and are maintained at production maturity.
— For deeper analysis, consider using ADB Navigator or the KIDB dataset for cross-economy comparisons.

Let me know if you'd like me to narrow the results by region, sector, or data type.`,
  },
];

function pickResponse(query: string) {
  return MOCK_RESPONSES.find(r => r.match.test(query)) ?? MOCK_RESPONSES[MOCK_RESPONSES.length - 1];
}

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PromptBarComponent, AIReasoningLoaderComponent, AssetCardComponent],
  templateUrl: './chat-view.component.html',
  styleUrl: './chat-view.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ChatViewComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly chatService    = inject(ChatService);

  chatId = '';

  readonly item = computed(() =>
    this.chatService.history().find(h => h.id === this.chatId) ?? null
  );

  readonly displayTitle = computed(() => {
    const i = this.item();
    if (!i) return '';
    return i.title || summarizeTitle(i.question);
  });

  editing   = false;
  editValue = '';
  isLoading = false;

  readonly turns         = signal<ChatTurn[]>([]);
  readonly copiedIndex   = signal<number | null>(null);
  readonly seedFeedback  = signal<'up' | 'down' | undefined>(undefined);
  readonly seedCopied    = signal(false);
  readonly feedbackPanel = signal<FeedbackPanel | null>(null);

  @ViewChild('titleInput') titleInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('threadEl')   threadEl?:    ElementRef<HTMLElement>;

  ngOnInit() {
    this.chatId = this.route.snapshot.paramMap.get('id') ?? '';
  }

  startEdit() {
    this.editValue = this.displayTitle();
    this.editing = true;
    setTimeout(() => this.titleInputRef?.nativeElement.select());
  }

  commitEdit() {
    const trimmed = this.editValue.trim();
    if (trimmed && trimmed !== this.displayTitle()) {
      this.chatService.updateTitle(this.chatId, trimmed);
    }
    this.editing = false;
  }

  cancelEdit() { this.editing = false; }

  onTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); this.commitEdit(); }
    if (e.key === 'Escape') { this.cancelEdit(); }
  }

  async sendFollowUp(text: string) {
    if (!text.trim() || this.isLoading) return;

    this.isLoading = true;

    this.turns.update(t => [
      ...t,
      { role: 'user', text },
      { role: 'ai',   text: '', loading: true },
    ]);

    this.scrollToBottom();

    const delay = 2500 + Math.random() * 1000;
    await new Promise(r => setTimeout(r, delay));

    const { text: responseText, assets } = pickResponse(text);

    this.turns.update(turns => {
      const updated = [...turns];
      updated[updated.length - 1] = { role: 'ai', text: responseText, assets, loading: false };
      return updated;
    });

    this.isLoading = false;
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.threadEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }

  copyTurn(index: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    });
  }

  feedbackChips(type: 'up' | 'down'): string[] {
    return type === 'up'
      ? ['Useful Sources', 'Relevant Response', 'Concise Answer', 'Other Feedback']
      : ['Incorrect Sources', 'Irrelevant Response', 'Unclear Answer', 'Other Feedback'];
  }

  copySeed() {
    navigator.clipboard.writeText(this.item()?.answer ?? '').then(() => {
      this.seedCopied.set(true);
      setTimeout(() => this.seedCopied.set(false), 2000);
    });
  }

  setSeedFeedback(value: 'up' | 'down') {
    if (this.seedFeedback() === value && this.feedbackPanel()?.key === 'seed') {
      this.seedFeedback.set(undefined);
      this.feedbackPanel.set(null);
      return;
    }
    this.seedFeedback.set(value);
    this.feedbackPanel.set({ key: 'seed', type: value, input: '', selectedChips: [], status: 'idle' });
  }

  setFeedback(index: number, value: 'up' | 'down') {
    const key = `turn-${index}`;
    const cur = this.turns()[index];
    if (cur?.feedback === value && this.feedbackPanel()?.key === key) {
      this.turns.update(ts => ts.map((t, i) => i === index ? { ...t, feedback: undefined } : t));
      this.feedbackPanel.set(null);
      return;
    }
    this.turns.update(ts => ts.map((t, i) => i === index ? { ...t, feedback: value } : t));
    this.feedbackPanel.set({ key, type: value, input: '', selectedChips: [], status: 'idle' });
  }

  selectFeedbackChip(chip: string) {
    const p = this.feedbackPanel();
    if (!p || p.status !== 'idle') return;
    const already = p.selectedChips.includes(chip);
    const selectedChips = already
      ? p.selectedChips.filter(c => c !== chip)
      : [...p.selectedChips, chip];
    this.feedbackPanel.set({ ...p, selectedChips });
  }

  get feedbackSubmitDisabled(): boolean {
    const p = this.feedbackPanel();
    return !!p && p.selectedChips.includes('Other Feedback') && !p.input.trim();
  }

  updatePanelInput(value: string) {
    const p = this.feedbackPanel();
    if (p) this.feedbackPanel.set({ ...p, input: value });
  }

  closeFeedbackPanel() {
    this.feedbackPanel.set(null);
  }

  async submitFeedback() {
    const p = this.feedbackPanel();
    if (!p || p.status !== 'idle') return;
    await new Promise(r => setTimeout(r, 500));
    this.feedbackPanel.set({ ...p, status: 'success' });
  }

  goBack() { this.router.navigate(['/home']); }
}
