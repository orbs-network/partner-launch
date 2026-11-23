# Extracted dependencies

These source snapshots were extracted from perpetual-hub commit `ddc363e0adc587490efc9a542cbb1e8ef1404b09` on 2026-11-23 so this project installs and builds independently.

- `partner-config`: the public chain/partner registry and its existing package exports.
- `partner-analytics`: only the read service, authorization checks, cache, query/metric definitions and formatting/CSV utilities used by this portal. The analytics application and Next.js are not dependencies.

The source behavior is unchanged. Future registry, authorization or metric updates must be reviewed and synchronized deliberately with the upstream project. This app must never import files outside its own checkout.
