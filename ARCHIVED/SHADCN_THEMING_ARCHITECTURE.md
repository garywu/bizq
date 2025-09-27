# shadcn Theming Architecture for BizQ
**How shadcn's CSS Variables System Can Power BizQ's UI**

---

## Core Concept: CSS Variables as Design Tokens

shadcn uses **CSS variables** for theming, not inline styles or complex CSS:

```css
:root {
  --background: 0 0% 100%;          /* hsl values */
  --foreground: 0 0% 3.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

Components use these variables:
```css
.button-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

---

## The Registry System: Distributing Components + Themes

### 1. Registry.json (Component Catalog)
```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "bizq-components",
  "homepage": "https://bizq.io",
  "items": [
    {
      "name": "cash-flow-monitor",
      "type": "registry:component",
      "title": "Cash Flow Monitor",
      "description": "Real-time cash flow visualization",
      "dependencies": ["recharts"],
      "files": [
        {
          "path": "components/cash-flow-monitor.tsx",
          "type": "component"
        }
      ],
      "cssVars": {
        "light": {
          "--profit": "142 71% 45%",
          "--loss": "0 84% 60%"
        },
        "dark": {
          "--profit": "142 71% 65%",
          "--loss": "0 84% 70%"
        }
      }
    }
  ]
}
```

### 2. Private Registries for Business Templates
```json
{
  "registries": {
    "@bizq": {
      "url": "https://api.bizq.io/registry",
      "headers": {
        "Authorization": "Bearer ${BIZQ_API_KEY}"
      }
    },
    "@restaurant": {
      "url": "https://templates.bizq.io/restaurant"
    }
  }
}
```

Install with: `bizq add @restaurant/pos-dashboard`

---

## BizQ's Theme System Using shadcn Approach

### 1. Semantic Business Variables
```css
:root {
  /* Standard shadcn variables */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 221.2 83.2% 53.3%;
  
  /* BizQ business semantics */
  --profit: 142 71% 45%;           /* Green */
  --profit-foreground: 0 0% 100%;
  --loss: 0 84% 60%;               /* Red */
  --loss-foreground: 0 0% 100%;
  --warning: 38 92% 50%;           /* Yellow */
  --warning-foreground: 0 0% 0%;
  
  /* Business metrics */
  --metric-positive: var(--profit);
  --metric-negative: var(--loss);
  --metric-neutral: 210 40% 96.1%;
}
```

### 2. Component Uses Semantic Variables
```tsx
// Cash Flow Component
function CashFlow({ balance }) {
  return (
    <div 
      style={{
        backgroundColor: `hsl(var(${balance > 0 ? '--profit' : '--loss'}))`,
        color: `hsl(var(${balance > 0 ? '--profit-foreground' : '--loss-foreground'}))`
      }}
    >
      ${balance}
    </div>
  );
}
```

---

## Template Distribution Model

### 1. Industry-Specific Theme Packages

**Restaurant Theme** (`@bizq/restaurant`)
```css
:root {
  --primary: 25 95% 53%;           /* Warm orange */
  --table-available: 142 71% 45%;  /* Green */
  --table-occupied: 0 84% 60%;     /* Red */
  --kitchen-urgent: 0 100% 50%;    /* Bright red */
}
```

**SaaS Theme** (`@bizq/saas`)
```css
:root {
  --primary: 262 83% 58%;          /* Purple */
  --trial: 38 92% 50%;             /* Yellow */
  --paid: 142 71% 45%;             /* Green */
  --churned: 0 84% 60%;            /* Red */
}
```

### 2. Template Includes Layout + Theme
```json
{
  "name": "restaurant-dashboard",
  "type": "registry:template",
  "files": [
    {
      "path": "layouts/restaurant-dashboard.json",
      "type": "layout"
    },
    {
      "path": "themes/restaurant.css",
      "type": "theme"
    },
    {
      "path": "components/table-map.tsx",
      "type": "component"
    }
  ],
  "cssVars": {
    "light": {
      "--primary": "25 95% 53%",
      "--table-available": "142 71% 45%"
    }
  }
}
```

---

## How This Solves BizQ's Needs

### 1. User Never Writes CSS
```yaml
User Action: Selects "Restaurant Template"
System Does:
  - Installs restaurant CSS variables
  - Adds restaurant-specific components
  - Configures layout for restaurant operations
  - All automatic, no CSS knowledge needed
```

### 2. But Power Users Can Customize
```css
/* Brand customization */
:root {
  --primary: 15 90% 48%;  /* McDonald's red */
  --secondary: 48 100% 50%; /* McDonald's yellow */
}
```

### 3. Dynamic Theme Switching
```tsx
function ThemeSwitcher() {
  return (
    <select onChange={(e) => applyTheme(e.target.value)}>
      <option value="default">Default</option>
      <option value="restaurant">Restaurant</option>
      <option value="retail">Retail</option>
      <option value="saas">SaaS</option>
    </select>
  );
}

function applyTheme(theme) {
  // Just changes CSS variables
  document.documentElement.setAttribute('data-theme', theme);
}
```

---

## Registry for Business Operations

### Component Registry Item
```json
{
  "name": "invoice-manager",
  "type": "registry:block",
  "dependencies": ["@bizq/core", "recharts"],
  "files": [
    {
      "path": "blocks/invoice-manager.tsx",
      "type": "component"
    }
  ],
  "config": {
    "api": "invoices",
    "actions": ["send", "remind", "collect"],
    "automation": {
      "overdue": "task://send_reminder",
      "paid": "api://update_cashflow"
    }
  }
}
```

### Install Command
```bash
bizq add invoice-manager --theme restaurant
# Installs component + applies restaurant theme variables
```

---

## The Tweakcn.com Model for BizQ

Like tweakcn.com (shadcn theme editor), BizQ could have:

### Visual Theme Builder
```yaml
Interface:
  - Color pickers for each variable
  - Live preview of components
  - Export as CSS or JSON
  - Save to registry

Features:
  - OKLCH color space for precise colors
  - Light/dark mode toggle
  - Semantic naming (profit/loss/warning)
  - Industry presets
```

### Generated Output
```json
{
  "name": "my-custom-theme",
  "cssVars": {
    "light": {
      "--primary": "221 83% 53%",
      "--profit": "142 71% 45%",
      "--loss": "0 84% 60%"
    }
  }
}
```

---

## Implementation Strategy

### 1. Start with shadcn Components
- Use existing shadcn/ui components as base
- Add business-specific components on top
- Maintain compatibility with shadcn ecosystem

### 2. Extend with Business Semantics
```css
/* shadcn base */
--primary, --secondary, --muted

/* BizQ additions */
--profit, --loss, --warning
--metric-positive, --metric-negative
--task-pending, --task-complete
```

### 3. Registry for Distribution
- Public registry for free templates
- Private registries for enterprise
- Marketplace for paid templates
- CLI for easy installation

---

## Key Advantages

1. **Proven System**: shadcn has thousands of users
2. **No Lock-in**: Standard CSS variables
3. **Framework Agnostic**: Works with React, Vue, etc.
4. **Easy Distribution**: Registry system for sharing
5. **Visual Builders**: Tools like tweakcn.com already exist
6. **Developer Friendly**: Developers know CSS variables
7. **Business Focused**: Semantic variables for business concepts

---

## Summary

BizQ adopts shadcn's CSS variable theming but adds:
- **Business semantic variables** (profit/loss/warning)
- **Industry template packages** (restaurant/retail/saas)
- **Executable block configurations** (not just styling)
- **Private registries** for enterprise templates

This gives us Notion's simplicity with real CSS power, distributed through a proven registry system.