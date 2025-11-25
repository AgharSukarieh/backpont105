import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubmissionById } from "../../Service/submissionServices";
import "./submissionDetail.css";

const SubmissionDetail = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const data = await getSubmissionById(id);
      setSubmission(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  if (loading) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-loading">
          <div className="submission-detail-spinner"></div>
          <p>جاري تحميل تفاصيل المحاولة...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-error">
          <i className="bx bx-error-circle"></i>
          <h2>لم يتم العثور على المحاولة</h2>
          <button onClick={() => navigate(-1)} className="submission-detail-btn submission-detail-btn--secondary">
            <i className="bx bx-arrow-back"></i>
            العودة
          </button>
        </div>
      </div>
    );
  }

  const getStatusInfo = (isAccepted) => {
    if (isAccepted === 3 || isAccepted === 2) {
      return {
        label: "مقبولة",
        icon: "bx-check-circle",
        className: "submission-detail-status--accepted"
      };
    } else {
      return {
        label: "مرفوضة",
        icon: "bx-x-circle",
        className: "submission-detail-status--rejected"
      };
    }
  };

  const statusInfo = getStatusInfo(submission.isAccepted);

  const handleCopyCode = () => {
    if (submission?.code) {
      navigator.clipboard.writeText(submission.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy code:', err);
      });
    }
  };

  return (
    <div className="submission-detail-page">
      <div className="submission-detail-container">
        {/* Header */}
        <div className="submission-detail-header">
          <button
            onClick={() => navigate(-1)}
            className="submission-detail-back-btn"
            aria-label="العودة"
          >
            <i className="bx bx-arrow-back"></i>
          </button>
          <div className="submission-detail-header-content">
            <h1 className="submission-detail-title">{submission.titleProblem}</h1>
            <div className={`submission-detail-status ${statusInfo.className}`}>
              <i className={`bx ${statusInfo.icon}`}></i>
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="submission-detail-content">
          {/* Info Cards */}
          <div className="submission-detail-info-grid">
            <div className="submission-detail-info-card">
              <div className="submission-detail-info-icon" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <i className="bx bx-calendar"></i>
              </div>
              <div className="submission-detail-info-text">
                <span className="submission-detail-info-label">تاريخ الإرسال</span>
                <span className="submission-detail-info-value">
                  {new Date(submission.submitAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>

            <div className="submission-detail-info-card">
              <div className="submission-detail-info-icon" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                <i className="bx bx-memory-card"></i>
              </div>
              <div className="submission-detail-info-text">
                <span className="submission-detail-info-label">الذاكرة المستخدمة</span>
                <span className="submission-detail-info-value">{submission.memoryUsed} KB</span>
              </div>
            </div>

            <div className="submission-detail-info-card">
              <div className="submission-detail-info-icon" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                <i className="bx bx-time"></i>
              </div>
              <div className="submission-detail-info-text">
                <span className="submission-detail-info-label">وقت التنفيذ</span>
                <span className="submission-detail-info-value">{submission.executionTime} ms</span>
              </div>
            </div>
          </div>

          {/* Code Section */}
          <div className="submission-detail-section">
            <div className="submission-detail-section-header">
              <i className="bx bx-code-alt"></i>
              <h2>الكود المرسل</h2>
              <button 
                className="submission-detail-copy-btn"
                onClick={handleCopyCode}
                title={copied ? "تم النسخ!" : "نسخ الكود"}
              >
                <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`}></i>
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            <div className="submission-detail-code-wrapper">
              <div className="submission-detail-code-container">
                <div className="submission-detail-code-lines">
                  {submission.code.split('\n').map((_, index) => (
                    <div key={index} className="submission-detail-code-line-number">
                      {index + 1}
                    </div>
                  ))}
                </div>
                <pre className="submission-detail-code">{submission.code}</pre>
              </div>
            </div>
          </div>

          {/* Verdict Section */}
          <div className="submission-detail-section">
            <div className="submission-detail-section-header">
              <i className="bx bx-message-square-detail"></i>
              <h2>النتيجة</h2>
            </div>
            <div className="submission-detail-verdict-wrapper">
              <pre className="submission-detail-verdict">{submission.verdict}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
