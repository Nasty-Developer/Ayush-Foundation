---
name: Artifact preview routing
description: Preview routing checks for imported Vite artifacts and duplicate workflows.
---

An artifact-managed preview must use the exact workspace package name in its development and production commands, and its declared local port must match the injected PORT. Keep one artifact-owned workflow instead of a second ad-hoc workflow for the same app.

**Why:** Imported metadata can retain a former package slug or stale port, while a duplicate workflow may appear healthy but bypass the artifact routing used by the preview pane.

**How to apply:** When a preview is blank or inconsistent, inspect `.replit-artifact/artifact.toml`, correct it through the validated replacement flow, remove duplicate workflows, restart the managed workflow, and screenshot the preview.