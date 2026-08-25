# AGENTS.md — AgroGenesis AI

## Architecture

### Offline-first API fallback pattern
All API modules (`fields.ts`, `telemetry.ts`, `imagery.ts`) use try/catch: try the backend first, catch and fall back to `localStore.ts`. This is the core pattern that makes the app work without Docker/PostGIS. Every API method has a dual path — **do not remove the catch blocks** even if they look like dead code.

### `localStore.ts` is the offline backbone
`frontend/src/services/localStore.ts` provides the full data layer when the backend is down: field creation with auto-generated 4-zone splits (A-D), CSV telemetry parsing with J1939 PGN decoding, zone-level aggregation, local prescription generation, and a `loadSampleData()` bootstrap. All frontend state flows through this file when offline.

### Per-user localStorage isolation requires careful key handling
getPrefixedKeys() returns ALREADY-prefixed keys (e.g., agro_user_com_agro_fields). getStore(key) and setStore(key, data) must NOT add the prefix again — callers pass pre-prefixed keys. A prior bug double-prefixed keys, causing fallback to legacy unprefixed keys and cross-user data leaks.

### Zone assignment is quadrant-based, not point-in-polygon
`parseCSVTelemetry` in `localStore.ts` assigns GPS records to zones using a simple quadrant split (lat/lon above/below field midpoint). It does NOT do proper point-in-polygon testing. This means edge cases near zone boundaries may get misassigned. The backend (PostGIS) does real spatial queries — the client-side version is an approximation.

## Build & Dev

### Backend tests require Docker
GDAL, Fiona, and Rasterio need C system libraries (GEOS, PROJ, libgdal-dev). They will not compile on native Windows. Run backend tests via: `docker compose exec backend uv run pytest`. The `pyproject.toml` has a `[tool.uv.source]` override for `pygeos` pointing to PyPI since conda-forge doesn't work with uv.

### Frontend dev server on Windows
Vite runs on port 5175 (5173 was taken). To start detached: use `powershell Start-Process` with `npm.cmd` (not `npm` — PowerShell doesn't resolve shell shims). stdout and stderr must go to different files or PowerShell fails. The run doc at `.freebuff/run.md` has the exact recipe.

### `vite build` always passes but `tsc --noEmit` catches real issues
The Vite build is lenient with types. Always run `npx tsc --noEmit` to catch actual TypeScript errors — especially type narrowing issues with the `productivity_class` union type (`"high" | "medium" | "low"` vs plain `string` from localStore).

## Known Gotchas

### `productivity_class` type mismatch
`localStore.createField()` returns `productivity_class` as `string`, but the `Field` TypeScript interface expects `"high" | "medium" | "low"`. The API layer (`fields.ts`) uses `as unknown as Field` to bridge this. If you add new zone classes, update BOTH `localStore.ts` and the `FieldZone` type in `types/index.ts`.

### Result field name contract between localStore and UI components
`parseCSVTelemetry` returns `{ records_parsed, records_imported, zones_assigned, source_format }`. `TelemetryDropZone.tsx` reads these exact property names. If you change the return shape in `localStore.ts`, update `TelemetryDropZone.tsx` and `telemetryApi.upload` simultaneously.

### ISOBUS XML parsing is backend-only
The client-side fallback in `telemetryApi.upload()` only handles CSV. XML (ISOBUS TASKDATA) files throw `"Only CSV files can be parsed offline"`. This is intentional — XML parsing requires the Python `lxml` library. Don't add client-side XML parsing unless you also want to replicate the ISO 11783 schema validation.

### Upload UI must always be visible
Upload drop zones on Telemetry and Imagery pages are rendered unconditionally (not behind a "select a field first" guard). This was a deliberate UX decision — users need to see the upload interface immediately. Field selection is only required for the actual API call, not for UI visibility.

### Mapbox <Source> crashes on field/user switch
Mapbox GL Source components with different ids cannot be reused by React without remounting. Add key={selectedFieldId} to each Source in FieldMap.tsx. Without this, switching users or fields triggers "source id changed" error.

### Sed replacements on JSX/TSX files break bracket matching
Regex s/X/Y/g on JSX files can eat < before closing > tags (e.g., /td> becomes td>). Unicode escapes in node -e do not decode Cyrillic. Reliable pattern: read file in node, use String.replace() with exact literal strings, write back. Never use sed for JSX edits.

### Dev server PID discovery on Windows
wmic process where "CommandLine like '%vite.js%'" returns running vite PIDs. Multiple may exist from prior sessions. Try each with register_preview until one answers HTTP.

### Sample data coordinates must match field polygon
The `loadSampleData()` function hardcodes GPS coordinates that fall within the KZ-Akmola-Wheat-01 polygon (lon 76.93-76.96, lat 43.25-43.27). If you change the field polygon boundaries, you must also update the CSV coordinates in the sample data, or records won't get zone-assigned.

## Design System

### Earth-tone color palette
The app uses a custom agricultural color system defined in `tailwind.config.js`: `field` (backgrounds), `canopy` (cards/surfaces), `earth` (accents like wheat gold). The `agro` palette is forest green, not the default Tailwind green. CSS variables in `index.css` (`--bg-primary`, `--bg-surface`, etc.) provide fallbacks.

### Dark mode select dropdowns need `colorScheme: "dark"`
HTML `<select>` elements ignore Tailwind dark theme colors — they render with white background by default. Add `style={{ colorScheme: "dark" }}` to every `<select>` to make them respect the dark theme. This applies to AppShell, TelemetryPage, ImageryPage, and PrescriptionsPage.


### Tailwind toggle switches need custom arbitrary translate
`translate-x-4.5` is not a valid Tailwind class — the thumb never moves. Use `translate-x-[18px]` for arbitrary values. Also, `transition-transform` without `duration-200` defaults to 0ms (no visible animation). Always pair custom translate with explicit duration.

### FAB uses id-to-handlerMap dispatch
FAB ACTIONS array uses  without string-keyed prop references. A  maps action IDs to prop callbacks. This avoids the fragile pattern where a string must exactly match a prop name.

### prescriptionsApi.generate now has 3-tier fallback
Try backend → catch, try DeepSeek API directly → catch, fall back to localStore.generateLocalPrescription(). DeepSeek calls require VITE_DEEPSEEK_API_KEY in .env.local; without it (or on 401), the local generator always works.

### FieldCreationModal English placeholders survive translation passes
 attributes use English "e.g." which is easy to miss. After any translation pass, grep for  to catch remaining English hint text.

### CRLF line endings break node String.replace()
On Windows, files have  line endings. A replacement targeting  won't match . Always account for  in replacement patterns, or read the file and inspect the actual bytes around the target string.

### Map-centric layout
The DashboardPage puts the map as the primary view (full viewport height minus 56px header + 100px field strip). Field cards are in a horizontal scroll strip at the bottom. Clicking a field opens a slide-in detail panel from the right. The FAB (Floating Action Button) replaces the old UploadHub for primary actions.

### MetricCard uses left-border accents
Cards use `border-l-[3px]` with a color class (`border-l-agro-500`, `border-l-earth-300`) instead of full background gradients. This is the pattern from real farm management apps — more data-dense and less flashy.

### Charts use earth-tone colors
Recharts tooltips use `background: "#1a3326"` (canopy-900) and `border: "1px solid #2d4a35"` (canopy-600). Grid lines use `stroke: "#2d4a35"`. Axis ticks use `fill: "#c8d5c0"` (field-100). Do not use the old slate palette.

## User Preferences

- **The app must work without any backend setup.** The user explicitly stated this should not be a demo — it should be a working product. localStorage fallback is not optional.
- **No Docker dependency for the end user.** Backend/Docker is for development only. The frontend must be self-contained.
- **UI is fully Russian; data values stay English.** Field names, crop types, soil types, scientific units (km/h, L/ha, N2O, tCO2e, NDVI), and technical standards (ISOBUS, J1939) remain in English. Only UI chrome (headings, labels, buttons, hints) is translated.
- **Design should match real farm management apps.** The user requested research-based design changes. The redesign followed patterns from John Deere Operations Center, Climate FieldView, and Trimble Ag.


### Writing files through bash on Windows is fragile
Heredocs break on backtick characters in JSX/TSX. Inline node scripts break on shell escaping of quotes. The reliable pattern: use node with String.fromCharCode(34) for double quotes and string concatenation (no template literals), save as base64, then decode separately. For surgical edits to existing files, use String.replace() in node to inject new code sections.


### Regex backslashes die even in quoted heredocs
Quoted heredocs (`<< 'EOF'`) preserve most content literally but bash still strips `\` in some Windows environments. The only reliable way to write regex like `{[\s\S]*}` is via `String.fromCharCode(92)` in a node script, not template literals or heredocs.

### Map fallback for missing Mapbox token
FieldMap.tsx now renders a clean placeholder (icon + Set VITE_MAPBOX_TOKEN) when import.meta.env.VITE_MAPBOX_TOKEN is empty, instead of letting Mapbox GL error out. The overlay controls and legend still render on top.

### WeatherWidget placement
WeatherWidget lives in the dashboard slide-in detail panel, between the zone list and the EcoFin summary. It shows mock weather data (temperature, humidity, wind, soil temp, 5-day forecast). In production, replace MOCK_WEATHER with a weather API call using the field GPS centroid.

### Settings page pattern
/settings route with SettingsPage component provides: data management (stored field count, export all as GeoJSON, clear all data with double confirmation), and about section (version, AI engine, hackathon track). The nav item uses the Settings icon from lucide-react.

### localStore API shape is snake_case — UI uses camelCase
`listFields()` returns `{ fields: Field[], total: number }`, not a plain array. `getTelemetryStats()` returns objects with `record_count`, `zone_label`, `area_ha` (snake_case). `generateLocalPrescription()` returns `{ zones: [...] }` with `application_rate`, not `zoneRates`/`rate`. The API layer (`fields.ts`, `telemetry.ts`) must bridge this naming mismatch.


### preview_click may not trigger React handlers
Accessibility-tree clicks via `preview_click(uid)` sometimes fail silently in React apps. If a click appears to do nothing, try `preview_evaluate` with `document.querySelector("button").click()` instead. This bypasses the accessibility bridge and fires the real DOM event.

### Vitest tests for localStore need fetch mock
`loadSampleData()` is async and calls `fetch('/sample-telemetry.csv')`. In vitest/jsdom without a running dev server, `fetch` hangs forever. Use `vi.stubGlobal('fetch', async () => ({ ok: true, text: async () => csvContent }))` in `beforeEach` to provide mock CSV data.

### UploadHub.tsx was deleted
UploadHub was dead code (never imported). Deleted in simplify pass. FAB + per-page upload zones replaced it.


### TS1490 "File appears to be binary" means file is corrupted
Multiple failed write operations can corrupt a file with UTF-8 replacement characters (ï¿½). TypeScript then reports `TS1490: File appears to be binary`. Fix: fully rewrite the file from scratch via a node script, do not try incremental string replacements on the corrupted file.

### GitHub secret scanner blocks pushes with realistic placeholders
`.env.example` containing realistic-looking API key formats (e.g., `sk-abc123...`) triggers GitHub's push protection secret scanner. Replace with obvious placeholders like `your-deepseek-api-key-here`. This also requires squashing the git history to remove the old secret-containing commits.
