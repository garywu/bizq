# Notion Layout System Analysis
**Technical Implementation of Notion's Template Layout**

---

## Core Layout Mechanism

Notion uses a **block-based architecture** where layout is achieved through:

1. **Drag-and-Drop Positioning**: Blocks dragged next to each other automatically create columns
2. **Column Blocks**: Explicit column containers with configurable width ratios
3. **No CSS/Flexbox**: Uses React-generated inline styles, not traditional CSS layout
4. **Mobile Stacking**: Columns automatically stack vertically on mobile (no column support yet)

---

## JSON Structure for Layouts

### Basic Column Structure

```json
// Parent container for columns
{
  "type": "column_list",
  "column_list": {},
  "children": [
    {
      "type": "column",
      "column": {
        "width_ratio": 0.6  // 60% width
      },
      "children": [
        // Content blocks go here
      ]
    },
    {
      "type": "column", 
      "column": {
        "width_ratio": 0.4  // 40% width
      },
      "children": [
        // Content blocks go here
      ]
    }
  ]
}
```

### Key Layout Rules

1. **Column List Requirements**:
   - Must have at least 2 columns
   - Each column must have at least 1 child
   - Width ratios should sum to 1.0

2. **Nesting Limitations**:
   - Cannot create columns within columns directly
   - Workaround: Use toggle blocks to wrap nested columns

3. **Preset Constraints**:
   - Default padding between columns (not customizable)
   - Native UI limits to 2-5 columns
   - 6+ columns require nested 3x2 method

---

## Layout Creation Methods

### Method 1: Native Columns Feature
```
Type "/" → Select "Columns" → Choose 2-5 columns
```
Creates preset column_list with equal-width columns

### Method 2: Drag-and-Drop
```
Drag block → Hover next to another block → Drop when blue line appears
```
Automatically creates column_list parent with column children

### Method 3: Advanced 6+ Columns (3x2 Method)
```json
{
  "type": "column_list",
  "children": [
    {
      "type": "column",
      "children": [
        {
          "type": "column_list",  // Nested column list
          "children": [
            { "type": "column" },  // Sub-column 1
            { "type": "column" }   // Sub-column 2
          ]
        }
      ]
    },
    // Repeat for 3 main columns = 6 total
  ]
}
```

---

## How Templates Define Layout

### Template Structure Example

```json
{
  "template_name": "Project Dashboard",
  "root_block": {
    "type": "page",
    "children": [
      {
        "type": "heading_1",
        "text": "Project Overview"
      },
      {
        "type": "column_list",
        "children": [
          {
            "type": "column",
            "width_ratio": 0.7,
            "children": [
              {
                "type": "database",
                "database_type": "kanban",
                "properties": {
                  "Status": ["To Do", "In Progress", "Done"]
                }
              }
            ]
          },
          {
            "type": "column", 
            "width_ratio": 0.3,
            "children": [
              {
                "type": "callout",
                "icon": "📊",
                "text": "Metrics"
              },
              {
                "type": "numbered_list",
                "items": ["Task 1", "Task 2"]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Technical Implementation Details

### 1. Block Positioning System
- **No absolute positioning**: Everything is relative
- **No CSS Grid/Flexbox**: Custom React layout engine
- **Breadth-first rendering**: Optimized for performance
- **UUID-based structure**: Each block has unique identifier

### 2. Responsive Behavior
```javascript
// Simplified responsive logic
if (viewport.width < 768) {
  // Stack all columns vertically
  renderMode = "single-column";
} else {
  // Render multi-column based on width_ratios
  renderMode = "multi-column";
}
```

### 3. Drag-and-Drop Implementation
- **Real-time recalculation**: Layout updates during drag
- **Blue guide lines**: Visual feedback for drop zones
- **Automatic parent creation**: column_list created when needed
- **Resize handles**: Gray vertical bars for manual width adjustment

---

## October 2024 "Layouts" Feature

New feature added side panels and property organization:
- **Detail Panel**: Uses previously unused screen space
- **Property Groups**: Organizes database properties visually
- **Controversial Update**: Changed how panels behave (user backlash)

---

## Limitations & Constraints

### Cannot Do:
- Custom CSS styling
- Pixel-perfect spacing control
- True nested columns (without workarounds)
- Mobile multi-column layouts
- Custom padding between columns

### Can Do:
- Up to 5 columns natively (6+ with nesting)
- Proportional width control via ratios
- Drag-and-drop rearrangement
- Responsive stacking on mobile
- Toggle-based nesting workaround

---

## Key Insights for BizQ

### What to Adopt:
1. **Block-based architecture**: Everything is a movable block
2. **Drag-to-create columns**: Intuitive layout creation
3. **Width ratios**: Simple proportional sizing
4. **JSON configuration**: Layout defined in data, not CSS

### What to Improve:
1. **Allow custom spacing**: User-defined padding/margins
2. **Support true nesting**: Columns within columns
3. **Mobile columns**: Responsive multi-column on mobile
4. **CSS customization**: Advanced users can add styles

### BizQ Layout Enhancement:
```json
{
  "type": "bizq_column_list",
  "layout": {
    "gap": "20px",           // Custom spacing
    "mobile_columns": true,   // Keep columns on mobile
    "custom_css": "optional"  // Power users
  },
  "children": [
    {
      "type": "bizq_column",
      "width": "60%",        // Direct percentage
      "min_width": "300px",  // Responsive minimum
      "children": [
        {
          "type": "cash_flow_widget",
          "executable": true  // BizQ addition: blocks that DO things
        }
      ]
    }
  ]
}
```

---

## Summary

Notion's layout system is:
- **Simple**: Drag blocks to create columns
- **Limited**: Max 5 native columns, no custom spacing
- **JSON-based**: Configuration, not CSS
- **Responsive**: Auto-stacks on mobile
- **Block-centric**: Everything is a block with children

For BizQ, adopt the simplicity but add:
- **Executable blocks**: Columns contain active business logic
- **Better customization**: User-defined spacing and styling
- **True nesting**: No artificial limitations
- **Mobile support**: Maintain layout on all devices