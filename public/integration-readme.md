# Your dPERPS launch resources

- **Build my preview:** the portal prompt guides your assistant through customizing the [existing official app](https://github.com/orbs-network/perpetual-hub-frontend) and publishing your branded website. No GitHub account, fork, setup JSON or skill attachment is required. Allow roughly 30–60 minutes, plus first-time installs/team approval. First provide a logo or choose text-only branding, then choose dark/light appearance and a primary color. Review the actual branded preview before choosing an available `.netlify.app` address and signing in to Netlify yourself. The permanent folder is supplied by your setup; updates reuse it and the same site.
- **Use the API:** follow [API getting started](https://docs.orbs.com/perps/api) for your existing app or service. Frontend hosting is not required.

The assistant saves your app in `~/Documents/dPERPS/<project-id>`, a private source backup in the parent `backups/` folder, and `DEPLOYMENT.md` inside the project. It reuses that exact folder/site for updates without scanning your disk. Fresh Mac tool installation stays in your home directory without sudo, Homebrew or Apple developer tools.

The requested host is Netlify, using free hosting only after checking your current account and terms. You create accounts, choose passwords and complete sign-in/MFA yourself. After design acceptance, the assistant completes publication without another deployment question, verifies the stable URL and reuses that site on updates. Costs, upgrades, automatic recharge and DNS changes require approval; custom domains are outside this launch. A missing WalletConnect project ID must not block launch or trigger Reown signup; an existing partner-owned ID is preserved.

The dPERPS team confirms your Partner ID and activates the selected networks before trading can start. You can customize and publish your branded app while activation is pending. Until then, the app shows its coming-soon notice with trading and wallet/network controls disabled. Website publication does not confirm trading activation or network support. Do not reuse another partner’s contracts or configuration.

Wallet connection checks use an empty wallet or are skipped. No trading, signing, token approval, deposit or withdrawal is part of the launch check. The portal’s existing funding/terms messages remain onboarding proofs, not API credentials, token balances or real payments.

Wallet addresses, signatures and embedded logo data stay out of assistant launch URLs. Keep complete setup exports private for the team; do not put credentials, real environment files or proofs in source backups/notes.

The assistant’s final report gives your link, file/backup locations and remaining team work. It saves a ready-to-paste future-update prompt in `DEPLOYMENT.md` and redeploys to the same site and stable URL.

The [launch guide](./launch-guide.md) explains the handoff. After cloning, the assistant explicitly follows the official frontend's [partner-launch skill](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/.agents/skills/partner-launch/SKILL.md). That repository maintains the procedure alongside its code; no skill download or global install is required.
