import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import { Typography } from "@mui/material";
import {
  Bell,
  Award,
  AlertTriangle,
  Flame,
  Settings,
  Brain,
  UserCheck,
} from "lucide-react";
import LandingNav from "../../components/LandingNav";
import dashboardLogo from "../../assets/logo.png";
import defaultAvatar from "../../assets/Ellipse10.png";
import { clearCredentials, selectAuthUser, selectAuthSession } from "../../store/authSlice";
import UserProfile from "../User/UserProfile";
import ProblemsList from "../Problems/ProblemsList";
import Algorithms from "../Algorithms/Algorithms";
import Layout from "../Contest/Layout";
import InfluencerPage from "./InfluencerPage";
import { fetchNotificationsByUser, getUnreadNotificationsCount } from "../../Service/NotificationServices";
import { getEmailPreferences, updateEmailPreferences } from "../../Service/userService";
import "../Auth/login.css";
import "./dashboardHome.css";

const PostsPage = lazy(() => import("../Posts/User/AllPost"));

const NAV_LINKS = [
  { id: "explore", label: "استكشف", href: "#explore" },
  { id: "questions", label: "الأسئلة", href: "#questions" },
  { id: "contests", label: "المسابقات", href: "#contests" },
  { id: "algorithms", label: "الخوارزميات", href: "#algorithms" },
  { id: "influencer", label: "كن مؤثراً", href: "#influencer" },
];

const BOXICON_LINK_ID = "dashboard-boxicons-link";
const BOXICON_HREF = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";

const ensureBoxicons = () => {
  if (typeof document === "undefined") {
    return;
  }
  if (!document.getElementById(BOXICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = BOXICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = BOXICON_HREF;
    document.head.appendChild(link);
  }
};

const TAB_CONTENT = {
  explore: {
    eyebrow: "لوحة التحكم",
    title: "استكشف كل ما تحتاجه لبدء يومك البرمجي",
    description:
      "اختصر الوقت بالوصول السريع إلى الدروس، التحديات اليومية، وأحدث أنشطة المجتمع.",
    items: [
      {
        title: "ملخص الإنجاز",
        body: "عدد الحلول الجديدة خلال هذا الأسبوع، ونقاط الخبرة المكتسبة مقارنة بالأسبوع الماضي.",
      },
      {
        title: "تحدي اليوم",
        body: "حل مشكلة خوارزمية السلسلة العظمى، واحصل على 80 نقطة إضافية إذا أنهيتها قبل نهاية اليوم.",
      },
      {
        title: "مقترحات التعلم",
        body: "مسار هياكل البيانات المتقدم، وورشة عمل مباشرة حول تصميم الأنظمة مساء الخميس.",
      },
    ],
    action: { label: "انتقل إلى لوحة المسارات", href: "#explore-actions" },
  },
  questions: {
    eyebrow: "مجتمع عرب كودرز",
    title: "تابع الأسئلة النشطة وابحث عن فرص للإجابة",
    description:
      "اختر علامة مفضلة، صفِ الأسئلة بحسب مستوى الصعوبة، وشارك خبرتك مع المطورين الآخرين.",
    items: [
      {
        title: "أسئلة بحاجة لإجابة",
        body: "13 سؤالاً ينتظرون مساهمتك في مجالات الويب، الذكاء الاصطناعي، وتطوير الألعاب.",
      },
      {
        title: "العلامات المفضلة",
        body: "React، Node.js، Machine Learning — اضبط مركز المتابعة ليعرض الجديد فور نشره.",
      },
      {
        title: "ملف الإنجاز",
        body: "أكمل 5 إجابات موثقة لتحصل على شارة 'خبير المجتمع' لهذا الشهر.",
      },
    ],
    action: { label: "تصفح أحدث الأسئلة", href: "#questions-actions" },
  },
  contests: {
    eyebrow: "المسابقات المباشرة",
    title: "استعد للتحديات القادمة وثبّت مكانك في الترتيب",
    description:
      "تابع العد التنازلي، كوّن فريقك، وشاهد ترتيبك الحالي مقارنة بالمراكز الأولى.",
    items: [
      {
        title: "المسابقة الأسبوعية",
        body: "تبدأ خلال 02:14:11، وتتضمن 5 مسائل منوعة في التعقيد والتحليل.",
      },
      {
        title: "ترتيب الفريق",
        body: "فريقك الآن في المركز الرابع — بإمكانك دعوة عضو إضافي لتحسين وقت الحل.",
      },
      {
        title: "أرشيف المسابقات",
        body: "استعرض تفاصيل المسابقات السابقة، الحلول الرسمية، وأفضل محاولات المجتمع.",
      },
    ],
    action: { label: "اعرض تفاصيل المسابقة", href: "#contests-actions" },
  },
  algorithms: {
    eyebrow: "مختبر الخوارزميات",
    title: "جرّب خوارزميات جديدة وطوّر حلولك",
    description:
      "منصة تفاعلية لتشغيل الخوارزميات، رؤية خطوات التنفيذ، ومقارنة التعقيد الزمني بسهولة.",
    items: [
      {
        title: "مختبر المحاكاة",
        body: "شغّل خوارزميات الفرز والبحث، وراقب أداء كل خوارزمية على بيانات واقعية.",
      },
      {
        title: "المهام المقترحة",
        body: "ركز هذا الأسبوع على الرسم البياني، التدرج، وخوارزميات الجدولة.",
      },
      {
        title: "الأدوات المساعدة",
        body: "حول الحلول إلى مخططات مرئية، وصدّر النتائج لمشاركتها مع فريقك.",
      },
    ],
    action: { label: "ابدأ تجربة خوارزمية", href: "#algorithms-actions" },
  },
  influencer: {
    eyebrow: "شبكة المؤثرين",
    title: "شارك خبرتك وألهم باقي المطورين",
    description:
      "خطط لسلسلـة محتوى، انضم للمبادرات المفتوحة، وتابع تأثيرك على المجتمع خلال الشهر.",
    items: [
      {
        title: "تقويم المحتوى",
        body: "مرة أسبوعياً: مقال تقني، بث مباشر، وجلسة أسئلة وأجوبة.",
      },
      {
        title: "الشراكات الجديدة",
        body: "تعاون مع شركات تقنية عربية لإطلاق تحديات برمجية برعاية خاصة.",
      },
      {
        title: "قياس التأثير",
        body: "إحصاءات الوصول، التفاعل، ونقاط التأثير تُحدّث كل 24 ساعة.",
      },
    ],
    action: { label: "افتح لوحة المؤثرين", href: "#influencer-actions" },
  },
};

const DashboardHome = () => {
  const tabs = useMemo(() => NAV_LINKS.filter((link) => TAB_CONTENT[link.id]), []);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "explore");
  const [expandedTagIdState, setExpandedTagIdState] = useState(null); // لحفظ expandedTagId من location.state
  const [showProfileView, setShowProfileView] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isNotificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const [notificationMenuPosition, setNotificationMenuPosition] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [loadingEmailPreferences, setLoadingEmailPreferences] = useState(false);
  const [updatingEmailPreferences, setUpdatingEmailPreferences] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("dark-mode");
    return saved === "true";
  });

  // Notification icons and colors
  const notificationIcons = {
    1: <UserCheck className="text-blue-500" size={28} />,
    2: <Brain className="text-orange-500" size={28} />,
    3: <Award className="text-green-500" size={28} />,
    4: <AlertTriangle className="text-red-500" size={28} />,
    5: <Flame className="text-purple-500" size={28} />,
    6: <Settings className="text-gray-500" size={28} />,
  };

  const notificationTypeColors = {
    1: "border-blue-300",
    2: "border-orange-300",
    3: "border-green-300",
    4: "border-red-300",
    5: "border-purple-300",
    6: "border-gray-300",
  };

  // Notification utility functions
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

  const looksLikeHtml = (str) => {
    if (typeof str !== "string") return false;
    return /<[^>]+>/.test(str);
  };

  const renderMaybeHtml = (content, className = "") => {
    if (content == null) return <span className={className} />;

    if (typeof content === "object") {
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
      return <div className={className}>{String(content)}</div>;
    }

    const str = String(content);
    if (looksLikeHtml(str)) {
      return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(str) }} />;
    }
    return <div className={className}>{str}</div>;
  };

  const buildMessageHtml = (notif) => {
    if (!notif) return "";
    if (notif.messageHtml) return sanitizeHtml(notif.messageHtml);

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

  const openNotificationDetail = (notif) => {
    setSelectedNotif(notif);
  };

  const closeNotificationDetail = () => {
    setSelectedNotif(null);
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useSelector(selectAuthUser);
  const authSession = useSelector(selectAuthSession);

  useEffect(() => {
    ensureBoxicons();
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    localStorage.setItem("dark-mode", isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
    }

    // Update inline styles for elements with light backgrounds
    const updateInlineStyles = () => {
      // Update elements with inline styles
      const allElements = document.querySelectorAll('*[style]');
      allElements.forEach((el) => {
        const style = el.getAttribute('style') || '';
        
        // Check for white background (rgb(255, 255, 255) or #ffffff or #fff)
        if (style.includes('rgb(255, 255, 255)') || style.includes('#ffffff') || (style.includes('#fff') && !style.includes('#ffff'))) {
          if (isDarkMode) {
            if (!el.hasAttribute('data-original-style')) {
              el.setAttribute('data-original-style', style);
            }
            const computedStyle = window.getComputedStyle(document.documentElement);
            const darkBg = computedStyle.getPropertyValue('--admin-bg-secondary').trim() || '#1e293b';
            el.style.backgroundColor = darkBg;
          } else {
            const originalStyle = el.getAttribute('data-original-style');
            if (originalStyle) {
              el.setAttribute('style', originalStyle);
              el.removeAttribute('data-original-style');
            }
          }
        }
        
        // Check for light gray background (rgb(245, 245, 245) or #f5f5f5)
        if (style.includes('rgb(245, 245, 245)') || style.includes('#f5f5f5')) {
          if (isDarkMode) {
            if (!el.hasAttribute('data-original-style-gray')) {
              el.setAttribute('data-original-style-gray', style);
            }
            const computedStyle = window.getComputedStyle(document.documentElement);
            const darkBg = computedStyle.getPropertyValue('--admin-bg-tertiary').trim() || '#334155';
            el.style.backgroundColor = darkBg;
          } else {
            const originalStyle = el.getAttribute('data-original-style-gray');
            if (originalStyle) {
              el.setAttribute('style', originalStyle);
              el.removeAttribute('data-original-style-gray');
            }
          }
        }
        
        // Check for very light gray background (rgb(249, 249, 249) or #f9f9f9)
        if (style.includes('rgb(249, 249, 249)') || style.includes('#f9f9f9')) {
          if (isDarkMode) {
            if (!el.hasAttribute('data-original-style-light-gray')) {
              el.setAttribute('data-original-style-light-gray', style);
            }
            const computedStyle = window.getComputedStyle(document.documentElement);
            const darkBg = computedStyle.getPropertyValue('--admin-bg-tertiary').trim() || '#334155';
            el.style.backgroundColor = darkBg;
            el.style.color = computedStyle.getPropertyValue('--admin-text-primary').trim() || '#f1f5f9';
          } else {
            const originalStyle = el.getAttribute('data-original-style-light-gray');
            if (originalStyle) {
              el.setAttribute('style', originalStyle);
              el.removeAttribute('data-original-style-light-gray');
            }
          }
        }
        
        // Check for gray borders (rgb(224, 224, 224) or #e0e0e0)
        if (style.includes('rgb(224, 224, 224)') || style.includes('#e0e0e0')) {
          if (isDarkMode) {
            if (!el.hasAttribute('data-original-border')) {
              el.setAttribute('data-original-border', style);
            }
            const computedStyle = window.getComputedStyle(document.documentElement);
            const darkBorder = computedStyle.getPropertyValue('--admin-border-color').trim() || 'rgba(51, 65, 85, 0.8)';
            el.style.borderColor = darkBorder;
            // Also update if it's in border property
            if (style.includes('border:') && style.includes('rgb(224, 224, 224)')) {
              el.style.border = el.style.border.replace(/rgb\(224, 224, 224\)/g, darkBorder).replace(/#e0e0e0/g, darkBorder);
            }
          } else {
            const originalStyle = el.getAttribute('data-original-border');
            if (originalStyle) {
              el.setAttribute('style', originalStyle);
              el.removeAttribute('data-original-border');
            }
          }
        }
      });
      
      // Update MUI Box elements
      const muiBoxElements = document.querySelectorAll('.MuiBox-root, [class*="MuiBox-root"]');
      muiBoxElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(document.documentElement);
        if (isDarkMode) {
          // Check if element has white or light background from computed styles
          const bgColor = window.getComputedStyle(el).backgroundColor;
          if (bgColor === 'rgb(255, 255, 255)' || bgColor === 'rgb(245, 245, 245)' || bgColor === 'rgb(250, 250, 250)') {
            if (!el.hasAttribute('data-original-mui-bg')) {
              el.setAttribute('data-original-mui-bg', bgColor);
            }
            const darkBg = bgColor === 'rgb(255, 255, 255)' 
              ? computedStyle.getPropertyValue('--admin-bg-secondary').trim() || '#1e293b'
              : computedStyle.getPropertyValue('--admin-bg-tertiary').trim() || '#334155';
            el.style.backgroundColor = darkBg;
            el.style.color = computedStyle.getPropertyValue('--admin-text-primary').trim() || '#f1f5f9';
          }
        } else {
          // Restore original background
          const originalBg = el.getAttribute('data-original-mui-bg');
          if (originalBg) {
            el.style.backgroundColor = originalBg;
            el.removeAttribute('data-original-mui-bg');
          }
        }
      });
    };

    // Run after DOM updates
    setTimeout(updateInlineStyles, 100);
  }, [isDarkMode]);

  const handleDarkModeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Check if we should open profile view or specific tab based on navigation state
  useEffect(() => {
    if (location.state?.openProfile) {
      setShowProfileView(true);
      setActiveTab("profile");
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    } else if (location.state?.activeTab) {
      // إذا تم تحديد تاب معين (مثل questions أو algorithms)
      setShowProfileView(false);
      setActiveTab(location.state.activeTab);
      
      // حفظ expandedTagId إذا كان موجوداً (للاستخدام في Algorithms component)
      if (location.state.expandedTagId) {
        setExpandedTagIdState(location.state.expandedTagId);
        console.log(`📌 Saved expandedTagId: ${location.state.expandedTagId}`);
      }
      
      // Clear the state after using it (لكن نحتفظ بـ expandedTagIdState)
      window.history.replaceState({}, document.title);
      
      // Scroll to top
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);
    }
  }, [location]);

  const updateMenuPosition = useCallback(() => {
    const triggerEl = profileTriggerRef.current;
    const menuEl = profileMenuRef.current;
    if (!triggerEl || !menuEl) {
      return;
    }

    const triggerRect = triggerEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const top = triggerRect.bottom + window.scrollY + 12;
    let right = Math.max(14, window.innerWidth - triggerRect.right + window.scrollX);

    if (right + menuRect.width > window.innerWidth) {
      right = Math.max(14, window.innerWidth - menuRect.width - 24);
    }

    setMenuPosition({ top, right });
  }, []);

  const updateNotificationMenuPosition = useCallback(() => {
    const triggerEl = notificationTriggerRef.current;
    const menuEl = notificationMenuRef.current;
    if (!triggerEl || !menuEl) {
      return;
    }

    const triggerRect = triggerEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const top = triggerRect.bottom + window.scrollY + 12;
    let right = Math.max(14, window.innerWidth - triggerRect.right + window.scrollX);

    if (right + menuRect.width > window.innerWidth) {
      right = Math.max(14, window.innerWidth - menuRect.width - 24);
    }

    setNotificationMenuPosition({ top, right });
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      const menuEl = profileMenuRef.current;
      const triggerEl = profileTriggerRef.current;
      const clickedOutsideMenu = menuEl ? !menuEl.contains(event.target) : true;
      const clickedOutsideTrigger = triggerEl ? !triggerEl.contains(event.target) : true;
      if (clickedOutsideMenu && clickedOutsideTrigger) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    updateMenuPosition();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isProfileMenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isNotificationMenuOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      const menuEl = notificationMenuRef.current;
      const triggerEl = notificationTriggerRef.current;
      const clickedOutsideMenu = menuEl ? !menuEl.contains(event.target) : true;
      const clickedOutsideTrigger = triggerEl ? !triggerEl.contains(event.target) : true;
      if (clickedOutsideMenu && clickedOutsideTrigger) {
        setNotificationMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationMenuOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateNotificationMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    updateNotificationMenuPosition();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isNotificationMenuOpen, updateNotificationMenuPosition]);

  const userDisplayName =
    authSession?.responseUserDTO?.userName ?? 
    authUser?.name ?? 
    authUser?.fullName ?? 
    authUser?.userName ?? 
    "مستخدم عرب كودرز";
  
  const rawPoints = authUser?.points ?? authUser?.score ?? authUser?.xp ?? 0;
  const formattedPoints =
    typeof Intl !== "undefined" ? new Intl.NumberFormat("ar-EG").format(rawPoints) : rawPoints;
  
  const userAvatar = 
    authSession?.responseUserDTO?.imageUrl ?? 
    authUser?.avatarUrl ?? 
    authUser?.profileImage ?? 
    defaultAvatar;
  
  const userId = authSession?.responseUserDTO?.id ?? authUser?.id ?? 1;

  const handleProfileToggle = () => {
    setProfileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        updateMenuPosition();
        // Close notification menu if open
        setNotificationMenuOpen(false);
      }
      return next;
    });
  };

  const handleNotificationToggle = async () => {
    const willOpen = !isNotificationMenuOpen;
    setNotificationMenuOpen(willOpen);
    
    if (willOpen) {
      // Close profile menu if open
      setProfileMenuOpen(false);
      
      // Fetch notifications
      const idUser = JSON.parse(localStorage.getItem("idUser"));
      console.log("🔔 Toggling notifications, idUser:", idUser);
      if (idUser) {
        try {
          const data = await fetchNotificationsByUser(idUser);
          console.log("🔔 Fetched notifications:", data);
          const notificationsData = Array.isArray(data) ? data : [];
          const count = await getUnreadNotificationsCount(idUser);
          
          // Set notification data
          setNotificationData({
            notifications: notificationsData,
            unreadCount: count
          });
          
          console.log("🔔 Notification data set:", {
            notifications: notificationsData.length,
            unreadCount: count
          });
          
          setTimeout(() => {
            updateNotificationMenuPosition();
            console.log("🔔 Menu position updated:", notificationMenuPosition);
          }, 100);
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      }
    }
  };

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnread = async () => {
      const idUser = JSON.parse(localStorage.getItem("idUser"));
      if (!idUser) return;
      try {
        const count = await getUnreadNotificationsCount(idUser);
        console.log("🔔 Unread count:", count);
        setNotificationData((prev) => ({
          notifications: prev?.notifications || [],
          unreadCount: count
        }));
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    fetchUnread();
  }, []);

  const handleSettingsClick = () => {
    setProfileMenuOpen(false);
    setShowSettingsModal(true);
    // Fetch current email preferences
    fetchEmailPreferences();
  };

  const fetchEmailPreferences = async () => {
    setLoadingEmailPreferences(true);
    try {
      const enabled = await getEmailPreferences();
      setEmailNotificationsEnabled(enabled);
    } catch (err) {
      console.error("Error fetching email preferences:", err);
      alert(err?.message || "فشل جلب تفضيلات البريد الإلكتروني");
    } finally {
      setLoadingEmailPreferences(false);
    }
  };

  const handleEmailPreferencesToggle = async (enabled) => {
    setUpdatingEmailPreferences(true);
    try {
      await updateEmailPreferences(enabled);
      setEmailNotificationsEnabled(enabled);
    } catch (err) {
      console.error("Error updating email preferences:", err);
      alert(err?.message || "فشل تحديث تفضيلات البريد الإلكتروني");
      // Revert on error
      setEmailNotificationsEnabled(!enabled);
    } finally {
      setUpdatingEmailPreferences(false);
    }
  };

  const handleProfileView = () => {
    setProfileMenuOpen(false);
    setShowProfileView(true);
    setActiveTab("profile");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  };

  const handleNavClick = useCallback((event, link) => {
    if (!link?.href?.startsWith("#")) {
      return;
    }
    event.preventDefault();
    const tabId = link.href.slice(1);
    
    // إذا كان التاب هو "profile"، اعرض الملف الشخصي
    if (tabId === "profile") {
      setShowProfileView(true);
      setActiveTab("profile");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);
    } else if (TAB_CONTENT[tabId]) {
      // إذا كان تاب آخر، أخفِ الملف الشخصي واعرض المحتوى
      setShowProfileView(false);
      setActiveTab(tabId);
      // إعادة تعيين expandedTagIdState عند تغيير التاب
      if (tabId !== "algorithms") {
        setExpandedTagIdState(null);
      }
    }
  }, []);

  const activeContent = TAB_CONTENT[activeTab];

  return (
    <div className={`dashboard-home ${showProfileView ? 'dashboard-home--profile-active' : ''}`} data-active-tab={activeTab}>
      <header className="landing-header landing-header--auth dashboard-home__header">
        <LandingNav
          className="landing-nav--with-divider"
          links={NAV_LINKS}
          onLinkClick={handleNavClick}
          activeTab={activeTab}
          logo={
            <div className="dashboard-home__logo">
              <img src={dashboardLogo} alt="عرب كودرز" />
            </div>
          }
          actions={
            <div className="dashboard-home__quick-actions" aria-label="إجراءات سريعة">
              <div className="dashboard-home__profile" ref={profileTriggerRef}>
                <button
                  className="dashboard-home__icon dashboard-home__icon--profile"
                  title="الملف الشخصي"
                  type="button"
                  onClick={handleProfileToggle}
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <i className="bx bx-user" aria-hidden="true" />
                </button>
                
              </div>
              <div className="dashboard-home__notifications" ref={notificationTriggerRef}>
                <button
                  className="dashboard-home__icon dashboard-home__icon--notifications"
                  title="الإشعارات"
                  type="button"
                  onClick={handleNotificationToggle}
                  aria-haspopup="menu"
                  aria-expanded={isNotificationMenuOpen}
                >
                  <i className="bx bx-bell" aria-hidden="true" />
                  {notificationData?.unreadCount > 0 && (
                    <span className="dashboard-home__notification-badge">
                      {notificationData.unreadCount > 9 ? '9+' : notificationData.unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationMenuOpen && (
                  <div
                    ref={notificationMenuRef}
                    className="dashboard-home__notification-menu"
                    role="menu"
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    <div className="py-2" style={{ paddingRight: '8px' }}>
                      {!notificationData || !notificationData.notifications || notificationData.notifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">لا توجد إشعارات.</div>
                      ) : (
                        notificationData.notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => openNotificationDetail(notif)}
                            className={`flex items-start gap-3 px-4 sm:px-6 py-3 cursor-pointer hover:bg-gray-50 border-l-4 ${notificationTypeColors[notif.type] || "border-gray-300"}`}
                            role="menuitem"
                          >
                            <div className="mt-0.5">{notificationIcons[notif.type]}</div>
                            <div className="flex-1 pr-2 break-words text-sm text-gray-800">
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
              </div>
              <button 
                className="dashboard-home__icon" 
                title={isDarkMode ? "الوضع الفاتح" : "الوضع الليلي"} 
                type="button"
                onClick={handleDarkModeToggle}
              >
                <i className={isDarkMode ? "bx bx-sun" : "bx bx-moon"} aria-hidden="true" />
              </button>
            </div>
          }
        />
      </header>
      {isProfileMenuOpen ? (
        <div
          ref={profileMenuRef}
          className="dashboard-home__profile-menu"
          role="menu"
          style={{
            position: "absolute",
            top: `${menuPosition?.top ?? 0}px`,
            right: `${menuPosition?.right ?? 0}px`,
            zIndex: 5000,
          }}
        >
          <button
            type="button"
                    className="dashboard-home__profile-header"
                    onClick={handleProfileView}
            aria-label="عرض صفحة الملف الشخصي"
          >
            <div className="dashboard-home__profile-avatar-wrapper">
              <img src={userAvatar} alt={userDisplayName} className="dashboard-home__profile-avatar" />
            </div>
            <div className="dashboard-home__profile-info">
              <p className="dashboard-home__profile-name">{userDisplayName}</p>
              <p className="dashboard-home__profile-rank">Rank #{userId}</p>
            </div>
          </button>
          <button
            type="button"
                    className="dashboard-home__profile-action"
                    onClick={handleSettingsClick}
          >
            <i className="bx bx-cog" aria-hidden="true" />
            <span>الإعدادات</span>
          </button>
          <button
            type="button"
            className="dashboard-home__profile-action dashboard-home__profile-action--danger"
            onClick={handleLogout}
          >
            <i className="bx bx-log-out" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      ) : null}
      
      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تفاصيل الإشعار"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeNotificationDetail}
          />
          <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6 md:p-8">
              <button
                onClick={closeNotificationDetail}
                className="absolute top-4 left-4 text-gray-500 hover:text-red-500 text-2xl font-bold rounded-full p-1"
                aria-label="إغلاق"
              >
                ×
              </button>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">{notificationIcons[selectedNotif.type]}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
                    {renderMaybeHtml(selectedNotif.title ?? selectedNotif.headline ?? "")}
                  </h3>
                  <div
                    className="prose prose-sm md:prose md:prose-lg max-w-full text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        selectedNotif.messageHtml
                          ? selectedNotif.messageHtml
                          : buildMessageHtml(selectedNotif)
                      ),
                    }}
                  />
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
                  onClick={closeNotificationDetail}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="الإعدادات"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="ltr"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">الإعدادات</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingEmailPreferences ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                  <span className="mr-3 text-gray-600">جاري التحميل...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email Notifications Toggle */}
                  <div className="flex items-start justify-between gap-4 p-5 bg-gradient-to-l from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gray-300 transition-shadow shadow-sm hover:shadow-md" dir="rtl">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight">
                        السماح بإرسال الإشعارات عبر البريد الإلكتروني
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        فقط الإشعارات الحرجة والمهمّة سَتُرسل عند التمكين
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-1" dir="ltr">
                      <button
                        onClick={() => handleEmailPreferencesToggle(!emailNotificationsEnabled)}
                        disabled={updatingEmailPreferences}
                        className={`relative inline-flex h-7 w-14 items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          emailNotificationsEnabled 
                            ? "bg-indigo-600 focus:ring-indigo-500 shadow-md shadow-indigo-200" 
                            : "bg-gray-300 focus:ring-gray-400"
                        } ${updatingEmailPreferences ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}`}
                        role="switch"
                        aria-checked={emailNotificationsEnabled}
                        aria-label="السماح بإرسال الإشعارات عبر البريد الإلكتروني"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out ${
                            emailNotificationsEnabled ? "translate-x-7" : "translate-x-1"
                          }`}
                        >
                          {updatingEmailPreferences && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <svg className="animate-spin h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <main className="dashboard-home__main" data-active-tab={activeTab}>
        {showProfileView ? (
          <div className="dashboard-home__profile-view">
            <UserProfile />
          </div>
        ) : (
          <div className="dashboard-home__content" data-tab={activeTab}>
            <div className="dashboard-home__status">
              <span className="dashboard-home__status-icon dashboard-home__status-icon--primary" />
              <span className="dashboard-home__status-icon dashboard-home__status-icon--success" />
            </div>

            {activeTab === "explore" ? (
              <Suspense fallback={<Typography sx={{textAlign: "center", py: 4}}>جاري تحميل المنشورات...</Typography>}>
                <PostsPage />
              </Suspense>
            ) : activeTab === "questions" ? (
              <ProblemsList />
            ) : activeTab === "algorithms" ? (
              <Algorithms initialExpandedTagId={expandedTagIdState || location.state?.expandedTagId} />
            ) : activeTab === "contests" ? (
              <Layout />
            ) : activeTab === "influencer" ? (
              <InfluencerPage />
            ) : (
              <section
                key={activeTab}
                className="dashboard-panel"
                aria-labelledby={`${activeTab}-heading`}
              >
                <header className="dashboard-panel__header">
                  <span className="dashboard-panel__eyebrow">{activeContent.eyebrow}</span>
                  <h1 id={`${activeTab}-heading`}>{activeContent.title}</h1>
                  <p>{activeContent.description}</p>
                </header>

                <div className="dashboard-panel__cards">
                  {activeContent.items.map((item) => (
                    <article key={item.title} className="dashboard-card">
                      <h2>{item.title}</h2>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>

                <div className="dashboard-panel__cta">
                  <a href={activeContent.action.href} className="dashboard-panel__cta-button">
                    {activeContent.action.label}
                  </a>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="landing-footer--auth dashboard-home__footer">
        <div className="landing-footer__row">
          <span className="landing-footer__text landing-footer__text--flag">
            🇯🇴 المملكة الأردنية الهاشمية
          </span>
          <ul className="landing-footer__nav" role="list">
            <li>
              <a href="#rewards">المكافآت</a>
            </li>
            <li>
              <a href="#jobs">الوظائف</a>
            </li>
            <li>
              <a href="#help-center">مركز المساعدة</a>
            </li>
            <li>
              <a href="#terms">الشروط</a>
            </li>
            <li>
              <a href="#request">الطلب</a>
            </li>
          </ul>
          <span className="landing-footer__text">حقوق الابتكار والنشر © عرب كودرز</span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardHome;

