/**
 * SchoolFinderQuiz — Full-screen overlay questionnaire
 * 8 questions → scoring → top 6 matched schools
 * Design: #0A0A0A bg, #F5C518 yellow accent, Bebas Neue headlines, DM Sans body
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuizAnswers {
  division: string;
  nameRecognition: string[];
  location: string[];
  schoolSize: string[];
  academics: string[];
  major: string[];
  budget: string[];
  environment: string[];
}

interface QuizProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, called with matched school IDs after quiz completes and user is logged in */
  onComplete?: (schoolIds: string[]) => void;
  /** Pre-filled answers (e.g. from localStorage after signup) */
  initialAnswers?: Partial<QuizAnswers> | null;
}

// ─── Questions ───────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "division",
    title: "WHAT DIVISION LEVEL ARE YOU TARGETING?",
    subtitle: "This is the most important filter — be honest with yourself. Select all that apply.",
    multi: true,
    options: [
      { value: "D1", label: "Division I", desc: "Highest competition, full scholarships" },
      { value: "D2", label: "Division II", desc: "Partial scholarships, strong programs" },
      { value: "D3", label: "Division III", desc: "No athletic scholarships, academic focus" },
      { value: "any", label: "Open to all", desc: "I'll go wherever the fit is right" },
    ],
  },
  {
    id: "nameRecognition",
    title: "HOW IMPORTANT IS THE SCHOOL'S NAME RECOGNITION?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { value: "high", label: "Has to be a known school", desc: "UCLA, USC, NYU level — my family should recognize it" },
      { value: "medium", label: "Reasonably well known", desc: "People in my state or sport would know it" },
      { value: "none", label: "Doesn't matter at all", desc: "Best volleyball fit wins, period" },
      { value: "hidden", label: "Prefer under the radar", desc: "Less hype, more focus — I like hidden gems" },
    ],
  },
  {
    id: "location",
    title: "WHERE DO YOU WANT TO GO TO SCHOOL?",
    subtitle: "Select all regions you'd consider.",
    multi: true,
    options: [
      { value: "west", label: "West Coast", desc: "CA, OR, WA, HI" },
      { value: "midwest", label: "Midwest", desc: "IL, OH, IN, MO and surrounding" },
      { value: "east", label: "East Coast", desc: "NY, MA, CT, VA and surrounding" },
      { value: "south", label: "South", desc: "TX, FL, GA and surrounding" },
      { value: "any", label: "No preference", desc: "I'll go anywhere for the right school" },
    ],
  },
  {
    id: "schoolSize",
    title: "WHAT SIZE SCHOOL FITS YOU BEST?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { value: "small", label: "Small", desc: "Under 5,000 students" },
      { value: "medium", label: "Medium", desc: "5,000 to 15,000 students" },
      { value: "large", label: "Large", desc: "15,000 to 30,000 students" },
      { value: "xlarge", label: "Very large", desc: "30,000+ students" },
    ],
  },
  {
    id: "academics",
    title: "HOW IMPORTANT IS ACADEMIC PRESTIGE?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { value: "elite", label: "Top ranked", desc: "Elite academics matter a lot to me" },
      { value: "strong", label: "Strong academics", desc: "Good programs, not necessarily top 20" },
      { value: "balanced", label: "Balanced", desc: "Solid enough, volleyball is the priority" },
      { value: "any", label: "Not a major factor", desc: "Any accredited school works" },
    ],
  },
  {
    id: "major",
    title: "WHAT AREA DO YOU WANT TO STUDY?",
    subtitle: "Select all that interest you.",
    multi: true,
    options: [
      { value: "business", label: "Business", desc: "Finance, marketing, management" },
      { value: "stem", label: "STEM", desc: "Engineering, CS, biology, pre-med" },
      { value: "social", label: "Social sciences", desc: "Psychology, poli sci, communications" },
      { value: "arts", label: "Arts & humanities", desc: "Film, design, education, history" },
      { value: "kinesiology", label: "Kinesiology / sports", desc: "Exercise science, sports management" },
      { value: "undecided", label: "Undecided", desc: "I'm still figuring it out" },
    ],
  },
  {
    id: "budget",
    title: "WHAT IS YOUR ANNUAL TUITION BUDGET BEFORE FINANCIAL AID?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { value: "low", label: "Under $20k", desc: "Public in-state schools" },
      { value: "mid", label: "$20k to $40k", desc: "Mid-range private or out-of-state public" },
      { value: "high", label: "$40k to $60k", desc: "Most private universities" },
      { value: "any", label: "No limit", desc: "Financial aid will cover the difference" },
    ],
  },
  {
    id: "environment",
    title: "WHAT CAMPUS ENVIRONMENT FITS YOU?",
    subtitle: "Select all that apply.",
    multi: true,
    options: [
      { value: "urban", label: "Urban city", desc: "Big city, lots going on off campus" },
      { value: "college-town", label: "College town", desc: "Campus is the center of everything" },
      { value: "suburban", label: "Suburban", desc: "Quieter, spread out campus feel" },
      { value: "any", label: "No preference", desc: "Either works for me" },
    ],
  },
];

// ─── Scoring helpers ──────────────────────────────────────────────────────────

const WEST_STATES = ["CA", "OR", "WA", "HI", "NV", "AZ", "UT", "ID", "MT", "WY", "CO", "NM", "AK"];
const MIDWEST_STATES = ["IL", "OH", "IN", "MO", "MI", "WI", "MN", "IA", "KS", "NE", "ND", "SD"];
const EAST_STATES = ["NY", "MA", "CT", "VA", "NJ", "PA", "MD", "DE", "RI", "NH", "VT", "ME", "WV", "NC", "SC"];
const SOUTH_STATES = ["TX", "FL", "GA", "AL", "MS", "LA", "AR", "TN", "KY", "OK"];

// Known-name D1 schools (sortOrder <= 10)
const HIGH_NAME_SCHOOLS = ["mvb-ucla", "mvb-usc", "mvb-lbsu", "mvb-hawaii", "mvb-stanford", "mvb-byu", "mvb-pepperdine", "mvb-uci", "mvb-ucsb", "mvb-ohiostate", "mvb-pennstate"];
const MEDIUM_NAME_SCHOOLS = ["mvb-georgemason", "mvb-loyolachicago", "mvb-mckendree", "mvb-lindenwood", "mvb-nku", "mvb-manhattan", "mvb-pacific", "mvb-lewisu", "mvb-ucsd", "mvb-harvard", "mvb-ballstate", "mvb-sacredheart"];

// Academic prestige tiers
const ELITE_ACADEMIC = ["mvb-stanford", "mvb-harvard", "mvb-ucla", "mvb-usc", "mvb-ucsd", "mvb-ucsb", "mvb-uci", "mvb-pennstate", "mvb-ohiostate"];
const STRONG_ACADEMIC = ["mvb-pepperdine", "mvb-byu", "mvb-hawaii", "mvb-loyolachicago", "mvb-georgemason", "mvb-manhattan", "mvb-pacific", "mvb-sacredheart"];

// Campus size tiers (approximate enrollment)
const SMALL_SCHOOLS = ["mvb-pepperdine", "mvb-manhattan", "mvb-sacredheart", "mvb-pacific", "mvb-lbsu"];
const MEDIUM_SCHOOLS = ["mvb-byu", "mvb-hawaii", "mvb-uci", "mvb-ucsb", "mvb-ucsd", "mvb-loyolachicago", "mvb-georgemason", "mvb-mckendree", "mvb-lindenwood", "mvb-nku", "mvb-lewisu", "mvb-ballstate"];
const LARGE_SCHOOLS = ["mvb-ucla", "mvb-usc", "mvb-ohiostate", "mvb-pennstate"];

// Campus environment
const URBAN_SCHOOLS = ["mvb-ucla", "mvb-usc", "mvb-loyolachicago", "mvb-manhattan", "mvb-georgemason", "mvb-nyu"];
const COLLEGE_TOWN_SCHOOLS = ["mvb-byu", "mvb-pennstate", "mvb-ohiostate", "mvb-ballstate", "mvb-mckendree"];
const SUBURBAN_SCHOOLS = ["mvb-pepperdine", "mvb-lbsu", "mvb-uci", "mvb-ucsb", "mvb-ucsd", "mvb-sacredheart", "mvb-pacific", "mvb-lindenwood", "mvb-nku", "mvb-lewisu"];

// Budget tiers (D1 private = high, D1 public = mid, D2/D3 = mid/low)
const LOW_BUDGET_SCHOOLS = ["mvb-ucla", "mvb-usc", "mvb-lbsu", "mvb-hawaii", "mvb-uci", "mvb-ucsb", "mvb-ucsd", "mvb-ohiostate", "mvb-pennstate", "mvb-ballstate", "mvb-nku", "mvb-lewisu", "mvb-georgemason", "mvb-loyolachicago"];
const MID_BUDGET_SCHOOLS = ["mvb-byu", "mvb-mckendree", "mvb-lindenwood", "mvb-manhattan", "mvb-pacific", "mvb-sacredheart"];
const HIGH_BUDGET_SCHOOLS = ["mvb-stanford", "mvb-pepperdine", "mvb-harvard", "mvb-loyolachicago"];

// Major strengths per school
const SCHOOL_MAJORS: Record<string, string[]> = {
  "mvb-stanford": ["stem", "business", "social"],
  "mvb-ucla": ["arts", "stem", "business", "social"],
  "mvb-usc": ["arts", "business", "social"],
  "mvb-harvard": ["stem", "social", "business"],
  "mvb-byu": ["business", "stem", "social"],
  "mvb-pepperdine": ["business", "social", "arts"],
  "mvb-pennstate": ["stem", "business", "kinesiology"],
  "mvb-ohiostate": ["stem", "business", "kinesiology"],
  "mvb-hawaii": ["business", "social", "kinesiology"],
  "mvb-lbsu": ["kinesiology", "business", "arts"],
  "mvb-uci": ["stem", "social", "business"],
  "mvb-ucsb": ["stem", "social", "arts"],
  "mvb-ucsd": ["stem", "social", "business"],
  "mvb-georgemason": ["business", "social", "stem"],
  "mvb-loyolachicago": ["business", "social", "stem"],
  "mvb-manhattan": ["business", "social", "arts"],
  "mvb-pacific": ["business", "kinesiology", "social"],
  "mvb-mckendree": ["business", "kinesiology", "social"],
  "mvb-lindenwood": ["business", "arts", "kinesiology"],
  "mvb-nku": ["business", "stem", "social"],
  "mvb-lewisu": ["business", "stem", "kinesiology"],
  "mvb-ballstate": ["business", "arts", "kinesiology"],
  "mvb-sacredheart": ["business", "kinesiology", "stem"],
};

interface SchoolData {
  id: string;
  name: string;
  division: string | null;
  conference: string | null;
  state: string | null;
  city: string | null;
  coachName: string | null;
  athleticsDomain: string | null;
  logoUrl: string | null;
  sortOrder: number;
}

function scoreSchool(school: SchoolData, answers: QuizAnswers): number {
  let score = 0;
  const id = school.id;
  const div = school.division;
      const state = (school.state as string | null) || "";

  // Division match (25 pts)
  if (answers.division === "any") score += 25;
  else if (answers.division === div) score += 25;
  else if (answers.division === "D1" && div === "D1") score += 25;

  // Name recognition (20 pts)
  const isHighName = HIGH_NAME_SCHOOLS.includes(id);
  const isMediumName = MEDIUM_NAME_SCHOOLS.includes(id);
  const nameRecs = answers.nameRecognition;
  if (nameRecs.length === 0) score += 0;
  else if (nameRecs.includes("high") && isHighName) score += 20;
  else if (nameRecs.includes("medium") && (isHighName || isMediumName)) score += 20;
  else if (nameRecs.includes("none")) score += 20;
  else if (nameRecs.includes("hidden") && !isHighName && !isMediumName) score += 20;
  else if (nameRecs.includes("medium") && !isHighName && !isMediumName) score += 10; // partial

  // Location (18 pts)
  const locs = answers.location;
  if (locs.includes("any")) {
    score += 18;
  } else {
    const inWest = WEST_STATES.includes(state);
    const inMidwest = MIDWEST_STATES.includes(state);
    const inEast = EAST_STATES.includes(state);
    const inSouth = SOUTH_STATES.includes(state);
    if ((locs.includes("west") && inWest) ||
        (locs.includes("midwest") && inMidwest) ||
        (locs.includes("east") && inEast) ||
        (locs.includes("south") && inSouth)) {
      score += 18;
    }
  }

  // Academics (12 pts)
  const isElite = ELITE_ACADEMIC.includes(id);
  const isStrong = STRONG_ACADEMIC.includes(id);
  const acads = answers.academics;
  if (acads.length === 0) score += 0;
  else if (acads.includes("elite") && isElite) score += 12;
  else if (acads.includes("strong") && (isElite || isStrong)) score += 12;
  else if (acads.includes("balanced")) score += 12;
  else if (acads.includes("any")) score += 12;
  else if (acads.includes("elite") && isStrong) score += 6; // partial

  // Size (10 pts)
  const isSmall = SMALL_SCHOOLS.includes(id);
  const isMedium = MEDIUM_SCHOOLS.includes(id);
  const isLarge = LARGE_SCHOOLS.includes(id);
  const sizes = answers.schoolSize;
  if (sizes.length === 0) score += 0;
  else if (sizes.includes("small") && isSmall) score += 10;
  else if (sizes.includes("medium") && isMedium) score += 10;
  else if (sizes.includes("large") && isLarge) score += 10;
  else if (sizes.includes("xlarge") && !isSmall && !isMedium && !isLarge) score += 10;
  else score += 5; // partial for unknown

  // Major (8 pts)
  const majors = answers.major;
  if (majors.includes("undecided")) {
    score += 8;
  } else {
    const schoolMajors = SCHOOL_MAJORS[id] || [];
    const overlap = majors.filter(m => schoolMajors.includes(m)).length;
    if (overlap > 0) score += Math.min(8, overlap * 4);
  }

  // Budget (8 pts)
  const isLowBudget = LOW_BUDGET_SCHOOLS.includes(id);
  const isMidBudget = MID_BUDGET_SCHOOLS.includes(id);
  const isHighBudget = HIGH_BUDGET_SCHOOLS.includes(id);
  const budgets = answers.budget;
  if (budgets.length === 0) score += 0;
  else if (budgets.includes("any")) score += 8;
  else if (budgets.includes("low") && isLowBudget) score += 8;
  else if (budgets.includes("mid") && (isLowBudget || isMidBudget)) score += 8;
  else if (budgets.includes("high")) score += 8;
  else score += 4; // partial

  // Environment (7 pts)
  const isUrban = URBAN_SCHOOLS.includes(id);
  const isCollegeTown = COLLEGE_TOWN_SCHOOLS.includes(id);
  const isSuburban = SUBURBAN_SCHOOLS.includes(id);
  const envs = answers.environment;
  if (envs.length === 0) score += 0;
  else if (envs.includes("any")) score += 7;
  else if (envs.includes("urban") && isUrban) score += 7;
  else if (envs.includes("college-town") && isCollegeTown) score += 7;
  else if (envs.includes("suburban") && isSuburban) score += 7;
  else score += 3; // partial

  return score;
}

const MAX_SCORE = 25 + 20 + 18 + 12 + 10 + 8 + 8 + 7; // 108

function getTags(school: SchoolData, answers: QuizAnswers): string[] {
  const tags: string[] = [];
  const id = school.id;
  const state = (school.state as string | null) || "";

  if (ELITE_ACADEMIC.includes(id)) tags.push("Top academics");
  else if (STRONG_ACADEMIC.includes(id)) tags.push("Strong academics");

  if (WEST_STATES.includes(state)) tags.push("West Coast");
  else if (EAST_STATES.includes(state)) tags.push("East Coast");
  else if (MIDWEST_STATES.includes(state)) tags.push("Midwest");
  else if (SOUTH_STATES.includes(state)) tags.push("South");

  if (LARGE_SCHOOLS.includes(id)) tags.push("Large campus");
  else if (SMALL_SCHOOLS.includes(id)) tags.push("Small campus");

  if (URBAN_SCHOOLS.includes(id)) tags.push("Urban");
  else if (COLLEGE_TOWN_SCHOOLS.includes(id)) tags.push("College town");

  if (HIGH_NAME_SCHOOLS.includes(id)) tags.push("Well known");

  return tags.slice(0, 3);
}

// ─── SchoolLogo (inline, same as existing) ───────────────────────────────────

function QuizSchoolLogo({ school }: { school: SchoolData }) {
  const [imgError, setImgError] = useState(false);
  const logoDevToken = (import.meta.env.VITE_LOGO_DEV_TOKEN as string) || "";
  const initials = school.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const logoUrl = school.logoUrl && !imgError
    ? school.logoUrl
    : school.athleticsDomain && !imgError
    ? `https://img.logo.dev/${school.athleticsDomain}?token=${logoDevToken}&size=80`
    : null;

  if (logoUrl) {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
        <img
          src={logoUrl}
          alt={school.name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
      style={{ background: "#2A2A2A", color: "#F5C518", fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em" }}
    >
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_ANSWERS: QuizAnswers = {
  division: "",
  nameRecognition: [],
  location: [],
  schoolSize: [],
  academics: [],
  major: [],
  budget: [],
  environment: [],
};

export const QUIZ_ANSWERS_KEY = "recruitpath_quiz_answers";
export const QUIZ_COMPLETED_KEY = "recruitpath_quiz_completed";

export default function SchoolFinderQuiz({ isOpen, onClose, onComplete, initialAnswers }: QuizProps) {
  const [step, setStep] = useState(0); // 0-7 = questions, 8 = results
  const [answers, setAnswers] = useState<QuizAnswers>({ ...EMPTY_ANSWERS, ...(initialAnswers || {}) });
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [addedSchools, setAddedSchools] = useState<Set<string>>(new Set());

  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const schoolsQuery = trpc.volleyball.schools.useQuery(undefined, { enabled: isOpen });
  const addToListMutation = trpc.outreach.add.useMutation();
  const utils = trpc.useUtils();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDirection(1);
      setShowAuthPrompt(false);
      setAddedSchools(new Set());
      if (initialAnswers) {
        setAnswers({ ...EMPTY_ANSWERS, ...initialAnswers });
      } else {
        setAnswers({ ...EMPTY_ANSWERS });
      }
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const currentQ = QUESTIONS[step];
  const currentAnswer = currentQ ? answers[currentQ.id as keyof QuizAnswers] : null;
  const hasAnswer = currentQ?.multi
    ? Array.isArray(currentAnswer) && (currentAnswer as string[]).length > 0
    : typeof currentAnswer === "string" && currentAnswer !== "";

  function toggleOption(value: string) {
    const q = QUESTIONS[step];
    if (!q) return;
    const key = q.id as keyof QuizAnswers;
    if (q.multi) {
      const current = (answers[key] as string[]) || [];
      // "any" is exclusive
      if (value === "any") {
        setAnswers(a => ({ ...a, [key]: ["any"] }));
      } else {
        const without = current.filter(v => v !== "any");
        if (without.includes(value)) {
          setAnswers(a => ({ ...a, [key]: without.filter(v => v !== value) }));
        } else {
          setAnswers(a => ({ ...a, [key]: [...without, value] }));
        }
      }
    } else {
      setAnswers(a => ({ ...a, [key]: value }));
    }
  }

  function isSelected(value: string): boolean {
    const q = QUESTIONS[step];
    if (!q) return false;
    const key = q.id as keyof QuizAnswers;
    if (q.multi) {
      return ((answers[key] as string[]) || []).includes(value);
    }
    return answers[key] === value;
  }

  function goNext() {
    // Validate that at least one option is selected
    if (!hasAnswer) {
      // Trigger shake animation on the options container
      const optionsContainer = document.querySelector('[data-quiz-options]');
      if (optionsContainer) {
        optionsContainer.classList.add('shake');
        setTimeout(() => optionsContainer.classList.remove('shake'), 500);
      }
      return;
    }
    
    if (step < QUESTIONS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      // Save to localStorage before showing results
      localStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers));
      localStorage.setItem(QUIZ_COMPLETED_KEY, "true");
      setDirection(1);
      setStep(QUESTIONS.length); // results
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  }

  function restart() {
    setDirection(-1);
    setStep(0);
    setAnswers({ ...EMPTY_ANSWERS });
    setShowAuthPrompt(false);
    setAddedSchools(new Set());
  }

  // Compute results — exclude dev test schools from quiz recommendations
  const allSchools: SchoolData[] = (schoolsQuery.data || []).filter(
    (s) => !(s as SchoolData & { isTestSchool?: boolean }).isTestSchool
  );
  const scoredSchools = allSchools
    .map(s => ({ school: s, score: scoreSchool(s, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  async function handleAdd(schoolId: string) {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    try {
      await addToListMutation.mutateAsync({ schoolId });
      setAddedSchools(prev => { const next = new Set(Array.from(prev)); next.add(schoolId); return next; });
      utils.outreach.list.invalidate();
      if (onComplete) {
        onComplete([schoolId]);
      }
    } catch (e) {
      // ignore
    }
  }

  const progressPct = step < QUESTIONS.length ? ((step) / QUESTIONS.length) * 100 : 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "rgba(10,10,10,0.97)" }}
    >
      {/* Progress bar */}
      <div className="relative h-1 w-full" style={{ background: "#1A1A1A" }}>
        <motion.div
          className="absolute left-0 top-0 h-full"
          style={{ background: "#F5C518" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "#1A1A1A", color: "#888888" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#F5C518")}
        onMouseLeave={e => (e.currentTarget.style.color = "#888888")}
      >
        <X size={18} />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            {step < QUESTIONS.length ? (
              <motion.div
                key={`q-${step}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Step counter */}
                <p className="text-center mb-4" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", letterSpacing: "0.15em", color: "#888888" }}>
                  QUESTION {step + 1} OF {QUESTIONS.length}
                </p>

                {/* Question title */}
                <h2
                  className="text-center mb-2"
                  style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "clamp(28px, 5vw, 42px)", color: "#F8FAFC", lineHeight: 1.1 }}
                >
                  {currentQ.title}
                </h2>

                {/* Subtitle */}
                <p className="text-center mb-8" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "15px", color: "#888888" }}>
                  {currentQ.subtitle}
                  {currentQ.multi && <span style={{ color: "#F5C518" }}> (select all that apply)</span>}
                </p>

                {/* Options */}
                <div className="flex flex-col gap-3" data-quiz-options>
                  <style>{`
                    @keyframes shake {
                      0%, 100% { transform: translateX(0); }
                      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                      20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                    [data-quiz-options].shake {
                      animation: shake 0.5s ease-in-out;
                    }
                  `}</style>
                  {currentQ.options.map(opt => {
                    const selected = isSelected(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleOption(opt.value)}
                        className="flex items-center gap-4 rounded-xl p-4 text-left transition-all duration-150"
                        style={{
                          background: selected ? "#222200" : "#1A1A1A",
                          border: selected ? "2px solid #F5C518" : "2px solid #2A2A2A",
                          cursor: "pointer",
                        }}
                      >
                        {/* Circle check */}
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            background: selected ? "#F5C518" : "transparent",
                            border: selected ? "2px solid #F5C518" : "2px solid #444444",
                          }}
                        >
                          {selected && <Check size={13} color="#0A0A0A" strokeWidth={3} />}
                        </div>
                        <div className="flex-1">
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", color: selected ? "#F5C518" : "#F8FAFC" }}>
                            {opt.label}
                          </div>
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#888888", marginTop: "2px" }}>
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={goBack}
                    disabled={step === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      border: "2px solid #2A2A2A",
                      color: step === 0 ? "#444444" : "#888888",
                      background: "transparent",
                      cursor: step === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft size={16} />
                    BACK
                  </button>

                  <button
                    onClick={goNext}
                    disabled={!hasAnswer}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg transition-all"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 700,
                      fontSize: "14px",
                      background: hasAnswer ? "#F5C518" : "#2A2A2A",
                      color: hasAnswer ? "#0A0A0A" : "#444444",
                      cursor: hasAnswer ? "pointer" : "not-allowed",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {step === QUESTIONS.length - 1 ? "SEE MY MATCHES" : "NEXT"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h2
                  className="text-center mb-2"
                  style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "clamp(32px, 6vw, 52px)", color: "#F8FAFC", lineHeight: 1 }}
                >
                  YOUR TOP MATCHES
                </h2>
                <p className="text-center mb-8" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#888888" }}>
                  Based on your answers — sorted by fit score
                </p>

                {/* Auth prompt */}
                {showAuthPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl p-5 text-center"
                    style={{ background: "#1A1A1A", border: "2px solid #F5C518" }}
                  >
                    <p style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, color: "#F8FAFC", marginBottom: "12px" }}>
                      Create a free account to save your matches
                    </p>
                    <button
                      onClick={() => navigate("/signup")}
                      className="px-6 py-2 rounded-lg font-bold text-sm"
                      style={{ background: "#F5C518", color: "#0A0A0A", fontFamily: "DM Sans, sans-serif" }}
                    >
                      SIGN UP FREE
                    </button>
                    <div className="mt-3">
                      <a
                        href={getLoginUrl()}
                        style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "#888888", textDecoration: "underline" }}
                      >
                        Already have an account? Sign in
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* School cards */}
                {schoolsQuery.isLoading ? (
                  <div className="text-center py-12" style={{ color: "#888888", fontFamily: "DM Sans, sans-serif" }}>
                    Finding your matches...
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {scoredSchools.map(({ school, score }, idx) => {
                      const pct = Math.round((score / MAX_SCORE) * 100);
                      const tags = getTags(school, answers);
                      const isAdded = addedSchools.has(school.id);

                      return (
                        <div
                          key={school.id}
                          className="flex items-center gap-4 rounded-xl p-4"
                          style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
                        >
                          {/* Rank */}
                          <div
                            className="flex-shrink-0 w-7 text-right"
                            style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "22px", color: "#F5C518", lineHeight: 1 }}
                          >
                            #{idx + 1}
                          </div>

                          {/* Logo */}
                          <QuizSchoolLogo school={school} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "15px", color: "#F8FAFC" }}>
                                {school.name}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-bold"
                                style={{ background: "#2A2A2A", color: "#F5C518", fontFamily: "DM Sans, sans-serif" }}
                              >
                                {school.division}
                              </span>
                            </div>
                            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#888888", marginTop: "2px" }}>
                              {[school.conference, school.state as string | null].filter(Boolean).join(" · ")}
                            </div>
                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full text-xs"
                                    style={{ background: "#2A2A2A", color: "#888888", fontFamily: "DM Sans, sans-serif" }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Fit bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full" style={{ background: "#2A2A2A" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: "#F5C518" }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fit % + Add button */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "20px", color: "#F5C518" }}>
                              {pct}%
                            </span>
                            <button
                              onClick={() => handleAdd(school.id)}
                              disabled={isAdded || addToListMutation.isPending}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                background: isAdded ? "#1A2A00" : "#F5C518",
                                color: isAdded ? "#F5C518" : "#0A0A0A",
                                border: isAdded ? "1px solid #F5C518" : "none",
                                cursor: isAdded ? "default" : "pointer",
                                letterSpacing: "0.05em",
                                minWidth: "72px",
                                textAlign: "center",
                              }}
                            >
                              {isAdded ? "ADDED ✓" : "ADD +"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Start over */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={restart}
                    className="flex items-center gap-2 text-sm"
                    style={{ fontFamily: "DM Sans, sans-serif", color: "#888888", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F5C518")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#888888")}
                  >
                    <RotateCcw size={14} />
                    START OVER
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
