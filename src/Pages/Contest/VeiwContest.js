import React, { useState } from "react";

/**
 * Mock data (نفس شكل الـ JSON اللي بعته)
 * تقدر تعدّل القيم هون بسهولة لأي اختبار
 */
const mockContest = {
  name: "Sample Contest",
  nameUserCreateContest: "Ahmed",
  startTime: "2025-10-26T16:57:42.676Z",
  endTime: "2025-10-26T18:57:42.676Z",
  createdById: 1,
  problems: [
    {
      id: 1,
      title: "Sum Two Numbers",
      descriptionProblem: "Given two integers, output their sum.",
      imageUrl: "",
      descriptionInput: "Two integers a and b",
      descriptionOutput: "Single integer — the sum",
      authorNotes: "Watch overflow for big numbers",
      difficulty: "Easy",
      memory: 256,
      time: 1000,
      idUser: 1,
      nameUser: "Ahmed",
      testCase: [
        { id: 1, problemId: 1, input: "1 2", expectedOutput: "3", isSample: true },
        { id: 2, problemId: 1, input: "100 200", expectedOutput: "300", isSample: false }
      ],
      tags: [{ id: 1, tagName: "math" }, { id: 2, tagName: "implementation" }]
    },
    {
      id: 2,
      title: "Max Element",
      descriptionProblem: "Find maximum element in the list.",
      imageUrl: "",
      descriptionInput: "n then n space-separated integers",
      descriptionOutput: "The maximum integer",
      authorNotes: "",
      difficulty: "Medium",
      memory: 512,
      time: 2000,
      idUser: 2,
      nameUser: "Sami",
      testCase: [
        { id: 3, problemId: 2, input: "5\n1 3 2 9 4", expectedOutput: "9", isSample: true },
        { id: 4, problemId: 2, input: "3\n-1 -5 -2", expectedOutput: "-1", isSample: false }
      ],
      tags: [{ id: 3, tagName: "arrays" }]
    }
  ]
};

export default function ContestProblems({ contest = mockContest }) {
  const [showHidden, setShowHidden] = useState(false);

  if (!contest) return <p>Contest data missing.</p>;

  const {
    name,
    nameUserCreateContest,
    startTime,
    endTime,
    problems = []
  } = contest;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{name || "Unnamed Contest"}</h1>
        <p style={{ margin: "6px 0", color: "#444" }}>
          Created by: <strong>{nameUserCreateContest || "Unknown"}</strong>
        </p>
        <p style={{ margin: "6px 0", color: "#666", fontSize: 14 }}>
          Start: {startTime ? new Date(startTime).toLocaleString() : "N/A"} &nbsp;|&nbsp;
          End: {endTime ? new Date(endTime).toLocaleString() : "N/A"}
        </p>
      </header>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setShowHidden(!showHidden)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer"
          }}
        >
          {showHidden ? "Hide hidden testcases" : "Show hidden testcases"}
        </button>
      </div>

      <section>
        <h2 style={{ marginTop: 0 }}>Problems ({problems.length})</h2>

        {problems.length === 0 && <p>No problems in this contest.</p>}

        {problems.map((p) => (
          <article
            key={p.id}
            style={{
              border: "1px solid #e3e3e3",
              padding: 14,
              borderRadius: 8,
              marginBottom: 14,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px 0" }}>{p.title || "Untitled Problem"}</h3>
                <p style={{ margin: "0 0 8px 0", color: "#333" }}>
                  {p.descriptionProblem || "No description provided."}
                </p>

                <p style={{ margin: "6px 0", color: "#555", fontSize: 14 }}>
                  <strong>Difficulty:</strong> {p.difficulty || "—"} &nbsp; | &nbsp;
                  <strong>Time:</strong> {p.time ?? "—"} ms &nbsp; | &nbsp;
                  <strong>Memory:</strong> {p.memory ?? "—"} MB
                </p>

                {p.tags && p.tags.length > 0 && (
                  <p style={{ margin: "8px 0" }}>
                    {p.tags.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          marginRight: 6,
                          marginBottom: 6,
                          borderRadius: 12,
                          background: "#f1f5f9",
                          fontSize: 12,
                          color: "#333"
                        }}
                      >
                        {t.tagName}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* optional image */}
              {p.imageUrl ? (
                <div style={{ marginLeft: 12 }}>
                  <img src={p.imageUrl} alt={p.title} style={{ width: 120, height: "auto", borderRadius: 6 }} />
                </div>
              ) : null}
            </div>

            {/* author notes */}
            {p.authorNotes && (
              <div style={{ marginTop: 10, background: "#fff7e6", padding: 10, borderRadius: 6 }}>
                <strong>Author notes:</strong>
                <div style={{ marginTop: 6 }}>{p.authorNotes}</div>
              </div>
            )}

            {/* testcases */}
            <div style={{ marginTop: 12 }}>
              <strong>Testcases:</strong>
              {(!p.testCase || p.testCase.length === 0) && <div style={{ marginTop: 6 }}>No testcases.</div>}

              {p.testCase &&
                p.testCase
                  .filter((t) => t.isSample || showHidden)
                  .map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: t.isSample ? "#f7fff7" : "#fafafa",
                        padding: 10,
                        marginTop: 8,
                        borderRadius: 6,
                        border: "1px solid #ececec"
                      }}
                    >
                      <div style={{ fontSize: 13, color: "#666" }}>
                        <strong>{t.isSample ? "Sample" : "Hidden"} testcase</strong>
                      </div>

                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 13 }}>
                          <strong>Input:</strong>
                          <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0", background: "#fff", padding: 8, borderRadius: 4 }}>
{t.input}
                          </pre>
                        </div>

                        <div style={{ fontSize: 13 }}>
                          <strong>Expected Output:</strong>
                          <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0", background: "#fff", padding: 8, borderRadius: 4 }}>
{t.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
