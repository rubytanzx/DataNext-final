import { Injectable, signal, computed } from '@angular/core';
import { WorkspaceCard } from '../features/notebooks/notebooks.component';

const BASE_CARDS: WorkspaceCard[] = [
  {
    id: '1',
    title: 'Country Intelligence',
    description: 'Explore economic indicators, country strategies, credit profiles, and market outlooks across ADB member economies',
    image: '/uc-country.png',
    datasets: 8, platforms: 2, tools: 1,
    status: 'draft', region: 'Global', author: 'ERDI',
    keyAssets: [
      'Key Indicators Database (KIDB)', 'IMF World Economic Outlook', 'IMF Exchange Rates',
      'Country Mappings', 'Country Credit Profiles and Ratings (CSV)',
      'Poverty and Social Analysis (PSA)', 'ADB Project Summaries', 'Crimson (CRM)',
    ],
  },
  {
    id: '2',
    title: 'Southeast Asia Transport Portfolio',
    description: 'Track active transport projects, procurement records, disbursement performance, and lessons learned across Southeast Asia.',
    image: '/uc-project.png',
    datasets: 5, platforms: 2, tools: 2,
    status: 'published', region: 'Global', author: 'IED',
    keyAssets: [
      'ADB Project Data Sheets Data Product', 'ADB Project Summaries',
      'Project Procurement and Contracts Dataset', 'Project Funding and Disbursement Dataset',
      'EVA Lessons from past ADB projects',
    ],
  },
  {
    id: '3',
    title: 'Sector Intelligence',
    description: 'Discover sector data and insights across energy, transport, water, urban development, and social protection',
    image: '/uc-sector.png',
    datasets: 6, platforms: 3, tools: 3,
    status: 'draft', region: 'Pan-Asia Pacific', author: 'ERDI',
    keyAssets: [
      'ADB Document Registry', 'ADB Searchable Document Corpus', 'Transport Document Corpus',
      'Water and Urban Development Document Corpus', 'Social Protection Indicators (SPI)',
      'Social Protection Indicators of Coverage and Effectiveness (SPICES)',
    ],
  },
  {
    id: '4',
    title: 'Climate & Sustainability',
    description: 'Assess climate risk, disaster exposure, cyclone and flood hazards, and ESG data for Pacific and Asian DMCs',
    image: '/uc-climate.png',
    datasets: 15, platforms: 1, tools: 2,
    status: 'draft', region: 'Pacific', author: 'CCSD',
    keyAssets: [
      'CookIslands_Assets', 'CookIslands_Flood_RCP85', 'Tongatapu_Coastal_Inundation_Risk',
      'Tongatapu_Flood_RiskResult', 'Tongatapu_Earthquake_RiskResult',
      'Vanuatu_Cyclone_ARI500_SSP2_4.5_Year2050', 'Vanuatu_Coastal_Flood_ARI100_SLR0m',
      'Climate and Disaster Risk Document Corpus',
    ],
  },
  {
    id: '5',
    title: 'Asia-Pacific Economic Brief',
    description: 'Synthesise macroeconomic outlooks, sovereign credit profiles, and growth forecasts into structured briefing notes for decision-makers.',
    image: '/uc-country.png',
    datasets: 6, platforms: 1, tools: 1,
    status: 'draft', region: 'Global', author: 'ERDI',
    keyAssets: [
      'Key Indicators Database (KIDB)', 'IMF World Economic Outlook',
      'Country Credit Profiles and Ratings (CSV)', 'IMF Exchange Rates',
      'ADB Country Strategies', 'Asian Development Outlook',
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly _cards = signal<WorkspaceCard[]>(BASE_CARDS);

  readonly cards = computed(() => this._cards());

  fork(sourceTitle: string, sourceId: string, meta?: Partial<WorkspaceCard>): WorkspaceCard {
    const id = `fork-${Date.now()}`;
    const card: WorkspaceCard = {
      id,
      title: `Copy of ${sourceTitle}`,
      description: meta?.description ?? `Forked from ${sourceTitle}.`,
      image: meta?.image ?? '/uc-country.png',
      datasets: meta?.datasets ?? 0,
      platforms: meta?.platforms ?? 0,
      tools: meta?.tools ?? 0,
      status: 'draft',
      region: meta?.region,
      author: meta?.author,
      keyAssets: meta?.keyAssets,
    };
    this._cards.update(cards => [card, ...cards]);
    return card;
  }

  create(title: string, meta?: Partial<WorkspaceCard>): WorkspaceCard {
    const id = `new-${Date.now()}`;
    const card: WorkspaceCard = {
      id,
      title,
      description: meta?.description ?? '',
      image: meta?.image ?? '/uc-country.png',
      datasets: meta?.datasets ?? 0,
      platforms: meta?.platforms ?? 0,
      tools: meta?.tools ?? 0,
      status: 'draft',
      region: meta?.region,
      author: meta?.author,
      keyAssets: meta?.keyAssets,
    };
    this._cards.update(cards => [card, ...cards]);
    return card;
  }

  add(card: WorkspaceCard): void {
    this._cards.update(cards => [card, ...cards]);
  }

  get(id: string): WorkspaceCard | undefined {
    return this._cards().find(c => c.id === id);
  }
}
