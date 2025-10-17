import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

enum PopularPlanType {
  NO = 0,
  YES = 1,
}

interface PricingProps {
  title: string;
  popular: PopularPlanType;
  price: number;
  description: string;
  buttonText: string;
  benefitList: string[];
}

const pricingList: PricingProps[] = [
  {
    title: "Solo Entrepreneur",
    popular: 0,
    price: 29,
    description:
      "Perfect for dropshippers, consultants, and service providers managing 1-3 businesses.",
    buttonText: "Start Delegating",
    benefitList: [
      "100 task executions/month",
      "Access to task catalog",
      "AI + human workers",
      "Basic portfolio dashboard",
      "Email support",
    ],
  },
  {
    title: "Portfolio Operator",
    popular: 1,
    price: 99,
    description:
      "For entrepreneurs managing multiple businesses through standardized operations.",
    buttonText: "Scale Your Portfolio",
    benefitList: [
      "1000 task executions/month",
      "Priority task execution",
      "Custom task creation",
      "Advanced analytics",
      "Phone + email support",
    ],
  },
  {
    title: "Enterprise",
    popular: 0,
    price: 299,
    description:
      "For teams and organizations needing unlimited delegation across departments.",
    buttonText: "Contact Sales",
    benefitList: [
      "Unlimited task executions",
      "Private task catalogs",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export const Pricing = () => {
  return (
    <section
      id="pricing"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Scale from
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          1 to 1000{" "}
        </span>
        Businesses
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        Start delegating today. Pay only for task executions - no setup fees, no minimums.
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pricingList.map((pricing: PricingProps) => (
          <Card
            key={pricing.title}
            className={
              pricing.popular === PopularPlanType.YES
                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10"
                : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                {pricing.title}
                {pricing.popular === PopularPlanType.YES ? (
                  <Badge
                    variant="secondary"
                    className="text-sm text-primary"
                  >
                    Most popular
                  </Badge>
                ) : null}
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">${pricing.price}</span>
                <span className="text-muted-foreground"> /month</span>
              </div>

              <CardDescription>{pricing.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full">{pricing.buttonText}</Button>
            </CardContent>

            <hr className="w-4/5 m-auto mb-4" />

            <CardFooter className="flex">
              <div className="space-y-4">
                {pricing.benefitList.map((benefit: string) => (
                  <span
                    key={benefit}
                    className="flex"
                  >
                    <Check className="text-green-500" />{" "}
                    <h3 className="ml-2">{benefit}</h3>
                  </span>
                ))}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
