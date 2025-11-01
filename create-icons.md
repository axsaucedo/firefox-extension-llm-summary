# Icon Creation Instructions

Since we cannot directly create PNG files in this development environment, you'll need to create the icon files manually. Here are the instructions:

## Method 1: Using Online SVG to PNG Converter

1. Copy the content from `popup/icons/icon.svg`
2. Go to an online SVG to PNG converter (e.g., https://convertio.co/svg-png/)
3. Convert the SVG to PNG at the following sizes:
   - 16x16 pixels → save as `popup/icons/icon-16.png`
   - 32x32 pixels → save as `popup/icons/icon-32.png`
   - 48x48 pixels → save as `popup/icons/icon-48.png`
   - 128x128 pixels → save as `popup/icons/icon-128.png`

## Method 2: Using Command Line (if you have ImageMagick installed)

```bash
cd popup/icons/

# Convert SVG to different PNG sizes
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

## Method 3: Using Node.js (if you have sharp installed)

```bash
npm install sharp

# Create a script to convert icons
node -e "
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 48, 128];
const svgBuffer = fs.readFileSync('popup/icons/icon.svg');

sizes.forEach(size => {
  sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(\`popup/icons/icon-\${size}.png\`)
    .then(() => console.log(\`Created icon-\${size}.png\`))
    .catch(err => console.error(err));
});
"
```

## Temporary Solution

If you want to test the extension immediately without icons, you can:

1. Create simple colored square PNG files as placeholders
2. Or remove the icon references from manifest.json temporarily
3. The extension will work without icons, just won't have a custom icon

The extension functionality is complete and will work once the icons are created or the icon references are removed from the manifest.