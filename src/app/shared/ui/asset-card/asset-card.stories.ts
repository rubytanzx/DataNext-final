import type { Meta, StoryObj } from '@storybook/angular-vite';
import { componentWrapperDecorator } from '@storybook/angular-vite';
import { AssetCardComponent } from './asset-card.component';

const meta: Meta<AssetCardComponent> = {
  title: 'UI / Asset Card',
  component: AssetCardComponent,
  decorators: [
    componentWrapperDecorator(
      (story) => `
        <div style="
          position: relative;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #E8EEF3;
          padding: 24px;
          width: 320px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          cursor: pointer;
        ">${story}</div>
      `
    ),
  ] as any,
  parameters: { layout: 'centered' },
  argTypes: {
    tag: {
      control: 'select',
      options: ['Dataset', 'Dashboard', 'AI Agent', 'AI Tool', 'AI Product', 'API'],
    },
    access: {
      control: 'select',
      options: ['Restricted', 'ADB Only', 'Public'],
    },
    rating:               { control: 'text' },
    users:                { control: 'text' },
    uses:            { control: 'text' },
    isNew:                { control: 'boolean' },
    saved:                { control: 'boolean' },
    rai:                  { control: 'boolean' },
    governanceVerified:   { control: 'boolean' },
    verificationInProgress: { control: 'boolean' },
    showToggle:           { control: 'boolean' },
    selected:             { control: 'boolean' },
    showFooter:           { control: 'boolean' },
    unlisted:             { control: 'boolean' },
    addClick:  { action: 'addClick' },
    saveClick: { action: 'saveClick' },
    showAddToWorkspace:    { control: 'boolean' },
    addToWorkspaceDisabled: { control: 'boolean' },
    ctaDisabled:           { control: 'boolean' },
    ctaLabelOverride:      { control: 'text' },
    sectorTag: { control: 'text' },
    geoTag:    { control: 'text' },
    themes:    { control: 'object' },
    // hide tagColor — driven by tag internally
    tagColor:  { table: { disable: true } },
  },
  // Shared defaults — all controls are live on every story
  args: {
    access: 'ADB Only',
    rating: '4.7',
    isNew: false,
    saved: false,
    rai: false,
    governanceVerified: false,
    verificationInProgress: false,
    showToggle: false,
    selected: false,
    showFooter: true,
    unlisted: false,
    showAddToWorkspace: true,
    sectorTag: '',
    geoTag: '',
    themes: [],
  },
};

export default meta;
type Story = StoryObj<AssetCardComponent>;

export const Dataset: Story = {
  args: {
    tag: 'Dataset',
    tagColor: 'blue',
    title: 'Asia-Pacific Climate Indicators',
    description: 'Comprehensive dataset tracking temperature, precipitation, and sea-level metrics across 48 Asia-Pacific member economies.',
    users: '4.2k',
    uses: '1.3k',
    access: 'ADB Only',
    governanceVerified: true,
    sectorTag: 'Agriculture, Natural Resources, and Rural Development',
    geoTag: 'Asia and the Pacific',
    themes: ['Climate Action', 'Environmentally Sustainable Growth'],
  },
};

export const Dashboard: Story = {
  args: {
    tag: 'Dashboard',
    tagColor: 'teal',
    title: 'Asia-Pacific Climate Indicators Dashboard',
    description: 'Publicly accessible dashboard of key climate indicators across Asia-Pacific economies, updated quarterly.',
    users: '3.8k',
    uses: '2.1k',
    access: 'Public',
    governanceVerified: true,
    sectorTag: 'Agriculture, Natural Resources, and Rural Development',
    geoTag: 'Asia and the Pacific',
    themes: ['Climate Action', 'Inclusive Economic Growth', 'Knowledge Solutions'],
  },
};

export const AIAgent: Story = {
  name: 'AI Agent',
  args: {
    tag: 'AI Agent',
    tagColor: 'violet',
    title: 'ADB Navigator',
    description: 'Internal search and knowledge retrieval tool for ADB personnel to quickly locate relevant information across organisational systems.',
    users: '6.4k',
    uses: '4.2k',
    access: 'ADB Only',
    rai: true,
    sectorTag: 'Public Sector Management',
    geoTag: 'Global',
    themes: ['Governance and Capacity Development', 'Digital Transformation'],
  },
};

export const AITool: Story = {
  name: 'AI Tool',
  args: {
    tag: 'AI Tool',
    tagColor: 'violet',
    title: 'Intelligent File Search',
    description: 'Enterprise search capability enabling semantic retrieval of documents, files, reports, and knowledge assets.',
    users: '11.3k',
    uses: '1.8k',
    access: 'ADB Only',
    verificationInProgress: true,
    sectorTag: 'Multisector',
    geoTag: 'Global',
    themes: ['Digital Transformation', 'Knowledge Solutions'],
  },
};

export const AIPlatform: Story = {
  name: 'AI Product',
  args: {
    tag: 'AI Product',
    tagColor: 'violet',
    title: 'ADB Genie',
    description: 'Enterprise generative AI assistant unlocking development insights from thousands of trusted ADB documents and sources.',
    users: '9.1k',
    uses: '5.7k',
    access: 'ADB Only',
    rai: true,
    sectorTag: 'Multisector',
    geoTag: 'Global',
    themes: ['Digital Transformation', 'Partnerships', 'Inclusive Economic Growth'],
  },
};

export const API: Story = {
  args: {
    tag: 'API',
    tagColor: 'teal',
    title: 'ADB Open Data API',
    description: 'RESTful API providing programmatic access to ADB macroeconomic indicators, project data, and statistical tables in JSON and CSV formats.',
    users: '3.8k',
    uses: '890',
    access: 'Public',
    governanceVerified: true,
    sectorTag: 'Multisector',
    geoTag: 'Global',
    themes: ['Knowledge Solutions'],
  },
};

export const CorpusDocument: Story = {
  name: 'Corpus Document',
  args: {
    tag: 'Corpus Document' as any,
    tagColor: 'blue',
    title: 'Transport Document Corpus',
    description: 'Curated corpus of ADB transport sector publications and technical knowledge products for semantic retrieval.',
    users: '678',
    access: 'ADB Only',
    governanceVerified: true,
    sectorTag: 'Transport',
    geoTag: 'Southeast Asia',
    themes: ['Regional Cooperation and Public Goods'],
  },
};

// ── Sept Release variants ─────────────────────────────────────────────────────

const septReleaseBase = {
  showAddToWorkspace: true,
  addToWorkspaceDisabled: true,
  rating: undefined,
} as const;

export const SeptRelease_Dataset: Story = {
  name: 'Sept Release — Dataset',
  args: {
    ...septReleaseBase,
    tag: 'Dataset',
    tagColor: 'blue',
    title: 'Nighttime Lights',
    description: 'Satellite imagery tracking nighttime luminosity as a proxy for economic activity, electrification, and urban growth.',
    users: '11.0k',
    uses: '364',
    access: 'Restricted',
    governanceVerified: true,
    sectorTag: 'Energy',
    geoTag: 'Asia and the Pacific',
    themes: ['Climate Action', 'Environmentally Sustainable Growth'],
  },
};

export const SeptRelease_Platform: Story = {
  name: 'Sept Release — Platform',
  args: {
    ...septReleaseBase,
    tag: 'AI Product',
    tagColor: 'teal',
    title: 'eGIS Platform',
    description: 'Enterprise geographic information system platform providing ADB-wide access to spatial data, mapping tools, and geospatial analysis capabilities.',
    users: '8.6k',
    uses: '2.3k',
    access: 'Restricted',
    governanceVerified: true,
    sectorTag: 'Agriculture, Natural Resources, and Rural Development',
    geoTag: 'Asia and the Pacific',
    themes: ['Digital Transformation', 'Governance and Capacity Development'],
  },
};

export const SeptRelease_Tool: Story = {
  name: 'Sept Release — Tool (disabled CTA)',
  args: {
    ...septReleaseBase,
    tag: 'AI Tool',
    tagColor: 'violet',
    title: 'Intelligent File Search',
    description: 'Enterprise search capability enabling semantic retrieval of documents, files, reports, and knowledge assets using advanced NLP.',
    users: '11.3k',
    uses: '1.8k',
    access: 'ADB Only',
    verificationInProgress: true,
    sectorTag: 'Multisector',
    geoTag: 'Global',
    themes: ['Digital Transformation', 'Knowledge Solutions'],
    ctaDisabled: true,
  },
};

export const SeptRelease_Agent: Story = {
  name: 'Sept Release — AI Agent',
  args: {
    ...septReleaseBase,
    tag: 'AI Agent',
    tagColor: 'violet',
    title: 'Agentic Orchestration (CLARA)',
    description: 'Conversational LLM-based autonomous reasoning agent that orchestrates multi-step tasks across ADB knowledge systems and data platforms.',
    users: '4.2k',
    uses: '920',
    access: 'ADB Only',
    verificationInProgress: true,
    sectorTag: 'Multisector',
    geoTag: 'Asia and the Pacific',
    themes: ['Digital Transformation', 'Governance and Capacity Development'],
    ctaDisabled: true,
    ctaLabelOverride: 'Request API Key',
  },
};
