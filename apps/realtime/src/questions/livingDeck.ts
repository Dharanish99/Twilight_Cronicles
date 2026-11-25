import { createHash } from "node:crypto";
import type { CategoryId } from "@twilight/shared-types";
import type { SeedQuestion } from "./select";

interface LivingRecipe {
  id: string;
  intensity: number;
  subcategory: string;
  templates: readonly string[];
  topics: readonly string[];
  alternatives?: readonly string[];
  followUps: readonly string[];
}

interface LivingVariant {
  id: string;
  text: string;
  intensity: number;
  subcategory: string;
  followUpPrompt: string;
}

const LENSES = [
  "these days",
  "when you have a quiet moment",
  "after a full week",
  "when life gets busy",
  "when you surprise yourself",
  "when you have time to daydream",
  "when you look back recently",
  "when you imagine telling the story later",
] as const;

/**
 * A local, curated prompt generator. Each recipe creates hundreds of distinct
 * safe prompts without sending player content to an external model or service.
 */
const RECIPES: Record<CategoryId, readonly LivingRecipe[]> = {
  deep: [
    {
      id: "belief",
      intensity: 2,
      subcategory: "beliefs",
      templates: [
        "Thinking about {topic} {lens}, what belief has shifted for you?",
        "What has {topic} taught you about yourself {lens}?",
        "When it comes to {topic} {lens}, what feels more true to you than it used to?",
      ],
      topics: ["trust", "rest", "belonging", "success", "home", "courage", "time", "forgiveness", "being known", "change"],
      followUps: ["You can keep this as concrete or as reflective as you like.", "What made that answer come to mind?", "There is no need to have a polished answer."],
    },
    {
      id: "values",
      intensity: 2,
      subcategory: "values",
      templates: [
        "What does {topic} look like in a life that feels good to you {lens}?",
        "What small choice around {topic} says a lot about what you value {lens}?",
        "If someone understood your relationship with {topic} {lens}, what would they understand about you?",
      ],
      topics: ["peace", "ambition", "kindness", "independence", "community", "honesty", "wonder", "stability", "creativity", "growth"],
      followUps: ["A small example is enough.", "What makes that matter to you?", "Answer from where you are now."],
    },
    {
      id: "perspective",
      intensity: 2,
      subcategory: "perspective",
      templates: [
        "What question about {topic} do you find yourself returning to {lens}?",
        "What is something about {topic} that people often make too simple {lens}?",
        "Where do you notice a gap between what you expected from {topic} and what it is actually like {lens}?",
      ],
      topics: ["friendship", "love", "adulthood", "identity", "confidence", "healing", "work", "family", "change", "happiness"],
      followUps: ["There is room for an unfinished thought.", "What part feels most worth talking about?", "Let the answer be as simple as it needs to be."],
    },
  ],
  playful: [
    {
      id: "tiny-drama",
      intensity: 1,
      subcategory: "tiny_drama",
      templates: [
        "If {topic} became a dramatic headline {lens}, what would it say?",
        "What is the funniest possible rule for {topic} {lens}?",
        "If you had to give {topic} a ridiculous award {lens}, what would it win?",
      ],
      topics: ["your morning routine", "a group chat", "a grocery run", "a lazy Sunday", "a first date", "a road trip", "a work meeting", "ordering food", "a rainy evening", "a family dinner"],
      followUps: ["Commit to the bit.", "The more specific, the better.", "A terrible answer is often the best answer."],
    },
    {
      id: "secret-talent",
      intensity: 1,
      subcategory: "secret_talent",
      templates: [
        "What oddly specific talent would help you dominate {topic} {lens}?",
        "What useless superpower would make {topic} easier {lens}?",
        "If you could add one absurd shortcut to {topic} {lens}, what would it be?",
      ],
      topics: ["getting ready", "making friends", "choosing a movie", "packing a bag", "finding parking", "doing laundry", "making breakfast", "replying to messages", "keeping plants alive", "taking a nap"],
      followUps: ["You may invent a completely fake skill.", "There are no practical answers required.", "Defend your answer if you feel like it."],
    },
    {
      id: "alternate-universe",
      intensity: 1,
      subcategory: "alternate_universe",
      templates: [
        "In an alternate universe, what would be the strangest version of {topic} {lens}?",
        "What would your character do first if {topic} turned into a game {lens}?",
        "If {topic} had a theme song {lens}, what kind of song would it be?",
      ],
      topics: ["your ideal weekend", "a cozy night in", "your next adventure", "a birthday", "a shared apartment", "a surprise party", "a beach day", "a holiday", "a coffee date", "an ordinary Tuesday"],
      followUps: ["Make it cinematic if you want.", "The answer can be delightfully unreasonable.", "Picture the scene, then tell it."],
    },
  ],
  emotional: [
    {
      id: "care",
      intensity: 2,
      subcategory: "care",
      templates: [
        "Thinking about {topic} {lens}, what kind of care feels most meaningful to you?",
        "When it comes to {topic} {lens}, what do you wish people understood a little sooner?",
        "What would make you feel more supported around {topic} {lens}?",
      ],
      topics: ["a hard day", "feeling overwhelmed", "a big decision", "feeling proud", "a setback", "a transition", "missing someone", "celebrating good news", "being uncertain", "needing space"],
      followUps: ["You can answer gently and keep your boundaries.", "A small, honest answer is enough.", "Share only what feels comfortable."],
    },
    {
      id: "being-seen",
      intensity: 2,
      subcategory: "being_seen",
      templates: [
        "What helps you feel genuinely seen around {topic} {lens}?",
        "What part of {topic} do you tend to carry quietly {lens}?",
        "When {topic} comes up {lens}, what response from someone close would land well?",
      ],
      topics: ["your hopes", "your worries", "your effort", "your creativity", "your boundaries", "your progress", "your uncertainty", "your joy", "your needs", "your growth"],
      followUps: ["There is no pressure to go deeper than you want.", "You can name a feeling, a need, or an example.", "Take your time with this one."],
    },
    {
      id: "gentle-truth",
      intensity: 2,
      subcategory: "gentle_truth",
      templates: [
        "What is a gentle truth about {topic} that you are learning to accept {lens}?",
        "What would you like to be kinder to yourself about when it comes to {topic} {lens}?",
        "What does a little more ease around {topic} look like for you {lens}?",
      ],
      topics: ["mistakes", "rest", "asking for help", "starting over", "not knowing", "letting go", "being vulnerable", "taking up space", "slowing down", "trying again"],
      followUps: ["Answer from the place you are in today.", "This can stay light if that feels right.", "There is no correct way to feel about it."],
    },
  ],
  curious: [
    {
      id: "wonder",
      intensity: 1,
      subcategory: "wonder",
      templates: [
        "Thinking about {topic} {lens}, what are you most curious to understand?",
        "What question about {topic} would you happily spend an afternoon exploring {lens}?",
        "What detail about {topic} keeps catching your attention {lens}?",
      ],
      topics: ["people", "cities", "nature", "creativity", "language", "technology", "food", "music", "habits", "memory"],
      followUps: ["There is no need to know the answer.", "Follow the thing that makes you lean in.", "A niche curiosity absolutely counts."],
    },
    {
      id: "learning",
      intensity: 1,
      subcategory: "learning",
      templates: [
        "What is something about {topic} you would love a beginner-friendly explanation of {lens}?",
        "If you could borrow someone’s expertise in {topic} for an hour {lens}, what would you ask?",
        "What is a small mystery about {topic} you would enjoy solving {lens}?",
      ],
      topics: ["cooking", "design", "space", "history", "gardening", "films", "animals", "travel", "the brain", "sports"],
      followUps: ["Curiosity beats expertise here.", "You can choose something wonderfully specific.", "What would make the rabbit hole worth it?"],
    },
    {
      id: "observation",
      intensity: 1,
      subcategory: "observation",
      templates: [
        "What do you notice about {topic} that other people might overlook {lens}?",
        "What pattern around {topic} has become more interesting to you {lens}?",
        "What tiny part of {topic} has more personality than it gets credit for {lens}?",
      ],
      topics: ["a familiar place", "a favorite routine", "how people talk", "a local street", "a shared meal", "your workspace", "the weather", "a favorite object", "morning light", "a public space"],
      followUps: ["A sensory detail can make the answer vivid.", "Tell the version only you would notice.", "The small things are often the fun ones."],
    },
  ],
  memories: [
    {
      id: "ordinary-moment",
      intensity: 1,
      subcategory: "ordinary_moment",
      templates: [
        "Thinking about {topic} {lens}, what small detail do you remember most clearly?",
        "What ordinary moment involving {topic} still feels unexpectedly vivid {lens}?",
        "What sound, smell, or image brings you back to {topic} {lens}?",
      ],
      topics: ["a school day", "a family meal", "a rainy afternoon", "a summer break", "a long ride home", "a neighborhood shop", "a celebration", "a quiet morning", "a childhood room", "a favorite season"],
      followUps: ["Start with the first detail that appears.", "A tiny memory is enough.", "You can paint the scene in a few words."],
    },
    {
      id: "shared-history",
      intensity: 1,
      subcategory: "shared_history",
      templates: [
        "What kind of {topic} do you hope you will remember fondly later {lens}?",
        "What makes a memory about {topic} stick with you {lens}?",
        "If you could put one version of {topic} in a time capsule {lens}, what would it be like?",
      ],
      topics: ["a good conversation", "a spontaneous plan", "a cozy evening", "a shared joke", "a first impression", "a long walk", "a simple meal", "a trip", "a birthday", "a regular day"],
      followUps: ["Imagine the feeling, not just the event.", "A future memory counts too.", "What makes it worth keeping?"],
    },
    {
      id: "time-capsule",
      intensity: 1,
      subcategory: "time_capsule",
      templates: [
        "What would a younger version of you find surprising about {topic} {lens}?",
        "What is one thing about {topic} that has stayed with you over time {lens}?",
        "What would you tell yourself from an earlier chapter about {topic} {lens}?",
      ],
      topics: ["what makes you laugh", "your idea of home", "friendship", "being brave", "your favorite things", "how you spend free time", "what success means", "how you handle change", "your taste in music", "what you need from others"],
      followUps: ["You can keep the answer warm and simple.", "There is no need to make it profound.", "Let the contrast do the work."],
    },
  ],
  future: [
    {
      id: "hope",
      intensity: 1,
      subcategory: "hope",
      templates: [
        "When you imagine {topic} {lens}, what do you hope it feels like?",
        "What small sign would tell you that {topic} is moving in a good direction {lens}?",
        "What part of {topic} are you quietly looking forward to {lens}?",
      ],
      topics: ["the next season of life", "a future home", "your next adventure", "a new routine", "a meaningful project", "more free time", "a future celebration", "a fresh start", "a slower week", "the next year"],
      followUps: ["A modest hope is just as welcome as a big one.", "You can describe a feeling, a scene, or a plan.", "What makes that future appealing?"],
    },
    {
      id: "possibility",
      intensity: 1,
      subcategory: "possibility",
      templates: [
        "What possibility around {topic} would you like to make more room for {lens}?",
        "If {topic} went a little better than expected {lens}, what might change?",
        "What experiment with {topic} would be fun to try someday {lens}?",
      ],
      topics: ["learning something new", "travel", "your creativity", "your health", "a friendship", "a shared tradition", "a hobby", "your space", "your confidence", "a weekend plan"],
      followUps: ["Keep it playful and possible.", "No commitment is required.", "What is the first image that comes to mind?"],
    },
    {
      id: "future-self",
      intensity: 1,
      subcategory: "future_self",
      templates: [
        "What do you think a future version of you will appreciate about {topic} {lens}?",
        "What would make {topic} feel more like your own choice {lens}?",
        "What is one gentle thing you would like to carry forward in {topic} {lens}?",
      ],
      topics: ["your daily life", "the way you spend time", "your relationships", "your work", "your creative side", "your environment", "how you rest", "how you celebrate", "how you learn", "how you show up"],
      followUps: ["It can be as practical or dreamy as you like.", "Answer from your present self.", "What would make that feel sustainable?"],
    },
  ],
  chaotic: [
    {
      id: "made-up-law",
      intensity: 1,
      subcategory: "made_up_law",
      templates: [
        "What ridiculous law should apply to {topic} {lens}?",
        "What would be the worst possible upgrade to {topic} {lens}?",
        "If you were in charge of {topic} {lens}, what absurd policy would you introduce?",
      ],
      topics: ["a weekend", "a house party", "a morning", "public transport", "a restaurant", "a holiday", "a group project", "a gym", "a supermarket", "a video call"],
      followUps: ["Logic is optional.", "The stranger, the better.", "Treat this like a very bad government memo."],
    },
    {
      id: "sudden-plot",
      intensity: 1,
      subcategory: "sudden_plot",
      templates: [
        "If {topic} developed an unexpected plot twist {lens}, what would happen?",
        "What object would cause maximum chaos in {topic} {lens}?",
        "What harmless disaster would make {topic} unforgettable {lens}?",
      ],
      topics: ["a dinner", "a date", "a road trip", "a meeting", "a picnic", "a birthday", "a vacation", "a movie night", "a coffee run", "a quiet evening"],
      followUps: ["Build the scene one strange detail at a time.", "A cartoon-level problem is encouraged.", "There are no consequences in this universe."],
    },
    {
      id: "unhelpful-expert",
      intensity: 1,
      subcategory: "unhelpful_expert",
      templates: [
        "What completely unhelpful advice would an expert give about {topic} {lens}?",
        "What would a tiny villain do to sabotage {topic} {lens}?",
        "If {topic} needed a mascot {lens}, what bizarre creature would represent it?",
      ],
      topics: ["making a decision", "getting organized", "meeting new people", "relaxing", "choosing an outfit", "being productive", "getting somewhere on time", "cooking", "sleeping", "having fun"],
      followUps: ["The answer may be gloriously unhelpful.", "Give the mascot a name if it helps.", "You can make up the expertise."],
    },
  ],
  wouldYouRather: [
    {
      id: "comfort",
      intensity: 1,
      subcategory: "comfort",
      templates: [
        "Would you rather have {topic} {lens}, or {alternative}?",
        "For one year {lens}, would you rather {topic} or {alternative}?",
        "If you had to choose {lens}, would you rather {topic} or {alternative}?",
      ],
      topics: ["always know the best snack nearby", "have a perfect nap on demand", "never wait in a queue", "find a cozy seat anywhere", "make any drink exactly right", "wake up fully rested", "always pick the best movie", "have ideal weather for plans", "remember every good recommendation", "make a room instantly quieter"],
      alternatives: ["always know the nearest clean restroom", "have a blanket appear whenever you sit down", "always get the green light", "make any chair feel comfortable", "make any meal taste one level better", "fall asleep instantly", "always choose the right playlist", "have every umbrella work perfectly", "never lose your keys", "make any room smell like fresh bread"],
      followUps: ["Choose first, then defend the choice.", "There is no sensible answer required.", "What is the hidden drawback of the other option?"],
    },
    {
      id: "adventure",
      intensity: 1,
      subcategory: "adventure",
      templates: [
        "Would you rather {topic} {lens}, or {alternative}?",
        "If this were your only choice {lens}, would you rather {topic} or {alternative}?",
        "For a memorable story {lens}, would you rather {topic} or {alternative}?",
      ],
      topics: ["take a surprise train somewhere", "follow a mysterious map", "say yes to a random class", "visit a place with no itinerary", "join a costume party unnoticed", "spend a day without a phone", "try a hobby chosen by a friend", "sleep under the stars", "take the scenic route everywhere", "be dropped into a movie set"],
      alternatives: ["take a midnight walk with no destination", "open a door chosen by a coin flip", "let a stranger choose your lunch", "accept the first local recommendation", "wear an outfit chosen at random", "trade phones with a friend for an hour", "learn a dance in public", "camp somewhere unexpected", "take a ferry just because it leaves soon", "be an extra in a musical"],
      followUps: ["Explain the first scene of your choice.", "What would make the other option a hard no?", "Feel free to negotiate imaginary details."],
    },
    {
      id: "tradeoff",
      intensity: 1,
      subcategory: "tradeoff",
      templates: [
        "Would you rather {topic} {lens}, or {alternative}?",
        "When forced to pick {lens}, would you rather {topic} or {alternative}?",
        "For a harmless life upgrade {lens}, would you rather {topic} or {alternative}?",
      ],
      topics: ["be famous for a tiny talent", "speak every language with an accent", "have a personal theme song", "get one hour back every day", "know every answer to trivia", "make plants grow quickly", "always find lost things", "change your hair color at will", "never need directions", "have a laugh track follow you"],
      alternatives: ["be unknown but instantly trusted by animals", "only communicate in movie quotes on Fridays", "have a dramatic entrance sound effect", "pause time for ten minutes each week", "forget every spoiler immediately", "make coffee brew itself", "always know who borrowed your charger", "change your outfit color at will", "always know the fastest queue", "have every sneeze sound like applause"],
      followUps: ["Pick the option you would actually live with.", "The explanation is the fun part.", "Which downside could you tolerate?"],
    },
  ],
  friendship: [
    {
      id: "showing-up",
      intensity: 1,
      subcategory: "showing_up",
      templates: [
        "When it comes to {topic} {lens}, what do you value most in a friend?",
        "What makes someone feel easy to be around during {topic} {lens}?",
        "What small thing can a friend do around {topic} that means a lot {lens}?",
      ],
      topics: ["a hard week", "good news", "an awkward moment", "a big change", "a quiet day", "a new environment", "a stressful plan", "a celebration", "a misunderstanding", "a fresh start"],
      followUps: ["A small example can say a lot.", "Think of the feeling more than the perfect wording.", "What makes that kind of support memorable?"],
    },
    {
      id: "shared-language",
      intensity: 1,
      subcategory: "shared_language",
      templates: [
        "What kind of {topic} makes a friendship feel more alive to you {lens}?",
        "What makes {topic} with a friend feel especially easy {lens}?",
        "What would you like more of when it comes to {topic} in friendship {lens}?",
      ],
      topics: ["inside jokes", "ordinary check-ins", "trying new things", "comfortable silence", "honest advice", "spontaneous plans", "shared rituals", "being silly", "talking things through", "celebrating small wins"],
      followUps: ["Describe the energy rather than the ideal answer.", "A memory may help you answer.", "What makes that feel different from other connections?"],
    },
    {
      id: "appreciation",
      intensity: 1,
      subcategory: "appreciation",
      templates: [
        "What is an underrated sign of friendship around {topic} {lens}?",
        "What does a thoughtful friend notice about {topic} {lens}?",
        "What kind of generosity around {topic} stays with you {lens}?",
      ],
      topics: ["time", "attention", "boundaries", "humor", "effort", "trust", "plans", "listening", "forgiveness", "encouragement"],
      followUps: ["The answer can be something quiet.", "Think of what feels sincere to you.", "No names or stories are required."],
    },
  ],
  gettingToKnowYou: [
    {
      id: "everyday-self",
      intensity: 1,
      subcategory: "everyday_self",
      templates: [
        "Thinking about {topic} {lens}, what describes you better than people might expect?",
        "What is your personal style around {topic} {lens}?",
        "What little preference about {topic} says more about you than it should {lens}?",
      ],
      topics: ["a free afternoon", "a favorite meal", "a new place", "getting comfortable", "a small treat", "making plans", "a rainy day", "a first conversation", "choosing music", "winding down"],
      followUps: ["A simple preference is a great answer.", "The oddly specific version is welcome.", "What would surprise someone who just met you?"],
    },
    {
      id: "spark",
      intensity: 1,
      subcategory: "spark",
      templates: [
        "What kind of {topic} gives you a little burst of energy {lens}?",
        "What is something about {topic} that you could happily talk about for too long {lens}?",
        "What is your quickest route to enjoying {topic} {lens}?",
      ],
      topics: ["music", "food", "a weekend", "a hobby", "a neighborhood", "a film", "a small project", "a conversation", "a trip", "a quiet night"],
      followUps: ["Go with the first genuine answer.", "What makes it work for you?", "You do not need to impress anyone with the answer."],
    },
    {
      id: "small-joy",
      intensity: 1,
      subcategory: "small_joy",
      templates: [
        "What is a tiny ritual around {topic} that makes your day better {lens}?",
        "What is a low-stakes win involving {topic} that always feels good {lens}?",
        "What detail about {topic} reliably makes you smile {lens}?",
      ],
      topics: ["your morning", "your space", "a meal", "a commute", "a message", "a playlist", "a walk", "a cozy corner", "a favorite object", "a day off"],
      followUps: ["The smallest answers are often the most revealing.", "Paint a quick picture of it.", "What turns it from ordinary into good?"],
    },
  ],
};

const variantsByCategory = new Map<CategoryId, LivingVariant[]>();

function replaceTokens(template: string, topic: string, lens: string, alternative: string): string {
  return template
    .replaceAll("{topic}", topic)
    .replaceAll("{lens}", lens)
    .replaceAll("{alternative}", alternative);
}

function getVariants(category: CategoryId): LivingVariant[] {
  const cached = variantsByCategory.get(category);
  if (cached) return cached;

  const variants = RECIPES[category].flatMap((recipe) =>
    recipe.templates.flatMap((template, templateIndex) =>
      recipe.topics.flatMap((topic, topicIndex) =>
        LENSES.map((lens, lensIndex) => ({
          id: `${recipe.id}-${templateIndex}-${topicIndex}-${lensIndex}`,
          text: replaceTokens(
            template,
            topic,
            lens,
            recipe.alternatives?.[topicIndex % recipe.alternatives.length] ?? topic,
          ),
          intensity: recipe.intensity,
          subcategory: recipe.subcategory,
          followUpPrompt: recipe.followUps[(templateIndex + topicIndex + lensIndex) % recipe.followUps.length]!,
        }))
      )
    )
  );
  variantsByCategory.set(category, variants);
  return variants;
}

function stableOffset(pairHistoryId: string, category: CategoryId, length: number): number {
  const digest = createHash("sha256").update(`${pairHistoryId}:${category}`).digest();
  return digest.readUInt32BE(0) % length;
}

/** Number of distinct generated prompts available in a category before its rotation repeats. */
export function livingQuestionCount(category: CategoryId): number {
  return getVariants(category).length;
}

/**
 * Picks the next deterministic living prompt for a pair. The sequence is kept
 * server-side, while the pair-specific offset makes different conversations
 * encounter the deck in different orders.
 */
export function createLivingQuestion({
  category,
  pairHistoryId,
  sequence,
}: {
  category: CategoryId;
  pairHistoryId: string;
  sequence: number;
}): SeedQuestion {
  const variants = getVariants(category);
  const absoluteIndex = stableOffset(pairHistoryId, category, variants.length) + sequence;
  const variant = variants[absoluteIndex % variants.length]!;
  const cycle = Math.floor(absoluteIndex / variants.length);

  return {
    id: `living-${category}-${variant.id}-${cycle}`,
    text: variant.text,
    category,
    intensity: variant.intensity,
    minRound: 1,
    relationshipFit: ["friends", "more_than_friends", "just_meeting"],
    tags: ["living_deck", "safe_default"],
    status: "published",
    estimatedAnswerSeconds: 60,
    skipSensitivity: "standard",
    contentWarningLevel: "none",
    subcategory: variant.subcategory,
    followUpPrompt: variant.followUpPrompt,
  };
}
