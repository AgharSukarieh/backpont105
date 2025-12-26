import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const fallbackThumbnail =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='28'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

function VideoModal({ video, onClose, renderMaybeHTML }) {
  if (!video) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden z-10">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-lg font-semibold">{video.title || "فيديو"}</h3>
          <button
            onClick={onClose}
            className="ml-4 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            aria-label="close"
          >
            إغلاق
          </button>
        </div>
        <div className="bg-black">
          <video
            src={video.url}
            controls
            autoPlay
            className="w-full h-[60vh] md:h-[70vh] bg-black object-contain"
          />
        </div>
        {video.description && (
          <div className="p-4 text-gray-700">
            {renderMaybeHTML(video.description)}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Helpers
const containsHTML = (str) => {
  if (!str || typeof str !== "string") return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
};

const renderMaybeHTMLFactory = () => (content) => {
  if (content === null || content === undefined || content === "") return null;
  if (containsHTML(content)) {
    // WARNING: If content may be untrusted, sanitize with DOMPurify before inserting
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <div className="whitespace-pre-wrap break-words leading-relaxed">{content}</div>;
};

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

// Try to fetch image and return data URL. Fallback to original URL if fetch fails.
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

export default function AlgorithmDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const renderMaybeHTML = renderMaybeHTMLFactory();

  const [algorithm, setAlgorithm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);

  // Export UI
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const fetchAlgorithmDetails = async () => {
    if (!id) {
      setError("⚠️ لم يتم تحديد المعرف (ID) في الرابط.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await api.get(`/explained-tags/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res || !res.data) throw new Error("الاستجابة من السيرفر غير صالحة.");
      setAlgorithm(res.data);
    } catch (err) {
      console.error("fetch error:", err);
      if (err.response) {
        if (err.response.status === 404) setError("🚫 العنصر المطلوب غير موجود (404).");
        else setError(`⚠️ خطأ من السيرفر: ${err.response.status}`);
      } else if (err.request) {
        setError("🌐 لا يمكن الاتصال بالسيرفر. تحقق من الاتصال أو إعدادات CORS.");
      } else {
        setError("حدث خطأ غير متوقع أثناء تحميل البيانات.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlgorithmDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return <p className="p-6 text-gray-500 text-center">⏳ جاري تحميل البيانات...</p>;

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={fetchAlgorithmDetails} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            🔄 إعادة المحاولة
          </button>
          <button onClick={() => navigate(-1)} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
            العودة
          </button>
        </div>
      </div>
    );

  if (!algorithm)
    return <p className="p-6 text-gray-600 text-center">⚠️ لا توجد بيانات للعرض.</p>;

  // ====================
  // EXPORT: Excel
  // ====================
  const handleExportExcel = async () => {
    if (!algorithm) return;
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز بيانات Excel...");

      const rows = [];
      rows.push(["عرب كودرز"]);
      rows.push([]);
      rows.push(["العنوان", htmlToText(algorithm.title)]);
      rows.push(["المؤلف", htmlToText(algorithm.nameUser)]);
      rows.push(["نظرة عامة", htmlToText(algorithm.overview)]);
      rows.push(["التعقيد", htmlToText(algorithm.complexity)]);
      rows.push(["خطوات الحل", htmlToText(algorithm.steps)]);
      rows.push(["بداية الشرح", htmlToText(algorithm.start)]);
      rows.push(["نهاية الشرح", htmlToText(algorithm.end)]);
      rows.push([]);
      rows.push(["الوسوم", (algorithm.tags || []).map((t) => t.tagName).join(", ") || "-"]);
      rows.push([]);
      rows.push(["روابط اليوتيوب", ""]);
      if (algorithm.youTubeLinks && algorithm.youTubeLinks.length > 0) {
        algorithm.youTubeLinks.forEach((v, idx) => {
          rows.push([`#${idx + 1} عنوان (YouTube)`, v.title || v.url]);
          rows.push([`#${idx + 1} رابط (YouTube)`, v.url || "-"]);
          rows.push([]);
        });
      } else {
        rows.push(["-", "-"]);
      }

      // Videos section: include thumbnail URL as requested
      rows.push([]);
      rows.push(["📺 الفيديوهات", ""]);
      if (algorithm.videos && algorithm.videos.length > 0) {
        algorithm.videos.forEach((v, idx) => {
          rows.push([`#${idx + 1} عنوان (Video)`, v.title || v.url]);
          rows.push([`#${idx + 1} رابط (Video)`, v.url || "-"]);
          rows.push([`#${idx + 1} رابط الصورة المصغرة`, v.thumbnailUrl || "-"]);
          rows.push([]);
        });
      } else {
        rows.push(["-", "-"]);
      }

      rows.push([]);
      rows.push(["جميع الحقوق محفوظة - عرب كودرز 2025"]);

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
      const footerRowIndex = rows.length - 1;
      worksheet["!merges"].push({ s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 1 } });
      worksheet["!cols"] = [{ wch: 30 }, { wch: 80 }];
      worksheet["!sheetViews"] = [{ RTL: true }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Algorithm");

      setExportProgress(50);
      setExportMessage("جاري إنشاء ملف Excel...");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `${sanitizeFileName(htmlToText(algorithm.title))}.xlsx`);

      setExportProgress(100);
      setExportMessage("تم التحميل");
    } catch (err) {
      console.error(err);
      alert("فشل التصدير إلى Excel");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage("");
      }, 700);
    }
  };

  // ====================
  // EXPORT: Word (.docx)
  // ====================
  const handleExportWord = async () => {
    if (!algorithm) return;
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز ملف Word...");

      const arabicFont = "Arial";
      const children = [];

      children.push(
        new Paragraph({
          children: [new TextRun({ text: "عرب كودرز", bold: true, font: arabicFont, size: 40 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      children.push(
        new Paragraph({
          children: [new TextRun({ text: htmlToText(algorithm.title), bold: true, font: arabicFont, size: 34 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

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

      addSection("نظرة عامة:", algorithm.overview);
      addSection("التعقيد:", algorithm.complexity);
      addSection("خطوات الحل:", algorithm.steps);
      addSection("بداية الشرح:", algorithm.start);
      addSection("نهاية الشرح:", algorithm.end);

      if (algorithm.youTubeLinks && algorithm.youTubeLinks.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "روابط الفيديو (YouTube):", bold: true, font: arabicFont, size: 24 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
          })
        );
        algorithm.youTubeLinks.forEach((v, idx) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${idx + 1}. ${v.title || v.url}`, font: arabicFont, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 40 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${v.url || "-"}`, font: arabicFont, size: 20 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 20 },
            })
          );
        });
      }

      // Videos section in Word: include thumbnail URL as plain text under each video link
      if (algorithm.videos && algorithm.videos.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "الفيديوهات (روابط):", bold: true, font: arabicFont, size: 24 })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 80 },
          })
        );
        algorithm.videos.forEach((v, idx) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${idx + 1}. ${v.title || v.url}`, font: arabicFont, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 20 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `الرابط: ${v.url || "-"}`, font: arabicFont, size: 20 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 10 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `رابط الصورة المصغرة: ${v.thumbnailUrl || "-"}`, font: arabicFont, size: 20 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 20 },
            })
          );
        });
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: "جميع الحقوق محفوظة - عرب كودرز 2025", italics: true, font: arabicFont, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300 },
        })
      );

      setExportProgress(60);
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
      saveAs(blob, `${sanitizeFileName(htmlToText(algorithm.title))}.docx`);

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

  // ====================
  // EXPORT: PDF (includes image if exists, and plain links for videos + thumbnail links)
  // ====================
  const handleExportPDF = async () => {
    if (!algorithm) return;

    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز معاينة PDF...");

      // Build off-screen container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px"; // approximate A4 width at 96dpi
      container.style.padding = "24px";
      container.style.background = "#ffffff";
      container.style.color = "#222";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.direction = "rtl";
      container.style.textAlign = "right";
      container.style.lineHeight = "1.4";
      container.style.boxSizing = "border-box";

      // prepare image if exists
      let imageHtml = "";
      if (algorithm.imageUrl) {
        setExportMessage("جاري تجهيز الصورة (إن وجدت)...");
        const imgData = await fetchImageAsDataUrl(algorithm.imageUrl);
        if (imgData) {
          imageHtml = `<div style="text-align:center;margin-bottom:12px;">
            <img src="${imgData}" crossOrigin="anonymous" style="max-width:100%;max-height:320px;object-fit:contain;border-radius:8px;" />
          </div>`;
        }
        setExportProgress(20);
      }

      const tagsHtml = (algorithm.tags || []).map((t) => `<span style="display:inline-block;margin-left:6px;background:#e6f2ff;color:#035; padding:4px 8px;border-radius:12px;font-size:12px;">${t.tagName}</span>`).join("") || "-";

      const youTubeHtml = (algorithm.youTubeLinks && algorithm.youTubeLinks.length > 0)
        ? algorithm.youTubeLinks.map((v) => `<div style="margin-bottom:8px;"><a href="${v.url}" style="color:#0b5fff">${v.title || v.url}</a></div>`).join("")
        : "<div>-</div>";

      // Videos list: include thumbnail links as plain URLs
      const videosHtml = (algorithm.videos && algorithm.videos.length > 0)
        ? algorithm.videos.map((v, idx) => {
            const title = v.title || v.url || `Video ${idx + 1}`;
            const linkHtml = `<div style="margin-bottom:6px;"><a href="${v.url}" style="color:#0b5fff">${title}</a></div>`;
            const thumbHtml = v.thumbnailUrl ? `<div style="margin-bottom:6px;color:#0b5fff">Thumbnail: <a href="${v.thumbnailUrl}">${v.thumbnailUrl}</a></div>` : "";
            return `<div style="margin-bottom:10px;">${linkHtml}${thumbHtml}</div>`;
          }).join("")
        : "<div>-</div>";

      container.innerHTML = `
        <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:18px;">
          <h1 style="margin:0;text-align:center;font-size:26px;">عرب كودرز</h1>
          <h2 style="margin:6px 0 0 0;text-align:center;font-size:20px;">${htmlToText(algorithm.title)}</h2>
          <div style="margin-top:8px;text-align:right;color:#555;">بواسطة: ${htmlToText(algorithm.nameUser)}</div>
        </div>

        ${imageHtml}

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">نظرة عامة</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(algorithm.overview)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">التعقيد</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(algorithm.complexity)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">خطوات الحل</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(algorithm.steps)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">بداية الشرح</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(algorithm.start)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">نهاية الشرح</h3>
          <div style="padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;white-space:pre-wrap;">${htmlToText(algorithm.end)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">الوسوم</h3>
          <div>${tagsHtml}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">روابط اليوتيوب</h3>
          <div>${youTubeHtml}</div>
        </div>

        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 6px 0;">الفيديوهات (روابط)</h3>
          <div>${videosHtml}</div>
        </div>

        <div style="border-top:1px dashed #e5e7eb;padding-top:12px;text-align:center;color:#666;">
          <div style="font-style:italic;">جميع الحقوق محفوظة - عرب كودرز2025</div>
        </div>
      `;

      document.body.appendChild(container);
      setExportProgress(30);
      setExportMessage("جاري إنشاء صورة المعاينة...");

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      document.body.removeChild(container);

      setExportProgress(60);
      setExportMessage("جاري تحضير صفحات PDF...");

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
        const totalPages = Math.max(1, Math.ceil(canvas.height / pageCanvas.height));
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
          setExportProgress(Math.min(99, Math.round((pageIndex / totalPages) * 100)));
          // small pause to allow UI to update
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      setExportProgress(100);
      setExportMessage("جارٍ تنزيل ملف PDF...");
      pdf.save(`${sanitizeFileName(htmlToText(algorithm.title))}.pdf`);
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header: title + download menu */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {algorithm.title || "-"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              بواسطة: <span className="font-medium text-gray-700">{algorithm.nameUser || "-"}</span>
            </p>
          </div>

          {/* Download menu */}
          <div className="relative inline-block text-left">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowMenu((s) => !s)}
              disabled={isExporting}
            >
              ⬇️ تنزيل
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => { handleExportWord(); setShowMenu(false); }}
                  className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  📄 Word
                </button>
                <button
                  onClick={() => { handleExportExcel(); setShowMenu(false); }}
                  className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  📊 Excel
                </button>
                <button
                  onClick={() => { handleExportPDF(); setShowMenu(false); }}
                  className="block w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  🧾 PDF
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-6">
          {/* نظرة عامة */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🔹 نظرة عامة</h3>
            <div className="text-gray-700 bg-gray-50 p-4 rounded">
              {renderMaybeHTML(algorithm.overview)}
            </div>
          </div>

          {/* التعقيد */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">⚙️ التعقيد</h3>
            <div className="text-gray-700 bg-gray-50 p-4 rounded">
              {renderMaybeHTML(algorithm.complexity)}
            </div>
          </div>

          {/* الخطوات */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🧩 خطوات الحل</h3>
            <div className="text-gray-700 bg-gray-50 p-4 rounded">
              {renderMaybeHTML(algorithm.steps)}
            </div>
          </div>

          {/* بداية الشرح */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🚀 بداية الشرح</h3>
            <div className="text-gray-700 bg-gray-50 p-4 rounded">
              {renderMaybeHTML(algorithm.start)}
            </div>
          </div>

          {/* نهاية الشرح */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🏁 نهاية الشرح</h3>
            <div className="text-gray-700 bg-gray-50 p-4 rounded">
              {renderMaybeHTML(algorithm.end)}
            </div>
          </div>
        </div>
      </section>

      {/* أمثلة توضيحية — بعد الحقول الأساسية */}
      {algorithm.exampleTags && algorithm.exampleTags.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xl">🧠</div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">أمثلة توضيحية</h2>
          </div>

          <div className="space-y-4">
            {algorithm.exampleTags
              .slice()
              .sort((a, b) => (a.priority || 0) - (b.priority || 0))
              .map((ex) => (
                <article key={ex.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-gray-900">{ex.title}</h3>
                    <span className="text-xs text-gray-500">أولوية: {ex.priority ?? "-"}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="text-gray-700 break-words leading-relaxed">
                      {ex.stepByStep && (
                        <div className="bg-gray-50 p-4 rounded mb-3">
                          {renderMaybeHTML(ex.stepByStep)}
                        </div>
                      )}

                      {ex.explanation && (
                        <div className="mb-3 text-gray-700">
                          {renderMaybeHTML(ex.explanation)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {ex.code && (
                        <>
                          <div className="text-xs text-gray-500">الكود</div>
                          <pre dir="ltr" className="bg-gray-900 text-white p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
{ex.code}
                          </pre>
                        </>
                      )}

                      <div className="flex flex-col gap-2">
                        {ex.input && (
                          <div className="text-sm">
                            <strong>Input:</strong>
                            <div className="mt-1 bg-gray-50 p-2 rounded text-gray-700 whitespace-pre-wrap">{ex.input}</div>
                          </div>
                        )}
                        {ex.output && (
                          <div className="text-sm">
                            <strong>Output:</strong>
                            <div className="mt-1 bg-gray-50 p-2 rounded text-gray-700 whitespace-pre-wrap">{ex.output}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}

      {/* ملاحظات الكاتب */}
      {algorithm.authorNotes && (
        <section className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xl">📝</div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">ملاحظات الكاتب</h2>
          </div>
          <div className="prose max-w-none text-gray-700">{renderMaybeHTML(algorithm.authorNotes)}</div>
        </section>
      )}

      {/* روابط يوتيوب */}
      {algorithm.youTubeLinks && algorithm.youTubeLinks.length > 0 && (
        <section className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xl">🎥</div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">روابط يوتيوب</h2>
          </div>
          <ul className="grid md:grid-cols-2 gap-3">
            {algorithm.youTubeLinks.map((l) => (
              <li key={l.id} className="p-3 rounded hover:bg-gray-50">
                <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                  {l.title || l.url}
                </a>
                {l.description && <div className="text-gray-600 text-sm mt-1">{renderMaybeHTML(l.description)}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* الفيديوهات (مع تشغيل محلي و thumbnails) */}
      {algorithm.videos && algorithm.videos.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xl">📺</div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">الفيديوهات</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {algorithm.videos.map((v, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative cursor-pointer group" onClick={() => setPlayingVideoIndex(idx)}>
                  <img src={v.thumbnailUrl || fallbackThumbnail} alt={v.title || `video-${idx}`} loading="lazy"
                    className="w-full h-44 object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-white/90 rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow">▶</div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{v.title || "-"}</h3>
                  <div className="text-gray-600 text-sm mt-2 line-clamp-3">
                    {v.description ? renderMaybeHTML(v.description) : "-"}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button onClick={() => setPlayingVideoIndex(idx)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">تشغيل</button>
                    <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 underline">فتح الرابط</a>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video modal */}
      {playingVideoIndex !== null && (
        <VideoModal
          video={algorithm.videos[playingVideoIndex]}
          onClose={() => setPlayingVideoIndex(null)}
          renderMaybeHTML={renderMaybeHTML}
        />
      )}

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