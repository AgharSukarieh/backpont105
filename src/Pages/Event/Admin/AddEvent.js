import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { uploadUserImage } from "../../../Service/userService";

/* helper: convert local datetime-local value to ISO (UTC) */
const localInputToIso = (val) => {
  if (!val) return new Date().toISOString();
  const d = new Date(val);
  return d.toISOString();
};

/* Simple spinner (SVG) as React component */
function Spinner({ size = 36, className = "" }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
    </svg>
  );
}

export default function AddEvent() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [localPreview, setLocalPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageURL: "",
    createdAt: new Date().toISOString().slice(0, 16), // datetime-local default (local)
    location: "",
    keyWord: "",
    linkRegistration: "",
    views: 0,
    numberClickedButton: 0,
  });

  useEffect(() => {
    // cleanup object URL on unmount
    return () => {
      if (localPreview) {
        try {
          URL.revokeObjectURL(localPreview);
        } catch (_) {}
      }
    };
  }, [localPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setSuccess("");
    setError("");
  };

  const triggerFileDialog = () => fileInputRef.current?.click();

  const handleFileSelect = async (e) => {
    setImageUploadError("");
    const file = e?.target?.files?.[0];
    if (!file) return;

    // immediate local preview
    const tmp = URL.createObjectURL(file);
    setLocalPreview(tmp);

    setImageUploading(true);
    try {
      const result = await uploadUserImage(file, form.imageURL);
      const newUrl = typeof result === "string" ? result : result?.url ?? result?.imageUrl ?? result;
      if (!newUrl) throw new Error("لم يتم استلام رابط الصورة من السيرفر.");
      setForm((p) => ({ ...p, imageURL: newUrl }));
      setSuccess("تم رفع الصورة وتحديث الرابط.");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data || err?.message || String(err);
      setImageUploadError("فشل رفع الصورة: " + msg);
    } finally {
      setImageUploading(false);
      // revoke preview after a bit (we still keep preview visible for a short time)
      setTimeout(() => {
        try {
          URL.revokeObjectURL(tmp);
        } catch (_) {}
      }, 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (imageUploading) {
      setError("الرجاء الانتظار حتى انتهاء رفع الصورة قبل الحفظ.");
      return;
    }

    if (!form.title.trim() || !form.description.trim() || !form.imageURL.trim()) {
      setError("الرجاء تعبئة الحقول المطلوبة: العنوان، الوصف، ورفع/إدخال صورة.");
      return;
    }

    const payload = {
      id: 0,
      title: form.title.trim(),
      description: form.description.trim(),
      imageURL: form.imageURL.trim(),
      createdAt: localInputToIso(form.createdAt),
      location: form.location.trim(),
      keyWord: form.keyWord.trim(),
      linkRegistration: form.linkRegistration.trim(),
      views: 0,
      numberClickedButton: 0,
    };

    setSaving(true);
    try {
      const res = await api.post("/events", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = res?.data;
      const newId =
        data?.id ??
        (typeof data === "number" ? data : undefined) ??
        (typeof data === "string" && /^\d+$/.test(data) ? Number(data) : undefined) ??
        data?.data?.id;

      setSuccess("تم إضافة الحدث بنجاح. جاري التحويل...");
      setTimeout(() => {
        if (newId) {
          navigate(`/react-app/admin/event/${newId}`);
        } else if (data && data?.id) {
          navigate(`/react-app/admin/event/${data.id}`);
        } else {
          navigate(`/react-app/admin/EventList`);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data || err?.message || String(err);
      setError("فشل إضافة الحدث: " + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10" dir="rtl" lang="ar">
      {/* Full-page overlay shown during saving */}
      {(saving || imageUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white/95 dark:bg-slate-800/95 rounded-xl shadow-lg px-6 py-6 flex flex-col items-center gap-3 max-w-xs w-full text-center">
            <Spinner size={48} className="text-sky-600" />
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {imageUploading ? "جارٍ رفع الصورة..." : "جارٍ إضافة الحدث..."}
            </div>
            <div className="text-xs text-slate-500">{imageUploading ? "لا تغلق النافذة أو تكرر الرفع." : "الرجاء الانتظار..."}</div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">إضافة حدث جديد</h2>
                <p className="mt-1 text-sm text-slate-500">املأ بيانات الحدث ثم اضغط إضافة</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate(-1)}
                  type="button"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    // quick save shortcut — only if not saving/uploading
                    if (!saving && !imageUploading) document.getElementById("add-event-submit")?.click();
                  }}
                  type="button"
                  className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-sm"
                >
                  حفظ سريع
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {error ? <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div> : null}
              {success ? <div className="text-sm text-green-700 bg-green-50 p-2 rounded">{success}</div> : null}
              {imageUploadError ? <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{imageUploadError}</div> : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <input type="hidden" name="imageURL" value={form.imageURL} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">العنوان *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="أضف عنوان الحدث"
                  required
                  aria-required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                  placeholder="أضف وصفًا موجزًا للحدث"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الصورة *</label>
                  <p className="text-xs text-slate-400 mt-1">ارفع صورة من جهازك أو ألصق رابط مباشر (حقل رابط الصورة يظهر بعد الرفع).</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={triggerFileDialog}
                      disabled={imageUploading || saving}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm focus:outline-none ${
                        imageUploading || saving ? "bg-slate-300 text-slate-600" : "bg-sky-600 text-white hover:bg-sky-700"
                      }`}
                      aria-disabled={imageUploading || saving}
                    >
                      {imageUploading ? <Spinner size={18} className="text-white" /> : null}
                      <span>{imageUploading ? "جارٍ الرفع..." : "رفع صورة"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // allow pasting a URL manually
                        const url = window.prompt("ألصق رابط الصورة المباشر (http/https):", form.imageURL || "");
                        if (url) {
                          setForm((p) => ({ ...p, imageURL: url }));
                          setLocalPreview(url);
                          setSuccess("تم تحديث رابط الصورة محليًا.");
                        }
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
                    >
                      لصق رابط
                    </button>

                    <div className="text-sm text-slate-500 ml-auto">الحجم الموصى به: 1200x800px</div>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-slate-700 mb-2">معاينة</label>
                  <div className="w-52 h-40 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {localPreview || form.imageURL ? (
                      <img
                        src={localPreview || form.imageURL}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // fallback if image fails to load
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent(
                              `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' preserveAspectRatio='none'><rect width='100%' height='100%' fill='#f8fafc'/><text x='50%' y='50%' fill='#cbd5e1' font-size='18' font-family='sans-serif' text-anchor='middle'>لا توجد معاينة</text></svg>`
                            );
                        }}
                      />
                    ) : (
                      <div className="text-xs text-slate-400">لا توجد صورة</div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-2 break-all text-center w-52">
                    {form.imageURL ? (
                      <span title={form.imageURL} className="text-ellipsis overflow-hidden block">
                        {form.imageURL}
                      </span>
                    ) : (
                      <span>لم يتم تحديد رابط</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ والوقت</label>
                  <input
                    name="createdAt"
                    value={form.createdAt}
                    onChange={handleChange}
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                  <p className="text-xs text-slate-400 mt-1">سيُرسل التاريخ بصيغة ISO (UTC)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الموقع</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="المكان"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكلمات المفتاحية</label>
                  <input
                    name="keyWord"
                    value={form.keyWord}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="مثال: مؤتمرات, تكنولوجيا"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رابط التسجيل</label>
                  <input
                    name="linkRegistration"
                    value={form.linkRegistration}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="add-event-submit"
                  type="submit"
                  disabled={saving || imageUploading}
                  className={`px-4 py-2 rounded-lg text-white ${saving || imageUploading ? "bg-slate-400" : "bg-sky-600 hover:bg-sky-700"}`}
                >
                  {saving ? "جارٍ الإضافة..." : "إضافة الحدث"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      title: "",
                      description: "",
                      imageURL: "",
                      createdAt: new Date().toISOString().slice(0, 16),
                      location: "",
                      keyWord: "",
                      linkRegistration: "",
                      views: 0,
                      numberClickedButton: 0,
                    });
                    setLocalPreview(null);
                    setError("");
                    setSuccess("تم مسح الحقول.");
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  مسح الحقول
                </button>

                <div className="text-sm text-slate-500 mr-auto">الحقول المطلوبة مع علامة *</div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        /* small accessibility improvements */
        :focus { outline: none; }
        :focus-visible { outline: 2px solid rgba(14,165,160,0.25); outline-offset: 2px; border-radius: 8px; }
      `}</style>
    </div>
  );
}