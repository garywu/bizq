import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TestimonialProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
}

const testimonials: TestimonialProps[] = [
  {
    image: "https://github.com/shadcn.png",
    name: "Sarah Chen",
    userName: "@sarah_dropship",
    comment: "I went from managing 1 store to 5 businesses in 3 months. BizQ handles all the operations I used to do manually.",
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Marcus Rodriguez",
    userName: "@marcus_consult",
    comment:
      "The task catalog is incredible. I can delegate complex consulting deliverables that used to take me days. Now it's standardized and automated.",
  },

  {
    image: "https://github.com/shadcn.png",
    name: "Jennifer Walsh",
    userName: "@jen_restaurant",
    comment:
      "Running 3 restaurants used to mean 80 hours/week. Now I spend 10 hours reviewing AI-completed tasks and approving high-value decisions.",
  },
  {
    image: "https://github.com/shadcn.png",
    name: "David Kim",
    userName: "@david_portfolio",
    comment:
      "I created a custom task for 'viral TikTok analysis' and now earn $250/month in royalties. The platform turns expertise into passive income.",
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Lisa Thompson",
    userName: "@lisa_ecommerce",
    comment:
      "Customer service used to be my bottleneck. Now AI handles 90% of inquiries and routes complex cases to human experts automatically.",
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Alex Johnson",
    userName: "@alex_agency",
    comment:
      "We standardized our entire client onboarding process. New clients get the same high-quality experience without us doing repetitive work.",
  },
];

export const Testimonials = () => {
  return (
    <section
      id="testimonials"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold">
        From Solo to
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          Portfolio Operator{" "}
        </span>
      </h2>

      <p className="text-xl text-muted-foreground pt-4 pb-8">
        Real entrepreneurs using BizQ to scale from 1 to many businesses through universal delegation.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 sm:block columns-2  lg:columns-3 lg:gap-6 mx-auto space-y-4 lg:space-y-6">
        {testimonials.map(
          ({ image, name, userName, comment }: TestimonialProps) => (
            <Card
              key={userName}
              className="max-w-md md:break-inside-avoid overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarImage
                    alt=""
                    src={image}
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription>{userName}</CardDescription>
                </div>
              </CardHeader>

              <CardContent>{comment}</CardContent>
            </Card>
          )
        )}
      </div>
    </section>
  );
};
