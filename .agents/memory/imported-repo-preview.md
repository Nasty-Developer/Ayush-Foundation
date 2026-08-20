---
name: Imported repository preview registration
description: Imported repositories can contain valid artifact metadata without being registered in the current project.
---

When importing a repository that already contains an artifact directory, a live workflow may start before the artifact is available in the preview registry. Register the artifact through the artifact bootstrap flow, then restore the repository source into that registered directory while preserving the registered metadata.

**Why:** Copying a repository into the workspace does not necessarily update the artifact registry, which prevents the preview pane and artifact presentation from resolving the imported app.

**How to apply:** After importing, check the artifact registry and workflow status separately. If the app runs but is not registered, register the same slug before presenting it.