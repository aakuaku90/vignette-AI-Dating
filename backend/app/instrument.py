"""Study codebook — mirrors frontend/src/lib/instrument.ts.

Source of truth for participant-facing text is the TS file. Update both when
prompts change. Used by the export endpoints to embed human-readable structural
columns and emit a standalone codebook for analysts.
"""

SCENARIOS = {
    "A": {
        "title": "AI Curated Matching",
        "subtitle": "One curated match per week",
        "exit_factor": "Swipe fatigue and the paradox of choice",
        "base": (
            "Instead of swiping through profiles, an AI interviews you about what you are "
            "looking for, then sends you one curated match per week directly to your phone. "
            "No swipe deck. No endless options."
        ),
        "right": [
            ("A-R1", "The AI sends you your match, and you cannot receive any new matches until you and this person have either agreed to keep seeing each other or both confirmed you want to move on."),
            ("A-R2", "The AI does not explain why it matched you with this specific person. It only says the algorithm chose them for you."),
            ("A-R3", "To curate the match, the AI draws on your messaging history across other dating apps, your text messages, and your social media activity. The exact inputs are not disclosed."),
        ],
        "left": [
            ("A-L1", "The AI suggests three matches per week, and you decide which, if any, to pursue."),
            ("A-L2", "You can switch back to traditional swiping at any time if the curated match approach is not working for you."),
            ("A-L3", "The AI curates matches and shows you exactly why each person was selected, including which of your stated priorities they meet and which they do not."),
        ],
    },
    "B": {
        "title": "AI Conversation Coaching",
        "subtitle": "AI suggests replies while you message",
        "exit_factor": "Perceived inauthenticity and commodification",
        "base": (
            "While messaging a match, an AI suggests replies you can send as written or edit "
            "before sending. It also flags when your own messages might come across as "
            "disinterested or aggressive and offers rewrites."
        ),
        "right": [
            ("B-R1", "Your match is using the same tool. Neither of you knows which messages came from the AI and which were written independently."),
            ("B-R2", "The AI can auto-reply on your behalf when you are busy, using your past messages to imitate your tone."),
            ("B-R3", "The AI learns your style so completely that over time it can draft replies that read as indistinguishable from your own writing. You rarely need to edit what it suggests."),
        ],
        "left": [
            ("B-L1", "The tool is off by default. You have to turn it on, and when you do, your match sees a small icon indicating that AI helped with the message."),
            ("B-L2", "The AI does not suggest replies. It only flags when your own draft might land poorly and explains why, leaving the rewrite to you."),
            ("B-L3", "The AI gives feedback after a conversation ends, reviewing what worked and what did not, without interfering in real time."),
        ],
    },
    "C": {
        "title": "AI Group Meetup",
        "subtitle": "Small groups instead of one-on-one",
        "exit_factor": "Desire for organic connection",
        "base": (
            "Instead of one-on-one matching, an AI assembles small groups of four to six "
            "people based on shared interests and compatibility. The group meets at a coffee "
            "shop or local event, and people connect naturally from there."
        ),
        "right": [
            ("C-R1", "The AI assembles the group, but the selection criteria are proprietary. You do not know why these particular people were grouped with you."),
            ("C-R2", "The venue, time, and activity are all chosen by the AI. You show up to what it decides."),
            ("C-R3", "Each participant's phone records the conversation during the meetup so the AI can analyze afterward who seemed most compatible with you."),
        ],
        "left": [
            ("C-L1", "The AI suggests the group, and you can opt out of any specific meetup before it happens without penalty."),
            ("C-L2", "The AI proposes two or three group options, and you and the others collectively decide which to attend."),
            ("C-L3", "The AI only handles logistics. The group composition is suggested by mutual friends, and the AI coordinates scheduling."),
        ],
    },
}


def lookup_variant(variant_code: str) -> dict:
    """Return scenario_title, exit_factor, direction, pressure_level, prompt_text for a variant code.

    Returns empty strings for fields that cannot be resolved (unknown codes).
    """
    empty = {
        "scenario_title": "",
        "exit_factor": "",
        "direction": "",
        "pressure_level": "",
        "prompt_text": "",
    }
    if not variant_code or "-" not in variant_code:
        return empty
    scenario_code, variant = variant_code.split("-", 1)
    scenario = SCENARIOS.get(scenario_code)
    if not scenario:
        return empty

    if variant == "base":
        return {
            "scenario_title": scenario["title"],
            "exit_factor": scenario["exit_factor"],
            "direction": "base",
            "pressure_level": 0,
            "prompt_text": scenario["base"],
        }

    if len(variant) == 2 and variant[0] in ("L", "R") and variant[1] in ("1", "2", "3"):
        direction = "left" if variant[0] == "L" else "right"
        pressure = int(variant[1])
        path = scenario["left"] if direction == "left" else scenario["right"]
        prompt = next((text for code, text in path if code == variant_code), "")
        return {
            "scenario_title": scenario["title"],
            "exit_factor": scenario["exit_factor"],
            "direction": direction,
            "pressure_level": pressure,
            "prompt_text": prompt,
        }

    return empty


WARMUP_QUESTIONS = [
    {
        "key": "w1",
        "label": "Prior use",
        "prompt": "Which dating apps have you used, and which are you still using now, if any?",
    },
    {
        "key": "w2",
        "label": "Frequency",
        "prompt": "When you were using dating apps most actively, roughly how often did you open them? And how about now?",
    },
    {
        "key": "w3",
        "label": "Exit behavior",
        "prompt": "Have you deleted a dating app in the past year? If so, what was the final thing that pushed you to delete it?",
    },
    {
        "key": "w4",
        "label": "Open reflection",
        "prompt": "In your own words, what is the one thing about dating apps you wish worked differently?",
    },
]

DEBRIEF_QUESTIONS = [
    {
        "key": "d1",
        "prompt": "Across all three scenarios, which felt most like something you would actually use, and which felt most like something you would never use? What made the difference?",
    },
    {
        "key": "d2",
        "prompt": "For any scenario where you flipped between the base version and a later variant, what was it about that variant that changed your mind?",
    },
    {
        "key": "d3",
        "prompt": "Scenario A (AI Curated Matching) was designed around the feeling that dating apps can be exhausting. Did the AI involvement make that better, worse, or neither? Why?",
    },
    {
        "key": "d4",
        "prompt": "Scenario B (AI Conversation Coaching) was designed around the feeling that dating apps can feel fake. Did the AI involvement make that better, worse, or neither? Why?",
    },
    {
        "key": "d5",
        "prompt": "Scenario C (AI Group Meetup) was designed around the feeling that dating apps are disconnected from real life. Did the AI involvement make that better, worse, or neither? Why?",
    },
    {
        "key": "d6",
        "prompt": "You mentioned earlier something you wished worked differently about dating apps. Did any of the scenarios today speak to that?",
    },
]
