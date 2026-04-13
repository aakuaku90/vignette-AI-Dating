export interface Card {
  number: number;
  text: string;
}

export interface Stage {
  number: number;
  title: string;
  subtitle: string;
  vignette: string;
  cards: Card[];
}

export const PHASE1_INTRO =
  "Before the journey begins, we want to understand your own experience with dating. For each card, swipe right if the statement is true for you, or swipe left if it is not.";

export const PHASE1_CARDS: Card[] = [
  { number: 1, text: "I have used at least one dating app before." },
  { number: 2, text: "I stopped using dating apps or use them much less than I used to." },
  { number: 3, text: "Swiping through too many profiles made the experience feel exhausting rather than exciting." },
  { number: 4, text: "Dating app profiles rarely felt like accurate or honest representations of who someone really was." },
  { number: 5, text: "Conversations on dating apps usually fizzled out before anything meaningful developed." },
  { number: 6, text: "Using dating apps made finding a partner feel more like shopping for a product than connecting with a person." },
  { number: 7, text: "I have had a connection that felt genuinely natural and unforced, either through an app or in person." },
  { number: 8, text: "I would rather meet someone through friends, at an event, or in everyday life than through an app." },
  { number: 9, text: "I am open to trying new technology if it would make dating feel less exhausting." },
  { number: 10, text: "I still believe it is possible to find a meaningful connection through a dating platform." },
];

export const PHASE2_TEXT = `It is 2026. AI is now everywhere in dating.

The apps you used before still exist, but they have changed. Hinge now coaches your conversations in real time. Bumble suggests your opening lines. Grindr has an AI wingman that writes replies on your behalf.

At the same time, a new generation of platforms has emerged that do not ask you to swipe at all. Ditto, which targets college students specifically, texts you a single curated match through iMessage and arranges the date for you. Known interviews you for 30 minutes using voice AI before introducing you to anyone. Others assemble group meetups based on your compatibility scores. One platform lets you have a simulated conversation with a potential match before deciding whether to meet them in person.

Your friends are split. Some swear by the AI-native apps. Others find them unsettling. Most are somewhere in between, using bits of AI when it feels useful and pulling back when it feels like too much.

Now it is your turn to navigate this world.`;

export const STAGES: Stage[] = [
  {
    number: 1,
    title: "The Voice That Knows You",
    subtitle: "AI Voice Onboarding",
    vignette:
      "You sign up for a new dating platform. Instead of filling out a profile, you are invited into a 20 to 30 minute voice conversation with an AI. It asks about your personality, your past relationships, what you are looking for, and what you are afraid of in a connection. It listens not just to what you say but to how you say it: your hesitations, your tone, the words you reach for when you talk about love. When the conversation ends, it tells you it has built your profile and will begin finding matches. It does not show you what it wrote about you.",
    cards: [
      { number: 1, text: "Talking openly to an AI about my values and past experiences would feel natural." },
      { number: 2, text: "An AI that listens to my tone and hesitations would understand me better than a written profile ever could." },
      { number: 3, text: "I would feel comfortable knowing an AI had built a version of me that I cannot see or edit." },
      { number: 4, text: "I trust that what an AI hears in a voice conversation would represent me fairly and accurately." },
      { number: 5, text: "The idea that an AI is analyzing how I speak, not just what I say, feels intrusive." },
      { number: 6, text: "A profile built from a voice conversation would feel more authentic than one I curated myself." },
      { number: 7, text: "I would be willing to give an AI this level of access to who I am before meeting anyone." },
      { number: 8, text: "Not being able to see or approve the profile the AI built for me would make me uncomfortable." },
    ],
  },
  {
    number: 2,
    title: "The Text You Did Not Expect",
    subtitle: "AI Curated Matching",
    vignette:
      "A few days after onboarding, you receive a text message. It is not from an app. It looks like a message from a friend. It says the platform has found someone it thinks you should meet. It includes their first name, one sentence about why the AI thinks you would connect, and a time and place for a first date later this week. There is no profile to look at. No photo. No list of interests to scan. Just a name, a reason, and a date. The AI has already made the decision. All you have to do is show up.",
    cards: [
      { number: 1, text: "Receiving a match as a text message rather than an app notification would feel more personal." },
      { number: 2, text: "I would feel comfortable going on a date with someone I know nothing about except what the AI told me." },
      { number: 3, text: "Not being able to see a photo or profile before agreeing to meet would make me feel unsafe." },
      { number: 4, text: "Having the AI make all the matching decisions on my behalf would feel like a relief." },
      { number: 5, text: "I would trust a one-sentence explanation from an AI enough to show up to a date." },
      { number: 6, text: "Not knowing why the AI chose this specific person over anyone else would bother me." },
      { number: 7, text: "This kind of introduction would feel more like how people meet through friends than through a dating app." },
      { number: 8, text: "I would be willing to show up to an AI-arranged date without seeing the other person's profile first." },
    ],
  },
  {
    number: 3,
    title: "The Gathering",
    subtitle: "AI Group Meetup",
    vignette:
      "The platform sends you an invitation. Not to a one-on-one date but to a small gathering: six people, a shared interest, a relaxed venue. The AI has evaluated your compatibility with everyone attending, though you will not know who it considers your closest match until you are there. The event has no agenda except to be in the same room as people the AI believes you belong with. There is no pressure to pair off. No opener to craft. No conversation to carry alone.",
    cards: [
      { number: 1, text: "Meeting potential partners through a group activity would feel more natural than matching one-on-one." },
      { number: 2, text: "Knowing the AI had already evaluated everyone's compatibility before the gathering would make me more relaxed." },
      { number: 3, text: "Not knowing which person the AI considers my closest match would feel exciting rather than frustrating." },
      { number: 4, text: "I would feel comfortable attending a social gathering arranged entirely by an AI." },
      { number: 5, text: "A connection made in a group setting arranged by AI would feel more organic than one made through swiping." },
      { number: 6, text: "The fact that the AI chose who was in the room would make the connections feel less genuine." },
      { number: 7, text: "This format would reduce the pressure and exhaustion I associate with traditional dating apps." },
      { number: 8, text: "I would be willing to attend an AI-arranged group meetup with strangers." },
    ],
  },
  {
    number: 4,
    title: "The Simulation",
    subtitle: "AI Compatibility Simulation",
    vignette:
      "Before you meet your match in person, the platform offers you something unusual. It has built an AI simulation of them, a version of your match constructed from their profile, their voice recordings, and their behavioral data. The simulation is designed to reflect how they actually talk, what they care about, and how they tend to respond in conversation. You can spend time talking to the simulation before deciding whether to go on the real date. Afterward, the platform gives you a compatibility score. Your match has been offered the same option with a simulation of you.",
    cards: [
      { number: 1, text: "Talking to an AI version of someone before meeting them in person is a reasonable way to assess compatibility." },
      { number: 2, text: "A simulated conversation would feel meaningful enough to inform whether I wanted to go on a real date." },
      { number: 3, text: "Knowing my match might be talking to an AI version of me before we meet would make me feel uncomfortable." },
      { number: 4, text: "I would trust a compatibility score generated from a simulated conversation." },
      { number: 5, text: "Talking to an AI simulation of someone would make the real meeting feel less authentic or surprising." },
      { number: 6, text: "I would feel comfortable with a platform building an AI version of me from my data without my detailed input on how it represents me." },
      { number: 7, text: "This feature would give me more confidence going into a first date." },
      { number: 8, text: "I would be willing to use a platform that offers AI simulations before real meetings." },
    ],
  },
  {
    number: 5,
    title: "The Date Someone Else Planned",
    subtitle: "AI Date Planning",
    vignette:
      "The date is arranged. The AI has selected a venue based on both of your profiles and interests, suggested a sequence of activities, and sent you both a set of conversation prompts tailored to the two of you. The prompts are designed to help things flow naturally if there is a quiet moment. You did not choose the restaurant. You did not come up with the conversation topics. You arrive knowing that everything about the evening was designed by an algorithm that has never met either of you.",
    cards: [
      { number: 1, text: "Having AI plan a first date would make the experience feel less stressful." },
      { number: 2, text: "A date planned by AI would still feel personal and meaningful." },
      { number: 3, text: "Using AI-generated conversation prompts during a date would help me connect more authentically." },
      { number: 4, text: "Knowing the AI had chosen the venue and activities would make the date feel less like mine." },
      { number: 5, text: "I would feel comfortable telling my date that AI planned the evening." },
      { number: 6, text: "I would trust an AI to design a date experience that reflects who I actually am." },
      { number: 7, text: "Arriving at an AI-planned date would feel exciting rather than impersonal." },
      { number: 8, text: "I would be willing to go on a first date where the AI had handled all the planning." },
    ],
  },
  {
    number: 6,
    title: "The Coach in Your Pocket",
    subtitle: "AI Conversation Coaching",
    vignette:
      "Things are going well with your match. You have been messaging for a few days and the conversation has been good. Then the platform offers you something new. While you are messaging, an AI tool can analyze the conversation in real time. It watches how the exchange is going, notices when energy is dropping, and suggests topics, responses, and timing. It does not write your messages for you but it is always there, reading everything and offering guidance. You would know it is on. Your match would not.",
    cards: [
      { number: 1, text: "Having AI guide my conversations in real time would make messaging feel less overwhelming." },
      { number: 2, text: "Messages I sent with AI coaching would still feel genuinely like me." },
      { number: 3, text: "Knowing AI was reading and analyzing every message I sent would make me uncomfortable." },
      { number: 4, text: "I would feel comfortable using AI coaching when my match does not know it is happening." },
      { number: 5, text: "A connection built with AI conversation coaching would still be authentically mine." },
      { number: 6, text: "I would trust AI suggestions to help me come across as my true self rather than a curated version of me." },
      { number: 7, text: "If my match found out I had been using AI coaching, I would feel I had done something dishonest." },
      { number: 8, text: "I would be willing to use real-time AI conversation coaching while messaging a match." },
    ],
  },
  {
    number: 7,
    title: "The Message You Did Not Write",
    subtitle: "AI Conversation Revival",
    vignette:
      "Two weeks have passed. The conversation with your match has slowly gone quiet. Neither of you has replied in five days. Then the platform sends you a notification: it has detected the silence and its AI has stepped in. It has already sent a message to your match on your behalf, a personalised prompt tailored to something both your profiles suggest you have in common. Your match received it and thinks you wrote it. The platform did not ask for your permission before sending. It did not tell your match it was AI-generated.",
    cards: [
      { number: 1, text: "An AI sending a revival message on my behalf without asking would feel like a helpful nudge." },
      { number: 2, text: "I would feel comfortable if a platform sent a message pretending to be from me without my knowledge." },
      { number: 3, text: "A conversation restarted by AI without either person knowing could still lead to a genuine connection." },
      { number: 4, text: "The fact that the platform acted without my permission would feel like a violation of my autonomy." },
      { number: 5, text: "I would want to be informed immediately that AI had sent a message on my behalf." },
      { number: 6, text: "My match deserves to know the message that restarted our conversation was AI-generated." },
      { number: 7, text: "Even if the conversation continued, knowing AI had intervened would change how I felt about the connection." },
      { number: 8, text: "I would stop using a platform that sent messages on my behalf without asking first." },
    ],
  },
  {
    number: 8,
    title: "After the Date",
    subtitle: "AI Post-Date Learning",
    vignette:
      "The date happened. The platform now invites you to debrief. An AI asks you how it went: what felt good, what felt off, whether you would see them again. But it is not just collecting feedback. Over time, it is building a detailed model of your dating patterns, your dealbreakers, the things you say you want versus the things that actually draw you in. The more dates you go on, the better it claims to know you. It uses all of this to refine who it introduces you to next. Your romantic history is becoming its training data.",
    cards: [
      { number: 1, text: "I would feel comfortable sharing honest details about how a date went with an AI." },
      { number: 2, text: "An AI learning from my dating experiences over time would find me better matches than I could find myself." },
      { number: 3, text: "Knowing that my dates are feeding into an AI model would change how I experience them while they are happening." },
      { number: 4, text: "I would feel comfortable with a platform holding detailed data about my romantic history and patterns." },
      { number: 5, text: "I would trust an AI that has learned from my past dates to make genuinely good future recommendations." },
      { number: 6, text: "The idea that my romantic experiences are becoming training data for an algorithm feels uncomfortable." },
      { number: 7, text: "I would want control over what the AI stores about me and the ability to delete it." },
      { number: 8, text: "I would be willing to use a platform that improves its matching by learning from my dating history." },
    ],
  },
  {
    number: 9,
    title: "The Connection Compared",
    subtitle: "Traditional Apps vs. AI Platforms",
    vignette:
      "You have now experienced dating through an AI-informed platform. Think back to the last time you used a traditional dating app: the swiping, the openers, the conversations that went nowhere, the occasional one that did not. Compare those two experiences. The AI arranged everything this time. The traditional app gave you control but handed you an ocean to swim in alone.",
    cards: [
      { number: 1, text: "Connecting through an AI platform feels more natural than matching through swiping." },
      { number: 2, text: "I felt more invested in the connection the AI arranged than in ones I initiated myself on a traditional app." },
      { number: 3, text: "The process of being introduced by AI felt more authentic than matching through swiping and messaging cold." },
      { number: 4, text: "I felt less in control of my romantic life when AI was making the decisions." },
      { number: 5, text: "The excitement of choosing someone myself on a traditional app is something AI cannot replicate." },
      { number: 6, text: "The exhaustion I felt on traditional apps was worse than any discomfort I felt about AI being involved." },
      { number: 7, text: "I would recommend an AI-informed platform to a friend over a traditional dating app." },
      { number: 8, text: "I believe a meaningful relationship could develop from an AI-mediated introduction just as easily as from a swipe." },
    ],
  },
  {
    number: 10,
    title: "The Reveal",
    subtitle: "AI Chatfishing Detection",
    vignette:
      "You have been messaging your match for two weeks. Things feel real. The conversation has been warm, specific, and personal. Then the platform sends you a notification. Its AI has analyzed the conversation and flagged your match's messages as likely AI-generated. Your match may have been using an AI tool to write their responses this entire time. You have been falling for someone who may not have written a single word you read. The platform gives you the option to confront them or to report the conversation and walk away.",
    cards: [
      { number: 1, text: "This revelation changes everything I thought about the connection we built." },
      { number: 2, text: "I feel deceived by my match." },
      { number: 3, text: "I feel deceived by the platform for allowing this to happen." },
      { number: 4, text: "The connection I felt was real, regardless of who or what wrote the messages." },
      { number: 5, text: "Dating platforms have a responsibility to detect and disclose AI-generated messages." },
      { number: 6, text: "Knowing this makes me question every other connection I have ever had on a dating platform." },
      { number: 7, text: "I would confront my match directly rather than report and walk away." },
      { number: 8, text: "This experience would make me more cautious about AI involvement in dating, not less open to it." },
    ],
  },
];

export const DEBRIEF_QUESTIONS = [
  "Looking back at the choices you made throughout The Chase, do they surprise you at all? Did you swipe the way you expected to?",
  "At which stage did you feel most comfortable with AI being involved in your dating life? At which stage did you feel least comfortable?",
  "Did moving through the journey change how you think about AI in dating, compared to where you started in Phase 1?",
  "At which point in the journey, if any, did AI involvement start to feel like it was undermining rather than helping genuine connection?",
  "In Stage 6, the AI was coaching your conversation while your match had no idea. How did that feel to you?",
  "In Stage 7, the AI sent a message on your behalf without asking. What does that tell you about where the line is between helpful and intrusive?",
  "Throughout the journey, there were moments where AI was making decisions you could not see or fully understand. How did that affect your sense of being in control?",
  "In Stage 1, the AI built a profile of you that it would not show you. Would knowing what it said about you have changed anything?",
  "After the reveal in Stage 10, do you think platforms have a responsibility to disclose when AI is being used on either side of a conversation?",
  "After going through The Chase, do you think AI can solve the things that frustrated you most about dating apps, or does it create new problems?",
  "Is there a form of AI involvement in this journey that you would genuinely welcome in your own life? What made it feel acceptable?",
  "If you could say one thing to the designers of AI dating platforms, what would it be?",
];
