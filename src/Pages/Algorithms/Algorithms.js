import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getAllAlgorithmsWithTags } from "../../Service/algorithmService";
import expandRightLight from "../../assets/Expand_right_light.png";
import vector9 from "../../assets/Vector 9.png";
import { ListSkeleton } from "../../Components/SkeletonLoading";
import "./algorithms.css";

const Algorithms = ({ initialExpandedTagId = null }) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTagId, setExpandedTagId] = useState(initialExpandedTagId);
  const [algorithms, setAlgorithms] = useState({});
  const [loadingAlgorithms, setLoadingAlgorithms] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const tagRefs = useRef({}); // refs للتمرير إلى كل tag section
  
  // فتح التاغ المحدد من URL أو من props
  useEffect(() => {
    if (params.id) {
      const tagIdFromUrl = Number(params.id);
      if (!isNaN(tagIdFromUrl) && tagIdFromUrl > 0) {
        console.log(`🔄 Opening tag ${tagIdFromUrl} from URL`);
        setExpandedTagId(tagIdFromUrl);
      }
    } else if (initialExpandedTagId) {
      console.log(`🔄 Opening tag ${initialExpandedTagId} from props`);
      setExpandedTagId(initialExpandedTagId);
    }
  }, [params.id, initialExpandedTagId]);

  // جلب جميع التصنيفات والخوارزميات عند تحميل الصفحة
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        console.log("🔄 Starting to fetch algorithms with tags...");
        
        // استخدام API الجديد الذي يجلب كل tag مع خوارزمياته مباشرة
        const tagsWithAlgorithms = await getAllAlgorithmsWithTags();
        console.log("📊 Tags with algorithms data:", tagsWithAlgorithms);
        
        // التحقق من أن البيانات موجودة
        if (!tagsWithAlgorithms || !Array.isArray(tagsWithAlgorithms) || tagsWithAlgorithms.length === 0) {
          console.warn("⚠️ No tags with algorithms found");
          setTags([]);
          setAlgorithms({});
          setLoading(false);
          return;
        }
        
        // معالجة البيانات - كل عنصر هو tag مع explaineTags array
        const processedTags = [];
        const allAlgorithms = {};
        const loadingStates = {};
        
        // تهيئة loading states لجميع tags
        tagsWithAlgorithms.forEach(tagData => {
          loadingStates[tagData.id] = false; // لا نحتاج loading لأن البيانات جاهزة
        });
        setLoadingAlgorithms(loadingStates);
        
        // معالجة كل tag
        for (const tagData of tagsWithAlgorithms) {
          // إضافة tag للقائمة
          processedTags.push({
            id: tagData.id,
            tagName: tagData.tagName,
            shortDescription: tagData.shortDescription,
            description: tagData.description,
            imageURL: tagData.imageURL
          });
          
          // معالجة الخوارزميات لهذا tag - استخدام البيانات الموجودة مباشرة
          const explaineTags = tagData.explaineTags || [];
          
          if (explaineTags.length === 0) {
            console.log(`ℹ️ No algorithms found for tag ${tagData.id} (${tagData.tagName})`);
            allAlgorithms[tagData.id] = [];
            continue;
          }
          
          // استخدام البيانات الموجودة مباشرة بدون جلب تفاصيل إضافية
          // (يمكن جلب التفاصيل الكاملة عند فتح صفحة الخوارزمية)
          allAlgorithms[tagData.id] = explaineTags.map(algo => ({
            ...algo,
            overview: algo.overview || algo.description || tagData.description,
            shortDescription: algo.shortDescription || algo.title
          }));
          
          console.log(`✅ Loaded ${explaineTags.length} algorithms for tag ${tagData.id} (${tagData.tagName})`);
        }
        
        console.log(`✅ Successfully processed ${processedTags.length} tags with algorithms`);
        setTags(processedTags);
        setAlgorithms(allAlgorithms);
      } catch (err) {
        console.error("❌ Error fetching tags with algorithms:", err);
        setTags([]);
        setAlgorithms({});
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [initialExpandedTagId]);
  
  // فتح التاغ والتمرير إليه بعد تحميل البيانات إذا كان هناك initialExpandedTagId
  useEffect(() => {
    if (initialExpandedTagId && tags.length > 0 && !loading) {
      const tagExists = tags.some(tag => tag.id === initialExpandedTagId);
      if (tagExists) {
        console.log(`🔄 Auto-expanding tag ${initialExpandedTagId} after data load`);
        setExpandedTagId(initialExpandedTagId);
        
        // التمرير إلى التاغ المحدد بعد فتحه
        setTimeout(() => {
          const tagElement = tagRefs.current[initialExpandedTagId];
          if (tagElement) {
            console.log(`📍 Scrolling to tag ${initialExpandedTagId}`);
            tagElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          } else {
            console.warn(`⚠️ Tag element not found for ID: ${initialExpandedTagId}`);
          }
        }, 300); // انتظار قصير لضمان أن DOM تم تحديثه
      }
    }
  }, [tags, initialExpandedTagId, loading]);

  // الانتقال لصفحة الخوارزمية
  const goToAlgorithm = (algorithmId) => {
    navigate(`/react-app/algorithm/${algorithmId}`);
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
      <div className="algorithms-page" dir="rtl">
        <div className="algorithms-container">
          <div className="algorithms-search-wrapper" style={{ marginBottom: "2rem" }}>
            <div style={{ height: "50px", backgroundColor: "#f3f4f6", borderRadius: "12px" }}></div>
          </div>
          <ListSkeleton count={8} />
        </div>
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
              <div 
                key={tag.id} 
                className="algorithm-section"
                ref={(el) => {
                  if (el) {
                    tagRefs.current[tag.id] = el;
                  }
                }}
              >
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

