import type { Meta, StoryObj } from '@storybook/angular-vite';
import { PromptChipComponent } from './prompt-chip.component';

const sparkleIcon = `
  <svg slot="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#adb-prompt-chip-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
`;

const searchIcon = `
  <svg slot="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
`;

const meta: Meta<PromptChipComponent> = {
  title: 'UI / Prompt Chip',
  component: PromptChipComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Pill-shaped suggestion chip for the prompt bar. Comes in a default style and an AI gradient variant.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'ai'],
    },
    chipClick: { action: 'chipClick' },
  },
};

export default meta;
type Story = StoryObj<PromptChipComponent>;

export const Default: Story = {
  args: {
    label: 'Find datasets on climate',
    variant: 'default',
  },
  render: (args) => ({
    props: args,
    template: `
      <adb-prompt-chip [label]="label" [variant]="variant" (chipClick)="chipClick()">
        ${searchIcon}
      </adb-prompt-chip>
    `,
  }),
};

export const AI: Story = {
  args: {
    label: 'Summarise this for me',
    variant: 'ai',
  },
  render: (args) => ({
    props: args,
    template: `
      <adb-prompt-chip [label]="label" [variant]="variant" (chipClick)="chipClick()">
        ${sparkleIcon}
      </adb-prompt-chip>
    `,
  }),
};

export const ChipGroup: Story = {
  name: 'Chip Group',
  parameters: {
    docs: {
      description: {
        story: 'Typical prompt bar chip row showing a mix of default and AI-style chips.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center">
        <adb-prompt-chip label="Find datasets on climate" variant="default">
          ${searchIcon}
        </adb-prompt-chip>
        <adb-prompt-chip label="Summarise this for me" variant="ai">
          ${sparkleIcon}
        </adb-prompt-chip>
        <adb-prompt-chip label="Show me AI tools" variant="default">
          ${searchIcon}
        </adb-prompt-chip>
        <adb-prompt-chip label="Compare regions" variant="ai">
          ${sparkleIcon}
        </adb-prompt-chip>
      </div>
    `,
  }),
};
