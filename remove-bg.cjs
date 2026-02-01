const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'knight_sprite.png');
const outputPath = path.join(__dirname, 'public', 'knight_transparent.png');

async function removeBackground() {
    const image = sharp(inputPath);
    const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    // Replace light gray/white pixels with transparent
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is light (grayish/white background), make it transparent
        if (r > 180 && g > 180 && b > 180) {
            data[i + 3] = 0; // Set alpha to 0
        }
    }

    await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    }).png().toFile(outputPath);

    console.log('Background removed! Saved to knight_transparent.png');
}

removeBackground().catch(console.error);
