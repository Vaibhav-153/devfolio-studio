# Puck integration decision — Phase 3

We considered Puck for the React visual editor and checked its current public documentation. The core package provides a component-based drag-and-drop canvas, nested slots, inspector fields, and a `Render` component that can share the same configuration as the editor. Its MIT-licensed React component model is compatible with the general Devfolio Studio approach.

However, the Release 1 **B1 Responsive Freeform Builder** requires bounds-constrained absolute positioning inside freeform sections, selection/resize handles, grid snapping, independent responsive overrides, and content bindings to portfolio records. These capabilities still require custom application logic even with Puck.

### Current outcome

- Retain the Phase 2 custom React editor and improve its schema and element operations during Phase 3.
- Keep a shared approved-component renderer for editor previews and public portfolio output.
- Do **not** introduce an untested Puck dependency into the production application.
- Set up a follow-on, isolated Puck prototype after npm access is available. Compare migration cost and reliability before committing to a library transition.

### Required Puck validation before adopting

1. Install `@puckeditor/core` using a connected npm registry and pin a tested version.
2. Create nested Hero, ProjectGrid, Text and Freeform components with the `slot` field where appropriate.
3. Verify that public project/profile records bind without copying content into every visual block.
4. Implement and test freeform element position/resize controls, bounded placement and responsive overrides.
5. Confirm existing `schemaVersion:1` documents can migrate losslessly, including hidden/locked layers and images.
6. Run a real Next.js production build and cross-browser E2E tests.

Useful official references:
- https://puckeditor.com/docs/api-reference/fields/slot
- https://puckeditor.com/docs/extending-puck/composition
- https://github.com/puckeditor/puck

### Environment limitation

`npm view @puckeditor/core version` failed with `EAI_AGAIN` while resolving `registry.npmjs.org`. Puck was therefore neither installed nor tested here. No claim of completed Puck integration is made.
