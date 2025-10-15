# BizQ - Universal Delegation Platform

**The Amazon of Business Operations**

---
https://usepylon.com/
https://joinconsumerclub.com/


## ⛔ CRITICAL: READ BEFORE ANY WORK

### 🔒 CORE VISION GUARDRAILS
**THIS SECTION IS IMMUTABLE - DO NOT MODIFY WITHOUT FOUNDER APPROVAL**

#### The One Sentence That Defines Everything:
> **"BizQ is a Universal Delegation platform where EVERY business operation becomes a standardized, delegatable task that can be fulfilled by any qualified worker (AI, human, or hybrid) through a task catalog marketplace."**

#### Five Immutable Laws:
1. **Universal Delegation IS the Product** - Not AI, not agents, not context
2. **The Platform IS the Task Catalog** - Like Amazon, but for business tasks
3. **Task Standardization is EVERYTHING** - Fixed signatures, no customization
4. **The Grandfather Rule is SACRED** - Task creators earn 5% royalty forever
5. **Familiar UI with Hidden Delegation** - Looks like QuickBooks, delegates everything

#### Before ANY Work:
- [ ] Read `/CORE_VISION_GUARDRAILS.md`
- [ ] Read `/UNIVERSAL_DELEGATION.md`
- [ ] Understand the Grandfather Rule
- [ ] Pass the vision test (see guardrails doc)

**⚠️ WARNING**: Any deviation from Universal Delegation destroys the product. We're not building another AI tool - we're creating a new category.

---

## What is BizQ?

BizQ transforms how businesses operate by turning every business operation into a standardized, delegatable task. Think of it as:

- **Uber for business operations** - Standardized tasks, not custom negotiations
- **Amazon for business tasks** - Browse, buy, and sell standardized operations
- **Function calls for business** - Fixed input/output signatures that always work

### The Revolution:
- **FROM**: 30+ tools, manual work, $3000-7000/month
- **TO**: One platform, everything delegated, $297/month + task costs

---

## Core Innovation: Universal Delegation

### What It Means:
Every business operation - from "reply to customer email" to "analyze competitor pricing" to "optimize inventory" - becomes a standardized task with:

```typescript
interface UniversalTask {
  type: "customer.reply" | "price.analyze" | "inventory.optimize";
  input: JSONSchema;  // Fixed input signature
  output: JSONSchema; // Fixed output signature
  executor: "ai" | "human" | "hybrid";
  cost: number;       // In credits
  royalty: number;    // To task creator (5%)
}
```

### The Grandfather Rule:
When you create a new task definition, you earn 5% royalty on EVERY execution forever - even after AI takes over or prices drop 100x. This transforms workers from laborers into inventors.

---

## Project Structure

```
bizq/
├── CORE_VISION_GUARDRAILS.md    # ⛔ IMMUTABLE - Read first
├── UNIVERSAL_DELEGATION.md       # Core innovation explained
├── COMPLETE_VISION_RESTORATION.md # Full vision documentation
├── MASTER_PRD.md                 # Product requirements (needs restoration)
├── PRD_RESTORATION_PLAN.md       # How to fix the PRD
└── [implementation files]
```

---

## Development Guidelines

### Before Starting ANY Work:

1. **Understand Universal Delegation**
   - It's not automation (Zapier)
   - It's not freelancing (Upwork)
   - It's not AI agents (ChatGPT)
   - It's standardized task delegation

2. **Check Against Guardrails**
   - Does this enable Universal Delegation?
   - Does this grow the task catalog?
   - Does this maintain standardization?
   - Does this preserve the Grandfather Rule?

3. **Follow UI Philosophy**
   - Must look like familiar business software
   - Delegation happens invisibly
   - No "AI-first" interfaces
   - No complex workflows

### Forbidden Actions:
- ❌ Adding "flexible" or "customizable" task definitions
- ❌ Focusing on AI/agents over task standardization
- ❌ Building complex enterprise features
- ❌ Removing the Grandfather Rule
- ❌ Creating "innovative" UI instead of familiar

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/bizq/bizq.git
cd bizq

# Read critical documents
cat CORE_VISION_GUARDRAILS.md  # MANDATORY
cat UNIVERSAL_DELEGATION.md     # Understand core

# Install dependencies
bun install

# Run development
bun dev
```

---

## Task Examples

### Simple Task: Customer Reply
```typescript
{
  type: "customer.reply",
  input: {
    inquiry: "Where is my order?",
    context: { orderId: "12345", status: "shipped" }
  },
  output: {
    response: "Your order #12345 was shipped yesterday...",
    tone: "helpful",
    suggestedActions: ["track_order"]
  },
  executor: "ai",
  cost: 0.50,
  royalty: 0.025  // To task creator
}
```

### Complex Task: Product Launch
```typescript
{
  type: "product.launch",
  subtasks: [
    "market.research",       // Human specialist
    "product.description",   // AI
    "images.generate",       // AI
    "review.quality",        // Human
    "platform.list"          // AI
  ],
  totalCost: 117,
  royalties: 5.85  // Distributed to task creators
}
```

---

## Contributing

### Requirements:
1. Read and sign off on CORE_VISION_GUARDRAILS.md
2. Pass the vision test (5 questions)
3. Understand that Universal Delegation is the ONLY priority

### Review Process:
- ALL changes must explain how they enable Universal Delegation
- NO commits without review against guardrails
- Task standardization must be maintained
- Grandfather Rule must be preserved

---

## Vision Integrity Metrics

We track these to prevent drift:
- **Task Catalog Growth**: New tasks added weekly (Target: 100+)
- **Standardization Rate**: % with fixed signatures (Target: 100%)
- **Royalty Distribution**: $ to creators (Must grow weekly)
- **UI Familiarity**: "Feels like QuickBooks" (Target: >80%)
- **Delegation Rate**: % automated (Target: >90%)

---

## Emergency Restoration

If you detect vision drift:
1. STOP all work immediately
2. Read CORE_VISION_GUARDRAILS.md
3. Check UNIVERSAL_DELEGATION.md
4. Alert team with "VISION DRIFT DETECTED"
5. Follow restoration protocol

---

## The Bottom Line

**We are NOT building**:
- Another AI automation tool
- A better Zapier
- An agent management platform
- A context-first system

**We ARE building**:
- The Amazon of business operations
- A catalog of standardized, delegatable tasks
- An innovation platform where task creators earn forever
- Familiar business software where everything delegates

---

## Contact

**Vision Questions**: Read CORE_VISION_GUARDRAILS.md first
**Technical Questions**: Check UNIVERSAL_DELEGATION.md
**PRD Issues**: See PRD_RESTORATION_PLAN.md

---

*"If you can't explain how your code enables Universal Delegation in one sentence, that code should not exist."*

**Remember**: Universal Delegation IS BizQ. Without it, we have nothing.
