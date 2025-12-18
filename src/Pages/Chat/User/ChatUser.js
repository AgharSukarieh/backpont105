import React, { useEffect, useState, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import {
  getUserMessages,
  addMessage,
} from "../../../Service/MessageService";

import { uploadUserImage } from "../../../Service/userService";
import { uploadUserVideo } from "../../../Service/UploadVideoService";



export default function ChatUser({
  userId = localStorage.getItem("idUser"),
  userName = "Admin",
  hubUrl = "http://arabcodetest.runasp.net/chatHub",
  locale
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadAt, setLastReadAt] = useState(() => {
    try {
      return localStorage.getItem(`chat_last_read_${localStorage.getItem("idUser") ?? ""}`);
    } catch {
      return null;
    }
  });

  // file attachments state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const currentUserId = String(localStorage.getItem("idUser") ?? "");
  const token = localStorage.getItem("token") ?? "";

  const resolvedLocale = locale
    || document?.documentElement?.lang
    || navigator?.language
    || "en";
  const baseLang = String(resolvedLocale).split("-")[0].toLowerCase();
  const isRtl = ["ar", "he", "fa", "ur"].includes(baseLang);
  const dir = isRtl ? "rtl" : "ltr";

  const getTimestamp = (m) => {
    return m?.SentAt ?? m?.createdAt ?? new Date().toISOString();
  };

  useEffect(() => {
    const key = `chat_last_read_${userId ?? ""}`;
    const saved = localStorage.getItem(key);
    setLastReadAt(saved);
    setUnreadCount(0);
    clearSelectedFiles();
  }, [userId]);

  // SignalR connection
  useEffect(() => {
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    const receiveHandler = (msg) => {
      const senderId = String(msg.senderId ?? "");
      const receiverId = String(msg.receiverId ?? "");

      if (senderId === String(userId) || receiverId === String(userId)) {
        setMessages(prev => {
          const exists = prev.some(m =>
            String(m.id) === String(msg.id) ||
            (m.message === msg.message && new Date(getTimestamp(m)).getTime() === new Date(getTimestamp(msg)).getTime())
          );
          if (exists) return prev;
          return [...prev, msg];
        });

        if (open) {
          const now = new Date().toISOString();
          setLastReadAt(now);
          try { localStorage.setItem(`chat_last_read_${userId ?? ""}`, now); } catch (e) {}
          requestAnimationFrame(() => {
            if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
          });
        }
      }
    };

    hub.on("ReceiveMessage", receiveHandler);

    hub.start().catch(err => console.error("SignalR connection error:", err));

    return () => {
      try { hub.off("ReceiveMessage", receiveHandler); } catch (e) {}
      hub.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hubUrl, open]);

  useEffect(() => {
    if (open) {
      fetchMessages().then(() => {
        const now = new Date().toISOString();
        setLastReadAt(now);
        try { localStorage.setItem(`chat_last_read_${userId ?? ""}`, now); } catch (e) {}
        setUnreadCount(0);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getUserMessages(userId);
      const sorted = (data ?? []).slice().sort((a, b) =>
        new Date(getTimestamp(a)).getTime() - new Date(getTimestamp(b)).getTime()
      );
      setMessages(sorted);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const unread = messages.filter(m => {
        if (String(m.senderId) === String(currentUserId)) return false;
        if (m.isReadUser === true) return false;
        const sent = new Date(getTimestamp(m)).getTime();
        if (!lastReadAt) return true;
        return sent > new Date(lastReadAt).getTime();
      }).length;
      setUnreadCount(unread);
    } catch (e) {
      setUnreadCount(0);
    }
  }, [messages, lastReadAt, currentUserId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  // Attachments
  const MAX_FILES = 3;
  const clearSelectedFiles = () => {
    selectedFiles.forEach(f => {
      if (f.preview && f.preview.startsWith("blob:")) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setSelectedFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map(file => {
      const kind = file.type.startsWith("image/") ? "image" : (file.type.startsWith("video/") ? "video" : "unknown");
      return {
        file,
        kind,
        preview: kind === "image" ? URL.createObjectURL(file) : (kind === "video" ? URL.createObjectURL(file) : null)
      };
    }).filter(item => item.kind !== "unknown");

    if (selectedFiles.length + newItems.length > MAX_FILES) {
      const allowed = MAX_FILES - selectedFiles.length;
      if (allowed <= 0) {
        alert(`لا يمكنك إضافة أكثر من ${MAX_FILES} ملفات.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      } else {
        alert(`يمكنك إضافة ${allowed} ملفات إضافية فقط.`);
        newItems.splice(allowed);
      }
    }

    setSelectedFiles(prev => [...prev, ...newItems]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => {
      const copy = prev.slice();
      const [removed] = copy.splice(index, 1);
      if (removed && removed.preview && removed.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview);
      }
      return copy;
    });
  };

  // Upload & send
  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = newText.trim();
    if (!text && selectedFiles.length === 0) return;

    setUploadingFiles(true);

    try {
      const uploadPromises = selectedFiles.map(async (item) => {
        if (item.kind === "image") {
          const url = await uploadUserImage(item.file);
          return { kind: "image", url };
        } else if (item.kind === "video") {
          const url = await uploadUserVideo(item.file);
          return { kind: "video", url };
        }
        return null;
      });

      const uploadResults = await Promise.all(uploadPromises);

      const images = uploadResults.filter(r => r && r.kind === "image").map(r => r.url);
      const videos = uploadResults.filter(r => r && r.kind === "video").map(r => ({
        title: "",
        description: "",
        url: r.url,
        thumbnailUrl: ""
      }));

      const payload = {
        message: text,
        receiverId: userId,
        videos,
        images
      };

      const nowIso = new Date().toISOString();
      const tempMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message: text,
        senderId: currentUserId,
        receiverId: userId,
        createdAt: nowIso,
        SentAt: nowIso,
        _optimistic: true,
        images: images.length ? images : selectedFiles.filter(f => f.kind === "image").map(f => f.preview),
        videos: videos.length ? videos : selectedFiles.filter(f => f.kind === "video").map(f => ({ url: f.preview, title: "", description: "", thumbnailUrl: "" }))
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewText("");
      clearSelectedFiles();
      scrollToBottom();

      await addMessage(payload);
    } catch (err) {
      console.error("Upload or send failed", err);
      alert("فشل رفع الملفات أو إرسال الرسالة. حاول مرة أخرى.");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleImgError = (e) => {
    e.currentTarget.src =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23ddd' width='100' height='100' rx='10'/><text x='50' y='55' font-size='14' text-anchor='middle' fill='%23999'>No Image</text></svg>";
  };

  // Group messages by day
  const groupMessagesByDay = (msgs) => {
    const groups = [];
    let currentDay = null;
    msgs.forEach((m) => {
      const day = new Date(getTimestamp(m)).toDateString();
      if (day !== currentDay) {
        groups.push({ type: "day", day, id: `day-${day}` });
        currentDay = day;
      }
      groups.push(m);
    });
    return groups;
  };

  const grouped = groupMessagesByDay(messages);

  const formatTimeShort = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(resolvedLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch {
      return "";
    }
  };

  // ------------------------
  // Media Viewer (lightbox)
  // ------------------------
  const [viewer, setViewer] = useState({
    open: false,
    kind: null, // "image" | "video"
    src: null,
    title: ""
  });
  const viewerMediaRef = useRef(null);

  const openMedia = (src, kind = "image", title = "") => {
    setViewer({ open: true, kind, src, title });
    // prevent background scroll
    try { document.body.style.overflow = "hidden"; } catch (e) {}
  };

  const closeMedia = () => {
    setViewer({ open: false, kind: null, src: null, title: "" });
    try { document.body.style.overflow = ""; } catch (e) {}
  };

  // ESC to close
  useEffect(() => {
    if (!viewer.open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMedia();
      if (e.key === "f" && viewer.open) { // 'f' to fullscreen
        if (viewerMediaRef.current) {
          const el = viewerMediaRef.current;
          if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer.open]);

  const triggerFullscreen = async () => {
    const el = viewerMediaRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      try { await el.requestFullscreen(); } catch (e) {}
    } else if (el.webkitRequestFullscreen) {
      try { el.webkitRequestFullscreen(); } catch (e) {}
    }
  };

  // Render
  return (
    <>
      {/* Floating pill */}
      <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <button
            onClick={() => setOpen(s => !s)}
            aria-label={open ? "Close chat" : "Open chat"}
            className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg px-4 py-2 rounded-full hover:shadow-2xl transition-all"
            style={{ direction: dir }}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-white flex items-center justify-center font-semibold">
              {userName?.slice(0,1) ?? "U"}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-gray-500">
                {loading
                  ? "جار التحميل..."
                  : unreadCount > 0
                    ? `${unreadCount} رسالة جديدة`
                    : "لا رسائل جديدة"
                }
              </span>
            </div>

            <div className="ml-2">
              {open ? (
                <span className="text-gray-500">✕</span>
              ) : (
                <span className="text-blue-600">💬</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Chat panel */}
      <div
        className={`fixed left-1/2 transform -translate-x-1/2 bottom-20 w-[92%] sm:w-[420px] md:w-[520px] lg:w-[560px] max-h-[70vh] z-50 transition-all ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
        style={{ direction: dir }}
        role="dialog"
        aria-modal="true"
        aria-label={`Chat with ${userName}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-indigo-800 font-semibold">
                {userName?.slice(0,1) ?? "U"}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{userName}</span>
                <span className="text-xs text-gray-400">متصل الآن</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => fetchMessages()} className="p-2 rounded-md hover:bg-gray-100" title="Refresh">⟳</button>
              <button onClick={() => { setOpen(false); }} className="p-2 rounded-md hover:bg-gray-100" title="Close">✕</button>
            </div>
          </div>

          {/* messages */}
          <div ref={listRef} className="px-4 py-3 overflow-auto space-y-3 max-h-[44vh] bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500 py-6">جار التحميل...</div>
            ) : grouped.length === 0 ? (
              <div className="text-center text-gray-400 py-8">لا توجد رسائل بعد — ابدأ المحادثة الآن.</div>
            ) : (
              grouped.map((item) => item.type === "day" ? (
                <div key={item.id} className="flex justify-center">
                  <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{item.day}</div>
                </div>
              ) : (
                <div key={item.id ?? Math.random()} className={`w-full flex ${String(item.senderId) === String(currentUserId) ? (isRtl ? "justify-start" : "justify-end") : (isRtl ? "justify-end" : "justify-start")}`}>
                  <div className={`max-w-[78%] px-4 py-2 rounded-2xl break-words ${String(item.senderId) === String(currentUserId) ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "bg-white border border-gray-100 text-gray-900"}`}>
                    <div className="whitespace-pre-wrap leading-6 text-sm mb-2">{item.message ?? "(no message)"}</div>

                    {/* images preview - clickable */}
                    {item.images && item.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {item.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`img-${idx}`}
                            className="h-20 w-full object-cover rounded-md cursor-pointer"
                            onClick={() => openMedia(img, "image", item.message ? item.message.slice(0, 80) : "")}
                            onError={handleImgError}
                          />
                        ))}
                      </div>
                    )}

                    {/* videos preview - clickable */}
                    {item.videos && item.videos.length > 0 && (
                      <div className="space-y-2 mb-1">
                        {item.videos.map((v, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {v.thumbnailUrl ? (
                              <img
                                src={v.thumbnailUrl}
                                alt={`thumb-${idx}`}
                                className="h-16 w-24 object-cover rounded-md cursor-pointer"
                                onClick={() => openMedia(v.url, "video", v.title || "")}
                                onError={handleImgError}
                              />
                            ) : (
                              <div
                                className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-600 cursor-pointer"
                                onClick={() => openMedia(v.url, "video", v.title || "")}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter") openMedia(v.url, "video", v.title || ""); }}
                              >
                                🎬
                              </div>
                            )}
                            <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">فتح الفيديو</a>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-[11px] opacity-70">{formatTimeShort(getTimestamp(item))}</span>
                      {item._optimistic && <span className="text-[11px] text-yellow-600">· إرسال...</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* composer + attachments */}
          <div className="px-3 py-3 border-t bg-white">
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                {selectedFiles.map((sf, idx) => (
                  <div key={idx} className="relative">
                    {sf.kind === "image" ? (
                      <img src={sf.preview} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded-md border cursor-pointer" onClick={() => openMedia(sf.preview, "image")} />
                    ) : (
                      <video src={sf.preview} className="h-16 w-24 object-cover rounded-md border cursor-pointer" onClick={() => openMedia(sf.preview, "video")} />
                    )}
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow text-xs w-6 h-6 flex items-center justify-center"
                      title="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 text-sm">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={selectedFiles.length >= MAX_FILES || uploadingFiles}
                  />
                  📎 إضافة ملف
                </label>
                <span className="text-xs text-gray-500">{selectedFiles.length}/{MAX_FILES}</span>
              </div>

              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                className="flex-1 min-h-[40px] max-h-36 resize-none rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                aria-label="Message text"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                type="submit"
                disabled={uploadingFiles}
                className={`bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 ${uploadingFiles ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {uploadingFiles ? "جارٍ الإرسال..." : "إرسال"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Media viewer modal */}
      {viewer.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={closeMedia}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeMedia}
              className="absolute top-2 right-2 z-50 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow"
              title="Close"
            >
              ✕
            </button>

            {/* Fullscreen button */}
            <button
              onClick={triggerFullscreen}
              className="absolute top-2 left-2 z-50 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow"
              title="Fullscreen (F)"
            >
              ⤢
            </button>

            {/* Download button */}
            <a
              href={viewer.src}
              download
              target="_blank"
              rel="noreferrer"
              className="absolute top-2 left-12 z-50 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow"
              title="Download"
            >
              ⬇
            </a>

            {/* Media */}
            <div className="flex items-center justify-center">
              {viewer.kind === "image" ? (
                <img
                  ref={viewerMediaRef}
                  src={viewer.src}
                  alt={viewer.title || "media"}
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-md shadow-lg"
                />
              ) : (
                <video
                  ref={viewerMediaRef}
                  src={viewer.src}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-[90vw] rounded-md shadow-lg bg-black"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}