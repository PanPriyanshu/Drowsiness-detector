Drowsiness Detector (Browser Based)

This is a small browser project that detects drowsiness using the webcam.
It uses MediaPipe FaceMesh to track eye landmarks and calculates EAR (Eye Aspect Ratio).
If your eyes stay closed for too long, the app plays a loud alarm.

🚀 Features

Works directly in the browser

Real-time eye tracking

EAR-based drowsiness detection

Adjustable EAR threshold

Adjustable alert timer (3–30 seconds)

Alarm sound when eyes remain closed

No backend required

📦 Files
index.html
styles.css
app.js

▶️ How to Run (Important!)

Browsers don’t allow webcam usage on file://
So you MUST run it using a local server.

Option 1: Using Python
python3 -m http.server


Then open:

http://localhost:8000

Option 2: VS Code Live Server

Right–click index.html → Open with Live Server

🛠 How It Works (Simple Explanation)

FaceMesh detects 468 face points

6 points around each eye are used

EAR (Eye Aspect Ratio) is calculated every frame

If EAR < threshold → eyes are closing

If eyes stay closed longer than alert time → alarm triggers

💡 Use Cases

Driver drowsiness warning

Study focus tool

Simple AI vision demo

✨ Notes

Works best on Chrome

Make sure webcam permission is allowed

Keep sufficient lighting
