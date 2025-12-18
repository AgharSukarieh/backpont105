import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTags, getExplaineTagsByTagId, getExplaineTagById } from "../../Service/TagServices";
import expandRightLight from "../../assets/Expand_right_light.png";
import vector9 from "../../assets/Vector 9.png";
import "./algorithms.css";

const Algorithms = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTagId, setExpandedTagId] = useState(null);
  const [algorithms, setAlgorithms] = useState({});
  const [loadingAlgorithms, setLoadingAlgorithms] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // جلب جميع التصنيفات والخوارزميات عند تحميل الصفحة
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const data = await getAllTags();
        console.log("📊 Tags data:", data);
        setTags(data || []);
        
        // جلب الخوارزميات لكل tag مباشرة
        const allAlgorithms = {};
        const loadingStates = {};
        
        for (const tag of data || []) {
          loadingStates[tag.id] = true;
        }
        setLoadingAlgorithms(loadingStates);
        
        for (const tag of data || []) {
          try {
            const algos = await getExplaineTagsByTagId(tag.id);
            console.log(`📚 Algorithms for tag ${tag.id} (${tag.tagName}):`, {
              raw: algos,
              isArray: Array.isArray(algos),
              length: Array.isArray(algos) ? algos.length : 'not array',
              type: typeof algos
            });
            
            // التأكد من أن algos هي مصفوفة
            const algorithmsArray = Array.isArray(algos) ? algos : [];
            
            if (algorithmsArray.length === 0) {
              console.warn(`⚠️ No algorithms found for tag ${tag.id} (${tag.tagName})`);
              allAlgorithms[tag.id] = [];
              setLoadingAlgorithms((prev) => ({ ...prev, [tag.id]: false }));
              continue;
            }
            
            // جلب التفاصيل الكاملة لكل خوارزمية من GetExplaineTagById للحصول على complexity
            const algosWithDetails = await Promise.all(
              algorithmsArray.map(async (algo) => {
                try {
                  const fullDetails = await getExplaineTagById(algo.id);
                  console.log(`🔍 Fetched details for algo ${algo.id} from GetExplaineTagById:`, {
                    id: fullDetails.id,
                    title: fullDetails.title,
                    complexity: fullDetails.complexity,
                    hasComplexity: !!fullDetails.complexity
                  });
                  return {
                    ...algo,
                    complexity: fullDetails.complexity || algo.complexity, // استخدام complexity من GetExplaineTagById
                    overview: fullDetails.overview || algo.overview || tag.description
                  };
                } catch (err) {
                  console.error(`❌ Error fetching details for algo ${algo.id}:`, err);
                  return {
                    ...algo,
                    overview: algo.overview || tag.description
                  };
                }
              })
            );
            
            // إضافة description من الـ tag للخوارزميات
            const algosWithDescription = algosWithDetails.map(algo => {
              console.log(`🔍 Algorithm ${algo.id} final:`, {
                title: algo.title,
                complexity: algo.complexity,
                hasComplexity: !!algo.complexity
              });
              return {
                ...algo,
                overview: algo.overview || tag.description, // استخدام description من الـ tag إذا لم يكن هناك overview
                tagDescription: tag.description // حفظ description للاستخدام
              };
            });
            
            allAlgorithms[tag.id] = algosWithDescription;
            console.log(`✅ Successfully loaded ${algosWithDescription.length} algorithms for tag ${tag.id} (${tag.tagName})`);
            setLoadingAlgorithms((prev) => ({ ...prev, [tag.id]: false }));
          } catch (err) {
            console.error(`❌ Error fetching algorithms for tag ${tag.id} (${tag.tagName}):`, err);
            allAlgorithms[tag.id] = [];
            setLoadingAlgorithms((prev) => ({ ...prev, [tag.id]: false }));
          }
        }
        
        setAlgorithms(allAlgorithms);
      } catch (err) {
        console.error("❌ Error fetching tags:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // الانتقال لصفحة الخوارزمية
  const goToAlgorithm = (algorithmId) => {
    navigate(`/algorithm/${algorithmId}`);
  };

  // تنظيف الـ HTML وأخذ أول 150 حرف
  const getCleanOverview = (htmlContent) => {
    if (!htmlContent) return '';
    // إزالة HTML tags
    const text = htmlContent.replace(/<[^>]*>/g, '');
    // أخذ أول 150 حرف
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  // فلترة التصنيفات حسب البحث
  const filteredTags = tags.filter((tag) =>
    tag.tagName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="algorithms-loading">
        <div className="algorithms-spinner"></div>
        <p>جاري تحميل الخوارزميات...</p>
      </div>
    );
  }

  return (
    <div className="algorithms-page" dir="rtl">
      <div className="algorithms-container">
        {/* Search */}
        <div className="algorithms-search-wrapper">
          <input
            type="text"
            placeholder="ابحث عن تصنيف أو خوارزمية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="algorithms-search-input"
          />
          <i className="bx bx-search algorithms-search-icon"></i>
        </div>

        {/* Tags Grid */}
        {filteredTags.length === 0 ? (
          <div className="algorithms-empty">
            <i className="bx bx-search-alt"></i>
            <p>لا توجد نتائج مطابقة للبحث</p>
          </div>
        ) : (
          <div className="algorithms-sections">
            {filteredTags.map((tag) => (
              <div key={tag.id} className="algorithm-section">
                {/* Tag Card */}
                <div className="algorithm-tag-card">
                  <div className="algorithm-tag-image">
                    {tag.imageURL ? (
                      <img src={tag.imageURL} alt={tag.tagName} />
                    ) : (
                      <div className="algorithm-tag-placeholder">
                        <i className="bx bx-code-alt"></i>
                      </div>
                    )}
                  </div>
                  <div className="algorithm-tag-content">
                    <h2 className="algorithm-tag-name">{tag.tagName}</h2>
                    <p className="algorithm-tag-short-desc">
                      {tag.shortDescription || "لا يوجد وصف"}
                    </p>
                    {tag.description && (
                      <p className="algorithm-tag-desc">{tag.description}</p>
                    )}
                  </div>
                </div>

                {/* Algorithms List - Always Visible */}
                <div className="algorithms-list">
                  {loadingAlgorithms[tag.id] ? (
                    <div className="algorithms-list-loading">
                      <div className="loading-spinner-small"></div>
                      <span>جارٍ تحميل الخوارزميات...</span>
                    </div>
                  ) : (() => {
                    // التحقق بشكل أفضل من وجود الخوارزميات
                    const tagAlgorithms = algorithms[tag.id];
                    const hasAlgorithms = Array.isArray(tagAlgorithms) && tagAlgorithms.length > 0;
                    
                    console.log(`🔍 Tag ${tag.id} (${tag.tagName}):`, {
                      hasAlgorithms,
                      algorithmsCount: Array.isArray(tagAlgorithms) ? tagAlgorithms.length : 0,
                      algorithms: tagAlgorithms,
                      loading: loadingAlgorithms[tag.id]
                    });
                    
                    if (!hasAlgorithms) {
                      return (
                        <div className="algorithms-list-empty">
                          <i className="bx bx-info-circle"></i>
                          <p>لا توجد خوارزميات متاحة لهذا التصنيف حالياً</p>
                        </div>
                      );
                    }
                    
                    return (
                    <div className="algorithms-grid">
                        {tagAlgorithms.map((algo, index) => (
                        <div
                          key={algo.id}
                          className={`algorithm-item algorithm-item--color-${(index % 8) + 1}`}
                          onClick={() => goToAlgorithm(algo.id)}
                        >
                          <div className="algorithm-item-header">
                            <h3 className="algorithm-item-title">
                              {algo.title}
                            </h3>
                          </div>
                          {algo.overview && (
                            <div className="algorithm-item-overview">
                              {getCleanOverview(algo.overview)}
                            </div>
                          )}
                          <div className="algorithm-item-footer">
                            {algo.complexity && (
                              <span className="algorithm-complexity">
                                التعقيد الزمني : {algo.complexity}
                              </span>
                            )}
                            <span className="algorithm-item-link">
                              عرض التفاصيل
                              <img 
                                src={vector9} 
                                alt="arrow" 
                                className="algorithm-item-arrow"
                              />
                              <img 
                                src={expandRightLight} 
                                alt="arrow-hover" 
                                className="algorithm-item-arrow-hover"
                              />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Algorithms;

