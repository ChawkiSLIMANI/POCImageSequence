const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const totalFrames = 192;
const images = [];
let loadedFrames = 0;
let currentIndex = 0;
let isLoaded = false;
let isPlaying = false;
let animationId = null;

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

    // Determine scale
    let scale;

    // Desktop Layout Check: 
    // If canvas is wider than it is tall (Landscape/Desktop)
    // AND Image is taller than it is wide (Portrait Asset)
    // FORCE "Fit Height" (contain vertical)
    if (canvasWidth > canvasHeight && imgHeight > imgWidth) {
        scale = canvasHeight / imgHeight;
    }
    // Otherwise use standard COVER logic (Mobile or unexpected landscape images)
    else {
        if (canvasRatio > imgRatio) {
            scale = canvasWidth / imgWidth;
        } else {
            scale = canvasHeight / imgHeight;
        }
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

function nextFrame() {
    if (!isLoaded) return;

    currentIndex++;
    if (currentIndex >= totalFrames) {
        currentIndex = 0;
    }
    draw();
}

function startPlaying(e) {
    if (e.type === 'touchstart') e.preventDefault();
    if (!isLoaded || isPlaying) return;

    isPlaying = true;
    playLoop();
}

function stopPlaying(e) {
    // if (e.type === 'touchend') e.preventDefault(); // Don't block default here usually
    isPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function playLoop() {
    if (!isPlaying) return;

    nextFrame(); // Advance one frame
    animationId = requestAnimationFrame(playLoop);
}

// Interaction - Hold to Play
window.addEventListener('mousedown', startPlaying);
window.addEventListener('touchstart', startPlaying, { passive: false });

window.addEventListener('mouseup', stopPlaying);
window.addEventListener('mouseleave', stopPlaying);
window.addEventListener('touchend', stopPlaying);

// Keep click for single step? User asked for hold. 
// Usually click handles short start/stop. 
// With mousedown starting it, a short click is just a short play.
// So we don't need a separate 'click' listener unless we want distinct behavior.
// Current logic: mousedown starts loop, mouseup stops it. A fast click advances a few frames.

// Start
init();
