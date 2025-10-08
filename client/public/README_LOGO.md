# Logo Setup Instructions

## Adding Your PNG Logo

1. **Place your logo file** in this directory (`client/public/`)
2. **Name it** `logo.png`
3. **Recommended specifications:**
   - Format: PNG with transparency
   - Size: 64x64 pixels or larger
   - Background: Transparent (so it works with the black background)
   - Content: Shopping cart icon matching your design

## Current Setup

The splash screen is configured to:
- Load `/logo.png` from the public directory
- Display it at 64x64 pixels (w-16 h-16)
- Fall back to SVG if the PNG fails to load
- Maintain the black background and shadow effects

## File Structure

```
client/public/
├── logo.png          # Your logo file (add this)
└── README_LOGO.md    # This instruction file
```

Once you add the `logo.png` file, the splash screen will automatically use it instead of the SVG fallback.
