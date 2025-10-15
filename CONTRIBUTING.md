# Contributing to BizQ

Welcome! We're building the Universal Delegation platform that transforms every business operation into standardized, delegatable tasks.

## 🚨 Critical Requirements

### Before ANY Work:
1. **MANDATORY**: Read `CORE_VISION_GUARDRAILS.md` - Contains immutable business principles
2. **MANDATORY**: Read `docs/vision/UNIVERSAL_DELEGATION.md` - Core innovation concept
3. **MANDATORY**: Understand that Universal Delegation IS the product

### Vision Test
To contribute, you must pass this test:
- Can you explain how your change enables Universal Delegation in one sentence?
- Does this grow the task catalog or improve task standardization?
- Does this maintain the Grandfather Rule (5% creator royalties forever)?

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or bun

### Installation
```bash
git clone <repository-url>
cd bizq
npm install
```

### Development Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run test         # Run all tests
```

### Project Structure
```
bizq/
├── src/
│   ├── core/         # Core business logic
│   ├── providers/    # AI provider implementations
│   ├── experimental/ # Prototypes and demos
│   ├── types/        # Shared TypeScript interfaces
│   └── utils/        # Common utilities
├── tests/            # Test files
├── docs/             # Documentation
├── config/           # Configuration files
└── scripts/          # Automation scripts
```

## 📝 Code Standards

### TypeScript
- Use interfaces for all data structures (PascalCase)
- Prefer explicit types over `any`
- Use `Record<string, any>` for flexible objects

### Naming Conventions
- **Classes**: `PascalCase` (e.g., `BizQAIProvider`)
- **Interfaces**: `PascalCase` (e.g., `UniversalTask`)
- **Methods/Variables**: `camelCase` (e.g., `processTask`)
- **Files**: `kebab-case.ts` (e.g., `ai-provider.ts`)

### Error Handling
- Return structured responses: `{ success: boolean, error?: string }`
- Use try/catch for async operations
- Log errors with context

### Logging
- Use console.log with emojis for user-facing messages
- Include relevant context (task IDs, session IDs)

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test
npx tsx tests/test-ai-integration.ts

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- Tests in `tests/` directory
- Naming: `test-description.ts`
- Use descriptive test names
- Test both success and error cases

## 📚 Documentation

### Adding Documentation
1. Choose appropriate subdirectory in `docs/`
2. Use `SCREAMING_SNAKE_CASE.md` naming
3. Update `docs/README.md` with description
4. Add cross-references where relevant

### Key Documents
- `CORE_VISION_GUARDRAILS.md` - Business principles
- `docs/vision/UNIVERSAL_DELEGATION.md` - Core concept
- `AGENTS.md` - Agent coding guidelines

## 🔄 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Standards**
   - All tests pass: `npm run test`
   - Code formatted: `npm run format`
   - No linting errors: `npm run lint`
   - Types check: `npm run typecheck`

3. **Commit Message Format**
   ```
   type(scope): description

   [optional body]

   [optional footer]
   ```
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

4. **Pull Request**
   - Clear title and description
   - Reference related issues
   - Explain how it enables Universal Delegation
   - Request review from maintainers

## 🚫 Forbidden Actions

- ❌ Modifying `CORE_VISION_GUARDRAILS.md` without founder approval
- ❌ Adding "flexible" or "customizable" task definitions
- ❌ Focusing on AI/agents over task standardization
- ❌ Building complex enterprise features
- ❌ Removing the Grandfather Rule
- ❌ Creating "innovative" UI instead of familiar business software

## 📞 Getting Help

- **Vision Questions**: Read `CORE_VISION_GUARDRAILS.md` first
- **Technical Questions**: Check `docs/vision/UNIVERSAL_DELEGATION.md`
- **Code Questions**: See `AGENTS.md` for coding guidelines

## 🎯 Remember

**Universal Delegation IS BizQ. Without it, we have nothing.**

Every contribution must advance the mission of making every business operation delegatable through standardized tasks.