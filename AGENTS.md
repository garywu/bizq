# BizQ Agent Guidelines

## Build/Test Commands
- **Start dev server**: `npm run dev`
- **Run specific demo**: `npm run demo` or `npm run marketplace`
- **Run single test**: `npx tsx tests/test-file.ts` (replace test-file.ts)
- **Install deps**: `npm install`
- **No linting configured** - use TypeScript compiler for type checking

## Code Style Guidelines

### File Structure
- Use `.ts` extension for TypeScript files
- Executable scripts: Add `#!/usr/bin/env -S npx tsx` shebang
- Tests in `tests/` directory with `test-*.ts` naming

### Imports & Types
- Group imports: Node.js stdlib, then external packages, then local
- Use interfaces for all data structures (PascalCase)
- Prefer explicit types over `any`
- Use `Record<string, any>` for flexible objects

### Naming Conventions
- **Classes**: PascalCase (e.g., `BizQAIProvider`)
- **Interfaces**: PascalCase (e.g., `UniversalTask`)
- **Methods/Variables**: camelCase (e.g., `processTask`)
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case (e.g., `ai-provider.ts`)

### Error Handling
- Use try/catch blocks for async operations
- Return structured error responses with `success`, `error` fields
- Log errors with context using console.log

### Async Patterns
- Use async/await (not Promises directly)
- Use `for await...of` for streaming responses
- Handle timeouts with setTimeout/clearTimeout

### Logging
- Use console.log with emojis for user-facing messages
- Include relevant context (task IDs, session IDs)
- Use descriptive messages

### Architecture Patterns
- Extend EventEmitter for observable classes
- Use Map for caching (not objects)
- Implement session management for AI providers
- Follow UniversalTask interface for all operations