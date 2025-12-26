import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContestById, registerForContest, checkContestRegistration, unregisterFromContest } from "../../Service/contestService.js";
import DOMPurify from "dompurify";
import {
  Container,
  Typography,
  Box,
  Card,
  Button,
  Chip,
  Avatar,
  Collapse,
  IconButton
} from "@mui/material";
import { ContestDetailSkeleton } from "../../Components/SkeletonLoading";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GavelIcon from "@mui/icons-material/Gavel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import Swal from "sweetalert2";
import "./VeiwContest.css";

// Ensure boxicons is loaded
const ensureBoxicons = () => {
  if (typeof document === "undefined") return;
  const BOXICON_LINK_ID = "contest-detail-boxicons-link";
  if (!document.getElementById(BOXICON_LINK_ID)) {
    const link = document.createElement("link");
    link.id = BOXICON_LINK_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
    link.crossOrigin = "anonymous";
    link.onerror = () => {
      console.warn("Failed to load Boxicons from CDN, using fallback");
    };
    document.head.appendChild(link);
  }
};

export default function ContestProblems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    prizes: false,
    terms: false,
    problems: false
  });

  useEffect(() => {
    ensureBoxicons();
    
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark-mode") || 
                     document.body.classList.contains("dark-mode") ||
                     localStorage.getItem("dark-mode") === "true";
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // استخدام الخدمة الصحيحة من contestService
        const contestId = parseInt(id, 10);
        if (isNaN(contestId) || contestId <= 0) {
          setError("معرف المسابقة غير صحيح");
          setLoading(false);
          return;
        }
        
        console.log("Fetching contest with ID:", contestId);
        const contestData = await getContestById(contestId);
        console.log("Contest data:", contestData);
        
        if (contestData) {
          setContest(contestData);
          // التحقق من حالة التسجيل
          try {
            const registrationStatus = await checkContestRegistration(contestId);
            console.log("Registration status:", registrationStatus);
            // قد تكون الاستجابة boolean أو object
            const isReg = typeof registrationStatus === 'boolean' 
              ? registrationStatus 
              : registrationStatus === true || registrationStatus?.isRegistered === true || registrationStatus === "true";
            setIsRegistered(isReg || contestData.hasRegisted || false);
          } catch (err) {
            console.error("Error checking registration:", err);
            setIsRegistered(contestData.hasRegisted || false);
          }
        } else {
          setError("لم يتم العثور على بيانات المسابقة");
        }
      } catch (err) {
        console.error("Error fetching contest:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        // معالجة الأخطاء من الخدمة
        if (err.response) {
          const status = err.response.status;
          const errorData = err.response?.data;
          const errorMessage = typeof errorData === 'string' ? errorData : errorData?.message || err.message;
          
          if (status === 404) {
            setError("المسابقة غير موجودة");
          } else if (status === 401) {
            setError("غير مصرح. يرجى تسجيل الدخول مرة أخرى");
          } else if (status === 403 || errorMessage?.toLowerCase().includes("unauthorize") || errorMessage?.toLowerCase().includes("unauthorized")) {
            setError("ليس لديك صلاحية للوصول إلى هذه المسابقة. قد تكون المسابقة خاصة أو غير متاحة لك.");
          } else if (status === 500) {
            setError("خطأ في الخادم. يرجى المحاولة لاحقاً");
          } else {
            setError(errorMessage || `خطأ ${status}`);
          }
        } else if (err.request) {
          // Request was made but no response received (Network Error)
          console.error("Network Error - No response received:", err.request);
          setError("خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى");
        } else if (err.message && err.message.includes("Network Error")) {
          // Network Error explicitly
          console.error("Network Error:", err.message);
          setError("خطأ في الاتصال بالشبكة. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى");
        } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          // Timeout error
          setError("انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى");
        } else {
          // Something else happened
          console.error("Unexpected error:", err);
          setError(err.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setError("معرف المسابقة غير موجود");
      setLoading(false);
      return;
    }

    fetchContest();
  }, [id]);

  if (loading) {
    return <ContestDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="contest-detail-wrapper">
        <Container sx={{ 
          mt: 4, 
          textAlign: "center", 
          direction: "rtl",
          marginTop: "120px"
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              color: "var(--admin-text-primary, #1a202c)"
            }}
            className="contest-error-text"
          >
            {error}
          </Typography>
          {id && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                color: "var(--admin-text-secondary, #4a5568)"
              }}
            >
              معرف المسابقة: {id}
            </Typography>
          )}
          <Button 
            variant="contained" 
            onClick={() => navigate("/dashboard", { state: { activeTab: "contests" } })} 
            sx={{ 
              mt: 2, 
              bgcolor: "#007C89",
              "&:hover": { bgcolor: "#006a75" }
            }}
          >
            العودة
          </Button>
        </Container>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contest-detail-wrapper">
        <Container sx={{ 
          mt: 4, 
          textAlign: "center", 
          direction: "rtl",
          marginTop: "120px"
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              color: "var(--admin-text-primary, #1a202c)"
            }}
          >
            لم يتم العثور على بيانات المسابقة
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate("/dashboard", { state: { activeTab: "contests" } })} 
            sx={{ 
              mt: 2, 
              bgcolor: "#007C89",
              "&:hover": { bgcolor: "#006a75" }
            }}
          >
            العودة
          </Button>
        </Container>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const d = new Date(dateString);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "تاريخ غير صحيح";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "hard":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "سهل";
      case "medium":
        return "متوسط";
      case "hard":
        return "صعب";
      default:
        return difficulty || "غير محدد";
    }
  };

  const getStatusLabel = (statueProblem) => {
    // statueProblem: 1 = Solved, 0 = Not Solved
    return statueProblem === 1 ? "محلولة" : "غير محلولة";
  };

  const isContestEnded = () => {
    if (!contest || !contest.endTime) return false;
    return new Date(contest.endTime) < new Date();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRegister = async () => {
    const contestId = parseInt(id, 10);
    if (!contestId || isNaN(contestId) || contestId <= 0) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "معرف المسابقة غير موجود",
        confirmButtonColor: "#7B1FA2"
      });
      return;
    }
    
    setRegistering(true);
    try {
      console.log("Attempting to register for contest:", contestId);
      const response = await registerForContest(contestId);
      console.log("Registration response:", response);
      
      setIsRegistered(true);
      setContest(prev => ({ ...prev, hasRegisted: true }));
      
      Swal.fire({
        icon: "success",
        title: "تم التسجيل بنجاح!",
        text: "تم تسجيلك في المسابقة بنجاح 🎉",
        confirmButtonColor: "#007C89",
        timer: 3000
      });
    } catch (error) {
      console.error("Error registering for contest:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "حدث خطأ أثناء محاولة التسجيل في المسابقة";
      if (error.response?.status === 400) {
        errorMessage = "لا يمكن التسجيل في هذه المسابقة";
      } else if (error.response?.status === 401) {
        errorMessage = "يجب تسجيل الدخول أولاً";
      } else if (error.response?.status === 403) {
        errorMessage = "ليس لديك صلاحية للتسجيل في هذه المسابقة";
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        icon: "error",
        title: "خطأ في التسجيل",
        text: errorMessage,
        confirmButtonColor: "#7B1FA2"
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    const contestId = parseInt(id, 10);
    if (!contestId || isNaN(contestId) || contestId <= 0) return;
    
    const result = await Swal.fire({
      title: "إلغاء التسجيل",
      text: "هل أنت متأكد من إلغاء التسجيل في هذه المسابقة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#007C89",
      confirmButtonText: "نعم، إلغاء التسجيل",
      cancelButtonText: "إلغاء"
    });

    if (result.isConfirmed) {
      setRegistering(true);
      try {
        console.log("Attempting to unregister from contest:", contestId);
        await unregisterFromContest(contestId);
        setIsRegistered(false);
        setContest(prev => ({ ...prev, hasRegisted: false }));
        
        Swal.fire({
          icon: "success",
          title: "تم إلغاء التسجيل",
          text: "تم إلغاء تسجيلك في المسابقة بنجاح",
          confirmButtonColor: "#007C89",
          timer: 3000
        });
      } catch (error) {
        console.error("Error unregistering from contest:", error);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: error.message || "حدث خطأ أثناء إلغاء التسجيل",
          confirmButtonColor: "#7B1FA2"
        });
      } finally {
        setRegistering(false);
      }
    }
  };

  return (
    <div className="contest-detail-wrapper" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="contest-detail-header">
        <button
          onClick={() => navigate("/dashboard", { state: { activeTab: "contests" } })}
          className="contest-detail-back-btn"
          aria-label="العودة"
        >
     <i className="bx bx-arrow-back back-icon"></i>
 
        </button>
        <div className="contest-detail-header-content">
          <h1 className="contest-detail-title">{contest.name}</h1>
        </div>
      </div>

      <div className="contest-detail-main">
        {/* Hero Image */}
        {contest.imageURL && (
          <div className="contest-hero-image">
            <img 
              src={contest.imageURL} 
              alt={contest.name}
              className="contest-image-full"
            />
          </div>
        )}

        <Container maxWidth="lg" className="contest-detail-content" sx={{ py: 4 }}>
          {/* Contest Information Section - Collapsible */}
          <Card className="contest-section-card" sx={{ 
            mb: 2,
            borderRadius: 2,
            backgroundColor: "var(--admin-bg-secondary, #ffffff)",
            color: "var(--admin-text-primary, #1a202c)",
            boxShadow: "var(--admin-shadow-color, rgba(0,0,0,0.1)) 0 2px 8px",
            border: "1px solid var(--admin-border-color, rgba(226, 232, 240, 0.8))",
            overflow: "hidden"
          }}>
            <Box 
              className="contest-section-header"
              onClick={() => toggleSection('info')}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "var(--admin-bg-tertiary, #f5f7fa)"
                }
              }}
            >
              <Typography variant="h5" sx={{ 
                fontWeight: "bold",
                color: "var(--admin-text-primary, #1a202c)"
              }}>
                معلومات المسابقة
              </Typography>
              <IconButton size="small">
                {expandedSections.info ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expandedSections.info}>
              <Box sx={{ p: 3, pt: 0 }}>
                <Box className="contest-info-grid" sx={{ 
                  display: "grid", 
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 2.5
                }}>
                  <Box className="contest-info-item">
                    <Typography variant="caption" sx={{ 
                      color: "var(--admin-text-secondary, #6b7280)",
                      display: "block",
                      mb: 0.5,
                      fontWeight: "bold"
                    }}>
                      اسم المسابقة
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: "var(--admin-text-primary, #1a202c)",
                      fontWeight: "500"
                    }}>
                      {contest.name}
                    </Typography>
                  </Box>

                  {contest.location && (
                    <Box className="contest-info-item">
                      <Typography variant="caption" sx={{ 
                        color: "var(--admin-text-secondary, #6b7280)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: "bold"
                      }}>
                        مكان المسابقة
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: "var(--admin-text-primary, #1a202c)",
                        fontWeight: "500"
                      }}>
                        {contest.location}
                      </Typography>
                    </Box>
                  )}

                  {contest.nameUserCreateContest && (
                    <Box className="contest-info-item">
                      <Typography variant="caption" sx={{ 
                        color: "var(--admin-text-secondary, #6b7280)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: "bold"
                      }}>
                        الراعي الرسمي للمسابقة
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: "var(--admin-text-primary, #1a202c)",
                        fontWeight: "500"
                      }}>
                        {contest.nameUserCreateContest}
                      </Typography>
                    </Box>
                  )}

                  <Box className="contest-info-item">
                    <Typography variant="caption" sx={{ 
                      color: "var(--admin-text-secondary, #6b7280)",
                      display: "block",
                      mb: 0.5,
                      fontWeight: "bold"
                    }}>
                      عدد الاسئلة
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: "var(--admin-text-primary, #1a202c)",
                      fontWeight: "500"
                    }}>
                      {contest.problems?.length || 0}
                    </Typography>
                  </Box>

                  {contest.startTime && (
                    <Box className="contest-info-item">
                      <Typography variant="caption" sx={{ 
                        color: "var(--admin-text-secondary, #6b7280)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: "bold"
                      }}>
                        تاريخ المسابقة
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: "var(--admin-text-primary, #1a202c)",
                        fontWeight: "500"
                      }}>
                        {formatDate(contest.startTime)}
                      </Typography>
                    </Box>
                  )}

                  {contest.difficultyLevel !== undefined && contest.difficultyLevel !== null && (
                    <Box className="contest-info-item">
                      <Typography variant="caption" sx={{ 
                        color: "var(--admin-text-secondary, #6b7280)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: "bold"
                      }}>
                        مستوى المسابقة
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: contest.difficultyLevel === 0 ? "#4CAF50" : 
                                   contest.difficultyLevel === 1 ? "#FF9800" :
                                   contest.difficultyLevel === 2 ? "#F44336" : "#9C27B0"
                        }} />
                        <Typography variant="body1" sx={{ 
                          color: "var(--admin-text-primary, #1a202c)",
                          fontWeight: "500"
                        }}>
                          {contest.difficultyLevel === 0 ? "مستوى سهل" :
                           contest.difficultyLevel === 1 ? "مستوى متوسط" :
                           contest.difficultyLevel === 2 ? "مستوى صعب" :
                           contest.difficultyLevel === 3 ? "مستوى صعب جداً" :
                           "غير محدد"}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box className="contest-info-item">
                    <Typography variant="caption" sx={{ 
                      color: "var(--admin-text-secondary, #6b7280)",
                      display: "block",
                      mb: 0.5,
                      fontWeight: "bold"
                    }}>
                      التصنيفات
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: "var(--admin-text-primary, #1a202c)",
                      fontWeight: "500"
                    }}>
                      {contest.problems?.some(p => p.tags?.length > 0) 
                        ? contest.problems.flatMap(p => p.tags || []).map(t => t.tagName).join(", ")
                        : "لا توجد تصنيفات"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Card>

          {/* Prizes Section - Collapsible */}
          {contest.prizes && (
            <Card className="contest-section-card" sx={{ 
              mb: 2,
              borderRadius: 2,
              backgroundColor: "var(--admin-bg-secondary, #ffffff)",
              color: "var(--admin-text-primary, #1a202c)",
              boxShadow: "var(--admin-shadow-color, rgba(0,0,0,0.1)) 0 2px 8px",
              border: "1px solid var(--admin-border-color, rgba(226, 232, 240, 0.8))",
              overflow: "hidden"
            }}>
              <Box 
                className="contest-section-header"
                onClick={() => toggleSection('prizes')}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "var(--admin-bg-tertiary, #f5f7fa)"
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmojiEventsIcon sx={{ color: "#007C89" }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: "bold",
                    color: "var(--admin-text-primary, #1a202c)"
                  }}>
                    الجوائز
                  </Typography>
                </Box>
                <IconButton size="small">
                  {expandedSections.prizes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.prizes}>
                <Box sx={{ p: 3, pt: 0 }}>
                  <div 
                    className="contest-html-content"
                    style={{ 
                      color: "var(--admin-text-primary, #1a202c)",
                      direction: "rtl",
                      textAlign: "right"
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let rawHtml = contest.prizes || '';
                        console.log("📝 Raw prizes (original):", rawHtml);
                        console.log("📝 Type:", typeof rawHtml);
                        
                        if (!rawHtml) return '';
                        
                        // تحويل إلى string إذا لم يكن string
                        rawHtml = String(rawHtml);
                        
                        // إزالة escape characters إذا كانت موجودة (معالجة متعددة الطبقات)
                        // الطبقة الأولى: HTML entities
                        rawHtml = rawHtml
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/&#x27;/g, "'")
                          .replace(/&#x2F;/g, '/');
                        
                        // الطبقة الثانية: إذا كان JSON stringified
                        try {
                          if (rawHtml.startsWith('"') && rawHtml.endsWith('"')) {
                            rawHtml = JSON.parse(rawHtml);
                          }
                        } catch (e) {
                          // ليس JSON، استمر
                        }
                        
                        // الطبقة الثالثة: إزالة escape characters مرة أخرى بعد JSON parse
                        rawHtml = String(rawHtml)
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&');
                        
                        console.log("📝 Raw prizes (after decode):", rawHtml);
                        console.log("📝 Contains HTML tags:", /<[^>]+>/.test(rawHtml));
                        
                        // تنظيف HTML باستخدام DOMPurify مع إعدادات متساهلة جداً
                        const sanitized = DOMPurify.sanitize(rawHtml, {
                          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'pre', 'code'],
                          ALLOWED_ATTR: ['href', 'target', 'style', 'class', 'src', 'alt', 'title', 'width', 'height', 'id', 'dir'],
                          ALLOW_DATA_ATTR: false,
                          KEEP_CONTENT: true,
                          RETURN_DOM: false,
                          RETURN_DOM_FRAGMENT: false,
                          RETURN_TRUSTED_TYPE: false,
                          ADD_ATTR: ['dir'],
                          FORBID_TAGS: [],
                          FORBID_ATTR: []
                        });
                        
                        console.log("✅ Sanitized prizes HTML:", sanitized);
                        console.log("✅ Sanitized length:", sanitized.length);
                        console.log("✅ Contains h2:", sanitized.includes('<h2'));
                        console.log("✅ Contains ul:", sanitized.includes('<ul'));
                        console.log("✅ Contains li:", sanitized.includes('<li'));
                        console.log("✅ First 200 chars:", sanitized.substring(0, 200));
                        
                        return sanitized;
                      })()
                    }}
                  />
                </Box>
              </Collapse>
            </Card>
          )}

          {/* Terms and Conditions Section - Collapsible */}
          {contest.termsAndConditions && (
            <Card className="contest-section-card" sx={{ 
              mb: 2,
              borderRadius: 2,
              backgroundColor: "var(--admin-bg-secondary, #ffffff)",
              color: "var(--admin-text-primary, #1a202c)",
              boxShadow: "var(--admin-shadow-color, rgba(0,0,0,0.1)) 0 2px 8px",
              border: "1px solid var(--admin-border-color, rgba(226, 232, 240, 0.8))",
              overflow: "hidden"
            }}>
              <Box 
                className="contest-section-header"
                onClick={() => toggleSection('terms')}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "var(--admin-bg-tertiary, #f5f7fa)"
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GavelIcon sx={{ color: "#007C89" }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: "bold",
                    color: "var(--admin-text-primary, #1a202c)"
                  }}>
                    الأحكام والشروط
                  </Typography>
                </Box>
                <IconButton size="small">
                  {expandedSections.terms ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.terms}>
                <Box sx={{ p: 3, pt: 0 }}>
                  <div 
                    className="contest-html-content"
                    style={{ 
                      color: "var(--admin-text-primary, #1a202c)",
                      direction: "rtl",
                      textAlign: "right"
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (() => {
                        let rawHtml = contest.termsAndConditions || '';
                        console.log("📝 Raw termsAndConditions (original):", rawHtml);
                        console.log("📝 Type:", typeof rawHtml);
                        
                        if (!rawHtml) return '';
                        
                        // تحويل إلى string إذا لم يكن string
                        rawHtml = String(rawHtml);
                        
                        // إزالة escape characters إذا كانت موجودة (معالجة متعددة الطبقات)
                        // الطبقة الأولى: HTML entities
                        rawHtml = rawHtml
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/&#x27;/g, "'")
                          .replace(/&#x2F;/g, '/');
                        
                        // الطبقة الثانية: إذا كان JSON stringified
                        try {
                          if (rawHtml.startsWith('"') && rawHtml.endsWith('"')) {
                            rawHtml = JSON.parse(rawHtml);
                          }
                        } catch (e) {
                          // ليس JSON، استمر
                        }
                        
                        // الطبقة الثالثة: إزالة escape characters مرة أخرى بعد JSON parse
                        rawHtml = String(rawHtml)
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&');
                        
                        console.log("📝 Raw termsAndConditions (after decode):", rawHtml);
                        console.log("📝 Contains HTML tags:", /<[^>]+>/.test(rawHtml));
                        
                        // تنظيف HTML باستخدام DOMPurify مع إعدادات متساهلة جداً
                        const sanitized = DOMPurify.sanitize(rawHtml, {
                          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'pre', 'code'],
                          ALLOWED_ATTR: ['href', 'target', 'style', 'class', 'src', 'alt', 'title', 'width', 'height', 'id', 'dir'],
                          ALLOW_DATA_ATTR: false,
                          KEEP_CONTENT: true,
                          RETURN_DOM: false,
                          RETURN_DOM_FRAGMENT: false,
                          RETURN_TRUSTED_TYPE: false,
                          ADD_ATTR: ['dir'],
                          FORBID_TAGS: [],
                          FORBID_ATTR: []
                        });
                        
                        console.log("✅ Sanitized HTML:", sanitized);
                        console.log("✅ Sanitized length:", sanitized.length);
                        console.log("✅ Contains h2:", sanitized.includes('<h2'));
                        console.log("✅ Contains ul:", sanitized.includes('<ul'));
                        console.log("✅ Contains li:", sanitized.includes('<li'));
                        console.log("✅ First 200 chars:", sanitized.substring(0, 200));
                        
                        return sanitized;
                      })()
                    }}
                  />
                </Box>
              </Collapse>
            </Card>
          )}

          {/* Problems Section - Collapsible */}
          <Card className="contest-section-card" sx={{ 
            mb: 2,
            borderRadius: 2,
            backgroundColor: "var(--admin-bg-secondary, #ffffff)",
            color: "var(--admin-text-primary, #1a202c)",
            boxShadow: "var(--admin-shadow-color, rgba(0,0,0,0.1)) 0 2px 8px",
            border: "1px solid var(--admin-border-color, rgba(226, 232, 240, 0.8))",
            overflow: "hidden"
          }}>
            <Box 
              className="contest-section-header"
              onClick={() => toggleSection('problems')}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  backgroundColor: "var(--admin-bg-tertiary, #f5f7fa)"
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QuestionAnswerIcon sx={{ color: "#007C89" }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: "bold",
                  color: "var(--admin-text-primary, #1a202c)"
                }}>
                  أسئلة المسابقة
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.problems ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expandedSections.problems}>
              <Box sx={{ p: 3, pt: 0 }}>
                {!contest.problems || contest.problems.length === 0 ? (
                  <Box sx={{ 
                    textAlign: "center", 
                    py: 4
                  }}>
                    <Typography sx={{ 
                      color: "var(--admin-text-secondary, #4a5568)"
                    }}>
                      لا توجد مسائل في هذه المسابقة
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {contest.problems.map((problem, index) => (
                      <Card
                        key={problem.id}
                        className="problem-card-item"
                        onClick={() => navigate(`/problem/${problem.id}`, { 
                          state: { 
                            fromContest: true, 
                            contestId: id,
                            contestName: contest.name
                          } 
                        })}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          backgroundColor: "var(--admin-bg-tertiary, #f5f7fa)",
                          color: "var(--admin-text-primary, #1a202c)",
                          border: "1px solid var(--admin-border-color, rgba(226, 232, 240, 0.8))",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          "&:hover": {
                            boxShadow: "var(--admin-shadow-color, rgba(0,0,0,0.1)) 0 4px 12px",
                            transform: "translateY(-2px)"
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                          <Avatar
                            sx={{
                              bgcolor: "#007C89",
                              width: 36,
                              height: 36,
                              fontSize: "1rem",
                              fontWeight: "bold",
                              color: "#ffffff"
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: "bold",
                                color: "var(--admin-text-primary, #1a202c)",
                                mb: 1
                              }}
                            >
                              {problem.title}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                              {problem.tags && problem.tags.length > 0 && (
                                <Chip
                                  label={problem.tags[0].tagName}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(123, 31, 162, 0.1)",
                                    color: "#007C89",
                                    fontWeight: "bold",
                                    fontSize: "0.7rem"
                                  }}
                                />
                              )}
                              <Chip
                                label={getDifficultyLabel(problem.difficulty)}
                                size="small"
                                sx={{
                                  bgcolor: "var(--admin-bg-secondary, #ffffff)",
                                  color: "var(--admin-text-primary, #1a202c)",
                                  fontWeight: "bold",
                                  fontSize: "0.7rem"
                                }}
                              />
                              {problem.statueProblem === 1 && (
                                <Chip
                                  icon={<CheckCircleIcon sx={{ color: "#4CAF50 !important", fontSize: "16px !important" }} />}
                                  label="محلولة"
                                  size="small"
                                  sx={{
                                    bgcolor: "#E8F5E9",
                                    color: "#4CAF50",
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    border: "1px solid #4CAF50",
                                    "& .MuiChip-icon": {
                                      marginRight: "4px",
                                      marginLeft: "0px"
                                    }
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Card>

          {/* Register Button - At the end of page */}
          <Box className="contest-register-section" sx={{ 
            mt: 4, 
            mb: 4,
            display: "flex",
            justifyContent: "center",
            width: "100%"
          }}>
            {isContestEnded() ? (
              <Button
                variant="contained"
                disabled
                startIcon={<EventBusyIcon />}
                className="contest-register-btn contest-register-btn-ended"
                sx={{
                  width: "100%",
                  maxWidth: "600px",
                  py: 1.75,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: 3,
                  bgcolor: "#9E9E9E",
                  color: "#ffffff",
                  "&:hover": {
                    bgcolor: "#757575"
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#9E9E9E",
                    color: "#ffffff"
                  },
                  boxShadow: "0 4px 12px rgba(158, 158, 158, 0.3)"
                }}
              >
                المسابقة منتهية
              </Button>
            ) : isRegistered ? (
              <Button
                variant="contained"
                onClick={handleUnregister}
                disabled={registering}
                className="contest-register-btn"
                sx={{
                  width: "100%",
                  maxWidth: "600px",
                  py: 1.75,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: 3,
                  bgcolor: "#4CAF50",
                  color: "#ffffff",
                  "&:hover": {
                    bgcolor: "#45a049",
                    transform: "translateY(-2px)"
                  },
                  "&:disabled": {
                    bgcolor: "#9E9E9E"
                  },
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                {registering ? "جاري الإلغاء..." : "✓ مسجل في المسابقة (اضغط للإلغاء)"}
              </Button>
            ) : (
              <Button
                variant="contained"
                className="contest-register-btn"
                onClick={handleRegister}
                disabled={registering}
                sx={{
                  width: "100%",
                  maxWidth: "600px",
                  py: 1.75,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: 3,
                  bgcolor: "#007C89",
                  color: "#ffffff",
                  "&:hover": {
                    bgcolor: "#006a75",
                    transform: "translateY(-2px)"
                  },
                  "&:disabled": {
                    bgcolor: "#9E9E9E"
                  },
                  boxShadow: "0 4px 12px rgba(0, 124, 137, 0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                {registering ? "جاري التسجيل..." : "سجل الآن"}
              </Button>
            )}
          </Box>
        </Container>
      </div>
    </div>
  );
}
