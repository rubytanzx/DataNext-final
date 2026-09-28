import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'whats-new',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'data-explorer',
    loadComponent: () => import('./features/data-explorer/data-explorer.component').then(m => m.DataExplorerComponent),
  },
  {
    path: 'publications',
    loadComponent: () => import('./features/publications/publications.component').then(m => m.PublicationsComponent),
  },
  {
    path: 'briefing',
    loadComponent: () => import('./features/briefing/briefing.component').then(m => m.BriefingComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'notebooks',
    loadComponent: () => import('./features/notebooks/notebooks.component').then(m => m.NotebooksComponent),
  },
  {
    path: 'notebooks/:id',
    loadComponent: () => import('./features/notebooks/notebook/notebook.component').then(m => m.NotebookComponent),
    data: { hideNav: true },
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./features/catalogue/catalogue.component').then(m => m.CatalogueComponent),
  },
  {
    path: 'assets/:id',
    loadComponent: () => import('./features/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
  },
  {
    path: 'whats-new',
    loadComponent: () => import('./features/whats-new/whats-new.component').then(m => m.WhatsNewComponent),
  },
  {
    path: 'spaces',
    loadComponent: () => import('./features/spaces/spaces.component').then(m => m.SpacesComponent),
  },
  {
    path: 'chat/:id',
    loadComponent: () => import('./features/chat-view/chat-view.component').then(m => m.ChatViewComponent),
  },
  {
    path: 'contribute',
    loadComponent: () => import('./features/contribute/contribute.component').then(m => m.ContributeComponent),
    data: { hideNav: true },
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent),
  },
  {
    path: '**',
    redirectTo: 'whats-new',
  },
];
