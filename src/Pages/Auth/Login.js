
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "./AuthCard";
import LandingNav from "../../components/LandingNav";
import logoPart from "../../assets/logo_part.png";
import "./login.css";

const navLinks = [
  { label: "استكشف", href: "#explore" },
  { label: "الأسئلة", href: "#questions" },
  { label: "المبرمج", href: "#coder" },
  { label: "تسجيل الدخول", to: "/login" },
];

const Login = () => {
  const navigate = useNavigate();

  const handleNavClick = useCallback(
    (event, link) => {
      if (link.to === "/login") {
        event.preventDefault();
        return;
      }

      if (link.href?.startsWith("#")) {
        event.preventDefault();
        navigate(`/${link.href}`);
      }
    },
    [navigate]
  );

  return (
    <div className="login-page">
      <header className="landing-header landing-header--auth">
        <LandingNav
          links={navLinks}
          onLinkClick={handleNavClick}
          logo={<img src={logoPart} alt="عرب كودرز" />}
        />
      </header>

      <main className="login-page__main">
        <div className="login-card-container">
          <AuthCard initialMode="login" showHeader={false} showFooter={false} />
        </div>
      </main>

      <footer className="landing-footer--auth">
        <div className="landing-footer__row">
          <span className="landing-footer__text landing-footer__text--flag">
          🇯🇴  المملكة الأردنية الهاشمية 
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
          <span className="landing-footer__text">
            حقوق الابتكار والنشر © عرب كودرز
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Login;