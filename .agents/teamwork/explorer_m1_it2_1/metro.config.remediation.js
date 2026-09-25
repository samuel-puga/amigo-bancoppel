import { getDefaultConfig } from "expo/metro-config.js"

const config = getDefaultConfig(process.cwd())

if (!config.resolver.assetExts.includes("html")) {
  config.resolver.assetExts.push("html")
}
if (!config.resolver.assetExts.includes("mp4")) {
  config.resolver.assetExts.push("mp4")
}

export default config
