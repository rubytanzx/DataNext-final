import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AI_AGENTS, AI_TOOLS, PORTALS, DATA_ASSETS, API_ASSETS, PUBLIC_ASSETS, CatalogueAsset } from '../../data/catalogue.data';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { WidgetSelectionService } from '../../services/widget-selection.service';
import { WorkspaceService } from '../../services/workspace.service';

export type ItemType = 'Dataset' | 'Dashboard' | 'AI Agent' | 'AI Tool' | 'AI Product' | 'API' | 'Corpus Document';

interface SidebarOption  { label: string; checked: boolean; count?: number; }
interface GeoRegionGroup { name: string; expanded: boolean; checked: boolean; options: SidebarOption[]; }
interface SidebarGroup   { name: string; expanded: boolean; options: SidebarOption[]; geoGroups?: GeoRegionGroup[]; }

// Mirrors the filter panel on the Search page (src/app/features/search) for a
// consistent filtering UI across both. Same caveat as there: these groups are
// presentational/active-count-only, same as Search — they don't narrow
// `filtered()`, only `activeType`/`activeDept`/`searchQuery` do that.
const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    name: 'Trust Status',
    expanded: true,
    options: [
      { label: 'Responsible AI Verified',     checked: false, count: 15  },
      { label: 'Governance Verified',         checked: false, count: 46  },
      { label: 'Verification in Progress',    checked: false, count: 125 },
    ],
  },
  {
    name: 'Access',
    expanded: true,
    options: [
      { label: 'Public',        checked: false, count: 4   },
      { label: 'Internal ADB',  checked: false, count: 130 },
      { label: 'Restricted',    checked: false, count: 43  },
    ],
  },
  {
    name: 'Sector',
    expanded: false,
    options: [
      { label: 'Agriculture, Natural Resources, and Rural Development', checked: false, count: 8  },
      { label: 'Health',                                                 checked: false, count: 9  },
      { label: 'Information and Communication Technology',               checked: false, count: 4  },
      { label: 'Multisector',                                            checked: false, count: 94 },
      { label: 'Not sector-specific',                                    checked: false, count: 2  },
      { label: 'Transport',                                              checked: false, count: 12 },
      { label: 'Water and Other Urban Infrastructure and Services',      checked: false, count: 2  },
    ],
  },
  {
    name: 'Themes',
    expanded: false,
    options: [
      { label: 'Climate Action',                             checked: false },
      { label: 'Environmentally Sustainable Growth',         checked: false },
      { label: 'Gender Equality',                            checked: false },
      { label: 'Governance and Capacity Development',        checked: false },
      { label: 'Inclusive Economic Growth',                  checked: false },
      { label: 'Knowledge Solutions',                        checked: false },
      { label: 'Partnerships',                               checked: false },
      { label: 'Private Sector Development',                 checked: false },
      { label: 'Regional Cooperation and Public Goods',      checked: false },
      { label: 'Transition States and Engagement',           checked: false },
      { label: 'Digital Transformation',                     checked: false },
    ],
  },
  {
    name: 'Geographical Coverage',
    expanded: false,
    options: [],
    geoGroups: [
      {
        name: 'Central and West Asia', expanded: false, checked: false,
        options: [
          { label: 'Afghanistan',     checked: false },
          { label: 'Armenia',         checked: false },
          { label: 'Azerbaijan',      checked: false },
          { label: 'Georgia',         checked: false },
          { label: 'Kazakhstan',      checked: false },
          { label: 'Kyrgyz Republic', checked: false },
          { label: 'Pakistan',        checked: false },
          { label: 'Tajikistan',      checked: false },
          { label: 'Türkiye',         checked: false },
          { label: 'Turkmenistan',    checked: false },
          { label: 'Uzbekistan',      checked: false },
        ],
      },
      {
        name: 'East Asia', expanded: false, checked: false,
        options: [
          { label: 'Mongolia',                   checked: false },
          { label: "People's Republic of China", checked: false },
        ],
      },
      {
        name: 'South Asia', expanded: false, checked: false,
        options: [
          { label: 'Bangladesh', checked: false },
          { label: 'Bhutan',     checked: false },
          { label: 'India',      checked: false },
          { label: 'Maldives',   checked: false },
          { label: 'Nepal',      checked: false },
          { label: 'Sri Lanka',  checked: false },
        ],
      },
      {
        name: 'Southeast Asia', expanded: false, checked: false,
        options: [
          { label: 'Cambodia',                         checked: false },
          { label: 'Indonesia',                        checked: false },
          { label: "Lao People's Democratic Republic", checked: false },
          { label: 'Myanmar',                          checked: false },
          { label: 'Philippines',                      checked: false },
          { label: 'Thailand',                         checked: false },
          { label: 'Timor-Leste',                      checked: false },
          { label: 'Viet Nam',                         checked: false },
        ],
      },
      {
        name: 'The Pacific', expanded: false, checked: false,
        options: [
          { label: 'Cook Islands',                   checked: false },
          { label: 'Federated States of Micronesia', checked: false },
          { label: 'Fiji',                           checked: false },
          { label: 'Kiribati',                       checked: false },
          { label: 'Marshall Islands',               checked: false },
          { label: 'Nauru',                          checked: false },
          { label: 'Niue',                           checked: false },
          { label: 'Palau',                          checked: false },
          { label: 'Papua New Guinea',               checked: false },
          { label: 'Samoa',                          checked: false },
          { label: 'Solomon Islands',                checked: false },
          { label: 'Tonga',                          checked: false },
          { label: 'Tuvalu',                         checked: false },
          { label: 'Vanuatu',                        checked: false },
        ],
      },
    ],
  },
];

export interface CatalogueItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ItemType;
  department: string;
  access: 'Public' | 'ADB Only' | 'Restricted';
  rating: number;
  ratingCount: number;
  views: number;
  downloads: number;
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
  rai?: boolean;
  governanceVerified?: boolean;
  verificationInProgress?: boolean;
  format?: string;
  ingestionStatus?: string;
  parentProduct?: string;
  parentProductSlug?: string;
  sectorGroup?: string;
  region?: string;
  themes?: string[];
  unlisted?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function hashNum(str: string, min: number, max: number): number {
  const h = str.split('').reduce((a, c) => ((a * 31) + c.charCodeAt(0)) & 0xffff, 0);
  return min + (h % (max - min + 1));
}

function primaryDept(dept?: string): string {
  if (!dept) return 'AIBD';
  if (dept.includes('Climate Change')) return 'SDCC';
  if (dept === 'Country Genie') return 'AIBD';
  return dept.split(/[/,(]/)[0].trim();
}

const SECTOR_THEMES: Record<string, string[]> = {
  'Agriculture, Natural Resources, and Rural Development': ['Climate Action', 'Environmentally Sustainable Growth', 'Inclusive Economic Growth'],
  'Energy':                                               ['Climate Action', 'Environmentally Sustainable Growth'],
  'Transport':                                            ['Regional Cooperation and Public Goods', 'Inclusive Economic Growth'],
  'Water and Other Urban Infrastructure and Services':    ['Climate Action', 'Inclusive Economic Growth'],
  'Information and Communication Technology':             ['Digital Transformation', 'Knowledge Solutions'],
  'Public Sector Management':                             ['Governance and Capacity Development'],
  'Health':                                               ['Inclusive Economic Growth', 'Gender Equality'],
  'Finance':                                              ['Inclusive Economic Growth', 'Private Sector Development'],
  'Industry and Trade':                                   ['Private Sector Development', 'Inclusive Economic Growth'],
  'Multisector':                                          ['Partnerships', 'Knowledge Solutions'],
  'Not sector-specific':                                  ['Knowledge Solutions'],
};

// One wired item per asset type — shown in the horizontally-scrollable featured row
const FEATURED_NAMES = new Set([
  // Dataset — direct download (tabular preview)
  'ADB Careers Dataset',
  // Dataset — API access (satellite image preview)
  'Nighttime Light Intensity Dataset',
  // API — open access
  'ADB OpenData API',
  // API — restricted, try with sample data
  'Geospatial Flooding Risk Engine',
  // AI Agent — open
  'Agentic Orchestration (CLARA)',
  // AI Agent — restricted, try with sample data
  'Climate Analytics Agent',
  // AI Tool — open
  'Intelligent File Search',
  // AI Tool — restricted, request access only
  'ADB People Profile',
  // AI Agent — restricted, request access only
  'ADB Language Checker',
  // AI Platform
  'RAI Platform',
]);

// Catalogue slugs that don't match the asset-detail slug (name was changed or diverged)
const SLUG_OVERRIDES: Record<string, string> = {
  'social-protection-indicators-dataset':       'social-protection-indicators',
  'maritime-vessel-movement-ais-dataset':       'maritime-vessel-movement-ais-ungp-dataset',
  'flights-data-from-oag':                      'air-connectivity-flight-movement-dataset',
};

// All asset-detail slugs that have a fully-wired detail page
const WIRED_SLUGS = new Set([
  'asean-urban-water-quality',
  'sdr-climate-mitigation-advisor',
  'sdg-global-indicators-monitor',
  'geospatial-flooding-risk-engine',
  'nighttime-light-intensity-dataset',
  'flights-data-from-oag',
  'sea-infrastructure-index',
  'social-protection-indicators',
  'adb-navigator',
  'intelligent-file-search',
  'adb-genie',
  'egis-platform',
  'marine-activity-tropical-cyclone-dataset',
  'maritime-vessel-movement-ais-ungp-dataset',
  'adb-careers-dataset',
  'adb-enterprise-document-registry-dataset',
  'adb-key-indicators-database-kidb',
  'adb-language-checker',
  'agentic-orchestration-clara',
  'climate-analytics-agent',
  'adb-language-retrieval',
  'adb-people-profile',
  'adb-staff-responsibility-retrieval',
  'pdf-extraction',
  'geospatial-retrieval',
  'sector-search',
  'thematic-search',
  'adb-opendata-api',
  'climate-finance-tracker-api',
  'rai-platform',
]);

const NEW_NAMES = new Set([
  'Agentic Orchestration (CLARA)',
  'Responsible AI Agent',
  'AI Diffusion & Workforce Transformation',
]);

function mapAsset(asset: CatalogueAsset, idx: number): CatalogueItem {
  const type = asset.type === 'Catalogue' ? 'AI Product' : asset.type as ItemType;
  const tags = [asset.sector_group].filter(Boolean) as string[];
  return {
    id: `asset-${idx}`,
    slug: slugify(asset.name),
    title: asset.name,
    description: asset.description,
    type,
    department: primaryDept(asset.department),
    access: asset.access === 'open' ? 'Public' : asset.access === 'all' ? 'ADB Only' : 'Restricted',
    rating: Math.round(hashNum(asset.name, 38, 50)) / 10,
    ratingCount: hashNum(asset.name, 42, 620),
    views: hashNum(asset.name, 300, 14000),
    downloads: hashNum(asset.name + '_dl', 40, 2800),
    tags,
    featured: FEATURED_NAMES.has(asset.name),
    isNew: NEW_NAMES.has(asset.name),
    rai: asset.trust_status === 'Responsible AI Verified' || asset.trust_status === 'Both',
    governanceVerified: asset.trust_status === 'Governance Verified' || asset.trust_status === 'Both',
    verificationInProgress: (type === 'AI Agent' || type === 'AI Tool' || type === 'AI Product') &&
      asset.trust_status !== 'Responsible AI Verified' &&
      asset.trust_status !== 'Governance Verified' &&
      asset.trust_status !== 'Both',
    format: asset.format,
    ingestionStatus: asset.ingestion_status,
    parentProduct: asset.parent_product,
    parentProductSlug: asset.parent_product ? slugify(asset.parent_product) : undefined,
    sectorGroup: asset.sector_group,
    region: asset.region_group ?? asset.region,
    themes: SECTOR_THEMES[asset.sector_group ?? ''] ?? [],
    unlisted: asset.unlisted,
  };
}

const ASSETS: CatalogueItem[] = [
  ...DATA_ASSETS,
  ...AI_AGENTS,
  ...AI_TOOLS,
  ...API_ASSETS,
  ...PORTALS,
  ...PUBLIC_ASSETS,
].map(mapAsset);

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetCardComponent],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueComponent implements OnInit {
  private readonly router           = inject(Router);
  private readonly route            = inject(ActivatedRoute);
  private readonly widgetSvc        = inject(WidgetSelectionService);
  private readonly workspaceSvc     = inject(WorkspaceService);

  readonly typeOptions: string[] = ['All', 'Dataset', 'AI Agent', 'AI Tool', 'AI Product', 'API', 'Corpus Document'];

  readonly deptOptions: string[] = [
    'All', 'AIBD', 'BPMSD', 'CCSD', 'DOC', 'IED', 'ITOP', 'ITD', 'OPR', 'ORM', 'SPD',
  ];

  activeType  = signal<string>('All');
  activeDept  = signal<string>('All');
  searchQuery = signal('');
  showNewOnly = signal(false);
  featuredScrolled = signal(false);
  featuredAtEnd    = signal(false);

  // Notebook dropdown & save state
  openDropdownId  = signal<string | null>(null);
  savedIds        = signal(new Set<string>());
  addedSnack      = signal<string | null>(null);
  private snackTimer?: ReturnType<typeof setTimeout>;

  readonly notebooks: { id: string; label: string }[] = [
    { id: '5', label: 'Asia-Pacific Economic Brief' },
    { id: '3', label: 'Sector Intelligence' },
    { id: '4', label: 'Climate & Sustainability' },
  ];

  toggleAddDropdown(itemId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdownId.set(this.openDropdownId() === itemId ? null : itemId);
  }

  addToNewNotebook(item: CatalogueItem, event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdownId.set(null);
    this.widgetSvc.pendingAsset.set(this.itemToWidget(item));
    const card = this.workspaceSvc.create('New Workspace', { datasets: 1 });
    this.router.navigate(['/notebooks', card.id]);
  }

  addToExistingNotebook(item: CatalogueItem, nb: { id: string; label: string }, event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdownId.set(null);
    this.widgetSvc.pendingAsset.set(this.itemToWidget(item));
    this.router.navigate(['/notebooks', nb.id]);
  }

  private itemToWidget(item: CatalogueItem) {
    return {
      id: item.id,
      widgetType: 'asset' as const,
      title: item.title,
      description: item.description,
      assetType: 'data' as const,
      displayType: item.type,
    };
  }

  private showSnack(msg: string): void {
    clearTimeout(this.snackTimer);
    this.addedSnack.set(msg);
    this.snackTimer = setTimeout(() => this.addedSnack.set(null), 3000);
  }

  toggleSave(itemId: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = new Set(this.savedIds());
    next.has(itemId) ? next.delete(itemId) : next.add(itemId);
    this.savedIds.set(next);
  }

  @HostListener('document:click')
  closeAllDropdowns(): void { this.openDropdownId.set(null); }

  onFeaturedScroll(el: EventTarget | null): void {
    if (!el) return;
    const e = el as HTMLElement;
    this.featuredScrolled.set(e.scrollLeft > 0);
    this.featuredAtEnd.set(e.scrollLeft + e.clientWidth >= e.scrollWidth - 4);
  }

  get searchValue(): string  { return this.searchQuery(); }
  set searchValue(v: string) { this.searchQuery.set(v); }

  // ── Filter panel (mirrors Search page) ────────────────────────────────────
  sidebarGroups: SidebarGroup[] = SIDEBAR_GROUPS.map(g => ({ ...g, options: g.options.map(o => ({ ...o })) }));
  readonly sidebarVersion = signal(0);

  readonly capabilityOptions: ItemType[] = ['Dataset', 'AI Agent', 'AI Tool', 'AI Product', 'API'];
  readonly inScopeTypes = new Set(['Dataset', 'AI Agent', 'AI Tool', 'AI Product', 'API']);
  selectedCapabilities = new Set<string>();
  accessMode: 'Public' | 'ADB Only' | 'Restricted' | null = null;
  geoTags: string[] = [];
  geoInput = '';
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
    this.sidebarVersion.update(v => v + 1);
  }

  onYearToChange(value: number): void {
    this.yearTo = Math.max(value, this.yearFrom);
    this.sidebarVersion.update(v => v + 1);
  }

  hasSidebarSelections(group: SidebarGroup): boolean {
    if (group.options.some(o => o.checked)) return true;
    return (group.geoGroups ?? []).some(rg => rg.checked || rg.options.some(o => o.checked));
  }

  toggleSidebarGroup(group: SidebarGroup): void {
    group.expanded = !group.expanded;
  }

  clearSidebarGroup(group: SidebarGroup, e: Event): void {
    e.stopPropagation();
    group.options.forEach(o => o.checked = false);
    (group.geoGroups ?? []).forEach(rg => {
      rg.checked = false;
      rg.options.forEach(o => o.checked = false);
    });
    this.sidebarVersion.update(v => v + 1);
  }

  toggleGeoRegion(rg: GeoRegionGroup): void {
    rg.checked = !rg.checked;
    rg.options.forEach(o => o.checked = rg.checked);
    this.sidebarVersion.update(v => v + 1);
  }

  onGeoCountryChange(rg: GeoRegionGroup): void {
    rg.checked = rg.options.every(o => o.checked);
    this.sidebarVersion.update(v => v + 1);
  }

  toggleCapability(label: string): void {
    const s = new Set(this.selectedCapabilities);
    s.has(label) ? s.delete(label) : s.add(label);
    this.selectedCapabilities = s;
    this.sidebarVersion.update(v => v + 1);
  }

  clearCapabilities(): void {
    this.selectedCapabilities = new Set();
    this.sidebarVersion.update(v => v + 1);
  }

  setAccess(mode: 'Public' | 'ADB Only' | 'Restricted'): void {
    this.accessMode = this.accessMode === mode ? null : mode;
    this.sidebarVersion.update(v => v + 1);
  }

  clearAccess(): void {
    this.accessMode = null;
    this.sidebarVersion.update(v => v + 1);
  }

  addGeoTag(e: KeyboardEvent): void {
    if (e.key !== 'Enter' || !this.geoInput.trim()) return;
    e.preventDefault();
    this.geoTags = [...this.geoTags, this.geoInput.trim()];
    this.geoInput = '';
    this.sidebarVersion.update(v => v + 1);
  }

  removeGeoTag(i: number): void {
    this.geoTags = this.geoTags.filter((_, idx) => idx !== i);
    this.sidebarVersion.update(v => v + 1);
  }

  clearGeoTags(): void {
    this.geoTags = [];
    this.sidebarVersion.update(v => v + 1);
  }

  clearYearRange(): void {
    this.yearFrom = 2015;
    this.yearTo = 2026;
    this.sidebarVersion.update(v => v + 1);
  }

  get activeFilterCount(): number {
    let n = 0;
    if (this.activeType() !== 'All') n++;
    if (this.activeDept() !== 'All') n++;
    for (const g of this.sidebarGroups) {
      n += g.options.filter(o => o.checked).length;
      for (const rg of g.geoGroups ?? []) {
        if (rg.checked) n++;
        else n += rg.options.filter(o => o.checked).length;
      }
    }
    n += this.selectedCapabilities.size;
    if (this.accessMode) n++;
    n += this.geoTags.length;
    if (this.yearFrom !== 2015 || this.yearTo !== 2026) n++;
    return n;
  }

  readonly typeCounts = computed(() => {
    const visible = ASSETS.filter(a => a.type !== 'Dashboard');
    const counts: Record<string, number> = { All: visible.length };
    for (const t of this.typeOptions.slice(1)) {
      counts[t] = visible.filter(a => a.type === t).length;
    }
    return counts;
  });

  readonly filtered = computed(() => {
    void this.sidebarVersion();
    const type  = this.activeType();
    const dept  = this.activeDept();
    const query = this.searchQuery().toLowerCase().trim();

    const checkedTrust  = this.sidebarGroups[0].options.filter(o => o.checked).map(o => o.label);
    const checkedAccess = this.sidebarGroups[1].options.filter(o => o.checked).map(o => o.label);
    const checkedSector = this.sidebarGroups[2].options.filter(o => o.checked).map(o => o.label);
    const checkedThemes = this.sidebarGroups[3].options.filter(o => o.checked).map(o => o.label);
    const geo = this.sidebarGroups[4];
    const checkedRegion: string[] = (geo.geoGroups ?? [])
      .filter(rg => rg.checked || rg.options.some(o => o.checked))
      .map(rg => rg.name);

    return ASSETS.filter(a => {
      if (a.type === 'Dashboard') return false;
      if (type !== 'All' && a.type !== type) return false;
      if (dept !== 'All' && a.department !== dept) return false;
      if (query) {
        const hay = `${a.title} ${a.description} ${a.department}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (checkedTrust.length) {
        const matchesRai  = checkedTrust.includes('Responsible AI Verified') && !!a.rai;
        const matchesGov  = checkedTrust.includes('Governance Verified') && !!a.governanceVerified;
        const matchesNone = checkedTrust.includes('Verification in Progress') && !!a.verificationInProgress;
        if (!matchesRai && !matchesGov && !matchesNone) return false;
      }
      if (checkedAccess.length) {
        const accessMap: Record<string, string> = { 'Public': 'Public', 'Internal ADB': 'ADB Only', 'Restricted': 'Restricted' };
        if (!checkedAccess.some(l => accessMap[l] === a.access)) return false;
      }
      if (checkedSector.length && !checkedSector.includes(a.sectorGroup ?? '')) return false;
      if (checkedThemes.length && !checkedThemes.some(t => (a.themes ?? []).includes(t))) return false;
      if (checkedRegion.length && !checkedRegion.includes(a.region ?? '')) return false;
      if (this.selectedCapabilities.size > 0 && !this.selectedCapabilities.has(a.type)) return false;
      if (this.accessMode && a.access !== this.accessMode) return false;
      if (this.showNewOnly() && !a.isNew) return false;
      return true;
    });
  });

  readonly hasFilters = computed(() => {
    void this.sidebarVersion();
    return (
      this.activeType() !== 'All' ||
      this.activeDept() !== 'All' ||
      this.searchQuery().trim() !== '' ||
      this.sidebarGroups.some(g =>
        g.options.some(o => o.checked) ||
        (g.geoGroups ?? []).some(rg => rg.checked || rg.options.some(o => o.checked))
      ) ||
      this.selectedCapabilities.size > 0 ||
      this.accessMode !== null ||
      this.geoTags.length > 0 ||
      this.yearFrom !== 2015 ||
      this.yearTo !== 2026 ||
      this.showNewOnly()
    );
  });

  readonly sections = computed(() => {
    if (this.hasFilters()) {
      const type  = this.activeType();
      const dept  = this.activeDept();
      const query = this.searchQuery().trim();

      let label = 'Results';
      if (!query) {
        if (type !== 'All' && dept !== 'All') {
          label = `${type}s · ${dept}`;
        } else if (type !== 'All') {
          label = `${type}s`;
        } else if (dept !== 'All') {
          label = `${dept} Assets`;
        }
      }

      return [{ label, type: '', items: this.filtered() }];
    }
    const types: ItemType[] = ['Dataset', 'AI Agent', 'AI Tool', 'AI Product', 'API', 'Corpus Document'];
    return types
      .map(t => ({ label: `${t}s`, type: t, items: ASSETS.filter(a => a.type === t) }))
      .filter(s => s.items.length > 0);
  });

  readonly featuredItems = computed(() => ASSETS.filter(a => a.featured));

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type && this.typeOptions.includes(type)) {
      this.activeType.set(type);
    }
  }

  typeSlug(type: string): string {
    return type.toLowerCase().replace(/\s+/g, '-');
  }

  tagColor(type: string): 'blue' | 'violet' | 'amber' | 'teal' {
    const m: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'AI Product': 'blue', 'Catalogue': 'blue', 'Corpus Document': 'blue',
      'AI Agent': 'violet', 'AI Tool': 'violet',
      'Dashboard': 'amber',
      'API': 'teal',
    };
    return m[type] ?? 'blue';
  }

  accessSlug(access: string): string {
    if (access === 'Public') return 'public';
    if (access === 'ADB Only') return 'adb-only';
    return 'restricted';
  }

  formatViews(v: number): string {
    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
  }

  setType(type: string) { this.activeType.set(type); }
  setDept(dept: string) { this.activeDept.set(dept); }

  clearFilters() {
    this.activeType.set('All');
    this.activeDept.set('All');
    this.searchQuery.set('');
    this.sidebarGroups.forEach(g => {
      g.options.forEach(o => o.checked = false);
      (g.geoGroups ?? []).forEach(rg => {
        rg.checked = false;
        rg.options.forEach(o => o.checked = false);
      });
    });
    this.selectedCapabilities = new Set();
    this.accessMode = null;
    this.geoTags = [];
    this.yearFrom = 2015;
    this.yearTo   = 2026;
    this.showNewOnly.set(false);
    this.sidebarVersion.update(v => v + 1);
  }

  openAsset(item: CatalogueItem) {
    const resolved = SLUG_OVERRIDES[item.slug] ?? item.slug;
    const slug = WIRED_SLUGS.has(resolved) ? resolved : (
      item.type === 'AI Agent' ? 'agentic-orchestration-clara' :
      item.type === 'AI Tool'  ? 'intelligent-file-search'     :
      resolved
    );
    this.router.navigate(['/assets', slug]);
  }

  browseNew() {
    this.clearFilters();
    this.showNewOnly.set(true);
  }
}
