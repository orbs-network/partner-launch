# Orbs Partner Portal

Spot and Perps requests are stored in PostgreSQL. Apply `migrations/001_setup_requests.sql` through `migrations/004_wallet_sessions.sql`, and configure the server-only `PORTAL_DATABASE_URL` and comma-separated `PORTAL_ADMIN_WALLETS` in the deployment environment. The session tables in migration 004 are required for admin and wallet sign-in. Its final statement also removes previously stored contact details from request records; review that data change before applying it to an existing database. These settings must never use the `VITE_` prefix. Existing browser-local requests are not imported or assigned to a wallet automatically.

Run `node --experimental-strip-types --env-file=.env.local scripts/migrate-partner-ids.mjs` to populate the shared `partner_id` column and remove the old `app_id` column. Spot IDs use the existing configuration-key generator; Perps IDs retain their original values. Partner IDs are unique case-insensitively across both products, including cancelled requests. If existing requests have duplicate IDs, the migration rolls back and the conflicts must be resolved first. Deploy compatible server code alongside this migration: older deployments still require `app_id`.

Open `/admin` with an allowlisted wallet connected to review and approve delivered requests. The earlier `?admin=true` link also works. Use Refresh to reload the request list. This temporary address-only admin mode does not authenticate wallet ownership: anyone who knows an allowlisted address can impersonate it and read or approve requests through the API. Approval is stored in PostgreSQL; trading activation is checked separately.

The Portal sends onboarding story events to `https://bi.orbs.network/putes/partner-launch`, using an in-memory session ID. Spot configuration matches and enabled Perps lanes are checked separately from team approval. A Spot key match does not prove ownership or approval. Signatures and proofs are excluded from analytics.

Perps checks the generated or entered Partner ID against the partner registry before advancing from the name step and checks again before sending a new request. Any matching lane, including a disabled lane, counts as an existing ID. An unavailable registry blocks the check with a retry message. This lookup does not reserve an ID or check other pending requests, so availability can change between checks.

This Partner Portal workspace helps creators prepare a branded DEX or integrate dPERPS into an existing app, bot or service. It uses React/Vite, RainbowKit and wagmi, viem, TanStack Query and a locally persisted Zustand draft.

Welcome also offers **Set up Spot**, with the description **Bring advanced spot trading to your app.** The flow is App name → DEX URL (optional) → Fees wallet → Review and policy acceptance. There is no chain-selection step or requested chain scope. App names use the shared 3–80 character validation: letters only, with a single space or hyphen between letter groups (no digits, punctuation, leading/trailing separators or repeated separators), and the fees wallet must be a valid non-zero EVM address. Spot has no deposit, wallet signature or fee-share setting. Its separate optional DEX URL step accepts an absolute HTTP/HTTPS website URL (up to 2,048 characters, without credentials or whitespace), or can be left blank. It is informational and grants no website permissions. Supplied URLs remain in the draft, Review, completion and Pending requests, and are sent in the Telegram notification; blank URLs are omitted from completion/messages. URL edits clear policy acceptance, and invalid nonblank URLs show inline errors only after attempting to continue. Review uses the portal’s existing Terms of Use/Privacy Policy links and current policy version; editing details clears acceptance.

Spot’s Fees wallet field includes the same **Use my wallet** action as Perps, sharing the button and explicit connection helper. An already connected wallet fills only on click; otherwise the action opens the wallet picker. When the entered address matches the connected wallet (ignoring casing/outer whitespace), the action becomes invisible while preserving its space so the label/input row stays fixed. It is disabled, excluded from keyboard focus and hidden from assistive technology until edits, wallet changes or disconnect make it relevant again. Cancellation preserves manual input and permits retry; late or stale connection results cannot overwrite a changed setup. Navigation stays locked while the field connection is pending. Filling clears policy acceptance and never signs, logs in, switches chains or transfers funds.

After saving, **Supported Spot chains** directly introduces all 22 networks with their names and local logos, without a repeated availability sentence, using the numeric entries of [Spot config.json](https://github.com/orbs-network/spot/blob/3b0fba9b91c696033a9d61b965ec4ed179b09c31/config.json). The `*` shared-defaults entry is excluded. The pinned display catalog is `src/config/spot-chains.ts`, separate from perpetual lanes and wallet networks; update it against the upstream numeric keys when support changes. Asset sources are recorded in `public/chain-logos/README.md`. The list is informational and does not activate the saved app or configure fee routing. It requires no runtime config request or loading stage.

Only the final Spot Review step and the saved summary link to the official [Spot integration docs](https://docs.orbs.com/advanced-orders/shared), using `SPOT_DOCS_URL` from `src/config/links.ts`. App name, DEX URL and Fees wallet omit this link. Documentation opens in a separate tab without changing the draft.

After saving, Spot shows **Approval pending** in the same ActivationStatusCard used by Perps, with its pending spinner, reduced-motion override and accessible description/status announcement. It replaces the old inline pending sentence. The Spot card checks for a matching suggested Partner ID in the public configuration; this is not an approval receipt or proof of ownership. Delivery is not approval or activation. The supporting copy states that partner approval can take up to 48 hours, alongside the existing integration-while-waiting guidance. Delivered Spot records repeat that window on a separate line in the Pending requests description; local unsent records and Perps do not. This user-provided estimate adds no countdown or automatic approval.

Spot completion offers a copyable integration prompt and access to Your setups. The owner signs in with their wallet to view submitted requests. Create new starts a blank Spot setup without changing an independent Perps draft.

Confirming **Start over** in an unfinished Spot setup clears that Spot draft and returns to the main Set up perps/Set up Spot choices, removing `?setup=spot`. The independent Perps details and submitted requests are preserved; only its navigation returns to Welcome. Keep my progress/Escape preserve the current step and return focus. Spot completion’s Create new still starts a blank Spot setup. Perps uses `?setup=perps` while the wizard is active; the saved draft and current step remain in local storage. Back to Welcome, Start over, and successful submission remove the route marker without putting setup details in the URL. A direct Perps link opens the saved unfinished step or a new App name step.

Spot submits through the same-origin `POST /api/spot-submit` server handler. Submission requires a connected owner wallet and current policy acceptance, stores the request in PostgreSQL and notifies the team in Telegram. Completion follows successful storage and delivery. The owner address is unverified at submission. Drafts remain browser-local until submitted. Delivery does not itself establish approval, activation or payout authority.

**My setups** is available at `/setups` and shows a dashboard of pending and approved Spot and Perps requests for the connected submitting wallet without a signature. Its analytics section currently shows empty placeholders, not trading data. Wallet connection does not authenticate the caller to the server: anyone who knows an address can request that wallet's displayed setup summaries. Previously saved additional app owner wallets remain request details and do not associate those wallets with the request; the setup form no longer collects them. Spot cancellation requires a separate, request-bound wallet signature; administration and workspace access retain their own authentication. Approval does not establish trading activation. Previously saved browser-local summaries remain untouched and are not automatically assigned to a wallet.

Active Perps steps and Perps completion show **Set up perps** above their headings, matching Spot’s **Set up Spot** label. Both use the shared SetupLabel with a decorative product icon, consistent type/color/spacing and no additional label on Welcome.

The shared header uses the official Orbs logo without a subtitle, black in light mode and white in dark mode. Product copy elsewhere uses **dPERPS**. Perps uses one app setup route, with API integration offered after submission; technical settings use accessible native disclosures or optional settings. Inputs are 48px tall (percentage inputs 44px), with border feedback instead of an outer focus outline. Existing shared controls, theme tokens, keyboard focus, reduced motion and System/Light/Dark appearance behavior remain in use.

Filled primary, secondary and destructive buttons are borderless, including navbar controls. Outlined actions retain their border; keyboard focus keeps the shared visible outline.

Creator/API and Spot footers reuse one `StartOverButton` built on the shared Button primitive: a 44px touch target, equal 12px horizontal padding, 11px text and the same hover/focus/disabled states at desktop and mobile widths. The confirmation dialog keeps its separate destructive confirmation action and returns focus to the shared trigger on cancellation.

Page/session/analytics/chart/announcement-image loading uses accessible skeletons with reduced-motion support. Lazy Spot loading retains the normal header and a card-shaped skeleton instead of visible loading text. Skeletons disappear as soon as the actual work completes; no synthetic step or minimum loading duration is added. Wallet signing, connection and submission actions retain accurate progress feedback.

Components describe the interface; feature-local hooks handle navigation and wallet work. Non-React signing, validation, estimates, storage and migration stay in focused modules. Prefer Tailwind utilities and shared control variants; custom CSS is limited to theme tokens, base defaults and motion.

Typography uses the same Montserrat font files as [orbs.com](https://www.orbs.com/),
self-hosted in `public/fonts/montserrat/` with their SIL Open Font License.
The shared Tailwind font tokens cover page text, inputs, identifiers and toasts;
`src/config/typography.ts` supplies the same family to light/dark wallet dialogs
and generated preview cards. The Latin font is preloaded before the app starts.

The header logo matches the current [Orbs website](https://www.orbs.com/): its local official gradient symbol beside uppercase Montserrat text, with the same weight, size and spacing. The symbol retains its colors in both themes, while the text follows the Portal theme. The existing accessible Orbs home link is unchanged. See `public/orbs/SOURCES.md` for provenance.

The shared navbar stays at the top while scrolling, with an opaque theme background and a border. Its height is 84px on desktop and 74px at widths up to 720px; document scroll padding keeps section targets and focused content clear of it. Menus and dialogs stay above the navbar.

Spot pending requests offer **Cancel request**. The server verifies a cancellation-specific signature from the submitting wallet, locks the pending database row, sends the cancellation to Telegram and marks the record cancelled after delivery. The request stays pending if delivery fails. Cancellation requests notify the team and do not themselves deactivate an app.

## Spot Telegram delivery

Perps submissions now use the same bot and group through `POST /api/perps-submit` (Vercel Node and Vite dev/preview). After the existing canonical deposit-step signature is verified, the client sends only app name, Partner ID, selected network, revenue wallet, extra trading fee and current policy acceptance. The server validates these public details and posts a separate **New Perps setup request** summary. It never receives the signature, message, logo, hash or private export. Telegram acceptance is required before saving the pending summary and completing the setup. A delivery failure keeps the draft and verified proof for retry; a storage-only retry reuses confirmed delivery in the same mounted form. A network timeout may still mean delivery happened, so manual retry may duplicate. Perps has no cancellation option or cancellation endpoint, and existing saved requests are never sent automatically. Telegram delivery is informational: the endpoint does not authenticate the wallet or prove payment, approval or activation. The deposit and activation status remain mocked.


Create a bot using [@BotFather](https://t.me/BotFather), add it to the destination group/channel and allow it to post. Configure these **server-only** environment variables in the Partner Portal Vercel project (Production, and Preview if needed), then deploy the updated source:

| Variable | Value |
| --- | --- |
| `SPOT_TELEGRAM_BOT_TOKEN` | The BotFather bot token. Never prefix with `VITE_` or commit it. |
| `SPOT_TELEGRAM_CHAT_ID` | The exact numeric destination chat ID, including its minus sign for groups. |

For local development/preview, put the same settings in ignored `.env.local` and restart Vite. Static-only hosting cannot serve this endpoint. No webhook, polling service, Next.js conversion or new npm dependency is required. The bot sends the request heading, original app name, a generated camelCase Partner ID, DEX URL when supplied, and fees wallet. For example, `denis test app` produces `denisTestApp`. The server derives the ID from the validated name for both submission and cancellation notifications, treating spaces/hyphens as word separators, lowercasing words and capitalizing subsequent words while preserving Unicode letters. The generated ID is a suggestion, not a reserved or activated registry entry; no caller-supplied ID is trusted. Policy validation and internal submission timestamps are retained but omitted from the Telegram message. Cancellation uses the **Spot setup cancellation request** heading with the same identifying fields, without a new policy-acceptance requirement. The destination and message templates are server-controlled; request data cannot select another chat or arbitrary message.

Notification function entry points and their shared validators use explicit `.js` relative imports so Vercel’s native Node ESM runtime can load the compiled files. Vite-only checks do not catch missing Node module extensions; verify the compiled function handlers and live routes as well as the page.

All three notification endpoints reject cross-origin browser requests, non-JSON/oversized bodies and invalid names/wallets/optional URLs. Submission additionally requires current policy acceptance; cancellation validates the identifying fields without accepting a new policy. Telegram requests have a 10-second timeout; browser requests have a 15-second timeout. Configuration and upstream failures never produce success or leak Telegram response details. The endpoint limits attempts per client IP per warm function instance (5/minute); configure a Vercel WAF rate-limit rule covering `POST /api/spot-submit`, `POST /api/spot-cancel` and `POST /api/perps-submit` for protection shared across instances. Origin checks and this public form do not authenticate a wallet. Telegram `sendMessage` has no idempotency key: an uncertain network outcome followed by a manual retry may duplicate a message. No automatic delivery retry or exactly-once guarantee is claimed.

## Run locally

Use Node.js 22.12 or a newer supported LTS release.

This standalone project lives at `/Users/denis/Documents/projects/partner-portal` and supports both Spot and Perps. Create `.env.local` with `VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id`, then run from this project root:

```sh
npm ci
npm run dev
```

All required source is in this checkout. `vendor/README.md` records the extracted analytics modules; no sibling repository or npm workspace is required.

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`. The **Deposit funds** step’s **Sign Deposit & Submit** opens the wallet message-signature prompt for the mocked deposit, then calls a local setup-submission function. It sends no transaction. After signing and the local acknowledgement, `/api/perps-submit` must confirm Telegram acceptance and the pending summary must be saved before advancing to **Setup submitted**.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The app has no automated application unit/browser suite. `npm test` runs the existing deployment-runner tests in `tests/deploy.test.mjs`; check application behavior manually.

## Deployment

The deployment runner lives in [`scripts/deploy.mjs`](scripts/deploy.mjs). It resolves repository inputs from its own location, independently of the shell’s working directory. Install the Vercel CLI with `npm install --global vercel`, then run from this directory:

```sh
npm run deploy -- --dry-run     # Print the production target; no Vercel commands
npm run deploy -- --build-only  # Pull settings and build; do not publish
npm run deploy                 # Confirm, publish, verify, then log out
npm run test:deploy            # Test the runner without Vercel or network calls
```

The target is project `prj_FuUQY7dLPoEwSzrFfXThDwldZhrN` in organization
`team_t6YZC010wIUd8yFGN6mkglL9`, the same organization as `admin-frontend`.
After verifying the project and organization, publishing sets Root Directory to
the repository root (unset/null; the CLI uses `--auto-detect root-directory`) and Framework Preset to Vite if needed, then pulls and verifies
them again before building. Other remote settings are left unchanged.
Build-only does not change remote settings and reports the actual root/preset
if they need configuration. `vercel.json` specifies the standalone `npm ci` install,
build command, and `dist` output. Activation status is a local mock function and needs no registry endpoint or rewrite. Authenticated analytics endpoints remain Node functions.

The runner uses your Vercel CLI login, opening login if necessary, and snapshots
current tracked and non-ignored source edits in a temporary directory. It excludes
local `.env*`, dependencies, and cached builds. Set production
`VITE_` values in Vercel; local `.env.local` files are not used by this command.
`vercel pull` supplies the production environment. No runtime variables or private
environment files are uploaded with the static app.

Build validation compares the generated page title with the title in the staged
source `index.html`, so branding changes do not invalidate correct output. Publishing
waits for the returned deployment to be READY and checks that its HTML has the same
source title and references the new build's script assets. It prints the actual deployment URL;
no custom domain is assumed. Temporary files are removed and `vercel logout` runs
after verification or any failed publishing attempt. Logout failure makes the
command fail and requests manual logout. Dry-run, cancelled, and build-only runs
keep the session; build-only output is saved under
`.vercel/local-builds/partner-portal` at the repository root.

## Analytics after wallet sign-in

The signed-in **Workspace** and **Analytics** pages share one selected workspace.
Analytics uses the extracted Partner Analytics snapshot’s period activity, top markets, live
account/platform metrics, thirteen charts with expand dialogs, and CSV export.
It follows the selected saved workspace's exact registered Partner ID and
network. Unknown or not-yet-connected partners/networks and historical
multi-network workspaces show an unavailable state; they never fall back to
another partner's figures. **Global on Arbitrum One (42161)** remains the preview
assumption only when the wallet has no saved workspace. There are no independent
partner or network filters. The owned workspace selection, period (`24h`, `7d`,
`30d`, `90d`, `1y`) and view are preserved in the URL; direct links still require
wallet sign-in. Live snapshots do not depend on the period selector. Cumulative
fees are user trading commissions, not partner earnings or available payouts.
A local saved request selects the requested scope but grants no analytics access.

The connected wallet needs a current live partner-admin grant for the selected
registered partner. Both `POST /api/analytics-access` and
`POST /api/analytics-stats` verify the original portal login signature and require
its website to match the request Origin and serving host. Identity comes from
the verified proof, never an address supplied in a header. The server validates
the requested workspace against the live partner registry and requires one exact
enabled network; malformed, unknown or multiple-network scope is rejected.
Each stats request then rechecks the backend grant for that same lane before any
analytics cache read. Requests and responses use `no-store`; login proofs stay
out of URLs. Wallet/session/workspace/revision/partner/network/period query keys
isolate results. Switching workspaces or leaving the authenticated workspace
cancels/removes analytics queries, and abandoned requests cannot repopulate the
new selection with the previous workspace's data.

Both Vite and the Vercel Node functions reuse the same handlers. The shared
read-only service is `partner-analytics/lib/analytics-service.ts`; financial
aggregation, metric explanations, formatting and CSV logic remain in the
existing analytics app. The deployment runner includes these source modules
in its isolated snapshot, without the Next.js runtime. Registry lookup uses
`https://perps-api.orbs.network/api/v1/partner-registry`; unavailable or invalid
registry responses block analytics until they recover. The backend admin check
remains required for every selected lane. Admin checks do not send an Origin
header; the backend must accept originless server requests for analytics to work.
Static-only hosting does not serve these endpoints. Optional server settings are
`PARTNER_ANALYTICS_BACKEND_URL` (default `https://perps-api.orbs.network`) and
`ANALYTICS_BI_INDEX` (default `orbs-perps2.*`); neither is a `VITE_` variable.
Unauthorized wallets, pending activation and unavailable data show explicit
states rather than fabricated zero metrics.

The portal has no persistent automated app tests by user choice. Browser checks
use an offline empty wallet and intercepted analytics fixtures; real production
admin access and a Vercel runtime check remain deployment acceptance checks.

## Creator and API paths

Welcome offers **Set up perps** for Perps and the independent **Set up Spot** option. There is no separate API onboarding entry. Creators can build a preview immediately; real trading needs activation. Welcome omits the combined Perps/Spot deposit-explanation paragraph; the Perps amount/network summary remains on Deposit funds. Build prerequisites appear with the launch instructions. The shared layout has no Preview mode banner. The current submission mock and activation status are described in their relevant screens and the technical documentation.

New Perps setups use five visible steps: App name → Networks → Earnings → Review setup → Deposit funds. The completion screen keeps Launch your DEX in 2 minutes primary and offers a secondary **Add perps to your DEX with our API** button opening the existing integration-prompt modal with the guide and public client link inside.

Choosing a network explicitly saves that choice and advances directly to Earnings, including clicking an already selected network or activating it with Space/Enter. The screen explains automatic progression. Merely opening/restoring Networks does not advance. Fresh setups start with no selection. Networks has Back only; workspace radios remain in the workspace until saved.

1. **App name:** enter an App name of 3–80 characters: letters only, with a single space or hyphen between letter groups. Reject punctuation such as `/qqd`, digits, leading/trailing separators and repeated/mixed separators. Both Perps and Spot share this validation. Show validation beneath the relevant input with a red border only after an attempted submit, with no validation toast or format hint. Fields stay neutral before the first attempt; visible errors update as values are corrected. Apply this to App name/Partner ID, networks, wallets, extra fee and policy checkboxes. Preserve invalid input, field focus, busy/duplicate guards and valid submission behavior. Wallet-fill connection/cancellation feedback still uses attempt-scoped toasts. Existing API-marked saved drafts retain their original Partner ID field/validation; no new API path or metadata migration is introduced. There is no website whitelist feature in the Portal. Creator names retain the existing internal ID suggestion; API IDs remain exact and are never regenerated from hidden metadata. Keep restored IDs, validation, branding metadata and signed formats. The team confirms assignment at activation. This page has no website, network repeat, logo picker or color control.
2. **Networks:** select exactly one supported network. Radio selection replaces the prior choice in setup and workspace settings; keyboard arrows are supported. A fresh Perps setup starts without a selected network; saved choices remain intact. Network cards show selection through their border and background, with no visible radio circle. Native radios remain accessible; keyboard focus adds a whole-card outline. Workspace network cards use the same treatment.
3. **Earnings:** choose a revenue wallet and an extra trading fee of 0%–0.1% in 0.001% steps, defaulting to 0%. The fee is added on filled trading volume, not a percentage share of protocol fees.
4. **Review setup:** check the editable identity, network and earnings, then accept current terms. **Next step** opens Deposit funds without connecting a wallet or signing. All setup summaries omit website rows and edit actions.
5. **Deposit funds:** confirm the 100 USDC or USDT amount for the selected network and choose **Sign Deposit & Submit**. A real wallet message signature confirms the mocked deposit step; local acknowledgement advances directly to completion. No funds are transferred.


The deposit summary emphasizes the fixed amount beside the existing USDC icon, with a quiet One-time label and a separate Network row showing the selected chain’s name/logo. A single explanation below says the deposit will be available for leveraged trading. The introduction omits the repeated amount. These are presentation changes; signing, submission and payment behavior are unchanged.

All new Perps requests use the same app setup and deposit flow. After submission, choose the primary AI app-building action or open Add perps to your DEX with our API for the official guide, public client and copyable API prompt in one modal. API integration does not require a frontend fork or hosting project. Choosing API instructions does not edit launchPath, the submitted setup, policy acceptance, signature or receipt; only the prompt’s presentation mode changes. An explicit saved copy continues to own its Partner ID and networks. Existing API-marked records retain their metadata and proof formats.

The route retains numeric/stable positions: Welcome 0, Networks 1 (networks), App name/Partner ID 2 (partner), Earnings 4 (revenue), Review setup 5 (terms) and Deposit funds 6 (funding). Position 3 (websites) is reserved for historical saved IDs, and is excluded from navigation and progress. Unfinished drafts on the removed Website step resume at Earnings, subject to the same prerequisite checks, retaining added URLs and all other details. Back/Next visits identity → networks → earnings; no saved step is renumbered or storage version changed. Historical origin metadata remains private inside signed records; no UI control edits it.

The internal [connection guide](../docs/partner-integration/01-connection.md#route-every-request-explicitly) and [signing guide](../docs/partner-integration/02-signing.md) establish that API integration uses an assigned Partner ID plus chain ID for request routing and signature scope. Their historical staging values are not copied into this setup. Use the assigned current endpoint, activated lane, contract and collateral configuration from the public guide or team. A caller assigned an existing lane uses its existing ID; preparing a new partner request does not activate one automatically.

## Names, branding and requests

`displayName` is the creator’s human name; `partnerName` remains the operational/exported partner ID and the API path’s editable Partner ID. Creator `setDexName` generates a lowercase ASCII slug locally and normalizes accents without adding a suffix. Generated IDs still require 3–40 characters and cannot use reserved partner names; validation asks the creator to change the name instead of altering it automatically. This is not an availability check or reservation. Existing saved IDs are not silently renamed.

Existing logo data and brand color remain in saved drafts and downloaded setups. App details does not collect these appearance preferences; agree the UI name, logo and colors with the integrator and apply them in the creator's public frontend copy. Existing branding metadata is a reference to confirm, not an instruction to apply a default appearance. Display-name, branding, wallet, cap, share, network and website edits clear review acceptance and terms evidence when their setup values change. Changing the operational identity clears the matching one-time setup confirmation; other edits preserve it and historical payment records.

The revenue wallet must be a non-zero EVM address. It is never inferred from a login/setup signer. After **Next step**, show invalid fields with red borders and their messages underneath, and focus the first invalid field. Before that attempt, fields remain neutral. Repeated invalid submissions keep the inline errors visible. Invalid restored fee settings remain blocked until the user explicitly chooses **Use default fee** beneath the fee error; no stored rate is silently changed, and stale actions cannot overwrite later edits. Revenue wallet, share and cap are local partner-economics requests, not API authentication inputs or live payout configuration.

`builderFeeTenthsBps` stores the per-order extra trading fee as an integer from 0–100: f=1 → 0.001%, f=10 → 0.01%, f=100 → 0.1%. Exact decimal parsing rejects negatives, out-of-range values and finer precision without rounding/clamping. The slider uses integer steps; Review, completion and workspace show the same three-decimal percentage. The value and per-order-builder-fee model are bound into the setup hash and included in private exports. Historical feeCapBps/requestedCreatorShareBps fields remain distinct to preserve existing signed records; they are never converted to builder fees. Old unsigned drafts need an explicit new fee selection, and new deposit/setup signing rejects an absent or invalid builder fee.

Earnings shows the required revenue wallet and **Extra trading fee** only. Input and slider share integer f units, endpoints are 0%/0.1%, and Home/End select valid endpoints even after invalid input. The monthly example is removed. Use my wallet becomes invisible while retaining its layout space when the entered revenue address matches the currently connected wallet, ignoring address casing. The hidden control is disabled, skipped by keyboard navigation and hidden from assistive technology. It reappears for a different/empty address, wallet switch or disconnect without moving the field row. It retains its explicit field-fill-only connection behavior; it does not sign, log in, switch networks or move funds.

The fee-share slider keeps native range behavior with a fixed-size thumb and stable track/thumb colors across pointer hover and press. Only keyboard focus adds a small thumb ring. Its 44px interaction area, 0.01% steps, keyboard endpoints and percentage/input synchronization remain intact.

Review groups the app name/ID and its network badge in one header. The badge opens network selection; The identity Edit action opens App name/Partner ID, and earnings Edit opens Earnings. There is no separate Networks row. Review and the saved/sent Setup details preview use the same shared summary card: App name or Partner ID with its network badges, extra trading fee above the revenue-wallet explorer link, with no website section on Review, completion or the workspace. Typography, labels, spacing and field order stay consistent; Review adds the Edit actions and clickable network badges, while saved details stay read-only. Review’s Edit buttons are 32px tall with 4px vertical padding, including on mobile. Review, completion and saved setup details omit the fee cap; the stored rate, validation and private export retain it.

Requested rates, revenue routing and payouts remain pending activation; the Earnings step does not display projected monthly income.

## Confirmation and wallet safeguards

Deposit funds is the last visible setup step for Perps: **App name → Networks → Earnings → Review setup → Deposit funds**. Review validates details and accepted current terms before advancing; the deposit action validates them again, then `mockDeposit` requests and verifies a canonical v3 wallet message signature with the selected collateral. `mockSetupRequest` returns a local acknowledgement bound to that signed setup; `/api/perps-submit` then confirms Telegram delivery before pending-summary storage and completion. The notification includes the signing wallet as the submitted owner wallet, separate from the revenue wallet. The client verifies the exact setup proof and signing address immediately before sending; the public endpoint validates the address but does not independently authenticate it. Success opens completion immediately; there is no intermediate confirmed-deposit panel.

After a network is selected, the server checks its enabled registry lanes for a consistent collateral address and decimals and reads the token symbol and decimals on that network. Only USDC and USDT are supported. Missing, conflicting or unverifiable data blocks a new signature with retry feedback; the displayed value reflects existing lanes and is subject to confirmation for the new partner. The lookup is repeated before signing. A confirmed delivery can still be retried for local storage without another registry lookup.

The mocked deposit creates a genuine canonical message signature, not a payment. Its combined `setupSubmission` includes the selected network, 100 USDC or USDT deposit-step confirmation, token address and decimals, terms version and setup hash. Existing v1/v2 messages remain verifiable without changing their bytes. A new setup opens the signature prompt; retries can reuse a proof only after checking its setup, connected wallet and real signature again. Wallet/revision/hash/mounted guards reject stale results, and cancellation keeps Deposit funds retryable.

Historical deposit-step confirmations and signed snapshots remain separately validated data. Deposit funds does not query prior-deposit history or display already-confirmed/Continue/Save changes variants; the requested flow always offers the signature experience and advances after success. Old proof/hash/serialization formats remain unchanged; no confirmation proves a transfer or activation.

Shared toasts cover wallet connection, signature, cancellation/error and final **Setup submitted**. Each attempt has its own ID and duplicate-click guard. Deposit funds navigation is locked while working. A valid signature is followed by a local acknowledgement and confirmed Telegram delivery, without a second continuation action. Completed data remains current-page-only and refresh returns Welcome; no browser archive write/readback gates completion.

Deposit execution is mocked: the action requests only a wallet message signature, verifies it, and returns a typed setup proof. It checks the selected network and requests a wallet network switch when needed. It does not transfer funds, approve spending or write a paid receipt. The setup acknowledgement remains local; the separate Telegram notification uses HTTP and records `notification: "telegram"` only after confirmed delivery. Historical local receipts are not promoted automatically. Private exports retain the real message proof, identify local mock submission transport and report `paymentStatus: "not-collected"`.

Completed setup screens use **Setup submitted** with a compact **Trading activation pending** row and a right-aligned 44px refresh button. The current-page completion/workspace row uses 15px desktop/14px mobile type without the old badge, reference or contact action. Under pending status, add **The dPERPS team will review your setup before activating trading.** in 13px desktop/12px mobile supporting text; omit this future-review explanation once activation is confirmed. Activation status and refresh use a local mock for every receipt, including older signed snapshots; no registry call occurs. Refresh blocks duplicates and shows a skeleton only while the actual query is fetching, with no minimum duration or delayed completion. Reduced motion disables the skeleton pulse; accessible busy/status announcements remain. Only authoritative unmocked enabled responses may confirm activation; mock responses remain pending and errors allow retry. Local-only snapshots retain **Ready to submit** without a registry query. Historical pending payment observation remains intact.

The obsolete `/api/setup-requests` HTTP client, Vercel function and dev middleware route are removed. `mockSetupRequest` returns an acknowledgement with `transport: "local"` after checking the current terms and canonical setup proof; it makes no network request, stores nothing on a server and notifies nobody. Signed historical website updates use the same local function with their original ownership guards. Future setup/payment APIs must be connected explicitly.

Dormant live-USDC helpers remain unused. They currently target a separately assigned Arbitrum reserve/hedger account; do not reuse them as creator-account collateral or as selected-chain payment without confirmed configuration and recipient semantics. Their target verification, exact approvals, transaction-hash persistence and historical receipt observer remain intact. No real destination is invented or enabled by the mock preview.

Stable stored step IDs remain intact. A draft on the stable `funding` position renders Deposit funds with Review as its Back destination. The wallet picker’s compact panel fits 320px screens. Review and Deposit funds have separate screens, each with one primary action and no duplicate footer.

The trading-fee-cap control is removed from Earnings. Existing disclosure animation utilities remain available, and the shared dialogs retain their existing motion and reduced-motion behavior.

Setup steps and their progress indicators change immediately for pointer and keyboard navigation, without a fade, slide or color animation. Replaced forms still unmount immediately, and heading focus/scroll behavior remains intact.

## Completion, publishing and sharing

Completion uses **Setup submitted**. Building/publishing an app and activating trading are separate stages. A simulated receipt never provisions a partner, collects payment, configures payouts, connects analytics or notifies the team.

Creator completion places **Launch your DEX in 2 minutes** directly after status and before collapsed **Setup details**. Completed setup details are read-only, with no edit action after submission. On phones, the primary action copies launch instructions and explains that building continues on a computer; failed clipboard access opens the selectable instructions. Desktop opens the assistant instructions dialog, with keyboard focus returned to its trigger after closing. The Codex/Claude folder-access and own-hosting-account guidance appears inside that dialog beneath its introduction, rather than below the launch button; the introduction avoids repeating it. Mobile retains its copy-and-continue-on-a-computer guidance. **Share your launch**, Workspace and Create new remain available. There is no developer-resource section or hosting selector. The requested flow reviews the branded preview before Netlify setup, checks availability of a `.netlify.app` address and reuses the creator’s recorded site. The creator signs in through their own browser. Free hosting requires current account/terms checks; costs, upgrades, automatic recharge and DNS changes require approval. Publishing does not activate trading or modify signed setup.

The shared Review and saved-details card visibly labels new Perps identity as **App name**, while existing API-marked records retain **Partner ID**. Creator details omit the extra Partner ID row beneath the app name; API details retain Partner ID as their primary identity. It groups the project name/ID and network badges together, shows the requested fee share, and uses a compact wallet row. Full names, IDs and wallet addresses wrap on narrow screens; percentages keep their exact formatting and remain requests pending approval. Revenue wallet addresses in Review and Setup details link to the first selected known network’s explorer in a new tab, with the full address and destination network available to assistive technology. Invalid/unset addresses or absent explorer metadata remain plain text.

Perps and Spot reuse the same SetupActions completion footer. Perps adds Share your launch through its content slot; Spot uses Workspace and Create new only. Completion actions share one compact footer: **Share your launch** and **Workspace** sit on the left, with **Create new** on the right. Below 560px, Share fills the first row and the two quieter actions share the next row. All controls retain 44px touch targets. Existing API-marked completion records retain their earlier share-free footer; Workspace appears only when available.

Perps completion ends with **Create new** (accessible name: **Create new setup**). The confirmation asks **Create another setup?**, explains that it starts fresh details, and offers **Not now** and **Create another**. Cancel returns focus to the trigger. Confirm resets the active draft and returns to Welcome without a browser archive write or readback gate. Busy actions remain blocked; current-page submitted snapshots stay in memory until refresh.

The workspace shows the newest current-page submitted snapshot per logical workspace in a compact read-only summary with Continue building. It shows app name/Partner ID, network, extra trading fee, revenue wallet and submission time; network settings remain separate below. There is no website summary or editor. Completed snapshots are wallet-scoped and immutable in page memory, never browser local storage. Existing old browser archive keys are ignored and left untouched. Refresh empties this catalog; it does not fetch or invent server workspaces. Viewing a snapshot never replaces the active draft or changes signed proofs.

All new Perps completions include the AI launch prompt and a secondary **Add perps to your DEX with our API** button that opens one modal containing the getting-started guide, public API client link, unchanged selectable prompt and **Copy integration prompt** action. It opens the dialog on desktop and mobile, without a nested prompt dialog. Copy integration prompt is the sole filled action inside; the guide and public API client use compact text links with 44px interaction targets. It is absent from Welcome and unfinished setup. The API prompt is available on the final submitted-setup screen and references the canonical [perps-api-integration skill](https://github.com/orbs-network/spot-integration-docs/tree/main/skills/perps-api-integration), explicitly requiring its `SKILL.md` and linked references before integration code, with the assigned partner/network instead of example defaults.

Both AI prompt dialogs focus their headings. Creator shows a plain-language summary with collapsed **Full launch instructions** and an unchecked **Let the AI choose the design for me** option only inside the dialog; it is not duplicated above Launch your DEX in 2 minutes. One setup-scoped preference reaches both desktop and mobile copying, resets for another setup/receipt and never enters signed/persisted data. Clipboard failure exposes selectable text; keyboard focus and Escape return are preserved. API keeps its unchanged prompt textarea and has no design option. Both dialogs are copy-only: Open in Codex/Open in Claude buttons, assistant deep-link helpers and automatic-launch text are removed; paste the copied prompt into the chosen assistant yourself.

The Creator prompt is a short public brief with app name, exact requested Partner ID/networks, sanitized permanent folder, branding preference and a safe Portal-return URL. A configured actual activation contact is included only when present. Read the bundled public **launch-bootstrap.html** before Git/cloning; only safe folder reuse/official-checkout discovery and explicit AGENTS/partner-launch skill reads stay inline. Bootstrap carries no-admin Git/tooling, dependency preparation, preview/hosting order and account/security rules, and links to the maintained official skill.

Every Creator variant says **Free hosting only**. The checkbox adds **Choose sensible defaults for missing branding and finalize the design for me.** only after explicit opt-in; default review waits for design acceptance and silence is never approval. Both paths show/check the real branded app before hosting, preserve existing addresses/sites, defer missing WalletConnect and keep publication separate from activation. Browser-only signup/login/MFA, no-chat-secrets, current plan/terms checks and no financial actions remain in bootstrap and the official skill.

The brief reports the published address and returns the creator to the original Portal tab. It does not instruct a website registration/update action. The Portal-return URL is general navigation, not a durable per-partner status record. HTTPS and HTTP loopback origins are accepted for this navigation URL; unsafe values fall back to the public Portal. Displaying/copying the prompt runs no commands or publication.

The public frontend currently has temporary chain discovery for `global` only. A new requested ID needs team activation and the real discovery integration; an unavailable state must not be bypassed by copying another partner's contracts. Provider URLs are sufficient for previews; custom domains can follow later.

The unified completion offers **Launch your DEX in 2 minutes** (copy instructions on mobile), the official frontend link, collapsed read-only setup details, activation status and coming-soon sharing. Opening **Add perps to your DEX with our API** shows **Start your integration** inside the prompt modal, with [official API getting-started documentation](https://docs.orbs.com/perps/api), public client references, the selectable integration prompt and its copy action. The prompt includes the exact saved Partner ID/network values and keeps activation pending. The API option does not change setup metadata or require frontend hosting; existing API-marked records retain their prior API-only completion presentation. Optional public resource files remain bundled as [API getting started](public/api-getting-started.md), [launch guide](public/launch-guide.md), and the [resource index](public/integration-readme.md); they link to the repo-owned skill.

The assistant prompt includes the public project name, ID, selected networks, and asks the integrator to confirm UI branding separately. Saved/default portal colors do not become mandatory frontend instructions. Wallet addresses, signatures and embedded logo data stay out of assistant launch URLs. Provider accounts, local source and domains belong to the creator; preparing a handoff does not authorize unrelated deployment, financial actions or posting.

The workspace keeps its existing partner/network access checks and live analytics integration; a local setup request never grants analytics access or payout authority.

The optional **Share your launch** button opens the shared animated dialog with a title, short invitation and announcement preview. It supports keyboard focus trapping, Escape/close/outside dismissal and return focus to the trigger; its bounded height scrolls on small screens. The image is generated only while the dialog is mounted, and closing releases its preview URL. The preview is the actual locally generated **1200×630 PNG**: a navy poster with strong project-name typography, a **Coming soon** badge, a local logo/initial and restrained brand accents. **Download image** saves that same image. Rendering has loading/error/retry states; obsolete images cannot be reused after setup changes and local object URLs are cleaned up. The image uses only the public project name and saved branding metadata or preview defaults. It does not configure the hosted frontend's appearance. **Share to X** opens a composer with a public coming-soon message and the dPERPS product URL; it does not attach the image or publish a post. The user attaches the download and decides whether to post. Email capture and automatic community posts are not implemented.

## Activation status mock

`mockActivationStatus(partnerId)` resolves to `unconfirmed` locally for every partner, including `wewef`. Completion and workspace status call this function on load and refresh; no `/registry` or `/api/registry` request, Vercel function or rewrite remains. The status stays **Trading activation pending**, with a rotating status icon, the query-driven refresh skeleton and review explanation. The status icon stops rotating for reduced-motion users; error and confirmed icons stay static. A distinct local-only query key avoids reusing older registry status cache entries.

This placeholder never confirms partner assignment or activates trading. The real partner API must be connected explicitly before authoritative activation is displayed. Real wallet login and analytics authorization remain independent. Vite serves the authenticated analytics endpoints and the public Spot submission endpoint.

## Portal scope and API boundaries

The Portal no longer displays or edits website whitelist data. Website rows, local origin settings, signed website-update dialogs, approval guidance, admin-console links and corsStatus exports are removed. Copied prompts and bundled launch/API resources omit whitelist instructions. Existing signed origins and stable step IDs remain private historical metadata so proofs are not rewritten; fresh setups keep the existing empty origins field in their canonical hash. Login-origin binding and safe hosting/navigation URL handling remain intact. Backend CORS/WebSocket enforcement is unchanged; this frontend removal grants no access.

## Saved progress and export

Unfinished Perps progress uses local-storage key `perpetual-hub-onboarding`, schema version **2**, including its existing proof/receipt retry data and historical pending-payment recovery. Completing setup removes that key while keeping the completed draft in memory for the current screen. Legacy completed active drafts are discarded at this store-specific hydration boundary and open Welcome; generic sanitization/serialization remains unchanged so signed hashes and snapshot identities are stable.

Unfinished progress survives refresh in the same browser profile/origin. After successful completion, refresh opens Welcome with blank setup details, even when a verified login session is restored. Restoring authentication does not automatically navigate to the workspace; My workspace remains an explicit action. Blocked storage falls back to current-page progress and never gates successful completion. Start over affects the unfinished draft and cannot reverse payments or signatures.

The setup export retains public identity/branding/wallet/terms/proof data. New configurations use feeModel: per-order-builder-fee with builderFeeTenthsBps (integer f=0–100); historical share-model exports retain their exact earlier fields/model. New fee values persist through drafts and are signed via the setup hash; edits invalidate prior proof/terms/receipt. Local setup and deposit remain mocked and unpaid. Actual order fee fields, end-user fee approvals, backend/TEE enforcement and payout routing require a separate integration; changing Portal configuration does not implement or activate them.

## Wallet workspace and sessions

**Log in** or **My workspace** opens management after wallet login. The workspace catalog still uses completed snapshots from the current page; the database-backed Your setups list is separate. A database approval does not by itself grant workspace analytics access.

Editable network settings are keyed by wallet and stable logical workspace identity, independently of editable fields or the snapshot revision. With no scoped settings saved, the selected snapshot supplies an in-memory baseline; only an explicit **Save changes** writes a separate settings record. Stored scoped edits take precedence over that baseline. The old wallet-wide sample settings are never copied or migrated into selected workspaces, and switching does not mutate signed snapshots or the active onboarding draft. Unsaved edits are guarded when changing the dropdown, navigating between Workspace/Analytics or using browser history; cancelling keeps the current selection and input. Clean views can select a newer current-page snapshot, while dirty input is preserved until saved or discarded.

With no saved workspace, settings remain wallet-local. Current editable profiles contain only the read-only Partner ID and selected network; old origin properties do not participate in editing, validation or dirty state. Reading old records does not write storage. No local selection or settings save changes accepted terms, setup confirmation, real server permissions, partner activation or the creator display name.

Invalid network saves show an inline error and red borders only after Save is attempted; selecting a valid network clears the error. Success and unavailable-storage feedback still use toasts.

The signed login proof remains in session storage and is reverified for the same wallet/origin after refresh without another signature. Restoring a valid session keeps the initial setup view; only an explicit login/My workspace action opens management. Logout, wallet changes and disconnect clear the proof. Startup loaders remain limited to actual wallet/session restoration, and later connection attempts preserve pending setup actions. The completion and workspace screens remain lazy-loaded. Login storage is independent from finished setup persistence.

## Environment configuration

Vite reads `.env.local` on startup/build. The WalletConnect project ID comes from `VITE_WALLETCONNECT_PROJECT_ID` without a code fallback. Create the local env file directly with that setting. Public links keep their code defaults and RPC/network definitions remain in code. All `VITE_` values are public browser configuration; restart or rebuild after changes. Set the WalletConnect ID in Vercel for production; the deployment runner excludes local env files.

| Variable | Purpose |
| --- | --- |
| `VITE_WALLETCONNECT_PROJECT_ID` | Required WalletConnect project ID; use the project's own value for deployment. |
| `VITE_FRONTEND_REPO_URL` | Optional public frontend repository; defaults to `https://github.com/orbs-network/perpetual-hub-frontend`. |
| `VITE_API_GUIDE_URL` | Optional HTTPS API guide override; defaults to `https://docs.orbs.com/perps/api`. |
| `VITE_FUNDING_TARGETS` | Legacy live-funding configuration; unused by the confirmation-only flow. |

## Code layout and verification

- `src/config`: chains/RPC fallback, wallet configuration and public resource links.
- `src/features/onboarding`: creator/API routes, draft, identity/branding, revenue requests, review, guarded signing and completion.
- `src/features/earnings`: hypothetical revenue calculation and disconnected metric presentation.
- `src/features/login`: signed login and session restoration.
- `src/features/partner-management`: wallet-scoped settings.
- `public`: launch/API guides and the portable launch skill.

Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` after changes. Test hosted wallet connections, Telegram and activation separately; mocked database tests do not establish those production integrations.

RPC URLs/assets follow `perpetual-hub/frontend`; requests use a five-second timeout, fallbacks and two full-list retries. Keep that inventory aligned when providers change.

### Mobile drawers

Below 768px, all Portal dialogs use the shared shadcn/ui Radix drawer backed by Vaul: pending requests and cancellation, Start over/Create new, Creator/API prompts, saved-setup instructions, sharing previews and expanded analytics charts. Desktop keeps centered dialogs. Mobile sheets fill the width with rounded top corners, a drag handle, inner scrolling and bottom safe-area padding. Dragging is restricted to the handle; text selection, prompt scrolling and request selectors keep working. Titles/descriptions, keyboard focus/return, close actions and reduced-motion preferences remain accessible. Busy cancellation drawers block dismissal, and breakpoint remounts wait until the action settles. The wallet provider retains its own mobile bottom sheets; setup/submission/signing behavior is unchanged.

Mobile onboarding uses the available dynamic viewport height: the step card fills spare space and the progress/Start over row sits immediately above the bottom Powered by Orbs/Terms links on short steps. Longer steps extend the document and scroll with the full page; the card has no independent scrollbar. This applies to Spot and Perps setup/completion, preserves normal-flow Pending requests, existing step-change heading/page reset and form state, and keeps bottom safe-area padding. Desktop retains its existing natural layout.
