import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AIReasoningLoaderComponent } from './ai-reasoning-loader.component';

const meta: Meta<AIReasoningLoaderComponent> = {
  title: 'UI / Loaders / AI Reasoning Loader',
  component: AIReasoningLoaderComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Animated reasoning panel shown while an AI agent processes a request. Cycles through phases and can show a live task list.',
      },
    },
  },
  argTypes: {
    phaseDuration: {
      control: { type: 'range', min: 500, max: 8000, step: 500 },
      description: 'How long each phase label is shown (ms)',
    },
  },
};

export default meta;
type Story = StoryObj<AIReasoningLoaderComponent>;

export const Default: Story = {
  args: {
    phases: ['Thinking', 'Searching', 'Preparing Results'],
    phaseDuration: 4000,
    thoughts: [],
    tasks: [],
  },
};

export const WithThoughts: Story = {
  name: 'With Thoughts',
  args: {
    phases: ['Analysing query', 'Scanning catalog', 'Ranking results'],
    phaseDuration: 3000,
    thoughts: [
      'The user is looking for climate-related datasets in Asia-Pacific.',
      'Searching across 488 catalog entries for matching records.',
      'Filtering by access level and data maturity before ranking.',
    ],
    tasks: [],
  },
};

export const WithTasks: Story = {
  name: 'With Agentic Tasks',
  args: {
    phases: ['Retrieving', 'Cross-referencing', 'Summarising'],
    phaseDuration: 3000,
    thoughts: ['Running multi-step retrieval across connected data sources.'],
    tasks: [
      { title: 'Query knowledge base', description: 'Searching ADB document repository', status: 'completed' },
      { title: 'Cross-reference catalog', description: 'Matching datasets to query intent', status: 'in-progress' },
      { title: 'Generate summary', description: 'Producing a structured response', status: 'pending' },
    ],
  },
};

export const FastCycle: Story = {
  name: 'Fast Phase Cycle',
  args: {
    phases: ['Thinking', 'Reasoning', 'Verifying', 'Finalising'],
    phaseDuration: 800,
    thoughts: [],
    tasks: [],
  },
};
