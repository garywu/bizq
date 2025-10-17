import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "How does BizQ differ from automation tools like Zapier?",
    answer: "BizQ is not just automation - it's universal delegation. We standardize entire business operations into delegatable tasks, not just API connections. AI handles routine work, human experts manage complexity, all through familiar interfaces.",
    value: "item-1",
  },
  {
    question: "Can I create my own tasks for the catalog?",
    answer:
      "Absolutely! When you standardize a new business operation, you earn 5% royalties on every execution forever. Your innovation becomes passive income while helping other businesses.",
    value: "item-2",
  },
  {
    question: "What happens when AI can't complete a task?",
    answer:
      "Tasks automatically route to qualified human specialists. You set confidence thresholds, and our system ensures the right worker (AI or human) handles each task based on complexity and your preferences.",
    value: "item-3",
  },
  {
    question: "How do royalties work for task creators?",
    answer: "Standardize a task definition and earn 5% on every execution. Unlike traditional marketplaces, royalties continue forever even when AI takes over. One good task can generate thousands in passive income.",
    value: "item-4",
  },
  {
    question: "Can I manage multiple businesses with BizQ?",
    answer:
      "Yes! BizQ transforms solo entrepreneurs into portfolio operators. Manage 1-1000 businesses through standardized operations. Our portfolio dashboard shows all businesses at once with pattern recognition across your entire operation.",
    value: "item-5",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <Accordion
        type="single"
        collapsible
        className="w-full AccordionRoot"
      >
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem
            key={value}
            value={value}
          >
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          rel="noreferrer noopener"
          href="#"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
