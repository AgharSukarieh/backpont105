import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthToken, selectAuthSession } from "../../store/authSlice";
import { getUserSubmissions } from "../../Service/submissionServices";
import "./submissions.css";

const Submissions = ({ onBack }) => {
  const { userId: userIdParam } = useParams();
  const token = useSelector(selectAuthToken);
  const session = useSelector(selectAuthSession);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  const navigate = useNavigate();
  
  // استخدام onBack إذا كان موجود، وإلا الرجوع للدشبورد مع فتح البروفايل
  const handleBack = onBack || (() => {
    navigate('/dashboard', { state: { openProfile: true } });
  });

  // استخدام userId من الـ params أو من الـ session
  const userId = userIdParam || session?.responseUserDTO?.id;

  // طباعة التوكن والـ session
  useEffect(() => {
    console.log("🔑 Token:", token);
    console.log("👤 Session:", session);
    console.log("🆔 User ID from params:", userIdParam);
    console.log("🆔 User ID from session:", session?.responseUserDTO?.id);
    console.log("✅ Final User ID:", userId);
  }, [token, session, userIdParam, userId]);

  const fetchSubmissions = async (page) => {
    setLoading(true);
    try {
      const data = await getUserSubmissions(userId, page, itemsPerPage);
      console.log("📦 Submissions data:", data);
      
      // Handle array response directly
      if (Array.isArray(data)) {
        setSubmissions(data);
        setTotalPages(1); // Since API returns all items, we'll use client-side pagination
      } else {
        setSubmissions(data.items || data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("❌ Error fetching submissions:", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubmissions(currentPage);
    }
  }, [userId, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusInfo = (isAccepted) => {
    if (isAccepted === 3 || isAccepted === 2) {
      return {
        label: "مقبولة",
        icon: "bx-check-circle",
        className: "submissions-status--accepted"
      };
    } else if (isAccepted === 0) {
      return {
        label: "مرفوضة",
        icon: "bx-x-circle",
        className: "submissions-status--rejected"
      };
    } else {
      return {
        label: "قيد التقييم",
        icon: "bx-time-five",
        className: "submissions-status--pending"
      };
    }
  };

  if (!userId && !loading) {
    return (
      <div className="submissions-page">
        <div className="submissions-error">
          <i className="bx bx-error-circle"></i>
          <h2>خطأ في تحميل البيانات</h2>
          <p>لم يتم العثور على معرف المستخدم. الرجاء تسجيل الدخول مرة أخرى.</p>
          <button onClick={() => navigate("/login")} className="submission-detail-btn submission-detail-btn--secondary">
            <i className="bx bx-log-in"></i>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="submissions-page">
        <div className="submissions-loading">
          <div className="submissions-spinner"></div>
          <p>جاري تحميل المحاولات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      <div className="submissions-container">
        {/* Header */}
        <div className="submissions-header">
          <button
            onClick={handleBack}
            className="submissions-back-btn"
            aria-label="العودة"
          >
            <i className="bx bx-arrow-back"></i>
          </button>
          <div className="submissions-header-content">
            <h1 className="submissions-title">سجل المحاولات</h1>
          </div>
        </div>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <div className="submissions-empty">
            <i className="bx bx-file"></i>
            <h2>لا توجد محاولات بعد</h2>
            <p>ابدأ بحل المسائل لرؤية محاولاتك هنا</p>
          </div>
        ) : (
          <>
            <div className="submissions-table-wrapper">
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المسألة</th>
                    <th>الحالة</th>
                    <th>النتيجة</th>
                    <th>الوقت</th>
                    <th>الذاكرة</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const statusInfo = getStatusInfo(sub.isAccepted);
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => navigate(`/submission/${sub.id}`)}
                        className="submissions-row"
                      >
                        <td data-label="#">{sub.id}</td>
                        <td data-label="المسألة" className="submissions-problem-title">
                          {sub.titleProblem || `Problem ${sub.problemId}`}
                        </td>
                        <td data-label="الحالة">
                          <span className={`submissions-status ${statusInfo.className}`}>
                            <i className={`bx ${statusInfo.icon}`}></i>
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td data-label="النتيجة" className="submissions-verdict">
                          {sub.verdict}
                        </td>
                        <td data-label="الوقت">
                          {sub.executionTime > 0 ? `${sub.executionTime} ms` : '-'}
                        </td>
                        <td data-label="الذاكرة">
                          {sub.memoryUsed > 0 ? `${sub.memoryUsed} KB` : '-'}
                        </td>
                        <td data-label="التاريخ">
                          {new Date(sub.submitAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="submissions-pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="submissions-pagination-btn"
                >
                  <i className="bx bx-chevron-right"></i>
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`submissions-pagination-btn ${
                      currentPage === page ? "submissions-pagination-btn--active" : ""
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="submissions-pagination-btn"
                >
                  <i className="bx bx-chevron-left"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Submissions;
