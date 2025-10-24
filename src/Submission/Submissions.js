// UserSubmissions.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const submissionsData = [
  { id: 111, problemId: 45, titleProblem: "Max Number", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-21T17:51:51.734", memoryUsed: 1024, executionTime: 45 },
  { id: 110, problemId: 44, titleProblem: "Sum Two Numbers", isAccepted: 2, verdict: "خطأ", submitAt: "2025-10-21T16:30:00.123", memoryUsed: 710, executionTime: 60 },
  { id: 109, problemId: 43, titleProblem: "Binary Search", isAccepted: 1, verdict: "قيد المراجعة", submitAt: "2025-10-21T15:45:12.456", memoryUsed: 512, executionTime: 30 },
  { id: 108, problemId: 42, titleProblem: "Bubble Sort", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-20T18:20:00.789", memoryUsed: 1024, executionTime: 70 },
  { id: 107, problemId: 41, titleProblem: "Dijkstra", isAccepted: 2, verdict: "خطأ", submitAt: "2025-10-20T17:10:30.234", memoryUsed: 800, executionTime: 120 },
  { id: 106, problemId: 40, titleProblem: "Fibonacci", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-19T14:05:10.987", memoryUsed: 256, executionTime: 25 },
  { id: 105, problemId: 39, titleProblem: "Factorial", isAccepted: 1, verdict: "قيد المراجعة", submitAt: "2025-10-19T13:30:45.654", memoryUsed: 128, executionTime: 10 },
  { id: 104, problemId: 38, titleProblem: "Quick Sort", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-18T12:20:20.321", memoryUsed: 900, executionTime: 80 },
  { id: 103, problemId: 37, titleProblem: "Merge Sort", isAccepted: 2, verdict: "خطأ", submitAt: "2025-10-18T11:15:15.987", memoryUsed: 950, executionTime: 95 },
  { id: 102, problemId: 36, titleProblem: "DFS Graph", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-17T10:05:10.123", memoryUsed: 650, executionTime: 40 },
  { id: 101, problemId: 35, titleProblem: "BFS Graph", isAccepted: 1, verdict: "قيد المراجعة", submitAt: "2025-10-16T09:50:05.456", memoryUsed: 700, executionTime: 55 },
  { id: 100, problemId: 34, titleProblem: "Prime Check", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-15T08:40:30.789", memoryUsed: 200, executionTime: 15 },
  // بيانات إضافية للتأكد من ظهور Pagination
  ...Array.from({ length: 20 }, (_, i) => ({
    id: 99 - i,
    problemId: i + 10,
    titleProblem: `Problem ${i + 10}`,
    isAccepted: (i % 3) + 1,
    verdict: i % 3 === 0 ? "صحيحة !" : i % 3 === 1 ? "خطأ" : "قيد المراجعة",
    submitAt: `2025-10-${(i % 30) + 1}T12:00:00.000`,
    memoryUsed: 100 + i * 10,
    executionTime: 10 + i * 5,
  }))
];

const UserSubmissions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10 ;
  const navigate = useNavigate();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = submissionsData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(submissionsData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">سجل الإرساليات</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-4 py-2 text-right border-b">#</th>
              <th className="px-4 py-2 text-right border-b">عنوان المسألة</th>
              <th className="px-4 py-2 text-right border-b">النتيجة</th>
              <th className="px-4 py-2 text-right border-b">الحالة</th>
              <th className="px-4 py-2 text-right border-b">وقت التنفيذ (ms)</th>
              <th className="px-4 py-2 text-right border-b">الذاكرة المستهلكة (KB)</th>
              <th className="px-4 py-2 text-right border-b">تاريخ الإرسال</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((sub) => (
              <tr
                key={sub.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/submission/${sub.id}`)}
              >
                <td className="px-4 py-2 border-b text-right">{sub.id}</td>
                <td className="px-4 py-2 border-b text-right">{sub.titleProblem || `Problem ${sub.problemId}`}</td>
                <td className="px-4 py-2 border-b text-right">{sub.verdict}</td>
                <td className="px-4 py-2 border-b text-right">
                  {sub.isAccepted === 3 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">مقبول</span>
                  ) : sub.isAccepted === 2 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">مرفوض</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">قيد المراجعة</span>
                  )}
                </td>
                <td className="px-4 py-2 border-b text-right">{sub.executionTime}</td>
                <td className="px-4 py-2 border-b text-right">{sub.memoryUsed}</td>
                <td className="px-4 py-2 border-b text-right">{new Date(sub.submitAt).toLocaleString("ar-EG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded-md border ${
              currentPage === i + 1
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserSubmissions;
