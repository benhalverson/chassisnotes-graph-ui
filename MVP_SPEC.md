# MVP_SPEC.md

> This file defines the product and MVP requirements for ChassisNotes Relationships. It complements the repository root `AGENTS.md`, which should remain the primary agent instruction file.

## Project

**Product name:** ChassisNotes Relationships  
**Type:** Frontend-only MVP  
**Goal:** Build a visual RC setup relationship mapper for 2WD buggy carpet racing using **Angular**, **ngDiagram**, **NgRx Signals**, **Dexie (IndexedDB)**, and **Tailwind CSS**.

This app is not a generic whiteboard. It is a constrained, domain-specific graph editor for mapping relationships between:

- setup choices
- track conditions
- handling symptoms
- outcomes
- experiments / test changes

The MVP must feel like a real product for racers, not a demo of a diagram library.

---

## Core product idea

Users create and edit a graph that answers questions like:

- What setup areas affect this symptom?
- Which changes have I already tested?
- What did each change improve or worsen?
- Which setup levers are most relevant for high-grip carpet 2WD buggy?

The graph is the main UI and the main data model.

---

## Hard constraints

Agents working on this project must follow these constraints:

1. **Frontend-only MVP**
   - No backend
   - No auth
   - No cloud sync
   - No localStorage for primary persistence

2. **Persistence must use IndexedDB via Dexie**
   - Dexie is the system of record on-device
   - localStorage may only be used for trivial non-critical UI preferences if ever needed, but should be avoided unless explicitly approved

3. **State management must use NgRx Signals**
   - Use signal-based stores for app state
   - Keep diagram/document state normalized where practical
   - Avoid introducing NgRx Store + reducers unless there is a compelling reason

4. **Styling must use Tailwind CSS**
   - Build a clean, dense, technical UI
   - Avoid heavy component libraries unless absolutely necessary

5. **ngDiagram is the core canvas engine**
   - The implementation must lean into custom nodes, labeled edges, groups, validation, and domain constraints
   - Do not build a generic freeform canvas first

---

## MVP scope

### In scope

- create a graph from domain-specific node types
- connect nodes using constrained relationship rules
- edit node and edge metadata in a right-side inspector
- save graphs to IndexedDB
- load existing graphs from IndexedDB
- duplicate and delete graphs
- export graph to PNG
- export/import graph JSON
- starter templates for 2WD buggy carpet tuning
- filter/highlight by driving phase or topic
- support experiment tracking inside the graph

### Out of scope

- multiplayer collaboration
- user accounts
- cloud sync
- AI recommendations
- telemetry ingestion
- tire database from external APIs
- setup sheet OCR / import
- mobile-first optimization beyond basic responsiveness
- support for every RC class at launch
- freeform arbitrary node categories without rules

---

## First release target

The MVP should target this exact use case first:

> A racer running a **2WD buggy on carpet** wants to map setup cause/effect relationships for symptoms such as entry push, lazy rotation, exit instability, and bump handling issues.

The first release must be opinionated around this workflow instead of trying to be universal.

---

## Primary user stories

1. As a racer, I can create a new relationship map from a starter template.
2. As a racer, I can add setup, symptom, outcome, condition, and experiment nodes from a palette.
3. As a racer, I can connect only valid node types using domain rules.
4. As a racer, I can label a relationship with meaning such as `can increase`, `can reduce`, `tested`, or `observed`.
5. As a racer, I can attach notes and confidence to nodes and edges.
6. As a racer, I can save and reopen my graph later from IndexedDB.
7. As a racer, I can export my graph as an image to share.
8. As a racer, I can filter the graph by entry / mid / exit / bumps / jumps.
9. As a racer, I can log experiments I tried and record the observed result.
10. As a racer, I can duplicate a graph before testing a new setup direction.

---

## Core domain model

The app should model the following first-class entities.

### Graph document

A saved tuning map.

Suggested fields:

- `id`
- `name`
- `slug`
- `chassis`
- `classType`
- `surface`
- `notes`
- `createdAt`
- `updatedAt`
- `templateId?`
- `version`

### Node categories

Keep categories explicit and finite in the MVP.

#### 1. Setup
Examples:
- front spring
- rear spring
- front oil
- rear oil
- piston
- ride height
- rear toe
- camber
- anti-squat
- front/rear roll center
- tire
- insert
- diff/slipper setting

#### 2. Symptom
Examples:
- entry push
- mid-corner push
- lazy rotation
- exit oversteer
- unstable braking
- poor bump handling
- bad landings
- nervous straight-line behavior

#### 3. Outcome
Examples:
- more steering
- more stability
- better rear grip
- better forward bite
- better compliance
- more aggressive response
- more consistency

#### 4. Condition
Examples:
- high grip carpet
- low grip carpet
- bumpy section
- long sweeper
- tight infield
- cold tires
- late-run balance

#### 5. Experiment
Examples:
- changed rear oil 35wt -> 32.5wt
- moved rear camber link up 1mm
- swapped to softer insert
- lowered rear ride height by 0.5mm

### Node fields

Suggested fields:

- `id`
- `graphId`
- `type` (`setup | symptom | outcome | condition | experiment | group`)
- `subtype`
- `title`
- `description`
- `tags[]`
- `phaseTags[]` (`entry | mid | exit | bumps | jumps | braking | on-power`)
- `confidence` (`low | medium | high`)
- `position`
- `size?`
- `data` (typed subtype-specific payload)
- `createdAt`
- `updatedAt`

### Edge fields

Suggested fields:

- `id`
- `graphId`
- `sourceNodeId`
- `targetNodeId`
- `relationshipType`
- `label`
- `description`
- `confidence` (`low | medium | high`)
- `phaseTags[]`
- `evidenceType?` (`theory | observed | repeated-test`)
- `createdAt`
- `updatedAt`

---

## Allowed relationship rules

Do **not** allow arbitrary graph connections.

### Allowed edges

- `condition -> setup`
- `condition -> symptom`
- `setup -> symptom`
- `setup -> outcome`
- `symptom -> experiment`
- `experiment -> outcome`
- `experiment -> symptom`
- `outcome -> symptom` only if explicitly modeled as a tradeoff and clearly labeled

### Disallowed examples

- `symptom -> symptom`
- `setup -> setup` in MVP
- `condition -> experiment` unless a clear user need emerges
- `experiment -> condition`

### Relationship label vocabulary

Start with a fixed set:

- `can increase`
- `can reduce`
- `influences`
- `tested`
- `observed`
- `tradeoff`
- `depends on`

Agents should prefer controlled enums first, not arbitrary user-created relationship taxonomies.

---

## ngDiagram implementation expectations

The graph UI must use ngDiagram in a domain-specific way.

### Required ngDiagram features to use

- custom node templates
- custom edge labeling
- palette / node creation affordance
- inspector-driven editing
- graph persistence mapping
- selection handling
- constrained connection validation
- optional grouping for graph organization

### Node presentation

Each node should be visually compact and category-specific.

#### Setup node
- title
- subtype chip
- important numeric/value summary
- confidence badge if present

#### Symptom node
- strong title
- phase chips (`entry`, `mid`, `exit`, etc.)
- severity or priority optional

#### Outcome node
- concise outcome wording
- good/bad/tradeoff visual emphasis

#### Condition node
- contextual chip style
- should read like a filter or scenario

#### Experiment node
- before/after summary
- observed result summary
- date optional

### Edge presentation

Edges must show label text when selected and optionally always-on when zoom permits.
Use visual distinctions for:
- theory vs observed
- low/medium/high confidence
- highlighted filter matches

---

## UI layout requirements

### App shell

Three-column desktop-first layout:

1. **Left sidebar**
   - graph list
   - create graph button
   - starter templates
   - node palette
   - filters

2. **Center canvas**
   - ngDiagram workspace
   - zoom / fit / export actions
   - graph title bar

3. **Right sidebar**
   - inspector for selected node/edge
   - editable metadata
   - notes
   - tags
   - confidence

### Top-level views

#### 1. Graph library view
- list saved graphs
- create / duplicate / delete
- quick metadata summary

#### 2. Graph editor view
- main workspace
- palette + canvas + inspector

#### 3. Import/export dialog(s)
- JSON import
- JSON export
- PNG export

No extra routing complexity unless it materially improves clarity.

---

## Tailwind styling direction

The UI should feel like a modern technical product.

### Design goals

- dark-mode friendly
- dense but readable
- card-based sidebars
- restrained color use by category
- clean borders and subtle depth
- sharp focus states
- keyboard-friendly controls

### Avoid

- playful consumer-app styling
- oversized spacing everywhere
- generic dashboard look with random charts
- excessive gradients
- visually noisy node cards

### Tailwind guidance

- favor utility-first styling over custom CSS files
- centralize repeated patterns in reusable component classes only when it improves maintainability
- keep node category styling consistent and systematic

---

## State management architecture

Use **NgRx Signals** for application state.

Recommended store split:

### `graphsStore`
Responsibilities:
- load graph list from Dexie
- create graph
- update graph metadata
- duplicate graph
- delete graph
- set active graph id

### `diagramStore`
Responsibilities:
- active graph nodes and edges in editable form
- current selection
- filter state
- derived highlighted sets
- graph dirty state
- diagram commands like add/update/remove node/edge

### `uiStore`
Responsibilities:
- sidebar open/close state
- current inspector tab
- transient dialogs
- zoom/fit preferences if needed

### Signal principles

- prefer computed signals for derived state
- avoid duplicating the same graph data in multiple stores
- isolate persistence side effects behind repository/service boundaries
- keep diagram mutations explicit and testable

---

## Persistence architecture

Persistence must use Dexie with a simple repository layer.

### Dexie database name

Suggested: `chassisnotes_relationships`

### Dexie tables

#### `graphs`
Keyed by graph id.

Fields:
- `id`
- `name`
- `slug`
- `chassis`
- `classType`
- `surface`
- `notes`
- `templateId`
- `createdAt`
- `updatedAt`
- `version`

Suggested indexes:
- `[updatedAt]`
- `[surface+classType]`
- `[chassis+classType]`

#### `nodes`
Fields:
- `id`
- `graphId`
- `type`
- `subtype`
- `title`
- `description`
- `phaseTags`
- `confidence`
- `position`
- `data`
- `createdAt`
- `updatedAt`

Suggested indexes:
- `graphId`
- `[graphId+type]`
- `[graphId+subtype]`

#### `edges`
Fields:
- `id`
- `graphId`
- `sourceNodeId`
- `targetNodeId`
- `relationshipType`
- `label`
- `confidence`
- `phaseTags`
- `evidenceType`
- `createdAt`
- `updatedAt`

Suggested indexes:
- `graphId`
- `[graphId+relationshipType]`
- `[graphId+sourceNodeId]`
- `[graphId+targetNodeId]`

#### `templates`
Optional but recommended.

Fields:
- `id`
- `name`
- `description`
- `graphData`
- `createdAt`
- `updatedAt`

### Persistence rules

- autosave edits with a small debounce
- avoid writing on every tiny drag event if performance suffers
- graph load should reconstruct diagram state from Dexie records
- imports should validate and migrate versioned schema when needed

---

## JSON import/export requirements

### Export
Export a single graph as structured JSON containing:
- graph metadata
- nodes
- edges
- schema version
- export timestamp

### Import
On import:
- validate required fields
- reject malformed edge references
- repair or reject duplicate ids
- migrate old schema versions if practical

The exported JSON format should be stable enough to become the future backend payload format.

---

## Filtering and highlighting

The MVP must include focused filtering, not just global search.

### Required filters

- by node category
- by phase tag (`entry`, `mid`, `exit`, `bumps`, `jumps`, `braking`, `on-power`)
- by confidence
- by evidence type

### Required behavior

- matching nodes/edges highlight strongly
- non-matching content can dim but should remain understandable
- clicking a node should optionally highlight its one-hop neighborhood

---

## Templates

Ship with at least 2 starter templates.

### Template 1
**2WD Buggy Carpet Baseline**

Should include:
- common setup areas
- common symptoms
- a few example condition nodes
- a few example relationship edges

### Template 2
**Symptom-Driven Troubleshooting Map**

Should include:
- more symptom nodes
- example experiment nodes
- example observed outcomes

Templates are important because a blank diagram is a weak first-run experience.

---

## Data validation requirements

Agents must implement validation at both UI and repository/import levels.

### Validate
- allowed node types
- allowed edge directions
- required titles
- required graph id references
- valid phase tags
- valid confidence values
- unique ids

### Prevent
- dangling edges
- self-referential edges unless explicitly allowed later
- unknown relationship types
- empty graph saves caused by accidental reset without confirmation

---

## Accessibility and usability

Minimum requirements:

- keyboard reachable sidebars and controls
- visible focus states
- sufficient contrast in dark and light themes
- inspector forms with labels
- destructive actions require confirmation

The canvas does not need to be fully keyboard-editable in MVP, but the surrounding product UI should still be accessible.

---

## Testing expectations

At minimum, cover:

### Unit tests
- graph creation logic
- duplicate graph logic
- Dexie repository CRUD
- validation rules for edges
- import/export serialization
- signal store mutations and derived state

### Component/integration tests
- graph library view basic actions
- inspector updates selected node metadata
- filters update visible/highlighted state

### Manual QA scenarios
- create graph from template
- add nodes and valid edges
- reject invalid edges
- refresh browser and confirm IndexedDB persistence
- duplicate graph and verify new ids
- export/import graph successfully

---

## Suggested folder structure

This is a recommendation, not a rigid requirement.

```text
src/
  app/
    core/
      db/
        app-db.ts
        repositories/
      models/
      utils/
    features/
      graphs/
        data-access/
        state/
        ui/
      diagram/
        data-access/
        state/
        ui/
        ngdiagram/
          nodes/
          edges/
          adapters/
          validators/
      templates/
      import-export/
    shared/
      ui/
      forms/
      icons/
```

Keep domain logic out of dumb presentational components.

---

## Implementation order

Agents should build in this order:

### Milestone 1 — foundation
- Angular app shell
- Tailwind setup
- Dexie setup
- NgRx Signals stores scaffold
- graph library screen shell

### Milestone 2 — persistence and graph documents
- create/list/delete/duplicate graph documents
- IndexedDB persistence working
- template seeding

### Milestone 3 — ngDiagram editor core
- render active graph on canvas
- add basic custom node types
- selection + inspector wiring
- add/edit/delete nodes

### Milestone 4 — relationships and validation
- edge creation
- valid connection enforcement
- labeled relationships
- filter/highlight behavior

### Milestone 5 — import/export and polish
- JSON export/import
- PNG export
- autosave debounce
- empty states
- keyboard/accessibility polish

Do not jump into polish before the graph model and persistence are stable.

---

## Acceptance criteria for MVP

The MVP is complete when all of the following are true:

1. Users can create a graph from a starter template.
2. Users can add at least the 5 core node categories.
3. Users can connect nodes only through valid relationship rules.
4. Users can edit node and edge metadata through an inspector.
5. Graphs persist to IndexedDB and survive refresh/reopen.
6. Users can duplicate and delete graphs safely.
7. Users can export PNG and JSON.
8. Users can import a previously exported JSON graph.
9. Users can filter/highlight graph content by phase or confidence.
10. The UI looks intentional and product-quality with Tailwind.

---

## Non-goals for coding agents

Do not spend time on these during MVP unless explicitly requested:

- backend APIs
- authentication
- monetization plumbing
- chat assistants inside the app
- collaborative cursors
- analytics dashboards
- race lap timing integration
- external package sprawl for basic UI controls
- over-abstracted architecture before core UX is proven

---

## Product quality bar

This MVP should feel like:
- a specialized engineering tool for RC racers
- visually clear and domain-aware
- structured and reliable
- easy to expand later into cloud sync and team sharing

It should **not** feel like:
- a generic flowchart demo
- a toy canvas
- a CRUD app with a diagram pasted into the middle

---

## Future expansion after MVP

These are explicitly deferred:

- cloud sync / backend API
- account system
- public/private graph sharing
- AI suggestion engine
- graph comparison across race days
- setup history timeline
- support for 4WD buggy / touring / F1 / oval
- evidence weighting from repeated experiments
- attachment support for photos and track notes

Design current models so these can be added later without breaking the core graph schema.

---

## Final instruction to agents

When making implementation decisions, optimize for:

1. **graph clarity**
2. **data integrity**
3. **fast iteration for a solo developer**
4. **clean Angular architecture**
5. **future expandability without premature backend complexity**

If there is a tradeoff, prefer a more constrained and polished MVP over a more flexible but messier system.
