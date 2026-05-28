/**
 * Roster Gap Finder Data Structure
 * Stores roster and commit data for college athletic programs
 * Used to identify recruiting gaps and match opportunities
 */

export const rosterDatabase = [
  {
    schoolName: "Duke",
    sport: "Men's Basketball",
    roster: [
      { name: "Jaylen Blakeslee", position: "Guard", graduationYear: 2026 },
      { name: "Tyrese Proctor", position: "Guard", graduationYear: 2027 },
      { name: "Jeremy Roach", position: "Guard", graduationYear: 2028 },
      { name: "Nolan Smith Jr.", position: "Guard", graduationYear: 2029 },
      { name: "Khaman Maluach", position: "Forward", graduationYear: 2026 },
      { name: "Dereck Lively II", position: "Forward", graduationYear: 2028 },
      { name: "Malachi Alston", position: "Forward", graduationYear: 2027 },
      { name: "Aden Thomas", position: "Forward", graduationYear: 2029 },
      { name: "Jalen Johnson", position: "Forward", graduationYear: 2027 },
      { name: "Mark Mitchell", position: "Forward", graduationYear: 2028 },
      { name: "Keenan Worthington", position: "Center", graduationYear: 2026 },
      { name: "Brennan Nabbs", position: "Center", graduationYear: 2028 },
      { name: "Theo John", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Caleb Foster", position: "Guard", enrollmentYear: 2026 },
      { name: "Sion James", position: "Forward", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Kentucky",
    sport: "Men's Basketball",
    roster: [
      { name: "Reed Sheppard", position: "Guard", graduationYear: 2029 },
      { name: "Lamont Butler", position: "Guard", graduationYear: 2026 },
      { name: "Otega Oweh", position: "Guard", graduationYear: 2027 },
      { name: "Tre King", position: "Guard", graduationYear: 2028 },
      { name: "Amari Williams", position: "Forward", graduationYear: 2026 },
      { name: "Jaxson Robinson", position: "Forward", graduationYear: 2027 },
      { name: "Adou Thiero", position: "Forward", graduationYear: 2028 },
      { name: "Trent Noah", position: "Forward", graduationYear: 2029 },
      { name: "Ugonna Onyenso", position: "Forward", graduationYear: 2028 },
      { name: "Zan Payne", position: "Center", graduationYear: 2026 },
      { name: "Daimion Collins", position: "Center", graduationYear: 2027 },
      { name: "Erty Ely", position: "Center", graduationYear: 2029 },
      { name: "Arrinton Gill", position: "Center", graduationYear: 2028 },
    ],
    commits: [
      { name: "Collin Chandler", position: "Guard", enrollmentYear: 2026 },
      { name: "Jaxon Robinson", position: "Forward", enrollmentYear: 2026 },
      { name: "Uros Plavsic", position: "Center", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Kansas",
    sport: "Men's Basketball",
    roster: [
      { name: "Kevin McCullar Jr.", position: "Guard", graduationYear: 2026 },
      { name: "Dajuan Harris Jr.", position: "Guard", graduationYear: 2026 },
      { name: "Gradey Dick", position: "Guard", graduationYear: 2027 },
      { name: "Bobby Pettiford Jr.", position: "Guard", graduationYear: 2028 },
      { name: "Zach Clemence", position: "Guard", graduationYear: 2029 },
      { name: "Jalen Wilson", position: "Forward", graduationYear: 2027 },
      { name: "Svi Mykhailiuk", position: "Forward", graduationYear: 2026 },
      { name: "Zuby Ejiofor", position: "Forward", graduationYear: 2028 },
      { name: "Zach Clemence", position: "Forward", graduationYear: 2029 },
      { name: "Hunter Dickinson", position: "Center", graduationYear: 2026 },
      { name: "Mitch Lightfoot", position: "Center", graduationYear: 2026 },
      { name: "David McCormack", position: "Center", graduationYear: 2027 },
      { name: "Donovan Beard", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Flory Bidunga", position: "Center", enrollmentYear: 2026 },
      { name: "Rylan Jones", position: "Guard", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "North Carolina",
    sport: "Men's Basketball",
    roster: [
      { name: "Caleb Love", position: "Guard", graduationYear: 2026 },
      { name: "RJ Davis", position: "Guard", graduationYear: 2027 },
      { name: "Leaky Black", position: "Guard", graduationYear: 2026 },
      { name: "Jalen Washington", position: "Guard", graduationYear: 2028 },
      { name: "Elliot Cadeau", position: "Guard", graduationYear: 2029 },
      { name: "Armando Bacot Jr.", position: "Forward", graduationYear: 2026 },
      { name: "Brady Manek", position: "Forward", graduationYear: 2026 },
      { name: "Justin McKie", position: "Forward", graduationYear: 2027 },
      { name: "Nate Santos", position: "Forward", graduationYear: 2028 },
      { name: "Jalen Washington", position: "Forward", graduationYear: 2028 },
      { name: "Ven-Allen Lutz", position: "Center", graduationYear: 2027 },
      { name: "Derrick Forgues", position: "Center", graduationYear: 2028 },
      { name: "Seth Trimble", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Ian Jackson", position: "Guard", enrollmentYear: 2026 },
      { name: "Jalen Washington", position: "Forward", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Gonzaga",
    sport: "Men's Basketball",
    roster: [
      { name: "Andrew Nembhard", position: "Guard", graduationYear: 2026 },
      { name: "Rasir Bolton", position: "Guard", graduationYear: 2027 },
      { name: "Nolan Hickman", position: "Guard", graduationYear: 2028 },
      { name: "Braden Huff", position: "Guard", graduationYear: 2029 },
      { name: "Donovan Beard", position: "Guard", graduationYear: 2029 },
      { name: "Drew Timme", position: "Forward", graduationYear: 2026 },
      { name: "Julian Strawther", position: "Forward", graduationYear: 2027 },
      { name: "Malachi Smith", position: "Forward", graduationYear: 2028 },
      { name: "Ike Iroegbu", position: "Forward", graduationYear: 2029 },
      { name: "Chet Holmgren", position: "Center", graduationYear: 2027 },
      { name: "Oumar Ballo", position: "Center", graduationYear: 2026 },
      { name: "Ben Gregg", position: "Center", graduationYear: 2028 },
      { name: "Jovan Blacksher Jr.", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Donovan Beard", position: "Guard", enrollmentYear: 2026 },
      { name: "Ike Iroegbu", position: "Forward", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "UCLA",
    sport: "Men's Basketball",
    roster: [
      { name: "Tyger Campbell", position: "Guard", graduationYear: 2026 },
      { name: "David Singleton", position: "Guard", graduationYear: 2026 },
      { name: "Jules Bernard", position: "Guard", graduationYear: 2027 },
      { name: "Jaime Jaquez Jr.", position: "Guard", graduationYear: 2026 },
      { name: "Will McCadden", position: "Guard", graduationYear: 2029 },
      { name: "Jaylen Clark", position: "Forward", graduationYear: 2027 },
      { name: "Jalen Hill", position: "Forward", graduationYear: 2028 },
      { name: "Mac Etienne", position: "Forward", graduationYear: 2028 },
      { name: "Adem Bona", position: "Forward", graduationYear: 2029 },
      { name: "Myles Johnson", position: "Center", graduationYear: 2026 },
      { name: "Cody Riley", position: "Center", graduationYear: 2027 },
      { name: "Luc Richard Mbah a Moute", position: "Center", graduationYear: 2028 },
      { name: "Adem Bona", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Donovan Beard", position: "Guard", enrollmentYear: 2026 },
      { name: "Adem Bona", position: "Forward", enrollmentYear: 2026 },
      { name: "Luc Richard Mbah a Moute", position: "Center", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Michigan State",
    sport: "Men's Basketball",
    roster: [
      { name: "Tyson Walker", position: "Guard", graduationYear: 2026 },
      { name: "A.J. Hoggard", position: "Guard", graduationYear: 2027 },
      { name: "Jaden Akins", position: "Guard", graduationYear: 2028 },
      { name: "Tre Holloman", position: "Guard", graduationYear: 2029 },
      { name: "Malik Hall", position: "Forward", graduationYear: 2026 },
      { name: "Joey Hauser", position: "Forward", graduationYear: 2027 },
      { name: "Mady Sissoko", position: "Forward", graduationYear: 2028 },
      { name: "Marcus Bingham Jr.", position: "Forward", graduationYear: 2026 },
      { name: "Jalen Pickett", position: "Forward", graduationYear: 2029 },
      { name: "Julius Marble II", position: "Center", graduationYear: 2027 },
      { name: "Carson Nollen", position: "Center", graduationYear: 2028 },
      { name: "Kur Kuath", position: "Center", graduationYear: 2029 },
      { name: "Mitch Henry", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Jalen Pickett", position: "Guard", enrollmentYear: 2026 },
      { name: "Kur Kuath", position: "Center", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Arizona",
    sport: "Men's Basketball",
    roster: [
      { name: "Kerr Kriisa", position: "Guard", graduationYear: 2026 },
      { name: "Pelle Larsson", position: "Guard", graduationYear: 2027 },
      { name: "Courtney Ramsey", position: "Guard", graduationYear: 2026 },
      { name: "Jovan Blacksher Jr.", position: "Guard", graduationYear: 2028 },
      { name: "Kylan Boswell", position: "Guard", graduationYear: 2029 },
      { name: "Azuolas Tubelis", position: "Forward", graduationYear: 2027 },
      { name: "Cedric Henderson Jr.", position: "Forward", graduationYear: 2026 },
      { name: "Justin Kier", position: "Forward", graduationYear: 2026 },
      { name: "Oumar Ballo", position: "Forward", graduationYear: 2027 },
      { name: "Adama Bal", position: "Forward", graduationYear: 2029 },
      { name: "Christian Koloko", position: "Center", graduationYear: 2026 },
      { name: "Jemarl Baker Jr.", position: "Center", graduationYear: 2028 },
      { name: "Tautvilas Tubelis", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Adama Bal", position: "Forward", enrollmentYear: 2026 },
      { name: "Tautvilas Tubelis", position: "Center", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Purdue",
    sport: "Men's Basketball",
    roster: [
      { name: "Jaden Ivey", position: "Guard", graduationYear: 2028 },
      { name: "Sasha Stefanovic", position: "Guard", graduationYear: 2026 },
      { name: "Isiah Thompson", position: "Guard", graduationYear: 2027 },
      { name: "Ethan Morton", position: "Guard", graduationYear: 2029 },
      { name: "Caleb Furst", position: "Guard", graduationYear: 2029 },
      { name: "Trevion Williams", position: "Forward", graduationYear: 2026 },
      { name: "Aaron Wheeler", position: "Forward", graduationYear: 2027 },
      { name: "Zach Edey", position: "Forward", graduationYear: 2028 },
      { name: "Caleb Furst", position: "Forward", graduationYear: 2029 },
      { name: "Mason Gillis", position: "Forward", graduationYear: 2026 },
      { name: "Matt Haarms", position: "Center", graduationYear: 2026 },
      { name: "Zach Edey", position: "Center", graduationYear: 2028 },
      { name: "Derrick Foreman", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Caleb Furst", position: "Forward", enrollmentYear: 2026 },
      { name: "Derrick Foreman", position: "Center", enrollmentYear: 2026 },
      { name: "Ethan Morton", position: "Guard", enrollmentYear: 2026 },
    ],
  },
  {
    schoolName: "Connecticut",
    sport: "Men's Basketball",
    roster: [
      { name: "Tristen Newton", position: "Guard", graduationYear: 2026 },
      { name: "Jordan Hawkins", position: "Guard", graduationYear: 2027 },
      { name: "Hassan Diarra", position: "Guard", graduationYear: 2028 },
      { name: "Corey Floyd Jr.", position: "Guard", graduationYear: 2029 },
      { name: "Donovan Clingan", position: "Guard", graduationYear: 2029 },
      { name: "Adama Sanogo", position: "Forward", graduationYear: 2026 },
      { name: "Jalen Gaffney", position: "Forward", graduationYear: 2027 },
      { name: "Isaiah Whaley", position: "Forward", graduationYear: 2026 },
      { name: "Tyrese Martin", position: "Forward", graduationYear: 2027 },
      { name: "Akok Akok", position: "Forward", graduationYear: 2028 },
      { name: "Donovan Clingan", position: "Center", graduationYear: 2029 },
      { name: "Samson Johnson", position: "Center", graduationYear: 2028 },
      { name: "Nate Santos", position: "Center", graduationYear: 2029 },
    ],
    commits: [
      { name: "Corey Floyd Jr.", position: "Guard", enrollmentYear: 2026 },
      { name: "Donovan Clingan", position: "Center", enrollmentYear: 2026 },
    ],
  },
];

/**
 * Calculate roster gaps for a specific position and graduation year
 * @param {string} schoolName - Name of the school
 * @param {string} sport - Sport (e.g., "Men's Basketball")
 * @param {string} position - Position (e.g., "Guard", "Forward", "Center")
 * @param {number} graduationYear - Year players will graduate (e.g., 2026)
 * @returns {Object} Gap analysis with openings, commits, netOpenings, matchScore, and reason
 */
export function calculateRosterGap(schoolName, sport, position, graduationYear) {
  // Find the school in the database
  const school = rosterDatabase.find(
    (s) => s.schoolName === schoolName && s.sport === sport
  );

  if (!school) {
    return {
      openings: 0,
      commits: 0,
      netOpenings: 0,
      matchScore: 0,
      reason: `School "${schoolName}" not found in ${sport} database.`,
    };
  }

  // Calculate seniors graduating at this position
  const openings = school.roster.filter((player) => {
    return (
      player.position === position && player.graduationYear === graduationYear
    );
  }).length;

  // Count commits at this position
  const commitsAtPosition = school.commits.filter(
    (commit) => commit.position === position && commit.enrollmentYear === graduationYear
  ).length;

  // Calculate net openings
  const netOpenings = Math.max(0, openings - commitsAtPosition);

  // Calculate match score (0-100)
  // 100 if there are openings with no commits, 0 if no openings
  const matchScore = openings > 0 ? Math.round((netOpenings / openings) * 100) : 0;

  // Generate reason string
  let reason = "";
  if (openings === 0) {
    reason = `No ${position} seniors graduating in ${graduationYear} — no recruiting need at this position.`;
  } else if (netOpenings === 0) {
    reason = `${openings} ${position} senior(s) graduating in ${graduationYear}, but all spots filled by commits — no real openings.`;
  } else {
    reason = `${openings} ${position} senior(s) graduating in ${graduationYear}, ${commitsAtPosition} commit(s) already filling spot(s) — ${netOpenings} real opening(s) remaining.`;
  }

  return {
    openings,
    commits: commitsAtPosition,
    netOpenings,
    matchScore,
    reason,
  };
}

// Test the function
console.log(
  "Testing calculateRosterGap with Duke Guard 2026:",
  calculateRosterGap("Duke", "Men's Basketball", "Guard", 2026)
);
