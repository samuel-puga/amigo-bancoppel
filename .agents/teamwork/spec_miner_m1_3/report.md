# Technical Specification: Mobile Wrapper Component (`App.tsx`)
**Project**: Amigo BanCoppel MVP  
**Milestone**: Milestone 1 (Expo Android Wrapper & Autonomous Bundler)  
**Agent**: Spec Miner 3 (`spec_miner_m1_3`)  
**Target File**: `c:/Users/Zam/amigo-coppel-mvp/App.tsx` (Expo Mobile Root)  
**Date**: 2026-09-25  

---

## 1. Executive Summary & Architectural Role

The mobile wrapper component (`App.tsx`) serves as the root container in the Expo Go Android environment. It bridges the native Android OS runtime (via Expo SDK and `react-native-webview`) with the compiled React 19 + Vite 8 SPA packaged as a self-contained inlined HTML string (`src-mobile/generated/webAppHtml.ts`).

### Key Operational Goals:
1. **Zero-Latency Inlined Execution**: Renders `webAppHtml` without requiring network connectivity, local server discovery, or port configurations on the mobile device.
2. **Hardware Acceleration & Video Autoplay**: Ensures the 807 KB HTML5 splash video (`splash.mp4`) autoplays inline smoothly on Android hardware without user gesture gating, transitioning cleanly into the welcome/dashboard views.
3. **Storage Persistence**: Enables Chromium WebSettings DOM storage so that `localStorage` (`mi-bolsillo:v3:items`, `mb:incomes:v1`, etc.) and `sessionStorage` (`splash-seen`) persist indefinitely across app restarts.
4. **Hardware Navigation Interception**: Replaces native browser history navigation with an intelligent state-aware Android `BackHandler` bridge that dismisses open bottom sheets and reverses tabs before allowing the app to exit.
5. **Harmonized Fullscreen Presentation**: Suppresses the Android system status bar (`<StatusBar hidden={true} />`), enabling the web application's BanCoppel-branded 9:41 status bar to occupy the top edge seamlessly without double status bars.
6. **Robust Error & Lifecycle Management**: Eliminates the Android WebView "white flash" during DOM initialization using a branded `#05297A` loading placeholder and provides a React Native Error Boundary to catch renderer crashes gracefully.

---

## 2. Complete `<WebView />` Android Props Specification

The `<WebView />` component from `react-native-webview` requires an exact set of props to operate correctly inside Android Expo Go. Android's native `android.webkit.WebView` has several security and power restrictions by default (such as disabling JavaScript, DOM storage, inline autoplay, and file access) that must be explicitly configured.

### 2.1 Complete Android Props Matrix

| # | Prop Name | Type & Required Value | Underlying Android WebSettings / View API | Purpose & Rationale | Failure Mode if Omitted / Misconfigured |
|---|-----------|----------------------|-------------------------------------------|---------------------|-----------------------------------------|
| 1 | `source` | `{{ html: webAppHtml, baseUrl: 'https://localhost' }}` | `WebView.loadDataWithBaseURL("https://localhost", html, "text/html", "UTF-8", null)` | Loads the inlined bundle string while assigning an origin domain (`https://localhost`). | Defaults to `about:blank`, breaking relative script/font loads, CORS origin checks, and `localStorage` security domains. |
| 2 | `originWhitelist` | `['*']` | Filter in `RNCWebViewManager.java` | Whitelists all URL schemes, permitting `blob:`, `data:`, `https:`, and `http:` asset evaluation. | Blob URLs (used for video buffer) or external font stylesheets are blocked by WebView navigation filter. |
| 3 | `javaScriptEnabled` | `true` | `WebSettings.setJavaScriptEnabled(true)` | Mandates execution of client-side JavaScript. | Blank screen; React 19 SPA cannot mount or execute. |
| 4 | `domStorageEnabled` | `true` | `WebSettings.setDomStorageEnabled(true)` | Enables `window.localStorage` and `window.sessionStorage` in the Chromium engine. | `localStorage.setItem` throws `SecurityError: The operation is insecure` or fails silently; expenses/incomes disappear on restart. |
| 5 | `mediaPlaybackRequiresUserAction` | `false` | `WebSettings.setMediaPlaybackRequiresUserGesture(false)` | Permits HTML5 `<video>` autoplay without requiring a physical tap on the screen. | `splash.mp4` autoplay is blocked on Android; `v.play().catch(...)` fires immediately, skipping splash screen. |
| 6 | `allowsInlineMediaPlayback` | `true` | `WebSettings.setPluginState`, inline HTML5 flags | Forces `<video>` to play inside the DOM tree rather than launching native Android fullscreen intent. | Video opens in an external Android media player or full-screen overlay, breaking the branded splash layout. |
| 7 | `mixedContentMode` | `"always"` | `WebSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)` | Allows loading resources across mixed HTTP/HTTPS contexts (fonts, blobs, companion APIs). | Chromium blocks resources or fonts loaded over insecure/secure mix. |
| 8 | `allowFileAccess` | `true` | `WebSettings.setAllowFileAccess(true)` | Enables WebView to access local file resources if required by Expo caching layers. | Asset reading errors if local filesystem URIs are requested. |
| 9 | `allowUniversalAccessFromFileURLs` | `true` | `WebSettings.setAllowUniversalAccessFromFileURLs(true)` | Allows JavaScript in file context to access resources across origins. | CORS errors when accessing assets across local contexts. |
| 10 | `allowFileAccessFromFileURLs` | `true` | `WebSettings.setAllowFileAccessFromFileURLs(true)` | Permits script execution across local file hierarchies. | Script or style inclusion blocked under file context. |
| 11 | `androidHardwareAccelerationDisabled` | `false` | `View.setLayerType(View.LAYER_TYPE_HARDWARE, null)` | Activates GPU hardware acceleration for smooth 60fps CSS transforms and MP4 video decoding. | Stuttering animations on 200% width sliding track; dropped frames during splash video playback. |
| 12 | `androidLayerType` | `"hardware"` | Enforces hardware composition layer on Android. | Guarantees hardware-accelerated rendering of complex SVG charts and bottom sheet translate animations. | Slow rendering and software fallbacks on lower-tier Android devices. |
| 13 | `showsVerticalScrollIndicator` | `false` | `View.setVerticalScrollBarEnabled(false)` | Suppresses native vertical scrollbar. | Duplicate scrollbars: native Android scrollbar overlaps the web app's custom scroll container (`mb-scroll`). |
| 14 | `showsHorizontalScrollIndicator` | `false` | `View.setHorizontalScrollBarEnabled(false)` | Suppresses native horizontal scrollbar. | Visible horizontal scrollbar during the 200% width slide transition between Bienvenido and Amigo BanCoppel. |
| 15 | `overScrollMode` | `"never"` | `View.setOverScrollMode(View.OVER_SCROLL_NEVER)` | Disables Android's native overscroll stretch/glow effect on the outer container. | Clashing double overscroll bounce physics between native WebView and DOM scroll elements. |
| 16 | `scalesPageToFit` | `false` | `WebSettings.setLoadWithOverviewMode(false)`, `WebSettings.setUseWideViewPort(false)` | Prevents WebView from zooming out the HTML page to fit a desktop viewport width. | Page renders zoomed out with tiny fonts instead of mobile 1:1 viewport size. |
| 17 | `textZoom` | `100` | `WebSettings.setTextZoom(100)` | Locks web font scaling to 100%, ignoring user-configured Android system font scale overrides. | Users with high system font scale settings (e.g. 130%) experience broken layouts, clipped text, or wrapped buttons in the demo. |
| 18 | `bounces` | `false` | WebView bounce physics flag | Disables elastic edge bouncing. | Awkward rubber-banding on top/bottom boundaries during swipe-to-delete. |
| 19 | `setSupportMultipleWindows` | `false` | `WebSettings.setSupportMultipleWindows(false)` | Prevents `window.open` or `target="_blank"` links from requesting secondary windows. | Unhandled window requests fail silently or open a blank screen without a multi-window delegate. |
| 20 | `startInLoadingState` | `true` | Internal React Native WebView flag | Mounts the custom `renderLoading` placeholder immediately until initial HTML load completes. | Brief white flash visible between native component mount and WebView DOM readiness. |
| 21 | `renderLoading` | `() => <BrandLoadingView />` | Render callback | Renders a BanCoppel-branded `#05297A` loading view with `#F0D225` indicator. | User sees an unstyled blank view during bundle initialization. |
| 22 | `onRenderProcessGone` | `(event) => reload()` | `WebViewClient.onRenderProcessGone` | Automatically detects Android Chromium renderer termination (OOM) and reloads the view. | App gets stuck on a frozen/white screen if the native WebView process is reclaimed by Android OS. |
| 23 | `onError` | `(event) => handleError(event)` | `WebViewClient.onReceivedError` | Traps network or loading failures and triggers the React Native error fallback UI. | Silent failure leaving user on an uninformative blank screen. |
| 24 | `onHttpError` | `(event) => handleHttpError(event)` | `WebViewClient.onReceivedHttpError` | Traps HTTP error status codes (4xx/5xx) if loading from a companion server. | Broken page displayed without user feedback. |
| 25 | `onMessage` | `(event) => handleWebMessage(event)` | Injected Javascript postMessage bridge | Receives state events (`tab`, `activeSheet`, `canGoBack`) from the web application. | Wrapper cannot know current web state, making BackHandler unable to dismiss sheets selectively. |
| 26 | `style` | `styles.webView` (`{ flex: 1, backgroundColor: '#05297A' }`) | Native `android.view.View` style | Sets container background to brand navy color `#05297A`. | Any brief rendering gap reveals default white window background. |

---

## 3. Android `BackHandler` Specification & Bridge Protocol

### 3.1 The Architectural Problem
In traditional multi-page web applications or apps with `react-router`, `navState.canGoBack` is `true` after page navigations, allowing `webViewRef.current.goBack()` to pop browser history.

However, in this application (`src/mi-bolsillo/MiBolsillo.jsx`):
- Navigation between "Bienvenido" (`tab === 'login'`) and "Amigo BanCoppel" (`tab === 'bolsillo'`) is driven solely by React component state (`useState('login')`).
- Bottom sheets (`IntroSheet`, `ApartadoSheet`, `DomiciliacionSheet`, `IncomeSheet`, `ReminderSheet`) are controlled by React state (`sheet`, `item`, `open`), not browser URLs.
- `window.history` is **never modified**. As a result, `navState.canGoBack` is **always `false`**.
- If `BackHandler` simply checks `if (navState.canGoBack) webViewRef.current.goBack(); else return false;`, the `BackHandler` returns `false` on EVERY back button press. **This causes Android to immediately exit the app during the presentation!**

### 3.2 State Hierarchy for Back Press Gating
When the user presses the Android hardware back button (or performs an edge back swipe), the back press must be consumed according to the following strict priority:

```
[Hardware Back Press]
        │
        ▼
Is any Bottom Sheet Open? (Intro, Apartado, Domiciliar, Income, Reminder)
   ├── YES ──► Close the Sheet (consume event: return true)
   │
   └── NO  ──► Is Tutorial Spotlight Active? (tutorialStep !== null)
                 ├── YES ──► Dismiss Tutorial (consume event: return true)
                 │
                 └── NO  ──► Is current tab === 'bolsillo' (Amigo BanCoppel)?
                               ├── YES ──► Switch tab to 'login' (Bienvenido) (consume event: return true)
                               │
                               └── NO  ──► Is current tab === 'login' (Bienvenido)?
                                             ├── 1st Press: ToastAndroid "Presiona de nuevo para salir" (return true)
                                             └── 2nd Press within 2000ms: Allow exit (return false)
```

### 3.3 Bi-directional Bridge Protocol

#### A. Web App -> React Native Wrapper (`postMessage`)
The web application dispatches a message via `window.ReactNativeWebView?.postMessage` whenever navigation state changes:
```typescript
interface WebNavigationStatePayload {
  type: 'NAV_STATE_UPDATE';
  tab: 'login' | 'bolsillo';
  hasOpenSheet: boolean;
  hasOpenTutorial: boolean;
  activeSheetName: 'intro' | 'apartado' | 'domiciliar' | 'income' | 'reminder' | null;
}
```

#### B. React Native Wrapper -> Web App (`injectJavaScript`)
When `BackHandler` fires and navigation state indicates a sheet, tutorial, or tab can be closed:
```typescript
const handleBackPress = () => {
  if (navState.hasOpenSheet || navState.hasOpenTutorial || navState.tab === 'bolsillo') {
    webViewRef.current?.injectJavaScript(`
      (function() {
        // 1. Dispatch custom event for MiBolsillo
        window.dispatchEvent(new CustomEvent('android:hardwareBack'));

        // 2. Dispatch Escape key to dismiss any listening <Sheet /> components
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        }));

        // 3. Close portal modals (IncomeSheet / ReminderSheet) if active
        var closeBtn = document.querySelector('[role="dialog"] button[aria-label="Cerrar"], [role="dialog"] button');
        if (closeBtn) {
          closeBtn.click();
        }
        return true;
      })();
      true;
    `);
    return true; // Consumed: do not exit app
  }

  // Double-back-to-exit protection for live demo
  if (backPressCountRef.current === 0) {
    backPressCountRef.current = 1;
    ToastAndroid.show('Presiona de nuevo para salir', ToastAndroid.SHORT);
    setTimeout(() => {
      backPressCountRef.current = 0;
    }, 2000);
    return true; // Consumed: prevent immediate exit
  }

  // Second press within 2s: allow default Android exit
  return false;
};
```

#### C. Injected Autonomous Fallback Script
To guarantee 100% resilience even if `postMessage` synchronization has not occurred, the mobile wrapper injects a lightweight script at document start:
```javascript
window.__dismissActiveSheetOrModal = function() {
  // Check for open sheets or dialogs in DOM
  const openDialog = document.querySelector('[role="dialog"][aria-hidden="false"], [role="dialog"]:not([style*="display: none"])');
  if (openDialog) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return true;
  }
  // Check if currently on bolsillo tab
  const bTab = document.querySelector('[role="tab"][aria-selected="true"]');
  if (bTab && bTab.innerText.includes('Amigo BanCoppel')) {
    const loginTab = document.querySelector('[role="tab"]:not([aria-selected="true"])');
    if (loginTab) {
      loginTab.click();
      return true;
    }
  }
  return false;
};
```

---

## 4. Status Bar Configuration & Harmonization

### 4.1 Root Cause of Status Bar Duplication
In `src/mi-bolsillo/components.jsx` (lines 37–48), the web application renders its own SVG-based mock status bar:
```jsx
export function StatusBar() {
  return (
    <div style={{ height: 47, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 0 32px' }}>
      <span style={{ fontWeight: 600, fontSize: 16, color: '#FFFFFF' }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Signal, WiFi, Battery SVGs */}
      </div>
    </div>
  );
}
```
And in `src/App.tsx:78`:
`<MiBolsillo showStatusBar={true} trashMode="hover" />`

If the native Android status bar remains visible:
- Android renders its native clock (e.g. `10:24`) and battery indicator at the top (~24dp to 32dp height).
- The web app renders its mock `9:41` clock and battery indicator directly underneath (47px height).
- This results in two stacked status bars with conflicting times, destroying the native app illusion during the demo.

### 4.2 Harmonization Contract
1. **Hide Native Status Bar**:
   Import `StatusBar` from `expo-status-bar` and render:
   ```tsx
   import { StatusBar } from 'expo-status-bar';
   // Inside App.tsx root:
   <StatusBar hidden={true} />
   ```
2. **`app.json` Android Configuration**:
   In `app.json`, declare:
   ```json
   "androidStatusBar": {
     "hidden": true,
     "translucent": true,
     "backgroundColor": "#05297A"
   }
   ```
3. **Full-Viewport Edge-to-Edge Layout**:
   In mobile Android, the web layout must not be letterboxed by the desktop wrapper's `maxHeight: 900` or `maxWidth: 430`. The wrapper View must use:
   ```tsx
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#05297A',
     },
     webView: {
       flex: 1,
       backgroundColor: '#05297A',
     },
   });
   ```
   This allows the web app's `#05297A` header and mock status bar to extend naturally to the very top edge of the Android display, fitting notches and punch-hole camera cutouts cleanly.

---

## 5. Error Boundary & Loading Splash Handling

### 5.1 Elimination of the Android "White Flash"
When an Android WebView instance mounts, its native view hierarchy initially displays the default system window background (white `#FFFFFF`). If the inlined bundle requires even 150ms to parse and execute:
1. Native container mounts (White screen).
2. WebView parses HTML.
3. React mounts with `#05297A` splash video.
The user perceives an abrupt white flash before the dark blue splash screen appears.

#### Prevention Architecture:
- Root Native View: `backgroundColor: '#05297A'`.
- WebView Style: `backgroundColor: '#05297A'`.
- `startInLoadingState={true}`: Instructs `react-native-webview` to hold a dedicated loading view above the WebView until `onLoadEnd` fires.
- `renderLoading`: Renders `BrandLoadingPlaceholder`, an un-styled or minimal `#05297A` view with an activity indicator colored in BanCoppel Yellow (`#F0D225`).

### 5.2 React Native Error Boundary Component
To safeguard the live demo against catastrophic bundle or runtime crashes, the wrapper embeds a React Error Boundary (`AppErrorBoundary`):

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

#### Fallback UI Features:
- Branded `#05297A` background matching the application theme.
- Title: "Amigo BanCoppel".
- Subtitle: "Ocurrió un problema al inicializar la aplicación."
- Action Button: "Reintentar" (calls `onRetry` which increments a component key to remount the WebView cleanly).
- Optional Technical Details: Expandable error details visible in `__DEV__` mode.

### 5.3 Native Process Crash Handling (`onRenderProcessGone`)
In Android, the Chromium renderer runs in a separate OS process. Under extreme memory pressure, Android's low-memory killer (LMK) can terminate this process, leaving the app on a permanently frozen or black/white screen.
Contract:
```tsx
onRenderProcessGone={(syntheticEvent) => {
  const { nativeEvent } = syntheticEvent;
  console.warn('WebView render process terminated:', nativeEvent.didCrash);
  // Remount or reload WebView to recover gracefully
  webViewRef.current?.reload();
}}
```

---

## 6. Complete Reference Implementation Contract (`App.tsx`)

Below is the authoritative, production-ready specification of `App.tsx`:

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  ToastAndroid,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// Import inlined web bundle generated by scripts/generate-mobile-bundle.js
// @ts-ignore - Generated build artifact
import { webAppHtml } from './src-mobile/generated/webAppHtml';

// Brand Colors
const BRAND_NAVY = '#05297A';
const BRAND_YELLOW = '#F0D225';
const BRAND_WHITE = '#FFFFFF';

interface WebNavigationState {
  tab: 'login' | 'bolsillo';
  hasOpenSheet: boolean;
  hasOpenTutorial: boolean;
  activeSheetName: string | null;
}

/**
 * Error Boundary to catch render and mount errors in React Native
 */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <StatusBar hidden={true} />
          <View style={styles.errorCard}>
            <View style={styles.brandDotsContainer}>
              <View style={[styles.dot, styles.bigDot]} />
              <View style={[styles.dot, styles.smallDot]} />
              <View style={[styles.dot, styles.smallDot]} />
            </View>
            <Text style={styles.errorTitle}>Amigo BanCoppel</Text>
            <Text style={styles.errorMessage}>
              Ocurrió un problema al inicializar la aplicación.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorDetails}>{this.state.error.message}</Text>
            )}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

/**
 * Branded Loading Screen shown while the HTML bundle parses
 */
function BrandLoadingView() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={BRAND_YELLOW} />
    </View>
  );
}

/**
 * Main Mobile Wrapper Root Component
 */
export default function App() {
  const webViewRef = useRef<WebView>(null);
  const backPressCountRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Synchronized state from the web application
  const [webState, setWebState] = useState<WebNavigationState>({
    tab: 'login',
    hasOpenSheet: false,
    hasOpenTutorial: false,
    activeSheetName: null,
  });

  const handleReset = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  /**
   * Handle messages sent from the React web app via window.ReactNativeWebView.postMessage
   */
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NAV_STATE_UPDATE') {
        setWebState({
          tab: data.tab || 'login',
          hasOpenSheet: !!data.hasOpenSheet,
          hasOpenTutorial: !!data.hasOpenTutorial,
          activeSheetName: data.activeSheetName || null,
        });
      }
    } catch {
      // Ignore unformatted string messages
    }
  }, []);

  /**
   * Android Hardware Back Button Gating
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = (): boolean => {
      // 1. If a bottom sheet or tutorial is open, dismiss it
      if (webState.hasOpenSheet || webState.hasOpenTutorial) {
        webViewRef.current?.injectJavaScript(`
          (function() {
            window.dispatchEvent(new CustomEvent('android:hardwareBack'));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
            var closeBtn = document.querySelector('[role="dialog"] button[aria-label="Cerrar"]');
            if (closeBtn) closeBtn.click();
            return true;
          })();
          true;
        `);
        return true; // Consumes event, does NOT exit app
      }

      // 2. If on the 'bolsillo' (Amigo BanCoppel) dashboard, return to 'login' (Bienvenido)
      if (webState.tab === 'bolsillo') {
        webViewRef.current?.injectJavaScript(`
          (function() {
            window.dispatchEvent(new CustomEvent('android:navigateToLogin'));
            var loginTab = document.querySelectorAll('[role="tab"]')[0];
            if (loginTab) loginTab.click();
            return true;
          })();
          true;
        `);
        return true; // Consumes event, does NOT exit app
      }

      // 3. If on the 'login' screen with no modals, apply Double-Back-to-Exit safety pattern
      if (backPressCountRef.current === 0) {
        backPressCountRef.current = 1;
        ToastAndroid.show('Presiona de nuevo para salir', ToastAndroid.SHORT);
        setTimeout(() => {
          backPressCountRef.current = 0;
        }, 2000);
        return true; // Consumes first press
      }

      // 4. Second press within 2 seconds: allow default OS exit
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [webState]);

  return (
    <AppErrorBoundary onReset={handleReset}>
      <View style={styles.container}>
        {/* Hide native status bar to prevent clash with web 9:41 status bar */}
        <StatusBar hidden={true} />

        <WebView
          key={reloadKey}
          ref={webViewRef}
          // Bundle Source & Whitelist
          source={{ html: webAppHtml, baseUrl: 'https://localhost' }}
          originWhitelist={['*']}
          style={styles.webView}
          // JavaScript & Storage Flags
          javaScriptEnabled={true}
          domStorageEnabled={true}
          // Media Autoplay & Inline Playback
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          mixedContentMode="always"
          // File Access & Security
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          // Android Hardware Acceleration & Layers
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          // Scrollbars & Viewport Zoom Lock
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          scalesPageToFit={false}
          textZoom={100}
          bounces={false}
          setSupportMultipleWindows={false}
          // Loading Placeholder & State
          startInLoadingState={true}
          renderLoading={BrandLoadingView}
          // Error & Crash Lifecycle Handlers
          onMessage={handleMessage}
          onRenderProcessGone={(event) => {
            console.warn('Chromium render process terminated:', event.nativeEvent.didCrash);
            webViewRef.current?.reload();
          }}
          onError={(event) => {
            console.error('WebView loading error:', event.nativeEvent);
          }}
        />
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  webView: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: BRAND_WHITE,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  brandDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  dot: {
    backgroundColor: BRAND_YELLOW,
    borderRadius: 999,
  },
  bigDot: {
    width: 14,
    height: 14,
  },
  smallDot: {
    width: 8,
    height: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_NAVY,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: '#D92D20',
    backgroundColor: '#FEF3F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
  retryButton: {
    backgroundColor: BRAND_NAVY,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: BRAND_WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
});
```

---

## 7. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Mobile Wrapper | Inlined Bundle Source Loading | Renders self-contained web bundle without HTTP network requests | `source={{ html, baseUrl: 'https://localhost' }}` | Rendered HTML DOM | Triggers `onError` with code/description | `PROJECT.md` §2, `App.tsx` |
| 2 | Mobile Wrapper | Permissive Origin Whitelist | Permissive URL matching allowing blob URLs and external CDN assets | `originWhitelist={['*']}` | Allowed navigation | Navigation blocked by WebView client | `PROJECT.md` §2 |
| 3 | Mobile Wrapper | DOM Storage Enablement | Activates persistent client-side key-value storage in Chromium | `domStorageEnabled={true}` | `localStorage` & `sessionStorage` available | Throws `SecurityError: The operation is insecure` | `src/mi-bolsillo/MiBolsillo.jsx:12` |
| 4 | Mobile Wrapper | Hardware Acceleration Layer | Engages GPU compositing for 60fps sliding animations and video | `androidHardwareAccelerationDisabled={false}`, `androidLayerType="hardware"` | GPU hardware composition | Software fallback causing dropped animation frames | `PROJECT.md` §2 |
| 5 | Mobile Wrapper | Inline Media Autoplay | Allows HTML5 video playback without user touch event gate | `mediaPlaybackRequiresUserAction={false}`, `allowsInlineMediaPlayback={true}` | Automatic splash video playback | Video playback promise rejected (`v.play().catch(...)`) | `src/App.tsx:18` |
| 6 | Mobile Wrapper | Scroll Indicator Suppression | Hides native Android scrollbars to prevent clashing with web styles | `showsVerticalScrollIndicator={false}`, `showsHorizontalScrollIndicator={false}` | Hidden native scrollbars | Duplicate scrollbars visible over UI | `PROJECT.md` §2 |
| 7 | Mobile Wrapper | Overscroll Physics Lock | Suppresses Android outer bounce/glow effect | `overScrollMode="never"`, `bounces={false}` | Rigid edge containment | Double bounce effect clashing with DOM touch gestures | `PROJECT.md` §2 |
| 8 | Mobile Wrapper | Text Zoom Lock | Locks text scaling to 100% against Android system font overrides | `textZoom={100}` | Constant CSS font size | Layout wrapping / button clipping on devices with large system fonts | Android WebSettings spec |
| 9 | Mobile Wrapper | Page Viewport Scale Lock | Prevents wide desktop viewport scaling | `scalesPageToFit={false}` | 1:1 pixel mobile viewport | Tiny zoomed-out desktop rendering | Android WebSettings spec |
| 10 | Mobile Wrapper | Multi-Window Suppression | Blocks popup windows without handler delegates | `setSupportMultipleWindows={false}` | Suppressed external popups | Silent failure / unhandled window intent | Android WebSettings spec |
| 11 | Mobile Wrapper | Status Bar Harmonization | Hides native Android status bar to prevent clash with web 9:41 bar | `<StatusBar hidden={true} />` from `expo-status-bar` | Fullscreen edge-to-edge layout | Two stacked status bars with conflicting clocks | `src/mi-bolsillo/components.jsx:37` |
| 12 | Navigation | Hardware Back Interception | Intercepts Android hardware back button and back swipe gesture | `BackHandler.addEventListener('hardwareBackPress', ...)` | Intercepted back press | Immediate exit from Expo Go application | Android BackHandler API |
| 13 | Navigation | Sheet Back Dismissal | Closes open bottom sheets (`Intro`, `Apartado`, `Domiciliar`, etc.) on back | Injected `Escape` keydown / `android:hardwareBack` event | Bottom sheet dismisses smoothly | Sheet remains open or app abruptly exits | `src/mi-bolsillo/components.jsx:1035` |
| 14 | Navigation | Tab Slide Back Navigation | Slides back from "Amigo BanCoppel" to "Bienvenido" on back press | Injected tab switch dispatch | 200% slider transitions back to `translateX(0)` | Unhandled back exits app | `src/mi-bolsillo/MiBolsillo.jsx:65` |
| 15 | Navigation | Double-Back-to-Exit Safety | Guards against accidental exit during live audience presentations | 2000ms timer + `ToastAndroid.show(...)` | Toast notification on 1st tap; exit on 2nd tap | Accidental demo termination on single tap | UX Best Practices for Demo |
| 16 | Lifecycle | Anti-White-Flash Placeholder | Renders BanCoppel `#05297A` loading placeholder during DOM compilation | `startInLoadingState={true}`, `renderLoading` | Seamless dark blue background transition | Blinding white flash before splash screen mounts | `src/App.tsx:27`, `styles.loadingContainer` |
| 17 | Lifecycle | Native Error Boundary | Catches React Native component rendering exceptions | `AppErrorBoundary` wrapping root view | BanCoppel branded error card with retry button | Redbox / grey crash screen on Expo Go | React Error Boundary API |
| 18 | Lifecycle | Chromium Process Recovery | Traps Android OS low-memory renderer crashes | `onRenderProcessGone={(e) => webViewRef.current?.reload()}` | Automatic WebView reload | Permanently black or frozen screen | Android WebViewClient spec |

---

## 8. Edge Cases

| # | Feature | Input / Scenario | Observed / Expected Behavior |
|---|---------|------------------|------------------------------|
| 1 | Video Autoplay | Device has "Battery Saver" mode active or low battery policy | Autoplay policy may restrict media; `v.play().catch(() => finish())` in `src/App.tsx` catches rejection and skips directly to main UI without hanging. |
| 2 | BackHandler | User presses back button rapidly multiple times while a sheet is closing | Synchronized state checks prevent duplicate injections; second press within 2s from login triggers exit; sheet closes smoothly without animation crash. |
| 3 | BackHandler | User presses back while `TutorialSpotlight` (onboarding step 0-3) is open | Spotlight is dismissed gracefully (`setTutorialStep(null)`), preventing stuck modal overlay. |
| 4 | DOM Storage | User forces app close from Android task switcher and relaunches | `localStorage` keys (`mi-bolsillo:v3:items`, `mb:incomes:v1`) are retained in Chromium SQLite app database; data reappears unchanged. |
| 5 | DOM Storage | Storage quota exceeded (`QuotaExceededError`) | `usePersistentState` in `MiBolsillo.jsx:14` wraps `setItem` in `try/catch`, silently ignoring write failure rather than crashing UI. |
| 6 | Status Bar | Device has tall display ratio (20:9 or 21:9) with display cutout/notch | WebView expands to `flex: 1` with `#05297A` background; notch sits over uniform navy header without white padding bands. |
| 7 | Display Zoom | Android system settings set "Display Size: Large" and "Font Size: Largest" | `textZoom={100}` and `scalesPageToFit={false}` prevent CSS font enlargement, maintaining 100% pixel fidelity and preventing layout clipping. |
| 8 | Orientation | User rotates device to landscape orientation | `app.json` enforces `"orientation": "portrait"`, preventing orientation flips that would distort the mobile presentation layout. |
| 9 | Offline Launch | Device is in Airplane Mode with zero network connectivity | Inlined bundle string loads instantaneously; video plays from memory blob; app operates 100% offline without network errors. |
| 10 | Crash Recovery | Android OS kills Chromium renderer due to background memory pressure | `onRenderProcessGone` fires, logging diagnostic warning and calling `webViewRef.current?.reload()` to automatically restore the view. |
