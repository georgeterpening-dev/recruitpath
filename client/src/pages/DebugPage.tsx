import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function DebugPage() {
  const { data, isLoading, refetch } = trpc.volleyball.debugRoster.useQuery();
  const { data: schoolsData, isLoading: schoolsLoading } = trpc.volleyball.debugSchools.useQuery();
  const [reseedResult, setReseedResult] = useState<Record<string, unknown> | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const reseedMutation = trpc.volleyball.reseedPlayers.useMutation({
    onSuccess: (result) => {
      setReseedResult(result as Record<string, unknown>);
      setReseeding(false);
      refetch();
    },
    onError: (err) => {
      setReseedResult({ error: err.message });
      setReseeding(false);
    },
  });

  const handleReseed = () => {
    if (!confirm("This will DELETE all player rows and re-seed from ROSTER_DATA. Continue?")) return;
    setReseeding(true);
    reseedMutation.mutate();
  };

  return (
    <div style={{ background: "#0A0E1A", minHeight: "100vh", padding: 20, fontFamily: "monospace" }}>
      <h1 style={{ color: "#F5B800", marginBottom: 16, fontSize: 20 }}>RecruitPath Debug</h1>

      <button
        onClick={handleReseed}
        disabled={reseeding}
        style={{
          background: reseeding ? "#333" : "#F5B800",
          color: "#0A0E1A",
          border: "none",
          padding: "10px 20px",
          borderRadius: 4,
          cursor: reseeding ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: 13,
          marginBottom: 16,
          marginRight: 12,
        }}
      >
        {reseeding ? "Reseeding..." : "🔄 Reseed Players (Admin Only)"}
      </button>

      {reseedResult && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: "#22C55E", fontSize: 14, marginBottom: 8 }}>Reseed Result:</h2>
          <pre style={{ color: "#22C55E", background: "#0d1f0d", padding: 12, borderRadius: 4, fontSize: 12 }}>
            {String(JSON.stringify(reseedResult, null, 2))}
          </pre>
        </div>
      )}

      <h2 style={{ color: "#94A3B8", fontSize: 14, marginBottom: 8 }}>DB Stats (debugRoster):</h2>
      {isLoading ? (
        <div style={{ color: "white", padding: 20 }}>Loading...</div>
      ) : (
        <pre style={{ color: "white", background: "#111", padding: 16, fontSize: 12, overflow: "auto", borderRadius: 4 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      <h2 style={{ color: "#94A3B8", fontSize: 14, marginBottom: 8, marginTop: 24 }}>School Sample (debugSchools):</h2>
      {schoolsLoading ? (
        <div style={{ color: "white", padding: 20 }}>Loading...</div>
      ) : (
        <pre style={{ color: "white", background: "#111", padding: 16, fontSize: 12, overflow: "auto", borderRadius: 4 }}>
          {JSON.stringify(schoolsData, null, 2)}
        </pre>
      )}
    </div>
  );
}
