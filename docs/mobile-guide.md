# Mobile Access Guide (PWA)

AgroGenesis AI is a Progressive Web App (PWA) that works natively on all platforms.

## Android (Chrome)

1. Open Chrome browser
2. Navigate to `https://your-domain.com` (or `http://your-ip:5173` on local network)
3. Tap the three-dot menu → "Add to Home Screen"
4. Confirm installation
5. App appears on home screen with full-screen mode

**Features:**
- Camera access for drone photo upload
- GPS location services
- Offline caching (service worker)

## iOS / iPhone (Safari)

1. Open Safari browser
2. Navigate to the dashboard URL
3. Tap the Share button (square with arrow)
4. Scroll down → "Add to Home Screen"
5. Name the app → tap "Add"
6. App appears on home screen

**Note:** iOS Safari requires HTTPS for full PWA features. Use a self-signed cert or Let's Encrypt for production.

## Windows (Edge/Chrome)

1. Open Edge or Chrome
2. Navigate to the dashboard URL
3. Click "Install" in the address bar (or three-dot menu → "Install App")
4. App opens in its own window
5. Pin to taskbar from Start menu

**Features:**
- Desktop notifications
- Full keyboard shortcuts
- Windowed application mode

## Camera Integration

The file upload component supports camera capture on mobile:
- **Android**: Opens rear camera by default
- **iOS**: Shows photo library and camera options

Use cases:
- Take photos of crop leaves for disease diagnosis
- Photograph weed infestations for identification
- Capture canopy images for NDVI calibration

## Network Requirements

- **First load**: Requires internet connection
- **Cached pages**: Available offline after first visit
- **API calls**: Require connection to backend server

For field use, consider setting up a local network with the backend running on a laptop or edge device.
