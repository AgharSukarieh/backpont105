import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAuthSession } from "../../store/authSlice";
import { getAllGeneralInfoUser } from "../../Service/ProblemService";
import { getUserById } from "../../Service/userService";
import EditProfile from "./EditProfile";
import emailIcon from "../../assets/emaill.png";
import universityIcon from "../../assets/unv.png";
import tryIcon from "../../assets/try.png";
import probSolvingIcon from "../../assets/prob_solving.png";
import dateRangeIcon from "../../assets/Date_range_duotone.png";
import probIcon from "../../assets/prob.png";
import algathoimIcon from "../../assets/algathoim.png";
import followFansIcon from "../../assets/follow_fans.png";
import followIcon from "../../assets/follow_icon.png";
import "./userProfile.css";

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
  const session = useSelector(selectAuthSession);
  const navigate = useNavigate();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [generalInfo, setGeneralInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);

  // جلب المعلومات العامة للمسائل وبيانات المستخدم المحدثة
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب المعلومات العامة
        const generalData = await getAllGeneralInfoUser();
        console.log("📊 General Info:", generalData);
        setGeneralInfo(generalData);

        // جلب بيانات المستخدم المحدثة
        const userId = session?.responseUserDTO?.id;
        if (userId) {
          const userData = await getUserById(userId);
          console.log("👤 User Stats:", userData);
          setUserStats(userData);
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };
    fetchData();
  }, [session?.responseUserDTO?.id]);

  const profile = useMemo(() => {
    if (!session || !session.responseUserDTO) return null;
    const user = session.responseUserDTO;
    // استخدام البيانات المحدثة من userStats إذا كانت متوفرة
    const stats = userStats || user;
    return {
      id: user.id ?? "-",
      email: user.email ?? session.email ?? "--",
      userName: user.userName ?? session.username ?? "مستخدم عرب كودرز",
      imageUrl: user.imageUrl ?? "https://via.placeholder.com/120x120.png?text=Profile",
      registerAt: user.registerAt ?? null,
      role: user.role ?? session.role ?? "User",
      country: user.country ?? null,
      acceptanceRate: stats.acceptanceRate ?? 0,
      totalSubmissions: stats.totalSubmissions ?? 0,
      totalProblemsSolved: stats.totalProblemsSolved ?? 0,
      easyProblemsSolvedCount: stats.easyProblemsSolvedCount ?? 0,
      mediumProblemsSolvedCount: stats.mediumProblemsSolvedCount ?? 0,
      hardProblemsSolvedCount: stats.hardProblemsSolvedCount ?? 0,
      streakDay: stats.streakDay ?? 0,
      maxStreak: stats.maxStreak ?? 0,
      following: stats.following ?? 0,
      followers: stats.followers ?? 0,
      universityName: user.universityName ?? null,
      tagSolvedCounts: stats.tagSolvedCounts ?? [],
    };
  }, [session, userStats]);

  // استخدام الأرقام من الـ API
  const EASY_TOTAL = generalInfo?.contEasyProblems ?? 1954;
  const MEDIUM_TOTAL = generalInfo?.counMidumProblems ?? 1954;
  const HARD_TOTAL = generalInfo?.countHardProblems ?? 1954;
  const TOTAL_PROBLEMS = generalInfo?.countProblems ?? 38542;

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

  if (!profile) {
    return <div className="profile-empty-state">لا توجد بيانات مستخدم لعرضها حالياً.</div>;
  }

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "--";

  return (
    <>
      <section className="profile-page">
      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <img src={profile.imageUrl} alt={profile.userName} className="profile-avatar" />
            <div className="profile-name">{profile.userName}</div>
            <div className="profile-username">{profile.email}</div>
            
            <div className="profile-actions">
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
            </div>
          </div>
        </div>
      </div>
    </section>

      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}
    </>
  );
};

export default UserProfile;
