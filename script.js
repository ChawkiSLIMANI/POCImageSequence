const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const totalFrames = 98;
const images = [];
let loadedFrames = 0;
let currentIndex = 0;
let isLoaded = false;

// Initialize
function init() {
    window.addEventListener('resize', resize);
    resize(); // Set initial size
    preload();
}

function preload() {
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(3, '0');
        img.src = `assets/frame_${frameNum}.jpg`;

        img.onload = () => {
            loadedFrames++;
            if (!isLoaded) {
                drawLoading();
            }
            if (loadedFrames === totalFrames) {
                isLoaded = true;
                draw(); // Draw first frame
            }
        };

        img.onerror = () => {
            console.error(`Failed to load image: assets/frame_${frameNum}.jpg`);
            // Still count it to avoid hanging, or handle error? 
            // Ideally we'd validata assets, but for now let's just count it so we don't get stuck at 99%
            loadedFrames++;
            if (loadedFrames === totalFrames) {
                isLoaded = true;
                draw();
            }
        }

        images.push(img);
    }
}

function drawLoading() {
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const percent = Math.floor((loadedFrames / totalFrames) * 100);
    ctx.fillText(`Loading... ${percent}%`, canvas.width / 2, canvas.height / 2);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (isLoaded) {
        requestAnimationFrame(draw);
    } else {
        drawLoading();
    }
}

function draw() {
    if (!isLoaded) return;

    // Background clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = images[currentIndex];
    if (img) {
        drawImageCover(ctx, img);
    }
}

function drawImageCover(ctx, img) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    if (!imgWidth || !imgHeight) return;

    // Calculate aspect ratios
    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = imgWidth / imgHeight;

    // Determine scale to cover
    let scale;
    if (canvasRatio > imgRatio) {
        // Canvas is wider than image (relative to height) -> fit width
        scale = canvasWidth / imgWidth;
    } else {
        // Canvas is taller than image (relative to width) -> fit height
        scale = canvasHeight / imgHeight;
    }

    // Calculate new dimensions
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Calculate centered position
    const x = (canvasWidth - drawWidth) / 2;
    const y = (canvasHeight - drawHeight) / 2;

    // Draw
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function nextFrame(e) {
    // Optional: prevent default if it's a touch event to specific behaviors
    // e.preventDefault(); 

    if (!isLoaded) return;

    currentIndex++;
    if (currentIndex >= totalFrames) {
        currentIndex = 0;
    }

    requestAnimationFrame(draw);
}

// Interaction
window.addEventListener('click', nextFrame);
window.addEventListener('touchstart', (e) => {
    // Prevent firing click event after touchstart on some devices to avoid double skip
    // But be careful not to block scroll if we needed it (overflow hidden though)
    // For this simple tap interaction, it's safer to just listen to one or dedup.
    // However, user ASKED for both. Let's debounce or checking timestamps if needed?
    // Actually, usually 'click' fires after 'touchstart' sequence.
    // Ideally we use pointer events, but user asked for click/touchstart.
    // Let's use preventDefault on touchstart to stop mouse emulation (click)
    e.preventDefault();
    nextFrame();
}, { passive: false });


// Start
init();
