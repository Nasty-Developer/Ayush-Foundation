---
name: Imported artifact registration
description: Preview routing behavior for artifact projects copied in from external repositories
---

An artifact copied from an external repository can contain valid artifact metadata without being registered in the current workspace. Register it through the artifact lifecycle before relying on the shared preview route.

**Why:** A manually configured web workflow can start the dev server successfully while the shared root preview still returns a gateway error when the artifact is unknown to the preview registry.

**How to apply:** Check the registered artifact list after an import and after package/workflow changes; if the imported app is absent, register it before starting or restarting its managed web service.