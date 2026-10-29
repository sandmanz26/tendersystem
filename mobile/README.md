# Kru mobile (React Native)

The native version of Kru, the field crew app for wedding organizers. It has the same features, data and design as the web prototype in the repo root, built with **React Native 0.77.2** and **TypeScript**.

It is still front-end only: mock data, and state saved on the phone with AsyncStorage.

## Versions

| | Version |
|---|---|
| React Native | 0.77.2 (initialised with `@react-native-community/cli init Kru --version 0.77.2`) |
| React | 18.3.1 |
| TypeScript | 5.0.4 (`@react-native/typescript-config`, strict) |
| Architecture | New Architecture on, Hermes on |
| Navigation | @react-navigation/native 7.1.6, native-stack 7.3.10, bottom-tabs 7.3.10 |
| Camera / QR | react-native-vision-camera 4.6.4 (built-in `useCodeScanner`) |
| Photos | react-native-image-picker 8.2.0 |
| Storage | @react-native-async-storage/async-storage 2.1.2 |
| Network | @react-native-community/netinfo 11.4.1 |
| Drawing | react-native-svg 15.11.2 (manifest grid hatch, signature) |
| Icons | lucide-react-native 0.475.0 |

All dependency versions are pinned exactly.

## Run

Requirements: Node 18+, plus the Android SDK/JDK 17 or Xcode 16 with CocoaPods. See the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment).

```bash
cd mobile
npm install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios

# Android
npm run android
```

The camera needs a real device; on a simulator the scanner says "No camera found" and you type the code from the label instead.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (@react-native config)
npm test            # jest: scan validation, phase gates, whereabouts, offline queue, every screen renders
```

## Structure

```
App.tsx                  SafeArea → Toast → AppStore → navigation
src/
  core/                  shared with the web app: types, phases, mock data, progress, whereabouts, rundown, format
  core/scan.ts           scan validation as one pure function (8 outcomes)
  store.tsx              state, actions, AsyncStorage persistence, NetInfo + offline queue
  theme.ts               colour, radius, type tokens (same accent-ladder palette as the web)
  navigation.tsx         tabs (Events, Items, Scan, Reports, Profile) + stack; typed params
  screens/               Home, EventDetail, Scanner, ScanPicker, Inventory, ItemDetail, Reports, ReportDetail, NewReport, Profile
  ui/                    primitives, domain components (ManifestGrid, PhaseTrack, rows), sheets, signature pad, toast
__tests__/               jest tests
jest/setup.js            mocks for the native modules
```

## How it differs from the web prototype

| | Web | Mobile |
|---|---|---|
| Scanning | `BarcodeDetector` (Chrome Android only) | VisionCamera code scanner (QR, Code 128, Code 39, EAN-13) on iOS and Android |
| Haptics | `navigator.vibrate` | `Vibration` |
| Photos | `<input type=file>`, compressed to a JPEG data URL | image-picker, downscaled to 960 px; the file URI is stored |
| Signature | Canvas → PNG data URL | SVG path data plus pad size |
| Online state | `online` / `offline` events | NetInfo (`isConnected` and `isInternetReachable`) |
| Storage | `localStorage` key `kru:state:v3` | AsyncStorage key `kru:state:v1` |
| Leave a half-written report | Dialog | `usePreventRemove` + Alert (covers the back gesture and the Android back button) |
| Font | DM Sans + Geist Mono | System font; Menlo / monospace for asset codes |

## Permissions

- **Android** (`AndroidManifest.xml`): `CAMERA`, `VIBRATE`, `ACCESS_NETWORK_STATE`; portrait only. `VisionCamera_enableCodeScanner=true` in `gradle.properties` turns on the ML Kit code scanner.
- **iOS** (`Info.plist`): `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`; portrait only.

If the camera permission is denied, the scanner opens Settings with a hint to type the code meanwhile, and the photo picker asks before opening Settings.

## Verified here, and not

The app was built in a container with no Android SDK or Xcode, so it has **not been run on a device or simulator yet**. What was checked:

- `tsc --noEmit` with no errors and `eslint` with no warnings.
- Jest: 33 tests pass. They cover every scan outcome, phase gates, whereabouts, and the offline queue, and they open every screen and tab (including missing ids) without errors.
- `react-native bundle --dev false` succeeds for both android and ios (about 3.2 MB of JS each, before Hermes bytecode compilation).

The first run on a device should check the camera scanner, the signature pad gesture inside the sheet, and the photo picker.
