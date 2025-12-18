import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Hook/UserContext";
import { loginUser, verifyOtp, sendOtp, sendOtpForRestorePassword, restorePassword } from "../../Service/userService";
import "./Style/style.css";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";

import logoPart from "../../assets/logo_part.png";
import ellipse10 from "../../assets/Ellipse10.png";
import vectorStroke from "../../assets/Vector(Stroke).png";
import vectorStroke1 from "../../assets/Vector(Stroke)(1).png";
import vectorStroke2 from "../../assets/Vector(Stroke)(2).png";
import vectorStroke3 from "../../assets/Vector(Stroke)(3).png";
import tree from "../../assets/tree.png";
import carBody from "../../assets/car_body.png";
import wheel from "../../assets/wheel.png";
import vectorStrokeLine from "../../assets/VectorStroke.png";
import vectorStroke6 from "../../assets/Vector(Stroke)(6).png";
import logoCard from "../../assets/logo_card.png";
import eyeHide from "../../assets/eye_hide.png";
import eyeShow from "../../assets/eye_show.png";
import backCarBody from "../../assets/back_car_body.png";
import carBodyWithoutTyer from "../../assets/car_body_without_tyer.png";
import forwardCarBody from "../../assets/forword_car_body.png";
import copyrightImg from "../../assets/copyright.png";

const BOXICON_LINK_ID = "auth-boxicons-link";
const BOXICON_HREF = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
const REGISTER_URL = "http://arabcodetest.runasp.net/api/auth/register";
const COUNTRIES_URL = "http://arabcodetest.runasp.net/Country/GetAllCountries";

const DEFAULT_COUNTRIES = [
  { id: 1, name: "الأردن" },
  { id: 2, name: "فلسطين" },
  { id: 3, name: "السعودية" },
  { id: 4, name: "الإمارات" },
  { id: 5, name: "مصر" },
];

const REMEMBER_KEY = "auth-remember";
const LEGACY_REMEMBER_KEY = "rememberedEmail";

const loadRememberedCredentials = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        email: typeof parsed?.email === "string" ? parsed.email : "",
        remember: Boolean(parsed?.remember),
      };
    }

    // Legacy fallback to the previous implementation.
    const legacyEmail = localStorage.getItem(LEGACY_REMEMBER_KEY);
    if (legacyEmail) {
      return { email: legacyEmail, remember: true };
    }
  } catch (error) {
    console.warn("Failed to load remembered credentials", error);
  }

  return null;
};

const persistRememberedCredentials = ({ email, remember }) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    email: email ?? "",
    remember: Boolean(remember),
  };

  try {
    if (payload.remember && payload.email) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(payload));
      localStorage.setItem(LEGACY_REMEMBER_KEY, payload.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(LEGACY_REMEMBER_KEY);
    }
  } catch (error) {
    console.warn("Failed to persist remembered credentials", error);
  }
};

const clearRememberedCredentials = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(LEGACY_REMEMBER_KEY);
};

const ensureBoxicons = () => {
  if (!document.getElementById(BOXICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = BOXICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = BOXICON_HREF;
    document.head.appendChild(link);
  }
};

const removeBoxicons = () => {
  const link = document.getElementById(BOXICON_LINK_ID);
  if (link) {
    document.head.removeChild(link);
  }
};

const showAlert = (message, type = "info") => {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: 'Lemonade', cursive;
    `;

  const colors = {
    success: { bg: "#d4edda", text: "#155724", border: "#c3e6cb" },
    error: { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" },
    info: { bg: "#d1ecf1", text: "#0c5460", border: "#bee5eb" },
  };

  const color = colors[type] || colors.info;
  alertDiv.style.backgroundColor = color.bg;
  alertDiv.style.color = color.text;
  alertDiv.style.border = `1px solid ${color.border}`;

  if (!document.querySelector("style[data-alert-animation]")) {
    const style = document.createElement("style");
    style.setAttribute("data-alert-animation", "true");
    style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
    document.head.appendChild(style);
  }

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
};

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const AuthCard = ({
  initialMode = "login",
  showHeader = true,
  showFooter = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setUser } = useContext(UserContext);
  const containerRef = useRef(null);

  const rememberedCredentials = useMemo(() => loadRememberedCredentials(), []);

  const [isFlipped, setIsFlipped] = useState(initialMode === "signup");

  const [loginEmail, setLoginEmail] = useState(rememberedCredentials?.email ?? "");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(
    rememberedCredentials?.remember ?? Boolean(rememberedCredentials?.email)
  );
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCountry, setSignupCountry] = useState("");
  const [signupRemember, setSignupRemember] = useState(true);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [signupImage, setSignupImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [showIllustrations, setShowIllustrations] = useState(true);
  
  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingSignupData, setPendingSignupData] = useState(null);

  // Forgot Password states
  const [showForgotPasswordEmailModal, setShowForgotPasswordEmailModal] = useState(false);
  const [showForgotPasswordOtpModal, setShowForgotPasswordOtpModal] = useState(false);
  const [showForgotPasswordNewPasswordModal, setShowForgotPasswordNewPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  useEffect(() => {
    const updateIllustrationsVisibility = () => {
      setShowIllustrations(window.innerWidth > 768);
    };

    updateIllustrationsVisibility();
    window.addEventListener("resize", updateIllustrationsVisibility);

    return () => window.removeEventListener("resize", updateIllustrationsVisibility);
  }, []);


  useEffect(() => {
    ensureBoxicons();
    return () => removeBoxicons();
  }, []);

  // Timer لإعادة إرسال OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // التحقق من OTP وإكمال التسجيل
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showAlert("الرجاء إدخال رمز التحقق", "error");
      return;
    }

    if (!pendingSignupData) {
      showAlert("خطأ في البيانات المؤقتة", "error");
      return;
    }

    setOtpLoading(true);
    try {
      const otpValue = otp.trim();
      
      console.log("Creating account with OTP:", {
        email: pendingSignupData.trimmedEmail,
        otp: otpValue
      });

      // إرسال بيانات التسجيل مع OTP (POST request مع query parameters و FormData)
      const queryParams = new URLSearchParams({
        Email: pendingSignupData.trimmedEmail,
        Password: pendingSignupData.trimmedPassword,
        UserName: pendingSignupData.trimmedUsername,
        CountryId: pendingSignupData.signupCountry,
        otp: otpValue, // lowercase كما في API documentation
      });

      // استخدام POST مع multipart/form-data
      const formData = new FormData();
      if (pendingSignupData.signupImage) {
        formData.append("Image", pendingSignupData.signupImage);
      } else {
        // إرسال FormData فارغ إذا لم تكن هناك صورة
        formData.append("Image", "");
      }

      const response = await fetch(`${REGISTER_URL}?${queryParams.toString()}`, {
        method: "POST",
        body: formData,
        // لا نضيف Content-Type header - المتصفح سيضيفه تلقائياً مع boundary
      });

      let data = null;
      let rawResponse = "";
      try {
        rawResponse = await response.text();
        data = rawResponse ? JSON.parse(rawResponse) : null;
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        const errorsMessage = Array.isArray(data?.errors)
          ? data.errors.join(" ")
          : "";
        const message =
          data?.message ||
          errorsMessage ||
          rawResponse ||
          "حدث خطأ أثناء إنشاء الحساب. يرجى التحقق من البيانات ورمز OTP.";
        throw new Error(message);
      }

      if (!data?.isAuthenticated || !data?.token) {
        throw new Error(data?.message || "فشل إنشاء الحساب، يرجى التحقق من رمز OTP.");
      }

      const payload = decodeJwt(data.token);
      const resolvedUserId =
        data.responseUserDTO?.id ??
        payload?.uid ??
        payload?.sub ??
        Date.now();
      const resolvedName =
        data.responseUserDTO?.fullName ??
        data.username ??
        pendingSignupData.trimmedUsername;
      const resolvedEmail = data.email ?? pendingSignupData.trimmedEmail;

      // لا نقوم بتسجيل الدخول تلقائياً، بل ننتقل إلى كارت تسجيل الدخول
      // حفظ البريد الإلكتروني للاستخدام في كارت تسجيل الدخول
      setLoginEmail(resolvedEmail);
      
      // إغلاق modal OTP ومسح البيانات
      setShowOtpModal(false);
      setOtp("");
      setPendingSignupData(null);
      
      // الانتقال إلى كارت تسجيل الدخول
      setIsFlipped(false);
      
      // إظهار رسالة نجاح
      showAlert("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول", "success");
    } catch (error) {
      showAlert(error.message || "خطأ أثناء التحقق من OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  // Forgot Password handlers
  const handleForgotPasswordClick = () => {
    setShowForgotPasswordEmailModal(true);
    setForgotPasswordEmail(loginEmail || ""); // إذا كان المستخدم قد أدخل البريد في كارت تسجيل الدخول
    setForgotPasswordOtp("");
    setForgotPasswordNewPassword("");
  };

  const handleSendForgotPasswordOtp = async () => {
    if (!forgotPasswordEmail.trim()) {
      showAlert("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }

    if (!isValidEmail(forgotPasswordEmail.trim())) {
      showAlert("يرجى إدخال بريد إلكتروني صحيح", "error");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await sendOtpForRestorePassword(forgotPasswordEmail.trim());
      setShowForgotPasswordEmailModal(false);
      setShowForgotPasswordOtpModal(true);
      showAlert("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");
    } catch (error) {
      console.error("Error sending OTP for restore password:", error);
      showAlert(error.message || "حدث خطأ أثناء إرسال رمز التحقق", "error");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async () => {
    if (!forgotPasswordOtp.trim() || forgotPasswordOtp.length !== 6) {
      showAlert("يرجى إدخال رمز التحقق (6 أرقام)", "error");
      return;
    }

    // التحقق من OTP يتم عند تغيير كلمة المرور، لكن ننتقل للخطوة التالية
    setShowForgotPasswordOtpModal(false);
    setShowForgotPasswordNewPasswordModal(true);
  };

  const handleRestorePassword = async () => {
    if (!forgotPasswordOtp.trim()) {
      showAlert("يرجى إدخال رمز التحقق", "error");
      return;
    }

    if (!forgotPasswordNewPassword.trim()) {
      showAlert("يرجى إدخال كلمة السر الجديدة", "error");
      return;
    }

    if (forgotPasswordNewPassword.trim().length < 6) {
      showAlert("كلمة السر يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await restorePassword(forgotPasswordEmail.trim(), forgotPasswordOtp.trim(), forgotPasswordNewPassword.trim());
      showAlert("تم تغيير كلمة المرور بنجاح!", "success");
      setShowForgotPasswordNewPasswordModal(false);
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setForgotPasswordNewPassword("");
    } catch (error) {
      console.error("Error restoring password:", error);
      showAlert(error.message || "حدث خطأ أثناء تغيير كلمة المرور", "error");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // إعادة إرسال OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingSignupData) return;

    setOtpLoading(true);
    try {
      // استخدام نفس الدالة sendOtp المستخدمة أول مرة
      console.log("Resending OTP for:", pendingSignupData.trimmedEmail);
      await sendOtp(pendingSignupData.trimmedEmail);
      showAlert("تم إرسال رمز التحقق مرة أخرى", "success");
      setResendCooldown(60);
    } catch (error) {
      console.error("Error resending OTP:", error);
      showAlert(error.message || "خطأ في إعادة الإرسال", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    setIsFlipped(initialMode === "signup");
  }, [initialMode]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const response = await fetch(COUNTRIES_URL);
        if (!response.ok) {
          throw new Error("تعذّر تحميل قائمة الدول.");
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCountries(
            data.map((country) => ({
              id: country.id,
              name: country.nameCountry,
            }))
          );
        } else {
          setCountries(DEFAULT_COUNTRIES);
        }
      } catch (error) {
        console.error("خطأ في جلب الدول:", error);
        setCountries(DEFAULT_COUNTRIES);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const cardFlipContainer = containerRef.current?.querySelector(".card-flip-container");
    if (cardFlipContainer) {
      cardFlipContainer.classList.toggle("flipped", isFlipped);
    }
  }, [isFlipped]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheel1 = container.querySelector(".card-back .detached-wheel.wheel-1");
    const wheel2 = container.querySelector(".card-back .detached-wheel.wheel-2");
    const carMiddleBody = container.querySelector(".card-back .car-middle-body");
    const carForwardBody = container.querySelector(".card-back .car-forward-body");
    const carBackBody = container.querySelector(".card-back .car-back-body");

    const usernameFilled = signupUsername.trim().length > 0;
    const emailFilled = signupEmail.trim().length > 0;
    const passwordFilled = signupPassword.trim().length > 0;

    if (wheel1) {
      wheel1.classList.toggle("moving-to-car", usernameFilled);
      wheel1.classList.toggle("both-filled", usernameFilled && emailFilled);
    }

    if (wheel2) {
      wheel2.classList.toggle("moving-to-car", emailFilled);
      wheel2.classList.toggle("both-filled", usernameFilled && emailFilled);
    }

    if (carMiddleBody) {
      carMiddleBody.classList.remove("car-filled", "email-only", "both-filled");
      if (usernameFilled && emailFilled) {
        carMiddleBody.classList.add("both-filled");
      } else if (usernameFilled) {
        carMiddleBody.classList.add("car-filled");
      } else if (emailFilled) {
        carMiddleBody.classList.add("email-only");
      }
    }

    if (carForwardBody) {
      carForwardBody.classList.toggle("password-active", passwordFilled);
    }

    if (carBackBody) {
      carBackBody.classList.toggle("password-active", passwordFilled);
    }
  }, [signupUsername, signupEmail, signupPassword]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (isLoginSubmitting) {
      return;
    }

    const trimmedEmail = loginEmail.trim();
    const trimmedPassword = loginPassword.trim();

    if (!trimmedEmail) {
      showAlert("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      showAlert("يرجى إدخال بريد إلكتروني صحيح", "error");
      return;
    }
    if (!trimmedPassword) {
      showAlert("يرجى إدخال كلمة السر", "error");
      return;
    }

    setLoginErrorMessage("");

    try {
      setIsLoginSubmitting(true);
      const data = await loginUser(trimmedEmail, trimmedPassword);
      const responseUser = data?.responseUserDTO ?? {};

      console.log("Login response data:", responseUser);
      if (responseUser?.id !== undefined) {
        console.log("data.responseUserDTO.id:", responseUser.id);
      }

      if (!data?.token) {
        const fallbackMessage =
          data?.message || "خطأ في تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور";
        setLoginErrorMessage(fallbackMessage);
        showAlert(fallbackMessage, "error");
        return;
      }

      const tokenPayload = decodeJwt(data.token);
      const resolvedUserId =
        responseUser.id ??
        tokenPayload?.uid ??
        tokenPayload?.sub ??
        null;
      const resolvedUserName =
        responseUser.fullName ??
        responseUser.userName ??
        responseUser.name ??
        trimmedEmail;
      const resolvedUserEmail = responseUser.email ?? trimmedEmail;
      const resolvedRole = responseUser.role ?? data?.role ?? "User";

      const userContextValue = {
        ...responseUser,
        id: resolvedUserId ?? responseUser.id ?? Date.now(),
        name: resolvedUserName,
        email: resolvedUserEmail,
        role: resolvedRole,
      };

      const sessionPayload = {
        ...data,
        username: data?.username ?? resolvedUserName,
        email: data?.email ?? resolvedUserEmail,
        role: resolvedRole,
        responseUserDTO: responseUser,
        storedAt: new Date().toISOString(),
      };

      const enrichedUser = {
        ...userContextValue,
        session: sessionPayload,
      };

      setUser(enrichedUser);

      const tokenExpiration = Date.now() + 1000 * 60 * 60;

      if (resolvedUserId) {
        localStorage.setItem("idUser", resolvedUserId);
      }
      dispatch(
        setCredentials({
          token: data.token,
          tokenExpiration,
          role: resolvedRole,
          user: enrichedUser,
          session: sessionPayload,
        })
      );

      if (loginRemember) {
        persistRememberedCredentials({ email: trimmedEmail, remember: true });
      } else {
        clearRememberedCredentials();
      }

      setLoginPassword("");
      showAlert("تم تسجيل الدخول بنجاح!", "success");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      const message = error?.message || "خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً";
      setLoginErrorMessage(message);
      showAlert(message, "error");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  useEffect(() => {
    if (loginRemember) {
      persistRememberedCredentials({ email: loginEmail.trim(), remember: true });
    } else {
      clearRememberedCredentials();
    }
  }, [loginRemember, loginEmail]);

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmedUsername = signupUsername.trim();
    const trimmedEmail = signupEmail.trim();
    const trimmedPassword = signupPassword.trim();

    if (!trimmedUsername) {
      showAlert("يرجى إدخال اسم المستخدم", "error");
      return;
    }

    if (!trimmedEmail) {
      showAlert("يرجى إدخال البريد الإلكتروني", "error");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      showAlert("يرجى إدخال بريد إلكتروني صحيح", "error");
      return;
    }

    if (!trimmedPassword) {
      showAlert("يرجى إدخال كلمة السر", "error");
      return;
    }

    if (trimmedPassword.length < 6) {
      showAlert("كلمة السر يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }

    if (!signupCountry) {
      showAlert("يرجى اختيار الدولة", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // حفظ بيانات التسجيل المؤقتة
      setPendingSignupData({
        trimmedUsername,
        trimmedEmail,
        trimmedPassword,
        signupCountry,
        signupImage,
        signupRemember
      });

      // إرسال طلب لإرسال OTP باستخدام endpoint الصحيح
      console.log("Sending OTP request for:", trimmedEmail);
      await sendOtp(trimmedEmail);

      // عرض modal OTP
      setShowOtpModal(true);
      setResendCooldown(60);
      showAlert("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");
    } catch (error) {
      console.error("Error sending OTP:", error);
      showAlert(error.message || "حدث خطأ أثناء إرسال رمز التحقق.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const providerName = {
      facebook: "Facebook",
      google: "Google",
      linkedin: "LinkedIn",
    }[provider];

    showAlert(`جاري تسجيل الدخول عبر ${providerName}...`, "info");
  };

  const renderFrontIllustration = () => (
    <div className="illustration-section">
      <div className="scene">
        <div className="clouds-container">
          <div className="cloud cloud-0">
            <img src={vectorStroke} alt="Cloud 0" />
          </div>
          <div className="cloud cloud-1">
            <img src={vectorStroke1} alt="Cloud 1" />
          </div>
          <div className="bird bird-1">
            <img src={vectorStroke2} alt="Bird" />
          </div>
          <div className="bird bird-2">
            <img src={vectorStroke3} alt="Bird" />
          </div>
        </div>

        <div className="tree-container">
          <img src={tree} alt="Tree" />
        </div>

        <div className="car-wrapper">
          <div className="car-labels">
            <span className="label label-1">خوارزمية القفز</span>
            <span className="label label-2">مشوار النجاح</span>
            <span className="label label-3">البحث الخطي</span>
            <span className="label label-4">شجرة الثنائية</span>
            <span className="label label-5">المشاكل</span>
            <span className="label label-6">خوارزميات</span>
            <span className="label label-7">البرمجة</span>
            <span className="label label-8">التطوير</span>
            <span className="label label-9">التحدي</span>
            <span className="label label-10">الحلول</span>
          </div>

          <div className="car-container">
            <img src={carBody} alt="Car Body" className="car-body" />
            <div className="wheels">
              <div className="wheel front-wheel">
                <img src={wheel} alt="Front Wheel" />
              </div>
              <div className="wheel back-wheel">
                <img src={wheel} alt="Back Wheel" />
              </div>
            </div>
            <div className="ground-infinite-line">
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
              <div className="ground-line-segment long-line">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
              <div className="ground-line-segment short-line">
                <img src={vectorStroke6} alt="Ground Extension" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackIllustration = (isSubmitting, hasProfileImage) => (
    <div className={`illustration-section ${hasProfileImage ? "has-image" : ""}`}>
      <div className="scene">
        <div className="clouds-container">
          <div className="cloud cloud-0">
            <img src={vectorStroke} alt="Cloud 0" />
          </div>
          <div className="cloud cloud-1">
            <img src={vectorStroke1} alt="Cloud 1" />
          </div>
          <div className="bird bird-1">
            <img src={vectorStroke2} alt="Bird" />
          </div>
          <div className="bird bird-2">
            <img src={vectorStroke3} alt="Bird" />
          </div>
        </div>

        <div className="tree-container">
          <img src={tree} alt="Tree" />
        </div>

        <div className="car-wrapper">
          <img src={backCarBody} alt="Back Car Body" className="car-body car-back-body" />
          <div className="car-container">
            <img
              src={carBodyWithoutTyer}
              alt="Car Body Without Tyre"
              className="car-body car-middle-body"
            />
          </div>
          <img src={forwardCarBody} alt="Forward Car Body" className="car-body car-forward-body" />

          <div className="ground-infinite-line">
            <div className="ground-line-wrapper line-1">
              <div className="ground-line-segment">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
            </div>
            <div className="ground-line-wrapper line-2">
              <div className="ground-line-segment">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
            </div>
            <div className="ground-line-wrapper line-3">
              <div className="ground-line-segment">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
            </div>
            <div className="ground-line-wrapper line-4">
              <div className="ground-line-segment">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
            </div>
            <div className="ground-line-wrapper line-5">
              <div className="ground-line-segment">
                <img src={vectorStrokeLine} alt="Ground Line" />
              </div>
            </div>
          </div>

          <div className="detached-wheels">
            <div className="detached-wheel wheel-1">
              <img src={wheel} alt="Wheel" />
              <div className="wheel-trail" />
            </div>
            <div className="detached-wheel wheel-2">
              <img src={wheel} alt="Wheel" />
              <div className="wheel-trail" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const rootClassName = ["auth-card", className].filter(Boolean).join(" ");

  return (
    <div ref={containerRef} className={rootClassName}>
      {showHeader && (
        <header className="main-header">
          <div className="header-content">
            <div className="logo-header">
              <img src={logoPart} alt="عرب كوديرز" />
            </div>
            <nav className="main-nav">
              <a href="#explore">استكشف</a>
              <a href="#questions">الأسئلة</a>
              <a href="#coders">المبرمج</a>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFlipped(true)}>
                إنشاء حساب
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="main-content">
        {/* <div className="background-circle-behind">
          <img src={ellipse10} alt="Background Circle" />
        </div> */}
       <div className="card-flip-container">
          <div className="login-card card-front">
            <div className="form-section">
              <div className="form-content">
                <div className="logo-card-section">
                  <img src={logoCard} alt="عرب كوديرز" className="logo-card-img" />
                </div>
                <form className="login-form" onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">البريد الإلكتروني</label>
                    <input
                      type="email"
                      id="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">كلمة السر</label>
                    <div className="password-input-wrapper">
                      <input
                        type={loginPasswordVisible ? "text" : "password"}
                        id="password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setLoginPasswordVisible((prev) => !prev)}
                      >
                        <img
                          src={eyeHide}
                          alt="إظهار كلمة المرور"
                          className="eye-icon eye-hide-icon"
                          style={{ display: loginPasswordVisible ? "none" : "block" }}
                        />
                        <img
                          src={eyeShow}
                          alt="إخفاء كلمة المرور"
                          className="eye-icon eye-show-icon"
                          style={{ display: loginPasswordVisible ? "block" : "none" }}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="remember-me-forgot">
                    <div className="remember-me">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={loginRemember}
                        onChange={(event) => setLoginRemember(event.target.checked)}
                      />
                      <label htmlFor="remember">تذكرني</label>
                    </div>
                    <a href="#forgot" className="forgot-password" onClick={(e) => { e.preventDefault(); handleForgotPasswordClick(); }}>
                      هل نسيت كلمة المرور؟
                    </a>
                  </div>

                  {loginErrorMessage && (
                    <p className="form-error-text">{loginErrorMessage}</p>
                  )}

                  <div className="button-group">
                    <button type="submit" className="btn btn-primary" disabled={isLoginSubmitting}>
                      {isLoginSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsFlipped(true)}>
                      إنشاء حساب
                    </button>
                  </div>
                </form>

                <div className="social-section">
                  <p className="or-divider">أو</p>
                  <p className="social-text">سجل الدخول باستخدام</p>
                  <div className="social-icons">
                    <button
                      type="button"
                      className="social-link facebook"
                      aria-label="تسجيل الدخول عبر Facebook"
                      onClick={() => handleSocialLogin("facebook")}
                    >
                      <i className="bx bxl-facebook" aria-hidden="true" />
                      <span className="social-tooltip">Facebook</span>
                    </button>
                    <button
                      type="button"
                      className="social-link google"
                      aria-label="تسجيل الدخول عبر Google"
                      onClick={() => handleSocialLogin("google")}
                    >
                      <i className="bx bxl-google" aria-hidden="true" />
                      <span className="social-tooltip">Google</span>
                    </button>
                    <button
                      type="button"
                      className="social-link linkedin"
                      aria-label="تسجيل الدخول عبر LinkedIn"
                      onClick={() => handleSocialLogin("linkedin")}
                    >
                      <i className="bx bxl-linkedin" aria-hidden="true" />
                      <span className="social-tooltip">LinkedIn</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`login-card card-back ${isSubmitting ? "signup-loading" : ""}`}>
            <div className="form-section">
              <div className="form-content">
                <div className="logo-card-section">
                  <img src={logoCard} alt="عرب كوديرز" className="logo-card-img" />
                </div>

                <form id="signupForm" className="login-form" onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">اسم المستخدم</label>
                    <input
                      type="text"
                      id="username"
                      value={signupUsername}
                      onChange={(event) => setSignupUsername(event.target.value)}
                      placeholder="سمير صحنوقة"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-email">البريد الإلكتروني</label>
                    <input
                      type="email"
                      id="signup-email"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="signup-password">كلمة السر</label>
                    <div className="password-input-wrapper">
                      <input
                        type={signupPasswordVisible ? "text" : "password"}
                        id="signup-password"
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setSignupPasswordVisible((prev) => !prev)}
                      >
                        <img
                          src={eyeHide}
                          alt="إظهار كلمة المرور"
                          className="eye-icon eye-hide-icon"
                          style={{ display: signupPasswordVisible ? "none" : "block" }}
                        />
                        <img
                          src={eyeShow}
                          alt="إخفاء كلمة المرور"
                          className="eye-icon eye-show-icon"
                          style={{ display: signupPasswordVisible ? "block" : "none" }}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="remember-me-forgot">
                    <div className="remember-me">
                      <input
                        type="checkbox"
                        id="signup-remember"
                        checked={signupRemember}
                        onChange={(event) => setSignupRemember(event.target.checked)}
                      />
                      <label htmlFor="signup-remember">تذكرني</label>
                    </div>
                  </div>

                  <div className="form-row-inline">
                    <div className="form-group half-width">
                      <label htmlFor="signup-country">الدولة</label>
                      <select
                        id="signup-country"
                        value={signupCountry}
                        onChange={(event) => setSignupCountry(event.target.value)}
                        required
                      >
                        <option value="" disabled>
                          {isLoadingCountries ? "جارٍ تحميل الدول..." : "اختر الدولة"}
                        </option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group half-width">
                      <label htmlFor="profileImage">الصورة الشخصية</label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="profileImage"
                          name="profileImage"
                          accept="image/*"
                          onChange={(event) => setSignupImage(event.target.files?.[0] ?? null)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="button-group">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsFlipped(false)}>
                      تسجيل الدخول
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                    </button>
                  </div>
                </form>

                <div className="social-section">
                  <p className="or-divider">أو</p>
                  <p className="social-text">سجل الدخول باستخدام</p>
                  <div className="social-icons">
                    <button
                      type="button"
                      className="social-link facebook"
                      aria-label="تسجيل الدخول عبر Facebook"
                      onClick={() => handleSocialLogin("facebook")}
                    >
                      <i className="bx bxl-facebook" aria-hidden="true" />
                      <span className="social-tooltip">Facebook</span>
                    </button>
                    <button
                      type="button"
                      className="social-link google"
                      aria-label="تسجيل الدخول عبر Google"
                      onClick={() => handleSocialLogin("google")}
                    >
                      <i className="bx bxl-google" aria-hidden="true" />
                      <span className="social-tooltip">Google</span>
                    </button>
                    <button
                      type="button"
                      className="social-link linkedin"
                      aria-label="تسجيل الدخول عبر LinkedIn"
                      onClick={() => handleSocialLogin("linkedin")}
                    >
                      <i className="bx bxl-linkedin" aria-hidden="true" />
                      <span className="social-tooltip">LinkedIn</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </main>

      {showFooter && (
        <footer className="main-footer">
          <div className="footer-content">
            <div className="footer-links">
              <a href="#help">مركز المساعدة</a>
              <a href="#jobs">الوظائف</a>
              <a href="#rewards">المكافآت</a>
              <a href="#students">الطلاب</a>
              <a href="#request">الطلب</a>
              <a href="#terms">الشروط</a>
            </div>
            <div className="footer-info">
              <div className="copyright">
                <img src={copyrightImg} alt="Copyright" className="copyright-icon" />
                <span>حقوق الطبع والنشر © 2024 عرب كوديرز</span>
              </div>
              <div className="country-flag">
                <i className="bx bx-flag" aria-hidden="true" />
                <span>المملكة الأردنية الهاشمية</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay" onClick={() => {}}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <h3>التحقق من البريد الإلكتروني</h3>
              <button
                className="otp-modal-close"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp("");
                  setPendingSignupData(null);
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="otp-modal-body">
              <p className="otp-modal-message">
                تم إرسال رمز التحقق إلى بريدك الإلكتروني:
                <br />
                <strong>{pendingSignupData?.trimmedEmail}</strong>
              </p>
              <div className="otp-input-group">
                <label htmlFor="otp-input">رمز التحقق (OTP)</label>
                <input
                  id="otp-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  disabled={otpLoading}
                  className="otp-input"
                  autoFocus
                />
              </div>
              <div className="otp-modal-actions">
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || !otp.trim()}
                  className="btn btn-primary otp-verify-btn"
                >
                  {otpLoading ? "جارٍ التحقق..." : "تحقق وإنشاء الحساب"}
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={otpLoading || resendCooldown > 0}
                  className="btn btn-secondary otp-resend-btn"
                >
                  {resendCooldown > 0
                    ? `إعادة الإرسال بعد ${resendCooldown} ثانية`
                    : "إعادة إرسال رمز التحقق"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password - Email Modal */}
      {showForgotPasswordEmailModal && (
        <div className="otp-modal-overlay" onClick={() => setShowForgotPasswordEmailModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <h3>استعادة كلمة المرور</h3>
              <button
                className="otp-modal-close"
                onClick={() => {
                  setShowForgotPasswordEmailModal(false);
                  setForgotPasswordEmail("");
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="otp-modal-body">
              <p className="otp-modal-message">
                أدخل بريدك الإلكتروني لإرسال رمز التحقق
              </p>
              <div className="otp-input-group">
                <label htmlFor="forgot-email-input">البريد الإلكتروني</label>
                <input
                  id="forgot-email-input"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={forgotPasswordLoading}
                  className="otp-input"
                  autoFocus
                />
              </div>
              <div className="otp-modal-actions">
                <button
                  onClick={handleSendForgotPasswordOtp}
                  disabled={forgotPasswordLoading || !forgotPasswordEmail.trim()}
                  className="btn btn-primary otp-verify-btn"
                >
                  {forgotPasswordLoading ? "جاري الإرسال..." : "إرسال"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password - OTP Modal */}
      {showForgotPasswordOtpModal && (
        <div className="otp-modal-overlay" onClick={() => setShowForgotPasswordOtpModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <h3>إدخال رمز التحقق</h3>
              <button
                className="otp-modal-close"
                onClick={() => {
                  setShowForgotPasswordOtpModal(false);
                  setForgotPasswordOtp("");
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="otp-modal-body">
              <p className="otp-modal-message">
                تم إرسال رمز التحقق إلى بريدك الإلكتروني:
                <br />
                <strong>{forgotPasswordEmail}</strong>
              </p>
              <div className="otp-input-group">
                <label htmlFor="forgot-otp-input">رمز التحقق (OTP)</label>
                <input
                  id="forgot-otp-input"
                  type="text"
                  value={forgotPasswordOtp}
                  onChange={(e) => setForgotPasswordOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  disabled={forgotPasswordLoading}
                  className="otp-input"
                  autoFocus
                />
              </div>
              <div className="otp-modal-actions">
                <button
                  onClick={handleVerifyForgotPasswordOtp}
                  disabled={forgotPasswordLoading || !forgotPasswordOtp.trim() || forgotPasswordOtp.length !== 6}
                  className="btn btn-primary otp-verify-btn"
                >
                  {forgotPasswordLoading ? "جاري التحقق..." : "تحقق"}
                </button>
                <button
                  onClick={() => {
                    setShowForgotPasswordOtpModal(false);
                    setShowForgotPasswordEmailModal(true);
                  }}
                  disabled={forgotPasswordLoading}
                  className="btn btn-secondary otp-resend-btn"
                >
                  العودة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password - New Password Modal */}
      {showForgotPasswordNewPasswordModal && (
        <div className="otp-modal-overlay" onClick={() => setShowForgotPasswordNewPasswordModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="otp-modal-header">
              <h3>كلمة المرور الجديدة</h3>
              <button
                className="otp-modal-close"
                onClick={() => {
                  setShowForgotPasswordNewPasswordModal(false);
                  setForgotPasswordNewPassword("");
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="otp-modal-body">
              <p className="otp-modal-message">
                أدخل كلمة المرور الجديدة
              </p>
              <div className="otp-input-group">
                <label htmlFor="forgot-new-password-input">كلمة السر الجديدة</label>
                <input
                  id="forgot-new-password-input"
                  type="password"
                  value={forgotPasswordNewPassword}
                  onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={forgotPasswordLoading}
                  className="otp-input"
                  autoFocus
                />
              </div>
              <div className="otp-modal-actions">
                <button
                  onClick={handleRestorePassword}
                  disabled={forgotPasswordLoading || !forgotPasswordNewPassword.trim() || forgotPasswordNewPassword.trim().length < 6}
                  className="btn btn-primary otp-verify-btn"
                >
                  {forgotPasswordLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </button>
                <button
                  onClick={() => {
                    setShowForgotPasswordNewPasswordModal(false);
                    setShowForgotPasswordOtpModal(true);
                  }}
                  disabled={forgotPasswordLoading}
                  className="btn btn-secondary otp-resend-btn"
                >
                  العودة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthCard;
