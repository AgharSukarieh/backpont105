import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTags } from "../../../Service/TagServices";
import { RefreshCw, Search } from "lucide-react";

export default function TagsAdmin() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllTags();
      setTags(data || []);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب التاقات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (t) =>
        String(t.id).includes(q) ||
        (t.tagName || "").toLowerCase().includes(q) ||
        (t.shortDescription || "").toLowerCase().includes(q)
    );
  }, [tags, query]);

  if (loading)
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-red-500 font-semibold">{error}</div>
        <button
          onClick={fetchTags}
          className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">التاقات الرئيسية</h1>
          <p className="text-sm text-slate-500 mt-1">قائمة التاقات المتاحة وعدد الخوارزميات المرتبطة بكل تاج.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن تاج بالاسم، الوصف، أو المعرف..."
              className="pr-10 pl-3 py-2 w-64 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            onClick={fetchTags}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:shadow-sm transition"
            title="تحديث"
          >
            <RefreshCw size={16} /> تحديث
          </button>
        </div>
      </header>

      {filteredTags.length === 0 ? (
        <div className="mt-8">
          <div className="text-center text-slate-500">لم يتم العثور على تاقات مطابقة للبحث.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTags.map((tag) => {
            const initials = (tag.tagName || "تاج").split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
            const gradientIndex = tag.id % 6;
            const gradients = [
              "from-rose-100 to-rose-50",
              "from-amber-100 to-amber-50",
              "from-cyan-100 to-cyan-50",
              "from-lime-100 to-lime-50",
              "from-violet-100 to-violet-50",
              "from-sky-100 to-sky-50",
            ];
            const gradient = gradients[gradientIndex];

            return (
              <div
                key={tag.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/react-app/admin/Algorithm/${tag.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/react-app/admin/Algorithm/${tag.id}`); }}
                className="relative cursor-pointer bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition border border-gray-100 flex flex-col"
                aria-label={`فتح التاقات ${tag.tagName}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-slate-800 bg-gradient-to-br ${gradient} shrink-0`}>
                    <span>{initials}</span>
                  </div>

                  {typeof tag.count !== "undefined" && (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-slate-500">خوارزميات</span>
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {tag.count}
                      </span>
                    </div>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-slate-800">{tag.tagName}</h2>

                {tag.shortDescription ? (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">{tag.shortDescription}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400 italic">لا يوجد وصف مختصر</p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>ID: {tag.id}</span>
                  <span className="text-xs text-gray-400">{/* reserved for future metadata */}</span>
                </div>

                <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-3 rounded-full bg-gradient-to-r from-transparent to-transparent opacity-30" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}