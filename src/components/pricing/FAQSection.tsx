import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    q: 'What counts as 1 credit?',
    a: "One credit gets you one generated output — either a one-pager or a talking script. You pick the format after you dump your thoughts. If you want both formats for the same scenario, that's 2 credits.",
  },
  {
    q: 'Does refining cost credits?',
    a: "No. Once you've generated an output, you can refine it as many times as you want — shorter, bolder, simpler, or with custom instructions. Refining is always free.",
  },
  {
    q: 'What about Practice Mode, PDF export, and the teleprompter?',
    a: "All free. Always. These features don't use credits. Once you have an output, you can practice it, export it, and rehearse it as much as you need.",
  },
  {
    q: 'Do credits expire?',
    a: 'No. Your credits stay in your account until you use them. Buy today, use next year. No rush.',
  },
  {
    q: 'What can I use PitchVoid for?',
    a: "Anything where you need to organize your thoughts before speaking or presenting. Investor pitches, job interviews, salary negotiations, client proposals, team updates, speeches, tough conversations, comedy sets, therapy prep — if you have scattered thoughts and need clarity, PitchVoid handles it.",
  },
  {
    q: 'Does PitchVoid write content for me?',
    a: "No. PitchVoid organizes YOUR thoughts. It doesn't invent facts, add statistics, or create content you didn't provide. What you put in is what comes out — just structured and clear. If you leave something out, PitchVoid will flag what's missing so you can fill the gap yourself.",
  },
  {
    q: 'Is my data private?',
    a: "Yes. Your inputs and outputs are stored securely and are only visible to you. We don't share your content with other users, sell your data, or use your inputs to train AI models. You can delete your projects and account at any time.",
  },
  {
    q: 'What AI model does PitchVoid use?',
    a: "PitchVoid uses current commercial AI models to structure your inputs. We don't disclose the specific provider, and we may update or change models over time to improve output quality. The AI is a tool in the process — the thinking is yours.",
  },
  {
    q: 'Can I get a refund?',
    a: "If you experience a technical issue that prevents credits from working as expected, contact us and we'll make it right. Because credits are consumed instantly upon generation, we can't offer refunds for used credits. Unused credits can be refunded within 14 days of purchase.",
  },
  {
    q: 'What happens to my free credits?',
    a: 'Every new account gets 3 free credits. They work exactly like purchased credits — same features, same quality, no watermarks, no limitations. They never expire.',
  },
  {
    q: 'Will there be a subscription option?',
    a: "Not right now. We believe you should pay for what you use, not for what you might use. If demand changes, we'll revisit — but credits feel right for how people actually use PitchVoid.",
  },
];

export default function FAQSection() {
  return (
    <section className="max-w-2xl mx-auto mt-16 sm:mt-20 px-4 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-8 font-display">
        Questions? Straight answers.
      </h2>

      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border-b border-border/40"
          >
            <AccordionTrigger className="text-[15px] text-foreground font-medium hover:no-underline py-5 text-left">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted-foreground leading-relaxed pb-5">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
