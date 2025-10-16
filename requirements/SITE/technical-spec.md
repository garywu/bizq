# BizQ Marketing Site Technical Specification

**Version**: 1.0
**Date**: 2025-10-15
**Platform**: Cloudflare Workers + React + TypeScript

---

## 🏗️ **Architecture Overview**

### **Technology Stack**
```typescript
// Core Technologies
const techStack = {
  runtime: "Cloudflare Workers",
  framework: "React 18.2.0 + TypeScript 5.2.2",
  build: "Vite 5.0.0",
  styling: "Tailwind CSS 3.4.0 + ShadCN UI",
  routing: "React Router 6.20.0",
  state: "Zustand 4.4.0",
  forms: "React Hook Form 7.48.0",
  icons: "Lucide React 0.344.0",
  deployment: "Cloudflare Pages"
}
```

### **Project Structure**
```
requirements/SITE/
├── requirements.md          # Business requirements
├── technical-spec.md        # This file
├── components/              # Reusable component specs
├── pages/                   # Page-specific requirements
├── api/                     # API integration specs
└── assets/                  # Design assets and branding
```

---

## 📦 **Dependencies & Libraries**

### **Core Dependencies**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@radix-ui/react-navigation-menu": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "prettier": "^3.1.0"
  }
}
```

### **ShadCN UI Components Required**
```typescript
const requiredComponents = [
  "button",
  "card",
  "input",
  "textarea",
  "select",
  "dialog",
  "sheet",
  "navigation-menu",
  "breadcrumb",
  "pagination",
  "form",
  "toast",
  "alert",
  "badge",
  "avatar",
  "skeleton",
  "separator",
  "scroll-area",
  "accordion",
  "tabs"
]
```

---

## 🗂️ **File Structure**

### **Source Code Structure**
```
src/
├── components/
│   ├── ui/                    # ShadCN UI components
│   ├── layout/               # Layout components
│   │   ├── Header.tsx        # Navigation header
│   │   ├── Footer.tsx        # Site footer
│   │   ├── MegaMenu.tsx      # Navigation mega menu
│   │   └── Layout.tsx        # Main layout wrapper
│   ├── sections/             # Page section components
│   │   ├── Hero.tsx          # Homepage hero section
│   │   ├── Features.tsx      # Features showcase
│   │   ├── Testimonials.tsx  # Customer testimonials
│   │   └── Pricing.tsx       # Pricing section
│   ├── forms/                # Form components
│   │   ├── ContactForm.tsx   # Contact form
│   │   ├── NewsletterForm.tsx # Newsletter signup
│   │   └── DemoRequestForm.tsx # Demo request form
│   └── common/               # Shared components
│       ├── TaskCard.tsx      # Task display card
│       ├── IndustryCard.tsx  # Industry display card
│       └── CreatorCard.tsx   # Creator profile card
├── pages/
│   ├── Home.tsx              # Homepage
│   ├── Tasks.tsx             # Task catalog
│   ├── Industries.tsx        # Industry explorer
│   ├── Earn.tsx              # Creator economy
│   ├── Pricing.tsx           # Pricing page
│   ├── About.tsx             # About page
│   ├── Contact.tsx           # Contact page
│   ├── Blog.tsx              # Blog listing
│   └── Docs.tsx              # Documentation
├── hooks/                    # Custom React hooks
│   ├── useTasks.ts           # Task data management
│   ├── useIndustries.ts      # Industry data management
│   └── useAnalytics.ts       # Analytics tracking
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── api.ts                # API client
│   ├── constants.ts          # App constants
│   └── validations.ts        # Form validations
├── stores/                   # Zustand stores
│   ├── uiStore.ts            # UI state management
│   └── userStore.ts          # User preferences
├── types/                    # TypeScript definitions
│   ├── index.ts              # Main type exports
│   ├── api.ts                # API response types
│   └── components.ts         # Component prop types
└── styles/
    ├── globals.css           # Global styles
    └── tailwind.css          # Tailwind imports
```

### **Public Assets Structure**
```
public/
├── images/
│   ├── hero/                 # Hero section images
│   ├── features/             # Feature illustrations
│   ├── testimonials/         # Customer photos
│   ├── industries/           # Industry icons
│   └── team/                 # Team photos
├── icons/                    # Custom icons
├── fonts/                    # Custom fonts
└── data/                     # Static data files
    ├── industries.json       # Industry definitions
    ├── tasks.json            # Task examples
    └── testimonials.json     # Customer testimonials
```

---

## 🎨 **Design System Specification**

### **Color Palette**
```typescript
const colors = {
  // Primary Brand Colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",  // BizQ Blue
    600: "#2563eb",
    900: "#1e3a8a"
  },
  // Neutral Colors
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    500: "#6b7280",
    900: "#111827"
  },
  // Semantic Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444"
}
```

### **Typography Scale**
```typescript
const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"]
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
    "6xl": "3.75rem"  // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
}
```

### **Spacing Scale**
```typescript
const spacing = {
  0: "0",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem"      // 96px
}
```

### **Component Variants**
```typescript
// Button Variants
const buttonVariants = {
  variant: ["default", "destructive", "outline", "secondary", "ghost", "link"],
  size: ["default", "sm", "lg", "icon"]
}

// Card Variants
const cardVariants = {
  variant: ["default", "elevated", "outlined"],
  padding: ["none", "sm", "md", "lg"]
}

// Input Variants
const inputVariants = {
  variant: ["default", "error"],
  size: ["default", "sm", "lg"]
}
```

---

## 🔧 **Component Specifications**

### **Navigation Components**

#### **MegaMenu Component**
```typescript
interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

interface MenuItem {
  label: string
  href: string
  description?: string
  icon?: React.ComponentType
  badge?: string
}
```

#### **Header Component**
```typescript
interface HeaderProps {
  variant?: "default" | "transparent" | "fixed"
  showMegaMenu?: boolean
  className?: string
}

const headerVariants = {
  default: "bg-background border-b",
  transparent: "bg-transparent",
  fixed: "fixed top-0 w-full bg-background/80 backdrop-blur-md border-b"
}
```

### **Page Section Components**

#### **Hero Component**
```typescript
interface HeroProps {
  title: string
  subtitle: string
  cta: {
    primary: {
      text: string
      href: string
      variant?: "default" | "outline"
    }
    secondary?: {
      text: string
      href: string
      variant?: "default" | "outline"
    }
  }
  background?: "gradient" | "image" | "video"
  className?: string
}
```

#### **Features Component**
```typescript
interface Feature {
  icon: React.ComponentType
  title: string
  description: string
  href?: string
}

interface FeaturesProps {
  title?: string
  subtitle?: string
  features: Feature[]
  columns?: 2 | 3 | 4
  className?: string
}
```

#### **TaskCard Component**
```typescript
interface TaskCardProps {
  task: {
    id: string
    name: string
    description: string
    category: string
    creator: {
      name: string
      avatar?: string
    }
    stats: {
      successRate: number
      usageCount: number
      earnings: number
    }
    pricing: {
      type: "free" | "paid"
      amount?: number
    }
  }
  variant?: "default" | "featured" | "compact"
  onClick?: (taskId: string) => void
  className?: string
}
```

### **Form Components**

#### **ContactForm Component**
```typescript
interface ContactFormData {
  name: string
  email: string
  company?: string
  message: string
  type: "general" | "demo" | "support" | "enterprise"
}

interface ContactFormProps {
  variant?: "default" | "modal" | "inline"
  onSubmit: (data: ContactFormData) => Promise<void>
  className?: string
}
```

#### **NewsletterForm Component**
```typescript
interface NewsletterFormData {
  email: string
  interests?: string[]
  frequency?: "daily" | "weekly" | "monthly"
}

interface NewsletterFormProps {
  variant?: "default" | "footer" | "modal"
  showInterests?: boolean
  onSubmit: (data: NewsletterFormData) => Promise<void>
  className?: string
}
```

---

## 🔄 **State Management**

### **Zustand Stores**

#### **UI Store**
```typescript
interface UiState {
  // Navigation
  megaMenuOpen: boolean
  mobileMenuOpen: boolean

  // Modals
  contactModalOpen: boolean
  demoModalOpen: boolean
  newsletterModalOpen: boolean

  // Loading states
  isLoading: boolean
  loadingMessage?: string

  // Theme
  theme: "light" | "dark" | "system"

  // Actions
  toggleMegaMenu: () => void
  toggleMobileMenu: () => void
  openModal: (modal: keyof UiState) => void
  closeModal: (modal: keyof UiState) => void
  setLoading: (loading: boolean, message?: string) => void
  setTheme: (theme: UiState["theme"]) => void
}
```

#### **User Store**
```typescript
interface UserState {
  // User preferences
  preferences: {
    newsletterSubscribed: boolean
    interests: string[]
    theme: "light" | "dark" | "system"
  }

  // Form data
  contactFormData?: Partial<ContactFormData>
  demoFormData?: Partial<DemoRequestData>

  // Actions
  updatePreferences: (preferences: Partial<UserState["preferences"]>) => void
  saveFormData: (form: "contact" | "demo", data: any) => void
  clearFormData: (form: "contact" | "demo") => void
}
```

---

## 🌐 **API Integration**

### **API Client Structure**
```typescript
class ApiClient {
  private baseURL: string
  private headers: Record<string, string>

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL
    this.headers = {
      "Content-Type": "application/json",
      ...(apiKey && { "Authorization": `Bearer ${apiKey}` })
    }
  }

  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: any): Promise<T>
  async put<T>(endpoint: string, data: any): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}
```

### **API Endpoints**
```typescript
const apiEndpoints = {
  // Content
  tasks: "/api/tasks",
  industries: "/api/industries",
  creators: "/api/creators",

  // Forms
  contact: "/api/contact",
  newsletter: "/api/newsletter",
  demo: "/api/demo-request",

  // Analytics
  events: "/api/analytics/events",
  pageviews: "/api/analytics/pageviews"
}
```

### **Data Types**
```typescript
interface Task {
  id: string
  name: string
  description: string
  category: string
  industry: string
  creator: Creator
  stats: TaskStats
  pricing: TaskPricing
  createdAt: Date
  updatedAt: Date
}

interface Industry {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  taskCount: number
  featuredTasks: Task[]
}

interface Creator {
  id: string
  name: string
  avatar?: string
  bio?: string
  stats: CreatorStats
  verified: boolean
}
```

---

## 📱 **Responsive Design**

### **Breakpoint System**
```typescript
const breakpoints = {
  sm: "640px",   // Small devices (phones)
  md: "768px",   // Medium devices (tablets)
  lg: "1024px",  // Large devices (desktops)
  xl: "1280px",  // Extra large devices
  "2xl": "1536px" // 2X large devices
}
```

### **Responsive Utilities**
```typescript
const responsiveUtils = {
  // Container queries
  container: "container mx-auto px-4 sm:px-6 lg:px-8",

  // Grid systems
  grid: {
    cols1: "grid-cols-1",
    cols2: "grid-cols-1 md:grid-cols-2",
    cols3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    cols4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  },

  // Spacing
  spacing: {
    section: "py-12 md:py-16 lg:py-24",
    container: "px-4 sm:px-6 lg:px-8"
  }
}
```

### **Mobile-First Components**
```typescript
// Mobile-first navigation
const mobileNavigation = {
  hamburger: "md:hidden",           // Show on mobile only
  desktop: "hidden md:flex",        // Show on desktop only
  overlay: "fixed inset-0 z-50 md:hidden" // Mobile overlay
}

// Responsive text sizes
const responsiveText = {
  hero: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
  subtitle: "text-lg sm:text-xl lg:text-2xl",
  body: "text-base sm:text-lg"
}
```

---

## ♿ **Accessibility Specifications**

### **WCAG 2.1 AA Compliance**
```typescript
const accessibilityRequirements = {
  // Color contrast
  contrast: {
    normal: 4.5,    // Normal text
    large: 3.0      // Large text (18pt+ or 14pt+ bold)
  },

  // Focus management
  focus: {
    visible: true,  // Focus indicators always visible
    logical: true,  // Logical tab order
    trapped: false  // No focus trapping without escape
  },

  // Screen reader support
  screenReader: {
    labels: true,   // All form controls labeled
    headings: true, // Proper heading hierarchy
    landmarks: true // ARIA landmarks used
  },

  // Keyboard navigation
  keyboard: {
    navigation: true, // All interactive elements keyboard accessible
    shortcuts: false,  // No custom keyboard shortcuts without documentation
    escape: true      // Escape key closes modals
  }
}
```

### **ARIA Implementation**
```typescript
const ariaPatterns = {
  // Navigation
  navigation: {
    "aria-label": "Main navigation",
    "aria-expanded": "false" // For expandable menus
  },

  // Forms
  forms: {
    "aria-required": "true",  // Required fields
    "aria-invalid": "false",  // Validation states
    "aria-describedby": "error-message" // Error associations
  },

  // Dynamic content
  dynamic: {
    "aria-live": "polite",    // Status updates
    "aria-atomic": "true",    // Atomic updates
    "role": "status"          // Status regions
  }
}
```

---

## ⚡ **Performance Specifications**

### **Core Web Vitals Targets**
```typescript
const performanceTargets = {
  // Largest Contentful Paint
  lcp: {
    target: 2500,  // ms
    good: 2500,
    poor: 4000
  },

  // First Input Delay
  fid: {
    target: 100,   // ms
    good: 100,
    poor: 300
  },

  // Cumulative Layout Shift
  cls: {
    target: 0.1,   // score
    good: 0.1,
    poor: 0.25
  }
}
```

### **Bundle Optimization**
```typescript
const bundleConfig = {
  // Code splitting
  chunks: {
    vendor: /node_modules/,
    ui: /src\/components\/ui/,
    pages: /src\/pages/
  },

  // Asset optimization
  images: {
    formats: ["webp", "avif"],
    sizes: [320, 640, 1024, 1920],
    quality: 85
  },

  // Caching strategy
  cache: {
    static: "1 year",
    dynamic: "1 hour",
    immutable: "1 year"
  }
}
```

### **Loading States**
```typescript
interface LoadingState {
  skeleton: boolean    // Show skeleton UI
  spinner: boolean     // Show loading spinner
  message?: string     // Loading message
  progress?: number    // Progress percentage
}
```

---

## 🧪 **Testing Specifications**

### **Testing Strategy**
```typescript
const testingStrategy = {
  unit: {
    framework: "Vitest",
    coverage: 80,
    files: "**/*.{test,spec}.{ts,tsx}"
  },

  integration: {
    framework: "Vitest + Testing Library",
    coverage: 70,
    focus: "User interactions and data flow"
  },

  e2e: {
    framework: "Playwright",
    browsers: ["chromium", "firefox", "webkit"],
    scenarios: ["happy path", "error states", "edge cases"]
  },

  accessibility: {
    tools: ["axe-core", "lighthouse"],
    standards: "WCAG 2.1 AA",
    automated: true
  }
}
```

### **Test Categories**
```typescript
const testCategories = {
  components: {
    unit: "Component rendering and props",
    integration: "Component interactions",
    visual: "Visual regression testing"
  },

  pages: {
    e2e: "Full page flows",
    performance: "Loading and interaction performance",
    accessibility: "Page-level accessibility"
  },

  forms: {
    validation: "Form validation logic",
    submission: "Form submission and error handling",
    accessibility: "Form accessibility"
  }
}
```

---

## 🚀 **Deployment & CI/CD**

### **Build Configuration**
```typescript
const buildConfig = {
  // Vite configuration
  vite: {
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@radix-ui/react-navigation-menu"],
            utils: ["clsx", "tailwind-merge"]
          }
        }
      }
    }
  },

  // Environment variables
  env: {
    development: ".env.development",
    production: ".env.production"
  }
}
```

### **Cloudflare Pages Deployment**
```yaml
# wrangler.toml
name = "bizq-marketing-site"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[build]
command = "npm run build"
cwd = "."

[build.upload]
format = "service-worker"
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: bizq-marketing-site
```

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
```typescript
const monitoringConfig = {
  // Real User Monitoring
  rum: {
    provider: "Cloudflare Web Analytics",
    metrics: ["pageviews", "bounce_rate", "session_duration"]
  },

  // Error Tracking
  errors: {
    provider: "Sentry",
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  },

  // Performance Metrics
  performance: {
    provider: "Web Vitals",
    metrics: ["LCP", "FID", "CLS", "TTFB"]
  }
}
```

### **Analytics Implementation**
```typescript
const analyticsConfig = {
  // Page view tracking
  pageview: (path: string, title: string) => {
    // Track page views
  },

  // Event tracking
  event: (name: string, properties: Record<string, any>) => {
    // Track custom events
  },

  // Conversion tracking
  conversion: (type: string, value?: number) => {
    // Track conversions
  }
}
```

---

## 🔒 **Security Specifications**

### **Content Security Policy**
```typescript
const cspConfig = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://analytics.cloudflare.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https:"],
  "font-src": ["'self'", "https://fonts.googleapis.com"],
  "connect-src": ["'self'", "https://api.bizq.com"],
  "frame-src": ["'none'"]
}
```

### **Data Protection**
```typescript
const dataProtection = {
  // GDPR compliance
  gdpr: {
    cookieConsent: true,
    dataMinimization: true,
    rightToDeletion: true
  },

  // Form security
  forms: {
    csrf: true,
    rateLimiting: true,
    inputValidation: true,
    honeypot: true
  },

  // API security
  api: {
    httpsOnly: true,
    corsPolicy: "strict",
    rateLimiting: true
  }
}
```

---

*This technical specification provides the detailed implementation guidelines for building BizQ's marketing site with modern web technologies, performance optimization, and accessibility compliance.*</content>
</xai:function_call/>
<xai:function_call> <parameter name="write">
<parameter name="filePath">requirements/SITE/component-specs.md