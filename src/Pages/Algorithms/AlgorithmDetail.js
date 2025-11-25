import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getExplaineTagById } from "../../Service/TagServices";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./algorithmDetail.css";

/* ---------- CodeBlock (with copy) ---------- */
const CodeBlock = ({ code, language = "javascript" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden shadow-sm">
      <div className="absolute top-3 right-16 flex items-center gap-2 z-10">
        <span className="text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded">
          {language.toUpperCase()}
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCopy}
          className="text-xs bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-md hover:bg-white/20 transition"
          aria-label="نسخ الكود"
        >
          {copied ? "تم النسخ ✓" : "نسخ"}
        </button>
      </div>

      <div dir="ltr" className="text-sm">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          wrapLongLines
          customStyle={{
            margin: 0,
            background: "#0f1720",
            padding: "1rem",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {code || "// لا يوجد كود"}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

/* ---------- Expandable ---------- */
const Expandable = ({ summary, children }) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);

  const currentMaxHeight =
    contentRef.current && typeof contentRef.current.scrollHeight === "number"
      ? `${contentRef.current.scrollHeight}px`
      : "0px";

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-4 p-3 bg-white/50 rounded-md border border-gray-100 hover:bg-gray-50 transition"
        aria-expanded={open}
      >
        <div className="text-right">
          <span className="font-semibold text-gray-800">{summary}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707A1 1 0 114.293 8.293l5-5A1 1 0 0110 3z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: open ? currentMaxHeight : "0px",
          transition: "max-height 300ms ease",
          overflow: "hidden",
        }}
      >
        <div className="mt-3 p-3 bg-gray-50 rounded-b-md text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ---------- Video modal ---------- */
function VideoModal({ video, onClose }) {
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
            <div
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: video.description }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Helpers ---------- */
const containsHTML = (str) => {
  if (!str || typeof str !== "string") return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
};

const renderMaybeHTML = (content) => {
  if (content === null || content === undefined || content === "") return null;
  if (containsHTML(content)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <div className="whitespace-pre-wrap break-words leading-relaxed">{content}</div>;
};

/* ---------- Main component ---------- */
const AlgorithmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await getExplaineTagById(id);
        if (!cancelled) setData(res);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="algorithm-detail-page" dir="rtl">
        {/* Header Skeleton */}
        <div className="algorithm-detail-header">
          <div className="algorithm-back-btn skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '8px' }}></div>
          <div className="algorithm-header-content" style={{ flex: 1, marginRight: '1rem' }}>
            <div className="skeleton-box" style={{ width: '60%', height: '32px', marginBottom: '0.5rem', borderRadius: '8px' }}></div>
            <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '20px' }}></div>
          </div>
        </div>
        
        <div className="algorithm-detail-container">
          {/* Overview Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-section-title">
              <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.5rem' }}></div>
              <div className="skeleton-box" style={{ width: '150px', height: '28px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-section-content">
              <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '95%', height: '16px', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '90%', height: '16px', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '85%', height: '16px', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* Prerequisites Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-section-title">
              <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.5rem' }}></div>
              <div className="skeleton-box" style={{ width: '200px', height: '28px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-section-content">
              <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '98%', height: '16px', marginBottom: '0.75rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '92%', height: '16px', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* Steps Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-section-title">
              <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.5rem' }}></div>
              <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-section-content">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ marginBottom: '1rem', paddingRight: '1.5rem' }}>
                  <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '0.5rem', borderRadius: '4px' }}></div>
                  <div className="skeleton-box" style={{ width: '95%', height: '16px', borderRadius: '4px' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-section-title">
              <div className="skeleton-box" style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.5rem' }}></div>
              <div className="skeleton-box" style={{ width: '180px', height: '28px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-example-card">
              <div className="algorithm-example-header">
                <div className="skeleton-box" style={{ width: '200px', height: '24px', borderRadius: '8px' }}></div>
                <div className="skeleton-box" style={{ width: '80px', height: '32px', borderRadius: '8px' }}></div>
              </div>
              <div className="skeleton-box" style={{ width: '100%', height: '200px', borderRadius: '8px', marginBottom: '1rem' }}></div>
              <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '0.5rem', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '90%', height: '16px', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* YouTube Links Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-youtube-title">
              <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.75rem' }}></div>
              <div className="skeleton-box" style={{ width: '220px', height: '32px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-youtube-grid">
              {[1, 2].map((i) => (
                <div key={i} className="algorithm-youtube-card">
                  <div className="skeleton-box" style={{ width: '80%', height: '24px', marginBottom: '0.75rem', borderRadius: '8px' }}></div>
                  <div className="skeleton-box" style={{ width: '100%', height: '16px', marginBottom: '0.5rem', borderRadius: '4px' }}></div>
                  <div className="skeleton-box" style={{ width: '95%', height: '16px', marginBottom: '1rem', borderRadius: '4px' }}></div>
                  <div className="skeleton-box" style={{ width: '140px', height: '40px', borderRadius: '12px' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Videos Skeleton */}
          <div className="algorithm-section">
            <div className="algorithm-videos-title">
              <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '4px', display: 'inline-block', marginLeft: '0.75rem' }}></div>
              <div className="skeleton-box" style={{ width: '150px', height: '32px', borderRadius: '8px', display: 'inline-block' }}></div>
            </div>
            <div className="algorithm-videos-grid">
              {[1].map((i) => (
                <div key={i} className="algorithm-video-card">
                  <div className="skeleton-box" style={{ width: '100%', height: '180px', borderRadius: '16px 16px 0 0' }}></div>
                  <div style={{ padding: '1rem' }}>
                    <div className="skeleton-box" style={{ width: '70%', height: '20px', marginBottom: '0.5rem', borderRadius: '8px' }}></div>
                    <div className="skeleton-box" style={{ width: '100%', height: '16px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data)
    return <p className="text-center text-red-500">لم يتم العثور على البيانات.</p>;

  const fallbackThumbnail =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='28'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

  return (
    <div className="algorithm-detail-page" dir="rtl">
      {/* Header */}
      <div className="algorithm-detail-header">
        <button
          onClick={() => navigate(-1)}
          className="algorithm-back-btn"
          aria-label="العودة"
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div className="algorithm-header-content">
          <h1 className="algorithm-title">{data.title}</h1>
          {data.complexity && (
            <div className="algorithm-complexity-badge">
              <i className="bx bx-time-five"></i>
              <span>التعقيد: {data.complexity}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="algorithm-detail-container">
        {/* Overview */}
        <div className="algorithm-section">
          <h2 className="algorithm-section-title">
            <i className="bx bx-info-circle"></i>
            نظرة عامة
          </h2>
          <div className="algorithm-section-content">
            {renderMaybeHTML(data.overview)}
          </div>
        </div>

        {/* Prerequisites */}
        {data.start && (
          <div className="algorithm-section">
            <h2 className="algorithm-section-title">
              <i className="bx bx-book-bookmark"></i>
              المتطلبات والمفاهيم الأساسية
            </h2>
            <div className="algorithm-section-content">
              {renderMaybeHTML(data.start)}
            </div>
          </div>
        )}

        {/* Steps */}
        {data.steps && (
          <div className="algorithm-section">
            <h2 className="algorithm-section-title">
              <i className="bx bx-list-ol"></i>
              خطوات الحل
            </h2>
            <div className="algorithm-section-content">
              {renderMaybeHTML(data.steps)}
            </div>
          </div>
        )}

        {/* Examples */}
        {data.exampleTags?.length > 0 && (
          <div className="algorithm-examples">
            <h2 className="algorithm-examples-title">
              <i className="bx bx-code-block"></i>
              أمثلة تطبيقية
            </h2>
            {data.exampleTags.map((ex, i) => (
              <div key={ex.id ?? i} className="algorithm-example-card">
                <div className="algorithm-example-header">
                  <h3 className="algorithm-example-title">{ex.title}</h3>
                  <span className="algorithm-example-priority">
                    مثال {i + 1} • أولوية: {ex.priority ?? "-"}
                  </span>
                </div>

                {ex.code && <CodeBlock code={ex.code} language={detectLanguage(ex.code)} />}

                {ex.explanation && (
                  <div className="algorithm-example-explanation">
                    <strong>الشرح:</strong>
                    <div className="mt-2">{renderMaybeHTML(ex.explanation)}</div>
                  </div>
                )}

                <div className="algorithm-example-io">
                  <div className="algorithm-example-input">
                    <p><strong>المدخلات:</strong></p>
                    <div className="algorithm-example-io-content">{ex.input ?? "—"}</div>
                  </div>
                  <div className="algorithm-example-output">
                    <p><strong>المخرجات:</strong></p>
                    <div className="algorithm-example-io-content">{ex.output ?? "—"}</div>
                  </div>
                </div>

                {ex.stepByStep && (
                  <Expandable summary="عرض الخطوات التفصيلية">
                    {renderMaybeHTML(ex.stepByStep)}
                  </Expandable>
                )}
              </div>
            ))}
          </div>
        )}

        {/* YouTube links */}
        {data.youTubeLinks?.length > 0 && (
          <div className="algorithm-youtube">
            <h2 className="algorithm-youtube-title">
              <i className="bx bxl-youtube"></i>
              روابط مفيدة (YouTube)
            </h2>
            <div className="algorithm-youtube-grid">
              {data.youTubeLinks.map((vid) => (
                <div key={vid.id ?? vid.url} className="algorithm-youtube-card">
                  <h3 className="algorithm-youtube-card-title">{vid.title}</h3>
                  <div className="algorithm-youtube-card-desc">
                    {renderMaybeHTML(vid.description)}
                  </div>
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="algorithm-youtube-link"
                  >
                    مشاهدة على YouTube
                    <i className="bx bx-link-external"></i>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local videos */}
        {data.videos?.length > 0 && (
          <div className="algorithm-videos">
            <h2 className="algorithm-videos-title">
              <i className="bx bx-video"></i>
              فيديوهات داخلية
            </h2>
            <div className="algorithm-videos-grid">
              {data.videos.map((v, i) => (
                <div key={v.id ?? i} className="algorithm-video-card">
                  <div className="algorithm-video-thumbnail" onClick={() => setPlayingIndex(i)}>
                    <img
                      src={v.thumbnailUrl || fallbackThumbnail}
                      alt={v.title || `video-${i}`}
                    />
                    <div className="algorithm-video-play-overlay">
                      <div className="algorithm-video-play-btn">▶</div>
                    </div>
                  </div>

                  <div className="algorithm-video-info">
                    <h3 className="algorithm-video-title">{v.title || "-"}</h3>
                    <div className="algorithm-video-desc">
                      <div dangerouslySetInnerHTML={{ __html: v.description || "" }} />
                    </div>
                    <div className="algorithm-video-actions">
                      <button onClick={() => setPlayingIndex(i)} className="algorithm-video-play-text-btn">
                        <i className="bx bx-play"></i>
                        تشغيل
                      </button>
                      {v.duration && <span className="algorithm-video-duration">{v.duration} ثانية</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {data.end && (
          <div className="algorithm-section">
            <h2 className="algorithm-section-title">
              <i className="bx bx-bulb"></i>
              خلاصة ونصائح عملية
            </h2>
            <div className="algorithm-section-content">
              {renderMaybeHTML(data.end)}
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {playingIndex !== null && (
        <VideoModal video={data.videos[playingIndex]} onClose={() => setPlayingIndex(null)} />
      )}
    </div>
  );
};

/* ---------- small utility: detect language from code ---------- */
function detectLanguage(code) {
  if (!code || typeof code !== "string") return "text";
  if (/^\s*#include\b|std::|int\s+main\(/.test(code)) return "cpp";
  if (/^\s*import\s+React|from\s+['"]react['"]|console\.log|function\b/.test(code)) return "javascript";
  if (/^\s*package\s+|func\s+main\(/.test(code)) return "go";
  if (/^\s*using\s+System;|namespace\s+/.test(code)) return "csharp";
  return "text";
}

export default AlgorithmDetail;

