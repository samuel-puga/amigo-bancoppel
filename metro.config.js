import { getDefaultConfig } from "expo/metro-config.js";

const config = getDefaultConfig(import.meta.dirname)

// Ensure html, mp4, and static assets are treated as bundle assets
if (!config.resolver.assetExts.includes("html")) {
  config.resolver.assetExts.push("html")
}
if (!config.resolver.assetExts.includes("mp4")) {
  config.resolver.assetExts.push("mp4")
}

export default config
