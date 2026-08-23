---
name: Ayush catalogue data
description: Source-data constraints and customer-facing availability rules for the Ayush Foundation catalogue.
---

Stock SDF rows must remain unmapped unless the source files expose a proven shared product identifier. Customer availability must therefore be presented as unknown rather than in-stock or out-of-stock when linkage is absent; prices may only come directly from valid catalogue or stock fields.

**Why:** Guessing a stock-to-product relationship would create false inventory, pricing, and availability claims.

**How to apply:** Preserve imported source values, keep unresolved rows auditable, and only enable price-dependent cart actions when the API returns a real price.