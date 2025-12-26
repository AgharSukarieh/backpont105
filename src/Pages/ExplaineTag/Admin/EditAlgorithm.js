import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import api from "../../../Service/api";


const uploadUserImage = async (imageFile, currentImageURL = "", onUploadProgress) => {
  if (!imageFile) return currentImageURL;

  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await api.post("/uploads/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data;
};

export default function EditAlgorithm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const TINYMCE_API_KEY = "ydbgd84essmlucuqp6di1jaz8o8m7murr9yj34z0en3lv9r5";

  const [algorithm, setAlgorithm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Track per-video uploading state and errors (used when actually uploading on Save)
  const [uploadingVideos, setUploadingVideos] = useState({}); // { [index]: boolean }
  const [uploadErrors, setUploadErrors] = useState({}); // { [index]: string }

  // Pending files & previews (not sent to server until Save)
  const [pendingFiles, setPendingFiles] = useState([]);
  const pendingFilesRef = useRef(pendingFiles);
  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);

  // overall saving state
  const [saving, setSaving] = useState(false);

  // Upload popup: shows a centered box with spinner + message + optional progress
  const [uploadPopup, setUploadPopup] = useState({
    show: false,
    message: "",
    progress: null, // 0..100 or null
  });

  // 🔹 Fetch data
  const fetchAlgorithm = async () => {
    if (!id) return setError("ID not specified.");
    try {
      setLoading(true);
      const response = await api.get(`/explained-tags/${id}`);
      const data = {
        ...response.data,
        tagId: response.data.tagId || 0,
        exampleTags: response.data.exampleTags || [],
        youTubeLinks: response.data.youTubeLinks || [],
        videos: response.data.videos || [],
      };
      setAlgorithm(data);

      // init pendingFiles array aligned with videos length
      const initialPending = (data.videos || []).map(() => ({
        videoFile: null,
        videoPreview: null,
        thumbFile: null,
        thumbPreview: null,
      }));
      setPendingFiles(initialPending);
    } catch (err) {
      console.error(err);
      setError("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlgorithm();
    // cleanup object URLs on unmount
    return () => {
      pendingFilesRef.current.forEach((p) => {
        if (p.videoPreview) URL.revokeObjectURL(p.videoPreview);
        if (p.thumbPreview) URL.revokeObjectURL(p.thumbPreview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Utility to update pendingFiles at index
  const updatePendingAt = (index, values) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push({ videoFile: null, videoPreview: null, thumbFile: null, thumbPreview: null });
      next[index] = { ...next[index], ...values };
      return next;
    });
  };

  // When adding/removing videos keep pendingFiles in sync
  const addVideo = () => {
    const newVideo = {
      id: 0,
      title: "",
      description: "",
      url: "",
      thumbnailUrl: "",
      explaineTagId: algorithm?.id || 0,
    };
    setAlgorithm((prev) => ({ ...prev, videos: [...(prev.videos || []), newVideo] }));
    setPendingFiles((prev) => [...prev, { videoFile: null, videoPreview: null, thumbFile: null, thumbPreview: null }]);
  };

  const removeVideo = (index) => {
    setAlgorithm((prev) => {
      const nextVideos = [...(prev.videos || [])];
      nextVideos.splice(index, 1);
      return { ...prev, videos: nextVideos };
    });
    setPendingFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed) {
        if (removed.videoPreview) URL.revokeObjectURL(removed.videoPreview);
        if (removed.thumbPreview) URL.revokeObjectURL(removed.thumbPreview);
      }
      return next;
    });
    setUploadingVideos((prev) => { const n = { ...prev }; delete n[index]; return n; });
    setUploadErrors((prev) => { const n = { ...prev }; delete n[index]; return n; });
  };

  // Helper handlers for files: store locally and show preview (do not upload yet)
  const handleVideoFileSelected = (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const prev = pendingFiles[index];
    if (prev?.videoPreview) URL.revokeObjectURL(prev.videoPreview);
    const preview = URL.createObjectURL(file);
    updatePendingAt(index, { videoFile: file, videoPreview: preview });
    setUploadErrors((prev) => ({ ...prev, [index]: "" }));
  };

  const handleThumbnailFileSelected = (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const prev = pendingFiles[index];
    if (prev?.thumbPreview) URL.revokeObjectURL(prev.thumbPreview);
    const preview = URL.createObjectURL(file);
    updatePendingAt(index, { thumbFile: file, thumbPreview: preview });
    setUploadErrors((prev) => ({ ...prev, [index]: "" }));
  };

  // 🔹 Save: upload pending files then update API
  const handleSubmit = async () => {
    if (!algorithm) return;
    setSaving(true);
    setUploadErrors({});
    // show initial popup
    setUploadPopup({ show: true, message: "جاري التحضير للحفظ...", progress: null });

    const videos = algorithm.videos || [];
    const nextVideos = [...videos];

    try {
      for (let i = 0; i < videos.length; i++) {
        const pending = pendingFiles[i];

        setUploadingVideos((prev) => ({ ...prev, [i]: true }));

        try {
          // Upload thumbnail first (so thumbnail can be associated even if video upload fails)
          if (pending?.thumbFile) {
            setUploadPopup({ show: true, message: `جارٍ رفع الصورة للمقطع #${i + 1}`, progress: 0 });
            try {
              const uploadedThumbUrl = await uploadUserImage(pending.thumbFile, "", (progressEvent) => {
                if (progressEvent && progressEvent.total) {
                  const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  setUploadPopup((prev) => ({ ...prev, progress: pct }));
                }
              });
              nextVideos[i] = { ...nextVideos[i], thumbnailUrl: uploadedThumbUrl };
            } catch (err) {
              console.error(`Thumbnail upload failed for index ${i}:`, err);
              setUploadErrors((prev) => ({ ...prev, [i]: `فشل رفع الصورة: ${err?.message || err}` }));
            } finally {
              // small pause to show 100% if reached
              setUploadPopup((prev) => ({ ...prev, progress: null }));
            }
          }

          // Upload video file
          if (pending?.videoFile) {
            setUploadPopup({ show: true, message: `جارٍ رفع الفيديو للمقطع #${i + 1}`, progress: 0 });
            try {
              const formData = new FormData();
              formData.append("video", pending.videoFile);
              const res = await api.post("/upload/UploadVideo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                  if (progressEvent && progressEvent.total) {
                    const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadPopup((prev) => ({ ...prev, progress: pct }));
                  }
                },
              });
              const uploadedUrl = res?.data;
              if (!uploadedUrl) throw new Error("No URL returned from upload API");
              nextVideos[i] = { ...nextVideos[i], url: uploadedUrl };
            } catch (err) {
              console.error(`Video upload failed for index ${i}:`, err);
              setUploadErrors((prev) => ({ ...prev, [i]: `فشل رفع الفيديو: ${err?.message || err}` }));
            } finally {
              setUploadPopup((prev) => ({ ...prev, progress: null }));
            }
          }
        } finally {
          setUploadingVideos((prev) => ({ ...prev, [i]: false }));
        }
      }

      // Now update DB - show saving popup
      setUploadPopup({ show: true, message: "جارٍ حفظ البيانات على السيرفر...", progress: null });

      // Prepare cleaned payload
      const cleanedAlgorithm = {
        ...algorithm,
        exampleTags: (algorithm.exampleTags || []).map((e) => ({ ...e, explaineTagId: algorithm.id })),
        youTubeLinks: (algorithm.youTubeLinks || []).map((l) => ({ ...l, explaineTagId: algorithm.id })),
        videos: (algorithm.videos || []).map((v, idx) => {
          const updated = nextVideos[idx] || {};
          return {
            ...v,
            url: updated.url ?? v.url,
            thumbnailUrl: updated.thumbnailUrl ?? v.thumbnailUrl,
            explaineTagId: algorithm.id,
          };
        }),
      };

      await api.put(`/explained-tags/${algorithm.id}`, cleanedAlgorithm);

      // Revoke previews and reset pendingFiles
      pendingFiles.forEach((p) => {
        if (p?.videoPreview) URL.revokeObjectURL(p.videoPreview);
        if (p?.thumbPreview) URL.revokeObjectURL(p.thumbPreview);
      });
      const resetPending = (cleanedAlgorithm.videos || []).map(() => ({
        videoFile: null,
        videoPreview: null,
        thumbFile: null,
        thumbPreview: null,
      }));
      setPendingFiles(resetPending);

      setAlgorithm(cleanedAlgorithm);

      const anyErrors = Object.values(uploadErrors).some(Boolean);
      setModal({
        show: true,
        message: anyErrors ? "تم الحفظ لكن بعض الملفات لم تُرفع بنجاح." : "تم حفظ التعديلات بنجاح!",
        type: anyErrors ? "error" : "success",
      });
    } catch (err) {
      console.error("Save error:", err);
      setModal({
        show: true,
        message: "حدث خطأ أثناء حفظ التعديلات.",
        type: "error",
      });
    } finally {
      setSaving(false);
      // hide upload popup after a short delay so user sees final state
      setTimeout(() => setUploadPopup({ show: false, message: "", progress: null }), 700);
    }
  };

  // other change handlers (examples, youtube links etc.)
  const handleChange = (field, value) => {
    setAlgorithm({ ...algorithm, [field]: value });
  };

  const handleExampleChange = (index, field, value) => {
    const newExamples = [...algorithm.exampleTags];
    newExamples[index][field] = value;
    setAlgorithm({ ...algorithm, exampleTags: newExamples });
  };

  const handleYouTubeChange = (index, field, value) => {
    const newLinks = [...algorithm.youTubeLinks];
    newLinks[index][field] = value;
    setAlgorithm({ ...algorithm, youTubeLinks: newLinks });
  };

  const handleVideoChange = (index, field, value) => {
    const newVideos = [...algorithm.videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setAlgorithm({ ...algorithm, videos: newVideos });
  };

  // UI render
  if (loading) return <p className="p-6 text-gray-500">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!algorithm) return null;

  const tinymceInit = {
    height: 300,
    menubar: true,
    plugins: [
      "advlist", "autolink", "lists", "link", "image",
      "charmap", "print", "preview", "anchor",
      "searchreplace", "visualblocks", "code", "fullscreen",
      "insertdatetime", "media", "table", "paste", "codesample"
    ],
    toolbar:
      "undo redo | formatselect | bold italic underline | forecolor backcolor | " +
      "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
      "removeformat | link image media table | codesample fullscreen",
    branding: false,
  };

  // Portal node guard (in case SSR)
  const canUseDOM = typeof window !== "undefined" && !!document?.body;

  return (
    <>
      {/* Upload popup (spinner + message + optional progress) rendered via portal */}
      {canUseDOM && uploadPopup.show && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-auto">
          {/* backdrop: blur + dim; ensures background is blurred and dimmed */}
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col items-center gap-4 z-[10000]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-right">
                <div className="text-lg font-medium">{uploadPopup.message}</div>
                {uploadPopup.progress !== null && (
                  <div className="text-sm text-gray-500 mt-1">{uploadPopup.progress}%</div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Result modal (success/error after save) rendered via portal */}
      {canUseDOM && modal.show && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-auto">
          {/* dark blurred backdrop so modal is clearly on top */}
          <div className="absolute inset-0 backdrop-blur-sm bg-black/60" />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-[10000]">
            <p className="text-gray-800">{modal.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal({ ...modal, show: false })}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                إغلاق
              </button>
              {modal.type === "success" && (
                <button
                  onClick={() => {
                    setModal({ ...modal, show: false });
                    navigate(`/react-app/admin/AlgorithmDetails/${id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  عرض الخوارزمية
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">تعديل الخوارزمية</h1>

        {/* Basic Fields */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-1 mb-4">الحقول الأساسية</h2>

          <label className="block font-medium">العنوان</label>
          <input
            type="text"
            value={algorithm.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border p-3 rounded"
          />

          <label className="block font-medium mt-4">نظرة عامة</label>
          <Editor
            apiKey={TINYMCE_API_KEY}
            value={algorithm.overview}
            onEditorChange={(content) => handleChange("overview", content)}
            init={tinymceInit}
          />

          <label className="block font-medium mt-4">التعقيد</label>
          <input
            type="text"
            value={algorithm.complexity}
            onChange={(e) => handleChange("complexity", e.target.value)}
            className="w-full border p-3 rounded"
          />

          <label className="block font-medium mt-4">الخطوات</label>
          <Editor
            apiKey={TINYMCE_API_KEY}
            value={algorithm.steps}
            onEditorChange={(content) => handleChange("steps", content)}
            init={tinymceInit}
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium mt-4">بداية الشرح</label>
              <input
                type="text"
                value={algorithm.start}
                onChange={(e) => handleChange("start", e.target.value)}
                className="w-full border p-3 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mt-4">نهاية الشرح</label>
              <input
                type="text"
                value={algorithm.end}
                onChange={(e) => handleChange("end", e.target.value)}
                className="w-full border p-3 rounded"
              />
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold flex justify-between items-center border-b pb-1 mb-4">
            أمثلة
            <button onClick={() => {
              const newExample = { id: 0, title: "", code: "", explanation: "", input: "", output: "", stepByStep: "", priority: 1, explaineTagId: algorithm?.id || 0 };
              setAlgorithm((prev) => ({ ...prev, exampleTags: [...(prev.exampleTags || []), newExample] }));
            }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">إضافة مثال</button>
          </h2>

          {(algorithm.exampleTags || []).map((example, index) => (
            <div key={index} className="border p-4 rounded my-2 bg-gray-50 space-y-2 relative">
              <button onClick={() => {
                const newExamples = [...algorithm.exampleTags];
                newExamples.splice(index, 1);
                setAlgorithm({ ...algorithm, exampleTags: newExamples });
              }} className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">حذف</button>

              <label className="block font-medium">عنوان المثال</label>
              <input type="text" value={example.title} onChange={(e) => handleExampleChange(index, "title", e.target.value)} className="w-full border p-2 rounded" />

              <label className="block font-medium">الكود</label>
              <textarea value={example.code} dir="ltr" onChange={(e) => handleExampleChange(index, "code", e.target.value)} className="w-full h-[300px] border p-2 rounded" />

              <label className="block font-medium">شرح خطوة بخطوة</label>
              <Editor apiKey={TINYMCE_API_KEY} value={example.stepByStep} onEditorChange={(content) => handleExampleChange(index, "stepByStep", content)} init={tinymceInit} />

              <label className="block font-medium">الشرح العام</label>
              <Editor apiKey={TINYMCE_API_KEY} value={example.explanation} onEditorChange={(content) => handleExampleChange(index, "explanation", content)} init={tinymceInit} />

              <label className="block font-medium">Input</label>
              <input type="text" value={example.input} onChange={(e) => handleExampleChange(index, "input", e.target.value)} className="w-full border p-2 rounded" />

              <label className="block font-medium">Output</label>
              <input type="text" value={example.output} onChange={(e) => handleExampleChange(index, "output", e.target.value)} className="w-full border p-2 rounded" />
            </div>
          ))}
        </div>

        {/* YouTube Links */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold flex justify-between items-center border-b pb-1 mb-4">
            روابط اليوتيوب
            <button onClick={() => {
              const newLink = { id: 0, title: "", url: "", description: "", explaineTagId: algorithm?.id || 0 };
              setAlgorithm((prev) => ({ ...prev, youTubeLinks: [...(prev.youTubeLinks || []), newLink] }));
            }} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">إضافة رابط</button>
          </h2>

          {(algorithm.youTubeLinks || []).map((link, index) => (
            <div key={index} className="border p-4 rounded my-2 bg-gray-50 space-y-2 relative">
              <button onClick={() => {
                const newLinks = [...algorithm.youTubeLinks];
                newLinks.splice(index, 1);
                setAlgorithm({ ...algorithm, youTubeLinks: newLinks });
              }} className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">حذف</button>

              <label className="block font-medium">عنوان الفيديو</label>
              <input type="text" value={link.title} onChange={(e) => handleYouTubeChange(index, "title", e.target.value)} className="w-full border p-2 rounded" />

              <label className="block font-medium">رابط الفيديو</label>
              <input type="text" value={link.url} onChange={(e) => handleYouTubeChange(index, "url", e.target.value)} className="w-full border p-2 rounded" />

              <label className="block font-medium">الوصف</label>
              <Editor apiKey={TINYMCE_API_KEY} value={link.description} onEditorChange={(content) => handleYouTubeChange(index, "description", content)} init={tinymceInit} />
            </div>
          ))}
        </div>

        {/* Videos: display previews (local or server) and accept files but DO NOT upload until Save */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold flex justify-between items-center border-b pb-1 mb-4">
            الفيديوهات
            <button onClick={addVideo} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">إضافة فيديو</button>
          </h2>

          {(algorithm.videos || []).map((video, index) => {
            const pending = pendingFiles[index] || {};
            const isUploading = !!uploadingVideos[index];
            const errorMsg = uploadErrors[index];

            return (
              <div key={index} className="border p-4 rounded my-2 bg-gray-50 space-y-2 relative">
                <button onClick={() => removeVideo(index)} className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">حذف</button>

                <label className="block font-medium">عنوان الفيديو</label>
                <input type="text" value={video.title} onChange={(e) => handleVideoChange(index, "title", e.target.value)} className="w-full border p-2 rounded" />

                <label className="block font-medium mt-2">الوصف</label>
                <Editor apiKey={TINYMCE_API_KEY} value={video.description} onEditorChange={(content) => handleVideoChange(index, "description", content)} init={tinymceInit} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div>
                    <label className="block font-medium">ملف فيديو (محلي؛ يُرفع عند الحفظ)</label>
                    <input type="file" accept="video/*" onChange={(e) => handleVideoFileSelected(index, e)} className="w-full border p-2 rounded cursor-pointer" />
                    <div className="mt-2">
                      {pending?.videoPreview ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">معاينة محلية (لم تُحفَظ بعد)</div>
                          <video src={pending.videoPreview} controls className="w-full max-h-48 rounded" />
                        </div>
                      ) : video.url ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">معاينة من السيرفر</div>
                          <video src={video.url} controls className="w-full max-h-48 rounded" />
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">لا توجد معاينة</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium">الصورة المصغّرة (محلي؛ تُرفع عند الحفظ)</label>
                    <input type="file" accept="image/*" onChange={(e) => handleThumbnailFileSelected(index, e)} className="w-full border p-2 rounded cursor-pointer" />
                    <div className="mt-2">
                      {pending?.thumbPreview ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">معاينة محلية (لم تُحفَظ بعد)</div>
                          <img src={pending.thumbPreview} alt="thumb preview" className="w-full h-32 object-contain rounded" />
                        </div>
                      ) : video.thumbnailUrl ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">معاينة من السيرفر</div>
                          <img src={video.thumbnailUrl} alt="thumb" className="w-full h-32 object-contain rounded" />
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">لا توجد معاينة</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium">حالة</label>
                    <div className="mt-2">
                      {isUploading ? (
                        <div className="text-sm text-yellow-600">جارٍ رفع الملفات...</div>
                      ) : errorMsg ? (
                        <div className="text-sm text-red-600">{errorMsg}</div>
                      ) : (
                        <div className="text-sm text-green-600">جاهز للحفظ</div>
                      )}
                    </div>

                    {/* Hidden fields keep stored URLs but we don't display them */}
                    <input type="hidden" value={video.url || ""} />
                    <input type="hidden" value={video.thumbnailUrl || ""} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={saving} className={`w-full px-6 py-3 ${saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white rounded mt-4 text-lg font-semibold`}>
          {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </>
  );
}