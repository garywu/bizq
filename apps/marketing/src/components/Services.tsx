import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MagnifierIcon, WalletIcon, ChartIcon } from "./Icons";
import cubeLeg from "../assets/cube-leg.png";

interface ServiceProps {
  title: string;
  description: string;
  icon: JSX.Element;
}

const serviceList: ServiceProps[] = [
  {
    title: "Task Catalog Marketplace",
    description:
      "Browse and execute standardized business operations. Every task has defined inputs, outputs, and pricing - just like shopping on Amazon.",
    icon: <ChartIcon />,
  },
  {
    title: "AI + Human Workforce",
    description:
      "AI handles routine operations, human experts manage complexity. Tasks automatically route to the best available worker.",
    icon: <WalletIcon />,
  },
  {
    title: "Creator Royalties",
    description:
      "Standardize a new business task and earn 5% royalties forever. Your innovation becomes a passive income stream.",
    icon: <MagnifierIcon />,
  },
];

export const Services = () => {
  return (
    <section className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-[1fr,1fr] gap-8 place-items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              Three-Marketplace{" "}
            </span>
            Architecture
          </h2>

          <p className="text-muted-foreground text-xl mt-4 mb-8 ">
            Task catalog, AI agents, and human specialists work together to fulfill every business operation.
          </p>

          <div className="flex flex-col gap-8">
            {serviceList.map(({ icon, title, description }: ServiceProps) => (
              <Card key={title}>
                <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
                  <div className="mt-1 bg-primary/20 p-1 rounded-2xl">
                    {icon}
                  </div>
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="text-md mt-2">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <img
          src={cubeLeg}
          className="w-[300px] md:w-[500px] lg:w-[600px] object-contain"
          alt="About services"
        />
      </div>
    </section>
  );
};
