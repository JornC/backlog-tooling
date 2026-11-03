export type SoundTier = "fantastic" | "fine" | "meh";

export const TIER_WEIGHT: Record<SoundTier, number> = { fantastic: 3, fine: 2, meh: 1 };

export interface Drumroll {
  id: string;
  label: string;
  tier: SoundTier;
}

export interface VibeSound {
  id: string;
  vibe: string;
  tier: SoundTier;
}

export const DRUMROLL_RATINGS = ["Fantastic", "Fine", "Meh", "Too long", "Drop"];

export const DRUMROLLS: Drumroll[] = [
  { id: "here-we-go-again", label: "Ah sh*t, here we go again", tier: "fantastic" },
  { id: "not-entertained", label: "Are you not entertained?", tier: "fantastic" },
  { id: "bad-feeling", label: "Bad feeling about this", tier: "fantastic" },
  { id: "bigger-boat", label: "Bigger boat", tier: "fantastic" },
  { id: "box-of-chocolates", label: "Box of chocolates", tier: "fantastic" },
  { id: "hal-cant-do-that", label: "HAL: I can't do that, Dave", tier: "fantastic" },
  { id: "heres-johnny", label: "Here's Johnny!", tier: "fantastic" },
  { id: "hold-onto-your-butts", label: "Hold on to your butts", tier: "fantastic" },
  { id: "houston", label: "Houston, we have a problem", tier: "fantastic" },
  { id: "inevitable", label: "I am inevitable", tier: "fantastic" },
  { id: "inconceivable", label: "Inconceivable!", tier: "fantastic" },
  { id: "its-a-trap", label: "It's a trap!", tier: "fantastic" },
  { id: "over-9000", label: "It's over 9000!", tier: "fantastic" },
  { id: "let-the-games-begin", label: "Let the games begin", tier: "fantastic" },
  { id: "ready-to-rumble", label: "Let's get ready to rumble!", tier: "fantastic" },
  { id: "lingo", label: "Lingo goed woord", tier: "fantastic" },
  { id: "mario-here-we-go", label: "Mario: Here we go!", tier: "fantastic" },
  { id: "millionaire", label: "Millionaire suspense", tier: "fantastic" },
  { id: "moment-of-truth", label: "Moment of truth", tier: "fantastic" },
  { id: "never-tell-me-the-odds", label: "Never tell me the odds", tier: "fantastic" },
  { id: "plot-twist", label: "Plot twist!", tier: "fantastic" },
  { id: "survey-says", label: "Survey says...", tier: "fantastic" },
  { id: "whos-that-pokemon", label: "Who's that Pokémon?", tier: "fantastic" },
  { id: "shall-not-pass", label: "You shall not pass!", tier: "fantastic" },
  { id: "zarathustra", label: "2001 Zarathustra", tier: "fine" },
  { id: "fox-fanfare", label: "20th Century Fox", tier: "fine" },
  { id: "countdown-beeps", label: "Countdown beeps", tier: "fine" },
  { id: "elevator", label: "Elevator music", tier: "fine" },
  { id: "good-bad-ugly", label: "Good, Bad & Ugly", tier: "fine" },
  { id: "imperial-march", label: "Imperial March", tier: "fine" },
  { id: "its-showtime", label: "It's showtime!", tier: "fine" },
  { id: "jaws", label: "Jaws", tier: "fine" },
  { id: "jeopardy-fade", label: "Jeopardy", tier: "fine" },
  { id: "legendary", label: "Legen... dary", tier: "fine" },
  { id: "mission-impossible", label: "Mission Impossible", tier: "fine" },
  { id: "o-fortuna", label: "O Fortuna", tier: "fine" },
  { id: "show-me-the-money", label: "Show me the money!", tier: "fine" },
  { id: "show-me-what-you-got", label: "Show me what you got!", tier: "fine" },
  { id: "snare-roll-hit", label: "Snare roll + hit", tier: "fine" },
  { id: "timpani-crash", label: "Timpani roll + crash", tier: "fine" },
  { id: "tokyo-drift-drumroll", label: "Tokyo Drift drumroll", tier: "fine" },
  { id: "weakest-link", label: "Weakest Link", tier: "fine" },
  { id: "whats-in-the-box", label: "What's in the box?", tier: "fine" },
  { id: "william-tell", label: "William Tell", tier: "fine" },
  { id: "x-files", label: "X-Files", tier: "fine" },
  { id: "cant-handle-the-truth", label: "You can't handle the truth!", tier: "fine" },
  { id: "countdown-321-go", label: "3-2-1 GO", tier: "meh" },
  { id: "cinematic-riser", label: "Cinematic riser", tier: "meh" },
  { id: "deal-or-no-deal", label: "Deal or No Deal", tier: "meh" },
  { id: "dun-dun-dunnn", label: "Dun dun DUNNN", tier: "meh" },
  { id: "gong", label: "Gong", tier: "meh" },
  { id: "inception-braam", label: "Inception BRAAAM", tier: "meh" },
  { id: "law-and-order", label: "Law & Order DUN DUN", tier: "meh" },
  { id: "pirates", label: "Pirates of the Caribbean", tier: "meh" },
  { id: "tension-riser", label: "Tension riser", tier: "meh" },
  { id: "twilight-zone", label: "Twilight Zone", tier: "meh" },
  { id: "wait-for-it", label: "Wait for it...", tier: "meh" },
  { id: "zelda-item", label: "Zelda item get", tier: "meh" },
  { id: "zelda-secret", label: "Zelda secret", tier: "meh" },
];

export const VIBE_SOUNDS: VibeSound[] = [
  { id: "agree-noice", vibe: "agree", tier: "fine" },
  { id: "agree-this-is-the-way", vibe: "agree", tier: "fine" },
  { id: "agree-thats-right", vibe: "agree", tier: "fine" },
  { id: "agree-goddamn-right", vibe: "agree", tier: "fine" },
  { id: "disagree-bruh", vibe: "disagree", tier: "fine" },
  { id: "disagree-denied", vibe: "disagree", tier: "fine" },
  { id: "disagree-noooo", vibe: "disagree", tier: "fine" },
  { id: "coffee-tired-grandpa", vibe: "coffee", tier: "fantastic" },
  { id: "coffee-can-open", vibe: "coffee", tier: "fine" },
  { id: "coffee-break-signori", vibe: "coffee", tier: "fine" },
  { id: "coffee-big-time", vibe: "coffee", tier: "fine" },
  { id: "coffee-espresso-macchiato", vibe: "coffee", tier: "fine" },
  { id: "coffee-could-use-some", vibe: "coffee", tier: "fine" },
  { id: "confused-excuse-me", vibe: "confused", tier: "fine" },
  { id: "confused-huh", vibe: "confused", tier: "fine" },
  { id: "confused-huh-short", vibe: "confused", tier: "fine" },
  { id: "confused-tim-allen", vibe: "confused", tier: "fine" },
  { id: "skeptical-hmmm", vibe: "skeptical", tier: "fine" },
  { id: "skeptical-tununu", vibe: "skeptical", tier: "fine" },
  { id: "skeptical-villager", vibe: "skeptical", tier: "fine" },
  { id: "mind-anime-wow", vibe: "mindblown", tier: "fine" },
  { id: "mind-big-brain", vibe: "mindblown", tier: "fine" },
  { id: "mind-stable-genius", vibe: "mindblown", tier: "fine" },
  { id: "mind-mario-whoa", vibe: "mindblown", tier: "fine" },
  { id: "mind-omg", vibe: "mindblown", tier: "fine" },
  { id: "mind-owen-wilson", vibe: "mindblown", tier: "fine" },
  { id: "mind-vine-boom", vibe: "mindblown", tier: "fine" },
  { id: "mind-wow-voice", vibe: "mindblown", tier: "fine" },
  { id: "mind-unbelievable", vibe: "mindblown", tier: "fine" },
  { id: "love-angel-aura", vibe: "love", tier: "fine" },
  { id: "love-careless-whisper", vibe: "love", tier: "fine" },
  { id: "love-i-love-it", vibe: "love", tier: "fine" },
  { id: "love-impact", vibe: "love", tier: "fine" },
  { id: "ready-leeroy", vibe: "ready", tier: "fine" },
  { id: "ready-lets-do-this", vibe: "ready", tier: "fine" },
  { id: "ready-mario-kart", vibe: "ready", tier: "fine" },
  { id: "ready-lets-go-cs", vibe: "ready", tier: "fine" },
];
