import React, { useState } from "react";

// بيانات وهمية للـ Tags
const allTags = [
  { id: 1, name: "Algorithms" },
  { id: 2, name: "Frontend" },
  { id: 3, name: "React" },
  { id: 4, name: "DP" },
];

const UpdateProblemRequest = () => {
  // بيانات وهمية للمشكلة
  const [problem, setProblem] = useState({
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

  // تحديث أي حقل
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProblem({ ...problem, [name]: value });
  };

  // تحديث TestCases
  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...problem.testCases];
    newTestCases[index][field] = value;
    setProblem({ ...problem, testCases: newTestCases });
  };

  // إضافة Test Case جديدة
  const addTestCase = () => {
    setProblem({
      ...problem,
      testCases: [
        ...problem.testCases,
        { problemId: problem.id, input: "", expectedOutput: "", isSample: false }
      ]
    });
  };

  // إزالة Test Case
  const removeTestCase = (index) => {
    const newTestCases = problem.testCases.filter((_, i) => i !== index);
    setProblem({ ...problem, testCases: newTestCases });
  };

  // تحديث Tags
  const handleTagChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    setProblem({ ...problem, tags: selectedOptions });
  };

  // حفظ البيانات
  const handleSubmit = (e) => {
    e.preventDefault(); // منع إعادة تحميل الصفحة
    console.log("بيانات ترسل للـ backend:", problem);
    alert("تم حفظ البيانات (تجريبي)");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">تعديل المشكلة</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">

        {/* Title */}
        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={problem.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
            required
          />
        </div>

        {/* Description Problem */}
        <div>
          <label className="block font-medium">Description Problem</label>
          <textarea
            name="descriptionProblem"
            value={problem.descriptionProblem}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block font-medium">Image URL</label>
          <input
            type="text"
            name="imageUrl"
            value={problem.imageUrl}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block font-medium">Description Input</label>
          <textarea
            name="descriptionInput"
            value={problem.descriptionInput}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
            required
          />
        </div>

        {/* Description Output */}
        <div>
          <label className="block font-medium">Description Output</label>
          <textarea
            name="descriptionOutput"
            value={problem.descriptionOutput}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
            required
          />
        </div>

        {/* Author Notes */}
        <div>
          <label className="block font-medium">Author Notes</label>
          <textarea
            name="authorNotes"
            value={problem.authorNotes}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Difficulty, Status, Memory, Time, Tags */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Difficulty</label>
            <input
              type="text"
              name="difficulty"
              value={problem.difficulty}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Status</label>
            <input
              type="text"
              name="status"
              value={problem.status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Memory (MB)</label>
            <input
              type="number"
              name="memory"
              value={problem.memory}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
              min="0"
            />
          </div>

          <div>
            <label className="block font-medium">Time (ms)</label>
            <input
              type="number"
              name="time"
              value={problem.time}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
              min="0"
            />
          </div>

          <div>
            <label className="block font-medium">Tags</label>
            <select
              multiple
              value={problem.tags}
              onChange={handleTagChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Test Cases */}
        <div>
          <h3 className="font-medium mb-2">Test Cases</h3>
          {problem.testCases.map((tc, index) => (
            <div key={index} className="mb-4 border p-3 rounded space-y-2 relative">
              <button
                type="button"
                onClick={() => removeTestCase(index)}
                className="absolute top-2 right-2 text-red-500 font-bold"
              >
                X
              </button>
              <div>
                <label className="block font-medium">Input</label>
                <input
                  type="text"
                  value={tc.input}
                  onChange={(e) =>
                    handleTestCaseChange(index, "input", e.target.value)
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Expected Output</label>
                <input
                  type="text"
                  value={tc.expectedOutput}
                  onChange={(e) =>
                    handleTestCaseChange(index, "expectedOutput", e.target.value)
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={tc.isSample}
                    onChange={(e) =>
                      handleTestCaseChange(index, "isSample", e.target.checked)
                    }
                    className="mr-2"
                  />
                  Sample Test Case
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTestCase}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Add Test Case
          </button>
        </div>

        {/* Buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => alert("إلغاء التعديل")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateProblemRequest;
