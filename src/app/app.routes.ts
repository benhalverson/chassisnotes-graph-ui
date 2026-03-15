import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'graphs',
    pathMatch: 'full',
  },
  {
    path: 'today',
    loadComponent: () =>
      import('./features/today/ui/today-page/today-page').then(
        (m) => m.TodayPage,
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
        data: {
          title: 'Graphs',
          description:
            'Create, duplicate, and open your 2WD carpet setup relationship maps.',
          mode: 'graphs',
        },
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
    path: 'garage',
    loadComponent: () =>
      import('./features/graphs/ui/graph-library-page/graph-library-page').then(
        (m) => m.GraphLibraryPage,
      ),
    data: {
      title: 'Garage',
      description:
        'Keep your saved graphs and starter templates within easy reach between runs.',
      mode: 'garage',
    },
  },
  {
    path: 'map',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/map/ui/map-home-page/map-home-page').then(
            (m) => m.MapHomePage,
          ),
      },
      {
        path: ':graphId',
        loadComponent: () =>
          import('./features/map/ui/map-home-page/map-home-page').then(
            (m) => m.MapHomePage,
          ),
      },
    ],
  },
  {
    path: 'diagnose',
    loadComponent: () =>
      import('./features/diagnose/ui/diagnose-page/diagnose-page').then(
        (m) => m.DiagnosePage,
      ),
  },
  {
    path: 'templates',
    redirectTo: 'garage',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'graphs',
  },
];
