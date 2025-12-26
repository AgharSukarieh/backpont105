import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { selectAuthSession, clearCredentials } from "../../store/authSlice";
import { getAllGeneralInfoUser } from "../../Service/ProblemService";
import { getUserById } from "../../Service/userService";
import { checkFollowStatus, doFollow, doUnfollow } from "../../Service/followService";
import { getBellActivationStatus, saveBellActivation, getBellFollowersCount } from "../../Service/bellActivationService";
import { fetchNotificationsByUser, getUnreadNotificationsCount } from "../../Service/NotificationServices";
import EditProfile from "./EditProfile";
import LandingNav from "../../components/LandingNav";
import dashboardLogo from "../../assets/logo.png";
import defaultAvatar from "../../assets/Ellipse10.png";
import emailIcon from "../../assets/emaill.png";
import universityIcon from "../../assets/unv.png";
import tryIcon from "../../assets/try.png";
import probSolvingIcon from "../../assets/prob_solving.png";
import dateRangeIcon from "../../assets/Date_range_duotone.png";
import probIcon from "../../assets/prob.png";
import algathoimIcon from "../../assets/algathoim.png";
import followFansIcon from "../../assets/follow_fans.png";
import followIcon from "../../assets/follow_icon.png";
import {
  Bell,
  Award,
  AlertTriangle,
  Flame,
  Settings,
  Brain,
  UserCheck,
} from "lucide-react";
import DOMPurify from "dompurify";
import "../Auth/login.css";
import "../Dashboard/dashboardHome.css";
import "./userProfile.css";

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

const NAV_LINKS = [
  { id: "explore", label: "استكشف", to: "/dashboard" },
  { id: "questions", label: "الأسئلة", to: "/dashboard" },
  { id: "contests", label: "المسابقات", to: "/dashboard" },
  { id: "algorithms", label: "الخوارزميات", to: "/dashboard" },
  { id: "influencer", label: "كن مؤثراً", to: "/dashboard" },
];

const circleRadius = 45;
const circleCircumference = 2 * Math.PI * circleRadius;

const getDashOffset = (value, total) => {
  if (!total || total <= 0) return circleCircumference;
  const safeValue = Math.max(0, Math.min(value ?? 0, total));
  return circleCircumference - (safeValue / total) * circleCircumference;
};

// Custom hook for number animation
const useCountUp = (end, duration = 2000, shouldAnimate = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(end);
      return;
    }

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, shouldAnimate]);

  return count;
};

const UserProfile = () => {
  const { id: profileUserId } = useParams();
  const session = useSelector(selectAuthSession);
  const navigate = useNavigate();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [generalInfo, setGeneralInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // States للمتابعة والجرس
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [bellActive, setBellActive] = useState(false);
  const [bellBusy, setBellBusy] = useState(false);
  const [showBellModal, setShowBellModal] = useState(false);
  const [bellEmailChecked, setBellEmailChecked] = useState(true);
  const [bellAppChecked, setBellAppChecked] = useState(true);
  const [isOnline, setIsOnline] = useState(false); // حالة المستخدم (online/offline)
  const [bellFollowersCount, setBellFollowersCount] = useState(0); // عدد المهتمين بالإشعارات

  // States للهيدر (من Dashboard)
  const dispatch = useDispatch();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isNotificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const [notificationMenuPosition, setNotificationMenuPosition] = useState(null);
  const [notificationData, setNotificationData] = useState(null);

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
      ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "a", "p", "br", "ul", "ol", "li", "span", "img", "code", "pre", "blockquote", "h1", "h2", "h3"],
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
        return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(content.html)) }} />;
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

  // معرف المستخدم الحالي
  const currentUserId = session?.responseUserDTO?.id;
  // معرف المستخدم المعروض (من الرابط أو المستخدم الحالي)
  const displayedUserId = profileUserId ? Number(profileUserId) : currentUserId;
  // هل هذا بروفايل المستخدم الحالي؟
  const isOwnProfile = currentUserId && Number(displayedUserId) === Number(currentUserId);

  // جلب المعلومات العامة للمسائل وبيانات المستخدم المعروض
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب المعلومات العامة
        const generalData = await getAllGeneralInfoUser();
        console.log("📊 General Info:", generalData);
        setGeneralInfo(generalData);

        // جلب بيانات المستخدم المعروض
        if (displayedUserId) {
          try {
            const userData = await getUserById(displayedUserId);
            console.log("👤 User Stats:", userData);
            
            // معالجة البيانات - قد تكون في responseUserDTO أو مباشرة
            if (userData) {
              setUserStats(userData);
            } else {
              console.warn("⚠️ No user data returned from API");
            }
          } catch (userError) {
            console.error("❌ Error fetching user data:", userError);
            // لا نرمي الخطأ، فقط نسجله ونستمر
          }
          
          // جلب حالة المتابعة والجرس إذا لم يكن المستخدم نفسه
          if (!isOwnProfile && currentUserId) {
            const followStatus = await checkFollowStatus(currentUserId, displayedUserId);
            setIsFollowing(followStatus);
            
            if (followStatus) {
              try {
                const bellData = await getBellActivationStatus(currentUserId, displayedUserId);
                if (bellData) {
                  setBellActive(bellData.isActivatedSendEmail || bellData.isActivatedSendAppNotification);
                  setBellEmailChecked(bellData.isActivatedSendEmail || false);
                  setBellAppChecked(bellData.isActivatedSendAppNotification || false);
                } else {
                  setBellActive(false);
                }
              } catch (err) {
                console.error("Error fetching bell status:", err);
                setBellActive(false);
              }
            }
          }
          
          // جلب عدد المهتمين بالإشعارات (لجميع المستخدمين)
          try {
            const bellCount = await getBellFollowersCount(displayedUserId);
            setBellFollowersCount(bellCount);
            console.log("🔔 Bell followers count:", bellCount);
          } catch (err) {
            console.error("Error fetching bell followers count:", err);
            setBellFollowersCount(0);
          }
          
          // جلب حالة المستخدم (online/offline) - يمكن إضافة API لهذا لاحقاً
          // حالياً نضع true كقيمة افتراضية
          setIsOnline(true);
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [displayedUserId, currentUserId, isOwnProfile]);

  const profile = useMemo(() => {
    // إذا كان هناك userStats (بيانات المستخدم المعروض)، استخدمها
    if (userStats) {
      // التحقق من وجود responseUserDTO
      const userInfo = userStats.responseUserDTO || userStats;
      
      return {
        id: userInfo.id ?? userStats.id ?? displayedUserId ?? "-",
        email: userInfo.email ?? userStats.email ?? "--",
        userName: userInfo.userName ?? userStats.userName ?? "مستخدم عرب كودرز",
        imageUrl: userInfo.imageUrl ?? userInfo.imageURL ?? userStats.imageUrl ?? userStats.imageURL ?? "https://via.placeholder.com/120x120.png?text=Profile",
        registerAt: userInfo.registerAt ?? userStats.registerAt ?? null,
        role: userInfo.role ?? userStats.role ?? "User",
        country: userInfo.country ?? userStats.country ?? null,
        // حساب totalProblemsSolved من مجموع المشاكل المحلولة
        totalProblemsSolved: userStats.totalProblemsSolved ?? 
          ((userStats.easyProblemsSolvedCount ?? 0) + 
           (userStats.mediumProblemsSolvedCount ?? 0) + 
           (userStats.hardProblemsSolvedCount ?? 0)),
        // حساب acceptanceRate إذا لم يكن موجوداً
        acceptanceRate: userStats.acceptanceRate ?? 
          (userStats.totalSubmissions > 0 
            ? Math.round((((userStats.easyProblemsSolvedCount ?? 0) + 
                           (userStats.mediumProblemsSolvedCount ?? 0) + 
                           (userStats.hardProblemsSolvedCount ?? 0)) / userStats.totalSubmissions) * 100) 
            : 0),
        totalSubmissions: userStats.totalSubmissions ?? 0,
        easyProblemsSolvedCount: userStats.easyProblemsSolvedCount ?? 0,
        mediumProblemsSolvedCount: userStats.mediumProblemsSolvedCount ?? 0,
        hardProblemsSolvedCount: userStats.hardProblemsSolvedCount ?? 0,
        streakDay: userStats.streakDay ?? 0,
        maxStreak: userStats.maxStreak ?? 0,
        following: userStats.following ?? 0,
        followers: userStats.followers ?? 0,
        universityName: userInfo.universityName ?? userStats.universityName ?? null,
        tagSolvedCounts: userStats.tagSolvedCounts ?? [],
      };
    }
    
    // إذا لم يكن هناك userStats وكان المستخدم الحالي، استخدم session
    if (session && session.responseUserDTO && isOwnProfile) {
      const user = session.responseUserDTO;
      return {
        id: user.id ?? "-",
        email: user.email ?? session.email ?? "--",
        userName: user.userName ?? session.username ?? "مستخدم عرب كودرز",
        imageUrl: user.imageUrl ?? user.imageURL ?? "https://via.placeholder.com/120x120.png?text=Profile",
        registerAt: user.registerAt ?? null,
        role: user.role ?? session.role ?? "User",
        country: user.country ?? null,
        acceptanceRate: 0,
        totalSubmissions: 0,
        totalProblemsSolved: 0,
        easyProblemsSolvedCount: 0,
        mediumProblemsSolvedCount: 0,
        hardProblemsSolvedCount: 0,
        streakDay: 0,
        maxStreak: 0,
        following: 0,
        followers: 0,
        universityName: user.universityName ?? null,
        tagSolvedCounts: [],
      };
    }
    
    // إذا لم يكن هناك بيانات، نعيد بيانات افتراضية بدلاً من null
    return {
      id: displayedUserId ?? "-",
      email: "--",
      userName: "مستخدم عرب كودرز",
      imageUrl: "https://via.placeholder.com/120x120.png?text=Profile",
      registerAt: null,
      role: "User",
      country: null,
      acceptanceRate: 0,
      totalSubmissions: 0,
      totalProblemsSolved: 0,
      easyProblemsSolvedCount: 0,
      mediumProblemsSolvedCount: 0,
      hardProblemsSolvedCount: 0,
      streakDay: 0,
      maxStreak: 0,
      following: 0,
      followers: 0,
      universityName: null,
      tagSolvedCounts: [],
    };
  }, [session, userStats, displayedUserId, isOwnProfile]);

  // استخدام الأرقام من الـ API
  const EASY_TOTAL = generalInfo?.contEasyProblems ?? generalInfo?.countEasyProblems ?? 0;
  const MEDIUM_TOTAL = generalInfo?.counMidumProblems ?? generalInfo?.countMediumProblems ?? 0;
  const HARD_TOTAL = generalInfo?.countHardProblems ?? 0;
  const TOTAL_PROBLEMS = generalInfo?.countProblems ?? 0;

  // Trigger animation on mount or when profile data changes
  useEffect(() => {
    if (profile) {
      setHasAnimated(false);
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  // Animated values
  const animatedTotalSubmissions = useCountUp(profile?.totalSubmissions ?? 0, 2000, hasAnimated);
  const animatedTotalSolved = useCountUp(profile?.totalProblemsSolved ?? 0, 2000, hasAnimated);
  const animatedEasy = useCountUp(profile?.easyProblemsSolvedCount ?? 0, 2000, hasAnimated);
  const animatedMedium = useCountUp(profile?.mediumProblemsSolvedCount ?? 0, 2000, hasAnimated);
  const animatedHard = useCountUp(profile?.hardProblemsSolvedCount ?? 0, 2000, hasAnimated);
  const animatedStreakDay = useCountUp(profile?.streakDay ?? 0, 2000, hasAnimated);
  const animatedMaxStreak = useCountUp(profile?.maxStreak ?? 0, 2000, hasAnimated);
  const animatedFollowers = useCountUp(profile?.followers ?? 0, 2000, hasAnimated);
  const animatedFollowing = useCountUp(profile?.following ?? 0, 2000, hasAnimated);
  const animatedAcceptanceRate = useCountUp(Math.round(profile?.acceptanceRate ?? 0), 2000, hasAnimated);
  const animatedBellFollowers = useCountUp(bellFollowersCount, 2000, hasAnimated);

  // معالجة المتابعة/إلغاء المتابعة
  const handleFollowToggle = async () => {
    if (!currentUserId || !displayedUserId || followBusy || isOwnProfile) {
      console.warn("⚠️ Cannot toggle follow:", { currentUserId, displayedUserId, followBusy, isOwnProfile });
      return;
    }
    
    setFollowBusy(true);
    try {
      if (isFollowing) {
        console.log("🔄 Unfollowing user:", { followerId: currentUserId, followId: displayedUserId });
        await doUnfollow(currentUserId, displayedUserId);
        setIsFollowing(false);
        setBellActive(false);
        setBellEmailChecked(false);
        setBellAppChecked(false);
        if (userStats) {
          setUserStats(prev => ({ ...prev, followers: Math.max(0, (prev?.followers ?? 0) - 1) }));
        }
        alert("تم إلغاء المتابعة بنجاح");
      } else {
        console.log("➕ Following user:", { followerId: currentUserId, followId: displayedUserId });
        await doFollow(currentUserId, displayedUserId);
        setIsFollowing(true);
        if (userStats) {
          setUserStats(prev => ({ ...prev, followers: (prev?.followers ?? 0) + 1 }));
        }
        alert("تم المتابعة بنجاح");
        
        // بعد المتابعة، جلب حالة الجرس
        try {
          const bellData = await getBellActivationStatus(currentUserId, displayedUserId);
          if (bellData) {
            setBellActive(bellData.isActivatedSendEmail || bellData.isActivatedSendAppNotification);
            setBellEmailChecked(bellData.isActivatedSendEmail || false);
            setBellAppChecked(bellData.isActivatedSendAppNotification || false);
          }
        } catch (err) {
          console.error("Error fetching bell status after follow:", err);
          // لا نعرض خطأ هنا لأن المتابعة نجحت
        }
      }
    } catch (err) {
      console.error("❌ Follow toggle error:", err);
      
      // عرض رسالة خطأ مفصلة
      const errorMessage = err?.message || "حدث خطأ أثناء تنفيذ العملية";
      alert(`فشل ${isFollowing ? "إلغاء المتابعة" : "المتابعة"}: ${errorMessage}`);
    } finally {
      setFollowBusy(false);
    }
  };

  // معالجة الجرس
  const handleBellClick = async () => {
    if (!currentUserId || !displayedUserId || bellBusy || isOwnProfile) return;
    
    if (!isFollowing) {
      alert("يجب متابعته أولاً لتفعيل الإشعارات");
      return;
    }
    
    if (bellActive) {
      // إيقاف الجرس
      setBellBusy(true);
      try {
        await saveBellActivation(currentUserId, displayedUserId, false, false);
        setBellActive(false);
        setBellEmailChecked(false);
        setBellAppChecked(false);
      } catch (err) {
        console.error("Disable bell error:", err);
        alert("فشل إيقاف الإشعارات");
      } finally {
        setBellBusy(false);
      }
    } else {
      // فتح نافذة الإعدادات
      try {
        const existing = await getBellActivationStatus(currentUserId, displayedUserId);
        if (existing) {
          setBellEmailChecked(existing.isActivatedSendEmail || false);
          setBellAppChecked(existing.isActivatedSendAppNotification || false);
        } else {
          setBellEmailChecked(true);
          setBellAppChecked(true);
        }
      } catch (err) {
        console.error("Error fetching bell status:", err);
        setBellEmailChecked(true);
        setBellAppChecked(true);
      }
      setShowBellModal(true);
    }
  };

  // حفظ إعدادات الجرس
  const handleSaveBellPreferences = async () => {
    if (!currentUserId || !displayedUserId || bellBusy) {
      console.warn("⚠️ Cannot save bell preferences:", { currentUserId, displayedUserId, bellBusy });
      return;
    }
    
    if (isOwnProfile) {
      alert("لا يمكنك تفعيل الإشعارات لنفسك");
      return;
    }
    
    if (!isFollowing) {
      alert("يجب متابعته أولاً لتفعيل الإشعارات");
      return;
    }
    
    setBellBusy(true);
    try {
      console.log("💾 Saving bell preferences:", {
        followerId: currentUserId,
        followedId: displayedUserId,
        email: bellEmailChecked,
        app: bellAppChecked,
      });
      
      await saveBellActivation(
        currentUserId,
        displayedUserId,
        bellEmailChecked,
        bellAppChecked
      );
      
      setBellActive(bellEmailChecked || bellAppChecked);
      setShowBellModal(false);
      
      // تحديث عدد المهتمين بعد الحفظ
      try {
        const updatedCount = await getBellFollowersCount(displayedUserId);
        setBellFollowersCount(updatedCount);
      } catch (err) {
        console.error("Error updating bell followers count:", err);
      }
      
      // إظهار رسالة نجاح
      alert("تم حفظ إعدادات الإشعارات بنجاح");
    } catch (err) {
      console.error("❌ Save bell preferences error:", err);
      console.error("Error details:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
      });
      
      // عرض رسالة خطأ مفصلة
      let errorMessage = "فشل حفظ إعدادات الإشعارات";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.title) {
        errorMessage = err.response.data.title;
      } else if (typeof err?.response?.data === "string") {
        errorMessage = err.response.data;
      }
      
      // إذا كانت الرسالة تحتوي على "contest"، قد تكون رسالة خطأ خاطئة من الـ API
      if (errorMessage.toLowerCase().includes("contest")) {
        errorMessage = "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً";
      }
      
      alert(`فشل حفظ إعدادات الإشعارات: ${errorMessage}`);
    } finally {
      setBellBusy(false);
    }
  };

  // Ensure boxicons on mount
  useEffect(() => {
    ensureBoxicons();
  }, []);

  // Fetch unread notifications count on mount
  useEffect(() => {
    if (!isOwnProfile && currentUserId) {
      const fetchUnread = async () => {
        try {
          const count = await getUnreadNotificationsCount(currentUserId);
          setNotificationData((prev) => ({
            notifications: prev?.notifications || [],
            unreadCount: count
          }));
        } catch (err) {
          console.error("Failed to fetch unread notifications count", err);
        }
      };
      fetchUnread();
    }
  }, [currentUserId, isOwnProfile]);

  // Update menu positions
  const updateMenuPosition = useCallback(() => {
    const triggerEl = profileTriggerRef.current;
    const menuEl = profileMenuRef.current;
    if (!triggerEl || !menuEl) return;
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
    if (!triggerEl || !menuEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const top = triggerRect.bottom + window.scrollY + 12;
    let right = Math.max(14, window.innerWidth - triggerRect.right + window.scrollX);
    if (right + menuRect.width > window.innerWidth) {
      right = Math.max(14, window.innerWidth - menuRect.width - 24);
    }
    setNotificationMenuPosition({ top, right });
  }, []);

  // Handle profile menu toggle
  const handleProfileToggle = () => {
    setProfileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        updateMenuPosition();
        setNotificationMenuOpen(false);
      }
      return next;
    });
  };

  // Handle notification menu toggle
  const handleNotificationToggle = async () => {
    const willOpen = !isNotificationMenuOpen;
    setNotificationMenuOpen(willOpen);
    if (willOpen) {
      setProfileMenuOpen(false);
      if (currentUserId) {
        try {
          const data = await fetchNotificationsByUser(currentUserId);
          const notificationsData = Array.isArray(data) ? data : [];
          const count = await getUnreadNotificationsCount(currentUserId);
          setNotificationData({
            notifications: notificationsData,
            unreadCount: count
          });
          setTimeout(() => updateNotificationMenuPosition(), 100);
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      }
    }
  };

  // Handle navigation click
  const handleNavClick = useCallback((event, link) => {
    if (link?.to) {
      navigate(link.to);
    }
  }, [navigate]);

  // Handle profile view
  const handleProfileView = () => {
    setProfileMenuOpen(false);
    navigate("/dashboard", { state: { openProfile: true } });
  };

  // Handle logout
  const handleLogout = () => {
    setProfileMenuOpen(false);
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  };

  // Get user avatar and name for header
  const userAvatar = session?.responseUserDTO?.imageUrl || defaultAvatar;
  const userDisplayName = session?.responseUserDTO?.userName || "مستخدم";
  const userId = session?.responseUserDTO?.id || currentUserId;

  // Handle click outside menus
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (event) => {
      const menuEl = profileMenuRef.current;
      const triggerEl = profileTriggerRef.current;
      if (menuEl && triggerEl && !menuEl.contains(event.target) && !triggerEl.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isNotificationMenuOpen) return;
    const handleClickOutside = (event) => {
      const menuEl = notificationMenuRef.current;
      const triggerEl = notificationTriggerRef.current;
      if (menuEl && triggerEl && !menuEl.contains(event.target) && !triggerEl.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationMenuOpen]);

  if (loading) {
    // التحقق من isOwnProfile بناءً على profileUserId و currentUserId
    // نعرض الهيدر فقط إذا:
    // 1. profileUserId موجود في الرابط (يعني بروفايل مستخدم آخر)
    // 2. currentUserId متوفر (للتأكد من أننا لسنا في حالة غير محددة)
    // 3. profileUserId مختلف عن currentUserId (ليس بروفايل المستخدم الحالي)
    const shouldShowHeader = profileUserId && currentUserId && Number(profileUserId) !== Number(currentUserId);
    const unreadCountLoading = notificationData?.unreadCount || 0;
    
    return (
      <div className="profile-page profile-page--loading">
        {/* Header أثناء التحميل - يظهر فقط إذا كان profileUserId موجوداً وليس بروفايل المستخدم الحالي */}
        {shouldShowHeader && (
          <header className="landing-header landing-header--auth dashboard-home__header">
            <LandingNav
              className="landing-nav--with-divider"
              links={NAV_LINKS}
              onLinkClick={handleNavClick}
              activeTab={null}
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
                      {unreadCountLoading > 0 && (
                        <span className="dashboard-home__notification-badge">{unreadCountLoading}</span>
                      )}
                    </button>
                  </div>
                </div>
              }
            />
          </header>
        )}
        
        {/* Loading Content */}
        <div className="profile-loading-container">
          <div className="profile-loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="profile-loading-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "--";

  return (
    <>
      {/* Header - يظهر فقط إذا لم يكن صاحب البروفايل */}
      {!isOwnProfile && (
        <header className="landing-header landing-header--auth dashboard-home__header">
          <LandingNav
            className="landing-nav--with-divider"
            links={NAV_LINKS}
            onLinkClick={handleNavClick}
            activeTab={null}
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
                        position: "absolute",
                        top: `${notificationMenuPosition?.top ?? 0}px`,
                        right: `${notificationMenuPosition?.right ?? 0}px`,
                        zIndex: 5000,
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
                <button className="dashboard-home__icon" title="الوضع الليلي" type="button">
                  <i className="bx bx-moon" aria-hidden="true" />
                </button>
              </div>
            }
          />
          {isProfileMenuOpen && (
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
                onClick={handleProfileView}
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
          )}
        </header>
      )}

      <section className="profile-page">
      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div style={{ position: "relative", display: "inline-block", margin: "0 auto" }}>
              <img src={profile.imageUrl} alt={profile.userName} className="profile-avatar" />
              {/* نقطة خضراء للحالة */}
              {!isOwnProfile && (
                <span 
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: isOnline ? "#10b981" : "#6b7280",
                    border: "3px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }}
                  title={isOnline ? "متصل الآن" : "غير متصل"}
                />
              )}
            </div>
            <div className="profile-name">{profile.userName}</div>
            <div className="profile-username">{profile.email}</div>
            
            <div className="profile-actions">
              {isOwnProfile ? (
                <>
                  <button 
                    className="profile-action-btn profile-action-btn--primary" 
                    type="button"
                    onClick={() => navigate(`/submissions/${profile.id}`)}
                  >
                    محاولاتي
                  </button>
                  <button 
                    className="profile-action-btn profile-action-btn--secondary" 
                    type="button"
                    onClick={() => setShowEditProfile(true)}
                  >
                    تعديل الملف الشخصي
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={`profile-action-btn profile-action-btn--primary ${isFollowing ? "profile-action-btn--unfollow" : ""}`}
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followBusy}
                  >
                    {followBusy ? "جاري..." : isFollowing ? "إلغاء المتابعة" : "متابعة"}
                  </button>
                  {isFollowing && (
                    <button 
                      className={`profile-action-btn profile-action-btn--bell ${bellActive ? "profile-action-btn--bell-active" : ""}`}
                      type="button"
                      onClick={handleBellClick}
                      disabled={bellBusy}
                      title={bellActive ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}
                    >
                      {bellBusy ? "..." : bellActive ? "🔔" : "🔕"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="profile-info-rows">
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  <img src={emailIcon} alt="Email" />
                </span>
                <span className="profile-info-value">{profile.email}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  <img src={universityIcon} alt="University" />
                </span>
                <span className="profile-info-value">{profile.universityName || "جامعة الشرق الأوسط"}</span>
        </div>
              <div className="profile-info-row">
                <span className="profile-info-icon">
                  {profile.country?.iconUrl ? (
                    <img src={profile.country.iconUrl} alt={profile.country.nameCountry} style={{ width: "20px", height: "14px", borderRadius: "2px" }} />
                  ) : "🇯🇴"}
                </span>
                <span className="profile-info-value">{profile.country?.nameCountry || "الأردن - عمان"}</span>
        </div>
      </div>

            <div className="profile-stats-summary">
              <div className="profile-stat-summary-item">
                <div className="profile-stat-summary-label">
                  <img src={dateRangeIcon} alt="السلسلة الحالية" className="profile-stat-summary-icon" />
                  <span>السلسلة الحالية</span>
                </div>
                <div className="profile-stat-summary-value">{animatedStreakDay}</div>
              </div>
              <div className="profile-stat-summary-item">
                <div className="profile-stat-summary-label">
                  <img src={dateRangeIcon} alt="أكبر سلسلة التزام" className="profile-stat-summary-icon" />
                  <span>أكبر سلسلة التزام</span>
                </div>
                <div className="profile-stat-summary-value">{animatedMaxStreak}</div>
        </div>
        </div>
        </div>
        </aside>

        <div className="profile-main">
          {/* Problems Solved and Acceptance Rate Row */}
          <div className="profile-sections-row">
            {/* Problems Solved Section */}
            <div className="profile-section profile-section--problems">
              <div className="profile-section-header">
                <h2 className="profile-section-title">المشاكل المحلولة</h2>
      </div>

              <div className="progress-circles-container">
                {[
                  { id: "easy", label: "سهل", value: profile.easyProblemsSolvedCount, animatedValue: animatedEasy, total: EASY_TOTAL, color: "#10b981" },
                  { id: "medium", label: "متوسط", value: profile.mediumProblemsSolvedCount, animatedValue: animatedMedium, total: MEDIUM_TOTAL, color: "#f59e0b" },
                  { id: "hard", label: "صعب", value: profile.hardProblemsSolvedCount, animatedValue: animatedHard, total: HARD_TOTAL, color: "#ef4444" },
                ].map((item) => (
                  <div className="progress-circle-wrapper" key={item.id}>
                    <svg className="progress-circle" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                      <circle
                        cx="50"
                        cy="50"
                        r={circleRadius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth="4"
                        strokeDasharray={circleCircumference.toFixed(2)}
                        strokeDashoffset={getDashOffset(item.animatedValue, item.total)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                      />
                    </svg>
                    <div className="progress-circle-content">
                      <div className="progress-circle-value">{item.animatedValue}</div>
                      <div className="progress-circle-label">{item.label}</div>
                    </div>
                    <div className="progress-circle-total">{item.animatedValue}/{item.total}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceptance Rate Card */}
            <div className="profile-section profile-section--acceptance">
              <div className="acceptance-rate-container">
                <div className="stat-card stat-card--blue stat-card--acceptance">
                  <div className="acceptance-chart">
                    <svg className="acceptance-chart-svg" viewBox="0 0 140 140">
                      <circle
                        className="acceptance-chart-track"
                        cx="70"
                        cy="70"
                        r="60"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="18"
                      />
                      <circle
                        className="acceptance-chart-progress"
                        cx="70"
                        cy="70"
                        r="60"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="18"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - (profile.acceptanceRate / 100))}`}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                      />
                    </svg>
                  <div className="acceptance-chart-center">
                    <span className="acceptance-chart-percentage">{animatedAcceptanceRate}%</span>
                  </div>
                  </div>
                  <div className="stat-card-label">نسبة القبول</div>
                </div>
              </div>
        </div>
      </div>

          {/* Statistics Grid */}
          <div className="profile-section">
            <div className="stats-cards-grid">
              <div className="stat-card stat-card--peach">
                <img src={probIcon} alt="المشاكل المحاولة" className="stat-card-icon" />
                <div className="stat-card-label">عدد المشاكل المحلولة</div>
                <div className="stat-card-value">{animatedTotalSolved}/{TOTAL_PROBLEMS}</div>
              </div>
              
              <div className="stat-card stat-card--cyan">
                <img src={algathoimIcon} alt="عدد المحاولات" className="stat-card-icon" />
                <div className="stat-card-label">عدد المحاولات</div>
                <div className="stat-card-value">{animatedTotalSubmissions}</div>
              </div>
              
              <div className="stat-card stat-card--sage">
                <img src={followFansIcon} alt="المتابعين" className="stat-card-icon" />
                <div className="stat-card-label">المتابعين</div>
                <div className="stat-card-value">{animatedFollowers}</div>
              </div>
              
              <div className="stat-card stat-card--gold">
                <img src={followIcon} alt="يتابع" className="stat-card-icon" />
                <div className="stat-card-label">يتابع</div>
                <div className="stat-card-value">{animatedFollowing}</div>
              </div>
              
              <div className="stat-card stat-card--purple">
                <span className="stat-card-icon" style={{ fontSize: "2rem", display: "inline-block" }}>🔔</span>
                <div className="stat-card-label">المهتمون</div>
                <div className="stat-card-value">{animatedBellFollowers}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Footer - يظهر فقط إذا لم يكن صاحب البروفايل */}
      {!isOwnProfile && (
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
      )}

      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}

      {/* نافذة إعدادات الجرس */}
      {showBellModal && (
        <div className="modal-overlay" onClick={() => setShowBellModal(false)} style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            direction: "rtl"
          }}>
            <h2 style={{ marginBottom: "20px", fontSize: "1.25rem", fontWeight: "700" }}>إعدادات الإشعارات</h2>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={bellEmailChecked}
                  onChange={(e) => setBellEmailChecked(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>إشعارات عبر البريد الإلكتروني</span>
              </label>
              
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={bellAppChecked}
                  onChange={(e) => setBellAppChecked(e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>إشعارات في التطبيق</span>
              </label>
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowBellModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBellPreferences}
                disabled={bellBusy}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "white",
                  cursor: bellBusy ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  opacity: bellBusy ? 0.6 : 1
                }}
              >
                {bellBusy ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;
