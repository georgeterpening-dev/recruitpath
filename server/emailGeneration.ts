/**
 * Email Generation Helpers
 * Position-specific stat emphasis and Claude system prompt
 */

// Position-to-stats mapping: which stats matter for each position
const POSITION_STAT_EMPHASIS: Record<string, {
  emphasize: string[];
  deemphasize: string[];
  toneContext: string;
}> = {
  "Outside Hitter": {
    emphasize: ["approach jump", "vertical jump", "height", "attacking stats", "club team", "film"],
    deemphasize: [],
    toneContext: "coaches want to know you can terminate the ball and play defense",
  },
  "OH": {
    emphasize: ["approach jump", "vertical jump", "height", "attacking stats", "club team", "film"],
    deemphasize: [],
    toneContext: "coaches want to know you can terminate the ball and play defense",
  },
  "Middle Blocker": {
    emphasize: ["height", "approach jump", "blocking stats", "reach", "athleticism"],
    deemphasize: ["back row stats", "serve receive"],
    toneContext: "coaches care most about size, blocking presence, and transition offense",
  },
  "MB": {
    emphasize: ["height", "approach jump", "blocking stats", "reach", "athleticism"],
    deemphasize: ["back row stats", "serve receive"],
    toneContext: "coaches care most about size, blocking presence, and transition offense",
  },
  "Opposite": {
    emphasize: ["approach jump", "attacking ability", "height", "right side blocking"],
    deemphasize: ["serve receive", "passing"],
    toneContext: "coaches want a dominant attacker who can also block on the right",
  },
  "OPP": {
    emphasize: ["approach jump", "attacking ability", "height", "right side blocking"],
    deemphasize: ["serve receive", "passing"],
    toneContext: "coaches want a dominant attacker who can also block on the right",
  },
  "Setter": {
    emphasize: ["GPA", "IQ", "decision making", "club team", "leadership", "film"],
    deemphasize: ["vertical jump", "approach jump"],
    toneContext: "coaches care about decision making, composure, and how the team performs around them — stats matter less than feel and team success",
  },
  "S": {
    emphasize: ["GPA", "IQ", "decision making", "club team", "leadership", "film"],
    deemphasize: ["vertical jump", "approach jump"],
    toneContext: "coaches care about decision making, composure, and how the team performs around them — stats matter less than feel and team success",
  },
  "Libero": {
    emphasize: ["passing ability", "defense", "serve receive", "club team", "GPA"],
    deemphasize: ["vertical jump", "approach jump", "height", "attacking stats"],
    toneContext: "coaches want to know you can pass and dig, period",
  },
  "L": {
    emphasize: ["passing ability", "defense", "serve receive", "club team", "GPA"],
    deemphasize: ["vertical jump", "approach jump", "height", "attacking stats"],
    toneContext: "coaches want to know you can pass and dig, period",
  },
  "Defensive Specialist": {
    emphasize: ["passing", "defense", "serve receive", "serve", "club team"],
    deemphasize: ["vertical jump", "approach jump", "attacking", "height"],
    toneContext: "serve receive and defense only",
  },
  "DS": {
    emphasize: ["passing", "defense", "serve receive", "serve", "club team"],
    deemphasize: ["vertical jump", "approach jump", "attacking", "height"],
    toneContext: "serve receive and defense only",
  },
};

export function getPositionStatRules(position?: string): {
  emphasize: string[];
  deemphasize: string[];
  toneContext: string;
} {
  if (!position) {
    return {
      emphasize: ["athletic ability", "club team", "film"],
      deemphasize: [],
      toneContext: "highlight your strengths as a volleyball player",
    };
  }

  // Try exact match first
  if (POSITION_STAT_EMPHASIS[position]) {
    return POSITION_STAT_EMPHASIS[position];
  }

  // Try to find a match by abbreviation or partial name
  const normalized = position.toLowerCase().trim();
  for (const [key, rules] of Object.entries(POSITION_STAT_EMPHASIS)) {
    if (key.toLowerCase().includes(normalized) || normalized.includes(key.toLowerCase())) {
      return rules;
    }
  }

  // Default fallback
  return {
    emphasize: ["athletic ability", "club team", "film"],
    deemphasize: [],
    toneContext: "highlight your strengths as a volleyball player",
  };
}

export function buildClaudeSystemPrompt(
  athleteName: string,
  athletePosition: string,
  graduationYear: string,
  height: string | undefined,
  gpa: string | undefined,
  clubTeam: string | undefined,
  highSchool: string | undefined,
  city: string | undefined,
  state: string | undefined,
  verticalJump: string | undefined,
  approachJump: string | undefined,
  intendedMajor: string | undefined,
  hudlLink: string | undefined,
  ncsaLink: string | undefined,
  keyStats: string | undefined,
  awards: string | undefined,
  schoolName: string,
  division: string | undefined,
  conference: string | undefined,
  coachName: string | undefined,
  graduatingAtUserPosition: number,
  openingsAtUserPosition: number,
  totalGraduating: number,
  userGradYear: string,
  userPositions: string,
  specificMention: string | undefined,
  academicMatch: string | undefined
): string {
  const positionRules = getPositionStatRules(athletePosition);
  const timestamp = Date.now();

  const positionInstructions = `
POSITION-SPECIFIC INSTRUCTIONS FOR ${athletePosition.toUpperCase()}:
- Emphasize: ${positionRules.emphasize.join(", ")}
- De-emphasize or omit: ${positionRules.deemphasize.length > 0 ? positionRules.deemphasize.join(", ") : "none"}
- Tone context: ${positionRules.toneContext}
`;

  const academicSection = academicMatch
    ? `\nACADEMIC PROGRAM CONNECTION:
${academicMatch}
If the athlete's intended major matches, mention it naturally as a secondary reason for interest.`
    : "";

  const specificMentionSection = specificMention
    ? `\nADDITIONAL CONTEXT FROM ATHLETE:
The athlete noted: "${specificMention}"
Paraphrase this naturally in one sentence, as if the athlete is casually mentioning something they noticed. Keep it straightforward and conversational — not overly flowery.`
    : "";

  return `You are writing a college volleyball recruiting email on behalf of ${athleteName}.

ATHLETE PROFILE:
- Name: ${athleteName}
- Graduation Year: ${graduationYear}
- Position(s): ${athletePosition}
- Height: ${height || "Not provided"}
- GPA: ${gpa || "Not provided"}
- Club Team: ${clubTeam || "Not provided"}
- High School: ${highSchool || "Not provided"}
- City/State: ${city || "Not provided"}, ${state || "Not provided"}
- Vertical Jump: ${verticalJump || "Not provided"}
- Approach Jump: ${approachJump || "Not provided"}
- Intended Major: ${intendedMajor || "Not provided"}
- Hudl: ${hudlLink || "Not provided"}
- NCSA: ${ncsaLink || "Not provided"}
- Key Stats: ${keyStats || "Not provided"}
- Awards: ${awards || "Not provided"}

SCHOOL BEING EMAILED:
- School: ${schoolName}
- Division: ${division || "Unknown"}
- Conference: ${conference || "Unknown"}
- Head Coach: ${coachName || "Coach"}

ROSTER INTELLIGENCE (use this naturally, never reference it as data):
- ${graduatingAtUserPosition} player(s) at ${userPositions} are graduating in ${userGradYear}
- This creates ${openingsAtUserPosition} opening(s) at the athlete's position when they arrive
- Total players graduating from this program in ${userGradYear}: ${totalGraduating}
${positionInstructions}${academicSection}${specificMentionSection}

EMAIL REQUIREMENTS:
- Address the coach as "Coach [LastName]" — never "Dear Coach" alone
- Never start with "My name is" or "I am writing to"
- Never start a sentence with "I" as the first word of the email
- Weave in the roster intelligence naturally as if the athlete noticed it through research
- Only mention stats and attributes relevant to the athlete's position — see position rules above
- End with a genuine question that invites a response
- Length: 100-160 words maximum
- Subject line: graduation year + position + one hook — no stats in subject line
- Every email must be completely unique in structure and phrasing
- Sound like a real teenager wrote it — not a template, not a platform

STRUCTURAL VARIETY RULES (MANDATORY):
Every email must feel structurally different. Randomly vary ALL of the following:

1. OPENING LINE — Never start with "Dear Coach", "My name is", "I am writing to express", or any line beginning with "I". Instead open with one of these approaches (pick randomly):
   - A direct statement about the program: "Coach [Last Name] — I've been following [School]'s program closely and I think there's a real fit worth exploring."
   - A specific observation: "Coach [Last Name] — [School]'s system is exactly the kind of environment I've been looking for."
   - A bold claim about the athlete: "Coach [Last Name] — Class of [year], [position], and I think [School] might be exactly what I'm looking for."
   - A punchy intro: "I'll keep this short, Coach [Last Name] — I'm a [position] in the Class of [year] and your program is at the top of my list."
   Always address as "Coach [Last Name]" or "Hey Coach [Last Name]" — never "Dear Coach".

2. INFORMATION ORDER — Randomly choose one of these orderings:
   - Lead with athletic stats, then academics, then roster observation
   - Lead with a roster gap observation, then athletic credentials, then academics
   - Lead with academics/major interest, then athletic profile, then why this program specifically
   - Lead with a question about the program, then introduce yourself

3. CLOSING — Rotate between these closing questions (pick one randomly, make it feel natural):
   - Ask about their recruiting timeline for the Class of ${graduationYear}
   - Ask about upcoming camps or clinics to see the program in person
   - Ask what qualities they look for most in a ${athletePosition}
   - Ask if a quick call would be possible to learn more
   - Ask if there's anything specific they'd like to see (film, transcripts, etc.)
   - Ask what the roster situation at ${athletePosition} looks like for their ${graduationYear} class
   EVERY email MUST end with a genuine question. Never end without one.

4. TONE & LENGTH — Randomly vary:
   - Some emails are punchy and short (80-100 words body)
   - Some are more narrative (130-160 words body)
   - Some reference the team's recent performance or conference standing if known

BANNED PHRASES (NEVER USE):
- "Dear Coach" (use "Coach [Last Name]" or "Hey Coach [Last Name]")
- "My name is [Name]"
- "I am writing to express my interest"
- "I am a [year] [position] from [school]" as an opening line
- Any opening line that starts with the word "I"
- "Sincerely" as a sign-off (use "Talk soon", "Hope to connect", "Looking forward to hearing from you", or similar)

SUBJECT LINE RULES:
Subject line formula: Grad year + Position + one hook element.
GOOD examples: "2027 Setter — Interested in Your Program" | "Class of 2027 OH — [School Name] on My List" | "2028 Middle Blocker — Looking at [School]"
NEVER include in subject: GPA, vertical jump, height, SAT score, or any numerical stat.

Timestamp for uniqueness: ${timestamp}

Generate the subject line first, then the email body.`;
};
