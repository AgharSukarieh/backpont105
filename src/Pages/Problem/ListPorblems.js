import React, { useEffect, useState } from "react";
import { getProblemsPaging } from "../../Service/ProblemService";
import LoadingCartoon from "../Loading";
import { useNavigate } from "react-router-dom"; // نستخدمه للتوجيه

const ProblemsList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const navigate = useNavigate();

  const fetchProblems = async (pageNumber) => {
    setLoading(true);
    try {
      const data = await getProblemsPaging(pageNumber, perPage, 1);
      setProblems(data);
    } catch (err) {
      console.error("خطأ أثناء جلب المسائل:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(page);
  }, [page]);

  const handleNext = () => setPage((prev) => prev + 1);
  const handlePrev = () => page > 1 && setPage((prev) => prev - 1);

  const goToUserProfile = (userId) => {
    // توجه إلى صفحة المستخدم، افتراضياً /user/:id
    navigate(`/user/${userId}`);
  };

  if (loading) return <LoadingCartoon />;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📘 قائمة المسائل</h1>

      {problems.length === 0 ? (
        <p>لا توجد مسائل متاحة حالياً.</p>
      ) : (
        <ul>
          {problems.map((p) => (
            <li key={p.id} style={{ marginBottom: "20px" }}>
              <strong>{p.title}</strong> — الصعوبة: {p.difficulty} — نسبة النجاح:{" "}
              {p.acceptanceRate}% — عدد الحلول: {p.numberOfUsersSolved}
              <div style={{ marginTop: "5px" }}>
                <span
                  onClick={() => goToUserProfile(p.idUser)}
                  style={{
                    cursor: "pointer",
                    color: "#00f",
                    textDecoration: "underline",
                    marginRight: "10px",
                  }}
                >
                  {p.userName}
                </span>
              </div>

              {p.tags.length > 0 && (
                <div style={{ marginTop: "5px" }}>
                  <strong>Tags: </strong>
                  {p.tags.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#0d1117",
                        color: "#00ff99",
                        border: "1px solid #00ff99",
                        padding: "2px 6px",
                        marginRight: "5px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {t.tagName}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Controls */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={handlePrev}
          disabled={page === 1}
          style={{ padding: "5px 10px", cursor: page === 1 ? "not-allowed" : "pointer" }}
        >
          السابق
        </button>
        <span>الصفحة {page}</span>
        <button onClick={handleNext} style={{ padding: "5px 10px", cursor: "pointer" }}>
          التالي
        </button>
      </div>
    </div>
  );
};

export default ProblemsList;
