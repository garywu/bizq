import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Zap,
  Workflow,
  BarChart3,
  ShoppingCart,
  Bot,
  Plug,
  Shield,
  Users,
  Clock,
  Target
} from "lucide-react";

interface ToolProps {
  title: string;
  description: string;
  category: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  metrics?: {
    users: string;
    efficiency: string;
    satisfaction: string;
  };
}

const tools: ToolProps[] = [
  {
    title: "Task Router",
    description: "Intelligent task delegation engine that automatically routes tasks to the most appropriate AI or human specialist based on complexity, urgency, and expertise requirements.",
    category: "Core Platform",
    icon: Zap,
    features: ["AI matching algorithms", "Human fallback routing", "Performance tracking", "Cost optimization", "Real-time routing"],
    metrics: {
      users: "10,000+",
      efficiency: "85%",
      satisfaction: "4.9/5"
    }
  },
  {
    title: "Workflow Builder",
    description: "Visual workflow designer for creating standardized business processes that can be executed by the BizQ network with drag-and-drop simplicity.",
    category: "Productivity",
    icon: Workflow,
    features: ["Drag & drop interface", "Template library", "Version control", "Integration APIs", "Conditional logic"],
    metrics: {
      users: "5,000+",
      efficiency: "70%",
      satisfaction: "4.8/5"
    }
  },
  {
    title: "Analytics Dashboard",
    description: "Comprehensive analytics and reporting on task completion rates, costs, ROI tracking, and business performance metrics with real-time insights.",
    category: "Analytics",
    icon: BarChart3,
    features: ["Real-time metrics", "ROI tracking", "Performance insights", "Custom reports", "Predictive analytics"],
    metrics: {
      users: "8,000+",
      efficiency: "60%",
      satisfaction: "4.7/5"
    }
  },
  {
    title: "Marketplace Browser",
    description: "Browse and purchase standardized business operations from our global network of verified task providers with ratings and reviews.",
    category: "Marketplace",
    icon: ShoppingCart,
    features: ["Task discovery", "Provider ratings", "Pricing comparison", "Instant deployment", "Quality assurance"],
    metrics: {
      users: "15,000+",
      efficiency: "50%",
      satisfaction: "4.6/5"
    }
  },
  {
    title: "AI Assistant",
    description: "Conversational AI interface for natural language task creation, process automation, and intelligent business guidance.",
    category: "AI & Automation",
    icon: Bot,
    features: ["Natural language processing", "Context awareness", "Multi-step tasks", "Learning adaptation", "Voice commands"],
    metrics: {
      users: "12,000+",
      efficiency: "75%",
      satisfaction: "4.8/5"
    }
  },
  {
    title: "Integration Hub",
    description: "Connect BizQ with your existing business tools and systems for seamless workflow automation and data synchronization.",
    category: "Integration",
    icon: Plug,
    features: ["API connectors", "Webhook support", "Data sync", "Custom adapters", "Enterprise SSO"],
    metrics: {
      users: "6,000+",
      efficiency: "80%",
      satisfaction: "4.9/5"
    }
  },
  {
    title: "Security & Compliance",
    description: "Enterprise-grade security with end-to-end encryption, audit trails, and compliance monitoring for regulated industries.",
    category: "Security",
    icon: Shield,
    features: ["End-to-end encryption", "Audit trails", "Compliance monitoring", "GDPR compliance", "SOC 2 certified"],
    metrics: {
      users: "3,000+",
      efficiency: "95%",
      satisfaction: "5.0/5"
    }
  },
  {
    title: "Team Collaboration",
    description: "Collaborative workspace for teams to manage tasks, share workflows, and coordinate business operations across departments.",
    category: "Collaboration",
    icon: Users,
    features: ["Team workspaces", "Task sharing", "Progress tracking", "Role-based access", "Communication tools"],
    metrics: {
      users: "9,000+",
      efficiency: "65%",
      satisfaction: "4.7/5"
    }
  },
  {
    title: "Task Scheduler",
    description: "Automated task scheduling and recurring workflow management with intelligent timing and resource allocation.",
    category: "Automation",
    icon: Clock,
    features: ["Recurring tasks", "Smart scheduling", "Resource allocation", "Deadline tracking", "Priority management"],
    metrics: {
      users: "7,000+",
      efficiency: "90%",
      satisfaction: "4.8/5"
    }
  },
  {
    title: "Performance Optimizer",
    description: "AI-powered performance optimization that continuously improves task completion rates and business outcomes.",
    category: "Optimization",
    icon: Target,
    features: ["Performance analytics", "AI optimization", "Continuous improvement", "Benchmarking", "Goal tracking"],
    metrics: {
      users: "4,000+",
      efficiency: "55%",
      satisfaction: "4.6/5"
    }
  }
];

export const Tools = () => {
  return (
    <section
      id="tools"
      className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Powerful Tools for Every Business Need
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Our comprehensive suite of 25+ tools empowers businesses to delegate, automate, and optimize every aspect of their operations with enterprise-grade reliability.
        </p>
      </div>

      {/* Tool Categories Overview */}
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Array.from(new Set(tools.map(t => t.category))).map((category) => (
            <div key={category} className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">{category}</div>
              <div className="text-lg font-bold">
                {tools.filter(t => t.category === category).length}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid justify-center gap-6 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool, index) => {
          const IconComponent = tool.icon;
          return (
            <Card
              key={index}
              className="flex flex-col justify-between border-0 bg-background shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {tool.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardContent className="p-0 pt-2">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </CardContent>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Features</h4>
                  <div className="flex flex-wrap gap-1">
                    {tool.features.slice(0, 3).map((feature, featureIndex) => (
                      <Badge key={featureIndex} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {tool.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tool.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Usage Metrics */}
                {tool.metrics && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Usage Metrics</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-bold text-primary">{tool.metrics.users}</div>
                        <div className="text-muted-foreground">Active Users</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-bold text-primary">{tool.metrics.efficiency}</div>
                        <div className="text-muted-foreground">Efficiency</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="font-bold text-primary">{tool.metrics.satisfaction}</div>
                        <div className="text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <div className="w-full text-center">
                  <span className="text-xs text-muted-foreground">Ready to deploy</span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          All tools are available immediately with our 14-day free trial
        </p>
        <div className="text-sm text-muted-foreground">
          Trusted by 50,000+ businesses across 100+ industries
        </div>
      </div>
    </section>
  );
};