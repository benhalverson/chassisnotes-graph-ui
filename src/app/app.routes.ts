import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/graphs/ui/graph-library-page/graph-library-page').then(
        (m) => m.GraphLibraryPage,
      ),
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
    path: '**',
    redirectTo: '',
  },
];
