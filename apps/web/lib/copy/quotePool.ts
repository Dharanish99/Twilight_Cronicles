/**
 * pickQuote — pick a category-matched literary quote with genuine uniform
 * randomness. Prefers quotes not yet seen this session; falls back to the
 * full pool if all have been shown (repeats are acceptable per spec).
 *
 * Usage:
 *   const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
 *   const q = pickQuote("deep", usedIds);
 *   setUsedIds(prev => new Set(prev).add(q.id));
 */

import type { CategoryId } from "@twilight/shared-types";

export interface Quote {
  id: string;
  text: string;
  author: string;
  work: string | null;
  category: CategoryId;
  tags: string[];
}

// Inline the 100 provided quotes — do NOT add, invent, or modify any entry.
const ALL_QUOTES: Quote[] = [
  // ── DEEP (13) ──────────────────────────────────────────────────────────────
  { id:"deep-q01", text:"The mystery of human existence lies not in just staying alive, but in finding something to live for.", author:"Fyodor Dostoevsky", work:"The Brothers Karamazov", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q02", text:"It takes something more than intelligence to act intelligently.", author:"Fyodor Dostoevsky", work:"Crime and Punishment", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q03", text:"Above all, don't lie to yourself.", author:"Fyodor Dostoevsky", work:"The Brothers Karamazov", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q04", text:"You have power over your mind, not outside events. Realize this, and you will find strength.", author:"Marcus Aurelius", work:"Meditations", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q05", text:"The happiness of your life depends upon the quality of your thoughts.", author:"Marcus Aurelius", work:"Meditations", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q06", text:"I am free, and that is why I am lost.", author:"Franz Kafka", work:null, category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q07", text:"All that you are seeking is also seeking you.", author:"Franz Kafka", work:null, category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q08", text:"To live is the rarest thing in the world. Most people exist, that is all.", author:"Oscar Wilde", work:"The Soul of Man Under Socialism", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q09", text:"This above all: to thine own self be true.", author:"William Shakespeare", work:"Hamlet", category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q10", text:"He who has a why to live can bear almost any how.", author:"Friedrich Nietzsche", work:null, category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q11", text:"The only true wisdom is in knowing you know nothing.", author:"Socrates", work:null, category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q12", text:"One need not be a chamber to be haunted; one need not be a house.", author:"Emily Dickinson", work:null, category:"deep", tags:["truth","meaning","self"] },
  { id:"deep-q13", text:"It is often safer to be in chains than to be free.", author:"Franz Kafka", work:"The Trial", category:"deep", tags:["truth","meaning","self"] },

  // ── PLAYFUL (13) ───────────────────────────────────────────────────────────
  { id:"playful-q01", text:"I can resist everything except temptation.", author:"Oscar Wilde", work:"Lady Windermere's Fan", category:"playful", tags:["wit","humor"] },
  { id:"playful-q02", text:"Be yourself; everyone else is already taken.", author:"Oscar Wilde", work:null, category:"playful", tags:["wit","humor"] },
  { id:"playful-q03", text:"We are all in the gutter, but some of us are looking at the stars.", author:"Oscar Wilde", work:"Lady Windermere's Fan", category:"playful", tags:["wit","humor"] },
  { id:"playful-q04", text:"An egg is always an adventure; it may be different each time.", author:"Oscar Wilde", work:null, category:"playful", tags:["wit","humor"] },
  { id:"playful-q05", text:"There is only one thing in the world worse than being talked about, and that is not being talked about.", author:"Oscar Wilde", work:"The Picture of Dorian Gray", category:"playful", tags:["wit","humor"] },
  { id:"playful-q06", text:"Wrinkles should merely indicate where smiles have been.", author:"Mark Twain", work:null, category:"playful", tags:["wit","humor"] },
  { id:"playful-q07", text:"Whenever you find yourself on the side of the majority, it is time to pause and reflect.", author:"Mark Twain", work:null, category:"playful", tags:["wit","humor"] },
  { id:"playful-q08", text:"Though this be madness, yet there is method in't.", author:"William Shakespeare", work:"Hamlet", category:"playful", tags:["wit","humor"] },
  { id:"playful-q09", text:"The lady doth protest too much, methinks.", author:"William Shakespeare", work:"Hamlet", category:"playful", tags:["wit","humor"] },
  { id:"playful-q10", text:"Better a witty fool than a foolish wit.", author:"William Shakespeare", work:"Twelfth Night", category:"playful", tags:["wit","humor"] },
  { id:"playful-q11", text:"Some are born great, some achieve greatness, and some have greatness thrust upon them.", author:"William Shakespeare", work:"Twelfth Night", category:"playful", tags:["wit","humor"] },
  { id:"playful-q12", text:"For what do we live, but to make sport for our neighbours, and laugh at them in our turn?", author:"Jane Austen", work:"Pride and Prejudice", category:"playful", tags:["wit","humor"] },
  { id:"playful-q13", text:"Don't go around saying the world owes you a living. The world owes you nothing.", author:"Mark Twain", work:null, category:"playful", tags:["wit","humor"] },

  // ── EMOTIONAL (13) ─────────────────────────────────────────────────────────
  { id:"emotional-q01", text:"And where there is love, you can live even without happiness.", author:"Fyodor Dostoevsky", work:"Crime and Punishment", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q02", text:"What is hell? I maintain that it is the suffering of being unable to love.", author:"Fyodor Dostoevsky", work:"The Brothers Karamazov", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q03", text:"To love is to suffer, and there can be no love otherwise.", author:"Fyodor Dostoevsky", work:null, category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q04", text:"To love oneself is the beginning of a lifelong romance.", author:"Oscar Wilde", work:"An Ideal Husband", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q05", text:"Keep love in your heart. A life without it is like a sunless garden when the flowers are dead.", author:"Oscar Wilde", work:null, category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q06", text:"You are the knife I turn inside myself; that is love.", author:"Franz Kafka", work:null, category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q07", text:"One word frees us of all the weight and pain of life: that word is love.", author:"Sophocles", work:null, category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q08", text:"Whatever our souls are made of, his and mine are the same.", author:"Emily Bronte", work:"Wuthering Heights", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q09", text:"Love sought is good, but given unsought is better.", author:"William Shakespeare", work:"Twelfth Night", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q10", text:"Doubt thou the stars are fire; doubt that the sun doth move; but never doubt I love.", author:"William Shakespeare", work:"Hamlet", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q11", text:"The heart has its reasons which reason knows nothing of.", author:"Blaise Pascal", work:null, category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q12", text:"To love another person is to see the face of God.", author:"Victor Hugo", work:"Les Miserables", category:"emotional", tags:["love","vulnerability"] },
  { id:"emotional-q13", text:"I am no bird, and no net ensnares me: I am a free human being with an independent will.", author:"Charlotte Bronte", work:"Jane Eyre", category:"emotional", tags:["love","vulnerability"] },

  // ── CURIOUS (11) ───────────────────────────────────────────────────────────
  { id:"curious-q01", text:"We live only in the present, in this fleet-footed moment.", author:"Marcus Aurelius", work:"Meditations", category:"curious", tags:["wonder","questions"] },
  { id:"curious-q02", text:"The present moment is the only thing of which anyone can be deprived.", author:"Marcus Aurelius", work:"Meditations", category:"curious", tags:["wonder","questions"] },
  { id:"curious-q03", text:"One reads in order to ask questions.", author:"Franz Kafka", work:null, category:"curious", tags:["wonder","questions"] },
  { id:"curious-q04", text:"It is the mark of an educated mind to be able to entertain a thought without accepting it.", author:"Aristotle", work:null, category:"curious", tags:["wonder","questions"] },
  { id:"curious-q05", text:"Learning never exhausts the mind.", author:"Leonardo da Vinci", work:null, category:"curious", tags:["wonder","questions"] },
  { id:"curious-q06", text:"There is nothing either good or bad, but thinking makes it so.", author:"William Shakespeare", work:"Hamlet", category:"curious", tags:["wonder","questions"] },
  { id:"curious-q07", text:"The fool doth think he is wise, but the wise man knows himself to be a fool.", author:"William Shakespeare", work:"As You Like It", category:"curious", tags:["wonder","questions"] },
  { id:"curious-q08", text:"I am studying that mystery because I want to be a human being.", author:"Fyodor Dostoevsky", work:"The Brothers Karamazov", category:"curious", tags:["wonder","questions"] },
  { id:"curious-q09", text:"It's not what you look at that matters, it's what you see.", author:"Henry David Thoreau", work:null, category:"curious", tags:["wonder","questions"] },
  { id:"curious-q10", text:"I have never let my schooling interfere with my education.", author:"Mark Twain", work:null, category:"curious", tags:["wonder","questions"] },
  { id:"curious-q11", text:"I declare after all there is no enjoyment like reading.", author:"Jane Austen", work:"Pride and Prejudice", category:"curious", tags:["wonder","questions"] },

  // ── MEMORIES (8) ───────────────────────────────────────────────────────────
  { id:"memories-q01", text:"Remembrance of things past is not necessarily the remembrance of things as they were.", author:"Marcel Proust", work:"In Search of Lost Time", category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q02", text:"If recollecting were forgetting, then I remember not.", author:"Emily Dickinson", work:null, category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q03", text:"There is no greater sorrow than to recall a happy time when miserable.", author:"Dante Alighieri", work:"Inferno", category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q04", text:"Memory runs her needle in and out, up and down, hither and thither.", author:"Virginia Woolf", work:"Orlando", category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q05", text:"Loss is nothing else but change, and change is Nature's delight.", author:"Marcus Aurelius", work:"Meditations", category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q06", text:"All the variety, all the charm, all the beauty of life is made up of light and shadow.", author:"Leo Tolstoy", work:null, category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q07", text:"Melancholy is the happiness of being sad.", author:"Victor Hugo", work:"Les Miserables", category:"memories", tags:["nostalgia","the past"] },
  { id:"memories-q08", text:"There is nothing like staying at home for real comfort.", author:"Jane Austen", work:"Emma", category:"memories", tags:["nostalgia","the past"] },

  // ── FUTURE (10) ────────────────────────────────────────────────────────────
  { id:"future-q01", text:"Do not go where the path may lead, go instead where there is no path and leave a trail.", author:"Ralph Waldo Emerson", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q02", text:"Go confidently in the direction of your dreams. Live the life you have imagined.", author:"Henry David Thoreau", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q03", text:"Keep your face always toward the sunshine, and shadows will fall behind you.", author:"Walt Whitman", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q04", text:"I am not afraid of storms, for I am learning how to sail my ship.", author:"Louisa May Alcott", work:"Little Women", category:"future", tags:["hope","becoming"] },
  { id:"future-q05", text:"Hope is the thing with feathers that perches in the soul.", author:"Emily Dickinson", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q06", text:"What's past is prologue.", author:"William Shakespeare", work:"The Tempest", category:"future", tags:["hope","becoming"] },
  { id:"future-q07", text:"Even the darkest night will end and the sun will rise.", author:"Victor Hugo", work:"Les Miserables", category:"future", tags:["hope","becoming"] },
  { id:"future-q08", text:"Everyone thinks of changing the world, but no one thinks of changing himself.", author:"Leo Tolstoy", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q09", text:"The secret of getting ahead is getting started.", author:"Mark Twain", work:null, category:"future", tags:["hope","becoming"] },
  { id:"future-q10", text:"The only person you are destined to become is the person you decide to be.", author:"Ralph Waldo Emerson", work:null, category:"future", tags:["hope","becoming"] },

  // ── CHAOTIC (7) ────────────────────────────────────────────────────────────
  { id:"chaotic-q01", text:"One must still have chaos in oneself to be able to give birth to a dancing star.", author:"Friedrich Nietzsche", work:"Thus Spoke Zarathustra", category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q02", text:"I can't go back to yesterday because I was a different person then.", author:"Lewis Carroll", work:"Alice's Adventures in Wonderland", category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q03", text:"Why, sometimes I've believed as many as six impossible things before breakfast.", author:"Lewis Carroll", work:"Through the Looking-Glass", category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q04", text:"We're all mad here.", author:"Lewis Carroll", work:"Alice's Adventures in Wonderland", category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q05", text:"Life's but a walking shadow, a poor player that struts and frets his hour upon the stage, and then is heard no more.", author:"William Shakespeare", work:"Macbeth", category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q06", text:"The world is a stage, but the play is badly cast.", author:"Oscar Wilde", work:null, category:"chaotic", tags:["chaos","whimsy"] },
  { id:"chaotic-q07", text:"Life is far too important a thing ever to talk seriously about.", author:"Oscar Wilde", work:"Lady Windermere's Fan", category:"chaotic", tags:["chaos","whimsy"] },

  // ── WOULD YOU RATHER (10) ──────────────────────────────────────────────────
  { id:"wouldYouRather-q01", text:"It is not in the stars to hold our destiny but in ourselves.", author:"William Shakespeare", work:"Julius Caesar", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q02", text:"The fault, dear Brutus, is not in our stars, but in ourselves.", author:"William Shakespeare", work:"Julius Caesar", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q03", text:"Men at some time are masters of their fates.", author:"William Shakespeare", work:"Julius Caesar", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q04", text:"Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", author:"Robert Frost", work:"The Road Not Taken", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q05", text:"To be, or not to be, that is the question.", author:"William Shakespeare", work:"Hamlet", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q06", text:"To go wrong in one's own way is better than to go right in someone else's.", author:"Fyodor Dostoevsky", work:"Crime and Punishment", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q07", text:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author:"Aristotle", work:null, category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q08", text:"Things do not change; we change.", author:"Henry David Thoreau", work:"Walden", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q09", text:"The impediment to action advances action. What stands in the way becomes the way.", author:"Marcus Aurelius", work:"Meditations", category:"wouldYouRather", tags:["choice","fate"] },
  { id:"wouldYouRather-q10", text:"Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.", author:"William Shakespeare", work:"Measure for Measure", category:"wouldYouRather", tags:["choice","fate"] },

  // ── FRIENDSHIP (8) ─────────────────────────────────────────────────────────
  { id:"friendship-q01", text:"A friend to all is a friend to none.", author:"Aristotle", work:null, category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q02", text:"A friend is a person with whom I may be sincere. Before him I may think aloud.", author:"Ralph Waldo Emerson", work:null, category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q03", text:"There is nothing I would not do for those who are really my friends. I have no notion of loving people by halves.", author:"Jane Austen", work:"Pride and Prejudice", category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q04", text:"It is not time or opportunity that is to determine intimacy; it is disposition alone.", author:"Jane Austen", work:"Emma", category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q05", text:"I want to talk about everything with at least one person as I talk about things with myself.", author:"Fyodor Dostoevsky", work:null, category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q06", text:"The only way to have a friend is to be one.", author:"Ralph Waldo Emerson", work:null, category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q07", text:"Words are easy, like the wind; faithful friends are hard to find.", author:"William Shakespeare", work:"The Passionate Pilgrim", category:"friendship", tags:["loyalty","connection"] },
  { id:"friendship-q08", text:"My friends are my estate.", author:"Emily Dickinson", work:null, category:"friendship", tags:["loyalty","connection"] },

  // ── GETTING TO KNOW YOU (7) ────────────────────────────────────────────────
  { id:"gettingToKnowYou-q01", text:"We sometimes encounter people, even perfect strangers, who begin to interest us at first sight, somehow suddenly, all at once, before a word has been spoken.", author:"Fyodor Dostoevsky", work:"Crime and Punishment", category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q02", text:"I am half agony, half hope.", author:"Jane Austen", work:"Persuasion", category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q03", text:"It is only the shallow who do not judge by appearances.", author:"Oscar Wilde", work:"The Picture of Dorian Gray", category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q04", text:"Kindness is a language which the deaf can hear and the blind can see.", author:"Mark Twain", work:null, category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q05", text:"It is one of the most beautiful compensations of life that no man can sincerely try to help another without helping himself.", author:"Ralph Waldo Emerson", work:null, category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q06", text:"Everything that I know, I know because of love.", author:"Leo Tolstoy", work:"War and Peace", category:"gettingToKnowYou", tags:["first impressions","strangers"] },
  { id:"gettingToKnowYou-q07", text:"Love, that excuses no one loved from loving.", author:"Dante Alighieri", work:"Inferno", category:"gettingToKnowYou", tags:["first impressions","strangers"] },
];

/**
 * Pick one quote matching `category`, preferring ones not yet shown this session.
 * Falls back to full pool if all used (uniform random, allows repeats).
 */
export function pickQuote(category: CategoryId, usedIds: Set<string>): Quote {
  const pool = ALL_QUOTES.filter((q) => q.category === category);
  if (pool.length === 0) {
    // Should never happen but guard gracefully
    const fallback = ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)]!;
    return fallback;
  }
  const unseen = pool.filter((q) => !usedIds.has(q.id));
  const source = unseen.length > 0 ? unseen : pool;
  return source[Math.floor(Math.random() * source.length)]!;
}
