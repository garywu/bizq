import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button";
import { HeroCards } from "./HeroCards";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { useState } from "react";

export const Hero = () => {
  const [chatMessage, setChatMessage] = useState("");

  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-[#F596D3]  to-[#D247BF] text-transparent bg-clip-text">
              BizQ
            </span>{" "}
            The Amazon of
          </h1>{" "}
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-[#61DAFB] via-[#1fc0f1] to-[#03a3d7] text-transparent bg-clip-text">
              Business Operations
            </span>
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Transform every business operation into a standardized, delegatable task. AI executes routine work, human experts handle complexity. Scale from 1 to 1000 businesses through familiar interfaces.
        </p>

        {/* Conversational Demo */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20 max-w-lg mx-auto lg:mx-0">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Try Universal Delegation</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-3 w-3 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground">
                "Standardize customer email responses for my e-commerce store"
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Describe your business task..."
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background/50"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <Button className="px-3 h-9">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3">Start Delegating</Button>

          <a
            rel="noreferrer noopener"
            href="#features"
            className={`w-full md:w-1/3 ${buttonVariants({
              variant: "outline",
            })}`}
          >
            Explore Features
          </a>
        </div>
      </div>

      {/* Hero cards sections */}
      <div className="z-10">
        <HeroCards />
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>
    </section>
  );
};
