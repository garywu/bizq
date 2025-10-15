export interface IndustryTask {
  name: string;
  description: string;
  complexity: 'Low' | 'Medium' | 'High';
  aiAutomation: number; // 0-100%
  humanExpertise: number; // 0-100%
  estimatedTime: string;
  category: string;
}

export interface IndustryContent {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  hero: {
    headline: string;
    subheadline: string;
    valueProposition: string;
  };
  keyTasks: IndustryTask[];
  businessImpact: {
    efficiency: string;
    costSavings: string;
    scalability: string;
  };
  useCases: Array<{
    title: string;
    description: string;
    challenge: string;
    solution: string;
    results: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export interface IndustryCategory {
  name: string;
  slug: string;
  description: string;
  industries: IndustryContent[];
}