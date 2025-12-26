import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import { getUserProposals } from "../../Service/problemRequestService";
import { CardSkeleton } from "../../Components/SkeletonLoading";
import DOMPurify from "dompurify";
import "./influencerPage.css";

const InfluencerPage = () => {
  const navigate = useNavigate();
  const session = useSelector(selectAuthSession);
  const currentUserId = session?.responseUserDTO?.id;
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // دالة لتنظيف HTML قبل العرض
  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "div", "span", "pre", "code", "blockquote"],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "style"],
    });

  // جلب المساهمات السابقة (المسائل المقترحة من قبل المستخدم)
  useEffect(() => {
    const fetchContributions = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // ✅ استخدام الدالة الجديدة من problemRequestService
        const data = await getUserProposals(currentUserId);
        setContributions(data);
      } catch (error) {
        console.error("❌ Error fetching contributions:", error);
        setContributions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [currentUserId]);

  const contributionOptions = [
    {
      title: "أرفق حالات اختبار قوية",
      description: "قدم Test Cases متنوعة لتقييم الحلول والتأكد من دقتها في جميع الحالات.",
    },
    {
      title: "أضف التفسير أو الفكرة",
      description: "الشرح المنطق الأساسي للمشكلة أو الهدف منها المساعد المتدربين على فهم السياق.",
    },
    {
      title: "اقترح مسألة جديدة",
      description: "أضف مشكلة برمجية مع تعريف واضح ومدخلات ومخرجات ليستفيد منها جميع المتعلمين",
    },
  ];

  // دالة لتحويل حالة الطلب إلى نص عربي
  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "قيد المراجعة ⏳";
      case 2:
        return "مقبولة ✅";
      case 3:
        return "مرفوضة ❌";
      default:
        return "غير معروف";
    }
  };

  // دالة للحصول على ألوان الحالة
  const getStatusClass = (status) => {
    switch (status) {
      case 1:
        return "influencer-page__status--pending";
      case 2:
        return "influencer-page__status--approved";
      case 3:
        return "influencer-page__status--rejected";
      default:
        return "influencer-page__status--unknown";
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-JO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "تاريخ غير صحيح";
    }
  };

  return (
    <div className="influencer-page">
      <div className="influencer-page__container">
        {/* المحتوى الرئيسي */}
        <div className="influencer-page__main">
          {/* العنوان الرئيسي */}
          <div className="influencer-page__header">
            <h1 className="influencer-page__title">
              شارك في بناء مجتمع المبرمجين
            </h1>
            <p className="influencer-page__subtitle">
              أضف مسائل برمجية جديدة مع الحالات الاختبارية، وساعد الآخرين على تحسين مهاراتهم في التحليل وحل المشكلات.
            </p>
          </div>

          {/* بطاقات الخيارات */}
          <div className="influencer-page__options">
            {contributionOptions.map((option, index) => (
              <div
                key={index}
                className="influencer-page__option-card"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <h3 className="influencer-page__option-title">{option.title}</h3>
                <p className="influencer-page__option-description">{option.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="influencer-page__cta">
            <p className="influencer-page__cta-text">
              شاركنا أفكارك لمسائل جديدة وكن جزءا من تطوير المجتمع!
            </p>
            <button 
              className="influencer-page__cta-button"
              onClick={() => navigate("/react-app/addProblemProposal")}
            >
              اضافة
            </button>
          </div>
        </div>

        {/* المساهمات السابقة */}
        <div className="influencer-page__contributions">
          <h2 className="influencer-page__contributions-title">مساهماتك السابقة</h2>
          
          {loading ? (
            <CardSkeleton count={3} />
          ) : contributions.length === 0 ? (
            <div className="influencer-page__empty">
              <p>لا توجد مساهمات سابقة</p>
            </div>
          ) : (
            <div className="influencer-page__contributions-list">
              {contributions.map((contribution, index) => (
                <div
                  key={contribution.id || index}
                  className="influencer-page__contribution-card"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {contribution.imageUrl && (
                    <div className="influencer-page__contribution-image">
                      <img
                        src={contribution.imageUrl}
                        alt={contribution.title || "مساهمة"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="influencer-page__contribution-content">
                    <h3 className="influencer-page__contribution-title">
                      {contribution.title || "السوال الاول"}
                    </h3>
                    
                    {/* حالة الطلب */}
                    {contribution.status !== undefined && (
                      <div className={`influencer-page__status ${getStatusClass(contribution.status)}`}>
                        {getStatusText(contribution.status)}
                      </div>
                    )}

                    <div 
                      className="influencer-page__contribution-description"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(contribution.descriptionProblem || "descriptionProblem") }}
                    />

                    {/* معلومات إضافية */}
                    <div className="influencer-page__contribution-meta">
                      {contribution.difficulty && (
                        <div className="influencer-page__meta-item">
                          <span className="influencer-page__meta-label">الصعوبة:</span>
                          <span className="influencer-page__meta-value">{contribution.difficulty}</span>
                        </div>
                      )}
                      {contribution.memory && (
                        <div className="influencer-page__meta-item">
                          <span className="influencer-page__meta-label">الذاكرة:</span>
                          <span className="influencer-page__meta-value">{contribution.memory} MB</span>
                        </div>
                      )}
                      {contribution.time && (
                        <div className="influencer-page__meta-item">
                          <span className="influencer-page__meta-label">الوقت:</span>
                          <span className="influencer-page__meta-value">{contribution.time} ms</span>
                        </div>
                      )}
                      {contribution.testCaseRequest && contribution.testCaseRequest.length > 0 && (
                        <div className="influencer-page__meta-item">
                          <span className="influencer-page__meta-label">حالات الاختبار:</span>
                          <span className="influencer-page__meta-value">{contribution.testCaseRequest.length}</span>
                        </div>
                      )}
                    </div>

                    {contribution.tagsRequest && contribution.tagsRequest.length > 0 && (
                      <div className="influencer-page__contribution-tags">
                        {contribution.tagsRequest.map((tag, tagIndex) => (
                          <span key={tag.id || tagIndex} className="influencer-page__tag">
                            {tag.tagName || "tagName"}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* تاريخ الإنشاء */}
                    {contribution.createdAt && (
                      <div className="influencer-page__contribution-date">
                        📅 {formatDate(contribution.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfluencerPage;

