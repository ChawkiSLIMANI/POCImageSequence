// TODO: Replace with your actual Firebase project configuration
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

/**
 * Class representing a sequence of images drawn onto a canvas
 */
class SequencePlayer {
    constructor(canvasId, totalFrames, folderPath, prefix) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.totalFrames = totalFrames;
        this.folderPath = folderPath;
        this.prefix = prefix;

        this.images = [];
        this.loadedFrames = 0;
        this.isLoaded = false;

        this.currentFrame = 0; // Float for interpolation
        this.targetFrame = 0;  // Int from DB
        this.playMode = 'lerp'; // 'lerp' (smooth ease) or 'linear' (constant speed)

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    preload(onComplete) {
        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            const frameNum = String(i).padStart(3, '0');
            img.src = `${this.folderPath}/${this.prefix}${frameNum}.jpg`;

            img.onload = () => {
                this.loadedFrames++;
                if (this.loadedFrames === this.totalFrames) {
                    this.isLoaded = true;
                    if (onComplete) onComplete();
                }
            };

            img.onerror = () => {
                console.error(`Failed to load image: ${this.folderPath}/${this.prefix}${frameNum}.jpg`);
                this.loadedFrames++; // Count errors too to avoid hanging
                if (this.loadedFrames === this.totalFrames) {
                    this.isLoaded = true;
                    if (onComplete) onComplete();
                }
            };

            this.images.push(img);
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.draw();
    }

    update() {
        if (!this.isLoaded) return;

        if (this.playMode === 'loop') {
            // Continuous Loop
            const speed = 0.5; // Adjust speed as needed
            this.currentFrame += speed;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }
            this.draw();
            requestAnimationFrame(() => this.update());
        } else if (this.playMode === 'linear') {
            // Constant speed playback (like a video)
            const speed = 0.8; // Frames per tick
            if (this.currentFrame < this.targetFrame) {
                this.currentFrame += speed;
                if (this.currentFrame > this.targetFrame) this.currentFrame = this.targetFrame;
                this.draw();
                requestAnimationFrame(() => this.update());
            } else if (this.currentFrame > this.targetFrame) {
                this.currentFrame -= speed;
                if (this.currentFrame < this.targetFrame) this.currentFrame = this.targetFrame;
                this.draw();
                requestAnimationFrame(() => this.update());
            }
        } else {
            // Default: 'lerp' (Easing)
            const speed = 0.05; // Ease factor
            // If distance is small enough (0.5), snap to target to avoid "crawling" pixels
            if (Math.abs(this.targetFrame - this.currentFrame) > 0.5) {
                this.currentFrame += (this.targetFrame - this.currentFrame) * speed;
                this.draw();
                requestAnimationFrame(() => this.update());
            } else {
                this.currentFrame = this.targetFrame;
                this.draw();
            }
        }
    }

    draw() {
        if (!this.isLoaded) {
            this.drawLoading();
            return;
        }

        // Background clear
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Round currentFrame to get nearest image index
        let index = Math.round(this.currentFrame);
        // Clamp index
        if (index < 0) index = 0;
        if (index >= this.totalFrames) index = this.totalFrames - 1;

        const img = this.images[index];
        if (img) {
            this.drawImageCover(img);
        }
    }

    drawLoading() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Loading... ${Math.floor((this.loadedFrames / this.totalFrames) * 100)}%`, this.canvas.width / 2, this.canvas.height / 2);
    }

    drawImageCover(img) {
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        if (!imgWidth || !imgHeight) return;

        const canvasRatio = canvasWidth / canvasHeight;
        const imgRatio = imgWidth / imgHeight;

        let scale;
        if (canvasWidth > canvasHeight && imgHeight > imgWidth) {
            scale = canvasHeight / imgHeight;
        } else {
            if (canvasRatio > imgRatio) {
                scale = canvasWidth / imgWidth;
            } else {
                scale = canvasHeight / imgHeight;
            }
        }

        const drawWidth = imgWidth * scale;
        const drawHeight = imgHeight * scale;
        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2;

        this.ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }
}

// --- Main Logic ---

// Configuration
const TOTAL_FRAMES = 193;
const MAX_LEVELS = 5; // Levels 0, 1, 2, 3, 4

// Instantiate Players
// Assuming assets are in 'assets/bg' and 'assets/poi'
// Adjust prefix if your files are named differently (e.g., 'frame_')
const bgPlayer = new SequencePlayer('canvas', TOTAL_FRAMES, 'assets/bg', 'frame_');
const poiPlayer = new SequencePlayer('canvas-poi', TOTAL_FRAMES, 'assets/poi', 'frame_');

// Init
bgPlayer.preload(() => {
    bgPlayer.playMode = 'loop';
    bgPlayer.update(); // Start looping immediately
    startListening();
});
poiPlayer.preload(); // Optional: only if we have separate POI assets

function startListening() {
    const statusRef = db.ref('status');
    const levelRef = db.ref('level');

    levelRef.on('value', (snapshot) => {
        const level = snapshot.val() || 0;
        console.log('Level update:', level);

        // POI Logic: Syncs with Level
        poiPlayer.playMode = 'lerp';

        // Map level to frame range
        // Level 0 -> Frame 0
        // Level 4 -> Frame TOTAL_FRAMES
        let target = (level / (MAX_LEVELS - 1)) * (TOTAL_FRAMES - 1);

        // ONLY update POI, leave BG looping
        poiPlayer.targetFrame = target;
        poiPlayer.update();
    });

    statusRef.on('value', (snapshot) => {
        const status = snapshot.val();
        console.log('Status update:', status);
        if (status === 'climax') {
            // Trigger climax behavior
            // BG continues looping (or we could speed it up?)
            // POI plays to end

            poiPlayer.playMode = 'linear';
            poiPlayer.targetFrame = TOTAL_FRAMES - 1;
            poiPlayer.update();

            setTimeout(() => {
                // Reset handled by controller
            }, 5000);
        }
    });
}
