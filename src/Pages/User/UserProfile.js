// UserProfileFancy.js
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444"];

const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const mockUser = {
      id: 1,
      email: "ahmed@example.com",
      userName: "AhmedH",
      imageUrl: "https://i.pravatar.cc/150?img=3",
      registerAt: "2020-01-15T00:00:00",
      role: "User",
      country: {
        id: 1,
        nameCountry: "Jordan",
        iconUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Flag_of_Jordan.svg"
      },
      acceptanceRate: 65.5,
      totalSubmissions: 120,
      totalProblemsSolved: 45,
      easyProblemsSolvedCount: 25,
      mediumProblemsSolvedCount: 15,
      hardProblemsSolvedCount: 5,
      streakDay: 3,
      maxStreak: 7,
      tagSolvedCounts: [
        { tagId: 1, tagName: "Dynamic Programming", numberOfProblemSolved: 12 },
        { tagId: 2, tagName: "Binary Search", numberOfProblemSolved: 8 },
        { tagId: 3, tagName: "Greedy", numberOfProblemSolved: 5 },
      ]
    };

    setUser(mockUser);
  }, []);

  if (!user) return <div className="text-center py-20 text-gray-500">جاري تحميل البيانات...</div>;

  const pieData = [
    { name: "سهلة", value: user.easyProblemsSolvedCount },
    { name: "متوسطة", value: user.mediumProblemsSolvedCount },
    { name: "صعبة", value: user.hardProblemsSolvedCount },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* بطاقة المستخدم الرئيسية */}
      <div className="bg-white shadow-xl rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.imageUrl}
          alt={user.userName}
          className="w-28 h-28 rounded-full border-4 border-indigo-500"
        />
        <div className="text-right flex-1 space-y-2">
          <h2 className="text-3xl font-bold text-gray-800">{user.userName}</h2>
          <p className="text-gray-500">{user.email}</p>
          <p className="flex items-center gap-2 text-gray-500">
            <img src={user.country.iconUrl} alt={user.country.nameCountry} className="w-6 h-4 rounded-sm" />
            {user.country.nameCountry}
          </p>
          <p className="text-gray-500">مسجل منذ: {new Date(user.registerAt).toLocaleDateString()}</p>
          <p className="text-gray-500">دور المستخدم: {user.role}</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-semibold text-center">
          نسبة القبول: {user.acceptanceRate}%
        </div>
      </div>

      {/* إحصائيات المسائل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 text-right">
          <h3 className="font-bold text-xl mb-4 border-b pb-2">إجمالي المحاولات</h3>
          <p className="text-gray-600 text-lg font-semibold">{user.totalSubmissions}</p>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 text-right">
          <h3 className="font-bold text-xl mb-4 border-b pb-2">المشاكل المحلولة</h3>
          <p className="text-gray-600 text-lg font-semibold">{user.totalProblemsSolved}</p>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-6 text-right">
          <h3 className="font-bold text-xl mb-4 border-b pb-2">السلاسل اليومية</h3>
          <p className="text-gray-600">الحالية: <span className="font-semibold">{user.streakDay} أيام</span></p>
          <p className="text-gray-600">أقصى: <span className="font-semibold">{user.maxStreak} أيام</span></p>
        </div>
      </div>

      {/* رسم بياني لصعوبة المسائل */}
      <div className="bg-white shadow-lg rounded-2xl p-6 text-right">
        <h3 className="font-bold text-xl mb-4 border-b pb-2">المشاكل حسب الصعوبة</h3>
        <div className="w-full h-48">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                label={(entry) => `${entry.name} (${entry.value})`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-white shadow-lg rounded-2xl p-6 text-right">
        <h3 className="font-bold text-xl mb-4 border-b pb-2">أكثر 3 خوارزميات حلها المستخدم</h3>
        <ul className="space-y-2">
          {user.tagSolvedCounts.map((tag) => (
            <li
              key={tag.tagId}
              className="flex justify-between items-center bg-indigo-50 rounded-lg px-3 py-2"
            >
              <span className="text-gray-800 font-medium">{tag.tagName}</span>
              <span className="font-semibold text-indigo-600">{tag.numberOfProblemSolved} مسائل</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProfile;
