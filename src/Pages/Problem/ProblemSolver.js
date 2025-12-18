import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import { getProblemById } from "../../Service/ProblemService";
import { handelSubmission } from "../../Service/submissionServices";
import DOMPurify from "dompurify";
import "./problemSolver.css";

const ProblemSolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useSelector(selectAuthSession);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [leftWidth, setLeftWidth] = useState(50); // النسبة المئوية للجزء الأيسر
  const [isResizing, setIsResizing] = useState(false);

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
        navigate('/login');
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
          navigate('/login');
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
          <button onClick={() => navigate('/dashboard', { state: { activeTab: 'questions' } })} className="solver-btn">
            العودة للأسئلة
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
            onClick={() => navigate('/dashboard', { state: { activeTab: 'questions' } })}
            className="solver-back-btn"
            title="العودة للأسئلة"
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
              className={`solver-tab ${activeTab === "submissions" ? "active" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              المحاولات
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

            {activeTab === "submissions" && (
              <div className="solver-section">
                <h2 className="solver-section-title">محاولاتي السابقة</h2>
                <p className="solver-empty">
                  لعرض جميع محاولاتك، 
                  <button 
                    className="solver-link-btn"
                    onClick={() => navigate(`/submissions/${session?.responseUserDTO?.id}`)}
                  >
                    اضغط هنا
                  </button>
                </p>
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

