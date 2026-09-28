import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { WorkspaceService } from '../../services/workspace.service';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { PrimaryBtnDirective } from '../../shared/ui/primary-btn/primary-btn.directive';

export interface WorkspaceCard {
  id: string;
  title: string;
  description: string;
  image: string;
  datasets: number;
  platforms: number;
  tools: number;
  status: 'draft' | 'published';
  region?: string;
  author?: string;
  keyAssets?: string[];
}

export interface RecentItem {
  id: string;
  title: string;
  type: string;
  typeColor: 'blue' | 'violet' | 'amber' | 'teal' | 'rose';
  accessedAt: string;
  icon: 'dataset' | 'agent' | 'dashboard' | 'api' | 'notebook';
  description?: string;
  rating?: string;
  users?: string;
  downloads?: string;
  restricted?: boolean;
  image?: string;
}

export interface ContributionItem {
  id: string;
  title: string;
  description: string;
  type: string;
  typeColor: 'blue' | 'violet' | 'amber' | 'teal';
  status: 'published' | 'pending' | 'draft';
  downloads: number;
  uploadedAt: string;
  slug?: string;
}

export type MainTab = 'chats' | 'assets' | 'notebooks';
export type AssetsSubTab = 'saved' | 'history' | 'contributions';


const RECENT_ITEMS: RecentItem[] = [
  {
    id: 'r1',
    title: 'ASEAN Urban Water Quality Index',
    type: 'Dataset',
    typeColor: 'blue',
    accessedAt: '2 hours ago',
    icon: 'dataset',
    description: 'Composite index tracking urban water quality — turbidity, pH, dissolved oxygen, and contamination across 47 ASEAN municipalities.',
    rating: '4.6',
    users: '1.2k',
    downloads: '312',
  },
  {
    id: 'r2',
    title: 'Country Intelligence Workspace',
    type: 'Space',
    typeColor: 'rose',
    accessedAt: 'Yesterday',
    icon: 'notebook',
    description: 'Explore economic indicators, country strategies, credit profiles, and market outlooks across ADB member economies.',
    image: '/uc-country.png',
  },
  {
    id: 'r3',
    title: 'SDR Climate Mitigation Advisor',
    type: 'AI Agent',
    typeColor: 'violet',
    accessedAt: '2 days ago',
    icon: 'agent',
    description: 'AI-powered advisor for climate mitigation strategies and SDR-aligned project recommendations across ADB member states.',
    rating: '4.8',
    users: '634',
    downloads: '89',
  },
  {
    id: 'r4',
    title: 'SDG Global Indicators Monitor',
    type: 'Dashboard',
    typeColor: 'amber',
    accessedAt: '3 days ago',
    icon: 'dashboard',
    description: 'Live monitoring dashboard for SDG progress indicators, aggregated from UN, WHO, World Bank, and ADB datasets.',
    rating: '4.5',
    users: '1.4k',
    downloads: '680',
  },
  {
    id: 'r5',
    title: 'Geospatial Flooding Risk Engine',
    type: 'API',
    typeColor: 'teal',
    accessedAt: '1 week ago',
    icon: 'api',
    description: 'Programmatic access to geospatial flood risk assessments, return period analysis, and inundation damage estimation models.',
    rating: '4.3',
    users: '287',
    downloads: '156',
  },
  {
    id: 'r6',
    title: 'Asia Pacific Energy Statistics 2024',
    type: 'Dataset',
    typeColor: 'blue',
    accessedAt: '1 week ago',
    icon: 'dataset',
    description: 'Comprehensive energy statistics for Asia-Pacific economies — production, consumption, trade flows, and installed capacity data.',
    rating: '4.7',
    users: '2.1k',
    downloads: '891',
  },
];

const CONTRIBUTIONS: ContributionItem[] = [
  {
    id: 'c1',
    title: 'ASEAN Urban Water Quality Index',
    description: 'Composite monitoring dataset tracking urban water quality across ASEAN member states — turbidity, pH, dissolved oxygen, and contamination indicators from 47 municipal systems.',
    type: 'Dataset',
    typeColor: 'blue',
    status: 'published',
    downloads: 312,
    uploadedAt: 'Jan 2026',
    slug: 'asean-urban-water-quality',
  },
  {
    id: 'c2',
    title: 'Southeast Asia Infrastructure Index',
    description: 'Composite index measuring infrastructure quality, investment flows and connectivity across ASEAN member states',
    type: 'Dataset',
    typeColor: 'blue',
    status: 'published',
    downloads: 89,
    uploadedAt: 'Nov 2025',
    slug: 'sea-infrastructure-index',
  },
  {
    id: 'c3',
    title: 'Climate Finance Tracker API',
    description: 'Programmatic access to climate finance commitments, disbursements and project pipelines for DMCs',
    type: 'API',
    typeColor: 'teal',
    status: 'pending',
    downloads: 0,
    uploadedAt: 'Mar 2026',
  },
];

@Component({
  selector: 'app-notebooks',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetCardComponent, PrimaryBtnDirective],
  templateUrl: './notebooks.component.html',
  styleUrl: './notebooks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotebooksComponent implements OnInit {
  readonly router           = inject(Router);
  readonly route            = inject(ActivatedRoute);
  readonly chatService      = inject(ChatService);
  readonly workspaceService = inject(WorkspaceService);

  mainTab     = signal<MainTab>('chats');
  assetsSubTab = signal<AssetsSubTab>('saved');
  statusTab   = signal<'draft' | 'published'>('draft');
  chatSearch = '';
  recentSearch = '';

  savedIds = signal<Set<string>>(
    new Set(RECENT_ITEMS.filter(i => i.type !== 'Space').map(i => i.id))
  );

  readonly statusOptions = [
    { label: 'Drafts',    value: 'draft' as const },
    { label: 'Published', value: 'published' as const },
  ];

  readonly workspaceCards = this.workspaceService.cards;
  readonly recentItems    = RECENT_ITEMS;
  readonly contributions  = CONTRIBUTIONS;

  readonly contribStats = computed(() => {
    const published = CONTRIBUTIONS.filter(c => c.status === 'published').length;
    const totalDownloads = CONTRIBUTIONS.reduce((s, c) => s + c.downloads, 0);
    const impact = totalDownloads >= 200 ? 'Top Contributor' : totalDownloads >= 100 ? 'Active Contributor' : 'Rising Contributor';
    return { published, totalDownloads, impact };
  });

  cards = computed(() =>
    this.workspaceService.cards().filter(c => c.status === this.statusTab())
  );

  filteredChats = computed(() => {
    const q = this.chatSearch.toLowerCase().trim();
    const h = this.chatService.history();
    return q ? h.filter(i => i.question.toLowerCase().includes(q)) : h;
  });

  filteredRecent = computed(() => {
    const q = this.recentSearch.toLowerCase().trim();
    return q
      ? RECENT_ITEMS.filter(i =>
          i.title.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
        )
      : RECENT_ITEMS;
  });

  filteredSaved = computed(() =>
    RECENT_ITEMS.filter(i => i.type !== 'Space' && this.savedIds().has(i.id))
  );

  unsaveItem(id: string): void {
    const next = new Set(this.savedIds());
    next.delete(id);
    this.savedIds.set(next);
  }

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as MainTab | null;
    if (tab && ['chats', 'assets', 'notebooks'].includes(tab)) {
      this.mainTab.set(tab);
    }
  }

  stepState(status: string, stepIndex: number): 'done' | 'active' | 'pending' | 'complete' {
    const level = status === 'published' ? 3 : status === 'pending' ? 1 : 0;
    if (stepIndex < level) {
      return (status === 'published' && stepIndex === 2) ? 'complete' : 'done';
    }
    if (stepIndex === level) return 'active';
    return 'pending';
  }

  open(card: WorkspaceCard): void {
    this.router.navigate(['/notebooks', card.id]);
  }

  relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }

  viewSubmission(item: ContributionItem): void {
    this.router.navigate(['/contribute'], { queryParams: { submission: item.id } });
  }

  openChat(item: any): void {
    if (item.source === 'search') {
      this.router.navigate(['/search'], { queryParams: { q: item.question, tab: 'ai' } });
    } else if (item.source === 'contribute') {
      this.router.navigate(['/contribute']);
    } else {
      this.router.navigate([item.source === 'explorer' ? '/data-explorer' : '/']);
    }
  }
}
