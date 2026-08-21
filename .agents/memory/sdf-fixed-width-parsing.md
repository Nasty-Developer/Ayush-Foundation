---
name: SDF fixed-width parsing
description: Durable parsing constraints discovered in the Ayush catalogue source files.
---

The supplied SDF exports mix fixed-position fields with padded and occasionally concatenated values. Product IDs occupy a full right-aligned ten-character field; reading only the final three characters collapses distinct products. Stock numeric fields may run together, so trailing decimal fields should be extracted from the right and raw source text retained.

**Why:** The exports contain malformed/blank rows and inconsistent padding that can silently create duplicate identities or incorrect relationships if offsets are assumed from a single sample.

**How to apply:** Validate record counts, blank IDs, duplicate IDs, and representative relationships from the original files before committing an import. Preserve raw fields and use source identity/hash checks for repeat imports.