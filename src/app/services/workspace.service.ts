import { Injectable, signal, computed } from '@angular/core';
import { WorkspaceCard } from '../features/notebooks/notebooks.component';

const BASE_CARDS: WorkspaceCard[] = [
  {
    id: 'mission-prep',
    title: 'Mission Preparation',
    description: 'End-to-end workspace for ADB project administration missions — configure by mission type, country, and project to generate clearance documents, mission materials, and BTOR drafts.',
    image: '/uc-project.png',
    datasets: 6, platforms: 2, tools: 3,
    status: 'published',
    region: 'Global',
    author: 'PARD / SERD',
    keyAssets: [
      'ADB Project Data Sheets Data Product',
      'Project Funding and Disbursement Dataset',
      'Project Procurement and Contracts Dataset',
      'ADB Country Strategies',
      'Key Indicators Database (KIDB)',
      'EVA Lessons from past ADB projects',
    ],
  },
  {
    id: 'fork-mission-ph',
    title: 'Philippines Transport Mission — Oct 2026',
    description: 'Project review mission for Metro Manila Urban Transport Project, 15–19 October 2026. Personal workspace branched from Mission Preparation template.',
    image: '/uc-project.png',
    datasets: 6, platforms: 2, tools: 3,
    status: 'draft',
    region: 'Southeast Asia',
    author: 'NT',
    keyAssets: [
      'ADB Project Data Sheets Data Product',
      'Project Funding and Disbursement Dataset',
      'Project Procurement and Contracts Dataset',
      'ADB Country Strategies',
      'Key Indicators Database (KIDB)',
      'EVA Lessons from past ADB projects',
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
