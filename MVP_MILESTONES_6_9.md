
# ChassisNotes Relationships
## MVP Milestones 6–9

These milestones evolve the application from a graph editing tool into a practical racing assistant designed for real trackside use.

Milestones 1–5 delivered:
- ngDiagram graph editor
- node taxonomy
- Dexie persistence
- NgRx signal state management
- baseline relationship templates

Milestones 6–9 focus on usability, workflow, and diagnostic intelligence.

---

# Milestone 6 — Application Navigation & Editor Context

## Goal
Introduce proper application structure so the graph editor is part of a navigable system rather than an isolated tool.

## Problems Being Solved
Current structure:

Homepage → Graph Editor

Issues:
- No persistent navigation
- No orientation inside the editor
- Cannot easily switch graphs
- Future features have no clear UI location

## Required Features

### Global Navigation
Persistent navigation across the entire application.

Sections:
- Home
- Graphs
- Diagnose
- Templates

### Editor Context Header

Example:

← Back to Graphs  
2WD Buggy Carpet Baseline  
Saved 3 seconds ago

### Graph Library

Users must be able to:

- View saved graphs
- Duplicate graphs
- Open graphs
- Delete graphs
- Create new graphs

### Autosave Status

Example states:

Saved  
Saving…  
Last saved 10s ago

## Deliverables

- Global navigation layout
- Graph library view
- Editor breadcrumb/context header
- Save status indicator

---

# Milestone 7 — Mobile First UX

## Goal
Redesign the application for trackside mobile usage.

Racers will commonly use the app:

- in the pit area
- on a phone
- between runs

The interface must support fast touch interaction.

## Problems Being Solved

Current layout:

Palette | Canvas | Inspector

This structure does not translate well to mobile devices.

Problems:

- Side panels don't fit small screens
- Graph editing requires precise gestures
- Workflows are slow for touch interaction

## Mobile Navigation

Introduce bottom navigation:

Today | Diagnose | Map | Garage

### Today Screen

Shows:

- Current car
- Current track condition
- Recent setup changes
- Quick log actions

Actions:

- Log Change
- Record Symptom
- Start New Session

### Diagnose Screen

Workflow:

1. Select corner phase
   Entry / Mid / Exit / Bumps / Jumps

2. Select symptom
   Push / Lazy rotation / Rear loose / Poor forward bite

3. App suggests adjustments.

Example suggestions:

- Raise rear camber link
- Soften rear springs
- Reduce rear shock oil

### Map Screen

Displays relationship graph.

Capabilities:

- Pan
- Zoom
- Inspect nodes
- Filter nodes

Graph editing should be secondary on mobile.

### Garage Screen

Stores:

- Saved cars
- Baseline graphs
- Templates
- Past sessions

## Deliverables

- Bottom navigation
- Mobile layouts
- Touch-friendly UI
- Simplified graph interaction

---

# Milestone 8 — Structured Interaction System

## Goal

Allow racers to interact through structured racing events rather than manual graph editing.

This removes the need for diagram literacy.

## Current Model

Users currently must:

Create node → Create node → Draw edge → Edit relationship

This assumes users are comfortable with diagram tools.

## New Interaction Model

Users perform simple actions:

- Record symptom
- Log setup change
- Record result
- Select suggested adjustment

The graph is generated automatically.

## Event Types

### Record Symptom

Example:

Symptom: Lazy rotation  
Corner phase: Entry  
Confidence: Medium

Graph:

Condition → Symptom

### Log Setup Change

Example:

Component: Rear shock oil  
From: 35wt  
To: 32.5wt  
Reason: Lazy rotation

Graph:

Symptom → Experiment → Setup

### Record Result

Example:

Outcome: Better entry rotation  
Effect: Improved  
Notes: More steering on entry

Graph:

Experiment → Outcome

## Quick Log Example

Problem: Lazy rotation  
Change: Rear oil 35wt → 32.5wt  
Result: Better

Graph updates automatically.

## Deliverables

- Structured event model
- Quick logging UI
- Automatic graph generation
- Experiment nodes

---

# Milestone 9 — Diagnostic Intelligence

## Goal

Transform the relationship graph into a diagnostic engine.

The system should help racers answer:

"What should I try next?"

## Symptom-Based Recommendations

Example:

Symptom: Lazy rotation  
Surface: High grip carpet  
Corner phase: Entry

Suggestions:

- Raise rear camber link
- Soften rear springs
- Reduce rear shock oil

## Confidence Scoring

Relationships gain confidence from repeated successful tests.

Example:

Raise rear camber link → More steering on entry  
Confidence: High

## Graph Highlighting

Selecting a symptom highlights:

- Relevant setup changes
- Related outcomes
- Past experiments

## Experiment History

Example:

Rear oil 35 → 32.5  
Result: Improved

Rear camber link +1mm  
Result: Strong improvement

## Deliverables

- Suggestion engine
- Relationship confidence scoring
- Symptom-based graph filtering
- Experiment history

---

# Long Term Vision

After Milestone 9 the application becomes a tuning knowledge system.

Capabilities:

- Diagnose handling issues
- Track experiments
- Learn from past tuning decisions
- Build reusable setup knowledge

The relationship graph becomes the engine behind the system rather than the only interface.
