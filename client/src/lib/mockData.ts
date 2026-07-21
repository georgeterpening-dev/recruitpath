/**
 * Mock data for VITE_MOCK=true preview mode.
 * Realistic fake data covering every tRPC procedure used in the app.
 */

export const MOCK_USER = {
  id: 1,
  name: "Alex Johnson",
  email: "alex.johnson@gmail.com",
  role: "user" as const,
  plan: "free" as const,
  hasPaidAccess: true,
  interestedInPro: false,
  totalSchoolsAdded: 8,
  gmailConnectedEmail: "alex.johnson@gmail.com",
  gmailConnectedAt: new Date("2026-01-15"),
  hasSeenWelcome: true,
  hasSeenWalkthrough: true,
  hasCompletedOnboarding: true,
  googleAuthUser: true,
  emailsSent: 12,
  createdAt: new Date("2025-11-01"),
  updatedAt: new Date("2026-05-01"),
  lastSignedIn: new Date("2026-05-28"),
};

export const MOCK_SUBSCRIPTION_STATUS = {
  hasPaidAccess: true,
  interestedInPro: false,
  plan: "pro" as const,
  subscriptionType: "monthly",
  subscriptionStatus: "active",
  schoolsUsed: 5,
  schoolsLimit: -1,
  stripeCustomerId: "cus_mock123",
  stripeSubscriptionId: "sub_mock123",
  totalSchoolsAdded: 8,
};

export const MOCK_SCHOOLS = [
  {
    id: "ucla",
    name: "UCLA Bruins",
    city: "Los Angeles",
    state: "CA",
    division: "D1",
    conference: "Pac-12",
    hasRosterData: true,
    brandColor: "#2D68C4",
    athleticsDomain: "uclabruins.com",
    logoUrl: "https://img.logo.dev/uclabruins.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "John Speraw",
    coachTitle: "Head Coach",
    coachEmail: "jsperaw@athletics.ucla.edu",
    sortOrder: 1,
    recruitingQuestionnaireUrl: "https://uclabruins.com/sports/mens-volleyball/recruiting",
    athleticsWebsiteUrl: "https://uclabruins.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "byu",
    name: "BYU Cougars",
    city: "Provo",
    state: "UT",
    division: "D1",
    conference: "MIVA",
    hasRosterData: true,
    brandColor: "#002E5D",
    athleticsDomain: "byucougars.com",
    logoUrl: "https://img.logo.dev/byucougars.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Shawn Olmstead",
    coachTitle: "Head Coach",
    coachEmail: "solmstead@byu.edu",
    sortOrder: 2,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://byucougars.com/sports/m-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "long-beach-state",
    name: "Long Beach State 49ers",
    city: "Long Beach",
    state: "CA",
    division: "D1",
    conference: "Big West",
    hasRosterData: true,
    brandColor: "#231F20",
    athleticsDomain: "longbeachstate.com",
    logoUrl: "https://img.logo.dev/longbeachstate.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Alan Knipe",
    coachTitle: "Head Coach",
    coachEmail: "aknipe@csulb.edu",
    sortOrder: 3,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://longbeachstate.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "pepperdine",
    name: "Pepperdine Waves",
    city: "Malibu",
    state: "CA",
    division: "D1",
    conference: "MPSF",
    hasRosterData: true,
    brandColor: "#003082",
    athleticsDomain: "pepperdinesports.com",
    logoUrl: "https://img.logo.dev/pepperdinesports.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "David Hunt",
    coachTitle: "Head Coach",
    coachEmail: "dhunt@pepperdine.edu",
    sortOrder: 4,
    recruitingQuestionnaireUrl: "https://pepperdinesports.com/recruiting",
    athleticsWebsiteUrl: "https://pepperdinesports.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "hawaii",
    name: "Hawaiʻi Warriors",
    city: "Honolulu",
    state: "HI",
    division: "D1",
    conference: "Big West",
    hasRosterData: true,
    brandColor: "#024694",
    athleticsDomain: "hawaiiathletics.com",
    logoUrl: "https://img.logo.dev/hawaiiathletics.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Charlie Wade",
    coachTitle: "Head Coach",
    coachEmail: "cwade@hawaii.edu",
    sortOrder: 5,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://hawaiiathletics.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "ohio-state",
    name: "Ohio State Buckeyes",
    city: "Columbus",
    state: "OH",
    division: "D1",
    conference: "MIVA",
    hasRosterData: true,
    brandColor: "#BA0C2F",
    athleticsDomain: "ohiostatebuckeyes.com",
    logoUrl: "https://img.logo.dev/ohiostatebuckeyes.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Kevin Burch",
    coachTitle: "Head Coach",
    coachEmail: "burch.1@osu.edu",
    sortOrder: 6,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://ohiostatebuckeyes.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara Gauchos",
    city: "Santa Barbara",
    state: "CA",
    division: "D1",
    conference: "Big West",
    hasRosterData: false,
    brandColor: "#003660",
    athleticsDomain: "ucsbgauchos.com",
    logoUrl: "https://img.logo.dev/ucsbgauchos.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Rick McLaughlin",
    coachTitle: "Head Coach",
    coachEmail: "rmclaughlin@athletics.ucsb.edu",
    sortOrder: 7,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://ucsbgauchos.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "stanford",
    name: "Stanford Cardinal",
    city: "Stanford",
    state: "CA",
    division: "D1",
    conference: "MPSF",
    hasRosterData: false,
    brandColor: "#8C1515",
    athleticsDomain: "gostanford.com",
    logoUrl: "https://img.logo.dev/gostanford.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "John Kosty",
    coachTitle: "Head Coach",
    coachEmail: "jkosty@stanford.edu",
    sortOrder: 8,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://gostanford.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "cal-poly",
    name: "Cal Poly Mustangs",
    city: "San Luis Obispo",
    state: "CA",
    division: "D1",
    conference: "Big West",
    hasRosterData: true,
    brandColor: "#154734",
    athleticsDomain: "gopoly.com",
    logoUrl: "https://img.logo.dev/gopoly.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Jon Newton",
    coachTitle: "Head Coach",
    coachEmail: "jnewton@calpoly.edu",
    sortOrder: 9,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://gopoly.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "grand-canyon",
    name: "Grand Canyon Antelopes",
    city: "Phoenix",
    state: "AZ",
    division: "D1",
    conference: "WAC",
    hasRosterData: true,
    brandColor: "#522398",
    athleticsDomain: "gcuathletics.com",
    logoUrl: "https://img.logo.dev/gcuathletics.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA",
    coachName: "Matt Werder",
    coachTitle: "Head Coach",
    coachEmail: "mwerder@gcu.edu",
    sortOrder: 10,
    recruitingQuestionnaireUrl: null,
    athleticsWebsiteUrl: "https://gcuathletics.com/sports/mens-volleyball",
    isTestSchool: false,
    createdAt: new Date("2025-01-01"),
  },
];

export const MOCK_OPENING_COUNTS: Record<string, { total: number; atPosition: number }> = {
  "ucla": { total: 4, atPosition: 2 },
  "byu": { total: 3, atPosition: 1 },
  "long-beach-state": { total: 5, atPosition: 3 },
  "pepperdine": { total: 3, atPosition: 2 },
  "hawaii": { total: 6, atPosition: 4 },
  "ohio-state": { total: 4, atPosition: 2 },
  "ucsb": { total: 2, atPosition: 1 },
  "stanford": { total: 1, atPosition: 0 },
  "cal-poly": { total: 4, atPosition: 3 },
  "grand-canyon": { total: 3, atPosition: 2 },
};

export const MOCK_OUTREACH_LIST = [
  {
    id: 1,
    userId: 1,
    schoolId: "ucla",
    schoolName: "UCLA Bruins",
    coachName: "John Speraw",
    sport: "Men's Volleyball",
    division: "D1",
    createdAt: new Date("2026-02-10"),
  },
  {
    id: 2,
    userId: 1,
    schoolId: "byu",
    schoolName: "BYU Cougars",
    coachName: "Shawn Olmstead",
    sport: "Men's Volleyball",
    division: "D1",
    createdAt: new Date("2026-02-12"),
  },
  {
    id: 3,
    userId: 1,
    schoolId: "long-beach-state",
    schoolName: "Long Beach State 49ers",
    coachName: "Alan Knipe",
    sport: "Men's Volleyball",
    division: "D1",
    createdAt: new Date("2026-02-15"),
  },
  {
    id: 4,
    userId: 1,
    schoolId: "pepperdine",
    schoolName: "Pepperdine Waves",
    coachName: "David Hunt",
    sport: "Men's Volleyball",
    division: "D1",
    createdAt: new Date("2026-02-18"),
  },
  {
    id: 5,
    userId: 1,
    schoolId: "hawaii",
    schoolName: "Hawaiʻi Warriors",
    coachName: "Charlie Wade",
    sport: "Men's Volleyball",
    division: "D1",
    createdAt: new Date("2026-02-20"),
  },
];

export const MOCK_OUTREACH_TRACKER = [
  {
    id: 1,
    userId: 1,
    schoolId: "ucla",
    schoolName: "UCLA Bruins",
    coachName: "John Speraw",
    coachEmail: "jsperaw@athletics.ucla.edu",
    subject: "Men's Volleyball Recruiting Interest — Alex Johnson, Class of 2027",
    body: "Dear Coach Speraw,\n\nMy name is Alex Johnson, and I am a 6'4\" middle blocker from Austin, Texas graduating in 2027...",
    status: "responded",
    sentAt: new Date("2026-03-01"),
  },
  {
    id: 2,
    userId: 1,
    schoolId: "byu",
    schoolName: "BYU Cougars",
    coachName: "Shawn Olmstead",
    coachEmail: "solmstead@byu.edu",
    subject: "Men's Volleyball Recruiting Interest — Alex Johnson, Class of 2027",
    body: "Dear Coach Olmstead,\n\nMy name is Alex Johnson...",
    status: "no_response",
    sentAt: new Date("2026-03-05"),
  },
  {
    id: 3,
    userId: 1,
    schoolId: "pepperdine",
    schoolName: "Pepperdine Waves",
    coachName: "David Hunt",
    coachEmail: "dhunt@pepperdine.edu",
    subject: "Men's Volleyball Recruiting Interest — Alex Johnson, Class of 2027",
    body: "Dear Coach Hunt,\n\nMy name is Alex Johnson...",
    status: "follow_up_sent",
    sentAt: new Date("2026-03-10"),
  },
  {
    id: 4,
    userId: 1,
    schoolId: "long-beach-state",
    schoolName: "Long Beach State 49ers",
    coachName: "Alan Knipe",
    coachEmail: "aknipe@csulb.edu",
    subject: "Men's Volleyball Recruiting Interest — Alex Johnson, Class of 2027",
    body: "Dear Coach Knipe,\n\nMy name is Alex Johnson...",
    status: "not_interested",
    sentAt: new Date("2026-03-12"),
  },
];

export const MOCK_ATHLETE_PROFILE = {
  id: 1,
  userId: 1,
  firstName: "Alex",
  lastName: "Johnson",
  email: "alex.johnson@gmail.com",
  phone: "(512) 555-0187",
  city: "Austin",
  state: "TX",
  zipCode: "78701",
  highSchool: "Westlake High School",
  dateOfBirth: "2009-03-14",
  graduationYear: "2027",
  gpa: "3.8",
  satScore: "1380",
  actScore: "31",
  intendedMajor: "Business Administration",
  primarySport: "Men's Volleyball",
  positions: "Middle Blocker, Outside Hitter",
  jerseyNumber: "14",
  height: "6'4\"",
  weight: "195",
  keyStats: "Block efficiency: .42 | Kill efficiency: .38 | 2.8 blocks/set | 4.1 kills/set",
  awards: "All-State 2025, Club Regional Champion 2024, Defensive Player of the Year 2025",
  highlightFilmUrl: "https://hudl.com/profile/alex-johnson",
  secondaryVideoUrl: "",
  profilePhoto: "",
  actionPhoto: "",
  twitterHandle: "@alexjvball",
  instagramHandle: "@alexjvball",
  clubTeam: "Austin Juniors 18 National",
  verticalJump: "34\"",
  approachJump: "39\"",
  serviceType: "Jump Serve",
  blockingStyle: "Read Blocking",
  coachReference: "Coach Mike Torres — Austin Juniors — mtorres@austinjuniors.com",
  additionalNotes: "Available for official visits starting August 2026.",
  createdAt: new Date("2025-11-15"),
  updatedAt: new Date("2026-04-20"),
};

export const MOCK_GMAIL_STATUS = {
  connected: true,
  email: "alex.johnson@gmail.com",
  emailsSent: 12,
  connectedAt: new Date("2026-01-15"),
};

export const MOCK_COACHES = [
  { id: 1, schoolId: "ucla", name: "John Speraw", title: "Head Coach", email: "jsperaw@athletics.ucla.edu" },
  { id: 2, schoolId: "ucla", name: "Stein Metzger", title: "Assistant Coach", email: "smetzger@athletics.ucla.edu" },
  { id: 3, schoolId: "ucla", name: "Mark McLaughlin", title: "Assistant Coach", email: "mmclaughlin@athletics.ucla.edu" },
];

export const MOCK_PLAYERS = [
  { id: 1, schoolId: "ucla", name: "Merrick McHenry", position: "Outside Hitter", year: "Senior", height: "6'5\"", number: "1" },
  { id: 2, schoolId: "ucla", name: "Ethan Champlin", position: "Middle Blocker", year: "Junior", height: "6'7\"", number: "3" },
  { id: 3, schoolId: "ucla", name: "Cole Striplin", position: "Setter", year: "Senior", height: "6'4\"", number: "10" },
  { id: 4, schoolId: "ucla", name: "Ryan Coenen", position: "Libero", year: "Sophomore", height: "5'11\"", number: "17" },
  { id: 5, schoolId: "ucla", name: "Daenan Gyimah", position: "Outside Hitter", year: "Junior", height: "6'6\"", number: "5" },
];

export const MOCK_SCHOOL_LINKS = {
  recruitingQuestionnaireUrl: "https://uclabruins.com/sports/mens-volleyball/recruiting",
  athleticsWebsiteUrl: "https://uclabruins.com/sports/mens-volleyball",
};

export const MOCK_EMAILS_SENT_COUNT = 12;

export const MOCK_ACTIVE_SCHOOL_IDS = new Set(["ucla", "byu", "pepperdine", "long-beach-state"]);

export const MOCK_SENT_SCHOOL_IDS = new Set(["ucla", "byu", "pepperdine", "long-beach-state"]);

export const MOCK_GENERATED_EMAIL = `Dear Coach Speraw,

My name is Alex Johnson, and I am a 6'4" middle blocker from Austin, Texas, currently playing for Austin Juniors 18 National. I will be graduating in 2027 and am reaching out to express my sincere interest in UCLA Men's Volleyball.

I have followed your program closely and admire the consistent excellence you've built at UCLA. Your development of middle blockers at the highest level of college volleyball is something I aspire to be a part of.

Here are my current stats and highlights:
• Block efficiency: .42 | Kill efficiency: .38
• 2.8 blocks/set | 4.1 kills/set
• Vertical: 34" | Approach: 39"
• GPA: 3.8 | Graduation: 2027

You can view my highlight film here: https://hudl.com/profile/alex-johnson

I would welcome the opportunity to speak with you about your program and recruiting needs. Thank you for your time and consideration, Coach.

Respectfully,
Alex Johnson
(512) 555-0187 | alex.johnson@gmail.com`;

export const MOCK_SCHOOL_GAP = {
  players: [
    { id: 1, schoolId: "ucla", name: "Merrick McHenry", position: "Outside Hitter", year: "Senior", graduationYear: 2027, height: "6'5\"", number: "1" },
    { id: 2, schoolId: "ucla", name: "Ethan Champlin", position: "Middle Blocker", year: "Senior", graduationYear: 2027, height: "6'7\"", number: "3" },
    { id: 3, schoolId: "ucla", name: "Cole Striplin", position: "Setter", year: "Junior", graduationYear: 2028, height: "6'4\"", number: "10" },
    { id: 4, schoolId: "ucla", name: "Ryan Coenen", position: "Libero", year: "Sophomore", graduationYear: 2029, height: "5'11\"", number: "17" },
    { id: 5, schoolId: "ucla", name: "Daenan Gyimah", position: "Middle Blocker", year: "Senior", graduationYear: 2027, height: "6'8\"", number: "5" },
  ],
  gradYear: 2027,
  athletePositions: ["MIDDLE BLOCKER", "OUTSIDE HITTER"],
  gap: {
    total: 3,
    atPosition: 2,
    graduatingNames: ["Merrick McHenry", "Ethan Champlin", "Daenan Gyimah"],
    positionGraduatingNames: ["Ethan Champlin", "Daenan Gyimah"],
  },
};

export const MOCK_COMMITS = [
  { id: 1, schoolId: "ucla", name: "Jaylen Torres", position: "Setter", gradYear: 2027, hometown: "San Diego, CA", club: "Coast VBC" },
  { id: 2, schoolId: "ucla", name: "Owen Blake", position: "Libero", gradYear: 2027, hometown: "Chicago, IL", club: "Adversity VBC" },
];

export const MOCK_ROSTER_OPENINGS = [
  { schoolId: "hawaii", schoolName: "Hawaiʻi Warriors", division: "D1", logoUrl: "https://img.logo.dev/hawaiiathletics.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA", logoBackgroundColor: null, logoMixBlendMode: null, brandColor: "#024731", positionOpenings: 4, totalOpenings: 6 },
  { schoolId: "long-beach-state", schoolName: "Long Beach State 49ers", division: "D1", logoUrl: "https://img.logo.dev/longbeachstate.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA", logoBackgroundColor: null, logoMixBlendMode: null, brandColor: "#231F20", positionOpenings: 3, totalOpenings: 5 },
  { schoolId: "cal-poly", schoolName: "Cal Poly Mustangs", division: "D1", logoUrl: "https://img.logo.dev/gopoly.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA", logoBackgroundColor: null, logoMixBlendMode: null, brandColor: "#154734", positionOpenings: 3, totalOpenings: 4 },
  { schoolId: "ucla", schoolName: "UCLA Bruins", division: "D1", logoUrl: "https://img.logo.dev/uclabruins.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA", logoBackgroundColor: null, logoMixBlendMode: null, brandColor: "#2D68C4", positionOpenings: 2, totalOpenings: 4 },
  { schoolId: "pepperdine", schoolName: "Pepperdine Waves", division: "D1", logoUrl: "https://img.logo.dev/pepperdinewaves.com?token=pk_gvrfOoFzSV6KQEC6yVGwpA", logoBackgroundColor: null, logoMixBlendMode: null, brandColor: "#00205B", positionOpenings: 2, totalOpenings: 3 },
];

export const MOCK_AFFILIATE_CONVERSIONS = [
  { id: 1, affiliateId: 1, referredEmail: "jordan@example.com", plan: "monthly", status: "paid", commissionCents: 500, createdAt: new Date("2026-05-02") },
  { id: 2, affiliateId: 1, referredEmail: "casey@example.com", plan: "annual", status: "pending", commissionCents: 1500, createdAt: new Date("2026-05-20") },
];

export const MOCK_FOLLOW_UP_EMAIL = `Dear Coach Speraw,

I wanted to follow up on my email from two weeks ago regarding my interest in UCLA Men's Volleyball. I remain very excited about the possibility of joining your program and would love to schedule a call at your convenience.

Since my last email, I competed at the USAV Boys Junior National Championships where our team placed in the top 8 nationally. I believe this experience further demonstrates my readiness for Division I competition.

Please let me know if you have any questions. I look forward to hearing from you.

Best regards,
Alex Johnson`;
