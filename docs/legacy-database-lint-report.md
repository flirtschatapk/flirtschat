# Legacy Database Lint Report

Generated: 2026-08-02

## Scope and safety

This report is read-only. No legacy function, PostGIS object, table, policy, extension, or data row was changed.

Reference status was determined by searching `app/`, `components/`, `lib/`, `scripts/`, `data/`, and the project-owned Supabase files for the function names below. No direct calls were found. This does not rule out indirect calls from database triggers, scheduled jobs, external clients, or SQL not stored in this repository; those dependencies should be audited before any repair.

## Findings

| Schema | Function | Severity | Exact lint error | Referenced by current Flirtschat source? | Recommended safe fix |
|---|---|---:|---|---|---|
| `public` | `st_findextent(text, text)` | Error | `record "myrec" is not assigned yet` — SQLSTATE `55000`. Detail: `The tuple structure of a not-yet-assigned record is indeterminate.` Context: SQL expression `myrec.extent`; statement line 9, `RETURN`. | No direct reference found. It is a PostGIS compatibility function and could be called indirectly by external SQL. | Do not edit it manually. Confirm the installed PostGIS extension versions and run the vendor-supported PostGIS extension upgrade/repair in a staging clone first. Validate both overloads and geospatial queries before a maintenance-window rollout. |
| `public` | `st_findextent(text, text, text)` | Error | `record "myrec" is not assigned yet` — SQLSTATE `55000`. Detail: `The tuple structure of a not-yet-assigned record is indeterminate.` Context: SQL expression `myrec.extent`; statement line 9, `RETURN`. | No direct reference found. It is a PostGIS compatibility function and could be called indirectly by external SQL. | Same as the two-argument overload: repair through the PostGIS extension lifecycle, never by replacing the extension-owned function ad hoc. Test on a restored/staging database first. |
| `public` | `populate_geometry_columns(oid, boolean)` / `populate_geometry_columns(boolean)` | Error | `record "gc" is not assigned yet` — SQLSTATE `55000`. Detail: `The tuple structure of a not-yet-assigned record is indeterminate.` Context: PL/pgSQL assignment `gsrid := gc.srid`; statement line 55. The linter output did not identify which overload emitted the finding. | No direct reference found. These are PostGIS maintenance functions. | Verify the PostGIS extension catalog and version consistency. Reproduce with `plpgsql_check` in staging, then use the supported PostGIS extension update/repair path. Do not patch either overload directly in production. |
| `public` | `postgis_full_version()` | Error | `function public.postgis_gdal_version() does not exist` — SQLSTATE `42883`. Query: `SELECT public.postgis_gdal_version()`. Hint: `No function matches the given name and argument types. You might need to add explicit type casts.` | No direct reference found. It is normally used for PostGIS diagnostics. | Check whether raster/GDAL support is intentionally installed. Align `postgis`, `postgis_raster`, and related extension versions in staging. If raster is required, install/upgrade it using Supabase-supported extension management; otherwise update the diagnostic extension state rather than hand-editing this function. |
| `public` | `lockrow(...)` overload family | Error | `relation "authorization_table" does not exist` — SQLSTATE `42P01`. Query: `DELETE FROM authorization_table WHERE expires < now()`; statement line 18, `EXECUTE`. Available overloads accept 3, 4, or 5 text/timestamp arguments; the linter did not identify the emitting overload. | No direct reference found. | First inspect `pg_depend`, triggers, scheduled jobs, and external callers. If still required, repair the function in a new reviewed migration so it creates/qualifies the intended temporary authorization table within its own transaction. If obsolete, deprecate it only after a dependency and traffic audit. Do not create a permanent table solely to silence lint. |
| `public` | `addauth(text)` | Error | `relation "temp_lock_have_table" does not exist` — SQLSTATE `42P01`. Query: `INSERT INTO temp_lock_have_table VALUES (getTransactionID(), lockid)`; statement line 24. | No direct reference found. | Audit dependencies together with the `lockrow` family. If active, make its temporary-table lifecycle explicit and schema-safe in staging, then deploy a reviewed migration. Do not add a permanent compatibility table without confirming the function's intended locking semantics. |
| `public` | `claim_streak_badge(p_milestone integer)` | Error | `operator does not exist: boolean = integer` — SQLSTATE `42883`. Query: `v_already = 0`; statement line 36, `IF`. Hint: `No operator matches the given name and argument types. You might need to add explicit type casts.` | No direct reference found. | Confirm `v_already` is intended to be boolean. In a separate tested migration, replace the integer comparison with boolean logic such as `NOT v_already` or `v_already IS FALSE`. Add tests for already-claimed, eligible, and ineligible paths before deployment. |
| `public` | `block_match_user(p_match_id uuid)` | Error | `relation "user_blocks" does not exist` — SQLSTATE `42P01`. Query begins `INSERT INTO user_blocks (blocker_id, blocked_id) ...`; statement line 12. | No direct reference found. | Determine the canonical existing block table and compare its columns/RLS with the function contract. Update the function to a fully qualified, confirmed table only in a separate migration with authorization tests. Do not create `user_blocks` merely to satisfy the function. |
| `public` | `get_connects_remaining(p_user_id uuid)` | Error | `relation "public.subscriptions" does not exist` — SQLSTATE `42P01`. Query checks `public.subscriptions` for an active subscription; statement line 8. | No direct reference found. | Identify the actual premium/subscription source of truth. Update the function against that table or a stable compatibility view in staging, with tests for active, expired, cancelled, and missing subscriptions. Avoid creating an empty `subscriptions` table that would silently change entitlement behavior. |
| `public` | `use_one_connect(p_user_id uuid)` | Error | `relation "public.subscriptions" does not exist` — SQLSTATE `42P01`. Query checks `public.subscriptions` for an active subscription; statement line 9. | No direct reference found. | Repair together with `get_connects_remaining` after selecting the canonical entitlement table. Test atomic decrementing, premium bypass, daily reset, concurrency, and RLS before deployment. |
| `public` | `submit_verification(p_document_url text)` | Error | `column reference "user_id" is ambiguous` — SQLSTATE `42702`. Detail: `It could refer to either a PL/pgSQL variable or a table column.` The failing statement is the `INSERT ... ON CONFLICT (user_id) DO UPDATE` against `public.verifications`; statement line 12. | No direct reference found. | In a separate migration, qualify the intended column or use the named unique constraint in `ON CONFLICT ON CONSTRAINT ...`. Verify the constraint exists, then test insert, resubmission/update, authorization, and concurrent requests in staging. |

## Recommended remediation order

1. Inventory indirect dependencies using `pg_depend`, triggers, cron/scheduled jobs, API logs, and external clients.
2. Repair application-owned functions in staging: `claim_streak_badge`, `block_match_user`, entitlement functions, and `submit_verification`.
3. Treat `lockrow` and `addauth` as a coupled legacy subsystem and confirm whether they are obsolete before changing them.
4. Handle all PostGIS findings through a supported extension-version repair or upgrade, not direct function replacement.
5. Put every approved repair in a separate migration with a schema-only backup, dry-run, regression tests, and explicit production approval.

## Explicitly excluded

- No fixes were applied.
- No functions were replaced or dropped.
- No missing compatibility tables were created.
- No PostGIS extensions were installed, removed, or upgraded.
- No existing Flirtschat data was updated or deleted.
