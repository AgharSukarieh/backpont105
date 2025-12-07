import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import api from "../../../Service/api";

/**
 * InlineEditor - local editor component to avoid parent re-renders stealing focus.
 * Keeps its own local state and calls onSave(text) only when saving.
 */
const InlineEditor = ({ initialValue = "", onSave, onCancel, loading = false, placeholder = "اكتب التعديل..." }) => {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.focus();
      try {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch {}
    }
  }, []);

  useEffect(() => {
    // if parent updates initialValue while editor open, keep it in sync
    setValue(initialValue);
  }, [initialValue]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSave && onSave(value);
    }
  };

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        className="w-full p-2 border rounded-md text-sm"
        placeholder={placeholder}
        disabled={loading}
      />
      <div className="mt-2 flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
          disabled={loading}
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={() => onSave && onSave(value)}
          className={`px-3 py-1 rounded-md text-white ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          disabled={loading}
        >
          {loading ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>
    </div>
  );
};

const PostDetails = () => {
  const { id } = useParams(); // path param from route /posts/:id
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeState, setLikeState] = useState({ count: 0, isLiked: false });
  const [pending, setPending] = useState(false);

  const [playingVideos, setPlayingVideos] = useState({}); // { [videoId]: true }

  // replies state: { [parentCommentId]: { loading, error, items: [], open } }
  const [replies, setReplies] = useState({});

  // reply form states
  const [replyInputs, setReplyInputs] = useState({});
  const [replySending, setReplySending] = useState({});
  const [replyError, setReplyError] = useState({});

  // top-level add comment form state
  const [showAddTopForm, setShowAddTopForm] = useState(false);
  const [topInput, setTopInput] = useState("");
  const [topSending, setTopSending] = useState(false);
  const [topError, setTopError] = useState(null);

  // edit/delete states
  const [editOpen, setEditOpen] = useState({}); // { [commentId]: true }
  const [editSending, setEditSending] = useState({});
  const [editError, setEditError] = useState({});

  // delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, comment: null, loading: false });

  // likes modal state
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likes, setLikes] = useState([]);
  const [likesError, setLikesError] = useState(null);

  // image lightbox state
  const [imageModal, setImageModal] = useState({ open: false, index: 0 });

  // refs to keep focus and caret position stable for reply textareas
  const replyRefs = useRef({}); // { [parentId]: HTMLElement }
  const caretPositions = useRef({}); // { [parentId]: number }

  const getUserId = () => {
    const v = localStorage.getItem("idUser");
    if (!v || v === "null") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const getUserName = () => localStorage.getItem("userName") || "أنت";
  const getUserImage = () => localStorage.getItem("userImage") || null;

  const currentUserId = getUserId();

  const isLikedFromApi = (val) => val === 0 || val === "0";

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Post/GetById/${id}`);
      const p = res.data;
      const numberLike = Number(p.numberLike ?? 0);

      setPost(p);
      setLikeState({
        count: numberLike,
        isLiked: isLikedFromApi(p.isLikedIt),
      });
    } catch (err) {
      console.error("Failed to fetch post:", err?.response ?? err);
      alert("فشل جلب بيانات البوست. افتح الـ Console للمزيد من التفاصيل.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleLike = async () => {
    if (pending) return;
    const userId = getUserId();
    if (!userId) {
      alert("لم أجد idUser في localStorage. سجّل الدخول أو خزّن idUser.");
      return;
    }

    const prevLikeState = { ...likeState };
    const willBeLiked = !prevLikeState.isLiked;
    const newCount = Math.max(prevLikeState.count + (willBeLiked ? 1 : -1), 0);

    setLikeState({
      count: newCount,
      isLiked: willBeLiked,
    });
    setPost((prev) =>
      prev
        ? {
            ...prev,
            numberLike: newCount,
            isLikedIt: willBeLiked ? 0 : null,
          }
        : prev
    );

    setPending(true);

    try {
      if (willBeLiked) {
        await api.post("/PostLike/Add", null, {
          params: { postID: Number(id), UserId: Number(userId) },
        });
      } else {
        await api.delete("/PostLike/Remove", {
          params: { postID: Number(id), UserId: Number(userId) },
        });
      }

      await fetchPost();
    } catch (err) {
      console.error("Like API error:", err?.response ?? err);
      setLikeState(prevLikeState);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              numberLike: prevLikeState.count,
              isLikedIt: prevLikeState.isLiked ? 0 : null,
            }
          : prev
      );
      alert("فشل تحديث اللايك. افتح Console للمزيد من التفاصيل.");
    } finally {
      setPending(false);
    }
  };

  const playVideo = (videoId) => {
    setPlayingVideos((p) => ({ ...p, [videoId]: true }));
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const sanitizeHtml = (dirty) =>
    DOMPurify.sanitize(dirty ?? "", {
      ALLOWED_TAGS: [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "span",
        "h1",
        "h2",
        "h3",
        "h4",
        "img",
        "code",
        "pre",
        "blockquote",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title"],
    });

  // helper: recursively mark hasChild on the comment tree inside post.comments
  const markCommentHasChild = (comments = [], parentId) => {
    if (!Array.isArray(comments)) return comments;
    return comments.map((c) => {
      if (c.id === parentId) {
        return { ...c, hasChild: true };
      }
      const newC = { ...c };
      if (Array.isArray(newC.children) && newC.children.length > 0) {
        newC.children = markCommentHasChild(newC.children, parentId);
      }
      if (Array.isArray(newC.replies) && newC.replies.length > 0) {
        newC.replies = markCommentHasChild(newC.replies, parentId);
      }
      return newC;
    });
  };

  // helper to replace a comment anywhere inside post.comments recursively
  const replaceCommentInPost = (comments = [], targetId, replacer) => {
    if (!Array.isArray(comments)) return comments;
    return comments.map((c) => {
      if (c.id === targetId) return replacer(c);
      const copy = { ...c };
      if (Array.isArray(copy.children)) copy.children = replaceCommentInPost(copy.children, targetId, replacer);
      if (Array.isArray(copy.replies)) copy.replies = replaceCommentInPost(copy.replies, targetId, replacer);
      return copy;
    });
  };

  // helper to remove a comment anywhere inside post.comments recursively
  const removeCommentFromPost = (comments = [], targetId) => {
    if (!Array.isArray(comments)) return comments;
    return comments
      .map((c) => {
        const copy = { ...c };
        if (Array.isArray(copy.children)) copy.children = removeCommentFromPost(copy.children, targetId);
        if (Array.isArray(copy.replies)) copy.replies = removeCommentFromPost(copy.replies, targetId);
        return copy;
      })
      .filter((c) => c.id !== targetId);
  };

  // helpers to update replies state (search and replace/delete inside every replies[parentId].items)
  const replaceCommentInReplies = (targetId, replacer) => {
    setReplies((r) => {
      const next = { ...(r || {}) };
      Object.keys(next).forEach((parentId) => {
        const st = next[parentId];
        if (!st || !Array.isArray(st.items)) return;
        next[parentId] = { ...st, items: st.items.map((it) => (it.id === targetId ? replacer(it) : it)) };
      });
      return next;
    });
  };

  const removeCommentFromReplies = (targetId) => {
    setReplies((r) => {
      const next = { ...(r || {}) };
      Object.keys(next).forEach((parentId) => {
        const st = next[parentId];
        if (!st || !Array.isArray(st.items)) return;
        next[parentId] = { ...st, items: st.items.filter((it) => it.id !== targetId) };
      });
      return next;
    });
  };

  // Fetch children for any parentId (toggle). If returned items.length > 0 mark parent hasChild in post.
  const fetchRepliesForParent = async (parentId) => {
    const state = replies[parentId];
    if (state && state.open) {
      // close if already open
      setReplies((r) => ({ ...r, [parentId]: { ...state, open: false } }));
      return;
    }
    if (state && !state.loading && Array.isArray(state.items) && state.items.length > 0) {
      // already loaded -> open
      setReplies((r) => ({ ...r, [parentId]: { ...state, open: true } }));
      return;
    }

    // set loading state
    setReplies((r) => ({
      ...(r || {}),
      [parentId]: { loading: true, error: null, items: state?.items ?? [], open: true },
    }));

    try {
      const res = await api.get(`/Comment/GetChildrenComment`, { params: { parentId } });
      const items = Array.isArray(res.data) ? res.data : [];

      // store children; note: each child may include hasChild.
      setReplies((r) => ({ ...r, [parentId]: { loading: false, error: null, items, open: true } }));

      // if API returned actual children, mark parent in post.comments so the toggle stays available later
      if (items.length > 0) {
        setPost((p) => (p ? { ...p, comments: markCommentHasChild(p.comments ?? [], Number(parentId)) } : p));
      }
    } catch (err) {
      console.error("Failed to fetch replies for comment", parentId, err?.response ?? err);
      setReplies((r) => ({
        ...r,
        [parentId]: {
          loading: false,
          error: "فشل جلب التعليقات الفرعية.",
          items: [],
          open: false,
        },
      }));
    }
  };

  // open reply form and focus the textarea
  const openReplyForm = (parentId) => {
    setReplyInputs((r) => ({ ...(r || {}), [parentId]: r?.[parentId] ?? "" }));
    // ensure replies entry exists and is open (so toggle shows and nested replies can render)
    setReplies((r) => ({
      ...(r || {}),
      [parentId]: {
        loading: r?.[parentId]?.loading ?? false,
        error: r?.[parentId]?.error ?? null,
        items: r?.[parentId]?.items ?? [],
        open: true,
      },
    }));

    // focus the textarea on next tick (it may not be mounted synchronously)
    setTimeout(() => {
      const el = replyRefs.current[parentId];
      if (el) {
        el.focus();
        // move caret to end
        const len = el.value?.length ?? 0;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    }, 0);
  };

  const closeReplyForm = (parentId) => {
    setReplyInputs((r) => {
      const next = { ...(r || {}) };
      delete next[parentId];
      return next;
    });
    setReplyError((e) => {
      const next = { ...(e || {}) };
      delete next[parentId];
      return next;
    });
    // clean up caret/ref
    delete caretPositions.current[parentId];
    delete replyRefs.current[parentId];
  };

  // submit reply and update UI immediately with created object (or with a constructed temporary object)
  const submitReply = async (parentId) => {
    const text = (replyInputs[parentId] || "").trim();
    if (!text) {
      setReplyError((e) => ({ ...(e || {}), [parentId]: "اكتب نص الرد أولاً." }));
      return;
    }
    const userId = getUserId();
    if (!userId) {
      alert("لم أجد idUser في localStorage. سجّل الدخول أو خزّن idUser.");
      return;
    }

    setReplyError((e) => ({ ...(e || {}), [parentId]: null }));
    setReplySending((s) => ({ ...(s || {}), [parentId]: true }));

    const payload = {
      text,
      createdAt: new Date().toISOString(),
      postId: post?.id ?? Number(id),
      userId: Number(userId),
      parentCommentId: Number(parentId),
    };

    // Optimistic UI: create a temporary entry immediately (will be replaced if server returns real object)
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text: payload.text,
      createdAt: payload.createdAt,
      postId: payload.postId,
      userId: payload.userId,
      hasChild: false,
      userName: getUserName(),
      imageURL: getUserImage(),
      parentCommentId: payload.parentCommentId,
    };

    // Ensure replies[parentId] exists and append optimistic item
    setReplies((r) => {
      const prev = r?.[parentId];
      const items = prev && Array.isArray(prev.items) ? [...prev.items, optimistic] : [optimistic];
      return { ...(r || {}), [parentId]: { loading: false, error: null, items, open: true } };
    });

    // Also, if it's a top-level comment (parentId === 0) append to post.comments immediately
    if (Number(parentId) === 0) {
      setPost((p) => (p ? { ...p, comments: [...(p.comments || []), optimistic] } : p));
      // clear top form if present
      setTopInput("");
      setShowAddTopForm(false);
    }

    try {
      const res = await api.post("/Comment/Add", payload);
      const created = res?.data;

      // If server returned an object with id, replace the temporary one with server object (merge missing fields)
      if (created && created.id) {
        // replace in replies
        replaceCommentInReplies(tempId, () => ({ ...created }));
        // replace in post.comments (top-level) if exists
        setPost((p) => {
          if (!p) return p;
          return {
            ...p,
            comments: (p.comments || []).map((c) => (c.id === tempId ? created : c)),
          };
        });
      } else {
        // server did not return created object -> re-fetch replies for parent to be safe
        await fetchRepliesForParent(parentId);
      }

      // mark parent hasChild in post.comments
      setPost((p) => (p ? { ...p, comments: markCommentHasChild(p.comments ?? [], Number(parentId)) } : p));

      // clear reply box for non-top (we already cleared top)
      if (Number(parentId) !== 0) {
        setReplyInputs((r) => {
          const next = { ...(r || {}) };
          delete next[parentId];
          return next;
        });
      }
      setReplyError((e) => {
        const next = { ...(e || {}) };
        delete next[parentId];
        return next;
      });

      delete caretPositions.current[parentId];
    } catch (err) {
      console.error("Failed to post reply:", err?.response ?? err);

      // remove optimistic item on failure and show error
      setReplies((r) => {
        const state = r[parentId] ?? { items: [] };
        const items = (state.items || []).filter((it) => String(it.id).startsWith("tmp-") === false);
        return { ...r, [parentId]: { ...state, items, open: true } };
      });

      // also remove from top-level if we appended
      if (Number(parentId) === 0) {
        setPost((p) => (p ? { ...p, comments: (p.comments || []).filter((c) => !String(c.id).startsWith("tmp-")) } : p));
        setTopError("فشل إضافة التعليق.");
      } else {
        setReplyError((e) => ({ ...(e || {}), [parentId]: "فشل إرسال الرد." }));
      }
    } finally {
      setReplySending((s) => ({ ...(s || {}), [parentId]: false }));
    }
  };

  // === Add top-level comment convenience wrapper (uses parentId = 0) ===
  const submitTopLevelComment = async () => {
    if (!post) return;
    // parentId = 0 for top-level as requested
    const parentId = 0;
    const text = (topInput || "").trim();
    if (!text) {
      setTopError("اكتب نص التعليق أولاً.");
      return;
    }
    setTopError(null);
    setTopSending(true);

    const userId = getUserId();
    if (!userId) {
      alert("لم أجد idUser في localStorage. سجّل الدخول أو خزّن idUser.");
      setTopSending(false);
      return;
    }

    const payload = {
      text,
      createdAt: new Date().toISOString(),
      postId: post?.id ?? Number(id),
      userId: Number(userId),
      parentCommentId: Number(parentId),
    };

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text: payload.text,
      createdAt: payload.createdAt,
      postId: payload.postId,
      userId: payload.userId,
      hasChild: false,
      userName: getUserName(),
      imageURL: getUserImage(),
      parentCommentId: payload.parentCommentId,
    };

    // append optimistic to post.comments
    setPost((p) => (p ? { ...p, comments: [...(p.comments || []), optimistic] } : p));
    setTopInput("");
    setShowAddTopForm(false);

    try {
      const res = await api.post("/Comment/Add", payload);
      const created = res?.data;

      if (created && created.id) {
        // replace temp in post.comments
        setPost((p) => {
          if (!p) return p;
          return { ...p, comments: (p.comments || []).map((c) => (c.id === tempId ? created : c)) };
        });
      } else {
        // fallback: re-fetch
        await fetchPost();
      }
    } catch (err) {
      console.error("Failed to post top-level comment:", err?.response ?? err);
      // remove optimistic
      setPost((p) => (p ? { ...p, comments: (p.comments || []).filter((c) => !String(c.id).startsWith("tmp-")) } : p));
      setTopError("فشل إضافة التعليق.");
    } finally {
      setTopSending(false);
    }
  };

  // === Edit comment using InlineEditor to avoid losing focus on each keystroke ===
  const openEdit = (comment) => {
    setEditOpen((e) => ({ ...(e || {}), [comment.id]: true }));
    setEditError((e) => ({ ...(e || {}), [comment.id]: null }));
  };

  const closeEdit = (commentId) => {
    setEditOpen((e) => {
      const next = { ...(e || {}) };
      delete next[commentId];
      return next;
    });
    setEditError((e) => {
      const next = { ...(e || {}) };
      delete next[commentId];
      return next;
    });
  };

  // submitEditWithText: accept the new text directly from InlineEditor (local state there)
  const submitEditWithText = async (commentId, newText) => {
    const text = (newText || "").trim();
    if (!text) {
      setEditError((e) => ({ ...(e || {}), [commentId]: "اكتب نص التعديل أولاً." }));
      return;
    }
    setEditError((e) => ({ ...(e || {}), [commentId]: null }));
    setEditSending((s) => ({ ...(s || {}), [commentId]: true }));

    // Optimistic update in UI immediately
    replaceCommentInReplies(commentId, (orig) => ({ ...orig, text, createdAt: new Date().toISOString() }));
    setPost((p) => (p ? { ...p, comments: replaceCommentInPost(p.comments ?? [], commentId, (orig) => ({ ...orig, text, createdAt: new Date().toISOString() })) } : p));

    try {
      // Use the API provided: PUT /Comment/UpdateComment with CommentId and Text as query params
      await api.put("/Comment/UpdateComment", null, { params: { CommentId: Number(commentId), Text: text } });

      // on success, close edit
      closeEdit(commentId);
    } catch (err) {
      console.error("Failed to update comment:", err?.response ?? err);
      setEditError((e) => ({ ...(e || {}), [commentId]: "فشل تحديث التعليق." }));
      // revert by re-fetching post to be safe
      await fetchPost();
    } finally {
      setEditSending((s) => ({ ...(s || {}), [commentId]: false }));
    }
  };

  // === Delete comment flow: open modal -> confirm -> call API (id param) ===
  const openDeleteConfirm = (comment) => {
    setDeleteConfirm({ open: true, comment, loading: false });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, comment: null, loading: false });
  };

  const confirmDelete = async () => {
    const comment = deleteConfirm.comment;
    if (!comment) return;
    setDeleteConfirm((d) => ({ ...d, loading: true }));

    // optimistic remove from UI
    removeCommentFromReplies(comment.id);
    setPost((p) => (p ? { ...p, comments: removeCommentFromPost(p.comments ?? [], comment.id) } : p));

    try {
      // call delete endpoint: DELETE /Comment/Remove?id=<id>
      await api.delete("/Comment/Remove", { params: { id: Number(comment.id) } });

      // success -> close modal
      closeDeleteConfirm();
    } catch (err) {
      console.error("Failed to delete comment:", err?.response ?? err);
      alert("فشل حذف التعليق. تتم إعادة جلب البيانات لإعادة الحالة.");

      // re-fetch to restore correct state
      await fetchPost();
      // also clear replies cache to force reload if needed
      setReplies({});
      closeDeleteConfirm();
    }
  };

  // === Likes modal functions ===
  const openLikesModal = async () => {
    setLikesModalOpen(true);
    // fetch likes if not already fetched (or refetch each open if you prefer)
    await fetchLikes();
  };

  const closeLikesModal = () => {
    setLikesModalOpen(false);
    setLikesError(null);
    // keep likes list cached; clear if you prefer fresh fetch each time
  };

  const fetchLikes = async () => {
    if (!post && !id) return;
    setLikesLoading(true);
    setLikesError(null);
    try {
      const postID = Number(post?.id ?? id);
      const res = await api.get("/PostLike/GetUserLikedPost", { params: { postID } });
      const items = Array.isArray(res.data) ? res.data : [];
      setLikes(items);
    } catch (err) {
      console.error("Failed to fetch likes list:", err?.response ?? err);
      setLikesError("فشل جلب قائمة المعجبين.");
      setLikes([]);
    } finally {
      setLikesLoading(false);
    }
  };

  // ---------- Image lightbox handlers ----------
  // Extract image urls from post.images safely (post.images may be array of strings or objects)
  const getPostImageUrls = () => {
    if (!post?.images) return [];
    return post.images.map((it) => {
      if (!it) return "";
      if (typeof it === "string") return it;
      // if object, try common fields
      return it.url || it.image || it.src || "";
    }).filter(Boolean);
  };

  const openImageModal = (index) => {
    setImageModal({ open: true, index });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, index: 0 });
  };

  const showNextImage = (e) => {
    e && e.stopPropagation();
    const imgs = getPostImageUrls();
    setImageModal((s) => ({ ...s, index: Math.min(s.index + 1, imgs.length - 1) }));
  };

  const showPrevImage = (e) => {
    e && e.stopPropagation();
    setImageModal((s) => ({ ...s, index: Math.max(s.index - 1, 0) }));
  };

  // keyboard navigation for lightbox
  useEffect(() => {
    if (!imageModal.open) return;
    const onKey = (ev) => {
      if (ev.key === "Escape") closeImageModal();
      if (ev.key === "ArrowRight") {
        const imgs = getPostImageUrls();
        setImageModal((s) => ({ ...s, index: Math.min(s.index + 1, imgs.length - 1) }));
      }
      if (ev.key === "ArrowLeft") {
        setImageModal((s) => ({ ...s, index: Math.max(s.index - 1, 0) }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageModal.open, post]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Loading...
      </div>
    );

  if (!post)
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">لم يتم إيجاد البوست.</p>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 rounded-md"
          >
            رجوع
          </button>
        </div>
      </div>
    );

  const safeContentHtml = sanitizeHtml(post.content ?? "");
  const postImageUrls = getPostImageUrls();

  // Render single comment (recursive)
  const CommentItem = ({ comment, level = 0 }) => {
    const rState = replies[comment.id] ?? { loading: false, error: null, items: [], open: false };
    const children = rState.items ?? [];

    // SHOW toggle only if there are actually children:
    const shouldShowToggle =
      comment.hasChild === true ||
      (replies[comment.id] && Array.isArray(replies[comment.id].items) && replies[comment.id].items.length > 0);

    const isAuthor = currentUserId && Number(comment.userId) === Number(currentUserId);

    // Layout note:
    // We keep a consistent left area for the date so it appears always top-left and not "shrunk" visually.
    // The container has display:flex; avatar then content. Content has a fixed padding-left where date sits absolute.
    return (
      <div className="flex gap-3 items-start" style={{ marginLeft: level * 20 }}>
        <div onClick={()=>navigate(`/react-app/profile/${comment.userId}`)} className={`${level === 0 ? "w-10 h-10" : "w-8 h-8"} cursor-pointer `}>
          {comment.imageURL ? (
            <img
              src={comment.imageURL}
              alt={comment.userName || "user"}
              className={`${level === 0 ? "w-10 h-10" : "w-8 h-8"} rounded-full object-cover`}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className={`${level === 0 ? "w-10 h-10" : "w-8 h-8"} rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold`}>
              {comment.userName
                ?.split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("") || ""}
            </div>
          )}
        </div>

        <div className="flex-1 relative" style={{ paddingLeft: 56 }}>
          {/* date fixed top-left inside this content box */}
          <div
            className="text-xs text-gray-400"
            style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}
          >
            <div>{comment.createdAt ? formatDate(comment.createdAt) : ""}</div>
            {/* show comment-specific views if present (rare), otherwise nothing */}
            {comment.Views !== undefined && (
              <div className="text-xs text-gray-400 mt-1">{comment.Views} مشاهدات</div>
            )}
          </div>

          <div onClick={()=>navigate(`/react-app/profile/${comment.userId}`)} className="text-sm cursor-pointer font-medium text-gray-900 text-right pr-12">
            {comment.userName || "Unknown"}
          </div>

          {/* edit mode: use InlineEditor so typing doesn't lose focus */}
          {editOpen[comment.id] ? (
            <div className="mt-1">
              <InlineEditor
                initialValue={comment.text ?? ""}
                loading={!!editSending[comment.id]}
                onCancel={() => closeEdit(comment.id)}
                onSave={(text) => submitEditWithText(comment.id, text)}
                placeholder="عدّل تعليقك هنا..."
              />
              {editError[comment.id] && <div className="text-xs text-red-500 mt-1">{editError[comment.id]}</div>}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 mt-1">{comment.text}</p>

              <div className="mt-2 flex items-center gap-3">
                {shouldShowToggle && (
                  <button
                    onClick={() => fetchRepliesForParent(comment.id)}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    {rState.open ? "إخفاء التعليقات" : "عرض التعليقات"}
                  </button>
                )}

                <button
                  onClick={() => openReplyForm(comment.id)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  رد
                </button>

                {isAuthor && (
                  <>
                    <button
                      onClick={() => openEdit(comment)}
                      className="text-sm text-yellow-600 hover:underline"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => openDeleteConfirm(comment)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {replyInputs[comment.id] !== undefined && !editOpen[comment.id] && (
            <div className="mt-3 ml-0">
              <textarea
                ref={(el) => {
                  if (el) replyRefs.current[comment.id] = el;
                  else delete replyRefs.current[comment.id];
                }}
                value={replyInputs[comment.id]}
                onChange={(e) => {
                  // save caret position before updating state
                  caretPositions.current[comment.id] = e.target.selectionStart;
                  setReplyInputs((r) => ({ ...(r || {}), [comment.id]: e.target.value }));

                  // after state update, restore focus and caret
                  requestAnimationFrame(() => {
                    const el = replyRefs.current[comment.id];
                    const pos = caretPositions.current[comment.id] ?? null;
                    if (el) {
                      el.focus();
                      if (typeof pos === "number") {
                        try {
                          el.setSelectionRange(pos, pos);
                        } catch {}
                      }
                    }
                  });
                }}
                rows={3}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="اكتب ردك هنا..."
              />
              {replyError[comment.id] && (
                <div className="text-xs text-red-500 mt-1">{replyError[comment.id]}</div>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => submitReply(comment.id)}
                  disabled={!!replySending[comment.id]}
                  className={`px-3 py-1 text-sm rounded-md text-white ${
                    replySending[comment.id] ? "bg-gray-400" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {replySending[comment.id] ? "جاري الإرسال..." : "إرسال الرد"}
                </button>

                <button
                  onClick={() => closeReplyForm(comment.id)}
                  disabled={!!replySending[comment.id]}
                  className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {rState.open && (
            <div className="mt-3 space-y-3">
              {rState.loading && <div className="text-sm text-gray-500">جاري تحميل التعليقات...</div>}
              {rState.error && <div className="text-sm text-red-500">{rState.error}</div>}
              {!rState.loading && (children.length === 0) && (
                <div className="text-sm text-gray-500">لا توجد تعليقات فرعية.</div>
              )}

              {(children ?? []).map((rc) => (
                <CommentItem key={rc.id} comment={rc} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-600 hover:text-gray-800 mb-4"
      >
        ← رجوع
      </button>

      <article className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <header className="flex items-center gap-4">
          <div onClick={()=>navigate(`/react-app/profile/${localStorage.getItem("idUser")}`)} className="w-14 h-14 cursor-pointer relative flex-shrink-0">
            {post.imageURL ? (
              <img
                src={post.imageURL}
                alt={post.userName || "user"}
                className="w-14 h-14 rounded-full object-cover shadow-sm"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-sm">
                {post.userName
                  ?.split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("") || ""}
              </div>
            )}
          </div>

          <div className="flex-1 relative" style={{ paddingLeft: 56 }}>
            <div
              className="text-xs text-gray-400"
              style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}
            >
              <div>{formatDate(post.createdAt)}</div>
              {/* show Views (property name from API is "Views") */}
              <div className="text-xs text-gray-400 mt-1">{(post.Views ?? post.views ?? 0)} مشاهدات</div>
            </div>
            <div onClick={()=>navigate(`/react-app/profile/${localStorage.getItem("idUser")}`)} className="text-sm cursor-pointer font-medium text-gray-900 text-right pr-12">{post.userName || "Unknown"}</div>
          </div>
        </header>

        <div className="mt-4">
          {post.title && (
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {post.title}
            </h1>
          )}

          <div
            className="text-gray-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: safeContentHtml }}
          />
        </div>

        {post.images?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 mt-4">
            {post.images.map((img, idx) => {
              // compute src robustly (could be string or object)
              const src = typeof img === "string" ? img : img.url || img.image || img.src || "";
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`post-${post.id}-img-${idx}`}
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-md cursor-pointer"
                  onClick={() => openImageModal(idx)}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              );
            })}
          </div>
        )}

        {post.videos?.length > 0 && (
          <div className="space-y-4 mt-4">
            {post.videos.map((v, idx) => {
              const vidId = v.id ?? `video-${idx}`;
              const isPlaying = !!playingVideos[vidId];
              const thumb = v.thumbnailUrl || v.thumbnail || "";
              return (
                <div key={vidId} className="relative">
                  {isPlaying ? (
                    <video
                      controls
                      autoPlay
                      poster={thumb || undefined}
                      className="w-full rounded-md bg-black"
                    >
                      <source src={v.url} />
                      متصفحك لا يدعم عرض الفيديو.
                    </video>
                  ) : (
                    <button
                      onClick={() => playVideo(vidId)}
                      className="w-full rounded-md overflow-hidden relative focus:outline-none"
                      aria-label="Play video"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={v.title || `video-${vidId}`}
                          loading="lazy"
                          className="w-full h-56 object-cover rounded-md"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="w-full h-56 bg-black/70 rounded-md flex items-center justify-center text-white">
                          ▶
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 rounded-full p-3">
                          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )}

                  {v.title && <div className="mt-2 text-sm font-medium text-gray-800">{v.title}</div>}
                </div>
              );
            })}
          </div>
        )}

        {post.postTags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.postTags.map((t) => (
              <span
                key={t.id}
                onClick={()=>navigate(`/react-app/Algorithms/${t.id}`)}
                className="text-xs cursor-pointer bg-sky-50 text-sky-700 px-2 py-1 rounded-full border border-sky-100"
              >
                #{t.tagName}
              </span>
            ))}
          </div>
        )}

        <footer className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLike}
              disabled={pending}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                likeState.isLiked
                  ? "bg-gradient-to-r from-pink-100 to-orange-100 text-pink-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
              aria-pressed={likeState.isLiked}
            >
              <span className="text-lg">{likeState.isLiked ? "♥" : "♡"}</span>
              <span>{likeState.count}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {post.numberLike ?? 0} إعجاب • {(post.Views ?? post.views ?? 0)} مشاهدة
            </div>

            {/* Button to open likes modal */}
            <button
              onClick={openLikesModal}
              className="px-3 py-1 text-sm rounded-md bg-white border border-gray-200 hover:bg-gray-50"
            >
              عرض المعجبين
            </button>
          </div>
        </footer>
      </article>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">التعليقات</h3>

          {/* Top-level add button */}
          <div>
            <button
              onClick={() => setShowAddTopForm((s) => !s)}
              className="px-3 py-1 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700"
            >
              إضافة تعليق
            </button>
          </div>
        </div>

        {showAddTopForm && (
          <div className="mb-4">
            <textarea
              value={topInput}
              onChange={(e) => setTopInput(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md text-sm mb-2"
              placeholder="اكتب تعليقك هنا..."
            />
            {topError && <div className="text-xs text-red-500 mb-2">{topError}</div>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setTopInput(""); setShowAddTopForm(false); }}
                className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                disabled={topSending}
              >
                إلغاء
              </button>
              <button
                onClick={submitTopLevelComment}
                className={`px-3 py-1 rounded-md text-white ${topSending ? "bg-gray-400" : "bg-sky-600 hover:bg-sky-700"}`}
                disabled={topSending}
              >
                {topSending ? "جاري الإرسال..." : "إضافة تعليق"}
              </button>
            </div>
          </div>
        )}

        {(!post.comments || post.comments.length === 0) && (
          <p className="text-gray-500">لا توجد تعليقات بعد.</p>
        )}

        <div className="space-y-4">
          {(post.comments ?? []).map((c) => (
            <CommentItem key={c.id} comment={c} level={0} />
          ))}
        </div>
      </section>

      {/* Image fullscreen modal / lightbox */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeImageModal}>
          <div className="absolute inset-0 bg-black/80" />

          <div
            className="relative z-10 max-w-full max-h-full p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev button */}
            <button
              onClick={showPrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/50 rounded-full p-2"
              aria-label="Previous image"
            >
              ‹
            </button>

            <img
              src={postImageUrls[imageModal.index]}
              alt={`image-${imageModal.index}`}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-lg"
            />

            {/* Next button */}
            <button
              onClick={showNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/50 rounded-full p-2"
              aria-label="Next image"
            >
              ›
            </button>

            {/* Close */}
            <button
              onClick={closeImageModal}
              className="absolute right-4 top-4 text-white bg-black/40 hover:bg-black/50 rounded-full p-1"
              aria-label="Close image"
            >
              ✕
            </button>

            {/* caption / index */}
            {postImageUrls.length > 1 && (
              <div className="absolute bottom-6 text-sm text-white bg-black/40 px-3 py-1 rounded-md">
                {imageModal.index + 1} / {postImageUrls.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Likes modal (blurred backdrop) */}
      {likesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* blurred + dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!likesLoading) closeLikesModal(); }}
          />

          <div className="z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-medium">معجبو البوست</h3>
              <button
                onClick={() => closeLikesModal()}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close likes modal"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-auto">
              {likesLoading && <div className="text-center text-gray-500">جاري جلب المعجبين...</div>}
              {likesError && <div className="text-sm text-red-500">{likesError}</div>}

              {!likesLoading && !likesError && likes.length === 0 && (
                <div className="text-sm text-gray-500">لا يوجد معجبين بعد.</div>
              )}

              {!likesLoading && (likes || []).length > 0 && (
                <ul className="space-y-3">
                  {likes.map((u) => (
                    <li key={u.id ?? `${u.userId}-${u.userName}`} className="flex items-center gap-3">
                      {u.imageURL ? (
                        <img src={u.imageURL} alt={u.userName || "user"} className="w-10 h-10 rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {(u.userName || "")
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="text-sm font-medium">{u.userName || u.name || "Unknown"}</div>
                        {u.userTitle && <div className="text-xs text-gray-400">{u.userTitle}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-3 border-t flex justify-end">
              <button onClick={() => closeLikesModal()} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!deleteConfirm.loading) closeDeleteConfirm(); }}
          />
          <div className="bg-white rounded-lg p-6 z-10 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-700 mb-4">هل أنت متأكد أنك تريد حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => closeDeleteConfirm()}
                disabled={deleteConfirm.loading}
                className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                إلغاء
              </button>

              <button
                onClick={() => confirmDelete()}
                disabled={deleteConfirm.loading}
                className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                {deleteConfirm.loading ? "جاري الحذف..." : "حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;