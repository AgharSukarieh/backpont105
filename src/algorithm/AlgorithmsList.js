import React from "react";
import { Link } from "react-router-dom";

const algorithms = [
  { id: 1, name: "ترتيب الفقاعات (Bubble Sort)", shortDesc: "خوارزمية بسيطة لترتيب الأعداد." },
  { id: 2, name: "البحث الثنائي (Binary Search)", shortDesc: "البحث السريع في قائمة مرتبة." },
  { id: 3, name: "خوارزمية دجكسترا (Dijkstra)", shortDesc: "إيجاد أقصر طريق في الرسم البياني." },
];

const AlgorithmsList = () => {
  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-indigo-600">قائمة الخوارزميات</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {algorithms.map(algo => (
          <Link key={algo.id} to={`/algorithm/${algo.id}`} className="p-5 bg-white rounded-xl shadow hover:shadow-lg transition">
            <h2 className="font-bold text-lg text-indigo-600">{algo.name}</h2>
            <p className="text-gray-700 mt-2">{algo.shortDesc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmsList;
