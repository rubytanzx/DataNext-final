import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PromptBarComponent } from '../../../shared/ui/prompt-bar/prompt-bar.component';
import { WorldMapComponent } from '../../../shared/ui/world-map/world-map.component';
import { AIReasoningLoaderComponent } from '../../../shared/ui/loaders/ai-reasoning-loader/ai-reasoning-loader.component';
import { AgenticTask } from '../../../shared/ui/loaders/agentic-task-loader/agentic-task-loader.component';
import { WidgetSelectionService } from '../../../services/widget-selection.service';
import { ChatWidget } from '../../../types/widget.types';
import { AssetCardComponent } from '../../../shared/ui/asset-card/asset-card.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card/metric-card.component';
import { PrimaryBtnDirective } from '../../../shared/ui/primary-btn/primary-btn.directive';
import { SecondaryBtnDirective } from '../../../shared/ui/secondary-btn/secondary-btn.directive';
import { WorkspaceService } from '../../../services/workspace.service';
import { WatchlistPanelComponent, WatchlistCat, CountryFacts } from '../../../shared/ui/watchlist-panel/watchlist-panel.component';
import { DATA_ASSETS, AI_AGENTS, AI_TOOLS, PORTALS, API_ASSETS, CatalogueAsset, AssetType, AccessLevel } from '../../../data/catalogue.data';
import type { KidbObs } from '../../../shared/ui/world-map/world-map.types';

const ALL_CATALOGUE: CatalogueAsset[] = [...DATA_ASSETS, ...AI_AGENTS, ...AI_TOOLS, ...API_ASSETS, ...PORTALS];

function catalogueHash(str: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return min + (h % (max - min + 1));
}

export interface SourceCard {
  type: 'pdf' | 'web' | 'dataset';
  title: string;
  description: string;
  updatedAt: string;
  url?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'note';
  text?: string;
  actions?: string[];
  chips?: string[];
  ctaButtons?: string[];
  ctaLink?: string;
  ctaAction?: string;
  noteLabel?: string;
  widgets?: ChatWidget[];
  // GDP chart (id='1' backwards compat)
  chartTitle?: string;
  chartSubtitle?: string;
  hasChart?: boolean;
  chartType?: string;
  sources?: number;
  sourceCards?: SourceCard[];
  suggestedMetrics?: Array<{ key: string; label: string; previewVal: string; previewColor: string }>;
  outputOptions?: Array<{ key: string; label: string; icon: string }>;
  badge?: 'in-workspace' | 'handoff';
  handoffCard?: { title: string; description: string; ctaButtons: string[] };
  artefactCard?: { label: string; title: string; ctx: PreviewCtx };
}

export interface AssetItem  { name: string; selected: boolean; }
export interface AssetGroup { name: string; expanded: boolean; items: AssetItem[]; }

export interface SpaceMember {
  name: string;
  email: string;
  initials: string;
  role: 'Administrator' | 'Editor' | 'Viewer';
  color: string;
}

export interface ProcRecord {
  contract: string;
  supplier: string;
  value: string;
  status: 'Active' | 'Awarded' | 'Complete';
  awarded: string;
}

// left/top as % of the map container, derived from world-map-coded.svg
// viewBox (30.767 241.591 784.077 458.627):
//   left% = (svgX - 30.767) / 784.077 * 100
//   top%  = (svgY - 241.591) / 458.627 * 100
export interface MapMarker { left: number; top: number; label: string; }

export interface ComparisonRow {
  project: string;
  country: string;
  financing: string;
  disbursed: string;
  contracts: number;
  highlight: boolean;
}

interface ThinkingState {
  phases: string[];
  tasks: AgenticTask[];
}

type WfNodeType   = 'retrieve' | 'search' | 'filter' | 'transform' | 'compare' | 'ai' | 'validate' | 'visualise' | 'output' | 'human-review' | 'destination';
type WfNodeStatus = 'completed' | 'not-run' | 'running' | 'needs-attention' | 'failed' | 'awaiting-review' | 'changed';

interface WfSource {
  icon:        'dataset' | 'web' | 'pdf';
  title:       string;
  description: string;
}

interface WfNode {
  id:              number;
  type:            WfNodeType;
  title:           string;
  description:     string;
  status:          WfNodeStatus;
  time?:           string;
  sources?:        WfSource[];
  instruction?:    string;
  outputType?:     string;
  outputSections?: string[];
  onFailure?:      string;
}

interface WfParams {
  countries:  string;
  period:     string;
  indicators: string;
}

type PreviewCtx = 'map' | 'overview' | 'disburse' | 'procurement' | 'comparison' | 'dashboard' | 'ci-dashboard' | 'briefing' | 'pacific-chart' | 'pacific-table' | 'pacific-line' | 'pacific-scatter' | 'pacific-record' | 'pacific-schema' | 'pacific-raw' | 'doc' | 'watchlist';

// ── Static data ───────────────────────────────────────────────────────────────

const ALL_PROC_RECORDS: ProcRecord[] = [
  { contract: 'Civil Works Package A',         supplier: 'MetroBuild Consortium',      value: '$72m', status: 'Active',   awarded: 'Mar 2024' },
  { contract: 'Rail Systems Integration',      supplier: 'TransitTech Asia',            value: '$51m', status: 'Active',   awarded: 'Jul 2024' },
  { contract: 'Station Development Package',   supplier: 'Pacific Infrastructure Ltd',  value: '$38m', status: 'Awarded',  awarded: 'Sep 2024' },
  { contract: 'Signalling Systems',            supplier: 'SignalCore',                  value: '$29m', status: 'Active',   awarded: 'Nov 2024' },
  { contract: 'Engineering Consultancy',       supplier: 'UrbanWorks Advisory',         value: '$18m', status: 'Complete', awarded: 'Jan 2024' },
  { contract: 'Depot Systems Package',         supplier: 'RailWorks PH',               value: '$16m', status: 'Active',   awarded: 'Feb 2025' },
  { contract: 'Accessibility Upgrades',        supplier: 'Inclusive Transit Group',     value: '$11m', status: 'Active',   awarded: 'Apr 2025' },
  { contract: 'Systems Testing',               supplier: 'Mobility QA Partners',       value: '$6m',  status: 'Active',   awarded: 'May 2025' },
  { contract: 'Programme Management Support',  supplier: 'InfraConsult Asia',           value: '$5m',  status: 'Active',   awarded: 'Jun 2025' },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  { project: 'Metro Manila Transport Project',        country: 'Philippines', financing: '$420m', disbursed: '64%', contracts: 18, highlight: true  },
  { project: 'Jakarta Urban Mobility Programme',      country: 'Indonesia',   financing: '$360m', disbursed: '72%', contracts: 16, highlight: false },
  { project: 'Ho Chi Minh City Transit Expansion',   country: 'Viet Nam',    financing: '$310m', disbursed: '78%', contracts: 14, highlight: false },
  { project: 'Bangkok Regional Rail Upgrade',        country: 'Thailand',    financing: '$285m', disbursed: '69%', contracts: 21, highlight: false },
  { project: 'Kuala Lumpur Mobility Improvement',    country: 'Malaysia',    financing: '$240m', disbursed: '81%', contracts: 12, highlight: false },
  { project: 'Phnom Penh Urban Transport Programme', country: 'Cambodia',    financing: '$190m', disbursed: '74%', contracts: 10, highlight: false },
];

// left/top % positions for viewBox "480 330 320 320" (Asia-Pacific crop)
// formula: left=(svgX-480)/320*100, top=(svgY-330)/320*100
const SEA_MARKERS: MapMarker[] = [
  { left: 68.9, top: 51.9, label: 'Manila'       },
  { left: 51.5, top: 60.7, label: 'Jakarta'      },
  { left: 56.1, top: 53.8, label: 'Ho Chi Minh'  },
  { left: 53.4, top: 49.3, label: 'Bangkok'      },
  { left: 53.4, top: 57.8, label: 'Kuala Lumpur' },
  { left: 55.9, top: 52.5, label: 'Phnom Penh'   },
];

const ALL_PROJECT_MARKERS: MapMarker[] = [
  ...SEA_MARKERS,
  { left: 35.0, top: 41.9, label: 'Mumbai' },
];

// Pacific Risk Atlas — viewBox "700 460 200 200" with preserveAspectRatio="none"
// left=(svgX-700)/200*100, top=(svgY-460)/200*100
// Port Vila: actual vu path starts at SVG (811, 582) → left=55.5, top=61
// Tonga/Cook Isl. are east of the dateline; their virtual svgX extends beyond
// the global SVG right edge (814.844 = 180°E): 175°W → x≈826, 160°W → x≈861
const PACIFIC_MARKERS: MapMarker[] = [
  { left: 55.5, top: 61.0, label: 'Port Vila'  }, // Vanuatu  ~168°E, 17.7°S
  { left: 63.0, top: 66.5, label: 'Tongatapu'  }, // Tonga    ~175°W, 21°S (east of dateline)
  { left: 80.5, top: 66.5, label: 'Rarotonga'  }, // Cook Is. ~160°W, 21°S (east of dateline)
];
const PACIFIC_ECONOMIES = ['VAN', 'FIJ', 'SOL'];
const PACIFIC_VIEWBOX   = '700 460 200 200';

const ASIA_PACIFIC_ECONOMIES = ['PHI', 'INO', 'VIE', 'THA', 'MAL', 'CAM', 'IND', 'PAK', 'BAN', 'SRI', 'KAZ', 'UZB', 'PRC', 'PNG'];
const SEA_ECONOMIES           = ['PHI', 'INO', 'VIE', 'THA', 'MAL', 'CAM'];

const PACIFIC_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Agents', expanded: true,  items: [{ name: 'Climate Risk Agent', selected: true }] },
  { name: 'AI Tools',  expanded: true,  items: [{ name: 'Geospatial Flooding Risk Engine', selected: true }] },
  { name: 'Data',      expanded: true,  items: [
    { name: 'CookIslands_Flood_RCP85',                    selected: true  },
    { name: 'Tongatapu_Coastal_Inundation_Risk',          selected: true  },
    { name: 'Vanuatu_Cyclone_ARI500_SSP2_4.5_Year2050',   selected: true  },
    { name: 'Climate and Disaster Risk Document Corpus',  selected: true  },
  ]},
];

const TRANSPORT_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Tools', expanded: true,  items: [{ name: 'Data Summariser', selected: true }, { name: 'Chart Generator', selected: true }] },
  { name: 'Data',     expanded: true,  items: [
    { name: 'ADB Port Throughput Database',   selected: true  },
    { name: 'Air Connectivity Index (IATA)',  selected: true  },
    { name: 'AIS Vessel Tracking Data',        selected: true  },
    { name: 'Transport Document Corpus',       selected: true  },
  ]},
];

const OUTPUT_NODE_TYPES: Array<{ label: string; outputType: string; icon: string; desc: string }> = [
  { label: 'Mission Preparation Package', outputType: 'Document Bundle',    icon: 'docs',      desc: 'Full set of mission documents — MCR, TOR, BTOR, MOU and more' },
  { label: 'Country Dashboard',           outputType: 'Country Dashboard',  icon: 'dashboard', desc: 'Country indicators, credit profile, and economic overview' },
  { label: 'Metric Dashboard',            outputType: 'Metric Dashboard',   icon: 'chart',     desc: 'Key performance metrics, disbursement and procurement charts' },
  { label: 'Country Briefing Note',       outputType: 'Briefing Note',      icon: 'briefing',  desc: 'Editable structured briefing document for decision-makers' },
];

const MISSION_DOC_OPTIONS = [
  'Mission Clearance Request (MCR)',
  'Terms of Reference (TOR)',
  'Mission Program / Schedule',
  'Position Paper',
  'CPFR Background Paper',
  'Briefing Presentation',
  'Aide-mémoire (AM)',
  'Memorandum of Understanding (MOU)',
  'Back-to-office Report (BTOR)',
  'Time-bound Action Plan',
  'Project Administration Manual (PAM)',
  'Meeting Request / Cover Letter',
  'Stakeholder List',
  'Technical Attachments',
];

const MISSION_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Agents', expanded: true,  items: [{ name: 'Project Analysis Agent', selected: true }, { name: 'ADB Genie', selected: true }] },
  { name: 'AI Tools',  expanded: true,  items: [{ name: 'Data Summariser', selected: true }] },
  { name: 'Data',      expanded: true,  items: [
    { name: 'ADB Project Data Sheets Data Product',   selected: true  },
    { name: 'Project Funding and Disbursement Dataset', selected: true  },
    { name: 'Project Procurement and Contracts Dataset', selected: true },
    { name: 'ADB Country Strategies',                 selected: true  },
    { name: 'Key Indicators Database (KIDB)',          selected: true  },
    { name: 'EVA Lessons from past ADB projects',     selected: false },
  ]},
];

const FINANCE_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Agents', expanded: true,  items: [{ name: 'Project Analysis Agent', selected: true }] },
  { name: 'Data',      expanded: true,  items: [
    { name: 'Project Procurement and Contracts Dataset', selected: true  },
    { name: 'Project Funding and Disbursement Dataset',  selected: true  },
    { name: 'ADB Project Data Sheets Data Product',      selected: true  },
  ]},
];

const SOCIAL_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Tools', expanded: true,  items: [{ name: 'Data Summariser', selected: true }] },
  { name: 'Data',     expanded: true,  items: [
    { name: 'Social Protection Indicators (SPI)',                          selected: true  },
    { name: 'Social Protection Indicators of Coverage and Effectiveness',  selected: true  },
    { name: 'ADB Key Indicators Database (KIDB)',                          selected: true  },
  ]},
];

const PI_ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Agents',   expanded: true,  items: [{ name: 'Project Analysis Agent', selected: true }] },
  { name: 'AI Tools',    expanded: true,  items: [{ name: 'Project Summariser', selected: true }, { name: 'Comparison Tool', selected: false }] },
  { name: 'API',         expanded: false, items: [{ name: 'Project Data API', selected: false }] },
  { name: 'Data',        expanded: true,  items: [
    { name: 'ADB Project Data Sheets',             selected: true  },
    { name: 'Project Funding & Disbursement Data', selected: true  },
    { name: 'Project Procurement & Contract Data', selected: false },
  ]},
];

const ASSET_GROUPS: AssetGroup[] = [
  { name: 'AI Agents',   expanded: true,  items: [{ name: 'GDP Forecast Agent', selected: true }, { name: 'Climate Risk Agent', selected: false }] },
  { name: 'AI Tools',    expanded: true,  items: [{ name: 'Data Summariser', selected: false }, { name: 'Chart Generator', selected: true }] },
  { name: 'API',         expanded: false, items: [{ name: 'ADB OpenData API', selected: false }, { name: 'ERDI Pipeline', selected: false }] },
  { name: 'Data',        expanded: true,  items: [{ name: 'GDP Growth Dataset', selected: true }, { name: 'World Bank Indicators', selected: true }, { name: 'IMF WEO Data', selected: false }] },
];

const SRC_2: SourceCard[] = [
  { type: 'pdf',     title: 'Internal.pdf',    description: 'ADB project data sheets and operational summary covering the active lending portfolio and procurement records across DMCs.', updatedAt: '02 Sep 2025' },
  { type: 'web',     title: 'adb.org',         description: 'ADB official project database with real-time procurement status, disbursement data, and country strategy documents.', updatedAt: '02 Sep 2025', url: 'https://www.adb.org' },
];

const SRC_3: SourceCard[] = [
  ...SRC_2,
  { type: 'dataset', title: 'Project Procurement Dataset', description: 'Curated dataset of ADB contract awards, supplier details, and procurement timelines across 2,400+ active contracts.', updatedAt: '15 Aug 2025' },
];

const GDP_MESSAGES: ChatMessage[] = [
  { role: 'user',      text: 'GDP Growth for India, China and Indonesia since 2010' },
  { role: 'assistant', chartTitle: 'Real GDP Growth Rate — India, Indonesia, China',
    chartSubtitle: 'Showing Real GDP Growth Rate (NGDP_R_PTX_PS) for India, Indonesia, China, 2010–2024.',
    hasChart: true, sources: 2,
    sourceCards: [
      { type: 'dataset', title: 'IMF World Economic Outlook', description: 'Real GDP growth rate projections and historical data for 190 economies, updated semi-annually.', updatedAt: '02 Sep 2025' },
      { type: 'web', title: 'adb.org', description: 'Asian Development Outlook — annual flagship publication covering macroeconomic trends and GDP analysis across Asia-Pacific.', updatedAt: '02 Sep 2025', url: 'https://www.adb.org' },
    ] },
];

// ── Southeast Asia dashboard data ──────────────────────────────────────────────

const SEA_ECONOMY_LABELS: { code: string; label: string }[] = [
  { code: 'PHI', label: 'Philippines' },
  { code: 'INO', label: 'Indonesia'   },
  { code: 'VIE', label: 'Viet Nam'    },
  { code: 'THA', label: 'Thailand'    },
  { code: 'MAL', label: 'Malaysia'    },
  { code: 'CAM', label: 'Cambodia'    },
];

type IndicatorKey = 'GDP_GROWTH' | 'GDP_PC' | 'CPI' | 'DEBT_GDP' | 'CURRENT_ACCT';

const RAW: Record<IndicatorKey, Record<string, number[]>> = {
  GDP_GROWTH: {
    PHI: [-9.5,  5.7,  7.6,  5.6,  5.7],
    INO: [-2.1,  3.7,  5.3,  5.1,  5.0],
    VIE: [ 2.9,  2.6,  8.0,  5.1,  6.4],
    THA: [-6.2,  1.6,  2.6,  1.9,  2.7],
    MAL: [-5.6,  3.3,  8.7,  3.6,  4.4],
    CAM: [-3.1,  3.0,  5.2,  5.6,  5.8],
  },
  GDP_PC: {
    PHI: [3200, 3500, 3900, 4000, 4200],
    INO: [3900, 4300, 4800, 5000, 5200],
    VIE: [2800, 3000, 3600, 4100, 4400],
    THA: [7300, 7400, 7500, 7600, 7700],
    MAL: [10700, 11700, 12500, 13000, 13500],
    CAM: [1600, 1600, 1700, 1800, 1900],
  },
  CPI: {
    PHI: [2.4, 3.9, 5.8, 6.0, 3.3],
    INO: [2.0, 1.6, 4.2, 3.7, 2.5],
    VIE: [3.2, 1.8, 3.2, 3.2, 3.6],
    THA: [-0.8, 1.2, 6.1, 1.2, 0.4],
    MAL: [-1.1, 2.5, 3.4, 2.5, 1.8],
    CAM: [2.9, 2.9, 5.3, 2.2, 2.0],
  },
  DEBT_GDP: {
    PHI: [54.6, 60.5, 57.5, 59.1, 58.3],
    INO: [39.8, 41.1, 37.8, 38.4, 38.5],
    VIE: [55.9, 55.8, 56.9, 50.5, 48.2],
    THA: [49.4, 59.5, 62.0, 64.2, 63.1],
    MAL: [62.2, 66.3, 61.8, 64.4, 63.9],
    CAM: [30.3, 33.4, 34.1, 33.4, 32.9],
  },
  CURRENT_ACCT: {
    PHI: [ 3.2, -1.5, -4.5, -1.5, -0.8],
    INO: [-0.4,  0.3,  1.0, -1.6, -1.8],
    VIE: [ 4.4, -2.3,  5.1,  4.7,  4.3],
    THA: [ 3.5, -2.2, -3.8,  1.3,  1.9],
    MAL: [ 4.2,  3.8,  3.5,  2.5,  2.2],
    CAM: [-5.6, -9.5, -8.3, -7.2, -6.8],
  },
};

const YEARS = ['2020', '2021', '2022', '2023', '2024'];

function buildSeaObs(): KidbObs[] {
  const out: KidbObs[] = [];
  for (const [key, economies] of Object.entries(RAW) as [IndicatorKey, Record<string, number[]>][]) {
    for (const [eco, vals] of Object.entries(economies)) {
      vals.forEach((v, i) => out.push({ economy: `${key}:${eco}`, period: YEARS[i], value: v }));
    }
  }
  return out;
}

const SEA_OBS_RAW = buildSeaObs();

function obsForKey(key: IndicatorKey): KidbObs[] {
  const prefix = `${key}:`;
  return SEA_OBS_RAW
    .filter(o => o.economy.startsWith(prefix))
    .map(o => ({ ...o, economy: o.economy.slice(prefix.length) }));
}

const SEA_AI_INSIGHTS: Partial<Record<IndicatorKey, Partial<Record<string, string>>>> = {
  GDP_GROWTH: {
    PHI: 'Recovery driven by remittances and BPO exports. Infrastructure spending under the BBM administration is supporting construction-led expansion through 2025.',
    INO: 'Stable 5% trajectory anchored by commodity exports and domestic consumption. EV battery supply chain investment is emerging as a structural growth driver.',
    VIE: 'Manufacturing FDI surge (electronics, semiconductors) drove 2022\'s 8% spike. Growth moderating but remaining above regional average through export diversification.',
    THA: 'Tourism recovery slower than expected; weak Chinese visitor numbers weigh on 2023–24 performance. Domestic consumption and auto exports partially offset the drag.',
    MAL: '2022\'s 8.7% was commodity-price driven. Returning to trend at ~4.4%, supported by semiconductor exports and robust domestic investment.',
    CAM: 'Garment exports recovering post-pandemic. Tourism corridor with Thailand reopening is expected to add 0.5–0.8 pp to 2025 growth.',
  },
  GDP_PC: {
    PHI: 'Despite strong GDP growth, per-capita income remains below ASEAN median. Remittances (~9% of GDP) provide an income floor but structural productivity gaps persist.',
    MAL: 'Highest income level in this portfolio, with Malaysia approaching upper-middle-income status. Risk: over-reliance on commodity-linked revenues.',
  },
};

// ── Country Intelligence dashboard data ───────────────────────────────────────

const CI_ECONOMIES = ['BAN', 'VIE', 'CAM'];

const CI_ECONOMY_LABELS: { code: string; label: string }[] = [
  { code: 'BAN', label: 'Bangladesh' },
  { code: 'VIE', label: 'Viet Nam'   },
  { code: 'CAM', label: 'Cambodia'   },
];

const CI_RAW: Partial<Record<IndicatorKey, Record<string, number[]>>> = {
  GDP_GROWTH: {
    BAN: [3.5,  6.9,  7.1,  5.8,  6.4],
    VIE: [2.9,  2.6,  8.0,  5.1,  6.8],
    CAM: [-3.1, 3.0,  5.2,  5.6,  6.1],
  },
  CPI: {
    BAN: [5.7, 5.6, 6.1, 9.0, 7.8],
    VIE: [3.2, 1.8, 3.2, 3.2, 3.6],
    CAM: [2.9, 2.9, 5.3, 2.2, 2.9],
  },
  DEBT_GDP: {
    BAN: [38.4, 40.1, 39.8, 38.5, 38.2],
    VIE: [55.9, 55.8, 50.5, 43.2, 36.7],
    CAM: [30.3, 33.4, 34.1, 33.4, 31.4],
  },
  CURRENT_ACCT: {
    BAN: [-1.7, -0.9, -4.1, -1.8, -1.1],
    VIE: [ 4.4, -2.3,  5.1,  4.7,  3.2],
    CAM: [-5.6, -9.5, -8.3, -7.2, -8.4],
  },
};

function buildCiObs(): KidbObs[] {
  const out: KidbObs[] = [];
  for (const [key, economies] of Object.entries(CI_RAW) as [IndicatorKey, Record<string, number[]>][]) {
    for (const [eco, vals] of Object.entries(economies)) {
      vals.forEach((v, i) => out.push({ economy: `${key}:${eco}`, period: YEARS[i], value: v }));
    }
  }
  return out;
}

const CI_OBS_RAW = buildCiObs();

function ciObsForKey(key: IndicatorKey): KidbObs[] {
  const prefix = `${key}:`;
  return CI_OBS_RAW
    .filter(o => o.economy.startsWith(prefix))
    .map(o => ({ ...o, economy: o.economy.slice(prefix.length) }));
}

const CI_AI_INSIGHTS: Partial<Record<IndicatorKey, Partial<Record<string, string>>>> = {
  GDP_GROWTH: {
    BAN: 'Resilient growth anchored by garments exports and remittances (~8% of GDP). Structural productivity gains in manufacturing are supporting expansion, though political uncertainty and exchange rate pressures remain near-term headwinds.',
    VIE: 'Manufacturing FDI surge — electronics, semiconductors — drove 2022\'s 8% spike. Growth remains above ASEAN median through export diversification. China+1 strategy continues to attract relocating manufacturers.',
    CAM: 'Garment exports recovering post-pandemic; tourism corridor with Thailand reopening added momentum. 2024 growth at 6.1% marks a return to the pre-COVID trajectory of 6–7% annually.',
  },
  DEBT_GDP: {
    BAN: 'Debt position remains manageable at 38.2% of GDP, well below the 55% IMF threshold. Energy subsidy reform and exchange rate rigidity are the main near-term fiscal risks flagged in the 2025 Article IV.',
    VIE: 'Debt has declined sharply from 55.9% in 2020 to 36.7% in 2024 — reflecting strong GDP growth and fiscal consolidation. Contingent liabilities from state-owned enterprises remain a watch item.',
  },
};

const CI_METRIC_CARDS: Array<{ key: string; label: string; previewVal: string; previewColor: string }> = [
  { key: 'GDP_GROWTH',   label: 'GDP Growth',      previewVal: '6.4%',  previewColor: '#8DC63F' },
  { key: 'CPI',          label: 'Inflation (CPI)',  previewVal: '7.8%',  previewColor: '#E9532B' },
  { key: 'DEBT_GDP',     label: 'Debt-to-GDP',      previewVal: '38.2%', previewColor: '#8DC63F' },
  { key: 'CURRENT_ACCT', label: 'Current Account',  previewVal: '−1.1%', previewColor: '#FDB915' },
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [CommonModule, FormsModule, PromptBarComponent, WorldMapComponent, AIReasoningLoaderComponent, AssetCardComponent, MetricCardComponent, PrimaryBtnDirective, SecondaryBtnDirective, WatchlistPanelComponent],
  templateUrl: './notebook.component.html',
  styleUrl: './notebook.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotebookComponent implements OnInit, OnDestroy {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly location         = inject(Location);
  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly sanitizer      = inject(DomSanitizer);
  private readonly widgetService  = inject(WidgetSelectionService);

  @ViewChild('messagesEl') private messagesRef?: ElementRef<HTMLDivElement>;

  // ── UI state ────────────────────────────────────────────────────────────────
  title            = signal('New Workspace');
  sourcesOpenIdx   = signal<number | null>(null);
  editingTitle     = signal(false);
  assetsCollapsed  = signal(false);
  previewCollapsed = signal(false);
  promptExpanded   = signal(false);
  previewMode      = 'Map';
  downloadDropOpen  = false;
  useInOpen        = signal(false);
  useInDrawer      = signal<string | null>(null);

  readonly useInOptions = [
    { icon: 'databricks',  label: 'Databricks',           desc: 'Analyse data and build notebooks or pipelines',                         count: 2 },
    { icon: 'build-app',   label: 'Build an Application', desc: 'Export assets, APIs and agents as a starter development environment',    count: 4 },
  ];

  forking          = signal(false);
  forkLoading      = signal(false);
  assetPaneLoading = signal(false);
  buildAppPlatform = signal<'github' | 'gitlab'>('github');
  buildAppFramework = signal<string>('Next.js');
  buildAppRepoName  = signal('country-intelligence-app');

  readonly buildAppFrameworks = ['Next.js', 'FastAPI', 'Express', 'Bare (no framework)'];

  get drawerAssets() {
    const groupIconType = (groupName: string): 'data' | 'api' | 'tool' => {
      if (groupName === 'Data') return 'data';
      if (groupName === 'AI Tools') return 'tool';
      return 'api';
    };
    const groupMeta = (groupName: string): string => {
      if (groupName === 'Data') return 'Data · Compatible';
      if (groupName === 'AI Tools') return 'DataNex+ tool · Not transferable';
      if (groupName === 'AI Agents') return 'API connection · Compatible';
      return 'Compatible';
    };
    const isAvailable = (groupName: string): boolean => groupName !== 'AI Tools';

    return this.assetGroups.flatMap(g =>
      g.items.map(item => ({
        name: item.name,
        iconType: groupIconType(g.name),
        meta: groupMeta(g.name),
        checked: item.selected && isAvailable(g.name),
        available: isAvailable(g.name),
      }))
    );
  }

  @HostListener('document:click')
  closeUseIn(): void {
    this.useInOpen.set(false);
    this.artefactPickerOpen.set(false);
    this.addingDocNodeId.set(null);
    this.downloadDropOpen = false;
  }

  openUseInDrawer(icon: string): void {
    this.useInOpen.set(false);
    this.useInDrawer.set(icon);
  }

  // Add Assets modal
  removeAssetConfirm  = signal<{ group: AssetGroup; item: AssetItem } | null>(null);
  showAddAssets       = signal(false);
  addAssetsSearch   = signal('');
  addAssetsTypes    = signal<Set<string>>(new Set());
  addAssetsSectors  = signal<Set<string>>(new Set());
  addAssetsAccesses   = signal<Set<string>>(new Set());
  addAssetsRegions    = signal<Set<string>>(new Set());
  addAssetsTrust      = signal<Set<string>>(new Set());
  addAccessExpanded   = signal(true);
  addSectorExpanded   = signal(false);
  addRegionExpanded   = signal(false);
  addTrustExpanded    = signal(false);
  addSidebarCollapsed = signal(false);
  addedAssetNames     = signal<Set<string>>(new Set());

  readonly emptySet: Set<string> = new Set();

  readonly addAccessOpts = [
    { label: 'Open',         val: 'open'       },
    { label: 'Internal ADB', val: 'all'        },
    { label: 'Restricted',   val: 'restricted' },
  ];

  readonly addRegionOpts = [
    'Asia and the Pacific', 'Caucasus and Central Asia', 'DMC Partner Economies',
    'East Asia', 'Global', 'Major Advanced Economies', 'South Asia',
    'Southeast Asia', 'The Pacific',
  ];

  readonly addTrustOpts = [
    { label: 'Responsible AI Verified',  val: 'Responsible AI Verified' },
    { label: 'Governance Verified',      val: 'Governance Verified'     },
    { label: 'Verification in Progress', val: 'Verification in Progress'},
  ];

  toggleAddRegion(r: string): void {
    const s = new Set(this.addAssetsRegions()); s.has(r) ? s.delete(r) : s.add(r); this.addAssetsRegions.set(s);
  }
  toggleAddTrust(t: string): void {
    const s = new Set(this.addAssetsTrust()); s.has(t) ? s.delete(t) : s.add(t); this.addAssetsTrust.set(s);
  }

  readonly sectorGroups = [
    'Agriculture, Natural Resources, and Rural Development',
    'Education', 'Energy', 'Finance', 'Health',
    'Industry and Trade', 'Information and Communication Technology',
    'Public Sector Management', 'Transport',
    'Water and Other Urban Infrastructure and Services',
    'Multisector', 'Not sector-specific',
  ];

  toggleAddType(t: string): void {
    const s = new Set(this.addAssetsTypes()); s.has(t) ? s.delete(t) : s.add(t); this.addAssetsTypes.set(s);
  }
  toggleAddSector(s: string): void {
    const set = new Set(this.addAssetsSectors()); set.has(s) ? set.delete(s) : set.add(s); this.addAssetsSectors.set(set);
  }
  toggleAddAccess(a: string): void {
    const s = new Set(this.addAssetsAccesses()); s.has(a) ? s.delete(a) : s.add(a); this.addAssetsAccesses.set(s);
  }
  clearAddFilters(): void {
    this.addAssetsTypes.set(new Set());
    this.addAssetsSectors.set(new Set());
    this.addAssetsAccesses.set(new Set());
    this.addAssetsRegions.set(new Set());
    this.addAssetsTrust.set(new Set());
    this.addAssetsSearch.set('');
  }

  readonly filteredAddAssets = computed(() => {
    const q       = this.addAssetsSearch().toLowerCase().trim();
    const types   = this.addAssetsTypes();
    const sectors = this.addAssetsSectors();
    const access  = this.addAssetsAccesses();
    const regions = this.addAssetsRegions();
    const trust   = this.addAssetsTrust();
    return ALL_CATALOGUE.filter(a => {
      if (types.size   > 0 && !types.has(a.type)) return false;
      if (sectors.size > 0 && !sectors.has(a.sector_group ?? '')) return false;
      if (access.size  > 0 && !access.has(a.access)) return false;
      if (regions.size > 0 && !regions.has(a.region_group ?? '')) return false;
      if (trust.size   > 0) {
        const matchRai = trust.has('Responsible AI Verified') && (a.trust_status === 'Responsible AI Verified' || a.trust_status === 'Both');
        const matchGov = trust.has('Governance Verified')     && (a.trust_status === 'Governance Verified'     || a.trust_status === 'Both');
        const matchProg = trust.has('Verification in Progress');
        if (!matchRai && !matchGov && !matchProg) return false;
      }
      if (q && !a.name.toLowerCase().includes(q) && !(a.description ?? '').toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 60);
  });

  assetWidth        = signal(260);
  previewWidth      = signal(380);
  hasDashboardData  = signal(false);

  // ── Dashboard state ───────────────────────────────────────────────────────────

  // Space '2' — SEA economic dashboard (static published view)
  readonly seaEconomyLabels = SEA_ECONOMY_LABELS;
  readonly seaAllCodes      = SEA_ECONOMIES;
  dashboardEconomy          = signal<string>('PHI');

  // Space '1' — Country Intelligence dashboard (built interactively via chat)
  readonly ciEconomyLabels = CI_ECONOMY_LABELS;
  readonly ciAllCodes      = CI_ECONOMIES;
  ciDashboardEconomy       = signal<string>('BAN');
  ciDashboardCards         = signal<Array<{ key: IndicatorKey; label: string }>>([]);
  ciDashboardBuilding      = signal(false);
  addedMetricKeys          = signal<Set<string>>(new Set());

  dashboardCards = signal<Array<{ key: IndicatorKey; label: string }>>([
    { key: 'GDP_GROWTH',   label: 'GDP Growth'       },
    { key: 'GDP_PC',       label: 'GDP Per Capita'   },
    { key: 'CPI',          label: 'Inflation (CPI)'  },
    { key: 'CURRENT_ACCT', label: 'Current Account'  },
  ]);

  private draggedIdx: number | null = null;
  dragOverIdx = signal<number | null>(null);

  onCardDragStart(index: number, event: DragEvent): void {
    this.draggedIdx = index;
    event.dataTransfer?.setData('text/plain', String(index));
    setTimeout(() => this.cdr.markForCheck(), 0);
  }

  onCardDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragOverIdx() !== index) {
      this.dragOverIdx.set(index);
    }
  }

  onCardDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.draggedIdx;
    if (from === null || from === targetIndex) { this.dragOverIdx.set(null); return; }
    this.dashboardCards.update(cards => {
      const next = [...cards];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    this.draggedIdx = null;
    this.dragOverIdx.set(null);
  }

  ciDragOverIdx = signal<number | null>(null);
  private ciDraggedIdx: number | null = null;

  onCiCardDragStart(index: number, event: DragEvent): void {
    this.ciDraggedIdx = index;
    event.dataTransfer?.setData('text/plain', String(index));
    setTimeout(() => this.cdr.markForCheck(), 0);
  }

  onCiCardDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.ciDragOverIdx() !== index) this.ciDragOverIdx.set(index);
  }

  onCiCardDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.ciDraggedIdx;
    if (from === null || from === targetIndex) { this.ciDragOverIdx.set(null); return; }
    this.ciDashboardCards.update(cards => {
      const next = [...cards];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    this.ciDraggedIdx = null;
    this.ciDragOverIdx.set(null);
  }

  onCiCardDragEnd(): void {
    this.ciDraggedIdx = null;
    this.ciDragOverIdx.set(null);
  }

  onCardDragEnd(): void {
    this.draggedIdx = null;
    this.dragOverIdx.set(null);
  }

  seaObs(key: IndicatorKey): KidbObs[]  { return obsForKey(key); }
  seaInsight(key: IndicatorKey): string | undefined {
    return SEA_AI_INSIGHTS[key]?.[this.dashboardEconomy()];
  }

  // ── Demo flow state ──────────────────────────────────────────────────────────
  flowStep     = signal(0);
  mapEconomies   = signal<string[]>([]);
  mapFilters     = signal<string[]>([]);
  mapCount       = signal(0);
  mapCountUnit   = signal('projects');
  mapViewBox     = signal<string | null>(null);
  mapCountryPanel = signal<{
    flag: string; name: string; region: string;
    metrics: { label: string; value: string; delta: string; up: boolean }[];
  } | null>(null);
  previewCtx      = signal<PreviewCtx>('map');
  lastOutputCtx   = signal<PreviewCtx>('map');
  previewDoc      = signal<SourceCard | null>(null);
  outputSwitching = signal(false);
  docPage         = signal(1);
  readonly docTotalPages = computed(() => {
    const t = this.previewDoc()?.title ?? '';
    return 6 + (t.charCodeAt(0) + t.length) % 7;
  });
  procFilter   = signal<'Active' | 'Awarded' | 'Complete' | ''>('');

  mapMarkers = signal<MapMarker[]>([]);

  // AI chain-of-thought: non-null while loading
  thinking = signal<ThinkingState | null>(null);

  starterPrompts:  string[] = [];
  relatedQueries:  string[] = [];
  messages:        ChatMessage[] = [];
  workspaceAssets: string[] = [];

  get artefactCount(): number {
    return this.messages.reduce((sum, m) => sum + (m.outputOptions?.length ?? 0), 0);
  }

  get allArtefacts(): Array<{ key: string; label: string; icon: string }> {
    return this.messages.flatMap(m => m.outputOptions ?? []);
  }

  artefactPickerOpen  = signal(false);
  addingDocNodeId          = signal<number | null>(null);
  outputOptsExpanded       = signal<Set<number>>(new Set());

  expandOutputOpts(msgIdx: number): void {
    const s = new Set(this.outputOptsExpanded());
    s.add(msgIdx);
    this.outputOptsExpanded.set(s);
    this.cdr.markForCheck();
  }

  // ── Country Dashboard (Watchlist Panel) ──────────────────────────────────
  readonly watchlistOpenCats  = signal<Set<string>>(new Set(['economy']));
  readonly watchlistTitle     = signal('Philippines');
  readonly watchlistSubtitle  = signal('BB+ / Stable · Southeast Asia');
  readonly watchlistFlag      = signal('https://flagcdn.com/w80/ph.png');
  readonly watchlistFacts     = signal<CountryFacts | null>({
    population: '115.6M',
    area: '300,000 km²',
    capital: 'Manila',
    currency: 'PHP (₱)',
  });

  private readonly watchlistLookup: Record<string, { name: string; iso2: string; region: string; facts: CountryFacts | null }> = {
    PHI: { name: 'Philippines',                 iso2: 'ph', region: 'BB+ / Stable · Southeast Asia', facts: { population: '115.6M', area: '300,000 km²',   capital: 'Manila',      currency: 'PHP (₱)'  } },
    PRC: { name: "China, People's Republic of", iso2: 'cn', region: 'East Asia',                      facts: { population: '1.41B',  area: '9,597,000 km²', capital: 'Beijing',     currency: 'CNY (¥)'  } },
    IND: { name: 'India',                       iso2: 'in', region: 'South Asia',                      facts: { population: '1.43B',  area: '3,287,000 km²', capital: 'New Delhi',   currency: 'INR (₹)'  } },
    INO: { name: 'Indonesia',                   iso2: 'id', region: 'Southeast Asia',                  facts: { population: '277M',   area: '1,905,000 km²', capital: 'Jakarta',     currency: 'IDR (Rp)' } },
    THA: { name: 'Thailand',                    iso2: 'th', region: 'Southeast Asia',                  facts: { population: '72M',    area: '513,000 km²',   capital: 'Bangkok',     currency: 'THB (฿)'  } },
    VIE: { name: 'Vietnam',                     iso2: 'vn', region: 'Southeast Asia',                  facts: { population: '97M',    area: '331,000 km²',   capital: 'Hanoi',       currency: 'VND (₫)'  } },
    PAK: { name: 'Pakistan',                    iso2: 'pk', region: 'South Asia',                      facts: { population: '231M',   area: '881,913 km²',   capital: 'Islamabad',   currency: 'PKR (₨)'  } },
    BAN: { name: 'Bangladesh',                  iso2: 'bd', region: 'South Asia',                      facts: { population: '170M',   area: '147,570 km²',   capital: 'Dhaka',       currency: 'BDT (৳)'  } },
    NEP: { name: 'Nepal',                       iso2: 'np', region: 'South Asia',                      facts: { population: '30M',    area: '147,181 km²',   capital: 'Kathmandu',   currency: 'NPR (रु)'  } },
    SRI: { name: 'Sri Lanka',                   iso2: 'lk', region: 'South Asia',                      facts: { population: '22M',    area: '65,610 km²',    capital: 'Colombo',     currency: 'LKR (Rs)' } },
    MON: { name: 'Mongolia',                    iso2: 'mn', region: 'East Asia',                       facts: { population: '3.4M',   area: '1,564,000 km²', capital: 'Ulaanbaatar', currency: 'MNT (₮)'  } },
    PNG: { name: 'Papua New Guinea',            iso2: 'pg', region: 'Pacific',                         facts: { population: '10M',    area: '462,840 km²',   capital: 'Port Moresby',currency: 'PGK (K)'  } },
    KAZ: { name: 'Kazakhstan',                  iso2: 'kz', region: 'Central & West Asia',             facts: { population: '19M',    area: '2,725,000 km²', capital: 'Astana',      currency: 'KZT (₸)'  } },
    UZB: { name: 'Uzbekistan',                  iso2: 'uz', region: 'Central & West Asia',             facts: { population: '35M',    area: '448,978 km²',   capital: 'Tashkent',    currency: 'UZS (сўм)' } },
    MAL: { name: 'Malaysia',                    iso2: 'my', region: 'Southeast Asia',                  facts: { population: '33M',    area: '329,847 km²',   capital: 'Kuala Lumpur',currency: 'MYR (RM)' } },
    MYA: { name: 'Myanmar',                     iso2: 'mm', region: 'Southeast Asia',                  facts: { population: '55M',    area: '676,578 km²',   capital: 'Naypyidaw',   currency: 'MMK (K)'  } },
    CAM: { name: 'Cambodia',                    iso2: 'kh', region: 'Southeast Asia',                  facts: { population: '17M',    area: '181,035 km²',   capital: 'Phnom Penh',  currency: 'KHR (រ)'  } },
  };

  readonly watchlistCats: WatchlistCat[] = [
    {
      id: 'economy',
      label: 'Economy & Output',
      items: [
        { key: 'gdp-growth',  label: 'GDP Growth',     value: '6.1%',   status: '2025 actual',  statusColor: '#2E7D32' },
        { key: 'gdp-cap',     label: 'GDP per Capita', value: '$3,490',  status: 'USD, 2025',    statusColor: '#007DB7' },
        { key: 'inflation',   label: 'Inflation',       value: '3.2%',   status: 'Q3 2026',      statusColor: '#2E7D32' },
        { key: 'unemp',       label: 'Unemployment',   value: '4.2%',   status: 'Q2 2026',      statusColor: '#2E7D32' },
      ],
    },
    {
      id: 'external',
      label: 'External Sector',
      items: [
        { key: 'ca',          label: 'Current Account', value: '-1.5%', status: '% of GDP, 2025', statusColor: '#a65500' },
        { key: 'remittances', label: 'Remittances',     value: '$38B',  status: '2025 estimate',  statusColor: '#007DB7' },
        { key: 'reserves',    label: 'FX Reserves',     value: '7.8mo', status: 'import cover',   statusColor: '#2E7D32' },
        { key: 'fx',          label: 'Exchange Rate',   value: '56.4',  status: 'PHP/USD',        statusColor: '#607D8B' },
      ],
    },
    {
      id: 'fiscal',
      label: 'Fiscal & Debt',
      items: [
        { key: 'deficit',     label: 'Fiscal Deficit',  value: '5.1%',  status: '% of GDP, 2025', statusColor: '#a65500' },
        { key: 'debt',        label: 'Debt-to-GDP',     value: '60.1%', status: '2025',            statusColor: '#a65500' },
        { key: 'policy-rate', label: 'BSP Policy Rate', value: '5.50%', status: 'as of Sep 2026',  statusColor: '#607D8B' },
        { key: 'rating',      label: 'Credit Rating',   value: 'BB+',   status: 'S&P Stable',     statusColor: '#2E7D32' },
      ],
    },
    {
      id: 'adb',
      label: 'ADB Portfolio',
      items: [
        { key: 'active-loans',  label: 'Active Loans',      value: '18',     status: 'sovereign',       statusColor: '#007DB7' },
        { key: 'portfolio-usd', label: 'Portfolio Value',    value: '$3.2B',  status: 'active',          statusColor: '#007DB7' },
        { key: 'disburse-rate', label: 'Disbursement Rate',  value: '62.4%',  status: 'cumulative',      statusColor: '#2E7D32' },
        { key: 'on-track',      label: 'On Track Projects',  value: '15/18',  status: '3 Potential Prob', statusColor: '#a65500' },
      ],
    },
  ];

  // Map panel (Pacific workspace) — watchlist-style overlay
  readonly mapPanelVisible    = signal(false);
  readonly mapPanelTitle      = signal('');
  readonly mapPanelSubtitle   = signal('');
  readonly mapPanelFlag       = signal('');
  readonly mapPanelFacts      = signal<CountryFacts | null>(null);
  readonly mapPanelCats       = signal<WatchlistCat[]>([]);
  readonly mapPanelOpenCats   = signal<Set<string>>(new Set(['climate']));

  toggleMapPanelCat(id: string): void {
    const s = new Set(this.mapPanelOpenCats());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.mapPanelOpenCats.set(s);
    this.cdr.markForCheck();
  }

  toggleWatchlistCat(id: string): void {
    const s = new Set(this.watchlistOpenCats());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.watchlistOpenCats.set(s);
    this.cdr.markForCheck();
  }

  onWatchlistCountrySelect(adbCode: string): void {
    const c = this.watchlistLookup[adbCode];
    if (!c) return;
    this.watchlistTitle.set(c.name);
    this.watchlistSubtitle.set(c.region);
    this.watchlistFlag.set(`https://flagcdn.com/w80/${c.iso2}.png`);
    this.watchlistFacts.set(c.facts);
    this.watchlistOpenCats.set(new Set(['economy']));
    this.cdr.markForCheck();
  }
  activeArtefactKey   = signal<string | null>(null);
  assetGroups:     AssetGroup[]  = ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));

  readonly comparisonRows = COMPARISON_ROWS;

  // ── Resize drag ──────────────────────────────────────────────────────────────
  private resizing: 'assets' | 'preview' | null = null;
  private startX = 0;
  private startW = 0;
  private notebookId = '';
  private thinkingTimers: ReturnType<typeof setTimeout>[] = [];
  private paramSub?: Subscription;

  private static readonly PUBLISHED_META: Record<string, Partial<import('../notebooks.component').WorkspaceCard>> = {
    pacific: {
      description: 'Flood, earthquake, tsunami, and coastal inundation risk datasets for Cook Islands, Tonga, and Vanuatu.',
      image: '/uc-climate.png',
      datasets: 22, platforms: 0, tools: 1,
      region: 'Pacific', author: 'Pacific Department',
    },
    transport: {
      description: 'Aviation routes, port throughput, and cross-border connectivity across Southeast Asia.',
      image: '/uc-project.png',
      datasets: 12, platforms: 1, tools: 2,
      region: 'Southeast Asia', author: 'Transport Division',
    },
    finance: {
      description: 'Procurement contracts, disbursements and financing flows across ADB member economies.',
      image: '/uc-project.png',
      datasets: 8, platforms: 1, tools: 2,
      region: 'Global', author: 'IED',
    },
    social: {
      description: 'Social protection coverage, wealth inequality and agricultural climate exposure across DMCs.',
      image: '/uc-sector.png',
      datasets: 10, platforms: 1, tools: 1,
      region: 'Pan-Asia Pacific', author: 'ERDI',
    },
  };

  private get sourceForkMeta(): Partial<import('../notebooks.component').WorkspaceCard> {
    return this.workspaceService.get(this.notebookId)
      ?? NotebookComponent.PUBLISHED_META[this.notebookId]
      ?? {};
  }

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (!this.resizing) return;
    const dx = e.clientX - this.startX;
    if (this.resizing === 'assets') {
      this.assetWidth.set(Math.max(160, Math.min(480, this.startW + dx)));
    } else {
      const assetsW  = this.assetsCollapsed() ? 48 : this.assetWidth();
      const maxPreview = window.innerWidth - assetsW - 280; // keep ≥280px for chat
      this.previewWidth.set(Math.max(200, Math.min(maxPreview, this.startW - dx)));
    }
    this.cdr.markForCheck();
  };

  private readonly onMouseUp = (): void => {
    if (!this.resizing) return;
    this.resizing = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup',   this.onMouseUp);

    const id = this.route.snapshot.paramMap.get('id');
    this.notebookId = id ?? '';

    if (id === 'pacific') {
      this.title.set('Pacific Risk Atlas');
      this.starterPrompts = [
        'What flood risk data do we have for Tongatapu and Cook Islands?',
        'Show infrastructure exposure layers for Vanuatu.',
        'Compare coastal inundation risk across Pacific SIDS.',
      ];
      this.workspaceAssets = ['Climate Risk Agent', 'Pacific Risk Atlas', 'Geospatial Flooding Risk Engine'];
      this.assetGroups = PACIFIC_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.mapEconomies.set(PACIFIC_ECONOMIES);
      this.mapMarkers.set([]);
      this.mapFilters.set(['Pacific SIDS', 'Flood Risk']);
      this.mapCount.set(3);
      this.mapCountUnit.set('sites');
      this.mapViewBox.set(PACIFIC_VIEWBOX);
      const tonDefault = NotebookComponent.PACIFIC_WATCHLIST['TON'];
      this.mapPanelTitle.set(tonDefault.name);
      this.mapPanelSubtitle.set(tonDefault.region);
      this.mapPanelFlag.set(`https://flagcdn.com/w80/${tonDefault.iso2}.png`);
      this.mapPanelFacts.set(tonDefault.facts);
      this.mapPanelCats.set(tonDefault.cats);
      this.mapPanelOpenCats.set(new Set(['climate']));
      this.mapPanelVisible.set(true);
      this.previewCollapsed.set(false);
      this.messages = [];
      this.wfParams.set({ countries: 'Tonga, Cook Islands, Vanuatu', period: '2020–2025', indicators: 'Flood Risk Index, Coastal Exposure, Infrastructure at Risk' });
      this.wfNodes.set([
        { id: 1, type: 'retrieve', title: 'Retrieve climate risk data', description: 'Load flood, earthquake, cyclone and coastal inundation datasets for Pacific SIDS.', status: 'completed', time: '3 minutes ago',
          sources: [
            { icon: 'dataset', title: 'CookIslands_Flood_RCP85',              description: 'Flood risk under RCP 8.5 scenario for Cook Islands.' },
            { icon: 'dataset', title: 'Tongatapu_Coastal_Inundation_Risk',    description: 'Coastal inundation exposure for Tongatapu island.' },
            { icon: 'dataset', title: 'Vanuatu_Cyclone_ARI500_SSP2_4.5_Year2050', description: 'Cyclone hazard 500-year ARI under SSP2-4.5 for Vanuatu.' },
            { icon: 'dataset', title: 'Climate and Disaster Risk Document Corpus', description: 'ADB climate and disaster risk research reports.' },
          ] },
        { id: 2, type: 'ai', title: 'Risk scoring & exposure assessment', description: 'Rank Pacific SIDS by composite multi-hazard exposure index and flag critical infrastructure at risk.', status: 'completed', time: '2 minutes ago', instruction: 'Score each economy on flood, cyclone, and coastal inundation risk using available hazard datasets. Rank by composite exposure. Flag infrastructure assets (roads, ports, health facilities) in high-risk zones.' },
        { id: 3, type: 'validate', title: 'Validate risk layers', description: 'Check for missing data coverage and flag economies with insufficient hazard layers.', status: 'completed', time: '1 minute ago', onFailure: 'Warn and continue' },
        { id: 4, type: 'output', title: 'Pacific Risk Atlas Map', description: 'Generate an interactive multi-hazard risk map with country-level summaries.', status: 'completed', time: 'Just now', outputType: 'Map', outputSections: ['Flood risk', 'Cyclone exposure', 'Coastal inundation', 'Infrastructure at risk'] },
      ]);
      this.wfExpandedNodes.set(new Set([2]));
    } else if (id === 'transport') {
      this.title.set('Transport & Connectivity');
      this.starterPrompts = [
        'Show aviation route coverage gaps across Southeast Asia.',
        'Which ports have the highest cargo throughput growth?',
        'Compare cross-border transport connectivity by corridor.',
      ];
      this.mapEconomies.set(['PHI', 'THA', 'VIE', 'INO', 'MAL', 'SIN', 'CAM', 'LAO', 'MYA']);
      this.mapMarkers.set([]);
      this.mapFilters.set(['Southeast Asia', 'Transport']);
      this.mapCount.set(7);
      this.mapCountUnit.set('economies');
      this.mapCountryPanel.set({
        flag: 'ph', name: 'Philippines', region: 'Southeast Asia',
        metrics: [
          { label: 'Port Throughput Growth', value: '+8.4%',    delta: '+1.2%', up: true  },
          { label: 'Air Connectivity Index', value: '64.2',     delta: '+3.1',  up: true  },
          { label: 'Road Network (km)',       value: '216,387',  delta: '+2,100',up: true  },
          { label: 'Logistics Perf. Index',   value: '3.3 / 5', delta: '+0.2',  up: true  },
        ],
      });
      this.previewCtx.set('map');
      this.previewCollapsed.set(false);
      this.messages = [];
      this.assetGroups = TRANSPORT_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.wfParams.set({ countries: 'Philippines, Thailand, Viet Nam, Indonesia, Malaysia', period: '2021–2025', indicators: 'Port Throughput, Air Connectivity Index, Logistics Performance' });
      this.wfNodes.set([
        { id: 1, type: 'retrieve', title: 'Retrieve transport datasets', description: 'Load aviation routes, port throughput, AIS vessel tracking and cross-border mobility data.', status: 'completed', time: '5 minutes ago',
          sources: [
            { icon: 'dataset', title: 'ADB Port Throughput Database',      description: 'Annual cargo volumes and vessel calls for major Southeast Asian ports.' },
            { icon: 'dataset', title: 'Air Connectivity Index (IATA)',      description: 'Aviation network connectivity scores for Southeast Asian economies.' },
            { icon: 'dataset', title: 'AIS Vessel Tracking Data',           description: 'Automatic identification system data for maritime route analysis.' },
            { icon: 'dataset', title: 'Transport Document Corpus',          description: 'ADB transport sector research, evaluation and project documents.' },
          ] },
        { id: 2, type: 'ai', title: 'Connectivity gap analysis', description: 'Identify under-served corridors, bottleneck ports and aviation route gaps across Southeast Asia.', status: 'completed', time: '3 minutes ago', instruction: 'Analyse port throughput growth trends and aviation connectivity by economy. Identify top 5 bottleneck ports and aviation route gaps. Cross-reference with ADB transport project pipeline for alignment opportunities.' },
        { id: 3, type: 'output', title: 'Connectivity Dashboard', description: 'Generate an interactive map and summary table of transport connectivity metrics.', status: 'completed', time: 'Just now', outputType: 'Dashboard', outputSections: ['Port performance', 'Aviation coverage', 'Cross-border corridors', 'Logistics bottlenecks'] },
      ]);
      this.wfExpandedNodes.set(new Set([2]));
    } else if (id === 'finance') {
      this.title.set('Procurement & Finance');
      this.starterPrompts = [
        'Show procurement contracts awarded in the last 6 months.',
        'Which projects have the lowest disbursement rates?',
        'Compare financing volumes by sector and region.',
      ];
      this.previewCtx.set('dashboard');
      this.previewCollapsed.set(false);
      this.messages = [];
      this.assetGroups = FINANCE_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.wfParams.set({ countries: 'All DMCs', period: '2023–2025', indicators: 'Contract Value, Disbursement Rate, Procurement Method' });
      this.wfNodes.set([
        { id: 1, type: 'retrieve', title: 'Retrieve procurement & finance data', description: 'Load contract awards, disbursement records and financing flows across ADB portfolios.', status: 'completed', time: '4 minutes ago',
          sources: [
            { icon: 'dataset', title: 'Project Procurement and Contracts Dataset', description: 'ADB procurement contract awards by method, sector and economy.' },
            { icon: 'dataset', title: 'Project Funding and Disbursement Dataset',  description: 'Cumulative disbursement rates and financing source breakdowns.' },
            { icon: 'dataset', title: 'ADB Project Data Sheets Data Product',      description: 'Project-level summary data including approval, closing and status.' },
          ] },
        { id: 2, type: 'filter', title: 'Filter active portfolio', description: 'Narrow to projects with disbursement rate below 60% or contracts awarded in last 6 months.', status: 'completed', time: '3 minutes ago' },
        { id: 3, type: 'ai', title: 'Portfolio performance analysis', description: 'Identify disbursement laggards, flag procurement delays and surface sector-level financing trends.', status: 'completed', time: '2 minutes ago', instruction: 'Identify the 10 projects with the lowest disbursement rates. Flag those with procurement delays (contract-to-disbursement gap > 18 months). Summarise financing volumes by sector and region for the 2023–2025 period.' },
        { id: 4, type: 'output', title: 'Finance & Procurement Dashboard', description: 'Generate a summary dashboard with disbursement heatmap and contract activity timeline.', status: 'completed', time: 'Just now', outputType: 'Dashboard', outputSections: ['Disbursement performance', 'Contract awards', 'Financing by sector', 'Procurement delays'] },
      ]);
      this.wfExpandedNodes.set(new Set([3]));
    } else if (id === 'social') {
      this.title.set('Social & Inequality Analytics');
      this.starterPrompts = [
        'Which DMCs have the lowest social protection coverage?',
        'Show wealth inequality trends across South Asia.',
        'Compare agricultural climate exposure by country.',
      ];
      this.previewCtx.set('briefing');
      this.previewCollapsed.set(false);
      this.messages = [];
      this.assetGroups = SOCIAL_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.wfParams.set({ countries: 'South Asia, Southeast Asia', period: '2018–2024', indicators: 'Social Protection Coverage, Gini Coefficient, Agricultural Climate Exposure' });
      this.wfNodes.set([
        { id: 1, type: 'retrieve', title: 'Retrieve social & inequality data', description: 'Load social protection, inequality and agricultural vulnerability datasets across DMCs.', status: 'completed', time: '6 minutes ago',
          sources: [
            { icon: 'dataset', title: 'Social Protection Indicators (SPI)',                         description: 'Coverage rates and expenditure for social protection programs by DMC.' },
            { icon: 'dataset', title: 'Social Protection Indicators of Coverage and Effectiveness (SPICES)', description: 'Program-level social protection effectiveness and reach data.' },
            { icon: 'dataset', title: 'ADB Key Indicators Database (KIDB)',                         description: 'Socioeconomic time-series including Gini and poverty headcounts.' },
          ] },
        { id: 2, type: 'ai', title: 'Inequality & vulnerability assessment', description: 'Rank DMCs by social protection gaps, identify at-risk populations and surface climate-poverty linkages.', status: 'completed', time: '4 minutes ago', instruction: 'Rank DMCs by social protection coverage rate. Identify the 5 economies with the largest gaps. Cross-reference with Gini coefficients and agricultural climate exposure to surface compounding vulnerability factors.' },
        { id: 3, type: 'validate', title: 'Data completeness check', description: 'Flag DMCs with missing Gini or SPI data for manual review.', status: 'completed', time: '3 minutes ago', onFailure: 'Warn and continue' },
        { id: 4, type: 'output', title: 'Inequality & Social Protection Brief', description: 'Generate a structured analytical brief with DMC rankings and policy recommendations.', status: 'completed', time: 'Just now', outputType: 'Briefing note', outputSections: ['Coverage gaps', 'Wealth inequality trends', 'Climate-poverty nexus', 'Policy recommendations'] },
      ]);
      this.wfExpandedNodes.set(new Set([2]));
    } else if (id === '1') {
      this.title.set('Country Intelligence');
      this.previewCtx.set('briefing');
      this.previewCollapsed.set(false);
      this.messages = [
        { role: 'user', text: "Give me a quick overview of Bangladesh's economic outlook and credit rating." },
        {
          role: 'assistant',
          text: "Bangladesh is rated **BB−** by S&P and **Ba3** by Moody's, reflecting moderate credit risk with improving fundamentals.\n\n**Key indicators (2025 estimates):**\n- GDP growth: **6.4%** — among the highest in South Asia\n- Inflation: **7.8%** — elevated but easing from 2024 peak\n- Debt-to-GDP: **38.2%** — below regional average\n- Current account deficit: **−1.1% of GDP**\n- FX reserves: ~$21 billion (~3.5 months import cover)\n\nThe garments and remittance sectors remain the primary growth drivers. IMF Article IV (2025) flagged exchange rate rigidity and energy subsidy reform as near-term fiscal risks.",
          sources: 3,
          sourceCards: [
            { type: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)', description: 'ADB-maintained sovereign credit rating history and outlook across DMCs.', updatedAt: '15 Jul 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook', description: 'IMF WEO macroeconomic projections — GDP, inflation, current account, debt.', updatedAt: '01 May 2026' },
            { type: 'web', title: 'adb.org/bangladesh', description: 'ADB country page for Bangladesh — strategy, pipeline, and portfolio overview.', updatedAt: '10 Jun 2026', url: 'https://www.adb.org' },
          ],
          actions: ['Show full credit profile', 'Compare with Pakistan', 'Export country brief'],
        },
        { role: 'user', text: 'How does it compare to Viet Nam and Cambodia on growth and credit?' },
        {
          role: 'assistant',
          text: "Here's a side-by-side snapshot for 2025:\n\n| Indicator | Bangladesh | Viet Nam | Cambodia |\n|---|---|---|---|\n| **S&P Rating** | BB− | BB+ | B+ |\n| **GDP Growth** | 6.4% | 6.8% | 6.1% |\n| **Inflation** | 7.8% | 3.6% | 2.9% |\n| **Debt/GDP** | 38.2% | 36.7% | 31.4% |\n| **CA Balance** | −1.1% | +3.2% | −8.4% |\n\n**Takeaways:**\n- Viet Nam leads on credit quality and external balance — strong FDI inflows and manufacturing exports support the current account surplus.\n- Cambodia has the lowest inflation but a wide current account deficit driven by import-heavy infrastructure spending.\n- Bangladesh carries the highest inflation risk but a resilient debt position relative to peers.",
          sources: 2,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'ADB flagship time-series database covering economic, financial, and social indicators across DMCs.', updatedAt: '30 Jun 2026' },
            { type: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)', description: 'Sovereign credit rating history and outlook across DMCs.', updatedAt: '15 Jul 2026' },
          ],
          actions: ['Show 5-year trend', 'Add Indonesia to comparison', 'Download table as CSV'],
        },
      ];
      this.relatedQueries = [
        'Which DMCs have the highest debt-to-GDP ratios?',
        'Show GDP projections for South Asia through 2030',
        'Compare credit rating changes over the past 5 years',
      ];
    } else if (id === '2') {
      this.title.set('Southeast Asia Transport Portfolio');
      this.assetGroups = PI_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.publishMarketplace.set(true);
      this.starterPrompts = [
        'Show me active transport projects over $100m.',
        'Which transport projects have the highest financing?',
        'Show projects with slower-than-planned disbursement.',
      ];
      // Pre-load data preview — dashboard is the default view for this published space
      this.flowStep.set(5);
      this.mapEconomies.set(SEA_ECONOMIES);
      this.mapMarkers.set(SEA_MARKERS);
      this.mapFilters.set(['Southeast Asia', 'Transport', 'Active', '> $100m']);
      this.mapCount.set(6);
      this.previewCtx.set('dashboard');
      this.previewMode = 'Dashboard';
      this.previewCollapsed.set(false);
      this.messages = [];
      this.wfParams.set({ countries: 'Philippines, Indonesia, Viet Nam, Thailand, Malaysia, Cambodia', period: '2020–2024', indicators: 'Project Disbursement, Contract Value, Procurement Status' });
      this.wfNodes.set([
        { id: 1, type: 'retrieve', title: 'Retrieve transport project data', description: 'Load active project records, procurement contracts and disbursement data across Southeast Asia.', status: 'completed', time: '5 minutes ago',
          sources: [
            { icon: 'dataset', title: 'ADB Project Data Sheets Data Product',      description: 'Project-level metadata including approval, closing date and sector.' },
            { icon: 'dataset', title: 'Project Procurement and Contracts Dataset', description: 'Contract awards by procurement method, supplier and economy.' },
            { icon: 'dataset', title: 'Project Funding and Disbursement Dataset',  description: 'Cumulative disbursement rates and financing source breakdowns.' },
            { icon: 'dataset', title: 'EVA Lessons from past ADB projects',        description: 'Project evaluation findings and lessons from IED.' },
          ] },
        { id: 2, type: 'filter', title: 'Filter active transport portfolio', description: 'Scope to transport sector projects with > $100m financing and active disbursement status.', status: 'completed', time: '4 minutes ago' },
        { id: 3, type: 'ai', title: 'Portfolio performance analysis', description: 'Identify disbursement laggards, flag slow-moving contracts and surface procurement bottlenecks.', status: 'completed', time: '2 minutes ago', instruction: 'Rank active transport projects by disbursement rate. Flag projects below 50% utilisation with less than 12 months to closing date. Summarise key procurement delays and contract-to-disbursement gaps by economy.' },
        { id: 4, type: 'output', title: 'Transport Portfolio Dashboard', description: 'Generate an interactive dashboard with project map, disbursement heatmap and procurement timeline.', status: 'completed', time: 'Just now', outputType: 'Dashboard', outputSections: ['Active projects map', 'Disbursement performance', 'Procurement status', 'Lessons from evaluation'] },
      ]);
      this.wfExpandedNodes.set(new Set([3]));
    } else if (id === '3') {
      this.title.set('Sector Intelligence');
      this.starterPrompts = [
        'What energy sector datasets are available for Southeast Asia?',
        'Compare water and sanitation indicators across DMCs.',
        'Show social protection coverage by sector.',
      ];
      this.previewCtx.set('dashboard');
      this.previewCollapsed.set(false);
    } else if (id === '4') {
      this.title.set('Climate & Sustainability');
      this.starterPrompts = [
        'Show cyclone and flood risk data for Pacific SIDS.',
        'Which DMCs have the highest climate vulnerability scores?',
        'Compare ESG indicators across ADB member countries.',
      ];
      this.previewCtx.set('dashboard');
      this.previewCollapsed.set(false);
    } else if (id === '5') {
      this.title.set('Asia-Pacific Economic Brief');
      this.starterPrompts = [
        "Summarise Bangladesh's economic outlook and credit rating.",
        'Generate a briefing note comparing growth forecasts for Viet Nam, Cambodia, and Indonesia.',
        'What are the key fiscal risks across South Asia in 2026?',
      ];
      this.previewCtx.set('briefing');
      this.previewCollapsed.set(true);
      this.messages = [
        {
          role: 'user',
          text: "What's Bangladesh's GDP growth trajectory since 2020, and how does it compare with Viet Nam and Cambodia?",
        },
        {
          role: 'assistant',
          chartTitle: 'Real GDP Growth Rate — Bangladesh, Viet Nam, Cambodia',
          chartSubtitle: 'Annual GDP growth (%) 2020–2024 · KIDB, IMF WEO, Asian Development Outlook',
          hasChart: true,
          chartType: 'briefing-gdp',
          text: "All three economies recovered from the COVID shock but with distinct trajectories:\n\n- **Bangladesh** grew **6.4%** in 2024, anchored by garment exports and remittances. The 2022 moderation reflects external headwinds including global commodity pressures.\n- **Viet Nam** saw a sharp **8.0%** spike in 2022 driven by electronics and semiconductor FDI, moderating to 6.8% in 2024.\n- **Cambodia** is recovering toward its pre-COVID 6–7% trend, reaching 6.1% in 2024 as garments and tourism rebound.",
          sources: 3,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'ADB flagship time-series covering economic and financial indicators across DMCs. GDP growth series 2020–2024.', updatedAt: '30 Jun 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook', description: 'IMF WEO macroeconomic projections — GDP, inflation, current account, debt, 2020–2026.', updatedAt: '01 May 2026' },
            { type: 'dataset', title: 'Asian Development Outlook', description: 'ADB annual flagship publication with macroeconomic analysis and growth forecasts for DMCs.', updatedAt: '15 Apr 2026' },
          ],
        },
        {
          role: 'user',
          text: "Bangladesh's CPI looks elevated compared to peers — show inflation trends and what's driving it.",
        },
        {
          role: 'assistant',
          chartTitle: 'Consumer Price Inflation — Bangladesh, Viet Nam, Cambodia',
          chartSubtitle: 'Annual CPI inflation (%) 2020–2024 · KIDB, IMF WEO',
          hasChart: true,
          chartType: 'briefing-cpi',
          text: "Bangladesh's inflation remains the highest in this peer group at **7.8% in 2024**, easing from a 9.1% peak in 2023. The drivers are structural:\n\n- **Food inflation** accounts for ~48% of the CPI basket, running at 8.3% YOY — the primary culprit\n- **Energy subsidy reform** has passed through higher utility costs to consumers\n- **Taka depreciation** (−7.2% vs USD in 2024) has added imported inflation pressure\n\nBy contrast, Viet Nam (3.6%) and Cambodia (2.9%) remain well within target ranges, supported by stable exchange rates and lower food price volatility.",
          sources: 2,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'CPI series for Bangladesh, Viet Nam, and Cambodia — annual observations 2020–2024.', updatedAt: '30 Jun 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook', description: 'IMF inflation projections and historical data for 190 economies.', updatedAt: '01 May 2026' },
          ],
        },
        {
          role: 'user',
          text: "What's the sovereign credit profile and fiscal position? I want to understand Bangladesh's debt risk.",
        },
        {
          role: 'assistant',
          text: "**Sovereign credit ratings (2025):**\n\n| Economy | S&P | Moody's | Outlook |\n|---|---|---|---|\n| Bangladesh | BB− | Ba3 | Stable |\n| Viet Nam | BB+ | Ba2 | Positive |\n| Cambodia | B+ | B2 | Stable |\n\n**Bangladesh's fiscal snapshot (FY2023/24):**\n- Fiscal deficit: **5.1% of GDP**\n- Revenue: **9.7% of GDP** — among the lowest in Asia\n- Public debt: **38.2% of GDP** (moderate; well below the 55% IMF threshold)\n- External debt share: **62%**, led by World Bank (22%), ADB (19%), Japan (14%)\n\nThe IMF's 2025 Article IV assessed Bangladesh at **moderate overall fiscal risk**, flagging energy subsidy reform and VAT digitalisation as critical consolidation levers.",
          sources: 3,
          sourceCards: [
            { type: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)', description: 'ADB-maintained sovereign credit rating history and outlook across DMCs.', updatedAt: '15 Jul 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook', description: 'Fiscal position, debt and deficit data for 190 economies.', updatedAt: '01 May 2026' },
            { type: 'web', title: 'adb.org/bangladesh', description: 'ADB country strategy and portfolio page for Bangladesh — latest lending programme and priorities.', updatedAt: '10 Jun 2026', url: 'https://www.adb.org' },
          ],
          outputOptions: [
            { key: 'country-dashboard', label: 'Country Dashboard', icon: 'map' },
            { key: 'metrics-dashboard', label: 'Metrics Dashboard', icon: 'chart' },
            { key: 'briefing-note',     label: 'Briefing Note',     icon: 'doc'  },
          ],
        },
      ];
    } else if (id === 'mission-prep') {
      this.title.set('Mission Preparation');
      this.starterPrompts = [
        'Configure mission: [Project Name] — [Mission Type], [Dates], [DMC].',
        'Draft mission clearance proposal and terms of reference.',
        'Generate mission materials brief with covenant and disbursement status.',
        'Draft MOU / aide-mémoire template for this mission.',
      ];
      this.assetGroups = MISSION_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.activeArtefactKey.set('mcr');
      this.previewCtx.set('briefing');
      this.lastOutputCtx.set('briefing');
      this.previewCollapsed.set(false);
      this.wfParams.set({ countries: 'Philippines', period: 'Project Review · 15–19 Oct 2026', indicators: 'Loan 4521-PHI · BTOR due 26 Oct 2026' });
      this.wfNodes.set([
        {
          id: 1, type: 'retrieve', title: 'Retrieve project records',
          description: 'Load ADB project data sheets, PAM, covenant status, procurement and disbursement records for the target project.',
          status: 'completed', time: '4 minutes ago',
          sources: [
            { icon: 'dataset', title: 'ADB Project Data Sheets Data Product',     description: 'Project-level summary data including approval, status, sector and country.' },
            { icon: 'dataset', title: 'Project Funding and Disbursement Dataset',  description: 'Cumulative disbursement rates and financing source breakdowns.' },
            { icon: 'dataset', title: 'Project Procurement and Contracts Dataset', description: 'Contract awards by method, sector and economy.' },
            { icon: 'pdf',     title: 'Project Administration Manual (PAM)',       description: 'Implementation guidelines, covenant list and design and monitoring framework.' },
          ],
        },
        {
          id: 2, type: 'retrieve', title: 'Retrieve country intelligence',
          description: 'Load country strategy, credit profile, and economic indicators for the mission DMC.',
          status: 'completed', time: '3 minutes ago',
          sources: [
            { icon: 'dataset', title: 'ADB Country Strategies',                     description: 'ADB country partnership strategies covering sector priorities and lending pipeline.' },
            { icon: 'dataset', title: 'Key Indicators Database (KIDB)',              description: 'Macroeconomic time-series including GDP, fiscal position and debt data.' },
            { icon: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)',  description: 'Sovereign credit ratings and outlook across DMCs.' },
            { icon: 'dataset', title: 'EVA Lessons from past ADB projects',         description: 'Independent evaluation findings and lessons from completed projects.' },
          ],
        },
        {
          id: 3, type: 'ai', title: 'Draft clearance documents',
          description: 'Generate mission clearance proposal, terms of reference, and position paper based on retrieved project and country data.',
          status: 'completed', time: '2 minutes ago',
          instruction: 'Draft a mission clearance proposal covering mission purpose, composition, terms of reference, and expected outputs. For midterm review missions, also draft a position paper covering institutional, financial, safeguards, gender, covenant, and DMF aspects. Align all documents with ADB project administration guidelines.',
          outputType: 'Documents',
          outputSections: ['Mission Clearance Proposal', 'Terms of Reference', 'Position Paper (midterm only)'],
        },
        {
          id: 4, type: 'ai', title: 'Compile mission materials',
          description: 'Compile implementation status snapshot, covenant tracker, procurement/disbursement summary, safeguards brief, and gender action plan status.',
          status: 'needs-attention', time: 'Now',
          instruction: 'Compile a mission materials brief covering: project implementation status, full covenant compliance list with flags, procurement and disbursement summary table, safeguards and environmental/social requirements status, gender action plan implementation, and financial management status. Flag items requiring mission discussion.',
          outputType: 'Brief',
          outputSections: ['Implementation Status', 'Covenant Tracker', 'Procurement & Disbursement', 'Safeguards & ESG', 'Gender Action Plan'],
        },
        {
          id: 5, type: 'human-review', title: 'Mission leader review',
          description: 'Mission leader reviews and approves all documents before clearance submission.',
          status: 'awaiting-review',
        },
        {
          id: 6, type: 'output', title: 'Mission Preparation Package',
          description: 'Full set of mission documents ready for clearance submission and mission execution.',
          status: 'not-run',
          outputType: 'Document Bundle',
          outputSections: ['Mission Clearance Request (MCR)', 'Terms of Reference (TOR)', 'Mission Program / Schedule', 'Position Paper', 'CPFR Background Paper', 'Briefing Presentation', 'Aide-mémoire (AM)', 'MOU', 'Back-to-office Report (BTOR)', 'Time-bound Action Plan', 'PAM', 'Cover Letter', 'Stakeholder List', 'Technical Attachments'],
        },
      ]);
      this.wfExpandedNodes.set(new Set([3, 4]));
      this.messages = [
        {
          role: 'user',
          text: 'Configure mission: Metro Manila Urban Transport Project — Project Review, 15–19 Oct 2026, Philippines.',
        },
        {
          role: 'assistant',
          text: 'Mission workspace configured for **Metro Manila Urban Transport Project** (Loan 4521-PHI).\n\nProject records retrieved:\n- **Implementation status**: On track — 37.7% disbursed ($158.4M of $420M), 9 active contracts\n- **Covenant compliance**: 47 covenants — 44 complied, 3 partially complied (remediation actions noted)\n- **Procurement**: Latest contract awarded Jun 2025 (Depot Systems Package, $16M)\n- **Country context**: Philippines (BB/Stable) · ADB Country Strategy 2024–2029\n\nBTOR deadline: **26 Oct 2026** (Project Review — 5 working days after return)\n\nWhich documents should I draft first?',
          chips: ['Mission Clearance Proposal', 'Terms of Reference', 'Mission Materials Brief', 'Draft MOU / Aide-Mémoire', 'All documents'],
        },
        {
          role: 'user',
          text: 'Draft all documents.',
        },
        {
          role: 'assistant',
          text: '**Mission Preparation Package — Metro Manila Urban Transport Project**\n\nGenerated 17 outputs for the Project Review mission (15–19 Oct 2026):\n\n**Pre-mission:** Mission Clearance Request (MCR) · Terms of Reference (TOR) · Mission Program / Schedule · Position Paper\n**Country context:** CPFR Background Paper · Briefing Presentation · Country Briefing Note · Country Dashboard · Metric Dashboard\n**During mission:** Aide-mémoire (AM) · MOU · Stakeholder List · Cover Letter\n**Post-mission:** Back-to-office Report (BTOR) · Time-bound Action Plan · Technical Attachments · Project Administration Manual (PAM)\n\nBTOR deadline: **26 Oct 2026** · Project Review (5 working days)',
          outputOptions: [
            { key: 'mcr',                    label: 'Mission Clearance Request (MCR)',       icon: 'doc' },
            { key: 'tor',                    label: 'Terms of Reference (TOR)',               icon: 'doc' },
            { key: 'mission-schedule',       label: 'Mission Program / Schedule',             icon: 'doc' },
            { key: 'position-paper',         label: 'Position Paper',                         icon: 'doc' },
            { key: 'cpfr-background',        label: 'CPFR Background Paper',                  icon: 'doc' },
            { key: 'briefing-presentation',  label: 'Briefing Presentation',                  icon: 'doc' },
            { key: 'aide-memoire',           label: 'Aide-mémoire (AM)',                      icon: 'doc' },
            { key: 'mou',                    label: 'Memorandum of Understanding (MOU)',      icon: 'doc' },
            { key: 'btor',                   label: 'Back-to-office Report (BTOR)',           icon: 'doc' },
            { key: 'action-plan',            label: 'Time-bound Action Plan',                 icon: 'doc' },
            { key: 'pam',                    label: 'Project Administration Manual (PAM)',    icon: 'doc' },
            { key: 'cover-letter',           label: 'Meeting Request / Cover Letter',         icon: 'doc' },
            { key: 'stakeholder-list',       label: 'Stakeholder List',                       icon: 'doc' },
            { key: 'technical-attachments',  label: 'Technical Attachments',                  icon: 'doc' },
            { key: 'country-dashboard',      label: 'Country Dashboard',                       icon: 'map' },
            { key: 'metrics-dashboard',      label: 'Metric Dashboard',                        icon: 'chart' },
            { key: 'country-briefing',       label: 'Country Briefing Note',                   icon: 'briefing' },
          ],
        },
      ];
    } else if (id === 'fork-mission-ph') {
      const card = this.workspaceService.get(id);
      this.title.set(card?.title ?? 'Mission Workspace');
      this.assetGroups = MISSION_ASSET_GROUPS.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
      this.previewCtx.set('doc');
      this.previewCollapsed.set(true);
      this.wfParams.set({ countries: 'Philippines', period: 'Project Review · 15–19 Oct 2026', indicators: 'Loan 4521-PHI · BTOR due 26 Oct 2026' });
      this.wfNodes.set([
        {
          id: 1, type: 'retrieve', title: 'Retrieve project records',
          description: 'Load ADB project data sheets, PAM, covenant status, procurement and disbursement records for the target project.',
          status: 'completed', time: '1 day ago',
          sources: [
            { icon: 'dataset', title: 'ADB Project Data Sheets Data Product',     description: 'Project-level summary data including approval, status, sector and country.' },
            { icon: 'dataset', title: 'Project Funding and Disbursement Dataset',  description: 'Cumulative disbursement rates and financing source breakdowns.' },
            { icon: 'dataset', title: 'Project Procurement and Contracts Dataset', description: 'Contract awards by method, sector and economy.' },
            { icon: 'pdf',     title: 'Project Administration Manual (PAM)',       description: 'Implementation guidelines, covenant list and design and monitoring framework.' },
          ],
        },
        {
          id: 2, type: 'retrieve', title: 'Retrieve country intelligence',
          description: 'Load country strategy, credit profile, and economic indicators for the mission DMC.',
          status: 'completed', time: '1 day ago',
          sources: [
            { icon: 'dataset', title: 'ADB Country Strategies',                     description: 'ADB country partnership strategies covering sector priorities and lending pipeline.' },
            { icon: 'dataset', title: 'Key Indicators Database (KIDB)',              description: 'Macroeconomic time-series including GDP, fiscal position and debt data.' },
            { icon: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)',  description: 'Sovereign credit ratings and outlook across DMCs.' },
          ],
        },
        {
          id: 3, type: 'ai', title: 'Draft BTOR',
          description: 'Generate back-to-office report covering mission composition, objectives, implementation status, covenant compliance, ratings, findings, and next steps.',
          status: 'not-run',
          instruction: 'Draft a BTOR for a Project Review mission including: mission composition and duration, mission objectives, project implementation status, covenant compliance summary, project rating, key findings, issues requiring guidance, recommended actions, and next steps. BTOR deadline is 5 working days after return.',
          outputType: 'Document',
          outputSections: ['Mission Composition', 'Objectives', 'Implementation Status', 'Covenant Compliance', 'Project Rating', 'Findings & Recommended Actions', 'Next Steps'],
        },
        {
          id: 4, type: 'output', title: 'BTOR',
          description: 'Back-to-office report for mission leader submission within 5 working days of return.',
          status: 'not-run',
          outputType: 'Document',
          outputSections: ['Mission Composition', 'Objectives', 'Implementation Status', 'Covenant Compliance', 'Findings', 'Next Steps'],
        },
      ]);
      this.starterPrompts = [
        'Draft my BTOR for the Metro Manila Urban Transport Project review mission.',
        'Summarise the 3 partially complied covenants and recommended actions.',
        'What were the key procurement findings from this mission?',
        'Generate the project rating section of the BTOR.',
      ];
      this.messages = [];
    } else if (id === 'new') {
      const widgets    = this.widgetService.selectedWidgets();
      const convo      = this.widgetService.conversation();
      const query      = this.widgetService.searchQuery();

      // Title from search query
      if (query) {
        const words = query.replace(/[?]/g, '').trim().split(/\s+/);
        const label = words.slice(0, 6).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        this.title.set(label);
      } else {
        this.title.set('New Workspace');
      }

      // Map widgets → asset groups (group by displayType); empty state when created from My Workspace
      if (widgets.length) {
        const groupMap: Record<string, AssetItem[]> = {};
        const groupOrder = ['AI Agents', 'AI Tools', 'API', 'Data'];
        const typeToGroup: Record<string, string> = {
          'AI Agent': 'AI Agents', 'Dataset': 'Data',
          'API': 'API', 'Dashboard': 'Dashboards',
        };
        for (const w of widgets) {
          const groupName = typeToGroup[w.displayType ?? ''] ?? (w.displayType ?? 'Data');
          if (!groupMap[groupName]) groupMap[groupName] = [];
          groupMap[groupName].push({ name: w.title, selected: true });
        }
        this.assetGroups = [...groupOrder, ...Object.keys(groupMap).filter(k => !groupOrder.includes(k))]
          .filter(k => groupMap[k]?.length)
          .map(k => ({ name: k, expanded: true, items: groupMap[k] }));
      } else {
        this.assetGroups = [];
      }

      // Starter prompts for new workspace
      if (!convo.length && !query) {
        if (widgets.length) {
          const firstType = widgets[0].displayType ?? 'Dataset';
          if (firstType === 'AI Agent') {
            this.starterPrompts = [
              'What tasks can this agent automate?',
              'Show me example workflows for this agent.',
              'How do I get started with this agent?',
            ];
          } else if (firstType === 'API') {
            this.starterPrompts = [
              'What endpoints does this API expose?',
              'Show me a sample query for this API.',
              'What authentication is required?',
            ];
          } else {
            this.starterPrompts = [
              'Summarise the key findings from this dataset.',
              'What fields and coverage does this dataset include?',
              'Show me a sample preview of the data.',
            ];
          }
        } else {
          this.starterPrompts = [
            'What datasets are available for this topic?',
            'Summarise the key findings.',
            'Show related resources.',
          ];
        }
      }

      // Carry full conversation from search flow
      if (convo.length) {
        this.messages = convo
          .filter(m => m.type === 'user' || m.type === 'ai')
          .map(m => m.type === 'user'
            ? { role: 'user' as const,      text: (m as any).text }
            : { role: 'assistant' as const, text: (m as any).text, widgets: (m as any).widgets });
      } else if (query) {
        this.messages = [{ role: 'user', text: query }];
      }

      // Suggested follow-up queries shown after the carried-over conversation
      if (convo.length && query) {
        const q = query.toLowerCase();
        if (q.includes('climate') || q.includes('risk')) {
          this.relatedQueries = [
            'Which countries face the highest exposure?',
            'Compare vulnerability scores across Pacific SIDS',
            'Show historical trend data',
          ];
        } else if (q.includes('ai') || q.includes('agent') || q.includes('tool')) {
          this.relatedQueries = [
            'What tasks can these agents automate?',
            'How do I access this platform?',
            'Show me usage examples',
          ];
        } else if (q.includes('data') || q.includes('dataset')) {
          this.relatedQueries = [
            'What fields does this dataset contain?',
            'How frequently is this updated?',
            'Show me a sample preview',
          ];
        } else {
          this.relatedQueries = [
            'Summarise the key findings',
            'Show related datasets',
            'Export this as a report',
          ];
        }
      }

      // If conversation carries chart widgets, activate the disbursement preview
      const hasChart = convo.some(m =>
        m.type === 'ai' && (m as any).widgets?.some((w: ChatWidget) => w.widgetType === 'chart')
      );
      if (hasChart) {
        this.hasDashboardData.set(true);
        this.previewCtx.set('disburse');
        this.previewMode = 'Chart';
        this.previewCollapsed.set(false);
      } else {
        this.previewCollapsed.set(true);
      }
    } else if (id?.startsWith('new-')) {
      const card = this.workspaceService.get(id);
      this.title.set(card?.title ?? 'New Workspace');
      this.assetGroups = [];
      this.previewCollapsed.set(true);
      this.resetPreview();
      const pendingNew = this.widgetService.pendingAsset();
      if (pendingNew) {
        this.widgetService.pendingAsset.set(null);
        this.forkLoading.set(true);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.addAssetToSpace({
            name: pendingNew.title,
            type: (pendingNew.displayType ?? 'Dataset') as any,
            description: pendingNew.description,
            access: 'restricted' as AccessLevel,
          });
          this.forkLoading.set(false);
          this.cdr.markForCheck();
        }, 1000);
      }
    } else {
      const card = this.workspaceService.get(id ?? '');
      this.title.set(card?.title ?? 'New Workspace');
    }

    // Apply any asset added from the catalogue "Add to Workspace" action (fresh nav to existing workspace)
    const pending = this.widgetService.pendingAsset();
    if (pending && id !== 'new' && !id?.startsWith('new-')) {
      this.widgetService.pendingAsset.set(null);
      this.assetPaneLoading.set(true);
      this.cdr.markForCheck();
      setTimeout(() => {
        this.addAssetToSpace({
          name: pending.title,
          type: (pending.displayType ?? 'Dataset') as any,
          description: pending.description,
          access: 'restricted' as AccessLevel,
        });
        this.assetPaneLoading.set(false);
        this.cdr.markForCheck();
      }, 1000);
    }

    // 50/50 chat : preview split on load when preview is expanded
    if (!this.previewCollapsed()) {
      const assetsW = this.assetsCollapsed() ? 48 : this.assetWidth();
      const half = Math.floor((window.innerWidth - assetsW) / 2);
      this.previewWidth.set(Math.max(200, half));
    }

    this.scrollToLastMessage();

    // Handle component reuse when navigating between workspace routes
    // Community workspaces (Workspaces tab, not user-owned) default to the Workflow tab
    const communityWorkspaceIds = new Set(['pacific', 'transport', 'finance', 'social', '2', 'mission-prep']);
    if (id && communityWorkspaceIds.has(id)) {
      this.isCommunityWorkspace.set(true);
      this.chatTab.set('workflow');
    }

    this.paramSub = this.route.paramMap.subscribe(params => {
      const newId = params.get('id') ?? '';
      if (newId === this.notebookId) return;

      const pendingReuse = this.widgetService.pendingAsset();

      if (newId.startsWith('fork-') || newId.startsWith('new-')) {
        this.notebookId = newId;
        const card = this.workspaceService.get(newId);
        this.title.set(card?.title ?? 'New Workspace');
        this.useInOpen.set(false);
        this.useInDrawer.set(null);
        this.forking.set(false);
        if (newId.startsWith('new-')) {
          this.assetGroups = [];
          this.resetPreview();
        }
        this.forkLoading.set(true);
        this.cdr.markForCheck();
        if (pendingReuse) {
          this.widgetService.pendingAsset.set(null);
          setTimeout(() => {
            this.addAssetToSpace({
              name: pendingReuse.title,
              type: (pendingReuse.displayType ?? 'Dataset') as any,
              description: pendingReuse.description,
              access: 'restricted' as AccessLevel,
            });
            this.forkLoading.set(false);
            this.cdr.markForCheck();
          }, 1000);
        } else {
          setTimeout(() => { this.forkLoading.set(false); this.cdr.markForCheck(); }, 1000);
        }
      } else if (pendingReuse) {
        // Navigating to an existing workspace with a pending asset to add — only skeleton the assets pane
        this.notebookId = newId;
        this.widgetService.pendingAsset.set(null);
        this.assetPaneLoading.set(true);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.addAssetToSpace({
            name: pendingReuse.title,
            type: (pendingReuse.displayType ?? 'Dataset') as any,
            description: pendingReuse.description,
            access: 'restricted' as AccessLevel,
          });
          this.assetPaneLoading.set(false);
          this.cdr.markForCheck();
        }, 1000);
      }
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup',   this.onMouseUp);
    this.clearTimers();
    this.paramSub?.unsubscribe();
  }

  // ── Chat / Workflow tabs ──────────────────────────────────────────────────────

  chatTab              = signal<'chat' | 'workflow'>('chat');
  isCommunityWorkspace = signal(false);

  // Shared workflow state
  wfNodes  = signal<WfNode[]>([]);
  wfParams = signal<WfParams>({ countries: '', period: '', indicators: '' });

  // UI state
  wfExpandedNodes  = signal<Set<number>>(new Set());
  wfEditingNodeId  = signal<number | null>(null);
  wfEditingParams  = signal(false);
  wfPendingChanges = signal(0);
  wfRunning        = signal(false);

  // Mutable draft objects (mutated directly; cdr.markForCheck called on change)
  wfNodeDraft: { sources: WfSource[]; instruction: string; outputType: string; outputSections: string[]; onFailure: string } = {
    sources: [], instruction: '', outputType: '', outputSections: [], onFailure: 'Warn and continue',
  };
  wfParamDraft: WfParams = { countries: '', period: '', indicators: '' };

  readonly wfOutputTypes = ['Briefing note', 'Executive summary', 'Comparison table', 'Report'];

  wfAddingAt = signal<number | null>(null);

  // Asset picker for source slots
  wfPickerOpenIdx = signal<number | null>(null);
  wfPickerQuery   = '';
  wfPickerPos: { top: number; left: number; width: number } = { top: 0, left: 0, width: 320 };
  wfDraggedAsset: AssetItem | null = null;
  wfDropHighlight = signal(false);

  get wfFilteredAssets(): AssetItem[] {
    const q = this.wfPickerQuery.toLowerCase();
    return this.assetGroups
      .flatMap(g => g.items)
      .filter(i => !q || i.name.toLowerCase().includes(q));
  }

  openSourcePicker(idx: number, event: MouseEvent): void {
    if (this.wfPickerOpenIdx() !== null) {
      this.wfPickerOpenIdx.set(null);
      this.cdr.markForCheck();
      return;
    }
    this.wfPickerQuery = '';
    const btn = event.currentTarget as HTMLElement;
    const btnRect = btn.getBoundingClientRect();
    const card = btn.closest('.nb__wf-card') as HTMLElement;
    const cardRect = card ? card.getBoundingClientRect() : btnRect;
    this.wfPickerPos = { top: btnRect.bottom + 4, left: cardRect.left, width: cardRect.width };
    this.wfPickerOpenIdx.set(idx);
    this.cdr.markForCheck();
  }

  onPickerQueryChange(): void { this.cdr.markForCheck(); }

  closeSourcePicker(): void {
    this.wfPickerOpenIdx.set(null);
    this.cdr.markForCheck();
  }

  selectSourceAsset(_idx: number, asset: AssetItem): void {
    const alreadyAdded = this.wfNodeDraft.sources.some(s => s.title === asset.name);
    if (!alreadyAdded) {
      this.wfNodeDraft.sources = [
        ...this.wfNodeDraft.sources,
        { icon: 'dataset' as const, title: asset.name, description: '' },
      ];
    }
    this.wfPickerOpenIdx.set(null);
    this.cdr.markForCheck();
  }

  onAssetDragStart(asset: AssetItem): void {
    this.wfDraggedAsset = asset;
  }

  onAssetDragEnd(): void {
    this.wfDraggedAsset = null;
    this.wfDropHighlight.set(false);
  }

  onSourceDropZoneDragOver(e: DragEvent): void {
    if (!this.wfDraggedAsset) return;
    e.preventDefault();
    this.wfDropHighlight.set(true);
  }

  onSourceDropZoneDragLeave(): void {
    this.wfDropHighlight.set(false);
  }

  onSourceDrop(e: DragEvent): void {
    e.preventDefault();
    this.wfDropHighlight.set(false);
    if (!this.wfDraggedAsset) return;
    const asset = this.wfDraggedAsset;
    const alreadyAdded = this.wfNodeDraft.sources.some(s => s.title === asset.name);
    if (!alreadyAdded) {
      this.wfNodeDraft.sources = [
        ...this.wfNodeDraft.sources.filter(s => s.title !== 'Select data source'),
        { icon: 'dataset' as const, title: asset.name, description: '' },
      ];
    }
    this.wfDraggedAsset = null;
    this.cdr.markForCheck();
  }

  readonly wfTypeGroups: { category: string; types: { type: WfNodeType; label: string }[] }[] = [
    { category: 'Data',    types: [{ type: 'retrieve', label: 'Retrieve' }, { type: 'search', label: 'Search' }, { type: 'filter', label: 'Filter' }] },
    { category: 'Process', types: [{ type: 'transform', label: 'Transform' }, { type: 'compare', label: 'Compare' }] },
    { category: 'AI',      types: [{ type: 'ai', label: 'AI Analyse' }] },
    { category: 'Quality', types: [{ type: 'validate', label: 'Validate' }] },
    { category: 'Create',  types: [{ type: 'visualise', label: 'Visualise' }, { type: 'output', label: 'Output' }] },
    { category: 'Use',     types: [{ type: 'human-review', label: 'Human Review' }, { type: 'destination', label: 'Destination' }] },
  ];

  openAddStep(insertIdx: number): void {
    this.wfAddingAt.set(this.wfAddingAt() === insertIdx ? null : insertIdx);
    this.cdr.markForCheck();
  }

  insertNode(insertIdx: number, type: WfNodeType): void {
    const labels: Record<WfNodeType, string> = {
      'retrieve': 'Retrieve data', 'search': 'Search', 'filter': 'Filter',
      'transform': 'Transform', 'compare': 'Compare', 'ai': 'AI Analysis',
      'validate': 'Validate', 'visualise': 'Visualise', 'output': 'Output',
      'human-review': 'Human Review', 'destination': 'Destination',
    };
    const newId = Math.max(0, ...this.wfNodes().map(n => n.id)) + 1;
    const newNode: WfNode = {
      id: newId, type, status: 'not-run',
      title: labels[type], description: 'Configure this step.',
    };
    this.wfNodes.update(nodes => [
      ...nodes.slice(0, insertIdx),
      newNode,
      ...nodes.slice(insertIdx),
    ]);
    this.wfAddingAt.set(null);
    this.wfPendingChanges.update(c => c + 1);
    this.editNode(newId);
  }

  get hasArtefact(): boolean {
    return this.messages.some(m => !!m.artefactCard) || this.wfNodes().length > 0;
  }

  wfNodeStatusLabel(status: WfNodeStatus): string {
    const map: Record<WfNodeStatus, string> = {
      'completed':      'Completed',
      'not-run':        'Not run',
      'running':        'Running',
      'needs-attention':'Needs attention',
      'failed':         'Failed',
      'awaiting-review':'Awaiting review',
      'changed':        'Changed',
    };
    return map[status] ?? status;
  }

  toggleWfNode(id: number): void {
    if (this.wfEditingNodeId() === id) return;
    this.wfExpandedNodes.update(s => {
      const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
  }

  removeNode(id: number): void {
    this.wfNodes.set(this.wfNodes().filter(n => n.id !== id));
    if (this.wfEditingNodeId() === id) this.wfEditingNodeId.set(null);
    this.wfExpandedNodes.update(s => { s.delete(id); return new Set(s); });
    this.wfPendingChanges.update(v => v + 1);
    this.cdr.markForCheck();
  }

  editNode(id: number): void {
    if (this.isCommunityWorkspace()) return;
    const node = this.wfNodes().find(n => n.id === id);
    if (!node) return;
    this.wfNodeDraft = {
      sources:        (node.sources ?? []).map(s => ({ ...s })),
      instruction:    node.instruction ?? '',
      outputType:     node.outputType  ?? '',
      outputSections: node.outputSections ? [...node.outputSections] : [],
      onFailure:      node.onFailure   ?? 'Warn and continue',
    };
    this.wfEditingNodeId.set(id);
    this.wfExpandedNodes.update(s => { const next = new Set(s); next.add(id); return next; });
    this.cdr.markForCheck();
  }

  cancelNodeEdit(): void {
    this.wfEditingNodeId.set(null);
    this.cdr.markForCheck();
  }

  saveNode(id: number): void {
    this.wfNodes.update(nodes => nodes.map(n =>
      n.id !== id ? n : {
        ...n,
        sources:        this.wfNodeDraft.sources,
        instruction:    this.wfNodeDraft.instruction || undefined,
        outputType:     this.wfNodeDraft.outputType  || undefined,
        outputSections: this.wfNodeDraft.outputSections.length ? this.wfNodeDraft.outputSections : undefined,
        status:         'changed' as WfNodeStatus,
      }
    ));
    this.wfPendingChanges.update(c => c + 1);
    this.wfEditingNodeId.set(null);
    this.cdr.markForCheck();
  }

  editParams(): void {
    this.wfParamDraft = { ...this.wfParams() };
    this.wfEditingParams.set(true);
    this.cdr.markForCheck();
  }

  cancelParamsEdit(): void {
    this.wfEditingParams.set(false);
    this.cdr.markForCheck();
  }

  saveParams(): void {
    this.wfParams.set({ ...this.wfParamDraft });
    this.wfPendingChanges.update(c => c + 1);
    this.wfEditingParams.set(false);
    this.cdr.markForCheck();
  }

  removeOutputSection(nodeId: number, idx: number): void {
    this.wfNodes.update(nodes => nodes.map(n =>
      n.id === nodeId
        ? { ...n, outputSections: (n.outputSections ?? []).filter((_, i) => i !== idx) }
        : n
    ));
    this.cdr.markForCheck();
  }

  readonly outputNodeTypes = OUTPUT_NODE_TYPES;

  setNodeOutputType(nodeId: number, type: typeof OUTPUT_NODE_TYPES[0]): void {
    this.wfNodes.update(nodes => nodes.map(n => {
      if (n.id !== nodeId) return n;
      const sections = type.outputType === 'Document Bundle'
        ? [...MISSION_DOC_OPTIONS]
        : undefined;
      return { ...n, outputType: type.outputType, outputSections: sections, description: type.desc };
    }));
    this.cdr.markForCheck();
  }

  clearNodeOutputType(nodeId: number): void {
    this.wfNodes.update(nodes => nodes.map(n =>
      n.id === nodeId ? { ...n, outputType: undefined, outputSections: undefined, description: 'Configure this step.' } : n
    ));
    this.cdr.markForCheck();
  }

  availableDocOptions(nodeId: number): string[] {
    const node = this.wfNodes().find(n => n.id === nodeId);
    const existing = new Set(node?.outputSections ?? []);
    return MISSION_DOC_OPTIONS.filter(d => !existing.has(d));
  }

  startAddDoc(nodeId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.addingDocNodeId.update(v => v === nodeId ? null : nodeId);
    this.cdr.markForCheck();
  }

  pickDoc(nodeId: number, name: string): void {
    this.wfNodes.update(nodes => nodes.map(n =>
      n.id === nodeId
        ? { ...n, outputSections: [...(n.outputSections ?? []), name] }
        : n
    ));
    this.addingDocNodeId.set(null);
    this.cdr.markForCheck();
  }

  removeNodeSource(idx: number): void {
    this.wfNodeDraft.sources = this.wfNodeDraft.sources.filter((_, i) => i !== idx);
    this.cdr.markForCheck();
  }

  addNodeSource(): void {
    this.wfNodeDraft.sources = [
      ...this.wfNodeDraft.sources,
      { icon: 'dataset' as const, title: 'Select data source', description: 'Choose from workspace assets' },
    ];
    this.cdr.markForCheck();
  }

  runWorkflow(): void {
    this.wfRunning.set(true);
    this.wfPendingChanges.set(0);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.wfNodes.update(nodes => nodes.map(n =>
        n.status === 'changed' ? { ...n, status: 'completed' as WfNodeStatus, time: 'Just now' } : n
      ));
      this.wfRunning.set(false);
      this.cdr.markForCheck();
      this.openArtefact(this.previewCtx());
    }, 2500);
  }

  wfSetOutputType(t: string): void { this.wfNodeDraft.outputType = t; this.cdr.markForCheck(); }

  private initWorkflowNodes(sourceCards: SourceCard[]): void {
    const sources: WfSource[] = sourceCards.map(s => ({
      icon:        (s.type === 'web' ? 'web' : s.type === 'pdf' ? 'pdf' : 'dataset') as WfSource['icon'],
      title:       s.title,
      description: s.description,
    }));
    this.wfParams.set({
      countries:  'Bangladesh, Viet Nam, Cambodia',
      period:     '2020–2024',
      indicators: 'GDP Growth, CPI, Debt/GDP, Current Account',
    });
    this.wfNodes.set([
      {
        id:          1,
        type:        'retrieve',
        title:       'Retrieve economic indicators',
        description: 'Query key datasets for macroeconomic, financial and regional insights.',
        status:      'completed',
        time:        '2 minutes ago',
        sources,
      },
      {
        id:          2,
        type:        'ai',
        title:       'DataNex+ AI Analysis',
        description: 'Synthesise retrieved evidence and identify key trends, risks and opportunities.',
        status:      'completed',
        time:        '1 minute ago',
        instruction: 'Compare GDP growth across Bangladesh, Viet Nam and Cambodia since 2020. Identify major trends and drivers, explain the 2022 spike in Viet Nam, and highlight differences between ADB and IMF growth forecasts. Include inflation and debt risk context.',
      },
      {
        id:              3,
        type:            'output',
        title:           'Country Briefing Note',
        description:     'Generate a structured briefing note with citations, charts and key takeaways.',
        status:          'completed',
        time:            'Just now',
        outputType:      'Briefing note',
        outputSections:  ['Economic overview', 'Monetary & financial', 'Fiscal & debt', 'Risks & outlook'],
      },
    ]);
    this.wfExpandedNodes.set(new Set([2]));
  }

  // ── Header ───────────────────────────────────────────────────────────────────

  startEditTitle(): void { this.editingTitle.set(true); }

  saveTitle(value: string): void {
    const trimmed = value.trim();
    if (trimmed) this.title.set(trimmed);
    this.editingTitle.set(false);
  }

  createNew():      void { this.router.navigate(['/notebooks', 'new']); }
  closeWorkspace(): void { this.location.back(); }
  goHome():         void { this.router.navigate(['/']); }

  // ── Panel ────────────────────────────────────────────────────────────────────

  toggleAssetsPanel():  void { this.assetsCollapsed.update(v => !v); }
  togglePreviewPanel(): void { this.previewCollapsed.update(v => !v); }

  toggleArtefactPicker(event: MouseEvent): void {
    event.stopPropagation();
    if (this.artefactCount <= 1) {
      if (this.previewCtx() === 'doc') this.restoreOutput();
      else this.togglePreviewPanel();
      return;
    }
    this.artefactPickerOpen.update(v => !v);
    this.cdr.markForCheck();
  }

  peekArtefact(key: string): void {
    this.artefactPickerOpen.set(false);
    this.activeArtefactKey.set(key);
    const ctxMap: Record<string, PreviewCtx> = {
      'briefing-note':         'briefing',
      'country-dashboard':     'watchlist',
      'metrics-dashboard':     'dashboard',
      'country-briefing':      'briefing',
      'mcr':                   'briefing',
      'tor':                   'briefing',
      'mission-schedule':      'briefing',
      'position-paper':        'briefing',
      'cpfr-background':       'briefing',
      'briefing-presentation': 'briefing',
      'aide-memoire':          'briefing',
      'mou':                   'briefing',
      'btor':                  'briefing',
      'action-plan':           'briefing',
      'pam':                   'briefing',
      'cover-letter':          'briefing',
      'stakeholder-list':      'briefing',
      'technical-attachments': 'briefing',
    };
    const ctx: PreviewCtx = ctxMap[key] ?? 'briefing';
    if (ctx === 'doc') {
      const opt = this.allArtefacts.find(a => a.key === key);
      this.previewDoc.set({ type: 'pdf', title: opt?.label ?? key, description: '', updatedAt: 'Just now' });
      this.lastOutputCtx.set('doc');
    }
    this.openArtefact(ctx);
    this.cdr.markForCheck();
  }

  openArtefact(ctx: PreviewCtx): void {
    this.lastOutputCtx.set(ctx);
    this.outputSwitching.set(true);
    this.previewCtx.set(ctx);
    if (this.previewCollapsed()) {
      const assetsW = this.assetsCollapsed() ? 48 : this.assetWidth();
      const half = Math.floor((window.innerWidth - assetsW) / 2);
      this.previewWidth.set(Math.max(200, half));
    }
    this.previewCollapsed.set(false);
    this.cdr.markForCheck();
    setTimeout(() => { this.outputSwitching.set(false); this.cdr.markForCheck(); }, 550);
    if (ctx === 'briefing') {
      this.briefingHistory = [];
      this._briefingHistLen.set(0);
      this._briefingHistIdx.set(0);
      setTimeout(() => {
        const initial = this.snapshotBriefingBodies();
        if (initial.length > 0) {
          this.briefingHistory = [initial];
          this._briefingHistLen.set(1);
        }
      }, 0);
    }
  }

  triggerOutputOption(msgIndex: number, key: string): void {
    // Remove outputOptions from the message so the buttons disappear
    this.messages[msgIndex] = { ...this.messages[msgIndex], outputOptions: undefined };

    if (key === 'briefing-note') {
      this.messages = [
        ...this.messages,
        { role: 'user', text: 'Great — now generate a full country briefing note for Bangladesh synthesising all of this.' },
        {
          role: 'assistant',
          text: "I've synthesised data across **6 assets** — KIDB, IMF World Economic Outlook, Country Credit Profiles, ADB Country Strategies, IMF Exchange Rates, and the Asian Development Outlook — into a structured four-section briefing note.\n\nThe note covers:\n1. Overview of the economy & current developments\n2. Monetary policy & financial sector\n3. Fiscal policy & public debt\n4. Risks & outlook\n\nYou can review, edit inline, and export it from the **Briefing Note** panel.",
          artefactCard: { label: 'Country Briefing Note', title: 'Bangladesh — Economic Brief 2026', ctx: 'briefing' },
          sources: 4,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'ADB flagship time-series covering economic and financial indicators across DMCs.', updatedAt: '30 Jun 2026' },
            { type: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)', description: 'Sovereign credit rating history and outlook across DMCs.', updatedAt: '15 Jul 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook', description: 'GDP, inflation, current account and debt projections for 190 economies.', updatedAt: '01 May 2026' },
            { type: 'dataset', title: 'Asian Development Outlook', description: 'ADB annual flagship publication covering macroeconomic analysis and DMC growth forecasts.', updatedAt: '15 Apr 2026' },
          ],
        },
      ];
      this.openArtefact('briefing');
      // Collect all source cards from conversation and initialise workflow
      const allSrc: SourceCard[] = [];
      const seen = new Set<string>();
      for (const m of this.messages) {
        for (const s of m.sourceCards ?? []) {
          if (!seen.has(s.title)) { seen.add(s.title); allSrc.push(s); }
        }
      }
      this.initWorkflowNodes(allSrc);
    } else if (key === 'metrics-dashboard') {
      this.messages = [
        ...this.messages,
        { role: 'user', text: 'Create a metrics dashboard for Bangladesh.' },
        { role: 'assistant', text: "Here's a metrics dashboard summarising key economic indicators for Bangladesh.", suggestedMetrics: [] },
      ];
    } else if (key === 'country-dashboard') {
      this.messages = [
        ...this.messages,
        { role: 'user', text: 'Generate a country dashboard for Bangladesh.' },
        { role: 'assistant', text: 'Opening the Country Dashboard for Bangladesh with a map view and country summary pane.' },
      ];
    }
    this.cdr.markForCheck();
  }

  openSourceDoc(src: SourceCard, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.previewCtx() !== 'doc') this.lastOutputCtx.set(this.previewCtx());
    this.previewDoc.set(src);
    this.docPage.set(1);
    this.previewCtx.set('doc');
    if (this.previewCollapsed()) {
      const assetsW = this.assetsCollapsed() ? 48 : this.assetWidth();
      const half = Math.floor((window.innerWidth - assetsW) / 2);
      this.previewWidth.set(Math.max(200, half));
    }
    this.previewCollapsed.set(false);
    this.chipPopoverOpen.set(false);
    this.cdr.markForCheck();
  }

  restoreOutput(): void {
    this.outputSwitching.set(true);
    this.previewCtx.set(this.lastOutputCtx());
    this.previewCollapsed.set(false);
    this.cdr.markForCheck();
    setTimeout(() => { this.outputSwitching.set(false); this.cdr.markForCheck(); }, 550);
  }

  get isPublished(): boolean {
    return ['pacific', '2', 'transport', 'finance', 'social', 'mission-prep'].includes(this.notebookId);
  }

  get hasPreviewData(): boolean {
    if (this.notebookId === 'mission-prep') return true;
    if (this.notebookId === 'new' || this.notebookId.startsWith('new-') || this.notebookId.startsWith('fork-')) return this.hasDashboardData();
    return this.notebookId !== '2' || this.flowStep() > 0;
  }

  // ── Output artefact identity ──────────────────────────────────────────────

  get outputTypeLabel(): string {
    const map: Partial<Record<PreviewCtx, string>> = {
      map: 'Map', watchlist: 'Dashboard', overview: 'Overview', disburse: 'Chart',
      procurement: 'Table', comparison: 'Table', dashboard: 'Dashboard',
      'ci-dashboard': 'Dashboard', briefing: 'Briefing Note',
      'pacific-chart': 'Bar Chart', 'pacific-line': 'Line Chart',
      'pacific-scatter': 'Scatter', 'pacific-table': 'Table',
      'pacific-record': 'Record', 'pacific-schema': 'Schema', 'pacific-raw': 'Raw Data',
      doc: 'Source',
    };
    return map[this.previewCtx()] ?? 'Output';
  }

  get downloadOptions(): { ext: string; label: string; desc: string }[] {
    const ctx = this.previewCtx();
    const doc       = [{ ext: 'PDF',  label: 'PDF',         desc: 'Formatted document'    },
                       { ext: 'DOCX', label: 'Word (.docx)', desc: 'Editable document'     }];
    const chart     = [{ ext: 'PNG',  label: 'PNG Image',   desc: 'High-resolution image'  },
                       { ext: 'SVG',  label: 'SVG',          desc: 'Vector graphic'         },
                       { ext: 'CSV',  label: 'CSV',          desc: 'Underlying data'        }];
    const table     = [{ ext: 'CSV',  label: 'CSV',          desc: 'Comma-separated values' },
                       { ext: 'XLSX', label: 'Excel (.xlsx)', desc: 'Spreadsheet'            },
                       { ext: 'PDF',  label: 'PDF',          desc: 'Formatted table'        }];
    const visual    = [{ ext: 'PNG',  label: 'PNG Image',   desc: 'High-resolution image'  },
                       { ext: 'PDF',  label: 'PDF',          desc: 'Formatted report'       }];

    const map: Partial<Record<PreviewCtx, typeof doc>> = {
      briefing:          doc,
      doc:               doc,
      overview:          doc,
      'pacific-record':  doc,
      map:               visual,
      watchlist:         visual,
      dashboard:         visual,
      'ci-dashboard':    visual,
      'pacific-schema':  visual,
      disburse:          table,
      procurement:       table,
      comparison:        table,
      'pacific-table':   table,
      'pacific-chart':   chart,
      'pacific-line':    chart,
      'pacific-scatter': chart,
      'pacific-raw':     [{ ext: 'JSON', label: 'JSON', desc: 'Raw data' },
                          { ext: 'CSV',  label: 'CSV',  desc: 'Tabular export' }],
    };
    return map[ctx] ?? visual;
  }

  get dynamicOutputTitle(): string {
    if (this.title() === 'Pacific Risk Atlas (Old)') return 'Data Preview';
    if (!this.hasPreviewData) return 'Output';
    if (this.previewCtx() === 'doc') return this.previewDoc()?.title ?? 'Source';
    if (this.previewCtx() === 'briefing' && this.activeArtefactKey()) {
      const label = this.allArtefacts.find(a => a.key === this.activeArtefactKey())?.label;
      if (label) return label;
    }
    return this.outputTypeLabel;
  }

  readonly setAsOutputIdx = signal<number | null>(null);

  setChartAsOutput(idx: number): void {
    this.setAsOutputIdx.set(idx);
    this.previewCollapsed.set(false);
    this.cdr.markForCheck();
  }

  // ── Briefing note editable document ─────────────────────────────────────────

  @ViewChild('briefingDoc') briefingDocRef?: ElementRef<HTMLDivElement>;

  readonly briefingHasEdits     = signal(false);
  readonly briefingLastEditTime = signal<Date | null>(null);
  readonly briefingSelMenu      = signal<{ top: number; left: number; text: string } | null>(null);
  private readonly _briefingHistIdx = signal(0);
  private readonly _briefingHistLen = signal(0);
  private briefingHistory: string[][] = [];
  private briefingDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly briefingCanUndo = computed(() => this._briefingHistIdx() > 0);
  readonly briefingCanRedo = computed(() => this._briefingHistIdx() < this._briefingHistLen() - 1);

  private static readonly BRIEFING_ECONOMIC = [
    {
      heading: 'Overview of the economy & current developments',
      body: `Bangladesh's economy expanded 6.4% in 2024, among the highest in South Asia, driven by the garments sector—which accounts for 84% of merchandise exports—and sustained remittance inflows of USD 21.9 billion. Consumer price inflation eased to 7.8% from a 9.1% peak in 2023, remaining above Bangladesh Bank's 6% target, with food (48% of CPI) at 8.3% YOY. GDP per capita reached approximately USD 2,530; ADB projects 6.6% growth in 2025, underpinned by infrastructure investment and export diversification into electronics.`,
    },
    {
      heading: 'Monetary policy & financial sector',
      body: `Bangladesh Bank raised its policy rate to 8.5% in H1 2024—the highest in a decade—while maintaining a crawling peg exchange rate regime that saw the taka depreciate 7.2% against the USD over the year. Private sector credit growth decelerated to 8.4% YOY (from 12.1% in 2023), reflecting tighter monetary conditions; the NPL ratio remained elevated at 9.8%. Gross foreign exchange reserves stood at USD 21 billion (approximately 3.5 months import cover), below the IMF-recommended 4-month threshold, constraining the central bank's capacity to intervene in the FX market.`,
    },
    {
      heading: 'Fiscal policy & public debt',
      body: `The central government deficit widened to an estimated 5.1% of GDP in FY2023/24, with total revenue at 9.7% of GDP—one of the lowest in Asia. Public debt reached 38.2% of GDP at end-2024 (up from 33.4% in 2019), with external debt at approximately 62%, led by the World Bank (22%), ADB (19%), and Japan (14%). The government's revenue mobilisation reform—including VAT digitisation and NBR capacity building—remains a critical fiscal consolidation lever, with the IMF's 2025 Article IV assessing Bangladesh at moderate overall risk.`,
    },
    {
      heading: 'Risks & outlook',
      body: `Bangladesh's medium-term growth of 6.0–6.8% per annum through 2027 is anchored by continued export diversification and remittance resilience. Key downside risks include exchange rate rigidity constraining monetary policy flexibility, energy subsidy reform required for near-term fiscal consolidation, FX reserves below the recommended import-cover threshold, and garment export concentration creating vulnerability to global demand shocks and trade policy shifts in the EU and US. Inflation is projected to ease toward 6.0% by end-2025 as global commodity pressures moderate and monetary tightening takes effect.`,
    },
  ];

  private static readonly BRIEFING_SOCIAL = [
    {
      heading: 'Social protection & poverty',
      body: `Social protection coverage across Asia-Pacific DMCs averages 34.2% of the population, masking significant disparities — from 78% in Thailand to under 12% in Cambodia and Papua New Guinea. Income poverty rates (at $3.65/day PPP) remain above 10% in 14 of 46 DMCs, with rural–urban gaps widening post-pandemic. ADB's 2025 Social Protection Index finds that benefit adequacy — the depth of coverage — is declining in real terms due to inflation eroding fixed transfer values.`,
    },
    {
      heading: 'Wealth inequality & the Gini coefficient',
      body: `Wealth Gini coefficients across South and Southeast Asia range from 0.38 (Viet Nam) to 0.53 (India), with the top decile holding 55–65% of national wealth in most DMCs. Wage inequality between formal and informal workers widened in 2023–2024 as formal sector wages recovered faster from COVID-19 disruption. ADB estimates that a one-point reduction in the Gini coefficient is associated with a 0.8 percentage-point decline in poverty incidence — underscoring redistribution as a growth lever.`,
    },
    {
      heading: 'Gender & inclusion',
      body: `Female labour force participation across ADB DMCs averages 46%, 22 percentage points below male rates, with the gap largest in South Asia (Bangladesh: 39%, Pakistan: 23%). Access to finance for women entrepreneurs remains constrained — only 28% of women in rural DMCs have a formal bank account. ADB's Gender Equality and Social Inclusion (GESI) framework targets parity improvements across health, education, and economic empowerment, with the 2024 Gender Action Plan committing USD 4.2 billion in gender-tagged lending.`,
    },
    {
      heading: 'Outlook & policy priorities',
      body: `Structural reforms — including expanding social registries, digitising transfer delivery, and linking safety nets to labour market activation — are projected to reduce extreme poverty by 3–5 percentage points across South Asia by 2030. Climate-related displacement is an emerging inequality driver: ADB estimates 48 million people across Pacific and South Asian DMCs face forced relocation risk by 2040, disproportionately affecting low-income households. Sustained investment in human capital, health systems, and adaptive social protection is critical to inclusive growth targets under the Sustainable Development Goals.`,
    },
  ];

  private static readonly BRIEFING_MISSION: Record<string, Array<{ heading: string; body: string }>> = {
    'mcr': [
      { heading: 'Mission Purpose & Background', body: `This mission is a Project Review for the Metro Manila Urban Transport Project (Loan 4521-PHI, USD 420 million), approved 15 March 2022. The project aims to improve urban mobility for approximately 2.4 million daily commuters through integrated rail and bus rapid transit infrastructure across three corridors. The mission is scheduled for 15–19 October 2026. Project implementation is on track overall; however, three partially complied covenants and emerging procurement delays in the Depot Systems Package warrant direct discussion with the executing agency. The previous Project Review mission was conducted in April 2026.` },
      { heading: 'Mission Composition', body: `Mission Leader: Noah Tan, Transport Specialist, SERD/SETC\n\nMission Members:\n(1) Maria Santos, Senior Project Officer — procurement review and contract monitoring\n(2) James Lim, Social Development Specialist — safeguards and gender action plan\n(3) Angela Cruz, Financial Management Specialist — disbursement analysis and financial covenant review\n\nDestinations: Manila, Philippines\nMission dates: 15–19 October 2026 (5 working days)` },
      { heading: 'Terms of Reference', body: `The mission will: (i) review overall project implementation progress against the PAM and DMF; (ii) assess covenant compliance and agree remediation actions for partially complied covenants; (iii) review procurement and disbursement performance and identify causes of delay; (iv) assess safeguards compliance and gender action plan implementation; and (v) agree on a revised implementation schedule and next steps with the Department of Transportation.\n\nExpected outputs: Draft MOU / Aide-Mémoire agreed before mission ends; BTOR due 26 October 2026 (5 working days after return).` },
      { heading: 'Clearance & Government Concurrence', body: `This mission clearance request is submitted for approval by the Country Director, Philippines Country Office, with concurrence from the Transport and Communications Division Head, SERD. Borrower concurrence will be obtained by the Country Director in coordination with the Department of Transportation per standard project review procedures.\n\nAll mission members have confirmed availability and completed mandatory BSAFE security training (valid through March 2027). ADB laissez-passer holders — no visa required. Travel requests submitted separately under Administrative Order 4.01.` },
    ],
    'tor': [
      { heading: 'Mission Objectives', body: `The Project Review mission for the Metro Manila Urban Transport Project has four primary objectives: (i) assess overall project implementation progress against the PAM, DMF, and agreed implementation schedule; (ii) review covenant compliance and agree remediation actions for partially complied covenants; (iii) identify causes of procurement and disbursement delays and agree corrective measures; and (iv) assess compliance with environmental, social, and gender safeguards requirements.` },
      { heading: 'Scope of Work', body: `1. Implementation Progress: Review physical and financial progress against DMF targets. Assess construction status across three rail corridors and BRT alignments.\n\n2. Covenant Compliance: Review all 47 loan covenants with focus on: (a) Covenant 12 — delayed quarterly progress reports; (b) Covenant 18 — counterpart fund shortfall; (c) Covenant 31 — overdue North Corridor environmental monitoring report.\n\n3. Procurement & Disbursement: Review 9 active contracts (USD 246M). Assess Depot Systems Package delay. Analyse disbursement rate (37.7% vs. 42% projected).\n\n4. Safeguards & Gender: Assess EMP implementation, involuntary resettlement closure, and gender action plan progress.` },
      { heading: 'Mission Composition', body: `Mission Leader: Noah Tan, Transport Specialist, SERD/SETC — overall coordination, implementation assessment, MOU negotiation.\n\nMission Member 1: Maria Santos, Senior Project Officer — procurement, contract monitoring, contract administration issues.\n\nMission Member 2: James Lim, Social Development Specialist — environmental and social safeguards, gender action plan, community engagement.\n\nMission Member 3: Angela Cruz, Financial Management Specialist — financial management, disbursement analysis, financial covenant review, counterpart fund monitoring.` },
      { heading: 'Expected Outputs & Deliverables', body: `1. Draft MOU / Aide-Mémoire: Agreed with Department of Transportation before mission ends (19 October 2026). To include agreed actions, responsible parties, and implementation deadlines.\n\n2. Back-to-Office Report (BTOR): Submitted within 5 working days of return (due 26 October 2026). To cover mission composition, objectives, implementation status, covenant compliance, project rating, findings, issues, recommended actions, and next steps.\n\n3. Updated eOperations Records: Project record updated within 2 weeks of return, including disbursement status, covenant compliance, and project rating.` },
    ],
    'mission-schedule': [
      { heading: 'Mission Overview', body: `Project Review Mission — Metro Manila Urban Transport Project (Loan 4521-PHI)\nDestination: Manila, Philippines\nDates: 15–19 October 2026 (5 working days)\nMission Leader: Noah Tan, Transport Specialist, SERD/SETC\nHost Agency: Department of Transportation (DoT), Republic of the Philippines\n\nThe mission schedule covers opening meetings with DoT and key agencies, field visits to active construction sites, technical working meetings on procurement and financial management, and a wrap-up meeting to agree the draft aide-mémoire.` },
      { heading: 'Day-by-Day Programme', body: `Day 1 — Thursday, 15 October 2026\n09:00 Opening Meeting — Department of Transportation, Manila (Mission Leader + full team)\n14:00 Briefing with Project Management Office — Implementation Status Review\n16:00 Technical Meeting — Covenant Compliance (Cruz + Santos)\n\nDay 2 — Friday, 16 October 2026\n09:00 Field Visit — Civil Works Package A, North Corridor (MetroBuild Consortium site)\n14:00 Field Visit — Station Development Package, Central Stations\n\nDay 3 — Monday, 19 October 2026 (after weekend)\n09:00 Technical Meeting — Procurement and Contract Review (Santos + PMO)\n11:00 Technical Meeting — Financial Management and Disbursement (Cruz + DoT Finance)\n14:00 Technical Meeting — Safeguards and Gender Action Plan (Lim + DoT ESSD)\n16:00 Internal Mission Team Meeting — Draft Aide-Mémoire Preparation` },
      { heading: 'Key Meetings & Field Visits', body: `Confirmed Government Meetings:\n- Department of Transportation — Secretary and Undersecretary (15 Oct)\n- Project Management Office — Director and Deputy Director (15–18 Oct)\n- Department of Budget and Management — Counterpart Fund Release (17 Oct)\n- National Economic and Development Authority — DMF Review (17 Oct)\n\nField Visits:\n- North Corridor civil works and station construction (16 Oct AM)\n- Central corridor station development package sites (16 Oct PM)\n- Depot Systems Package installation facility, Valenzuela (18 Oct AM)\n\nWrap-up Meeting:\n- Department of Transportation — agreed aide-mémoire (19 Oct, 09:00–12:00)` },
      { heading: 'Logistics & Arrangements', body: `Accommodation: Marriott Manila, Pasay City (near DoT headquarters)\nGround Transport: Mission vehicle arranged by Philippines Country Office for all field visits\nInterpreter: Not required — all meetings conducted in English\n\nDocumentation to be provided to DoT in advance (by 10 October 2026):\n- Mission Clearance Request (MCR)\n- Terms of Reference for all mission members\n- List of information required for mission preparation\n- Draft agenda for opening meeting\n\nContacts:\n- Philippines Country Office Mission Coordinator: (to be confirmed)\n- DoT Project Management Office: admin-pmu@dot.gov.ph` },
    ],
    'position-paper': [
      { heading: 'Project Background & Current Status', body: `The Metro Manila Urban Transport Project (Loan 4521-PHI, USD 420 million) was approved 15 March 2022 and is due for completion 31 December 2028. As of Q3 2026, physical progress is estimated at 41% (planned: 45%) and financial progress at 37.7% disbursed (USD 158.4M of USD 420M). The project comprises three integrated transport corridors — North, Central, and South — serving approximately 2.4 million daily commuters in Metro Manila through rail infrastructure and bus rapid transit.\n\nThe project is rated On Track overall. However, the October 2026 Project Review will assess two emerging concerns: the Depot Systems Package six-week delay and a 4.3-percentage-point disbursement shortfall against the baseline projection.` },
      { heading: 'Key Issues & Risks', body: `1. Procurement Delay — Depot Systems Package (RailWorks PH, $16M): Equipment procurement delays have pushed installation 6 weeks behind schedule. The contractor's revised programme has not been formally submitted. Risk: Further delay could push civil works completion into Q1 2028, reducing buffer before the December 2028 loan closing date.\n\n2. Counterpart Fund Shortfall (Covenant 18): PHP 0.43 billion of the FY2026 allocation is pending DBM release. If not released by Q4 2026, civil works contractors may face payment delays. Risk: Medium — DBM release is expected but not confirmed.\n\n3. Overdue Environmental Monitoring Report — North Corridor (Covenant 31): Q2 2026 EMR is 3 months overdue. Risk: Low if submitted by end-October as confirmed, but persistent delay could trigger ADB safeguards escalation.\n\n4. Disbursement Rate (37.7% vs 42% projected): The 4.3% variance reflects both the Depot delay and counterpart fund shortfall. If not recovered in Q4 2026, disbursement risk for loan closing increases.` },
      { heading: 'Proposed Discussion Points', body: `The mission proposes to discuss the following issues with the Department of Transportation:\n\n1. Depot Systems Package: Request the contractor's revised implementation programme and agree recovery milestones. Consider whether liquidated damages provisions should be applied.\n\n2. Counterpart Fund: Confirm with DoT the expected DBM release date and contingency plan if PHP 0.43 billion is not released by November 2026.\n\n3. Environmental Monitoring Report: Review the draft Q2 2026 EMR for the North Corridor and agree a corrective monitoring plan.\n\n4. Quarterly Reporting (Covenant 12): Agree an improved internal DoT reporting process to ensure timely Q3 and Q4 2026 submissions.\n\n5. Revised Disbursement Projections: Agree a revised disbursement forecast for Q4 2026 and FY2027 that reflects the current implementation rate.` },
      { heading: 'Mission Objectives & Expected Decisions', body: `The October 2026 Project Review is expected to result in the following decisions and agreements:\n\n1. Agreed corrective measures for the Depot Systems Package delay, with a revised implementation programme and recovery milestones accepted by DoT and ADB.\n\n2. Confirmed counterpart fund release timeline from DBM, with a contingency plan agreed if release is delayed beyond November 2026.\n\n3. North Corridor Environmental Monitoring Report submission confirmed for end-October 2026, with agreed corrective monitoring plan.\n\n4. Revised disbursement forecast for Q4 2026 and FY2027 agreed, with the project rating confirmed as On Track or adjusted to Potential Problem if corrective measures are not accepted.\n\n5. Updated project rating, DMF progress, and time-bound action plan captured in the signed aide-mémoire.` },
    ],
    'cpfr-background': [
      { heading: 'Portfolio Overview', body: `This Country Portfolio Review Background Paper covers ADB's active lending portfolio in the Philippines as of October 2026. The active portfolio comprises 18 loans totalling USD 3.2 billion across transport, energy, water, social protection, and agriculture sectors. Portfolio disbursement rate stands at 62.4% (USD 2.0 billion disbursed), broadly on track against the national programme. Three projects are rated Potential Problem; no projects are rated Actual Problem. This paper is prepared for discussion with the Government at the country portfolio review mission scheduled for 22–26 October 2026.` },
      { heading: 'Sector Outcomes & Project Outputs', body: `Transport (4 projects, USD 1.2B): Physical progress on the Metro Manila Urban Transport Project (41%) is the primary concern. The Southeast Luzon Highway Project (Loan 4302-PHI) is on track at 68% disbursed. Infrastructure quality improvements on ADB-financed corridors have reduced travel times by an average of 22% in project areas.\n\nEnergy (3 projects, USD 640M): The Renewable Energy Integration Project is ahead of schedule with 850MW of solar and wind capacity connected to the grid. The Mindanao Grid Stabilisation Project faces land acquisition delays — rated Potential Problem.\n\nWater & Urban (4 projects, USD 580M): All four projects are rated On Track. The Metro Manila Flood Management Project has protected an estimated 1.2 million people from flooding events in 2025–2026.\n\nSocial Protection (3 projects, USD 480M): The Sustainable Social Protection Programme is on track; beneficiary targeting data quality remains an issue flagged by the independent evaluation.` },
      { heading: 'Portfolio Performance Issues', body: `Issue 1 — Procurement Delays: Across the transport portfolio, procurement delays have affected 6 of 18 contracts reviewed. Common causes: late submission of bid evaluation reports; frequent appeals of procurement decisions; capacity constraints in executing agency procurement units. Recommended action: Engage PPFD to provide targeted procurement capacity development for DoT and DPWH.\n\nIssue 2 — Counterpart Fund Releases: Three projects report partial counterpart fund releases from DBM totalling PHP 1.8 billion. This is the largest single contributor to disbursement underperformance across the portfolio.\n\nIssue 3 — Safeguards — Involuntary Resettlement: Two projects have unresolved resettlement grievances. The National Irrigation Administration project has 38 households whose compensation rates are under dispute. The issue has been escalated to the ADB Accountability Mechanism.` },
      { heading: 'Draft Action Plan', body: `Action 1: DoT to submit Depot Systems Package revised programme by 30 October 2026. Responsible: DoT PMO / RailWorks PH.\n\nAction 2: DoF / DBM to confirm PHP 0.43 billion counterpart fund release for the Metro Manila Urban Transport Project by 30 November 2026. Responsible: DoT / DoF.\n\nAction 3: NIA to resolve 38 outstanding resettlement grievances through the established grievance redress mechanism by 31 December 2026. Responsible: NIA Resettlement Unit.\n\nAction 4: DPWH to strengthen procurement capacity through PPFD advisory support — dedicated training programme to be delivered Q1 2027. Responsible: ADB PPFD / DPWH.\n\nAction 5: Country Office to convene quarterly portfolio performance review with DoF and NEDA beginning January 2027 to track action plan implementation. Responsible: ADB Philippines Country Office.` },
    ],
    'briefing-presentation': [
      { heading: 'Mission Overview & Objectives', body: `METRO MANILA URBAN TRANSPORT PROJECT\nProject Review Mission — 15–19 October 2026\nLoan 4521-PHI | USD 420 million | Due: 31 December 2028\n\nSlide 1: Mission overview\n- Mission type: Project Review\n- Objective: Assess implementation progress, covenant compliance, procurement/disbursement status, and safeguards\n- Key question: Is the project on track to meet the December 2028 closing date, and what corrective actions are needed?\n\nSlide 2: Project at a glance\n- Physical progress: 41% (planned 45%)\n- Disbursement: 37.7% (USD 158.4M of USD 420M)\n- Covenant compliance: 44/47 complied, 3 partially complied\n- Overall rating: On Track (to be confirmed at this mission)` },
      { heading: 'Project Status Summary', body: `Slide 3: Implementation highlights\n✓ Civil Works Package A (MetroBuild, $72M): 58% complete — North corridor on schedule\n✓ Rail Systems Integration (TransitTech Asia, $51M): On track\n✓ Involuntary resettlement: 847 households resettled and compensated — complete\n⚠ Depot Systems Package (RailWorks PH, $16M): 6 weeks behind schedule\n⚠ Disbursement rate: 37.7% vs 42% projected — 4.3pp gap\n\nSlide 4: Covenant compliance\nComplied: 44 covenants\nPartially complied (3):\n— Covenant 12: Quarterly reports submitted 3–4 weeks late\n— Covenant 18: PHP 0.43B counterpart fund pending DBM release\n— Covenant 31: North Corridor EMR overdue (Q2 2026)` },
      { heading: 'Key Issues & Decisions Required', body: `Slide 5: Three issues requiring Government decision\n\n1. Depot Systems Package delay\nIssue: RailWorks PH is 6 weeks behind on depot equipment installation\nDecision needed: Approve contractor's revised programme and recovery milestones; confirm whether LD provisions apply\n\n2. Counterpart fund release\nIssue: PHP 0.43B of FY2026 allocation is pending DBM release\nDecision needed: Confirm release timeline and contingency plan\n\n3. Disbursement shortfall\nIssue: Cumulative disbursement 4.3pp below baseline projection\nDecision needed: Agree revised Q4 2026 and FY2027 disbursement forecast with DoT and ADB` },
      { heading: 'Proposed Next Steps', body: `Slide 6: Agreed actions and timeline\n\n| Action | Responsible | Deadline |\n|---|---|---|\n| Submit depot revised programme | RailWorks PH / DoT PMO | 30 Oct 2026 |\n| DBM counterpart fund release | DoT / DoF / DBM | 30 Nov 2026 |\n| North Corridor EMR submission | DoT Environmental Unit | 31 Oct 2026 |\n| Q3 2026 quarterly progress report | DoT PMO | 15 Nov 2026 |\n| Revised disbursement forecast | DoT / ADB | 15 Nov 2026 |\n\nSlide 7: Mission outputs\n- Aide-mémoire: Agreed and signed 19 October 2026\n- BTOR: Submitted by mission leader 26 October 2026\n- Next mission: Tentative midterm review Q2 2027` },
    ],
    'aide-memoire': [
      { heading: 'Meetings Held & Key Officials Met', body: `The mission met with the following officials during 15–19 October 2026:\n\nDepartment of Transportation: Secretary Rodrigo Manalo; Undersecretary for Infrastructure, Maria Reyes; Director, Project Management Office, Carlos Delos Santos; Deputy Director, ESSD, Ana Viernes.\n\nDepartment of Budget and Management: Director, Public Investment Staff, Lorenzo Cruz — discussed counterpart fund release timeline.\n\nDepartment of Finance: Assistant Secretary, External Finance, Elena Ramos — discussed loan disbursement procedures and Q4 commitments.\n\nNational Economic and Development Authority: Senior Development Management Officer, Sustainability Division, Jerome Santos — reviewed DMF progress.\n\nContractors: MetroBuild Consortium Project Director (field visit, 16 Oct); RailWorks PH Site Manager, depot facility (field visit, 18 Oct).` },
      { heading: 'Key Findings', body: `Implementation Status: Physical progress at 41% is within acceptable variance of the planned 45%. The North Corridor civil works and rail systems integration are proceeding on schedule. The Depot Systems Package delay (6 weeks) is the main implementation risk; the contractor confirmed a revised programme will be submitted by 30 October 2026.\n\nCovenant Compliance: DoT committed to implementing an improved internal reporting process to ensure Q3 2026 quarterly progress report is submitted by 15 November 2026. DBM confirmed the PHP 0.43 billion counterpart fund release is scheduled for November 2026. DoT ESSD confirmed the North Corridor Environmental Monitoring Report will be submitted by 31 October 2026.\n\nDisbursement: The mission agreed a revised disbursement forecast with DoT projecting 43.5% cumulative disbursement by end-FY2026 and 58.0% by end-FY2027, contingent on counterpart fund release and Depot Systems Package recovery.` },
      { heading: 'Agreed Actions & Commitments', body: `The following actions were agreed between ADB and the Department of Transportation:\n\n1. Depot Systems Package: RailWorks PH to submit revised implementation programme and recovery milestones to DoT PMO by 30 October 2026. DoT to forward to ADB for review by 5 November 2026. DoT to assess whether liquidated damages provisions apply.\n\n2. Counterpart Fund: DoT to confirm DBM release of PHP 0.43 billion by 30 November 2026. DoT to advise ADB immediately if release is delayed, with contingency plan.\n\n3. Environmental Monitoring Report: DoT ESSD to submit Q2 2026 North Corridor EMR to ADB by 31 October 2026. Corrective Environmental Monitoring Plan to be prepared by 30 November 2026.\n\n4. Quarterly Reporting: DoT PMO to submit Q3 2026 Quarterly Progress Report by 15 November 2026. DoT to implement internal process improvements to ensure future reports are submitted on time.` },
      { heading: 'Next Steps', body: `The mission agrees the following next steps:\n\n1. Mission Leader: Submit BTOR to ADB by 26 October 2026 (5 working days after return). Update project records in eOperations by 2 November 2026.\n\n2. ADB (Philippines Country Office): Monitor submission of contractor's revised programme and North Corridor EMR in November 2026. Conduct quarterly portfolio review call with DoT in January 2027.\n\n3. Next Mission: A Project Review mission is tentatively planned for Q2 2027. The mission leader will confirm the schedule after reviewing Q4 2026 implementation progress and the results of the agreed corrective actions.\n\n4. Midterm Review: Subject to implementation progress, a Midterm Review mission may be scheduled for Q3 2027. The mission leader will advise on the need for a position paper submission to the Sector Director six weeks in advance of the proposed midterm review date.` },
    ],
    'mou': [
      { heading: 'Agreed Conclusions', body: `This Memorandum of Understanding is entered into by the Asian Development Bank (ADB) and the Department of Transportation (DoT), Republic of the Philippines, following the Project Review Mission for the Metro Manila Urban Transport Project (Loan 4521-PHI) conducted 15–19 October 2026.\n\nADB and DoT agree that the project is rated On Track. Physical progress at 41% is within acceptable variance; however, the Depot Systems Package delay and disbursement shortfall require corrective action. The parties agree to the remedial measures set out in this MOU, which supersede all prior understandings on matters covered herein. This MOU shall be read together with the Aide-Mémoire dated 19 October 2026.` },
      { heading: 'Implementation Commitments', body: `DoT commits to the following:\n\n1. Submit revised Depot Systems Package implementation programme to ADB by 5 November 2026, with recovery milestones and RailWorks PH confirmation of revised completion date.\n\n2. Confirm DBM release of PHP 0.43 billion (FY2026 counterpart fund) by 30 November 2026. Advise ADB within 5 working days if release is not received by this date.\n\n3. Submit the Q2 2026 North Corridor Environmental Monitoring Report to ADB by 31 October 2026 and prepare a Corrective Environmental Monitoring Plan by 30 November 2026.\n\n4. Submit Q3 2026 Quarterly Progress Report to ADB by 15 November 2026 and implement internal process improvements to ensure timely future submissions.\n\n5. Agree revised disbursement forecast (43.5% by end-FY2026; 58.0% by end-FY2027) with ADB by 15 November 2026.` },
      { heading: 'Remedial Measures & Deadlines', body: `The following remedial measures are agreed with binding deadlines:\n\n| Action | Responsible Party | Deadline | Status |\n|---|---|---|---|\n| Depot Systems Package revised programme | RailWorks PH / DoT PMO | 5 Nov 2026 | Pending |\n| DBM counterpart fund release confirmation | DoT / DoF / DBM | 30 Nov 2026 | Pending |\n| North Corridor Q2 2026 EMR submission | DoT ESSD | 31 Oct 2026 | Pending |\n| Corrective Environmental Monitoring Plan | DoT ESSD | 30 Nov 2026 | Pending |\n| Q3 2026 Quarterly Progress Report | DoT PMO | 15 Nov 2026 | Pending |\n| Revised disbursement forecast | DoT / ADB | 15 Nov 2026 | Pending |\n\nFailure to meet these deadlines will result in escalation of the relevant covenant rating and may result in a change in the overall project rating.` },
      { heading: 'Signatures', body: `This Memorandum of Understanding is signed on behalf of:\n\nAsian Development Bank\n\n___________________________\nNoah Tan\nMission Leader, Transport Specialist\nSouth East Asia Department\nDate: 19 October 2026\n\nDepartment of Transportation\nRepublic of the Philippines\n\n___________________________\nCarlos Delos Santos\nDirector, Project Management Office\nDepartment of Transportation\nDate: 19 October 2026\n\nCopies to: ADB Philippines Country Director; DoT Secretary; DoF Undersecretary for Fiscal Policy; ADB Transport Division Head, SERD.` },
    ],
    'btor': [
      { heading: 'Mission Composition, Duration & Objectives', body: `Mission: Project Review\nProject: Metro Manila Urban Transport Project (Loan 4521-PHI, USD 420M)\nBorrower: Republic of the Philippines\nExecuting Agency: Department of Transportation (DoT)\nDates: 15–19 October 2026 (5 working days)\nDestination: Manila, Philippines\n\nMission Team:\n— Noah Tan, Mission Leader, Transport Specialist, SERD/SETC\n— Maria Santos, Senior Project Officer, SERD/SETC\n— James Lim, Social Development Specialist, SERD/SEGS\n— Angela Cruz, Financial Management Specialist, CTL/FMIA\n\nObjectives: Assess implementation progress; review covenant compliance; review procurement and disbursement performance; assess safeguards and gender action plan compliance.` },
      { heading: 'Project Implementation Status', body: `Overall Rating: On Track\n\nPhysical Progress: 41% (planned 45%). Civil Works Package A (MetroBuild, $72M) is 58% complete on the North Corridor. Rail Systems Integration (TransitTech Asia, $51M) is proceeding on schedule. The Depot Systems Package (RailWorks PH, $16M) is 6 weeks behind schedule due to equipment procurement delays — revised programme due 5 November 2026.\n\nDisbursement: USD 158.4M disbursed (37.7% of USD 420M loan) against a projected 42.0%. The 4.3-percentage-point gap reflects the Depot Systems Package delay and a PHP 0.43B counterpart fund shortfall. Revised disbursement forecast agreed: 43.5% by end-FY2026; 58.0% by end-FY2027.\n\nCovenant Compliance: 44 of 47 covenants complied; 3 partially complied (Covenants 12, 18, 31). Remediation actions agreed for all three — see time-bound action plan.` },
      { heading: 'Key Findings & Issues', body: `Finding 1 — Depot Systems Package Delay: The 6-week delay in RailWorks PH's installation programme is the primary implementation risk. The contractor cited customs clearance delays for imported rail equipment. The mission agreed that DoT will assess applicability of liquidated damages provisions. The revised programme will be the key indicator to watch in Q4 2026.\n\nFinding 2 — Counterpart Fund: DBM's PHP 0.43B release is expected in November 2026. DoF confirmed that the release is in the supplemental budget queue. No immediate impact on civil works contractors, who are paid from the ADB loan proceeds. Monitor in next progress report.\n\nFinding 3 — Environmental Monitoring: The North Corridor Q2 2026 EMR submission was confirmed for 31 October 2026. The mission reviewed preliminary data — no significant adverse findings. The North Corridor is the most environmentally sensitive due to proximity to wetland areas near Valenzuela; continued monitoring is important.\n\nFinding 4 — Gender Action Plan: Women's employment in construction at 34% exceeds the 30% target. The gap is gender-disaggregated ridership data — DoT ESSD committed to implementing a data collection protocol by Q1 2027.` },
      { heading: 'Recommended Actions & Next Steps', body: `Issues Requiring Guidance: None. All key issues were resolved at mission level with agreed corrective actions.\n\nRecommended Actions (see Time-bound Action Plan for full details):\n1. DoT to submit depot revised programme to ADB by 5 November 2026.\n2. DBM counterpart fund release to be confirmed by 30 November 2026.\n3. North Corridor EMR to be submitted by 31 October 2026.\n4. Q3 2026 QPR to be submitted by 15 November 2026.\n5. Revised disbursement forecast to be formally agreed by 15 November 2026.\n\nProject Rating: On Track — maintained.\n\nNext Steps:\n— Mission leader to update eOperations records by 2 November 2026.\n— Philippines Country Office to monitor action plan implementation.\n— Next mission: Project Review tentatively planned Q2 2027. Midterm Review may be warranted in Q3 2027 subject to implementation progress assessment.` },
    ],
    'action-plan': [
      { heading: 'Covenant Remediation Actions', body: `| # | Covenant | Issue | Action | Responsible | Deadline | Status |\n|---|---|---|---|---|---|---|\n| 12 | Quarterly Progress Reports | Q1 and Q2 2026 reports submitted 3–4 weeks late | DoT to submit Q3 2026 QPR by 15 Nov 2026 and implement internal process improvements | DoT PMO | 15 Nov 2026 | Pending |\n| 18 | Government Counterpart Fund | PHP 0.43B FY2026 allocation pending DBM release | DoT to confirm DBM release by 30 Nov 2026; advise ADB within 5 working days if delayed | DoT / DoF / DBM | 30 Nov 2026 | Pending |\n| 31 | Environmental Monitoring Report — North Corridor | Q2 2026 EMR overdue (3 months) | DoT ESSD to submit Q2 2026 EMR by 31 Oct 2026 and Corrective EMP by 30 Nov 2026 | DoT ESSD | 31 Oct 2026 | Pending |` },
      { heading: 'Procurement & Disbursement Actions', body: `| # | Issue | Action | Responsible | Deadline | Status |\n|---|---|---|---|---|---|\n| P-01 | Depot Systems Package delay (6 weeks) | RailWorks PH to submit revised implementation programme and recovery milestones to DoT PMO; DoT to forward to ADB | RailWorks PH / DoT PMO | 5 Nov 2026 | Pending |\n| P-02 | Liquidated damages assessment | DoT PMO to assess applicability of LD provisions under contract with RailWorks PH and advise ADB of determination | DoT PMO / Legal | 15 Nov 2026 | Pending |\n| D-01 | Disbursement shortfall (37.7% vs 42% projected) | DoT and ADB to agree revised disbursement forecast (43.5% end-FY2026; 58.0% end-FY2027) | DoT PMO / ADB | 15 Nov 2026 | Pending |` },
      { heading: 'Safeguards & Gender Actions', body: `| # | Issue | Action | Responsible | Deadline | Status |\n|---|---|---|---|---|---|\n| S-01 | North Corridor Q2 2026 EMR overdue | Submit Q2 2026 EMR to ADB (see Covenant 31) | DoT ESSD | 31 Oct 2026 | Pending |\n| S-02 | Corrective Environmental Monitoring Plan required | Prepare and submit CEMP to ADB addressing North Corridor wetland monitoring gaps | DoT ESSD | 30 Nov 2026 | Pending |\n| G-01 | Gender-disaggregated ridership data not collected | DoT ESSD to develop and implement a gender-disaggregated public transport ridership data collection protocol | DoT ESSD / Transport Planning | 31 Mar 2027 | Pending |` },
      { heading: 'Reporting & Follow-up Actions', body: `| # | Action | Responsible | Deadline | Status |\n|---|---|---|---|---|\n| R-01 | Mission Leader BTOR submission | Noah Tan to submit BTOR to ADB management | Mission Leader | 26 Oct 2026 | Pending |\n| R-02 | eOperations project record update | Mission Leader to update disbursement, covenant, and rating data in eOperations | Mission Leader | 2 Nov 2026 | Pending |\n| R-03 | Quarterly Portfolio Review (Country Office) | ADB Philippines Country Office to initiate quarterly portfolio performance call with DoF and NEDA | ADB PH Country Office | Jan 2027 | Pending |\n| R-04 | Next mission planning | Mission Leader to confirm Q2 2027 Project Review schedule | Mission Leader / SERD | Mar 2027 | Pending |` },
    ],
    'pam': [
      { heading: 'Procurement Arrangements', body: `Procurement for the Metro Manila Urban Transport Project follows ADB's Procurement Policy (2017) and associated regulations. Civil works contracts are procured through open competitive bidding (OCB) using the FIDIC Conditions of Contract. Consulting services are procured through quality-cost-based selection (QCBS). Goods and equipment through request for quotation (RFQ) for packages below ADB threshold.\n\nProcurement Thresholds:\n- Civil Works (OCB): All contracts above USD 15 million\n- Goods and Equipment (OCB): All contracts above USD 2 million\n- Consulting Services (QCBS): All contracts above USD 100,000\n\nProcurement Committee: The DoT Project Management Office Procurement Committee has authority to approve awards. Awards above PHP 500 million require NEDA Investment Coordination Committee endorsement. Advance contracting has been approved for two packages.` },
      { heading: 'Disbursement Procedures', body: `Disbursements under Loan 4521-PHI follow ADB's Loan Disbursement Handbook (2017 edition, as amended). The project uses the imprest account procedure for civil works and the reimbursement procedure for counterpart-funded activities.\n\nImprest Account:\n- Ceiling: USD 10 million (set at loan effectiveness)\n- Held at: Bangko Sentral ng Pilipinas (BSP), Manila\n- Authorized signatories: DoT Undersecretary for Finance and DoT PMO Director\n\nWithdrawal Applications: Submitted monthly or when imprest account balance falls below 50% of ceiling. Supporting documentation: civil works progress certificates, contract invoices, inspection reports.\n\nStatement of Expenditures (SOE): Used for reimbursements below USD 100,000 per transaction. SOE records maintained by DoT PMO and subject to annual audit.` },
      { heading: 'Financial Management & Reporting', body: `Executing Agency Financial Management: DoT maintains a project-specific accounting system using the Government Integrated Financial Management Information System (GIFMIS). All ADB loan expenditures are recorded separately from government budget funds.\n\nAudit: The Commission on Audit (COA) is the statutory auditor. Annual project financial statements are due within 6 months of year-end (30 June each year). Audit reports to be submitted to ADB within 1 month of issuance (by 31 July each year).\n\nReporting: DoT PMO submits quarterly progress reports to ADB (due 45 days after quarter-end) covering physical progress, financial progress, procurement status, covenant compliance, and any emerging issues.\n\nFinancial Risk: The DoT financial management assessment at appraisal rated the risk as Moderate. Key mitigation: dedicated PMO finance staff, ring-fenced project bank account, and annual COA audit.` },
      { heading: 'Implementation Schedule', body: `Key Milestones:\n\n| Milestone | Planned Date | Actual / Revised Date | Status |\n|---|---|---|---|\n| Loan effectiveness | 15 Jun 2022 | 15 Jun 2022 | Complete |\n| Imprest account opening | 1 Jul 2022 | 1 Jul 2022 | Complete |\n| Civil Works Package A award | Dec 2022 | Mar 2024 | Delayed (15 months) |\n| Rail Systems Integration award | Mar 2023 | Jul 2024 | Delayed (16 months) |\n| Depot Systems Package award | Dec 2023 | Feb 2025 | Delayed (14 months) |\n| North Corridor civil works completion | Jun 2027 | Jun 2027 | On track |\n| Full project completion | Dec 2028 | Dec 2028 | On track |\n| Loan closing | Mar 2029 | Mar 2029 | On track |\n\nNote: Early procurement delays (2022–2024) were largely recovered through revised programming. Depot Systems Package delay is the current priority risk to the completion schedule.` },
    ],
    'cover-letter': [
      { heading: 'Letter Content', body: `[ADB Letterhead]\n\nDate: 10 October 2026\n\nThe Honourable Rodrigo Manalo\nSecretary\nDepartment of Transportation\nColumbia Tower, Brgy. Wack-Wack\nMandaluyong City, Metro Manila\nPhilippines\n\nDear Secretary Manalo,\n\nRe: Project Review Mission — Metro Manila Urban Transport Project (Loan 4521-PHI)\n\nI write on behalf of the Asian Development Bank to advise that ADB will conduct a Project Review Mission for the Metro Manila Urban Transport Project from 15 to 19 October 2026.\n\nThe mission will be led by Mr. Noah Tan, Transport Specialist, and will include three mission members covering project administration, social safeguards, and financial management. The attached Terms of Reference set out the mission objectives, scope, and composition in full.\n\nWe would be grateful for the Department's confirmation of the proposed schedule and mission programme. I also enclose a list of information required from the Department's Project Management Office in advance of the mission.` },
      { heading: 'Meeting Request & Proposed Agenda', body: `We request the following meetings during the mission period:\n\n1. Opening Meeting — 15 October 2026, 09:00\nParticipants: DoT Secretary / Undersecretary; DoT PMO Director and Deputy Director; Mission team\nAgenda: Mission objectives and programme; project implementation update; key issues for discussion\n\n2. Technical Working Meeting — Procurement & Contracts — 16 October 2026, AM\nParticipants: DoT PMO procurement team; Maria Santos, ADB\nAgenda: Contract status, Depot Systems Package delay, procurement pipeline\n\n3. Technical Working Meeting — Financial Management — 17 October 2026, AM\nParticipants: DoT PMO finance team; Angela Cruz, ADB\nAgenda: Disbursement status, counterpart fund, financial covenants\n\n4. Technical Working Meeting — Safeguards & Gender — 17 October 2026, PM\nParticipants: DoT ESSD; James Lim, ADB\nAgenda: Environmental monitoring, involuntary resettlement closure, gender action plan\n\n5. Wrap-up Meeting — 19 October 2026, 09:00\nParticipants: DoT leadership; full mission team\nAgenda: Draft aide-mémoire review and agreement` },
      { heading: 'Information Required & Next Steps', body: `We request the Department's Project Management Office to provide the following documents by 10 October 2026 to facilitate mission preparation:\n\n1. Latest Quarterly Progress Report (Q2 2026, or Q3 2026 if available)\n2. Updated Project Implementation Schedule (as of September 2026)\n3. Updated Disbursement Projection (FY2026 and FY2027)\n4. Covenant Compliance Monitoring Report (as of Q3 2026)\n5. Procurement Status Report — all active contracts\n6. Draft Q2 2026 Environmental Monitoring Report, North Corridor\n7. Gender Action Plan Progress Report (as of September 2026)\n8. Counterpart Fund Release Status — FY2026 DBM allocation\n\nPlease direct all documents and correspondence related to this mission to: noah.tan@adb.org (Mission Leader) with copy to the Philippines Country Office.\n\nWe look forward to a productive mission and to working with your team to resolve the implementation issues identified above.\n\nYours sincerely,\n\n[Country Director]\nPhilippines Country Office\nAsian Development Bank` },
    ],
    'stakeholder-list': [
      { heading: 'ADB Mission Team', body: `| Name | Title | Division | Role | Email |\n|---|---|---|---|---|\n| Noah Tan | Transport Specialist | SERD/SETC | Mission Leader | n.tan@adb.org |\n| Maria Santos | Senior Project Officer | SERD/SETC | Procurement & Contracts | m.santos@adb.org |\n| James Lim | Social Development Specialist | SERD/SEGS | Safeguards & Gender | j.lim@adb.org |\n| Angela Cruz | Financial Management Specialist | CTL/FMIA | Financial Management | a.cruz@adb.org |\n| Roberto Reyes | Senior Counsel | OGC | Legal (available remotely) | r.reyes@adb.org |\n\nPhilippines Country Office Support:\n| Name | Title | Role |\n|---|---|---|\n| Lisa Garcia | Senior Project Officer | Country Office coordination, logistics |\n| Mark Santos | Procurement Analyst | Local procurement support |` },
      { heading: 'Government & Executing Agency Officials', body: `Department of Transportation (DoT):\n| Name | Title | Role in Mission |\n|---|---|---|\n| Rodrigo Manalo | Secretary | Opening and wrap-up meetings |\n| Maria Reyes | Undersecretary for Infrastructure | Technical lead, opening meeting |\n| Carlos Delos Santos | Director, PMO | Day-to-day mission counterpart |\n| Ana Viernes | Deputy Director, ESSD | Safeguards and environment |\n| Fernando Lacson | Chief Accountant, PMO | Financial management meetings |\n\nOther Government Agencies:\n| Agency | Name | Title | Meeting |\n|---|---|---|---|\n| DBM | Lorenzo Cruz | Director, Public Investment Staff | Counterpart fund meeting (17 Oct) |\n| DoF | Elena Ramos | Asst. Secretary, External Finance | Disbursement meeting (17 Oct) |\n| NEDA | Jerome Santos | Sr. Development Management Officer | DMF review (17 Oct) |` },
      { heading: 'Contractors & Consultants', body: `Active Contractors:\n| Contractor | Contract | Contact | Value |\n|---|---|---|---|\n| MetroBuild Consortium | Civil Works Package A (North Corridor) | Project Director: Antonio Cruz | $72M |\n| TransitTech Asia | Rail Systems Integration | Country Manager: David Lim | $51M |\n| Pacific Infrastructure Ltd | Station Development Package | Project Manager: Sarah Wong | $38M |\n| SignalCore | Signalling Systems | Site Engineer: Michael Tan | $29M |\n| RailWorks PH | Depot Systems Package | Site Manager: John Pascual | $16M |\n\nProject Management Consultants:\n| Firm | Name | Role |\n|---|---|---|\n| InfraConsult Asia | Roberto Diaz | PMC Team Leader |\n| InfraConsult Asia | Alicia Fernandez | Deputy Team Leader (Procurement) |` },
      { heading: 'Development Partners & Other Stakeholders', body: `Development Partners with parallel financing or co-interest in the project:\n| Organization | Name | Title | Interest |\n|---|---|---|---|\n| World Bank | Jennifer Wu | Sr. Transport Specialist | MMURP Phase 2 scoping |\n| JICA | Kenji Yamamoto | Transport Advisor | JICA parallel grant (station accessibility) |\n| EU Delegation | Marco Rossi | Infrastructure Attaché | Sustainable transport policy dialogue |\n\nCivil Society & Community:\n| Organization | Contact | Role |\n|---|---|---|\n| Metro Manila Development Authority | Director, Transport Planning | Coordination on traffic management |\n| Alagang Pasahero (Commuter Rights NGO) | Executive Director | GRM feedback and commuter experience |\n| Affected Communities Council | Chairperson | Resettlement monitoring (closed)\n\nMedia: Mission is not subject to public communications. All media enquiries to be directed to the ADB Philippines Country Office Communications Officer.` },
    ],
    'country-briefing': [
      { heading: 'Country Overview — Philippines', body: `The Philippines is a lower-middle-income economy (GDP: USD 404 billion, 2025) with a sovereign credit rating of BB/Stable (S&P) and Baa2/Stable (Moody's). GDP growth reached 6.1% in 2025, supported by robust private consumption, strong remittance inflows (USD 38 billion), and continued BPO services expansion. Inflation moderated to 3.2% in Q3 2026 (within the 2–4% target band). The peso trades at approximately PHP 56–57/USD following BSP rate cuts in H1 2026 aligning with regional central bank easing cycles.\n\nFiscal position: The national government deficit narrowed to 5.1% of GDP in 2025 (target: 5.6%), with debt-to-GDP at 60.1% — elevated but manageable. The Marcos administration's infrastructure priority programme (Build Better More) is the primary fiscal driver, targeting 5–6% of GDP in infrastructure spending through 2028.` },
      { heading: 'ADB Country Strategy & Portfolio', body: `ADB Country Partnership Strategy 2024–2029: Priorities include inclusive growth, climate-resilient infrastructure, human capital development, and regional connectivity. The strategy targets USD 3.2 billion in sovereign lending over the 5-year period, with co-financing from JICA, World Bank, and bilateral partners.\n\nActive sovereign portfolio: 18 loans totalling USD 3.2 billion across transport, energy, water, social protection, and agriculture. Portfolio disbursement rate: 62.4% (USD 2.0 billion disbursed). Three projects rated Potential Problem; no Actual Problem projects.\n\nKey sovereign operations in transport:\n- Metro Manila Urban Transport Project (Loan 4521-PHI, $420M) — On Track, 37.7% disbursed\n- Southeast Luzon Highway Project (Loan 4302-PHI, $280M) — On Track, 68% disbursed\n- Mindanao Road Connectivity (Loan 4198-PHI, $190M) — Potential Problem (land acquisition delay)` },
      { heading: 'Key Economic Indicators', body: `| Indicator | 2023 | 2024 | 2025 | 2026F |\n|---|---|---|---|---|\n| GDP growth (%) | 5.5 | 5.7 | 6.1 | 6.0 |\n| Inflation (%) | 6.0 | 3.3 | 3.2 | 3.0 |\n| Fiscal deficit (% GDP) | 6.1 | 5.5 | 5.1 | 5.0 |\n| Debt-to-GDP (%) | 60.9 | 60.5 | 60.1 | 59.8 |\n| Current account (% GDP) | -2.1 | -1.8 | -1.5 | -1.4 |\n| Remittances (USD bn) | 35.7 | 37.2 | 38.0 | 39.0 |\n| Foreign reserves (months) | 7.2 | 7.5 | 7.8 | 8.0 |\n| Policy rate (BSP, %) | 6.50 | 6.00 | 5.50 | 5.25 |\n\nSources: BSP, DBM, PSA, IMF WEO, ADB Asian Development Outlook 2026.` },
      { heading: 'Mission Context & Key Issues', body: `The October 2026 Project Review mission for the Metro Manila Urban Transport Project (Loan 4521-PHI) occurs against a stable macroeconomic backdrop. The key country-level considerations for the mission are:\n\n1. DBM Counterpart Funds: The national budget climate is broadly supportive. The PHP 0.43 billion counterpart fund shortfall is a sequencing issue rather than a fiscal constraint — DBM has confirmed the supplemental budget allocation and release is expected November 2026.\n\n2. Procurement Environment: The Philippines Government Procurement Reform Act (RA 9184) environment remains challenging — frequent bid protests and legal challenges from losing bidders continue to cause procurement delays across infrastructure projects sector-wide, not specific to ADB-financed operations.\n\n3. Political Context: The Marcos administration continues to prioritise infrastructure spending. No election-related policy disruption is expected before the 2028 elections. The Department of Transportation maintains strong institutional continuity.\n\n4. Climate & Disaster Risk: Metro Manila flood risk and typhoon exposure remain relevant to project site operations. No active weather system is forecast for the mission period (15–19 October 2026).` },
    ],
    'technical-attachments': [
      { heading: 'Procurement & Contract Data', body: `Contract Status Summary — as of October 2026\n\n| Contract | Contractor | Value | Awarded | % Complete | Status | Issue |\n|---|---|---|---|---|---|---|\n| Civil Works Package A | MetroBuild Consortium | $72M | Mar 2024 | 58% | Active | On track |\n| Rail Systems Integration | TransitTech Asia | $51M | Jul 2024 | 44% | Active | On track |\n| Station Development Package | Pacific Infrastructure | $38M | Sep 2024 | 31% | Awarded | On track |\n| Signalling Systems | SignalCore | $29M | Nov 2024 | 22% | Active | On track |\n| Engineering Consultancy | UrbanWorks Advisory | $18M | Jan 2024 | 100% | Complete | — |\n| Depot Systems Package | RailWorks PH | $16M | Feb 2025 | 18% | Active | 6-week delay |\n| Accessibility Upgrades | Inclusive Transit Group | $11M | Apr 2025 | 14% | Active | On track |\n| Systems Testing | Mobility QA Partners | $6M | May 2025 | 8% | Active | On track |\n| Programme Management | InfraConsult Asia | $5M | Jun 2025 | 30% | Active | On track |` },
      { heading: 'Disbursement & Financial Management Data', body: `Disbursement Summary — Loan 4521-PHI as of 30 September 2026\n\n| Category | Allocated (USD) | Disbursed (USD) | % Disbursed |\n|---|---|---|---|\n| Civil Works | 285,000,000 | 106,200,000 | 37.3% |\n| Equipment & Materials | 62,000,000 | 18,600,000 | 30.0% |\n| Consulting Services | 38,000,000 | 20,900,000 | 55.0% |\n| Training & Capacity Building | 8,000,000 | 4,800,000 | 60.0% |\n| Project Management | 12,000,000 | 5,400,000 | 45.0% |\n| Contingency | 15,000,000 | 2,500,000 | 16.7% |\n| **Total** | **420,000,000** | **158,400,000** | **37.7%** |\n\nImprest Account Balance: USD 4.2 million (Bangko Sentral ng Pilipinas)\nLatest Withdrawal Application: WA-23, September 2026, USD 6.8 million\nProjected Q4 2026 Disbursement: USD 24.0 million (revised forecast)` },
      { heading: 'Safeguards Compliance Data', body: `Environmental Compliance Summary:\n| Corridor | EMR Status | Key Findings | Next Submission |\n|---|---|---|---|\n| North Corridor | Q2 2026 OVERDUE | Wetland monitoring gap — species survey pending | 31 Oct 2026 |\n| Central Corridor | Q2 2026 Submitted | Dust and noise within limits; no significant findings | 31 Jan 2027 |\n| South Corridor | Q2 2026 Submitted | Minor issue: drainage modification noted, corrected | 31 Jan 2027 |\n\nInvoluntary Resettlement:\n- Total project-affected households (PAHs): 847\n- Resettled and compensated: 847 (100%)\n- Grievances received: 14 total; 14 resolved; 0 pending\n- Resettlement monitoring report: Q2 2026 submitted and found satisfactory\n\nOccupational Health & Safety:\n- Lost time injury rate: 0.8 per 200,000 work hours (below ADB threshold of 1.0)\n- Fatal accidents: 0\n- Contractor OHS audits conducted: 6 in 2026 (all contractors audited)` },
      { heading: 'Gender Action Plan Status', body: `Gender Action Plan (GAP) Progress — as of September 2026:\n\n| GAP Target | Indicator | Target | Actual | Status |\n|---|---|---|---|---|\n| Women in construction workforce | % female workers | ≥30% | 34% | Exceeded |\n| Women in non-traditional roles | No. of female workers in skilled roles | ≥50 | 142 | Exceeded |\n| Gender-disaggregated ridership data | Data collection protocol established | By Dec 2026 | Not yet implemented | Behind |\n| Commuter safety audit | Audit conducted at all 18 stations | By Jun 2026 | Completed — 16 of 18 stations | Partially complete |\n| GBV prevention training | All contractors completed training | By Mar 2026 | 100% completed | Complete |\n\nGAP Overall Rating: On Track (with one indicator behind schedule)\n\nAction Required: DoT ESSD to develop gender-disaggregated ridership data collection protocol by 31 March 2027. Agreed at mission, 17 October 2026.` },
    ],
  };

  readonly briefingSections = computed(() => {
    const key = this.activeArtefactKey();
    if (key && NotebookComponent.BRIEFING_MISSION[key]) {
      return NotebookComponent.BRIEFING_MISSION[key];
    }
    return this.notebookId === 'social' ? NotebookComponent.BRIEFING_SOCIAL : NotebookComponent.BRIEFING_ECONOMIC;
  });

  onBriefingMouseUp(): void {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (!text || !sel || sel.rangeCount === 0) { this.briefingSelMenu.set(null); return; }
      const range = sel.getRangeAt(0);
      const docEl = this.briefingDocRef?.nativeElement;
      if (!docEl || !docEl.contains(range.commonAncestorContainer)) { this.briefingSelMenu.set(null); return; }
      const rect = range.getBoundingClientRect();
      this.briefingSelMenu.set({ top: rect.top - 44, left: rect.left + rect.width / 2, text });
    }, 10);
  }

  closeBriefingSelMenu(): void { this.briefingSelMenu.set(null); }

  readonly briefingQuote = signal<string | null>(null);

  briefingExplainWithAI(text: string): void {
    this.briefingSelMenu.set(null);
    window.getSelection()?.removeAllRanges();
    const excerpt = text.length > 120 ? text.slice(0, 120) + '…' : text;
    this.briefingQuote.set(excerpt);
  }

  clearBriefingQuote(): void { this.briefingQuote.set(null); }

  private snapshotBriefingBodies(): string[] {
    const el = this.briefingDocRef?.nativeElement;
    if (!el) return [];
    return Array.from(el.querySelectorAll('[data-body]')).map(p => (p as HTMLElement).textContent ?? '');
  }

  private restoreBriefingBodies(bodies: string[]): void {
    const el = this.briefingDocRef?.nativeElement;
    if (!el) return;
    (Array.from(el.querySelectorAll('[data-body]')) as HTMLElement[]).forEach((p, i) => {
      if (bodies[i] !== undefined) p.textContent = bodies[i];
    });
  }

  onBriefingEdit(): void {
    this.briefingHasEdits.set(true);
    this.briefingLastEditTime.set(new Date());
    if (this.briefingDebounce) clearTimeout(this.briefingDebounce);
    this.briefingDebounce = setTimeout(() => {
      const snapshot = this.snapshotBriefingBodies();
      this.briefingHistory = this.briefingHistory.slice(0, this._briefingHistIdx() + 1);
      this.briefingHistory.push(snapshot);
      this._briefingHistLen.set(this.briefingHistory.length);
      this._briefingHistIdx.set(this.briefingHistory.length - 1);
    }, 600);
  }

  briefingUndo(): void {
    if (!this.briefingCanUndo()) return;
    const prev = this._briefingHistIdx() - 1;
    this._briefingHistIdx.set(prev);
    this.restoreBriefingBodies(this.briefingHistory[prev]);
    this.briefingLastEditTime.set(new Date());
    this.cdr.markForCheck();
  }

  briefingRedo(): void {
    if (!this.briefingCanRedo()) return;
    const next = this._briefingHistIdx() + 1;
    this._briefingHistIdx.set(next);
    this.restoreBriefingBodies(this.briefingHistory[next]);
    this.briefingLastEditTime.set(new Date());
    this.cdr.markForCheck();
  }

  formatBriefingEditTime(date: Date | null): string {
    if (!date) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  get availablePreviewModes(): string[] {
    if (this.notebookId === '2') {
      const modes = ['Map', 'Dashboard'];
      if (this.flowStep() >= 3) modes.push('Table');
      return modes;
    }
    if (this.notebookId === 'pacific') {
      return ['Map', 'Bar', 'Line', 'Scatter', 'Table', 'Record', 'Schema', 'Raw'];
    }
    const modes = ['Map', 'Chart', 'Table'];
    if (this.notebookId === '1' && this.ciDashboardCards().length > 0) modes.push('Dashboard');
    return modes;
  }

  onPreviewModeChange(mode: string): void {
    if (this.notebookId === 'pacific') {
      switch (mode) {
        case 'Map':     this.previewCtx.set('map');             break;
        case 'Bar':     this.previewCtx.set('pacific-chart');   break;
        case 'Line':    this.previewCtx.set('pacific-line');    break;
        case 'Scatter': this.previewCtx.set('pacific-scatter'); break;
        case 'Table':   this.previewCtx.set('pacific-table');   break;
        case 'Record':  this.previewCtx.set('pacific-record');  break;
        case 'Schema':  this.previewCtx.set('pacific-schema');  break;
        case 'Raw':     this.previewCtx.set('pacific-raw');     break;
      }
      this.cdr.markForCheck();
      return;
    }
    switch (mode) {
      case 'Map':
        this.previewCtx.set('map');
        break;
      case 'Dashboard':
        this.previewCtx.set(this.notebookId === '1' ? 'ci-dashboard' : 'dashboard');
        break;
      case 'Chart':
        this.previewCtx.set(this.flowStep() >= 4 ? 'disburse' : 'map');
        break;
      case 'Table':
        if (this.flowStep() >= 8)      this.previewCtx.set('comparison');
        else if (this.flowStep() >= 5) this.previewCtx.set('procurement');
        else if (this.flowStep() >= 3) this.previewCtx.set('overview');
        else                           this.previewCtx.set('map');
        break;
    }
    this.cdr.markForCheck();
  }

  // ── Publish modal ─────────────────────────────────────────────────────────
  showPublishModal   = signal(false);
  publishMarketplace = signal(false);
  localPublished     = signal(false);
  linkCopied         = signal(false);
  inviteInput        = signal('');

  spaceMembers = signal<SpaceMember[]>([
    { name: 'Ruby Tan',    email: 'ruby.tan@accenture.com', initials: 'RT', role: 'Administrator', color: '#007DB7' },
    { name: 'James Smith', email: 'j.smith@adb.org',        initials: 'JS', role: 'Editor',        color: '#6A1B9A' },
  ]);

  get effectivelyPublished(): boolean {
    return this.isPublished || this.localPublished();
  }

  get isOwnSpace(): boolean {
    return this.notebookId === '2' || this.notebookId.startsWith('fork-') || this.notebookId.startsWith('new-') || this.localPublished();
  }

  get spacePublishUrl(): string {
    return `https://datanext.adb.org/s/${this.notebookId || 'new'}`;
  }

  openPublishModal():  void { this.showPublishModal.set(true); }
  closePublishModal(): void { this.showPublishModal.set(false); }

  updateMemberRole(member: SpaceMember, role: string): void {
    member.role = role as SpaceMember['role'];
    this.cdr.markForCheck();
  }

  removeMember(member: SpaceMember): void {
    this.spaceMembers.update(ms => ms.filter(m => m !== member));
  }

  publishSpace(): void {
    this.localPublished.set(true);
    this.cdr.markForCheck();
  }

  unpublishSpace(): void {
    this.localPublished.set(false);
    this.cdr.markForCheck();
  }

  copySpaceLink(): void {
    if (!this.effectivelyPublished) return;
    navigator.clipboard.writeText(this.spacePublishUrl).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => { this.linkCopied.set(false); this.cdr.markForCheck(); }, 2000);
      this.cdr.markForCheck();
    });
  }

  openAddAssets():  void { this.addedAssetNames.set(new Set()); this.showAddAssets.set(true); }
  closeAddAssets(): void { this.showAddAssets.set(false); }

  isAssetAdded(asset: CatalogueAsset): boolean { return this.addedAssetNames().has(asset.name); }

  assetRating(name: string): string {
    const n = catalogueHash(name, 0, 9);
    return (4.0 + n / 10).toFixed(1);
  }
  forkSpace(): void {
    if (this.forking()) return;
    this.forking.set(true);
    setTimeout(() => {
      const card = this.workspaceService.fork(this.title(), this.notebookId, this.sourceForkMeta);
      this.forking.set(false);
      this.router.navigate(['/notebooks', card.id]);
    }, 1800);
  }

  continueToDatabricks(): void {
    if (this.forking()) return;
    this.forking.set(true);
    setTimeout(() => {
      const card = this.workspaceService.fork(this.title(), this.notebookId, this.sourceForkMeta);
      this.forking.set(false);
      this.router.navigate(['/notebooks', card.id]).then(() => {
        this.useInDrawer.set('databricks');
      });
    }, 1800);
  }

  handleCtaAction(action: string | undefined): void {
    if (action === 'fork-databricks') this.continueToDatabricks();
  }

  private resetPreview(): void {
    this.messages        = [];
    this.starterPrompts  = ['What datasets are available for this topic?', 'Summarise the key findings.', 'Show related resources.'];
    this.relatedQueries  = [];
    this.flowStep.set(0);
    this.hasDashboardData.set(false);
    this.previewCtx.set('map');
    this.previewMode     = 'Map';
    this.mapEconomies.set([]);
    this.mapMarkers.set([]);
    this.mapFilters.set([]);
    this.mapCount.set(0);
    this.mapCountryPanel.set(null);
  }

  addAssetToSpace(asset: CatalogueAsset): void {
    this.addedAssetNames.update(s => new Set([...s, asset.name]));
    const typeToGroup: Record<string, string> = {
      'AI Agent': 'AI Agents', 'AI Tool': 'AI Tools',
      'Dataset': 'Data', 'Catalogue': 'Data',
    };
    const groupName = typeToGroup[asset.type] ?? asset.type;
    const group = this.assetGroups.find(g => g.name === groupName);
    if (group) {
      if (!group.items.find(i => i.name === asset.name)) {
        group.items.push({ name: asset.name, selected: true });
      }
      group.expanded = true;
    } else {
      this.assetGroups = [...this.assetGroups, { name: groupName, expanded: true, items: [{ name: asset.name, selected: true }] }];
    }
    this.cdr.markForCheck();
  }

  catalogueTagColor(type: AssetType): 'blue' | 'violet' | 'amber' | 'teal' {
    const m: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'Catalogue': 'blue',
      'AI Agent': 'violet', 'AI Tool': 'violet',
      'Dashboard': 'amber', 'API': 'teal',
    };
    return m[type] ?? 'blue';
  }

  toggleGroup(group: AssetGroup): void { group.expanded = !group.expanded; }

  clearGroup(group: AssetGroup, event: Event): void {
    event.stopPropagation();
    group.items = [];
    this.assetGroups = this.assetGroups.filter(g => g.items.length > 0);
  }

  openAssetDetail(item: AssetItem, event: Event): void {
    event.stopPropagation();
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.router.navigate(['/assets', slug]);
  }

  removeAssetItem(group: AssetGroup, item: AssetItem, event: Event): void {
    event.stopPropagation();
    this.removeAssetConfirm.set({ group, item });
  }

  confirmRemoveAsset(): void {
    const pending = this.removeAssetConfirm();
    if (!pending) return;
    pending.group.items = pending.group.items.filter(i => i !== pending.item);
    this.assetGroups = this.assetGroups.filter(g => g.items.length > 0);
    this.removeAssetConfirm.set(null);
  }

  cancelRemoveAsset(): void {
    this.removeAssetConfirm.set(null);
  }

  startResize(side: 'assets' | 'preview', e: MouseEvent): void {
    e.preventDefault();
    this.resizing = side;
    this.startX   = e.clientX;
    this.startW   = side === 'assets' ? this.assetWidth() : this.previewWidth();
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'col-resize';
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────

  submitStarter(text: string): void {
    if (this.thinking()) return;
    this.clearSuggestions();
    this.push({ role: 'user', text });
    if (this.notebookId === '2') this.step1();
    else if (this.notebookId === '1') this.handleSpace1Message(text);
  }

  sendMessage(text: string): void {
    if (this.thinking()) return;
    this.clearSuggestions();
    const quote = this.briefingQuote();
    const fullText = quote ? `"${quote}"\n\n${text}` : text;
    this.briefingQuote.set(null);
    this.push({ role: 'user', text: fullText });
    if (this.notebookId === '1') this.handleSpace1Message(text);
  }

  sendRelatedQuery(text: string): void {
    this.relatedQueries = [];
    this.sendMessage(text);
  }

  expandPrompt(): void {
    this.promptExpanded.set(true);
    setTimeout(() => {
      const input = this.messagesRef?.nativeElement
        .closest('.nb__panel--chat')
        ?.querySelector<HTMLInputElement>('.search-input__field');
      input?.focus();
    }, 50);
  }

  toggleSources(idx: number): void {
    this.sourcesOpenIdx.update(v => v === idx ? null : idx);
  }

  handleAction(action: string): void {
    if (this.thinking()) return;
    this.clearSuggestions();
    switch (action) {
      case 'Narrow to Southeast Asia':  this.step2(); break;
      case 'Funding & disbursement':    this.step4(); break;
      case 'View procurement':          this.step5(); break;
      case 'Procurement':               this.step5(); break;
      case 'Identify largest':          this.step7(); break;
      case 'Compare original projects': this.step8(); break;
      case 'Compare these 6':           this.step8(); break;
    }
  }

  private static readonly PACIFIC_WATCHLIST: Record<string, {
    name: string; iso2: string; region: string;
    facts: CountryFacts;
    cats: WatchlistCat[];
  }> = {
    TON: {
      name: 'Tonga', iso2: 'to', region: 'Pacific SIDS',
      facts: { population: '100K', area: '747 km²', capital: "Nuku'alofa", currency: 'TOP (T$)' },
      cats: [
        { id: 'climate',  label: 'Flood & Coastal Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '7.4 / 10', status: '2025, high',        statusColor: '#c62828' },
          { key: 'coast', label: 'Coastal Exposure',     value: '62%',      status: '+4% since 2020',    statusColor: '#a65500' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '4×/yr',    status: 'avg 2020–2025',     statusColor: '#a65500' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+5.1 mm',  status: 'per year',          statusColor: '#c62828' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '38',       status: 'of 61 total',       statusColor: '#c62828' },
          { key: 'ports', label: 'Ports at Risk',        value: '2 / 3',    status: 'high exposure',     statusColor: '#a65500' },
          { key: 'health',label: 'Health Facilities',    value: '8 / 12',   status: 'in flood zone',     statusColor: '#a65500' },
          { key: 'roads', label: 'Roads at Risk',        value: '340 km',   status: 'coastal roads',     statusColor: '#a65500' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$5,240',   status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '2.1%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$48M',     status: 'annual exposure',   statusColor: '#a65500' },
          { key: 'aid',   label: 'Aid Dependency',       value: '18.4%',    status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
    COK: {
      name: 'Cook Islands', iso2: 'ck', region: 'Pacific SIDS',
      facts: { population: '17K', area: '237 km²', capital: 'Avarua', currency: 'NZD (NZ$)' },
      cats: [
        { id: 'climate',  label: 'Flood & Coastal Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '4.1 / 10', status: '2025, moderate',    statusColor: '#a65500' },
          { key: 'coast', label: 'Coastal Exposure',     value: '44%',      status: '+2% since 2020',    statusColor: '#a65500' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '2×/yr',    status: 'avg 2020–2025',     statusColor: '#2E7D32' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+4.8 mm',  status: 'per year',          statusColor: '#a65500' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '12',       status: 'of 38 total',       statusColor: '#a65500' },
          { key: 'ports', label: 'Ports at Risk',        value: '1 / 2',    status: 'moderate exposure', statusColor: '#a65500' },
          { key: 'health',label: 'Health Facilities',    value: '3 / 8',    status: 'in flood zone',     statusColor: '#2E7D32' },
          { key: 'roads', label: 'Roads at Risk',        value: '89 km',    status: 'coastal roads',     statusColor: '#2E7D32' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$19,800',  status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '3.4%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$112M',    status: 'annual exposure',   statusColor: '#a65500' },
          { key: 'aid',   label: 'Aid Dependency',       value: '5.2%',     status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
    VAN: {
      name: 'Vanuatu', iso2: 'vu', region: 'Pacific SIDS',
      facts: { population: '327K', area: '12,189 km²', capital: 'Port Vila', currency: 'VUV (Vt)' },
      cats: [
        { id: 'climate',  label: 'Cyclone & Flood Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '8.2 / 10', status: '2025, very high',   statusColor: '#c62828' },
          { key: 'cyc',   label: 'Cyclone Exposure',     value: '91%',      status: '+6% since 2020',    statusColor: '#c62828' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '6×/yr',    status: 'avg 2020–2025',     statusColor: '#c62828' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+5.8 mm',  status: 'per year',          statusColor: '#c62828' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '64',       status: 'of 92 total',       statusColor: '#c62828' },
          { key: 'ports', label: 'Ports at Risk',        value: '3 / 4',    status: 'high exposure',     statusColor: '#c62828' },
          { key: 'health',label: 'Health Facilities',    value: '18 / 24',  status: 'in flood zone',     statusColor: '#c62828' },
          { key: 'roads', label: 'Roads at Risk',        value: '670 km',   status: 'coastal roads',     statusColor: '#a65500' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$3,190',   status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '1.8%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$71M',     status: 'annual exposure',   statusColor: '#c62828' },
          { key: 'aid',   label: 'Aid Dependency',       value: '22.1%',    status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
    FIJ: {
      name: 'Fiji', iso2: 'fj', region: 'Pacific',
      facts: { population: '930K', area: '18,274 km²', capital: 'Suva', currency: 'FJD (FJ$)' },
      cats: [
        { id: 'climate',  label: 'Cyclone & Flood Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '5.3 / 10', status: '2025, moderate',    statusColor: '#a65500' },
          { key: 'cyc',   label: 'Cyclone Exposure',     value: '78%',      status: '+4% since 2020',    statusColor: '#a65500' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '3×/yr',    status: 'avg 2020–2025',     statusColor: '#a65500' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+4.6 mm',  status: 'per year',          statusColor: '#a65500' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '47',       status: 'of 110 total',      statusColor: '#a65500' },
          { key: 'ports', label: 'Ports at Risk',        value: '2 / 5',    status: 'moderate exposure', statusColor: '#a65500' },
          { key: 'health',label: 'Health Facilities',    value: '14 / 32',  status: 'in flood zone',     statusColor: '#2E7D32' },
          { key: 'roads', label: 'Roads at Risk',        value: '520 km',   status: 'coastal roads',     statusColor: '#a65500' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$6,120',   status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '2.7%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$680M',    status: 'annual exposure',   statusColor: '#a65500' },
          { key: 'aid',   label: 'Aid Dependency',       value: '3.8%',     status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
    SOL: {
      name: 'Solomon Islands', iso2: 'sb', region: 'Pacific SIDS',
      facts: { population: '720K', area: '28,896 km²', capital: 'Honiara', currency: 'SBD (SI$)' },
      cats: [
        { id: 'climate',  label: 'Flood & Coastal Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '5.9 / 10', status: '2025, moderate',    statusColor: '#a65500' },
          { key: 'coast', label: 'Coastal Exposure',     value: '71%',      status: '+5% since 2020',    statusColor: '#a65500' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '3×/yr',    status: 'avg 2020–2025',     statusColor: '#a65500' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+5.3 mm',  status: 'per year',          statusColor: '#c62828' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '29',       status: 'of 58 total',       statusColor: '#a65500' },
          { key: 'ports', label: 'Ports at Risk',        value: '2 / 4',    status: 'moderate exposure', statusColor: '#a65500' },
          { key: 'health',label: 'Health Facilities',    value: '10 / 20',  status: 'in flood zone',     statusColor: '#a65500' },
          { key: 'roads', label: 'Roads at Risk',        value: '290 km',   status: 'coastal roads',     statusColor: '#a65500' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$2,350',   status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '1.5%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$22M',     status: 'annual exposure',   statusColor: '#a65500' },
          { key: 'aid',   label: 'Aid Dependency',       value: '26.3%',    status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
    PNG: {
      name: 'Papua New Guinea', iso2: 'pg', region: 'Pacific',
      facts: { population: '10M', area: '462,840 km²', capital: 'Port Moresby', currency: 'PGK (K)' },
      cats: [
        { id: 'climate',  label: 'Flood & Coastal Risk', items: [
          { key: 'fri',   label: 'Flood Risk Index',     value: '6.8 / 10', status: '2025, high',        statusColor: '#c62828' },
          { key: 'coast', label: 'Coastal Exposure',     value: '38%',      status: '+3% since 2020',    statusColor: '#a65500' },
          { key: 'surge', label: 'Storm Surge Freq.',    value: '3×/yr',    status: 'avg 2020–2025',     statusColor: '#a65500' },
          { key: 'slr',   label: 'Sea Level Rise',       value: '+4.9 mm',  status: 'per year',          statusColor: '#a65500' },
        ]},
        { id: 'infra', label: 'Infrastructure Exposure', items: [
          { key: 'sites', label: 'Sites at Risk',        value: '82',       status: 'of 190 total',      statusColor: '#c62828' },
          { key: 'ports', label: 'Ports at Risk',        value: '4 / 8',    status: 'high exposure',     statusColor: '#a65500' },
          { key: 'health',label: 'Health Facilities',    value: '28 / 60',  status: 'in flood zone',     statusColor: '#a65500' },
          { key: 'roads', label: 'Roads at Risk',        value: '1,200 km', status: 'coastal roads',     statusColor: '#a65500' },
        ]},
        { id: 'econ', label: 'Economic Indicators', items: [
          { key: 'gdpcap',label: 'GDP per Capita',       value: '$2,870',   status: '2025',              statusColor: '#007DB7' },
          { key: 'gdpg',  label: 'GDP Growth',           value: '0.9%',     status: '2025',              statusColor: '#2E7D32' },
          { key: 'tour',  label: 'Tourism at Risk',      value: '$35M',     status: 'annual exposure',   statusColor: '#a65500' },
          { key: 'aid',   label: 'Aid Dependency',       value: '8.7%',     status: '% of GNI',          statusColor: '#607D8B' },
        ]},
      ],
    },
  };

  onCountrySelect(adbCode: string): void {
    if (this.thinking()) return;
    if (this.notebookId === '2' && this.flowStep() === 2 && adbCode === 'PHI') {
      this.step3();
    }
    if (this.notebookId === 'pacific') {
      const entry = NotebookComponent.PACIFIC_WATCHLIST[adbCode];
      if (entry) {
        this.mapPanelTitle.set(entry.name);
        this.mapPanelSubtitle.set(entry.region);
        this.mapPanelFlag.set(`https://flagcdn.com/w80/${entry.iso2}.png`);
        this.mapPanelFacts.set(entry.facts);
        this.mapPanelCats.set(entry.cats);
        this.mapPanelOpenCats.set(new Set(['climate']));
        this.mapPanelVisible.set(true);
        this.cdr.markForCheck();
      }
    }
  }

  filterProcurement(status: 'Active' | 'Awarded' | 'Complete' | ''): void {
    if (this.thinking()) return;
    const next = this.procFilter() === status ? '' : status;
    this.procFilter.set(next);
    if (next === 'Active' && this.flowStep() === 5) {
      this.step6();
    }
    this.cdr.markForCheck();
  }

  // ── Template helpers ──────────────────────────────────────────────────────────

  filteredProcRecords(): ProcRecord[] {
    const f = this.procFilter();
    const rows = f ? ALL_PROC_RECORDS.filter(r => r.status === f) : ALL_PROC_RECORDS;
    if (this.flowStep() >= 7 && f === 'Active') {
      return [...rows].sort((a, b) => this.parseMillion(b.value) - this.parseMillion(a.value));
    }
    return rows;
  }

  isRanked(): boolean { return this.flowStep() >= 7 && this.procFilter() === 'Active'; }

  // ── Citation chip popover ─────────────────────────────────────────────────

  readonly chipPopoverOpen    = signal(false);
  readonly chipPopoverTop     = signal<number | null>(null);
  readonly chipPopoverBottom  = signal<number | null>(null);
  readonly chipPopoverLeft    = signal(0);
  readonly chipPopoverSources = signal<SourceCard[]>([]);

  closeChipPopover(): void { this.chipPopoverOpen.set(false); this.cdr.markForCheck(); }

  handleMsgClick(event: MouseEvent, index: number): void {
    const pill = (event.target as HTMLElement).closest('[data-action="toggle-sources"]') as HTMLElement | null;
    if (!pill) return;
    event.stopPropagation();
    const sources = this.messages[index]?.sourceCards ?? [];
    if (this.chipPopoverOpen()) { this.chipPopoverOpen.set(false); this.cdr.markForCheck(); return; }
    const rect = pill.getBoundingClientRect();
    const popoverW = 320;
    if (window.innerHeight - rect.bottom > 200) {
      this.chipPopoverTop.set(rect.bottom + 8);
      this.chipPopoverBottom.set(null);
    } else {
      this.chipPopoverTop.set(null);
      this.chipPopoverBottom.set(window.innerHeight - rect.top + 8);
    }
    let left = rect.left;
    if (left + popoverW > window.innerWidth - 8) left = window.innerWidth - popoverW - 8;
    this.chipPopoverLeft.set(Math.max(8, left));
    this.chipPopoverSources.set(sources);
    this.chipPopoverOpen.set(true);
    this.cdr.markForCheck();
  }

  renderText(text: string, sourceCards?: SourceCard[]): SafeHtml {
    const bold   = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const isRow  = (l: string) => l.trim().startsWith('|');
    const cells  = (l: string) => l.trim().split('|').slice(1, -1).map(c => c.trim());
    const isSep  = (l: string) => {
      const t = l.trim();
      return t.startsWith('|') && t.endsWith('|') && cells(t).every(c => /^[\s\-:]+$/.test(c));
    };

    const lines = text.split('\n');
    const parts: string[] = [];
    let i = 0;

    while (i < lines.length) {
      if (isRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
        const headers = cells(lines[i]);
        i += 2; // skip header + separator
        const TH = `style="background:#f0f5f9;color:#334155;font-weight:500;text-align:left;padding:7px 10px;border:1px solid #dde5ef;white-space:nowrap;font-size:12px;font-family:var(--font,system-ui,sans-serif)"`;
        const TD = `style="padding:6px 10px;border:1px solid #e8ecef;color:#374151;font-size:13px;font-family:var(--font,system-ui,sans-serif)"`;
        let t = `<table style="width:100%;border-collapse:collapse;margin:8px 0"><thead><tr>`;
        headers.forEach(h => { t += `<th ${TH}>${bold(h)}</th>`; });
        t += '</tr></thead><tbody>';
        let rowIdx = 0;
        while (i < lines.length && isRow(lines[i])) {
          const evenBg = rowIdx % 2 === 1 ? 'background:#fafbfc;' : '';
          t += `<tr>${cells(lines[i]).map(c => `<td style="${evenBg}padding:6px 10px;border:1px solid #e8ecef;color:#374151;font-size:13px;font-family:var(--font,system-ui,sans-serif)">${bold(c)}</td>`).join('')}</tr>`;
          i++; rowIdx++;
        }
        t += '</tbody></table>';
        parts.push(t);
      } else {
        parts.push(bold(lines[i]));
        i++;
      }
    }

    let html = '';
    for (let j = 0; j < parts.length; j++) {
      const cur = parts[j], prev = j > 0 ? parts[j - 1] : '';
      if (j > 0 && !cur.startsWith('<table') && !prev.startsWith('<table')) html += '<br>';
      html += cur;
    }

    if (sourceCards?.length) {
      const first = sourceCards[0].title;
      const extra = sourceCards.length - 1;
      html = html.replace(/(<br\s*\/?>)+$/, '');
      html += `<span data-action="toggle-sources" style="display:inline-flex;align-items:center;cursor:pointer;background:#EBF5FB;border:1px solid #BDD9EA;border-radius:20px;padding:2px 9px;font-size:10px;color:#007DB7;margin-left:5px;vertical-align:middle;white-space:nowrap;user-select:none">${first}${extra > 0 ? ` +${extra}` : ''}</span>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private readonly _bodyCache = new Map<string, SafeHtml>();
  renderBody(text: string): SafeHtml {
    if (!this._bodyCache.has(text)) {
      this._bodyCache.set(text, this.renderText(text));
    }
    return this._bodyCache.get(text)!;
  }

  widgetTagColor(w: ChatWidget): 'blue' | 'violet' | 'amber' | 'teal' {
    const map: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'AI Agent': 'violet',
      'API': 'teal', 'Dashboard': 'amber',
    };
    return map[w.displayType ?? ''] ?? 'blue';
  }

  private parseMillion(val: string): number {
    return parseFloat(val.replace(/[^0-9.]/g, ''));
  }

  private clearSuggestions(): void {
    this.messages = this.messages.map(m =>
      (m.actions?.length || m.chips?.length)
        ? { ...m, actions: undefined, chips: undefined }
        : m
    );
  }

  private push(...msgs: ChatMessage[]): void {
    this.messages = [...this.messages, ...msgs];
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
  }

  private scrollToLastMessage(): void {
    setTimeout(() => {
      const el = this.messagesRef?.nativeElement;
      if (!el) return;
      const msgs = el.querySelectorAll('.nb__msg');
      if (!msgs.length) return;
      const last = msgs[msgs.length - 1] as HTMLElement;
      last.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, 80);
  }

  // ── Thinking engine ───────────────────────────────────────────────────────────

  private clearTimers(): void {
    this.thinkingTimers.forEach(id => clearTimeout(id));
    this.thinkingTimers = [];
  }

  /**
   * Animates tasks through pending → in-progress → completed, then calls onComplete.
   * totalMs is the total wall-clock time before the response appears.
   */
  private startThinking(
    phases: string[],
    taskDefs: Array<{ title: string; description?: string }>,
    totalMs: number,
    onComplete: () => void,
  ): void {
    this.clearTimers();

    const tasks: AgenticTask[] = taskDefs.map((t, i) => ({
      title: t.title,
      description: t.description,
      status: i === 0 ? 'in-progress' : 'pending',
    }));

    this.thinking.set({ phases, tasks: [...tasks] });
    this.cdr.markForCheck();
    this.scrollToBottom();

    // Each task completes in equal time slices, leaving a short pause before onComplete
    const stepMs = totalMs / (taskDefs.length + 0.5);

    taskDefs.forEach((_, i) => {
      const id = setTimeout(() => {
        tasks[i].status = 'completed';
        if (i + 1 < tasks.length) tasks[i + 1].status = 'in-progress';
        this.thinking.update(s => s ? { ...s, tasks: [...tasks] } : null);
        this.cdr.markForCheck();
      }, (i + 1) * stepMs);
      this.thinkingTimers.push(id);
    });

    const doneId = setTimeout(() => {
      this.thinking.set(null);
      onComplete();
      this.cdr.markForCheck();
      this.scrollToBottom();
    }, totalMs);
    this.thinkingTimers.push(doneId);
  }

  // ── Pacific playback ──────────────────────────────────────────────────────────

  private playbackPacific(): void {
    const push = (msg: ChatMessage) => {
      this.messages = [...this.messages, msg];
      this.cdr.markForCheck();
      this.scrollToBottom();
    };

    const t = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      this.thinkingTimers.push(id);
    };

    // Turn 1 — user question
    push({ role: 'user', text: 'What is the flood exposure for Tongatapu and Cook Islands?' });

    // Reasoning loader (reuse thinking signal)
    t(600, () => {
      this.thinking.set({
        phases: ['Accessing Climate Risk Agent', 'Querying Pacific Risk Atlas', 'Cross-referencing Geospatial Flooding Risk Engine'],
        tasks: [],
      });
      this.cdr.markForCheck();
      this.scrollToBottom();
    });

    t(4200, () => {
      this.thinking.set(null);
      // Show Tongatapu and Cook Islands markers with high/moderate risk filter
      this.mapMarkers.set([PACIFIC_MARKERS[1], PACIFIC_MARKERS[2]]);
      this.mapFilters.set(['Pacific SIDS', 'Flood Risk', 'Tongatapu · High', 'Cook Is. · Moderate']);
      this.cdr.markForCheck();
      push({
        role: 'assistant',
        text: "I've pulled the latest data across all three workspace assets. Tongatapu is in a high-risk zone — the low-lying coastal districts are particularly exposed. Cook Islands looks more moderate, with the main concentration of risk around northern Rarotonga.",
        actions: ['Compare across Pacific SIDS', 'Show infrastructure exposure for Vanuatu', 'What are the key flood drivers in Tongatapu?'],
      });
    });

    // Turn 2 — user follow-up
    t(6000, () => { this.clearSuggestions(); push({ role: 'user', text: 'Rank all three sites by exposure and update the map' }); });

    t(6600, () => {
      this.thinking.set({ phases: ['Ranking exposure scores', 'Updating map overlay'], tasks: [] });
      this.cdr.markForCheck();
      this.scrollToBottom();
    });

    t(9400, () => {
      this.thinking.set(null);
      // Show all three markers ranked by exposure
      this.mapMarkers.set(PACIFIC_MARKERS);
      this.mapFilters.set(['3 sites ranked', 'Tongatapu · High', 'Vanuatu · Moderate', 'Cook Is. · Low']);
      this.cdr.markForCheck();
      push({
        role: 'assistant',
        text: "Done — Tongatapu comes out on top with the highest exposure, followed by Vanuatu, then Cook Islands at the lower end. I've updated the map overlay to reflect all three sites.",
      });
    });

    // Turn 3 — user follow-up
    t(11200, () => { this.clearSuggestions(); push({ role: 'user', text: 'Train a model to forecast exposure for the next 10 years' }); });

    t(11800, () => {
      this.thinking.set({ phases: ['Evaluating compute requirements'], tasks: [] });
      this.cdr.markForCheck();
      this.scrollToBottom();
    });

    t(14200, () => {
      this.thinking.set(null);
      push({
        role: 'assistant',
        text: "This requires a development environment\n\nModel training isn't run directly in DataNex+. Your selected data and risk exposure layers can be handed off to **CountryGenie** for advanced forecasting and scenario modelling.",
        ctaLink: 'Continue in CountryGenie',
        ctaAction: 'fork-databricks',
      });
    });
  }

  // ── Demo flow steps ───────────────────────────────────────────────────────────

  private step1(): void {
    this.startThinking(
      ['Querying Projects', 'Applying Filters'],
      [
        { title: 'Search ADB project database', description: 'Transport sector · active status' },
        { title: 'Apply value filter',           description: 'Minimum $100m financing' },
        { title: 'Aggregate results',            description: 'Counting across 7 countries' },
      ],
      2400,
      () => {
        this.flowStep.set(1);
        this.previewCollapsed.set(false);
        this.mapEconomies.set(ASIA_PACIFIC_ECONOMIES);
        this.mapFilters.set(['Transport', 'Active', '> $100m']);
        this.mapCount.set(14);
        this.mapMarkers.set(ALL_PROJECT_MARKERS);
        this.previewCtx.set('map');
        this.previewMode = 'Map';
        this.push({
          role: 'assistant',
          text: 'I found **14 active transport projects** above $100m, representing **$2.8B in total financing across 7 countries**.',
          actions: ['Narrow to Southeast Asia', 'Compare projects', 'Show as table'],
          sources: 3, sourceCards: SRC_3,
        });
      },
    );
  }

  private step2(): void {
    this.startThinking(
      ['Applying Geographic Filter', 'Updating Results'],
      [
        { title: 'Filter by Southeast Asia', description: 'PHI · INO · VIE · THA · MAL · CAM' },
        { title: 'Refresh result set',        description: '6 of 14 projects match' },
      ],
      1600,
      () => {
        this.flowStep.set(2);
        this.push({ role: 'user', text: 'Just show Southeast Asia.' });
        this.mapEconomies.set(SEA_ECONOMIES);
        this.mapFilters.set(['Southeast Asia', 'Transport', 'Active', '> $100m']);
        this.mapCount.set(6);
        this.mapMarkers.set(SEA_MARKERS);
        this.previewCtx.set('map');
        this.previewMode = 'Map';
        this.push({
          role: 'assistant',
          text: 'Filtered to **6 active transport projects** across Southeast Asia.',
          actions: ['Compare these 6', 'Show as table'],
          sources: 3, sourceCards: SRC_3,
        });
      },
    );
  }

  private step3(): void {
    this.startThinking(
      ['Retrieving Project', 'Loading Details'],
      [
        { title: 'Fetch project record',      description: 'Metro Manila Transport Project' },
        { title: 'Load disbursement summary', description: '64% of $420m disbursed' },
      ],
      1800,
      () => {
        this.flowStep.set(3);
        this.mapEconomies.set(['PHI']);
        this.mapMarkers.set([{ left: 68.9, top: 51.9, label: 'Metro Manila' }]);
        this.push(
          { role: 'note', noteLabel: 'Metro Manila Transport Project' },
          {
            role: 'assistant',
            text: 'This project has **$420m in financing** and is currently **under implementation**, with **64% disbursed**.',
            actions: ['Funding & disbursement', 'Procurement', 'Project documents'],
            sources: 2, sourceCards: SRC_2,
          },
        );
        this.previewCtx.set('overview');
        this.previewMode = 'Table';
      },
    );
  }

  private step4(): void {
    this.startThinking(
      ['Analysing Disbursements', 'Generating Chart'],
      [
        { title: 'Load disbursement records',   description: 'Project Funding & Disbursement Data' },
        { title: 'Calculate planned vs actual',  description: '2023–2026 · 4 data points' },
        { title: 'Prepare timeline chart',       description: 'Cumulative disbursement view' },
      ],
      2400,
      () => {
        this.flowStep.set(4);
        this.push(
          { role: 'user', text: 'Funding & disbursement' },
          {
            role: 'assistant',
            text: '**$269m of $420m** has been disbursed.\n\nDisbursement accelerated in 2025 but is currently slightly behind the planned schedule.',
            actions: ['Compare planned vs actual', 'View transactions', 'View procurement'],
            sources: 2, sourceCards: SRC_2,
          },
        );
        this.previewCtx.set('disburse');
        this.previewMode = 'Chart';
      },
    );
  }

  private step5(): void {
    this.startThinking(
      ['Retrieving Records', 'Loading Table'],
      [
        { title: 'Query procurement database', description: 'Project Procurement & Contract Data' },
        { title: 'Load 18 contract records',   description: 'Combined value $246m' },
        { title: 'Sort by award date',          description: 'Jan 2024 – Jun 2025' },
      ],
      2200,
      () => {
        this.flowStep.set(5);
        this.procFilter.set('');
        this.push(
          { role: 'user', text: 'View procurement' },
          {
            role: 'assistant',
            text: 'There are **18 procurement records** associated with this project, with a combined contract value of **$246m**.',
            actions: ['Largest contracts', 'By status', 'By supplier'],
            sources: 2, sourceCards: SRC_2,
          },
        );
        this.previewCtx.set('procurement');
        this.previewMode = 'Table';
      },
    );
  }

  private step6(): void {
    // Lightweight — filter was in Data Preview, just acknowledge in chat
    this.startThinking(
      ['Filtering Contracts'],
      [
        { title: 'Apply status filter', description: 'Active contracts only' },
      ],
      700,
      () => {
        this.flowStep.set(6);
        this.push({
          role: 'assistant',
          text: '**7 active contracts.**',
          actions: ['Summarise these', 'Identify largest', 'Compare suppliers'],
        });
      },
    );
  }

  private step7(): void {
    this.startThinking(
      ['Ranking Contracts', 'Calculating'],
      [
        { title: 'Sort active contracts by value', description: '7 active contracts' },
        { title: 'Calculate proportional share',   description: 'Top 3 = 68% of active value' },
      ],
      1600,
      () => {
        this.flowStep.set(7);
        this.procFilter.set('Active');
        this.push(
          { role: 'user', text: 'Identify largest' },
          {
            role: 'assistant',
            text: 'The top 3 active contracts account for **68% of active contract value**.\n\n1. Civil Works Package A — $72m\n2. Rail Systems Integration — $51m\n3. Signalling Systems — $29m',
            actions: ['Compare original projects'],
            sources: 2, sourceCards: SRC_2,
          },
        );
        this.previewCtx.set('procurement');
        this.previewMode = 'Table';
      },
    );
  }

  private step8(): void {
    this.startThinking(
      ['Loading Peers', 'Generating Comparison'],
      [
        { title: 'Retrieve peer project data',  description: '5 SEA transport projects' },
        { title: 'Align comparison metrics',    description: 'Financing · disbursement · contracts' },
        { title: 'Rank and highlight',          description: 'Metro Manila selected' },
      ],
      2400,
      () => {
        this.flowStep.set(8);
        this.push(
          { role: 'user', text: 'Compare this project with the other five.' },
          {
            role: 'assistant',
            text: 'Compared with the other projects in your current result set, **Metro Manila has the highest financing** but **slower disbursement progress** than most peers.',
            actions: ['Compare funding', 'Compare progress'],
            sources: 3, sourceCards: SRC_3,
          },
        );
        this.previewCtx.set('comparison');
        this.previewMode = 'Table';
      },
    );
  }

  // ── Space '1' Country Intelligence dashboard flow ─────────────────────────────

  private handleSpace1Message(text: string): void {
    const t = text.toLowerCase();
    if (t.includes('debt')) {
      this.stepDebtGDPQuery();
    } else if (t.includes('gdp') || t.includes('growth') || t.includes('projection')) {
      this.stepGDPQuery();
    } else if (t.includes('credit') || t.includes('rating')) {
      this.stepCreditQuery();
    } else {
      this.stepGDPQuery();
    }
  }

  private stepDebtGDPQuery(): void {
    this.startThinking(
      ['Analysing Fiscal Data', 'Comparing Countries'],
      [
        { title: 'Query Debt-to-GDP series', description: 'KIDB · Bangladesh · Viet Nam · Cambodia · 2020–2024' },
        { title: 'Rank by fiscal position',  description: 'Computing 2024 values and 5-year trend' },
      ],
      2000,
      () => {
        this.push({
          role: 'assistant',
          text: 'All three economies maintain **relatively low debt-to-GDP ratios** by global standards. Viet Nam has made the sharpest fiscal consolidation — from 55.9% in 2020 down to 36.7% in 2024, driven by strong nominal GDP growth. Bangladesh is stable near 38%, while Cambodia remains the most conservative at 31.4%.',
          suggestedMetrics: CI_METRIC_CARDS,
          sources: 1,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'ADB flagship time-series database — fiscal indicators for all DMCs, 1960–2024.', updatedAt: '30 Jun 2026' },
          ],
          actions: ['Compare with South Asia peers', 'Show GDP projections'],
        });
      },
    );
  }

  private stepGDPQuery(): void {
    this.startThinking(
      ['Retrieving GDP Series', 'Projecting Trends'],
      [
        { title: 'Query GDP growth series',  description: 'KIDB · 2020–2024 actuals' },
        { title: 'Extrapolate 2025–2030',    description: 'IMF WEO baseline scenario' },
      ],
      2200,
      () => {
        this.push({
          role: 'assistant',
          text: 'Based on 2020–2024 actuals and IMF WEO projections, all three economies are expected to sustain **above-average growth through 2030**. Viet Nam leads at a projected 6.5–7% annually, supported by manufacturing FDI. Bangladesh is forecast at 6–6.5%, with garments and remittances as the backbone. Cambodia tracks at around 6%.\n\nElevated inflation in Bangladesh (7.8%) remains a growth risk — add both cards to compare the growth-inflation tradeoff.',
          suggestedMetrics: CI_METRIC_CARDS,
          sources: 2,
          sourceCards: [
            { type: 'dataset', title: 'Key Indicators Database (KIDB)', description: 'ADB flagship time-series database — GDP growth and macroeconomic indicators, 1960–2024.', updatedAt: '30 Jun 2026' },
            { type: 'dataset', title: 'IMF World Economic Outlook',     description: 'IMF WEO projections — GDP, inflation, and fiscal indicators for 190 economies.', updatedAt: '01 May 2026' },
          ],
          actions: ['Show credit rating context', 'Add Debt-to-GDP card'],
        });
      },
    );
  }

  private stepCreditQuery(): void {
    this.startThinking(
      ['Retrieving Rating History', 'Analysing Credit Drivers'],
      [
        { title: 'Load sovereign credit ratings', description: 'S&P · Moody\'s · 5-year history' },
        { title: 'Map to macro indicators',        description: 'CPI · Current Account · Debt/GDP' },
      ],
      2000,
      () => {
        this.push({
          role: 'assistant',
          text: 'Credit rating trajectories reflect each country\'s macro fundamentals. **Viet Nam (BB+)** benefits from a current account surplus and a declining debt trajectory. **Bangladesh (BB−)** faces pressure from elevated inflation (7.8%) and a persistent current account deficit. **Cambodia (B+)** remains lower-rated due to its wide external deficit.\n\nThe two indicators most correlated with rating movements are inflation and the current account balance.',
          suggestedMetrics: CI_METRIC_CARDS,
          sources: 2,
          sourceCards: [
            { type: 'dataset', title: 'Country Credit Profiles and Ratings (CSV)', description: 'ADB-maintained sovereign credit rating history and outlook across all DMCs.', updatedAt: '15 Jul 2026' },
            { type: 'dataset', title: 'Key Indicators Database (KIDB)',            description: 'ADB flagship time-series database — macroeconomic indicators for all DMCs.', updatedAt: '30 Jun 2026' },
          ],
          actions: ['Add GDP Growth card', 'Add Debt-to-GDP card'],
        });
      },
    );
  }

  addMetricToDashboard(key: string, label: string): void {
    if (this.addedMetricKeys().has(key)) return;
    this.addedMetricKeys.update(s => new Set([...s, key]));

    const isFirst = this.ciDashboardCards().length === 0;
    if (isFirst) {
      this.ciDashboardBuilding.set(true);
      this.previewCtx.set('ci-dashboard');
      this.previewMode = 'Dashboard';
      this.cdr.markForCheck();
      setTimeout(() => {
        this.ciDashboardCards.update(cards => [...cards, { key: key as IndicatorKey, label }]);
        this.ciDashboardBuilding.set(false);
        this.cdr.markForCheck();
      }, 1600);
    } else {
      this.ciDashboardCards.update(cards => [...cards, { key: key as IndicatorKey, label }]);
      this.cdr.markForCheck();
    }
  }

  ciObs(key: IndicatorKey): KidbObs[]  { return ciObsForKey(key); }
  ciInsight(key: IndicatorKey): string | undefined {
    return CI_AI_INSIGHTS[key]?.[this.ciDashboardEconomy()];
  }
}
