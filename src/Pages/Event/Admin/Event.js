import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../../Service/api";

/*
  ShowEvent
  - صفحة عرض مفصّلة لحدث واحد (لما يكبس عَ العرض)
  - تحاول استخدام event من navigation state إن وُجد لتسريع العرض وإلا تجلبه من GET /Event/{id}
  - يدعم إلغاء الطلب عبر AbortController
  - يوفر أزرار: رجوع، تعديل، حذف، AddClick (POST /Event/AddClick/{id})
*/

const svgPlaceholder = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' viewBox='0 0 1600 1000' preserveAspectRatio='none'>
    <rect width='100%' height='100%' fill='#f8fafc'/>
    <g fill='#cbd5e1' font-family='Inter, Arial, sans-serif' font-size='36' text-anchor='middle'>
      <text x='50%' y='48%'>لا توجد صورة</text>
      <text x='50%' y='62%' font-size='18'>Image not available</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

/* Small ImageCard to avoid layout shift */
function ImageCard({ src, title, className }) {
  const [loaded, setLoaded] = useState(false);
  const [visibleSrc, setVisibleSrc] = useState(svgPlaceholder);
  const attemptedRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const candidate = src && src.trim() ? src : svgPlaceholder;

    if (attemptedRef.current === candidate && visibleSrc === candidate) {
      setLoaded(true);
      return () => {
        mountedRef.current = false;
      };
    }

    setLoaded(false);
    const img = new Image();
    img.src = candidate;

    const start = async () => {
      try {
        if (img.decode) await img.decode();
        else
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
        if (!mountedRef.current) return;
        attemptedRef.current = candidate;
        setVisibleSrc(candidate);
        setLoaded(true);
      } catch {
        if (!mountedRef.current) return;
        attemptedRef.current = svgPlaceholder;
        setVisibleSrc(svgPlaceholder);
        setLoaded(true);
      }
    };

    start();

    return () => {
      mountedRef.current = false;
    };
  }, [src, visibleSrc]);

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-gray-100 ${className || ""}`} style={{ aspectRatio: "16/9", paddingTop: "56.25%" }}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />}
      <img
        src={visibleSrc}
        alt={title || "event image"}
        width="1600"
        height="900"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
}

export default function ShowEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navEvent = location?.state?.event ?? null;

  const [event, setEvent] = useState(navEvent);
  const [loading, setLoading] = useState(!navEvent);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchEvent = useCallback(
    async (signal) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // محاولة endpoints مختلفة
        let res;
        try {
          res = await api.get(`/api/events/${id}`, { signal });
        } catch (err) {
          if (err.response?.status !== 404) throw err;
          res = await api.get(`/events/${id}`, { signal });
        }
        setEvent(res.data);
      } catch (err) {
        const isCanceled =
          err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || (err?.message && err.message.toLowerCase().includes("canceled"));
        if (isCanceled) return;
        console.error("fetch event failed", err);
        setError("فشل في جلب بيانات الحدث.");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (event) return; // already have it from navigation state
    const ctrl = new AbortController();
    fetchEvent(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchEvent, event]);

  const formattedDate = useMemo(() => {
    if (!event?.createdAt) return "";
    try {
      return new Date(event.createdAt).toLocaleString();
    } catch {
      return event.createdAt;
    }
  }, [event]);

  const onDelete = useCallback(async () => {
    if (!event) return;
    if (!window.confirm(`هل تريد حذف الحدث "${event.title}"؟`)) return;
    setBusy(true);
    try {
      await api.delete(`/events/${event.id}`);
      alert("تم الحذف.");
      navigate(-1);
    } catch (err) {
      console.error("delete failed", err);
      alert("فشل حذف الحدث.");
    } finally {
      setBusy(false);
    }
  }, [event, navigate]);

  const onEdit = useCallback(() => {
    if (!event) return;
    navigate(`/react-app/admin/event/${event.id}/edit`, { state: { event } });
  }, [event, navigate]);

  
  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 rounded-lg bg-gray-200" />
          <div className="mt-4 h-6 bg-gray-200 rounded w-3/4" />
          <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 p-4 rounded text-red-700">{error}</div>
        <div className="mt-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-md">رجوع</button>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-6 rounded shadow text-gray-600">لا يوجد حدث.</div>
        <div className="mt-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-md">رجوع</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <ImageCard src={event.imageURL} title={event.title} className="rounded-none" />

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900">{event.title}</h1>
              <div className="text-sm text-gray-500 mt-1">{formattedDate}</div>
              <div className="text-sm text-gray-500 mt-1">الموقع: {event.location ?? "غير محدد"}</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">المشاهدات</div>
              <div className="text-lg font-semibold text-gray-800">{event.views ?? 0}</div>

              <div className="text-xs text-gray-500 mt-2">نقرات التسجيل</div>
              <div className="text-lg font-semibold text-gray-800">{event.numberClickedButton ?? 0}</div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700">
            {event.description ? <p>{event.description}</p> : <p className="text-gray-500">لا يوجد وصف للحدث.</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">الكلمات المفتاحية</div>
              <div className="text-sm text-gray-800">{event.keyWord || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">رابط التسجيل</div>
              {event.linkRegistration ? (
                <a href={event.linkRegistration} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  فتح رابط التسجيل
                </a>
              ) : (
                <div className="text-gray-500">لا يوجد رابط</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-white border text-gray-700 hover:shadow-sm"
            >
              رجوع
            </button>


          </div>
        </div>
      </div>
    </main>
  );
}