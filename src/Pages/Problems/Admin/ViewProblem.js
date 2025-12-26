import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../Service/api";
import { getProblemById } from "../../../Service/ProblemService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// دالة لتحويل HTML إلى نص عادي
const htmlToText = (html) => {
  if (!html) return "-";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.innerText;
};

const sanitizeFileName = (name) => {
  if (!name) return "export";
  return name.replace(/[\/\\?%*:|"<>]/g, "_");
};

export default function ViewProblem() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  console.log("🔍 ViewProblem component mounted with id:", id);

  // Export UI state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0); // 0..100
  const [exportMessage, setExportMessage] = useState("");

  const fetchProblem = async () => {
    if (!id) {
      console.error("❌ Problem ID is missing");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const problemId = Number(id);
      console.log("📤 Fetching problem with ID:", problemId);
      
      if (isNaN(problemId) || problemId <= 0) {
        throw new Error("معرف المسألة غير صحيح");
      }
      
      const data = await getProblemById(problemId);
      console.log("✅ Problem data received:", data);
      console.log("✅ Data type:", typeof data);
      console.log("✅ Data keys:", data ? Object.keys(data) : "null");
      
      if (!data) {
        throw new Error("لم يتم العثور على بيانات المسألة - البيانات فارغة");
      }
      
      // التحقق من أن البيانات تحتوي على id
      if (!data.id && !data.problemId) {
        console.warn("⚠️ Warning: Data doesn't have id or problemId:", data);
        // محاولة استخدام problemId إذا كان موجوداً
        if (data.problemId) {
          data.id = data.problemId;
        } else {
          // إذا لم يكن هناك id، استخدم id من URL
          data.id = problemId;
        }
      }
      
      setProblem(data);
      setError(null);
      console.log("✅ Problem state set:", data);
    } catch (error) {
      console.error("❌ حدث خطأ أثناء جلب بيانات المسألة:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        problemId: id,
      });
      const errorMessage = error.message || "خطأ غير معروف";
      setError(errorMessage);
      setProblem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [id]);

  // ===============================
  // EXPORT TO EXCEL (organized layout, RTL, footer)
  // ===============================
  const handleExportExcel = async () => {
    if (!problem) return;

    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز بيانات Excel...");

      // Build a neat two-column layout: label | value
      const rows = [];

      rows.push(["عرب كودرز"]); // title (will merge)
      rows.push([]);
      rows.push(["عنوان المسألة", htmlToText(problem.title) || "-"]);
      rows.push(["الكاتب", htmlToText(problem.nameUser) || "-"]);
      rows.push(["وصف المسألة", htmlToText(problem.descriptionProblem) || "-"]);
      rows.push(["وصف الإدخال", htmlToText(problem.descriptionInput) || "-"]);
      rows.push(["وصف الإخراج", htmlToText(problem.descriptionOutput) || "-"]);
      rows.push(["ملاحظات الكاتب", htmlToText(problem.authorNotes) || "-"]);
      rows.push(["الصعوبة", problem.difficulty || "-"]);
      rows.push(["الذاكرة (MB)", problem.memory ?? "-"]);
      rows.push(["الوقت (ms)", problem.time ?? "-"]);
      rows.push(["الوسوم", problem.tags?.map((t) => t.tagName).join(", ") || "-"]);
      rows.push([]);
      rows.push(["حالات الاختبار", ""]);
      if (problem.testCase && problem.testCase.length > 0) {
        problem.testCase.forEach((t, idx) => {
          rows.push([`#${idx + 1} Input`, htmlToText(t.input) || "-"]);
          rows.push([`#${idx + 1} Expected Output`, htmlToText(t.expectedOutput) || "-"]);
          rows.push([`#${idx + 1} عينة`, t.isSample ? "نعم" : "لا"]);
          rows.push([]);
        });
      } else {
        rows.push(["-", "-"]);
      }
      rows.push([]);
      rows.push(["جميع الحقوق محفوظة - عرب كودرز2025"]);

      // Convert to sheet
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Merge title across two columns (A1:B1)
      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });

      // Merge footer across two columns (last row)
      const footerRowIndex = rows.length - 1;
      worksheet["!merges"].push({ s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 1 } });

      // Set column widths (first column narrow labels, second column wider)
      worksheet["!cols"] = [{ wch: 25 }, { wch: 80 }];

      // Set sheet view to RTL
      worksheet["!sheetViews"] = [{ RTL: true }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Problem");

      setExportProgress(50);
      setExportMessage("جاري إنشاء ملف Excel...");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `${sanitizeFileName(htmlToText(problem.title))}.xlsx`);

      setExportProgress(100);
      setExportMessage("تم التحميل");
    } catch (err) {
      console.error(err);
      alert("فشل التصدير إلى Excel");
    } finally {
      // delay a bit so user sees completed state
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage("");
      }, 700);
    }
  };

  // ===============================
  // EXPORT TO WORD (structured + footer)
  // ===============================
  const handleExportWord = async () => {
    if (!problem) return;

    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز ملف Word...");

      const arabicFont = "Arial";

      const children = [];

      // Header
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "عرب كودرز", bold: true, font: arabicFont, size: 40 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: htmlToText(problem.title), bold: true, font: arabicFont, size: 34 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      // Meta
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `بواسطة: ${htmlToText(problem.nameUser)}`, font: arabicFont, size: 22 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 150 },
        })
      );

      // Sections helper
      const addSection = (label, content) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, font: arabicFont, size: 24 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
          })
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text: htmlToText(content) || "-", font: arabicFont, size: 22 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 150 },
          })
        );
      };

      addSection("وصف المسألة:", problem.descriptionProblem);
      addSection("وصف الإدخال:", problem.descriptionInput);
      addSection("وصف الإخراج:", problem.descriptionOutput);
      addSection("ملاحظات الكاتب:", problem.authorNotes);

      children.push(
        new Paragraph({
          children: [new TextRun({ text: `الصعوبة: ${problem.difficulty || "-"}`, font: arabicFont, size: 22 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `الذاكرة (MB): ${problem.memory ?? "-"}`, font: arabicFont, size: 22 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `الوقت (ms): ${problem.time ?? "-"}`, font: arabicFont, size: 22 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `الوسوم: ${problem.tags?.map((t) => t.tagName).join(", ") || "-"}`, font: arabicFont, size: 22 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 150 },
        })
      );

      // Test cases
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "حالات الاختبار:", bold: true, font: arabicFont, size: 24 })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 80 },
        })
      );

      if (problem.testCase && problem.testCase.length > 0) {
        problem.testCase.forEach((t, idx) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `#${idx + 1}`, bold: true, font: arabicFont, size: 24 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 60 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Input: ${htmlToText(t.input)}`, font: arabicFont, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Expected Output: ${htmlToText(t.expectedOutput)}`, font: arabicFont, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `عينة: ${t.isSample ? "نعم" : "لا"}`, font: arabicFont, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 80 },
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "-", font: arabicFont, size: 22 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
          })
        );
      }

      // Footer / copyright
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "جميع الحقوق محفوظة - عرب كودرز2025", italics: true, font: arabicFont, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300 },
        })
      );

      setExportProgress(50);
      setExportMessage("جاري إنشاء ملف Word...");

      const doc = new Document({
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${sanitizeFileName(htmlToText(problem.title))}.docx`);

      setExportProgress(100);
      setExportMessage("تم التحميل");
    } catch (err) {
      console.error(err);
      alert("فشل التصدير إلى Word");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage("");
      }, 700);
    }
  };

  // Helper: try to fetch image and return data URL; if fails return original url
  const fetchImageAsDataUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      // fallback to original url (may produce tainted canvas if CORS disallowed)
      return url;
    }
  };

  // ===============================
  // EXPORT TO PDF (create clean off-screen HTML, render to canvas, add footer)
  // - If the problem has an imageUrl, include it in the PDF output (converted to dataURL when possible)
  // ===============================
  const handleExportPDF = async () => {
    if (!problem) return;

    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز معاينة PDF...");

      // Build an off-screen container with clean styles tailored for PDF
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px"; // roughly A4 at 96dpi: 210mm ~ 793px
      container.style.padding = "24px";
      container.style.background = "#ffffff";
      container.style.color = "#222";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.direction = "rtl";
      container.style.textAlign = "right";
      container.style.lineHeight = "1.4";
      container.style.boxSizing = "border-box";

      // Prepare image HTML if imageUrl exists
      let imageHtml = "";
      if (problem.imageUrl) {
        setExportMessage("جاري تجهيز الصورة (إن وجدت)...");
        // try to convert to data URL to avoid tainted canvas; if fails, fallback to original URL
        const imgData = await fetchImageAsDataUrl(problem.imageUrl);
        if (imgData) {
          // center the image in the PDF
          imageHtml = `<div style="text-align:center;margin-bottom:12px;">
            <img src="${imgData}" crossOrigin="anonymous" style="max-width:100%;max-height:320px;object-fit:contain;border-radius:8px;" />
          </div>`;
        }
        setExportProgress(20);
      }

      // Header and content HTML
      const tags = problem.tags?.map((t) => `<span style="display:inline-block;margin-left:6px;background:#e6f2ff;color:#035; padding:4px 8px;border-radius:12px;font-size:12px;">${t.tagName}</span>`).join("") || "-";

      const testCasesHtml = (problem.testCase && problem.testCase.length > 0)
        ? problem.testCase.map((t, idx) => `
            <div style="margin-bottom:12px;padding:12px;border:1px solid #eee;border-radius:6px;background:#fafafa;">
              <div style="font-weight:700;margin-bottom:6px;">#${idx + 1}</div>
              <div style="margin-bottom:6px;"><strong>Input:</strong><div style="margin-top:4px;white-space:pre-wrap;">${htmlToText(t.input)}</div></div>
              <div style="margin-bottom:6px;"><strong>Expected Output:</strong><div style="margin-top:4px;white-space:pre-wrap;">${htmlToText(t.expectedOutput)}</div></div>
              <div><strong>عينة:</strong> ${t.isSample ? "نعم" : "لا"}</div>
            </div>
          `).join("")
        : "<div>-</div>";

      container.innerHTML = `
        <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:18px;">
          <h1 style="margin:0;text-align:center;font-size:26px;">عرب كودرز</h1>
          <h2 style="margin:6px 0 0 0;text-align:center;font-size:20px;">${htmlToText(problem.title)}</h2>
          <div style="margin-top:8px;text-align:right;color:#555;">بواسطة: ${htmlToText(problem.nameUser)}</div>
        </div>

        ${imageHtml}

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">وصف المسألة</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(problem.descriptionProblem)}</div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <h3 style="margin:0 0 6px 0;">وصف الإدخال</h3>
            <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(problem.descriptionInput)}</div>
          </div>
          <div style="flex:1;min-width:240px;">
            <h3 style="margin:0 0 6px 0;">وصف الإخراج</h3>
            <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(problem.descriptionOutput)}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">ملاحظات الكاتب</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(problem.authorNotes)}</div>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
          <div style="min-width:120px;">
            <h4 style="margin:0 0 6px 0;">الصعوبة</h4>
            <div style="padding:10px;border-radius:8px;background:#fff;border:1px solid #eef2f7;">${problem.difficulty || "-"}</div>
          </div>
          <div style="min-width:120px;">
            <h4 style="margin:0 0 6px 0;">الذاكرة (MB)</h4>
            <div style="padding:10px;border-radius:8px;background:#fff;border:1px solid #eef2f7;">${problem.memory ?? "-"}</div>
          </div>
          <div style="min-width:120px;">
            <h4 style="margin:0 0 6px 0;">الوقت (ms)</h4>
            <div style="padding:10px;border-radius:8px;background:#fff;border:1px solid #eef2f7;">${problem.time ?? "-"}</div>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <h3 style="margin:0 0 6px 0;">الوسوم</h3>
          <div>${tags}</div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 6px 0;">حالات الاختبار</h3>
          <div>${testCasesHtml}</div>
        </div>

        <div style="border-top:1px dashed #e5e7eb;padding-top:12px;text-align:center;color:#666;">
          <div style="font-style:italic;">جميع الحقوق محفوظة - عرب كودرز2025</div>
        </div>
      `;

      // Append hidden container, render to canvas, then remove
      document.body.appendChild(container);

      setExportProgress(30);
      setExportMessage("جاري إنشاء صورة المعاينة...");

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      document.body.removeChild(container);

      setExportProgress(60);
      setExportMessage("جاري تحضير صفحات PDF...");

      // Create PDF and split into pages if needed
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (pdfHeight <= pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      } else {
        // split into pages
        const pageHeightPx = (canvas.height * (pdf.internal.pageSize.getHeight() / pdfHeight));
        let position = 0;
        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");

        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.floor((pageHeightPx / canvas.height) * canvas.height) || canvas.height;

        let pageIndex = 0;
        while (position < canvas.height) {
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(canvas, 0, position, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
          const pageData = pageCanvas.toDataURL("image/png");
          if (pageIndex === 0) {
            pdf.addImage(pageData, "PNG", 0, 0, pdfWidth, pdf.internal.pageSize.getHeight());
          } else {
            pdf.addPage();
            pdf.addImage(pageData, "PNG", 0, 0, pdfWidth, pdf.internal.pageSize.getHeight());
          }
          position += pageCanvas.height;
          pageIndex += 1;
          // update progress
          setExportProgress(Math.min(99, Math.round((pageIndex / Math.max(1, Math.ceil(canvas.height / pageCanvas.height))) * 100)));
          // tiny pause to update UI
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      setExportProgress(100);
      setExportMessage("جارٍ تنزيل ملف PDF...");

      pdf.save(`${sanitizeFileName(htmlToText(problem.title))}.pdf`);
    } catch (err) {
      console.error(err);
      alert("فشل التصدير إلى PDF: " + (err.message || err));
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage("");
      }, 800);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-2xl text-red-500 mb-4">❌ خطأ</p>
          <p className="text-lg text-gray-700 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">معرف المسألة: {id}</p>
          <button
            onClick={() => {
              setError(null);
              fetchProblem();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
  
  if (!problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-xl text-red-500 mb-4">❌ المسألة غير موجودة</p>
          <p className="text-gray-600 mb-4">معرف المسألة: {id}</p>
          <button
            onClick={() => {
              setProblem(null);
              fetchProblem();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // التحقق من أن البيانات موجودة قبل العرض
  if (!problem || !problem.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">❌ بيانات المسألة غير صحيحة</p>
          <p className="text-gray-600">البيانات المستلمة: {JSON.stringify(problem)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-md rounded-xl space-y-6" dir="rtl">
      {/* زر التنزيل مع القائمة */}
      <div className="flex justify-end gap-2 relative">
        <div className="relative inline-block text-left">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            id="downloadMenuButton"
            onClick={() => setShowMenu((prev) => !prev)}
            disabled={isExporting}
          >
            ⬇️ تنزيل
          </button>

          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  handleExportWord();
                  setShowMenu(false);
                }}
                className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                📄 Word
              </button>
              <button
                onClick={() => {
                  handleExportExcel();
                  setShowMenu(false);
                }}
                className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                📊 Excel
              </button>
              <button
                onClick={() => {
                  handleExportPDF();
                  setShowMenu(false);
                }}
                className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                🧾 PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* عرض البيانات */}
      <h1 dangerouslySetInnerHTML={{ __html: problem.title }} className="text-3xl font-bold text-gray-800" />
      <p dangerouslySetInnerHTML={{ __html: `بواسطة: ${problem.nameUser}` }} className="text-gray-600" />

      {problem.imageUrl && (
        <img
          src={problem.imageUrl}
          alt="Problem"
          className="w-full max-h-80 object-contain rounded-md my-4"
        />
      )}

      <div>
        <h2 className="font-semibold mb-1">وصف المسألة</h2>
        <p
          dangerouslySetInnerHTML={{ __html: problem.descriptionProblem || "-" }}
          className="border p-3 rounded-md bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-1">وصف الإدخال</h2>
          <p
            dangerouslySetInnerHTML={{ __html: problem.descriptionInput || "-" }}
            className="border p-3 rounded-md bg-gray-50"
          />
        </div>
        <div>
          <h2 className="font-semibold mb-1">وصف الإخراج</h2>
          <p
            dangerouslySetInnerHTML={{ __html: problem.descriptionOutput || "-" }}
            className="border p-3 rounded-md bg-gray-50"
          />
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-1">ملاحظات الكاتب</h2>
        <p
          dangerouslySetInnerHTML={{ __html: problem.authorNotes || "-" }}
          className="border p-3 rounded-md bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h2 className="font-semibold mb-1">الصعوبة</h2>
          <p className="border p-3 rounded-md bg-gray-50">{problem.difficulty}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-1">الذاكرة (MB)</h2>
          <p className="border p-3 rounded-md bg-gray-50">{problem.memory}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-1">الوقت (ms)</h2>
          <p className="border p-3 rounded-md bg-gray-50">{problem.time}</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-1">الوسوم</h2>
        <div className="flex flex-wrap gap-2">
          {problem.tags && problem.tags.length > 0
            ? problem.tags.map((t) => (
                <span
                  key={t.id}
                  className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                >
                  {t.tagName}
                </span>
              ))
            : "-"}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">حالات الاختبار</h2>
        {problem.testCase && problem.testCase.length > 0 ? (
          problem.testCase.map((t) => (
            <div key={t.id} className="border rounded-md p-3 mb-3 space-y-2 bg-gray-50">
              <div>
                <h3 className="font-semibold text-sm mb-1">Input</h3>
                <p dangerouslySetInnerHTML={{ __html: t.input }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Expected Output</h3>
                <p dangerouslySetInnerHTML={{ __html: t.expectedOutput }} />
              </div>
              <div>
                <span className="text-sm font-medium">
                  {t.isSample ? "عينة" : "غير عينة"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>-</p>
        )}
      </div>

      {/* Overlay shown while exporting (blurred background + spinner + progress) */}
      {isExporting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md text-center">
            <div className="flex flex-col items-center gap-4">
              <svg
                className="animate-spin"
                style={{ width: 56, height: 56, color: "#7C3AED" }}
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeOpacity="0.2"
                  fill="none"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  style={{ transformOrigin: "center" }}
                />
              </svg>

              <div className="text-lg font-semibold text-gray-800">جاري التحضير للتحميل</div>
              <div className="text-sm text-gray-500">{exportMessage}</div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-3">
                <div
                  style={{
                    width: `${exportProgress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#7C3AED,#06B6D4)",
                    transition: "width 250ms ease",
                  }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-2">{exportProgress}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}