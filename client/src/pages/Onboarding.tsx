/**
 * Onboarding.tsx — Required 3-step setup wizard for new users.
 * Triggered immediately after account creation; redirects to /dashboard on completion.
 * Existing users (hasCompletedOnboarding = true) are redirected away immediately.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

interface OnboardingData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  positions: string[];
  highSchool: string;
  graduationYear: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const POSITIONS = [
  "Outside Hitter",
  "Middle Blocker",
  "Opposite",
  "Setter",
  "Libero",
  "Defensive Specialist",
];

const GRAD_YEARS = ["2026", "2027", "2028", "2029"];

// ─── Step Progress Bar ────────────────────────────────────────────────────────
function StepProgressBar({ currentStep }: { currentStep: Step }) {
  const steps: { label: string; num: Step }[] = [
    { label: "Your Info", num: 1 },
    { label: "Your Sport", num: 2 },
    { label: "Done", num: 3 },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.num;
        const isCurrent = currentStep === step.num;
        const isUpcoming = currentStep < step.num;

        return (
          <div key={step.num} style={{ display: "flex", alignItems: "center" }}>
            {/* Connecting line before (not before first) */}
            {i > 0 && (
              <div
                style={{
                  width: "60px",
                  height: "2px",
                  background: isCompleted || isCurrent ? "#F5B800" : "#1E293B",
                  transition: "background 0.3s",
                }}
              />
            )}

            {/* Circle + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted ? "#F5B800" : isUpcoming ? "#1E293B" : "transparent",
                  border: isCurrent ? "2px solid #FFFFFF" : "none",
                  transition: "all 0.3s",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  // White checkmark
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                    <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isCurrent ? "#FFFFFF" : "#555",
                    }}
                  >
                    {step.num}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  color: isUpcoming ? "#444" : "#FFFFFF",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "10px",
          color: "#777",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#EF4444",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #1E293B",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  color: "#FFFFFF",
  fontFamily: "Inter, sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        borderColor: focused ? "#F5B800" : "#1E293B",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Pill Selector ────────────────────────────────────────────────────────────
function PillSelector({
  options,
  value,
  onChange,
  columns = 3,
  multiSelect = false,
  multiValue = [],
  onMultiChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
  multiSelect?: boolean;
  multiValue?: string[];
  onMultiChange?: (v: string[]) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "8px",
      }}
    >
      {options.map((opt) => {
        const selected = multiSelect ? multiValue.includes(opt) : value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (multiSelect && onMultiChange) {
                const next = multiValue.includes(opt)
                  ? multiValue.filter((p) => p !== opt)
                  : [...multiValue, opt];
                onMultiChange(next);
              } else {
                onChange(opt);
              }
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: selected ? "none" : "1px solid #1E293B",
              background: selected ? "#F5B800" : "#111827",
              color: selected ? "#000000" : "#888",
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: selected ? 600 : 400,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function PrimaryButton({
  onClick,
  disabled,
  children,
  loading,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%",
        height: "48px",
        background: disabled || loading ? "#3A3A2A" : "#F5B800",
        color: disabled || loading ? "#666" : "#000000",
        border: "none",
        borderRadius: "8px",
        fontFamily: "Barlow Condensed, sans-serif",
        fontSize: "14px",
        letterSpacing: "1.5px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
    >
      {loading ? "SAVING…" : children}
    </button>
  );
}

// ─── Step 1: Your Info ────────────────────────────────────────────────────────
function Step1({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (k: keyof OnboardingData, v: string) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [attempted, setAttempted] = useState(false);

  const validate = () => {
    const e: Partial<Record<keyof OnboardingData, string>> = {};
    if (!data.firstName.trim()) e.firstName = "This field is required.";
    if (!data.lastName.trim()) e.lastName = "This field is required.";
    if (!data.dateOfBirth.trim()) e.dateOfBirth = "This field is required.";
    return e;
  };

  const handleNext = () => {
    setAttempted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onNext();
  };

  const allFilled = data.firstName.trim() && data.lastName.trim() && data.dateOfBirth.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h1
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "28px",
            color: "#FFFFFF",
            margin: 0,
            marginBottom: "8px",
            letterSpacing: "1px",
          }}
        >
          LET'S BUILD YOUR PROFILE.
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#888",
            margin: 0,
          }}
        >
          This takes 30 seconds. Coaches will see this information.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field label="First Name" error={attempted ? errors.firstName : undefined}>
          <TextInput
            value={data.firstName}
            onChange={(v) => onChange("firstName", v)}
            placeholder="Jane"
          />
        </Field>
        <Field label="Last Name" error={attempted ? errors.lastName : undefined}>
          <TextInput
            value={data.lastName}
            onChange={(v) => onChange("lastName", v)}
            placeholder="Smith"
          />
        </Field>
      </div>

      <Field label="Date of Birth" error={attempted ? errors.dateOfBirth : undefined}>
        <TextInput
          type="date"
          value={data.dateOfBirth}
          onChange={(v) => onChange("dateOfBirth", v)}
        />
      </Field>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <PrimaryButton onClick={handleNext} disabled={!allFilled}>
          NEXT →
        </PrimaryButton>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#555",
            textAlign: "center",
            margin: 0,
          }}
        >
          All info can be edited in your profile at any time.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Your Sport ───────────────────────────────────────────────────────
function Step2({
  data,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  data: OnboardingData;
  onChange: (k: keyof OnboardingData, v: string) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof OnboardingData, string>> = {};
    if (!data.positions || data.positions.length === 0) e.positions = "Please select at least one position.";
    if (!data.highSchool.trim()) e.highSchool = "This field is required.";
    if (!data.graduationYear) e.graduationYear = "Please select a graduation year.";
    return e;
  };

  const handleFinish = () => {
    setAttempted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onNext();
  };

  const allFilled = data.positions && data.positions.length > 0 && data.highSchool.trim() && data.graduationYear;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h1
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "28px",
            color: "#FFFFFF",
            margin: 0,
            marginBottom: "8px",
            letterSpacing: "1px",
          }}
        >
          NOW THE GOOD STUFF.
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#888",
            margin: 0,
          }}
        >
          Tell us about your volleyball career.
        </p>
      </div>

      <Field label="Position (select all that apply)" error={attempted ? errors.positions : undefined}>
        <PillSelector
          options={POSITIONS}
          value=""
          onChange={() => {}}
          multiSelect={true}
          multiValue={data.positions}
          onMultiChange={(v) => onChange("positions" as any, v as any)}
          columns={3}
        />
      </Field>

      <Field label="High School Name" error={attempted ? errors.highSchool : undefined}>
        <TextInput
          value={data.highSchool}
          onChange={(v) => onChange("highSchool", v)}
          placeholder="e.g. Mira Costa High School"
        />
      </Field>

      <Field label="Graduation Year" error={attempted ? errors.graduationYear : undefined}>
        <PillSelector
          options={GRAD_YEARS}
          value={data.graduationYear}
          onChange={(v) => onChange("graduationYear", v)}
          columns={4}
        />
      </Field>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <PrimaryButton onClick={handleFinish} disabled={!allFilled} loading={saving}>
          FINISH →
        </PrimaryButton>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#555",
            textAlign: "left",
            padding: 0,
          }}
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────
function Step3({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        textAlign: "center",
      }}
    >
      {/* Animated checkmark circle */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "#F5B800",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "checkPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
        }}
      >
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <path
            d="M2 14L13 25L34 2"
            stroke="black"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <h1
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "32px",
            color: "#FFFFFF",
            margin: 0,
            marginBottom: "10px",
            letterSpacing: "1px",
          }}
        >
          YOU'RE ALL SET.
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#888",
            margin: 0,
          }}
        >
          Your profile is ready. Let's find your program.
        </p>
      </div>

      <div style={{ width: "100%" }}>
        <PrimaryButton onClick={onGoToDashboard}>GO TO DASHBOARD →</PrimaryButton>
      </div>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    positions: [],
    highSchool: "",
    graduationYear: "",
  });

  const completeMutation = trpc.onboarding.complete.useMutation();

  // If user already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user && user.hasCompletedOnboarding) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

  const handleChange = (k: keyof OnboardingData, v: string) => {
    setData((prev) => ({ ...prev, [k]: v }));
  };

  const handleStep1Next = () => setStep(2);
  const handleStep2Back = () => setStep(1);

  const handleStep2Finish = async () => {
    setSaving(true);
    try {
      await completeMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        position: data.positions.length > 0 ? JSON.stringify(data.positions) : data.positions[0] || "",
        highSchool: data.highSchool,
        graduationYear: data.graduationYear,
      });
      setStep(3);
    } catch (err) {
      console.error("[Onboarding] Failed to complete:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0E1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "2px solid #1E293B",
            borderTop: "2px solid #F5B800",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0E1A",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: "1px solid #111827",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "18px",
            color: "#F5B800",
            letterSpacing: "1px",
          }}
        >
          RECRUITPATH
        </span>

        {/* Step progress bar — centered */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <StepProgressBar currentStep={step} />
        </div>

        {/* Spacer to balance logo */}
        <div style={{ width: "120px" }} />
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px" }}>
          {step === 1 && (
            <Step1 data={data} onChange={handleChange} onNext={handleStep1Next} />
          )}
          {step === 2 && (
            <Step2
              data={data}
              onChange={handleChange}
              onNext={handleStep2Finish}
              onBack={handleStep2Back}
              saving={saving}
            />
          )}
          {step === 3 && <Step3 onGoToDashboard={handleGoToDashboard} />}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
