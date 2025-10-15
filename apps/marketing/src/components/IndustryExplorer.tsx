import { useState, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "./ui/progress";
import { industryCategories } from "../data/industries";
import { contentManager } from "../utils/ContentManager";
import { Search, Filter, ChevronDown, ChevronUp, X } from "lucide-react";

export const IndustryExplorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const allIndustries = contentManager.getAllIndustries();

  const filteredIndustries = useMemo(() => {
    if (!searchTerm.trim()) {
      return selectedCategory === "all"
        ? allIndustries
        : allIndustries.filter(industry => industry.category === selectedCategory);
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return allIndustries
      .map(industry => {
        // Calculate relevance score
        let score = 0;
        const searchableText = [
          industry.name,
          industry.description,
          industry.hero.headline,
          industry.hero.subheadline,
          industry.hero.valueProposition,
          ...industry.keyTasks.map(task => task.name + ' ' + task.description),
          industry.businessImpact.efficiency + ' ' + industry.businessImpact.costSavings + ' ' + industry.businessImpact.scalability,
          ...industry.useCases.flatMap(uc => [uc.title, uc.description, uc.challenge, uc.solution, uc.results]),
          ...industry.faqs.flatMap(faq => [faq.question, faq.answer])
        ].join(' ').toLowerCase();

        // Exact matches get highest score
        if (industry.name.toLowerCase().includes(searchLower)) score += 100;
        if (industry.description.toLowerCase().includes(searchLower)) score += 50;

        // Partial matches
        const words = searchLower.split(/\s+/);
        words.forEach(word => {
          if (searchableText.includes(word)) score += 10;
        });

        // Task matches
        industry.keyTasks.forEach(task => {
          if (task.name.toLowerCase().includes(searchLower) || task.description.toLowerCase().includes(searchLower)) {
            score += 20;
          }
        });

        return { industry, score };
      })
      .filter(({ industry }) => {
        const matchesCategory = selectedCategory === "all" || industry.category === selectedCategory;
        return matchesCategory;
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score) // Sort by relevance
      .map(({ industry }) => industry);
  }, [searchTerm, selectedCategory, allIndustries]);

  const categories = [
    { value: "all", label: "All Industries" },
    ...industryCategories.map(cat => ({ value: cat.slug, label: cat.name }))
  ];

  return (
    <section
      id="industry-explorer"
      className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Industry Explorer
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Discover how BizQ transforms operations across 100+ industries. Search by industry or browse by category to see specific tasks and ROI potential.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search industries, tasks, or business impact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="text-xs"
              >
                {category.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {searchTerm ? (
          <>
            Found {filteredIndustries.length} industries
            {selectedCategory !== "all" && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
            {filteredIndustries.length === 0 && " - try different keywords"}
          </>
        ) : (
          <>
            Showing {filteredIndustries.length} of {allIndustries.length} industries
            {selectedCategory !== "all" && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </>
        )}
      </div>

      {/* Industries Grid */}
      <div className="mx-auto grid justify-center gap-6 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-3">
        {filteredIndustries.map((industry) => (
          <Card
            key={industry.id}
            className="flex flex-col justify-between border-0 bg-background shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {industry.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {industry.keyTasks.length} tasks
                </span>
              </div>
              <CardTitle className="text-xl">{industry.name}</CardTitle>
              <CardContent className="p-0 pt-2">
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                  {industry.description}
                </p>
              </CardContent>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Key Tasks Preview */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Sample Tasks</h4>
                <div className="space-y-2">
                  {industry.keyTasks.slice(0, 2).map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <span className="truncate flex-1 font-medium">{task.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">AI</span>
                          <Progress value={task.aiAutomation} className="w-6 h-1" />
                          <span className="text-xs font-medium">{task.aiAutomation}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {industry.keyTasks.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{industry.keyTasks.length - 2} more tasks...
                    </p>
                  )}
                </div>
              </div>

              {/* Business Impact */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Business Impact</h4>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Efficiency:</span>
                    <span className="font-medium">{industry.businessImpact.efficiency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Savings:</span>
                    <span className="font-medium">{industry.businessImpact.costSavings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scalability:</span>
                    <span className="font-medium">{industry.businessImpact.scalability}</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button variant="outline" size="sm" className="w-full">
                Explore {industry.name} Tasks
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredIndustries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No industries found matching your criteria.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </section>
  );
};