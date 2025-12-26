import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem("admin-theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("admin-theme", theme);
    
    // Apply theme to document and all admin pages
    const adminContainer = document.querySelector(".admin-dashboard");
    const allAdminPages = document.querySelectorAll(".admin-dashboard, .admin-dashboard__main, .admin-dashboard__content-wrapper");
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      if (adminContainer) adminContainer.classList.add("dark-mode");
      allAdminPages.forEach(page => page.classList.add("dark-mode"));
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
      if (adminContainer) adminContainer.classList.remove("dark-mode");
      allAdminPages.forEach(page => page.classList.remove("dark-mode"));
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === "dark",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

