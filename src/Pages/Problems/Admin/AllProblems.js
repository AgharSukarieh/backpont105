import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import {
  Trash2,
  Edit,
  Eye,
  X,
  DownloadCloud,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";

/**
 * تحسينات التصميم:
 * - رأس متدرّج أنيق
 * - أزرار تصدير موحدة مع أيقونات
 * - جدول بستايل فاخر (ترويسة متدرّجة، zebra rows، hover effect)
 * - badges للوسوم
 * - overlay أفضل أثناء التصدير مع مؤشر دائري ونص مرحلي
 * - printable area محسّنة لطباعة/تصدير PDF متعدد الصفحات
 *
 * يتطلب Tailwind CSS موجود في المشروع (الكلاسات المستخدمة تعتمد عليه).
 */

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const printableRef = useRef(null);

  // exporting UI state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("");

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/problems/all");
      setProblems(res.data);
    } catch (error) {
      console.error("حدث خطأ أثناء جلب المسائل:", error);
      alert("خطأ أثناء تحميل المسائل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      const idToDelete = parseInt(deleteId);
      await api.delete(`/api/problems/${idToDelete}`);
      setShowModal(false);
      setDeleteId(null);
      fetchProblems();
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);
      alert("❌ حدث خطأ أثناء حذف المسألة");
    }
  };

  const handleEdit = (id) => {
    navigate(`/react-app/Admin/Edit-problem/${id}`);
  };

  const handleView = (id) => {
    navigate(`/react-app/Admin/View-problem/${id}`);
  };

  const handleEvaluations = (id) => {
    navigate(`/react-app/Admin/ProblemEvaluation/${id}`);
  };

  // ============================
  // HELPERS
  // ============================
  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString("ar-EG");
  };

  const truncate = (text, max = 60) => {
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };

  const TagBadge = ({ children }) => (
    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md mr-1 mb-1">
      {children}
    </span>
  );

  // ============================
  // EXPORT EXCEL
  // ============================
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز بيانات Excel...");

      const dataToExport = problems.map((p, index) => ({
        "#": index + 1,
        "العنوان": p.title,
        "الكاتب": p.userName,
        "الصعوبة": p.difficulty,
        "عدد من حلها": p.numberOfUsersSolved,
        "نسبة القبول %": p.acceptanceRate,
        "الوسوم": (p.tags || []).map((t) => t.tagName).join(", ") || "-",
        "تاريخ الإضافة": formatDate(p.dateTime),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport, { origin: "A3" });

      // Header title merged A1..I1
      const headerTitle = "قائمة المسائل - عرب كودرز";
      XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle]], { origin: "A1" });
      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });

      // Footer
      const footerRowIndex = dataToExport.length + 4;
      const footerText = "جميع الحقوق محفوظة - عرب كودرز 2025";
      XLSX.utils.sheet_add_aoa(worksheet, [[footerText]], { origin: `A${footerRowIndex}` });
      worksheet["!merges"].push({
        s: { r: footerRowIndex - 1, c: 0 },
        e: { r: footerRowIndex - 1, c: 8 },
      });

      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 40 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 30 },
        { wch: 18 },
        { wch: 5 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Problems");

      setExportProgress(60);
      setExportMessage("جاري إنشاء ملف Excel...");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, `Problems_Ar_Coders_${new Date().getFullYear()}.xlsx`);

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

  // ============================
  // EXPORT PDF (multi-page slicing)
  // ============================
  const handleExportPDF = async () => {
    if (!printableRef.current) {
      alert("المحتوى غير جاهز للطباعة");
      return;
    }
    setIsExporting(true);
    setExportProgress(0);
    setExportMessage("جاري تجهيز معاينة PDF...");

    try {
      const element = printableRef.current;
      const scale = 2;
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      setExportProgress(10);
      setExportMessage("جاري تحضير صفحات PDF...");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const pdfWidth = pageWidth - margin * 2;
      const pdfHeight = pageHeight - margin * 2;

      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = Math.floor(pdfHeight * pxPerMm);

      const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        const chunkHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkHeight;

        const ctx = pageCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          chunkHeight,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        const imgData = pageCanvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

        pageIndex += 1;
        renderedHeight += chunkHeight;
        const percent = Math.min(99, Math.round((pageIndex / totalPages) * 100));
        setExportProgress(percent);
        setExportMessage(`جاري تجهيز صفحة ${pageIndex} من ${totalPages}...`);

        // give UI time to update
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }

      setExportProgress(100);
      setExportMessage("جارٍ تنزيل ملف PDF...");

      pdf.save(`Problems_Ar_Coders_${new Date().getFullYear()}.pdf`);
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

  // ============================
  // EXPORT WORD (.docx)
  // ============================
  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMessage("جاري تجهيز ملف Word...");

      const rows = [];

      const headerCells = [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "#", bold: true })],
            }),
          ],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "العنوان", bold: true })],
            }),
          ],
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "الكاتب", bold: true })],
            }),
          ],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "الصعوبة", bold: true })],
            }),
          ],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "الوسوم", bold: true })],
            }),
          ],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
      ];
      rows.push(new TableRow({ children: headerCells }));

      problems.forEach((p, i) => {
        const cells = [
          new TableCell({ children: [new Paragraph(String(i + 1))] }),
          new TableCell({ children: [new Paragraph(p.title || "")] }),
          new TableCell({ children: [new Paragraph(p.userName || "")] }),
          new TableCell({ children: [new Paragraph(p.difficulty || "")] }),
          new TableCell({
            children: [new Paragraph((p.tags || []).map((t) => t.tagName).join(", ") || "-")],
          }),
        ];
        rows.push(new TableRow({ children: cells }));
      });

      setExportProgress(60);
      setExportMessage("جاري إنشاء ملف Word...");

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "قائمة المسائل - عرب كودرز",
                    bold: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
              new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                children: [new TextRun({ text: "جميع الحقوق محفوظة - عرب كودرز 2025", italics: true })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `Problems_Ar_Coders_${new Date().getFullYear()}.docx`);

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

  if (loading) return <p className="text-center mt-10">جاري تحميل المسائل...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-2xl rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="opacity-95">
              <path d="M3 7v13h18V7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3h8v4H8z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">قائمة المسائل</h1>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-lg shadow hover:scale-[1.01] transition"
            title="تحميل PDF"
          >
            <DownloadCloud size={16} /> PDF
          </button>

          <button
            onClick={handleExportWord}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-lg shadow-sm hover:shadow-md transition"
            title="تحميل Word"
          >
            <FileText size={16} /> Word
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:scale-[1.01] transition"
            title="تحميل Excel"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="min-w-full table-auto divide-y divide-gray-100">
          <thead className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
            <tr>
              <th className="p-3 text-sm font-medium text-center">#</th>
              <th className="p-3 text-sm font-medium text-right">العنوان</th>
              <th className="p-3 text-sm font-medium text-right">الكاتب</th>
              <th className="p-3 text-sm font-medium text-center">الصعوبة</th>
              <th className="p-3 text-sm font-medium text-center">من حلها</th>
              <th className="p-3 text-sm font-medium text-center">نسبة القبول %</th>
              <th className="p-3 text-sm font-medium text-right">الوسوم</th>
              <th className="p-3 text-sm font-medium text-center">تاريخ الإضافة</th>
              <th className="p-3 text-sm font-medium text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {problems.map((p, index) => (
              <tr
                key={p.id}
                className="hover:bg-purple-50 transition-colors even:bg-white odd:bg-gray-50"
              >
                <td className="p-3 text-center text-sm font-medium">{index + 1}</td>
                <td className="p-3 text-right text-sm w-72">
                  <div className="font-semibold text-gray-800">{truncate(p.title, 80)}</div>
                  <div className="text-xs text-gray-400">{truncate(p.description || "", 120)}</div>
                </td>
                <td className="p-3 text-sm text-right">{p.userName}</td>
                <td className="p-3 text-sm text-center">
                  <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                    {p.difficulty}
                  </span>
                </td>
                <td className="p-3 text-sm text-center">{p.numberOfUsersSolved}</td>
                <td className="p-3 text-sm text-center">{p.acceptanceRate}</td>
                <td className="p-3 text-sm text-right">
                  {(p.tags || []).length ? (
                    (p.tags || []).slice(0, 3).map((t) => <TagBadge key={t.tagName}>{t.tagName}</TagBadge>)
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-sm text-center">{formatDate(p.dateTime)}</td>
                <td className="p-3 text-sm text-center flex gap-2 justify-center">
                  <button
                    onClick={() => handleView(p.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                    title="عرض"
                  >
                    <Eye size={14} /> عرض
                  </button>

                  <button
                    onClick={() => handleEvaluations(p.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700"
                    title="تقييمات المسألة"
                  >
                    تقييمات
                  </button>

                  <button
                    onClick={() => handleEdit(p.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600"
                    title="تعديل"
                  >
                    <Edit size={14} /> تعديل
                  </button>

                  <button
                    onClick={() => confirmDelete(p.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                    title="حذف"
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal الحذف */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 relative shadow-2xl">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800">تأكيد الحذف</h2>
            <p className="mb-6 text-gray-600">هل أنت متأكد من حذف هذه المسألة؟</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable area (improved A4 width, RTL) */}
      <div style={{ position: "fixed", left: -9999, top: -9999, width: 1122 }}>
        <div
          ref={printableRef}
          dir="rtl"
          style={{
            fontFamily: "'Cairo', Tahoma, Arial, sans-serif",
            background: "#fff",
            padding: 28,
            color: "#111827",
            width: 1122,
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <h1 style={{ margin: 0, color: "#4C1D95", fontSize: 24 }}>قائمة المسائل</h1>
            <div style={{ color: "#6B7280", marginTop: 6 }}>عرب كودرز</div>
            <hr style={{ border: "none", borderTop: "2px solid #eee", marginTop: 12 }} />
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={pdfThStyle()}>#</th>
                <th style={pdfThStyle()}>العنوان</th>
                <th style={pdfThStyle()}>الكاتب</th>
                <th style={pdfThStyle()}>الصعوبة</th>
                <th style={pdfThStyle()}>عدد من حلها</th>
                <th style={pdfThStyle()}>نسبة القبول %</th>
                <th style={pdfThStyle()}>الوسوم</th>
                <th style={pdfThStyle()}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr key={p.id}>
                  <td style={pdfTdStyle()}>{i + 1}</td>
                  <td style={pdfTdStyle()}>{p.title}</td>
                  <td style={pdfTdStyle()}>{p.userName}</td>
                  <td style={pdfTdStyle()}>{p.difficulty}</td>
                  <td style={pdfTdStyle()}>{p.numberOfUsersSolved}</td>
                  <td style={pdfTdStyle()}>{p.acceptanceRate}</td>
                  <td style={pdfTdStyle()}>{(p.tags || []).map((t) => t.tagName).join(", ") || "-"}</td>
                  <td style={pdfTdStyle()}>{formatDate(p.dateTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, textAlign: "center", color: "#9CA3AF" }}>
            جميع الحقوق محفوظة - عرب كودرز 2025
          </div>
        </div>
      </div>

      {/* Export overlay */}
      {isExporting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-sm text-center">
            <div className="flex flex-col items-center gap-4">
              {/* Circular progress */}
              <div className="relative">
                <svg width="84" height="84" viewBox="0 0 36 36" className="transform -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E6E7EE" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="url(#g1)"
                    strokeWidth="3"
                    strokeDasharray={`${(exportProgress / 100) * 100} 100`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {exportProgress}%
                </div>
              </div>

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

// helper styles for printable table
function pdfThStyle() {
  return {
    border: "1px solid #E5E7EB",
    padding: "8px 10px",
    background: "#7C3AED",
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  };
}
function pdfTdStyle() {
  return {
    border: "1px solid #E5E7EB",
    padding: "8px 10px",
    textAlign: "center",
    color: "#374151",
  };
}