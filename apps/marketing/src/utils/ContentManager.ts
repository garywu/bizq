import { IndustryContent } from '../types/industry';

// ContentManager - Utility for managing BizQ marketing content
// Provides easy methods to add/update tools, industries, and articles

export class ContentManager {
  private static instance: ContentManager;
  private industries: Map<string, IndustryContent> = new Map();
  private tools: Map<string, any> = new Map();
  private articles: Map<string, any> = new Map();

  private constructor() {
    this.loadInitialContent();
  }

  public static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  private loadInitialContent() {
    // Load initial content from data files
    // This would normally load from external sources
    console.log('ContentManager: Loading initial content...');

    // Import and load industries
    Promise.all([
      import('../data/industries').then(({ industriesData }) => industriesData),
      import('../data/industries-expanded').then(({ industriesExpandedData }) => industriesExpandedData)
    ]).then(([originalIndustries, expandedIndustries]) => {
      // Load original industries
      originalIndustries.forEach(industry => {
        this.industries.set(industry.slug, industry);
      });

      // Load expanded industries (skip duplicates)
      expandedIndustries.forEach(industry => {
        if (!this.industries.has(industry.slug)) {
          this.industries.set(industry.slug, industry);
        }
      });

      console.log(`✅ Loaded ${this.industries.size} total industries (${originalIndustries.length} original + ${expandedIndustries.length} expanded)`);
    }).catch(error => {
      console.error('Failed to load industries:', error);
    });
  }

  // Industry Management
  public addIndustry(industry: IndustryContent): void {
    this.industries.set(industry.slug, industry);
    console.log(`✅ Added industry: ${industry.name}`);
  }

  public updateIndustry(slug: string, updates: Partial<IndustryContent>): void {
    const existing = this.industries.get(slug);
    if (existing) {
      this.industries.set(slug, { ...existing, ...updates });
      console.log(`✅ Updated industry: ${slug}`);
    }
  }

  public removeIndustry(slug: string): void {
    this.industries.delete(slug);
    console.log(`✅ Removed industry: ${slug}`);
  }

  public getIndustry(slug: string): IndustryContent | undefined {
    return this.industries.get(slug);
  }

  public getAllIndustries(): IndustryContent[] {
    return Array.from(this.industries.values());
  }

  // Tool Management
  public addTool(tool: any): void {
    this.tools.set(tool.slug || tool.title.toLowerCase().replace(/\s+/g, '-'), tool);
    console.log(`✅ Added tool: ${tool.title}`);
  }

  public updateTool(slug: string, updates: any): void {
    const existing = this.tools.get(slug);
    if (existing) {
      this.tools.set(slug, { ...existing, ...updates });
      console.log(`✅ Updated tool: ${slug}`);
    }
  }

  // Article Management
  public addArticle(article: any): void {
    this.articles.set(article.slug || article.title.toLowerCase().replace(/\s+/g, '-'), article);
    console.log(`✅ Added article: ${article.title}`);
  }

  // Quick Add Methods for CLI usage
  public quickAddIndustry(data: {
    name: string;
    category: string;
    description: string;
    tasks?: string[];
  }): void {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const industry: IndustryContent = {
      id: Date.now(), // Simple ID generation
      name: data.name,
      slug,
      category: data.category,
      description: data.description,
      hero: {
        headline: `${data.name} Operations Transformed`,
        subheadline: `Delegate ${data.name.toLowerCase()} tasks with AI and human expertise`,
        valueProposition: `Reduce costs and increase efficiency in ${data.name.toLowerCase()} operations`
      },
      keyTasks: data.tasks?.map((task) => ({
        name: task,
        description: `Automated ${task.toLowerCase()} processing and management`,
        complexity: 'Medium' as const,
        aiAutomation: 75,
        humanExpertise: 25,
        estimatedTime: '15-30 minutes',
        category: data.category
      })) || [],
      businessImpact: {
        efficiency: '60% improvement',
        costSavings: '$25,000+ annually',
        scalability: '3x capacity increase'
      },
      useCases: [],
      faqs: []
    };

    this.addIndustry(industry);
  }

  public quickAddTool(data: {
    title: string;
    category: string;
    description: string;
    features?: string[];
  }): void {
    const tool = {
      title: data.title,
      description: data.description,
      category: data.category,
      features: data.features || [],
      icon: 'Zap', // Default icon
      metrics: {
        users: '1,000+',
        efficiency: '70%',
        satisfaction: '4.5/5'
      }
    };

    this.addTool(tool);
  }

  public quickAddArticle(data: {
    title: string;
    category: string;
    excerpt: string;
    content?: string;
  }): void {
    const article = {
      title: data.title,
      excerpt: data.excerpt,
      category: data.category,
      content: data.content || data.excerpt,
      readTime: '5 min read',
      date: new Date().toISOString().split('T')[0],
      author: 'BizQ Team'
    };

    this.addArticle(article);
  }

  // Export methods for data persistence
  public exportIndustries(): IndustryContent[] {
    return this.getAllIndustries();
  }

  public exportTools(): any[] {
    return Array.from(this.tools.values());
  }

  public exportArticles(): any[] {
    return Array.from(this.articles.values());
  }

  // Statistics
  public getStats(): {
    industries: number;
    tools: number;
    articles: number;
  } {
    return {
      industries: this.industries.size,
      tools: this.tools.size,
      articles: this.articles.size
    };
  }
}

// CLI-style functions for easy content management
export const contentManager = ContentManager.getInstance();

// Quick commands (can be called from browser console or scripts)
if (typeof window !== 'undefined') {
  (window as any).bizq = {
    addIndustry: (data: any) => contentManager.quickAddIndustry(data),
    addTool: (data: any) => contentManager.quickAddTool(data),
    addArticle: (data: any) => contentManager.quickAddArticle(data),
    getStats: () => contentManager.getStats(),
    export: () => ({
      industries: contentManager.exportIndustries(),
      tools: contentManager.exportTools(),
      articles: contentManager.exportArticles()
    })
  };

  console.log('🚀 BizQ ContentManager loaded!');
  console.log('💡 Quick commands available:');
  console.log('   bizq.addIndustry({name, category, description, tasks})');
  console.log('   bizq.addTool({title, category, description, features})');
  console.log('   bizq.addArticle({title, category, excerpt})');
  console.log('   bizq.getStats()');
  console.log('   bizq.export()');
}