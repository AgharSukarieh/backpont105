import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../Service/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AdminPostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/Post/GetById/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const sanitizeFilename = (name = "post") =>
    name.replace(/[/\\?%*:|"<>]/g, "").trim() || "post";

  // Fallback font wait using document.fonts (no external lib)
  const waitForWebFonts = async (fontName = "Tajawal", timeout = 5000) => {
    try {
      if (document.fonts && typeof document.fonts.load === "function") {
        // attempt to load regular and bold weights, but don't block forever
        const loads = [
          document.fonts.load(`400 16px "${fontName}"`),
          document.fonts.load(`700 20px "${fontName}"`),
        ];
        // race each load with a timeout promise so we don't hang forever
        const timeoutPromise = (t) =>
          new Promise((res) => setTimeout(res, t));
        await Promise.race([Promise.all(loads), timeoutPromise(timeout)]);
        if (document.fonts && document.fonts.ready) {
          // extra safety: wait for document.fonts.ready but with timeout
          await Promise.race([document.fonts.ready, timeoutPromise(timeout)]);
        }
      }
    } catch (e) {
      console.warn("Font load fallback warning:", e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!post || !printRef.current) return;
    setPdfGenerating(true);
    try {
      const element = printRef.current;

      // Ensure the chosen webfont is loaded before rendering canvas
      await waitForWebFonts("Tajawal");

      // small delay to allow reflow after font load
      await new Promise((res) => setTimeout(res, 120));

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        scrollY: -window.scrollY,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = 210;
      const pageHeight = 297;

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pdfImgHeight = (imgHeightPx * pageWidth) / imgWidthPx;

      if (pdfImgHeight <= pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pdfImgHeight);
      } else {
        let remainingHeight = pdfImgHeight;
        let position = 0;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, "JPEG", 0, position, pageWidth, pdfImgHeight);
          remainingHeight -= pageHeight;
          position -= pageHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      pdf.save(`${sanitizeFilename(post.title)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("فشل إنشاء الـ PDF. راجع الكونسول للمزيد من التفاصيل.");
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg">جاري التحميل...</p>;
  if (!post) return <p className="text-center mt-10 text-lg text-red-600">لم يتم العثور على البوست</p>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-md"
        >
          رجوع
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfGenerating}
          className={`bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition shadow-lg ${pdfGenerating ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {pdfGenerating ? "جاري الإنشاء..." : "تحميل البوست كـ PDF"}
        </button>
      </div>

      <article
        ref={printRef}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        style={{
          direction: "rtl",
          fontFamily: 'Tajawal, "Noto Naskh Arabic", sans-serif',
          color: "#0f172a",
        }}
      >
        <header className="relative bg-gradient-to-br from-gray-900 via-indigo-800 to-purple-700 text-white py-10 px-8">
          <div className="max-w-3xl mx-auto">
            <h1
              style={{
                fontFamily: 'Tajawal, "Noto Naskh Arabic", sans-serif',
                fontWeight: 700,
                lineHeight: 1.05,
              }}
              className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-md"
            >
              {post.title}
            </h1>
            <p className="mt-3 text-gray-100/85 max-w-2xl text-sm md:text-base">
              منشور بواسطة <strong className="text-yellow-300">{post.userName}</strong>
            </p>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full">
                {new Date(post.createdAt).toLocaleString()}
              </span>

              <span className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm px-3 py-1.5 rounded-full">
                {post.numberLike ?? 0} إعجاب
              </span>
            </div>
          </div>

          <div className="absolute -bottom-1 left-0 right-0">
            <svg viewBox="0 0 1440 40" className="w-full block" preserveAspectRatio="none">
              <path d="M0,40 C80,0 200,0 360,24 C520,48 760,48 960,24 C1160,0 1280,0 1440,24 L1440,40 L0,40 Z" fill="white"></path>
            </svg>
          </div>
        </header>

        <div className="px-8 py-10 bg-white -mt-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {post.imageURL ? (
                <img src={post.imageURL} alt={post.userName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">ع</div>
              )}
              <div>
                <p className="text-gray-800 font-semibold">{post.userName}</p>
                <p className="text-gray-500 text-sm">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {post.images?.length > 0 && (
              <div className="w-full mb-6 rounded-lg overflow-hidden border">
                <img
                  src={post.images[0]}
                  alt="Post"
                  className="w-full h-80 md:h-96 object-cover"
                  style={{ display: "block" }}
                />
              </div>
            )}

            <div className="prose prose-lg prose-quoteless max-w-full text-gray-800 leading-relaxed mb-8">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {post.images?.length > 1 && (
              <section className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">صور إضافية</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.images.slice(1).map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border">
                      <img src={img} alt={`Extra ${idx}`} className="w-full h-40 object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {post.postTags?.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-medium mb-3 text-gray-900">التصنيفات</h4>
                <div className="flex flex-wrap gap-3">
                  {post.postTags.map((tag) => (
                    <span key={tag.id} className="text-sm px-4 py-2 bg-gray-100 text-gray-800 rounded-full border">
                      {tag.tagName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <footer className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">تم تنسيق المنشور بواسطة فريق عرب كودرز</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">جميع الحقوق محفوظة - عرب كودرز 2025</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </div>
  );
};

export default AdminPostDetails;