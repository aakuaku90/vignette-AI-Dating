export interface Variant {
  code: string;
  text: string;
}

export interface Scenario {
  code: "A" | "B" | "C";
  title: string;
  subtitle: string;
  exitFactor: string;
  base: string;
  right: [Variant, Variant, Variant];
  left: [Variant, Variant, Variant];
}

export const ONBOARDING_TEXT =
  "In this exercise, you will first answer a few quick questions about your own experience with dating apps, and then you will see twelve short scenarios describing ways artificial intelligence might be involved in your dating life. For each scenario, swipe right if you would be willing to use the feature as described, and swipe left if you would not. Go with your gut. There are no right or wrong answers, and you can change your mind between scenarios. The whole exercise takes about ten minutes.";

export interface WarmupQuestion {
  key: "w1" | "w2" | "w3" | "w4";
  label: string;
  prompt: string;
  placeholder: string;
  options?: string[];
}

export const WARMUP_QUESTIONS: WarmupQuestion[] = [
  {
    key: "w1",
    label: "Prior use",
    prompt: "Which dating apps have you used, and which are you still using now, if any?",
    placeholder: "e.g., Hinge (current), Tinder, Bumble (deleted)",
    options: [
      "Hinge",
      "Tinder",
      "Bumble",
      "Coffee Meets Bagel",
      "OkCupid",
      "Match.com",
      "eharmony",
      "Plenty of Fish",
      "Happn",
      "Badoo",
      "Facebook Dating",
      "Inner Circle",
      "The League",
      "Raya",
      "Grindr",
      "Her",
      "Feeld",
      "Lex",
      "Jdate",
      "Christian Mingle",
      "Muzz",
      "Dil Mil",
      "BLK",
      "Chispa",
      "Ditto",
      "Volar",
      "Iris Dating",
      "Teaser AI",
      "Wingman",
      "Rizz",
      "Winggg",
      "None",
    ],
  },
  {
    key: "w2",
    label: "Frequency",
    prompt: "When you were using dating apps most actively, roughly how often did you open them? And how about now?",
    placeholder: "e.g., several times a day then, rarely now",
    options: [
      "Several times an hour",
      "Several times a day",
      "Once a day",
      "A few times a week",
      "Weekly",
      "Monthly",
      "Rarely",
      "Never",
      "Not using now",
    ],
  },
  {
    key: "w3",
    label: "Exit behavior",
    prompt: "Have you deleted a dating app in the past year? If so, what was the final thing that pushed you to delete it?",
    placeholder: "Share what pushed you to delete",
    options: [
      "Burnout / fatigue",
      "Met someone",
      "Entered a relationship",
      "Bad experience",
      "Safety concerns",
      "Too time-consuming",
      "Privacy concerns",
      "Too expensive / paywall",
      "Low-quality matches",
      "Too few matches",
      "Ghosting / no replies",
      "Felt addictive",
      "Mental health",
      "Taking a break",
      "Haven't deleted any",
    ],
  },
  {
    key: "w4",
    label: "Open reflection",
    prompt: "In your own words, what is the one thing about dating apps you wish worked differently?",
    placeholder: "Tap options above or type your own",
    options: [
      "Less swiping",
      "Better matching",
      "More safety / verification",
      "Less superficial",
      "Reduce ghosting",
      "More video / voice",
      "Lower cost",
      "Better filters",
      "More inclusive",
      "Less AI / more human",
      "More AI assistance",
      "Real-life meetups",
      "More privacy",
      "Better moderation",
    ],
  },
];

export const SCENARIOS: Scenario[] = [
  {
    code: "A",
    title: "AI Curated Matching",
    subtitle: "One curated match per week",
    exitFactor: "Swipe fatigue and the paradox of choice",
    base: "Instead of swiping through profiles, an AI interviews you about what you are looking for, then sends you one curated match per week directly to your phone. No swipe deck. No endless options.",
    right: [
      {
        code: "A-R1",
        text: "The AI sends you your match, and you cannot receive any new matches until you and this person have either agreed to keep seeing each other or both confirmed you want to move on.",
      },
      {
        code: "A-R2",
        text: "The AI does not explain why it matched you with this specific person. It only says the algorithm chose them for you.",
      },
      {
        code: "A-R3",
        text: "To curate the match, the AI draws on your messaging history across other dating apps, your text messages, and your social media activity. The exact inputs are not disclosed.",
      },
    ],
    left: [
      {
        code: "A-L1",
        text: "The AI suggests three matches per week, and you decide which, if any, to pursue.",
      },
      {
        code: "A-L2",
        text: "You can switch back to traditional swiping at any time if the curated match approach is not working for you.",
      },
      {
        code: "A-L3",
        text: "The AI curates matches and shows you exactly why each person was selected, including which of your stated priorities they meet and which they do not.",
      },
    ],
  },
  {
    code: "B",
    title: "AI Conversation Coaching",
    subtitle: "AI suggests replies while you message",
    exitFactor: "Perceived inauthenticity and commodification",
    base: "While messaging a match, an AI suggests replies you can send as written or edit before sending. It also flags when your own messages might come across as disinterested or aggressive and offers rewrites.",
    right: [
      {
        code: "B-R1",
        text: "Your match is using the same tool. Neither of you knows which messages came from the AI and which were written independently.",
      },
      {
        code: "B-R2",
        text: "The AI can auto-reply on your behalf when you are busy, using your past messages to imitate your tone.",
      },
      {
        code: "B-R3",
        text: "The AI learns your style so completely that over time it can draft replies that read as indistinguishable from your own writing. You rarely need to edit what it suggests.",
      },
    ],
    left: [
      {
        code: "B-L1",
        text: "The tool is off by default. You have to turn it on, and when you do, your match sees a small icon indicating that AI helped with the message.",
      },
      {
        code: "B-L2",
        text: "The AI does not suggest replies. It only flags when your own draft might land poorly and explains why, leaving the rewrite to you.",
      },
      {
        code: "B-L3",
        text: "The AI gives feedback after a conversation ends, reviewing what worked and what did not, without interfering in real time.",
      },
    ],
  },
  {
    code: "C",
    title: "AI Group Meetup",
    subtitle: "Small groups instead of one-on-one",
    exitFactor: "Desire for organic connection",
    base: "Instead of one-on-one matching, an AI assembles small groups of four to six people based on shared interests and compatibility. The group meets at a coffee shop or local event, and people connect naturally from there.",
    right: [
      {
        code: "C-R1",
        text: "The AI assembles the group, but the selection criteria are proprietary. You do not know why these particular people were grouped with you.",
      },
      {
        code: "C-R2",
        text: "The venue, time, and activity are all chosen by the AI. You show up to what it decides.",
      },
      {
        code: "C-R3",
        text: "Each participant's phone records the conversation during the meetup so the AI can analyze afterward who seemed most compatible with you.",
      },
    ],
    left: [
      {
        code: "C-L1",
        text: "The AI suggests the group, and you can opt out of any specific meetup before it happens without penalty.",
      },
      {
        code: "C-L2",
        text: "The AI proposes two or three group options, and you and the others collectively decide which to attend.",
      },
      {
        code: "C-L3",
        text: "The AI only handles logistics. The group composition is suggested by mutual friends, and the AI coordinates scheduling.",
      },
    ],
  },
];

export const SCENARIO_BY_CODE: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.code, s])
);

export const TOTAL_SWIPES = SCENARIOS.length * 4;

export interface DebriefQuestion {
  key: "d1" | "d2" | "d3" | "d4" | "d5" | "d6";
  prompt: string;
  placeholder: string;
  options?: string[];
}

export const DEBRIEF_QUESTIONS: DebriefQuestion[] = [
  {
    key: "d1",
    prompt:
      "Across all three scenarios, which felt most like something you would actually use, and which felt most like something you would never use? What made the difference?",
    placeholder: "e.g., Would use group meetups, would never use curated matches, because …",
    options: [
      "Would use curated matches (A)",
      "Would use message coaching (B)",
      "Would use group meetups (C)",
      "Would never use curated matches (A)",
      "Would never use message coaching (B)",
      "Would never use group meetups (C)",
    ],
  },
  {
    key: "d2",
    prompt:
      "For any scenario where you flipped between the base version and a later variant, what was it about that variant that changed your mind?",
    placeholder: "What specifically made you change direction?",
    options: [
      "Didn't flip on any",
      "Flipped on curated matches (A)",
      "Flipped on message coaching (B)",
      "Flipped on group meetups (C)",
    ],
  },
  {
    key: "d3",
    prompt:
      "Scenario A (AI Curated Matching) was designed around the feeling that dating apps can be exhausting. Did the AI involvement make that better, worse, or neither? Why?",
    placeholder: "Why?",
    options: ["Made it better", "Made it worse", "Neither", "Not sure"],
  },
  {
    key: "d4",
    prompt:
      "Scenario B (AI Conversation Coaching) was designed around the feeling that dating apps can feel fake. Did the AI involvement make that better, worse, or neither? Why?",
    placeholder: "Why?",
    options: ["Made it better", "Made it worse", "Neither", "Not sure"],
  },
  {
    key: "d5",
    prompt:
      "Scenario C (AI Group Meetup) was designed around the feeling that dating apps are disconnected from real life. Did the AI involvement make that better, worse, or neither? Why?",
    placeholder: "Why?",
    options: ["Made it better", "Made it worse", "Neither", "Not sure"],
  },
  {
    key: "d6",
    prompt:
      "You mentioned earlier something you wished worked differently about dating apps. Did any of the scenarios today speak to that?",
    placeholder: "Which, and how?",
    options: [
      "Yes, curated matches (A)",
      "Yes, message coaching (B)",
      "Yes, group meetups (C)",
      "Partially",
      "Not really",
    ],
  },
];

