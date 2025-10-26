// Navbar.js
import React, { useContext, useState } from "react";
import {  UserContext } from "./Hook/UserContext";
import { Link } from "react-router-dom";
import NotificationDropdown from "./Pages/Notification/NotificationDropdown"; 

const Navbar = ({ onLogout, setPage }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useContext(UserContext);

  // مثال للإشعارات
  const notifications = [
    {
      id: 35,
      title: "Testing1",
      createdAt: "2025-10-21T17:37:30.9",
      isRead: false,
    },
    {
      id: 32,
      title: "Testing2",
      createdAt: "2025-10-18T18:02:48.55",
      isRead: false,
    },
    {
      id: 31,
      title: "Testing1",
      createdAt: "2025-10-18T18:02:48.0166667",
      isRead: false,
    },
  ];

  return (
    <nav dir="rtl" className="bg-white shadow-md border-b-2 border-indigo-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* الشعار */}
          <div className="flex items-center space-x-reverse space-x-2">
            <h1 className="text-xl font-bold text-indigo-600">عرب كود</h1>
            <span className="text-xs text-gray-500">منصّة المسابقات البرمجية</span>
          </div>

          {/* روابط سطح المكتب */}
          <div className="hidden md:flex items-center space-x-reverse space-x-5">
            <Link to={"Userprofile"} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200">الملف الشخصي</Link>
            <Link to={"problems"} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200">المسائل</Link>
            <Link to={"algorithms"} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200">خوارزميات</Link>
            <Link to={"contests"} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200">مسابقات</Link>
            <Link to={"AddProblemProposal"} className="text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200">اقتراح مسألة</Link>
          </div>

          {/* المستخدم + زر القائمة + الإشعارات */}
          <div className="flex items-center space-x-reverse space-x-3 relative">
            {user && <NotificationDropdown notificationsData={notifications} />}

            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-gray-600">أهلاً، {user.name}!</span>
                <button
                  onClick={onLogout}
                  className="hidden sm:inline bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <button
                onClick={() => setPage("login")}
                className="hidden sm:inline bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
              >
                تسجيل الدخول
              </button>
            )}

            {/* زر القائمة للموبايل */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700 hover:text-indigo-600 focus:outline-none transition-transform duration-200"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة - موبايل */}
      <div className={`md:hidden bg-gray-50 border-t border-gray-200 overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100 py-2" : "max-h-0 opacity-0 py-0"}`}>
        <div className="px-5 space-y-1 text-right">
          <Link to={"profile"} className="block w-full text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-3 py-1.5 transition-colors duration-200">الملف الشخصي</Link>
          <Link to={"problems"} className="block w-full text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-3 py-1.5 transition-colors duration-200">المسائل</Link>
          <Link to={"algorithms"} className="block w-full text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-3 py-1.5 transition-colors duration-200">خوارزميات</Link>
          <Link to={"contests"} className="block w-full text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-3 py-1.5 transition-colors duration-200">مسابقات</Link>
          <Link to={"AddProblemProposal"} className="block w-full text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md px-3 py-1.5 transition-colors duration-200">اقتراح مسألة</Link>
          <hr className="border-gray-200 my-1" />
          {user ? (
            <button onClick={onLogout} className="block w-full text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md px-3 py-1.5 font-medium transition-colors duration-200">تسجيل الخروج</button>
          ) : (
            <button onClick={() => setPage("login")} className="block w-full text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-md px-3 py-1.5 font-medium transition-colors duration-200">تسجيل الدخول</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
