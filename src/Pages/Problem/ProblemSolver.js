import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import { getProblemById } from "../../Service/ProblemService";
import { handelSubmission } from "../../Service/submissionServices";
import { getProblemWithRatings, addProblemRating, updateProblemRating, deleteProblemRating } from "../../Service/ProblemRatingService";
import DOMPurify from "dompurify";
import "./problemSolver.css";

const ProblemSolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSelector(selectAuthSession);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [leftWidth, setLeftWidth] = useState(50); // النسبة المئوية للجزء الأيسر
  const [isResizing, setIsResizing] = useState(false);
  
  // Ratings state
  const [ratingsData, setRatingsData] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [ratingScore, setRatingScore] = useState(0); // 0-5
  const [ratingDifficulty, setRatingDifficulty] = useState(2); // 1=سهل، 2=متوسط، 3=صعب
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingScore, setEditingScore] = useState(0);
  const [editingDifficulty, setEditingDifficulty] = useState(2);
  const [editingComment, setEditingComment] = useState("");
  const [editingSending, setEditingSending] = useState(false);
  
  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  // دالة لتنظيف HTML قبل العرض
  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "div", "span", "pre", "code", "blockquote"],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "style"],
    });
  const codeEditorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const splitRef = useRef(null);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const data = await getProblemById(id);
        console.log("📦 Problem data:", data);
        setProblem(data);
        // Initialize code with template
        setCode(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // اكتب الحل هنا
    
    
    return 0;
}`);
      } catch (err) {
        console.error("خطأ أثناء جلب البيانات:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  // جلب التقييمات عند فتح تبويب التقييمات
  useEffect(() => {
    if (activeTab === "ratings" && id) {
      if (!ratingsData && !loadingRatings) {
        fetchRatings();
      }
    }
  }, [activeTab, id, ratingsData, loadingRatings]);

  const fetchRatings = async () => {
    if (loadingRatings) return; // منع الطلبات المتعددة
    setLoadingRatings(true);
    try {
      console.log("📤 Fetching ratings for problem:", id);
      const data = await getProblemWithRatings(id);
      console.log("📊 Ratings data received:", data);
      console.log("📊 isEvaluatedByCurrentUser:", data?.isEvaluatedByCurrentUser);
      console.log("📊 Current user ID:", session?.responseUserDTO?.id);
      console.log("📊 problemEvaluationDTO:", data?.problemEvaluationDTO);
      
      // التأكد من أن isEvaluatedByCurrentUser موجود (إذا لم يكن موجوداً، افترض أنه false)
      if (data && data.isEvaluatedByCurrentUser === undefined) {
        data.isEvaluatedByCurrentUser = false;
      }
      
      // التأكد من أن problemEvaluationDTO موجود
      if (data && !data.problemEvaluationDTO) {
        data.problemEvaluationDTO = [];
      }
      
      console.log("📊 Should show form:", data && session?.responseUserDTO?.id && !data.isEvaluatedByCurrentUser);
      
      // التأكد من أن البيانات صحيحة قبل تعيينها
      if (!data) {
        console.warn("⚠️ No data received, creating default structure");
        setRatingsData({
          id: Number(id),
          averageScore: 0,
          numberOfEvaluationsEasy: 0,
          numberOfEvaluationsMedium: 0,
          numberOfEvaluationsHard: 0,
          isEvaluatedByCurrentUser: false,
          problemEvaluationDTO: [],
        });
      } else {
        setRatingsData(data);
      }
    } catch (err) {
      console.error("❌ Error fetching ratings:", err);
      console.error("❌ Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        url: err?.config?.url,
      });
      // في حالة الخطأ، قم بإنشاء بيانات افتراضية
      setRatingsData({
        id: Number(id),
        averageScore: 0,
        numberOfEvaluationsEasy: 0,
        numberOfEvaluationsMedium: 0,
        numberOfEvaluationsHard: 0,
        isEvaluatedByCurrentUser: false,
        problemEvaluationDTO: [],
      });
    } finally {
      setLoadingRatings(false);
    }
  };

  // Handle resizing
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !splitRef.current) return;
      
      const splitRect = splitRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - splitRect.left) / splitRect.width) * 100;
      
      // حدود لمنع التصغير الزائد
      if (newLeftWidth >= 30 && newLeftWidth <= 70) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getDifficultyClass = (difficulty) => {
    if (difficulty === "Easy" || difficulty === "سهل") return "solver-difficulty--easy";
    if (difficulty === "Medium" || difficulty === "متوسط") return "solver-difficulty--medium";
    if (difficulty === "Hard" || difficulty === "صعب") return "solver-difficulty--hard";
    return "solver-difficulty--medium";
  };

  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      "Easy": "سهل",
      "Medium": "متوسط",
      "Hard": "صعب",
      "سهل": "سهل",
      "متوسط": "متوسط",
      "صعب": "صعب"
    };
    return difficultyMap[difficulty] || difficulty || "متوسط";
  };

  const handleSubmit = async () => {
    // التحقق من تسجيل الدخول
    if (!session?.responseUserDTO?.id) {
      setTestResults({
        status: "warning",
        verdict: "الرجاء تسجيل الدخول أولاً"
      });
      setTimeout(() => {
        navigate('/react-app/login');
      }, 2000);
      return;
    }

    if (!code.trim()) {
      setTestResults({
        status: "warning",
        verdict: "الرجاء كتابة الكود أولاً"
      });
      return;
    }

    setIsSubmitting(true);
    setTestResults(null);
    
    try {
      const token = localStorage.getItem("token");
      console.log("📤 Sending submission:", {
        idProblem: parseInt(id),
        idUser: session?.responseUserDTO?.id,
        codeLength: code.length,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + "..." : "NO TOKEN"
      });

      const result = await handelSubmission({
        code: code,
        idProblem: parseInt(id),
        idUser: session?.responseUserDTO?.id,
      });

      console.log("✅ Submission result:", result);

      if (result.isAccepted === 3 || result.isAccepted === 2) {
        setTestResults({ 
          status: "accepted", 
          verdict: result.status || "تم قبول الحل بنجاح! 🎉" 
        });
      } else {
        setTestResults({ 
          status: "rejected", 
          verdict: result.status || "الحل غير صحيح، حاول مرة أخرى" 
        });
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      
      let errorMessage = "حدث خطأ أثناء إرسال الحل";
      
      if (err.response?.status === 401) {
        errorMessage = "انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى";
        setTimeout(() => {
          navigate('/react-app/login');
        }, 2000);
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || "البيانات المرسلة غير صحيحة";
      } else if (err.response?.status === 500) {
        errorMessage = "خطأ في الخادم. حاول مرة أخرى لاحقاً";
      }
      
      setTestResults({
        status: "rejected",
        verdict: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode(`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // اكتب الحل هنا
    
    
    return 0;
}`);
    setTestResults(null);
  };

  // إرسال التقييم
  const handleSubmitRating = async () => {
    if (!session?.responseUserDTO?.id) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    if (ratingScore === 0) {
      alert("الرجاء اختيار تقييم (على الأقل نجمة واحدة)");
      return;
    }

    setSubmittingRating(true);
    try {
      console.log("📝 Submitting rating:", {
        problemId: id,
        score: ratingScore,
        difficulty: ratingDifficulty,
        comment: ratingComment.trim(),
      });
      
      const newRating = await addProblemRating(id, {
        score: ratingScore,
        difficulty: ratingDifficulty,
        comment: ratingComment.trim(),
      });

      console.log("✅ Rating submitted successfully:", newRating);

      // إعادة جلب التقييمات لتحديث البيانات
      await fetchRatings();

      // إعادة تعيين الحقول
      setRatingScore(0);
      setRatingDifficulty(2);
      setRatingComment("");

      alert("تم إضافة التقييم بنجاح!");
      // إعادة جلب التقييمات
      await fetchRatings();
    } catch (error) {
      console.error("❌ Error submitting rating:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "حدث خطأ غير متوقع";
      alert(`فشل إضافة التقييم: ${errorMessage}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  // بدء التعديل
  const handleStartEdit = (evaluation) => {
    const currentUserId = session?.responseUserDTO?.id;
    if (evaluation.userId !== currentUserId) {
      alert("لا يمكنك تعديل تقييم ليس لك");
      return;
    }
    
    // التحقق من البيانات قبل التعيين
    const score = evaluation.evaluationScore ? evaluation.evaluationScore / 2 : 1; // تحويل من 0-10 إلى 0-5
    const difficulty = evaluation.problemDifficulty && [1, 2, 3].includes(Number(evaluation.problemDifficulty)) 
      ? Number(evaluation.problemDifficulty) 
      : 2; // افتراضي 2 إذا كانت القيمة غير صحيحة
    
    console.log("📝 Starting edit:", {
      evaluationId: evaluation.id,
      originalScore: evaluation.evaluationScore,
      calculatedScore: score,
      originalDifficulty: evaluation.problemDifficulty,
      calculatedDifficulty: difficulty,
    });
    
    setEditingId(evaluation.id);
    setEditingScore(score);
    setEditingDifficulty(difficulty);
    setEditingComment(evaluation.comments || "");
  };

  // حفظ التعديل
  const handleSaveEdit = async (evaluation) => {
    // التحقق من التقييم
    const score = Number(editingScore);
    if (isNaN(score) || score < 1 || score > 5) {
      alert("الرجاء اختيار تقييم (على الأقل نجمة واحدة)");
      return;
    }
    
    // التحقق من الصعوبة
    const difficulty = Number(editingDifficulty);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 3) {
      alert(`خطأ: الصعوبة غير صحيحة (${editingDifficulty}). يجب أن تكون 1 أو 2 أو 3`);
      console.error("❌ Invalid difficulty:", editingDifficulty);
      return;
    }
    
    // التحقق من البيانات المطلوبة
    const userId = evaluation.userId || Number(localStorage.getItem("idUser"));
    const problemId = evaluation.problemId || Number(id);
    const evaluatedAt = evaluation.evaluatedAt || new Date().toISOString();
    
    if (!userId) {
      alert("خطأ: معرف المستخدم غير موجود");
      return;
    }
    if (!problemId) {
      alert("خطأ: معرف المشكلة غير موجود");
      return;
    }
    
    console.log("📝 Original evaluation data:", evaluation);
    console.log("📝 Editing values:", {
      editingScore: score,
      editingDifficulty: difficulty,
      editingComment: editingComment.trim(),
    });
    
    setEditingSending(true);
    try {
      const ratingData = {
        score: score,
        difficulty: difficulty,
        comment: editingComment.trim(),
        userId: Number(userId),
        problemId: Number(problemId),
        evaluatedAt: evaluatedAt,
      };
      
      console.log("📝 Updating rating with data:", ratingData);
      console.log("📝 Evaluation ID:", evaluation.id);
      
      const updatedRating = await updateProblemRating(evaluation.id, ratingData);
      
      console.log("✅ Rating updated successfully:", updatedRating);

      // تحديث البيانات المحلية
      setRatingsData((prev) => ({
        ...prev,
        problemEvaluationDTO: prev.problemEvaluationDTO.map((ev) =>
          ev.id === evaluation.id ? updatedRating : ev
        ),
      }));

      setEditingId(null);
      alert("تم حفظ التعديل بنجاح!");
      // إعادة جلب التقييمات
      await fetchRatings();
    } catch (error) {
      console.error("❌ Error updating rating:", error);
      console.error("❌ Full error object:", error);
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error response data:", error?.response?.data);
      
      let errorMessage = "حدث خطأ غير متوقع";
      if (error?.response?.data) {
        // إذا كانت رسالة الخطأ من API
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // إذا كانت أخطاء validation
          const errors = Object.values(error.response.data.errors).flat();
          errorMessage = errors.join(", ");
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`فشل التعديل: ${errorMessage}`);
    } finally {
      setEditingSending(false);
    }
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingScore(0);
    setEditingDifficulty(2);
    setEditingComment("");
  };

  // حذف التقييم
  const handleDeleteRating = async (evaluationId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التقييم؟")) {
      return;
    }

    setDeletingId(evaluationId);
    try {
      await deleteProblemRating(evaluationId);

      // تحديث البيانات المحلية
      const currentUserId = session?.responseUserDTO?.id;
      setRatingsData((prev) => {
        const updatedEvaluations = prev.problemEvaluationDTO.filter(
          (ev) => ev.id !== evaluationId
        );
        const stillHasMyRating = updatedEvaluations.some(
          (ev) => ev.userId === currentUserId
        );
        return {
          ...prev,
          problemEvaluationDTO: updatedEvaluations,
          isEvaluatedByCurrentUser: stillHasMyRating,
        };
      });

      alert("تم حذف التقييم بنجاح!");
      // إعادة جلب التقييمات
      await fetchRatings();
    } catch (error) {
      console.error("❌ Error deleting rating:", error);
      alert("فشل حذف التقييم: " + (error.response?.data?.message || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (codeEditorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = codeEditorRef.current.scrollTop;
    }
  };

  if (loading) {
    return (
      <div className="solver-page">
        <div className="solver-loading">
          <div className="solver-spinner"></div>
          <p>جاري تحميل المسألة...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="solver-page">
        <div className="solver-error">
          <i className="bx bx-error-circle"></i>
          <h2>لم يتم العثور على المسألة</h2>
          <button 
            onClick={() => {
              // التحقق من إذا كان المستخدم أتى من صفحة المسابقة
              if (location.state?.fromContest && location.state?.contestId) {
                navigate(`/ViewContest/${location.state.contestId}`);
              } else {
                navigate('/react-app/dashboard', { state: { activeTab: 'questions' } });
              }
            }} 
            className="solver-btn"
          >
            {location.state?.fromContest ? "العودة للمسابقة" : "العودة للأسئلة"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="solver-page">
      {/* Header */}
      <div className="solver-header">
        <div className="solver-header-left">
          <button
            onClick={() => {
              // التحقق من إذا كان المستخدم أتى من صفحة المسابقة
              if (location.state?.fromContest && location.state?.contestId) {
                navigate(`/ViewContest/${location.state.contestId}`);
              } else {
                navigate('/react-app/dashboard', { state: { activeTab: 'questions' } });
              }
            }}
            className="solver-back-btn"
            title={location.state?.fromContest ? "العودة للمسابقة" : "العودة للأسئلة"}
          >
            <i className="bx bx-list-ul"></i>
          </button>
          <h1 className="solver-title">{problem.title}</h1>
          <span className={`solver-difficulty ${getDifficultyClass(problem.difficulty)}`}>
            {getDifficultyLabel(problem.difficulty)}
          </span>
        </div>
        
        <div className="solver-header-right">
          <button className="solver-header-btn" title="حفظ">
            <i className="bx bx-bookmark"></i>
          </button>
          <button 
            className="solver-header-btn" 
            title="محاولاتي"
            onClick={() => navigate(`/submissions/${session?.responseUserDTO?.id}`)}
          >
            <i className="bx bx-history"></i>
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="solver-split" ref={splitRef}>
        {/* Left Panel - Problem Description */}
        <div className="solver-left" style={{ width: `${leftWidth}%` }}>
          {/* Tabs */}
          <div className="solver-tabs">
            <button
              className={`solver-tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              الوصف
            </button>
            <button
              className={`solver-tab ${activeTab === "examples" ? "active" : ""}`}
              onClick={() => setActiveTab("examples")}
            >
              الأمثلة
            </button>
            <button
              className={`solver-tab ${activeTab === "ratings" ? "active" : ""}`}
              onClick={() => setActiveTab("ratings")}
            >
              التقييمات
            </button>
          </div>

          {/* Tab Content */}
          <div className="solver-content">
            {activeTab === "description" && (
              <>
                {/* Problem Image */}
                {problem.imageUrl && (
                  <div className="solver-section">
                    <img 
                      src={problem.imageUrl} 
                      alt={problem.title} 
                      className="solver-image"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="solver-section">
                  <h2 className="solver-section-title">وصف المسألة</h2>
                  <div 
                    className="solver-text" 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionProblem) }}
                  />
                </div>

                {/* Input/Output */}
                <div className="solver-section">
                  <h2 className="solver-section-title">المدخلات</h2>
                  <div 
                    className="solver-code-block"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionInput) }}
                  />
                </div>

                <div className="solver-section">
                  <h2 className="solver-section-title">المخرجات</h2>
                  <div 
                    className="solver-code-block"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionOutput) }}
                  />
                </div>

                {/* Constraints */}
                <div className="solver-section">
                  <h2 className="solver-section-title">القيود</h2>
                  <ul className="solver-list">
                    <li>الذاكرة: {problem.memory} MB</li>
                    <li>الوقت: {problem.time} ms</li>
                  </ul>
                </div>

                {/* Author Notes */}
                {problem.authorNotes && (
                  <div className="solver-section">
                    <div className="solver-notes">
                      <strong>ملاحظات: </strong>
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.authorNotes) }} />
                    </div>
                  </div>
                )}

                {/* Tags */}
                {problem.tags && problem.tags.length > 0 && (
                  <div className="solver-section">
                    <h2 className="solver-section-title">التصنيفات</h2>
                    <div className="solver-tags">
                      {problem.tags.map((tag) => (
                        <span key={tag.id} className="solver-tag">
                          {tag.tagName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "examples" && (
              <div className="solver-section">
                <h2 className="solver-section-title">حالات الاختبار</h2>
                {problem.testCase && problem.testCase.length > 0 ? (
                  <div className="solver-examples">
                    {problem.testCase.map((tc, index) => (
                      <div key={tc.id || index} className="solver-example">
                        <div className="solver-example-header">
                          <strong>مثال {index + 1}</strong>
                          {tc.isSample && <span className="solver-sample-badge">نموذجي</span>}
                        </div>
                        <div className="solver-example-body">
                          <div>
                            <strong>المدخل:</strong>
                            <div className="solver-code-block">
                              <pre>{tc.input}</pre>
                            </div>
                          </div>
                          <div>
                            <strong>المخرج المتوقع:</strong>
                            <div className="solver-code-block">
                              <pre>{tc.expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="solver-empty">لا توجد حالات اختبار متاحة</p>
                )}
              </div>
            )}

            {activeTab === "ratings" && (
              <div className="solver-content">
                {loadingRatings ? (
                  <div className="solver-loading">
                    <div className="solver-spinner"></div>
                    <p>جاري تحميل التقييمات...</p>
                  </div>
                ) : ratingsData ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* إحصائيات التقييمات */}
              <div className="solver-section">
                      <h2 className="solver-section-title">التقييمات</h2>
                      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "10px" }}>
                          <div>
                            <strong>متوسط التقييم:</strong> {ratingsData.averageScore?.toFixed(2) || "0.00"} / 5.00
                          </div>
                          <div>
                            <strong>عدد التقييمات:</strong> {ratingsData.problemEvaluationDTO?.length || 0}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "15px", fontSize: "14px", color: "#666" }}>
                          <span>سهل: {ratingsData.numberOfEvaluationsEasy || 0}</span>
                          <span>متوسط: {ratingsData.numberOfEvaluationsMedium || 0}</span>
                          <span>صعب: {ratingsData.numberOfEvaluationsHard || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* قائمة التقييمات */}
                    <div className="solver-section">
                      <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>التقييمات السابقة</h3>
                      {ratingsData.problemEvaluationDTO && ratingsData.problemEvaluationDTO.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                          {ratingsData.problemEvaluationDTO.map((evaluation) => {
                            const starsValue = evaluation.evaluationScore / 2; // تحويل من 0-10 إلى 0-5
                            const difficultyLabels = { 1: "سهل", 2: "متوسط", 3: "صعب" };
                            return (
                              <div
                                key={evaluation.id}
                                style={{
                                  padding: "15px",
                                  backgroundColor: "#fff",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {evaluation.imageURL ? (
                                      <img 
                                        src={evaluation.imageURL} 
                                        alt={evaluation.userName || "مستخدم"} 
                                        style={{ 
                                          width: "40px", 
                                          height: "40px", 
                                          borderRadius: "50%", 
                                          objectFit: "cover" 
                                        }} 
                                      />
                                    ) : (
                                      <div style={{ 
                                        width: "40px", 
                                        height: "40px", 
                                        borderRadius: "50%", 
                                        backgroundColor: "#e0e0e0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#999",
                                        fontSize: "18px",
                                        fontWeight: "bold"
                                      }}>
                                        {evaluation.userName?.[0]?.toUpperCase() || "?"}
                                      </div>
                                    )}
                                    <div>
                                      <strong>{evaluation.userName || "مستخدم"}</strong>
                                      <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                                        {new Date(evaluation.evaluatedAt).toLocaleString("ar-EG")}
                                      </div>
                                    </div>
                                  </div>
                                  {evaluation.userId === session?.responseUserDTO?.id && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                                        onClick={() => handleStartEdit(evaluation)}
                                        disabled={editingId === evaluation.id || deletingId === evaluation.id}
                                        style={{
                                          padding: "6px 12px",
                                          backgroundColor: "#fff",
                                          color: "#6b46c1",
                                          border: "1px solid #6b46c1",
                                          borderRadius: "5px",
                                          fontSize: "14px",
                                          cursor: "pointer",
                                          fontWeight: "500",
                                        }}
                                      >
                                        تعديل
                  </button>
                                      <button
                                        onClick={() => handleDeleteRating(evaluation.id)}
                                        disabled={editingId === evaluation.id || deletingId === evaluation.id}
                                        style={{
                                          padding: "6px 12px",
                                          backgroundColor: "#dc2626",
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: "5px",
                                          fontSize: "14px",
                                          cursor: "pointer",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {deletingId === evaluation.id ? "جاري الحذف..." : "حذف"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {editingId === evaluation.id ? (
                                  <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                      {/* التقييم بالنجوم */}
                                      <div>
                                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                                          التقييم:
                                        </label>
                                        <div style={{ display: "flex", gap: "5px", alignItems: "center", justifyContent: "flex-end", flexDirection: "row-reverse" }}>
                                          <span style={{ marginRight: "10px", fontSize: "14px" }}>
                                            ({editingScore}/5)
                                          </span>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => setEditingScore(star)}
                                              style={{
                                                fontSize: "24px",
                                                border: "none",
                                                background: "transparent",
                                                cursor: "pointer",
                                                color: star <= editingScore ? "#ffc107" : "#ddd",
                                                padding: "0",
                                              }}
                                            >
                                              ★
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* الصعوبة */}
                                      <div>
                                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                                          الصعوبة:
                                        </label>
                                        <select
                                          value={editingDifficulty}
                                          onChange={(e) => setEditingDifficulty(Number(e.target.value))}
                                          style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "5px",
                                            border: "1px solid #ddd",
                                            fontSize: "14px",
                                            textAlign: "right",
                                            direction: "rtl",
                                          }}
                                        >
                                          <option value={1}>سهل</option>
                                          <option value={2}>متوسط</option>
                                          <option value={3}>صعب</option>
                                        </select>
                                      </div>

                                      {/* التعليق */}
                                      <div>
                                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                                          التعليق:
                                        </label>
                                        <textarea
                                          value={editingComment}
                                          onChange={(e) => setEditingComment(e.target.value)}
                                          rows={4}
                                          placeholder="اكتب تعليقك هنا..."
                                          style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "5px",
                                            border: "1px solid #ddd",
                                            fontSize: "14px",
                                            fontFamily: "inherit",
                                            resize: "vertical",
                                            textAlign: "right",
                                            direction: "rtl",
                                          }}
                                        />
                                      </div>

                                      {/* أزرار الحفظ والإلغاء */}
                                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                        <button
                                          onClick={() => handleSaveEdit(evaluation)}
                                          disabled={editingSending || editingScore === 0}
                                          style={{
                                            padding: "8px 16px",
                                            backgroundColor: editingScore === 0 ? "#ccc" : "#10b981",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "5px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor: editingScore === 0 ? "not-allowed" : "pointer",
                                          }}
                                        >
                                          {editingSending ? "جاري الحفظ..." : "حفظ"}
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          disabled={editingSending}
                                          style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#e5e7eb",
                                            color: "#374151",
                                            border: "none",
                                            borderRadius: "5px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                          }}
                                        >
                                          إلغاء
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <span style={{ fontSize: "14px" }}>التقييم:</span>
                                        <div style={{ display: "flex", gap: "2px" }}>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                              key={star}
                                              style={{
                                                fontSize: "18px",
                                                color: star <= starsValue ? "#ffc107" : "#ddd",
                                              }}
                                            >
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                        <span style={{ fontSize: "14px", marginLeft: "5px" }}>
                                          ({starsValue.toFixed(1)})
                                        </span>
                                      </div>
                                      <div>
                                        <span style={{ fontSize: "14px" }}>الصعوبة: </span>
                                        <strong>{difficultyLabels[evaluation.problemDifficulty] || evaluation.problemDifficulty}</strong>
                                      </div>
                                    </div>
                                    {evaluation.comments && (
                                      <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px", textAlign: "right" }}>
                                        {evaluation.comments}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="solver-empty">لا توجد تقييمات بعد.</p>
                      )}
                    </div>

                    {/* نموذج إضافة تقييم - يظهر في النهاية إذا كان المستخدم مسجل دخول ولم يقم بالتقييم بعد */}
                    {ratingsData && session?.responseUserDTO?.id && !ratingsData.isEvaluatedByCurrentUser && (
                      <div className="solver-section" style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f0f4ff", borderRadius: "8px", border: "1px solid #c5d5ff" }}>
                        <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#6b46c1" }}>أضف تقييمك</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                          {/* التقييم بالنجوم */}
                          <div>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                              التقييم:
                            </label>
                            <div style={{ display: "flex", gap: "5px", alignItems: "center", justifyContent: "flex-end", flexDirection: "row-reverse" }}>
                              <span style={{ marginRight: "10px", fontSize: "14px" }}>
                                ({ratingScore}/5)
                              </span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingScore(star)}
                                  style={{
                                    fontSize: "24px",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: star <= ratingScore ? "#ffc107" : "#ddd",
                                    padding: "0",
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* الصعوبة */}
                          <div>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                              الصعوبة:
                            </label>
                            <select
                              value={ratingDifficulty}
                              onChange={(e) => setRatingDifficulty(Number(e.target.value))}
                              style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "5px",
                                border: "1px solid #ddd",
                                fontSize: "14px",
                                textAlign: "right",
                                direction: "rtl",
                              }}
                            >
                              <option value={1}>سهل</option>
                              <option value={2}>متوسط</option>
                              <option value={3}>صعب</option>
                            </select>
                          </div>

                          {/* التعليق */}
                          <div>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", textAlign: "right" }}>
                              التعليق:
                            </label>
                            <textarea
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              rows={4}
                              placeholder="اكتب تعليقك هنا..."
                              style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "5px",
                                border: "1px solid #ddd",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                resize: "vertical",
                                textAlign: "right",
                                direction: "rtl",
                              }}
                            />
                          </div>

                          {/* زر الإرسال */}
                          <button
                            onClick={handleSubmitRating}
                            disabled={submittingRating || ratingScore === 0}
                            style={{
                              padding: "10px 20px",
                              backgroundColor: ratingScore === 0 ? "#ccc" : "#6b46c1",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "16px",
                              fontWeight: "500",
                              cursor: ratingScore === 0 ? "not-allowed" : "pointer",
                              alignSelf: "center",
                              width: "100%",
                              marginTop: "10px",
                            }}
                          >
                            {submittingRating ? "جاري الإرسال..." : "إرسال"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* رسالة إذا كان المستخدم قد قيّم بالفعل */}
                    {ratingsData && ratingsData.isEvaluatedByCurrentUser && (
                      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #c8e6c9", textAlign: "center" }}>
                        <p style={{ margin: 0, color: "#2e7d32" }}>✓ لقد قيّمت هذه المشكلة بالفعل</p>
                      </div>
                    )}

                    {/* رسالة تسجيل الدخول */}
                    {ratingsData && !ratingsData.isEvaluatedByCurrentUser && !session?.responseUserDTO?.id && (
                      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "8px", border: "1px solid #ffc107", textAlign: "center" }}>
                        <p style={{ margin: 0, marginBottom: "10px" }}>يجب تسجيل الدخول لإضافة تقييم</p>
                        <button
                          onClick={() => navigate("/react-app/Login")}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#4a90e2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          تسجيل الدخول
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="solver-section">
                    <h2 className="solver-section-title">التقييمات</h2>
                    <p className="solver-empty">لا توجد بيانات التقييمات</p>
                    <button
                      onClick={fetchRatings}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        backgroundColor: "#6b46c1",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div 
          className={`solver-resizer ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="solver-resizer-line"></div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="solver-right" style={{ width: `${100 - leftWidth}%` }}>
          {/* Code Editor Header */}
          <div className="solver-editor-header">
            <span className="solver-editor-title">
              <i className="bx bx-code-alt"></i>
              محرر الكود
            </span>
            <button 
              className="solver-reset-btn"
              onClick={handleReset}
              title="إعادة تعيين"
            >
              <i className="bx bx-reset"></i>
            </button>
          </div>

          {/* Code Editor */}
          <div className="solver-editor">
            <div className="solver-editor-wrapper">
              {/* Code Textarea */}
              <textarea
                ref={codeEditorRef}
                className="solver-code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                placeholder="اكتب كود C++ هنا..."
                spellCheck="false"
              />
              {/* Line Numbers */}
              <div className="solver-line-numbers" ref={lineNumbersRef}>
                {code.split('\n').map((_, index) => (
                  <div key={index} className="solver-line-number">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className={`solver-results solver-results--${testResults.status}`}>
              <div className="solver-results-header">
                <i className={`bx ${testResults.status === 'accepted' ? 'bx-check-circle' : 'bx-x-circle'}`}></i>
                <span>{testResults.status === 'accepted' ? 'مقبول' : 'مرفوض'}</span>
              </div>
              <p className="solver-results-text">{testResults.verdict}</p>
            </div>
          )}

          {/* Actions */}
          <div className="solver-actions">
            <button 
              className="solver-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="solver-spinner-small"></span>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <i className="bx bx-send"></i>
                  إرسال الحل
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolver;

