import React, { useEffect, useState } from "react";
import api from "../../../Service/api";
import { uploadUserImage } from "../../../Service/userService";
import { uploadUserVideo } from "../../../Service/UploadVideoService";
import { getAllTags } from "../../../Service/TagServices"; 
import { getPostById, updatePost } from "../../../Service/postService";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import Swal from "sweetalert2";

const TINYMCE_API_KEY = "ydbgd84essmlucuqp6di1jaz8o8m7murr9yj34z0en3lv9r5";

const AdminEditPost = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { postId, id } = params;
  const actualId = postId || id; // استخدام postId إذا كان موجوداً، وإلا id

  console.log("🔍 AdminEditPost component mounted");
  console.log("🔍 Params:", params);
  console.log("🔍 postId:", postId);
  console.log("🔍 id:", id);
  console.log("🔍 actualId:", actualId);

  const storedUserId = localStorage.getItem("idUser");
  const userId = storedUserId ? Number(storedUserId) : null;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTagToAdd, setSelectedTagToAdd] = useState("");

  // Load post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!actualId) {
        console.error("❌ Post ID is missing");
        console.error("❌ Available params:", { postId, id, actualId });
        Swal.fire({
          icon: "error",
          title: "❌ خطأ",
          text: "معرف المنشور غير موجود",
          confirmButtonText: "حسنًا",
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const numericPostId = Number(actualId);
        console.log("📤 Fetching post with ID:", numericPostId);
        console.log("📤 Params:", { postId, id, actualId });
        
        if (isNaN(numericPostId) || numericPostId <= 0) {
          throw new Error("معرف المنشور غير صحيح");
        }
        
        const data = await getPostById(numericPostId);
        console.log("✅ Post data received:", data);
        
        if (!data || !data.id) {
          throw new Error("لم يتم العثور على بيانات المنشور");
        }
        
        setPost(data);
        setTitle(data.title || "");
        setContent(data.content || "");
        setImages((data.images || []).map(url => ({ url, file: null, uploading: false })));
        setVideos(data.videos || []);
        setSelectedTags(data.postTags?.map(tag => tag.id) || data.tags?.map(tag => tag.id) || []);
      } catch (err) {
        console.error("❌ Failed to fetch post:", err);
        console.error("❌ Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          postId: actualId,
          params: { postId, id },
        });
        
        Swal.fire({
          icon: "error",
          title: "❌ خطأ",
          text: "فشل تحميل بيانات المنشور: " + (err.message || "خطأ غير معروف"),
          confirmButtonText: "حسنًا",
          footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
        });
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualId]);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      setTagsLoading(true);
      setTagsError(null);
      try {
        const data = await getAllTags();
        if (Array.isArray(data)) setAvailableTags(data);
        else if (Array.isArray(data?.data)) setAvailableTags(data.data);
        else setAvailableTags([]);
      } catch (err) {
        console.error(err);
        setTagsError("فشل جلب الوسوم");
        setAvailableTags([]);
      } finally {
        setTagsLoading(false);
      }
    };
    loadTags();
  }, []);

  // Image helpers
  const addImageSlot = () =>
    setImages((s) => [...s, { url: "", file: null, uploading: false }]);
  const removeImage = (idx) => setImages((s) => s.filter((_, i) => i !== idx));
  const onImageFileChange = async (idx, file) => {
    if (!file) return;
    setImages((s) =>
      s.map((it, i) => (i === idx ? { ...it, file, uploading: true } : it))
    );
    try {
      const url = await uploadUserImage(file);
      setImages((s) =>
        s.map((it, i) =>
          i === idx ? { ...it, url, file: null, uploading: false } : it
        )
      );
    } catch (err) {
      console.error(err);
      alert("فشل رفع الصورة");
      setImages((s) =>
        s.map((it, i) => (i === idx ? { ...it, uploading: false } : it))
      );
    }
  };

  // Video helpers
  const addVideo = () =>
    setVideos((s) => [
      ...s,
      { title: "", description: "", url: "", thumbnailUrl: "", uploadingUrl: false, uploadingThumb: false },
    ]);
  const removeVideo = (idx) => setVideos((s) => s.filter((_, i) => i !== idx));
  const updateVideoField = (idx, key, value) =>
    setVideos((s) => s.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));

  const onVideoFileChange = async (idx, file) => {
    if (!file) return;
    updateVideoField(idx, "uploadingUrl", true);
    try {
      const url = await uploadUserVideo(file);
      updateVideoField(idx, "url", url);
    } catch (err) {
      console.error(err);
      alert("فشل رفع الفيديو");
    } finally {
      updateVideoField(idx, "uploadingUrl", false);
    }
  };

  const onVideoThumbChange = async (idx, file) => {
    if (!file) return;
    updateVideoField(idx, "uploadingThumb", true);
    try {
      const url = await uploadUserImage(file);
      updateVideoField(idx, "thumbnailUrl", url);
    } catch (err) {
      console.error(err);
      alert("فشل رفع صورة المصغرة");
    } finally {
      updateVideoField(idx, "uploadingThumb", false);
    }
  };

  // Tags helpers
  const handleAddSelectedTag = () => {
    if (!selectedTagToAdd) return;
    const idNum = Number(selectedTagToAdd);
    if (Number.isNaN(idNum) || selectedTags.includes(idNum)) return;
    setSelectedTags((s) => [...s, idNum]);
    setSelectedTagToAdd("");
  };
  const handleRemoveSelectedTag = (id) => setSelectedTags((s) => s.filter((t) => t !== id));

  const validate = () => {
    if (!userId) { alert("لم أجد idUser"); return false; }
    if (!title.trim()) { alert("الرجاء إدخال العنوان"); return false; }
    if (!content.trim()) { alert("الرجاء إدخال المحتوى"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const anyUploading =
      images.some(i => i.uploading) ||
      videos.some(v => v.uploadingUrl || v.uploadingThumb);
    if (anyUploading) {
      alert("الرجاء الانتظار حتى انتهاء رفع الملفات");
      setSubmitting(false);
      return;
    }

    const body = {
      title: title.trim(),
      content,
      userId: userId || post.userId || Number(localStorage.getItem("idUser")) || 0,
      videos: videos
        .map(v => ({
          title: v.title?.trim() || null,
          description: v.description?.trim() || null,
          url: v.url?.trim() || null,
          thumbnailUrl: v.thumbnailUrl?.trim() || null,
        }))
        .filter(v => v.url),
      images: images.map(i => i.url).filter(Boolean),
      tags: selectedTags,
    };

    // التحقق من userId قبل الإرسال
    if (!body.userId || body.userId <= 0) {
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: "معرف المستخدم غير موجود. يرجى تسجيل الدخول مرة أخرى.",
        confirmButtonText: "حسنًا",
      });
      setSubmitting(false);
      return;
    }

    try {
      console.log("📤 Updating post:", post.id, body);
      await updatePost(post.id, body);
      
      Swal.fire({
        icon: "success",
        title: "✅ نجاح",
        text: "تم حفظ التعديلات بنجاح!",
        confirmButtonText: "حسنًا",
      }).then(() => navigate(-1));
    } catch (err) {
      console.error("❌ Error updating post:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        postId: post.id,
      });
      
      const errorMessage = err.message || err.response?.data?.message || "حدث خطأ أثناء حفظ التعديلات";
      Swal.fire({
        icon: "error",
        title: "❌ خطأ",
        text: errorMessage,
        confirmButtonText: "حسنًا",
        footer: err.response?.status ? `رمز الخطأ: ${err.response.status}` : "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">⏳ جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-xl text-red-500 mb-4">❌ لم يتم العثور على المنشور</p>
          <p className="text-gray-600 mb-4">معرف المنشور: {actualId || "غير موجود"}</p>
          <p className="text-gray-500 text-sm mb-4">Params: postId={postId}, id={id}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">تعديل البوست</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
        {/* العنوان */}
        <div>
          <label className="block text-sm font-medium text-gray-700">العنوان</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 block w-full border rounded-md px-3 py-2"
            placeholder="اكتب عنوان البوست"
          />
        </div>

        {/* المحتوى */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى</label>
          <Editor
            apiKey={TINYMCE_API_KEY}
            value={content}
            onEditorChange={c => setContent(c)}
            init={{
              height: 400,
              menubar: true,
              plugins: [
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste codesample",
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

        {/* الصور */}
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
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">لم يتم رفع صورة</div>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={e => onImageFileChange(idx, e.target.files?.[0])} />
                  <div className="text-sm text-gray-500">
                    {img.uploading ? "جاري رفع الصورة..." : img.url ? "تم الرفع" : "اختر ملف للرفع"}
                  </div>
                </div>
                <button type="button" onClick={() => removeImage(idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded">حذف</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addImageSlot} className="mt-2 px-3 py-2 bg-sky-100 text-sky-700 rounded">إضافة صورة</button>
        </div>

        {/* الفيديوهات */}
        <div>
          <label className="block text-sm font-medium text-gray-700">فيديوهات</label>
          <div className="mt-2 space-y-3">
            {videos.map((v, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">فيديو #{idx + 1}</span>
                  <button type="button" onClick={() => removeVideo(idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">حذف</button>
                </div>
                <input type="text" value={v.title} onChange={e => updateVideoField(idx, "title", e.target.value)} placeholder="عنوان الفيديو" className="w-full border rounded px-2 py-1 mb-2" />
                <input type="file" accept="video/*" onChange={e => onVideoFileChange(idx, e.target.files?.[0])} className="mb-2" />
                <div className="text-sm text-gray-500 mb-2">{v.uploadingUrl ? "جاري رفع الفيديو..." : v.url ? "تم رفع الفيديو" : "اختر ملف فيديو"}</div>
                {v.url && <video src={v.url} controls className="w-full h-40 object-cover rounded-md mb-2" />}
                <input type="file" accept="image/*" onChange={e => onVideoThumbChange(idx, e.target.files?.[0])} className="mb-2" />
                <div className="text-sm text-gray-500 mb-2">{v.uploadingThumb ? "جاري رفع المصغّرة..." : v.thumbnailUrl ? "تم رفع المصغّرة" : "اختر صورة مصغّرة"}</div>
                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="thumb" className="w-48 h-28 object-cover rounded-md mb-2" />}
                <textarea value={v.description} onChange={e => updateVideoField(idx, "description", e.target.value)} placeholder="وصف الفيديو" rows={2} className="w-full border rounded px-2 py-1" />
              </div>
            ))}
          </div>
          <button type="button" onClick={addVideo} className="mt-2 px-3 py-2 bg-sky-100 text-sky-700 rounded">إضافة فيديو</button>
        </div>

        {/* الوسوم */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوسوم</label>
          <div className="mt-2 flex gap-2 items-center">
            <select value={selectedTagToAdd} onChange={e => setSelectedTagToAdd(e.target.value)} className="border rounded px-3 py-2">
              <option value="">اختر وسمًا...</option>
              {availableTags.map(t => <option key={t.id} value={t.id}>{t.tagName ?? t.name ?? `#${t.id}`}</option>)}
            </select>
            <button type="button" onClick={handleAddSelectedTag} disabled={!selectedTagToAdd} className="px-3 py-2 bg-sky-100 text-sky-700 rounded">إضافة وسم</button>
            {tagsLoading && <div className="text-sm text-gray-500">جاري تحميل الوسوم...</div>}
            {tagsError && <div className="text-sm text-red-500">{tagsError}</div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map(id => {
              const tag = availableTags.find(t => t.id === id);
              return (
                <div key={id} className="flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 px-2 py-1 rounded-full">
                  <span className="text-sm">{tag ? (tag.tagName ?? tag.name) : `#${id}`}</span>
                  <button type="button" onClick={() => handleRemoveSelectedTag(id)} className="text-xs px-1 rounded bg-red-100 text-red-700">حذف</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* أزرار الإرسال */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60">
            {submitting ? "جارٍ الإرسال..." : "حفظ التعديلات"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded">إلغاء</button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditPost;
