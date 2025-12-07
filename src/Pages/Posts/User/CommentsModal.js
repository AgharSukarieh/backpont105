import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";

const CommentsModal = ({ postId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!postId) return;

    let cancelled = false;
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the same API call as PostDetails to avoid shape mismatch
        const res = await api.get(`/Post/GetById/${postId}`);
        const post = res?.data ?? null;
        const items = Array.isArray(post?.comments) ? post.comments : [];
        if (!cancelled) setComments(items);
      } catch (err) {
        console.error("Failed to fetch comments:", err?.response ?? err);
        if (!cancelled)
          setError("فشل جلب التعليقات. افتح Console لرؤية التفاصيل.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchComments();

    // lock body scroll while modal open
    document.body.classList.add("overflow-hidden");

    return () => {
      cancelled = true;
      document.body.classList.remove("overflow-hidden");
    };
  }, [postId]);

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[86vh] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">التعليقات</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-[72vh]">
          {loading && <p className="text-gray-600">جاري التحميل...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && comments.length === 0 && (
            <p className="text-gray-600">لا توجد تعليقات بعد.</p>
          )}

          <ul className="space-y-4">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 items-start border rounded-md p-3"
              >
                <div
                  onClick={() => navigate(`/react-app/profile/${c.userId}`)}
                  className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer`}
                >
                  {c.imageURL ? (
                    <img
                      src={c.imageURL}
                      alt={c.userName || "user"}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                      {(c.userName || c.authorName || "U")
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative" style={{ paddingLeft: 0 }}>
                  <div
                    className="text-xs text-gray-400"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                  </div>

                  <div
                    onClick={() => navigate(`/react-app/profile/${c.userId}`)}
                    className="text-sm cursor-pointer font-medium text-gray-900 text-right pr-12"
                  >
                    {c.userName || c.authorName || "Unknown"}
                  </div>

                  <p className="text-sm text-gray-700 mt-6">
                    {c.text || c.comment || ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
