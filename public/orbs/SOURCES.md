# Orbs brand sources

Assets copied from the current [Orbs homepage](https://www.orbs.com/) and official [brand assets page](https://www.orbs.com/brand-assets/) on 2026-11-12 for the requested Orbs-themed onboarding UI.

- `orbs-mark.svg`: inline official gradient Orbs mark in the homepage header.
- `orbs-logo-black.svg`: https://www.orbs.com/marketing/brand-assets/orbs-logo-black.svg
- `orbs-mark-black.svg`: https://www.orbs.com/marketing/brand-assets/black-logo.svg
- `orbs-logo-color.svg`: https://www.orbs.com/marketing/brand-assets/orbs-logo-horizonal.svg
- `Montserrat-latin.woff2`: https://www.orbs.com/_next/static/immutable/media/e8f2fbee2754df70-s.p.1gavkj72q9u43.woff2

The homepage computes Montserrat for body text and headings. The Latin WOFF2 is a variable font with a weight axis from100 to900. Theme tokens were verified from https://www.orbs.com/_next/static/immutable/chunks/3xb_sjc91__rx.css.

On 2026-11-23 the Portal header was updated to match the live homepage’s logo treatment: the existing gradient mark next to uppercase Montserrat text, normal weight, 20px text size, 1px letter spacing, 12px gap and 28px mark. Its SVG paths and gradient definitions were compared with the live header and match exactly. Keep the gradient intact in light and dark themes; the wordmark follows theme text color rather than inverting the entire logo. The older black/color horizontal assets remain available but are no longer the header source.
