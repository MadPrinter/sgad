# Screenshot / Inspection Notes

This repository keeps the experiment dependency-free, so visual inspection evidence is represented as structured notes.

## Desktop

- First viewport shows product identity, operational state, rollout confidence, and KPI strip.
- Sidebar remains visible.
- Agent table and governance panel appear side by side.

## Mobile

- Layout stacks into one column.
- Navigation becomes a grid.
- Topbar actions stack vertically.
- KPI cards and timeline do not overlap.

## Accessibility

- `aria-label` exists for navigation, search, report action, design review, filter, and timeline.
- `:focus-visible` is defined for interactive controls.
- Status color is paired with visible text labels.
