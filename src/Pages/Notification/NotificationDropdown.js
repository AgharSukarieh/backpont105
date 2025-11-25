import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import {
  fetchNotificationsByUser,
  getUnreadNotificationsCount,
} from "../../Service/NotificationServices";
import {
  Bell,
  Award,
  AlertTriangle,
  Flame,
  Settings,
  Brain,
  UserCheck,
} from "lucide-react";

/**
 * NotificationDropdown.jsx
 *
 * Behaviors:
 * - إذا كانت الرسالة تحتوي HTML (في أي متغير نصي)، سيتم عرضها كـ HTML (بعد تنظيفها عبر DOMPurify).
 * - يدعم المحتوى كـ string أو كائن يحتوي خصائص مثل { html, text, title }.
 * - Modal التفاصيل يعرض خلفية مغبشة (backdrop blur) ويعمل بشكل مرن/responsive.
 * - استخدم الدالة renderMaybeHtml(content) لعرض أي متغير قد يحتوي HTML أو نص عادي.
 */

const NotificationDropdown = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const idUser = JSON.parse(localStorage.getItem("idUser"));

  const icons = {
    1: <UserCheck className="text-blue-500" size={28} />,
    2: <Brain className="text-orange-500" size={28} />,
    3: <Award className="text-green-500" size={28} />,
    4: <AlertTriangle className="text-red-500" size={28} />,
    5: <Flame className="text-purple-500" size={28} />,
    6: <Settings className="text-gray-500" size={28} />,
  };

  const typeColors = {
    1: "border-blue-300",
    2: "border-orange-300",
    3: "border-green-300",
    4: "border-red-300",
    5: "border-purple-300",
    6: "border-gray-300",
  };

  useEffect(() => {
    const fetchUnread = async () => {
      if (!idUser) return;
      try {
        const count = await getUnreadNotificationsCount(idUser);
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    fetchUnread();
  }, [idUser]);

  // Sanitizer configuration (adjust allowed tags/attrs if needed)
  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "span",
        "img",
        "code",
        "pre",
        "blockquote",
        "h1",
        "h2",
        "h3",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title", "style"],
    });

  // detect if a string contains HTML tags
  const looksLikeHtml = (str) => {
    if (typeof str !== "string") return false;
    return /<[^>]+>/.test(str);
  };

  // Generic renderer: accepts string or object.
  // If content is a string that looks like HTML -> render sanitized HTML
  // If content is an object:
  //   - prefer content.html if present,
  //   - else use content.text (string, maybe with HTML),
  //   - else stringify fallback.
  const renderMaybeHtml = (content, className = "") => {
    if (content == null) return <span className={className} />;

    // If content is an object, try common fields
    if (typeof content === "object") {
      // prefer explicit html
      if (content.html) {
        return (
          <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(content.html)) }}
          />
        );
      }
      if (content.text) {
        const txt = String(content.text);
        if (looksLikeHtml(txt)) {
          return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(txt) }} />;
        }
        return <div className={className}>{txt}</div>;
      }
      // fallback: convert object to string safely
      return <div className={className}>{String(content)}</div>;
    }

    // content is primitive (string/number)
    const str = String(content);
    if (looksLikeHtml(str)) {
      return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(str) }} />;
    }
    return <div className={className}>{str}</div>;
  };

  // Compose a single HTML snippet for list preview (uses any available fields)
  const buildMessageHtml = (notif) => {
    if (!notif) return "";
    // If API provided full HTML, use it
    if (notif.messageHtml) return sanitizeHtml(notif.messageHtml);

    // Try to combine startMessage/middle/endMessage but allow HTML in them.
    const start = notif.startMessage ?? "";
    let middle = "";
    if (notif.type === 2 || notif.type === 4) {
      middle = notif.problemName ? ` <span class="font-medium">| ${notif.problemName} |</span> ` : " <span>| |</span> ";
    } else if (notif.type === 3 || notif.type === 5) {
      middle = notif.streakDays ? ` <span class="font-medium">| ${notif.streakDays} |</span> ` : " <span>| |</span> ";
    } else {
      middle = " <span>| |</span> ";
    }
    const end = notif.endMessage ?? "";
    return sanitizeHtml(`${start}${middle}${end}`);
  };

  const handleToggle = async () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);

    if (willOpen && idUser) {
      try {
        const data = await fetchNotificationsByUser(idUser);
        setNotifications(Array.isArray(data) ? data : []);
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }
  };

  const openDetail = (notif) => {
    setSelectedNotif(notif);
  };

  const closeDetail = () => {
    setSelectedNotif(null);
  };

  return (
    <div className="relative">
      {/* زر الجرس */}
      <button
        onClick={handleToggle}
        className="inline text-gray-700 hover:text-indigo-600 focus:outline-none transition-transform duration-200 relative"
        title="الإشعارات"
        aria-haspopup="true"
        aria-expanded={notifOpen}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات (dropdown) */}
      {notifOpen && (
        <div
          className="absolute right-0 mt-2 w-64 sm:w-80 md:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-96 overflow-y-auto"
          role="menu"
          aria-label="قائمة الإشعارات"
        >
          <div className="py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">لا توجد إشعارات.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => openDetail(notif)}
                  className={`flex items-start gap-3 px-4 sm:px-6 py-3 cursor-pointer hover:bg-gray-50 border-l-4 ${typeColors[notif.type]}`}
                  role="menuitem"
                >
                  <div className="mt-0.5">{icons[notif.type]}</div>
                  <div className="flex-1 pr-2 break-words text-sm text-gray-800">
                    {/* short preview - render any HTML safely */}
                    <div className="leading-snug">
                      {renderMaybeHtml(notif.messageHtml ?? notif.startMessage ?? buildMessageHtml(notif))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString("ar-EG") : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal (detail) with blurred/dimmed backdrop and flexible layout */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تفاصيل الإشعار"
        >
          {/* blurred/dim backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetail}
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6 md:p-8">
              <button
                onClick={closeDetail}
                className="absolute top-4 left-4 text-gray-500 hover:text-red-500 text-2xl font-bold rounded-full p-1"
                aria-label="إغلاق"
              >
                ×
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">{icons[selectedNotif.type]}</div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
                    {/* title may contain HTML as well */}
                    {renderMaybeHtml(selectedNotif.title ?? selectedNotif.headline ?? "")}
                  </h3>

                  {/* Main content - allow HTML (sanitized) */}
                  <div
                    className="prose prose-sm md:prose md:prose-lg max-w-full text-gray-800 leading-relaxed"
                    // prefer explicit messageHtml, then start/end combination, then fallback to startMessage text
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        selectedNotif.messageHtml
                          ? selectedNotif.messageHtml
                          : buildMessageHtml(selectedNotif)
                      ),
                    }}
                  />

                  {/* optional extra fields (problem, streak) rendered more clearly */}
                  <div className="mt-4 text-sm text-gray-500 space-y-1">
                    {selectedNotif.problemName && (
                      <div>
                        <strong className="text-gray-700">المشكلة:</strong>{" "}
                        <span className="text-gray-600">{selectedNotif.problemName}</span>
                      </div>
                    )}
                    {selectedNotif.streakDays && (
                      <div>
                        <strong className="text-gray-700">سلسلة الأيام:</strong>{" "}
                        <span className="text-gray-600">{selectedNotif.streakDays} يوم</span>
                      </div>
                    )}
                    <div>
                      <strong className="text-gray-700">التوقيت:</strong>{" "}
                      <span className="text-gray-600">
                        {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString("ar-EG") : ""}
                </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* actions area (flexible) */}
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                {selectedNotif.actionUrl && (
                  <a
                    href={selectedNotif.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    فتح
                  </a>
                )}

                <button
                  onClick={closeDetail}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
