import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAuthSession } from "../../store/authSlice";
import { getProblemsPaging, searchProblems } from "../../Service/ProblemService";
import { getAllTags } from "../../Service/TagServices";
import "./problemsList.css";

const ProblemsList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const navigate = useNavigate();

  // قيم البحث
  const [searchText, setSearchText] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tagId, setTagId] = useState("");

  // قائمة التاغات
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  
  const session = useSelector(selectAuthSession);
  const userId = session?.responseUserDTO?.id || localStorage.getItem("idUser") || 1;

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const data = await getAllTags();
      setTags(data || []);
    } catch (err) {
      console.error("❌ Error fetching tags:", err);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  // جلب المسائل
  const fetchProblems = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const data = await getProblemsPaging(pageNumber, perPage, userId);
      console.log("📦 Problems data:", data);
      setProblems(data);
      setPage(pageNumber);
    } catch (err) {
      console.error("خطأ أثناء جلب المسائل:", err);
    } finally {
      setLoading(false);
    }
  };

  // البحث
  const handleSearch = async (pageNumber = 1, customDifficulty = null, customTagId = null) => {
    setLoading(true);
    try {
      const params = {
        numberPage: pageNumber,
        perPage,
        idUser: userId,
      };

      // استخدام القيمة المُمررة أو القيمة من الـ state
      const currentDifficulty = customDifficulty !== null ? customDifficulty : difficulty;
      const currentTagId = customTagId !== null ? customTagId : tagId;

      // إضافة الفلاتر فقط إذا كانت موجودة
      if (searchText.trim()) params.search = searchText.trim();
      if (currentDifficulty) params.difficulty = currentDifficulty;
      if (currentTagId) params.tagId = currentTagId;

      console.log("🔍 Search params:", params);
      const data = await searchProblems(params);
      console.log("📦 Search results:", data);
      
      setProblems(data || []);
      setPage(pageNumber);
    } catch (err) {
      console.error("خطأ أثناء البحث:", err);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setDifficulty("");
    setTagId("");
    fetchProblems(1);
  };

  useEffect(() => {
    fetchProblems(page);
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleNext = () => setPage((prev) => prev + 1);
  const handlePrev = () => page > 1 && setPage((prev) => prev - 1);

  const goToProblem = (problemId) => {
    navigate(`/problem/${problemId}`);
  };

  const getDifficultyLabel = (difficulty) => {
    // تحويل من الإنجليزي للعربي
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

  const getDifficultyClass = (difficulty) => {
    if (difficulty === "Easy" || difficulty === "سهل") return "problems-difficulty--easy";
    if (difficulty === "Medium" || difficulty === "متوسط") return "problems-difficulty--medium";
    if (difficulty === "Hard" || difficulty === "صعب") return "problems-difficulty--hard";
    return "problems-difficulty--medium";
  };

  const getStatusLabel = (status) => {
    if (status === 3) return "محلولة";
    if (status === 2 || status === 1) return "محاولة";
    return "";
  };

  const getStatusClass = (status) => {
    if (status === 3) return "problems-status--solved";
    if (status === 2 || status === 1) return "problems-status--attempted";
    return "";
  };

  if (loading) {
    return (
      <div className="problems-loading">
        <div className="problems-spinner"></div>
        <p>جاري تحميل المسائل...</p>
      </div>
    );
  }

  return (
    <div className="problems-container">
      {/* Header */}
      <div className="problems-header">
        <h1 className="problems-title">قائمة المسائل</h1>
        
        {/* Filters */}
        <div className="problems-filters">
          <div className="problems-search">
            <input
              type="text"
              placeholder="ابحث عن مسألة..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
              className="problems-search-input"
            />
            <button
              onClick={() => handleSearch(1)}
              className="problems-search-btn"
              aria-label="بحث"
            >
              بحث
            </button>
          </div>

          <select
            value={difficulty}
            onChange={(e) => {
              const newDifficulty = e.target.value;
              console.log("🔧 Selected difficulty:", newDifficulty);
              setDifficulty(newDifficulty);
              
              // البحث مباشرة مع تمرير القيمة الجديدة
              if (!newDifficulty) {
                fetchProblems(1);
              } else {
                handleSearch(1, newDifficulty);
              }
            }}
            className="problems-select"
          >
            <option value="">كل الصعوبات</option>
            <option value="سهل">سهل</option>
            <option value="متوسط">متوسط</option>
            <option value="صعب">صعب</option>
          </select>

          <select
            value={tagId}
            onChange={(e) => {
              const newTag = e.target.value;
              console.log("🏷️ Selected tag:", newTag);
              setTagId(newTag);
              // البحث مباشرة مع تمرير القيمة الجديدة
              if (!newTag) {
                fetchProblems(1);
              } else {
                handleSearch(1, null, newTag);
              }
            }}
            disabled={loadingTags}
            className="problems-select"
          >
            <option value="">كل التصنيفات</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tagName}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            className="problems-reset-btn"
            title="إعادة تعيين"
          >
            <i className="bx bx-reset"></i>
            إعادة
          </button>
        </div>

        {/* Quick Tags */}
        {tags.length > 0 && (
          <div className="problems-quick-tags">
          {tags.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTagId(t.id);
                handleSearch(1, null, t.id);
              }}
              className={`problems-quick-tag ${tagId === t.id ? 'active' : ''}`}
            >
              {t.tagName}
            </button>
          ))}
          </div>
        )}
      </div>

      {/* Problems Table */}
      <div className="problems-table-wrapper">
        <table className="problems-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>الصعوبة</th>
              <th>الحلول</th>
              <th>نسبة القبول</th>
            </tr>
          </thead>
          <tbody>
            {problems.length === 0 ? (
              <tr>
                <td colSpan="4" className="problems-empty">
                  <i className="bx bx-info-circle"></i>
                  لا توجد مسائل متاحة
                </td>
              </tr>
            ) : (
              problems.map((problem) => (
                <tr
                  key={problem.id}
                  className="problems-row"
                  onClick={() => navigate(`/problem/${problem.id}`)}
                >
                  <td className="problems-title-cell">
                    <span className="problems-id">#{problem.id}</span>
                    {problem.title}
                  </td>
                  <td>
                    <span className={`problems-difficulty ${getDifficultyClass(problem.difficulty)}`}>
                      {getDifficultyLabel(problem.difficulty)}
                    </span>
                  </td>
                  <td className="problems-solved-count">
                    <i className="bx bx-user"></i>
                    {problem.numberOfUsersSolved || 0}
                  </td>
                  <td className="problems-acceptance">
                    {problem.acceptanceRate ? `${Math.round(problem.acceptanceRate)}%` : "0%"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="problems-pagination">
        <button
          className="problems-pagination-btn"
          onClick={handlePrev}
          disabled={page === 1}
        >
          <i className="bx bx-chevron-right"></i>
        </button>
        <span className="problems-pagination-info">الصفحة {page}</span>
        <button
          className="problems-pagination-btn"
          onClick={handleNext}
        >
          <i className="bx bx-chevron-left"></i>
        </button>
      </div>
    </div>
  );
};

export default ProblemsList;

