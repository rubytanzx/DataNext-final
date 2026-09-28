import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular-vite';
import { ChipSelectComponent } from './chip-select.component';

const SECTOR_OPTIONS = [
  'Agriculture', 'Air Quality', 'Biodiversity', 'Clean Energy', 'Climate',
  'Connectivity', 'Disaster Risk', 'Education', 'Environment', 'Finance',
  'Food Security', 'Gender', 'Governance', 'Health', 'Infrastructure',
  'Innovation', 'Labor', 'Poverty', 'Private Sector', 'Rural Development',
  'SDG', 'Social Protection', 'Trade', 'Transport', 'Urban', 'Water & Sanitation',
];

const meta: Meta<ChipSelectComponent> = {
  title: 'UI / Chip Select',
  component: ChipSelectComponent,
  decorators: [
    moduleMetadata({ imports: [ChipSelectComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="width:480px;max-width:100%;padding:32px 24px;font-family:system-ui,sans-serif;">${story}</div>`
    ),
  ],
  parameters: { layout: 'centered' },
  argTypes: {
    placeholder: { control: 'text' },
    options:     { control: 'object' },
    value:       { control: 'object' },
  },
  args: {
    placeholder: 'Select themes…',
    options:     SECTOR_OPTIONS,
    value:       [],
  },
};

export default meta;
type Story = StoryObj<ChipSelectComponent>;

export const Empty: Story = {
  name: 'Empty',
  render: (args) => ({
    props: args,
    template: `
      <adb-chip-select
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
      ></adb-chip-select>
    `,
  }),
};

export const WithSelection: Story = {
  name: 'With Selection',
  args: {
    value: ['Climate', 'Water & Sanitation', 'Urban', 'SDG'],
  },
  render: (args) => ({
    props: args,
    template: `
      <adb-chip-select
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
      ></adb-chip-select>
    `,
  }),
};

export const FewOptions: Story = {
  name: 'Few Options',
  args: {
    options: ['Agriculture', 'Climate', 'Health', 'Trade', 'Urban'],
    value: ['Climate'],
    placeholder: 'Select sector…',
  },
  render: (args) => ({
    props: args,
    template: `
      <adb-chip-select
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
      ></adb-chip-select>
    `,
  }),
};

export const AllSelected: Story = {
  name: 'All Selected',
  args: {
    options: ['Agriculture', 'Climate', 'Health'],
    value:   ['Agriculture', 'Climate', 'Health'],
  },
  render: (args) => ({
    props: args,
    template: `
      <adb-chip-select
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
      ></adb-chip-select>
    `,
  }),
};

export const Playground: Story = {
  name: 'Playground',
  render: (args) => ({
    props: args,
    template: `
      <adb-chip-select
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
      ></adb-chip-select>
    `,
  }),
};
