import React from "react";
import { useParams, Link } from "react-router-dom";

const algorithms = [
  {
    id: 1,
    name: "ترتيب الفقاعات (Bubble Sort)",
    description: "خوارزمية لترتيب العناصر بالمقارنة المتكررة بين كل عنصر والعنصر التالي له.",
    example: `مثال: [5, 2, 9, 1] → [1, 2, 5, 9]`,
    steps: [
      "قارن كل عنصر مع العنصر التالي.",
      "إذا كان العنصر أكبر، قم بتبديله.",
      "كرر العملية حتى يتم ترتيب جميع العناصر."
    ]
  },
  {
    id: 2,
    name: "البحث الثنائي (Binary Search)",
    description: "خوارزمية للبحث عن عنصر محدد داخل قائمة مرتبة بسرعة عالية.",
    example: `مثال: البحث عن 7 في [1, 3, 5, 7, 9] → النتيجة: index 3`,
    steps: [
      "ابدأ من منتصف القائمة.",
      "إذا كان العنصر في المنتصف هو المطلوب، انتهى البحث.",
      "إذا كان أصغر، ابحث في النصف الأيمن، وإذا أكبر، ابحث في النصف الأيسر."
    ]
  },
  {
    id: 3,
    name: "خوارزمية دجكسترا (Dijkstra)",
    description: "إيجاد أقصر مسار من نقطة بداية إلى باقي النقاط في الرسم البياني.",
    example: "مثال: من النقطة A إلى B، C، D باستخدام أوزان الحواف الأقل.",
    steps: [
      "حدد المسافة الابتدائية لجميع العقد غير المعروفة.",
      "اختر العقدة الأقرب، حدّث المسافات المجاورة.",
      "كرر العملية حتى تحدد أقصر المسارات لكل العقد."
    ]
  }
];

const AlgorithmDetail = () => {
  const { id } = useParams();
  const algo = algorithms.find(a => a.id === parseInt(id));

  if (!algo) return <p className="text-red-600">خوارزمية غير موجودة.</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Link to="/algorithms" className="text-indigo-600 hover:underline">← العودة للقائمة</Link>

      <h1 className="text-3xl font-bold text-indigo-600">{algo.name}</h1>
      <p className="text-gray-700 text-lg">{algo.description}</p>

      <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
        <h2 className="font-semibold text-lg text-indigo-600">خطوات الخوارزمية</h2>
        <ul className="list-decimal list-inside mt-2 space-y-1">
          {algo.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 p-5 rounded-xl shadow border border-gray-100">
        <h2 className="font-semibold text-lg text-indigo-600">مثال توضيحي</h2>
        <pre className="bg-white p-3 rounded mt-2">{algo.example}</pre>
      </div>
    </div>
  );
};

export default AlgorithmDetail;
