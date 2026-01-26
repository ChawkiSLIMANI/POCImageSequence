// TODO: Replace with your actual Firebase project configuration
// MUST MATCH the config used in viewer/script.js
const firebaseConfig = {
    apiKey: "AIzaSyCbNbJBVD70hr2MXiXRmaaWbxPFalS0Pxw",
    authDomain: "sequence-explorer-d6f44.firebaseapp.com",
    databaseURL: "https://sequence-explorer-d6f44-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sequence-explorer-d6f44",
    storageBucket: "sequence-explorer-d6f44.firebasestorage.app",
    messagingSenderId: "538384897317",
    appId: "1:538384897317:web:62660986f029269db936cc",
    measurementId: "G-BNKQZH82QW"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const statusEl = document.getElementById('current-status');
const btn = document.getElementById('btn-action');

// Listen to current state to update UI
db.ref('level').on('value', (snapshot) => {
    const level = snapshot.val() || 0;
    statusEl.innerHTML = `Current Level: <b>${level}</b>`;
});

btn.addEventListener('click', () => {
    // Read current level once to increment it safely
    // Alternatively, we could use a transaction
    db.ref('level').once('value').then((snapshot) => {
        let currentLevel = snapshot.val() || 0;
        let nextLevel = currentLevel + 1;

        if (nextLevel >= 5) { // Assuming 4 is max "level" before climax
            // Trigger Climax
            db.ref('status').set('climax');
            statusEl.innerHTML = "Status: CLIMAX! Resetting in 5s...";

            // Disable button temporarily
            btn.disabled = true;

            setTimeout(() => {
                // Reset
                db.ref('level').set(0);
                db.ref('status').set('idle');
                btn.disabled = false;
            }, 5000);
        } else {
            // Normal Increment
            db.ref('level').set(nextLevel);
        }
    });
});
