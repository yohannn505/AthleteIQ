# AthleteIQ 
**AI-Driven Biometric Platform for Injury Prevention & Performance**

AthleteIQ is a high-performance mobile application built with **React Native** and **Firebase**. It serves as a digital "AI Coach" by analyzing athlete workload metrics to identify fatigue patterns and mitigate injury risk before it happens.

## Technical Stack
* **Frontend:** React Native (Expo) with TypeScript for type-safe development.
* **Backend:** Firebase (Firestore) for real-time biometric data synchronization.
* **Logic:** Custom heuristic engine to calculate workload ratios.
* **UI/UX:** Specialized dashboards for both Athletes (tracking) and Coaches (monitoring).

## Key Features
* **Injury Risk Scoring:** Uses biometric inputs to generate a color-coded risk assessment (Low, Moderate, High).
* **Heuristic AI Coaching:** Provides automated, data-backed training recommendations based on daily recovery scores.
* **Real-time Analytics:** Interactive charts showing workload trends over time.

## Project Structure
* `app/`: Core navigation and screen logic.
* `firebaseConfig.ts`: Secure configuration for cloud database services.
* `utils/`: Reusable logic for biometric calculations and data formatting.

## Installation & Setup
1. Clone the repository: `git clone https://github.com/yohannn505/AthleteIQ.git`
2. Install dependencies: `npm install`
3. Start the development server: `npx expo start`
