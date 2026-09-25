# Milestone 1 Technical Investigation Report: Expo Android Wrapper & Autonomous Bundler

**Author**: Explorer 1 (Milestone 1)  
**Date**: 2026-09-25  
**Target Milestone**: M1 (Expo Android Wrapper & Autonomous Bundler)  
**Workspace**: `c:/Users/Zam/amigo-coppel-mvp`

---

## Executive Summary

This investigation establishes the exact blueprint for configuring Expo within the existing React 19 + Vite 8 web application workspace (`c:/Users/Zam/amigo-coppel-mvp`) to support an autonomous Android application executable in Expo Go.

The project currently runs React `19.2.4` and Vite `8.0.5`. In earlier Expo releases (such as SDK 52), React was strictly pinned to `18.3.1`, creating peer-dependency conflicts. However, investigation of the active npm registry reveals that **Expo SDK 57** (`57.0.25`, the current stable release) natively integrates **React 19.2.3 / React Native 0.86.3**. This allows the mobile wrapper and the web application to share the same top-level `node_modules` without peer dependency conflicts, overrides, or React downgrades.

Furthermore, on Windows, default PowerShell script execution policies block `.ps1` execution, causing `npm` and `npx` commands to throw `PSSecurityException`. Running commands via `cmd.exe /c` or explicitly using `.cmd` binaries resolves this completely.

---

## 1. Dependency Analysis & `package.json` Configuration

### 1.1 Existing Dependencies (Baseline)
From inspection of `c:/Users/Zam/amigo-coppel-mvp/package.json`:
```json
{
  "name": "figma-make-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "oxfmt": "^0.2.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.5"
  }
}
```
Currently installed in `node_modules`:
- `react`: `19.2.4`
- `react-dom`: `19.2.4`
- `@types/react`: `19.2.14`

### 1.2 Expo SDK Compatibility Matrix with React 19
Verification of `bundledNativeModules.json` across recent Expo SDK versions:

| Expo SDK | Expo Version | Bundled React | Bundled React Native | Bundled `react-native-webview` | Compatibility with React 19 Workspace |
|---|---|---|---|---|---|
| SDK 52 | `52.0.49` | `18.3.1` | `0.76.9` | `13.12.5` | ❌ Peer dependency conflict with React 19 |
| SDK 53 | `53.0.27` | `19.0.0` | `0.79.6` | `13.13.5` | ⚠️ Compatible, but older React 19 patch |
| SDK 54 | `54.0.37` | `19.1.0` | `0.81.5` | `13.15.0` | ⚠️ Compatible |
| SDK 55 | `55.0.31` | `19.2.0` | `0.83.10` | `13.16.0` | ⚠️ Compatible |
| **SDK 57 (Latest)** | **`57.0.25`** | **`19.2.3`** | **`0.86.3`** | **`13.16.1`** | **✅ 100% Native Match with `react@19.2.4`** |

`react-native@0.86.3` explicitly defines `"peerDependencies": { "react": "^19.2.3" }`, matching the project's installed `19.2.4` without flags or `--force`.

### 1.3 Exact Additions to `package.json`

#### Production Dependencies (`dependencies`):
1. **`expo`**: `~57.0.25`
   - Core Expo runtime and module autolinking.
2. **`react-native`**: `0.86.3`
   - React Native core runtime matching Expo SDK 57.
3. **`react-native-webview`**: `13.16.1`
   - Android WebView component supporting local HTML, DOM storage, media autoplay, and file access.
4. **`expo-status-bar`**: `~57.0.1`
   - Status bar control to harmonize mobile and web header UI.

#### Development Dependencies (`devDependencies`):
1. **`vite-plugin-singlefile`**: `^2.3.3`
   - Rollup/Vite plugin to inline all JS and CSS into a single standalone HTML document. Fully supports Vite 8 (`rollup: "^4.59.0"`, `vite: "^5.4.21 || ^6.0.0 || ^7.0.0 || ^8.0.0"`).

### 1.4 Recommended `scripts` in `package.json`
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "format": "oxfmt",
  "bundle:mobile": "node scripts/generate-mobile-bundle.js",
  "start": "expo start",
  "android": "expo start --android",
  "start:mobile": "node scripts/start-mobile.js"
}
```

### 1.5 Target `package.json` Proposed Diff
```json
{
  "name": "amigo-bancoppel-mvp",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "oxfmt",
    "bundle:mobile": "node scripts/generate-mobile-bundle.js",
    "start": "expo start",
    "android": "expo start --android",
    "start:mobile": "node scripts/start-mobile.js"
  },
  "dependencies": {
    "expo": "~57.0.25",
    "expo-status-bar": "~57.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-native": "0.86.3",
    "react-native-webview": "13.16.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "oxfmt": "^0.2.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.5",
    "vite-plugin-singlefile": "^2.3.3"
  }
}
```

---

## 2. Design of `app.json` Configuration

### 2.1 Configuration Objectives
- **Name & Branding**: "Amigo BanCoppel", with slug `amigo-bancoppel-mvp`.
- **Orientation**: Locked to `"portrait"`.
- **Theme/Style**: Locked to `"userInterfaceStyle": "light"` to prevent Android system dark mode from breaking BanCoppel brand contrast.
- **Background Color**: BanCoppel Primary Blue (`#05297A`).
- **Android Package**: `com.bancoppel.amigobancoppel`.
- **Icon & Splash**: Standalone local assets with `#05297A` background.

### 2.2 Complete `app.json` Specification
```json
{
  "expo": {
    "name": "Amigo BanCoppel",
    "slug": "amigo-bancoppel-mvp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#05297A"
    },
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#05297A"
      },
      "package": "com.bancoppel.amigobancoppel"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-status-bar",
        {
          "style": "light"
        }
      ]
    ]
  }
}
```

### 2.3 Asset Directory Setup
If root `./assets/` does not exist, an icon and splash image derived from `src/mi-bolsillo/assets/bancoppel-logo-white.png` or generated during M1 setup should be copied to:
- `assets/icon.png` (1024x1024 or BanCoppel logo on blue)
- `assets/splash.png` (BanCoppel logo centered on `#05297A`)
- `assets/adaptive-icon.png` (BanCoppel logo transparent foreground)
- `assets/favicon.png`

---

## 3. Entry Point & Metro Bundler Design

### 3.1 Architectural Layout
```
c:/Users/Zam/amigo-coppel-mvp/
├── app.json                               # Expo configuration
├── App.tsx                                # Expo mobile root wrapper (WebView)
├── index.js                               # Expo entry point
├── metro.config.js                        # Metro bundler config (ESM / CJS)
├── scripts/
│   ├── generate-mobile-bundle.js          # Inlining/packaging script for mobile
│   └── start-mobile.js                    # Autonomous start script (build + expo start)
├── src-mobile/
│   └── generated/
│       └── webAppHtml.ts                  # Generated inlined web bundle
└── src/                                   # Existing React+Vite web app
    └── App.tsx                            # Web root
```
> **Non-collision note**: The Expo mobile root is `c:/Users/Zam/amigo-coppel-mvp/App.tsx`, whereas the web application root remains at `c:/Users/Zam/amigo-coppel-mvp/src/App.tsx`.

### 3.2 Design of `index.js`
Expo registers the application entry point using `registerRootComponent`.
Because `package.json` specifies `"main": "index.js"` and `"type": "module"`:
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(App);
```

### 3.3 Design of `App.tsx` (Mobile Root Component)
The root component wraps `<WebView>` from `react-native-webview`, implements Android back-button handling, and applies all required container flags:

```tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { webAppHtml } from './src-mobile/generated/webAppHtml';

export default function App() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // Forward back navigation to the WebView to close open sheets or navigate back
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'BACK_BUTTON_PRESSED' }));
        return true; // Prevent app exit
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: webAppHtml, baseUrl: 'https://localhost' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
        allowFileAccess={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidHardwareAccelerationDisabled={false}
        style={styles.webview}
        scalesPageToFit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05297A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#05297A',
  },
});
```

### 3.4 Design of `metro.config.js`
#### The `"type": "module"` Nuance in Metro
In Node.js 24, `"type": "module"` in `package.json` causes `.js` files to be loaded as ECMAScript Modules (ESM). Standard CommonJS syntax (`const { getDefaultConfig } = require('expo/metro-config'); module.exports = ...`) will fail with `ReferenceError: require is not defined in ES module scope` if evaluated directly as ESM.

There are two rock-solid approaches:

#### Approach A: ESM `metro.config.js` (Recommended for `"type": "module"`)
```javascript
import { getDefaultConfig } from 'expo/metro-config';

const config = getDefaultConfig(import.meta.dirname);

// Ensure html, mp4, and fonts are treated as bundle assets
if (!config.resolver.assetExts.includes('html')) {
  config.resolver.assetExts.push('html');
}

export default config;
```

#### Approach B: CommonJS `metro.config.cjs`
Because `.cjs` files are explicitly CommonJS regardless of `package.json` `"type"`, Metro and Expo CLI resolve `metro.config.cjs`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('html')) {
  config.resolver.assetExts.push('html');
}

module.exports = config;
```

#### Asset Importing Strategy: Synchronous TypeScript Module
Because `scripts/generate-mobile-bundle.js` writes the bundled HTML payload directly to `src-mobile/generated/webAppHtml.ts` (`export const webAppHtml = "...";`), Metro bundles it as regular JavaScript/TypeScript code. This completely avoids runtime asset loading quirks, network latency, or Android filesystem permission hurdles.

---

## 4. Autonomous Bundling Pipeline Design

### 4.1 Packaging Script (`scripts/generate-mobile-bundle.js`)
The bundling script executes the following steps:
1. Runs Vite build targeting the web app (`src/`), producing an inlined bundle with `vite-plugin-singlefile`.
2. Reads the generated `index.html`.
3. Ensures all assets (including `splash.mp4`, 807 KB) are converted:
   - For `splash.mp4`, inlines as base64 and injects a bootstrap snippet:
     ```javascript
     // Converts base64 video to in-memory Blob URL for native Android hardware decoding
     const byteCharacters = atob(base64Data);
     const byteNumbers = new Uint8Array(byteCharacters.length);
     for (let i = 0; i < byteCharacters.length; i++) {
       byteNumbers[i] = byteCharacters.charCodeAt(i);
     }
     const blob = new Blob([byteNumbers], { type: 'video/mp4' });
     const blobUrl = URL.createObjectURL(blob);
     videoElement.src = blobUrl;
     ```
4. Writes the final HTML string to `src-mobile/generated/webAppHtml.ts`:
   ```typescript
   // Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY
   export const webAppHtml = `<!doctype html>...`;
   ```

### 4.2 Autonomous Launcher (`scripts/start-mobile.js`)
`scripts/start-mobile.js` orchestrates the complete flow:
1. Verifies/generates `src-mobile/generated/webAppHtml.ts`.
2. Invokes `cmd.exe /c "npx expo start"` with inherited `stdio`.

---

## 5. Verification of Windows Execution Commands

### 5.1 The PowerShell Execution Policy Constraint
On Windows PowerShell, executing `npm` or `npx` directly runs `npm.ps1` or `npx.ps1`. When PowerShell script execution policy is `Restricted`, the following error occurs:
```
npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema.
+ CategoryInfo          : SecurityError: (:) [], PSSecurityException
+ FullyQualifiedErrorId : UnauthorizedAccess
```

### 5.2 Verified Workarounds
1. **Explicit `cmd.exe /c` wrapper (Recommended)**:
   ```cmd
   cmd.exe /c "npx expo start"
   cmd.exe /c "npx expo start --android"
   cmd.exe /c "npm run bundle:mobile"
   cmd.exe /c "npm run start:mobile"
   ```
2. **Explicit `.cmd` file extensions in PowerShell**:
   ```powershell
   npx.cmd expo start
   npm.cmd run bundle:mobile
   npm.cmd start
   ```

Both methods bypass the `.ps1` restriction and execute cleanly with exit code `0`.

---

## 6. Implementation Checklist for Milestone 1

- [ ] Update `package.json` with dependencies (`expo@~57.0.25`, `react-native@0.86.3`, `react-native-webview@13.16.1`, `expo-status-bar@~57.0.1`, `vite-plugin-singlefile@^2.3.3`) and scripts.
- [ ] Create `app.json` with BanCoppel branding and Android configuration.
- [ ] Create `assets/` directory with icon and splash images.
- [ ] Create `index.js` registering the root component.
- [ ] Create `App.tsx` mobile wrapper with `<WebView>` and BackHandler.
- [ ] Create `metro.config.js` with ESM / asset configuration.
- [ ] Create `src-mobile/generated/webAppHtml.ts` (stub or initial generated bundle).
- [ ] Create `scripts/generate-mobile-bundle.js` and `scripts/start-mobile.js`.
- [ ] Verify execution using `cmd.exe /c "npx expo start"`.
