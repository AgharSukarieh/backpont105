import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./LandingNav.css";

const defaultLinks = [
  { label: "استكشف", href: "#explore" },
  { label: "الأسئلة", href: "#questions" },
  { label: "المبرمج", href: "#coder" },
  { label: "تسجيل الدخول", to: "/login" },
];

const LandingNav = ({
  logo,
  links = defaultLinks,
  onLinkClick,
  actions,
  className = "",
  activeTab,
}) => {
  const location = useLocation();
  const [activeTarget, setActiveTarget] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return window.location.hash;
    }
    const first = links[0];
    return first?.href ?? first?.to ?? "";
  });

  const memoizedLinks = useMemo(() => links, [links]);

  useEffect(() => {
    if (location.hash) {
      setActiveTarget(location.hash);
    } else {
      const currentPath = location.pathname;
      const matched = memoizedLinks.find((link) => {
        const target = link.to ?? link.href;
        return target === currentPath && !(target?.startsWith("#"));
      });
      if (matched) {
        setActiveTarget(matched.to ?? matched.href);
      }

    }
  }, [location.hash, location.pathname, memoizedLinks]);

  const scrollToSection = (hash) => {
    if (!hash?.startsWith("#")) return;
    const id = hash.slice(1);
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClick = (event, link, targetType, targetValue) => {
    if (targetType === "anchor") {
      event.preventDefault();
      setActiveTarget(targetValue);
      scrollToSection(targetValue);
    } else if (targetType === "route") {
      setActiveTarget(targetValue);
    }

    if (onLinkClick) {
      onLinkClick(event, link);
    }
  };

  const navClassName = ["landing-nav", className].filter(Boolean).join(" ");

  return (
    <nav className={navClassName}>
      <div className="landing-nav__primary">
        <div className="landing-nav__logo">{logo}</div>
        <ul className="landing-nav__links">
        {memoizedLinks.map((link) => {
          const target = link.to ?? link.href ?? "#";
          const isAnchor = target.startsWith("#");
          const isExternal = target.startsWith("http");
          // إذا كان activeTab موجوداً، استخدمه لتحديد النشاط
          const isActive = activeTab 
            ? (isAnchor && `#${activeTab}` === target)
            : activeTarget === target;
          const content = (
            <span className={`landing-nav__link ${isActive ? "active" : ""}`}>
              {link.label}
            </span>
          );

          return (
            <li key={link.label}>
              {isExternal ? (
                <a
                  href={target}
                  onClick={(event) => handleClick(event, link, "external", target)}
                  target={link.newTab ? "_blank" : "_self"}
                  rel="noreferrer"
                >
                  {content}
                </a>
              ) : isAnchor ? (
                <a href={target} onClick={(event) => handleClick(event, link, "anchor", target)}>
                  {content}
                </a>
              ) : (
                <Link to={target} onClick={(event) => handleClick(event, link, "route", target)}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
        
        </ul>
      </div>
      {actions ? <div className="landing-nav__actions">{actions}</div> : null}
    </nav>
  );
};

export default LandingNav;



