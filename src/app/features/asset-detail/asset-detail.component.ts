import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { PrimaryBtnDirective } from '../../shared/ui/primary-btn/primary-btn.directive';
import { SecondaryBtnDirective } from '../../shared/ui/secondary-btn/secondary-btn.directive';
import { PromptBarComponent } from '../../shared/ui/prompt-bar/prompt-bar.component';
import { AIReasoningLoaderComponent } from '../../shared/ui/loaders/ai-reasoning-loader/ai-reasoning-loader.component';
import { ChatService } from '../../services/chat.service';
import { WorkspaceService } from '../../services/workspace.service';
import { WidgetSelectionService } from '../../services/widget-selection.service';

interface AssetVersion {
  version: string;
  releaseDate: string;
  author: string;
  summary: string;
  changes: string[];
  size?: string;
}

interface TableRow {
  label: string;
  value: string;
  isLink?: boolean;
}

type AccessLevel = 'Open' | 'Restricted' | 'Limited';

interface AccessEntry {
  id: number;
  name: string;
  email: string;
  type: 'user' | 'group';
  role: 'Viewer' | 'Editor';
  addedDate: string;
}

interface AccessRequest {
  id: number;
  name: string;
  email: string;
  department: string;
  requestedDate: string;
  reason: string;
}

interface ViewerColumn { name: string; type: string; description?: string; }
interface ViewerImage { label: string; sublabel?: string; src: string; meta?: string; }

interface UseCase {
  projectNumber: string;
  projectTitle: string;
  country: string;
  status: string;
  year: number;
  url: string;
  usageSummary: string;
  usageDetail: string;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
}

interface ApiDoc {
  gettingStarted: string;
  baseUrl: string;
  authentication: string;
  endpoints: ApiEndpoint[];
  exampleRequest: string;
  docsUrl?: string;
}

interface AgentCapabilities {
  whatItCanDo: string[];
  exampleTasks: string[];
  accepts: string[];
  produces: string[];
}

interface ToolCapabilityRow { label: string; value: string; }
interface ToolCapabilities {
  whatItCanDo: string[];
  exampleUse?: { input: string; output: string };
  exampleUseLabel?: string;
  inputOutput: ToolCapabilityRow[];
  ioSectionLabel?: string;
  ctaLabel?: string;
}

interface RelatedAsset {
  title: string;
  tag: string;
  tagColor: 'blue' | 'violet' | 'amber' | 'teal';
  description: string;
  rating: string;
  users: string;
  downloads: string;
  restricted?: boolean;
  rai?: boolean;
}

interface AssetDetail {
  slug: string;
  assetId: string;
  category: string;
  title: string;
  access: string;
  rating: number;
  ratingCount: string;
  views: number;
  downloads?: string;
  dataSize?: string;
  rowCount?: string;
  format?: string;
  ingestionStatus?: 'Ingested' | 'Partial' | 'Planned';
  parentProduct?: string;
  parentProductSlug?: string;
  rai?: boolean;
  governanceVerified?: boolean;
  lastUpdated?: string;
  firstSubmitted?: string;
  pic?: string;
  projectId?: string;
  tags: string[];
  department: string;
  contact: string;
  overview: TableRow[];
  governance: TableRow[];
  versions?: AssetVersion[];
  useCases?: UseCase[];
  viewerColumns?: ViewerColumn[];
  viewerRows?: Record<string, string>[];
  viewerImages?: ViewerImage[];
  relatedAssets?: RelatedAsset[];
  isOwner?: boolean;
  requestAccessCta?: boolean;
  tryWithSampleData?: boolean;
  accessLevel?: AccessLevel;
  accessEntries?: AccessEntry[];
  accessRequests?: AccessRequest[];
  enhancedLayout?: boolean;
  comingSoon?: boolean;
  shortDescription?: string;
  agentCapabilities?: AgentCapabilities;
  toolCapabilities?: ToolCapabilities;
  apiDoc?: ApiDoc;
  updateFrequency?: string;
  limitations?: string;
  sector?: string;
  themes?: string[];
  geoCoverage?: string[];
  geoTags?: string[];
  feedback?: FeedbackEntry[];
  accessMethod?: 'download' | 'api';
}

const ASSETS: AssetDetail[] = [
  {
    slug: 'asean-urban-water-quality',
    assetId: 'AQ-2026-09',
    category: 'Data Assets',
    title: 'ASEAN Urban Water Quality Index',
    access: 'Limited to SDCC & ERCD',
    rating: 4.2,
    ratingCount: '1.2K',
    views: 325,
    downloads: '1.8K',
    dataSize: '2.4 GB',
    rowCount: '25.9B',
    format: 'CSV / Parquet',
    ingestionStatus: 'Ingested',
    parentProduct: 'DataNex 1.0',
    parentProductSlug: 'datanex-1-0',
    governanceVerified: true,
    lastUpdated: '6 Aug 2026',
    firstSubmitted: '14 Mar 2024',
    pic: 'Aiko Tanaka\naiko.tanaka@adb.org',
    projectId: 'DDP_2025_009',
    tags: ['Water Resource', 'ASEAN Core', 'Climate & Environment'],
    department: 'Sustainable Development & Climate Change',
    contact: 'wq-support@adb.org',
    shortDescription: 'The ASEAN Urban Water Quality Index is ADB\'s standardized baseline dataset for monitoring organic, particulate, and biological contamination levels across fast-growing metropolitan regions in ASEAN member states. The index synthesizes multi-parameter water quality measurements — including pH, turbidity, biochemical oxygen demand, and E. coli counts — into a composite quality score and tiered assessment rating, enabling consistent cross-city and cross-country comparison.\n\nData are compiled from aggregated state environmental reporting APIs, regional automated sensor networks, and ground-sample laboratory runs, processed using WHO 2022 water quality guideline thresholds. The dataset covers ten ASEAN member states at targeted metropolitan-centre level, with records spanning January 2020 through December 2025 and a monthly automated refresh cycle delivering approximately 25.9 billion rows in CSV and Parquet formats.\n\nPrimary uses include tracking long-term policy impacts of sanitation investment, supporting urban infrastructure project design and appraisal, and providing the evidential baseline for regional sanitation benchmarking and climate resilience assessments. The dataset is accessed by urban planners, regional development monitors, policy architects, and accredited climate consultants.\n\nAccess is strictly controlled and limited to SDCC and ERCD teams under the ADB Proprietary Institutional Shared Asset licence. The index is updated monthly via a batch ETL pipeline maintained by the SDCC Data Team, with the most recent major version adopting the composite quality_index methodology aligned to WHO 2022 standards.',
    sector: 'Water',
    themes: ["Climate Action","Urban Development","Environmental Sustainability"],
    geoCoverage: ['Southeast Asia'],
        overview: [
      {
        label: 'Purpose',
        value: 'Established to create a standardized baseline index representing organic, particulate, and biological contamination across fast-growing Asian metropolitan regions.',
      },
      {
        label: 'Intended Use',
        value: 'For tracking long-term policy impacts and infrastructural investment alignment concerning regional sanitation projects.',
      },
      {
        label: 'Target Audience',
        value: 'Urban planners, regional development monitors, policy architects, and accredited climate consultants.',
      },
      {
        label: 'Geographical Coverage',
        value: 'ASEAN Member States – targeted metropolitan centers.',
      },
      {
        label: 'Data Maturity',
        value: 'Processed',
      },
      {
        label: 'Time Period Covered',
        value: 'January 2020 – December 2025',
      },
      {
        label: 'Data Type',
        value: 'Tabular — sensor readings, lab results, and computed indices',
      },
    ],
    governance: [
      {
        label: 'Source',
        value: 'Aggregated state environmental reporting APIs, regional automated sensors, and ground sample laboratory runs',
      },
      {
        label: 'Permitted Use',
        value: 'Analytical evaluation, scenario modeling, internal ADB decision workflows',
      },
      {
        label: 'Redistribution',
        value: 'Not permitted for external commercial use without explicitly signed SDCC permission agreements',
      },
      { label: 'License Type',        value: 'ADB Proprietary – Institutional shared asset' },
      { label: 'Access',     value: 'Strictly Controlled' },
      { label: 'Publication Status',  value: 'Active – Updated on rolling cycles' },
      { label: 'Update Method',       value: 'Batch ETL — monthly automated refresh via SDCC pipeline' },
      { label: 'Data Location',       value: 'unity.adb.org / sdcc.water_quality.asean_urban_v3' },
    ],
    viewerColumns: [
      { name: 'city',              type: 'string',  description: 'Name of the city where the water sample was collected' },
      { name: 'country',          type: 'string',  description: 'Country of the collection site' },
      { name: 'collection_date',  type: 'date',    description: 'Date the water sample was collected (ISO 8601)' },
      { name: 'pH',               type: 'float',   description: 'Hydrogen ion concentration; values below 6.5 or above 8.5 indicate concern' },
      { name: 'turbidity_NTU',    type: 'float',   description: 'Water clarity measured in Nephelometric Turbidity Units (NTU)' },
      { name: 'BOD_mg_L',         type: 'float',   description: 'Biochemical Oxygen Demand in mg/L; higher values indicate greater organic pollution' },
      { name: 'E_coli_CFU_100mL', type: 'integer', description: 'E. coli colony-forming units per 100mL; WHO safe limit is <100 CFU/100mL' },
      { name: 'quality_index',    type: 'float',   description: 'Composite water quality score from 0–100; derived from all measured parameters' },
      { name: 'assessment',       type: 'string',  description: 'Overall quality classification: Excellent, Good, Moderate, Poor, or Critical' },
    ],
    viewerRows: [
      { city: 'Manila',      country: 'Philippines', collection_date: '2026-01-08', pH: '6.9',  turbidity_NTU: '4.2',  BOD_mg_L: '3.1', E_coli_CFU_100mL: '180',  quality_index: '72.4', assessment: 'Moderate' },
      { city: 'Jakarta',     country: 'Indonesia',   collection_date: '2026-01-08', pH: '7.1',  turbidity_NTU: '6.8',  BOD_mg_L: '5.4', E_coli_CFU_100mL: '420',  quality_index: '54.1', assessment: 'Poor'     },
      { city: 'Ho Chi Minh', country: 'Viet Nam',    collection_date: '2026-01-09', pH: '7.3',  turbidity_NTU: '3.5',  BOD_mg_L: '2.8', E_coli_CFU_100mL: '95',   quality_index: '80.2', assessment: 'Good'     },
      { city: 'Bangkok',     country: 'Thailand',    collection_date: '2026-01-09', pH: '6.8',  turbidity_NTU: '5.1',  BOD_mg_L: '4.0', E_coli_CFU_100mL: '260',  quality_index: '63.7', assessment: 'Moderate' },
      { city: 'Kuala Lumpur',country: 'Malaysia',    collection_date: '2026-01-10', pH: '7.4',  turbidity_NTU: '2.1',  BOD_mg_L: '1.9', E_coli_CFU_100mL: '42',   quality_index: '91.5', assessment: 'Excellent'},
      { city: 'Phnom Penh',  country: 'Cambodia',    collection_date: '2026-01-10', pH: '6.6',  turbidity_NTU: '9.4',  BOD_mg_L: '7.2', E_coli_CFU_100mL: '870',  quality_index: '38.6', assessment: 'Poor'     },
      { city: 'Hanoi',       country: 'Viet Nam',    collection_date: '2026-01-11', pH: '7.0',  turbidity_NTU: '4.7',  BOD_mg_L: '3.6', E_coli_CFU_100mL: '215',  quality_index: '68.3', assessment: 'Moderate' },
      { city: 'Singapore',   country: 'Singapore',   collection_date: '2026-01-11', pH: '7.5',  turbidity_NTU: '0.8',  BOD_mg_L: '0.9', E_coli_CFU_100mL: '8',    quality_index: '98.1', assessment: 'Excellent'},
      { city: 'Yangon',      country: 'Myanmar',     collection_date: '2026-01-12', pH: '6.5',  turbidity_NTU: '12.3', BOD_mg_L: '9.1', E_coli_CFU_100mL: '1240', quality_index: '22.9', assessment: 'Critical' },
      { city: 'Vientiane',   country: 'Lao PDR',     collection_date: '2026-01-12', pH: '7.2',  turbidity_NTU: '3.9',  BOD_mg_L: '3.3', E_coli_CFU_100mL: '155',  quality_index: '74.8', assessment: 'Good'     },
    ],
    relatedAssets: [
      { title: 'ASEAN Air Quality Index', tag: 'Dataset', tagColor: 'blue', description: 'Particulate matter and AQI measurements across ASEAN metropolitan regions.', rating: '4.0', users: '210', downloads: '980', restricted: true },
      { title: 'Climate Resilience Risk Index — Pacific SIDS', tag: 'Dataset', tagColor: 'blue', description: 'Composite index tracking climate vulnerability across Pacific small island developing states.', rating: '4.7', users: '892', downloads: '201', restricted: true },
      { title: 'Social Protection Indicators', tag: 'Dataset', tagColor: 'blue', description: 'Social protection program coverage, expenditure, and beneficiary outcomes across Asia-Pacific DMCs.', rating: '4.3', users: '420', downloads: '1.2K' },
      { title: 'Geospatial Flooding Risk Engine', tag: 'API', tagColor: 'teal', description: 'Standardized endpoint for high-precision flood vulnerability assessments across Asia-Pacific.', rating: '4.2', users: '325', downloads: '88', rai: true },
    ],
    versions: [
      {
        version: 'v3.1',
        releaseDate: '6 Aug 2026',
        author: 'SDCC Data Team',
        summary: 'Annual refresh with extended coverage through December 2025 and two new city additions.',
        changes: [
          'Extended time series to December 2025',
          'Added Cebu (Philippines) and Surabaya (Indonesia) monitoring stations',
          'Improved turbidity sensor calibration for monsoon-season readings',
          'Harmonised E. coli units across all reporting agencies to CFU/100mL',
        ],
        size: '2.4 GB',
      },
      {
        version: 'v3.0',
        releaseDate: '15 Jan 2025',
        author: 'SDCC Data Team',
        summary: 'Major release aligning index methodology to WHO 2022 water quality guidelines.',
        changes: [
          'Adopted WHO 2022 guideline thresholds for pH, turbidity, and BOD scoring',
          'Introduced composite quality_index replacing the legacy WQI formula',
          'Added assessment tier (Excellent / Good / Moderate / Poor / Critical)',
          'Backfilled 2020–2023 historical records under new methodology',
        ],
        size: '2.1 GB',
      },
      {
        version: 'v2.2',
        releaseDate: '4 Aug 2024',
        author: 'SDCC Data Team',
        summary: 'Added biological parameter suite and expanded sensor network.',
        changes: [
          'Added E. coli and faecal coliform as primary biological indicators',
          'Onboarded 14 new automated river sensors across Cambodia and Lao PDR',
          'Fixed Bangkok Station 7 pH calibration drift (Jan–Jun 2024)',
        ],
        size: '1.8 GB',
      },
    ],
    useCases: [
      {
        projectNumber: '58419-001',
        projectTitle: 'Livable, Resilient, and Water-Secure Cities Investment Program',
        country: 'Cambodia',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58419-001/main',
        usageSummary: 'Used as reference benchmark for urban water service coverage targets',
        usageDetail: 'City-level water quality scores from this index informed the project\'s baseline coverage indicators and target-setting for piped water access across Phnom Penh peri-urban zones.',
      },
      {
        projectNumber: '57128-001',
        projectTitle: 'Thu Dau Mot Water Expansion Project',
        country: 'Viet Nam',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/57128-001/main',
        usageSummary: 'Informed water supply expansion planning and demand modelling',
        usageDetail: 'Flow-rate and quality metrics were used by project engineers to size pipe network extensions and treatment capacity for an additional 85,000 urban residents in Thu Dau Mot city.',
      },
      {
        projectNumber: '55112-003',
        projectTitle: 'Mainstreaming Innovative Approaches for Green and Resilient Cities',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/55112-003/main',
        usageSummary: 'Provided cross-city benchmarking for green urban water governance',
        usageDetail: 'Water quality index trends across ASEAN cities anchored the project\'s comparative analysis of municipal water governance frameworks, feeding directly into its policy reform recommendations.',
      },
    ],
    feedback: [
      { id: 1, user: 'M. Santos',    rating: 5, date: 'Jul 28, 2026', project: 'Livable, Resilient, and Water-Secure Cities Investment Program',    projectNumber: '58419-001', comment: 'Extremely useful for our climate resilience assessments. The granularity of data across ASEAN cities is impressive and the documentation is thorough.' },
      { id: 2, user: 'K. Patel',     rating: 5, date: 'Jul 15, 2026', project: 'Thu Dau Mot Water Expansion Project',                              projectNumber: '57128-001', comment: 'Exactly what we needed for the urban sanitation project in Indonesia. Quality of the sensor data is excellent.' },
      { id: 3, user: 'T. Nguyen',    rating: 4, date: 'Jun 30, 2026', project: 'Mainstreaming Innovative Approaches for Green and Resilient Cities', projectNumber: '55112-003', comment: 'Solid foundation for policy modelling. The quality index calculation methodology is well-documented and reproducible.' },
      { id: 4, user: 'A. Wirawan',   rating: 4, date: 'Jun 10, 2026', project: 'Livable, Resilient, and Water-Secure Cities Investment Program',    projectNumber: '58419-001', comment: 'Good dataset overall. Would benefit from more frequent update cycles — monthly is sometimes not enough for fast-changing urban systems.' },
      { id: 5, user: 'R. Dela Cruz', rating: 3, date: 'May 22, 2026', project: 'Thu Dau Mot Water Expansion Project',                              projectNumber: '57128-001', comment: 'Coverage is uneven — major metropolitan areas are well represented but secondary cities have sparse readings.' },
      { id: 6, user: 'C. Lim',       rating: 5, date: 'May 12, 2026', project: 'Mainstreaming Innovative Approaches for Green and Resilient Cities', projectNumber: '55112-003', comment: 'Excellent dataset with strong documentation. The SDCC team has done a great job maintaining data quality and consistency across update cycles.' },
    ],
  },
  {
    slug: 'sdr-climate-mitigation-advisor',
    assetId: 'AI-2026-14',
    category: 'AI Agents',
    title: 'SDR Climate Mitigation Advisor',
    access: 'Open Access',
    rating: 4.2,
    ratingCount: '980',
    views: 325,
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    rai: true,
    governanceVerified: true,
    lastUpdated: '1 Aug 2026',
    firstSubmitted: '9 Nov 2024',
    pic: 'Climate Analytics Team\nclimate-analytics@adb.org',
    projectId: 'AI_2025_014',
    tags: ['Climate', 'SDR', 'AI Agent', 'Climate & Environment'],
    department: 'Sustainable Development & Climate Change',
    contact: 'climate-ai@adb.org',
    shortDescription: 'The SDR Climate Mitigation Advisor is an AI agent deployed within ADB Genie that generates localized climate mitigation recommendations grounded in IPCC policy frameworks and targeted emission reduction pathways for ADB\'s developing member country governments. The agent supports country-level climate strategy development, emission scenario analysis, and Nationally Determined Contribution alignment assessment across the Asia-Pacific region.\n\nThe advisor draws on IPCC AR6 Working Group reports, World Bank climate finance data, and national NDC submissions, with its emission pathway library and NDC alignment scoring continuously updated on IPCC release cycles. It covers all 46 Asia-Pacific NDC signatories and provides carbon pricing sensitivity analysis across 12 DMCs, producing recommendations localised to specific national contexts — including Pacific SIDS, ASEAN economies, and South Asian DMC governments.\n\nPrimary use cases include supporting ADB mission teams in preparing climate strategy sections for country partnership strategies, structuring climate finance instruments, identifying mitigation gap priorities for renewable energy investment allocation, and providing regulatory benchmarking inputs for legal readiness assessments. The advisor has been applied across energy decarbonisation, municipal renewable energy transition, and legal reform projects spanning Bhutan, Türkiye, and Pacific island states.\n\nThe SDR Climate Mitigation Advisor is classified as a Responsible AI-verified agent and is maintained by the Climate Analytics Team under the Sustainable Development and Climate Change Department. Model updates follow quarterly cycles aligned to IPCC publication releases.',
    sector: 'Energy',
    themes: ["Climate Action","Environmental Sustainability","Responsible AI"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      {
        label: 'Purpose',
        value: 'Generates localized climate mitigation recommendations based on IPCC policy frameworks and targeted emission reduction pathways for DMC governments.',
      },
      {
        label: 'Intended Use',
        value: 'Support country-level climate strategy development, emission scenario analysis, and NDC alignment assessment.',
      },
      {
        label: 'Target Audience',
        value: 'ADB climate specialists, DMC environment ministries, and policy advisory teams.',
      },
      {
        label: 'Geographical Coverage',
        value: 'Asia-Pacific region with emphasis on high-emission DMCs.',
      },
      {
        label: 'Data Maturity',
        value: 'Production',
      },
      {
        label: 'Time Period Covered',
        value: 'Ongoing — real-time IPCC AR6 and NDC data feeds',
      },
    ],
    governance: [
      { label: 'Source',              value: 'IPCC AR6 reports, World Bank climate finance data, national NDC submissions' },
      { label: 'Permitted Use',       value: 'Research, policy advisory, and internal ADB analytical workflows' },
      { label: 'Redistribution',      value: 'Permitted with attribution under ADB open data policy' },
      { label: 'License Type',        value: 'ADB Open – Attribution Required' },
      { label: 'Access',     value: 'Public' },
      { label: 'Publication Status',  value: 'Active – Quarterly model updates' },
      { label: 'Update Method',       value: 'Continuous — model updated on IPCC release cycles' },
    ],
    versions: [
      {
        version: 'v2.3',
        releaseDate: '1 Aug 2026',
        author: 'Climate Analytics Team',
        summary: 'Model update incorporating IPCC AR6 WG3 2024 supplementary report findings.',
        changes: [
          'Updated emission pathway library to IPCC AR6 WG3 2024 supplement',
          'Added carbon pricing sensitivity analysis module for 12 DMCs',
          'Expanded NDC alignment scoring to cover all 46 Asia-Pacific signatories',
          'Improved recommendation localisation for Pacific SIDS contexts',
        ],
      },
      {
        version: 'v2.2',
        releaseDate: '14 Apr 2026',
        author: 'Climate Analytics Team',
        summary: 'Added Southeast Asia sectoral emission pathways and energy transition scenarios.',
        changes: [
          'Introduced energy transition scenario module for ASEAN economies',
          'Added methane reduction pathways for agricultural DMCs',
          'Fixed NDC baseline year mismatch for Indonesia and Viet Nam',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '9 Nov 2024',
        author: 'Climate Analytics Team',
        summary: 'Initial production release with IPCC AR6 WG1 and WG2 integration.',
        changes: [
          'First stable release on ADB Genie infrastructure',
          'Integrated IPCC AR6 WG1 (physical science) and WG2 (impacts) datasets',
          'Covered 22 Asia-Pacific DMC emission scenarios at launch',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: '59046-001',
        projectTitle: 'Promoting Energy Efficiency and Decarbonization',
        country: 'Bhutan',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/59046-001/main',
        usageSummary: 'Supported sectoral emission baseline and mitigation scenario modelling',
        usageDetail: 'The SDR advisor generated Bhutan-specific decarbonisation pathways aligned with the project\'s energy efficiency targets, identifying 34% emission reduction potential across municipal buildings and industrial loads.',
      },
      {
        projectNumber: '59212-001',
        projectTitle: 'Municipal Renewable Energy Transition Program',
        country: 'Türkiye',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/59212-001/main',
        usageSummary: 'Underpinned climate transition finance structuring and scenario analysis',
        usageDetail: 'Mitigation scenario outputs were used in the project\'s green bond framework documentation, helping structure a USD 150M municipal renewable energy transition facility compliant with ICMA Green Bond Principles.',
      },
      {
        projectNumber: '59262-001',
        projectTitle: 'Pacific Renewable Energy for Sustainability and Security',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59262-001/main',
        usageSummary: 'Provided NDC alignment assessment for Pacific renewable energy investment',
        usageDetail: 'Country-level mitigation gap analysis produced by the advisor was used to prioritise renewable energy investment allocations across Cook Islands, Fiji, and Palau under the program\'s financing facility.',
      },
      {
        projectNumber: '59017-001',
        projectTitle: 'Strengthening Legal Readiness for Sustainable and Low-Carbon Energy',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59017-001/main',
        usageSummary: 'Supported legal and regulatory gap assessment for low-carbon energy frameworks',
        usageDetail: 'The advisor\'s regulatory benchmarking outputs were incorporated into the project\'s legal readiness toolkit, helping 6 DMCs identify statutory barriers to renewable energy procurement and grid integration.',
      },
    ],
  },
  {
    slug: 'sdg-global-indicators-monitor',
    assetId: 'DB-2026-07',
    category: 'Dashboards',
    title: 'SDG Global Indicators Monitor',
    access: 'Limited to SDG Team',
    rating: 4.2,
    ratingCount: '760',
    views: 325,
    ingestionStatus: 'Ingested',
    parentProduct: 'DataNex 1.0',
    parentProductSlug: 'datanex-1-0',
    governanceVerified: true,
    lastUpdated: '29 Jul 2026',
    firstSubmitted: '22 May 2023',
    pic: 'Strategy & Policy Analytics\nspd-data@adb.org',
    projectId: 'DDP_2024_007',
    tags: ['SDG', 'Global', 'Dashboard', 'Economic Research'],
    department: 'Strategy & Policy',
    contact: 'sdg-monitor@adb.org',
    shortDescription: 'The SDG Global Indicators Monitor is ADB\'s primary institutional dashboard for tracking progress on the United Nations Sustainable Development Goals across all ADB developing member countries. The dashboard aggregates indicator time-series from the UN SDG database, World Bank Open Data, and ADB operational data to provide a unified, monthly-refreshed view of performance across all 17 SDG goal areas.\n\nCoverage spans ADB\'s 46 developing member countries from 2000 to the present, with data refreshed monthly through automated ETL pipelines drawing on UN SDG and World Bank APIs. The dashboard supports interactive goal-by-goal drilldown, cross-DMC benchmarking across all 17 SDG goals, and gender-disaggregated indicators for SDG 5 across 28 DMCs. CSV and JSON API endpoints support downstream reporting and publication workflows.\n\nPrimary uses include executive briefings on institutional and regional SDG commitments, anchoring statistical capacity assessments and baseline indicator mapping in country-level projects, embedding SDG metrics in project results frameworks for voluntary national review reporting, and supplying the statistical backbone for ADB flagship thematic publications including Key Indicators for Asia and the Pacific. The dashboard reduced publication production time by six weeks for the 2025 Key Indicators report through automated data refresh cycles.\n\nAccess is restricted to the SDG Team under Strategy and Policy department governance, with redistribution requiring departmental approval. The monitor is maintained by Strategy and Policy Analytics and updated monthly via a scheduled ETL pipeline.',
    sector: 'Multisector',
    themes: ["Inclusive Economic Growth","Poverty Reduction","Gender Equality","Climate Action"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      {
        label: 'Purpose',
        value: 'Tracks real-time institutional progress metrics on key global sustainable development goal indicators across ADB member countries.',
      },
      {
        label: 'Intended Use',
        value: 'Executive briefings, SDG progress reporting, and cross-sector performance monitoring.',
      },
      {
        label: 'Target Audience',
        value: 'ADB leadership, strategy teams, and DMC government partners.',
      },
      {
        label: 'Geographical Coverage',
        value: 'Global – all ADB developing member countries.',
      },
      {
        label: 'Data Maturity',
        value: 'Processed',
      },
      {
        label: 'Time Period Covered',
        value: '2000 – present (monthly refresh)',
      },
    ],
    governance: [
      { label: 'Source',              value: 'UN SDG indicators database, World Bank Open Data, ADB operational data' },
      { label: 'Permitted Use',       value: 'Internal reporting and DMC partner briefings only' },
      { label: 'Redistribution',      value: 'Restricted – requires approval from Strategy & Policy department' },
      { label: 'License Type',        value: 'ADB Internal – Restricted' },
      { label: 'Access',     value: 'Controlled' },
      { label: 'Publication Status',  value: 'Active – Monthly refresh cycle' },
      { label: 'Update Method',       value: 'Scheduled ETL — monthly pull from UN SDG and World Bank APIs' },
    ],
    versions: [
      {
        version: 'v4.1',
        releaseDate: '29 Jul 2026',
        author: 'Strategy & Policy Analytics',
        summary: 'Added SDG 13 climate action tracker and expanded Pacific DMC coverage.',
        changes: [
          'Introduced dedicated SDG Goal 13 (Climate Action) tracking panel',
          'Added 8 Pacific island DMCs to the country-level breakdowns',
          'Refreshed World Bank Open Data integration to API v3',
          'Fixed SDG 3 health indicator gap for Timor-Leste (2022–2024)',
        ],
      },
      {
        version: 'v4.0',
        releaseDate: '10 Jan 2026',
        author: 'Strategy & Policy Analytics',
        summary: 'Full dashboard redesign with new visualisation framework and real-time refresh.',
        changes: [
          'Migrated to new charting stack with interactive goal-by-goal drilldown',
          'Switched to monthly auto-refresh pipeline replacing manual quarterly uploads',
          'Added cross-DMC benchmarking view for all 17 SDG goal areas',
          'Deprecated legacy Excel export — replaced with CSV and JSON API endpoints',
        ],
      },
      {
        version: 'v3.2',
        releaseDate: '18 Aug 2025',
        author: 'Strategy & Policy Analytics',
        summary: 'Expanded indicator set following 2030 Agenda mid-term review.',
        changes: [
          'Added 6 indicators from the 2025 SDG mid-term review framework',
          'Included gender-disaggregated data for SDG 5 across 28 DMCs',
          'Corrected SDG 8 employment figures for Fiji and Papua New Guinea',
        ],
      },
      {
        version: 'v3.0',
        releaseDate: '22 May 2023',
        author: 'Strategy & Policy Analytics',
        summary: 'Initial release covering all 17 SDG goals for ADB member countries.',
        changes: [
          'First production release with full 17-goal SDG coverage',
          'Sourced from UN SDG database, World Bank Open Data, and ADB operational data',
          'Covered 46 ADB developing member countries at launch',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: '56267-004',
        projectTitle: 'Key Indicators for Asia and the Pacific 2026',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/56267-004/main',
        usageSummary: 'Served as primary source for regional SDG progress benchmarking',
        usageDetail: 'Dashboard indicator time-series were directly cited in the 2026 publication to track Asia-Pacific progress on SDG 1, 3, 6, and 13, providing the statistical backbone for 12 thematic chapters.',
      },
      {
        projectNumber: '59085-001',
        projectTitle: 'Statistics Improvement Program',
        country: 'Kazakhstan',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59085-001/main',
        usageSummary: 'Anchored statistical capacity assessment and baseline indicator mapping',
        usageDetail: 'Kazakhstan\'s statistical agency used the dashboard to map existing national indicator coverage against the SDG framework, identifying 47 gaps that informed the project\'s capacity-building priorities.',
      },
      {
        projectNumber: '58435-001',
        projectTitle: 'Supporting Climate Change Action, Economic Globalization and Digital Transformation',
        country: 'Uzbekistan',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58435-001/main',
        usageSummary: 'Provided climate and economic globalization indicators for program monitoring',
        usageDetail: 'Multi-dimensional SDG indicator trends on climate action and trade integration were embedded in the project\'s results framework, enabling quarterly progress tracking against Uzbekistan\'s SDG voluntary national review commitments.',
      },
      {
        projectNumber: '56267-003',
        projectTitle: 'Key Indicators for Asia and the Pacific 2025',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/56267-003/main',
        usageSummary: 'Supplied baseline data for Asia-Pacific SDG indicator reporting',
        usageDetail: 'Indicator datasets were used across 14 thematic sections of the 2025 publication, with the dashboard enabling automated data refresh cycles that reduced publication production time by six weeks.',
      },
    ],
  },
  {
    slug: 'geospatial-flooding-risk-engine',
    assetId: 'AP-2026-03',
    category: 'APIs',
    title: 'Geospatial Flooding Risk Engine',
    access: 'Restricted — Partner Access Required',
    requestAccessCta: true,
    tryWithSampleData: true,
    rating: 4.2,
    ratingCount: '540',
    views: 325,
    format: 'REST API / GeoJSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'eGIS Platform',
    parentProductSlug: 'egis-platform',
    rai: true,
    lastUpdated: '10 Aug 2026',
    firstSubmitted: '30 Jan 2025',
    pic: 'CCSD Geospatial Team\ngeo-support@adb.org',
    projectId: 'DDP_2025_003',
    tags: ['Geospatial', 'Risk', 'API', 'Climate & Environment'],
    department: 'Climate Change & Disaster Risk',
    contact: 'geo-risk@adb.org',
    shortDescription: 'The Geospatial Flooding Risk Engine is a RESTful API providing ADB project teams and partner government agencies with high-precision flood vulnerability assessments and topological risk predictions across Asia-Pacific\'s flood-prone coastal and river basin regions. The engine delivers GeoTIFF hazard layers and GeoJSON risk boundaries at 10-metre resolution, with probabilistic return period outputs for 10-, 50-, and 100-year flood scenarios.\n\nThe API is built on a Copernicus Sentinel-1 SAR satellite feed with a 6-hour refresh cycle, supplemented by the GLOFAS v4.0 hydrological model for river basin prediction, Copernicus DEM GLO-30 elevation fusion, and real-time river gauge assimilation from 240 stations across South and Southeast Asia. Historical baseline data extends to 2015. Coverage spans Asia-Pacific and was extended in 2026 to include six Central Asia developing member countries.\n\nPrimary use cases include flood inundation modelling for infrastructure alignment and design, rapid damage assessment in emergency response contexts, real-time flood extent mapping for disaster operations dashboards, and hazard zoning for early warning system design. The engine has been applied in emergency programs across Viet Nam, Thailand, China, and India — including prioritising infrastructure repairs across six provinces within 72 hours of a major flood event.\n\nThe Geospatial Flooding Risk Engine is classified as a Responsible AI-verified asset and is maintained by the CCSD Geospatial Team on the eGIS Platform. It is accessible under an ADB Restricted Open partner use licence.',
    sector: 'Water',
    themes: ["Climate Action","Disaster Risk Management","Urban Development"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      {
        label: 'Purpose',
        value: 'Standardized endpoint accessing high-precision topological risk predictions and flood vulnerability assessments for infrastructure planning.',
      },
      {
        label: 'Intended Use',
        value: 'Climate risk integration in project due diligence, loan appraisal support, and disaster preparedness planning.',
      },
      {
        label: 'Target Audience',
        value: 'ADB project teams, infrastructure engineers, and partner government agencies.',
      },
      {
        label: 'Geographical Coverage',
        value: 'Asia-Pacific – focused on flood-prone coastal and river basin regions.',
      },
      {
        label: 'Data Maturity',
        value: 'Production',
      },
      {
        label: 'Time Period Covered',
        value: 'Real-time — continuous satellite ingestion with historical baseline from 2015',
      },
      {
        label: 'Data Type',
        value: 'Geospatial raster + vector — GeoTIFF hazard layers and GeoJSON risk boundaries',
      },
    ],
    governance: [
      { label: 'Source',              value: 'Copernicus satellite data, GLOFAS hydrological models, SRTM elevation data' },
      { label: 'Permitted Use',       value: 'Project design, risk assessment, and ADB-funded infrastructure planning' },
      { label: 'Redistribution',      value: 'Permitted for DMC government partners with data sharing agreement' },
      { label: 'License Type',        value: 'ADB Restricted Open – Partner Use' },
      { label: 'Access',     value: 'Semi-Public' },
      { label: 'Publication Status',  value: 'Active – Continuously updated' },
      { label: 'Update Method',       value: 'Real-time streaming — Copernicus satellite feed, 6-hour refresh cycle' },
      { label: 'Data Location',       value: 'egis.adb.org / api / v2 / flood-risk' },
    ],
    versions: [
      {
        version: 'v2.4',
        releaseDate: '10 Aug 2026',
        author: 'CCSD Geospatial Team',
        summary: 'Added probabilistic return period outputs and expanded Central Asia coverage.',
        changes: [
          'New /return-period endpoint returning 10, 50, and 100-year flood probability layers',
          'Extended coverage to 6 Central Asia DMCs (Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Uzbekistan, Mongolia)',
          'Improved SRTM elevation fusion using Copernicus DEM GLO-30 dataset',
          'Response payload now includes confidence_score field per polygon',
        ],
      },
      {
        version: 'v2.3',
        releaseDate: '3 Mar 2026',
        author: 'CCSD Geospatial Team',
        summary: 'Integrated GLOFAS v4.0 hydrological model for improved river basin predictions.',
        changes: [
          'Upgraded hydrological backbone from GLOFAS v3.1 to v4.0',
          'Reduced median prediction error by 18% for Mekong and Brahmaputra basins',
          'Added real-time river gauge assimilation for 240 stations across South and Southeast Asia',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '30 Jan 2025',
        author: 'CCSD Geospatial Team',
        summary: 'Major release — migrated to Copernicus Sentinel-1 SAR and REST API v2 architecture.',
        changes: [
          'Primary source migrated from Landsat-8 to Copernicus Sentinel-1 SAR imagery',
          'Introduced RESTful API v2 with GeoJSON response format (breaking change from v1 WMS)',
          'Reduced latency from 24-hour to 6-hour refresh cycle',
          'Added coastal inundation layer for low-lying delta and atoll geographies',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: '56283-002',
        projectTitle: 'Climate Resilient Brahmaputra Integrated Flood and Riverbank Erosion Management',
        country: 'India',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/56283-002/main',
        usageSummary: 'Provided flood inundation modelling for embankment alignment and design',
        usageDetail: 'The engine\'s 10m resolution inundation layers were used to optimise 340km of proposed embankment alignment along the Brahmaputra and Barak river systems, reducing estimated earthwork volumes by 18%.',
      },
      {
        projectNumber: '59495-001',
        projectTitle: 'Flood Emergency Assistance for Central Viet Nam',
        country: 'Viet Nam',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59495-001/main',
        usageSummary: 'Supported rapid damage assessment and emergency response prioritisation',
        usageDetail: 'Flood extent outputs were used within 72 hours of the Central Viet Nam flood event to prioritise emergency infrastructure repair across 6 affected provinces, directly informing ADB\'s emergency disbursement sequencing.',
      },
      {
        projectNumber: '59496-001',
        projectTitle: 'Flood Emergency Assistance for Southern Thailand',
        country: 'Thailand',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59496-001/main',
        usageSummary: 'Enabled real-time flood extent mapping for southern Thailand emergency response',
        usageDetail: 'The API\'s near-real-time inundation data was integrated into the Thailand DPM\'s emergency operations dashboard, guiding evacuation route decisions and temporary shelter placement for 120,000 displaced households.',
      },
      {
        projectNumber: '59341-001',
        projectTitle: 'Enhancing Emergency Management for Typhoon and Flood Disasters',
        country: 'China, People\'s Republic of',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59341-001/main',
        usageSummary: 'Underpinned typhoon and flood hazard zoning for early warning system design',
        usageDetail: 'Composite hazard layers from the engine were used to delineate 847 high-risk grid cells across 4 Chinese provinces, forming the spatial foundation for the project\'s county-level early warning alert system.',
      },
    ],
    apiDoc: {
      gettingStarted: 'Access the Geospatial Flooding Risk Engine via its REST API. A partner API key is required; request one through the CCSD Geospatial Team. A sandbox key providing access to synthetic data is available immediately below.',
      baseUrl: 'api.adb.org/geo/v2',
      authentication: 'Partner API key (sandbox key available on request)',
      endpoints: [
        { method: 'GET', path: '/flood-risk',        description: 'Query flood hazard and risk classification for a location or bounding box' },
        { method: 'GET', path: '/flood-risk/{id}',   description: 'Retrieve a specific risk assessment by asset ID' },
        { method: 'GET', path: '/inundation-layers', description: 'Fetch GeoTIFF inundation layers for a return period and scenario' },
        { method: 'GET', path: '/regions',           description: 'List available coverage regions and bounding boxes' },
      ],
      exampleRequest: 'GET /flood-risk?lat=14.5995&lon=120.9842&return_period=100&scenario=2050&format=geojson',
    },
  },

  {
    slug: 'nighttime-light-intensity-dataset',
    assetId: 'DA-2026-21',
    category: 'Data Assets',
    title: 'Nighttime Lights',
    accessMethod: 'api',
    access: 'Restricted to ITD',
    rating: 4.6,
    ratingCount: '830',
    views: 3410,
    downloads: '1.4K',
    dataSize: '18.7 GB',
    rowCount: '2.1B',
    format: 'GeoTIFF / Parquet',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '12 Aug 2026',
    firstSubmitted: '3 Jan 2025',
    department: 'Information Technology Department',
    contact: 'itd-data@adb.org',
    pic: 'L. Castillo · l.castillo@adb.org',
    projectId: 'DDP_2025_021',
    tags: ['Geospatial', 'Economic Activity', 'Electrification', 'ITD'],
    shortDescription: 'The Nighttime Lights dataset provides satellite-derived luminosity composites from the NOAA VIIRS Day/Night Band and NASA Black Marble VNP46A3 series, serving as a proxy measure for economic activity, electrification progress, and urban expansion across Asia and the Pacific. The dataset enables sub-national economic intelligence in data-sparse environments where ground-based statistical systems are incomplete or lagged.\n\nMonthly cloud-free composites are delivered in GeoTIFF and Parquet formats, covering all ADB developing member countries at 500-metre resolution and the ASEAN-plus subregion at 15-arc-second resolution. Radiance values in nW·cm⁻²·sr⁻¹ are supplemented by aggregated country-level, subnational, and grid-cell tabular outputs. Time series data spans January 2012 through December 2025, totalling 18.7 gigabytes and approximately 2.1 billion rows across monthly composites.\n\nPrimary applications include poverty mapping and geographic targeting for social investment, rural electrification baseline establishment and off-grid site selection, luminosity change detection for post-intervention impact verification, and urban growth analysis for infrastructure demand forecasting. The dataset has been used across solar rooftop, rural electrification, and renewable energy expansion projects in India, Bhutan, and Fiji — including identifying 2.3 million under-electrified households in rural Maharashtra and Rajasthan.\n\nThe Nighttime Lights dataset is maintained by the Information Technology Department and processed through an automated NOAA CLASS download and cloud-masking pipeline using Google Earth Engine. Access is restricted to ITD, with derived indicators publishable with attribution under a separate review process.',
    sector: 'Energy',
    themes: ["Inclusive Economic Growth","Urban Development","Digital Transformation"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose', value: 'Provides satellite-derived nighttime luminosity data as a proxy measure for economic activity, electrification progress, and urban expansion across Asia and the Pacific.' },
      { label: 'Intended Use', value: 'Supports poverty mapping, rural electrification monitoring, urban growth analysis, and economic development tracking for DMC programme teams.' },
      { label: 'Target Audience', value: 'Economic researchers, energy sector specialists, urban planners, and DMC operations teams requiring sub-national economic proxies.' },
      { label: 'Geographical Coverage', value: 'Asia and Pacific — all ADB developing member countries at 500m resolution; ASEAN+ at 15-arc-second resolution.' },
      { label: 'Data Maturity', value: 'Processed' },
      { label: 'Time Period Covered', value: 'January 2012 – December 2025 (monthly composites)' },
      { label: 'Data Type', value: 'Raster — monthly cloud-free composites, radiance in nW·cm⁻²·sr⁻¹; aggregated to country, subnational, and grid-cell tabular outputs' },
      { label: 'Update Frequency', value: 'Annual (monthly composites released quarterly)' },
    ],
    governance: [
      { label: 'Source', value: 'NOAA VIIRS Day/Night Band (2012–present); NASA Black Marble VNP46A3 monthly composites' },
      { label: 'Permitted Use', value: 'Internal ADB analysis, DMC government briefings, and ADB-funded research publications' },
      { label: 'Redistribution', value: 'Not permitted without ITD approval; derived indicators may be published with attribution' },
      { label: 'License Type', value: 'ADB Restricted: NOAA/NASA source data open, processed composites internal-only' },
      { label: 'Access', value: 'Restricted' },
      { label: 'Publication Status', value: 'Active — quarterly composite refresh' },
      { label: 'Update Method', value: 'Automated pipeline — NOAA CLASS download, cloud-masking, monthly compositing via ITD GEE pipeline' },
      { label: 'Data Location', value: 'data.adb.org / geospatial / nighttime-lights-v4' },
    ],
    viewerImages: [
      { label: 'Global Composite',   sublabel: 'Full Asia-Pacific region', src: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_lrg.jpg', meta: 'Dec 2025 · VIIRS DNB composite' },
      { label: 'Southeast Asia',     sublabel: 'Thailand, Viet Nam, Philippines', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1280px-The_earth_at_night.jpg', meta: 'Dec 2025 · VIIRS DNB composite' },
      { label: 'Urban Cores',        sublabel: 'High-density metropolitan areas', src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0', meta: 'Dec 2025 · VIIRS DNB composite' },
      { label: 'South Asia',         sublabel: 'India, Bangladesh, Pakistan', src: 'https://images.unsplash.com/photo-1462258409682-731445253757?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0', meta: 'Dec 2025 · VIIRS DNB composite' },
      { label: 'Coastal Cities',     sublabel: 'Port and littoral urban centres', src: 'https://images.unsplash.com/photo-1474536319975-3431cedb6487?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0', meta: 'Dec 2025 · VIIRS DNB composite' },
      { label: 'Electrification Change', sublabel: 'Growth trend 2018–2025', src: 'https://images.unsplash.com/photo-1517462035531-76bc910a6903?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0', meta: 'Change detection · 7-year delta' },
    ],
    relatedAssets: [
      { title: 'Flights Data from OAG', tag: 'Dataset', tagColor: 'blue', description: 'Global flight schedule and traffic data from OAG for air connectivity and transport analysis.', rating: '4.3', users: '410', downloads: '820', restricted: true },
      { title: 'ASEAN Urban Water Quality Index', tag: 'Dataset', tagColor: 'blue', description: 'Standardised water quality index across ASEAN metropolitan regions.', rating: '4.2', users: '325', downloads: '1.8K', restricted: true },
      { title: 'SDG Global Indicators Monitor', tag: 'Dashboard', tagColor: 'amber', description: 'Real-time tracking of SDG progress metrics across ADB member countries.', rating: '4.2', users: '760', downloads: '540' },
    ],
      versions: [
        {
          version: 'v4.2',
          releaseDate: '14 Aug 2025',
          author: 'ITD Data Team',
          summary: 'Annual update with improved cloud-masking algorithm and extended coverage.',
          changes: [
            'Extended coverage through December 2025',
            'Improved VIIRS cloud-masking using NASA MAIAC aerosol data',
            'Fixed radiance calibration offset for 3 ASEAN+ countries',
            'Added 15-arc-second resolution tiles for the ASEAN+ subregion',
          ],
          size: '3.1 GB',
        },
        {
          version: 'v4.1',
          releaseDate: '20 Jan 2025',
          author: 'ITD Data Team',
          summary: 'Mid-cycle patch addressing South Asia coverage gap.',
          changes: [
            'Patched missing tiles for Bangladesh and Nepal (Oct–Dec 2024)',
            'Reprocessed India subnational aggregates with corrected district boundaries',
          ],
          size: '2.9 GB',
        },
        {
          version: 'v4.0',
          releaseDate: '8 Mar 2024',
          author: 'ITD Data Team',
          summary: 'Major release — migrated to NASA Black Marble VNP46A3 as primary source.',
          changes: [
            'Migrated primary source from DMSP/OLS to VIIRS/VNP46A3',
            'Extended time series back to January 2012',
            'Added monthly composite granularity (previously annual-only)',
            'New country-level tabular outputs with ISO3 keys',
            'Breaking: raster projection changed from EPSG:4326 to EPSG:32648',
          ],
          size: '2.7 GB',
        },
        {
          version: 'v3.1',
          releaseDate: '15 Jun 2023',
          author: 'Analytics Hub',
          summary: 'Final DMSP/OLS release before source migration.',
          changes: [
            'Annual composite for 2022',
            'Updated country boundaries to GADM 4.1',
          ],
          size: '890 MB',
        },
      ],
      useCases: [
      {
        projectNumber: '60246-001',
        projectTitle: 'Accelerating Affordable and Inclusive Rooftop Solar Systems Development',
        country: 'India',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/60246-001/main',
        usageSummary: 'Provided electrification coverage baselines for rooftop solar targeting',
        usageDetail: 'Nighttime luminosity data identified 2.3 million under-electrified households in rural Maharashtra and Rajasthan, directly informing the project\'s geographic targeting criteria for affordable rooftop solar subsidies.',
      },
      {
        projectNumber: '58265-001',
        projectTitle: 'Solar Farm Expansion Project',
        country: 'Bhutan',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/58265-001/main',
        usageSummary: 'Tracked pre- and post-project luminosity change as electrification proxy',
        usageDetail: 'Annual nighttime light composites served as an independent verification signal for the project\'s electrification reporting, cross-checking utility connection data against satellite-observed luminosity increases at 24 substation catchments.',
      },
      {
        projectNumber: '49419-005',
        projectTitle: 'Solar Rooftop Investment Program (Tranche 4)',
        country: 'India',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/49419-005/main',
        usageSummary: 'Validated rooftop solar adoption rates through luminosity change detection',
        usageDetail: 'Daytime-to-nighttime luminosity shift analysis was used to estimate diffuse solar adoption in peri-urban areas where net metering data was incomplete, improving the project\'s reported GW installation tracking accuracy.',
      },
      {
        projectNumber: '57056-001',
        projectTitle: 'Rural Electrification Support Project',
        country: 'Fiji',
        status: 'Active',
        year: 2023,
        url: 'https://www.adb.org/projects/57056-001/main',
        usageSummary: 'Established rural electrification baselines for off-grid community targeting',
        usageDetail: 'Pre-intervention luminosity maps identified 312 dark-zone communities in Fiji\'s outer islands, forming the evidence base for the project\'s off-grid solar mini-grid site selection and investment sequencing.',
      },
    ],
    apiDoc: {
      gettingStarted: 'Access the Nighttime Lights dataset via the ADB Satellite Imagery API. An API key is required; request one through the ITD Data Portal. The API returns cloud-free luminosity composites filtered to your specified region, date range, and resolution.',
      baseUrl: 'api.adb.org/imagery/v1',
      authentication: 'API key (required — request via ITD Data Portal)',
      endpoints: [
        { method: 'GET', path: '/satellite-imagery',   description: 'Query nighttime light composites by region and date' },
        { method: 'GET', path: '/satellite-imagery/{id}', description: 'Retrieve a specific composite by asset ID' },
        { method: 'GET', path: '/regions',             description: 'List available regions and bounding boxes' },
        { method: 'GET', path: '/composites/latest',   description: 'Fetch the most recent available composite' },
      ],
      exampleRequest: 'GET /satellite-imagery?region=PH&satellite=sentinel-2&date_from=2026-09-01&date_to=2026-09-21&cloud_cover_max=20',
    },
  },
  {
    slug: 'air-connectivity-flight-movement-dataset',
    assetId: 'DA-2026-17',
    category: 'Data Assets',
    title: 'Flights Data from OAG',
    accessMethod: 'api',
    access: 'Restricted to ITD',
    rating: 4.3,
    ratingCount: '610',
    views: 2780,
    downloads: '920',
    dataSize: '6.3 GB',
    rowCount: '145M',
    format: 'CSV / Parquet',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '4 Aug 2026',
    firstSubmitted: '18 Sep 2024',
    department: 'Information Technology Department',
    contact: 'itd-data@adb.org',
    pic: 'R. Mendes · r.mendes@adb.org',
    projectId: 'DDP_2025_017',
    tags: ['Transport', 'Air Connectivity', 'Trade', 'ITD'],
    shortDescription: 'Flights Data from OAG delivers comprehensive global flight schedule and traffic data sourced under a commercial licence from OAG Aviation Worldwide Ltd, providing ADB with authoritative air connectivity intelligence for transport analysis and infrastructure planning. The dataset covers all international routes worldwide, with an Asia-Pacific subset spanning 48 countries and more than 1,200 airports.\n\nRecords include scheduled flight origin and destination, airline codes, weekly frequency, seat capacity, aircraft type, distance, and average load factor at monthly schedule snapshot granularity. The dataset spans January 2018 through March 2026 across 145 million records in CSV and Parquet format, totalling 6.3 gigabytes. Monthly updates are delivered through an automated SFTP pipeline from OAG, normalised and loaded into the ADB data warehouse.\n\nPrimary use cases include aircraft utilisation and route viability modelling for airline financing operations, passenger throughput forecasting for airport expansion projects, air connectivity benchmarking for regional integration assessments, and aviation market gap analysis to inform transport investment prioritisation. The dataset has been applied to airport infrastructure projects in Türkiye and Naoero (Nauru), as well as Pacific island route coverage analysis supporting post-COVID aviation demand modelling.\n\nThe Flights Data from OAG is maintained by the Information Technology Department under the OAG Commercial Licence Agreement 2024–2026. Use is strictly limited to internal ADB analytical purposes and ADB-funded transport project appraisals. Redistribution of raw data is prohibited; derived aggregates may be published with OAG attribution.',
    sector: 'Transport',
    themes: ["Regional Cooperation","Inclusive Economic Growth"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose', value: 'Provides comprehensive global flight schedule and traffic data from OAG (Official Aviation Guide) to support air connectivity analysis, transport infrastructure planning, and regional integration assessments.' },
      { label: 'Intended Use', value: 'Benchmarking air connectivity for DMC transport projects, assessing regional aviation market gaps, supporting tourism sector analysis, and evaluating international trade linkages.' },
      { label: 'Target Audience', value: 'Transport economists, regional integration specialists, infrastructure planners, and ADB project teams working on aviation-adjacent lending operations.' },
      { label: 'Geographical Coverage', value: 'Global — all international routes; Asia-Pacific subset covers 48 countries and 1,200+ airports.' },
      { label: 'Data Maturity', value: 'Processed' },
      { label: 'Time Period Covered', value: 'January 2018 – March 2026 (monthly schedule snapshots)' },
      { label: 'Data Type', value: 'Tabular — scheduled flight records (origin, destination, airline, frequency, seats, aircraft type); aggregated monthly route-level traffic statistics' },
      { label: 'Update Frequency', value: 'Monthly' },
    ],
    governance: [
      { label: 'Source', value: 'OAG Aviation Worldwide Ltd — licensed commercial data feed; IATA airline codes for carrier and airport reference' },
      { label: 'Permitted Use', value: 'Internal ADB analytical use and ADB-funded transport project appraisals only' },
      { label: 'Redistribution', value: 'Strictly prohibited — subject to OAG commercial licence terms; derived aggregates may be published with OAG attribution' },
      { label: 'License Type', value: 'Commercial — OAG Licence Agreement 2024–2026' },
      { label: 'Access', value: 'Restricted' },
      { label: 'Publication Status', value: 'Active — monthly schedule update' },
      { label: 'Update Method', value: 'Scheduled ETL — monthly SFTP pull from OAG, normalised and loaded to ADB data warehouse' },
      { label: 'Data Location', value: 'data.adb.org / transport / oag-flights-v3' },
    ],
    viewerColumns: [
      { name: 'origin_iata',      type: 'string'  },
      { name: 'destination_iata', type: 'string'  },
      { name: 'airline_iata',     type: 'string'  },
      { name: 'year_month',       type: 'date'    },
      { name: 'freq_weekly',      type: 'integer' },
      { name: 'seats_weekly',     type: 'integer' },
      { name: 'distance_km',      type: 'float'   },
      { name: 'avg_load_factor',  type: 'float'   },
      { name: 'route_type',       type: 'string'  },
    ],
    viewerRows: [
      { origin_iata: 'MNL', destination_iata: 'SIN', airline_iata: 'PR', year_month: '2026-03', freq_weekly: '28', seats_weekly: '5320', distance_km: '2404.1', avg_load_factor: '84.2', route_type: 'International' },
      { origin_iata: 'CGK', destination_iata: 'KUL', airline_iata: 'QZ', year_month: '2026-03', freq_weekly: '21', seats_weekly: '3780', distance_km: '1182.6', avg_load_factor: '79.6', route_type: 'International' },
      { origin_iata: 'DAC', destination_iata: 'DXB', airline_iata: 'BG', year_month: '2026-03', freq_weekly: '14', seats_weekly: '2240', distance_km: '3768.4', avg_load_factor: '91.3', route_type: 'International' },
      { origin_iata: 'RGN', destination_iata: 'BKK', airline_iata: 'UB', year_month: '2026-03', freq_weekly: '7',  seats_weekly: '1190', distance_km: '1117.2', avg_load_factor: '62.4', route_type: 'International' },
      { origin_iata: 'PNH', destination_iata: 'SGN', airline_iata: 'K6', year_month: '2026-03', freq_weekly: '14', seats_weekly: '1820', distance_km: '231.5',  avg_load_factor: '71.8', route_type: 'International' },
      { origin_iata: 'VTE', destination_iata: 'BKK', airline_iata: 'QV', year_month: '2026-03', freq_weekly: '14', seats_weekly: '2100', distance_km: '671.3',  avg_load_factor: '68.2', route_type: 'International' },
      { origin_iata: 'KTM', destination_iata: 'DEL', airline_iata: 'RA', year_month: '2026-03', freq_weekly: '35', seats_weekly: '4200', distance_km: '1073.8', avg_load_factor: '88.7', route_type: 'International' },
      { origin_iata: 'ULN', destination_iata: 'PEK', airline_iata: 'OM', year_month: '2026-03', freq_weekly: '21', seats_weekly: '3360', distance_km: '1312.5', avg_load_factor: '77.1', route_type: 'International' },
      { origin_iata: 'TBS', destination_iata: 'IST', airline_iata: 'A9', year_month: '2026-03', freq_weekly: '28', seats_weekly: '4480', distance_km: '1520.2', avg_load_factor: '82.9', route_type: 'International' },
      { origin_iata: 'SUV', destination_iata: 'NAN', airline_iata: 'FJ', year_month: '2026-03', freq_weekly: '42', seats_weekly: '2940', distance_km: '198.4',  avg_load_factor: '55.3', route_type: 'Domestic'      },
    ],
    relatedAssets: [
      { title: 'Nighttime Lights', tag: 'Dataset', tagColor: 'blue', description: 'Satellite-derived nighttime luminosity as a proxy for economic activity and urban growth.', rating: '4.6', users: '830', downloads: '1.4K', restricted: true },
      { title: 'AIS from UNGP', tag: 'Dataset', tagColor: 'blue', description: 'AIS vessel tracking from the UN Global Platform for maritime analytics and port connectivity.', rating: '4.1', users: '290', downloads: '610', restricted: true },
      { title: 'Social Protection Indicators', tag: 'Dataset', tagColor: 'blue', description: 'Social protection program coverage, expenditure, and beneficiary outcomes across Asia-Pacific DMCs.', rating: '4.3', users: '420', downloads: '1.2K' },
    ],
    versions: [
      {
        version: 'v3.2',
        releaseDate: '4 Aug 2026',
        author: 'ITD Data Team',
        summary: 'Monthly schedule update with load factor estimates and expanded Pacific coverage.',
        changes: [
          'Added avg_load_factor field derived from IATA capacity and passenger statistics',
          'Extended Pacific island route coverage to 18 additional airports',
          'Refreshed March 2026 schedule snapshot — 1,200+ new routes added post-COVID recovery',
          'Fixed duplicate route entries for codeshare flights on 6 Asia-Pacific corridors',
        ],
        size: '6.3 GB',
      },
      {
        version: 'v3.1',
        releaseDate: '6 Feb 2026',
        author: 'ITD Data Team',
        summary: 'Extended coverage to cargo-only routes and added IATA aircraft type codes.',
        changes: [
          'Added cargo-only freighter routes (route_type: Cargo) for 8 major Asia-Pacific hubs',
          'Included IATA aircraft type codes for fleet composition analysis',
          'Backfilled 2024 annual route data for all covered airports',
        ],
        size: '5.8 GB',
      },
      {
        version: 'v3.0',
        releaseDate: '18 Sep 2024',
        author: 'ITD Data Team',
        summary: 'Initial ingestion under new OAG 2024–2026 commercial licence agreement.',
        changes: [
          'First production release under renewed OAG licence',
          'Standardised all carrier codes to IATA 2-letter format',
          'Backfilled historical monthly snapshots from January 2018',
          'Added distance_km field computed from airport coordinate pairs',
        ],
        size: '5.2 GB',
      },
    ],
    useCases: [
      {
        projectNumber: '59142-006',
        projectTitle: 'Nauru Airlines Aircraft Acquisition Project',
        country: 'Naoero',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/59142-006/main',
        usageSummary: 'Informed aircraft utilisation analysis and route viability assessment',
        usageDetail: 'OAG schedule data was used to model load factor trends on Nauru Airlines\' existing routes, providing the demand baseline that justified the aircraft acquisition financing structure and debt repayment schedule.',
      },
      {
        projectNumber: '59213-001',
        projectTitle: 'Antalya Airport Expansion Project',
        country: 'Türkiye',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/59213-001/main',
        usageSummary: 'Supported passenger throughput forecasting for terminal expansion sizing',
        usageDetail: 'Seat capacity and flight frequency data for Antalya were used in the project\'s aviation demand model, projecting 28% passenger growth over 10 years and sizing terminal and apron expansion accordingly.',
      },
      {
        projectNumber: '58228-002',
        projectTitle: 'Airport Infrastructure Improvement Project (SEFF Activity 1)',
        country: 'Georgia',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58228-002/main',
        usageSummary: 'Provided route-level traffic data for infrastructure investment prioritisation',
        usageDetail: 'Airport-pair OAG data was used to rank Georgian airports by traffic growth potential, directing SEFF financing toward the highest-throughput facility upgrades with strongest commercial viability.',
      },
      {
        projectNumber: '58148-001',
        projectTitle: 'Preparing the Civil Aviation Development Investment Project III',
        country: 'Papua New Guinea',
        status: 'Active',
        year: 2024,
        url: 'https://www.adb.org/projects/58148-001/main',
        usageSummary: 'Anchored aviation demand forecasts for project preparation and feasibility',
        usageDetail: 'Domestic and international route frequency data for Papua New Guinea\'s civil aviation network underpinned the project\'s sector demand forecasts, validating the business case for 14 airport infrastructure upgrades.',
      },
    ],
  },

  // ── Owner-managed asset ───────────────────────────────────────────────────
  {
    slug: 'sea-infrastructure-index',
    assetId: 'DI-2026-11',
    category: 'Data Assets',
    title: 'Southeast Asia Infrastructure Index',
    access: 'Restricted — requires approval',
    isOwner: true,
    accessLevel: 'Restricted',
    rating: 4.5,
    ratingCount: '320',
    views: 1840,
    downloads: '640',
    dataSize: '3.1 GB',
    rowCount: '12.4M',
    format: 'CSV / Parquet',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '10 Aug 2026',
    firstSubmitted: '14 Nov 2025',
    pic: 'Ruby Tan · ruby.tan@accenture.com',
    projectId: 'DDP_2026_011',
    tags: ['Infrastructure', 'ASEAN', 'Composite Index', 'Economic Research'],
    department: 'Economic Research & Development Impact',
    contact: 'infra-index@adb.org',
    shortDescription: 'The Southeast Asia Infrastructure Index is a composite analytical index measuring infrastructure quality, investment flows, and connectivity across all ten ASEAN member states, designed to support evidence-based infrastructure gap analysis and investment targeting in the region. The index integrates transport, energy, and digital sub-indices into a single composite score at national and sub-national administrative level.\n\nThe index is computed from multiple authoritative sources including the World Economic Forum Global Competitiveness Index, the ADB Infrastructure Investment Database, UN ITU connectivity reports, and national statistics agencies. Annual composite scores are produced for each ASEAN economy, covering the period 2015 to 2025, with investment flow indicators and connectivity rankings providing additional analytical depth. Data are available in CSV and Parquet formats across 12.4 million records totalling 3.1 gigabytes.\n\nPrimary uses include infrastructure benchmarking for DMC government planning agencies, project prioritisation support for ASEAN regional infrastructure programmes, comparative analysis across ASEAN economies for research publications, and investment gap identification for infrastructure lending operations. The index is actively used by ADB infrastructure specialists and economic researchers across Southeast Asia, South Asia, and Pacific regional departments.\n\nMaintained by ERCD Analytics under the Economic Research and Development Impact department, the Southeast Asia Infrastructure Index is updated annually following WEF and ADB annual data releases. Access requires approval and is governed under the ADB Restricted Research Use licence.',
    sector: 'Transport',
    themes: ["Regional Cooperation","Inclusive Economic Growth","Urban Development"],
    geoCoverage: ['Southeast Asia'],
        overview: [
      { label: 'Purpose', value: 'Composite index measuring infrastructure quality, investment flows, and connectivity across ASEAN member states for benchmarking and investment targeting.' },
      { label: 'Intended Use', value: 'Supports infrastructure gap analysis, project prioritisation, and policy advisory for ASEAN regional programmes.' },
      { label: 'Target Audience', value: 'ADB infrastructure specialists, DMC government planning agencies, and regional economic researchers.' },
      { label: 'Geographical Coverage', value: 'ASEAN 10 member states at national and sub-national administrative level.' },
      { label: 'Data Maturity', value: 'Processed' },
      { label: 'Time Period Covered', value: '2015 – 2025 (annual composite)' },
      { label: 'Data Type', value: 'Tabular — composite scores, sub-index components, investment flow indicators, and connectivity metrics' },
      { label: 'Update Frequency', value: 'Annual' },
    ],
    governance: [
      { label: 'Source', value: 'World Economic Forum GCI, ADB Infrastructure Investment Database, UN ITU Connectivity reports, national statistics agencies' },
      { label: 'Permitted Use', value: 'Internal ADB analysis, ADB-funded project appraisals, and published research with attribution' },
      { label: 'Redistribution', value: 'Permitted for DMC partners with signed data sharing agreement' },
      { label: 'License Type', value: 'ADB Restricted — Research Use' },
      { label: 'Access', value: 'Controlled' },
      { label: 'Publication Status', value: 'Published — Active' },
      { label: 'Update Method', value: 'Annual batch ETL — composite re-scored following WEF and ADB annual data releases' },
      { label: 'Data Location', value: 'data.adb.org / infrastructure / sea-index-v2' },
    ],
    viewerColumns: [
      { name: 'economy',          type: 'string'  },
      { name: 'year',             type: 'integer' },
      { name: 'composite_score',  type: 'float'   },
      { name: 'transport_idx',    type: 'float'   },
      { name: 'energy_idx',       type: 'float'   },
      { name: 'digital_idx',      type: 'float'   },
      { name: 'invest_usd_bn',    type: 'float'   },
      { name: 'connectivity_rank',type: 'integer' },
    ],
    viewerRows: [
      { economy: 'Singapore',   year: '2025', composite_score: '89.4', transport_idx: '91.2', energy_idx: '88.5', digital_idx: '93.1', invest_usd_bn: '18.4', connectivity_rank: '1' },
      { economy: 'Malaysia',    year: '2025', composite_score: '72.1', transport_idx: '74.3', energy_idx: '71.0', digital_idx: '69.2', invest_usd_bn: '24.7', connectivity_rank: '2' },
      { economy: 'Thailand',    year: '2025', composite_score: '65.8', transport_idx: '68.1', energy_idx: '66.4', digital_idx: '61.3', invest_usd_bn: '31.2', connectivity_rank: '3' },
      { economy: 'Indonesia',   year: '2025', composite_score: '59.3', transport_idx: '57.4', energy_idx: '61.2', digital_idx: '55.8', invest_usd_bn: '87.4', connectivity_rank: '4' },
      { economy: 'Viet Nam',    year: '2025', composite_score: '55.6', transport_idx: '53.9', energy_idx: '58.1', digital_idx: '52.4', invest_usd_bn: '29.8', connectivity_rank: '5' },
      { economy: 'Philippines', year: '2025', composite_score: '51.2', transport_idx: '49.3', energy_idx: '52.4', digital_idx: '53.0', invest_usd_bn: '22.1', connectivity_rank: '6' },
      { economy: 'Cambodia',    year: '2025', composite_score: '38.7', transport_idx: '37.2', energy_idx: '39.5', digital_idx: '36.4', invest_usd_bn: '4.2', connectivity_rank: '7' },
      { economy: 'Lao PDR',     year: '2025', composite_score: '34.1', transport_idx: '33.5', energy_idx: '36.2', digital_idx: '29.8', invest_usd_bn: '2.8', connectivity_rank: '8' },
      { economy: 'Myanmar',     year: '2025', composite_score: '28.4', transport_idx: '26.1', energy_idx: '30.2', digital_idx: '24.7', invest_usd_bn: '1.9', connectivity_rank: '9' },
      { economy: 'Brunei',      year: '2025', composite_score: '71.5', transport_idx: '69.8', energy_idx: '78.4', digital_idx: '66.2', invest_usd_bn: '3.1', connectivity_rank: '2' },
    ],
    accessEntries: [
      { id: 1, name: 'Aiko Tanaka',        email: 'aiko.tanaka@adb.org',        type: 'user',  role: 'Editor',  addedDate: '15 Nov 2025' },
      { id: 2, name: 'ERCD Analytics',     email: 'ercd-analytics@adb.org',     type: 'group', role: 'Viewer',  addedDate: '20 Nov 2025' },
      { id: 3, name: 'Karan Patel',        email: 'k.patel@adb.org',            type: 'user',  role: 'Viewer',  addedDate: '3 Jan 2026'  },
      { id: 4, name: 'Strategy & Policy',  email: 'spd-data@adb.org',           type: 'group', role: 'Viewer',  addedDate: '18 Mar 2026' },
      { id: 5, name: 'Thomas Nguyen',      email: 't.nguyen@adb.org',           type: 'user',  role: 'Viewer',  addedDate: '2 Jun 2026'  },
    ],
    accessRequests: [
      { id: 1, name: 'Mei Lin',     email: 'm.lin@adb.org',     department: 'South Asia Dept',     requestedDate: '12 Aug 2026', reason: 'Needed for the South Asia Infrastructure Benchmarking report due in Q3 2026.' },
      { id: 2, name: 'J. Park',     email: 'j.park@adb.org',    department: 'East Asia Dept',      requestedDate: '10 Aug 2026', reason: 'Supporting connectivity gap analysis for the East Asia Integration study.' },
      { id: 3, name: 'C. Dela Paz', email: 'c.delapaz@adb.org', department: 'Pacific Dept',        requestedDate: '8 Aug 2026',  reason: 'Comparative analysis for Pacific DMC infrastructure development.' },
    ],
    relatedAssets: [
      { title: 'SDG Global Indicators Monitor', tag: 'Dashboard', tagColor: 'amber', description: 'Real-time tracking of SDG progress metrics across ADB member countries.', rating: '4.2', users: '760', downloads: '540' },
      { title: 'ASEAN Urban Water Quality Index', tag: 'Dataset', tagColor: 'blue', description: 'Standardised water quality index across ASEAN metropolitan regions.', rating: '4.2', users: '325', downloads: '1.8K', restricted: true },
      { title: 'Nighttime Lights', tag: 'Dataset', tagColor: 'blue', description: 'Satellite-derived nighttime luminosity as a proxy for economic activity and urban growth.', rating: '4.6', users: '830', downloads: '1.4K', restricted: true },
    ],
    versions: [
      {
        version: 'v1.1',
        releaseDate: '10 Aug 2026',
        author: 'ERCD Analytics',
        summary: 'Added digital connectivity sub-index and Brunei Darussalam data.',
        changes: [
          'Introduced digital_idx sub-component based on UN ITU connectivity indicators',
          'Added Brunei Darussalam — completing ASEAN 10 coverage',
          'Recomputed composite_score weights to reflect updated WEF GCI 4.0 methodology',
          'Corrected Myanmar energy_idx figures for 2023 (source agency revision)',
        ],
        size: '3.1 GB',
      },
      {
        version: 'v1.0',
        releaseDate: '14 Nov 2025',
        author: 'ERCD Analytics',
        summary: 'Initial release covering ASEAN 9 with transport, energy, and investment dimensions.',
        changes: [
          'First production release — annual composite 2015–2024 for 9 ASEAN economies',
          'Transport and energy sub-indices sourced from WEF GCI and ADB Infrastructure Investment Database',
          'Connectivity rank computed from UN ITU and World Bank data',
        ],
        size: '2.7 GB',
      },
    ],
    useCases: [
      {
        projectNumber: '60347-001',
        projectTitle: 'Supporting the Greater Mekong Subregion Economic Corridor Transport System',
        country: 'Lao People\'s Democratic Republic',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/60347-001/main',
        usageSummary: 'Provided transport sub-index scores for corridor investment prioritisation',
        usageDetail: 'Infrastructure index rankings for Lao PDR\'s transport network identified critical connectivity gaps along the GMS economic corridor, directly informing the project\'s investment sequencing and road improvement prioritisation.',
      },
      {
        projectNumber: '59389-001',
        projectTitle: 'Advancing Satellite-Based Augmentation Systems for the Association of Southeast Asian Nations',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59389-001/main',
        usageSummary: 'Produced geospatial analysis of ASEAN satellite navigation coverage gaps',
        usageDetail: 'eGIS was used to visualise GNSS signal coverage and augmentation system ground station locations across ASEAN, producing spatial gap analysis maps that directly informed the project\'s investment prioritisation for new ground infrastructure.',
      },
      {
        projectNumber: '56017-001',
        projectTitle: 'Trans South-South Java Road Project',
        country: 'Indonesia',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/56017-001/main',
        usageSummary: 'Grounded transport infrastructure gap analysis for Java road investment',
        usageDetail: 'Province-level transport index scores for Central and East Java were used to rank road segments by infrastructure deficit severity, forming the prioritisation framework for the project\'s 450km road improvement programme.',
      },
      {
        projectNumber: '59382-001',
        projectTitle: 'Integrated Electric Motorcycles Ecosystems in Southeast Asia',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59382-001/main',
        usageSummary: 'Supported EV infrastructure readiness assessment across ASEAN markets',
        usageDetail: 'Infrastructure index data on energy and logistics sub-components was used to identify which ASEAN markets had the enabling conditions for electric motorcycle ecosystem rollout, guiding the project\'s country selection.',
      },
    ],
  },

  // ── Dataset: Social Protection Indicators ────────────────────────────────
  {
    slug: 'social-protection-indicators',
    assetId: 'DA-2022-04',
    category: 'Data Assets',
    title: 'Social Protection Indicators',
    access: 'All ADB',
    rating: 4.3,
    ratingCount: '420',
    views: 2840,
    downloads: '1.2K',
    dataSize: '240 MB',
    rowCount: '1.8M',
    format: 'CSV / Excel',
    ingestionStatus: 'Ingested',
    parentProduct: 'DataNex 1.0',
    parentProductSlug: 'datanex-1-0',
    governanceVerified: true,
    lastUpdated: '12 Jul 2026',
    firstSubmitted: '8 Sep 2022',
    pic: 'Social Development Thematic Group\nsdtg@adb.org',
    projectId: 'DDP_2022_004',
    tags: ['Social Protection', 'Poverty', 'Asia-Pacific', 'Policy Analysis'],
    department: 'Sustainable Development and Climate Change',
    contact: 'social-data@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'Social Protection Indicators is ADB\'s comprehensive annual dataset tracking the scale, reach, and fiscal dimensions of social protection systems across 46 ADB developing member countries. The dataset covers three principal pillars: social assistance (non-contributory transfers and cash programs), social insurance (contributory pensions, unemployment, and health insurance), and labour market programs — enabling comparative analysis across countries and over time.\n\nCoverage spans program-level indicators for beneficiary populations, expenditure as a share of GDP, and financing sources, with sub-national breakdowns for four high-population DMCs: India, China, Indonesia, and the Philippines. Time series data extends from 2000 to 2025 for core indicators, with selected indicators available from 1990 to support longitudinal analysis of long-term social protection trends.\n\nThe dataset is compiled from multiple authoritative sources — national social protection agencies, the ILO World Social Protection Report, the World Bank ASPIRE database, and ADB country partnership strategy assessments — and harmonised to a consistent methodological framework to support cross-country comparability.\n\nPrimary uses include poverty reduction strategy support, ADB Safeguards assessments, sector policy design, and program evaluation. The dataset underpins ADB\'s social protection knowledge products and provides the empirical foundation for country dialogue on social sector reform. It is actively used in project preparation, results frameworks, and ADB-published thematic assessments on social protection in Asia and the Pacific.',
    updateFrequency: 'Annual — updated in Q1 following national statistical release cycles',
    limitations: 'Coverage gaps in smaller Pacific island DMCs; some historical series require supplementation with ILO/World Bank data for pre-2010 periods. Program-level records may not be comparable across countries due to differing national definitions.',
    sector: 'Social and Human Development',
    themes: ['Inclusive Economic Growth', 'Gender Equality', 'Poverty Reduction'],
    geoTags: ['Asia and the Pacific', 'South Asia', 'Southeast Asia', 'DMC Partner Economies'],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Tracks social protection program coverage, public expenditure, and beneficiary outcomes across ADB developing member countries in Asia and the Pacific.' },
      { label: 'Intended Use',          value: 'Country social sector analysis, poverty reduction strategy support, ADB Safeguards assessments, and social protection program design and evaluation.' },
      { label: 'Target Audience',       value: 'ADB social sector specialists, country economists, safeguards officers, and development policy researchers.' },
      { label: 'Geographical Coverage', value: 'Asia-Pacific — 46 ADB developing member countries, with sub-national data for India, China, Indonesia, and the Philippines.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Time Period Covered',   value: '2000–2025 annual series; select indicators from 1990 for longitudinal analysis' },
      { label: 'Data Type',             value: 'Tabular — program-level and country-level indicators covering coverage rates, expenditure, and beneficiary demographics' },
      { label: 'Update Frequency',      value: 'Annual — updated in Q1 following national statistical release cycles' },
    ],
    governance: [
      { label: 'Source',             value: 'National social protection agencies, ILO World Social Protection Report, World Bank ASPIRE database, ADB country partnership strategy assessments' },
      { label: 'Permitted Use',      value: 'Internal ADB analytical use, country dialogue, and ADB-published sector assessments' },
      { label: 'Redistribution',     value: 'Aggregate indicators publishable with ADB/source attribution; unit-level data restricted to internal use' },
      { label: 'License Type',       value: 'ADB Data Stewardship — Mixed Source' },
      { label: 'Access',    value: 'Open — aggregate statistics; no personal data' },
      { label: 'Publication Status', value: 'Active — annual refresh' },
      { label: 'Update Method',      value: 'Batch ETL — annual ingestion from national statistical offices and partner databases' },
      { label: 'Data Location',      value: 'data.adb.org / social / protection-indicators-v2' },
    ],
    versions: [
      {
        version: 'v2.3',
        releaseDate: '12 Jul 2026',
        author: 'Social Development Thematic Group',
        summary: '2025 annual update — expanded coverage and new disability indicators.',
        changes: [
          'Added 2025 beneficiary count and expenditure data for 38 DMCs',
          'New disability-inclusive social protection indicators for 12 countries',
          'Expanded pension and old-age protection coverage metrics',
          'Integrated ILO 2025 World Social Protection Report harmonised series',
        ],
        size: '240 MB',
      },
      {
        version: 'v2.2',
        releaseDate: '3 Mar 2025',
        author: 'Social Development Thematic Group',
        summary: '2024 update with Pacific island country expansion.',
        changes: [
          'Added social protection data for 8 Pacific island DMCs previously uncovered',
          'New categorical breakdown: contributory vs. non-contributory programs',
          'Harmonised coverage rate definitions across ILO and World Bank methodologies',
        ],
        size: '210 MB',
      },
      {
        version: 'v2.0',
        releaseDate: '8 Sep 2022',
        author: 'SDTG Knowledge Team',
        summary: 'Major restructure — migrated to program-level granularity from country aggregates.',
        changes: [
          'Redesigned schema to program-level records (previously country-level only)',
          'Added expenditure as percentage of GDP alongside absolute USD values',
          'Extended historical series to 2000 for all core indicators',
          'Breaking: column naming convention updated to snake_case standard',
        ],
        size: '185 MB',
      },
    ],
    viewerColumns: [
      { name: 'country',             type: 'string'  },
      { name: 'year',                type: 'integer' },
      { name: 'program_type',        type: 'string'  },
      { name: 'coverage_pct',        type: 'float'   },
      { name: 'expenditure_gdp_pct', type: 'float'   },
      { name: 'beneficiaries_mn',    type: 'float'   },
      { name: 'usd_expenditure_bn',  type: 'float'   },
    ],
    viewerRows: [
      { country: 'India',       year: '2024', program_type: 'Social Assistance', coverage_pct: '28.4', expenditure_gdp_pct: '1.4', beneficiaries_mn: '412.1', usd_expenditure_bn: '42.3' },
      { country: 'Indonesia',   year: '2024', program_type: 'Social Assistance', coverage_pct: '21.7', expenditure_gdp_pct: '0.9', beneficiaries_mn: '61.2',  usd_expenditure_bn: '12.1' },
      { country: 'Philippines', year: '2024', program_type: 'Social Assistance', coverage_pct: '19.3', expenditure_gdp_pct: '0.6', beneficiaries_mn: '22.8',  usd_expenditure_bn: '4.1'  },
      { country: 'Viet Nam',    year: '2024', program_type: 'Social Insurance',  coverage_pct: '35.2', expenditure_gdp_pct: '4.8', beneficiaries_mn: '37.4',  usd_expenditure_bn: '22.8' },
      { country: 'Bangladesh',  year: '2024', program_type: 'Social Assistance', coverage_pct: '16.8', expenditure_gdp_pct: '1.0', beneficiaries_mn: '29.6',  usd_expenditure_bn: '4.8'  },
      { country: 'Pakistan',    year: '2024', program_type: 'Social Assistance', coverage_pct: '14.2', expenditure_gdp_pct: '0.8', beneficiaries_mn: '31.8',  usd_expenditure_bn: '4.2'  },
      { country: 'Cambodia',    year: '2024', program_type: 'Social Assistance', coverage_pct: '11.4', expenditure_gdp_pct: '0.5', beneficiaries_mn: '1.9',   usd_expenditure_bn: '0.5'  },
      { country: 'Mongolia',    year: '2024', program_type: 'Social Insurance',  coverage_pct: '48.2', expenditure_gdp_pct: '7.3', beneficiaries_mn: '1.5',   usd_expenditure_bn: '1.2'  },
      { country: 'Sri Lanka',   year: '2024', program_type: 'Social Assistance', coverage_pct: '22.9', expenditure_gdp_pct: '1.3', beneficiaries_mn: '5.1',   usd_expenditure_bn: '1.0'  },
      { country: 'Nepal',       year: '2024', program_type: 'Social Assistance', coverage_pct: '9.7',  expenditure_gdp_pct: '0.4', beneficiaries_mn: '2.9',   usd_expenditure_bn: '0.4'  },
    ],
    relatedAssets: [
      { title: 'SDG Global Indicators Monitor', tag: 'Dashboard', tagColor: 'amber', description: 'Real-time tracking of SDG progress metrics including SDG 1 (No Poverty) and SDG 10 (Reduced Inequalities).', rating: '4.2', users: '760', downloads: '540' },
      { title: 'ASEAN Urban Water Quality Index', tag: 'Dataset', tagColor: 'blue', description: 'Standardised water quality index across ASEAN metropolitan regions.', rating: '4.2', users: '325', downloads: '1.8K', restricted: true },
      { title: 'ADB Navigator', tag: 'AI Agent', tagColor: 'violet', description: 'Internal knowledge retrieval agent for ADB operational documents, policies, and project databases.', rating: '4.5', users: '2.1K', downloads: '—', rai: true },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise generative AI assistant unlocking development insights from trusted ADB sources.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    useCases: [
      {
        projectNumber: '59339-001',
        projectTitle: 'Strengthening Labor Market and Social Security Systems',
        country: 'India',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59339-001/main',
        usageSummary: 'Provided labour market and social security coverage baselines for India',
        usageDetail: 'Social protection expenditure and beneficiary coverage data for India anchored the project\'s baseline assessment of labour market gaps, informing the design of contributory pension and unemployment insurance reform interventions.',
      },
      {
        projectNumber: '59378-001',
        projectTitle: 'Strengthening Social Protection in Southeast Asia',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59378-001/main',
        usageSummary: 'Anchored regional social protection benchmarking and gap analysis',
        usageDetail: 'Cross-country social protection coverage indicators were used to identify where Southeast Asian DMCs fall below regional medians, directly shaping the project\'s country-specific capacity building and policy reform priorities.',
      },
      {
        projectNumber: '58372-002',
        projectTitle: 'Supporting Transformation of Public Sector Pension Program',
        country: 'Pakistan',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58372-002/main',
        usageSummary: 'Supplied pension coverage and fiscal expenditure baselines for Pakistan',
        usageDetail: 'Historical social protection expenditure trends and pension coverage ratios informed the project\'s actuarial modelling of the public sector pension reform, supporting the fiscal sustainability analysis for the restructured scheme.',
      },
      {
        projectNumber: '59115-001',
        projectTitle: 'Building Capacity for Universal Pension Schemes',
        country: 'Bangladesh',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59115-001/main',
        usageSummary: 'Established pension coverage baselines for Bangladesh capacity building design',
        usageDetail: 'Social protection indicators on pension scheme coverage and benefit adequacy for Bangladesh were used to calibrate the project\'s capacity building priorities, targeting the institutions with the largest administrative capacity gaps.',
      },
    ],
  },

  // ── AI Agent: Navigator ───────────────────────────────────────────────────
  {
    slug: 'adb-navigator',
    assetId: 'AI-2026-07',
    category: 'AI Agents',
    title: 'ADB Navigator',
    access: 'All ADB',
    rating: 4.5,
    ratingCount: '2.1K',
    views: 8420,
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    rai: true,
    governanceVerified: true,
    lastUpdated: '18 Aug 2026',
    firstSubmitted: '14 Jun 2024',
    pic: 'AI Operations Team\nai-ops@adb.org',
    projectId: 'AI_2024_007',
    tags: ['Knowledge Retrieval', 'Internal Documents', 'AI Agent', 'Knowledge Management'],
    department: 'Digital Technology and Innovation',
    contact: 'navigator-support@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'ADB Navigator is a Retrieval-Augmented Generation (RAG) agent providing semantic search and citation-grounded Q&A across ADB\'s entire institutional document corpus. Unlike conventional keyword search, Navigator understands intent and context — enabling staff to ask questions in plain language and receive structured, sourced answers drawn directly from ADB\'s operational policies, project appraisal reports, sector strategies, board papers, and completion reports.\n\nThe agent covers more than 140,000 ADB documents spanning the institution\'s history from 1966 to present, with the index refreshed weekly to reflect newly published materials. Navigator\'s hybrid retrieval architecture combines dense vector search with sparse BM25 retrieval, improving recall across both semantic and exact-match queries. All responses include clickable citations linked to source passages, enabling users to verify content and trace analytical claims to their original documents.\n\nPrimary use cases include rapid policy lookup during project preparation, cross-departmental knowledge synthesis, regulatory and safeguard precedent research, and onboarding support for new staff and consultants who need to quickly build familiarity with ADB\'s institutional knowledge base. Navigator is available as a standalone interface and is embedded as the core retrieval engine within ADB Genie. Multilingual retrieval is supported for English, French, and Spanish documents, with Japanese and Bahasa Indonesia support in development.',
    updateFrequency: 'Continuous — weekly index refresh cycles',
    limitations: 'Restricted to ADB institutional documents; does not index external academic literature or DMC government portals beyond formally shared publications. Board-restricted documents require Level 3 clearance.',
    sector: 'Information and Communications Technology',
    themes: ['Knowledge Management', 'Digital Transformation', 'Institutional Effectiveness'],
    geoTags: ['Global', 'Asia and the Pacific'],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',                value: 'Provides semantic search and structured Q&A across ADB\'s internal document corpus — including operational policies, project appraisal reports, sector strategies, and board papers.' },
      { label: 'Intended Use',           value: 'Rapid policy lookup, project precedent research, cross-departmental knowledge synthesis, and onboarding support for new staff and consultants.' },
      { label: 'Target Audience',        value: 'All ADB staff, consultants, and approved DMC government partners with institutional access agreements.' },
      { label: 'Geographical Coverage',  value: 'Global — all ADB operational regions and headquarters.' },
      { label: 'Data Maturity',          value: 'Production' },
      { label: 'Time Period Covered',    value: 'ADB documents from 1966 to present — indexed corpus refreshed weekly' },
      { label: 'Capabilities',           value: 'Semantic search, citation-grounded Q&A, cross-document synthesis, multilingual retrieval (English, Spanish, French)' },
      { label: 'Model Architecture',     value: 'Retrieval-Augmented Generation (RAG) — hybrid dense+sparse retrieval with GPT-4o generation layer' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB institutional document management system, board papers portal, eOperations, and DataNex knowledge base' },
      { label: 'Permitted Use',      value: 'Internal knowledge retrieval, policy research, and project due diligence support' },
      { label: 'Redistribution',     value: 'Agent outputs may be included in ADB publications with human review; underlying documents subject to originating department approval' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'Mixed — public-source documents open; board-restricted papers require Level 3 clearance' },
      { label: 'Publication Status', value: 'Active — weekly index refresh' },
      { label: 'Update Method',      value: 'Continuous ingestion — document management system webhooks trigger incremental index updates' },
    ],
    versions: [
      {
        version: 'v2.4',
        releaseDate: '12 Aug 2026',
        author: 'AI Operations Team',
        summary: 'Multilingual retrieval expansion and citation accuracy improvements.',
        changes: [
          'Added French and Spanish retrieval support for OECD and regional partner documents',
          'Improved citation grounding — reduced hallucination rate by 18% on internal benchmarks',
          'New "strict citation mode" — responses cite only directly retrieved passages',
          'Extended coverage to ADB board-restricted documents for Level 3 clearance users',
        ],
      },
      {
        version: 'v2.3',
        releaseDate: '30 May 2026',
        author: 'AI Operations Team',
        summary: 'Performance improvements and expanded sector strategy coverage.',
        changes: [
          'Indexed 12,000 additional ADB project completion reports (PCRs) from 2020–2025',
          'Reduced average query latency from 3.8s to 1.9s via retrieval cache layer',
          'Improved sector classification accuracy for energy and transport documents',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '14 Jun 2024',
        author: 'AIBD Research Team',
        summary: 'Major release — upgraded to GPT-4o backbone with hybrid retrieval architecture.',
        changes: [
          'Migrated generation model from GPT-3.5-turbo to GPT-4o',
          'Introduced hybrid dense+sparse retrieval replacing BM25-only approach',
          'Added source attribution panel with clickable document links',
          'New conversation memory — maintains context across up to 12 turns',
          'Breaking: API endpoint changed from /v1/query to /v2/search',
        ],
      },
    ],
    relatedAssets: [
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'violet', description: 'Enterprise AI assistant portal where Navigator is the primary retrieval agent.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
      { title: 'SDR Climate Mitigation Advisor', tag: 'AI Agent', tagColor: 'violet', description: 'Generates localized climate mitigation recommendations based on IPCC frameworks.', rating: '4.2', users: '980', downloads: '—', rai: true },
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Enterprise semantic search enabling retrieval across ADB document stores and SharePoint.', rating: '4.6', users: '2.4K', downloads: '—', rai: true },
      { title: 'Social Protection Indicators', tag: 'Dataset', tagColor: 'blue', description: 'Social protection program coverage, expenditure, and beneficiary outcomes across Asia-Pacific DMCs.', rating: '4.3', users: '420', downloads: '1.2K' },
    ],
    useCases: [
      {
        projectNumber: '59142-004',
        projectTitle: 'SATSOL Digital Connectivity Project',
        country: 'Solomon Islands',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/59142-004/main',
        usageSummary: 'Powered document retrieval for project preparation and feasibility studies',
        usageDetail: 'Navigator was used by the project team to retrieve precedent feasibility studies, environmental safeguard frameworks, and procurement templates for submarine cable infrastructure, reducing document search time by an estimated 60%.',
      },
      {
        projectNumber: '59512-001',
        projectTitle: 'Nepal Digital Transformation Project',
        country: 'Nepal',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59512-001/main',
        usageSummary: 'Retrieved digital transformation policy documents and technical standards',
        usageDetail: 'Intelligent File Search was used by the project preparation team to locate ADB-internal digital governance guidelines, procurement standards, and prior project completion reports, reducing manual document search time from days to minutes.',
      },
      {
        projectNumber: '59280-002',
        projectTitle: 'Enhancing Connectivity and Security for Digital Public Infrastructure',
        country: 'Sri Lanka',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59280-002/main',
        usageSummary: 'Enabled rapid retrieval of cybersecurity and digital infrastructure standards',
        usageDetail: 'Navigator was queried extensively during project design to retrieve ADB and international standards on digital public infrastructure security, consolidating guidance from 130+ documents into structured outputs for the project team.',
      },
      {
        projectNumber: '59517-001',
        projectTitle: 'Improving Nepal\'s Digital Policy and Governance, Access and Infrastructure',
        country: 'Nepal',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59517-001/main',
        usageSummary: 'Provided policy precedent retrieval for Nepal digital governance reform',
        usageDetail: 'The Navigator agent was used to search ADB\'s project and knowledge database for digital policy reform precedents in South Asia, synthesising findings from 47 relevant documents to support the project\'s policy reform recommendations.',
      },
    ],
  },

  // ── AI Tool: Intelligent File Search ─────────────────────────────────────
  {
    slug: 'intelligent-file-search',
    assetId: 'AT-2023-06',
    category: 'AI Tools',
    title: 'Intelligent File Search',
    access: 'All ADB',
    rating: 4.6,
    ratingCount: '2.4K',
    views: 9870,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    rai: true,
    governanceVerified: true,
    lastUpdated: '19 Aug 2026',
    firstSubmitted: '5 Nov 2023',
    pic: 'AI Operations Team\nai-ops@adb.org',
    projectId: 'AI_2023_006',
    tags: ['Search', 'Knowledge Management', 'AI Tool', 'Enterprise Search'],
    department: 'Digital Technology and Innovation',
    contact: 'ai-tools@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'Intelligent File Search is ADB\'s enterprise document retrieval tool, enabling staff to find documents, files, reports, and knowledge assets from across ADB\'s institutional stores using natural-language or keyword queries — without needing to know where files are stored or their exact names.\n\nThe tool indexes content from SharePoint Online, eOperations, ADB\'s institutional document management system, and the ADB website publications portal, covering PDFs, Word documents, Excel files, PowerPoint presentations, and HTML pages. Retrieval uses a hybrid dense-vector and BM25 architecture, combining semantic understanding with keyword precision to return highly relevant results across a corpus of hundreds of thousands of documents.\n\nDocument permissions are enforced at query time — users only see results they are authorised to access based on their SharePoint role — making it safe to deploy organisation-wide without access policy changes. Index updates are near-real-time, with new or modified documents appearing in search results within 15 minutes via SharePoint change notification webhooks.\n\nThe tool is integrated into ADB Genie as the primary document retrieval layer, available as a Microsoft Teams message extension for in-conversation search, and accessible via REST API for programmatic integration. It is the retrieval backbone for ADB Navigator and several sector-specific search agents. Multilingual search is supported for English, Japanese, Thai, Bahasa Indonesia, and Tagalog.',
    updateFrequency: 'Near-real-time — incremental index updates within 15 minutes of document changes',
    limitations: 'Document permissions are enforced at retrieval time; results depend on the requesting user\'s SharePoint access level. Newly uploaded documents may take up to 15 minutes to appear in search results.',
    sector: 'Information and Communications Technology',
    themes: ['Knowledge Management', 'Digital Transformation', 'Enterprise Search'],
    geoTags: ['Global', 'Asia and the Pacific'],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Enterprise semantic search enabling staff to retrieve documents, files, reports, and knowledge assets from ADB\'s institutional document stores using natural-language or keyword queries.' },
      { label: 'Intended Use',          value: 'Day-to-day knowledge retrieval for ADB staff — find project documents, policy papers, operational guidelines, and sector reports without knowing exact file names or locations.' },
      { label: 'Target Audience',       value: 'All ADB staff and approved consultants; integrated into ADB Genie, SharePoint, and Teams.' },
      { label: 'Geographical Coverage', value: 'Global — covers ADB documents from all regional departments and headquarters divisions.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v3 / file-search' },
      { label: 'Supported Formats',     value: 'PDF, DOCX, XLSX, PPTX, HTML, plain text — with metadata extraction and passage-level retrieval' },
      { label: 'Integration Points',    value: 'ADB Genie chat interface, SharePoint Online federated search, Microsoft Teams message extension' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB SharePoint Online, eOperations project database, institutional document management system, ADB website publications portal' },
      { label: 'Permitted Use',      value: 'Internal document retrieval and knowledge discovery for ADB staff; approved consultant access scoped to project documents' },
      { label: 'Redistribution',     value: 'Retrieved document excerpts may be used in ADB work products with source citation; documents subject to originating department permissions' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'Mixed — public ADB publications unrestricted; board papers and restricted operational documents require appropriate clearance level' },
      { label: 'Publication Status', value: 'Active — continuous index updates' },
      { label: 'Update Method',      value: 'Near-real-time ingestion — SharePoint change notifications trigger incremental index updates within 15 minutes of document modification' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v3 / file-search' },
    ],
    versions: [
      {
        version: 'v3.1',
        releaseDate: '19 Aug 2026',
        author: 'AI Operations Team',
        summary: 'Teams integration and improved passage extraction for complex PDF layouts.',
        changes: [
          'Launched Microsoft Teams message extension — search files directly from Teams chat',
          'Improved table and chart extraction from multi-column PDF layouts',
          'New /summarise endpoint — returns AI-generated document summary alongside search results',
          'Added date-range and department filter parameters to REST API',
        ],
      },
      {
        version: 'v3.0',
        releaseDate: '14 Apr 2026',
        author: 'AI Operations Team',
        summary: 'Major upgrade — multilingual search and PPTX support.',
        changes: [
          'Added multilingual search: English, Japanese, Thai, Bahasa Indonesia, Tagalog',
          'PPTX and Excel spreadsheet indexing (previously PDF and DOCX only)',
          'Federated search across SharePoint sites without manual site-by-site configuration',
          'Breaking: v2 /search endpoint deprecated; migrate to /v3/file-search',
        ],
      },
      {
        version: 'v2.4',
        releaseDate: '5 Nov 2023',
        author: 'AIBD Research Team',
        summary: 'Initial production release — hybrid semantic + keyword search across ADB SharePoint.',
        changes: [
          'Production launch of Intelligent File Search integrated into ADB Genie',
          'Hybrid dense-vector + BM25 retrieval pipeline',
          'REST API with OAuth 2.0 and API key authentication',
          'SLA: 99.9% uptime, p95 latency < 800 ms',
        ],
      },
    ],
    relatedAssets: [
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant portal where Intelligent File Search powers document retrieval.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
      { title: 'ADB Navigator', tag: 'AI Agent', tagColor: 'violet', description: 'Knowledge retrieval agent using Intelligent File Search as its document retrieval backbone.', rating: '4.5', users: '2.1K', downloads: '—', rai: true },
      { title: 'Sector Search', tag: 'AI Tool', tagColor: 'teal', description: 'Sector-specific search layer built on the same retrieval infrastructure as Intelligent File Search.', rating: '4.1', users: '890', downloads: '—' },
      { title: 'PDF Extraction', tag: 'AI Tool', tagColor: 'teal', description: 'Document intelligence service that extracts structured content from PDFs for downstream processing.', rating: '4.3', users: '1.1K', downloads: '—' },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Search documents and files using natural-language or keyword queries',
        'Retrieve relevant passages across ADB SharePoint Online, eOperations, and institutional document stores',
        'Rank results by semantic relevance using a hybrid dense-vector and BM25 retrieval architecture',
        'Enforce document-level permissions so users only receive results they are authorised to access',
        'Return source references and passage-level excerpts alongside each result',
        'Support multilingual queries in English, Japanese, Thai, Bahasa Indonesia, and Tagalog',
      ],
      exampleUse: {
        input: '"ADB guidance on climate-resilient infrastructure"',
        output: 'Relevant documents · Matching passages · Source references',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Natural-language queries, keyword queries' },
        { label: 'Produces', value: 'Documents, Passages, Source references' },
        { label: 'Supported formats', value: 'PDF, DOCX, XLSX, PPTX, HTML, plain text' },
        { label: 'Languages', value: 'English, Japanese, Thai, Bahasa Indonesia, Tagalog' },
      ],
    },
    useCases: [
      {
        projectNumber: '59512-001',
        projectTitle: 'Nepal Digital Transformation Project',
        country: 'Nepal',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59512-001/main',
        usageSummary: 'Retrieved digital transformation policy documents and technical standards',
        usageDetail: 'Intelligent File Search was used by the project preparation team to locate ADB-internal digital governance guidelines, procurement standards, and prior project completion reports, reducing manual document search time from days to minutes.',
      },
      {
        projectNumber: '59433-001',
        projectTitle: 'Digital Empowerment for Women\'s Development in Underdeveloped Areas',
        country: 'China, People\'s Republic of',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59433-001/main',
        usageSummary: 'Enabled retrieval of gender and digital inclusion frameworks',
        usageDetail: 'The tool was used to surface ADB gender mainstreaming guidelines and digital inclusion case studies relevant to rural China, informing the project\'s design of women-targeted digital literacy and e-commerce support activities.',
      },
      {
        projectNumber: '59492-002',
        projectTitle: 'Support in Preparing the Unleashing Potential for Growth in Research and Innovation',
        country: 'Uzbekistan',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59492-002/main',
        usageSummary: 'Supported research landscape mapping and innovation policy retrieval',
        usageDetail: 'Project preparation teams used Intelligent File Search to rapidly consolidate ADB\'s body of research on innovation ecosystems in Central Asia, enabling evidence-based design of the research and innovation capacity building activities.',
      },
    ],
  },

  // ── Portal: ADB Genie ─────────────────────────────────────────────────────
  {
    slug: 'adb-genie',
    assetId: 'PO-2026-01',
    category: 'Portals',
    title: 'ADB Genie',
    access: 'All ADB',
    rating: 4.7,
    ratingCount: '3.4K',
    views: 18240,
    ingestionStatus: 'Ingested',
    rai: true,
    governanceVerified: true,
    lastUpdated: '20 Aug 2026',
    firstSubmitted: '12 Feb 2024',
    pic: 'Digital Technology & Innovation Dept\naibd@adb.org',
    projectId: 'AI_2023_001',
    tags: ['Generative AI', 'Knowledge Management', 'Portal', 'Enterprise AI'],
    department: 'Digital Technology and Innovation',
    contact: 'genie-support@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'ADB Genie is the enterprise generative AI assistant that unlocks development insights from ADB\'s trusted institutional knowledge. It brings together document Q&A, multi-turn conversation, file analysis, DataNex dataset discovery, and web-grounded research in a single, access-controlled interface available to all ADB staff.\n\nGenie is built on a Retrieval-Augmented Generation (RAG) architecture, with ADB Navigator as its core retrieval backbone and Intelligent File Search powering document access across SharePoint and eOperations. This grounding in ADB\'s authoritative sources — rather than generic internet content — reduces hallucination risk and enables staff to cite specific ADB documents, project precedents, and analytical outputs in their work.\n\nCapabilities span the full knowledge workflow: staff can ask questions in natural language, upload files for analysis (PDF, DOCX, XLSX, PPTX, CSV), search the DataNex catalogue for relevant datasets, generate structured content templates (policy briefs, meeting minutes, project summaries), and engage Country Genie for DMC-specific intelligence. All responses include source citations linked to original ADB documents.\n\nGenie operates under ADB\'s Responsible AI framework, with access controls scoped to each user\'s clearance level — public ADB documents are accessible to all staff, while board-restricted materials require Level 3 access. The platform completed its Responsible AI assessment and has been granted RAI Verified status. All AI-generated outputs require staff review before external distribution.',
    updateFrequency: 'Continuous — underlying knowledge base updated daily; platform releases on monthly cadence',
    limitations: 'Responses are grounded in indexed ADB sources and may not reflect the most recent external publications. All AI-generated outputs require staff review before external distribution.',
    sector: 'Information and Communications Technology',
    themes: ['Knowledge Management', 'Digital Transformation', 'Responsible AI', 'Institutional Effectiveness'],
    geoTags: ['Global', 'Asia and the Pacific'],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',              value: 'Enterprise generative AI assistant that unlocks development insights from thousands of trusted ADB documents, datasets, and institutional knowledge sources — enabling staff to find answers, draft content, and synthesise information at speed.' },
      { label: 'Intended Use',         value: 'Day-to-day knowledge work across all ADB departments: policy research, project due diligence, report drafting, internal FAQ resolution, and briefing preparation.' },
      { label: 'Target Audience',      value: 'All ADB staff, approved consultants, and select DMC government partners with institutional access agreements.' },
      { label: 'Geographical Coverage', value: 'Global — serves all ADB regional departments and headquarters.' },
      { label: 'Data Maturity',        value: 'Production' },
      { label: 'Key Capabilities',     value: 'Document Q&A, multi-turn conversation, citation-grounded responses, file upload & analysis, DataNex dataset search, web browsing (curated sources)' },
      { label: 'Integrated AI Tools',  value: 'Navigator, Intelligent File Search, SDR Climate Mitigation Advisor, Country Genie, Translation Engine' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB institutional document corpus, DataNex data catalogue, eOperations, board papers portal — indexed with departmental access controls' },
      { label: 'Permitted Use',      value: 'All internal knowledge work; ADB-published content produced with Genie must be staff-reviewed before external distribution' },
      { label: 'Redistribution',     value: 'Outputs may be included in ADB publications with human review and standard attribution; system itself not for redistribution' },
      { label: 'License Type',       value: 'ADB Internal — Institutional Enterprise Licence' },
      { label: 'Access',    value: 'Controlled — access level scoped to user clearance; board-restricted content requires Level 3 access' },
      { label: 'Publication Status', value: 'Active — continuous model updates' },
      { label: 'Update Method',      value: 'Continuous — model version updates managed by AIBD; document index refreshed weekly' },
    ],
    versions: [
      {
        version: 'v2.4',
        releaseDate: '12 Aug 2026',
        author: 'AIBD Team',
        summary: 'Multilingual document retrieval, DataNex deep integration, and expanded file analysis.',
        changes: [
          'Added French and Spanish retrieval support — expanded DMC partner usability',
          'Deep DataNex integration: Genie can query live catalogue metadata and preview dataset schemas',
          'New file upload types: Excel, CSV, and PowerPoint alongside existing PDF/DOCX',
          'Improved citation confidence indicators — hallucination rate reduced by 22%',
          'New "strict grounding" mode — responses limited to retrieved source content only',
        ],
      },
      {
        version: 'v2.3',
        releaseDate: '10 Apr 2026',
        author: 'AIBD Team',
        summary: 'Country Genie integration and conversation memory improvements.',
        changes: [
          'Integrated Country Genie as a specialized panel for DMC-specific queries',
          'Extended conversation memory from 8 to 24 turns',
          'New structured output templates: policy briefs, project summaries, meeting minutes',
          'Expanded index to 140,000+ ADB institutional documents',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '12 Feb 2024',
        author: 'AIBD Research Team',
        summary: 'Enterprise launch — full GPT-4o deployment with RAG architecture and SSO.',
        changes: [
          'General availability launch for all ADB staff',
          'GPT-4o as primary generation model replacing GPT-3.5-turbo',
          'Full RAG implementation with Navigator as retrieval backbone',
          'SSO integration with ADB Azure Active Directory',
          'RAI assessment completed — Responsible AI Verified status granted',
        ],
      },
    ],
    viewerImages: [
      { label: 'Chat Interface',       sublabel: 'Main Q&A workspace',             src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'ADB Genie v2.4 · Aug 2026' },
      { label: 'Document Analysis',    sublabel: 'Upload and analyse files',        src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'PDF / DOCX / XLSX analysis mode' },
      { label: 'DataNex Integration',  sublabel: 'Integrated dataset discovery',    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'Catalogue-grounded retrieval' },
      { label: 'Country Intelligence', sublabel: 'DMC-specific knowledge panel',    src: 'https://images.unsplash.com/photo-1446776709462-d6af6dda0513?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'Country Genie integration' },
      { label: 'Climate Tools',        sublabel: 'SDR climate advisory mode',       src: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'IPCC AR6 grounded responses' },
      { label: 'Multilingual Mode',    sublabel: 'Cross-language document retrieval', src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'EN / FR / ES support' },
    ],
    relatedAssets: [
      { title: 'Navigator', tag: 'AI Agent', tagColor: 'violet', description: 'Core retrieval agent powering Genie\'s document search and citation-grounded responses.', rating: '4.5', users: '2.1K', downloads: '—', rai: true },
      { title: 'SDR Climate Mitigation Advisor', tag: 'AI Agent', tagColor: 'violet', description: 'Generates localized climate mitigation recommendations based on IPCC frameworks.', rating: '4.2', users: '980', downloads: '—', rai: true },
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Enterprise semantic search powering document retrieval across ADB SharePoint and knowledge stores.', rating: '4.6', users: '2.4K', downloads: '—', rai: true },
      { title: 'eGIS Platform', tag: 'AI Platform', tagColor: 'teal', description: 'Enterprise GIS platform providing geospatial analysis and map-based intelligence.', rating: '4.3', users: '4.2K', downloads: '—' },
    ],
    useCases: [
      {
        projectNumber: '59363-001',
        projectTitle: 'Reaping the Benefits of Artificial Intelligence for Service Excellence',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59363-001/main',
        usageSummary: 'Provided AI capability assessment and deployment framework guidance',
        usageDetail: 'ADB Genie\'s multi-agent capabilities were used by the project team to benchmark AI service excellence use cases across Asian governments, informing the project\'s digital service transformation roadmap for 6 participating DMCs.',
      },
      {
        projectNumber: '60083-001',
        projectTitle: 'Knowledge and Innovation for Transformative Economic Solutions',
        country: 'Sri Lanka',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/60083-001/main',
        usageSummary: 'Supported knowledge synthesis for economic innovation strategy development',
        usageDetail: 'Project teams used ADB Genie to synthesise economic development literature, ADB sector strategies, and Sri Lanka-specific economic data into structured briefs, accelerating the project\'s knowledge products by an estimated 40%.',
      },
      {
        projectNumber: '59430-001',
        projectTitle: 'ADB Early-Stage Innovation Platform',
        country: 'Regional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/59430-001/main',
        usageSummary: 'Enabled rapid screening and synthesis of early-stage innovation proposals',
        usageDetail: 'ADB Genie was used to process and summarise innovation concept notes submitted to the platform, applying structured evaluation criteria to screen 280 submissions and produce comparative assessments for the review committee.',
      },
      {
        projectNumber: '59320-001',
        projectTitle: 'Promoting Research and Innovation through Modern and Efficient Science',
        country: 'Indonesia',
        status: 'Approved',
        year: 2025,
        url: 'https://www.adb.org/projects/59320-001/main',
        usageSummary: 'Provided research and science policy benchmarking across Asian contexts',
        usageDetail: 'The platform was used to retrieve and synthesise ADB knowledge products on science and technology policy, enabling the project team to rapidly benchmark Indonesia\'s research ecosystem against regional comparators.',
      },
    ],
  },

  // ── Platform: eGIS Platform ───────────────────────────────────────────────
  {
    slug: 'egis-platform',
    assetId: 'PL-2026-01',
    category: 'Platforms',
    title: 'eGIS Platform',
    access: 'Restricted',
    rating: 4.3,
    ratingCount: '4.2K',
    views: 24800,
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '19 Aug 2026',
    firstSubmitted: '8 Jan 2023',
    pic: 'ITOP Geospatial Team\ngeo-infra@adb.org',
    projectId: 'IT_2022_001',
    tags: ['Geospatial', 'GIS', 'AI Product', 'Climate & Environment', 'Infrastructure'],
    department: 'Information Technology Department',
    contact: 'egis-support@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'Integrated enterprise GIS platform providing ADB staff and project teams with geospatial analysis, satellite imagery visualization, map-based intelligence, and project location tools across Asia-Pacific.',
    updateFrequency: 'Quarterly — geospatial layer updates; satellite imagery ingested as available from provider feeds',
    limitations: 'High-resolution satellite imagery is limited to areas with active ADB project operations. Some legacy GIS layers may require re-projection before use with current coordinate reference system standards.',
    sector: 'Information and Communications Technology',
    themes: ["Digital Transformation","Geospatial Analytics","Urban Development"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',                value: 'Enterprise geographic information system platform providing ADB staff and project teams with geospatial analysis, interactive mapping, satellite data access, and location-aware project management capabilities.' },
      { label: 'Intended Use',           value: 'Project site assessment, environmental due diligence, disaster risk mapping, infrastructure corridor planning, and publication-quality cartographic outputs for ADB reports and presentations.' },
      { label: 'Target Audience',        value: 'ADB project teams, environment and climate specialists, infrastructure engineers, and operational research staff across all departments.' },
      { label: 'Geographical Coverage',  value: 'Global — full coverage of ADB developing member countries; high-resolution layers for Asia-Pacific operational regions.' },
      { label: 'Data Maturity',          value: 'Production' },
      { label: 'Key Components',         value: 'Map Studio, Geospatial Retrieval API, Flooding Risk Engine, Land Cover Analyser, Infrastructure Corridor Planner, Environmental Assessment Layer Manager' },
      { label: 'Data Layers Available',  value: '240+ curated spatial layers — elevation (SRTM/Copernicus), satellite imagery (Sentinel-2, Planet), administrative boundaries, infrastructure, land use, climate hazards' },
    ],
    governance: [
      { label: 'Source',             value: 'Copernicus Sentinel-2 satellite, SRTM elevation, OpenStreetMap, ADB project GIS database, NOAA climate layers, national cadastral agencies' },
      { label: 'Permitted Use',      value: 'Project analysis, internal reporting, ADB-published cartographic outputs, and approved DMC government geospatial capacity building' },
      { label: 'Redistribution',     value: 'Map outputs and analysis may be published in ADB documents; underlying licensed satellite data not for redistribution to third parties' },
      { label: 'License Type',       value: 'ADB Restricted — Mixed (open source + commercial satellite data licences)' },
      { label: 'Access',    value: 'ADB Staff — project-specific sensitive layers restricted to project team members only' },
      { label: 'Publication Status', value: 'Active — continuous platform updates and layer additions' },
      { label: 'Update Method',      value: 'Continuous — satellite layers refreshed on Copernicus 5-day cycle; project GIS data updated by project teams in real time' },
    ],
    versions: [
      {
        version: 'v3.1',
        releaseDate: '5 Aug 2026',
        author: 'ITOP Geospatial Team',
        summary: 'Sentinel-2 real-time imagery refresh and Infrastructure Corridor Planner v2.',
        changes: [
          'Sentinel-2 imagery refresh reduced from 10-day to 5-day via Copernicus DIAS integration',
          'Infrastructure Corridor Planner v2 — added multi-modal routing (road + rail + maritime)',
          'New Environmental Assessment module with IUCN Red List species habitat overlays',
          'Added Planet Labs SkySat very-high-resolution imagery (0.5m) for project site validation',
          'Improved map export — publication-quality PDF/SVG at up to A0 format',
        ],
      },
      {
        version: 'v3.0',
        releaseDate: '22 Jan 2026',
        author: 'ITOP Geospatial Team',
        summary: 'Platform migration to cloud-native architecture with real-time collaboration.',
        changes: [
          'Migrated from on-premise ArcGIS Server to cloud-native deployment on Azure',
          'New real-time map collaboration — multiple users can annotate simultaneously',
          'Integrated Geospatial Flooding Risk Engine as a native platform component',
          'AI-powered layer recommendation based on project context',
          'SSO integration with ADB Azure Active Directory',
        ],
      },
      {
        version: 'v2.2',
        releaseDate: '8 Jan 2023',
        author: 'ITOP GIS Team',
        summary: 'Initial DataNex integration — all eGIS spatial layers catalogued in DataNex.',
        changes: [
          'Registered all eGIS spatial layers in DataNex catalogue for discoverability',
          'New ADB Project GIS Database layer — site boundaries, buffers, and areas of influence',
          '140 spatial layers available at launch across climate, infrastructure, and admin domains',
          'API gateway for Geospatial Retrieval and Flooding Risk Engine launched in beta',
        ],
      },
    ],
    viewerImages: [
      { label: 'Map Studio',             sublabel: 'Interactive mapping workspace',    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'eGIS Map Studio v3.1' },
      { label: 'Satellite Imagery',      sublabel: 'Sentinel-2 true colour composite', src: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'Sentinel-2 · Aug 2026' },
      { label: 'Flood Risk Overlay',     sublabel: 'Flooding Risk Engine output',      src: 'https://images.unsplash.com/photo-1559066653-edfd1e6ae1c5?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: '100-year flood extent · Mekong basin' },
      { label: 'Infrastructure Corridor', sublabel: 'Transport network planning layer', src: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'ASEAN road & rail network 2026' },
      { label: 'Land Cover Analysis',    sublabel: 'ESA WorldCover 10m classification', src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'ESA WorldCover · 10m resolution' },
      { label: 'Environmental Assessment', sublabel: 'Protected areas and biodiversity', src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=70&w=3000&auto=format&fit=crop', meta: 'IUCN protected areas + WDPA' },
    ],
    relatedAssets: [
      { title: 'Geospatial Flooding Risk Engine', tag: 'API', tagColor: 'teal', description: 'High-precision flood vulnerability assessments for infrastructure planning — built on eGIS.', rating: '4.2', users: '325', downloads: '88', rai: true },
      { title: 'Geospatial Retrieval', tag: 'AI Tool', tagColor: 'teal', description: 'AI-powered spatial data retrieval providing natural language access to GIS layers.', rating: '4.3', users: '1.1K', downloads: '—' },
      { title: 'Fishing Activity Indicator and Tropical Cyclone Data', tag: 'Dataset', tagColor: 'blue', description: 'AIS vessel tracking and cyclone track data for Pacific maritime risk analysis.', rating: '4.5', users: '640', downloads: '980', restricted: true },
      { title: 'ASEAN Urban Water Quality Index', tag: 'Dataset', tagColor: 'blue', description: 'Standardised water quality index across ASEAN metropolitan regions.', rating: '4.2', users: '325', downloads: '1.8K', restricted: true },
    ],
    useCases: [
      {
        projectNumber: '59389-001',
        projectTitle: 'Advancing Satellite-Based Augmentation Systems for the Association of Southeast Asian Nations',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59389-001/main',
        usageSummary: 'Produced geospatial analysis of ASEAN satellite navigation coverage gaps',
        usageDetail: 'eGIS was used to visualise GNSS signal coverage and augmentation system ground station locations across ASEAN, producing spatial gap analysis maps that directly informed the project\'s investment prioritisation for new ground infrastructure.',
      },
      {
        projectNumber: '60008-001',
        projectTitle: 'Border Upgrades for Integration, Logistics, and Development Facilitation',
        country: 'Regional',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/60008-001/main',
        usageSummary: 'Supported geospatial mapping of border crossing infrastructure and logistics corridors',
        usageDetail: 'Platform was used to map physical border infrastructure, road conditions, and hinterland connectivity for 14 border crossing points across Central Asia and South Asia, informing the project\'s investment sequencing and upgrade prioritisation.',
      },
      {
        projectNumber: '60010-001',
        projectTitle: 'National Port Master Plan Update and Logistics Study',
        country: 'Sri Lanka',
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/60010-001/main',
        usageSummary: 'Provided port spatial analysis and hinterland logistics mapping for Sri Lanka',
        usageDetail: 'eGIS was used to produce port catchment area maps, hinterland road network analysis, and port capacity visualisations that formed the spatial evidence base for the National Port Master Plan recommendations.',
      },
      {
        projectNumber: '54402-003',
        projectTitle: 'South Asia Subregional Economic Cooperation Customs and Logistics Modernization',
        country: 'Nepal',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/54402-003/main',
        usageSummary: 'Supported customs facility geospatial assessment and logistics corridor mapping',
        usageDetail: 'Platform-generated maps of customs facility locations, cross-border road conditions, and trade flow corridors across Nepal and the South Asia subregion informed the project\'s infrastructure gap assessment and modernisation sequencing.',
      },
    ],
  },

  // ── Single-scroll test asset ──────────────────────────────────────────────
  {
    slug: 'marine-activity-tropical-cyclone-dataset',
    assetId: 'FI-2026-03',
    category: 'Data Assets',
    title: 'Fishing Activity Indicator and Tropical Cyclone Data',
    access: 'Restricted to ITD',
    rating: 4.5,
    ratingCount: '640',
    views: 2140,
    downloads: '980',
    dataSize: '1.2 GB',
    rowCount: '8.4M',
    format: 'CSV / GeoJSON',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '8 Aug 2026',
    firstSubmitted: '5 Apr 2025',
    department: 'Information Technology Department',
    contact: 'maritime-data@adb.org',
    pic: 'N. Reyes · n.reyes@adb.org',
    projectId: 'DDP_2025_003',
    tags: ['Maritime', 'Climate Risk', 'Pacific', 'ITD'],
    shortDescription: 'The Fishing Activity Indicator and Tropical Cyclone Data dataset combines Automatic Identification System vessel position tracking, Global Fishing Watch fishing activity signals, and NOAA IBTrACS tropical cyclone track and intensity records to deliver an integrated spatiotemporal dataset for maritime risk and climate exposure analysis across the Western Pacific.\n\nThe dataset covers Cook Islands, Vanuatu, Tonga, Fiji, Solomon Islands, and adjacent Exclusive Economic Zones, recording vessel positions, fishing hours, cyclone centreline coordinates, wind radii, and a tiered risk classification for each vessel-cyclone event pairing. Records span January 2015 through December 2025 in CSV and GeoJSON formats across 8.4 million rows, with quarterly updates extending cyclone event windows and vessel activity records. AIS signal filtering reduced spoofed position entries by 34% in the most recent release.\n\nPrimary applications include disaster risk assessment for Pacific island infrastructure, fishery impact modelling under tropical cyclone scenarios, EEZ surveillance analytics, and maritime vulnerability screening for climate adaptation planning. The dataset is used by climate risk analysts, maritime planners, and disaster risk reduction specialists working with Pacific operations teams.\n\nMaintained by the Information Technology Department Maritime Data team, the dataset draws on Global Fishing Watch data under a CC BY-NC 4.0 licence combined with NOAA open data and SPREP regional climate datasets. Access is restricted to ITD-approved users.',
    sector: 'Agriculture and Natural Resources',
    themes: ["Climate Action","Disaster Risk Management","Environmental Sustainability"],
    geoCoverage: ['The Pacific'],
        overview: [
      { label: 'Purpose',            value: 'Combines Automatic Identification System (AIS) vessel tracking with Global Fishing Watch activity signals and tropical cyclone track/intensity records for maritime risk and climate exposure analysis.' },
      { label: 'Intended Use',       value: 'Supports disaster risk assessments, fishery impact modelling under cyclone scenarios, and infrastructure vulnerability screening for Pacific island DMCs.' },
      { label: 'Target Audience',    value: 'Climate risk analysts, maritime planners, disaster risk reduction specialists, and Pacific operations teams.' },
      { label: 'Geographical Coverage', value: 'Western Pacific — Cook Islands, Vanuatu, Tonga, Fiji, Solomon Islands, and adjacent EEZs.' },
      { label: 'Data Maturity',      value: 'Processed' },
      { label: 'Time Period Covered', value: 'January 2015 – December 2025' },
      { label: 'Data Type',          value: 'Spatiotemporal — vessel positions, fishing hours, cyclone centreline coordinates, and wind radii' },
      { label: 'Update Frequency',   value: 'Quarterly' },
    ],
    governance: [
      { label: 'Source',             value: 'Global Fishing Watch (AIS-derived), NOAA IBTrACS (cyclone tracks), SPREP climate datasets' },
      { label: 'Data Maturity',      value: 'Processed — AIS signals filtered, downsampled, and cross-referenced with cyclone event windows' },
      { label: 'Access',    value: 'Restricted' },
      { label: 'License',            value: 'CC BY-NC 4.0 (Global Fishing Watch) + NOAA Open Data' },
      { label: 'Retention Policy',   value: '7 years from collection date' },
      { label: 'Data Location',      value: 'data.adb.org / maritime / fishing-cyclone-v2' },
    ],
    viewerColumns: [
      { name: 'vessel_id',      type: 'string'  },
      { name: 'date',           type: 'date'    },
      { name: 'lat',            type: 'float'   },
      { name: 'lon',            type: 'float'   },
      { name: 'fishing_hours',  type: 'float'   },
      { name: 'cyclone_name',   type: 'string'  },
      { name: 'wind_kt',        type: 'integer' },
      { name: 'distance_km',    type: 'float'   },
      { name: 'risk_level',     type: 'string'  },
    ],
    viewerRows: [
      { vessel_id: 'AIS-441823', date: '2023-03-02', lat: '-17.74', lon: '168.32', fishing_hours: '6.2',  cyclone_name: 'Kevin',  wind_kt: '95',  distance_km: '142.4', risk_level: 'High'     },
      { vessel_id: 'AIS-552917', date: '2023-03-02', lat: '-18.10', lon: '168.51', fishing_hours: '0.0',  cyclone_name: 'Kevin',  wind_kt: '95',  distance_km: '98.7',  risk_level: 'Critical' },
      { vessel_id: 'AIS-338104', date: '2023-03-03', lat: '-17.45', lon: '168.20', fishing_hours: '1.1',  cyclone_name: 'Kevin',  wind_kt: '85',  distance_km: '211.3', risk_level: 'Moderate' },
      { vessel_id: 'AIS-774506', date: '2022-04-11', lat: '-15.38', lon: '-169.87',fishing_hours: '8.4',  cyclone_name: 'Gina',   wind_kt: '65',  distance_km: '380.2', risk_level: 'Low'      },
      { vessel_id: 'AIS-221039', date: '2022-04-12', lat: '-15.02', lon: '-170.14',fishing_hours: '0.3',  cyclone_name: 'Gina',   wind_kt: '70',  distance_km: '255.9', risk_level: 'Moderate' },
      { vessel_id: 'AIS-890234', date: '2021-02-18', lat: '-20.15', lon: '-175.40',fishing_hours: '0.0',  cyclone_name: 'Harold', wind_kt: '115', distance_km: '67.1',  risk_level: 'Critical' },
      { vessel_id: 'AIS-663812', date: '2021-02-19', lat: '-20.90', lon: '-175.68',fishing_hours: '0.0',  cyclone_name: 'Harold', wind_kt: '120', distance_km: '44.3',  risk_level: 'Critical' },
      { vessel_id: 'AIS-117045', date: '2020-10-27', lat: '-8.52',  lon: '160.34', fishing_hours: '5.7',  cyclone_name: 'Zazu',   wind_kt: '50',  distance_km: '489.0', risk_level: 'Low'      },
      { vessel_id: 'AIS-992301', date: '2020-10-28', lat: '-8.78',  lon: '160.12', fishing_hours: '7.3',  cyclone_name: 'Zazu',   wind_kt: '55',  distance_km: '421.6', risk_level: 'Low'      },
      { vessel_id: 'AIS-445677', date: '2019-04-05', lat: '-16.22', lon: '168.44', fishing_hours: '0.0',  cyclone_name: 'Harold', wind_kt: '105', distance_km: '78.8',  risk_level: 'Critical' },
    ],
    relatedAssets: [
      { title: 'Pacific Flood Hazard Model', tag: 'Dataset', tagColor: 'blue', description: '100-year and 500-year return period flood extents for Tongatapu, Rarotonga, and Aitutaki.', rating: '4.7', users: '320', downloads: '540' },
      { title: 'Coastal Inundation Risk Index', tag: 'Dataset', tagColor: 'blue', description: 'Sea-level rise projections combined with storm surge modelling for low-lying atoll areas.', rating: '4.4', users: '215', downloads: '390' },
      { title: 'AIS Vessel Tracking — Pacific EEZ', tag: 'Dataset', tagColor: 'blue', description: 'Hourly vessel position data from the Pacific Exclusive Economic Zones for maritime surveillance.', rating: '4.2', users: '180', downloads: '290', restricted: true },
    ],
    versions: [
      {
        version: 'v2.2',
        releaseDate: '8 Aug 2026',
        author: 'ITD Maritime Data',
        summary: 'Quarterly update extending the cyclone event window through Q1 2026.',
        changes: [
          'Added Cyclone Judy and Kevin (2023) track and impact records',
          'Extended vessel activity records through March 2026',
          'Improved AIS signal filtering — reduced spoofed position entries by 34%',
          'Added distance_km field measuring vessel proximity to cyclone centre',
        ],
        size: '1.2 GB',
      },
      {
        version: 'v2.1',
        releaseDate: '12 Jan 2026',
        author: 'ITD Maritime Data',
        summary: 'Added SPREP climate overlay and expanded to Solomon Islands EEZ.',
        changes: [
          'Integrated SPREP regional climate datasets for wind field cross-validation',
          'Extended coverage to Solomon Islands Exclusive Economic Zone',
          'Classified risk_level into 4 tiers (Low / Moderate / High / Critical) replacing binary flag',
        ],
        size: '1.0 GB',
      },
      {
        version: 'v2.0',
        releaseDate: '5 Apr 2025',
        author: 'ITD Maritime Data',
        summary: 'Initial production release combining Global Fishing Watch AIS and NOAA IBTrACS cyclone tracks.',
        changes: [
          'First stable production release covering Western Pacific — January 2015 to December 2024',
          'Fused Global Fishing Watch (CC BY-NC 4.0) with NOAA IBTrACS Best Track dataset',
          'Covered 5 Pacific island DMC EEZs at launch',
          'Downsampled AIS positions to 1-hour intervals to reduce file size',
        ],
        size: '890 MB',
      },
    ],
    useCases: [
      {
        projectNumber: '58056-001',
        projectTitle: 'Enhancing Climate Resilience of Coastal Communities Sector Project',
        country: 'Fiji',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58056-001/main',
        usageSummary: 'Provided coastal exposure and fishing activity data for community risk profiling',
        usageDetail: 'AIS fishing vessel density data combined with cyclone track records were used to assess the exposure of coastal fishing communities to climate hazards, informing the project\'s prioritisation of 48 target communities for resilience investment.',
      },
      {
        projectNumber: '57294-001',
        projectTitle: 'Healthy Oceans and Water Security Improvement Project',
        country: 'Fiji',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/57294-001/main',
        usageSummary: 'Anchored ocean health and fishing pressure baselines for Fiji\'s EEZ',
        usageDetail: 'Fishing activity intensity maps derived from AIS data provided baseline evidence of fishing pressure across Fiji\'s exclusive economic zone, supporting the project\'s resource management planning and marine protected area designation.',
      },
      {
        projectNumber: '57318-001',
        projectTitle: 'Tropical Cyclone Lola Emergency Response Project',
        country: 'Vanuatu',
        status: 'Closed',
        year: 2023,
        url: 'https://www.adb.org/projects/57318-001/main',
        usageSummary: 'Supported cyclone track analysis for emergency response and damage assessment',
        usageDetail: 'IBTrACS cyclone track records for Tropical Cyclone Lola were used to model wind field exposure and storm surge inundation across Vanuatu\'s coastal infrastructure, informing ADB\'s rapid damage assessment and emergency financing decisions.',
      },
      {
        projectNumber: '54212-001',
        projectTitle: 'Building Coastal Resilience through Nature-Based and Integrated Solutions',
        country: 'Regional',
        status: 'Active',
        year: 2021,
        url: 'https://www.adb.org/projects/54212-001/main',
        usageSummary: 'Provided coastal vulnerability mapping for nature-based solution siting',
        usageDetail: 'Fishing vessel density and cyclone exposure layers were overlaid with bathymetric data to identify coastal segments with highest storm surge vulnerability, guiding the project\'s siting of mangrove restoration and reef rehabilitation interventions.',
      },
    ],
  },

  // ── AIS from UNGP ────────────────────────────────────────────────────────
  {
    slug: 'maritime-vessel-movement-ais-ungp-dataset',
    assetId: 'DA-2025-038',
    category: 'Data Assets',
    title: 'AIS from UNGP',
    access: 'Restricted — Request Access Required',
    requestAccessCta: true,
    accessMethod: 'api',
    rating: 4.4,
    ratingCount: '218',
    views: 1840,
    downloads: '312',
    dataSize: '94.2 GB',
    rowCount: '18.6B',
    format: 'Parquet / CSV',
    ingestionStatus: 'Ingested',
    parentProduct: 'DataNex 1.0',
    parentProductSlug: 'datanex-1-0',
    governanceVerified: true,
    lastUpdated: '28 Aug 2026',
    firstSubmitted: '11 Mar 2025',
    department: 'Sustainable Development & Climate Change',
    contact: 'maritime-data@adb.org',
    pic: 'Carlos Mendoza · c.mendoza@adb.org',
    projectId: 'DDP_2025_038',
    tags: ['Maritime', 'Vessel Tracking', 'Trade', 'UN Global Platform'],
    shortDescription: 'AIS from UNGP delivers Automatic Identification System vessel position and voyage data sourced from the United Nations Global Platform, aggregated from SpireGlobal and exactEarth satellite constellations supplemented by terrestrial AIS for coastal coverage. The dataset covers commercial shipping, tankers, bulk carriers, container vessels, and offshore supply vessels transiting Asia-Pacific sea lanes across 38 ADB developing member country coastlines.\n\nCoverage spans key maritime chokepoints including the Malacca Strait, Lombok Strait, and Luzon Strait, with records from January 2020 through August 2026 refreshed monthly. The dataset contains 18.6 billion position ping records — vessel MMSI, name, type, timestamp, coordinates, speed, heading, destination, and flag state — totalling 94.2 gigabytes in Parquet and CSV format. Aggregated voyage and port call tabular outputs are released on the 15th of each month following a Spark-based deduplication and port-call inference pipeline.\n\nPrimary use cases include maritime trade flow analysis, port throughput monitoring, supply chain disruption assessment, blue economy research, and illegal fishing detection across ADB developing member countries. The dataset supports transport economists, maritime policy analysts, and trade researchers across Pacific, Southeast Asia, and Central Asia regional departments.\n\nAccess requires a formal request and is governed under the UNGP Restricted Data Sharing Agreement, to which ADB has been a signatory since March 2025. Raw AIS pings may not be externally published; derived aggregates may be shared with UNGP attribution and approval.',
    sector: 'Transport',
    themes: ["Regional Cooperation","Inclusive Economic Growth","Digital Transformation"],
    geoCoverage: ['East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose', value: 'Provides Automatic Identification System (AIS) vessel position and voyage data sourced from the United Nations Global Platform, covering commercial shipping, tankers, bulk carriers, and container vessels transiting Asia-Pacific sea lanes.' },
      { label: 'Intended Use', value: 'Maritime trade flow analysis, port throughput monitoring, supply chain disruption assessment, blue economy research, and illegal fishing detection across ADB developing member countries.' },
      { label: 'Target Audience', value: 'Transport economists, maritime policy analysts, trade researchers, and ADB project teams in the Pacific, Southeast Asia, and Central Asia regional departments.' },
      { label: 'Geographical Coverage', value: 'Asia-Pacific exclusive economic zones: covering 38 ADB developing member country coastlines, major chokepoints including Malacca Strait, Lombok Strait, and Luzon Strait.' },
      { label: 'Data Maturity', value: 'Production' },
      { label: 'Time Period Covered', value: 'January 2020 – August 2026 (monthly refresh)' },
      { label: 'Data Type', value: 'Point — vessel position pings (lat/lon, timestamp, speed, heading, vessel type, MMSI); aggregated voyage and port call tabular outputs' },
      { label: 'Update Frequency', value: 'Monthly — raw pings ingested weekly, monthly aggregates released on the 15th' },
    ],
    governance: [
      { label: 'Source', value: 'United Nations Global Platform (UNGP) — satellite AIS feed aggregated from SpireGlobal and exactEarth constellation; supplemented by terrestrial AIS for coastal coverage' },
      { label: 'Permitted Use', value: 'Internal ADB analysis, DMC government advisory work, and ADB-funded research publications with UNGP attribution' },
      { label: 'Redistribution', value: 'Not permitted — raw AIS pings are commercially licensed through UNGP. Derived aggregates may be published with attribution and UNGP approval' },
      { label: 'License Type', value: 'UNGP Restricted Data Sharing Agreement — ADB signatory since March 2025; renewal due March 2027' },
      { label: 'Publication Restrictions', value: 'Raw AIS pings may not be published externally. Derived trade flow indices, port call counts, and connectivity metrics may be published with UNGP attribution and approval.' },
      { label: 'Update Method', value: 'Automated — UNGP SFTP pull to ADB DataNex staging, Spark-based deduplication and port-call inference pipeline, Parquet partitioned by month and vessel type' },
      { label: 'Data Location', value: 'data.adb.org / maritime / ais-ungp / v1' },
    ],
    viewerColumns: [
      { name: 'mmsi',         type: 'string'   },
      { name: 'vessel_name',  type: 'string'   },
      { name: 'vessel_type',  type: 'string'   },
      { name: 'timestamp',    type: 'datetime' },
      { name: 'lat',          type: 'float'    },
      { name: 'lon',          type: 'float'    },
      { name: 'speed_kn',     type: 'float'    },
      { name: 'heading_deg',  type: 'integer'  },
      { name: 'destination',  type: 'string'   },
      { name: 'flag_state',   type: 'string'   },
    ],
    viewerRows: [
      { mmsi: '477305700', vessel_name: 'COSCO SHIPPING ARIES',  vessel_type: 'Container',    timestamp: '2026-08-15 02:14:03', lat: '1.2892',   lon: '103.8550', speed_kn: '14.2', heading_deg: '042', destination: 'SGSIN',  flag_state: 'HKG' },
      { mmsi: '338234874', vessel_name: 'TANGGUH BATUR',         vessel_type: 'LNG Tanker',   timestamp: '2026-08-15 02:18:41', lat: '-6.0731',  lon: '106.8312', speed_kn: '11.8', heading_deg: '285', destination: 'JPYOK',  flag_state: 'IDN' },
      { mmsi: '566000430', vessel_name: 'MOUNT CAMERON',         vessel_type: 'Bulk Carrier', timestamp: '2026-08-15 02:23:17', lat: '22.3193',  lon: '114.1694', speed_kn: '0.0',  heading_deg: '000', destination: 'CNSHK',  flag_state: 'SGP' },
      { mmsi: '352003557', vessel_name: 'PACIFIC GLORY',         vessel_type: 'Container',    timestamp: '2026-08-15 02:31:55', lat: '13.0827',  lon: '80.2707',  speed_kn: '13.6', heading_deg: '180', destination: 'LKCMB',  flag_state: 'PAN' },
      { mmsi: '636092501', vessel_name: 'STELLAR ORCA',          vessel_type: 'Bulk Carrier', timestamp: '2026-08-15 02:35:22', lat: '10.3157',  lon: '123.9050', speed_kn: '9.4',  heading_deg: '110', destination: 'PHMNL',  flag_state: 'LBR' },
      { mmsi: '563048300', vessel_name: 'EVER GENTLE',           vessel_type: 'Container',    timestamp: '2026-08-15 02:40:08', lat: '25.0343',  lon: '121.5654', speed_kn: '16.1', heading_deg: '052', destination: 'JPOSA',  flag_state: 'TWN' },
      { mmsi: '477618700', vessel_name: 'CSCL ARCTIC OCEAN',     vessel_type: 'Container',    timestamp: '2026-08-15 02:44:59', lat: '22.2855',  lon: '114.1577', speed_kn: '0.0',  heading_deg: '000', destination: 'CNSHK',  flag_state: 'HKG' },
      { mmsi: '219626000', vessel_name: 'MAERSK NEWTON',         vessel_type: 'Container',    timestamp: '2026-08-15 02:49:33', lat: '1.3521',   lon: '103.9197', speed_kn: '15.8', heading_deg: '225', destination: 'NLRTM',  flag_state: 'DNK' },
      { mmsi: '548586600', vessel_name: 'VISTA STAR',            vessel_type: 'Ro-Pax',       timestamp: '2026-08-15 02:53:14', lat: '10.2936',  lon: '123.9020', speed_kn: '18.3', heading_deg: '310', destination: 'PHCEL',  flag_state: 'PHL' },
      { mmsi: '503514000', vessel_name: 'IRON CHIEFTAIN',        vessel_type: 'Bulk Carrier', timestamp: '2026-08-15 02:57:47', lat: '-33.8688', lon: '151.2093', speed_kn: '7.2',  heading_deg: '185', destination: 'AUPSY',  flag_state: 'AUS' },
    ],
    relatedAssets: [
      { title: 'Flights Data from OAG', tag: 'Dataset', tagColor: 'blue', description: 'Global flight schedule and traffic data from OAG for air connectivity and transport analysis.', rating: '4.3', users: '410', downloads: '820', restricted: true },
      { title: 'Southeast Asia Infrastructure Index', tag: 'Dataset', tagColor: 'blue', description: 'Composite infrastructure quality index for Southeast Asian economies.', rating: '4.5', users: '320', downloads: '640' },
      { title: 'Fishing Activity Indicator and Tropical Cyclone Data', tag: 'Dataset', tagColor: 'blue', description: 'AIS-derived fishing activity and cyclone track data for Pacific maritime risk analysis.', rating: '4.5', users: '640', downloads: '980', restricted: true },
    ],
    versions: [
      {
        version: 'v1.3',
        releaseDate: '15 Aug 2026',
        author: 'SDCC Maritime Data Team',
        summary: 'Monthly refresh — August 2026 data; improved port-call inference model.',
        changes: [
          'Added August 2026 vessel position pings (1.4B new records)',
          'Improved port-call detection model — reduced false positives by 18%',
          'Extended vessel type taxonomy to include offshore supply vessels',
          'Fixed encoding issue in vessel name field for Cyrillic-script flags',
        ],
        size: '3.8 GB',
      },
      {
        version: 'v1.2',
        releaseDate: '15 Jul 2026',
        author: 'SDCC Maritime Data Team',
        summary: 'Backfill coverage for 2023 gap in Melanesia sub-region.',
        changes: [
          'Backfilled 2023 Q1–Q2 pings for Papua New Guinea and Solomon Islands EEZs',
          'Added SpireGlobal satellite passes for low-AIS-density Pacific atolls',
          'Aligned MMSI-to-flag mapping to IMO database July 2026 release',
        ],
        size: '3.6 GB',
      },
      {
        version: 'v1.0',
        releaseDate: '11 Mar 2025',
        author: 'SDCC Maritime Data Team',
        summary: 'Initial release under UNGP data sharing agreement.',
        changes: [
          'Initial ingestion: January 2020 – February 2025 historical AIS pings',
          'Parquet partitioning by month and vessel type',
          'Port-call inference using k-means clustering on dwell-time and speed profiles',
          'MMSI-to-vessel metadata join from IHS Fairplay registry',
        ],
        size: '3.1 GB',
      },
    ],
    useCases: [
      {
        projectNumber: '60347-001',
        projectTitle: 'Supporting the Greater Mekong Subregion Economic Corridor Transport System',
        country: "Lao People's Democratic Republic",
        status: 'Approved',
        year: 2026,
        url: 'https://www.adb.org/projects/60347-001/main',
        usageSummary: 'Provided maritime trade flow analysis along GMS inland waterway corridors',
        usageDetail: 'AIS vessel movement data along the Mekong River and connecting sea lanes was used to quantify freight volumes and identify bottlenecks in the GMS transport corridor, informing the project\'s investment sequencing for inland port and road link upgrades.',
      },
      {
        projectNumber: '58228-002',
        projectTitle: 'Airport Infrastructure Improvement Project (SEFF Activity 1)',
        country: 'Georgia',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/58228-002/main',
        usageSummary: 'Supported multimodal connectivity analysis linking sea and air freight flows',
        usageDetail: 'Vessel port call data from Batumi and Poti was combined with OAG air cargo schedules to model Georgia\'s multimodal freight corridors, providing the evidence base for the project\'s airport cargo facility investment case.',
      },
      {
        projectNumber: '59389-001',
        projectTitle: 'Advancing Satellite-Based Augmentation Systems for the Association of Southeast Asian Nations',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59389-001/main',
        usageSummary: 'Anchored vessel traffic density mapping for maritime navigation safety assessment',
        usageDetail: 'AIS position pings were aggregated into vessel traffic density grids for key ASEAN sea lanes, providing the spatial evidence base for prioritising which maritime corridors would benefit most from satellite-based augmentation system coverage improvements.',
      },
    ],
  },

  // ── Dataset: ADB Careers Dataset ─────────────────────────────────────────
  {
    slug: 'adb-careers-dataset',
    assetId: 'DA-2024-01',
    category: 'Data Assets',
    title: 'ADB Careers Dataset',
    access: 'All ADB',
    rating: 4.1,
    ratingCount: '620',
    views: 3840,
    dataSize: '180 MB',
    rowCount: '42K',
    format: 'CSV / JSON',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '15 Aug 2026',
    firstSubmitted: '10 Mar 2024',
    pic: 'Human Resources Division\nhr-data@adb.org',
    projectId: 'DDP_2024_001',
    tags: ['Careers', 'Human Resources', 'Recruitment', 'Workforce'],
    department: 'Human Resources Division',
    contact: 'hr-data@adb.org',
    shortDescription: 'The ADB Careers Dataset is a structured repository of career opportunities, job postings, position descriptions, and recruitment-related information sourced from ADB\'s e-Recruitment system, HR Information System, and Workday HR module. The dataset provides the analytical foundation for workforce planning, talent pipeline modelling, and diversity tracking across ADB headquarters and all regional and resident missions.\n\nRecords encompass job posting identifiers, role titles, department, duty station, position level, posting and closing dates, status, salary band, and role classification taxonomy aligned to the ADB job family framework. The dataset spans January 2020 to the present, totalling approximately 42,000 records across 180 megabytes in CSV and JSON format, and is refreshed weekly via an automated batch ETL from Workday every Monday at 02:00 SGT.\n\nPrimary applications include the HR Division\'s quarterly workforce diversity dashboard for tracking gender representation and developing member country staff ratios, talent pipeline analytics for recruitment cycle optimisation, skill-mix evolution monitoring across departments, and supporting internal research into recruitment and workforce equity patterns. The dataset is maintained by the Human Resources Division and is accessible to HR Division staff, the People Analytics team, and approved analytical project teams.\n\nAccess is controlled under the ADB Internal HR Controlled Access licence. Individual-level data is subject to the ADB Staff Privacy Policy; no use of individual records for performance decisions is permitted without explicit HR Division approval.',
    sector: 'Public Sector Management',
    themes: ["Gender Equality","Institutional Effectiveness","Inclusive Economic Growth"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Structured dataset of ADB career opportunities, job postings, position descriptions, and recruitment-related information to support workforce planning and talent acquisition analytics.' },
      { label: 'Intended Use',          value: 'Internal HR analytics, workforce planning, talent pipeline modelling, and diversity tracking across ADB departments and country offices.' },
      { label: 'Target Audience',       value: 'HR Division staff, People Analytics team, and approved internal project teams using ADB workforce data.' },
      { label: 'Geographical Coverage', value: 'ADB Headquarters (Manila) and all regional and resident missions.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Time Period Covered',   value: 'January 2020 – present; updated weekly' },
      { label: 'Data Type',             value: 'Tabular — job postings, role classifications, application metadata, and salary bands' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB e-Recruitment system, HR Information System (HRIS), and Workday HR module' },
      { label: 'Permitted Use',      value: 'Internal HR analytics, workforce dashboards, and approved research; no use of individual-level data for performance decisions without HR approval' },
      { label: 'Redistribution',     value: 'Not permitted; individual-level data is strictly internal and subject to ADB Staff Privacy Policy' },
      { label: 'License Type',       value: 'ADB Internal — HR Controlled Access' },
      { label: 'Access',    value: 'Controlled — HR Division and approved analytics teams only' },
      { label: 'Publication Status', value: 'Active — weekly batch refresh from e-Recruitment and HRIS' },
      { label: 'Update Method',      value: 'Weekly batch ETL — automated extract from Workday every Monday 02:00 SGT' },
      { label: 'Data Location',      value: 'unity.adb.org / hr / careers_dataset_v2' },
    ],
    viewerColumns: [
      { name: 'posting_id',    type: 'string'  },
      { name: 'title',         type: 'string'  },
      { name: 'department',    type: 'string'  },
      { name: 'duty_station',  type: 'string'  },
      { name: 'level',         type: 'string'  },
      { name: 'posted_date',   type: 'date'    },
      { name: 'closing_date',  type: 'date'    },
      { name: 'status',        type: 'string'  },
    ],
    viewerRows: [
      { posting_id: 'ADB-2026-HR-0142', title: 'Senior Finance Officer', department: 'Budget & Management Services', duty_station: 'Manila', level: 'IS-5', posted_date: '2026-07-01', closing_date: '2026-07-22', status: 'Filled' },
      { posting_id: 'ADB-2026-HR-0143', title: 'Digital Technology Analyst', department: 'Digital Technology & Innovation', duty_station: 'Manila', level: 'IS-3', posted_date: '2026-07-05', closing_date: '2026-07-28', status: 'Filled' },
      { posting_id: 'ADB-2026-HR-0151', title: 'Climate Change Specialist', department: 'CCSD', duty_station: 'Manila', level: 'IS-4', posted_date: '2026-07-12', closing_date: '2026-08-04', status: 'Filled' },
      { posting_id: 'ADB-2026-HR-0158', title: 'Transport Economist', department: 'SERD', duty_station: 'Manila', level: 'IS-4', posted_date: '2026-07-20', closing_date: '2026-08-12', status: 'Closed' },
      { posting_id: 'ADB-2026-HR-0162', title: 'Data Scientist', department: 'ERDI', duty_station: 'Manila', level: 'IS-3', posted_date: '2026-07-25', closing_date: '2026-08-18', status: 'Closed' },
      { posting_id: 'ADB-2026-HR-0170', title: 'Urban Development Specialist', department: 'CWRD', duty_station: 'Almaty', level: 'IS-4', posted_date: '2026-08-01', closing_date: '2026-08-25', status: 'Active' },
      { posting_id: 'ADB-2026-HR-0175', title: 'Financial Management Specialist', department: 'SPRD', duty_station: 'Manila', level: 'IS-4', posted_date: '2026-08-05', closing_date: '2026-08-29', status: 'Active' },
      { posting_id: 'ADB-2026-HR-0181', title: 'Gender Specialist', department: 'SDCC', duty_station: 'Manila', level: 'IS-4', posted_date: '2026-08-10', closing_date: '2026-09-03', status: 'Active' },
    ],
    versions: [
      {
        version: 'v2.1',
        releaseDate: '15 Aug 2026',
        author: 'HR Data Team',
        summary: 'Added salary band and duty station fields; improved data quality checks.',
        changes: [
          'Added salary_band and duty_station fields to posting records',
          'Improved deduplication of re-posted positions across recruitment cycles',
          'New /status filter parameter in data API for active vs. closed postings',
          'Historical backfill extended to January 2020',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '10 Mar 2024',
        author: 'HR Data Team',
        summary: 'Initial DataNex publication — migrated from legacy HR reporting warehouse.',
        changes: [
          'First publication of ADB Careers Dataset on DataNex platform',
          'Structured schema aligned to HRIS source tables',
          'Automated weekly refresh pipeline established',
          'Role classification taxonomy harmonised with ADB job family framework',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'HR-INT-2026-01',
        projectTitle: 'ADB Workforce Diversity Dashboard',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Powers diversity metrics and representation tracking across recruitment cycles',
        usageDetail: 'The dataset feeds the HR Division\'s quarterly workforce diversity dashboard, tracking gender representation, developing member country (DMC) staff ratios, and skill-mix evolution across ADB departments and regional missions.',
      },
      {
        projectNumber: 'HR-INT-2025-04',
        projectTitle: 'Talent Pipeline Analytics Initiative',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Enabled predictive modelling of succession gaps and critical-role vacancies',
        usageDetail: 'Time-series posting data and role-level fill rates were used to build a predictive model identifying 23 critical positions at succession risk over the next 18 months, enabling proactive pipeline development for key technical roles.',
      },
    ],
    feedback: [
      { id: 1, user: 'J. Reyes',     rating: 5, date: 'Aug 12, 2026', project: 'ADB Workforce Diversity Dashboard',       projectNumber: 'HR-INT-2026-01', comment: 'Invaluable for our quarterly diversity reporting. The Workday integration means data is always up to date and we spend far less time on manual extraction.' },
      { id: 2, user: 'S. Krishnan',  rating: 4, date: 'Jul 30, 2026', project: 'Talent Pipeline Analytics Initiative',   projectNumber: 'HR-INT-2025-04', comment: 'Enabled us to build the succession risk model we\'d been planning for two years. Role-level fill-rate time series was exactly what we needed.' },
      { id: 3, user: 'C. Ababio',    rating: 4, date: 'Jul 05, 2026', project: 'ADB Workforce Diversity Dashboard',       projectNumber: 'HR-INT-2026-01', comment: 'Good coverage and documentation. DMC staff ratio breakdowns are particularly useful for our representation tracking.' },
      { id: 4, user: 'P. Mendoza',   rating: 5, date: 'Jun 18, 2026', project: 'Talent Pipeline Analytics Initiative',   projectNumber: 'HR-INT-2025-04', comment: 'The posting history going back to 2020 gave us the longitudinal depth needed for meaningful trend analysis. Excellent dataset.' },
    ],
  },

  // ── Dataset: ADB Enterprise Document Registry Dataset ────────────────────
  {
    slug: 'adb-enterprise-document-registry-dataset',
    assetId: 'DA-2024-02',
    category: 'Data Assets',
    title: 'ADB Enterprise Document Registry Dataset',
    access: 'All ADB',
    rating: 4.4,
    ratingCount: '1.1K',
    views: 6720,
    dataSize: '4.8 GB',
    rowCount: '2.1M',
    format: 'Parquet / JSON',
    ingestionStatus: 'Ingested',
    governanceVerified: true,
    lastUpdated: '18 Aug 2026',
    firstSubmitted: '20 May 2024',
    pic: 'Knowledge Management Centre\nkmc@adb.org',
    projectId: 'DDP_2024_002',
    tags: ['Document Management', 'Knowledge Management', 'Metadata', 'Enterprise'],
    department: 'Knowledge Management Centre',
    contact: 'kmc@adb.org',
    shortDescription: 'The ADB Enterprise Document Registry Dataset is the central metadata repository indexing ADB\'s full institutional document corpus — encompassing reports, policies, board papers, project appraisal reports, and operational files from ADB\'s inception in 1966 to the present. It serves as the authoritative index for AI-powered document discovery, institutional knowledge management, and governance compliance tracking across all ADB member countries.\n\nThe registry aggregates metadata from eOperations, SharePoint document libraries, the board papers portal, and the ADB publications database, covering document identifiers, classifications, department ownership, publication status, storage locations, access tier, and AI-readiness fields including embedding status and semantic tags. The dataset contains 2.1 million document records across 4.8 gigabytes in Parquet and JSON format, with a daily incremental update pipeline extracting document change events at 01:00 SGT.\n\nPrimary uses include powering ADB Genie\'s Intelligent File Search — enabling staff to locate over 140,000 institutional documents through natural-language queries — supporting AI retrieval pipeline development, underpinning document governance compliance tracking, and enabling institutional analytics on publication patterns and knowledge asset coverage.\n\nMaintained by the Knowledge Management Centre, the registry operates under a tiered access model: general staff can query public and internal document records, while board-restricted materials require elevated clearance. The metadata schema was expanded in 2026 to include AI training fields and bulk Parquet export endpoints for AI development workflows.',
    sector: 'Public Sector Management',
    themes: ["Knowledge Management","Institutional Effectiveness","Digital Transformation"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Central inventory and metadata repository of ADB documents, classifications, ownership, and document locations — covering all member countries and operational sectors.' },
      { label: 'Intended Use',          value: 'AI-powered document discovery, knowledge retrieval, institutional knowledge management, and document governance compliance tracking.' },
      { label: 'Target Audience',       value: 'All ADB staff, AI system developers integrating document retrieval, and Knowledge Management Centre teams.' },
      { label: 'Geographical Coverage', value: 'All ADB member countries — headquarters, regional departments, and resident missions.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Time Period Covered',   value: 'ADB inception (1966) to present; index updated daily' },
      { label: 'Data Type',             value: 'Structured metadata — document identifiers, classifications, ownership, status, and storage locations' },
    ],
    governance: [
      { label: 'Source',             value: 'eOperations document management system, SharePoint document libraries, board papers portal, and ADB publications database' },
      { label: 'Permitted Use',      value: 'Knowledge retrieval, AI system integration, document governance, and institutional analytics; access to sensitive document records requires departmental clearance' },
      { label: 'Redistribution',     value: 'Document metadata may be cited in ADB publications; confidential board and restricted document records are not redistributable' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access with Restricted Record Tiers' },
      { label: 'Access',    value: 'Tiered — general staff access to public and internal documents; board/restricted records require elevated clearance' },
      { label: 'Publication Status', value: 'Active — daily incremental index update from eOperations' },
      { label: 'Update Method',      value: 'Daily batch ETL — document change events trigger metadata extraction at 01:00 SGT' },
      { label: 'Data Location',      value: 'unity.adb.org / kmc / enterprise_doc_registry_v3' },
    ],
    viewerColumns: [
      { name: 'doc_id',        type: 'string'  },
      { name: 'title',         type: 'string'  },
      { name: 'doc_type',      type: 'string'  },
      { name: 'department',    type: 'string'  },
      { name: 'status',        type: 'string'  },
      { name: 'created_date',  type: 'date'    },
      { name: 'last_modified', type: 'date'    },
      { name: 'access_level',  type: 'string'  },
    ],
    viewerRows: [
      { doc_id: 'DOC-2026-0041821', title: 'Country Partnership Strategy: Philippines 2024–2030', doc_type: 'Strategy Document', department: 'SERD', status: 'Published', created_date: '2026-01-15', last_modified: '2026-03-10', access_level: 'Public' },
      { doc_id: 'DOC-2026-0041944', title: 'ADB Climate Change Operational Framework 2026', doc_type: 'Policy', department: 'CCSD', status: 'Published', created_date: '2026-02-08', last_modified: '2026-02-08', access_level: 'Public' },
      { doc_id: 'DOC-2026-0042103', title: 'Project Completion Report: 52319-001', doc_type: 'PCR', department: 'IED', status: 'Published', created_date: '2026-03-22', last_modified: '2026-03-22', access_level: 'Public' },
      { doc_id: 'DOC-2026-0042567', title: 'Q2 2026 Disbursement Performance Report', doc_type: 'Management Report', department: 'CTL', status: 'Internal', created_date: '2026-07-05', last_modified: '2026-07-08', access_level: 'Internal' },
      { doc_id: 'DOC-2026-0042891', title: 'Digital Transformation Roadmap FY2026–2028', doc_type: 'Strategy Document', department: 'DTI', status: 'Internal', created_date: '2026-08-01', last_modified: '2026-08-14', access_level: 'Internal' },
    ],
    versions: [
      {
        version: 'v3.2',
        releaseDate: '18 Aug 2026',
        author: 'Knowledge Management Centre',
        summary: 'Expanded metadata schema with AI readiness fields and semantic tags.',
        changes: [
          'Added embedding_status and chunk_count fields to support AI retrieval pipelines',
          'Introduced semantic_tags array field — auto-generated topic labels for each document',
          'Improved coverage: added 180,000 legacy eOperations documents backfilled to 1990',
          'New /bulk-export endpoint returning Parquet snapshots for AI training workflows',
        ],
      },
      {
        version: 'v3.0',
        releaseDate: '20 May 2024',
        author: 'Knowledge Management Centre',
        summary: 'Initial DataNex publication — unified registry across eOperations, SharePoint, and board portal.',
        changes: [
          'First publication unifying document metadata from 4 source systems',
          'Standardised document classification taxonomy aligned to ADB Document Registry Policy',
          'Daily automated refresh pipeline established',
          'Access tier fields added to support document-level permission enforcement',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'DTI-INT-2026-02',
        projectTitle: 'ADB Genie Knowledge Index Expansion',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Powers document discovery backbone for Intelligent File Search and ADB Genie',
        usageDetail: 'The registry\'s metadata and storage-location fields are the primary index powering ADB Genie\'s Intelligent File Search, enabling staff to locate and retrieve over 140,000 institutional documents through natural-language queries.',
      },
    ],
  },

  // ── Dataset: ADB Key Indicators Database (KIDB) ──────────────────────────
  {
    slug: 'adb-key-indicators-database-kidb',
    assetId: 'DA-2023-01',
    category: 'Data Assets',
    title: 'ADB Key Indicators Database (KIDB)',
    access: 'All ADB',
    rating: 4.7,
    ratingCount: '3.8K',
    views: 22400,
    dataSize: '1.2 GB',
    rowCount: '8.4M',
    format: 'CSV / SDMX / JSON',
    ingestionStatus: 'Ingested',
    lastUpdated: '1 Sep 2026',
    firstSubmitted: '15 Jun 2023',
    pic: 'Statistics and Data Innovation Unit\nkidb@adb.org',
    projectId: 'DDP_2023_001',
    tags: ['Macroeconomics', 'Statistics', 'Development Indicators', 'SDMX', 'Open Data'],
    department: 'Economic Research and Development Impact',
    contact: 'kidb@adb.org',
    shortDescription: 'The ADB Key Indicators Database (KIDB) is ADB\'s flagship cross-country statistical catalogue, compiling 1,400-plus indicator series across 12 thematic domains — economy, labour markets, health, education, energy, environment, transport, and governance — into an SDMX-harmonised country-year panel table covering all 68 ADB member countries. The database spans 1960 to the present and forms the statistical backbone for ADB\'s analytical and operational knowledge workflows.\n\nData are compiled from national statistics offices, the IMF, World Bank, UN agencies, ADB project data, and ERDI statistical models, and harmonised to SDMX 2.1 standard for interoperability with international data exchange systems. The dataset contains 8.4 million rows across CSV, SDMX, and JSON formats totalling 1.2 gigabytes, with an annual major release aligned to the Key Indicators publication cycle and monthly patch updates for priority series.\n\nPrimary uses include country-level benchmarking and policy analysis, project due diligence and results framework design, inputs to ADB flagship publications including the Asian Development Outlook and Key Indicators for Asia and the Pacific, statistical capacity assessment in country-level programmes, and agent-accessible development intelligence through DataNex and the ADB OpenData API.\n\nKIDB is published under the ADB Open Data Licence (CC BY 4.0 equivalent) and is freely accessible via the ADB Open Data portal, DataNex, and an SDMX REST API v3 endpoint. It is maintained by the Statistics and Data Innovation Unit within the Economic Research and Development Impact department.',
    sector: 'Multisector',
    themes: ["Inclusive Economic Growth","Poverty Reduction","Gender Equality"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Cross-country catalogue of broad development and macroeconomic indicators spanning economy, labour, health, education, energy, environment, transport, and governance — harmonised into an SDMX-format country-year table.' },
      { label: 'Intended Use',          value: 'Country-level benchmarking, policy analysis, project due diligence, flagship publication inputs, and agent-accessible development intelligence.' },
      { label: 'Target Audience',       value: 'ADB economists, sector specialists, project teams, and external researchers via open data portal.' },
      { label: 'Geographical Coverage', value: 'All 68 ADB member countries, with most indicators spanning 50+ years of historical data.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Time Period Covered',   value: '1960 – present (series-dependent); annual update aligned to Key Indicators publication cycle' },
      { label: 'Data Type',             value: 'Tabular — country-year panel data with 1,400+ indicator series across 12 thematic domains' },
    ],
    governance: [
      { label: 'Source',             value: 'National statistics offices, IMF, World Bank, UN agencies, ADB project data, and ERDI statistical models' },
      { label: 'Permitted Use',      value: 'Open for internal and external research, publication, and policy analysis with standard ADB attribution' },
      { label: 'Redistribution',     value: 'Permitted under ADB Open Data Licence — citation required; derived products must acknowledge ADB KIDB' },
      { label: 'License Type',       value: 'ADB Open Data Licence (CC BY 4.0 equivalent)' },
      { label: 'Access',    value: 'Open — publicly accessible via ADB Open Data portal and DataNex' },
      { label: 'Publication Status', value: 'Active — annual major release, monthly indicator updates' },
      { label: 'Update Method',      value: 'Annual major release (aligned to Key Indicators publication); monthly patch updates for priority series' },
      { label: 'Data Location',      value: 'data.adb.org / kidb / v5 and unity.adb.org / erdi / kidb_v5' },
    ],
    viewerColumns: [
      { name: 'economy',         type: 'string'  },
      { name: 'iso3',            type: 'string'  },
      { name: 'indicator_code',  type: 'string'  },
      { name: 'indicator_name',  type: 'string'  },
      { name: 'year',            type: 'integer' },
      { name: 'value',           type: 'float'   },
      { name: 'unit',            type: 'string'  },
    ],
    viewerRows: [
      { economy: 'Philippines',  iso3: 'PHL', indicator_code: 'GNI.PC.CURR', indicator_name: 'GNI per capita (current USD)', year: '2025', value: '4210', unit: 'USD' },
      { economy: 'Philippines',  iso3: 'PHL', indicator_code: 'SP.POP.GROW', indicator_name: 'Population growth rate',       year: '2025', value: '1.42', unit: '%' },
      { economy: 'Viet Nam',     iso3: 'VNM', indicator_code: 'GNI.PC.CURR', indicator_name: 'GNI per capita (current USD)', year: '2025', value: '4850', unit: 'USD' },
      { economy: 'Viet Nam',     iso3: 'VNM', indicator_code: 'SP.POP.GROW', indicator_name: 'Population growth rate',       year: '2025', value: '0.89', unit: '%' },
      { economy: 'Indonesia',    iso3: 'IDN', indicator_code: 'GNI.PC.CURR', indicator_name: 'GNI per capita (current USD)', year: '2025', value: '5120', unit: 'USD' },
      { economy: 'India',        iso3: 'IND', indicator_code: 'GNI.PC.CURR', indicator_name: 'GNI per capita (current USD)', year: '2025', value: '2680', unit: 'USD' },
      { economy: 'Bangladesh',   iso3: 'BGD', indicator_code: 'GNI.PC.CURR', indicator_name: 'GNI per capita (current USD)', year: '2025', value: '2740', unit: 'USD' },
      { economy: 'Cambodia',     iso3: 'KHM', indicator_code: 'NE.EXP.GNFS', indicator_name: 'Exports of goods & services (% GDP)', year: '2025', value: '68.4', unit: '% GDP' },
    ],
    versions: [
      {
        version: 'v5.1',
        releaseDate: '1 Sep 2026',
        author: 'ERDI Statistics Team',
        summary: 'Annual Key Indicators 2026 release with expanded climate and energy series.',
        changes: [
          'Added 42 new climate finance and green transition indicator series',
          'Expanded energy access indicators to 62 DMCs',
          'Revised historical GDP series for 8 economies following national accounts rebasing',
          'New SDMX REST API v3 endpoint for programmatic access',
        ],
      },
      {
        version: 'v5.0',
        releaseDate: '1 Sep 2025',
        author: 'ERDI Statistics Team',
        summary: 'Key Indicators 2025 release — expanded coverage and SDMX harmonisation.',
        changes: [
          'Harmonised all series to SDMX 2.1 standard for interoperability',
          'Added labour market and social protection indicator domain (120 new series)',
          'Coverage extended to all 68 ADB member countries for core economic series',
        ],
      },
      {
        version: 'v4.2',
        releaseDate: '15 Jun 2023',
        author: 'ERDI Statistics Team',
        summary: 'Initial DataNex publication — migrated from legacy Open Data portal.',
        changes: [
          'First DataNex publication of KIDB with full historical backfill to 1960',
          'JSON and CSV bulk download endpoints added alongside existing SDMX API',
          'Automated monthly patch update pipeline established',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: '59528-001',
        projectTitle: 'Asian Development Outlook 2026 Flagship Publication',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Primary macroeconomic data source for regional economic projections',
        usageDetail: 'KIDB GDP, inflation, and trade series were the primary data inputs for the Asian Development Outlook 2026 economic projection models, covering 46 economies across 5 subregional groupings.',
      },
      {
        projectNumber: 'ERDI-INT-2026-03',
        projectTitle: 'Country Agent (CountryGenie) Data Foundation',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Provides structured country statistics for AI agent query responses',
        usageDetail: 'KIDB serves as the primary structured data source for CountryGenie\'s economic and social indicator responses, enabling the agent to surface verified, citeable statistics for over 68 ADB member economies on demand.',
      },
    ],
  },

  // ── AI Agent: ADB Language Checker ───────────────────────────────────────
  {
    slug: 'adb-language-checker',
    assetId: 'AI-2025-01',
    category: 'AI Agents',
    title: 'ADB Language Checker',
    access: 'Restricted — Communications & Publishing Access',
    requestAccessCta: true,
    tryWithSampleData: true,
    rating: 4.3,
    ratingCount: '1.4K',
    views: 8920,
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '10 Aug 2026',
    firstSubmitted: '5 Apr 2025',
    pic: 'Communication Department\ncomms@adb.org',
    projectId: 'AI_2025_001',
    tags: ['Writing', 'Style', 'Language', 'ADB Standards'],
    department: 'Communication Department',
    contact: 'language-tools@adb.org',
    shortDescription: 'The ADB Language Checker is an AI-powered language and style validation tool that ensures written communications, project documents, reports, and external publications conform to ADB\'s institutional writing standards, approved terminology, and editorial guidelines as defined in the ADB Style Guide and ADB Writing for Development publication. It is available to all ADB staff as a standalone batch review tool and as a real-time inline suggestion mode within ADB Genie.\n\nThe tool applies a rule engine of 240-plus ADB-specific style and terminology rules — covering country name and currency normalisation, approved development terminology, passive voice usage, nominalisation patterns, and citation formatting — to documents submitted as plain text, PDF, or DOCX input. Review outputs include highlighted annotations, tracked-changes markup, and an itemised list of flagged deviations. The Microsoft Word add-in supports offline document review workflows outside the ADB Genie environment.\n\nPrimary use cases include pre-publication review of ADB Annual Reports, sector working papers, project appraisal documents, and external communications; real-time style guidance for staff drafting documents directly in ADB Genie; and integration with SharePoint document review workflows for departmental editorial pipelines. The Language Checker reviewed 42 draft chapters of the ADB Annual Report 2025, reducing the Communications Department\'s editorial review cycle from three weeks to five days.\n\nThe ADB Language Checker is maintained by the Communication Department and DTI AI Operations, with the style rule engine updated quarterly to reflect current editorial guidance. All outputs are advisory — final editorial decisions remain with the author and the relevant department.',
    sector: 'Information and Communications Technology',
    themes: ["Knowledge Management","Digital Transformation","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'AI-powered language and style validation tool aligned with ADB writing standards, terminology, and communication guidelines — ensuring consistent, professional output across all ADB publications and operational documents.' },
      { label: 'Intended Use',          value: 'Pre-publication review of reports, briefs, project documents, and external communications; real-time style guidance during drafting in ADB Genie.' },
      { label: 'Target Audience',       value: 'All ADB staff producing written communications, reports, or external publications.' },
      { label: 'Geographical Coverage', value: 'Not applicable — language tool serving all ADB departments globally.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Supported Formats',     value: 'Plain text, DOCX, PDF input; inline markup and tracked-changes output' },
      { label: 'Integration Points',    value: 'ADB Genie chat interface, Microsoft Word add-in, SharePoint document review workflow' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB Style Guide, ADB Writing for Development publication, glossary of approved terminology, and Communications Department editorial ruleset' },
      { label: 'Permitted Use',      value: 'All internal drafting and review workflows; outputs are advisory — final editorial decisions remain with the author and relevant department' },
      { label: 'Redistribution',     value: 'Not applicable — tool output is incorporated into staff work products' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'All ADB staff' },
      { label: 'Publication Status', value: 'Active — rule engine updated quarterly with Communications Department guidance' },
      { label: 'Update Method',      value: 'Quarterly release cycle — style rule updates following Communications Department review' },
    ],
    versions: [
      {
        version: 'v2.0',
        releaseDate: '10 Aug 2026',
        author: 'DTI AI Operations',
        summary: 'Real-time inline suggestions and ADB Genie integration.',
        changes: [
          'Launched real-time inline suggestion mode within ADB Genie document editor',
          'Added ADB country name and currency normalisation checks',
          'New flagging for passive voice overuse and nominalisations',
          'Microsoft Word add-in released for offline document review',
        ],
      },
      {
        version: 'v1.2',
        releaseDate: '5 Apr 2025',
        author: 'DTI AI Operations',
        summary: 'Initial production release — batch document review with ADB style rules.',
        changes: [
          'Production launch with 240 ADB-specific style and terminology rules',
          'PDF and DOCX input support with highlighted annotation output',
          'Integration with ADB Genie file upload workflow',
          'SLA: p95 review latency < 5 seconds for documents up to 50 pages',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'COMMS-INT-2026-01',
        projectTitle: 'ADB Annual Report 2025 — Editorial Quality Pipeline',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Processed all Annual Report draft chapters for ADB style compliance',
        usageDetail: 'The Language Checker reviewed 42 draft chapters across the ADB Annual Report 2025 editorial cycle, flagging 1,840 style deviations and terminology inconsistencies — reducing the Communications Department\'s editorial review cycle from 3 weeks to 5 days.',
      },
    ],
  },

  // ── AI Agent: Agentic Orchestration (CLARA) ──────────────────────────────
  {
    slug: 'agentic-orchestration-clara',
    assetId: 'AI-2025-02',
    category: 'AI Agents',
    title: 'Agentic Orchestration (CLARA)',
    access: 'Restricted',
    rating: 4.6,
    ratingCount: '480',
    views: 3120,
    ingestionStatus: 'Ingested',
    parentProduct: 'CLARA',
    parentProductSlug: 'egis-platform',
    rai: true,
    governanceVerified: true,
    lastUpdated: '5 Aug 2026',
    firstSubmitted: '15 Jan 2025',
    pic: 'Private Sector Operations Dept\nclara-support@adb.org',
    projectId: 'AI_2025_002',
    tags: ['Credit Risk', 'Non-Sovereign Operations', 'RAG', 'Agentic AI', 'Finance'],
    department: 'Private Sector Operations Department',
    contact: 'clara-support@adb.org',
    shortDescription: 'Agentic Orchestration (CLARA) is the multi-agent AI infrastructure powering CLARA — the Credit Lending Avatar for Risk Assessment — ADB\'s intelligent credit analysis platform for Non-Sovereign Operations. The agentic layer orchestrates parallel retrieval and synthesis workflows across CreditLens, ADB internal PSOD documents, and Moody\'s external ratings and research to deliver traceable, citation-grounded credit insights for investment decision support.\n\nThe platform operates on a RAG architecture with 90-day contextual memory across credit analysis sessions, enabling coherent multi-turn analytical workflows. Agent outputs include structured credit risk analyses, borrower due diligence summaries, sector analyses aligned to NSO loan appraisal templates, and citation panels linking every claim to its source passage. ESG risk scores and sector outlook reports from Moody\'s are integrated, with CreditLens and Moody\'s data feeds refreshed daily. Orchestration latency was reduced by 35% in 2026 through parallel agent execution.\n\nPrimary applications include credit risk analysis and loan structuring research for Non-Sovereign Operations project teams, borrower and sector due diligence preparation, investment decision memo drafting, and green bond framework documentation. CLARA reduced initial credit memo preparation time from twelve days to three days on a USD 200 million renewable energy portfolio financing across Southeast Asia.\n\nCLARA carries full Responsible AI Verified status and is governed under the ADB Responsible AI framework. Access is strictly restricted to approved PSOD staff with CLARA platform credentials. All AI-generated credit assessments require review by a qualified credit officer before use in formal credit decisions.',
    sector: 'Information and Communications Technology',
    themes: ["Digital Transformation","Responsible AI","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'CLARA\'s (Credit Lending Avatar for Risk Assessment) agentic layer orchestrates multiple specialized workflows across ADB\'s Non-Sovereign Operations — synthesising internal knowledge, CreditLens data, and external intelligence to deliver traceable credit insights.' },
      { label: 'Intended Use',          value: 'Credit risk analysis, loan structuring research, borrower and sector due diligence, and investment decision support for NSO project teams.' },
      { label: 'Target Audience',       value: 'PSOD credit analysts, investment officers, and risk management specialists with approved CLARA platform access.' },
      { label: 'Geographical Coverage', value: 'All ADB Developing Member Countries with active or pipeline Non-Sovereign Operations.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'AI Architecture',       value: 'Multi-agent RAG pipeline — retrieval from CreditLens, internal documents, and Moody\'s external data with contextual memory and agentic workflow orchestration' },
      { label: 'Integration Points',    value: 'CLARA platform, CreditLens credit management system, PSOD document repository, Moody\'s data feed' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB CreditLens credit management system, historical PSOD credit documentation, Moody\'s external ratings and research, internal NSO knowledge base' },
      { label: 'Permitted Use',      value: 'PSOD credit analysis and investment decision support; all AI-generated credit assessments require review by a qualified credit officer before use in credit decisions' },
      { label: 'Redistribution',     value: 'Not permitted — outputs are internal PSOD working materials and subject to credit committee confidentiality requirements' },
      { label: 'License Type',       value: 'ADB Restricted — PSOD Internal Only' },
      { label: 'Access',    value: 'Restricted — approved PSOD staff with CLARA platform access only' },
      { label: 'Publication Status', value: 'Active — model updated quarterly with expanded source integrations' },
      { label: 'Update Method',      value: 'Quarterly model update cycle; CreditLens and Moody\'s feeds refreshed daily' },
    ],
    agentCapabilities: {
      whatItCanDo: [
        'Synthesise credit risk analyses from CreditLens, PSOD documents, and Moody\'s data',
        'Generate borrower due diligence summaries aligned to NSO loan appraisal templates',
        'Produce sector analyses with ESG risk scores and Moody\'s outlook integration',
        'Draft investment decision memo sections with citation-grounded evidence',
        'Compare borrower profiles against ADB credit policy requirements',
        'Maintain 90-day contextual memory across multi-turn analytical sessions',
      ],
      exampleTasks: [
        'Assess a financing opportunity against ADB credit policy',
        'Identify key risks in a borrower\'s financial profile',
        'Compare sector outlook across competing investment options',
        'Draft the credit risk section of an investment decision memo',
      ],
      accepts: ['Project information', 'Borrower documents', 'Financial statements', 'CreditLens records'],
      produces: ['Credit risk analyses', 'Due diligence summaries', 'Investment memo drafts', 'Citation panels'],
    },
    versions: [
      {
        version: 'v1.3',
        releaseDate: '5 Aug 2026',
        author: 'PSOD Digital Team',
        summary: 'Expanded Moody\'s data integration and improved citation traceability.',
        changes: [
          'Extended Moody\'s integration to include ESG risk scores and sector outlook reports',
          'New citation panel — every CLARA response now shows exact source passages',
          'Added structured sector analysis template for NSO loan appraisals',
          'Reduced average orchestration latency by 35% through parallel agent execution',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '15 Jan 2025',
        author: 'PSOD Digital Team',
        summary: 'Production launch — multi-agent credit analysis orchestration for PSOD.',
        changes: [
          'General availability for approved PSOD credit analysts',
          'Multi-agent pipeline: parallel retrieval from CreditLens, internal documents, and Moody\'s',
          'RAG architecture with 90-day contextual memory across credit analysis sessions',
          'RAI and Governance verification completed prior to production deployment',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'PSOD-NSO-2026-14',
        projectTitle: 'Renewable Energy Private Sector Financing — Southeast Asia',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Supported credit risk assessment and sector analysis for solar portfolio financing',
        usageDetail: 'CLARA orchestrated retrieval across 340 internal NSO documents and Moody\'s sector outlooks to produce a 28-page structured credit risk analysis for a USD 200M renewable energy portfolio, reducing the initial credit memo preparation time from 12 days to 3 days.',
      },
    ],
  },

  // ── AI Agent: Climate Analytics Agent ────────────────────────────────────
  {
    slug: 'climate-analytics-agent',
    assetId: 'AI-2025-03',
    category: 'AI Agents',
    title: 'Climate Analytics Agent',
    access: 'Restricted — Climate Specialist Access',
    requestAccessCta: true,
    tryWithSampleData: true,
    rating: 4.4,
    ratingCount: '920',
    views: 5640,
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '12 Aug 2026',
    firstSubmitted: '20 Jun 2025',
    pic: 'Climate Change & Disaster Risk Division\nclimate-ai@adb.org',
    projectId: 'AI_2025_003',
    tags: ['Climate Risk', 'Adaptation', 'Resilience', 'Climate & Environment'],
    department: 'Climate Change & Sustainable Development',
    contact: 'climate-ai@adb.org',
    shortDescription: 'The Climate Analytics Agent is an AI agent integrated into ADB Genie that supports climate risk analysis, adaptation planning, resilience assessments, and climate-related evidence synthesis across all ADB developing member countries, with particular focus on climate-vulnerable Pacific Island Countries and coastal Asian economies. The agent grounds its outputs exclusively in ADB\'s authoritative climate knowledge corpus and publicly available climate science.\n\nThe agent\'s RAG pipeline draws on 8,400-plus ADB climate publications, the full IPCC AR6 report, national adaptation plans for 44 ADB developing member countries, ADB Climate Change Assessment reports, and the CCSD internal knowledge base. Integration with the Geospatial Flooding Risk Engine enables location-specific hazard queries, while the Climate Finance Tracker API provides investment context for adaptation planning. The knowledge base is updated quarterly aligned to CCSD and IPCC publication cycles.\n\nPrimary use cases include structured climate risk screening memos for project appraisals — synthesising IPCC AR6 projections, sea-level-rise scenarios, and historical ADB project lessons — country-level climate adaptation strategy development, rapid evidence synthesis for briefings and sector reports, and NDC alignment analysis. Climate risk screening for 12 Pacific Island Country infrastructure proposals was completed in under 30 minutes per country, compared with two to three weeks of previous specialist effort.\n\nAvailable to all ADB staff through ADB Genie, the Climate Analytics Agent is maintained by the Climate Change and Disaster Risk Division. All outputs require expert review before formal inclusion in project documents.',
    sector: 'Environment',
    themes: ["Climate Action","Environmental Sustainability","Responsible AI"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'AI agent supporting climate risk analysis, adaptation planning, resilience assessments, and climate-related insights — grounded in ADB climate knowledge sources and publicly available climate science.' },
      { label: 'Intended Use',          value: 'Climate risk screening for project appraisals, country-level climate adaptation strategy development, and rapid synthesis of climate evidence for briefings and reports.' },
      { label: 'Target Audience',       value: 'ADB climate specialists, sector economists, country economists, and project design teams across all regional departments.' },
      { label: 'Geographical Coverage', value: 'All ADB Developing Member Countries, with emphasis on climate-vulnerable Pacific Island Countries and coastal Asian economies.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'AI Architecture',       value: 'RAG pipeline grounded in ADB climate knowledge corpus, IPCC AR6, national adaptation plans, and CCSD internal documents' },
      { label: 'Integration Points',    value: 'ADB Genie, Climate Finance Tracker API, Geospatial Flooding Risk Engine' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB climate change operational documents, IPCC AR6 reports, national adaptation plans (NAPs), ADB Climate Change Assessment reports, and CCSD internal knowledge base' },
      { label: 'Permitted Use',      value: 'Internal ADB climate analysis, project due diligence, and advisory support; outputs require expert review before inclusion in formal project documents' },
      { label: 'Redistribution',     value: 'AI-generated analysis used in ADB publications requires attribution and CCSD review' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'All ADB staff' },
      { label: 'Publication Status', value: 'Active — knowledge base updated quarterly with new IPCC and ADB climate publications' },
      { label: 'Update Method',      value: 'Quarterly knowledge base update; model fine-tuning aligned to annual CCSD publication cycle' },
    ],
    versions: [
      {
        version: 'v1.4',
        releaseDate: '12 Aug 2026',
        author: 'CCSD Digital Team',
        summary: 'Integrated Geospatial Flooding Risk Engine for location-specific hazard queries.',
        changes: [
          'Real-time integration with Geospatial Flooding Risk Engine for location-specific hazard data',
          'Added Pacific SIDS climate scenario module with IPCC AR6 regional projections',
          'New structured output: Climate Risk Screening Memo template for project appraisals',
          'Expanded NDC knowledge base to 44 ADB DMC national adaptation plans',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '20 Jun 2025',
        author: 'CCSD Digital Team',
        summary: 'Production launch — climate risk analysis agent grounded in ADB and IPCC sources.',
        changes: [
          'General availability launch integrated into ADB Genie',
          'RAG pipeline covering 8,400 ADB climate publications and IPCC AR6 full report',
          'Climate risk screening workflow with structured output for project teams',
          'Responsible AI review completed prior to deployment',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: '59612-001',
        projectTitle: 'Climate-Resilient Infrastructure Investments in the Pacific',
        country: 'Regional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/59612-001/main',
        usageSummary: 'Rapid climate risk screening for 12 Pacific Island Country infrastructure proposals',
        usageDetail: 'The Climate Analytics Agent produced structured climate risk screening memos for 12 infrastructure investment proposals across 8 Pacific Island Countries, synthesising IPCC AR6 projections, sea-level-rise scenarios, and ADB historical climate project lessons in under 30 minutes per country — a task that previously required 2–3 weeks of specialist analysis.',
      },
    ],
  },

  // ── AI Tool: ADB Language Retrieval ──────────────────────────────────────
  {
    slug: 'adb-language-retrieval',
    assetId: 'AT-2024-01',
    category: 'AI Tools',
    title: 'ADB Language Retrieval',
    access: 'All ADB',
    rating: 4.2,
    ratingCount: '810',
    views: 4320,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '8 Aug 2026',
    firstSubmitted: '10 Sep 2024',
    pic: 'Communication Department\nlanguage-tools@adb.org',
    projectId: 'AI_2024_001',
    tags: ['Language', 'Terminology', 'Style Guide', 'Knowledge Retrieval'],
    department: 'Communication Department',
    contact: 'language-tools@adb.org',
    enhancedLayout: true,
    shortDescription: 'Knowledge retrieval service providing access to ADB-approved terminology, writing guidance, and language standards — enabling agents and staff to look up the correct ADB usage for any term, phrase, or style question.',
    updateFrequency: 'Quarterly — updated with each Communications Department style guide revision cycle',
    limitations: 'Limited to ADB institutional style guidance; general English style questions not covered by ADB-specific rules will return the closest approximating guidance. Does not cover legal or technical domain terminology outside Communications Department scope.',
    sector: 'Information and Communications Technology',
    themes: ["Knowledge Management","Digital Transformation","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Knowledge retrieval service for ADB-approved terminology, writing guidance, and language standards — serving both the ADB Language Checker agent and direct staff queries.' },
      { label: 'Intended Use',          value: 'Lookup of ADB-specific terminology, country name conventions, currency usage, capitalisation rules, and communication standards by agents and staff.' },
      { label: 'Target Audience',       value: 'All ADB staff, AI agents producing written outputs, and external translation service providers.' },
      { label: 'Geographical Coverage', value: 'Global — covers all ADB member country name conventions and regional terminology.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v2 / language-retrieval' },
      { label: 'Knowledge Base Size',   value: '4,200 approved terms, 340 style rules, and 1,800 country-specific name and currency conventions' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB Style Guide, ADB Writing for Development handbook, Communications Department editorial rulebook, and UN DESA country name list aligned to ADB membership' },
      { label: 'Permitted Use',      value: 'All internal language lookup, agent orchestration, and staff drafting support; style guidance is advisory' },
      { label: 'Redistribution',     value: 'ADB terminology guidance may be cited in staff publications; style rule text is not redistributable as a standalone product' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'All ADB staff and approved agent integrations' },
      { label: 'Publication Status', value: 'Active — quarterly style rule updates' },
      { label: 'Update Method',      value: 'Quarterly batch update — Communications Department submits approved change list; automated ingestion within 24 hours' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v2 / language-retrieval' },
    ],
    versions: [
      {
        version: 'v2.1',
        releaseDate: '8 Aug 2026',
        author: 'DTI AI Operations',
        summary: 'Expanded country name and currency coverage; semantic similarity lookup.',
        changes: [
          'Added semantic similarity matching — returns closest rule when exact term not found',
          'Expanded coverage to all 68 ADB member country name and demonym conventions',
          'New /batch endpoint for bulk term lookup (up to 200 terms per request)',
          'Integration with ADB Language Checker v2.0 real-time suggestion engine',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '10 Sep 2024',
        author: 'DTI AI Operations',
        summary: 'Initial production release — REST API serving ADB style knowledge base.',
        changes: [
          'Production launch with 3,800 approved ADB terms and style rules',
          'REST API with OAuth 2.0 authentication for agent-to-agent integration',
          'JSON response format with confidence score and source reference fields',
          'SLA: p95 latency < 200 ms',
        ],
      },
    ],
    relatedAssets: [
      { title: 'ADB Language Checker', tag: 'AI Agent', tagColor: 'violet', description: 'Primary consumer of ADB Language Retrieval — powers real-time style suggestions in ADB Genie.', rating: '4.3', users: '1.4K', downloads: '—' },
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Complementary enterprise search tool for retrieving ADB documents alongside language guidance.', rating: '4.6', users: '9.9K', downloads: '—', rai: true },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant where Language Retrieval is called for terminology lookups during drafting.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Search ADB-approved terminology and language standards',
        'Retrieve relevant terminology based on natural-language queries',
        'Surface approved definitions and usage guidance',
        'Return source references alongside retrieved content',
        'Match semantically similar terms when an exact match is not found',
        'Support bulk term lookup for up to 200 terms per request',
      ],
      exampleUse: {
        input: '"climate resilience terminology"',
        output: 'Relevant terms · Definitions · Usage guidance · Source references',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Natural-language queries' },
        { label: 'Produces', value: 'Terms, Definitions, Guidance, Source references' },
      ],
    },
  },

  // ── AI Tool: ADB People Profile ───────────────────────────────────────────
  {
    slug: 'adb-people-profile',
    assetId: 'AT-2024-02',
    category: 'AI Tools',
    title: 'ADB People Profile',
    access: 'Restricted — HR & People Analytics Access',
    requestAccessCta: true,
    tryWithSampleData: true,
    rating: 4.5,
    ratingCount: '2.1K',
    views: 11800,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '14 Aug 2026',
    firstSubmitted: '20 Oct 2024',
    pic: 'Human Resources Division\nhr-data@adb.org',
    projectId: 'AI_2024_002',
    tags: ['People', 'Directory', 'HR', 'Skills', 'Expertise'],
    department: 'Human Resources Division',
    contact: 'hr-data@adb.org',
    enhancedLayout: true,
    shortDescription: 'Structured employee profile repository containing directory information, organisational details, skills, and business affiliations — enabling people search, expertise discovery, and staff relationship mapping across ADB.',
    updateFrequency: 'Daily — profile data synchronised from HRIS and Workday every 24 hours',
    limitations: 'Skills and expertise fields are self-reported and may not reflect the full range of a staff member\'s capabilities. Profile data is subject to individual privacy settings; some staff opt out of certain visible fields.',
    sector: 'Public Sector Management',
    themes: ["Institutional Effectiveness","Knowledge Management"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Structured employee profile repository that powers people search, expertise discovery, and collaboration facilitation — serving both AI agents (People Search Agent) and direct staff lookup.' },
      { label: 'Intended Use',          value: 'Finding subject-matter experts, identifying collaboration partners, understanding organisational relationships, and supporting knowledge network mapping across ADB.' },
      { label: 'Target Audience',       value: 'All ADB staff, approved consultant teams, and AI agents with people-discovery workflows.' },
      { label: 'Geographical Coverage', value: 'ADB Headquarters (Manila) and all 41 resident missions and country offices.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v2 / people-profile' },
      { label: 'Records',               value: 'Active profiles for 4,200+ ADB staff across 80+ departments and country offices' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB HRIS, Workday HR module, ADB internal directory, and staff-maintained skills profiles' },
      { label: 'Permitted Use',      value: 'Internal people search, collaboration identification, and AI agent orchestration; aggregate anonymised data for HR analytics' },
      { label: 'Redistribution',     value: 'Not permitted; individual staff profile data is strictly internal and subject to ADB Staff Privacy Policy' },
      { label: 'License Type',       value: 'ADB Internal — HR Controlled Access; Staff Privacy Policy applies' },
      { label: 'Access',    value: 'All ADB staff for directory search; skills and contact details subject to individual privacy preferences' },
      { label: 'Publication Status', value: 'Active — daily synchronisation from HRIS' },
      { label: 'Update Method',      value: 'Daily batch sync from Workday HRIS at 03:00 SGT; skills profiles updated on staff submission' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v2 / people-profile' },
    ],
    versions: [
      {
        version: 'v2.2',
        releaseDate: '14 Aug 2026',
        author: 'DTI AI Operations',
        summary: 'Skills graph and expertise matching added; Contextualized People Search integration.',
        changes: [
          'New skills graph endpoint — returns related expertise clusters and collaboration networks',
          'Deep integration with Contextualized People Search Agent for natural-language queries',
          'Added LinkedIn-sourced skill endorsements with staff consent',
          'Response now includes org_chart_path field for hierarchy traversal',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '20 Oct 2024',
        author: 'DTI AI Operations',
        summary: 'Initial production release — structured people profile API for ADB Genie.',
        changes: [
          'Production launch with 4,100 active ADB staff profiles',
          'REST API with keyword and role-filter search',
          'Privacy tier controls — staff can hide individual fields from directory exposure',
          'SLA: p95 latency < 300 ms for single-profile lookups',
        ],
      },
    ],
    relatedAssets: [
      { title: 'Contextualized People Search Agent', tag: 'AI Agent', tagColor: 'violet', description: 'Natural-language people discovery agent built on ADB People Profile as its data layer.', rating: '4.4', users: '2.8K', downloads: '—' },
      { title: 'ADB Staff Responsibility Retrieval', tag: 'AI Tool', tagColor: 'teal', description: 'Complementary tool providing organisational roles and responsibility mapping.', rating: '4.1', users: '1.2K', downloads: '—' },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant where People Profile powers the "who to contact" query capability.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Retrieve structured staff profiles including directory information and organisational details',
        'Search for subject-matter experts by skill, function, or department',
        'Identify collaboration partners and organisational relationships',
        'Return skills, expertise, and contact information subject to individual privacy settings',
        'Support expertise cluster discovery through the skills graph endpoint',
        'Map reporting lines and organisational hierarchy',
      ],
      exampleUse: {
        input: '"Infrastructure finance specialists in South Asia"',
        output: 'Matching staff profiles · Skills · Organisational units · Contact information',
      },
      inputOutput: [
        { label: 'Accepts', value: 'People and expertise queries' },
        { label: 'Produces', value: 'Staff profiles, Skills, Organisational information, Contact details' },
      ],
    },
  },

  // ── AI Tool: ADB Staff Responsibility Retrieval ───────────────────────────
  {
    slug: 'adb-staff-responsibility-retrieval',
    assetId: 'AT-2024-03',
    category: 'AI Tools',
    title: 'ADB Staff Responsibility Retrieval',
    access: 'All ADB',
    rating: 4.1,
    ratingCount: '1.2K',
    views: 6480,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '6 Aug 2026',
    firstSubmitted: '15 Nov 2024',
    pic: 'Digital Technology & Innovation\ndt-aitools@adb.org',
    projectId: 'AI_2024_003',
    tags: ['Roles', 'Responsibilities', 'Organisation', 'HR', 'Knowledge Retrieval'],
    department: 'Digital Technology and Innovation',
    contact: 'dt-aitools@adb.org',
    enhancedLayout: true,
    shortDescription: 'Service that retrieves staff roles, responsibilities, organisational assignments, and business ownership information — enabling AI agents and staff to identify who is accountable for any ADB function, project, or business area.',
    updateFrequency: 'Weekly — responsibility assignments synchronised from HRIS and eOperations each Monday',
    limitations: 'Responsibility data reflects formal organisational assignments and may not capture informal accountability arrangements or evolving project team structures. Matrix reporting lines may show primary line only.',
    sector: 'Public Sector Management',
    themes: ["Institutional Effectiveness","Knowledge Management","Digital Transformation"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Retrieval service providing AI agents and staff with structured access to ADB staff roles, responsibilities, organisational assignments, and business ownership — to answer "who is responsible for X" queries reliably.' },
      { label: 'Intended Use',          value: 'Agent-to-person routing in ADB Genie conversations, escalation identification, responsibility mapping for governance workflows, and organisational intelligence queries.' },
      { label: 'Target Audience',       value: 'AI agents requiring responsibility routing, all ADB staff, and governance compliance teams.' },
      { label: 'Geographical Coverage', value: 'ADB Headquarters and all regional departments and resident missions.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v2 / responsibility-retrieval' },
      { label: 'Coverage',              value: 'Responsibility mappings for 380+ business functions and 2,800+ project assignments across ADB' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB HRIS responsibility assignments, eOperations project team records, departmental accountability matrices, and SPD functional responsibility register' },
      { label: 'Permitted Use',      value: 'Internal responsibility lookup, agent workflow routing, and governance compliance support; data is advisory — formal assignments are authoritative in HRIS' },
      { label: 'Redistribution',     value: 'Not permitted; staff assignment data is internal and subject to ADB Staff Privacy Policy' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',    value: 'All ADB staff and approved AI agent integrations' },
      { label: 'Publication Status', value: 'Active — weekly batch update from HRIS and eOperations' },
      { label: 'Update Method',      value: 'Weekly batch ETL from HRIS and eOperations every Monday 04:00 SGT' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v2 / responsibility-retrieval' },
    ],
    versions: [
      {
        version: 'v1.3',
        releaseDate: '6 Aug 2026',
        author: 'DTI AI Operations',
        summary: 'Business ownership graph and improved project team assignment coverage.',
        changes: [
          'Added business_ownership_graph endpoint — returns full accountability chain for any function',
          'Expanded project team assignment coverage to include consultants and secondees',
          'New /delegate endpoint identifying backup responsibilities for staff on leave',
          'Response now includes effective_date and expiry_date for time-bound assignments',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '15 Nov 2024',
        author: 'DTI AI Operations',
        summary: 'Initial production release — responsibility retrieval API for ADB Genie routing.',
        changes: [
          'Production launch with 320 business function responsibility mappings',
          'REST API with department, function, and keyword search parameters',
          'Integration with ADB Genie for "who should I contact about X" query routing',
          'SLA: p95 latency < 250 ms',
        ],
      },
    ],
    relatedAssets: [
      { title: 'ADB People Profile', tag: 'AI Tool', tagColor: 'teal', description: 'Provides individual staff profile data used alongside responsibility assignments.', rating: '4.5', users: '11.8K', downloads: '—' },
      { title: 'Contextualized People Search Agent', tag: 'AI Agent', tagColor: 'violet', description: 'People discovery agent that uses responsibility retrieval for accountable-person routing.', rating: '4.4', users: '2.8K', downloads: '—' },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant that calls responsibility retrieval when routing queries to the right team.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Retrieve staff roles and responsibilities by function, department, or keyword',
        'Search organisational assignments and business ownership information',
        'Identify relevant staff based on responsibility or accountability area',
        'Resolve the full accountability chain for any ADB business function',
        'Return backup responsibility information for staff on leave',
        'Support agent-to-person routing in conversational AI workflows',
      ],
      exampleUse: {
        input: '"Who is responsible for climate finance in Southeast Asia?"',
        output: 'Relevant staff · Roles · Organisational units · Responsibility information',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Staff and responsibility queries' },
        { label: 'Produces', value: 'Staff profiles, Roles, Organisational information' },
      ],
    },
  },

  // ── AI Tool: PDF Extraction ───────────────────────────────────────────────
  {
    slug: 'pdf-extraction',
    assetId: 'AT-2024-04',
    category: 'AI Tools',
    title: 'PDF Extraction',
    access: 'All ADB',
    rating: 4.3,
    ratingCount: '1.1K',
    views: 5200,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '2 Sep 2026',
    firstSubmitted: '12 Mar 2025',
    pic: 'Digital Technology & Innovation\ndt-aitools@adb.org',
    projectId: 'AI_2025_004',
    tags: ['PDF', 'Document Processing', 'Extraction', 'AI Tool'],
    department: 'Digital Technology and Innovation',
    contact: 'dt-aitools@adb.org',
    enhancedLayout: true,
    shortDescription: 'Document intelligence service that extracts structured content from PDF files — including text, tables, metadata, and document hierarchy — enabling downstream processing, search indexing, and structured data workflows.',
    updateFrequency: 'Continuous — service updates are deployed independently of data ingestion',
    limitations: 'Scanned PDFs and image-based documents require OCR processing which may introduce minor text recognition errors. Complex multi-column layouts and embedded diagrams may not extract with perfect fidelity.',
    sector: 'Information and Communications Technology',
    themes: ["Knowledge Management","Digital Transformation","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Document intelligence service extracting text, tables, metadata, and structure from PDF documents for downstream processing, search indexing, and data pipelines.' },
      { label: 'Intended Use',          value: 'Pre-processing PDFs for ingestion into search indexes, AI agents, and data workflows; structured table extraction for spreadsheet-like downstream use.' },
      { label: 'Target Audience',       value: 'AI agents requiring document content, data engineers building ingestion pipelines, and staff needing structured content from institutional PDFs.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v2 / pdf-extraction' },
      { label: 'Max File Size',         value: '50 MB per request' },
    ],
    governance: [
      { label: 'Source',             value: 'Input PDFs provided at request time — the service processes caller-supplied documents' },
      { label: 'Permitted Use',      value: 'Extraction of ADB-owned or licensed document content for internal workflows; extracted content subject to source document permissions' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',             value: 'All ADB staff and approved AI agent integrations' },
      { label: 'Publication Status', value: 'Active — production service' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v2 / pdf-extraction' },
    ],
    versions: [
      {
        version: 'v2.0',
        releaseDate: '2 Sep 2026',
        author: 'DTI AI Operations',
        summary: 'Table structure extraction and multi-page batch processing.',
        changes: [
          'Improved table detection with row and column boundary preservation',
          'Multi-page document support with per-page and full-document output modes',
          'New metadata extraction: title, author, creation date, page count',
          'Structured JSON output format for all extraction types',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '12 Mar 2025',
        author: 'DTI AI Operations',
        summary: 'Initial production release — text extraction and basic metadata.',
        changes: [
          'Production launch with text and heading extraction from PDFs',
          'REST API with OAuth 2.0 authentication',
          'Support for PDFs up to 50 MB',
          'SLA: p95 latency < 3 s for documents up to 30 pages',
        ],
      },
    ],
    relatedAssets: [
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Enterprise semantic search that uses PDF Extraction for document ingestion and indexing.', rating: '4.6', users: '2.4K', downloads: '—', rai: true },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant where PDF Extraction powers document upload and analysis features.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Extract text from uploaded PDF documents',
        'Detect and extract tables while preserving row and column structure',
        'Identify document metadata such as title, author, date, and page count',
        'Detect headings and document hierarchy',
        'Convert extracted content into structured formats for downstream processing',
        'Process multi-page documents in a single request',
      ],
      exampleUse: {
        input: 'ADB_Annual_Report_2025.pdf',
        output: 'Extracted text · 12 tables · Document metadata · JSON',
      },
      inputOutput: [
        { label: 'Accepts', value: 'PDF documents' },
        { label: 'Produces', value: 'Extracted text, Tables, Metadata, Structured JSON' },
        { label: 'Max file size', value: '50 MB' },
        { label: 'Languages', value: 'English' },
      ],
    },
  },

  // ── AI Tool: Geospatial Retrieval ─────────────────────────────────────────
  {
    slug: 'geospatial-retrieval',
    assetId: 'AT-2025-01',
    category: 'AI Tools',
    title: 'Geospatial Retrieval',
    access: 'All ADB',
    rating: 4.3,
    ratingCount: '1.1K',
    views: 4800,
    format: 'REST API / JSON / GeoJSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '10 Sep 2026',
    firstSubmitted: '18 Jun 2025',
    pic: 'Digital Technology & Innovation\ndt-aitools@adb.org',
    projectId: 'AI_2025_001',
    tags: ['Geospatial', 'GIS', 'Location', 'AI Tool', 'Retrieval'],
    department: 'Digital Technology and Innovation',
    contact: 'dt-aitools@adb.org',
    enhancedLayout: true,
    shortDescription: 'AI-powered spatial data retrieval providing natural-language access to ADB\'s GIS layers, geographic datasets, and location-based information for mapping and downstream analysis.',
    updateFrequency: 'Weekly — GIS layer index updated with each new dataset ingestion cycle',
    limitations: 'Coverage is limited to GIS layers and geographic datasets ingested into the ADB spatial data repository. Real-time satellite or sensor data is not supported.',
    sector: 'Information and Communications Technology',
    themes: ["Digital Transformation","Geospatial Analytics","Climate Action"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Retrieve geographic and spatial information from ADB-supported sources using natural-language or location-based queries.' },
      { label: 'Intended Use',          value: 'Location-based data discovery for project teams, geospatial analysis workflows, and AI agents requiring geographic context.' },
      { label: 'Target Audience',       value: 'ADB project teams, GIS specialists, and AI agents with geographic data requirements.' },
      { label: 'Geographical Coverage', value: 'Asia and the Pacific — all ADB member country DMCs.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v1 / geospatial-retrieval' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB GIS repository, OpenStreetMap for baseline layers, and approved third-party satellite data providers' },
      { label: 'Permitted Use',      value: 'Internal geographic analysis, project mapping, and AI agent geospatial workflows' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access; third-party layer terms apply' },
      { label: 'Access',             value: 'All ADB staff and approved AI agent integrations' },
      { label: 'Publication Status', value: 'Active — weekly index updates' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v1 / geospatial-retrieval' },
    ],
    versions: [
      {
        version: 'v1.2',
        releaseDate: '10 Sep 2026',
        author: 'DTI AI Operations',
        summary: 'Pacific SIDS coverage expansion and GeoJSON output format.',
        changes: [
          'Expanded coverage to include all Pacific SIDS GIS layers',
          'Added GeoJSON output format for direct mapping tool compatibility',
          'Improved natural-language location parsing for island and atoll queries',
          'New /bbox endpoint for bounding-box spatial queries',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '18 Jun 2025',
        author: 'DTI AI Operations',
        summary: 'Initial production release — natural-language access to ADB GIS layers.',
        changes: [
          'Production launch with natural-language location query support',
          'REST API with OAuth 2.0 authentication',
          'Coverage of 340 ADB GIS layers across DMCs',
          'SLA: p95 latency < 600 ms',
        ],
      },
    ],
    relatedAssets: [
      { title: 'ADB GIS Platform', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise GIS platform that integrates Geospatial Retrieval as its AI-powered search layer.', rating: '4.5', users: '1.8K', downloads: '—' },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant that uses Geospatial Retrieval for location-aware query responses.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Retrieve geographic and spatial information from supported ADB sources',
        'Search location-based datasets using natural-language criteria',
        'Return geographic coordinates and associated attributes',
        'Prepare retrieved information for mapping and downstream analysis',
        'Support bounding-box spatial queries for area-specific retrieval',
        'Return results in JSON and GeoJSON formats for direct mapping tool use',
      ],
      exampleUse: {
        input: '"Flood exposure data for Pacific SIDS"',
        output: 'Geospatial records · Coordinates · Location attributes · Map-ready data',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Location and geographic queries' },
        { label: 'Produces', value: 'Geospatial records, Coordinates, Location attributes' },
      ],
    },
  },

  // ── AI Tool: Sector Search ────────────────────────────────────────────────
  {
    slug: 'sector-search',
    assetId: 'AT-2025-02',
    category: 'AI Tools',
    title: 'Sector Search',
    access: 'All ADB',
    rating: 4.1,
    ratingCount: '890',
    views: 3600,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '5 Sep 2026',
    firstSubmitted: '20 Jul 2025',
    pic: 'Digital Technology & Innovation\ndt-aitools@adb.org',
    projectId: 'AI_2025_002',
    tags: ['Sector', 'Search', 'AI Tool', 'Knowledge Retrieval'],
    department: 'Digital Technology and Innovation',
    contact: 'dt-aitools@adb.org',
    enhancedLayout: true,
    shortDescription: 'Sector-specific search layer that retrieves ADB content — datasets, projects, and knowledge resources — filtered and ranked by ADB\'s sector taxonomy, built on the same retrieval infrastructure as Intelligent File Search.',
    updateFrequency: 'Near-real-time — inherits index update cadence from Intelligent File Search',
    limitations: 'Retrieval is scoped to ADB-indexed content only. Cross-sector content may require multiple queries if it spans more than one sector taxonomy node.',
    sector: 'Information and Communications Technology',
    themes: ["Knowledge Management","Digital Transformation","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Sector-specific search enabling retrieval of ADB datasets, projects, and knowledge resources filtered by ADB\'s formal sector taxonomy.' },
      { label: 'Intended Use',          value: 'Sector-scoped knowledge discovery for project teams, sector specialists, and AI agents requiring domain-specific content.' },
      { label: 'Target Audience',       value: 'ADB sector specialists, project teams, and AI agents.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v1 / sector-search' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB SharePoint Online, eOperations project database, and ADB website publications — filtered through ADB sector taxonomy' },
      { label: 'Permitted Use',      value: 'Internal sector knowledge discovery and AI agent orchestration' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',             value: 'All ADB staff and approved AI agent integrations' },
      { label: 'Publication Status', value: 'Active — inherits Intelligent File Search index updates' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v1 / sector-search' },
    ],
    versions: [
      {
        version: 'v1.1',
        releaseDate: '5 Sep 2026',
        author: 'DTI AI Operations',
        summary: 'Expanded sector taxonomy coverage and cross-sector query support.',
        changes: [
          'Added cross-sector query mode — retrieve content spanning multiple sector nodes',
          'Improved sector classification for projects with multiple sector assignments',
          'New /sectors endpoint listing all supported taxonomy nodes',
          'SLA: p95 latency < 500 ms',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '20 Jul 2025',
        author: 'DTI AI Operations',
        summary: 'Initial production release — sector-scoped search over ADB content.',
        changes: [
          'Production launch with support for all ADB sector taxonomy nodes',
          'REST API with OAuth 2.0 authentication',
          'Built on Intelligent File Search retrieval infrastructure',
        ],
      },
    ],
    relatedAssets: [
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Underlying retrieval infrastructure powering Sector Search.', rating: '4.6', users: '2.4K', downloads: '—', rai: true },
      { title: 'Thematic Search', tag: 'AI Tool', tagColor: 'teal', description: 'Complementary tool for theme-based retrieval alongside sector-based search.', rating: '4.0', users: '620', downloads: '—' },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant that uses Sector Search for domain-specific query routing.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Search ADB content by sector using ADB\'s formal sector taxonomy',
        'Retrieve relevant sector-specific resources, datasets, and projects',
        'Identify related projects and knowledge resources within a sector',
        'Return source references alongside search results',
        'Support cross-sector queries spanning multiple taxonomy nodes',
        'Filter and rank results by relevance within the requested sector scope',
      ],
      exampleUse: {
        input: '"Renewable energy projects in Southeast Asia"',
        output: 'Relevant assets · Projects · Knowledge resources · Source references',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Sector-based queries' },
        { label: 'Produces', value: 'Assets, Projects, Knowledge resources, Source references' },
      ],
    },
  },

  // ── AI Tool: Thematic Search ──────────────────────────────────────────────
  {
    slug: 'thematic-search',
    assetId: 'AT-2025-03',
    category: 'AI Tools',
    title: 'Thematic Search',
    access: 'All ADB',
    rating: 4.0,
    ratingCount: '620',
    views: 2900,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    parentProduct: 'ADB Genie',
    parentProductSlug: 'adb-genie',
    lastUpdated: '5 Sep 2026',
    firstSubmitted: '20 Jul 2025',
    pic: 'Digital Technology & Innovation\ndt-aitools@adb.org',
    projectId: 'AI_2025_003',
    tags: ['Themes', 'Search', 'AI Tool', 'Knowledge Retrieval'],
    department: 'Digital Technology and Innovation',
    contact: 'dt-aitools@adb.org',
    enhancedLayout: true,
    shortDescription: 'Theme-based search layer that retrieves ADB content — datasets, projects, and knowledge resources — filtered and ranked by ADB\'s development theme taxonomy, covering areas such as gender equality, climate change, and digital transformation.',
    updateFrequency: 'Near-real-time — inherits index update cadence from Intelligent File Search',
    limitations: 'Retrieval is scoped to ADB-indexed content only. Content that does not have formal theme tagging may be under-represented in results.',
    sector: 'Information and Communications Technology',
    themes: ["Knowledge Management","Digital Transformation","Institutional Effectiveness"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Theme-based search enabling retrieval of ADB datasets, projects, and knowledge resources filtered by ADB\'s development theme taxonomy.' },
      { label: 'Intended Use',          value: 'Theme-scoped knowledge discovery for cross-cutting development topics such as gender, climate, and digital transformation.' },
      { label: 'Target Audience',       value: 'ADB thematic specialists, project teams, and AI agents.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / ai-tools / v1 / thematic-search' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB SharePoint Online, eOperations project database, and ADB website publications — filtered through ADB thematic taxonomy' },
      { label: 'Permitted Use',      value: 'Internal thematic knowledge discovery and AI agent orchestration' },
      { label: 'License Type',       value: 'ADB Internal — Open Staff Access' },
      { label: 'Access',             value: 'All ADB staff and approved AI agent integrations' },
      { label: 'Publication Status', value: 'Active — inherits Intelligent File Search index updates' },
      { label: 'Data Location',      value: 'api.adb.org / ai-tools / v1 / thematic-search' },
    ],
    versions: [
      {
        version: 'v1.1',
        releaseDate: '5 Sep 2026',
        author: 'DTI AI Operations',
        summary: 'Expanded thematic coverage and multi-theme query support.',
        changes: [
          'Added multi-theme query mode for intersectional retrieval (e.g. gender + climate)',
          'New /themes endpoint listing all supported taxonomy nodes',
          'Improved ranking for cross-cutting development themes',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '20 Jul 2025',
        author: 'DTI AI Operations',
        summary: 'Initial production release — theme-scoped search over ADB content.',
        changes: [
          'Production launch with support for all ADB development theme taxonomy nodes',
          'REST API with OAuth 2.0 authentication',
          'Built on Intelligent File Search retrieval infrastructure',
        ],
      },
    ],
    relatedAssets: [
      { title: 'Intelligent File Search', tag: 'AI Tool', tagColor: 'teal', description: 'Underlying retrieval infrastructure powering Thematic Search.', rating: '4.6', users: '2.4K', downloads: '—', rai: true },
      { title: 'Sector Search', tag: 'AI Tool', tagColor: 'teal', description: 'Complementary tool for sector-based retrieval alongside thematic search.', rating: '4.1', users: '890', downloads: '—' },
      { title: 'ADB Genie', tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant that uses Thematic Search for development theme query routing.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
    ],
    toolCapabilities: {
      whatItCanDo: [
        'Search ADB content by development theme',
        'Retrieve resources associated with selected themes',
        'Identify related datasets, projects, and knowledge resources',
        'Return source references alongside search results',
        'Support multi-theme queries for intersectional development topics',
        'Filter and rank results by relevance within the requested theme scope',
      ],
      exampleUse: {
        input: '"Gender equality and financial inclusion"',
        output: 'Relevant assets · Projects · Knowledge resources · Source references',
      },
      inputOutput: [
        { label: 'Accepts', value: 'Thematic queries' },
        { label: 'Produces', value: 'Assets, Projects, Knowledge resources, Source references' },
      ],
    },
  },

  // ── API: ADB OpenData API ─────────────────────────────────────────────────
  {
    slug: 'adb-opendata-api',
    assetId: 'AP-2023-01',
    category: 'APIs',
    title: 'ADB OpenData API',
    access: 'Open Access',
    rating: 4.5,
    ratingCount: '2.8K',
    views: 14600,
    format: 'REST API / JSON / CSV',
    ingestionStatus: 'Ingested',
    lastUpdated: '1 Sep 2026',
    firstSubmitted: '10 Oct 2023',
    pic: 'Data & Knowledge Management\nopen-data@adb.org',
    projectId: 'AP_2023_001',
    tags: ['Open Data', 'API', 'Projects', 'Statistics', 'Public'],
    department: 'Development Effectiveness and Results',
    contact: 'open-data@adb.org',
    shortDescription: 'The ADB OpenData API is ADB\'s primary programmatic data access interface, providing RESTful and GraphQL endpoints for open access to ADB project portfolio data, KIDB economic indicators, disbursement records, procurement notices, country profiles, and climate finance information. The API enables researchers, government agencies, international organisations, and developers to integrate ADB data directly into dashboards, analytical pipelines, and applications.\n\nThe unified API surface consolidates multiple previously separate domain APIs into a single /opendata/v4 endpoint, returning JSON and CSV responses with an OpenAPI 3.1 specification published for SDK generation. Endpoints cover ADB project data for all 68 member economies, KIDB indicator series aligned to the annual Key Indicators release, disbursement and procurement tracking, and a climate finance domain added in 2026 covering commitments, green finance tagging, and Paris alignment classifications. An API key is required for requests exceeding 1,000 per day, with the rate limit raised to 5,000 requests per day for registered key holders.\n\nRefresh cycles vary by domain: project and disbursement data update daily, procurement data weekly, and KIDB indicators monthly. The API is maintained at a 99.9% availability SLA with p95 latency below 500 milliseconds.\n\nPublished under the ADB Open Data Licence (CC BY 4.0 equivalent), the ADB OpenData API is fully open for any use — including commercial applications — with attribution to the Asian Development Bank required. It is maintained by the Development Effectiveness and Results department.',
    sector: 'Multisector',
    themes: ["Inclusive Economic Growth","Digital Transformation","Knowledge Management"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Programmatic access to ADB open datasets, project information, and statistical indicators via a RESTful API with JSON and CSV response formats — enabling researchers, governments, and developers to integrate ADB data into their own systems.' },
      { label: 'Intended Use',          value: 'External and internal programmatic access to ADB project portfolio, KIDB economic indicators, disbursement data, and procurement information for dashboards, analysis, and application integration.' },
      { label: 'Target Audience',       value: 'External developers, researchers, government agencies, international organisations, and internal ADB teams building data pipelines.' },
      { label: 'Geographical Coverage', value: 'All ADB member countries — project and statistical data covering 68 economies.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / opendata / v4' },
      { label: 'Data Domains',          value: 'Projects, disbursements, procurement, KIDB indicators, country profiles, climate finance, and procurement notices' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB eOperations project database, KIDB statistical warehouse, procurement management system, and climate finance tracker' },
      { label: 'Permitted Use',      value: 'Open — any use with attribution; commercial applications permitted under ADB Open Data Licence' },
      { label: 'Redistribution',     value: 'Permitted under CC BY 4.0 equivalent — attribution "Data: Asian Development Bank" required' },
      { label: 'License Type',       value: 'ADB Open Data Licence (CC BY 4.0 equivalent)' },
      { label: 'Access',    value: 'Public — no authentication required for open endpoints; API key required for high-volume access (>1,000 req/day)' },
      { label: 'Publication Status', value: 'Active — aligned to ADB Open Data refresh cycles' },
      { label: 'Update Method',      value: 'Daily refresh for project and disbursement data; weekly for procurement; monthly for KIDB indicators' },
      { label: 'Data Location',      value: 'api.adb.org / opendata / v4' },
    ],
    apiDoc: {
      gettingStarted: 'Access ADB OpenData programmatically using the REST API. No authentication required for standard access — an API key is needed for requests exceeding 1,000 per day.',
      baseUrl: 'api.adb.org/opendata/v4',
      authentication: 'API key (required for >1,000 req/day)',
      endpoints: [
        { method: 'GET', path: '/projects',       description: 'Retrieve project information' },
        { method: 'GET', path: '/disbursements',  description: 'Retrieve disbursement data' },
        { method: 'GET', path: '/indicators',     description: 'Retrieve development indicators' },
        { method: 'GET', path: '/climate-finance', description: 'Retrieve climate finance commitments' },
        { method: 'GET', path: '/procurement',    description: 'Retrieve procurement notices' },
      ],
      exampleRequest: 'GET /projects?country=PHI&limit=20',
      docsUrl: 'https://api.adb.org/docs',
    },
    versions: [
      {
        version: 'v4.1',
        releaseDate: '1 Sep 2026',
        author: 'DER Data Team',
        summary: 'GraphQL endpoint and climate finance domain added.',
        changes: [
          'New GraphQL endpoint alongside existing REST — flexible field selection for complex queries',
          'Added climate finance domain: climate commitments, green finance tagging, and Paris alignment flags',
          'Expanded KIDB endpoint to cover Key Indicators 2026 release series',
          'Rate limit raised to 5,000 requests/day for registered API key holders',
        ],
      },
      {
        version: 'v4.0',
        releaseDate: '10 Oct 2023',
        author: 'DER Data Team',
        summary: 'Major v4 release — unified API surface for all ADB open data domains.',
        changes: [
          'Consolidated 4 separate domain APIs into unified /opendata/v4 surface',
          'JSON and CSV dual-format response with /format query parameter',
          'OpenAPI 3.1 specification published for SDK generation',
          'SLA: 99.9% availability, p95 latency < 500 ms',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'EXTERNAL-2026-WORLDBANK',
        projectTitle: 'World Bank / ADB Joint Climate Finance Tracking Initiative',
        country: 'Global',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Powers climate finance data feed into World Bank joint tracking dashboard',
        usageDetail: 'The World Bank\'s joint MDB climate finance tracking team integrates ADB OpenData API climate commitment data directly into the annual MDB Joint Report on Multilateral Development Banks\' Climate Finance, replacing a manual data extraction process that previously required 3 weeks of staff time per annual cycle.',
      },
      {
        projectNumber: 'EXTERNAL-2025-GOVPH',
        projectTitle: 'Philippines National Economic Development Authority — ADB Portfolio Dashboard',
        country: 'Philippines',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Live ADB project portfolio data feed into NEDA national investment dashboard',
        usageDetail: 'The Philippines\' NEDA integrated the ADB OpenData API project endpoint into its national infrastructure investment dashboard, providing real-time visibility of ADB loan disbursements, procurement status, and project implementation progress across 48 active ADB-financed projects.',
      },
    ],
  },

  // ── API: Climate Finance Tracker API ─────────────────────────────────────
  {
    slug: 'climate-finance-tracker-api',
    assetId: 'AP-2024-01',
    category: 'APIs',
    title: 'Climate Finance Tracker API',
    access: 'Restricted',
    rating: 4.3,
    ratingCount: '640',
    views: 3280,
    format: 'REST API / JSON',
    ingestionStatus: 'Ingested',
    lastUpdated: '20 Aug 2026',
    firstSubmitted: '15 Feb 2024',
    pic: 'Climate Change & Sustainable Development\nclimate-finance@adb.org',
    projectId: 'AP_2024_001',
    tags: ['Climate Finance', 'API', 'Paris Agreement', 'Green Finance'],
    department: 'Climate Change & Sustainable Development',
    contact: 'climate-finance@adb.org',
    shortDescription: 'The Climate Finance Tracker API provides programmatic access to ADB\'s climate finance commitment and disbursement data, enabling structured queries across country, sector, instrument type, and Paris Agreement alignment for all 46 ADB Developing Member Countries with active or pipeline climate finance. The API serves as the authoritative data source for ADB\'s internal climate investment tracking and MDB joint reporting obligations.\n\nData domains include climate commitments, disbursements, green bond issuances, Paris alignment classification using the MDB common methodology, nature-positive flags aligned to Kunming-Montreal Global Biodiversity Framework reporting requirements, and co-financing arrangements with co-financier name and type breakdown. Records extend from 2015 onwards with monthly batch updates from eOperations and the CCSD internal tracking system. OAuth 2.0 authentication with department-scoped access tokens controls access at a granular level.\n\nPrimary use cases include internal climate finance analytics and portfolio reporting, country-level climate investment tracking for country dialogue preparation, MDB Joint Report classification workflows, portfolio summary generation for CCSD and Treasury publications, and integration within AI agents — including the Climate Analytics Agent — for automated climate investment queries.\n\nThe Climate Finance Tracker API is maintained by the CCSD Data Team under the Climate Change and Sustainable Development department. Access is restricted to CCSD, ERDI, and Treasury staff and approved AI agent integrations. Project-level granular data is not redistributable externally without Controller approval; country-level and portfolio aggregates may be cited in ADB publications.',
    sector: 'Finance',
    themes: ["Climate Action","Environmental Sustainability","Climate Finance"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Programmatic access to climate finance commitments, disbursements, and project pipelines for ADB Developing Member Countries — with filtering by country, sector, instrument type, and Paris Agreement alignment.' },
      { label: 'Intended Use',          value: 'Internal climate finance analytics, country-level climate investment tracking, MDB reporting, and AI agent integration for climate finance queries.' },
      { label: 'Target Audience',       value: 'CCSD climate finance specialists, ERDI economists, country economists, and AI systems integrating climate investment data.' },
      { label: 'Geographical Coverage', value: 'All 46 ADB Developing Member Countries with active or pipeline climate finance commitments.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / climate / v2 / finance-tracker' },
      { label: 'Data Domains',          value: 'Climate commitments, disbursements, green bond issuances, Paris alignment classification, and co-financing arrangements' },
    ],
    governance: [
      { label: 'Source',             value: 'ADB eOperations project database (climate-tagged records), ADB Treasury green bond framework, MDB Joint Report climate finance definitions, and CCSD internal tracking system' },
      { label: 'Permitted Use',      value: 'Internal ADB climate finance analysis, MDB reporting obligations, country dialogue preparation, and approved AI agent integrations' },
      { label: 'Redistribution',     value: 'Aggregated country-level and portfolio summaries may be shared in ADB publications; project-level granular data not redistributable without CTL approval' },
      { label: 'License Type',       value: 'ADB Restricted — Internal and MDB Reporting Use' },
      { label: 'Access',    value: 'Restricted — CCSD, ERDI, and Treasury staff; AI agents with approved integration credentials' },
      { label: 'Publication Status', value: 'Active — monthly refresh aligned to eOperations project data updates' },
      { label: 'Update Method',      value: 'Monthly batch update from eOperations and CCSD tracker; green bond data updated on issuance events' },
      { label: 'Data Location',      value: 'api.adb.org / climate / v2 / finance-tracker' },
    ],
    versions: [
      {
        version: 'v2.1',
        releaseDate: '20 Aug 2026',
        author: 'CCSD Data Team',
        summary: 'Paris alignment classification and nature-positive finance tagging added.',
        changes: [
          'Added Paris_alignment_classification field using MDB common methodology',
          'New nature_positive_flag field aligned to Kunming-Montreal GBF reporting requirements',
          'Expanded co-financing field to include co-financier name and type breakdown',
          'New /portfolio-summary endpoint for country-level and sector-level aggregates',
        ],
      },
      {
        version: 'v2.0',
        releaseDate: '15 Feb 2024',
        author: 'CCSD Data Team',
        summary: 'Initial production release — REST API for climate finance tracking.',
        changes: [
          'Production launch with climate commitment and disbursement data from 2015',
          'MDB Joint Report climate definition classification applied to all records',
          'OAuth 2.0 authentication with department-scoped access tokens',
          'SLA: p95 latency < 600 ms; monthly refresh SLA within 5 business days of month close',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'CCSD-INT-2026-05',
        projectTitle: 'ADB Climate Finance Annual Report 2025',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Primary data source for ADB\'s USD 9.8B climate finance commitment reporting',
        usageDetail: 'The Climate Finance Tracker API provided the authoritative commitment and disbursement figures for ADB\'s 2025 climate finance annual report, covering USD 9.8B in climate commitments across 46 DMCs — replacing a 6-week manual data consolidation process with an automated overnight API pull.',
      },
    ],
  },

  // ── API: ERDI Data Pipeline API ───────────────────────────────────────────
  {
    slug: 'erdi-data-pipeline-api',
    assetId: 'AP-2024-02',
    category: 'APIs',
    title: 'ERDI Data Pipeline API',
    access: 'Restricted',
    rating: 4.4,
    ratingCount: '520',
    views: 2840,
    format: 'REST API / JSON / Parquet',
    ingestionStatus: 'Ingested',
    lastUpdated: '25 Aug 2026',
    firstSubmitted: '1 Apr 2024',
    pic: 'Economic Research and Development Impact\nerdi-data@adb.org',
    projectId: 'AP_2024_002',
    tags: ['Macroeconomics', 'Statistics', 'ERDI', 'Data Pipeline', 'API'],
    department: 'Economic Research and Development Impact',
    contact: 'erdi-data@adb.org',
    shortDescription: 'The ERDI Data Pipeline API is ADB\'s internal programmatic interface for accessing ERDI\'s statistical production pipelines — including GDP projections, inflation forecasts, fiscal balance data, KIDB pipeline outputs, and sector productivity estimates — in structured JSON, streaming NDJSON, and Parquet bulk export formats. The API consolidates three legacy ERDI data feeds into a unified v3 endpoint, enabling consistent programmatic access for DataNex-connected agents, dashboard applications, and ERDI research teams.\n\nCoverage spans all 68 ADB member economies for core KIDB data, with economic projections produced for 46 developing member countries alongside advanced economy comparators. Data domains reflect ERDI\'s full projection cycle: quarterly major updates align to ERDI publication releases, monthly KIDB pipeline patches keep core series current, and a live streaming endpoint delivers real-time projection updates as ERDI models run. Country economist subjective adjustment fields are surfaced alongside model outputs for full analytical transparency.\n\nPrimary use cases include powering DataNex AI agent workflows requiring structured macroeconomic context, building internal dashboard applications that require up-to-date country economic projections, supporting ERDI economist research with pre-processed pipeline outputs, and enabling large-scale AI training workloads through the Parquet bulk export endpoint.\n\nAccess is restricted to ERDI staff, approved DTI data engineers, and AI agents with pipeline integration credentials, under the ADB Internal ERDI Controlled Access licence. Pre-publication projection data may not be externally distributed before the formal ERDI publication cycle.',
    sector: 'Information and Communications Technology',
    themes: ["Digital Transformation","Inclusive Economic Growth","Knowledge Management"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Internal API exposing ERDI statistical pipelines — economic projections, key indicators, and macro-financial data — for integration with dashboards, agent workflows, and DataNex-connected analytical tools.' },
      { label: 'Intended Use',          value: 'Internal consumption by DataNex agents, dashboard applications, and ERDI research teams requiring structured access to economic projection models and KIDB pipeline outputs.' },
      { label: 'Target Audience',       value: 'ERDI economists, DataNex AI agent developers, DTI data engineers, and approved internal dashboard applications.' },
      { label: 'Geographical Coverage', value: 'All 68 ADB member economies — economic projections for 46 DMCs plus advanced economy comparators.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'API Endpoint',          value: 'api.adb.org / erdi / v3 / pipeline' },
      { label: 'Data Domains',          value: 'GDP projections, inflation forecasts, fiscal balance data, KIDB pipeline outputs, and sector productivity estimates' },
    ],
    governance: [
      { label: 'Source',             value: 'ERDI macro-econometric models, KIDB source data warehouse, IMF/World Bank input feeds, and ADB country economist estimates' },
      { label: 'Permitted Use',      value: 'Internal ADB use only — ERDI research, internal dashboards, and approved AI agent integrations; projection data not for external distribution before formal publication' },
      { label: 'Redistribution',     value: 'Not permitted before ERDI formal publication cycle; post-publication data may be cited with ERDI attribution' },
      { label: 'License Type',       value: 'ADB Internal — ERDI Controlled Access' },
      { label: 'Access',    value: 'Restricted — ERDI staff, approved DTI engineers, and AI agents with pipeline integration credentials' },
      { label: 'Publication Status', value: 'Active — updated on ERDI projection cycle and monthly KIDB refresh' },
      { label: 'Update Method',      value: 'Quarterly major update on ERDI projection cycle; monthly KIDB pipeline data patch; ad-hoc updates on economic event triggers' },
      { label: 'Data Location',      value: 'api.adb.org / erdi / v3 / pipeline' },
    ],
    versions: [
      {
        version: 'v3.1',
        releaseDate: '25 Aug 2026',
        author: 'ERDI Data Team',
        summary: 'Streaming projection endpoint and Parquet bulk export added.',
        changes: [
          'New /stream endpoint returning live projection updates as ERDI models run',
          'Parquet bulk export endpoint for AI training and large-scale analytical workloads',
          'Sector productivity estimates added as new data domain (12 ERDI sectors)',
          'Country economist subjective adjustment fields now surfaced alongside model outputs',
        ],
      },
      {
        version: 'v3.0',
        releaseDate: '1 Apr 2024',
        author: 'ERDI Data Team',
        summary: 'Initial DataNex-integrated release — unified ERDI pipeline API.',
        changes: [
          'Production launch consolidating 3 legacy ERDI data feeds into unified v3 API',
          'OAuth 2.0 with ERDI-scoped access tokens for granular permission control',
          'JSON and streaming NDJSON response formats',
          'SLA: p95 latency < 800 ms for projection queries; bulk Parquet export within 10 minutes',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'ERDI-INT-2026-07',
        projectTitle: 'Asian Development Outlook 2026 — Economic Projection Pipeline',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Powers the ADO 2026 publication data pipeline and chart generation',
        usageDetail: 'The ERDI Data Pipeline API feeds GDP growth, inflation, and current account balance projections for 46 DMCs directly into the ADO 2026 publication workflow — enabling automated chart generation and data validation that reduced the editorial production cycle by 4 weeks compared to previous manual processes.',
      },
      {
        projectNumber: 'DTI-INT-2026-04',
        projectTitle: 'Country Agent (CountryGenie) — Economic Intelligence Integration',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Supplies live ERDI projections to CountryGenie for economic outlook responses',
        usageDetail: 'CountryGenie uses the ERDI Data Pipeline API to retrieve the latest ERDI GDP growth and inflation projections when answering staff queries about DMC economic outlooks — ensuring AI-generated responses are grounded in the most current internal ERDI estimates rather than published data that may be several months old.',
      },
    ],
  },

  // ── Portal: AuditGenie (Chat) ─────────────────────────────────────────────
  {
    slug: 'auditgenie-chat',
    assetId: 'PO-2025-03',
    category: 'Portals',
    title: 'AuditGenie (Chat)',
    access: 'Restricted',
    rating: 4.5,
    ratingCount: '720',
    views: 4180,
    ingestionStatus: 'Ingested',
    rai: true,
    governanceVerified: true,
    lastUpdated: '18 Aug 2026',
    firstSubmitted: '20 Mar 2025',
    pic: 'Office of the Auditor General\nauditor-general@adb.org',
    projectId: 'AI_2025_009',
    tags: ['Audit', 'Governance', 'Document Review', 'Compliance', 'Internal Audit'],
    department: 'Office of the Auditor General',
    contact: 'auditgenie@adb.org',
    enhancedLayout: true,
    comingSoon: true,
    shortDescription: 'AI-powered audit assistant supporting audit-related research, document review, analysis, and knowledge retrieval from approved audit standards, ADB operational guidelines, and governance materials — grounded exclusively in OAG-approved knowledge sources.',
    updateFrequency: 'Quarterly — knowledge base updated with new audit guidelines and OAG publications; platform releases on monthly cadence',
    limitations: 'AuditGenie is restricted to OAG staff and approved internal audit teams. All AI-generated audit findings are advisory and must be validated by a qualified auditor before inclusion in formal audit reports. The system does not have access to classified board documents unless specifically authorised by OAG leadership.',
    sector: 'Public Sector Management',
    themes: ["Institutional Effectiveness","Responsible AI","Digital Transformation"],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',              value: 'AI-powered audit assistant that accelerates audit research, document review, and knowledge retrieval — grounded in ADB audit standards, INTOSAI/IIA guidelines, and OAG-maintained knowledge sources.' },
      { label: 'Intended Use',         value: 'Audit research and evidence gathering, document review and classification, risk identification support, audit standards lookup, and preparation of working paper drafts.' },
      { label: 'Target Audience',      value: 'OAG internal audit staff, approved audit consultants, and selected compliance teams with OAG-authorised access.' },
      { label: 'Geographical Coverage', value: 'Global — covers ADB operations across all member countries and departments.' },
      { label: 'Data Maturity',        value: 'Production' },
      { label: 'Key Capabilities',     value: 'Document Q&A grounded in audit materials, risk identification from project documents, audit standards lookup (INTOSAI, IIA, ADB OAG), working paper draft templates, and structured evidence summarisation' },
      { label: 'Integrated Knowledge', value: 'OAG audit manuals, ADB operational procedures, INTOSAI standards, IIA Professional Standards, and ADB project documentation corpus' },
    ],
    governance: [
      { label: 'Source',             value: 'OAG audit manuals and guidelines, ADB operational procedures and policies, INTOSAI auditing standards, IIA Professional Standards Framework, and ADB institutional document corpus (OAG-accessible records only)' },
      { label: 'Permitted Use',      value: 'OAG internal audit workflows only; AI-generated outputs are working tools — all audit findings require OAG auditor validation before formal use' },
      { label: 'Redistribution',     value: 'Not permitted; audit working materials and AI-generated analysis are OAG confidential unless formally cleared for distribution' },
      { label: 'License Type',       value: 'ADB Restricted — OAG Internal Only' },
      { label: 'Access',    value: 'Restricted — OAG staff and approved audit consultants with OAG-issued credentials only' },
      { label: 'Publication Status', value: 'Active — knowledge base updated quarterly; model releases on monthly cadence' },
      { label: 'Update Method',      value: 'Quarterly knowledge base update aligned to OAG publication cycle; RAI and Governance verification maintained on rolling basis' },
    ],
    versions: [
      {
        version: 'v1.3',
        releaseDate: '18 Aug 2026',
        author: 'OAG Digital Team / DTI AI Operations',
        summary: 'Risk identification module and structured evidence summarisation added.',
        changes: [
          'New Risk Identification workflow — AuditGenie can flag risk indicators in project documents against OAG risk taxonomy',
          'Structured evidence summarisation: outputs a citeable evidence matrix for working paper use',
          'INTOSAI ISSAI standards knowledge base expanded to include 2024 updates',
          'Audit trail logging added — all queries and AI outputs recorded for OAG quality assurance review',
        ],
      },
      {
        version: 'v1.1',
        releaseDate: '10 Jun 2025',
        author: 'OAG Digital Team / DTI AI Operations',
        summary: 'Document Q&A and audit standards lookup production release.',
        changes: [
          'Production launch of document Q&A grounded in OAG audit manuals and ADB operational documents',
          'INTOSAI and IIA standards fully indexed — lookup available via natural language query',
          'Audit working paper draft templates: 8 standard OAG templates integrated',
          'RAI and Governance verification completed prior to production deployment',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '20 Mar 2025',
        author: 'OAG Digital Team',
        summary: 'Pilot launch — restricted access for 20 OAG staff across 3 audit teams.',
        changes: [
          'Pilot deployment with restricted OAG access for 20 staff across performance, financial, and compliance audit teams',
          'Core document retrieval from OAG audit manuals and ADB operational procedures',
          'Feedback loop established with OAG team leads for AI output quality calibration',
        ],
      },
    ],
    useCases: [
      {
        projectNumber: 'OAG-INT-2026-04',
        projectTitle: 'Performance Audit — ADB Climate Finance Effectiveness',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Accelerated document review and evidence gathering for climate finance audit',
        usageDetail: 'AuditGenie processed 2,400 project documents across ADB\'s climate finance portfolio to identify evidence patterns relevant to the audit\'s key questions on additionality, attribution, and reporting accuracy — a document review task that the audit team estimated would have taken 8 weeks manually was completed in 4 days with AI-assisted prioritisation.',
      },
      {
        projectNumber: 'OAG-INT-2025-09',
        projectTitle: 'Compliance Audit — Digital Procurement Controls',
        country: 'ADB Institutional',
        status: 'Active',
        year: 2025,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Supported procurement control testing through structured standards comparison',
        usageDetail: 'AuditGenie compared 340 procurement transaction records against ADB\'s Procurement Policy and INTOSAI compliance audit standards, generating a structured control deviation matrix that highlighted 18 instances requiring further audit follow-up — enabling the audit team to focus fieldwork on the highest-risk areas.',
      },
    ],
  },

  // ── AI Platform: RAI Platform ─────────────────────────────────────────────
  {
    slug: 'rai-platform',
    assetId: 'AP-2025-01',
    category: 'Portals',
    title: 'RAI Platform',
    access: 'All ADB',
    rating: 4.5,
    ratingCount: '349',
    views: 5500,
    ingestionStatus: 'Ingested',
    rai: true,
    governanceVerified: true,
    lastUpdated: '10 Aug 2026',
    firstSubmitted: '18 Mar 2025',
    pic: 'Digital Technology & Innovation Dept\nrai-platform@adb.org',
    projectId: 'AI_2025_001',
    tags: ['Responsible AI', 'AI Governance', 'Compliance', 'Risk Management'],
    department: 'Digital Technology and Innovation',
    contact: 'rai-platform@adb.org',
    enhancedLayout: true,
    shortDescription: 'The RAI Platform is ADB\'s internal AI governance system that operationalises the Responsible AI Framework across the institution. It provides a centralised inventory of all registered AI use cases — spanning agents, tools, datasets, and platforms — with risk assessment scores, review and approval status, compliance findings, and governance decisions tracked in a single, structured interface.\n\nEvery AI use case at ADB must be registered and assessed through the RAI Platform before deployment. Risk assessments cover data privacy, bias, transparency, security, and operational accountability, each scored against ADB\'s six RAI principles: fairness, reliability, privacy, inclusiveness, transparency, and accountability. The platform maintains a full audit trail of review decisions, mitigation actions, and approval conditions.\n\nPrimary uses include AI use case registration for project teams, governance review workflows for the RAI Review Committee, compliance reporting for senior management and the Board, and institutional visibility into the AI landscape across ADB departments. The RAI Platform is the authoritative registry of AI deployments and is the source of the Governance Verified and Responsible AI Verified trust badges displayed across DataNex.\n\nAccess is available to all ADB staff for self-registration and status tracking. Governance review permissions are restricted to members of the RAI Review Committee and designated departmental AI stewards.',
    updateFrequency: 'Continuous — registry updated as AI use cases are submitted, reviewed, and approved',
    limitations: 'Registry completeness depends on voluntary submission by project teams. Retrospective registration is required for pre-2025 deployments and may be incomplete.',
    sector: 'Information and Communications Technology',
    themes: ['Responsible AI', 'AI Governance', 'Compliance', 'Institutional Effectiveness', 'Digital Transformation'],
    geoTags: ['Global', 'ADB Headquarters'],
    geoCoverage: ['Central and West Asia', 'East Asia', 'South Asia', 'Southeast Asia', 'The Pacific'],
        overview: [
      { label: 'Purpose',               value: 'Centralised registry and governance platform for all AI use cases at ADB — tracking risk assessments, review approvals, compliance findings, and governance decisions across the institution.' },
      { label: 'Intended Use',          value: 'AI use case registration, governance review workflows, compliance reporting, and institutional oversight of ADB\'s AI landscape.' },
      { label: 'Target Audience',       value: 'All ADB staff submitting AI use cases; RAI Review Committee members; department AI stewards; senior management and Board for compliance reporting.' },
      { label: 'Geographical Coverage', value: 'ADB-wide — covers all departments, offices, and project teams globally.' },
      { label: 'Data Maturity',         value: 'Production' },
      { label: 'Key Capabilities',      value: 'AI use case registry, risk scoring dashboard, review workflow management, compliance audit trail, trust badge issuance, departmental AI inventory' },
      { label: 'Integration Points',    value: 'DataNex catalogue (trust badge source), ADB Azure AD (SSO), eOperations, departmental AI tools' },
    ],
    governance: [
      { label: 'Source',             value: 'AI use case submissions from ADB project teams and departments; RAI Review Committee decisions and conditions' },
      { label: 'Permitted Use',      value: 'Internal AI governance, registration, and compliance tracking; reports may be shared with Board and senior management' },
      { label: 'Redistribution',     value: 'Aggregate statistics may be published in institutional AI governance reports; individual case data is internal only' },
      { label: 'License Type',       value: 'ADB Internal — Institutional Governance System' },
      { label: 'Access',             value: 'All ADB staff (registration and status); RAI Review Committee and AI stewards (governance review); restricted reporting tiers for management' },
      { label: 'Publication Status', value: 'Active — continuous intake and review' },
      { label: 'Update Method',      value: 'Continuous — live registry updated as cases are submitted, reviewed, and decided' },
    ],
    versions: [
      {
        version: 'v1.2',
        releaseDate: '10 Aug 2026',
        author: 'AIBD RAI Team',
        summary: 'Bulk registration workflow and DataNex trust badge integration.',
        changes: [
          'Automated trust badge issuance to DataNex for RAI Verified and Governance Verified assets',
          'Bulk registration import for legacy AI tools predating the RAI Framework',
          'New compliance dashboard with department-level AI inventory views',
          'Improved risk scoring rubric aligned to updated ADB RAI Principles (v2.1)',
        ],
      },
      {
        version: 'v1.1',
        releaseDate: '20 Jan 2026',
        author: 'AIBD RAI Team',
        summary: 'Review workflow automation and audit trail enhancements.',
        changes: [
          'Automated email notifications for review status changes',
          'Full audit trail for all governance decisions and conditions',
          'New mitigation action tracker for flagged risk items',
          'Expanded risk assessment rubric to cover generative AI use cases',
        ],
      },
      {
        version: 'v1.0',
        releaseDate: '18 Mar 2025',
        author: 'AIBD RAI Team',
        summary: 'Initial production launch of the RAI Platform registry.',
        changes: [
          'General availability for all ADB departments',
          'AI use case registration with six-principle risk assessment',
          'RAI Review Committee workflow — submission, review, decision, conditions',
          'SSO integration with ADB Azure Active Directory',
        ],
      },
    ],
    viewerImages: [
      {
        label: 'Conduct an Assessment',
        sublabel: 'Guided conversational assessment with on-the-fly clarifications',
        src: '/rai-assessment-chat.png',
        meta: 'Advise · Build · Consume · Publish · Procure',
      },
      {
        label: 'Risk & Controls',
        sublabel: 'View risk level and in-place control findings once an outcome is issued',
        src: '/rai-risk-controls.png',
        meta: 'Accountability · Data Integrity · Explainability · Fairness · Privacy · Reliability',
      },
      {
        label: 'Approved AI Tools',
        sublabel: 'Browse all Responsible AI approved tools and use cases',
        src: '/rai-approved-tools.png',
        meta: 'RAI Verified use cases — All Staff access',
      },
    ],
    relatedAssets: [
      { title: 'ADB Genie',         tag: 'AI Platform', tagColor: 'amber', description: 'Enterprise AI assistant — RAI Verified through this platform.', rating: '4.7', users: '3.4K', downloads: '—', rai: true },
      { title: 'ADB Navigator',     tag: 'AI Agent',    tagColor: 'violet', description: 'Core document retrieval agent — registered and governance verified.', rating: '4.5', users: '2.1K', downloads: '—', rai: true },
      { title: 'Agentic Orchestration (CLARA)', tag: 'AI Agent', tagColor: 'violet', description: 'PSOD credit analysis agent — RAI Verified, Restricted access.', rating: '4.6', users: '480', downloads: '—', rai: true },
      { title: 'AuditGenie',        tag: 'AI Platform', tagColor: 'amber', description: 'AI-powered audit intelligence platform — Governance Verified.', rating: '4.5', users: '1.8K', downloads: '—', rai: true },
    ],
    useCases: [
      {
        projectNumber: 'RAI-GOV-2026-01',
        projectTitle: 'ADB AI Governance Report — Board Presentation 2026',
        country: 'ADB Institutional',
        status: 'Closed',
        year: 2026,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Provided AI inventory data and risk assessment summaries for Board-level reporting',
        usageDetail: 'The RAI Platform\'s compliance dashboard was used to generate the 2026 AI Governance Report presented to the ADB Board, covering 47 registered AI use cases, risk distribution across the six RAI principles, and the status of 12 active mitigation actions. The report established ADB\'s first institutional baseline for AI governance maturity.',
      },
      {
        projectNumber: 'RAI-REG-2025-14',
        projectTitle: 'CLARA Credit Analysis Platform — RAI Verification',
        country: 'ADB Institutional',
        status: 'Closed',
        year: 2025,
        url: 'https://www.adb.org/projects/main',
        usageSummary: 'Completed full RAI assessment and Responsible AI Verified status for CLARA',
        usageDetail: 'The RAI Platform conducted the six-principle risk assessment for CLARA (Agentic Orchestration), reviewing data privacy controls, bias risk in credit scoring outputs, transparency of AI-generated recommendations, and accountability mechanisms for credit officer review. Responsible AI Verified and Governance Verified status were granted after 3 mitigation conditions were satisfied.',
      },
    ],
  },
];


interface FeedbackEntry {
  id: number;
  user: string;
  rating: number;
  date: string;
  comment: string;
  project?: string;
  projectNumber?: string;
}


@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetCardComponent, PrimaryBtnDirective, SecondaryBtnDirective, PromptBarComponent, AIReasoningLoaderComponent],
  templateUrl: './asset-detail.component.html',
  styleUrl: './asset-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router           = inject(Router);
  private readonly route            = inject(ActivatedRoute);
  private readonly chatService      = inject(ChatService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly widgetService    = inject(WidgetSelectionService);
  private readonly hostEl   = inject(ElementRef);
  private readonly cdr      = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private sentinelObserver?: IntersectionObserver;

  @ViewChild('tabsSentinel') sentinelEl?: ElementRef;

  tabsStuck = signal(false);
  expandedUseCase = signal<string | null>(null);

  activeTab        = signal<'overview' | 'preview' | 'docs' | 'versions' | 'feedback' | 'access' | 'usecase'>('overview');
  bookmarked       = signal(false);
  asset            = signal<AssetDetail>(ASSETS[0]);
  activeViewerIdx  = signal(0);
  readonly singleScroll = computed(() => false);
  notebookOpen     = signal(false);
  moreOpen         = signal(false);
  readonly notebooks = [
    { label: 'Country Intelligence', id: '1' },
    { label: 'Transport Projects',   id: '2' },
    { label: 'Climate Data',         id: '4' },
  ];

  // ── Feedback ──────────────────────────────────────────────────────────────
  readonly allFeedback = computed(() => this.asset().feedback ?? []);
  readonly PAGE_SIZE   = 10;
  readonly starRange   = [1, 2, 3, 4, 5] as const;

  feedbackModalOpen  = signal(false);
  pendingRating      = signal(0);
  hoverRating        = signal(0);
  bannerHoverRating  = signal(0);
  commentText        = signal('');
  submitAnonymous    = signal(true);
  feedbackFirst      = signal(0);

  feedbackDrawerProject = signal<string | null>(null);
  readonly feedbackDrawerEntries = computed(() => {
    const pn = this.feedbackDrawerProject();
    return pn ? this.allFeedback().filter(f => f.projectNumber === pn) : [];
  });

  drawerRating        = signal(0);
  drawerHoverRating   = signal(0);
  drawerComment       = signal('');
  drawerSubmitted     = signal(false);
  drawerSkeleton      = signal(false);
  drawerNewEntry      = signal<FeedbackEntry | null>(null);
  readonly drawerDisplayRating = computed(() => this.drawerHoverRating() || this.drawerRating());
  readonly drawerCanSubmit = computed(() =>
    this.drawerRating() > 0 && (this.drawerRating() === 5 || this.drawerComment().trim().length > 0)
  );

  submitDrawerFeedback(): void {
    if (!this.drawerCanSubmit()) return;
    const entry: FeedbackEntry = {
      id: Date.now(),
      user: 'You',
      rating: this.drawerRating(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      comment: this.drawerComment().trim(),
      projectNumber: this.feedbackDrawerProject() ?? undefined,
    };
    this.drawerSubmitted.set(true);
    this.drawerSkeleton.set(true);
    this.drawerRating.set(0);
    this.drawerComment.set('');
    setTimeout(() => {
      this.drawerSkeleton.set(false);
      this.drawerNewEntry.set(entry);
      setTimeout(() => this.drawerSubmitted.set(false), 100);
    }, 1000);
  }

  fbDrawerWidth = signal(380);
  private drawerResizing = false;
  private drawerResizeStartX = 0;
  private drawerResizeStartW = 380;

  addProjectModalOpen = signal(false);
  addProjectNumber    = signal('');
  addProjectTitle     = signal('');
  addProjectUsage     = signal('');
  addProjectSubmitted = signal(false);
  addProjectNumFocus  = signal(false);
  addProjectTitleFocus = signal(false);
  readonly addProjectCanSubmit = computed(() =>
    this.addProjectNumber().trim().length > 0 && this.addProjectTitle().trim().length > 0
  );

  private readonly allKnownProjects: { number: string; title: string }[] = (() => {
    const seen = new Set<string>();
    const list: { number: string; title: string }[] = [];
    for (const asset of ASSETS) {
      for (const uc of asset.useCases ?? []) {
        if (!seen.has(uc.projectNumber)) {
          seen.add(uc.projectNumber);
          list.push({ number: uc.projectNumber, title: uc.projectTitle });
        }
      }
    }
    return list;
  })();

  readonly projectNumSuggestions = computed(() => {
    const q = this.addProjectNumber().trim().toLowerCase();
    if (!q || !this.addProjectNumFocus()) return [];
    return this.allKnownProjects
      .filter(p => p.number.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))
      .slice(0, 6);
  });

  readonly projectTitleSuggestions = computed(() => {
    const q = this.addProjectTitle().trim().toLowerCase();
    if (!q || !this.addProjectTitleFocus()) return [];
    return this.allKnownProjects
      .filter(p => p.title.toLowerCase().includes(q) || p.number.toLowerCase().includes(q))
      .slice(0, 6);
  });

  pickProjectSuggestion(p: { number: string; title: string }): void {
    this.addProjectNumber.set(p.number);
    this.addProjectTitle.set(p.title);
    this.addProjectNumFocus.set(false);
    this.addProjectTitleFocus.set(false);
  }

  openAddProjectModal(): void { this.addProjectModalOpen.set(true); }
  closeAddProjectModal(): void {
    this.addProjectModalOpen.set(false);
    this.addProjectSubmitted.set(false);
    this.addProjectNumber.set('');
    this.addProjectTitle.set('');
    this.addProjectUsage.set('');
    this.addProjectNumFocus.set(false);
    this.addProjectTitleFocus.set(false);
  }
  submitAddProject(): void {
    if (!this.addProjectCanSubmit()) return;
    this.addProjectSubmitted.set(true);
  }

  openFeedbackDrawer(projectNumber: string, e: Event): void {
    e.stopPropagation();
    this.feedbackDrawerProject.set(projectNumber);
  }

  closeFeedbackDrawer(): void {
    this.feedbackDrawerProject.set(null);
    this.drawerNewEntry.set(null);
    this.drawerSkeleton.set(false);
    this.drawerSubmitted.set(false);
    this.drawerRating.set(0);
    this.drawerComment.set('');
  }

  startDrawerResize(e: MouseEvent): void {
    e.preventDefault();
    this.drawerResizing = true;
    this.drawerResizeStartX = e.clientX;
    this.drawerResizeStartW = this.fbDrawerWidth();

    const onMove = (ev: MouseEvent) => {
      if (!this.drawerResizing) return;
      const delta = this.drawerResizeStartX - ev.clientX;
      const next = Math.min(700, Math.max(280, this.drawerResizeStartW + delta));
      this.fbDrawerWidth.set(next);
    };
    const onUp = () => {
      this.drawerResizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  snackbarVisible  = signal(false);
  private snackTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Access tab ────────────────────────────────────────────────────────────
  readonly accessLevelOptions: AccessLevel[] = ['Open', 'Restricted', 'Limited'];
  accessEntries    = signal<AccessEntry[]>([]);
  accessRequests   = signal<AccessRequest[]>([]);
  accessLevel      = signal<AccessLevel>('Restricted');
  accessLevelEdit  = signal(false);
  addPeopleEmail   = signal('');
  addPeopleRole    = signal<'Viewer' | 'Editor'>('Viewer');
  accessSnack      = signal<string | null>(null);
  private accessSnackTimer: ReturnType<typeof setTimeout> | null = null;

  displayRating = computed(() => this.hoverRating() || this.pendingRating());
  feedbackPaged = computed(() =>
    this.allFeedback().slice(this.feedbackFirst(), this.feedbackFirst() + this.PAGE_SIZE)
  );
  canSubmit = computed(() =>
    this.pendingRating() > 0 &&
    (this.pendingRating() === 5 || this.commentText().trim().length > 0)
  );
  totalPages  = computed(() => Math.ceil(this.allFeedback().length / this.PAGE_SIZE));
  currentPage = computed(() => Math.floor(this.feedbackFirst() / this.PAGE_SIZE) + 1);
  pageRange   = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const found = ASSETS.find(a => a.slug === id) ?? ASSETS[0];
    this.asset.set(found);
    if (found.accessEntries)  this.accessEntries.set([...found.accessEntries]);
    if (found.accessRequests) this.accessRequests.set([...found.accessRequests]);
    if (found.accessLevel)    this.accessLevel.set(found.accessLevel);
  }

  ngAfterViewInit(): void {
    if (!this.sentinelEl) return;
    this.sentinelObserver = new IntersectionObserver(
      ([entry]) => this.tabsStuck.set(!entry.isIntersecting),
      { root: this.hostEl.nativeElement, threshold: 0 }
    );
    this.sentinelObserver.observe(this.sentinelEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.sentinelObserver?.disconnect();
  }

  get isDataset(): boolean { return !!(this.asset().viewerColumns || this.asset().viewerImages); }

  setTab(tab: 'overview' | 'preview' | 'docs' | 'versions' | 'feedback' | 'access' | 'usecase'): void { this.activeTab.set(tab); }
  setViewerImg(i: number): void { this.activeViewerIdx.set(i); }
  toggleUseCase(projectNumber: string): void { this.expandedUseCase.update(cur => cur === projectNumber ? null : projectNumber); }

  goToProject(entry: FeedbackEntry): void {
    if (!entry.projectNumber) return;
    this.setTab('usecase');
    this.expandedUseCase.set(entry.projectNumber);
  }
  askAboutUsage(uc: { projectNumber: string; projectTitle: string; country: string; usageSummary: string }): void {
    const question = `How is ${this.asset().title} used in project ${uc.projectNumber}: ${uc.projectTitle} (${uc.country})? Specifically, I'd like to understand: ${uc.usageSummary.toLowerCase()}.`;
    const id = this.chatService.startNewChat(question);
    this.router.navigate(['/chat', id]);
  }
  toggleBookmark(): void {
    const saving = !this.bookmarked();
    this.bookmarked.set(saving);
    if (saving) {
      if (this.snackTimer) clearTimeout(this.snackTimer);
      this.snackbarVisible.set(true);
      this.snackTimer = setTimeout(() => this.snackbarVisible.set(false), 3000);
    }
  }

  openFeedbackModal(initialRating = 0): void {
    this.pendingRating.set(initialRating);
    this.hoverRating.set(0);
    this.commentText.set('');
    this.submitAnonymous.set(true);
    this.feedbackModalOpen.set(true);
  }

  closeFeedbackModal(): void {
    this.feedbackModalOpen.set(false);
    this.pendingRating.set(0);
    this.hoverRating.set(0);
  }

  submitFeedback(): void {
    if (!this.canSubmit()) return;
    this.closeFeedbackModal();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.feedbackFirst.set((page - 1) * this.PAGE_SIZE);
  }

  projectRating(projectNumber: string): number {
    const entries = this.allFeedback().filter(f => f.projectNumber === projectNumber);
    if (!entries.length) return 0;
    return Math.round(entries.reduce((s, f) => s + f.rating, 0) / entries.length * 10) / 10;
  }

  toggleNotebookDropdown(e: MouseEvent): void {
    e.stopPropagation();
    this.notebookOpen.update(v => !v);
  }

  addToNewNotebook(e: MouseEvent): void {
    e.stopPropagation();
    this.notebookOpen.set(false);
    const a = this.asset();
    this.widgetService.pendingAsset.set({
      id: a.assetId,
      widgetType: 'asset',
      title: a.title,
      description: a.shortDescription?.slice(0, 120) ?? '',
      assetType: 'data',
      displayType: a.category === 'AI Agents' ? 'AI Agent' : a.category === 'AI Tools' ? 'AI Tool' : 'Dataset',
    });
    const card = this.workspaceService.create(`New Workspace`, {
      description: a.shortDescription?.slice(0, 120) ?? '',
      image: '/uc-country.png',
      datasets: 1,
    });
    this.router.navigate(['/notebooks', card.id]);
  }

  addToExistingNotebook(notebookId: string, e: MouseEvent): void {
    e.stopPropagation();
    this.notebookOpen.set(false);
    const a = this.asset();
    this.widgetService.pendingAsset.set({
      id: a.assetId,
      widgetType: 'asset',
      title: a.title,
      description: a.shortDescription?.slice(0, 120) ?? '',
      assetType: 'data',
      displayType: a.category === 'AI Agents' ? 'AI Agent' : a.category === 'AI Tools' ? 'AI Tool' : 'Dataset',
    });
    this.router.navigate(['/notebooks', notebookId]);
  }

  @HostListener('document:click')
  closeAllMenus(): void {
    this.notebookOpen.set(false);
    this.moreOpen.set(false);
  }

  toggleMoreMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.moreOpen.update(v => !v);
    this.notebookOpen.set(false);
  }

  downloadAsset(): void {
    this.moreOpen.set(false);
    if (this.isApiDataset()) { this.openTryApi(); return; }
    if (this.isApi()) { this.openTryApi(); return; }
    if (this.canTrySample()) {
      if (this.assetTypeLabel() === 'AI Agent') { this.openTryAgent(); return; }
      if (this.assetTypeLabel() === 'AI Tool')  { this.openTryTool();  return; }
      this.openTryApi();
      return;
    }
    console.log('Download:', this.asset().title);
  }

  copyLink(): void {
    this.moreOpen.set(false);
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }

  // ── Cite Asset modal ─────────────────────────────────────────────────────
  citeOpen    = signal(false);
  citeStyle   = signal<'ADB' | 'APA' | 'Chicago' | 'BibTeX'>('ADB');
  citeCopied  = signal(false);

  private readonly citeYear = computed(() => {
    const a = this.asset();
    const raw = a.versions?.[0]?.releaseDate ?? a.lastUpdated ?? '';
    const m = raw.match(/\b(20\d{2})\b/);
    return m ? m[1] : String(new Date().getFullYear());
  });

  readonly citation = computed(() => {
    const a    = this.asset();
    const year = this.citeYear();
    const type = this.assetTypeLabel();
    const ver  = a.versions?.[0]?.version ?? '';
    const url  = typeof window !== 'undefined' ? window.location.href : '';
    const org  = 'Asian Development Bank';
    const platform = 'DataNex+';

    switch (this.citeStyle()) {
      case 'ADB': {
        const parts = [`${org}. (${year}). ${a.title} [${type}]. ${platform}.`];
        if (ver) parts.push(`Version ${ver}.`);
        if (url) parts.push(url);
        return parts.join(' ');
      }
      case 'APA': {
        const parts = [`${org}. (${year}). *${a.title}* [${type}]. ${platform}.`];
        if (url) parts.push(`https://doi.org/... or retrieved from ${url}`);
        return parts.join(' ');
      }
      case 'Chicago': {
        const accessed = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        return `${org}. "${a.title}." ${platform}, ${year}${ver ? ', ' + ver : ''}. Accessed ${accessed}. ${url}`;
      }
      case 'BibTeX': {
        const key = `adb${year}${a.slug.replace(/-/g, '').slice(0, 16)}`;
        return `@misc{${key},\n  author    = {${org}},\n  title     = {${a.title}},\n  year      = {${year}},\n  type      = {${type}},\n  publisher = {${platform}},${ver ? `\n  version   = {${ver}},` : ''}\n  url       = {${url}}\n}`;
      }
    }
  });

  citeAsset(): void {
    this.moreOpen.set(false);
    this.citeOpen.set(true);
    this.citeStyle.set('ADB');
    this.citeCopied.set(false);
    this.cdr.markForCheck();
  }

  closeCiteModal(): void {
    this.citeOpen.set(false);
    this.cdr.markForCheck();
  }

  copyCitation(): void {
    navigator.clipboard.writeText(this.citation()).catch(() => {});
    this.citeCopied.set(true);
    setTimeout(() => { this.citeCopied.set(false); this.cdr.markForCheck(); }, 2200);
  }

  reportIssue(): void {
    this.moreOpen.set(false);
    console.log('Report issue:', this.asset().title);
  }
  assessmentBadge(val: string): { bg: string; color: string } {
    switch (val.toLowerCase()) {
      case 'excellent': return { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' };
      case 'good':      return { bg: 'rgba(141,198,63,0.12)', color: '#4d7c0f' };
      case 'moderate':  return { bg: 'rgba(245,158,11,0.12)', color: '#d97706' };
      case 'poor':      return { bg: 'rgba(249,115,22,0.12)', color: '#ea580c' };
      case 'critical':  return { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' };
      default:          return { bg: 'transparent', color: 'inherit' };
    }
  }

  geoFor(rows: TableRow[]): string {
    return rows.find(r => r.label.toLowerCase().includes('geograph'))?.value ?? '—';
  }

  readonly picName = computed(() => {
    const p = this.asset().pic ?? '';
    if (p.includes('\n')) return p.split('\n')[0];
    if (p.includes(' · ')) return p.split(' · ')[0];
    return p;
  });
  readonly picEmail = computed(() => {
    const p = this.asset().pic ?? '';
    if (p.includes('\n')) return p.split('\n')[1] ?? '';
    if (p.includes(' · ')) return p.split(' · ')[1] ?? '';
    return '';
  });
  overviewField(label: string): string {
    return this.asset().overview.find(r => r.label.toLowerCase().startsWith(label.toLowerCase()))?.value ?? '';
  }
  governanceField(label: string): string {
    return this.asset().governance.find(r => r.label.toLowerCase().startsWith(label.toLowerCase()))?.value ?? '';
  }
  readonly currentVersion = computed(() => this.asset().versions?.[0]?.version ?? '');
  readonly assetTypeLabel = computed(() => {
    const cat = this.asset().category;
    if (cat === 'Data Assets') return 'Dataset';
    if (cat === 'AI Agents') return 'AI Agent';
    if (cat === 'AI Tools') return 'AI Tool';
    if (cat === 'Portals') return 'AI Platform';
    if (cat === 'Platforms') return 'AI Platform';
    return cat;
  });

  readonly typeTagColor = computed((): 'blue' | 'violet' | 'amber' | 'teal' => {
    const map: Record<string, 'blue' | 'violet' | 'amber' | 'teal'> = {
      'Dataset': 'blue', 'AI Platform': 'blue',
      'AI Agent': 'violet', 'AI Tool': 'violet',
      'Dashboard': 'amber', 'API': 'teal',
    };
    return map[this.assetTypeLabel()] ?? 'blue';
  });

  readonly previewTabLabel = computed(() => {
    const t = this.assetTypeLabel();
    if (t === 'AI Agent' || t === 'AI Tool') return 'Capabilities';
    if (this.asset().category === 'APIs') return 'Documentation';
    return 'Preview';
  });

  readonly showCapabilities = computed(() =>
    this.assetTypeLabel() === 'AI Agent' || this.assetTypeLabel() === 'AI Tool'
  );

  readonly showTechnicalDoc = computed(() =>
    this.asset().category === 'APIs'
  );

  readonly isApiDataset = computed(() =>
    this.assetTypeLabel() === 'Dataset' && this.asset().accessMethod === 'api'
  );

  readonly ctaLabel = computed(() => {
    if (this.asset().requestAccessCta) return 'Request Access';
    if (this.assetTypeLabel() === 'AI Platform') return 'Launch Platform';
    return 'Use Asset';
  });

  readonly ctaIsDownload = computed(() =>
    !this.asset().requestAccessCta &&
    this.assetTypeLabel() === 'Dataset' &&
    this.asset().accessMethod !== 'api'
  );
  readonly isApi          = computed(() => this.asset().category === 'APIs');
  readonly canTrySample   = computed(() =>
    !!this.asset().tryWithSampleData &&
    (this.isApi() || this.assetTypeLabel() === 'AI Agent' || this.assetTypeLabel() === 'AI Tool')
  );
  readonly ctaFirstItemLabel = computed(() => {
    if (this.ctaIsDownload()) return 'Download Asset';
    if (this.isApiDataset()) return 'Try API';
    if (this.canTrySample()) {
      if (this.isApi()) return 'Try API';
      if (this.assetTypeLabel() === 'AI Agent') return 'Try Agent';
      return 'Try Tool';
    }
    if (this.asset().category === 'APIs') return 'Try API';
    if (this.assetTypeLabel() === 'AI Agent') return 'Use Agent';
    if (this.assetTypeLabel() === 'AI Tool') return 'Use Tool';
    return 'Request API Key';
  });
  readonly ctaFirstItemIsAI = computed(() =>
    this.assetTypeLabel() === 'AI Agent' || this.assetTypeLabel() === 'AI Tool'
  );
  readonly showSecondaryWorkspace = computed(() => {
    if (this.canTrySample()) return true;
    return !this.asset().requestAccessCta &&
      (this.assetTypeLabel() === 'Dataset' || this.asset().category === 'APIs' || this.assetTypeLabel() === 'AI Agent' || this.assetTypeLabel() === 'AI Tool');
  });

  requestAccessModalOpen = signal(false);
  requestReason          = signal('');
  requestSubmitted       = signal(false);
  private requestSnackTimer?: ReturnType<typeof setTimeout>;

  // Try API modal
  tryApiOpen        = signal(false);
  tryApiRegion      = signal('PH');
  tryApiDateFrom    = signal('2026-09-01');
  tryApiDateTo      = signal('2026-09-21');
  tryApiSatellite   = signal('sentinel-2');
  tryApiCloud       = signal('20');
  tryApiResolution  = signal('10');
  tryApiAdvanced    = signal(false);
  tryApiApiKey      = signal('');
  tryApiRespFormat  = signal('json');
  tryApiState       = signal<'idle' | 'loading' | 'success'>('idle');
  tryApiRespTab     = signal<'preview' | 'json'>('preview');
  tryApiCopied      = signal<'endpoint' | 'request' | 'json' | null>(null);

  readonly tryApiFloodJsonResponse = JSON.stringify({
    status: 'success',
    query: { lat: 14.5995, lon: 120.9842, return_period: 100, scenario: '2050', format: 'geojson' },
    result: {
      location: 'Manila, Philippines',
      flood_hazard_rating: 'High',
      inundation_depth_m: 2.4,
      risk_score: 0.82,
      affected_area_km2: 18.6,
      return_period_label: '100-year flood',
      climate_scenario: 'RCP 8.5 — 2050',
      data_source: 'Copernicus Sentinel-1 SAR + GLOFAS v4.0',
      geojson_url: '/api/geo/v2/inundation-layers/PH_MNL_2050_100yr.geotiff',
      sample_data: true,
    },
    meta: { response_time_ms: 318, version: 'v2.1', sandbox: true }
  }, null, 2);

  // OpenData API parameters
  tryApiOdEndpoint  = signal('/projects');
  tryApiOdCountry   = signal('PHI');
  tryApiOdLimit     = signal('20');
  tryApiOdFormat    = signal('json');

  readonly tryApiRequestPreview = computed(() => {
    const regionMap: Record<string, string> = { PH: 'PH', ID: 'ID', VN: 'VN', BD: 'BD', LK: 'LK' };
    const r = regionMap[this.tryApiRegion()] ?? this.tryApiRegion();
    return `GET /v1/satellite-imagery\n?region=${r}\n&satellite=${this.tryApiSatellite()}\n&date_from=${this.tryApiDateFrom()}\n&date_to=${this.tryApiDateTo()}\n&cloud_cover_max=${this.tryApiCloud()}\n&resolution=${this.tryApiResolution()}m`;
  });

  readonly tryApiOdRequestPreview = computed(() =>
    `GET /opendata/v4${this.tryApiOdEndpoint()}\n?country=${this.tryApiOdCountry()}\n&limit=${this.tryApiOdLimit()}\n&format=${this.tryApiOdFormat()}`
  );

  readonly tryApiOdJsonResponse = computed(() => JSON.stringify({
    status: 'success',
    endpoint: `/opendata/v4${this.tryApiOdEndpoint()}`,
    query: { country: this.tryApiOdCountry(), limit: Number(this.tryApiOdLimit()), format: this.tryApiOdFormat() },
    total: 247,
    count: Number(this.tryApiOdLimit()),
    data: [
      { project_id: 'PHI-3824', title: 'Metro Manila Subway Project Phase 2', country: 'Philippines', sector: 'Transport', status: 'Active', disbursed_usd: 1420000000 },
      { project_id: 'PHI-3756', title: 'Mindanao Rural Development Program', country: 'Philippines', sector: 'Agriculture', status: 'Active', disbursed_usd: 285000000 },
      { project_id: 'PHI-3701', title: 'Sustainable Infrastructure Program', country: 'Philippines', sector: 'Energy', status: 'Completed', disbursed_usd: 500000000 },
    ],
    meta: { response_time_ms: 214, version: 'v4.1', rate_limit_remaining: 998 }
  }, null, 2));

  readonly tryApiJsonResponse = computed(() => JSON.stringify({
    status: 'success',
    query: {
      region: this.tryApiRegion(),
      satellite: this.tryApiSatellite(),
      date_from: this.tryApiDateFrom(),
      date_to: this.tryApiDateTo(),
      cloud_cover_max: Number(this.tryApiCloud()),
      resolution_m: Number(this.tryApiResolution()),
    },
    result: {
      asset_id: 'S2_PH_20260918_1043',
      captured: '2026-09-18T10:43:22Z',
      satellite: 'Sentinel-2',
      resolution_m: Number(this.tryApiResolution()),
      cloud_coverage_pct: 8,
      coverage: 'Philippines',
      bands: ['B02', 'B03', 'B04', 'B08'],
      thumbnail_url: '/assets/preview/nighttime-lights-ph-thumb.png',
      download_url: null,
      api_access_only: true,
    },
    meta: { response_time_ms: 842, version: 'v1' }
  }, null, 2));

  openTryApi(): void {
    this.tryApiOpen.set(true);
    this.tryApiState.set('idle');
    this.tryApiRespTab.set('preview');
    this.notebookOpen.set(false);
    this.cdr.markForCheck();
  }

  closeTryApi(): void { this.tryApiOpen.set(false); this.cdr.markForCheck(); }

  sendTryApiRequest(): void {
    if (this.tryApiState() === 'loading') return;
    this.tryApiState.set('loading');
    this.cdr.markForCheck();
    setTimeout(() => {
      this.tryApiState.set('success');
      this.cdr.markForCheck();
    }, 900);
  }

  copyTryApi(which: 'endpoint' | 'request' | 'json'): void {
    const texts: Record<string, string> = {
      endpoint: '/v1/satellite-imagery',
      request:  this.tryApiRequestPreview(),
      json:     this.tryApiJsonResponse(),
    };
    navigator.clipboard.writeText(texts[which]).catch(() => {});
    this.tryApiCopied.set(which);
    setTimeout(() => { this.tryApiCopied.set(null); this.cdr.markForCheck(); }, 1800);
  }

  // Try Agent modal
  tryAgentOpen     = signal(false);
  tryAgentQuery    = signal('');
  tryAgentSending  = signal(false);
  tryAgentCopied   = signal<number | null>(null);
  tryAgentMessages = signal<{ role: 'user' | 'agent'; text: string }[]>([]);

  // keep for legacy callers
  tryAgentPreset  = signal(0);
  tryAgentState   = computed(() => this.tryAgentSending() ? 'loading' : this.tryAgentMessages().length ? 'success' : 'idle');

  readonly tryAgentPresets = computed(() => {
    if (this.asset().slug === 'adb-language-checker') return [
      { label: 'Style guide compliance check', query: 'Please review the following paragraph for compliance with the ADB Style Guide and flag any issues:\n\n"The utilisation of innovative financing mechanisms was undertaken by the project team in order to mobilise private sector capital for the purposes of infrastructure development across the region."' },
      { label: 'Plain language revision', query: 'Suggest plain language alternatives for this technical passage:\n\n"The implementation of multi-stakeholder governance frameworks necessitates the operationalisation of accountability mechanisms commensurate with institutional capacity parameters."' },
      { label: 'Executive summary review', query: 'Review this executive summary for clarity, consistency, and ADB tone:\n\n"This report presents findings of the evaluation undertaken with respect to the program. Key outcomes have been identified. Recommendations are provided for consideration by management."' },
    ];
    return [
      { label: 'Flood risk for coastal DMCs', query: 'What are the projected flood risk levels for Pacific Island Countries under a 2050 RCP 8.5 scenario? Include key infrastructure exposure.' },
      { label: 'NDC adaptation gaps — Philippines', query: 'Summarise the Philippines NDC adaptation commitments and identify key financing gaps for climate-resilient infrastructure.' },
      { label: 'IPCC AR6 projections — South Asia', query: 'What does IPCC AR6 say about temperature and precipitation projections for South Asia through 2100, and how does this affect ADB water sector operations?' },
    ];
  });

  readonly tryAgentSampleResponse = computed(() => {
    if (this.asset().slug === 'adb-language-checker') return `**Language Review — ADB Style Guide Compliance**

I've reviewed your text against the ADB Style Guide (2024 edition). Here are my findings:

**Issues found (3)**
- "utilisation" → prefer "use" (ADB Style Guide §3.2 — avoid Latinate alternatives)
- "was undertaken by the project team" → passive voice; rephrase as "the project team undertook"
- "for the purposes of" → wordy; replace with "to"

**Suggested revision:**
> "The project team used innovative financing mechanisms to mobilise private sector capital for infrastructure development across the region."

**Readability:** Sentence length is within ADB guidelines (25 words revised vs 34 original). Tone is appropriate for a project document.

*Note: This review uses a sandboxed sample. Full access enables document-level batch review, tracked changes export, and integration with ADB publishing workflows.*`;

    return `**Climate Risk Summary — Pacific Island Countries (RCP 8.5, 2050)**

Based on IPCC AR6 (2021) projections and ADB Climate Change Assessment reports for Pacific DMCs:

**Sea Level Rise**
- Mean projected SLR of 0.3–0.5 m by 2050 across the Pacific basin (high confidence)
- Kiribati, Tuvalu, and Marshall Islands face >80% land area at risk of inundation under storm surge compounding
- Critical infrastructure exposure includes 94 runway segments, 47 port facilities, and 312 coastal health posts identified in ADB Pacific Operations Review 2025

**Tropical Cyclone Intensity**
- Category 4–5 cyclone frequency projected to increase by 25–40% by 2050 (medium confidence, IPCC AR6 WG1 Ch.11)
- Samoa, Fiji, and Vanuatu operations show highest modelled damage exposure based on ADB project geo-tagging

**Freshwater Stress**
- Atoll groundwater lens salinisation accelerating; 14 of 22 Pacific DMCs projected to face critical freshwater stress by 2040
- Recommendation: groundwater resilience components in any new water sector loan

**Data sources used:** IPCC AR6 WGI & WGII; ADB Pacific Climate Assessments 2024; CCSD NDC Database; Geospatial Flooding Risk Engine (regional)

*Note: This response uses sample data for demonstration. Full analysis requires live knowledge base access.*`;
  });

  openTryAgent(): void {
    this.tryAgentOpen.set(true);
    this.tryAgentMessages.set([]);
    this.tryAgentQuery.set('');
    this.tryAgentSending.set(false);
    this.notebookOpen.set(false);
    this.cdr.markForCheck();
  }

  closeTryAgent(): void { this.tryAgentOpen.set(false); this.cdr.markForCheck(); }

  selectAgentPreset(i: number): void {
    this.submitAgentMessage(this.tryAgentPresets()[i].query);
  }

  sendTryAgentRequest(): void {
    this.submitAgentMessage(this.tryAgentQuery());
  }

  submitAgentMessage(text: string): void {
    const q = text.trim();
    if (!q || this.tryAgentSending()) return;
    this.tryAgentMessages.update(msgs => [...msgs, { role: 'user', text: q }]);
    this.tryAgentQuery.set('');
    this.tryAgentSending.set(true);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.tryAgentMessages.update(msgs => [...msgs, { role: 'agent', text: this.tryAgentSampleResponse() }]);
      this.tryAgentSending.set(false);
      this.cdr.markForCheck();
    }, 1400);
  }

  copyTryAgentMsg(idx: number): void {
    const msgs = this.tryAgentMessages();
    navigator.clipboard.writeText(msgs[idx]?.text ?? '').catch(() => {});
    this.tryAgentCopied.set(idx);
    setTimeout(() => { this.tryAgentCopied.set(null); this.cdr.markForCheck(); }, 1800);
  }

  markdownToHtml(text: string): SafeHtml {
    // Process line by line to properly group list items
    const lines = text.split('\n');
    const out: string[] = [];
    let inList = false;

    for (const raw of lines) {
      let line = raw
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

      if (/^-\s+/.test(raw)) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push(`<li>${line.replace(/^-\s+/, '')}</li>`);
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (/^###\s+/.test(raw))      out.push(`<h4>${line.replace(/^###\s+/, '')}</h4>`);
        else if (/^##\s+/.test(raw))  out.push(`<h3>${line.replace(/^##\s+/, '')}</h3>`);
        else if (/^#\s+/.test(raw))   out.push(`<h2>${line.replace(/^#\s+/, '')}</h2>`);
        else if (line.trim() === '')  out.push('<br>');
        else                          out.push(`<p>${line}</p>`);
      }
    }
    if (inList) out.push('</ul>');

    return this.sanitizer.bypassSecurityTrustHtml(out.join(''));
  }

  // ── Try Tool ─────────────────────────────────────────────────────────────
  tryToolOpen   = signal(false);
  tryToolQuery  = signal('');
  tryToolState  = signal<'idle' | 'loading' | 'success'>('idle');
  tryToolCopied = signal(false);

  readonly tryToolChips = computed(() => {
    if (this.asset().slug === 'adb-people-profile') return [
      'Infrastructure finance experts',
      'Climate specialists',
      'Project appraisal experience',
    ];
    return [];
  });

  readonly tryToolSampleInput = computed(() => {
    if (this.asset().slug === 'adb-people-profile')
      return 'Infrastructure finance specialists in South Asia';
    return '';
  });

  readonly tryToolSampleOutput = computed(() => {
    if (this.asset().slug === 'adb-people-profile') return [
      { name: 'Noah Tan', role: 'Senior Finance Specialist', dept: 'SAFD', region: 'South Asia', skills: 'Infrastructure Finance · PPP · Project Appraisal', email: 'n.tan@adb.org' },
      { name: 'Maria Santos', role: 'Principal Economist', dept: 'CWRD', region: 'Central & West Asia', skills: 'Transport Finance · Economic Analysis · Cost-Benefit', email: 'm.santos@adb.org' },
      { name: 'James Koh', role: 'Finance Specialist', dept: 'SERD', region: 'Southeast Asia', skills: 'Energy Finance · Blended Finance · Green Bonds', email: 'j.koh@adb.org' },
    ];
    return [];
  });

  openTryTool(): void {
    this.tryToolOpen.set(true);
    this.tryToolState.set('idle');
    this.tryToolQuery.set(this.tryToolSampleInput());
    this.notebookOpen.set(false);
    this.cdr.markForCheck();
  }

  closeTryTool(): void { this.tryToolOpen.set(false); this.cdr.markForCheck(); }

  runTryTool(): void {
    if (this.tryToolState() === 'loading') return;
    this.tryToolState.set('loading');
    this.cdr.markForCheck();
    setTimeout(() => { this.tryToolState.set('success'); this.cdr.markForCheck(); }, 1200);
  }

  copyTryTool(): void {
    const rows = this.tryToolSampleOutput().map(r => `${r.name} | ${r.role} | ${r.dept} | ${r.email}`).join('\n');
    navigator.clipboard.writeText(rows).catch(() => {});
    this.tryToolCopied.set(true);
    setTimeout(() => { this.tryToolCopied.set(false); this.cdr.markForCheck(); }, 1800);
  }

  ctaAction(): void {
    if (this.asset().requestAccessCta) {
      this.requestReason.set('');
      this.requestAccessModalOpen.set(true);
      return;
    }
  }

  copiedTask    = signal<string | null>(null);
  copiedUrl     = signal(false);
  expandedEndpoint = signal<string | null>(null);

  copyUrl(url: string): void {
    navigator.clipboard.writeText(url);
    this.copiedUrl.set(true);
    setTimeout(() => this.copiedUrl.set(false), 1800);
  }

  toggleEndpoint(path: string): void {
    this.expandedEndpoint.update(v => v === path ? null : path);
  }

  copyTask(task: string): void {
    navigator.clipboard.writeText(task);
    this.copiedTask.set(task);
    setTimeout(() => this.copiedTask.set(null), 1800);
  }

  closeRequestAccessModal(): void { this.requestAccessModalOpen.set(false); }

  submitAccessRequest(): void {
    this.requestAccessModalOpen.set(false);
    clearTimeout(this.requestSnackTimer);
    this.requestSubmitted.set(true);
    this.requestSnackTimer = setTimeout(() => this.requestSubmitted.set(false), 5000);
  }

  openPlatform(): void {
    const p = this.asset().parentProduct;
    if (p) { this.router.navigate(['/catalogue'], { queryParams: { search: p } }); }
  }

  goHome(): void { this.router.navigate(['/']); }

  // ── Access tab methods ────────────────────────────────────────────────────
  private showAccessSnack(msg: string): void {
    if (this.accessSnackTimer) clearTimeout(this.accessSnackTimer);
    this.accessSnack.set(msg);
    this.accessSnackTimer = setTimeout(() => this.accessSnack.set(null), 2800);
  }

  approveRequest(req: AccessRequest): void {
    this.accessRequests.update(rs => rs.filter(r => r.id !== req.id));
    this.accessEntries.update(es => [...es, {
      id: Date.now(), name: req.name, email: req.email,
      type: 'user', role: 'Viewer', addedDate: 'Today'
    }]);
    this.showAccessSnack(`Access granted to ${req.name}`);
  }

  declineRequest(req: AccessRequest): void {
    this.accessRequests.update(rs => rs.filter(r => r.id !== req.id));
    this.showAccessSnack(`Request from ${req.name} declined`);
  }

  removeAccess(entry: AccessEntry): void {
    this.accessEntries.update(es => es.filter(e => e.id !== entry.id));
    this.showAccessSnack(`Removed access for ${entry.name}`);
  }

  changeRole(entry: AccessEntry, role: 'Viewer' | 'Editor'): void {
    this.accessEntries.update(es => es.map(e => e.id === entry.id ? { ...e, role } : e));
  }

  addPerson(): void {
    const email = this.addPeopleEmail().trim();
    if (!email || !email.includes('@')) return;
    const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
    this.accessEntries.update(es => [...es, {
      id: Date.now(), name, email, type: 'user',
      role: this.addPeopleRole(), addedDate: 'Today'
    }]);
    this.addPeopleEmail.set('');
    this.showAccessSnack(`Invite sent to ${email}`);
  }

  saveAccessLevel(level: AccessLevel): void {
    this.accessLevel.set(level);
    this.accessLevelEdit.set(false);
    this.showAccessSnack('Access level updated');
  }

  accessLevelLabel(level: AccessLevel): string {
    if (level === 'Open') return 'Open Access — anyone in ADB can view';
    if (level === 'Restricted') return 'Restricted — requires approval from owner';
    return 'Limited — specific people and groups only';
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  goDataAssets(): void {
    this.router.navigate(['/catalogue']);
  }
}
