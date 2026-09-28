import { Component, signal, inject, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { PrimaryBtnDirective } from '../../shared/ui/primary-btn/primary-btn.directive';
import { PromptBarComponent } from '../../shared/ui/prompt-bar/prompt-bar.component';
import { AuroraLightComponent } from '../../shared/ui/aurora-light/aurora-light.component';
import * as THREE from 'three';

const SPHERE_VERT = `
attribute float sPhi;
attribute float sTheta;
uniform float uTime;
uniform float uDpr;
varying float vCamZ;
varying float vColorT;

vec3 deform(float phi, float theta, float t) {
  float dx = sin(phi * 1.7 + theta * 0.9 + t * 0.29) * 0.40
           + sin(phi * 0.6 - theta * 1.5 - t * 0.22) * 0.26;
  float dy = sin(theta * 1.5 + phi * 1.2 - t * 0.25) * 0.40
           + sin(phi * 2.1 - theta * 0.7 + t * 0.20) * 0.26;
  float dz = sin(phi * 1.3 + theta * 2.0 + t * 0.23) * 0.40
           + sin(theta * 0.8 - phi * 1.8 - t * 0.18) * 0.26;
  dx += sin(phi * 3.1 + theta * 1.8 - t * 0.40) * 0.13
      + sin(phi * 2.4 - theta * 2.7 + t * 0.33) * 0.08;
  dy += sin(theta * 3.4 - phi * 1.4 + t * 0.37) * 0.13
      + sin(phi * 3.7 + theta * 0.9 - t * 0.28) * 0.08;
  dz += sin(phi * 2.7 + theta * 3.1 - t * 0.34) * 0.13
      + sin(theta * 2.5 + phi * 2.2 + t * 0.26) * 0.08;
  dx += sin(phi * 5.2 + theta * 3.9 + t * 0.58) * 0.04;
  dy += sin(theta * 4.8 - phi * 4.3 - t * 0.53) * 0.04;
  dz += sin(phi * 4.6 + theta * 5.1 + t * 0.49) * 0.04;
  return vec3(dx, dy, dz);
}

void main() {
  float t = uTime;
  float bx = sin(sPhi) * cos(sTheta);
  float by = cos(sPhi);
  float bz = sin(sPhi) * sin(sTheta);
  vec3 d = deform(sPhi, sTheta, t);
  float R = 155.0;
  float breathe = 1.0 + sin(t * 0.18) * 0.04;
  vec3 pos = vec3(R * (bx + d.x), R * (by + d.y), R * (bz + d.z)) * breathe;
  float a = t * 0.035;
  float cosA = cos(a), sinA = sin(a);
  pos = vec3(pos.x * cosA - pos.z * sinA, pos.y, pos.x * sinA + pos.z * cosA);
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vCamZ = mvPos.z;
  float yNorm    = clamp(pos.y / (R * 1.9) + 0.5, 0.0, 1.0);
  float thetaNorm = sTheta / 6.2832;
  vColorT = yNorm * 0.82 + thetaNorm * 0.18;
  gl_PointSize = 2.4 * (500.0 / -mvPos.z) * uDpr;
  gl_Position  = projectionMatrix * mvPos;
}
`;

const SPHERE_FRAG = `
varying float vCamZ;
varying float vColorT;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float edge = 1.0 - smoothstep(0.40, 0.50, d);
  vec3 skyBlue  = vec3(0.329, 0.769, 0.929);
  vec3 adbBlue  = vec3(0.0,   0.490, 0.718);
  vec3 teal     = vec3(0.220, 0.690, 0.580);
  vec3 green    = vec3(0.643, 0.820, 0.396);
  vec3 color;
  float t = clamp(vColorT, 0.0, 1.0);
  if (t < 0.333) {
    color = mix(green, teal, t / 0.333);
  } else if (t < 0.667) {
    color = mix(teal, adbBlue, (t - 0.333) / 0.334);
  } else {
    color = mix(adbBlue, skyBlue, (t - 0.667) / 0.333);
  }
  float depth = clamp((-vCamZ - 240.0) / 610.0, 0.0, 1.0);
  float alpha  = mix(0.95, 0.22, depth) * edge;
  gl_FragColor = vec4(color, alpha);
}
`;

export type FilterGroupType = 'checkbox' | 'pills' | 'toggle' | 'tag-chip' | 'slider';

export interface FilterGroup {
  name: string;
  type: FilterGroupType;
  options?: string[];
  counts?: number[];
  expanded: boolean;
}

export interface AiPlatform {
  name: string;
  url: string;
  description: string;
  audience: string;
  rating: string;
  logoColor: string;
  logoText: string;
}

export interface DataCard {
  title: string;
  category: string;
  datasets: number;
  components: number;
  region: string;
  gradient: string;
}

export interface RecommendedCard {
  name: string;
  type: string;
  description: string;
  audience: string;
  rating: string;
  logoColor: string;
  logoText: string;
}

export interface TrendingCard {
  name: string;
  url: string;
  description: string;
  users: string;
  logoColor: string;
  logoText: string;
  rating: string;
}

export interface UpdatedCard {
  title: string;
  category: string;
  datasets: number;
  components: number;
  region: string;
  gradient: string;
  updatedLabel: string;
}

export interface TemplateCard {
  name: string;
  description: string;
  category: string;
  steps: number;
  iconColor: string;
}

const AI_PLATFORMS: AiPlatform[] = [
  {
    name: 'Responsible AI Platform',
    url: 'rai.adb.org',
    description: 'An AI-powered agentic platform that operationalizes ADB\'s Responsible AI Framework by enabling structured evaluation of AI use cases through adaptive risk assessments, ensuring informed and consistent decisions.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#007DB7',
    logoText: 'ADB',
  },
  {
    name: 'Navigator',
    url: 'navigator.adb.org/knowledge',
    description: 'An employee assistant available to all staff, designed to help access ADB resources and documents, use internal services like leave filing and loan requests, discover people for collaboration, and answer general queries.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#5C6BC0',
    logoText: '⊕',
  },
  {
    name: 'Powered by Genie',
    url: 'genie.adb.org',
    description: 'A specialist tool for advanced research support. Genie (Research Assistant) helps summarize development research, answer expert-level questions, compare results across AI models, and use multiple AI agents for targeted inquiries.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#1565C0',
    logoText: 'G',
  },
];

const DATA_COLLECTIONS: DataCard[] = [
  {
    title: 'Climate Resilience Risk Index — Pacific SIDS',
    category: 'Climate Change & Sustainable Development',
    datasets: 8,
    components: 3,
    region: 'Pacific',
    gradient: 'linear-gradient(155deg, #1a6f8a 0%, #0d4d6e 55%, #094a64 100%)',
  },
  {
    title: 'SDG Alignment Tracker — Southeast Asia Portfolio',
    category: 'Strategy, Policy & Partnerships',
    datasets: 4,
    components: 2,
    region: 'SEA',
    gradient: 'linear-gradient(155deg, #8b6400 0%, #a07518 55%, #7a5c10 100%)',
  },
  {
    title: 'ERDI Forward Projection Model (2026–2030)',
    category: 'Economic Research & Development Impact',
    datasets: 12,
    components: 4,
    region: 'SEA',
    gradient: 'linear-gradient(155deg, #1a5e3a 0%, #174d32 55%, #0f3322 100%)',
  },
];

const AI_AGENTS: DataCard[] = [
  {
    title: 'Climate Resilience Risk Index — Pacific SIDS',
    category: 'Climate Change & Sustainable Development',
    datasets: 8,
    components: 3,
    region: 'Pacific',
    gradient: 'linear-gradient(155deg, #1a6f8a 0%, #0d4d6e 55%, #094a64 100%)',
  },
  {
    title: 'SDG Alignment Tracker — Southeast Asia Portfolio',
    category: 'Strategy, Policy & Partnerships',
    datasets: 4,
    components: 2,
    region: 'SEA',
    gradient: 'linear-gradient(155deg, #8b6400 0%, #a07518 55%, #7a5c10 100%)',
  },
  {
    title: 'ERDI Forward Projection Model (2026–2030)',
    category: 'Economic Research & Development Impact',
    datasets: 12,
    components: 4,
    region: 'SEA',
    gradient: 'linear-gradient(155deg, #1a5e3a 0%, #174d32 55%, #0f3322 100%)',
  },
];

const RECOMMENDED: RecommendedCard[] = [
  {
    name: 'Pacific Economic Outlook 2026',
    type: 'Data Collection',
    description: 'Comprehensive economic projections and indicators for 14 Pacific island economies, updated quarterly with ERDI forecasting models.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#007DB7',
    logoText: 'PAC',
  },
  {
    name: 'Climate Finance Tracker — Pacific',
    type: 'Dataset/API',
    description: 'Real-time tracking of climate finance flows to Pacific SIDS, including Green Climate Fund disbursements and ADB climate-tagged investments.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#2E7D52',
    logoText: 'CFT',
  },
  {
    name: 'Pacific Household Income & Expenditure Survey',
    type: 'Data Collection',
    description: 'Harmonised household survey microdata across 10 Pacific economies enabling poverty, inequality, and welfare analysis.',
    audience: 'All Staff',
    rating: 'Gold · 92% rated',
    logoColor: '#5C6BC0',
    logoText: 'HIS',
  },
];

const TRENDING: TrendingCard[] = [
  {
    name: 'Navigator',
    url: 'navigator.adb.org/knowledge',
    description: 'The go-to employee assistant for ADB staff — surfaces documents, answers internal queries, and handles HR processes.',
    users: '2,400 active users',
    logoColor: '#5C6BC0',
    logoText: '⊕',
    rating: 'Gold · 95% rated',
  },
  {
    name: 'ADB Statistics',
    url: 'data.adb.org',
    description: 'Primary statistical repository covering economic, social, and environmental data across all 68 ADB member economies.',
    users: '1,850 active users',
    logoColor: '#007DB7',
    logoText: 'ADB',
    rating: 'Gold · 95% rated',
  },
  {
    name: 'Powered by Genie',
    url: 'genie.adb.org',
    description: 'Advanced research assistant that compares outputs across AI models and uses multi-agent workflows for deep analysis.',
    users: '1,200 active users',
    logoColor: '#1565C0',
    logoText: 'G',
    rating: 'Gold · 95% rated',
  },
];

const RECENTLY_UPDATED: UpdatedCard[] = [
  {
    title: 'Pacific Energy Transition Dataset',
    category: 'Climate Change & Sustainable Development',
    datasets: 6,
    components: 2,
    region: 'Pacific',
    gradient: 'linear-gradient(155deg, #0d47a1 0%, #1565c0 55%, #1976d2 100%)',
    updatedLabel: '2 days ago',
  },
  {
    title: 'Southeast Asia Urban Development Index',
    category: 'Infrastructure',
    datasets: 9,
    components: 3,
    region: 'SEA',
    gradient: 'linear-gradient(155deg, #4a148c 0%, #6a1b9a 55%, #7b1fa2 100%)',
    updatedLabel: '5 days ago',
  },
  {
    title: 'Central Asia Trade Connectivity Model',
    category: 'Economic Research & Development Impact',
    datasets: 11,
    components: 4,
    region: 'Central & West Asia',
    gradient: 'linear-gradient(155deg, #bf360c 0%, #d84315 55%, #e64a19 100%)',
    updatedLabel: '1 week ago',
  },
];

const TOOLS_APIS: AiPlatform[] = [
  {
    name: 'ADB OpenData API',
    url: 'api.data.adb.org',
    description: 'RESTful API for programmatic access to ADB statistical databases, project documents, and development indicators across member economies.',
    audience: 'All Staff',
    rating: 'Gold · 95% rated',
    logoColor: '#00695C',
    logoText: 'API',
  },
  {
    name: 'Project Performance System',
    url: 'pms.adb.org',
    description: 'Monitoring templates and APIs for tracking project implementation, disbursement schedules, and development effectiveness ratings.',
    audience: 'All Staff',
    rating: 'Silver · 88% rated',
    logoColor: '#37474F',
    logoText: 'PMS',
  },
  {
    name: 'ERDI Data Pipeline',
    url: 'erdi-pipeline.adb.org',
    description: 'Automated pipeline tools for ingesting, transforming, and publishing economic research datasets from ERDI team workflows.',
    audience: 'Department-restricted',
    rating: 'Gold · 92% rated',
    logoColor: '#1B5E20',
    logoText: 'EDP',
  },
];

const TEMPLATES: TemplateCard[] = [
  {
    name: 'Country Briefing Note',
    description: 'AI-assisted country economic assessment with pre-populated data visualizations and key indicator sections tailored to Pacific economies.',
    category: 'Economic Research',
    steps: 6,
    iconColor: '#007DB7',
  },
  {
    name: 'Project Assessment Playbook',
    description: 'End-to-end workflow for development effectiveness reviews — from data gathering through stakeholder reporting and sign-off.',
    category: 'Strategy & Partnerships',
    steps: 9,
    iconColor: '#8DC63F',
  },
  {
    name: 'Climate Risk Screening Tool',
    description: 'Step-by-step playbook for applying ADB\'s climate risk and vulnerability assessment framework to new project proposals.',
    category: 'Climate Change',
    steps: 7,
    iconColor: '#2E7D52',
  },
];

export interface SimpleCard {
  title: string;
  description: string;
  slug?: string;
  tag?: string;
  tagColor?: 'blue' | 'violet' | 'amber' | 'teal';
  icon?: string;
  iconColor?: 'blue' | 'green' | 'amber' | 'rose';
  access?: 'Restricted' | 'ADB Only' | 'Public' | '';
  region?: string;
  author?: string;
  // Top Use Cases image card
  image?: string;
  datasets?: number;
  platforms?: number;
  tools?: number;
  // Recommended
  rating?: number;
  users?: string;
  downloads?: string;
  restricted?: boolean;
  rai?: boolean;
  governanceVerified?: boolean;
  sector?: string;
  themes?: string[];
  // Workspace
  count?: string;
}

const TOP_USE_CASES: SimpleCard[] = [
  {
    title: 'Country Intelligence',
    description: 'Explore economic indicators, country credit profiles, and market outlooks across ADB member economies',
    image: '/uc-country.png',
    datasets: 8,
    platforms: 2,
    tools: 1,
  },
  {
    title: 'Southeast Asia Transport Portfolio',
    description: "Access project data, evaluations, procurement records, and lessons learned across ADB's lending portfolio",
    image: '/uc-project.png',
    datasets: 5,
    platforms: 2,
    tools: 2,
  },
  {
    title: 'Sector Intelligence',
    description: 'Discover sector data and insights across energy, transport, water, urban and social protection',
    image: '/uc-sector.png',
    datasets: 6,
    platforms: 3,
    tools: 3,
  },
  {
    title: 'Climate & Sustainability',
    description: 'Assess climate risk, disaster exposure, cyclone and flood hazards for Pacific and Asian DMCs',
    image: '/uc-climate.png',
    datasets: 15,
    platforms: 1,
    tools: 2,
  },
];

const RECOMMENDED_FOR_YOU: SimpleCard[] = [
  {
    slug: 'asean-urban-water-quality',
    title: 'ASEAN Urban Water Quality Index',
    description: 'Key biological, physical, and chemical parameters of urban water resources monitored across ASEAN member states',
    tag: 'Dataset',
    tagColor: 'blue',
    users: '325 views',
    downloads: '88',
    access: 'Restricted',
    sector: 'Water and Other Urban Infrastructure and Services',
    region: 'Southeast Asia',
    themes: ['Environmentally Sustainable Growth'],
  },
  {
    slug: 'sdr-climate-mitigation-advisor',
    title: 'SDR Climate Mitigation Advisor',
    description: 'Generates localized recommendations based on IPCC policy frameworks and targeted emission reduction pathways',
    tag: 'AI Agent',
    tagColor: 'violet',
    users: '1,041 views',
    downloads: '214',
    access: 'ADB Only',
    rai: true,
    sector: 'Multisector',
    region: 'Global',
    themes: ['Climate Change', 'Knowledge Solutions'],
  },
  {
    slug: 'sdg-global-indicators-monitor',
    title: 'SDG Global Indicators Monitor',
    description: 'Tracks real-time institutional progress metrics on key global sustainable development goal indicators',
    tag: 'Dashboard',
    tagColor: 'amber',
    users: '763 views',
    downloads: '152',
    access: 'ADB Only',
    governanceVerified: true,
    sector: 'Multisector',
    region: 'Global',
    themes: ['Partnerships'],
  },
  {
    slug: 'geospatial-flooding-risk-engine',
    title: 'Geospatial Flooding Risk Engine',
    description: 'Standardized endpoint accessing high-precision topological risk predictions and flood vulnerability assessments',
    tag: 'API',
    tagColor: 'teal',
    users: '509 views',
    downloads: '97',
    access: 'ADB Only',
    sector: 'Water and Other Urban Infrastructure and Services',
    region: 'Asia-Pacific',
    themes: ['Climate Change', 'Urban Development'],
  },
];

const RECENTLY_SAVED: SimpleCard[] = [
  {
    slug: 'nighttime-lights',
    title: 'Nighttime Lights',
    description: 'Satellite imagery tracking nighttime luminosity as a proxy for economic activity, electrification, and urban growth.',
    tag: 'Dataset',
    tagColor: 'blue',
    rating: 4.5,
    users: '1,240 views',
    downloads: '318',
    access: 'Restricted',
    governanceVerified: true,
    sector: 'Energy',
    region: 'Asia-Pacific',
    themes: ['Climate Action', 'Environmentally Sustainable Growth'],
  },
  {
    slug: 'cross-border-movement',
    title: 'Cross-Border Movement Monitoring',
    description: 'Mobility and cross-border flow data derived from mobile location signals across Asia-Pacific.',
    tag: 'Dataset',
    tagColor: 'blue',
    rating: 4.1,
    users: '892 views',
    downloads: '201',
    access: 'ADB Only',
    sector: 'Transport',
    region: 'Asia-Pacific',
    themes: ['Regional Cooperation and Public Goods', 'Inclusive Economic Growth'],
  },
  {
    slug: 'lessons-agent-eva',
    title: 'Lessons Agent (EVA)',
    description: 'AI agent that retrieves and synthesises lessons from past ADB projects to inform new project preparation.',
    tag: 'AI Agent',
    tagColor: 'violet',
    rating: 4.7,
    users: '2,105 views',
    downloads: '476',
    access: 'ADB Only',
    rai: true,
    sector: 'Multisector',
    region: 'Asia-Pacific',
    themes: ['Partnerships', 'Knowledge Solutions'],
  },
  {
    slug: 'transport-document-corpus',
    title: 'Transport Document Corpus',
    description: 'Curated corpus of ADB transport sector publications and technical knowledge products for semantic retrieval.',
    tag: 'Dataset',
    tagColor: 'blue',
    rating: 4.3,
    users: '678 views',
    downloads: '143',
    access: 'ADB Only',
    governanceVerified: true,
    sector: 'Transport',
    region: 'Southeast Asia',
    themes: ['Regional Cooperation and Public Goods'],
  },
];

const FEATURED_SPACES: SimpleCard[] = [
  {
    title: 'Pacific Risk Atlas',
    slug: 'pacific',
    description: 'Flood, earthquake, tsunami, and coastal inundation risk datasets for Cook Islands and Tongatapu, with infrastructure exposure layers',
    image: '/uc-pacific.jpg',
    datasets: 22,
    platforms: 1,
    tools: 1,
    region: 'Pacific',
    author: 'Pacific Department',
  },
  {
    title: 'Transport & Connectivity',
    slug: '2',
    description: 'Aviation schedules, AIS vessel tracking, port emissions, cross-border movement, and urban mobility data across Asia and the Pacific',
    image: '/uc-transport.jpg',
    datasets: 7,
    platforms: 1,
    tools: 2,
    region: 'Southeast Asia',
    author: 'SERD',
  },
  {
    title: 'Procurement & Finance',
    slug: 'finance',
    description: 'Contracts, disbursements, tenders, sustainable procurement taxonomies, credit profiles, and IMF economic indicators',
    image: '/uc-finance.jpg',
    datasets: 9,
    platforms: 1,
    tools: 3,
    region: 'Global',
    author: 'PPFD',
  },
  {
    title: 'Social & Inequality Analytics',
    slug: 'social',
    description: 'Social protection coverage, wealth inequality, agricultural climate exposure, and social cost of the net-zero transition across DMCs',
    image: '/uc-social.jpg',
    datasets: 5,
    platforms: 1,
    tools: 1,
    region: 'South Asia',
    author: 'SPD',
  },
];

const MY_WORKSPACE: SimpleCard[] = [
  {
    title: 'Workspaces',
    description: 'Create and manage your own custom sets of assets',
    icon: 'notebook',
    iconColor: 'green',
    count: '5 Workspaces',
  },
  {
    title: 'Bookmarks',
    description: 'Assets, agents and tools you\'ve bookmarked',
    icon: 'bookmark',
    iconColor: 'blue',
    count: '23 Items',
  },
  {
    title: 'Recent',
    description: 'Quick access to what you\'ve used recently',
    icon: 'clock',
    iconColor: 'amber',
    count: '23 Items',
  },
  {
    title: 'My Contributions',
    description: 'Share your assets with the ADB community',
    icon: 'upload',
    iconColor: 'rose',
    count: '23 Items',
  },
];

const SUGGESTED_TOPICS = ['Emerging Markets Risk', 'Tech Sector Valuation', 'Supply Chain Disruption'];

export interface PromptCategory {
  label: string;
  prompts: string[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    label: 'Climate & Risk',
    prompts: [
      'Show me flood exposure datasets for Pacific SIDS',
      'What climate risk data is available for infrastructure projects in Southeast Asia?',
      'Find climate finance tracking tools for Pacific island economies',
      'Show coastal inundation risk datasets for Tongatapu and Cook Islands',
    ],
  },
  {
    label: 'Economic Research',
    prompts: [
      'Show me a dashboard of ADB disbursements and active project activity',
      'What economic projection datasets are available for the ERDI Forward Model 2026–2030?',
      'Find datasets tracking GDP growth across ASEAN member states',
      'What are the latest trade connectivity indicators for Central Asia?',
    ],
  },
  {
    label: 'Country Intelligence',
    prompts: [
      'Give me an economic overview of Pacific island economies for 2026',
      'What country credit profile data is available for Southeast Asia?',
      'Show me poverty and inequality indicators for South Asian DMCs',
      'Find household income and expenditure survey data for the Pacific',
    ],
  },
  {
    label: 'Transport',
    prompts: [
      'What transport datasets cover cross-border movement in Southeast Asia?',
      'Find port emissions and vessel tracking data for Asia-Pacific',
      'Show me urban mobility and connectivity data for ASEAN cities',
      'What aviation schedule datasets are available for the Pacific region?',
    ],
  },
  {
    label: 'Social Impact',
    prompts: [
      'Find social protection coverage data across ADB member economies',
      'What datasets track wealth inequality and poverty in South Asia?',
      'Show SDG progress indicators for climate and social goals',
      'Find agricultural climate exposure data for rural communities in Asia',
    ],
  },
];

const GEO_OPTIONS = [
  'Pacific', 'Southeast Asia', 'South Asia', 'Central & West Asia',
  'East Asia', 'ASEAN', 'Pan-Asia Pacific', 'Global',
];

const FILTER_GROUPS: FilterGroup[] = [
  {
    name: 'Availability',
    type: 'checkbox',
    options: ['Available now', 'Ingestion in progress', 'Planned / roadmap'],
    counts: [86, 23, 11],
    expanded: true,
  },
  {
    name: 'Capability Type',
    type: 'pills',
    options: ['Dataset', 'Dashboard', 'AI Agent', 'AI Tool', 'AI Product', 'API'],
    expanded: true,
  },
  {
    name: 'Access',
    type: 'toggle',
    options: ['Public', 'ADB-only'],
    expanded: true,
  },
  {
    name: 'Verification Status',
    type: 'checkbox',
    options: ['Governance Verified', 'Responsible AI Verified', 'Verification in Progress'],
    counts: [54, 61, 18],
    expanded: true,
  },
  {
    name: 'Quality Tier',
    type: 'checkbox',
    options: ['Gold', 'Silver', 'Bronze'],
    expanded: true,
  },
  {
    name: 'Geographical Coverage',
    type: 'tag-chip',
    options: GEO_OPTIONS,
    expanded: true,
  },
  {
    name: 'Time Period Covered',
    type: 'slider',
    expanded: true,
  },
  {
    name: 'Sector / Theme',
    type: 'checkbox',
    options: [
      'Climate Change & Sustainable Development',
      'Strategy, Policy & Partnerships',
      'Economic Research & Development Impact',
      'Governance',
      'Health',
      'Education',
      'Infrastructure',
      'Poverty & Social Protection',
      'Private Sector Development',
    ],
    expanded: false,
  },
  {
    name: 'Owning Department',
    type: 'checkbox',
    options: [
      'Pacific Department',
      'Economic Research & Development Impact',
      'Strategy, Policy & Partnerships',
      'Governance',
      'Health & Social Protection',
      'Infrastructure',
      'Private Sector Operations',
    ],
    expanded: false,
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AssetCardComponent, PrimaryBtnDirective, PromptBarComponent, AuroraLightComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly chatService  = inject(ChatService);
  readonly themeService = inject(ThemeService);
  readonly router       = inject(Router);
  readonly el           = inject(ElementRef<HTMLElement>);

  // ── Animated placeholder ───────────────────────────────────────
  readonly phSuggestions = ['Datasets', 'AI Agents', 'AI Tools', 'AI Platforms', 'APIs', 'Dashboards', 'Corpus Documents'];
  readonly phIndex        = signal(0);
  readonly phPrev         = signal(0);
  readonly phTransitioning = signal(false);
  readonly barFocused     = signal(false);
  private phTimer?: ReturnType<typeof setInterval>;
  private phTransTimer?: ReturnType<typeof setTimeout>;

  onBarFocus() { this.barFocused.set(true); }
  onBarBlur()  { this.barFocused.set(false); }

  ngOnInit() { this.startPhRotation(); }

  private sphereRaf?: number;
  private sphereRenderer?: THREE.WebGLRenderer;
  private sphereCleanupFns: Array<() => void> = [];

  ngAfterViewInit() {
    setTimeout(() => this.cacheGreetingRect(), 0);
    this.initParticleSphere();
  }

  ngOnDestroy() {
    clearInterval(this.phTimer);
    clearTimeout(this.phTransTimer);
    if (this.sphereRaf !== undefined) cancelAnimationFrame(this.sphereRaf);
    this.sphereRenderer?.dispose();
    this.sphereCleanupFns.forEach(fn => fn());
  }

  private initParticleSphere(): void {
    const host   = this.el.nativeElement;
    const canvas = host.querySelector('.home__sphere') as HTMLCanvasElement | null;
    if (!canvas) return;

    const size = 640;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    this.sphereRenderer = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 1, 2000);
    camera.position.z = 540;

    const N_LAT = 105, N_LON = 105;
    const count = (N_LAT - 1) * N_LON;
    const phiArr   = new Float32Array(count);
    const thetaArr = new Float32Array(count);
    let idx = 0;
    for (let lat = 1; lat < N_LAT; lat++) {
      for (let lon = 0; lon < N_LON; lon++) {
        phiArr[idx]   = (lat / N_LAT) * Math.PI;
        thetaArr[idx] = (lon / N_LON) * Math.PI * 2;
        idx++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('sPhi',   new THREE.BufferAttribute(phiArr,   1));
    geo.setAttribute('sTheta', new THREE.BufferAttribute(thetaArr, 1));

    const dpr = Math.min(window.devicePixelRatio, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms:       { uTime: { value: 0 }, uDpr: { value: dpr } },
      vertexShader:   SPHERE_VERT,
      fragmentShader: SPHERE_FRAG,
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    this.sphereCleanupFns.push(() => io.disconnect());

    const animate = (): void => {
      this.sphereRaf = requestAnimationFrame(animate);
      if (!visible) return;
      if (!reduceMotion) mat.uniforms['uTime'].value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    };
    animate();
  }

  private startPhRotation() {
    this.phTimer = setInterval(() => {
      this.phPrev.set(this.phIndex());
      this.phIndex.set((this.phIndex() + 1) % this.phSuggestions.length);
      this.phTransitioning.set(true);
      clearTimeout(this.phTransTimer);
      this.phTransTimer = setTimeout(() => { this.phTransitioning.set(false); }, 400);
    }, 3000);
  }

  submitFromBar(query: string) {
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }
  filterSearch     = '';
  filterPanelOpen  = true;
  selectedFilters: string[] = [];
  selectedCapabilities: string[] = [];
  selectedGeographies: string[] = [];
  accessMode: 'Public' | 'ADB-only' = 'ADB-only';
  geoInput = '';
  geoDropdownOpen = false;
  timeMin = 2015;
  timeMax = 2026;
  filterGroups = FILTER_GROUPS.map(g => ({ ...g, options: g.options ? [...g.options] : undefined }));

  readonly promptCategories     = PROMPT_CATEGORIES;
  readonly activePromptCategory = signal<string | null>(null);
  readonly dropdownPos          = signal<{ top: number; left: number; width: number } | null>(null);

  @ViewChild('greetingEl') private greetingEl!: ElementRef<HTMLElement>;
  // Cached so getBoundingClientRect() never runs inside the hot mousemove path
  private greetingRect = { left: 0, width: 1 };
  private gleamX = 0;
  private gleamRaf: number | null = null;

  @HostListener('window:resize')
  cacheGreetingRect() {
    if (!this.greetingEl) return;
    const r = this.greetingEl.nativeElement.getBoundingClientRect();
    this.greetingRect = { left: r.left, width: r.width };
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.gleamX = e.clientX; // always store latest X
    if (!this.greetingEl || this.gleamRaf) return;
    this.gleamRaf = requestAnimationFrame(() => {
      this.gleamRaf = null;
      const pct = Math.max(0, Math.min(100,
        ((this.gleamX - this.greetingRect.left) / this.greetingRect.width) * 100
      ));
      this.greetingEl.nativeElement.style.setProperty('--gleam', ~~pct + '');
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activePromptCategory.set(null);
    this.dropdownPos.set(null);
  }

  togglePromptCategory(label: string, event: Event) {
    event.stopPropagation();
    const opening = this.activePromptCategory() !== label;
    this.activePromptCategory.update(cur => cur === label ? null : label);
    if (opening) {
      const container = (event.currentTarget as HTMLElement).closest('.home__prompts') as HTMLElement;
      const r = container.getBoundingClientRect();
      this.dropdownPos.set({ top: r.bottom + 8, left: r.left, width: r.width });
    } else {
      this.dropdownPos.set(null);
    }
  }

  applyPrompt(prompt: string) {
    this.activePromptCategory.set(null);
    this.router.navigate(['/search'], { queryParams: { q: prompt } });
  }

  readonly topUseCases      = TOP_USE_CASES;
  readonly recommendedForYou = RECOMMENDED_FOR_YOU;
  readonly recentlySaved    = RECENTLY_SAVED;
  readonly featuredSpaces   = FEATURED_SPACES;
  readonly myWorkspace      = MY_WORKSPACE;
  readonly aiPlatforms     = AI_PLATFORMS;
  readonly dataCollections = DATA_COLLECTIONS;
  readonly aiAgents        = AI_AGENTS;
  readonly recommended     = RECOMMENDED;
  readonly trending        = TRENDING;
  readonly recentlyUpdated = RECENTLY_UPDATED;
  readonly toolsApis       = TOOLS_APIS;
  readonly templates       = TEMPLATES;
  readonly suggestedTopics = SUGGESTED_TOPICS;

  padIndex(i: number): string {
    return i < 9 ? `0${i + 1}` : `${i + 1}`;
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get activeFilterCount(): number {
    return this.selectedFilters.length
      + this.selectedCapabilities.length
      + this.selectedGeographies.length
      + (this.timeMin > 2015 || this.timeMax < 2026 ? 1 : 0);
  }

  get hasAnyFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  get timeTrackStyle(): string {
    const total = 2026 - 2015;
    const lo = ((this.timeMin - 2015) / total) * 100;
    const hi = ((this.timeMax - 2015) / total) * 100;
    return `linear-gradient(to right, var(--th-border) 0%, var(--th-border) ${lo}%, var(--adb-blue) ${lo}%, var(--adb-blue) ${hi}%, var(--th-border) ${hi}%, var(--th-border) 100%)`;
  }

  get filteredGeoOptions(): string[] {
    const available = (GEO_OPTIONS).filter(g => !this.selectedGeographies.includes(g));
    if (!this.geoInput.trim()) return available;
    return available.filter(g => g.toLowerCase().includes(this.geoInput.toLowerCase()));
  }

  clampTime() {
    if (this.timeMin >= this.timeMax) {
      const mid = Math.round((this.timeMin + this.timeMax) / 2);
      this.timeMin = Math.min(mid, this.timeMax - 1);
      this.timeMax = Math.max(mid + 1, this.timeMin + 1);
    }
  }

  toggleCapability(opt: string) {
    this.selectedCapabilities = this.selectedCapabilities.includes(opt)
      ? this.selectedCapabilities.filter(c => c !== opt)
      : [...this.selectedCapabilities, opt];
  }

  addGeo(region: string) {
    if (!this.selectedGeographies.includes(region)) {
      this.selectedGeographies = [...this.selectedGeographies, region];
    }
    this.geoInput = '';
  }

  removeGeo(region: string) {
    this.selectedGeographies = this.selectedGeographies.filter(g => g !== region);
  }

  onGeoBlur() {
    setTimeout(() => { this.geoDropdownOpen = false; }, 150);
  }

  toggleFilter(opt: string) {
    this.selectedFilters = this.selectedFilters.includes(opt)
      ? this.selectedFilters.filter(f => f !== opt)
      : [...this.selectedFilters, opt];
  }

  toggleGroup(group: FilterGroup) {
    group.expanded = !group.expanded;
  }

  groupHasSelections(group: FilterGroup): boolean {
    switch (group.type) {
      case 'checkbox': return (group.options ?? []).some(o => this.selectedFilters.includes(o));
      case 'pills':    return this.selectedCapabilities.length > 0;
      case 'tag-chip': return this.selectedGeographies.length > 0;
      case 'slider':   return this.timeMin > 2015 || this.timeMax < 2026;
      default:         return false;
    }
  }

  clearGroupFilters(group: FilterGroup, event: Event) {
    event.stopPropagation();
    switch (group.type) {
      case 'checkbox':  this.selectedFilters = this.selectedFilters.filter(f => !(group.options ?? []).includes(f)); break;
      case 'pills':     this.selectedCapabilities = []; break;
      case 'tag-chip':  this.selectedGeographies = []; this.geoInput = ''; break;
      case 'slider':    this.timeMin = 2015; this.timeMax = 2026; break;
    }
  }

  clearFilters() {
    this.selectedFilters = [];
    this.selectedCapabilities = [];
    this.selectedGeographies = [];
    this.accessMode = 'ADB-only';
    this.geoInput = '';
    this.timeMin = 2015;
    this.timeMax = 2026;
  }

  toggleFilterPanel() {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  navigateWorkspace(item: SimpleCard) {
    const tabMap: Record<string, string> = {
      'Workspaces':        'notebooks',
      'Bookmarks':        'notebooks',
      'Recent':           'recent',
      'My Contributions': 'contributions',
    };
    const tab = tabMap[item.title] ?? 'notebooks';
    this.router.navigate(['/notebooks'], { queryParams: { tab } });
  }

  openAsset(item: SimpleCard) {
    if (item.slug) this.router.navigate(['/assets', item.slug]);
  }

  selectTopic(topic: string) {
    this.router.navigate(['/search'], { queryParams: { q: topic } });
  }


  exploreNotebooks() {
    this.router.navigate(['/spaces']);
  }

  openFeaturedSpace(item: SimpleCard) {
    const slugMap: Record<string, string> = {
      'Pacific Risk Atlas':          'pacific',
      'Transport & Connectivity':    '2',
      'Procurement & Finance':       'finance',
      'Social & Inequality Analytics': 'social',
    };
    const id = slugMap[item.title] ?? item.slug;
    if (id) this.router.navigate(['/notebooks', id]);
  }
}
