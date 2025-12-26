import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import { getAllTags } from "../../../Service/TagServices";
import { uploadUserImage } from "../../../Service/userService";
import Swal from "sweetalert2"; // ✅ إضافته هنا

export default function EditProblemRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  // 🔹 جلب بيانات المشكلة
  const fetchProblem = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/problem-requests/${id}`);
      const data = res.data;
      setProblem({ ...data, isDeleted: false });
      setSelectedTags(data.tagsRequest?.map((t) => t.id) || []);
    } catch (error) {
      console.error("❌ خطأ أثناء جلب بيانات المشكلة:", error);
      Swal.fire("خطأ!", "حدث خطأ أثناء تحميل البيانات 😢", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 جلب الوسوم
  const fetchTags = async () => {
    try {
      const allTags = await getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error("❌ خطأ أثناء جلب الوسوم:", error);
      Swal.fire("خطأ!", "تعذر تحميل الوسوم 😢", "error");
    }
  };

  useEffect(() => {
    fetchProblem();
    fetchTags();
  }, [id]);

  if (loading)
    return <p className="text-center mt-10">⏳ جاري تحميل البيانات...</p>;
  if (!problem)
    return (
      <p className="text-center mt-10 text-red-500">
        ❌ لم يتم العثور على المشكلة
      </p>
    );

  // ✅ تغيير الوسوم
  const handleTagChange = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // ✅ إضافة Test Case
  const addTestCase = () => {
    setProblem({
      ...problem,
      testCaseRequest: [
        ...(problem.testCaseRequest || []),
        {
          id: 0,
          problemId: problem.id,
          input: "",
          expectedOutput: "",
          isSample: false,
        },
      ],
    });
  };

  // ✅ تعديل Test Case
  const handleTestCaseChange = (index, field, value) => {
    const updated = [...(problem.testCaseRequest || [])];
    updated[index][field] = value;
    setProblem({ ...problem, testCaseRequest: updated });
  };

  // ✅ حذف Test Case
  const removeTestCase = (index) => {
    const updated = [...(problem.testCaseRequest || [])];
    updated.splice(index, 1);
    setProblem({ ...problem, testCaseRequest: updated });
  };

  // ✅ حفظ + موافقة
  const handleSaveAndAccept = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = problem.imageUrl || "";
      if (imageFile) imageUrl = await uploadUserImage(imageFile);

      const payload = {
        id: problem.id,
        title: problem.title,
        descriptionProblem: problem.descriptionProblem,
        imageUrl: imageUrl,
        descriptionInput: problem.descriptionInput,
        descriptionOutput: problem.descriptionOutput,
        authorNotes: problem.authorNotes || "",
        difficulty: problem.difficulty,
        status: problem.status,
        memory: Number(problem.memory),
        time: Number(problem.time),
        testCases: problem.testCaseRequest || [],
        tags: selectedTags,
      };

      await api.put(`/problem-requests/${problem.id}`, payload);
      await api.post(`/problem-requests/${problem.id}/approve`);

      // ✅ SweetAlert2 نجاح
      Swal.fire({
        title: "تم الحفظ والموافقة ✅",
        text: "تم تحديث الطلب والموافقة عليه بنجاح!",
        icon: "success",
        confirmButtonText: "تم",
        confirmButtonColor: "#16a34a",
      }).then(() => navigate("/react-app/admin/problem-requests"));
    } catch (error) {
      console.error("❌ خطأ أثناء الحفظ والموافقة:", error.response || error);
      Swal.fire({
        title: "خطأ!",
        text: "حدث خطأ أثناء الحفظ والموافقة 😢",
        icon: "error",
        confirmButtonText: "إغلاق",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">تعديل طلب المسألة</h1>

      <form onSubmit={handleSaveAndAccept} className="space-y-4">
        {/* 🟢 العنوان */}
        <div>
          <label className="block font-semibold mb-1">العنوان</label>
          <input
            type="text"
            value={problem.title}
            onChange={(e) =>
              setProblem({ ...problem, title: e.target.value })
            }
            className="w-full border p-2 rounded-md"
            required
          />
        </div>

        {/* 🟢 وصف المسألة */}
        <div>
          <label className="block font-semibold mb-1">وصف المسألة</label>
          <textarea
            value={problem.descriptionProblem}
            onChange={(e) =>
              setProblem({ ...problem, descriptionProblem: e.target.value })
            }
            className="w-full border p-2 rounded-md"
            rows={4}
          />
        </div>

        {/* 🟢 وصف الإدخال */}
        <div>
          <label className="block font-semibold mb-1">وصف الإدخال</label>
          <textarea
            value={problem.descriptionInput}
            onChange={(e) =>
              setProblem({ ...problem, descriptionInput: e.target.value })
            }
            className="w-full border p-2 rounded-md"
            rows={3}
          />
        </div>

        {/* 🟢 وصف الإخراج */}
        <div>
          <label className="block font-semibold mb-1">وصف الإخراج</label>
          <textarea
            value={problem.descriptionOutput}
            onChange={(e) =>
              setProblem({ ...problem, descriptionOutput: e.target.value })
            }
            className="w-full border p-2 rounded-md"
            rows={3}
          />
        </div>

        {/* 🟢 ملاحظات الكاتب */}
        <div>
          <label className="block font-semibold mb-1">ملاحظات الكاتب</label>
          <textarea
            value={problem.authorNotes || ""}
            onChange={(e) =>
              setProblem({ ...problem, authorNotes: e.target.value })
            }
            className="w-full border p-2 rounded-md"
            rows={3}
          />
        </div>

        {/* 🟢 إعدادات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold mb-1">الصعوبة</label>
            <select
              value={problem.difficulty}
              onChange={(e) =>
                setProblem({ ...problem, difficulty: e.target.value })
              }
              className="w-full border p-2 rounded-md"
            >
              <option value="سهل">سهل</option>
              <option value="متوسط">متوسط</option>
              <option value="صعب">صعب</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">الحالة</label>
            <select
              value={problem.status}
              onChange={(e) =>
                setProblem({ ...problem, status: e.target.value })
              }
              className="w-full border p-2 rounded-md"
            >
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="تمت الموافقة">تمت الموافقة</option>
              <option value="مرفوضة">مرفوضة</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">الذاكرة (MB)</label>
            <input
              type="number"
              value={problem.memory}
              onChange={(e) =>
                setProblem({ ...problem, memory: parseInt(e.target.value) })
              }
              className="w-full border p-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">الوقت (ms)</label>
            <input
              type="number"
              value={problem.time}
              onChange={(e) =>
                setProblem({ ...problem, time: parseInt(e.target.value) })
              }
              className="w-full border p-2 rounded-md"
            />
          </div>
        </div>

        {/* 🟢 رفع الصورة */}
        <div>
          <label className="block font-semibold mb-1">الصورة</label>
          {problem.imageUrl && !imageFile && !problem.isDeleted && (
            <div className="mb-2">
              <img
                src={problem.imageUrl}
                alt="Problem"
                className="w-48 h-48 object-contain border rounded mb-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => setProblem({ ...problem, isDeleted: true })}
                >
                  حذف الصورة
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() =>
                    document.getElementById("imageInput").click()
                  }
                >
                  استبدال الصورة
                </button>
              </div>
            </div>
          )}

          <input
            id="imageInput"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setImageFile(e.target.files[0]);
                setProblem({ ...problem, isDeleted: false });
              }
            }}
            className="w-full border p-2 rounded-md"
          />

          {problem.isDeleted && !imageFile && (
            <p className="text-sm text-red-500 mt-1">تم حذف الصورة الحالية</p>
          )}
        </div>

        {/* 🟢 الوسوم */}
        <div>
          <label className="block font-semibold mb-1">الوسوم</label>
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => (
              <label
                key={t.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer ${
                  selectedTags.includes(t.id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  value={t.id}
                  checked={selectedTags.includes(t.id)}
                  onChange={() => handleTagChange(t.id)}
                  className="hidden"
                />
                {t.tagName}
              </label>
            ))}
          </div>
        </div>

        {/* 🟢 Test Cases */}
        <div>
          <label className="block font-semibold mb-2">Test Cases</label>
          {(problem.testCaseRequest || []).map((tc, index) => (
            <div key={index} className="border p-3 rounded mb-2 space-y-2">
              <div>
                <label className="block text-sm">Input</label>
                <textarea
                  rows={2}
                  value={tc.input}
                  onChange={(e) =>
                    handleTestCaseChange(index, "input", e.target.value)
                  }
                  className="w-full border p-1 rounded"
                />
              </div>
              <div>
                <label className="block text-sm">Expected Output</label>
                <textarea
                  rows={2}
                  value={tc.expectedOutput}
                  onChange={(e) =>
                    handleTestCaseChange(
                      index,
                      "expectedOutput",
                      e.target.value
                    )
                  }
                  className="w-full border p-1 rounded"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  onClick={() => removeTestCase(index)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addTestCase}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            إضافة Test Case
          </button>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          💾 حفظ وموافقة
        </button>
      </form>
    </div>
  );
}
