import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { contentManager } from "../utils/ContentManager";
import { useState, useEffect } from "react";

interface ArticleProps {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
}

export const Articles = () => {
  const [articles, setArticles] = useState<ArticleProps[]>([]);

  useEffect(() => {
    // Load articles from ContentManager
    const loadedArticles = contentManager.exportArticles().map(article => ({
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      readTime: article.readTime || '5 min read',
      date: article.date
    }));

    // If no articles in ContentManager, use default ones
    if (loadedArticles.length === 0) {
      setArticles([
        {
          title: "The Future of Business Operations: AI-Human Collaboration",
          excerpt: "Explore how BizQ's universal delegation platform combines the best of AI automation with human expertise to transform business workflows.",
          category: "AI & Automation",
          readTime: "5 min read",
          date: "2024-10-15"
        },
        {
          title: "Building Standardized Tasks: A Guide for Business Leaders",
          excerpt: "Learn how to break down complex business processes into standardized, delegatable tasks that can be executed by our global network.",
          category: "Best Practices",
          readTime: "7 min read",
          date: "2024-10-12"
        },
        {
          title: "ROI of Task Delegation: Real Results from Early Adopters",
          excerpt: "Case studies showing how businesses have achieved 300%+ efficiency gains through intelligent task delegation and automation.",
          category: "Case Studies",
          readTime: "6 min read",
          date: "2024-10-10"
        },
        {
          title: "Security and Compliance in the Universal Task Marketplace",
          excerpt: "How BizQ ensures enterprise-grade security and regulatory compliance across all delegated business operations.",
          category: "Security",
          readTime: "8 min read",
          date: "2024-10-08"
        },
        {
          title: "From QuickBooks to BizQ: The Evolution of Business Software",
          excerpt: "Understanding how BizQ represents the next generation of business management tools with universal delegation capabilities.",
          category: "Product Vision",
          readTime: "4 min read",
          date: "2024-10-05"
        },
        {
          title: "Scaling Your Business: When to Delegate vs Automate",
          excerpt: "Strategic guidance on determining which tasks to delegate to humans, which to automate with AI, and how to optimize both approaches.",
          category: "Strategy",
          readTime: "6 min read",
          date: "2024-10-03"
        }
      ]);
    } else {
      setArticles(loadedArticles);
    }
  }, []);

  return (
    <section
      id="articles"
      className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Latest Insights
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Stay informed with the latest trends, best practices, and success stories from the world of business automation and AI delegation.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <Card
            key={index}
            className="flex flex-col justify-between border-0 bg-background shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {article.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{article.readTime}</span>
              </div>
              <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm leading-relaxed">{article.excerpt}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <span className="text-xs text-muted-foreground">{article.date}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};