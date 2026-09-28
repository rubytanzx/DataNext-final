import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AIReasoningLoaderComponent } from '../../shared/ui/loaders/ai-reasoning-loader/ai-reasoning-loader.component';
import { AgenticTask } from '../../shared/ui/loaders/agentic-task-loader/agentic-task-loader.component';
import { SearchLoaderComponent } from '../../shared/ui/loaders/search-loader/search-loader.component';
import { PromptBarComponent } from '../../shared/ui/prompt-bar/prompt-bar.component';
import { UploadItemComponent } from '../../shared/ui/upload-item/upload-item.component';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { ChatWidget, ChartBar, UploadedFile } from '../../types/widget.types';
import { WidgetSelectionService } from '../../services/widget-selection.service';

export type { ChatWidget, UploadedFile };

export type SearchTab = 'ai' | 'results';

export interface ResultItem {
  id: string;
  source?: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
  type: 'tool' | 'model' | 'data' | 'report' | 'pdf' | 'site' | 'link';
  displayType?: string;
  logoColor?: string;
  logoText?: string;
  rating?: string;
  audience?: string;
  gradient?: string;
  category?: string;
  datasets?: number;
  components?: number;
  region?: string;
  trustStatus?: string[];
  access?: 'Public' | 'ADB Only' | 'Restricted';
  sector?: string;
}

export type ChatMsg =
  | { id: number; type: 'user'; text: string; attachments?: UploadedFile[] }
  | { id: number; type: 'thinking'; agentic?: boolean }
  | { id: number; type: 'ai'; text: string; widgets?: ChatWidget[] };

interface SidebarOption { label: string; checked: boolean; count?: number; }
interface SidebarGroup  { name: string; expanded: boolean; options: SidebarOption[]; }
interface ScriptedTurn  { reply: string; widgets: ChatWidget[]; }

// ── Widget mock data ──────────────────────────────────────────────────────

const ASSET_WIDGETS: ChatWidget[] = [
  {
    id: 'w-asset-rai',
    widgetType: 'asset',
    title: 'ERDI Intelligence Platform',
    description: 'Integrated platform for economic research and development impact analysis. Provides access to ERDI data pipelines, projection models, and AI-assisted analytical workflows.',
    assetType: 'tool',
    displayType: 'AI Platform',
    rating: '4.8',
    users: '1,204 views',
    downloads: '267',
    slug: 'egis-platform',
  },
  {
    id: 'w-asset-crri',
    widgetType: 'asset',
    title: 'Climate Resilience Risk Index — Pacific SIDS',
    description: 'Composite index tracking climate vulnerability across Pacific small island developing states.',
    assetType: 'data',
    displayType: 'Dataset',
    rating: '4.7',
    users: '892 views',
    downloads: '201',
    slug: 'sdg-global-indicators-monitor',
  },
  {
    id: 'w-asset-erdi',
    widgetType: 'asset',
    title: 'ERDI Forward Projection Model (2026–2030)',
    description: 'Five-year economic projection model for Southeast Asia economies covering GDP growth, fiscal sustainability, and trade.',
    assetType: 'data',
    displayType: 'Dataset',
    rating: '4.9',
    users: '543 views',
    downloads: '117',
    slug: 'adb-key-indicators-database-kidb',
  },
  {
    id: 'w-asset-api',
    widgetType: 'asset',
    title: 'ADB OpenData API',
    description: 'RESTful API providing programmatic access to ADB statistical databases and development indicators across all 68 member economies.',
    assetType: 'tool',
    displayType: 'AI Platform',
    rating: '4.6',
    users: '2,156 views',
    downloads: '489',
    slug: 'adb-opendata-api',
  },
];

const CHART_WIDGET: ChatWidget = {
  id: 'w-chart-1',
  widgetType: 'chart',
  title: 'ADB Disbursements by Sector — FY 2024',
  description: 'Project Funding and Disbursement Dataset · AIBD · Fiscal Year 2024',
  assetType: 'data',
  chartBars: [
    { label: 'Transport',   value: 34 },
    { label: 'Energy',      value: 28 },
    { label: 'Water',       value: 18 },
    { label: 'Agriculture', value: 12 },
    { label: 'Finance',     value: 8  },
  ],
};

const TABLE_WIDGET: ChatWidget = {
  id: 'w-table-1',
  widgetType: 'table',
  title: 'Active Projects by Economy — Southeast Asia',
  description: 'ADB Project Data Sheets Data Product · AIBD · 5 economies',
  assetType: 'data',
  tableHeaders: ['Economy', 'Active Projects', 'Total Commitment', 'Sector Focus'],
  tableRows: [
    ['Philippines', 47, '$5.8B', 'Transport, Water'],
    ['Indonesia',   58, '$8.4B', 'Energy, Transport'],
    ['Viet Nam',    39, '$4.2B', 'Transport, Finance'],
    ['Cambodia',    24, '$1.9B', 'Agriculture, Water'],
    ['Myanmar',     12, '$0.7B', 'Agriculture'],
  ],
};

// ── Scripted AI conversation turns ────────────────────────────────────────

const CHAT_SCRIPTS: ScriptedTurn[] = [
  {
    reply: 'I found 4 relevant assets from the DataNext marketplace that are most relevant to your query. Select any to add to your Workspace.',
    widgets: ASSET_WIDGETS,
  },
  {
    reply: 'Focusing on the highest-signal assets: the disbursement breakdown and active projects table show the clearest picture of where ADB financing flows across the region.',
    widgets: [CHART_WIDGET, TABLE_WIDGET],
  },
];

const REASONING_PHASES = ['Thinking', 'Searching knowledge base', 'Preparing results'];

const DEFAULT_THOUGHTS: string[] = [
  'Parsing query intent and identifying key concepts...',
  'Scanning indexed knowledge base for relevant entries...',
  'Ranking and filtering results by relevance and recency...',
];

const ERDI_AI_THOUGHTS: string[] = [
  'Query relates to AI asset discovery within ERDI workflows...',
  'Identifying asset types: models, tools, portals, datasets...',
  'Filtering by governance status and access level...',
];

const ERDI_AI_TASKS: AgenticTask[] = [
  { title: 'Identify AI asset categories for ERDI workflows', status: 'completed' },
  { title: 'Search ERDI projection model documentation', status: 'in-progress' },
  { title: 'Match assets to economic modelling requirements', status: 'pending' },
  { title: 'Compile asset recommendations', status: 'pending' },
];

const AI_SUMMARY = `ADB's ERDI Intelligence Hub provides access to economic research tools, AI platforms, and analytical data collections developed by the Economic Research and Development Impact department. Key resources include the Responsible AI Platform for structured AI governance evaluation, Navigator for internal knowledge retrieval, and the ERDI Forward Projection Model (2026–2030) covering Southeast Asia economies. All tools are governed by ADB's Responsible AI Framework.`;

const AI_FULL = `ADB's ERDI Intelligence Hub provides access to economic research tools, AI platforms, and analytical data collections developed by the Economic Research and Development Impact department.

Key resources include the Responsible AI Platform for structured AI governance evaluation, Navigator for internal knowledge retrieval, and the ERDI Forward Projection Model (2026–2030) covering Southeast Asia economies.

For data-intensive work, the Climate Resilience Risk Index (Pacific SIDS) and SDG Alignment Tracker (Southeast Asia Portfolio) offer pre-built analytical frameworks with curated datasets. The ADB OpenData API provides programmatic access to all 68 member economy indicators.

All tools are governed by ADB's Responsible AI Framework, which requires a two-stage RAI Assessment before any AI system can be launched or accessed by internal or external users. Contact AI_Ops@adb.org for assessment guidance. Mandatory annual RAI training applies to all staff with access to AI self-service capabilities.`;

const RELATED_QUERIES = [
  'What AI Assets apply to ERDI\'s economic projection workflows?',
  'Which data collections support climate resilience analysis in the Pacific?',
  'How do I access the Responsible AI Platform for use-case evaluation?',
];

const GUARDRAIL_RESPONSES = [
  "Thanks for your follow-up. This prototype is running in demo mode without a live knowledge base connection. The initial response above reflects the system's full capability when connected to ADB's data catalogue.",
  "Good question — in the full system I'd search across ADB's knowledge base to give you a precise answer. For now, this demo is limited to the initial query response. Reach out to the ERDI team if you'd like to explore a specific topic further.",
  "I appreciate your question. Extended follow-up responses require a live connection to ADB's knowledge base. Please refer to the initial response above, or contact erdi@adb.org for direct assistance.",
];

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    name: 'Availability',
    expanded: true,
    options: [
      { label: 'Available now',        checked: false, count: 86 },
      { label: 'Ingestion in progress', checked: false, count: 23 },
      { label: 'Planned/roadmap',      checked: false, count: 11 },
    ],
  },
  {
    name: 'Trust Status',
    expanded: true,
    options: [
      { label: 'Governance Verified',         checked: false, count: 61 },
      { label: 'Responsible AI Verified',     checked: false, count: 54 },
      { label: 'Verification in Progress',    checked: false, count: 18 },
    ],
  },
  {
    name: 'Sector Group',
    expanded: false,
    options: [
      { label: 'Climate & Environment', checked: false },
      { label: 'Economic Research',     checked: false },
      { label: 'Infrastructure',        checked: false },
      { label: 'Trade & Connectivity',  checked: false },
      { label: 'Social Development',    checked: false },
      { label: 'Energy',                checked: false },
    ],
  },
  {
    name: 'Data Maturity',
    expanded: false,
    options: [
      { label: 'Production',    checked: false },
      { label: 'Experimental',  checked: false },
      { label: 'Deprecated',    checked: false },
    ],
  },
  {
    name: 'Update Frequency',
    expanded: false,
    options: [
      { label: 'Real-time', checked: false },
      { label: 'Daily',     checked: false },
      { label: 'Weekly',    checked: false },
      { label: 'Monthly',   checked: false },
      { label: 'Annual',    checked: false },
    ],
  },
  {
    name: 'Owner Department',
    expanded: false,
    options: [
      { label: 'CCSD', checked: false },
      { label: 'ERDI', checked: false },
      { label: 'IED',  checked: false },
      { label: 'ITD',  checked: false },
      { label: 'ORM',  checked: false },
      { label: 'SPD',  checked: false },
    ],
  },
  {
    name: 'Format',
    expanded: false,
    options: [
      { label: 'GeoTIFF',   checked: false },
      { label: 'Parquet',   checked: false },
      { label: 'CSV',       checked: false },
      { label: 'Shapefile', checked: false },
      { label: 'API',       checked: false },
    ],
  },
];

const ALL_RESULTS: ResultItem[] = [
  {
    id: 'rai',
    title: 'Responsible AI Platform',
    description: 'Operationalises ADB\'s Responsible AI Framework through structured risk assessment of AI use cases. Supports the two-stage RAI Assessment required before any AI system is deployed or accessed by staff.',
    author: 'ITD / AI Operations',
    date: '10 Jul 2026',
    type: 'tool',
    displayType: 'AI Platform',
    logoColor: '#007DB7',
    logoText: 'RAI',
    rating: 'Gold · 95% rated',
    audience: 'All Staff',
    access: 'Public',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Digital Technology',
  },
  {
    id: 'navigator',
    title: 'Navigator',
    description: 'Employee AI assistant for all ADB staff. Surfaces internal documents, answers policy queries, handles HR processes, and connects staff with ADB\'s knowledge base across departments and Resident Missions.',
    author: 'ITD / Digital Platforms',
    date: '01 Jun 2026',
    type: 'tool',
    displayType: 'AI Agent',
    logoColor: 'linear-gradient(135deg, #8DC63F 0%, #007DB7 100%)',
    logoText: 'Nav',
    rating: 'Gold · 97% rated',
    audience: 'All Staff',
    access: 'Public',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Digital Technology',
  },
  {
    id: 'genie',
    title: 'Powered by Genie',
    description: 'Advanced research assistant for summarising development research, comparing AI model outputs, and running multi-agent workflows for deep analytical inquiries on economics and development topics.',
    author: 'ITD / Digital Platforms',
    date: '15 May 2026',
    type: 'tool',
    displayType: 'AI Agent',
    logoColor: 'linear-gradient(135deg, #AE5DED 0%, #68C5EA 100%)',
    logoText: 'Genie',
    rating: 'Silver · 88% rated',
    audience: 'All Staff',
    access: 'Public',
    trustStatus: ['Governance Verified'],
    sector: 'Digital Technology',
  },
  {
    id: 'api',
    title: 'ADB OpenData API',
    description: 'RESTful API providing programmatic access to ADB statistical databases, project documents, and development indicators across all 68 member economies. Supports OAuth 2.0 authentication.',
    author: 'ITD Enterprise Applications',
    date: '01 Jan 2026',
    type: 'tool',
    displayType: 'API',
    logoColor: '#1B5E20',
    logoText: 'API',
    rating: 'Gold · 92% rated',
    audience: 'ADB-approved',
    access: 'ADB Only',
    trustStatus: ['Governance Verified'],
    sector: 'Economic Research',
  },
  {
    id: 'edp',
    title: 'ERDI Data Pipeline',
    description: 'Automated pipeline tools for ingesting, transforming, and publishing economic research datasets from ERDI team workflows. Connects to EDP 2.0 and supports Power BI integration.',
    author: 'ERDI / Data Engineering',
    date: '20 Jun 2026',
    type: 'tool',
    displayType: 'AI Tool',
    logoColor: '#E65100',
    logoText: 'EDP',
    rating: 'Silver · 83% rated',
    audience: 'ERDI Team',
    access: 'Restricted',
    trustStatus: ['Verification in Progress'],
    sector: 'Digital Technology',
  },
  {
    id: 'gpt4o',
    title: 'GPT-4o',
    description: 'Multimodal large language model with strong reasoning, coding, and analysis capabilities. Available via ADB-approved API access for research workflows. Requires RAI Assessment before institutional use.',
    author: 'OpenAI / ADB-approved',
    date: '01 Mar 2026',
    type: 'model',
    displayType: 'AI Agent',
    logoColor: '#10a37f',
    logoText: 'GPT',
    rating: 'Silver · 90% rated',
    audience: 'ADB-approved',
    access: 'ADB Only',
    trustStatus: ['Verification in Progress'],
    sector: 'Digital Technology',
  },
  {
    id: 'claude',
    title: 'Claude 3.5 Sonnet',
    description: 'Frontier language model optimised for nuanced analysis, document review, and long-form writing. Deployed as the underlying inference model in Navigator and Genie for ERDI research workflows.',
    author: 'Anthropic / ADB-approved',
    date: '20 Jun 2026',
    type: 'model',
    displayType: 'AI Agent',
    logoColor: '#CC785C',
    logoText: 'Cl',
    rating: 'Gold · 93% rated',
    audience: 'ADB-approved',
    access: 'ADB Only',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Digital Technology',
  },
  {
    id: 'gemini',
    title: 'Gemini 2.0 Flash',
    description: 'Google\'s fast multimodal model with strong data extraction and chart-reading capabilities. Used in pilot workflows for rapid economic data summarisation across Pacific and Southeast Asia portfolios.',
    author: 'Google DeepMind / ADB-approved',
    date: '10 May 2026',
    type: 'model',
    displayType: 'AI Agent',
    logoColor: '#4285F4',
    logoText: 'Gem',
    rating: 'Silver · 87% rated',
    audience: 'ADB-approved',
    access: 'ADB Only',
    trustStatus: ['Verification in Progress'],
    sector: 'Digital Technology',
  },
  {
    id: 'crri',
    title: 'Climate Resilience Risk Index — Pacific SIDS',
    description: 'Composite index tracking climate vulnerability across Pacific small island developing states. Integrates datasets spanning sea-level rise exposure, adaptive capacity, and economic resilience indicators.',
    author: 'Pacific Department',
    date: '15 Jun 2026',
    type: 'data',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #1B5E20 0%, #004D40 100%)',
    category: 'Climate Change & Sustainable Development',
    datasets: 8,
    components: 3,
    region: 'Pacific',
    rating: 'Gold · 94% rated',
    access: 'Public',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Climate & Environment',
  },
  {
    id: 'sdg',
    title: 'SDG Alignment Tracker — Southeast Asia Portfolio',
    description: 'Tracks SDG alignment across ADB\'s Southeast Asia project portfolio. Maps core datasets to Sustainable Development Goal targets for portfolio-level progress reporting and Board submissions.',
    author: 'ERDI / Strategy',
    date: '01 Jun 2026',
    type: 'data',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #8b6400 0%, #a07518 55%, #7a5c10 100%)',
    category: 'Strategy, Policy & Partnerships',
    datasets: 4,
    components: 2,
    region: 'Southeast Asia',
    rating: 'Gold · 91% rated',
    access: 'Public',
    trustStatus: ['Governance Verified'],
    sector: 'Strategy & Policy',
  },
  {
    id: 'erdi-model',
    title: 'ERDI Forward Projection Model (2026–2030)',
    description: 'Five-year economic projection model for Southeast Asia economies. Covers indicators across GDP growth, fiscal sustainability, trade, and climate-adjusted development pathways.',
    author: 'ERDI / Economic Research',
    date: '20 May 2026',
    type: 'data',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #1a5e3a 0%, #174d32 55%, #0f3322 100%)',
    category: 'Economic Research & Development Impact',
    datasets: 12,
    components: 4,
    region: 'Southeast Asia',
    rating: 'Gold · 96% rated',
    access: 'Public',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Economic Research',
  },
  {
    id: 'pet',
    title: 'Pacific Energy Transition Dataset',
    description: 'Comprehensive dataset covering the Pacific region\'s transition to renewable energy. Includes datasets on solar capacity, grid infrastructure, energy access, and climate financing flows.',
    author: 'Pacific Department',
    date: '10 Jun 2026',
    type: 'report',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #BF360C 0%, #37474F 100%)',
    category: 'Energy',
    datasets: 6,
    components: 2,
    region: 'Pacific',
    rating: 'Silver · 85% rated',
    access: 'Public',
    trustStatus: ['Verification in Progress'],
    sector: 'Energy',
  },
  {
    id: 'seaudi',
    title: 'Southeast Asia Urban Development Index',
    description: 'Annual index tracking urban development progress across Southeast Asian economies. Covers infrastructure quality, urbanisation rates, housing affordability, and service delivery for ASEAN members.',
    author: 'ERDI / Infrastructure',
    date: '01 May 2026',
    type: 'report',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #006064 0%, #1A237E 100%)',
    category: 'Infrastructure',
    datasets: 9,
    components: 4,
    region: 'Southeast Asia',
    rating: 'Silver · 82% rated',
    access: 'Public',
    trustStatus: ['Governance Verified'],
    sector: 'Infrastructure',
  },
  {
    id: 'catcm',
    title: 'Central Asia Trade Connectivity Model',
    description: 'Quantitative model assessing trade connectivity across Central Asia. Covers transport infrastructure utilisation, trade volumes, and CAREC corridor performance metrics for ADB portfolio analysis.',
    author: 'CWRD / Economic Analysis',
    date: '15 Apr 2026',
    type: 'report',
    displayType: 'Dataset',
    gradient: 'linear-gradient(160deg, #37474F 0%, #BF360C 100%)',
    category: 'Trade & Connectivity',
    datasets: 11,
    components: 5,
    region: 'Central Asia',
    rating: 'Gold · 90% rated',
    access: 'ADB Only',
    trustStatus: ['Governance Verified', 'Responsible AI Verified'],
    sector: 'Trade & Connectivity',
  },
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, AIReasoningLoaderComponent, SearchLoaderComponent, PromptBarComponent, UploadItemComponent, AssetCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit, OnDestroy {
  private readonly route        = inject(ActivatedRoute);
  readonly router               = inject(Router);
  private readonly cdr          = inject(ChangeDetectorRef);
  private readonly widgetService = inject(WidgetSelectionService);

  searchQuery      = '';
  followUp         = '';
  summaryFollowUp  = '';
  filterKeyword    = '';
  filterLoading    = false;
  sidebarFilterSearch = '';
  private filterLoadingTimer?: ReturnType<typeof setTimeout>;

  readonly notebooks = ['Country Intelligence', 'Transport Projects', 'Climate Data'];
  openDropCardId: string | null = null;
  pillDropOpen = false;

  readonly suggestedPrompts = [
    'What datasets are available for climate risk analysis?',
    'Summarise recent ADB transport projects in Southeast Asia',
    'Which AI agents can help with project preparation?',
    'Show me geospatial data covering the Pacific region',
    'What social protection datasets are available?',
    'How do I find assets related to procurement and contracts?',
    'Which portals are available to all ADB staff?',
    'Find data on cross-border movement and mobility',
  ];

  readonly dashboardPrompt = 'Show me a dashboard of ADB disbursements and active project activity';

  activeTab: SearchTab = 'results';
  isLoaded         = false;
  aiResponseVisible = false;
  relatedLoaded    = false;
  tabFading        = false;
  summaryExpanded  = false;
  thumbsState: 'up' | 'down' | null = null;

  // ── Per-AI-response feedback state ────────────────────────────
  readonly feedbackOptions = ['Useful Sources', 'Relevant Response', 'Concise Answer', 'Other Feedback'];
  readonly feedbackOptionsDown = ['Inaccurate', "Didn't answer question", 'Too vague', 'Other Feedback'];

  // initial chat response
  chatThumbsState: 'up' | 'down' | null = null;
  chatFeedbackOpen = false;
  chatCopied = false;
  chatFeedbackSelected: string[] = [];
  chatFeedbackText = '';

  // per follow-up message (keyed by msg.id)
  msgThumbsState:     { [id: number]: 'up' | 'down' | null } = {};
  msgFeedbackOpen:    { [id: number]: boolean }               = {};
  msgCopied:          { [id: number]: boolean }               = {};
  msgFeedbackSelected:{ [id: number]: string[] }              = {};
  msgFeedbackText:    { [id: number]: string }                = {};

  // ── Animated placeholder ───────────────────────────────────────
  readonly phSuggestions = ['data', 'dashboards', 'AI agents', 'AI tools', 'AI platforms', 'APIs'];
  readonly phIndex        = signal(0);
  readonly phPrev         = signal(0);
  readonly phTransitioning = signal(false);
  readonly barFocused     = signal(false);
  private phTimer?: ReturnType<typeof setInterval>;
  private phTransTimer?: ReturnType<typeof setTimeout>;

  messages: ChatMsg[] = [];
  reasoningPhaseIdx = 0;

  // ── Widget selection state ─────────────────────────────────────
  selectedWidgetIds = new Set<string>();
  pendingFiles: UploadedFile[] = [];
  private scriptIdx = 0;

  get selectedCount(): number { return this.selectedWidgetIds.size; }
  get hasSelection(): boolean { return this.selectedWidgetIds.size > 0; }

  // ── Search-results faceted filters ────────────────────────────
  srFilters: {
    assetTypes:    Set<string>;
    trustStatuses: Set<string>;
    access:        Set<string>;
    sectors:       Set<string>;
    regions:       Set<string>;
  } = {
    assetTypes:    new Set(),
    trustStatuses: new Set(),
    access:        new Set(),
    sectors:       new Set(),
    regions:       new Set(),
  };

  srGroupExpanded: { [k: string]: boolean } = {
    assetType:   true,
    trustStatus: true,
    access:      true,
    sector:      false,
    region:      false,
    timePeriod:  false,
  };

  readonly yearMin = 2000;
  readonly yearMax = 2030;
  yearFrom = 2015;
  yearTo   = 2026;

  get yearFromPct(): number {
    return ((this.yearFrom - this.yearMin) / (this.yearMax - this.yearMin)) * 100;
  }

  get yearToPct(): number {
    return ((this.yearTo - this.yearMin) / (this.yearMax - this.yearMin)) * 100;
  }

  onYearFromChange(value: number): void {
    this.yearFrom = Math.min(value, this.yearTo);
  }

  onYearToChange(value: number): void {
    this.yearTo = Math.max(value, this.yearFrom);
  }

  private loadTimer?: ReturnType<typeof setTimeout>;
  private aiTimer?: ReturnType<typeof setTimeout>;
  private relatedTimer?: ReturnType<typeof setTimeout>;
  private reasoningInterval?: ReturnType<typeof setInterval>;
  private tabFadingTimer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;

  toastMsg = '';
  private guardrailIdx = 0;

  readonly reasoningPhases  = REASONING_PHASES;
  readonly erdiAiTasks      = ERDI_AI_TASKS;
  readonly erdiAiThoughts   = ERDI_AI_THOUGHTS;
  readonly defaultThoughts  = DEFAULT_THOUGHTS;
  readonly relatedQueries   = RELATED_QUERIES;
  readonly aiSummaryText   = AI_SUMMARY;
  readonly aiFullText      = AI_FULL;
  readonly skeletonWidths  = [88, 72, 80];

  get currentPhase(): string {
    return REASONING_PHASES[this.reasoningPhaseIdx] ?? REASONING_PHASES[0];
  }

  private readonly STOP_WORDS = new Set([
    'a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should',
    'may','might','shall','can','need','dare','ought','used',
    'i','we','you','he','she','it','they','me','us','him','her','them',
    'my','our','your','his','its','their','this','that','these','those',
    'what','which','who','whom','whose','where','when','why','how',
    'and','or','but','if','in','on','at','to','for','of','with','by',
    'from','about','as','into','through','during','before','after',
    'above','below','between','out','off','over','under','then','than',
    'so','yet','both','either','neither','not','no','any','all','each',
    'show','me','find','get','list','give','tell','let','make','do',
    'available','related','my','some','many','more','most',
  ]);

  private queryKeywords(): string[] {
    return (this.searchQuery || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.STOP_WORDS.has(w));
  }

  private matchesSearchQuery(item: ResultItem): boolean {
    const keywords = this.queryKeywords();
    if (keywords.length === 0) return true;
    const hay = `${item.title} ${item.description} ${item.author ?? ''}`.toLowerCase();
    return keywords.some(kw => hay.includes(kw));
  }

  private matchesKeyword(item: ResultItem): boolean {
    if (!this.filterKeyword.trim()) return true;
    const kw = this.filterKeyword.toLowerCase();
    return (
      item.title.toLowerCase().includes(kw) ||
      item.description.toLowerCase().includes(kw) ||
      (item.author ?? '').toLowerCase().includes(kw)
    );
  }

  // ── Faceted filter core ────────────────────────────────────────

  private get srBaseResults(): ResultItem[] {
    return ALL_RESULTS.filter(r => this.matchesSearchQuery(r) && this.matchesKeyword(r));
  }

  private srMatchesFilters(item: ResultItem): boolean {
    const { assetTypes, trustStatuses, access, sectors, regions } = this.srFilters;
    if (assetTypes.size > 0 && !assetTypes.has(this.itemDisplayType(item))) return false;
    if (trustStatuses.size > 0 && !(item.trustStatus ?? []).some(t => trustStatuses.has(t))) return false;
    if (access.size > 0 && !access.has(item.access ?? 'Public')) return false;
    if (sectors.size > 0 && !sectors.has(item.sector ?? '')) return false;
    if (regions.size > 0 && !regions.has(item.region ?? '')) return false;
    return true;
  }

  get srFilteredResults(): ResultItem[] {
    return this.srBaseResults.filter(r => this.srMatchesFilters(r));
  }

  private srFacetCounts(results: ResultItem[], key: (r: ResultItem) => string | string[]): [string, number][] {
    const counts = new Map<string, number>();
    for (const item of results) {
      const raw = key(item);
      const vals = Array.isArray(raw) ? raw : [raw];
      vals.forEach(v => { if (v) counts.set(v, (counts.get(v) ?? 0) + 1); });
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }

  // Asset Type facets exclude asset type filter so multi-select stays visible
  get srAssetTypeFacets(): [string, number][] {
    const base = this.srBaseResults.filter(r => {
      const { trustStatuses, access, sectors, regions } = this.srFilters;
      if (trustStatuses.size > 0 && !(r.trustStatus ?? []).some(t => trustStatuses.has(t))) return false;
      if (access.size > 0 && !access.has(r.access ?? 'Public')) return false;
      if (sectors.size > 0 && !sectors.has(r.sector ?? '')) return false;
      if (regions.size > 0 && !regions.has(r.region ?? '')) return false;
      return true;
    });
    return this.srFacetCounts(base, r => this.itemDisplayType(r));
  }

  get srTrustStatusFacets(): [string, number][] {
    return this.srFacetCounts(this.srFilteredResults, r => r.trustStatus ?? []);
  }

  get srAccessFacets(): [string, number][] {
    return this.srFacetCounts(this.srFilteredResults, r => r.access ?? 'Public');
  }

  get srSectorFacets(): [string, number][] {
    return this.srFacetCounts(this.srFilteredResults, r => r.sector ?? '');
  }

  get srRegionFacets(): [string, number][] {
    return this.srFacetCounts(this.srFilteredResults, r => r.region ?? '');
  }

  srToggle(dim: 'assetTypes' | 'trustStatuses' | 'access' | 'sectors' | 'regions', val: string) {
    const s = new Set(this.srFilters[dim]);
    s.has(val) ? s.delete(val) : s.add(val);
    this.srFilters = { ...this.srFilters, [dim]: s };
  }

  srClearDim(dim: 'assetTypes' | 'trustStatuses' | 'access' | 'sectors' | 'regions') {
    this.srFilters = { ...this.srFilters, [dim]: new Set() };
  }

  readonly sectionOrder = ['Dataset', 'Dashboard', 'AI Agent', 'AI Tool', 'AI Platform', 'API'];

  get resultSections(): { label: string; items: ResultItem[] }[] {
    return this.sectionOrder
      .map(label => ({
        label,
        items: this.srFilteredResults.filter(r => this.itemDisplayType(r) === label),
      }))
      .filter(s => s.items.length > 0);
  }

  get matchedResultsCount(): number { return this.srFilteredResults.length; }

  get resultCount(): string { return `${this.matchedResultsCount} Related Result(s)`; }

  get activeFilterCount(): number {
    const { assetTypes, trustStatuses, access, sectors, regions } = this.srFilters;
    let n = assetTypes.size + trustStatuses.size + access.size + sectors.size + regions.size;
    if (this.yearFrom !== 2015 || this.yearTo !== 2026) n++;
    return n;
  }

  clearAllFilters() {
    this.srFilters = { assetTypes: new Set(), trustStatuses: new Set(), access: new Set(), sectors: new Set(), regions: new Set() };
    this.yearFrom = 2015;
    this.yearTo   = 2026;
  }

  addGeoTag(_e: KeyboardEvent) { /* removed */ }
  removeGeoTag(_i: number) { /* removed */ }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q    = params['q'] || '';
      const tab  = params['tab'] as SearchTab | undefined;
      const flow = params['flow'] as string | undefined;
      if (q !== this.searchQuery) {
        this.searchQuery = q;
        this.handleQueryChange(tab, flow);
      }
    });
    this.startPhRotation();
  }

  ngOnDestroy() { this.clearAllTimers(); }

  private clearAllTimers() {
    clearTimeout(this.loadTimer);
    clearTimeout(this.aiTimer);
    clearTimeout(this.relatedTimer);
    clearTimeout(this.filterLoadingTimer);
    clearTimeout(this.tabFadingTimer);
    clearTimeout(this.toastTimer);
    clearInterval(this.reasoningInterval);
    clearInterval(this.phTimer);
    clearTimeout(this.phTransTimer);
  }

  private startPhRotation() {
    this.phTimer = setInterval(() => {
      if (this.searchQuery || this.barFocused()) return;
      this.phPrev.set(this.phIndex());
      this.phIndex.set((this.phIndex() + 1) % this.phSuggestions.length);
      this.phTransitioning.set(true);
      clearTimeout(this.phTransTimer);
      this.phTransTimer = setTimeout(() => {
        this.phTransitioning.set(false);
      }, 400);
    }, 3000);
  }

  onBarFocus() { this.barFocused.set(true); }
  onBarBlur()  { this.barFocused.set(false); }

  onFilterKeywordChange(value: string): void {
    this.filterKeyword = value;
    if (value.trim()) {
      this.filterLoading = true;
      clearTimeout(this.filterLoadingTimer);
      this.filterLoadingTimer = setTimeout(() => {
        this.filterLoading = false;
        this.cdr.markForCheck();
      }, 500);
    } else {
      this.filterLoading = false;
    }
    this.cdr.markForCheck();
  }

  private handleQueryChange(initialTab?: SearchTab, flow?: string) {
    this.clearAllTimers();
    this.isLoaded         = false;
    this.aiResponseVisible = false;
    this.relatedLoaded    = false;
    this.activeTab        = initialTab ?? 'results';
    this.messages         = [];
    this.followUp         = '';
    this.summaryFollowUp  = '';
    this.filterKeyword    = '';
    this.summaryExpanded  = false;
    this.thumbsState      = null;
    this.selectedWidgetIds = new Set();
    this.pendingFiles      = [];
    this.scriptIdx = flow === 'dashboard' ? 1 : 0;

    if (!this.searchQuery.trim()) return;
    this.loadTimer = setTimeout(() => {
      this.isLoaded = true;
      if (this.activeTab === 'ai') this.triggerAIAnimation();
      this.cdr.markForCheck();
    }, 2000);
  }

  setTab(tab: SearchTab) {
    if (tab === this.activeTab) return;
    clearTimeout(this.tabFadingTimer);
    this.tabFading = true;
    this.cdr.markForCheck();
    this.tabFadingTimer = setTimeout(() => {
      this.activeTab = tab;
      this.tabFading = false;
      if (tab === 'ai') this.triggerAIAnimation();
      this.cdr.markForCheck();
    }, 120);
  }

  private triggerAIAnimation() {
    clearTimeout(this.aiTimer);
    clearTimeout(this.relatedTimer);
    clearInterval(this.reasoningInterval);

    this.aiResponseVisible = false;
    this.relatedLoaded     = false;
    this.reasoningPhaseIdx = 0;

    this.reasoningInterval = setInterval(() => {
      if (this.reasoningPhaseIdx < REASONING_PHASES.length - 1) {
        this.reasoningPhaseIdx++;
        this.cdr.markForCheck();
      } else {
        clearInterval(this.reasoningInterval);
      }
    }, 1500);

    this.aiTimer = setTimeout(() => {
      this.aiResponseVisible = true;
      clearInterval(this.reasoningInterval);
      this.cdr.markForCheck();
    }, 4000);

    this.relatedTimer = setTimeout(() => {
      this.relatedLoaded = true;
      this.cdr.markForCheck();
    }, 4500);
  }

  sendFollowUp(textOverride?: string) {
    const text = (textOverride ?? this.followUp).trim();
    if (!text) return;
    if (!textOverride) this.followUp = '';

    const uid     = Date.now();
    const uploads = this.pendingFiles.filter(f => f.status === 'success');
    const hasUploads = uploads.length > 0;
    if (hasUploads) this.pendingFiles = [];

    const userMsg: ChatMsg = hasUploads
      ? { id: uid, type: 'user', text, attachments: uploads }
      : { id: uid, type: 'user', text };

    const agentic = !hasUploads && this.scriptIdx === 0;
    this.messages = [...this.messages, userMsg, { id: uid + 1, type: 'thinking', agentic }];
    this.cdr.markForCheck();

    const delay = 850 + Math.random() * 450;
    setTimeout(() => {
      let aiMsg: Extract<ChatMsg, { type: 'ai' }>;

      if (hasUploads) {
        const names = uploads.map(u => u.name).join(', ');
        const fileWidgets: ChatWidget[] = uploads.map(f => ({
          id: `w-file-${f.id}`,
          widgetType: 'file' as const,
          title: f.name,
          description: 'Uploaded file — available to include in your Workspace',
          assetType: 'file' as const,
          fileExt: f.ext,
          fileSize: f.size,
        }));
        aiMsg = {
          id: uid + 1, type: 'ai',
          text: `I've added \`${names}\` to your context — ${uploads.length === 1 ? 'it is' : 'they are'} indexed and available as a selectable asset below.`,
          widgets: fileWidgets,
        };
      } else if (this.scriptIdx < CHAT_SCRIPTS.length) {
        const script = CHAT_SCRIPTS[this.scriptIdx++];
        aiMsg = { id: uid + 1, type: 'ai', text: script.reply, widgets: script.widgets };
      } else {
        const reply = GUARDRAIL_RESPONSES[this.guardrailIdx % GUARDRAIL_RESPONSES.length];
        this.guardrailIdx++;
        aiMsg = { id: uid + 1, type: 'ai', text: reply };
      }

      this.messages = this.messages.map(m => m.id === uid + 1 ? aiMsg : m);
      this.cdr.markForCheck();
    }, delay);
  }

  // ── Widget selection ───────────────────────────────────────────
  onCardClick(w: ChatWidget): void {
    if (w.widgetType === 'asset' && w.slug) {
      window.open(`/assets/${w.slug}`, '_blank');
    } else {
      this.toggleWidget(w.id);
    }
  }

  toggleWidget(id: string, event?: Event) {
    event?.stopPropagation();
    const s = new Set(this.selectedWidgetIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selectedWidgetIds = s;
    this.cdr.markForCheck();
  }

  isWidgetSelected(id: string): boolean { return this.selectedWidgetIds.has(id); }

  maxChartVal(bars: ChartBar[]): number { return Math.max(...bars.map(b => b.value)); }

  widgetTagColor(w: ChatWidget): 'blue' | 'violet' | 'amber' | 'teal' {
    const map: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'AI Platform': 'blue', 'AI Agent': 'violet',
      'AI Tool': 'violet', 'API': 'teal', 'Dashboard': 'amber',
    };
    return map[w.displayType ?? ''] ?? 'blue';
  }

  widgetTypeLabel(t: ChatWidget['widgetType']): string {
    const map: Record<string, string> = {
      chart: 'Chart', table: 'Table', dataset: 'Dataset',
      document: 'Document', file: 'File',
    };
    return map[t] ?? t;
  }

  // ── File upload ────────────────────────────────────────────────
  onFileAttach(files: FileList) {
    Array.from(files).forEach((f, i) => {
      const ext  = (f.name.split('.').pop() ?? 'file').toUpperCase();
      const kb   = Math.round(f.size / 1024) || 1;
      const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
      const id   = `upload-${Date.now()}-${i}`;
      this.pendingFiles = [...this.pendingFiles, { id, name: f.name, size, ext, status: 'loading' }];
      setTimeout(() => {
        this.pendingFiles = this.pendingFiles.map(pf =>
          pf.id === id ? { ...pf, status: 'success' } : pf
        );
        this.cdr.markForCheck();
      }, 700 + i * 250);
    });
    this.cdr.markForCheck();
  }

  // ── Space handoff ───────────────────────────────────────────────
  addToSpace(spaceName?: string) {
    const allWidgets = this.messages
      .filter((m): m is Extract<ChatMsg, { type: 'ai' }> => m.type === 'ai')
      .flatMap(m => m.widgets ?? []);
    const selected = allWidgets.filter(w => this.selectedWidgetIds.has(w.id));
    this.closePillDrop();

    if (spaceName) {
      // Add to existing space → toast confirmation, stay on page
      const n = selected.length;
      this.selectedWidgetIds = new Set();
      this.showToast(`${n} asset${n !== 1 ? 's' : ''} added to "${spaceName}"`);
    } else {
      // Create new space → navigate
      this.widgetService.selectedWidgets.set(selected);
      this.widgetService.searchQuery.set(this.searchQuery);
      this.widgetService.conversation.set(this.messages as any);
      this.router.navigate(['/notebooks', 'new']);
    }
  }

  private showToast(msg: string) {
    this.toastMsg = msg;
    this.cdr.markForCheck();
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMsg = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  submitSummaryFollowUp(e?: Event) {
    e?.preventDefault();
    const q = this.summaryFollowUp.trim();
    if (!q) return;
    this.summaryFollowUp = '';

    this.clearAllTimers();
    this.tabFading = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.activeTab        = 'ai';
      this.tabFading        = false;
      this.aiResponseVisible = true;
      this.relatedLoaded    = true;
      this.sendFollowUp(q);
      this.cdr.markForCheck();
    }, 120);
  }

  toggleSummary() { this.summaryExpanded = !this.summaryExpanded; }
  setThumb(t: 'up' | 'down') { this.thumbsState = this.thumbsState === t ? null : t; }

  setChatThumb(t: 'up' | 'down') {
    this.chatThumbsState = this.chatThumbsState === t ? null : t;
    this.chatFeedbackOpen = !!this.chatThumbsState;
    if (this.chatFeedbackOpen) this.chatFeedbackSelected = [];
  }
  closeChatFeedback() { this.chatFeedbackOpen = false; }
  toggleChatFeedbackOption(opt: string) {
    const i = this.chatFeedbackSelected.indexOf(opt);
    if (i > -1) this.chatFeedbackSelected.splice(i, 1);
    else this.chatFeedbackSelected.push(opt);
  }
  copyChatResponse() {
    navigator.clipboard.writeText(this.aiSummaryText);
    this.chatCopied = true;
    setTimeout(() => { this.chatCopied = false; }, 1800);
  }
  submitChatFeedback() { this.chatFeedbackOpen = false; }

  setMsgThumb(id: number, t: 'up' | 'down') {
    this.msgThumbsState[id] = this.msgThumbsState[id] === t ? null : t;
    this.msgFeedbackOpen[id] = !!this.msgThumbsState[id];
    if (this.msgFeedbackOpen[id]) this.msgFeedbackSelected[id] = [];
  }
  closeMsgFeedback(id: number) { this.msgFeedbackOpen[id] = false; }
  toggleMsgFeedbackOption(id: number, opt: string) {
    const arr = this.msgFeedbackSelected[id] || [];
    const i = arr.indexOf(opt);
    if (i > -1) arr.splice(i, 1); else arr.push(opt);
    this.msgFeedbackSelected[id] = [...arr];
  }
  copyMsgResponse(id: number, text: string) {
    navigator.clipboard.writeText(text);
    this.msgCopied[id] = true;
    setTimeout(() => { this.msgCopied[id] = false; }, 1800);
  }
  submitMsgFeedback(id: number) { this.msgFeedbackOpen[id] = false; }

  submitSearch(e?: Event) {
    e?.preventDefault();
    const q = this.searchQuery.trim();
    if (!q) return;
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  applySuggestion(q: string) {
    this.searchQuery = q;
    this.router.navigate(['/search'], { queryParams: { q, tab: 'ai' } });
  }

  applyDashboardSuggestion() {
    const q = this.dashboardPrompt;
    this.searchQuery = q;
    this.router.navigate(['/search'], { queryParams: { q, tab: 'ai', flow: 'dashboard' } });
  }

  isUserMsg(m: ChatMsg): m is { id: number; type: 'user'; text: string; attachments?: UploadedFile[] }          { return m.type === 'user'; }
  isThinkingMsg(m: ChatMsg): m is { id: number; type: 'thinking' }                                               { return m.type === 'thinking'; }
  isAIMsg(m: ChatMsg): m is { id: number; type: 'ai'; text: string; widgets?: ChatWidget[] }                    { return m.type === 'ai'; }

  taskStatus(idx: number): 'done' | 'active' | 'pending' {
    if (!this.aiResponseVisible) {
      if (idx < this.reasoningPhaseIdx)  return 'done';
      if (idx === this.reasoningPhaseIdx) return 'active';
      return 'pending';
    }
    return 'done';
  }

  itemDisplayType(item: ResultItem): string {
    return item.displayType ?? 'Dataset';
  }

  typeSlugSr(type: string): string {
    return type.toLowerCase().replace(/[\s/]+/g, '-');
  }

  ratingNum(r?: string): string {
    if (!r) return '4.0';
    const pct = parseInt(r.match(/(\d+)%/)?.[1] ?? '80', 10);
    return Math.min(5, pct / 20).toFixed(1);
  }

  toggleCardDrop(itemId: string, event: MouseEvent) {
    event.stopPropagation();
    this.openDropCardId = this.openDropCardId === itemId ? null : itemId;
  }

  closeCardDrop() {
    this.openDropCardId = null;
  }

  togglePillDrop(event: MouseEvent) {
    event.stopPropagation();
    this.pillDropOpen = !this.pillDropOpen;
    this.cdr.markForCheck();
  }

  closePillDrop() {
    this.pillDropOpen = false;
    this.cdr.markForCheck();
  }
}
