import React, { useState } from "react";
import DOMPurify from "dompurify";

// بيانات وهمية للـ Tags
const allTags = [
  { id: 1, name: "Algorithms" },
  { id: 2, name: "Frontend" },
  { id: 3, name: "React" },
  { id: 4, name: "DP" },
];

const ViewProblemRequest = () => {
  // دالة لتنظيف HTML قبل العرض
  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "div", "span", "pre", "code", "blockquote"],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "style"],
    });
  const [problem] = useState({
    id: 1,
    title: "Binary Search Implementation",
    descriptionProblem: "Find an element in a sorted array.",
    imageUrl: "",
    descriptionInput: "First line contains n, second line contains n elements.",
    descriptionOutput: "Print the index of the element.",
    authorNotes: "Try to solve in O(log n).",
    difficulty: "Medium",
    status: "Pending",
    memory: 64,
    time: 120,
    testCases: [
      { problemId: 1, input: "5\n1 2 3 4 5\n", expectedOutput: "2", isSample: true }
    ],
    tags: [1, 2]
  });

  // تحويل ids إلى أسماء Tags
  const tagNames = problem.tags.map(id => {
    const tag = allTags.find(t => t.id === id);
    return tag ? tag.name : id;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">عرض المشكلة</h2>
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">

        <div>
          <strong>Title:</strong> {problem.title}
        </div>

        <div>
          <strong>Description Problem:</strong>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionProblem) }} />
        </div>

        {problem.imageUrl && (
          <div>
            <strong>Image:</strong>
            <img src={problem.imageUrl} alt="Problem" className="mt-2 max-w-full" />
          </div>
        )}

        <div>
          <strong>Description Input:</strong>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionInput) }} />
        </div>

        <div>
          <strong>Description Output:</strong>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionOutput) }} />
        </div>

        <div>
          <strong>Author Notes:</strong>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.authorNotes) }} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><strong>Difficulty:</strong> {problem.difficulty}</div>
          <div><strong>Status:</strong> {problem.status}</div>
          <div><strong>Memory (MB):</strong> {problem.memory}</div>
          <div><strong>Time (ms):</strong> {problem.time}</div>
          <div><strong>Tags:</strong> {tagNames.join(", ")}</div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Test Cases</h3>
          {problem.testCases.map((tc, index) => (
            <div key={index} className="mb-3 border p-3 rounded space-y-1">
              <div><strong>Input:</strong> <pre>{tc.input}</pre></div>
              <div><strong>Expected Output:</strong> <pre>{tc.expectedOutput}</pre></div>
              <div>
                <strong>Sample:</strong> {tc.isSample ? "Yes" : "No"}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ViewProblemRequest;
