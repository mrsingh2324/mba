# Self-MBA Tracker

This project has a Mongo-backed Express API and an Expo Go mobile app for tracking the 12-month Self-MBA learning plan from the PDF.

## Run the API

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000` and uses `MONGODB_URI` from `.env` or defaults to `mongodb://127.0.0.1:27017/self_mba_tracker`.

## Run the Expo Go App

Install the mobile dependencies:

```bash
npm run mobile:install
```

Create `mobile/.env` from `mobile/.env.example` and set your computer LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

Then start Expo:

```bash
npm run mobile
```

Scan the QR code with Expo Go. Your phone and computer need to be on the same Wi-Fi network.
