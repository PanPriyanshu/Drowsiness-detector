// drowsiness detector – MediaPipe FaceMesh

const $ = (id) => document.getElementById(id);

const video = $("video");
const canvas = $("canvas");
const ctx = canvas.getContext("2d");

const startBtn = $("startBtn");
const stopBtn = $("stopBtn");
const resetBtn = $("resetBtn");
const earRange = $("earRange");
const secRange = $("secRange");
const earVal = $("earVal");
const secVal = $("secVal");
const statusEl = $("status");

let faceMesh, camera, alarm, closedStart = null, running = false;

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [263, 387, 385, 362, 380, 373];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function ear(landmarks, eye) {
  const [p1, p2, p3, p4, p5, p6] = eye.map(i => landmarks[i]);
  const v1 = dist(p2, p6), v2 = dist(p3, p5), h = dist(p1, p4);
  return h ? (v1 + v2) / (2 * h) : 0;
}

function startAlarm() {
  if (alarm) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    g.gain.value = 0.02;
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    alarm = { ac, osc, g };
  } catch (e) {
    console.log("alarm err", e);
  }
}

function stopAlarm() {
  if (!alarm) return;
  try {
    alarm.osc.stop();
    alarm.osc.disconnect();
    alarm.g.disconnect();
    alarm.ac.close && alarm.ac.close();
  } catch (e) {}
  alarm = null;
}

function initFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (f) =>
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" + f,
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  faceMesh.onResults(onResults);
}

function onResults(res) {
  if (!video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

  const faces = res.multiFaceLandmarks;
  if (faces && faces.length) {
    const lm = faces[0];

    window.drawConnectors(ctx, lm, FaceMesh.FACEMESH_TESSELATION, { lineWidth: 0.5 });
    window.drawLandmarks(ctx, lm, { lineWidth: 0.5 });

    const e = (ear(lm, LEFT_EYE) + ear(lm, RIGHT_EYE)) / 2;
    ctx.font = "16px Arial";
    ctx.fillStyle = "#00b894";
    ctx.fillText("EAR: " + e.toFixed(3), 10, 20);

    const now = performance.now();
    const thr = parseFloat(earRange.value);
    const alertSec = parseInt(secRange.value, 10);

    if (e < thr) {
      if (!closedStart) closedStart = now;
      const t = (now - closedStart) / 1000;
      statusEl.textContent = "Eyes closed: " + t.toFixed(1) + "s";
      if (t >= alertSec) {
        statusEl.textContent = "ALERT: Drowsy for " + t.toFixed(1) + "s";
        startAlarm();
      }
    } else {
      closedStart = null;
      stopAlarm();
      statusEl.textContent = "Eyes open";
    }
  } else {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#d97706";
    ctx.fillText("No face detected", 10, 20);
    statusEl.textContent = "No face detected";
    closedStart = null;
    stopAlarm();
  }

  ctx.restore();
}

async function startCamera() {
  if (running) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("getUserMedia not supported.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();

    camera = new Camera(video, {
      onFrame: async () => faceMesh && faceMesh.send({ image: video }),
      width: 640,
      height: 480,
    });
    camera.start();

    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = "Running";
  } catch (e) {
    console.error(e);
    alert("Could not start camera: " + (e.message || e));
  }
}

function stopCamera() {
  if (!running) return;
  running = false;

  try { camera && camera.stop(); } catch (e) {}
  camera = null;

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }

  stopAlarm();
  closedStart = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = "Stopped";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// events
earRange.oninput = () => (earVal.textContent = parseFloat(earRange.value).toFixed(2));
secRange.oninput = () => (secVal.textContent = secRange.value);
startBtn.onclick = startCamera;
stopBtn.onclick = stopCamera;
resetBtn.onclick = () => {
  earRange.value = 0.25;
  secRange.value = 15;
  earVal.textContent = "0.25";
  secVal.textContent = "15";
};

// init
initFaceMesh();
