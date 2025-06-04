const fs = require('fs')
const path = require('path')

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Simple SVG icon for MealAppeal
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#f97316"/>
  <circle cx="256" cy="200" r="80" fill="white"/>
  <path d="M176 280 Q256 360 336 280" stroke="white" stroke-width="20" fill="none"/>
</svg>
`

// Save SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon)

// Create placeholder PNGs (in production, you'd generate these from the SVG)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
sizes.forEach(size => {
  // For now, we'll use the same SVG content as a placeholder
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), 'PNG placeholder')
})

console.log('✅ Icons directory created with placeholder files!')
console.log('📁 Created in: public/icons/')
console.log('Note: In production, you should generate proper PNG files from your logo.')
