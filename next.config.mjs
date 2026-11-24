/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  webpack(config, { isServer }) {
    // Server modules use Node-compatible .js import specifiers in TypeScript.
    if (!isServer) config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, ".js": [".js", ".ts", ".tsx"] };
    return config;
  },
  // These existing settings were always public in the Vite client. Keep their
  // names so existing deployments and local .env.local files remain compatible.
  env: {
    VITE_WALLETCONNECT_PROJECT_ID: process.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
    VITE_FRONTEND_REPO_URL: process.env.VITE_FRONTEND_REPO_URL ?? "",
    VITE_PARTNER_ACTIVATION_CONTACT_URL: process.env.VITE_PARTNER_ACTIVATION_CONTACT_URL ?? "",
    VITE_API_GUIDE_URL: process.env.VITE_API_GUIDE_URL ?? "",
    VITE_FUNDING_TARGETS: process.env.VITE_FUNDING_TARGETS ?? "",
  },
};
export default nextConfig;
