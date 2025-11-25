import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";
import logoPart from "../../assets/logo_part.png";
import LandingNav from "../../components/LandingNav";
import discoverSearchIcon from "../../assets/Search_icon_section.png";
import codeSectionIcon from "../../assets/icon_section_code.png";
import craftedBadgeIcon from "../../assets/Component 16 (1).png";
import craftedHeartIcon from "../../assets/Vector (5).png";
import communityBadgeIcon from "../../assets/mark_quation.png";
import communityQuestionIcon from "../../assets/Osekai Rankings (2).png";
import communityCodeIcon from "../../assets/icon_tag.png";
import communityWordCreate from "../../assets/أبدع (1).png";
import communityWordShare from "../../assets/شارك (1).png";
import communityWordExcel from "../../assets/تميّز (1).png";
import logoMeta from "../../assets/logo_meta.png";
import logoGoogle from "../../assets/logo_google.png";
import logoMicrosoft from "../../assets/logo_microsoft.png";
import logoCisco from "../../assets/logo_cisco.png";
import logoAws from "../../assets/AWS-Logo-Gray 1 (1).png";
import logoTesla from "../../assets/tesla-logo-gray-a262 1 (1).png";
import logoIbm from "../../assets/IBM-Logo-Gray 1 (1).png";
import logoHuawei from "../../assets/huawei-logo-image-xe9bcp6dj3fkug8v 1 (1).png";
import ctaArrowIcon from "../../assets/Vector 11.png";
import foundersIcon from "../../assets/Component 20.png";

const craftedTeamMembers = [
  {
    name: "الاغر سكريه",
    image: "https://i.pravatar.cc/160?img=47",
  },
  {
    name: "بد الرحمان صافي",
    image: "https://i.pravatar.cc/160?img=15",
  },
  {
    name: "احمد نضال",
    image: "https://i.pravatar.cc/160?img=11",
  },
  {
    name: "سميؤ ما زن",
    image: "https://i.pravatar.cc/160?img=22",
  },
];

const navLinks = [
  { label: "استكشف", href: "#explore" },
  { label: "الأسئلة", href: "#questions" },
  { label: "المبرمج", href: "#coder" },
  { label: "تسجيل الدخول", href: "/login", navigate: true },
];

const footerLinks = [
  { label: "المكافآت", href: "#rewards" },
  { label: "الوظائف", href: "#jobs" },
  { label: "مركز المساعدة", href: "#help-center" },
  { label: "الشروط", href: "#terms" },
  { label: "الطلب", href: "#request" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("landing-scroll");
    return () => {
      document.body.classList.remove("landing-scroll");
    };
  }, []);

  const handleNavClick = (event, link) => {
    if (link.navigate) {
      event.preventDefault();
      navigate(link.href);
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <LandingNav
          links={navLinks}
          onLinkClick={handleNavClick}
          logo={<img src={logoPart} alt="عرب كودرز" />}
        />
        <div className="landing-header__content" id="explore">
          <div className="landing-hero__text">
            <h1>أسلوب جديد للتعلم</h1>
            <p>
              المنصة العربية الرائدة لتعلم البرمجة المتقدمة، وبناء خبرة عملية في
              حل المشكلات المعقدة
              <br />
              تحضير كامل لسوق العمل التقني.
            </p>
            <div className="landing-hero__actions">
              <button type="button" onClick={() => navigate("/signup")}>
                إنشاء حساب
              </button>
              {/* <button
                type="button"
                className="landing-hero__secondary"
                onClick={() => navigate("/login")}
              >
                تسجيل الدخول
              </button> */}
            </div>
          </div>
        </div>
      </header>
      <div className="landing-hero__visual">
        <div className="landing-hero__card landing-hero__card--main">
          <div className="landing-hero__card-inner">
            <div className="landing-hero__card-top">
              <div className="landing-hero__tiles">
                <span className="landing-hero__tile tile-blue" />
                <span className="landing-hero__tile tile-green" />
                <span className="landing-hero__tile tile-yellow" />
                <span className="landing-hero__tile tile-red" />
              </div>
              <div className="landing-hero__chart">
                <span className="landing-hero__chart-slice" />
              </div>
            </div>

            <div className="landing-hero__card-bottom">
              <div className="landing-hero__list">
                <span className="landing-hero__line line-wide" />
                <span className="landing-hero__line line-medium" />
                <span className="landing-hero__line line-wide" />
                <span className="landing-hero__line line-short" />
                <span className="landing-hero__line line-medium" />
              </div>
              <div className="landing-hero__side-widget">
                <div className="landing-hero__side-line">
                  <span className="status-dot dot-blue" />
                  <span className="side-bar" />
                </div>
                <div className="landing-hero__side-line">
                  <span className="status-dot dot-green" />
                  <span className="side-bar" />
                </div>
                <div className="landing-hero__side-line">
                  <span className="status-dot dot-yellow" />
                  <span className="side-bar" />
                </div>
                <div className="landing-hero__side-line">
                  <span className="status-dot dot-red" />
                  <span className="side-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="landing-main">
        <div className="landing-content-wrapper">
          <section
            className="landing-section landing-section--discover"
            id="discover"
          >
            <div className="discover-section">
              <div className="discover-illustration">
                <div className="discover-card discover-card--one">
                  <div className="dp-matrix-art">
                    <div className="dp-matrix-art__header" />
                    <svg
                      className="dp-matrix-svg"
                      viewBox="0 0 240 200"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient
                          id="dp-path-gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#58c9ff"
                            stopOpacity="0.95"
                          />
                          <stop
                            offset="100%"
                            stopColor="#63e6a5"
                            stopOpacity="0.9"
                          />
                        </linearGradient>
                        <linearGradient
                          id="dp-marker-gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#63e6a5" />
                          <stop offset="100%" stopColor="#2cc778" />
                        </linearGradient>
                      </defs>
                      <g className="dp-matrix-grid">
                        <rect
                          className="dp-cell"
                          x="20"
                          y="20"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0s" }}
                        />
                        <rect
                          className="dp-cell"
                          x="80"
                          y="20"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <rect
                          className="dp-cell"
                          x="140"
                          y="20"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <rect
                          className="dp-cell"
                          x="200"
                          y="20"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.3s" }}
                        />

                        <rect
                          className="dp-cell"
                          x="20"
                          y="80"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <rect
                          className="dp-cell is-path"
                          x="80"
                          y="80"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.5s" }}
                        />
                        <rect
                          className="dp-cell is-path"
                          x="140"
                          y="80"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <rect
                          className="dp-cell"
                          x="200"
                          y="80"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.7s" }}
                        />

                        <rect
                          className="dp-cell"
                          x="20"
                          y="140"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <rect
                          className="dp-cell is-path"
                          x="80"
                          y="140"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "0.9s" }}
                        />
                        <rect
                          className="dp-cell is-path pivot"
                          x="140"
                          y="140"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "1s" }}
                        />
                        <rect
                          className="dp-cell is-path"
                          x="200"
                          y="140"
                          width="42"
                          height="42"
                          rx="9"
                          ry="9"
                          style={{ animationDelay: "1.1s" }}
                        />
                      </g>

                      <g className="dp-matrix-connectors">
                        <polyline
                          className="dp-connector"
                          points="101,101 161,101 221,161"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <polyline
                          className="dp-connector is-secondary"
                          points="41,41 101,101 161,161"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </g>

                      <g className="dp-matrix-markers">
                        <rect
                          className="dp-marker"
                          fill="url(#dp-marker-gradient)"
                          x="32"
                          y="32"
                          width="16"
                          height="16"
                          rx="4"
                          ry="4"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <rect
                          className="dp-marker"
                          fill="url(#dp-marker-gradient)"
                          x="92"
                          y="92"
                          width="16"
                          height="16"
                          rx="4"
                          ry="4"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <rect
                          className="dp-marker"
                          fill="url(#dp-marker-gradient)"
                          x="152"
                          y="152"
                          width="16"
                          height="16"
                          rx="4"
                          ry="4"
                          style={{ animationDelay: "1s" }}
                        />
                      </g>
                    </svg>
                  </div>
                  <div className="discover-card__footer footer-blue" />
                </div>
                <div className="discover-card discover-card--two">
                  <div className="graph-tree-art">
                    <div className="graph-tree-art__header" />
                    <svg
                      className="algo-tree-svg"
                      viewBox="0 0 300 250"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <g className="algo-tree-edges">
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="30"
                          x2="70"
                          y2="70"
                          style={{ animationDelay: "0.5s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="30"
                          x2="110"
                          y2="70"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="30"
                          x2="150"
                          y2="70"
                          style={{ animationDelay: "0.7s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="30"
                          x2="190"
                          y2="70"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="30"
                          x2="230"
                          y2="70"
                          style={{ animationDelay: "0.9s" }}
                        />

                        <line
                          className="algo-tree-edge"
                          x1="70"
                          y1="70"
                          x2="50"
                          y2="110"
                          style={{ animationDelay: "1.0s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="110"
                          y1="70"
                          x2="130"
                          y2="110"
                          style={{ animationDelay: "1.1s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="150"
                          y1="70"
                          x2="150"
                          y2="110"
                          style={{ animationDelay: "1.2s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="190"
                          y1="70"
                          x2="210"
                          y2="110"
                          style={{ animationDelay: "1.3s" }}
                        />
                        <line
                          className="algo-tree-edge"
                          x1="230"
                          y1="70"
                          x2="250"
                          y2="110"
                          style={{ animationDelay: "1.4s" }}
                        />
                      </g>

                      <g className="algo-tree-nodes">
                        <circle
                          className="algo-tree-node root-node"
                          cx="150"
                          cy="30"
                          r="12"
                          style={{ animationDelay: "0s" }}
                        />
                        <circle
                          className="algo-tree-node first-level"
                          cx="70"
                          cy="70"
                          r="12"
                          style={{ animationDelay: "0.5s" }}
                        />
                        <circle
                          className="algo-tree-node first-level"
                          cx="110"
                          cy="70"
                          r="12"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <circle
                          className="algo-tree-node first-level"
                          cx="150"
                          cy="70"
                          r="12"
                          style={{ animationDelay: "0.7s" }}
                        />
                        <circle
                          className="algo-tree-node first-level"
                          cx="190"
                          cy="70"
                          r="12"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <circle
                          className="algo-tree-node first-level"
                          cx="230"
                          cy="70"
                          r="12"
                          style={{ animationDelay: "0.9s" }}
                        />

                        <circle
                          className="algo-tree-node second-level"
                          cx="50"
                          cy="110"
                          r="12"
                          style={{ animationDelay: "1.0s" }}
                        />
                        <circle
                          className="algo-tree-node second-level"
                          cx="130"
                          cy="110"
                          r="12"
                          style={{ animationDelay: "1.1s" }}
                        />
                        <circle
                          className="algo-tree-node second-level"
                          cx="150"
                          cy="110"
                          r="12"
                          style={{ animationDelay: "1.2s" }}
                        />
                        <circle
                          className="algo-tree-node second-level"
                          cx="210"
                          cy="110"
                          r="12"
                          style={{ animationDelay: "1.3s" }}
                        />
                        <circle
                          className="algo-tree-node second-level"
                          cx="250"
                          cy="110"
                          r="12"
                          style={{ animationDelay: "1.4s" }}
                        />
                      </g>
                    </svg>
                  </div>
                  <div className="discover-card__footer footer-blue" />
                </div>
                <div className="discover-card discover-card--three">
                  <div className="graph-network-art">
                    <div className="graph-network-art__header" />
                    <svg
                      className="algo-graph-svg"
                      viewBox="0 0 260 200"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <g className="algo-graph-edges">
                        <line
                          className="algo-graph-edge"
                          x1="60"
                          y1="40"
                          x2="130"
                          y2="30"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="130"
                          y1="30"
                          x2="200"
                          y2="60"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="60"
                          y1="40"
                          x2="90"
                          y2="100"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="90"
                          y1="100"
                          x2="150"
                          y2="90"
                          style={{ animationDelay: "1.0s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="150"
                          y1="90"
                          x2="200"
                          y2="60"
                          style={{ animationDelay: "1.2s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="150"
                          y1="90"
                          x2="210"
                          y2="130"
                          style={{ animationDelay: "1.4s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="90"
                          y1="100"
                          x2="140"
                          y2="150"
                          style={{ animationDelay: "1.6s" }}
                        />
                        <line
                          className="algo-graph-edge"
                          x1="60"
                          y1="40"
                          x2="40"
                          y2="130"
                          style={{ animationDelay: "1.8s" }}
                        />
                      </g>

                      <g className="algo-graph-nodes">
                        <circle
                          className="algo-graph-node"
                          cx="60"
                          cy="40"
                          r="12"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="130"
                          cy="30"
                          r="12"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="200"
                          cy="60"
                          r="12"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="90"
                          cy="100"
                          r="12"
                          style={{ animationDelay: "1.0s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="150"
                          cy="90"
                          r="12"
                          style={{ animationDelay: "1.2s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="210"
                          cy="130"
                          r="12"
                          style={{ animationDelay: "1.4s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="140"
                          cy="150"
                          r="12"
                          style={{ animationDelay: "1.6s" }}
                        />
                        <circle
                          className="algo-graph-node"
                          cx="40"
                          cy="130"
                          r="12"
                          style={{ animationDelay: "1.8s" }}
                        />
                      </g>
                    </svg>
                  </div>
                  <div className="discover-card__footer footer-green graph-footer" />
                </div>
              </div>

              <div className="discover-copy">
                <div className="discover-copy__title">
                  <img
                    src={discoverSearchIcon}
                    alt="بحث"
                    className="discover-copy__icon-img"
                  />
                  <h2>اكتشف عالم الخوارزميات</h2>
                </div>
                <p>
                  <strong>
                    هي بوابتك المنظمة لإتقان الخوارزميات. إبدأ بتعلم مفهوم جديد،
                    ثم طبّقه مباشرة على مشاكل حقيقية لبناء مهاراتك خطوة بخطوة.
                  </strong>
                </p>
                <button type="button" className="discover-cta">
                  اكتشف الآن
                </button>
              </div>
            </div>
          </section>

          <section
            className="landing-section landing-section--community"
            id="questions"
          >
            <div className="community-section">
              <img
                src={communityBadgeIcon}
                alt="شارة إنجاز"
                className="community-floating community-floating--badge"
              />
              <img
                src={communityCodeIcon}
                alt="شيفرة"
                className="community-floating community-floating--code"
              />
              <div className="community-floating-column">
                <img
                  src={communityWordShare}
                  alt="شارك"
                  className="community-floating community-floating--share"
                />
                <img
                  src={communityWordCreate}
                  alt="أبدع"
                  className="community-floating community-floating--create"
                />
                <img
                  src={communityWordExcel}
                  alt="تميّز"
                  className="community-floating community-floating--excel"
                />
              </div>

              <div className="community-card">
                <div className="community-card__title">
                  <h2>الأسئلة والمجتمع والمسابقات</h2>
                  <img
                    src={communityQuestionIcon}
                    alt="أيقونة المجتمع"
                    className="community-card__title-icon"
                  />
                </div>
                <p>
                  تعرف على أكثر من ٣٥٠٠ سؤال، وانضم إلى واحد من أكبر مجتمعات
                  التقنية التي تضم مئات الآلاف من الأعضاء النشطين. شارك في
                  مسابقاتنا، تحدَّ نفسك، وكن جزءًا من عالم الإبداع والمكافآت.
                </p>
                <button type="button" className="community-card__cta">
                  اكتشف الآن
                </button>
              </div>
            </div>
          </section>

          <div className="landing-transition landing-transition--community" />

          <section className="landing-section landing-section--coder">
            <div className="coder-section" id="coder">
              <img src={codeSectionIcon} alt="أيقونة المبرمج" className="coder-section__icon" />
              <div className="coder-section__intro">
                <h2 className="coder-section__title">المبرمج</h2>
                <p className="coder-section__description">
                  يدعم عرب كودرز أكثر من 10 لغة برمجية من الأكثر استخداماً حول العالم، لنضع المطورين على قلب التطورات.
                  نوفر أدوات ذكية لتجربة الأكواد وتشغيلها وتخصيص الخطط، وبناء المشاريع بشكل مرن ومتدرج.
                </p>
              </div>
              <div className="coder-section__layout">
                <div className="coder-editor coder-editor--embed" dir="ltr">
                  <iframe
                    src="https://onecompiler.com/embed/python"
                    title="Python Playground"
                    width="100%"
                    height="600"
                    frameBorder="0"
                    className="coder-editor__iframe"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            className="landing-section landing-section--crafted"
            id="crafted"
          >
            <div className="crafted-section">
              <img src={craftedBadgeIcon} alt="رمز مصنوع في الأردن" className="crafted-section__badge" />
              <h2 className="crafted-section__title">
                مصنوع من
                <span className="crafted-section__heart">
                  <img src={craftedHeartIcon} alt="قلب" />
                </span>
                في الأردن
              </h2>
              <div className="crafted-section__text">
                <p>
                  في عرب كودرز، رسالتنا هي مساعدتك على تطوير مهاراتك والوصول إلى وظيفة أحلامك؛ نوفر لك مجموعة ضخمة من الموارد والتجارب العملية التي تم بناؤها مع خبراء التوظيف في أكبر الشركات التقنية عالمياً.
                </p>
                <p>
                  نستخلص من هذه الخبرة مئات المسارات التدريبية والمراجعات التطبيقية التي تضمن لك تقدماً متدرجاً وواضح المعالم حتى تصل إلى جاهزية كاملة للمقابلات التقنية.
                </p>
                <p>
                  هدفنا مساعدتك لتصبح جزءاً من أفضل الفرق التقنية حول العالم.
                </p>
              </div>
              <div className="crafted-section__logos" role="group" aria-label="شركاء النجاح">
                <img src={logoMeta} alt="Meta" />
                <img src={logoGoogle} alt="Google" />
                <img src={logoMicrosoft} alt="Microsoft" />
                <img src={logoCisco} alt="Cisco" />
              </div>
              <div className="crafted-section__logos crafted-section__logos--secondary" role="group" aria-label="شركاء النجاح">
                <img src={logoAws} alt="AWS" />
                <img src={logoTesla} alt="Tesla" />
                <img src={logoIbm} alt="IBM" />
                <img src={logoHuawei} alt="Huawei" />
              </div>
              <div className="crafted-section__divider" aria-hidden="true" />
              <p className="crafted-section__cta">
                إذا كنت متحمسًا لمعالجة بعض المشكلات الأكثر إثارة للاهتمام، فسنكون سعداء بسماع رأيك.
              </p>
              <button type="button" className="crafted-section__cta-button">
                <img src={ctaArrowIcon} alt="" aria-hidden="true" />
                انضم إلى فريقنا
              </button>
              <div className="crafted-team">
                <div className="crafted-team__label">
                  <img src={foundersIcon} alt="" className="crafted-team__label-icon" />
                  <span>فريق التأسيس</span>
                </div>
                <div className="crafted-team__list">
                  {craftedTeamMembers.map((member) => (
                    <div className="crafted-team__member" key={member.name}>
                      <img
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        className="crafted-team__avatar"
                      />
                      <span className="crafted-team__name">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="landing-footer" aria-label="تذييل الصفحة">
        <div className="landing-footer__row">
          <span className="landing-footer__text landing-footer__text--flag">
            المملكة الأردنية الهاشمية 🇯🇴
          </span>
          <ul className="landing-footer__nav" role="list">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          <span className="landing-footer__text">
            حقوق الابتكار والنشر © عرب كودرز
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
