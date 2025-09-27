# BizQ Unified Layout System
**Simple JSON Configuration for All Major Layouts**

---

## Core Concept: Container + Direction + Spacing

Instead of separate "column_list" and "row" types, use a single **container** with a **direction** property:

```json
{
  "type": "container",
  "layout": {
    "direction": "horizontal",  // or "vertical"
    "gap": 20,                  // pixels between items
    "wrap": true,               // allow wrapping
    "align": "start"            // alignment
  },
  "children": [...]
}
```

---

## The Universal Layout Primitives

### 1. Container (Replaces column_list, rows, etc.)

```json
{
  "type": "container",
  "layout": {
    "direction": "horizontal" | "vertical",
    "gap": 0-100,
    "padding": 0-100,
    "wrap": true | false,
    "align": "start" | "center" | "end" | "stretch",
    "justify": "start" | "center" | "end" | "between" | "around"
  },
  "children": [
    {
      "type": "block",
      "size": "1" | "2" | "3" | "auto" | "300px" | "30%",
      "content": {...}
    }
  ]
}
```

### 2. Size System (Simple but Powerful)

Instead of width_ratio, use intuitive size values:

```json
{
  "size": "1"     // Equal share (like flex: 1)
  "size": "2"     // Twice the space of "1"
  "size": "auto"  // Content width
  "size": "300px" // Fixed pixel width
  "size": "30%"   // Percentage of parent
}
```

---

## Common Layouts Made Simple

### Two-Column Layout (60/40)
```json
{
  "type": "container",
  "layout": { "direction": "horizontal", "gap": 20 },
  "children": [
    { "size": "3", "content": {...} },  // 3 units
    { "size": "2", "content": {...} }   // 2 units = 60/40 split
  ]
}
```

### Dashboard Grid
```json
{
  "type": "container",
  "layout": { 
    "direction": "horizontal", 
    "wrap": true,
    "gap": 20 
  },
  "children": [
    { "size": "300px", "content": {...} },  // Fixed width cards
    { "size": "300px", "content": {...} },
    { "size": "300px", "content": {...} },
    { "size": "300px", "content": {...} }   // Auto-wraps to next row
  ]
}
```

### Sidebar Layout
```json
{
  "type": "container",
  "layout": { "direction": "horizontal" },
  "children": [
    { "size": "250px", "content": {...} },  // Fixed sidebar
    { "size": "1", "content": {...} }       // Flexible main content
  ]
}
```

### Holy Grail Layout (Header/Sidebar/Content/Footer)
```json
{
  "type": "container",
  "layout": { "direction": "vertical" },
  "children": [
    { "size": "60px", "content": "header" },
    {
      "type": "container",
      "size": "1",  // Takes remaining space
      "layout": { "direction": "horizontal" },
      "children": [
        { "size": "200px", "content": "sidebar" },
        { "size": "1", "content": "main" },
        { "size": "200px", "content": "aside" }
      ]
    },
    { "size": "60px", "content": "footer" }
  ]
}
```

---

## Responsive Design Built-In

### Breakpoint System
```json
{
  "type": "container",
  "layout": { 
    "direction": "horizontal",
    "responsive": {
      "mobile": { "direction": "vertical" },     // Stack on mobile
      "tablet": { "wrap": true },                // Wrap on tablet
      "desktop": { "direction": "horizontal" }   // Side-by-side on desktop
    }
  }
}
```

### Smart Defaults
```json
{
  "type": "container",
  "layout": { 
    "direction": "horizontal",
    "stack": "mobile"  // Automatically stacks on mobile
  }
}
```

---

## Advanced Features (Still Simple)

### 1. Nested Grids (No Restrictions)
```json
{
  "type": "container",
  "layout": { "direction": "horizontal" },
  "children": [
    {
      "type": "container",
      "size": "1",
      "layout": { "direction": "vertical", "gap": 10 },
      "children": [
        { "content": "nested item 1" },
        { "content": "nested item 2" }
      ]
    }
  ]
}
```

### 2. Aspect Ratio Containers
```json
{
  "type": "container",
  "layout": { 
    "aspect": "16:9",  // Maintains aspect ratio
    "direction": "horizontal"
  }
}
```

### 3. Sticky Positioning
```json
{
  "type": "container",
  "layout": { 
    "sticky": "top",    // Sticks to top when scrolling
    "offset": 20        // 20px from top
  }
}
```

---

## Visual Builder Interface

Users don't write JSON - they use visual tools:

### Drag Operations:
- **Drag next to** → Creates horizontal container
- **Drag below** → Creates vertical container  
- **Drag between** → Inserts in existing container
- **Drag corner** → Resizes (updates size property)

### Quick Actions:
- **Click divider** → Adjust gap
- **Double-click container** → Toggle direction
- **Right-click** → Size presets menu
- **Shift-drag** → Duplicate with same size

---

## BizQ-Specific Enhancements

### Executable Containers
```json
{
  "type": "container",
  "layout": { "direction": "horizontal" },
  "triggers": {
    "onResize": "task://recalculate_dashboard",
    "onReorder": "api://save_layout"
  },
  "children": [
    {
      "size": "1",
      "content": {
        "type": "cash_flow_monitor",
        "executable": true,
        "refresh": "realtime"
      }
    }
  ]
}
```

### Data-Driven Layouts
```json
{
  "type": "container",
  "layout": { 
    "direction": "horizontal",
    "repeat": "api://get_active_projects"  // Dynamically creates children
  },
  "template": {
    "size": "300px",
    "content": {
      "type": "project_card",
      "bind": "${project}"  // Each iteration gets project data
    }
  }
}
```

---

## Why This Is Better Than Notion

### Notion's Limitations:
- Separate types for columns vs other layouts
- Width ratios must sum to 1.0
- Can't nest columns
- No responsive control
- Fixed padding

### BizQ's Unified System:
- One container type for everything
- Intuitive size units (1, 2, 3 or px, %)
- Infinite nesting
- Built-in responsive
- Customizable spacing

---

## Implementation Simplicity

### CSS Translation
The JSON maps directly to CSS:

```javascript
function renderContainer(config) {
  return {
    display: 'flex',
    flexDirection: config.layout.direction,
    gap: `${config.layout.gap}px`,
    flexWrap: config.layout.wrap ? 'wrap' : 'nowrap',
    alignItems: config.layout.align,
    justifyContent: config.layout.justify
  };
}

function renderChild(config) {
  if (config.size === 'auto') return { flex: '0 0 auto' };
  if (config.size.includes('px')) return { flex: `0 0 ${config.size}` };
  if (config.size.includes('%')) return { flex: `0 0 ${config.size}` };
  return { flex: config.size };  // "1", "2", "3" etc.
}
```

---

## Migration from Notion

### Notion Column List:
```json
{
  "type": "column_list",
  "children": [
    { "type": "column", "width_ratio": 0.6 },
    { "type": "column", "width_ratio": 0.4 }
  ]
}
```

### BizQ Equivalent:
```json
{
  "type": "container",
  "layout": { "direction": "horizontal" },
  "children": [
    { "size": "3" },  // 3 of 5 units = 60%
    { "size": "2" }   // 2 of 5 units = 40%
  ]
}
```

---

## Complete Layout Examples

### E-commerce Dashboard
```json
{
  "type": "container",
  "layout": { "direction": "vertical", "gap": 20 },
  "children": [
    {
      "comment": "Header metrics row",
      "type": "container",
      "layout": { "direction": "horizontal", "gap": 15 },
      "children": [
        { "size": "1", "content": { "type": "revenue_card" } },
        { "size": "1", "content": { "type": "orders_card" } },
        { "size": "1", "content": { "type": "visitors_card" } },
        { "size": "1", "content": { "type": "conversion_card" } }
      ]
    },
    {
      "comment": "Main content area",
      "type": "container",
      "layout": { "direction": "horizontal", "gap": 20 },
      "children": [
        {
          "comment": "Left column - charts",
          "size": "2",
          "type": "container",
          "layout": { "direction": "vertical", "gap": 15 },
          "children": [
            { "content": { "type": "sales_chart" } },
            { "content": { "type": "inventory_status" } }
          ]
        },
        {
          "comment": "Right column - activities",
          "size": "1",
          "type": "container",
          "layout": { "direction": "vertical", "gap": 15 },
          "children": [
            { "content": { "type": "recent_orders" } },
            { "content": { "type": "task_queue" } }
          ]
        }
      ]
    }
  ]
}
```

---

## Advantages

1. **One concept to learn**: Everything is a container with direction
2. **Intuitive sizing**: Use 1,2,3 for proportions or px/% for fixed
3. **No restrictions**: Nest anything, anywhere
4. **Responsive built-in**: Not an afterthought
5. **Maps to modern CSS**: Direct flexbox translation
6. **Executable blocks**: BizQ's business logic integration

This system gives users Notion's simplicity while enabling any layout imaginable.