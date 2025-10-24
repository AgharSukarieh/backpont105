// SubmissionDetail.js
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// بيانات وهمية مشابهة للـ UserSubmissions
const submissionsData = [
  { id: 111, problemId: 45, userId: 1, titleProblem: "Max Number", code: "console.log('Hello World');", isAccepted: 3, verdict: "صحيحة !", submitAt: "2025-10-21T17:51:51.7342495", memoryUsed: 1024, executionTime: 45 },
  { id: 110, problemId: 44, userId: 1, titleProblem: "Sum Two Numbers", code: "let sum = a + b;", isAccepted: 2, verdict: "خطأ", submitAt: "2025-10-21T16:30:00.123", memoryUsed: 710, executionTime: 60 },
  { id: 109, problemId: 43, userId: 1, titleProblem: "Binary Search", code: "function binarySearch(arr, target) { }", isAccepted: 1, verdict: "قيد المراجعة", submitAt: "2025-10-21T15:45:12.456", memoryUsed: 512, executionTime: 30 },
];

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // البحث عن الـ Submission بالـ id
  const submission = submissionsData.find(sub => sub.id === parseInt(id));

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ: لم يتم العثور على الإرسالية!</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors duration-200"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-600">{submission.titleProblem || `Problem ${submission.problemId}`}</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 shadow transition-colors duration-200"
        >
          العودة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* تفاصيل الإرسال */}
        <div className="bg-indigo-50 p-6 rounded-xl shadow-lg border border-indigo-100 space-y-3">
          <p><strong className="text-gray-700">حالة الإرسال:</strong> 
            <span className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${
              submission.isAccepted === 3 ? "bg-green-100 text-green-800" :
              submission.isAccepted === 2 ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {submission.isAccepted === 3 ? "مقبول" : submission.isAccepted === 2 ? "مرفوض" : "قيد المراجعة"}
            </span>
          </p>
          <p><strong className="text-gray-700">النتيجة:</strong> {submission.verdict}</p>
          <p><strong className="text-gray-700">وقت التنفيذ:</strong> {submission.executionTime} ms</p>
          <p><strong className="text-gray-700">الذاكرة المستهلكة:</strong> {submission.memoryUsed} KB</p>
          <p><strong className="text-gray-700">تاريخ الإرسال:</strong> {new Date(submission.submitAt).toLocaleString("ar-EG")}</p>
        </div>

        {/* الكود المرسل */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">الكود المرسل</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 font-mono shadow-inner">
            {submission.code}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
