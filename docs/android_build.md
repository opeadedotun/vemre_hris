# Android Build Guidelines (Capacitor)

This guide outlines the steps to build and deploy the VEMRE HRIS application for Android using Ionic Capacitor.

## Prerequisites

1.  **Node.js & npm**: Ensure you have the latest stable versions installed.
2.  **Android Studio**: Download and install Android Studio. Ensure you have the Android SDK, Command Line Tools, and a virtual device (Emulator) or a physical device ready.
3.  **Capacitor CLI**: Usually included in the project dependencies, but can be run via `npx`.

## Step-by-Step Build Process

### 1. Build the Frontend
First, create a production build of the React application.
```bash
cd frontend
npm run build
```
This will create a `dist` (or `build`) folder containing the static assets.

### 2. Initialize Capacitor (First Time Only)
If Capacitor is not yet initialized in the project:
```bash
npx cap init "Vemre HRIS" "com.vemre.hris" --web-dir dist
```

### 3. Add Android Platform
```bash
npx cap add android
```

### 4. Sync the Web Assets
Whenever you make changes to the React code and run `npm run build`, you must sync the files to the Android project:
```bash
npx cap copy android
npx cap sync android
```

### 5. Open in Android Studio
Launch Android Studio to compile the native code and generate the APK/AAB:
```bash
npx cap open android
```

### 6. Build APK in Android Studio
1.  Wait for Gradle to finish syncing.
2.  Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Once finished, a notification will appear with a link to "Locate" the APK.

## Configuration Fixes for API Access

Since the Android app runs on a different internal origin, ensure your Django `CORS_ALLOWED_ORIGINS` includes the Capacitor scheme if necessary, or use `CORS_ALLOW_ALL_ORIGINS = True` for testing.

Update your `frontend/.env` (or equivalent) to use the production IP/domain of the backend server instead of `localhost`.

---
**Vemre HRIS · Mobile Deployment Team**
