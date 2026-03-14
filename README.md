# ChassisNotes Relationships

ChassisNotes Relationships is a frontend-only graph editor for RC racers who want to map setup cause-and-effect for 2WD buggy carpet racing.

The app is designed to answer questions such as:

- Which setup changes can reduce a handling symptom?
- What experiments have already been tested?
- Which outcomes were observed under a specific track condition?
- How do entry, mid-corner, exit, bumps, and on-power phases relate to each other?

This is not a generic whiteboard. It is a constrained relationship mapper with domain-specific node types, connection rules, persistence, filtering, and sharing workflows.

## What the app does

The app lets you:

- create a tuning map from starter templates
- add `setup`, `symptom`, `outcome`, `condition`, and `experiment` nodes
- connect nodes only through valid domain rules
- edit node and edge metadata in an inspector
- autosave graphs to IndexedDB in the browser
- duplicate and delete saved graphs
- filter and highlight the graph by category, phase, confidence, and evidence type
- export graphs as JSON and PNG
- import previously exported JSON as a new saved graph copy

## How it works

### Graph library

The library is the landing view. Use it to:

- create a graph from a starter template
- open an existing graph
- duplicate a graph before trying a new setup direction
- delete a graph with confirmation

### Graph editor

The editor uses a three-panel layout:

- **Left sidebar**: node palette and filters
- **Center canvas**: ngDiagram workspace and canvas controls
- **Right sidebar**: inspector for the selected node or edge

### Persistence

All graph data is stored locally in IndexedDB through Dexie. There is no backend and no cloud sync in the MVP.

### Import/export

- **JSON export** creates a portable graph document with metadata, nodes, edges, schema version, and export timestamp.
- **JSON import** validates the file and saves it as a new graph with regenerated IDs.
- **PNG export** captures the rendered diagram for sharing.

## Typical workflow

1. Open the library.
2. Create a graph from **2WD Buggy Carpet Baseline** or **Symptom-Driven Troubleshooting Map**.
3. Add nodes from the palette.
4. Draw allowed relationships between nodes.
5. Select nodes or edges and update their details in the inspector.
6. Use filters to narrow the map to a phase, confidence level, or evidence type.
7. Export JSON for backup or PNG for sharing.

## Local development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm start
```

Open the app at `http://127.0.0.1:4200/`.

## Available scripts

### Start the app

```bash
pnpm start
```

### Run unit tests

```bash
pnpm test
```

### Run end-to-end tests

```bash
pnpm e2e
```

### Build for production

```bash
pnpm build
```

### Lint the project

```bash
pnpm lint
```

## Tech stack

- Angular
- ngDiagram
- NgRx Signals
- Dexie / IndexedDB
- Tailwind CSS
- Vitest
- Playwright

## Notes

- Graph data is stored per browser profile because persistence is local.
- Imported JSON files are treated as new saved copies rather than overwriting existing graphs.
- The app targets desktop-first usage for the MVP.
