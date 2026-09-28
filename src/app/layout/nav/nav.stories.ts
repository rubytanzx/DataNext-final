import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { NavComponent } from './nav.component';
import { NavService } from '../../services/nav.service';
import { ChatService } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';

const MOCK_HISTORY = signal([
  { id: '1', source: 'home' as const, question: 'What climate datasets do we have for Pacific islands?', answer: '', ts: '', title: 'Climate datasets — Pacific' },
  { id: '2', source: 'home' as const, question: 'Show me GDP data for Southeast Asia', answer: '', ts: '' },
  { id: '3', source: 'home' as const, question: 'AI tools available for document analysis', answer: '', ts: '' },
  { id: '4', source: 'home' as const, question: 'Infrastructure investment indicators 2020–2025', answer: '', ts: '' },
]);

function providers(url: string, collapsed = false) {
  return [
    {
      provide: Router,
      useValue: { events: EMPTY, url, navigate: () => Promise.resolve(true) },
    },
    {
      provide: NavService,
      useValue: { collapsed: signal(collapsed), expand: () => {}, collapse: () => {}, toggle: () => {} },
    },
    {
      provide: ChatService,
      useValue: { history: MOCK_HISTORY, reset: () => {} },
    },
    {
      provide: ThemeService,
      useValue: { isDark: false, toggle: () => {} },
    },
  ];
}

const meta: Meta<NavComponent> = {
  title: 'Layout / Side Nav',
  component: NavComponent,
  parameters: { layout: 'fullscreen' },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="display:flex;height:100vh;background:var(--th-bg,#f0f5fa);">${story}</div>`
    ),
  ],
};

export default meta;
type Story = StoryObj<NavComponent>;

// ── Full nav states ────────────────────────────────────────────────────────

export const Expanded: Story = {
  decorators: [moduleMetadata({ providers: providers('/') })],
};

export const Collapsed: Story = {
  decorators: [moduleMetadata({ providers: providers('/', true) })],
};

// ── Menu items — active state ──────────────────────────────────────────────

export const Discover: Story = {
  decorators: [moduleMetadata({ providers: providers('/home') })],
};

export const AssetsCatalogue: Story = {
  name: 'Assets Catalog',
  decorators: [moduleMetadata({ providers: providers('/catalogue') })],
};

export const Spaces: Story = {
  decorators: [moduleMetadata({ providers: providers('/spaces') })],
};

export const MyWorkspace: Story = {
  name: 'My Library',
  decorators: [moduleMetadata({ providers: providers('/notebooks') })],
};

export const WhatsNew: Story = {
  name: "What's New",
  decorators: [moduleMetadata({ providers: providers('/whats-new') })],
};
