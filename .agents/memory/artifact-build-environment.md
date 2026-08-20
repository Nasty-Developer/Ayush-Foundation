---
name: Artifact build environment
description: Environment requirements for validating Vite artifacts in this workspace
---

Direct Vite production builds in this workspace require both `PORT` and `BASE_PATH`; the managed artifact workflow supplies them automatically for preview.

**Why:** Running the package build from a plain shell without those variables fails before Vite can compile, even when the app itself is healthy.

**How to apply:** Use the managed workflow for runtime verification, and provide the workflow port plus the artifact base path when invoking a direct production build.