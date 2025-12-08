import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../../store/authSlice";
import { uploadUserImage } from "../../../Service/userService";
import { getAllTags } from "../../../Service/TagServices";
import api from "../../../Service/api";

const CreatePostModal = ({ isOpen, onClose, onPostCreated, initialFiles = null }) => {
  const session = useSelector(selectAuthSession);
  const user = session?.responseUserDTO;
  const userId = user?.id || Number(localStorage.getItem("idUser"));

  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState([]); // Array of File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of preview URLs
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Tags states
  const [availableTags, setAvailableTags] = useState([]); // جميع الوسوم المتاحة من API
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]); // مصفوفة من IDs للوسوم المختارة: [1, 2, 3]
  const [selectedTagToAdd, setSelectedTagToAdd] = useState(""); // ID الوسم المختار من القائمة المنسدلة
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  // Handle initial files when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialFiles && initialFiles.length > 0) {
        // Clean up old previews first
        setImagePreviews(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return [];
        });
        const newPreviews = initialFiles.map(file => URL.createObjectURL(file));
        setSelectedImages(initialFiles);
        setImagePreviews(newPreviews);
      } else if (!initialFiles) {
        // Reset when modal opens without initial files (only if no initial files)
        setImagePreviews(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return [];
        });
        setSelectedImages([]);
      }
    }
  }, [isOpen, initialFiles]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // جلب الوسوم عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      const loadTags = async () => {
        setTagsLoading(true);
        setTagsError(null);
        try {
          const data = await getAllTags();
          setAvailableTags(data);
        } catch (err) {
          console.error("Failed to load tags:", err);
          setTagsError("فشل جلب الوسوم");
          setAvailableTags([]);
        } finally {
          setTagsLoading(false);
        }
      };
      loadTags();
    } else {
      // Reset tags when modal closes
      setSelectedTags([]);
      setSelectedTagToAdd("");
      setShowTagsDropdown(false);
    }
  }, [isOpen]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // إضافة وسم إلى القائمة المختارة
  const handleAddSelectedTag = () => {
    if (!selectedTagToAdd) return;
    const idNum = Number(selectedTagToAdd);
    if (Number.isNaN(idNum)) return;
    if (selectedTags.includes(idNum)) {
      alert("تم إضافة الوسم من قبل.");
      return;
    }
    setSelectedTags((prev) => [...prev, idNum]);
    setSelectedTagToAdd("");
    setShowTagsDropdown(false);
  };

  // حذف وسم من القائمة المختارة
  const handleRemoveSelectedTag = (id) => {
    setSelectedTags((prev) => prev.filter((tagId) => tagId !== id));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      alert("يرجى إدخال محتوى أو إضافة صورة");
      return;
    }

    if (!userId) {
      alert("الرجاء تسجيل الدخول");
      return;
    }

    setUploading(true);

    try {
      // Upload images first
      const uploadedImageUrls = [];
      for (const image of selectedImages) {
        try {
          const url = await uploadUserImage(image);
          uploadedImageUrls.push(url);
        } catch (err) {
          console.error("Failed to upload image:", err);
          alert("فشل رفع إحدى الصور");
          setUploading(false);
          return;
        }
      }

      // Create post
      const postData = {
        title: content.substring(0, 100) || "منشور جديد", // Use first 100 chars as title
        content: content || "",
        userId: Number(userId),
        images: uploadedImageUrls,
        videos: [],
        tags: selectedTags // إرسال مصفوفة من IDs للوسوم
      };

      const res = await api.post("/Post/Add", postData);
      
      // Clean up preview URLs
      setImagePreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      
      // Reset form
      setContent("");
      setSelectedImages([]);
      setSelectedTags([]);
      setSelectedTagToAdd("");
      
      onClose();
      if (onPostCreated) {
        onPostCreated();
      }
      
      alert("تم نشر المنشور بنجاح!");
    } catch (err) {
      console.error("Failed to create post:", err);
      alert(err?.response?.data?.message || "حدث خطأ أثناء نشر المنشور");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">إنشاء منشور</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {user?.imageURL ? (
              <img src={user.imageURL} alt={user.userName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-700 font-semibold text-sm">{getInitials(user?.userName)}</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user?.userName || "مستخدم"}</div>
            <button className="text-xs text-gray-600 flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              أصدقاء
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Text Input */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${user?.userName || "مستخدم"}, ما الذي يدور في ذهنك؟`}
              className="w-full border-none outline-none resize-none text-lg min-h-[120px] placeholder-gray-400"
              dir="rtl"
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4 space-y-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full max-h-96 object-contain bg-gray-100"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 left-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId);
                  return (
                    <div
                      key={tagId}
                      className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm font-medium">
                        #{tag ? (tag.tagName ?? tag.name) : tagId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedTag(tagId)}
                        className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add to Post Section */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">إضافة إلى المنشور</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
            >
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">صور/فيديو</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            {/* Tags Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
              >
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">الوسوم</span>
              </button>
              
              {/* Tags Dropdown */}
              {showTagsDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10" dir="rtl">
                  <div className="flex gap-2 items-center mb-2">
                    <select
                      value={selectedTagToAdd}
                      onChange={(e) => setSelectedTagToAdd(e.target.value)}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      disabled={tagsLoading}
                    >
                      <option value="">اختر وسمًا...</option>
                      {availableTags
                        .filter(tag => !selectedTags.includes(tag.id))
                        .map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.tagName ?? tag.name ?? `#${tag.id}`}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSelectedTag}
                      disabled={!selectedTagToAdd || tagsLoading}
                      className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      إضافة
                    </button>
                  </div>
                  {tagsLoading && (
                    <div className="text-xs text-gray-500 text-center py-2">جاري تحميل الوسوم...</div>
                  )}
                  {tagsError && (
                    <div className="text-xs text-red-500 text-center py-2">{tagsError}</div>
                  )}
                  {!tagsLoading && availableTags.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-2">لا توجد وسوم متاحة</div>
                  )}
                </div>
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.536a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">مشاعر/أنشطة</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <span className="text-sm">الإشارة إلى الأصدقاء</span>
            </button>
          </div>
        </div>

        {/* Post Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && selectedImages.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {uploading ? "جاري النشر..." : "نشر"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;

