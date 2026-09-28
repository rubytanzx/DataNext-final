import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { componentWrapperDecorator } from '@storybook/angular-vite';
import { PrimaryBtnDirective } from '../primary-btn/primary-btn.directive';
import { SecondaryBtnDirective } from '../secondary-btn/secondary-btn.directive';

@Component({
  selector: 'app-cta-banner-story',
  standalone: true,
  imports: [PrimaryBtnDirective, SecondaryBtnDirective],
  styles: [`
    .cta-banner {
      padding: 20px 24px;
      background: #fff;
      border: 1px solid #E0E0E0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .cta-banner--continue {
      background: linear-gradient(135deg, #e8eeff 0%, #ddf0fb 100%);
      border-color: #c7d9f5;
    }
    .cta-banner--continue .cta-title { color: #1a2e6b; }
    .cta-banner--continue .cta-desc  { color: #3d5a8a; }
    .cta-banner--contact {
      background: #f5f8fb;
      border-color: #dce8f0;
    }
    .cta-banner--contact .cta-title { color: #002569; }
    .cta-banner--contact .cta-desc  { color: #3a5a78; }
    .cta-text {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cta-title {
      font-size: 16px;
      font-weight: 500;
      color: #8DC63F;
    }
    .cta-desc {
      font-size: 14px;
      font-weight: 300;
      color: #212121;
      margin: 0;
    }
  `],
  template: `
    <div class="cta-banner"
         [class.cta-banner--continue]="variant === 'continue'"
         [class.cta-banner--contact]="variant === 'contact'">
      <div class="cta-text">
        <strong class="cta-title">{{ title }}</strong>
        <p class="cta-desc">{{ description }}</p>
      </div>
      @if (variant === 'contact') {
        <button appSecondaryBtn type="button">{{ ctaLabel }}</button>
      } @else {
        <button appPrimaryBtn type="button">{{ ctaLabel }}</button>
      }
    </div>
  `,
})
class CtaBannerStoryComponent {
  @Input() variant: 'share' | 'continue' | 'contact' = 'share';
  @Input() title = 'Have something to share?';
  @Input() description = 'Contribute your data collections, tools or agents to help ADB work smarter together.';
  @Input() ctaLabel = 'Contribute an Asset';
}

const meta: Meta<CtaBannerStoryComponent> = {
  title: 'UI / Contribute Callout',
  component: CtaBannerStoryComponent,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    componentWrapperDecorator((story) => `<div style="max-width: 900px; width: 100%;">${story}</div>`),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['share', 'continue', 'contact'],
      description: 'Visual style of the banner',
    },
  },
};

export default meta;
type Story = StoryObj<CtaBannerStoryComponent>;

export const HaveSomethingToShare: Story = {
  name: 'Have something to share?',
  args: {
    variant: 'share',
    title: 'Have something to share?',
    description: 'Contribute your data collections, tools or agents to help ADB work smarter together.',
    ctaLabel: 'Contribute an Asset',
  },
};

export const ContinueWhereYouLeftOff: Story = {
  name: 'Continue where you left off',
  args: {
    variant: 'continue',
    title: 'Continue where you left off',
    description: 'Pick up your latest Workspace right where you stopped.',
    ctaLabel: 'Resume Workspace',
  },
};

export const ManualContribution: Story = {
  name: 'Manual Contribution',
  args: {
    variant: 'contact',
    title: 'Want to contribute manually?',
    description: 'Reach out to the DataNext team and we\'ll help you get your asset reviewed and published.',
    ctaLabel: 'Get in Touch',
  },
};
