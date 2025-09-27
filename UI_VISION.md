# BizQ UI Vision

**The Technical Architecture for User-Configurable Business Software**

---

## Core Decisions

### 1. **Templates are JSON, Not Code**
- Templates = JSON configuration of UI layout and block arrangement
- No executable code = No security risks = Viral sharing possible
- Users can safely use any template from anyone instantly

### 2. **shadcn Registry + Component Distribution**
- Use shadcn's proven component registry system
- Components distributed separately from templates
- CSS variables for theming (no custom CSS in templates)
- 50k+ star validation of approach

### 3. **Business Logic Lives in API Layer**
- UI calls business APIs, doesn't implement logic
- Three-layer architecture: Database → Business Logic → Configurable UI
- Templates configure which APIs to call, not how they work

---

## Key Innovations

### 1. **UI Creates Functionality Through Configuration**
Like Notion templates but executable:
```json
{
  "type": "cash_flow_block",
  "actions": {
    "onLowBalance": "task://optimize_cash_flow",
    "onRefresh": "api://update_metrics"
  }
}
```
The arrangement and configuration of blocks defines business workflows.

### 2. **Semantic Business Theming**
Not just colors, but business meaning:
```css
--profit: green
--loss: red  
--warning: yellow
--metric-positive: var(--profit)
--metric-negative: var(--loss)
```
Components understand business context and style accordingly.

### 3. **Zero-Code Template Marketplace**
- Anyone can create templates by arranging blocks
- Share/sell templates without code review
- Templates can't break anything (just JSON)
- Instant viral distribution possible

---

## Technical Architecture

### Component Layer (Code - Needs Security Review)
```
shadcn Registry → BizQ Components → Runtime Registration
     ↓                 ↓                    ↓
  Button, Card    CashFlowMonitor    Available in builder
```

### Template Layer (JSON - No Security Risk)
```json
{
  "name": "Restaurant Dashboard",
  "blocks": [
    {
      "component": "table-map",
      "position": {"row": 0, "col": 0},
      "size": {"width": 6, "height": 4},
      "props": {"tables": 20}
    }
  ]
}
```

### Theme Layer (CSS Variables - Safe)
```css
:root {
  --primary: 221 83% 53%;
  --background: 0 0% 100%;
}
```

---

## Layout System

### CSS Flexbox/Grid Direct Usage
No proprietary layout system - just standard CSS:
```json
{
  "type": "flex",
  "style": {
    "flexDirection": "row",
    "gap": "20px",
    "justifyContent": "space-between"
  },
  "children": [
    {"style": {"flex": "1"}, "component": "revenue_chart"},
    {"style": {"flex": "1"}, "component": "expense_chart"}
  ]
}
```

**Why**: Developers already know CSS. No learning curve. Browser-optimized.

### Drag-and-Drop Creates CSS
- Drag next to = `flexDirection: "row"`
- Drag below = `flexDirection: "column"`
- Resize = Updates `flex` value
- Users never write CSS, just arrange visually

---

## How It All Works Together

### 1. User Selects Template
```json
{
  "name": "SaaS Dashboard",
  "layout": { /* CSS flexbox/grid */ },
  "blocks": [ /* Component references */ ],
  "theme": "saas" /* CSS variables set */
}
```

### 2. System Loads Components
- Fetches from shadcn registry
- Registers BizQ business blocks
- All components available to template

### 3. Template Renders
- JSON → React components
- CSS variables applied
- Business logic APIs connected
- Real-time data flows

### 4. User Customizes
- Drag blocks around → Updates JSON
- Change theme → Swaps CSS variables  
- Add automation → Configures API calls
- Save as new template → Share/sell

---

## Validation: Why This Works

### Notion Proved
- $10B company built on JSON templates
- Users love configurable workspaces
- Visual builders work for non-technical users
- Templates create viral growth

### shadcn Proved
- 50k+ stars validates registry approach
- CSS variables sufficient for theming
- Component distribution scales
- Developers prefer standard tools

### Forge Proved
- 257 components from 5 sources work together
- Registry pattern handles complexity
- Templates in markdown/JSON work
- Prefix isolation solves conflicts

---

## What Makes BizQ Different

### vs Notion
- **BizQ executes business operations**, Notion just displays data
- Real API calls, not just database views
- Task delegation, not manual work

### vs Odoo
- **JSON templates** vs XML views
- React components vs QWeb templates
- Client-side configuration vs server-side rendering
- Modern stack vs legacy framework

### vs Traditional Business Software
- **User-configurable** vs fixed interfaces
- Template marketplace vs one-size-fits-all
- Component registry vs monolithic application
- Delegation-enabled vs manual operations

---

## Implementation Priority

### Phase 1: Core Infrastructure
1. shadcn component registry integration
2. JSON template parser
3. CSS variable theming system
4. Visual drag-and-drop builder

### Phase 2: Business Components
1. Core business blocks (cash flow, revenue, etc.)
2. API connections to business logic
3. Task delegation bindings
4. Real-time data updates

### Phase 3: Marketplace
1. Template sharing system
2. Component discovery
3. Theme marketplace
4. Template analytics

---

## Success Metrics

### Technical
- Template load time < 100ms
- Component registry < 1MB
- Drag-drop latency < 16ms
- API response < 200ms

### Business
- Templates shared per user > 1
- Template reuse rate > 50%
- Component marketplace listings > 1000
- Average customization time < 5 minutes

---

## The Bottom Line

**BizQ = Notion's configurability + Business execution capability**

- **Templates**: JSON configuration (like Notion) but connected to real business APIs
- **Components**: shadcn registry for UI blocks + BizQ business components  
- **Themes**: CSS variables for business semantics (profit/loss/warning)
- **Security**: Templates can't execute code = safe viral sharing
- **Innovation**: UI arrangement creates business workflows

Users get a familiar, customizable interface that actually runs their business through Universal Delegation.

---

*Technical architecture decided. Ready to build.*