import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular-vite';
import { PromptBarComponent } from './prompt-bar.component';

const meta: Meta = {
  title: 'UI / Prompt Bar',
  decorators: [
    moduleMetadata({ imports: [PromptBarComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="width:720px;max-width:100%;padding:32px 24px;">${story}</div>`
    ),
  ],
  parameters: { layout: 'centered' },
  argTypes: {
    placeholder: { control: 'text' },
    loading:     { control: 'boolean' },
    disabled:    { control: 'boolean' },
  },
  args: {
    placeholder: 'Ask me anything about ADB data…',
    loading:     false,
    disabled:    false,
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    template: `<adb-prompt-bar
      [placeholder]="placeholder"
      [loading]="loading"
      [disabled]="disabled"
    ></adb-prompt-bar>`,
    props: args,
  }),
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    template: `<adb-prompt-bar
      [placeholder]="placeholder"
      [loading]="loading"
      [disabled]="disabled"
    ></adb-prompt-bar>`,
    props: args,
  }),
};

