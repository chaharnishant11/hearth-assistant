import type { CheckIn, Profile, TranscriptLine, Wearable } from "./types";

export const profile: Profile = {
  name: "Margaret",
  relation: "Mum",
  age: 78,
  city: "Manchester",
  country: "UK",
  timeZone: "Europe/London",
  caregiver: "Nour",
  caregiverCity: "Abu Dhabi",
  emergencyNumber: "999",
  crisisLine: { name: "Samaritans", number: "116 123" },
  baselineWpm: 128,
  about: [
    "Widowed; her late husband Arthur grew prize marrows on their allotment.",
    "Lives alone with her cat, Biscuit.",
    "Daughter Nour works in Abu Dhabi; grandson Leo is 9.",
    "Neighbour and friend: Joan, from number 12.",
    "Arthritis in her left knee; enjoys short walks to the park.",
    "Takes a blood pressure tablet (amlodipine) every morning.",
  ],
};

/** Simulated smartwatch reading for today's call. */
export const todayWearable: Wearable = {
  sleepHours: 4.2,
  restingHr: 79,
  steps: 1100,
};

const blank = { transcript: [], durationSec: 0 };

export const seedCheckins: CheckIn[] = [
  {
    ...blank,
    id: "seed-sat",
    date: "2026-09-19",
    dayLabel: "Sat",
    durationSec: 540,
    mood: 4,
    moodLabel: "Cheerful",
    loneliness: "low",
    medsTaken: true,
    summary:
      "Bright and chatty. Joan came round for tea and they watched the baking show together. Talked about Leo's football match.",
    topics: ["tea with Joan", "baking show", "Leo's football"],
    peopleMentioned: ["Joan", "Leo", "Nour", "the postman"],
    signals: [],
    suggestedAction: "Nothing needed. A good day.",
    memoryNotes: [
      "Joan visits for tea most Saturdays.",
      "Leo scored a goal in his match.",
    ],
    urgent: false,
    wearable: { sleepHours: 7.1, restingHr: 68, steps: 4200 },
    speech: { wordsPerMinute: 131, fillerPer100: 2.1 },
  },
  {
    ...blank,
    id: "seed-sun",
    date: "2026-09-20",
    dayLabel: "Sun",
    durationSec: 480,
    mood: 4,
    moodLabel: "Content",
    loneliness: "low",
    medsTaken: true,
    summary:
      "Went to church and had lunch at the café afterwards. Pleased that Nour called in the evening.",
    topics: ["church", "café lunch", "call with Nour"],
    peopleMentioned: ["Nour", "Reverend Hughes", "Joan"],
    signals: [],
    suggestedAction: "Nothing needed.",
    memoryNotes: ["Goes to St Mary's on Sundays."],
    urgent: false,
    wearable: { sleepHours: 6.8, restingHr: 69, steps: 3900 },
    speech: { wordsPerMinute: 128, fillerPer100: 2.4 },
  },
  {
    ...blank,
    id: "seed-mon",
    date: "2026-09-21",
    dayLabel: "Mon",
    durationSec: 420,
    mood: 3,
    moodLabel: "A bit flat",
    loneliness: "medium",
    medsTaken: true,
    summary:
      "Quieter day. Joan has gone to stay with her sister in Leeds for two weeks. Said the house feels 'very still'.",
    topics: ["Joan away", "quiet house", "Biscuit the cat"],
    peopleMentioned: ["Joan", "Biscuit"],
    signals: [
      {
        kind: "social",
        label: "Main friend away for 2 weeks",
        severity: "watch",
        quote: "Joan's off to her sister's for a fortnight, so it'll be very still round here.",
        explanation:
          "Joan is her main in-person contact. Loneliness risk goes up while she is away.",
      },
    ],
    suggestedAction: "Consider a video call this week while Joan is away.",
    memoryNotes: ["Joan is in Leeds with her sister until early October."],
    urgent: false,
    wearable: { sleepHours: 5.9, restingHr: 70, steps: 2600 },
    speech: { wordsPerMinute: 124, fillerPer100: 3.0 },
  },
  {
    ...blank,
    id: "seed-tue",
    date: "2026-09-22",
    dayLabel: "Tue",
    durationSec: 510,
    mood: 3,
    moodLabel: "Wistful",
    loneliness: "medium",
    medsTaken: true,
    summary:
      "Talked a lot about Arthur, including the story of his prize-winning marrow at the 1987 allotment show. Slept badly.",
    topics: ["Arthur", "allotment show story", "poor sleep"],
    peopleMentioned: ["Arthur", "Biscuit"],
    signals: [
      {
        kind: "sleep",
        label: "Poor sleep",
        severity: "info",
        quote: "I was up and down all night, I just couldn't settle.",
        explanation: "Second night in a row under 6 hours (simulated watch data).",
      },
    ],
    suggestedAction: "Nothing urgent. Keep an eye on sleep.",
    memoryNotes: [
      "Told the story of Arthur's prize marrow at the 1987 allotment show.",
    ],
    urgent: false,
    wearable: { sleepHours: 4.6, restingHr: 72, steps: 2100 },
    speech: { wordsPerMinute: 121, fillerPer100: 3.6 },
  },
  {
    ...blank,
    id: "seed-wed",
    date: "2026-09-23",
    dayLabel: "Wed",
    durationSec: 360,
    mood: 2,
    moodLabel: "Low",
    loneliness: "high",
    medsTaken: null,
    summary:
      "Low and tired. Wasn't sure whether she had taken her blood pressure tablet. Hadn't left the house.",
    topics: ["unsure about tablet", "stayed in", "tired"],
    peopleMentioned: ["Biscuit"],
    signals: [
      {
        kind: "meds",
        label: "Unsure if tablet was taken",
        severity: "watch",
        quote: "Did I take it? I can't honestly remember, love.",
        explanation:
          "Missed or doubled blood pressure doses are a risk. A pill organiser or reminder may help.",
      },
      {
        kind: "mood",
        label: "Low mood",
        severity: "watch",
        quote: "I've not really seen the point in getting dressed today.",
        explanation: "Lowest mood this week, 3 days after Joan left.",
      },
    ],
    suggestedAction:
      "Call Mum this evening and ask about a weekly pill organiser.",
    memoryNotes: ["Unsure if she took Wednesday's tablet."],
    urgent: false,
    wearable: { sleepHours: 4.8, restingHr: 74, steps: 900 },
    speech: { wordsPerMinute: 118, fillerPer100: 4.4 },
  },
  {
    ...blank,
    id: "seed-thu",
    date: "2026-09-24",
    dayLabel: "Thu",
    durationSec: 450,
    mood: 3,
    moodLabel: "Okay",
    loneliness: "medium",
    medsTaken: true,
    summary:
      "Made herself walk to the park and fed the ducks. Left knee was sore afterwards. Took her tablet.",
    topics: ["walk to the park", "ducks", "sore knee"],
    peopleMentioned: ["Biscuit"],
    signals: [
      {
        kind: "pain",
        label: "Knee pain after walk",
        severity: "info",
        quote: "My knee's giving me gyp after all that walking.",
        explanation: "Known arthritis. Worth watching if it stops her going out.",
      },
    ],
    suggestedAction: "Nothing urgent. Encourage the walks.",
    memoryNotes: [
      "Walked to the park on Thursday and fed the ducks; knee was sore after.",
    ],
    urgent: false,
    wearable: { sleepHours: 4.3, restingHr: 76, steps: 3100 },
    speech: { wordsPerMinute: 116, fillerPer100: 4.9 },
  },
];

/** A scripted call used when the mic or Wi-Fi fails on stage. */
export function sampleTranscriptFor(p: Profile): TranscriptLine[] {
  return [
    { role: "assistant", text: `Good morning, ${p.name}, it's Hearth. How's that knee after your walk to the park yesterday?` },
    { role: "user", text: "Oh, hello love. The knee's not so bad. I didn't sleep much though, um, I was up at three with Biscuit." },
    { role: "assistant", text: "I'm sorry you had a rough night. Did you manage your blood pressure tablet this morning?" },
    { role: "user", text: "I think so. It's, um, it's on the side. Did I tell you about Arthur's marrow? It won first prize at the allotment show in 1987, he was so proud." },
    { role: "assistant", text: "He sounds like a wonderful gardener. How are you feeling in yourself this morning?" },
    { role: "user", text: "Honestly, my chest feels a bit tight and I'm a bit dizzy. And it's so quiet without Joan. I don't really talk to anyone anymore." },
    { role: "assistant", text: `Thank you for telling me, ${p.name}. Chest tightness is important. Please call ${p.emergencyNumber} now. I've let ${p.caregiver} know, and I'll stay with you.` },
  ];
}
