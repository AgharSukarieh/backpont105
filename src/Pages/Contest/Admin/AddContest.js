import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../../Service/api";
import { getAllProblems } from "../../../Service/ProblemService";
import { getAllUniversities } from "../../../Service/UniversityService";
import { uploadUserImage } from "../../../Service/userService";
import { Editor } from "@tinymce/tinymce-react";

const AddContest = () => {
  const navigate = useNavigate();

  const [contest, setContest] = useState({
    name: "",
    startTime: "",
    endTime: "",
    createdById: parseInt(localStorage.getItem("idUser")) || 0,
    problemsId: [],
    isPublic: true,
    universityId: 0,
    imageURL: "",
    difficultyLevel: 1,
    prizes: "",
    location: "اونلاين",
    termsAndConditions: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const TINYMCE_API_KEY = "ydbgd84essmlucuqp6di1jaz8o8m7murr9yj34z0en3lv9r5";

  const tinymceInit = {
    height: 200,
    menubar: false,
    directionality: "rtl",
    plugins: ["advlist autolink lists link image charmap preview anchor", "searchreplace visualblocks code fullscreen", "insertdatetime media table paste code help"],
    toolbar: "undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat",
    content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; direction: rtl; }",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [probs, unis] = await Promise.all([getAllProblems(), getAllUniversities()]);
        setAllProblems(probs || []);
        setUniversities(unis || []);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addProblem = () => {
    if (!selectedProblemId) return;
    const pid = parseInt(selectedProblemId);
    if (contest.problemsId.includes(pid)) {
      Swal.fire("تنبيه", "المسألة مضافة مسبقاً", "warning");
      return;
    }
    setContest((prev) => ({ ...prev, problemsId: [...prev.problemsId, pid] }));
    setSelectedProblemId("");
  };

  const removeProblem = (id) => {
    setContest((prev) => ({ ...prev, problemsId: prev.problemsId.filter((pid) => pid !== id) }));
  };

  const handleAddContest = async (e) => {
    e.preventDefault();
    
    if (contest.problemsId.length === 0) {
      return Swal.fire("تنبيه", "يجب إضافة مسألة واحدة على الأقل", "warning");
    }

    setSaving(true);
    try {
      let finalImageUrl = contest.imageURL;
      if (imageFile) {
        finalImageUrl = await uploadUserImage(imageFile);
      }

      const payload = {
        name: contest.name.trim(),
        startTime: new Date(contest.startTime).toISOString(),
        endTime: new Date(contest.endTime).toISOString(),
        createdById: Number(contest.createdById),
        imageURL: finalImageUrl || "string",
        problemsId: contest.problemsId.map(Number),
        universityId: Number(contest.universityId),
        isPublic: contest.isPublic,
        difficultyLevel: Number(contest.difficultyLevel),
        prizes: contest.prizes.trim() || "string",
        location: contest.location.trim() || "string",
        termsAndConditions: contest.termsAndConditions.trim() || "string",
      };

      await api.post("/api/contests", payload);
      Swal.fire("تم بنجاح", "تمت إضافة المسابقة بنجاح", "success")
        .then(() => navigate("/react-app/admin/contests"));
    } catch (err) {
      console.error("Save Error:", err);
      Swal.fire("خطأ", "فشل حفظ المسابقة، تأكد من البيانات", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* العنوان الرئيسي */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">إضافة مسابقة جديدة</h1>
          <p className="text-gray-500">قم بملء جميع التفاصيل لإنشاء مسابقة برمجية جديدة</p>
        </div>

        <form onSubmit={handleAddContest} className="space-y-8">
          
          {/* القسم الأول: المعلومات الأساسية */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">المعلومات الأساسية</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المسابقة</label>
                <input 
                  type="text" 
                  value={contest.name} 
                  onChange={(e) => setContest(p => ({...p, name: e.target.value}))} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="أدخل اسم المسابقة..."
                  required 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
                  <input 
                    type="text" 
                    value={contest.location} 
                    onChange={(e) => setContest(p => ({...p, location: e.target.value}))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="أونلاين / عمان / إلخ..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مستوى الصعوبة</label>
                  <select 
                    value={contest.difficultyLevel} 
                    onChange={(e) => setContest(p => ({...p, difficultyLevel: e.target.value}))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value={1}>سهل</option>
                    <option value={2}>متوسط</option>
                    <option value={3}>صعب</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الجامعة المرتبطة</label>
                  <select 
                    value={contest.universityId} 
                    onChange={(e) => setContest(p => ({...p, universityId: e.target.value}))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value={0}>لا توجد (مسابقة عامة)</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع المسابقة</label>
                  <select 
                    value={contest.isPublic} 
                    onChange={(e) => setContest(p => ({...p, isPublic: e.target.value === "true"}))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  >
                    <option value={true}>عامة</option>
                    <option value={false}>خاصة</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* القسم الثاني: المواعيد */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">التوقيت</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">تاريخ ووقت البدء</label>
                <input 
                  type="datetime-local" 
                  value={contest.startTime} 
                  onChange={(e) => setContest(p => ({...p, startTime: e.target.value}))} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">تاريخ ووقت الانتهاء</label>
                <input 
                  type="datetime-local" 
                  value={contest.endTime} 
                  onChange={(e) => setContest(p => ({...p, endTime: e.target.value}))} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  required 
                />
              </div>
            </div>
          </div>

          {/* القسم الثالث: صورة المسابقة */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">صورة المسابقة</h2>
            
            <div className="flex flex-col items-center">
              {imagePreview && (
                <div className="mb-6">
                  <img 
                    src={imagePreview} 
                    alt="معاينة" 
                    className="w-64 h-64 object-cover rounded-xl shadow-md border-2 border-gray-200" 
                  />
                </div>
              )}
              
              <label className="cursor-pointer">
                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center">
                  {imagePreview ? "تغيير الصورة" : "رفع صورة"}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* القسم الرابع: المسائل */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              المسائل ({contest.problemsId.length})
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <select 
                  value={selectedProblemId} 
                  onChange={(e) => setSelectedProblemId(e.target.value)} 
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="">اختر مسألة لإضافتها</option>
                  {allProblems.filter(p => !contest.problemsId.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={addProblem} 
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium whitespace-nowrap"
                >
                  إضافة
                </button>
              </div>
              {contest.problemsId.length > 0 && (
                <div className="space-y-2 mt-4">
                  {contest.problemsId.map(pid => {
                    const p = allProblems.find(x => x.id === pid);
                    return p && (
                      <div 
                        key={pid} 
                        className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <span className="text-gray-700 font-medium">{p.title}</span>
                        <button 
                          type="button" 
                          onClick={() => removeProblem(pid)} 
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* القسم الخامس: التفاصيل الإضافية */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">التفاصيل الإضافية</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الجوائز</label>
                <Editor 
                  apiKey={TINYMCE_API_KEY} 
                  value={contest.prizes} 
                  onEditorChange={(c) => setContest(p => ({...p, prizes: c}))} 
                  init={tinymceInit} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الشروط والأحكام</label>
                <Editor 
                  apiKey={TINYMCE_API_KEY} 
                  value={contest.termsAndConditions} 
                  onEditorChange={(c) => setContest(p => ({...p, termsAndConditions: c}))} 
                  init={tinymceInit} 
                />
              </div>
            </div>
          </div>

          {/* زر الحفظ */}
          <div className="flex justify-center pt-4">
            <button 
              type="submit" 
              disabled={saving} 
              className="px-12 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {saving ? "جاري الحفظ..." : "إنشاء المسابقة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContest;
