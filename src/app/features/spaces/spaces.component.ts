import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export interface SpaceItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  iconColor?: string;
  datasets: number;
  tools: number;
  region: string;
  sector: string;
  access: 'all' | 'restricted';
  status: 'active' | 'draft';
  author?: string;
  updatedAt?: string;
}

const ALL_SPACES: SpaceItem[] = [
  {
    id: 'pacific',
    title: 'Pacific Risk Atlas',
    description: 'Flood, earthquake, tsunami, and coastal inundation risk datasets for Cook Islands, Tongatapu, and Vanuatu with infrastructure exposure layers.',
    image: '/uc-pacific.jpg',
    datasets: 22,
    tools: 1,
    region: 'Pacific',
    sector: 'Climate & Environment',
    access: 'all',
    status: 'active',
    author: 'Pacific Department',
    updatedAt: '2 days ago',
  },
  {
    id: '1',
    title: 'Country Intelligence',
    description: 'Explore economic indicators, country strategies, credit profiles, and market outlooks across ADB member economies.',
    image: '/uc-country.png',
    datasets: 8,
    tools: 1,
    region: 'Global',
    sector: 'Economic Research',
    access: 'all',
    status: 'draft',
    author: 'ERDI',
    updatedAt: '1 week ago',
  },
  {
    id: '2',
    title: 'Southeast Asia Transport Portfolio',
    description: 'Track active transport projects, procurement records, disbursement performance, and lessons learned across Southeast Asia.',
    image: '/uc-project.png',
    datasets: 5,
    tools: 2,
    region: 'Global',
    sector: 'Infrastructure',
    access: 'all',
    status: 'active',
    author: 'IED',
    updatedAt: '3 days ago',
  },
  {
    id: '3',
    title: 'Sector Intelligence',
    description: 'Discover sector data and insights across energy, transport, water, urban development, and social protection.',
    image: '/uc-sector.png',
    datasets: 6,
    tools: 3,
    region: 'Pan-Asia Pacific',
    sector: 'Infrastructure',
    access: 'all',
    status: 'draft',
    author: 'ERDI',
    updatedAt: '5 days ago',
  },
  {
    id: '4',
    title: 'Climate & Sustainability',
    description: 'Assess climate risk, disaster exposure, cyclone and flood hazards, and ESG data for Pacific and Asian DMCs.',
    image: '/uc-climate.png',
    datasets: 15,
    tools: 2,
    region: 'Pacific',
    sector: 'Climate & Environment',
    access: 'all',
    status: 'draft',
    author: 'CCSD',
    updatedAt: '1 week ago',
  },
  {
    id: 'transport',
    title: 'Transport & Connectivity',
    description: 'Aviation schedules, AIS vessel tracking, port emissions, cross-border movement, and urban mobility data across Asia and the Pacific.',
    image: '/uc-transport.jpg',
    datasets: 7,
    tools: 2,
    region: 'Southeast Asia',
    sector: 'Infrastructure',
    access: 'all',
    status: 'active',
    author: 'SERD',
    updatedAt: 'Today',
  },
  {
    id: 'finance',
    title: 'Procurement & Finance',
    description: 'Contracts, disbursements, tenders, sustainable procurement taxonomies, credit profiles, and IMF economic indicators.',
    image: '/uc-finance.jpg',
    datasets: 9,
    tools: 3,
    region: 'Global',
    sector: 'Economic Research',
    access: 'restricted',
    status: 'active',
    author: 'PPFD',
    updatedAt: 'Yesterday',
  },
  {
    id: 'social',
    title: 'Social & Inequality Analytics',
    description: 'Social protection coverage, wealth inequality, agricultural climate exposure, and social cost of the net-zero transition across DMCs.',
    image: '/uc-social.jpg',
    datasets: 5,
    tools: 1,
    region: 'South Asia',
    sector: 'Social Development',
    access: 'all',
    status: 'active',
    author: 'SPD',
    updatedAt: '3 days ago',
  },
  {
    id: 'energy',
    title: 'Pacific Energy Transition',
    description: 'Comprehensive datasets covering solar capacity, grid infrastructure, energy access, and climate financing flows across Pacific island states.',
    image: '/uc-pacific.jpg',
    datasets: 6,
    tools: 1,
    region: 'Pacific',
    sector: 'Energy',
    access: 'all',
    status: 'draft',
    author: 'Pacific Department',
    updatedAt: '2 weeks ago',
  },
  {
    id: 'urban',
    title: 'Southeast Asia Urban Development',
    description: 'Urban development indices, housing affordability, infrastructure quality, and service delivery metrics for ASEAN member economies.',
    image: '/uc-transport.jpg',
    datasets: 9,
    tools: 2,
    region: 'Southeast Asia',
    sector: 'Infrastructure',
    access: 'all',
    status: 'draft',
    author: 'SERD / Infrastructure',
    updatedAt: '2 weeks ago',
  },
];

const REGIONS = ['Pacific', 'Southeast Asia', 'South Asia', 'Central & West Asia', 'East Asia', 'Global', 'Pan-Asia Pacific'];
const SECTORS = ['Climate & Environment', 'Economic Research', 'Infrastructure', 'Social Development', 'Energy'];

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spaces.component.html',
  styleUrl: './spaces.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpacesComponent {
  private readonly router = inject(Router);

  readonly allSpaces = ALL_SPACES;
  readonly regions   = REGIONS;
  readonly sectors   = SECTORS;

  selectedRegions  = signal<Set<string>>(new Set());
  selectedSectors  = signal<Set<string>>(new Set());
  accessFilter     = signal<'all' | 'restricted' | null>(null);
  searchQuery      = signal('');
  regionsExpanded  = signal(true);
  sectorsExpanded  = signal(true);

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase().trim();
    const rr = this.selectedRegions();
    const ss = this.selectedSectors();
    const af = this.accessFilter();

    return ALL_SPACES.filter(sp => {
      if (sp.status !== 'active') return false;
      if (q && !sp.title.toLowerCase().includes(q) && !sp.description.toLowerCase().includes(q)) return false;
      if (rr.size > 0 && !rr.has(sp.region)) return false;
      if (ss.size > 0 && !ss.has(sp.sector)) return false;
      if (af && sp.access !== af) return false;
      return true;
    });
  });

  readonly activeFilterCount = computed(() => {
    return this.selectedRegions().size + this.selectedSectors().size +
           (this.accessFilter() ? 1 : 0);
  });

  toggleRegion(r: string) {
    const s = new Set(this.selectedRegions());
    if (s.has(r)) s.delete(r); else s.add(r);
    this.selectedRegions.set(s);
  }

  toggleSector(s: string) {
    const set = new Set(this.selectedSectors());
    if (set.has(s)) set.delete(s); else set.add(s);
    this.selectedSectors.set(set);
  }

  setAccess(v: 'all' | 'restricted') {
    this.accessFilter.set(this.accessFilter() === v ? null : v);
  }

  clearAll() {
    this.selectedRegions.set(new Set());
    this.selectedSectors.set(new Set());
    this.accessFilter.set(null);
  }

  open(sp: SpaceItem) {
    this.router.navigate(['/notebooks', sp.id]);
  }
}
