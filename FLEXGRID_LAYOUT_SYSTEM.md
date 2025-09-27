# BizQ FlexGrid Layout System
**Just Use CSS Flexbox and Grid - Don't Reinvent the Wheel**

---

## Core Insight: CSS Already Solved This

Instead of creating our own layout system, just expose CSS Flexbox and Grid properties directly in JSON:

```json
{
  "type": "flex",
  "style": {
    "display": "flex",
    "flexDirection": "row",
    "gap": "20px",
    "justifyContent": "space-between",
    "alignItems": "center",
    "flexWrap": "wrap"
  },
  "children": [
    {
      "style": { "flex": "1" },
      "content": {...}
    }
  ]
}
```

---

## Two Layout Types: Flex and Grid

### 1. Flex Container (90% of use cases)
```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row" | "column",
    "gap": "20px",
    "justifyContent": "start" | "center" | "end" | "space-between" | "space-around",
    "alignItems": "start" | "center" | "end" | "stretch",
    "flexWrap": "nowrap" | "wrap"
  },
  "children": [
    {
      "style": { 
        "flex": "1" | "2" | "0 0 300px",
        "alignSelf": "start" | "center" | "end"
      },
      "content": {...}
    }
  ]
}
```

### 2. Grid Container (Complex layouts)
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "200px 1fr 200px",  // Sidebar, content, aside
    "gridTemplateRows": "60px 1fr 60px",       // Header, content, footer
    "gap": "20px",
    "gridTemplateAreas": `
      "header header header"
      "sidebar main aside"
      "footer footer footer"
    `
  },
  "children": [
    {
      "style": { "gridArea": "header" },
      "content": {...}
    },
    {
      "style": { "gridArea": "main" },
      "content": {...}
    }
  ]
}
```

---

## Why This Is Better

### 1. **Zero Learning Curve for Developers**
Developers already know CSS. They can immediately understand and modify:
```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row",
    "gap": "1rem"
  }
}
```

### 2. **Complete Power of CSS**
No artificial limitations. Want a complex grid? Just use it:
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "repeat(auto-fit, minmax(300px, 1fr))"
  }
}
```

### 3. **Direct 1:1 Mapping**
JSON → CSS with no translation layer:
```javascript
function renderLayout(config) {
  // Literally just apply the style object
  return <div style={config.style}>{children}</div>;
}
```

---

## Common Patterns (Pre-built Templates)

### Two-Column Layout (60/40)
```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row",
    "gap": "20px"
  },
  "children": [
    { "style": { "flex": "3" }, "content": "Main" },
    { "style": { "flex": "2" }, "content": "Sidebar" }
  ]
}
```

### Dashboard Grid
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "repeat(auto-fit, minmax(250px, 1fr))",
    "gap": "20px"
  },
  "children": [
    { "content": "Card 1" },
    { "content": "Card 2" },
    { "content": "Card 3" },
    { "content": "Card 4" }
  ]
}
```

### Holy Grail Layout
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "200px 1fr 200px",
    "gridTemplateRows": "auto 1fr auto",
    "gridTemplateAreas": `
      "header header header"
      "nav main aside"
      "footer footer footer"
    `,
    "minHeight": "100vh",
    "gap": "0"
  },
  "children": [
    { "style": { "gridArea": "header" }, "content": "Header" },
    { "style": { "gridArea": "nav" }, "content": "Nav" },
    { "style": { "gridArea": "main" }, "content": "Main" },
    { "style": { "gridArea": "aside" }, "content": "Aside" },
    { "style": { "gridArea": "footer" }, "content": "Footer" }
  ]
}
```

---

## Visual Builder (For Non-Developers)

The visual builder generates standard CSS properties:

### Drag Operations → CSS Generation
- **Drag next to**: Creates flex row
- **Drag below**: Creates flex column
- **Drag to grid**: Snaps to grid cell
- **Resize**: Updates flex or grid values

### Property Panels
```yaml
Flex Container:
  Direction: [Row ▼] [Column]
  Wrap: [No Wrap ▼] [Wrap]
  Justify: [Start ▼] [Center] [End] [Space Between]
  Align: [Stretch ▼] [Start] [Center] [End]
  Gap: [____20px]

Grid Container:
  Columns: [____200px 1fr 200px]
  Rows: [____auto 1fr auto]
  Gap: [____20px]
  Areas: [Visual Grid Editor]

Child Properties:
  Flex: [____1]  or  [Fixed: ____300px]
  Align Self: [Auto ▼] [Start] [Center] [End]
  Grid Area: [____main]
```

---

## Responsive Design (Standard CSS)

```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row",
    "gap": "20px"
  },
  "responsive": {
    "@media (max-width: 768px)": {
      "flexDirection": "column"
    }
  }
}
```

Or use CSS Grid's built-in responsiveness:
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "repeat(auto-fit, minmax(300px, 1fr))"
  }
}
```

---

## BizQ Enhancements (On Top of CSS)

### 1. Executable Layouts
```json
{
  "type": "flex",
  "style": { "flexDirection": "row", "gap": "20px" },
  "actions": {
    "onResize": "task://recalculate_dashboard",
    "onReorder": "api://save_layout"
  }
}
```

### 2. Data-Driven Grids
```json
{
  "type": "grid",
  "style": {
    "gridTemplateColumns": "repeat(auto-fill, minmax(200px, 1fr))"
  },
  "dataSource": "api://get_products",
  "template": {
    "content": { 
      "type": "product_card",
      "bind": "${product}"
    }
  }
}
```

### 3. Smart Defaults
```json
{
  "type": "flex",
  "preset": "dashboard",  // Applies common dashboard styles
  "style": {
    // Override preset as needed
    "gap": "30px"
  }
}
```

---

## Migration Path

### For Developers
They already know this:
```css
.container {
  display: flex;
  flex-direction: row;
  gap: 20px;
}
```

Maps directly to:
```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row",
    "gap": "20px"
  }
}
```

### For Non-Developers
Visual builder with presets:
- "Two Column"
- "Three Column"
- "Sidebar Layout"
- "Card Grid"
- "Dashboard"

They never see CSS but it's CSS underneath.

---

## Implementation

```typescript
function renderBlock(block: BlockConfig) {
  // For flex/grid blocks, just pass through the styles
  if (block.type === 'flex' || block.type === 'grid') {
    return (
      <div 
        style={block.style}
        className={block.className}
      >
        {block.children?.map(child => renderBlock(child))}
      </div>
    );
  }
  
  // For content blocks, render the component
  return <BlockComponent {...block} />;
}
```

That's it. No custom layout engine needed.

---

## Advantages

1. **Industry Standard**: CSS Flexbox/Grid are THE standards
2. **Well Documented**: Thousands of tutorials already exist
3. **Powerful**: Handles any layout imaginable
4. **Future Proof**: CSS evolves, we automatically get new features
5. **Developer Friendly**: They already know it
6. **No Translation Layer**: JSON maps directly to CSS
7. **Browser Optimized**: Native browser layout engines
8. **Dev Tools Work**: Inspect element shows familiar CSS

---

## The Pitch

"BizQ uses standard CSS Flexbox and Grid for layouts. If you know CSS, you already know BizQ layouts. If you don't, our visual builder creates the CSS for you. Either way, you get the full power of modern CSS with no proprietary layout system to learn."

Why create a proprietary system when CSS already solved it perfectly?