# BizQ Folder Structure

## 📁 Repository Organization

```
bizq/
├── 🔴 CRITICAL FILES (Root - Never Move)
│   ├── README.md                          # First thing everyone sees
│   ├── CLAUDE.md                          # AI instructions with guardrails
│   ├── CORE_VISION_GUARDRAILS.md          # Immutable laws
│   ├── NAVIGATION.md                      # Quick access to all docs
│   ├── FOLDER_STRUCTURE.md                # This file - organization guide
│   ├── package.json                       # Node.js dependencies
│   ├── package-lock.json                  # Locked dependencies
│   └── .gitignore                         # Git ignore rules
│
├── 📚 docs/                               # All documentation
│   ├── vision/                            # Core vision & protection (5 files)
│   │   ├── UNIVERSAL_DELEGATION.md        # Core innovation explained
│   │   ├── COMPLETE_VISION_RESTORATION.md # Full vision preserved
│   │   ├── VISION_PROTECTION_SUMMARY.md   # Defense system overview
│   │   ├── PRD_RESTORATION_PLAN.md        # How to fix PRD drift
│   │   └── UNIFIED_VISION.md              # Consolidated vision
│   │
│   ├── architecture/                      # Technical architecture (8 files)
│   │   ├── TECHNICAL_ARCHITECTURE.md      # System design
│   │   ├── DATABASE_SCHEMA.md             # Data structure
│   │   ├── AI_TASK_ROUTING.md             # Task routing system
│   │   ├── CONTEXT_VALIDATION_SYSTEM.md   # Context & validation
│   │   ├── AGENT_MANAGEMENT_SYSTEM.md     # Agent lifecycle
│   │   ├── MONOREPO_STRUCTURE.md          # Code organization
│   │   ├── SEAMLESS_AI_WORKFLOW.md        # AI integration patterns
│   │   └── TECH_STACK.md                  # Technology choices
│   │
│   ├── implementation/                    # Development plans (8 files)
│   │   ├── IMPLEMENTATION_ROADMAP.md      # 16-week roadmap
│   │   ├── IMPLEMENTATION_PLAN.md         # 8-week detailed plan
│   │   ├── BUILD_ROADMAP.md               # Build phases
│   │   ├── PHASE_1_MVP.md                 # MVP specification
│   │   ├── MVP_IMPLEMENTATION_PLAN.md     # MVP details
│   │   ├── MVP_TECHNICAL_SPEC.md          # MVP technical specs
│   │   ├── MVP_1PERCENT.md                # Minimal MVP
│   │   └── CORE_OPERATIONS_TASKS.md       # Task definitions
│   │
│   ├── analysis/                          # Research & analysis (6 files)
│   │   ├── MARKET_ANALYSIS.md             # Market research
│   │   ├── COMPETITOR_PAIN_POINTS_ANALYSIS.md
│   │   ├── CONTENT_FIRST_PLATFORM_ANALYSIS.md
│   │   ├── AI_STACK_ANALYSIS.md
│   │   ├── MIDDAY_ANALYSIS.md             # Prior art analysis
│   │   └── AI_SDK_TOOLS_RESEARCH.md
│   │
│   └── legacy/                            # Historical docs (6 files)
│       ├── MASTER_PRD.md                  # Needs restoration
│       ├── AI_GUIDED_OPERATIONS.md        # Original concepts
│       ├── MARKETPLACE_ECOSYSTEM.md       # Early marketplace ideas
│       ├── SAAS_REQUIREMENTS.md           # Original requirements
│       ├── LITELLM_CLAUDE_INTEGRATION.md  # Technical exploration
│       └── INDEX.md                       # Old navigation
│
├── 💻 src/                                # Source code
│   ├── core/                              # Core implementations
│   │   ├── bizq-core-ai.ts
│   │   ├── bizq-core-v2.ts
│   │   ├── marketplace.ts
│   │   ├── pattern-detector.ts
│   │   └── settings.ts
│   │
│   ├── providers/                         # AI provider implementations
│   │   ├── ai-manager.ts
│   │   ├── ai-provider.ts
│   │   ├── ai-provider-claude-code.ts
│   │   ├── ai-provider-headless.ts
│   │   └── ai-provider-litellm.ts
│   │
│   └── experimental/                      # Experimental code
│       ├── claude-api-server.ts
│       ├── claude-cli-working.ts
│       ├── claude-code-test.ts
│       ├── claude-code-test-v2.ts
│       ├── claude-sdk-proper.ts
│       ├── integrated-demo.ts
│       └── web-interface.ts
│
├── 🧪 tests/                              # Test files
│   ├── test-ai-integration.ts
│   ├── test-ai-integration-litellm.ts
│   ├── test-bizq-provider.ts
│   ├── test-claude-cli-direct.ts
│   ├── test-claude-code-simple.ts
│   └── test-claude-print-mode.ts
│
├── 📜 scripts/                            # Scripts and utilities
│   ├── start-bizq-with-claude-server.sh
│   └── servers/
│       └── claude_server.py
│
├── ⚙️ config/                             # Configuration files
│   ├── bizq.config.json
│   ├── requirements.txt
│   └── codex_security_audit.log
│
├── 📦 node_modules/                       # Dependencies (git-ignored)
└── 🗄️ ARCHIVED/                           # Archived experiments
```

## 🚨 File Organization Rules

### NEVER MOVE These Files:
1. `README.md` - Must be in root for GitHub
2. `CLAUDE.md` - Must be in root for Claude Code
3. `CORE_VISION_GUARDRAILS.md` - Must be in root for visibility

### Organization Principles:
1. **Vision files** → Most important, easy access
2. **Architecture** → Technical implementation details
3. **Implementation** → Plans and roadmaps
4. **Analysis** → Research and market analysis
5. **Legacy** → Outdated but historically important

### When Adding New Files:
1. **Vision changes** → Requires founder approval
2. **Architecture** → Must enable Universal Delegation
3. **Implementation** → Must follow roadmap
4. **Analysis** → Supporting research only
5. **Code** → Must pass vision check

## 📍 Quick Navigation

### Start Here:
1. `/README.md` - Overview and warnings
2. `/CORE_VISION_GUARDRAILS.md` - Immutable laws
3. `/docs/vision/UNIVERSAL_DELEGATION.md` - Core innovation

### For Development:
1. `/docs/implementation/PHASE_1_MVP.md` - What to build first
2. `/docs/architecture/TECHNICAL_ARCHITECTURE.md` - How to build
3. `/docs/implementation/IMPLEMENTATION_ROADMAP.md` - When to build

### For Understanding:
1. `/docs/vision/COMPLETE_VISION_RESTORATION.md` - Full vision
2. `/docs/analysis/` - Market and competitor research
3. `/docs/legacy/` - Historical context

---

*"A place for everything, and everything in its place - but Universal Delegation above all."*
EOF < /dev/null