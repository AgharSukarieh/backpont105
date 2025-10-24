// NotificationDropdown.js
import React, { useState } from "react";

const NotificationDropdown = ({ notificationsData }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationsData || []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className="hidden sm:inline text-gray-700 hover:text-indigo-600 focus:outline-none transition-transform duration-200 relative"
        title="الإشعارات"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="py-2">
            {notifications.length === 0 && (
              <span className="block px-4 py-2 text-sm text-gray-500">لا توجد إشعارات</span>
            )}
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer rounded ${
                  !notif.isRead ? "bg-indigo-50 font-semibold" : "hover:bg-indigo-50"
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <span>{notif.title || "بدون عنوان"}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
