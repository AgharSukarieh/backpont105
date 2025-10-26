import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const problem = {
  id: 9,
  title: "إيجاد أكبر رقم",
  descriptionProblem: "معطى قائمة من الأعداد الصحيحة، قم بإيجاد أكبر عدد وطباعته.",
  imageUrl: "",
  descriptionInput: "السطر الأول يحتوي على عدد صحيح N (1 ≤ N ≤ 100). السطر التالي يحتوي على N عدد صحيح مفصول بمسافات.",
  descriptionOutput: "عدد صحيح واحد — أكبر رقم في القائمة.",
  authorNotes: "يمكنك استخدام الحلقات الأساسية أو الدوال الجاهزة لحل هذه المشكلة.",
  difficulty: "سهل",
  memory: 128,
  time: 1.5,
  nameUser: "Uknow",
  testCase: [
    { id: 6, input: "5\n1 2 3 4 5", expectedOutput: "5", isSample: true },
    { id: 7, input: "4\n-10 0 7 3", expectedOutput: "7", isSample: false },
    { id: 8, input: "3\n9 9 9", expectedOutput: "9", isSample: false },
  ],
  tags: ["البرمجة الديناميكية", "البحث الثنائي"]
};

const Problem = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (code.trim() === "") {
      alert("الرجاء إدخال كود الحل قبل الإرسال.");
      return;
    }

    // بعد الإرسال، انتقل مباشرة لصفحة UserSubmission
    navigate("/UserSubmission");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* العنوان والصعوبة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-3xl font-bold text-indigo-600">{problem.title}</h1>
        <span className={`px-3 py-1 rounded-full font-semibold text-sm ${
          problem.difficulty === "سهل" ? "bg-green-100 text-green-700" :
          problem.difficulty === "متوسط" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        }`}>
          {problem.difficulty}
        </span>
      </div>

      {/* معلومات عامة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-gray-500 text-sm gap-2">
        <span>المؤلف: <strong>{problem.nameUser}</strong></span>
        <span>حد الذاكرة: {problem.memory} MB | الحد الزمني: {problem.time}s</span>
        <span>الكلمات المفتاحية: {problem.tags.join(", ") || "لا توجد كلمات"}</span>
      </div>

      {/* وصف المشكلة */}
      <SectionCard title="وصف المشكلة">
        <p>{problem.descriptionProblem}</p>
      </SectionCard>

      {/* المدخلات */}
      <SectionCard title="المدخلات">
        <pre className="bg-gray-50 p-3 rounded text-sm">{problem.descriptionInput}</pre>
      </SectionCard>

      {/* المخرجات */}
      <SectionCard title="المخرجات">
        <pre className="bg-gray-50 p-3 rounded text-sm">{problem.descriptionOutput}</pre>
      </SectionCard>

      {/* ملاحظات المؤلف */}
      {problem.authorNotes && (
        <div className="bg-indigo-50 p-4 rounded-xl border-l-4 border-indigo-500 text-gray-800">
          <h2 className="font-semibold mb-1">ملاحظات المؤلف</h2>
          <p className="text-sm">{problem.authorNotes}</p>
        </div>
      )}

      {/* الاختبارات */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">حالات الاختبار</h2>
        {problem.testCase.map(tc => (
          <div key={tc.id} className={`p-4 rounded-xl border shadow-sm ${
            tc.isSample ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50"
          }`}>
            {tc.isSample && <span className="text-indigo-600 font-semibold text-sm mb-1 inline-block">اختبار تجريبي</span>}
            <div className="text-sm text-gray-700 mt-1">
              <p><strong>المدخلات:</strong></p>
              <pre className="bg-white p-2 rounded">{tc.input}</pre>
              <p className="mt-1"><strong>المخرجات المتوقعة:</strong></p>
              <pre className="bg-white p-2 rounded">{tc.expectedOutput}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Submit C++ */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-3 mt-6">
        <h2 className="text-lg font-semibold text-gray-800">إرسال الحل بـ C++</h2>

        <textarea
          className="w-full h-40 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-mono"
          placeholder="الصق كود C++ هنا..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          onClick={handleSubmit}
        >
          إرسال
        </button>

        <p className="text-sm text-red-600 mt-2">
          ⚠️ ملاحظة: لا تستخدم <code>#include &lt;bits/stdc++.h&gt;</code> أو أي مكتبة تستدعي كل شيء. استخدم فقط المكتبات التي تحتاجها.
        </p>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-2">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </div>
  );
};

export default Problem;
