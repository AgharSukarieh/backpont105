// ProblemsPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

// بيانات تجريبية
const problemsData = [
  { id: 5, title: "Sum Two Numbers", statueProblem: 3, acceptanceRate: 1.52, difficulty: "Easy", numberOfUsersSolved: 1, tags: [] },
  { id: 9, title: "Find Maximum Number", statueProblem: 1, acceptanceRate: 0, difficulty: "Easy", numberOfUsersSolved: 0, tags: [] },
  { id: 26, title: "Binary Search Problem", statueProblem: 2, acceptanceRate: 25, difficulty: "Medium", numberOfUsersSolved: 4, tags: [{ id: 2, tagName: "باينري " }] },
  { id: 27, title: "VC Algorithm", statueProblem: 2, acceptanceRate: 0, difficulty: "Medium", numberOfUsersSolved: 0, tags: [{ id: 2, tagName: "باينري " }, { id: 3, tagName: "DynamicPrograming" }] },
  { id: 30, title: "Multiply By Two", statueProblem: 3, acceptanceRate: 100, difficulty: "Easy", numberOfUsersSolved: 1, tags: [{ id: 3, tagName: "DynamicPrograming" }] },
  { id: 31, title: "Multiplication 2", statueProblem: 3, acceptanceRate: 100, difficulty: "Medium", numberOfUsersSolved: 1, tags: [{ id: 2, tagName: "باينري " }, { id: 3, tagName: "DynamicPrograming" }, { id: 4, tagName: "TernarySearch" }] },
  { id: 32, title: "Dynamic Problem", statueProblem: 1, acceptanceRate: 0, difficulty: "Hard", numberOfUsersSolved: 0, tags: [{ id: 2, tagName: "باينري " }, { id: 3, tagName: "DynamicPrograming" }] },
  { id: 37, title: "For Testing", statueProblem: 1, acceptanceRate: 0, difficulty: "Hard", numberOfUsersSolved: 0, tags: [] },
  { id: 38, title: "For Testing", statueProblem: 1, acceptanceRate: 0, difficulty: "Hard", numberOfUsersSolved: 0, tags: [] },
  { id: 39, title: "Advanced Test", statueProblem: 1, acceptanceRate: 0, difficulty: "Hard", numberOfUsersSolved: 0, tags: [] }
];

const ITEMS_PER_PAGE = 4;

const ProblemsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(problemsData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProblems = problemsData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600 text-center">قائمة المسائل البرمجية</h1>

      <Link to="/Problem" className="grid md:grid-cols-2 gap-6">
        {currentProblems.map((problem) => (
          <div key={problem.id} className="bg-white shadow-lg rounded-xl p-5 hover:shadow-2xl transition-shadow duration-300 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-800">{problem.title}</h2>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                problem.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                problem.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {problem.difficulty}
              </span>
            </div>
            <p className="text-gray-500 text-sm">نسبة القبول: {problem.acceptanceRate}%</p>
            <p className="text-gray-500 text-sm">عدد المستخدمين الذين حلوا المسألة: {problem.numberOfUsersSolved}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {problem.tags.map(tag => (
                <span key={tag.id} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">{tag.tagName}</span>
              ))}
            </div>
          </div>
        ))}
      </Link>

      {/* Pagination */}
      <div className="flex justify-center mt-8 items-center gap-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          السابق
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-4 py-2 rounded-lg font-semibold ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default ProblemsPage;
