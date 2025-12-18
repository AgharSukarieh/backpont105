import React, { useEffect, useState } from "react";
import { getProblemById } from "../../Service/ProblemService";
import LoadingCartoon from "../Loading";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

const ProblemDetail = () => {
  const { id } = useParams(); // رقم المشكلة من الرابط /problem/:id
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // دالة لتنظيف HTML قبل العرض
  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img", "div", "span", "pre", "code", "blockquote"],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "style"],
    });

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const data = await getProblemById(id);
        setProblem(data);
      } catch (err) {
        console.error("خطأ أثناء جلب البيانات:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  if (loading) return <LoadingCartoon />;

  if (!problem) return <p>لا توجد بيانات للمشكلة.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "'Fira Code', monospace" }}>
      <h1>📘 {problem.title}</h1>
      <p><strong>الكاتب: </strong>
        <span
          style={{ color: "#00f", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate(`/user/${problem.idUser}`)}
        >
          {problem.nameUser}
        </span>
      </p>
      <p><strong>الصعوبة: </strong>{problem.difficulty}</p>
      <p><strong>الذاكرة المسموحة: </strong>{problem.memory} MB</p>
      <p><strong>الوقت المسموح: </strong>{problem.time} ms</p>

      {problem.imageUrl && (
        <div style={{ margin: "20px 0" }}>
          <img src={problem.imageUrl} alt={problem.title} style={{ maxWidth: "100%" }} />
        </div>
      )}

      <div style={{ marginTop: "10px" }}>
        <h3>وصف المشكلة:</h3>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionProblem) }} />
      </div>

      <div style={{ marginTop: "10px" }}>
        <h3>مدخلات:</h3>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionInput) }} />
      </div>

      <div style={{ marginTop: "10px" }}>
        <h3>مخرجات:</h3>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.descriptionOutput) }} />
      </div>

      {problem.authorNotes && (
        <div style={{ marginTop: "10px" }}>
          <h3>ملاحظات المؤلف:</h3>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.authorNotes) }} />
        </div>
      )}

      {problem.tags.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h3>Tags:</h3>
          {problem.tags.map((t) => (
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

      {problem.testCase.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Test Cases:</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #00ff99", padding: "5px" }}>Input</th>
                <th style={{ border: "1px solid #00ff99", padding: "5px" }}>Expected Output</th>
                <th style={{ border: "1px solid #00ff99", padding: "5px" }}>Sample</th>
              </tr>
            </thead>
            <tbody>
              {problem.testCase.map((tc) => (
                <tr key={tc.id}>
                  <td style={{ border: "1px solid #00ff99", padding: "5px" }}>{tc.input}</td>
                  <td style={{ border: "1px solid #00ff99", padding: "5px" }}>{tc.expectedOutput}</td>
                  <td style={{ border: "1px solid #00ff99", padding: "5px" }}>
                    {tc.isSample ? "نموذج" : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProblemDetail;
