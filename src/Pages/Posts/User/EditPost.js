import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { uploadUserImage } from "../../../Service/userService";
import { uploadUserVideo } from "../../../Service/UploadVideoService";
import { getAllTags } from "../../../Service/TagServices";
import { updatePost } from "../../../Service/postService";
import { Editor } from "@tinymce/tinymce-react";

const TINYMCE_API_KEY = "ydbgd84essmlucuqp6di1jaz8o8m7murr9yj34z0en3lv9r5";

/**
 * EditPost
 *
 * Flow:
 * - Files are kept locally until "حفظ التعديلات".
 * - On submit: open modal -> upload files sequentially (images then videos then thumbs) using uploadUserImage/uploadUserVideo
 * - These functions are expected to return a string URL (res.data per your implementation).
 * - Insert returned URLs into images[] and videos[].url / videos[].thumbnailUrl
 * - Send final JSON matching PUT /Post/Update:
 *   { id, title, content, videos: [{id,title,description,url,thumbnailUrl}], images: [string], tags: [number] }
 * - Show upload progress and final success popup inside modal.
 */

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = Number(id);

  const storedUserId = localStorage.getItem("idUser");
  const userId = storedUserId ? Number(storedUserId) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // media
  const [images, setImages] = useState([]); // { url?, file? }
  const [videos, setVideos] = useState([]); // { id?, title, description, url?, thumbnailUrl?, file?, thumbFile? }

  // tags
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTagToAdd, setSelectedTagToAdd] = useState("");

  // modal & upload statuses
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState([]); // { id, type, idx, name, status, url?, error? }
  const [overallMessage, setOverallMessage] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateResponse, setUpdateResponse] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/Post/GetById/${postId}`);
        const p = res?.data;
        if (!p) throw new Error("لم يتم إيجاد بيانات البوست");

        setTitle(p.title ?? "");
        setContent(p.content ?? "");

        const imgs = Array.isArray(p.images) && p.images.length
          ? p.images.map((u) => ({ url: u, file: null }))
          : p.imageURL
            ? [{ url: p.imageURL, file: null }]
            : [];
        setImages(imgs);

        const vids = Array.isArray(p.videos)
          ? p.videos.map((v) => ({
              id: v.id ?? 0,
              title: v.title ?? "",
              description: v.description ?? "",
              url: v.url ?? "",
              thumbnailUrl: v.thumbnailUrl ?? v.thumbnail ?? "",
              file: null,
              thumbFile: null,
            }))
          : [];
        setVideos(vids);

        if (Array.isArray(p.postTags)) {
          const tIds = p.postTags
            .map((t) => (typeof t === "object" ? Number(t.id ?? t.tagId ?? t) : Number(t)))
            .filter(Boolean);
          setSelectedTags(tIds);
        } else {
          setSelectedTags([]);
        }
      } catch (err) {
        console.error("Failed to load post:", err?.response ?? err);
        setError("فشل جلب بيانات البوست. افتح Console للمزيد.");
      } finally {
        setLoading(false);
      }

      try {
        setTagsLoading(true);
        const data = await getAllTags();
        if (Array.isArray(data)) setAvailableTags(data);
        else if (Array.isArray(data?.data)) setAvailableTags(data.data);
        else setAvailableTags(Array.isArray(data?.tags) ? data.tags : []);
      } catch (err) {
        console.error("Failed to load tags:", err?.response ?? err);
        setTagsError("فشل جلب الوسوم");
      } finally {
        setTagsLoading(false);
      }
    };

    if (!Number.isFinite(postId) || postId <= 0) {
      setError("معرّف البوست غير صالح.");
      setLoading(false);
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // helpers images/videos
  const addImageSlot = () => setImages((s) => [...s, { url: "", file: null }]);
  const removeImage = (idx) => setImages((s) => s.filter((_, i) => i !== idx));
  const onImageFileSelect = (idx, file) => {
    setImages((s) => s.map((it, i) => (i === idx ? { ...it, file } : it)));
  };

  const addVideo = () => setVideos((s) => [...s, { id: 0, title: "", description: "", url: "", thumbnailUrl: "", file: null, thumbFile: null }]);
  const removeVideo = (idx) => setVideos((s) => s.filter((_, i) => i !== idx));
  const updateVideoField = (idx, key, value) => setVideos((s) => s.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  const onVideoFileSelect = (idx, file) => updateVideoField(idx, "file", file);
  const onVideoThumbSelect = (idx, file) => updateVideoField(idx, "thumbFile", file);

  // tags
  const handleAddSelectedTag = () => {
    if (!selectedTagToAdd) return;
    const idNum = Number(selectedTagToAdd);
    if (Number.isNaN(idNum)) return;
    if (selectedTags.includes(idNum)) {
      alert("تم إضافة الوسم من قبل.");
      return;
    }
    setSelectedTags((s) => [...s, idNum]);
    setSelectedTagToAdd("");
  };
  const handleRemoveSelectedTag = (id) => setSelectedTags((s) => s.filter((t) => t !== id));

  const validate = () => {
    if (!userId) {
      alert("لم أجد idUser في localStorage. سجّل الدخول أو خزّن idUser.");
      return false;
    }
    if (!title.trim()) {
      alert("الرجاء إدخال عنوان البوست.");
      return false;
    }
    if (!content || !content.trim()) {
      alert("الرجاء إدخال محتوى البوست.");
      return false;
    }
    return true;
  };

  // build upload tasks in order: images first, then videos (video then thumb)
  const buildUploadTasks = () => {
    const tasks = [];
    images.forEach((img, idx) => {
      if (img.file) tasks.push({ id: `image-${idx}`, type: "image", idx, name: img.file.name || `image#${idx + 1}`, file: img.file });
    });
    videos.forEach((v, idx) => {
      if (v.file) tasks.push({ id: `video-${idx}`, type: "video", idx, name: v.file.name || `video#${idx + 1}`, file: v.file });
      if (v.thumbFile) tasks.push({ id: `thumb-${idx}`, type: "thumb", idx, name: v.thumbFile.name || `thumb#${idx + 1}`, file: v.thumbFile });
    });
    return tasks;
  };

  // upload sequentially; stop on first error and return details
  const uploadAllFiles = async (tasks) => {
    if (!tasks || tasks.length === 0) {
      setUploadStatuses([]);
      return { success: true };
    }

    const initial = tasks.map((t) => ({ id: t.id, type: t.type, idx: t.idx, name: t.name, status: "pending", url: null, error: null }));
    setUploadStatuses(initial);

    for (const t of tasks) {
      setUploadStatuses((s) => s.map((x) => (x.id === t.id ? { ...x, status: "uploading" } : x)));
      try {
        let res;
        if (t.type === "image" || t.type === "thumb") {
          res = await uploadUserImage(t.file);
        } else if (t.type === "video") {
          res = await uploadUserVideo(t.file);
        } else {
          throw new Error("Unknown upload type");
        }

        // normalize to string URL (your upload functions return res.data string)
        const uploadedUrl = typeof res === "string" ? res : (res?.data ?? res);
        if (!uploadedUrl || typeof uploadedUrl !== "string") {
          throw new Error("لم يرجع السيرفر رابط صالح بعد الرفع. راجع استجابة الرفع في Network/Console.");
        }

        // place URL in main state
        if (t.type === "image") {
          setImages((s) => s.map((it, idx) => (idx === t.idx ? { ...it, url: uploadedUrl, file: null } : it)));
        } else if (t.type === "video") {
          updateVideoField(t.idx, "url", uploadedUrl);
          updateVideoField(t.idx, "file", null);
        } else if (t.type === "thumb") {
          updateVideoField(t.idx, "thumbnailUrl", uploadedUrl);
          updateVideoField(t.idx, "thumbFile", null);
        }

        setUploadStatuses((s) => s.map((x) => (x.id === t.id ? { ...x, status: "done", url: uploadedUrl } : x)));
        console.debug("[upload] done", t.id, uploadedUrl);
      } catch (err) {
        console.error("[upload] error", t.id, err?.response ?? err);
        const status = err?.response?.status ?? null;
        const data = err?.response?.data ?? err?.message ?? String(err);
        setUploadStatuses((s) => s.map((x) => (x.id === t.id ? { ...x, status: "error", error: `status:${status} data:${JSON.stringify(data)}` } : x)));
        return { success: false, error: `Upload failed for ${t.name}: ${String(data)}` };
      }
    }

    return { success: true };
  };

  // submit: upload files then PUT /Post/Update with exact JSON
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const tasks = buildUploadTasks();

    setModalOpen(true);
    setUpdateSuccess(false);
    setUpdateResponse(null);
    setOverallMessage("بدء رفع الملفات (إن وُجدت) ...");
    setUploadStatuses([]);

    try {
      if (tasks.length > 0) {
        const result = await uploadAllFiles(tasks);
        if (!result.success) {
          setOverallMessage(`فشل رفع ملف: ${result.error}`);
          setSaving(false);
          return; // stop so user can inspect/repair
        }
      } else {
        setOverallMessage("لا توجد ملفات للرفع. المتابعة لإرسال التحديث...");
      }

      setOverallMessage("جاري إرسال تحديث البوست إلى الخادم...");
      setSaving(true);

      // استخدام updatePost من postService
      const updateData = {
        title: title.trim(),
        content: content,
        videos: videos
          .map((v) => ({
            id: Number(v.id ?? 0),
            title: v.title?.trim() ?? null,
            description: v.description?.trim() ?? null,
            url: v.url?.trim() ?? null,
            thumbnailUrl: v.thumbnailUrl?.trim() ?? null,
          }))
          .filter((v) => v.url),
        images: images.map((i) => i.url).filter(Boolean),
        tags: selectedTags.map((t) => Number(t)).filter(Boolean),
      };

      console.debug("[PUT] Update data:", updateData);
      const res = await updatePost(postId, updateData);
      console.debug("[PUT] Response:", res);
      setUpdateResponse(res);
      setOverallMessage("تم تحديث البوست بنجاح.");
      setUpdateSuccess(true);
      setSaving(false);
    } catch (err) {
      console.error("Failed to update post:", err?.response ?? err);
      const msg = err?.response?.data ?? err?.message ?? "حدث خطأ أثناء التحديث.";
      setOverallMessage(String(msg));
      setError(String(msg));
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>;

  if (error && !modalOpen) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded">رجوع</button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">تعديل البوست #{postId}</h2>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">العنوان</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border rounded-md px-3 py-2" placeholder="اكتب عنوان البوست" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
            <Editor
              apiKey={TINYMCE_API_KEY}
              tinymceScriptSrc={`https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/6/tinymce.min.js`}
              value={content}
              onEditorChange={(c) => setContent(c)}
              init={{
                height: 400,
                menubar: true,
                plugins: [
                  "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
                  "searchreplace", "visualblocks", "code", "fullscreen",
                  "insertdatetime", "media", "table", "paste", "codesample"
                ],
                toolbar:
                  "undo redo | formatselect | bold italic underline forecolor backcolor | " +
                  "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | link image media table | codesample fullscreen",
                branding: false,
                content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700">الصور</label>
            <div className="mt-2 space-y-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : img.file ? (
                      <img src={URL.createObjectURL(img.file)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">لم يتم اختيار صورة</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => onImageFileSelect(idx, e.target.files?.[0])} />
                    <div className="text-sm text-gray-500">{img.file ? `ملف جاهز للرفع: ${img.file.name}` : img.url ? "صورة موجودة" : "لم يتم اختيار ملف"}</div>
                  </div>

                  <div>
                    <button type="button" onClick={() => removeImage(idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded">حذف</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button type="button" onClick={addImageSlot} className="px-3 py-2 bg-sky-100 text-sky-700 rounded">إضافة صورة</button>
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700">فيديوهات</label>
            <div className="mt-2 space-y-3">
              {videos.map((v, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">فيديو #{idx + 1}</div>
                    <div><button type="button" onClick={() => removeVideo(idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">حذف</button></div>
                  </div>

                  <input type="text" value={v.title} onChange={(e) => updateVideoField(idx, "title", e.target.value)} placeholder="عنوان الفيديو (اختياري)" className="w-full border rounded px-2 py-1 mb-2" />

                  <input type="file" accept="video/*" onChange={(e) => onVideoFileSelect(idx, e.target.files?.[0])} className="mb-2" />
                  <div className="text-sm text-gray-500 mb-2">{v.file ? `ملف فيديو جاهز للرفع: ${v.file.name}` : v.url ? "فيديو موجود" : "لم يتم اختيار ملف فيديو"}</div>
                  {v.url && !v.file && <div className="mb-2"><video src={v.url} controls className="w-full h-40 object-cover rounded-md" /></div>}

                  <input type="file" accept="image/*" onChange={(e) => onVideoThumbSelect(idx, e.target.files?.[0])} className="mb-2" />
                  <div className="text-sm text-gray-500 mb-2">{v.thumbFile ? `ملف مصغّرة جاهز للرفع: ${v.thumbFile.name}` : v.thumbnailUrl ? "مصغّرة موجودة" : "لم يتم اختيار مصغّرة"}</div>
                  {v.thumbnailUrl && !v.thumbFile && <div className="mb-2"><img src={v.thumbnailUrl} alt="thumb" className="w-48 h-28 object-cover rounded-md" /></div>}

                  <textarea value={v.description} onChange={(e) => updateVideoField(idx, "description", e.target.value)} placeholder="وصف الفيديو (اختياري)" rows={2} className="w-full border rounded px-2 py-1" />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button type="button" onClick={addVideo} className="px-3 py-2 bg-sky-100 text-sky-700 rounded">إضافة فيديو</button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوسوم</label>
            <div className="mt-2 flex gap-2 items-center">
              <select value={selectedTagToAdd} onChange={(e) => setSelectedTagToAdd(e.target.value)} className="border rounded px-3 py-2">
                <option value="">اختر وسمًا...</option>
                {availableTags.map((t) => (<option key={t.id} value={t.id}>{t.tagName ?? t.name ?? `#${t.id}`}</option>))}
              </select>
              <button type="button" onClick={handleAddSelectedTag} className="px-3 py-2 bg-sky-100 text-sky-700 rounded" disabled={!selectedTagToAdd}>إضافة وسم</button>
              {tagsLoading && <div className="text-sm text-gray-500">جاري تحميل الوسوم...</div>}
              {tagsError && <div className="text-sm text-red-500">{tagsError}</div>}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTags.length === 0 && <div className="text-sm text-gray-500">لم يتم اختيار أي وسم بعد.</div>}
              {selectedTags.map((tid) => {
                const tag = availableTags.find((t) => t.id === tid);
                return (
                  <div key={tid} className="flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 px-2 py-1 rounded-full">
                    <span className="text-sm">{tag ? (tag.tagName ?? tag.name) : `#${tid}`}</span>
                    <button type="button" onClick={() => handleRemoveSelectedTag(tid)} className="text-xs px-1 rounded bg-red-100 text-red-700">حذف</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60">{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded">إلغاء</button>
          </div>
        </form>
      </div>

      {/* modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h3 className="text-lg font-semibold">{updateSuccess ? "تم التحديث" : "جاري تحديث البوست"}</h3>
                <div className="text-sm text-gray-600 mt-1">{overallMessage}</div>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {updateSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="text-lg font-medium text-emerald-700">تم تحديث البوست بنجاح</div>
                    <div className="text-sm text-gray-600 text-center">يمكنك عرض البوست الآن أو إغلاق هذه النافذة للعودة إلى التحرير.</div>

                    <div className="flex gap-3">
                      <button onClick={() => { setModalOpen(false); navigate(`/react-app/Post/${postId}`); }} className="px-4 py-2 bg-emerald-600 text-white rounded">عرض البوست</button>
                      <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">إغلاق</button>
                    </div>

                    {updateResponse && <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-w-full overflow-auto">{JSON.stringify(updateResponse, null, 2)}</pre>}
                  </div>
                ) : (
                  <>
                    {uploadStatuses.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">حالة رفع الملفات:</div>
                        <ul className="space-y-2">
                          {uploadStatuses.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-xs">{u.type === "image" ? "IMG" : u.type === "video" ? "VID" : "TH"}</div>
                                <div>
                                  <div className="text-sm font-medium break-all">{u.name}</div>
                                  <div className="text-xs text-gray-500">{u.type === "image" ? `صورة #${u.idx + 1}` : u.type === "video" ? `فيديو #${u.idx + 1}` : `مصغّرة #${u.idx + 1}`}</div>
                                </div>
                              </div>
                              <div className="text-sm">
                                {u.status === "pending" && <span className="text-gray-500">قيد الانتظار</span>}
                                {u.status === "uploading" && <span className="text-blue-600">جاري الرفع...</span>}
                                {u.status === "done" && <span className="text-emerald-600">تم الرفع</span>}
                                {u.status === "error" && <span className="text-red-600">خطأ: {u.error}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="text-sm text-gray-600">إجمالي: {uploadStatuses.filter((s) => s.status === "done").length} / {uploadStatuses.length} مكتمل</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">لا توجد ملفات للرفع أو جاري التحضير...</div>
                    )}
                    {saving && <div className="mt-2 text-sm text-gray-700">جاري إرسال التحديث إلى الخادم...</div>}
                  </>
                )}
              </div>

              <div className="px-4 py-3 border-t flex justify-end gap-2">
                {(!uploadStatuses.some((s) => s.status === "uploading") && !saving) || updateSuccess ? (
                  <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => setModalOpen(false)}>إغلاق</button>
                ) : (
                  <button type="button" className="px-3 py-1 bg-gray-200 text-gray-500 rounded" disabled>الرجاء الانتظار...</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditPost;