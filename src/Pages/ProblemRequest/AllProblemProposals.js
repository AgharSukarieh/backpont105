import React, { useState } from "react";

const AllProblemProposals = () => {
  const [problems, setProblems] = useState([
    {
      id: 1,
      title: "Binary Search Implementation",
      difficulty: "Medium",
      memory: 64,
      time: 120,
      status: "Pending",
      createdAt: "2025-10-26T10:00:00.000Z",
      requestproblemTags: [
        { id: 1, tagName: "Algorithms" },
        { id: 2, tagName: "Search" }
      ]
    },
    {
      id: 2,
      title: "React Todo App",
      difficulty: "Easy",
      memory: 128,
      time: 60,
      status: "Completed",
      createdAt: "2025-10-25T15:30:00.000Z",
      requestproblemTags: [
        { id: 3, tagName: "React" },
        { id: 4, tagName: "Frontend" }
      ]
    },
    {
      id: 3,
      title: "Dynamic Programming Challenge",
      difficulty: "Hard",
      memory: 256,
      time: 300,
      status: "In Progress",
      createdAt: "2025-10-24T09:45:00.000Z",
      requestproblemTags: [
        { id: 5, tagName: "DP" },
        { id: 6, tagName: "Algorithms" }
      ]
    }
  ]);

  // دوال وهمية للأزرار
  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      setProblems(problems.filter((p) => p.id !== id));
    }
  };

  const handleUpdate = (id) => {
    alert(`فتح صفحة تعديل للمشكلة رقم ${id}`);
  };

  const handleView = (id) => {
    alert(`عرض تفاصيل المشكلة رقم ${id}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800" > قائمة المشاكل المقترحه</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Title</th>
              <th className="py-3 px-4 text-left">Difficulty</th>
              <th className="py-3 px-4 text-left">Memory (MB)</th>
              <th className="py-3 px-4 text-left">Time (ms)</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Created At</th>
              <th className="py-3 px-4 text-left">Tags</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr
                key={problem.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">{problem.id}</td>
                <td className="py-3 px-4 font-medium">{problem.title}</td>
                <td className="py-3 px-4">{problem.difficulty}</td>
                <td className="py-3 px-4">{problem.memory}</td>
                <td className="py-3 px-4">{problem.time}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-sm ${
                      problem.status === "Completed"
                        ? "bg-green-500"
                        : problem.status === "Pending"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {problem.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {new Date(problem.createdAt).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  {problem.requestproblemTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full mr-1 text-sm"
                    >
                      {tag.tagName}
                    </span>
                  ))}
                </td>
                <td className="py-3 px-4 space-x-2">
                  <button
                    onClick={() => handleView(problem.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleUpdate(problem.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(problem.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllProblemProposals;
