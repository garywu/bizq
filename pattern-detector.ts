#!/usr/bin/env -S npx tsx

/**
 * BizQ Pattern Detection & Patent System
 * Rewards innovation and creates temporary monopolies
 */

interface Pattern {
  input: string;
  output: any;
  category: string;
}

interface Patent {
  id: string;
  pattern: Pattern;
  creator: string;
  createdAt: Date;
  expiresAt: Date;
  usageCount: number;
  royaltiesEarned: number;
  monopolyActive: boolean;
}

export default class PatternDetector {
  private patterns: Map<string, Patent> = new Map();
  private patentDuration = 90 * 24 * 60 * 60 * 1000; // 90 days
  private monopolyDuration = 7 * 24 * 60 * 60 * 1000; // 7 days

  detectNovelPattern(pattern: Pattern): boolean {
    const patternKey = this.generatePatternKey(pattern);
    
    // Check if pattern already exists
    if (this.patterns.has(patternKey)) {
      const existing = this.patterns.get(patternKey)!;
      existing.usageCount++;
      existing.royaltiesEarned += 0.1; // 10 cents per use
      console.log(`📊 Existing pattern used. Royalties to ${existing.creator}: $${existing.royaltiesEarned.toFixed(2)}`);
      return false;
    }

    // Novel pattern detected!
    const patent: Patent = {
      id: `patent-${Date.now()}`,
      pattern,
      creator: 'current-worker',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.patentDuration),
      usageCount: 1,
      royaltiesEarned: 0,
      monopolyActive: true
    };

    this.patterns.set(patternKey, patent);
    
    // Set monopoly expiration
    setTimeout(() => {
      patent.monopolyActive = false;
      console.log(`⏰ Monopoly expired for pattern ${patent.id}`);
    }, this.monopolyDuration);

    console.log(`🎨 NOVEL PATTERN DETECTED!`);
    console.log(`📜 Patent granted: ${patent.id}`);
    console.log(`👑 7-day monopoly activated`);
    console.log(`💰 Royalties for 90 days`);
    
    return true;
  }

  private generatePatternKey(pattern: Pattern): string {
    return `${pattern.category}:${pattern.input.toLowerCase().slice(0, 50)}`;
  }

  hasMonopoly(pattern: Pattern): { hasMonopoly: boolean; owner?: string } {
    const patternKey = this.generatePatternKey(pattern);
    const patent = this.patterns.get(patternKey);
    
    if (patent && patent.monopolyActive) {
      return { hasMonopoly: true, owner: patent.creator };
    }
    
    return { hasMonopoly: false };
  }

  getStats() {
    const activePatents = Array.from(this.patterns.values());
    const activeMonopolies = activePatents.filter(p => p.monopolyActive).length;
    const totalRoyalties = activePatents.reduce((sum, p) => sum + p.royaltiesEarned, 0);
    
    return {
      totalPatents: activePatents.length,
      activeMonopolies,
      totalRoyalties,
      topPatent: activePatents.sort((a, b) => b.royaltiesEarned - a.royaltiesEarned)[0]
    };
  }
}

// Demo if run directly
if (require.main === module) {
  const detector = new PatternDetector();
  
  // First use - novel pattern
  detector.detectNovelPattern({
    input: 'optimize pricing for black friday',
    output: { pricing: 'dynamic' },
    category: 'pricing'
  });
  
  // Second use - pays royalties
  detector.detectNovelPattern({
    input: 'optimize pricing for black friday',
    output: { pricing: 'dynamic' },
    category: 'pricing'
  });
  
  // Different pattern - also novel
  detector.detectNovelPattern({
    input: 'generate tiktok viral content',
    output: { content: 'video' },
    category: 'content'
  });
  
  console.log('\n📊 Pattern Statistics:', detector.getStats());
}