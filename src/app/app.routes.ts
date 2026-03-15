import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'graphs',
    pathMatch: 'full',
  },
  {
    path: 'graphs',
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/graphs/ui/graph-library-page/graph-library-page'
          ).then((m) => m.GraphLibraryPage),
      },
      {
        path: ':graphId',
        loadComponent: () =>
          import(
            './features/diagram/ui/graph-editor-page/graph-editor-page'
          ).then((m) => m.GraphEditorPage),
      },
    ],
  },
  {
    path: 'diagnose',
    loadComponent: () =>
      import('./features/shell/placeholder-page/placeholder-page').then(
        (m) => m.PlaceholderPage,
      ),
    data: { title: 'Diagnose' },
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./features/shell/placeholder-page/placeholder-page').then(
        (m) => m.PlaceholderPage,
      ),
    data: { title: 'Templates' },
  },
  {
    path: '**',
    redirectTo: 'graphs',
  },
];
