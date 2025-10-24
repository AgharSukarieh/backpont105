import React, { useState, useEffect } from "react";

const sampleTags = [
  { id: 1, name: "Dynamic Programming" },
  { id: 2, name: "Binary Search" },
  { id: 3, name: "Graph" },
  { id: 4, name: "Sorting" },
  { id: 5, name: "Greedy" },
];

const AddProblemProposal = () => {
  const [title, setTitle] = useState("");
  const [descriptionProblem, setDescriptionProblem] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [descriptionOutput, setDescriptionOutput] = useState("");
  const [authorNotes, setAuthorNotes] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [memory, setMemory] = useState(128);
  const [time, setTime] = useState(1.0);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [tags, setTags] = useState([]);
  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "", isSample: true },
  ]);

  // رفع صورة - عرض preview فقط
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // عرض preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      // هنا عادةً تتصل بالـ API لرفع الصورة وترجع URL
      // نحن هنا نضع dummy URL
      setImageUrl(`https://dummyapi.com/images/${file.name}`);
    }
  };

  // إضافة test case جديدة
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "", isSample: true }]);
  };

  // حذف test case
  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      const newCases = [...testCases];
      newCases.splice(index, 1);
      setTestCases(newCases);
    } else {
      alert("يجب أن يكون هناك Test Case واحد على الأقل");
    }
  };

  // إرسال البيانات
  const handleSubmit = () => {
    if (!title || !descriptionProblem || !descriptionInput || !descriptionOutput) {
      alert("الرجاء تعبئة كل الحقول الأساسية.");
      return;
    }
    if (testCases.length === 0) {
      alert("يجب إضافة Test Case واحد على الأقل.");
      return;
    }

    const payload = {
      title,
      descriptionProblem,
      descriptionInput,
      descriptionOutput,
      authorNotes,
      difficulty,
      memory,
      time,
      imageUrl,
      status: "Pending",
      createdAt: new Date().toISOString(),
      userId: 1, // مثال
      requestTestCases: testCases.map(tc => ({
        problemId: 0,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample,
      })),
      requestproblemTags: tags.map(t => t.id),
    };

    console.log("Payload to API:", payload);
    alert("تم إرسال الاقتراح بنجاح! (انظر الـ console للبيانات)");
    // هنا تعمل POST request للـ API
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-indigo-600 mb-4">إضافة اقتراح مشكلة</h1>

      {/* العنوان */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">العنوان</label>
        <input
          type="text"
          className="border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* الوصف */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">وصف المشكلة</label>
        <textarea
          className="border rounded p-2"
          value={descriptionProblem}
          onChange={(e) => setDescriptionProblem(e.target.value)}
        />
      </div>

      {/* المدخلات والمخرجات */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">وصف المدخلات</label>
          <textarea
            className="border rounded p-2"
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">وصف المخرجات</label>
          <textarea
            className="border rounded p-2"
            value={descriptionOutput}
            onChange={(e) => setDescriptionOutput(e.target.value)}
          />
        </div>
      </div>

      {/* ملاحظات المؤلف */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">ملاحظات المؤلف</label>
        <textarea
          className="border rounded p-2"
          value={authorNotes}
          onChange={(e) => setAuthorNotes(e.target.value)}
        />
      </div>

      {/* الصعوبة، الذاكرة، الوقت */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">الصعوبة</label>
          <select
            className="border rounded p-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">سهلة</option>
            <option value="Medium">متوسطة</option>
            <option value="Hard">صعبة</option>
          </select>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">Memory (MB)</label>
          <input
            type="number"
            className="border rounded p-2"
            value={memory}
            onChange={(e) => setMemory(Number(e.target.value))}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">Time (s)</label>
          <input
            type="number"
            className="border rounded p-2"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
        </div>
      </div>

      {/* رفع صورة */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">صورة المشكلة</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-contain" />
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">Tags</label>
        <select
          multiple
          className="border rounded p-2"
          value={tags.map(t => t.id)}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(o => sampleTags.find(t => t.id === parseInt(o.value)));
            setTags(selected);
          }}
        >
          {sampleTags.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <p className="text-gray-500 text-sm mt-1">اضغط Ctrl أو Cmd لاختيار أكثر من Tag</p>
      </div>

      {/* Test Cases */}
      <div className="flex flex-col space-y-4">
        <h2 className="font-bold text-lg">Test Cases</h2>
        {testCases.map((tc, index) => (
          <div key={index} className="border rounded p-4 space-y-2 relative">
            <label className="font-semibold">Input</label>
            <textarea
              className="border rounded p-2 w-full"
              value={tc.input}
              onChange={(e) => {
                const newCases = [...testCases];
                newCases[index].input = e.target.value;
                setTestCases(newCases);
              }}
            />
            <label className="font-semibold">Expected Output</label>
            <textarea
              className="border rounded p-2 w-full"
              value={tc.expectedOutput}
              onChange={(e) => {
                const newCases = [...testCases];
                newCases[index].expectedOutput = e.target.value;
                setTestCases(newCases);
              }}
            />
            <div className="flex items-center gap-4 mt-1">
              <label>
                <input
                  type="checkbox"
                  checked={tc.isSample}
                  onChange={(e) => {
                    const newCases = [...testCases];
                    newCases[index].isSample = e.target.checked;
                    setTestCases(newCases);
                  }}
                />{" "}
                Sample Test
              </label>
              {testCases.length > 1 && (
                <button
                  className="ml-auto text-red-600 font-semibold"
                  onClick={() => removeTestCase(index)}
                >
                  حذف
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          className="bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
          onClick={addTestCase}
        >
          إضافة Test Case
        </button>
      </div>

      <button
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition mt-6"
        onClick={handleSubmit}
      >
        إرسال الاقتراح
      </button>
    </div>
  );
};

export default AddProblemProposal;
