/**
 * DataNext asset catalogue—sourced from
 * "List of data products, MCP agents, and portals (2).xlsx" (Sep 2026)
 *
 * Three sheets:
 *   Data Assets              —136 items (geospatial, climate, mobility, socioeconomic, maritime, sectoral)
 *   AI Capability Assets     —18 agents + 10 tools/catalogues
 *   Product Assets           —9 portals / platforms
 *
 * All items with access: 'restricted' require department-level approval.
 * All items with access: 'all' are available to all ADB staff.
 */

export type AssetType = 'Dataset' | 'AI Agent' | 'AI Tool' | 'AI Product' | 'Dashboard' | 'API' | 'Catalogue' | 'Corpus Document';
export type AccessLevel = 'all' | 'restricted' | 'open';

export type TrustStatus = 'Responsible AI Verified' | 'Governance Verified' | 'Both';
export type IngestionStatus = 'Ingested' | 'Partial' | 'Planned';

export interface CatalogueAsset {
  name: string;
  type: AssetType;
  description: string;
  access: AccessLevel;
  department?: string;
  region?: string;
  // Fields sourced from the real catalog JSON
  trust_status?: TrustStatus;
  sector_group?: string;
  region_group?: string;
  data_maturity?: string;
  time_period?: string;
  data_type?: string;
  format?: string;
  ingestion_status?: IngestionStatus;
  parent_product?: string;
  context?: string;
  update_method?: string;
  location_of_data?: string;
  pic?: string;
  project_id?: string;
  unlisted?: boolean;
}

/* ── Data Assets ────────────────────────────────────────────────────────── */
export const DATA_ASSETS: CatalogueAsset[] = [

  {
    name: 'ADB Careers Dataset',
    type: 'Dataset',
    description: 'Structured dataset of ADB career opportunities, job postings, position descriptions, and recruitment-related information.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Water and Other Urban Infrastructure and Services',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Enterprise Document Registry Dataset',
    type: 'Dataset',
    description: 'Central inventory and metadata repository of ADB documents, classifications, ownership, and document locations. Covers ADB corporate knowledge and operations across all member countries and sectors.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
  },

  {
    name: 'ADB Key Indicators Database (KIDB)',
    type: 'Dataset',
    description: 'Cross-country catalog of broad development and macroeconomic indicators spanning economy, labour, health, education, energy, environment, transport and governance, harmonised into an SDMX-format country-year table.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Global',
  },

  {
    name: 'ADB Learning and Development Operations Dataset',
    type: 'Dataset',
    description: 'This dataset features data related to talent trends, skills-based career pathways, green-economy from LinkedIn. This includes information on skills, job roles, and industry trends relevant to ADB’s strategic priorities',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Not sector-specific',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Project Data Sheets Data Product',
    type: 'Dataset',
    description: 'Structured repository of project data sheets including project objectives, sectors, financing, implementation status, and key project information.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Project Funding and Disbursement Dataset',
    type: 'Dataset',
    description: 'Structured dataset covering project financing, commitments, disbursements, funding sources, and financial implementation status.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Project Procurement and Contract Management Dataset',
    type: 'Dataset',
    description: 'Dataset containing project procurement activities, awarded contracts, suppliers, procurement methods, and contract-related information.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Project Summary',
    type: 'Dataset',
    description: 'Collection of project summaries providing concise overviews of approved, ongoing, and completed ADB-supported projects.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Searchable Document Corpus Dataset',
    type: 'Dataset',
    description: 'Consolidated searchable corpus of ADB reports, publications, operational documents, policies, and knowledge products used for information retrieval and AI-powered search.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'ADB Tenders Dataset',
    type: 'Dataset',
    description: 'Dataset containing procurement notices, bidding opportunities, tender information, and associated procurement metadata.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Not sector-specific',
    region_group: 'Global',
  },

  {
    name: 'Agricultural GDP Flood Risk Exposure Dataset',
    type: 'Dataset',
    description: 'Geospatial dataset combining flood risk, flood depth, and economic exposure layers to quantify agricultural production and GDP at risk from varying flood intensities, probabilities, and climate scenarios. This dataset was used as part of technical assistance on big data analytics in agriculture and seaports.',
    access: 'restricted',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
  },

  {
    name: 'AI Adoption and Workforce Transformation Dataset',
    type: 'Dataset',
    description: 'This dataset includes LinkedIn data, including job postings and skill penetration. The data was used to support the empirical assessment of the impact of AI and digital technologies on the structure of work and labor markets.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Southeast Asia',
  },

  {
    name: 'Flights Data from OAG',
    type: 'Dataset',
    description: 'Commercial aviation schedule and flight movement data from OAG from October 2018 to September 2023 for analysis of air connectivity, route coverage, travel patterns and transport or economic activity. This was among the dataset used in developing the Key Indicators for Asia and the Pacific 2024.',
    access: 'restricted',
    sector_group: 'Transport',
    region_group: 'Global',
  },

  {
    name: 'BICRA (CSV)',
    type: 'Dataset',
    description: '',
    access: 'restricted',
  },

  {
    name: 'Chattogram Bay Eutrophication Monitoring Dataset',
    type: 'Dataset',
    description: 'Satellite-based analysis of eutrophication in the Chattogram coastal and estuarine waters of Bangladesh, assessing spatial and temporal patterns linked to human activities, particularly port operations.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'China Climate Change and Agricultural Production Dataset',
    type: 'Dataset',
    description: 'This features historical weather datasets used to analyze climate change impacts on agricultural productivity in China from 2000 to 2020.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Climate and Disaster Risk Knowledge Corpus Dataset',
    type: 'Dataset',
    description: 'Collection of climate change, disaster risk, resilience, adaptation, and related technical documents used to support climate risk assessments and AI solutions.',
    access: 'all',
    sector_group: 'Information and Communication Technology',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Coastal Seaport Activities and Environmental Impact Dataset',
    type: 'Dataset',
    description: 'This dataset includes historical weather and AIS data, as well as satellite images, to examine how seaport activities affect coastal eutrophication and sea surface temperature, and how weather conditions may influence these impacts.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Cook Islands - Average Annual Loss (AAL) - Airport Infrastructure',
    type: 'Dataset',
    description: 'Risk dataset providing Average Annual Loss (AAL) estimates  from hazard-related damage for Rarotonga International Airport in Cook Islands',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Cook Islands - Average Annual Loss (AAL) - Port Infrastructure',
    type: 'Dataset',
    description: 'Risk dataset providing Average Annual Loss (AAL) estimates  from hazard-related damage for Avatiu Port and Harbour in Cook Islands',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Cook Islands - Economic Exposure and Risk Data',
    type: 'Dataset',
    description: 'Dataset summarizing indirect economic impacts of airport and port disruptions on trade, tourism, supply chains, businesses, and other sectors in Cook Islands',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Cook Islands Flood Risk Projection (RCP 8.5) Dataset',
    type: 'Dataset',
    description: 'Raster datasets showing peak pluvial flood extent, depth, and velocity for selected annual recurrence interval events under current climate conditions (NoCC), mid-century (2050), and end of century (2090) RCP8.5 climate scenarios in Cook Islands',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Cook Islands Infrastructure Asset Dataset',
    type: 'Dataset',
    description: 'Vector layer of port, airport, and supporting infrastructure assets used in the probabilistic climate risk assessment of Rarotonga in Cook Islands. It includes asset characteristics such as replacement value, construction material, elevation, area, and floors.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Cook Islands Infrastructure Downtime Impact Dataset',
    type: 'Dataset',
    description: 'Risk dataset showing the probability that airport or port operations in Cook Islands will experience disruptions exceeding one week due to climate and disaster hazards',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Country Credit Profiles and Ratings (CSV)',
    type: 'Dataset',
    description: '',
    access: 'restricted',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Country Reference Mapping Dataset',
    type: 'Dataset',
    description: 'Mappings of ADB HSU code to ISO3, along with ADB member and DMC tags',
    access: 'all',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'Cross-Border Population Mobility Dataset',
    type: 'Dataset',
    description: 'Anonymized mobile location data used to support  monitoring of irregular cross-border movements across Southeast Asia, improving understanding of refugee and forced displacement patterns. Supports humanitarian planning, cross-border coordination, mobility analysis, and crisis response efforts.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Southeast Asia',
  },

  {
    name: 'Digital Infrastructure and Investment Dataset',
    type: 'Dataset',
    description: 'Open-source data, research assumptions, and other ICT sector datasets used to assess digital readiness across the Asia Pacific region at national and sub-national levels, supporting evidence-based investment planning for discussion with Developing Member Countries.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Information and Communication Technology',
    region_group: 'South Asia',
  },

  {
    name: 'Document Intelligence Parsed Content Dataset',
    type: 'Dataset',
    description: 'Structured machine-readable content extracted from ADB documents using document intelligence services, including text, tables, metadata, and document structure.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'EVA - Lessons Learned from Past ADB Projects',
    type: 'Dataset',
    description: 'EVA extracts lessons from evaluation reports, project documents, and research publications to support better project design and decision-making',
    access: 'all',
  },

  {
    name: 'Flood Exposure of Residential and Refuge Sites Dataset',
    type: 'Dataset',
    description: 'Geospatial assessment of residential areas and refuge sites exposed to flooding by overlaying location data with flood-risk and flood-depth scenarios across varying probabilities and severities. The data was part of technical assistance on the use of big data in migration and tourism.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
  },

  {
    name: 'GICS List',
    type: 'Dataset',
    description: '',
    access: 'restricted',
  },

  {
    name: 'Global Network Performance & Connectivity Dataset',
    type: 'Dataset',
    description: 'Geospatial fixed and mobile internet performance data covering download and upload speeds, used to assess connectivity, digital access and digital inequality. This dataset was used as one of the sources in developing the Asian Development Policy Review 2025.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Information and Communication Technology',
    region_group: 'Global',
  },

  {
    name: 'IMF Exchange Rate Dataset',
    type: 'Dataset',
    description: 'Comprehensive historical exchange rates',
    access: 'open',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'IMF World Economic Outlook Dataset',
    type: 'Dataset',
    description: 'Comprehensive historical global macroeconomic data',
    access: 'open',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'India Net Zero Transition Social Impact Dataset',
    type: 'Dataset',
    description: 'LinkedIn data, along with a combination of modeling results and LLM models were analyzed to understand sectoral shifts from brown to green sectors, and implications on workforce reallocation in India, as it charts its course towards net zero.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Infrastructure Asset Management Dataset',
    type: 'Dataset',
    description: 'This dataset includes flood maps overlaid with transport assets to assess the exposure of assets to flooding and hotspots to help in adaptation planning. The outputs were used to support policy dialogues with DMCs.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Lower East Chao Phraya Climate-Resilient Irrigation Dataset',
    type: 'Dataset',
    description: 'Floodmap data from Lower East Chao Phraya Irrigation System to strengthen climate resilience in Thailand by upgrading canals, embankments, gates, pumping stations, and digital O&M systems.m',
    access: 'restricted',
    sector_group: 'Water and Other Urban Infrastructure and Services',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Marine Activity & Tropical Cyclone Dataset',
    type: 'Dataset',
    description: 'Dataset covers Automatic Identification System maritime data combined with tropical cyclone information to support analysis of trade flows, fisheries, and climate-related disruptions. Used as part of technical assistance supporting impact-based forecasting and socioeconomic monitoring.',
    access: 'restricted',
    sector_group: 'Transport',
    region_group: 'Global',
  },

  {
    name: 'Maritime Vessel Movement (AIS) Dataset',
    type: 'Dataset',
    description: "Maritime indicators derived from the Automatic Identification System's vessel-tracking data, supporting analysis of port activity, maritime trade flows, and vessel movements. This was among the dataset used in developing the Key Indicators for Asia and the Pacific 2024.",
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Global',
  },

  {
    name: "Moody's MDC Industry Taxonomy",
    type: 'Dataset',
    description: '',
    access: 'restricted',
  },

  {
    name: "Moody's Ratings Methodologies (CSV)",
    type: 'Dataset',
    description: '',
    access: 'restricted',
  },

  {
    name: 'Mountain Road Resilience and Climate Risk Dataset',
    type: 'Dataset',
    description: 'Global flood hazard maps used as part of a climate resilience project for Papua New Guinea focused on rehabilitating vulnerable mountain roads, strengthening climate-resilient road standards, early warning systems, institutional capacity, and inclusive maintenance.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Myanmar Conflict and Vulnerability Dataset',
    type: 'Dataset',
    description: 'This dataset features data on the locations of conflicts overlaid with flood probability risk maps and digital connectivity maps to understand  how the potential impacts of the conflicts may be compounded by flooding and digital connectivity.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'NACE Economic Activity Classification Dataset',
    type: 'Dataset',
    description: 'Comprehensive industry classification list',
    access: 'open',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'Nepal Flood Risk & Climate Adaptation Dataset',
    type: 'Dataset',
    description: 'Nepal flood maps from JBA intended to guide the strategic placement of around 500 tube wells and infrastructure away from high-risk flood zones to support the achievement of a climate-resilient agricultural system in the project area.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Nighttime Light Intensity Dataset',
    type: 'Dataset',
    description: 'NASA’s Black Marble nighttime lights data and derived statistics used as proxies for economic activity, urbanization, and spatial development patterns. The dataset was used in technical assistance on impact-based forecasting and socioeconomic monitoring.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Global',
  },

  {
    name: 'Pacific Infrastructure Investment Planning Dataset',
    type: 'Dataset',
    description: 'Datasets from the Pacific collected to support the development of national infrastructure investment plans, including cross-sector prioritization of investments in consideration of climate and natural disaster implications.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
  },

  {
    name: 'Philippines Mobile Internet Access and Wealth Inequality Dataset',
    type: 'Dataset',
    description: 'This dataset provides a global overview of fixed broadband and mobile (cellular) network performance, organized into zoom level 16 Web Mercator tiles. It includes measurements for download speed, upload speed, and latency, collected through the Speedtest by Ookla applications.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Information and Communication Technology',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Port Digitalization and Emissions Reduction Dataset',
    type: 'Dataset',
    description: 'Maritime emissions data from selected ports. The data was used to support three studies commissioned under a TA on the digitalization of ports and emissions reduction, with the view of developing  proofs of concept that could be scaled for broader tech adoption.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Southeast Asia',
  },

  {
    name: 'Poverty and Social Analysis (PSA) Dataset',
    type: 'Dataset',
    description: 'Cross-country indicator catalog covering poverty, vulnerability, human development, basic services and social exclusion, harmonised into an SDMX-format country-year table (includes poverty headcount at $3.00/day 2021 PPP).',
    access: 'all',
    sector_group: 'Health',
    region_group: 'Global',
  },

  {
    name: 'Results Management Framework (RMF) Dataset',
    type: 'Dataset',
    description: 'Cross-country indicator catalog covering governance, macroeconomic resilience, climate vulnerability, conflict, displacement and security, harmonised into an SDMX-format country-year table with a resilience/development scoring framework.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Global',
  },

  {
    name: 'S & P Global Market Intelligence',
    type: 'Dataset',
    description: '',
    access: 'restricted',
  },

  {
    name: 'Safeguards Document Corpus Dataset',
    type: 'Dataset',
    description: 'Repository of safeguard policies, environmental and social frameworks, assessments, compliance documents, and guidance materials supporting safeguard-related activities.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Social Protection Indicators (SPI) Dataset',
    type: 'Dataset',
    description: 'Cross-country indicator catalog covering social protection expenditures, beneficiaries, breadth, depth and summary SPI measures, harmonised into an SDMX-format country-year table.',
    access: 'all',
    sector_group: 'Health',
    region_group: 'Global',
  },

  {
    name: 'Social Protection Indicators Dataset',
    type: 'Dataset',
    description: 'Country-level datasets on social protection programs e.g., social insurance, social assistance and labor market programs. These were used for publishing on the SPI web portal.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Social Protection Indicators of Coverage and Effectiveness (SPICES) Dataset',
    type: 'Dataset',
    description: 'Cross-country indicator catalog detailing social protection program structure, spending, beneficiaries and coverage, harmonised into an SDMX-format country-year table (SPICES framework).',
    access: 'all',
    sector_group: 'Health',
    region_group: 'Global',
  },

  {
    name: 'Southeast Asia Low Emission Zones Port Activity Dataset',
    type: 'Dataset',
    description: 'This dataset covered vessel emissions in Bangkok Port. It was used in a project that aimed to reduce traffic-related air pollution through low-emission zones, sustainable mobility solutions, and institutional reforms.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Southeast Asia Low Emission Zones Traffic Dataset',
    type: 'Dataset',
    description: 'Regional TA supports cities in Indonesia, Philippines, Thailand, and Viet Nam in assessing measures to reduce traffic-related air pollution. It evaluates LEZ and ULEZ feasibility, shares global best practices, strengthens policy and institutional frameworks, and identifies pilot projects regionally.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Southeast Asia',
  },

  {
    name: 'Strategy, Policy & Partnership Intelligence Dataset',
    type: 'Dataset',
    description: "ADB Corporate Results Framework (CRF) Level 2 datasets on the results of ADB operations that support ADB's Strategy 2030 Operational Priorities. This dataset was used to support SPD’s web portal dashboard creation.",
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Sustainable Procurement Knowledge Base Dataset',
    type: 'Dataset',
    description: 'Repository of sustainable procurement guidance, best practices, frameworks, methodologies, and supporting knowledge resources.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Sustainable Procurement Taxonomy Dataset',
    type: 'Dataset',
    description: 'Standardized taxonomy, classifications, vocabularies, and reference structures supporting sustainable procurement and related analytics.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Sustainable Public Transport and E-Bus Planning Dataset',
    type: 'Dataset',
    description: 'The dataset, which features data from Irys processed for further analysis,  was collected as part of the technical assistance to support the Government of Sri Lanka develop an integrated, inclusive, resilient, and sustainable public bus transport strategy.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Thailand Weather-Driven Migration and Climate Resilience Dataset',
    type: 'Dataset',
    description: 'This dataset uses historical and projected weather data to examine how weather and climate events influence migration patterns in Thailand. It identifies displacement trends and relocation hotspots to support climate adaptation planning, resilient infrastructure, and service provision.',
    access: 'all',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Tongatapu - Administrative and Town Boundaries',
    type: 'Dataset',
    description: 'Vector polygon dataset representing town boundaries and associated attributes across Tongatapu in Tonga, which can be used as a base layer for exposure and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Asset Exposure Across Hazard Scenarios',
    type: 'Dataset',
    description: 'Vector polygons of towns across Tongapatu in Tonga representing hazard-specific exposure metrics for people, assets, and infrastructure across modeled scenarios',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Building Asset Exposure',
    type: 'Dataset',
    description: 'Vector polygon dataset providing building-level exposure assessment results for multiple hazard scenarios across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Building Infrastructure Assets',
    type: 'Dataset',
    description: 'Vector polygon dataset depicting  buildings across Tongatapu in Tonga,which can be used to support infrastructure mapping and multi-hazard exposure assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Coastal Inundation Extent (10-Year ARI, SLR 0.5m)',
    type: 'Dataset',
    description: 'Raster surface of coastal inundation depth in meters relative to topography for a 10-year average recurrence interval (ARI) event with 0.5 m sea-level rise across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Coastal Inundation Extent (10-Year ARI, SLR 0m)',
    type: 'Dataset',
    description: 'Raster surface of coastal inundation depth in meters relative to topography for a 10-year average recurrence interval (ARI) event with 0 m sea-level rise across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Coastal Inundation Extent (10-Year ARI, SLR 1m)',
    type: 'Dataset',
    description: 'Raster surface of coastal inundation depth in meters relative to topography for a 10-year average recurrence interval (ARI) event with 1.0 m sea-level rise across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Coastal Inundation Extent (10-Year ARI, SLR 2m)',
    type: 'Dataset',
    description: 'Raster surface of coastal inundation depth in meters relative to topography for a 10-year average recurrence interval (ARI) event with 2.0 m sea-level rise across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Coastal Inundation Risk Assessment',
    type: 'Dataset',
    description: 'Vector polygons of towns in Tongapatu in Tonga representing risk assessment results for coastal inundation scenarios, including modeled loss and impact indicators',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Earthquake Risk Results',
    type: 'Dataset',
    description: 'Vector polygons of towns across Tongapatu in Tonga containing modeled risk metrics and potential losses associated with earthquake hazard scenarios',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Flood Risk Results',
    type: 'Dataset',
    description: 'Vector polygons of towns across Tongapatu in Tonga depicting modeled risk results and impact indicators for pluvial flooding hazard scenarios',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Peak Ground Acceleration (475-Year ARI)',
    type: 'Dataset',
    description: 'Raster surface of peak ground acceleration (g) for a 475-year average recurrence interval (ARI) across Tongatapu in Tonga, accounting for differences in site subsoil class',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Permanent Asset Risk Assessment',
    type: 'Dataset',
    description: 'Vector polygons of towns in Tongapatu in Tonga containing risk assessment results for permanent loss due to hazards',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Pluvial Flood Hazard (10-Year ARI, SLR 0m)',
    type: 'Dataset',
    description: 'Raster surface of pluvial flood inundation depth in meters relative to topography for a 10-year  average recurrence interval (ARI) rainfall event under present-day conditions across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Power and Water Infrastructure Assets',
    type: 'Dataset',
    description: 'Vector dataset depicting power and water infrastructure assets across Tongatapu in Tonga,which can be used to support infrastructure mapping and multi-hazard exposure assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Road Asset Exposure',
    type: 'Dataset',
    description: 'Vector polygon dataset providing road-level exposure assessment results for multiple hazard scenarios across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Road Infrastructure Assets',
    type: 'Dataset',
    description: 'Vector dataset depicting the road network across Tongatapu in Tonga,which can be used to support infrastructure mapping and multi-hazard exposure assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Tsunami Hazard Scenario (M9.0 Earthquake, SLR 0m)',
    type: 'Dataset',
    description: 'Raster surface of tsunami inundation depth generated from a magnitude 9.0 central earthquake source under 0 m sea level rise across Tongatapu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Tsunami Risk Results',
    type: 'Dataset',
    description: 'Vector polygons of towns across Tongapatu in Tonga depicting modeled impacts and loss estimates for tsunami hazard scenarios',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Wind Hazard (100-Year ARI, 0.2 m/s, 4m Height)',
    type: 'Dataset',
    description: 'Raster surface of site design wind gust (0.2s) velocity (m/s) for a 100-year average recurrence interval (ARI), assuming a 4.0 m high (single storey) asset  in Tongapatu in Tonga',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Tongatapu - Wind Risk Assessment',
    type: 'Dataset',
    description: 'Vector polygons of towns across Tongatapu in Tonga containing modeled risk results and economic loss estimates for wind hazard scenarios',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Transport Document Corpus Dataset',
    type: 'Dataset',
    description: 'Collection of transport sector reports, project documents, technical studies, policies, and knowledge products covering roads, railways, aviation, maritime, and urban transport.',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Urban Mobility Transition Planning Dataset',
    type: 'Dataset',
    description: 'The dataset includes transport, mobility, land use, and urban development data collected in support of the technical assistance to develop integrated land-use and mobility plans for the Bhubaneswar-Cuttack-Puri-Paradeep Economic Region.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Vanuatu - Asset Exposure to Earthquake Hazard (475-Year ARI)',
    type: 'Dataset',
    description: 'Dataset containing assets in Vanuatu exposed to a 475-year average recurrence interval (ARI) earthquake scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Building Asset Exposure',
    type: 'Dataset',
    description: "Vector dataset of building footprints with structural, occupancy, material, condition, and reconstruction cost attributes used in Vanuatu's  exposure model",
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Building Construction Materials Inventory',
    type: 'Dataset',
    description: 'Dataset classifying buildings by construction material to support vulnerability, exposure, and multi-hazard risk assessments om Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Coastal Flood Hazard (100-Year ARI, SLR 0.5m)',
    type: 'Dataset',
    description: 'Raster dataset of coastal inundation depth for a 100-year average recurrence intervial (ARI) coastal flooding event with 0.5 m sea-level rise in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Coastal Flood Hazard (100-Year ARI, SLR 0m)',
    type: 'Dataset',
    description: 'Raster dataset of coastal inundation depth for a 100-year average recurrence intervial (ARI) coastal flooding event with 0 m sea-level rise in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Coastal Flood Hazard (100-Year ARI, SLR 1m)',
    type: 'Dataset',
    description: 'Raster dataset of coastal inundation depth for a 100-year average recurrence intervial (ARI) coastal flooding event with 1.0 m sea-level rise in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Coastal Flood Hazard (100-Year ARI, SLR 2m)',
    type: 'Dataset',
    description: 'Raster dataset of coastal inundation depth for a 100-year average recurrence intervial (ARI) coastal flooding event with 2.0 m sea-level rise in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Disaster Risk Financing (DRF) Total Loss Estimates',
    type: 'Dataset',
    description: 'Risk dataset containing aggregated modelled losses in Vanuatu across hazards and scenarios, supporting disaster risk financing and resilience planning analyses',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Emergency Shelter Assessment Results',
    type: 'Dataset',
    description: 'Assessment dataset containing shelter resilience, accessibility, and hazard suitability information for emergency evacuation planning for Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Emergency Shelter Locations',
    type: 'Dataset',
    description: 'Vector dataset showing the locations of existing and proposed emergency shelters and their capacity in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (10-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 10-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (100-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 100-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (100-Year ARI, RCP8.5, 2050, SLR 0.5m)',
    type: 'Dataset',
    description: 'Raster dataset of 100-year average recurrence interval (ARI) pluvial-fluvial flood depth in Vanuatu under the RCP8.5 climate scenario for 2050, including 0.5 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (100-Year ARI, RCP8.5, 2100, SLR 0.5m)',
    type: 'Dataset',
    description: 'Raster dataset of 100-year average recurrence interval (ARI) pluvial-fluvial flood depth in Vanuatu under the RCP8.5 climate scenario for 2100, including 0.5 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (2-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 2-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (200-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 200-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (5-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 5-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Flood Hazard (50-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of pluvial-fluvial flood depth for a 50-year average recurrence interval (ARI) for climate in Vanuatu in 2024',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Peak Ground Acceleration (200-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of peak ground acceleration on rock (in g)  for a 200-year average recurrence interval (ARI) earthquake event in Vanuatu, representing the 50th percentile with a 0.5% probability of exceedance in any given year, at approximately 1,000 m spatial resolution',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Peak Ground Acceleration (475-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of peak ground acceleration on rock (in g)  for a 50-year average recurrence interval (ARI) earthquake event in Vanuatu, representing the 50th percentile with a 2% probability of exceedance in any given year, at approximately 1,000 m spatial resolution',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Peak Ground Acceleration (475-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of peak ground acceleration on rock (in g)  for a  475-year average recurrence interval (ARI) earthquake event in Vanuatu, representing the 50th percentile with a 0.2% probability of exceedance in any given year, at approximately 1,000 m spatial resolution',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Peak Ground Acceleration (975-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of peak ground acceleration on rock (in g)  for a  975-year average recurrence interval (ARI) earthquake event in Vanuatu, representing the 50th percentile with a 0.1% probability of exceedance in any given year, at approximately 1,000 m spatial resolution',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Earthquake Hazard (100-Year ARI)',
    type: 'Dataset',
    description: 'Dataset containing population in Vanuatu exposed to a 100-year average recurrence interval (ARI) earthquake scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Earthquake Hazard (200-Year ARI)',
    type: 'Dataset',
    description: 'Dataset containing population in Vanuatu exposed to a 200-year average recurrence interval (ARI) earthquake scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Earthquake Hazard (475-Year ARI)',
    type: 'Dataset',
    description: 'Dataset showing population exposure in Vanuatu to a 475-year average recurrence interval (ARI)  earthquake hazard scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Earthquake Hazard (50-Year ARI)',
    type: 'Dataset',
    description: 'Dataset containing population in Vanuatu exposed to a 50-year average recurrence interval (ARI) earthquake scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Earthquake Hazard (975-Year ARI)',
    type: 'Dataset',
    description: 'Dataset containing population in Vanuatu exposed to a 200-year average recurrence interval (ARI) earthquake scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Population Exposure to Flood Hazard (100-Year ARI)',
    type: 'Dataset',
    description: 'Dataset showing population exposure in Vanuatu to a 100-year average recurrence interval (ARI) earthquake hazard scenario, supporting impact and risk assessments',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (10-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 10-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (100-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset of peak ground acceleration on rock (in g)  for a 100-year average recurrence interval (ARI) earthquake event in Vanuatu, representing the 50th percentile with a 1% probability of exceedance in any given year, at approximately 1,000 m spatial resolution',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (100-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 100-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (2-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 2-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (200-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 200-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (5-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 5-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Rain-Induced Landslide Susceptibility (50-Year ARI)',
    type: 'Dataset',
    description: 'Raster dataset showing rainfall-induced landslide (RIL) susceptibility for a 50-year average recurrence interval (ARI) across Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Road Asset Exposure',
    type: 'Dataset',
    description: "Vector dataset depicting roads and transport infrastructure assets included in Vanuatu's exposure assessment, supporting impact and risk assessments",
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tropical Cyclone Hazard (500-Year ARI, SSP2-4.5, 2050)',
    type: 'Dataset',
    description: 'Raster dataset of tropical cyclone wind speed for a 500-year average recurrence intervial (ARI) event under the SSP2-4.5 climate scenario for 2050 in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tropical Cyclone Hazard (500-Year ARI, SSP2-4.5, 2100)',
    type: 'Dataset',
    description: 'Raster dataset of tropical cyclone wind speed for a 500-year average recurrence intervial (ARI) event under the SSP2-4.5 climate scenario for 2100 in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tropical Cyclone Hazard (500-Year ARI, SSP5-8.5, 2050)',
    type: 'Dataset',
    description: 'Raster dataset of tropical cyclone wind speed for a 500-year average recurrence intervial (ARI) event under the SSP5-8.5 climate scenario for 2050 in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tropical Cyclone Hazard (500-Year ARI, SSP5-8.5, 2100)',
    type: 'Dataset',
    description: 'Raster dataset of tropical cyclone wind speed for a 500-year average recurrence intervial (ARI) event under the SSP5-8.5 climate scenario for 2100 in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tsunami Hazard Scenario (Back Arc Thrust Belt, Mw 8.2, SLR 0.5m)',
    type: 'Dataset',
    description: 'Raster dataset of tsunami inundation depth for a Back Arc Thrust Belt Mw 8.2 earthquake scenario in Vanuatu at 0.5 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tsunami Hazard Scenario (Back Arc Thrust Belt, Mw 8.2, SLR 0m)',
    type: 'Dataset',
    description: 'Raster dataset of tsunami inundation depth for a Back Arc Thrust Belt Mw 8.2 earthquake scenario in Vanuatu at 0 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tsunami Hazard Scenario (Back Arc Thrust Belt, Mw 8.2, SLR 1m)',
    type: 'Dataset',
    description: 'Raster dataset of tsunami inundation depth for a Back Arc Thrust Belt Mw 8.2 earthquake scenario in Vanuatu at 1.0 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Tsunami Hazard Scenario (Back Arc Thrust Belt, Mw 8.2, SLR 2m)',
    type: 'Dataset',
    description: 'Raster dataset of tsunami inundation depth for a Back Arc Thrust Belt Mw 8.2 earthquake scenario in Vanuatu at 2.0 m sea-level rise',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Volcanic Ashfall Depth (Ambae Maximum Credible Event)',
    type: 'Dataset',
    description: 'Raster dataset showing modelled volcanic ashfall thickness at approximately 1,000 m spatial resolution from a maximum credible eruption scenario at Ambae volcano in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Volcanic Ashfall Depth (Ambrym Maximum Credible Event)',
    type: 'Dataset',
    description: 'Raster dataset showing modelled volcanic ashfall thickness at approximately 1,000 m spatial resolution from a maximum credible eruption scenario at Ambrym volcano in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Vanuatu - Volcanic Ashfall Depth (Gaua Maximum Credible Event)',
    type: 'Dataset',
    description: 'Raster dataset showing modelled volcanic ashfall thickness at approximately 1,000 m spatial resolution from a maximum credible eruption scenario at Gaua volcano in Vanuatu',
    access: 'all',
    sector_group: 'Multisector',
    region_group: 'The Pacific',
    unlisted: true,
  },

  {
    name: 'Water and Urban Development Document Corpus Dataset',
    type: 'Dataset',
    description: 'Repository of water, sanitation, urban development, livable cities, and related project documents, studies, policies, and guidance materials.',
    access: 'all',
    sector_group: 'Transport',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Weather-Induced Population Mobility and Climate Resilience Dataset',
    type: 'Dataset',
    description: 'This dataset includes GPS data and flood probability maps to track population displacement during and after weather-related events. It was used to analyze relocation patterns across socioeconomic groups and assess the vulnerability of residential areas and evacuation sites to future climate and disaster risks.',
    access: 'restricted',
    trust_status: 'Governance Verified',
    sector_group: 'Health',
    region_group: 'Asia and the Pacific',
  },

];

/* ── AI Agents ──────────────────────────────────────────────────────────── */
export const AI_AGENTS: CatalogueAsset[] = [

  {
    name: 'ADB Language Checker',
    type: 'AI Agent',
    description: 'AI-powered language and style validation tool aligned with ADB writing standards, terminology, and communication guidelines.',
    access: 'all',
  },

  {
    name: 'Agentic Orchestration (CLARA)',
    type: 'AI Agent',
    description: 'CLARA’s (Credit Lending Avatar for Risk Assessment) agentic layer acts as an AI-powered credit analyst that orchestrates multiple specialized workflows across ADB’s Non-Sovereign Operations (NSO). It can search and analyze internal knowledge sources, including CreditLens and historical credit documentation, while simultaneously retrieving external intelligence from providers such as Moody’s to enrich borrower, sector, country, and market analysis. Using retrieval-augmented generation (RAG), contextual memory, and agentic workflows, CLARA synthesizes information from structured and unstructured data to deliver traceable, evidence-based credit insights.',
    access: 'restricted',
    trust_status: 'Both',
  },

  {
    name: 'Climate Analytics Agent',
    type: 'AI Agent',
    description: 'AI agent supporting climate risk analysis, adaptation planning, resilience assessments, and climate-related insights.',
    access: 'all',
  },

  {
    name: 'Concept Note Drafter',
    type: 'AI Agent',
    description: 'Generative AI capability that assists in preparing concept notes using ADB templates, standards, and contextual information.',
    access: 'all',
  },

  {
    name: 'Contextualized People Search Agent',
    type: 'AI Agent',
    description: 'AI-powered people discovery service identifying relevant staff, expertise, organizational relationships, and collaboration networks.',
    access: 'all',
  },

  {
    name: 'Country Agent (CountryGenie)',
    type: 'AI Agent',
    description: 'AI agent providing country-specific information, development indicators, project portfolios, and country partnership insights.',
    access: 'all',
  },

  {
    name: 'Lessons Agent (EVA)',
    type: 'AI Agent',
    description: 'AI agent that retrieves and synthesizes lessons from evaluation reports, IED documents, and project knowledge repositories. Supports lesson discovery and evidence-based decision making.',
    access: 'all',
  },

  {
    name: 'Project Agent (Genie)',
    type: 'AI Agent',
    description: 'AI agent that answers project-related questions using ADB project documents, project data sheets, and operational knowledge sources.',
    access: 'all',
  },

  {
    name: 'Project Completion Checklist Drafter',
    type: 'AI Agent',
    description: 'AI assistant that generates project completion checklists based on project requirements, governance standards, and templates.',
    access: 'all',
  },

  {
    name: 'Query Rewriter: Lessons',
    type: 'AI Agent',
    description: 'Query refinement component that improves retrieval of lessons learned, evaluation findings, and knowledge products.',
    access: 'all',
  },

  {
    name: 'Query Rewriter: Sector',
    type: 'AI Agent',
    description: 'Query optimization component that rewrites user prompts to improve sector-specific retrieval and relevance.',
    access: 'all',
  },

  {
    name: 'Query Rewriter: Thematics',
    type: 'AI Agent',
    description: 'Query optimization component that enhances prompts using thematic terminology and taxonomy mappings.',
    access: 'all',
  },

  {
    name: 'Responsible AI Agent',
    type: 'AI Agent',
    description: "AI agent providing guidance on ADB's Responsible AI Framework, risk assessments, controls, and governance requirements.",
    access: 'all',
    trust_status: 'Both',
  },

  {
    name: 'Responsible AI Evaluator: Documentation',
    type: 'AI Agent',
    description: 'Evaluation component that assesses AI use cases against Responsible AI documentation requirements and governance controls.',
    access: 'restricted',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'Responsible AI Evaluator: Source Code',
    type: 'AI Agent',
    description: 'Evaluation component that analyzes AI source code artifacts against approved Responsible AI technical controls and requirements.',
    access: 'restricted',
    trust_status: 'Responsible AI Verified',
  },

  {
    name: 'Sector Agent',
    type: 'AI Agent',
    description: 'AI agent specialized in sector-specific knowledge retrieval and analysis across ADB operational sectors.',
    access: 'all',
  },

  {
    name: 'Sustainable Procument Agent',
    type: 'AI Agent',
    description: 'AI agent providing guidance on sustainable procurement policies, standards, taxonomies, and good practices.',
    access: 'all',
  },

  {
    name: 'Terms of Reference Drafter',
    type: 'AI Agent',
    description: 'AI-assisted drafting capability for preparing Terms of Reference using approved templates and procurement guidance.',
    access: 'all',
  },

];

/* ── AI Tools ───────────────────────────────────────────────────────────── */
export const AI_TOOLS: CatalogueAsset[] = [

  {
    name: 'ADB Language Retrieval',
    type: 'AI Tool',
    description: 'Knowledge retrieval service providing access to ADB-approved terminology, writing guidance, and language standards.',
    access: 'all',
  },

  {
    name: 'ADB People Profile',
    type: 'AI Tool',
    description: 'Structured employee profile repository containing directory information, organizational details, skills, and business affiliations.',
    access: 'all',
  },

  {
    name: 'ADB Staff Responsibility Retrieval',
    type: 'AI Tool',
    description: 'Service that retrieves staff roles, responsibilities, organizational assignments, and business ownership information.',
    access: 'all',
  },

  {
    name: 'Agent Catalogue',
    type: 'Catalogue',
    description: 'List  available agents in the platform and display meaningful information to help users choose the right agent for their purpose',
    access: 'all',
  },

  {
    name: 'Geospatial Retrieval',
    type: 'AI Tool',
    description: 'Retrieval service providing access to geographic, spatial, location-based, and map-related information assets.',
    access: 'all',
  },

  {
    name: 'Intelligent File Search',
    type: 'AI Tool',
    description: 'Enterprise search capability enabling semantic retrieval of documents, files, reports, and knowledge assets.',
    access: 'all',
  },

  {
    name: 'PDF Extraction',
    type: 'AI Tool',
    description: 'Document intelligence service that extracts text, tables, metadata, and structure from PDF documents for downstream AI processing.',
    access: 'all',
  },

  {
    name: 'Sector Search',
    type: 'AI Tool',
    description: 'Sector-specific search service enabling retrieval of documents, reports, and knowledge products by operational sector.',
    access: 'all',
  },

  {
    name: 'Thematic Search',
    type: 'AI Tool',
    description: 'Search service focused on thematic topics such as gender, climate, governance, private sector development, and digital transformation.',
    access: 'all',
  },

  {
    name: 'Tool Catalogue',
    type: 'Catalogue',
    description: 'List  available tools in the platform and display meaningful information to help users choose the right agent for their purpose. (e.g. deterministic, data classification, etc)',
    access: 'all',
  },

];

/* ── APIs ───────────────────────────────────────────────────────────────────── */
export const API_ASSETS: CatalogueAsset[] = [

  {
    name: 'ADB OpenData API',
    type: 'API',
    description: 'Programmatic access to ADB open datasets, project information, and statistical indicators via a RESTful API with JSON and CSV response formats.',
    access: 'all',
    department: 'DER',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Climate Finance Tracker API',
    type: 'API',
    description: 'Programmatic access to climate finance commitments, disbursements, and project pipelines for DMCs with filtering by country, sector, and instrument type.',
    access: 'restricted',
    department: 'CCSD',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'DMC Partner Economies',
  },

  {
    name: 'ERDI Data Pipeline API',
    type: 'API',
    description: 'Internal API exposing ERDI statistical pipelines—economic projections, key indicators, and macro-financial data—for integration with dashboards and agent workflows.',
    access: 'restricted',
    department: 'ERDI',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

  {
    name: 'Geospatial Flooding Risk Engine',
    type: 'API',
    description: 'Standardized endpoint accessing high-precision topological risk predictions and flood vulnerability assessments across Asia-Pacific river basins.',
    access: 'restricted',
    department: 'ITD',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'Asia and the Pacific',
    trust_status: 'Governance Verified',
  },

  {
    name: 'Project Data API',
    type: 'API',
    description: 'Structured access to ADB project metadata, procurement records, disbursement data, and implementation status across the full project portfolio.',
    access: 'restricted',
    department: 'SPD',
    sector_group: 'Multisector',
    region_group: 'Asia and the Pacific',
  },

];

export const PUBLIC_ASSETS: CatalogueAsset[] = [

  {
    name: 'Asia-Pacific Climate Indicators Dashboard',
    type: 'Dashboard',
    description: 'Publicly accessible dashboard of key climate indicators across Asia-Pacific economies. Covers temperature anomalies, sea-level trends, extreme weather frequency, and emissions trajectories sourced from ADB and partner datasets.',
    access: 'open',
    department: 'CCSD',
    sector_group: 'Agriculture, Natural Resources, and Rural Development',
    region_group: 'Asia and the Pacific',
    trust_status: 'Governance Verified',
    data_maturity: 'Production',
    region: 'Asia-Pacific',
  },

];

/* ── Portals & Platforms ────────────────────────────────────────────────────── */
export const PORTALS: CatalogueAsset[] = [

  {
    name: 'ADB Genie',
    type: 'AI Product',
    description: 'Enterprise generative AI assistant that unlocks development insights from thousands of trusted documents and sources across sectors and contexts.',
    access: 'all',
    trust_status: 'Both',
  },

  {
    name: 'ADB Navigator',
    type: 'AI Product',
    description: 'Knowledge Navigator is an internal search and knowledge retrieval tool designed to help ADB personnel quickly locate relevant information across organizational systems and repositories.',
    access: 'all',
    trust_status: 'Both',
  },

  {
    name: 'AuditGenie (Chat)',
    type: 'AI Product',
    description: 'AI-powered assistant supporting audit-related research, document review, analysis, and knowledge retrieval from approved audit and governance materials.',
    access: 'restricted',
    trust_status: 'Both',
  },

  {
    name: 'CLARA',
    type: 'AI Product',
    description: "CLARA (Credit Lending Avatar for Risk Assessment) is an AI-powered platform that supports credit risk assessment, loan structuring, and investment decision-making for ADB’s NonSovereign Operations by combining internal and external data into actionable insights covering ADB's Member and Developing Member Countries.",
    access: 'restricted',
    trust_status: 'Both',
  },

  {
    name: 'eGIS Platform',
    type: 'AI Product',
    description: 'Enterprise geographic information system platform providing ADB-wide access to spatial data, mapping tools, and geospatial analytics.',
    access: 'restricted',
  },

  {
    name: 'EVA (Chat)',
    type: 'AI Product',
    description: 'EVA is designed to enhance the accessibility, usability, and accuracy of evaluation knowledge by enabling efficient search and retrieval of relevant lessons from the publicly disclosed evaluation documents of ADB.',
    access: 'all',
    trust_status: 'Both',
  },

  {
    name: 'OPR Portal',
    type: 'AI Product',
    description: 'Internal portal supporting OPR operational and reporting workflows.',
    access: 'restricted',
  },

  {
    name: 'RAI Platform',
    type: 'AI Product',
    description: "Internal AI-powered platform that operationalizes ADB's Responsible AI Framework providing ADB's centralized inventory of registered AI use cases, including risk assessment scores, review/approval status, compliance findings, and governance decisions.",
    access: 'all',
    trust_status: 'Both',
  },

  {
    name: 'SovOps',
    type: 'AI Product',
    description: 'AI-powered solution supporting sovereign operations through document extraction, knowledge retrieval, analysis, document review, and decision-support workflows using approved data sources.',
    access: 'restricted',
    trust_status: 'Both',
  },

];
