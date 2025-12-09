import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../store/authSlice";
import api from "../../Service/api";
import "./influencerPage.css";

const InfluencerPage = () => {
  const navigate = useNavigate();
  const session = useSelector(selectAuthSession);
  const currentUserId = session?.responseUserDTO?.id;
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب المساهمات السابقة
  useEffect(() => {
    const fetchContributions = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/ProblemRequest/User/${currentUserId}`);
        const data = response.data;
        
        // معالجة البيانات - قد تكون مصفوفة أو كائن واحد
        if (Array.isArray(data)) {
          setContributions(data);
        } else if (data) {
          setContributions([data]);
        } else {
          setContributions([]);
        }
      } catch (error) {
        console.error("Error fetching contributions:", error);
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
              onClick={() => navigate("/addProblemProposal")}
            >
              اضافة
            </button>
          </div>
        </div>

        {/* المساهمات السابقة */}
        <div className="influencer-page__contributions">
          <h2 className="influencer-page__contributions-title">مساهماتك السابقة</h2>
          
          {loading ? (
            <div className="influencer-page__loading">جاري التحميل...</div>
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
                    <p className="influencer-page__contribution-description">
                      {contribution.descriptionProblem || "descriptionProblem"}
                    </p>
                    {contribution.tagsRequest && contribution.tagsRequest.length > 0 && (
                      <div className="influencer-page__contribution-tags">
                        {contribution.tagsRequest.map((tag, tagIndex) => (
                          <span key={tag.id || tagIndex} className="influencer-page__tag">
                            {tag.tagName || "tagName"}
                          </span>
                        ))}
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

