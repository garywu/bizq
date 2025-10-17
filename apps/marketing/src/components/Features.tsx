import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import image from "../assets/growth.png";
import image3 from "../assets/reflecting.png";
import image4 from "../assets/looking-ahead.png";

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: "Task Catalog Marketplace",
    description:
      "Browse thousands of standardized business operations. Every task has defined inputs, outputs, and pricing - just like Amazon products.",
    image: image4,
  },
  {
    title: "Universal Delegation",
    description:
      "Transform any business operation into a delegatable task. AI handles routine work, human experts manage complexity - all through familiar interfaces.",
    image: image3,
  },
  {
    title: "Creator Royalties Forever",
    description:
      "Standardize a new business task and earn 5% royalties on every execution forever. Your innovation becomes passive income.",
    image: image,
  },
];

const featureList: string[] = [
  "Task Catalog Marketplace",
  "Universal Delegation",
  "Creator Royalties",
  "Portfolio Management",
  "AI + Human Workers",
  "Familiar Interfaces",
  "Standardized Operations",
  "Network Effects",
  "Scale to 1000 Businesses",
];

export const Features = () => {
  return (
    <section
      id="features"
      className="container py-24 sm:py-32 space-y-8"
    >
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        The{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Universal Delegation
        </span>{" "}
        Platform
      </h2>

      <div className="flex flex-wrap md:justify-center gap-4">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge
              variant="secondary"
              className="text-sm"
            >
              {feature}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent>{description}</CardContent>

            <CardFooter>
              <img
                src={image}
                alt="About feature"
                className="w-[200px] lg:w-[300px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
