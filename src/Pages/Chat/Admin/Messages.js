import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as signalR from "@microsoft/signalr";

/*
  نسخة ChatPage مع إضافة Lightbox/modal لعرض الصورة أو الفيديو بالكامل عند النقر.
  - افتح الصورة أو الفيديو في نافذة overlay عند النقر على thumbnail سواء داخل الرسالة أو في previews قبل الإرسال.
  - إغلاق بالضغط على زر الإغلاق، النقر خارج المحتوى، أو الضغط على ESC.
  - لا تغيّرت باقي وظائف الرفع/الإرسال.
*/

export default function ChatPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newText, setNewText] = useState("");
  const [unreadMap, setUnreadMap] = useState({}); // { userId: count }

  // attachment states
  const [imageFiles, setImageFiles] = useState([]); // { file, previewUrl }
  const [videoFiles, setVideoFiles] = useState([]); // { file, previewUrl }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // {filename: percent}

  // media modal state
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [mediaSrc, setMediaSrc] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");

  const currentUserId = parseInt(localStorage.getItem("idUser"));
  const token = localStorage.getItem("token");

  const messagesEndRef = useRef(null);
  const connectionRef = useRef(null);
  const selectedUserRef = useRef(null);

  // page direction (kept as original behavior)
  const htmlLang =
    (typeof document !== "undefined" && document.documentElement.lang) ||
    navigator.language ||
    "en";
  const initialIsRtl = /^ar|^he|^fa|^ur/i.test(htmlLang);

  // Helper: format sent time (prefer sentAt, fallback to createdAt)
  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // --- Inject CSS (includes modal styles) ---
  useEffect(() => {
    const styleId = "chatpage-ux-enhancements";
    if (document.getElementById(styleId)) return;
    const css = `
      :root{
        --bg:#f7f8fb;
        --panel:#ffffff;
        --muted:#666;
        --accent:#0b74ff;
        --accent-contrast:#fff;
        --incoming:#eaeaea;
        --max-width:1200px;
      }

      /* Page fade in */
      .chat-wrapper { opacity: 0; transform: translateY(6px); transition: opacity 300ms ease, transform 300ms ease; }
      .chat-wrapper.ready { opacity: 1; transform: translateY(0); }

      /* Message enter */
      @keyframes slideInUpMsg {
        0% { transform: translateY(12px) scale(0.995); opacity: 0; }
        60% { transform: translateY(-4px) scale(1.002); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      .msg-enter { animation: slideInUpMsg 360ms cubic-bezier(.2,.9,.2,1) both; }

      /* unread badge */
      .unread-badge {
        background: var(--accent);
        color: var(--accent-contrast);
        min-width: 20px;
        height: 20px;
        padding: 0 7px;
        font-size: 12px;
        border-radius: 999px;
        display:inline-flex; align-items:center; justify-content:center;
        box-shadow: 0 6px 18px rgba(11,116,255,0.12);
        transform-origin: center;
      }
      @keyframes badgePulse {
        0% { transform: scale(1); box-shadow: 0 6px 18px rgba(11,116,255,0.12); }
        50% { transform: scale(1.06); box-shadow: 0 14px 32px rgba(11,116,255,0.14); }
        100% { transform: scale(1); box-shadow: 0 6px 18px rgba(11,116,255,0.12); }
      }
      .unread-badge.pulse { animation: badgePulse 1800ms infinite ease-in-out; }

      /* user row layout & preview */
      .user-row { display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid #f1f3f5; cursor:pointer; transition: background 160ms, transform 160ms; }
      .user-row:hover { background:#fbfcfe; transform: translateY(-2px); }
      .user-avatar { width:50px; height:50px; border-radius:50%; overflow:hidden; flex-shrink:0; position:relative; }
      .user-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
      .user-meta { flex:1; min-width:0; }
      .user-meta .name { font-weight:600; display:flex; align-items:center; gap:8px; }
      .user-meta .preview { font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px; }

      .online-dot { position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:green; border-radius:50%; border:2px solid white; }
      .online-dot.small { width:10px; height:10px; bottom:0; right:0; }

      /* header / chat area */
      .chat-panel { flex:3; padding:16px; display:flex; flex-direction:column; }
      .chat-header { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
      .chat-header .title { font-size:18px; font-weight:600; }
      .chat-header .status { font-size:12px; color:var(--muted); }

      /* messages window */
      .messages-window { flex:1; background:var(--panel); border-radius:8px; padding:16px; overflow-y:auto; border:1px solid #e2e6ee; }
      .msg-row { display:flex; margin-bottom:12px; }
      .msg-bubble { padding:10px 14px; border-radius:12px; max-width:70%; word-break:break-word; box-shadow: 0 4px 18px rgba(2,6,23,0.04); }
      .msg-in { background:var(--incoming); color:#222; align-self:flex-start; }
      .msg-out { background:var(--accent); color:var(--accent-contrast); align-self:flex-end; }

      /* unread message highlight (temporary until read) */
      .msg-unread { box-shadow: 0 8px 28px rgba(11,116,255,0.06); border: 1px solid rgba(11,116,255,0.06); }

      /* chat form */
      .chat-form { display:flex; gap:8px; margin-top:12px; align-items:center; }
      .chat-input { flex:1; padding:10px 12px; border-radius:8px; border:1px solid #e6e9ee; font-size:14px; }
      .chat-send { background:var(--accent); color:var(--accent-contrast); border:none; padding:10px 12px; border-radius:8px; cursor:pointer; transition:transform 120ms ease; }
      .chat-send:active { transform: translateY(1px) scale(.997); }

      /* attachment previews */
      .attachments { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
      .att-thumb { width:72px; height:72px; border-radius:8px; overflow:hidden; position:relative; background:#fafafa; border:1px solid #eee; display:flex; align-items:center; justify-content:center; }
      .att-thumb img, .att-thumb video { width:100%; height:100%; object-fit:cover; display:block; cursor: pointer; }
      .att-remove { position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.6); color:white; width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; }

      /* upload progress small bar */
      .progress-bar { width:100%; height:5px; background:#eee; border-radius:4px; overflow:hidden; margin-top:6px; }
      .progress-bar > i { display:block; height:100%; background: linear-gradient(90deg, rgba(11,116,255,0.9), rgba(11,116,255,0.6)); width:0%; transition: width 200ms linear; }

      /* shimmer loading */
      @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
      .shimmer { background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.03) 100%); background-size: 200px 100%; animation: shimmer 1100ms linear infinite; border-radius:6px; }

      /* scrollbar */
      .messages-window::-webkit-scrollbar { width: 10px; }
      .messages-window::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.06)); border-radius:999px; }

      /* modal / lightbox */
      .media-modal { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.6); z-index: 9999; padding: 20px; }
      .media-modal-content { max-width: 95%; max-height: 95%; border-radius: 12px; overflow: hidden; background: transparent; display:flex; align-items:center; justify-content:center; position:relative; }
      .media-modal img, .media-modal video { max-width: 100%; max-height: 100%; display:block; border-radius:8px; }
      .media-modal-close { position:absolute; top:8px; right:8px; background: rgba(0,0,0,0.6); color:white; width:36px; height:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; z-index:10000; }
      .media-modal-caption { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); color:white; background: rgba(0,0,0,0.45); padding:6px 10px; border-radius:8px; font-size:13px; }

      /* Responsive */
      @media (max-width:860px) {
        .chat-wrapper { flex-direction:column; height:100vh; margin:0; border-radius:0; }
        .chat-users { max-height:28vh; }
      }

      /* minimal copy of original wrapper/user styles to keep colors consistent */
      .chat-wrapper{
        display:flex;
        height:90vh;
        max-width:var(--max-width);
        margin:20px auto;
        border:1px solid #e6e9ee;
        border-radius:10px;
        overflow:hidden;
        box-shadow:0 6px 18px rgba(15,23,42,0.06);
        background:var(--bg);
      }
      .chat-users{
        flex:1;
        background:var(--panel);
        overflow-y:auto;
        border-inline-end:1px solid #e6e9ee;
      }
    `;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }, []);

  // --- keep refs in sync ---
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // --- SignalR (same behavior) ---
  useEffect(() => {
    let mounted = true;
    const connect = new signalR.HubConnectionBuilder()
      .withUrl("http://arabcodetest.runasp.net/chatHub", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connect.on("ReceiveMessage", (msg) => {
      const sel = selectedUserRef.current;
      if (sel && (msg.senderId === sel.id || msg.receiverId === sel.id)) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      } else {
        const senderId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        setUnreadMap(prev => ({ ...prev, [senderId]: ((prev[senderId] || 0) + 1) }));
      }
    });

    connect.start()
      .then(() => {
        if (!mounted) return;
        connectionRef.current = connect;
      })
      .catch(err => console.error("SignalR connection error:", err));

    return () => {
      mounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      } else {
        connect.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- fetch users on mount ---
  useEffect(() => {
    fetchUsers();
    setTimeout(() => {
      const el = document.querySelector(".chat-wrapper");
      if (el) el.classList.add("ready");
    }, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(
        "http://arabcodetest.runasp.net/Message/GetAllUserSentMessages",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = (data || []).map(u => {
        const unread = u.unreadCount ?? u.unReadCount ?? u.unReadMessages ?? 0;
        const lastMsg = u.lastMessage ?? u.lastMessageText ?? u.lastMessagePreview ?? "";
        const lastTime = u.lastMessageSentAt ?? u.lastMessageTime ?? u.lastMessageDate ?? u.lastSeen ?? u.sentAt ?? null;
        return { ...u, unreadCount: Number(unread || 0), lastMessage: lastMsg, lastMessageTime: lastTime };
      });

      const map = {};
      list.forEach(u => { if (u.unreadCount) map[u.id] = u.unreadCount; });
      setUnreadMap(map);

      list.sort((a,b) => {
        if (a.isOnline === b.isOnline) {
          const ua = (a.unreadCount || 0), ub = (b.unreadCount || 0);
          return ub - ua;
        }
        return (a.isOnline ? -1 : 1);
      });

      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- fetch messages and clear unread locally ---
  const fetchMessages = async (user) => {
    setSelectedUser(user);
    setLoadingMessages(true);
    try {
      const { data } = await axios.get(
        `http://arabcodetest.runasp.net/Message/GetUserMessage/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

      setUnreadMap(prev => {
        if (!prev[user.id]) return prev;
        const copy = { ...prev };
        delete copy[user.id];
        return copy;
      });

      // Optionally call server mark-as-read here (uncomment and adapt endpoint if available):
      // try { await axios.post(`http://arabcodetest.runasp.net/Message/MarkAsRead/${user.id}`, null, { headers: { Authorization: `Bearer ${token}` } }); } catch(e){ console.warn(e); }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // --- attachment helpers ---
  const handleImageInput = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
    setImageFiles(prev => [...prev, ...mapped]);
    e.target.value = ""; // reset input
  };

  const handleVideoInput = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
    setVideoFiles(prev => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImageFiles(prev => {
      const copy = [...prev];
      // revoke object URL
      if (copy[index]?.previewUrl) URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const removeVideo = (index) => {
    setVideoFiles(prev => {
      const copy = [...prev];
      if (copy[index]?.previewUrl) URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // upload single image file (matches uploadUserImage behavior)
  const uploadImageFile = async (imageFile) => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("image", imageFile);
    try {
      const res = await axios.post("http://arabcodetest.runasp.net/upload/UploadImage", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / Math.max(e.total || 1, 1)) * 100);
          setUploadProgress(prev => ({ ...prev, [imageFile.name]: pct }));
        },
      });
      // handle string or object return
      if (!res || !res.data) return null;
      return typeof res.data === "string" ? res.data : (res.data.url ?? res.data);
    } catch (err) {
      console.error("uploadImageFile failed", err);
      return null;
    }
  };

  // upload single video file (matches uploadUserVideo behavior)
  const uploadVideoFile = async (videoFile) => {
    if (!videoFile) return null;
    const formData = new FormData();
    formData.append("video", videoFile);
    try {
      const res = await axios.post("http://arabcodetest.runasp.net/upload/UploadVideo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / Math.max(e.total || 1, 1)) * 100);
          setUploadProgress(prev => ({ ...prev, [videoFile.name]: pct }));
        },
      });
      if (!res || !res.data) return null;
      return typeof res.data === "string" ? res.data : (res.data.url ?? res.data);
    } catch (err) {
      console.error("uploadVideoFile failed", err);
      return null;
    }
  };

  // --- send message including attachments ---
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newText.trim() && imageFiles.length === 0 && videoFiles.length === 0) || !selectedUser) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      // 1) Upload images in parallel
      const imagePromises = imageFiles.map(({ file }) => uploadImageFile(file));
      const uploadedImageResults = await Promise.all(imagePromises);
      const imageUrls = uploadedImageResults.filter(Boolean); // remove nulls

      // 2) Upload videos in parallel
      const videoPromises = videoFiles.map(({ file }) => uploadVideoFile(file));
      const uploadedVideoResults = await Promise.all(videoPromises);
      // create video objects required by server payload
      const videosPayload = uploadedVideoResults
        .map((resUrl, idx) => {
          if (!resUrl) return null;
          const fileName = (videoFiles[idx]?.file?.name) || `video-${Date.now()}`;
          return {
            title: fileName,
            description: "",
            url: resUrl,
            thumbnailUrl: resUrl, // if server returns separate thumbnail, adjust accordingly
          };
        })
        .filter(Boolean);

      // 3) build payload
      const payload = {
        message: newText.trim() || "",
        receiverId: selectedUser.id,
        videos: videosPayload,
        images: imageUrls,
      };

      // 4) send message
      await axios.post(
        "http://arabcodetest.runasp.net/Message/AddMessage",
        payload,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      // Clear composer & attachments (SignalR will deliver actual message)
      setNewText("");
      setImageFiles(prev => {
        prev.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
        return [];
      });
      setVideoFiles(prev => {
        prev.forEach(p => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
        return [];
      });
      setUploadProgress({});
    } catch (err) {
      console.error("Failed to send message with attachments", err);
      alert("فشل رفع/إرسال المرفقات. حاول مرة أخرى.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImgError = (e) => {
    e.currentTarget.src =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23ddd' width='100' height='100' rx='10'/><text x='50' y='55' font-size='14' text-anchor='middle' fill='%23999'>No Image</text></svg>";
  };

  // --- Media modal controls ---
  const openMedia = (src, type = "image", title = "") => {
    setMediaSrc(src);
    setMediaType(type);
    setMediaTitle(title || "");
    setMediaOpen(true);
    // lock scroll
    document.body.style.overflow = "hidden";
  };

  const closeMedia = () => {
    setMediaOpen(false);
    setMediaSrc("");
    setMediaType(null);
    setMediaTitle("");
    document.body.style.overflow = "";
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && mediaOpen) {
        closeMedia();
      }
    };
    if (mediaOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mediaOpen]);

  // --- render helpers ---
  const renderUserRow = (user) => {
    const unread = unreadMap[user.id] || 0;
    const selected = selectedUser?.id === user.id;
    const preview = user.lastMessage || user.preview || user.lastMessageText || "";
    const lastTimeDisplay = user.lastMessageTime ? formatTime(user.lastMessageTime) : "";
    return (
      <li
        key={user.id}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fetchMessages(user); }}
        onClick={() => fetchMessages(user)}
        className="user-row"
        aria-pressed={selected}
        style={{ background: selected ? "#e6f0ff" : "transparent" }}
      >
        <div className="user-avatar" aria-hidden>
          <img src={user.imageUrl || ""} alt={user.userName || "avatar"} onError={handleImgError} />
          {user.isOnline && <span className="online-dot small" />}
        </div>

        <div className="user-meta">
          <div className="name" style={{ justifyContent: "space-between", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span>{user.userName}</span>
              {user.isOnline && <small style={{ color: "#0b74ff", fontSize: 12 }}>• نشط الآن</small>}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {lastTimeDisplay && <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>{lastTimeDisplay}</div>}
              {unread > 0 && (
                <span className={`unread-badge pulse`} aria-hidden>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6 }}>
            <div className="preview">{preview}</div>
          </div>
        </div>
      </li>
    );
  };

  const renderMessage = (m) => {
    const fromMe = m.senderId === currentUserId;
    const timeIso = m.sentAt ?? m.sentOn ?? m.SentAt ?? m.createdAt ?? m.timestamp ?? null;
    const timeDisplay = formatTime(timeIso);

    // Render images/videos within message (if provided by backend)
    const images = m.images ?? [];
    const videos = m.videos ?? []; // array of objects {title, url, thumbnailUrl}

    return (
      <div
        key={m.id || `${m.senderId}-${m.receiverId}-${m.createdAt || Date.now()}`}
        className={`msg-row msg-enter`}
        style={{ justifyContent: fromMe ? "flex-end" : "flex-start" }}
      >
        <div className={`msg-bubble ${fromMe ? "msg-out" : "msg-in"}`}>
          <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: images.length || videos.length ? 8 : 0 }}>{m.message}</div>

          {images.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #eee", cursor: "pointer" }}
                  onClick={() => openMedia(imgUrl, "image", m.message || "")}
                >
                  <img src={imgUrl} alt={`img-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={handleImgError} />
                </div>
              ))}
            </div>
          )}

          {videos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexDirection: "column", marginTop: 8 }}>
              {videos.map((v, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }} onClick={() => openMedia(v.url, "video", v.title || m.message || "")}>
                  <div style={{ width: 160, height: 90, borderRadius: 8, overflow: "hidden", border: "1px solid #eee", background: "#000", flexShrink: 0 }}>
                    {/* show video thumbnail if provided, else a small poster play view */}
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={`thumb-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={handleImgError} />
                    ) : (
                      <video src={v.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#444" }}>
                    <div style={{ fontWeight: 600 }}>{v.title || "فيديو"}</div>
                    <div><a href={v.url} onClick={(ev)=>ev.preventDefault()} style={{ fontSize: 12, color: "#0b74ff" }}>تشغيل داخل النافذة</a></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7, textAlign: "right" }}>{timeDisplay}</div>
        </div>
      </div>
    );
  };

  const sortedUsers = [...users].sort((a,b) => {
    if ((a.isOnline ? 1:0) !== (b.isOnline ? 1:0)) return b.isOnline ? 1 : -1;
    const ua = unreadMap[a.id] || 0, ub = unreadMap[b.id] || 0;
    if (ua !== ub) return ub - ua;
    return 0;
  });

  return (
    <div dir={initialIsRtl ? "rtl" : "ltr"} style={{ padding: 8 }}>
      <div className="chat-wrapper" role="application" aria-label="Chat interface" style={{ direction: initialIsRtl ? "rtl" : "ltr" }}>
        {/* Users list */}
        <div className="chat-users" aria-label="Users list">
          <h3 style={{ padding: 16, margin: 0, borderBottom: "1px solid #eee" }}>المحادثات</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {loadingUsers ? (
              <div style={{ padding: 16 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div className="shimmer" style={{ width: 50, height: 50, borderRadius: "50%" }} />
                    <div style={{ flex: 1 }}>
                      <div className="shimmer" style={{ height: 12, width: "60%", borderRadius: 6, marginBottom: 6 }} />
                      <div className="shimmer" style={{ height: 10, width: "40%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedUsers.length === 0 ? (
              <p style={{ padding: 16 }}>لا توجد رسائل.</p>
            ) : (
              sortedUsers.map(renderUserRow)
            )}
          </ul>
        </div>

        {/* Chat panel */}
        <div className="chat-panel">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden" }}>
                    <img src={selectedUser.imageUrl || ""} onError={handleImgError} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={selectedUser.userName} />
                  </div>
                  <div>
                    <div className="title">{selectedUser.userName}</div>
                    <div className="status" style={{ color: "#666", fontSize: 13 }}>
                      {selectedUser.isOnline ? "نشط الآن" : (selectedUser.lastSeen ? `آخر ظهور ${new Date(selectedUser.lastSeen).toLocaleString()}` : selectedUser.email)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="messages-window" aria-live="polite" aria-label="Messages">
                {loadingMessages ? (
                  <div style={{ padding: 16 }}>
                    <div className="shimmer" style={{ height: 12, width: "40%", borderRadius: 6, marginBottom: 12 }} />
                    <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 6, marginBottom: 12 }} />
                    <div className="shimmer" style={{ height: 12, width: "50%", borderRadius: 6 }} />
                  </div>
                ) : messages.length === 0 ? (
                  <p style={{ color: "#aaa" }}>لا توجد رسائل.</p>
                ) : (
                  messages.map(renderMessage)
                )}

                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="chat-form" role="search" aria-label="Send message" style={{ marginTop: 12 }}>
                <input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="chat-input"
                  aria-label="Message text"
                  disabled={isUploading}
                />

                {/* Attach buttons */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 8, background: "#fff", border: "1px solid #eee" }}>
                    صورة
                    <input type="file" accept="image/*" multiple onChange={handleImageInput} style={{ display: "none" }} disabled={isUploading} />
                  </label>

                  <label style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 8, background: "#fff", border: "1px solid #eee" }}>
                    فيديو
                    <input type="file" accept="video/*" multiple onChange={handleVideoInput} style={{ display: "none" }} disabled={isUploading} />
                  </label>

                  <button type="submit" className="chat-send" aria-label="Send" disabled={isUploading}>
                    {isUploading ? "جارٍ الرفع..." : "إرسال"}
                  </button>
                </div>
              </form>

              {/* previews */}
              {(imageFiles.length > 0 || videoFiles.length > 0) && (
                <div className="attachments" style={{ paddingLeft: 4 }}>
                  {imageFiles.map((p, idx) => (
                    <div key={idx} className="att-thumb">
                      <img src={p.previewUrl} alt={`img-preview-${idx}`} onClick={() => openMedia(p.previewUrl, "image", p.file.name)} />
                      <div className="att-remove" title="إزالة" onClick={() => removeImage(idx)}>×</div>
                      {uploadProgress[p.file.name] != null && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                          <div className="progress-bar"><i style={{ width: `${uploadProgress[p.file.name]}%` }} /></div>
                        </div>
                      )}
                    </div>
                  ))}

                  {videoFiles.map((p, idx) => (
                    <div key={idx} className="att-thumb">
                      <video src={p.previewUrl} onClick={() => openMedia(p.previewUrl, "video", p.file.name)} />
                      <div className="att-remove" title="إزالة" onClick={() => removeVideo(idx)}>×</div>
                      {uploadProgress[p.file.name] != null && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                          <div className="progress-bar"><i style={{ width: `${uploadProgress[p.file.name]}%` }} /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "#666" }}>
                <h3 style={{ margin: 0 }}>اختر مستخدمًا من القائمة لعرض المحادثة</h3>
                <p style={{ marginTop: 8 }}>القائمة تعرض من هم نشطون وعدد الرسائل غير المقروءة</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Modal / Lightbox */}
      {mediaOpen && (
        <div className="media-modal" role="dialog" aria-modal="true" onClick={(e) => {
          // close if click on backdrop (not on content)
          if (e.target === e.currentTarget) closeMedia();
        }}>
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="media-modal-close" aria-label="Close" onClick={closeMedia}>×</button>

            {mediaType === "image" ? (
              <img src={mediaSrc} alt={mediaTitle || "image"} onClick={(e)=>e.stopPropagation()} onError={handleImgError} />
            ) : mediaType === "video" ? (
              <video src={mediaSrc} controls autoPlay onClick={(e)=>e.stopPropagation()} />
            ) : null}

            {mediaTitle && <div className="media-modal-caption">{mediaTitle}</div>}
          </div>
        </div>
      )}
    </div>
  );
}