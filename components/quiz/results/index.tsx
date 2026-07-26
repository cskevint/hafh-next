import { EnrollButton } from "@/components/course/EnrollButton";
import { enrollUrl } from "@/content/site";
import type { QuizResult } from "@/content/quiz";

/**
 * The three quiz result panels. Copy verbatim from
 * is-dog-boarding-right-for-me.php, emoji included.
 *
 * These live as components, not in content/, per the repo rule: repeated
 * structure with varying values goes in content/; UNIQUE structure goes in a
 * component. Each panel is ~30 lines of distinct JSX with bold runs, emoji
 * bullet lists and an embedded CTA. Forcing that into data would mean HTML
 * strings and dangerouslySetInnerHTML, reintroducing the injection surface this
 * migration removes.
 *
 * The PHP rendered ALL THREE into every response with `d-none` on the two that
 * didn't apply, so every visitor downloaded all three variants. Only the matched
 * one renders here.
 *
 * The enroll CTA points at the Kajabi checkout via content/site.ts. The PHP's
 * quiz CTAs went through /enroll, which still pointed at the OLDER
 * learn.houndawayfromhome.com host — so quiz conversions were landing on a stale
 * checkout while the course page had already moved.
 */
function Panel({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-left">
      <h3>{heading}</h3>
      {children}
    </div>
  );
}

function SuccessPanel() {
  const href = enrollUrl();
  return (
    <Panel heading="Congratulations!">
      <p>You’re ready to turn your love for dogs into unlimited earnings! 🐾 💼</p>
      <p>
        Your results show that you have what it takes to{" "}
        <b>start earning as much as you want</b> with your very own home-based
        dog-care business. 🎉
      </p>
      <p>Why wait? This is your moment:</p>
      <ul className="list-disc space-y-1 pl-8">
        <li>
          🐕 <b>You’re the perfect fit:</b> Passionate about dogs, curious, and
          ready to succeed.
        </li>
        <li>
          💰 <b>The sky’s the limit:</b> With the right strategies, you can
          transform this business into a stable and growing income stream.
        </li>
        <li>
          🏡 <b>Work from home:</b> Turn your space into a cozy haven for your
          furry clients.
        </li>
      </ul>
      <p>
        With the <b>Hound Away From Home course</b>, you’ll learn not just how to
        care for dogs, but how to turn that passion into a profitable and
        scalable business.
      </p>
      <p>
        ✨ <b>What’s in store for you?</b>
      </p>
      <ul className="list-disc space-y-1 pl-8">
        <li>Proven strategies to find clients easily.</li>
        <li>Tips for managing multiple dogs with confidence.</li>
        <li>Techniques to maximize your income from day one.</li>
      </ul>
      <p className="font-bold">Ready to start earning?</p>
      <p>
        <EnrollButton href={href} location="faqs">
          👉 Join the course now and get an exclusive discount for a limited
          time!
        </EnrollButton>
      </p>
      <p>
        The time to build a business you love and control your income is{" "}
        <b>right now</b>. You’ve got this! 🙌 🐾
      </p>
    </Panel>
  );
}

function ConsiderPanel() {
  const href = enrollUrl();
  return (
    <Panel heading="You’re Almost There!">
      <p>Just one step away from being ready to succeed! 🐾 ✨</p>
      <p>
        Your results show that you’re so close to turning your love for dogs into
        a successful business. All you need now is a little extra guidance—and
        that’s exactly what we’ve prepared for you!
      </p>
      <p className="font-bold">Take the Leap with Hound Away From Home:</p>
      <p>
        In just <b>9 days</b>, this course will show you everything you need to
        know to feel confident, prepared, and ready to start earning while doing
        what you love.
      </p>
      <p>What You’ll Learn:</p>
      <ul className="list-disc space-y-1 pl-8">
        <li>🐕 How to set up your home for dog boarding like a pro.</li>
        <li>💼 Business strategies to get your first clients and grow.</li>
        <li>🐾 Dog behavior insights to make every stay safe and joyful.</li>
      </ul>
      <p>
        <b>This is the perfect time to take that final step</b> and turn your
        dream into a reality. With the tools, tips, and techniques you’ll gain in
        this course, you’ll feel ready to welcome your first clients and start
        building your dog-care business.
      </p>
      <p className="font-bold">Ready to start your journey?</p>
      <p>
        <EnrollButton href={href} location="faqs">
          👉 Join now and transform your passion into a business in just 9 days!
        </EnrollButton>
      </p>
      <p>You’re closer than ever—let’s make it happen together! 🐕 💼</p>
    </Panel>
  );
}

function LearnMorePanel() {
  const href = enrollUrl();
  return (
    <Panel heading="Not Ready Yet?">
      <p>That’s Okay—We’ll Get You There! 🐾 🚀</p>
      <p>
        Your results show that you might not feel fully ready to dive into a
        dog-care business just yet, but if you dream of achieving financial
        independence and want to start building something of your own,{" "}
        <b>we’re here to help!</b>
      </p>
      <p>
        With the <b>Hound Away From Home course</b>, you’ll learn everything you
        need to:
      </p>
      <ul className="list-disc space-y-1 pl-8">
        <li>
          🐕 Start your business on the right scale for your current lifestyle.
        </li>
        <li>💡 Gain the confidence and knowledge to grow step by step.</li>
        <li>🏡 Build a foundation that sets you up for long-term success.</li>
      </ul>
      <p>
        This course is designed for anyone—whether you’re starting from scratch
        or looking to learn the basics—{" "}
        <b>to help you create a thriving dog-care business at your own pace.</b>
      </p>
      <p className="font-bold">Take the First Step Today:</p>
      <p>
        In just <b>9 days</b>, you’ll have the tools and confidence to:
      </p>
      <ul className="list-disc space-y-1 pl-8">
        <li>Launch your business at a manageable scale.</li>
        <li>Learn how to care for dogs while balancing your time.</li>
        <li>Start earning and growing your business as you gain experience.</li>
      </ul>
      <p className="font-bold">Your journey starts here:</p>
      <p>
        <EnrollButton href={href} location="faqs">
          👉 Sign up now and let us help you turn your dreams into a reality!
        </EnrollButton>
      </p>
      <p>
        Everyone starts somewhere, and with the right guidance, you can build a
        business that grows alongside you.{" "}
        <b>Let’s take that first step together.</b> 🐕 ✨
      </p>
    </Panel>
  );
}

export function QuizResultPanel({ result }: { result: QuizResult }) {
  if (result === "success") return <SuccessPanel />;
  if (result === "consider") return <ConsiderPanel />;
  return <LearnMorePanel />;
}
