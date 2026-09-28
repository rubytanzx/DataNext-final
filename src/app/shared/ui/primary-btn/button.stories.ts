import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular-vite';
import { PrimaryBtnDirective } from './primary-btn.directive';
import { SecondaryBtnDirective } from '../secondary-btn/secondary-btn.directive';
import { TertiaryBtnDirective } from '../tertiary-btn/tertiary-btn.directive';

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

const VARIANT_CLASS: Record<string, string> = {
  Primary:   'app-primary-btn',
  Secondary: 'app-secondary-btn',
  Tertiary:  'app-tertiary-btn',
};

const SIZE_CLASS: Record<string, string> = {
  Small:  'app-btn--sm',
  Medium: '',
  Large:  'app-btn--lg',
};

const meta: Meta = {
  title: 'UI / Button',
  decorators: [
    moduleMetadata({ imports: [PrimaryBtnDirective, SecondaryBtnDirective, TertiaryBtnDirective] }),
    componentWrapperDecorator(
      (story) => `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">${story}</div>`
    ),
  ],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj;

// ── Playground ─────────────────────────────────────────────────────────────
export const Playground: Story = {
  argTypes: {
    variant:  { control: 'select', options: ['Primary', 'Secondary', 'Tertiary'] },
    disabled: { control: 'boolean' },
    size:     { control: 'select', options: ['Small', 'Medium', 'Large'] },
    icon:     { control: 'select', options: ['None', 'Leading', 'Trailing'] },
  },
  args: {
    variant:  'Primary',
    disabled: false,
    size:     'Medium',
    icon:     'None',
  },
  render: (args) => ({
    template: `
      <button [class]="cls" [disabled]="disabled">
        @if (icon === 'Leading') { ${ICON_SVG} }
        Button Label
        @if (icon === 'Trailing') { ${ICON_SVG} }
      </button>
    `,
    props: {
      ...args,
      cls: [VARIANT_CLASS[args['variant']] ?? 'app-primary-btn', SIZE_CLASS[args['size']] ?? ''].join(' ').trim(),
    },
  }),
};

// ── Per-variant stories ────────────────────────────────────────────────────
export const Primary: Story = {
  render: () => ({
    template: `<button appPrimaryBtn>Contribute an Asset</button>`,
  }),
};

export const Secondary: Story = {
  render: () => ({
    template: `<button appSecondaryBtn>Learn More</button>`,
  }),
};

export const Tertiary: Story = {
  render: () => ({
    template: `<button appTertiaryBtn>Cancel</button>`,
  }),
};

export const AllVariants: Story = {
  name: 'All Variants — Default (36px)',
  render: () => ({
    template: `
      <button appPrimaryBtn>Contribute an Asset</button>
      <button appSecondaryBtn>Learn More</button>
      <button appTertiaryBtn>Cancel</button>
    `,
  }),
};

export const SmallVariants: Story = {
  name: 'All Variants — Small (28px)',
  render: () => ({
    template: `
      <button appPrimaryBtn class="app-btn--sm">${ICON_SVG} Run workflow</button>
      <button appPrimaryBtn class="app-btn--sm">Save changes</button>
      <button appSecondaryBtn class="app-btn--sm">Cancel</button>
      <button appTertiaryBtn class="app-btn--sm">${ICON_SVG} Edit</button>
    `,
  }),
};

export const Sizes: Story = {
  name: 'Sizes — Primary',
  render: () => ({
    template: `
      <button appPrimaryBtn class="app-btn--sm">Small (28px)</button>
      <button appPrimaryBtn>Default (36px)</button>
      <button appPrimaryBtn class="app-btn--lg">Large (44px)</button>
    `,
  }),
};
