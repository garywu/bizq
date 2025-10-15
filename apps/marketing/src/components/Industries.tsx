import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "./ui/progress";
import { industriesData } from "../data/industries";

export const Industries = () => {
  return (
    <section
      id="industries"
      className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
    >
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Industries We Serve
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          BizQ transforms business operations across industries by delegating tasks to AI and human specialists through our universal marketplace.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-6 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-3">
        {industriesData.map((industry) => (
          <Card
            key={industry.id}
            className="flex flex-col justify-between border-0 bg-background shadow-md hover:shadow-lg transition-shadow"
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
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {industry.description}
                </p>
              </CardContent>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Key Tasks</h4>
                <div className="space-y-2">
                  {industry.keyTasks.slice(0, 3).map((task, taskIndex) => (
                    <div key={taskIndex} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{task.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">AI</span>
                          <Progress value={task.aiAutomation} className="w-8 h-1" />
                        </div>
                        <Badge
                          variant={task.complexity === 'Low' ? 'secondary' : task.complexity === 'Medium' ? 'default' : 'destructive'}
                          className="text-xs px-1 py-0"
                        >
                          {task.complexity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 pt-0">
              <div className="grid grid-cols-1 gap-1 w-full text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efficiency:</span>
                  <span className="font-medium">{industry.businessImpact.efficiency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Savings:</span>
                  <span className="font-medium">{industry.businessImpact.costSavings}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};