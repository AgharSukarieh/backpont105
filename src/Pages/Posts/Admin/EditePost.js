import React, { useEffect, useState } from "react";
import api from "../../../Service/api";
import { uploadUserImage } from "../../../Service/userService";
import { uploadUserVideo } from "../../../Service/UploadVideoService";
import { getAllTags } from "../../../Service/TagServices"; 
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";

const TINYMCE_API_KEY = "ydbgd84essmlucuqp6di1jaz8o8m7murr9yj34z0en3lv9r5";

const AdminEditPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
      try {
        const res = await api.get(`/Post/GetById/${id}`);
        const data = res.data;
        setPost(data);
        setTitle(data.title || "");
        setContent(data.content || "");
        setImages((data.images || []).map(url => ({ url, file: null, uploading: false })));
        setVideos(data.videos || []);
        setSelectedTags(data.postTags?.map(tag => tag.id) || []);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

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
      id: post.id,
      title: title.trim(),
      content,
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

    try {
      await api.put("/Post/Update", body);
      alert("تم حفظ التعديلات بنجاح!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center mt-10">جاري التحميل...</p>;
  if (!post) return <p className="text-center mt-10 text-red-600">لم يتم العثور على البوست</p>;

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
