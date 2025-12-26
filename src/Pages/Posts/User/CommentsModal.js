import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../../store/authSlice";
import DOMPurify from "dompurify";
import { 
  getPostWithComments, 
  createComment, 
  getCommentReplies,
  checkCommentLikeStatus,
  likeComment,
  unlikeComment,
  getCommentLikedUsers
} from "../../../Service/commentService";
import { likePost, unlikePost } from "../../../Service/likeService";

const CommentsModal = ({ postId, onClose, onCommentCountChanged }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [likeState, setLikeState] = useState({ count: 0, isLiked: false });
  const [pendingLike, setPendingLike] = useState(false);
  
  // Reply states
  const [replyingToCommentId, setReplyingToCommentId] = useState(null); // Can be main comment or reply ID
  const [replyTexts, setReplyTexts] = useState({}); // { commentId: "text" }
  const [sendingReplies, setSendingReplies] = useState({}); // { commentId: true/false }
  const [repliesByCommentId, setRepliesByCommentId] = useState({}); // { commentId: [replies] } - works for both main comments and nested replies
  const [replyCounts, setReplyCounts] = useState({}); // { commentId: count }
  const [expandedComments, setExpandedComments] = useState(new Set()); // Set of IDs (can be main comment or reply)
  const [loadingReplies, setLoadingReplies] = useState(new Set());
  
  // Comment likes state
  const [commentLikes, setCommentLikes] = useState({}); // { commentId: { isLiked: boolean, count: number, pending: boolean } }
  const [commentLikedUsers, setCommentLikedUsers] = useState({}); // { commentId: [users] }
  const [showLikedUsersModal, setShowLikedUsersModal] = useState(null); // commentId or null
  const [loadingLikedUsers, setLoadingLikedUsers] = useState(false);
  const longPressTimerRef = useRef(null);
  
  const commentsEndRef = useRef(null);
  const navigate = useNavigate();
  
  const session = useSelector(selectAuthSession);
  const user = session?.responseUserDTO;
  
  const getUserId = () => {
    const v = localStorage.getItem("idUser");
    return v ? Number(v) : null;
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("ar-EG");
    } catch {
      return iso;
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  };

  const sanitizeHtml = (dirty) => {
    if (!dirty) return "";
    return DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
    });
  };

  const parseIsLiked = (val) => {
    if (val === true || val === 1 || val === "true" || val === "1") return true;
    return false;
  };

  const stop = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
  };

  // Render media grid function
  const renderMediaGrid = (post) => {
    const images = post.images ?? [];
    const videos = post.videos ?? [];
    const media = [];

    images.forEach((url) => media.push({ type: "image", src: url }));
    videos.forEach((v) => media.push({ type: "video", src: v.url, thumb: v.thumbnailUrl || v.thumbnail || null }));

    const total = media.length;
    if (total === 0) return null;

    if (total === 1) {
      const m = media[0];
      return (
        <div className="mt-4">
          <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 shadow-md">
            {m.type === "image" ? (
              <img src={m.src} alt={post.title ? `${post.title} media` : `post-${post.id}-media-0`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : m.thumb ? (
              <img src={m.thumb} alt={`video-thumb-${post.id}`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white bg-black">▶</div>
            )}
          </div>
        </div>
      );
    }

    if (total === 2) {
      return (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {media.slice(0, 2).map((m, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl shadow-sm">
              {m.type === "image" ? (
                <img src={m.src} alt={`post-${post.id}-img-${i}`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : m.thumb ? (
                <img src={m.thumb} alt={`video-thumb-${i}`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (total >= 3) {
      return (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {media.slice(0, 4).map((m, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl shadow-sm">
              {m.type === "image" ? (
                <img src={m.src} alt={`post-${post.id}-img-${i}`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : m.thumb ? (
                <img src={m.thumb} alt={`video-thumb-${i}`} loading="lazy" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (pendingLike || !post) return;

    const userId = getUserId();
    if (!userId) {
      alert("الرجاء تسجيل الدخول أولاً");
      return;
    }

    const prev = likeState;
    const newLikeState = {
      count: Math.max(prev.count + (prev.isLiked ? -1 : 1), 0),
      isLiked: !prev.isLiked,
    };
    setLikeState(newLikeState);
    setPendingLike(true);

    try {
      if (newLikeState.isLiked) {
        await likePost(Number(post.id));
      } else {
        await unlikePost(Number(post.id));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setLikeState(prev);
    } finally {
      setPendingLike(false);
    }
  };

  // Handle comment like toggle
  const handleCommentLikeToggle = async (commentId) => {
    const userId = getUserId();
    if (!userId) {
      alert("الرجاء تسجيل الدخول أولاً");
      return;
    }

    const currentLike = commentLikes[commentId] || { isLiked: false, count: 0, pending: false };
    if (currentLike.pending) return;

    // Optimistic update
    const newLikeState = {
      isLiked: !currentLike.isLiked,
      count: Math.max(currentLike.count + (currentLike.isLiked ? -1 : 1), 0),
      pending: true,
    };
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: newLikeState,
    }));

    try {
      if (newLikeState.isLiked) {
        await likeComment(commentId);
        // Refresh liked users to get updated count
        const users = await getCommentLikedUsers(commentId);
        setCommentLikedUsers((prev) => ({ ...prev, [commentId]: users }));
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: { ...newLikeState, count: users.length, pending: false },
        }));
      } else {
        await unlikeComment(commentId);
        // Refresh liked users to get updated count
        const users = await getCommentLikedUsers(commentId);
        setCommentLikedUsers((prev) => ({ ...prev, [commentId]: users }));
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: { ...newLikeState, count: users.length, pending: false },
        }));
      }
    } catch (err) {
      console.error("Error toggling comment like:", err);
      // Revert on error
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: currentLike,
      }));
    }
  };

  // Handle long press on like button to show liked users
  const handleLikeLongPressStart = (commentId, e) => {
    // Clear any existing timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Start timer for long press (500ms)
    longPressTimerRef.current = setTimeout(async () => {
      // Prevent default click action
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Check if comment has likes
      const likeInfo = commentLikes[commentId];
      if (!likeInfo || likeInfo.count === 0) {
        return;
      }

      // Show loading state
      setLoadingLikedUsers(true);
      setShowLikedUsersModal(commentId);

      try {
        // Fetch liked users if not already cached
        if (!commentLikedUsers[commentId]) {
          const users = await getCommentLikedUsers(commentId);
          setCommentLikedUsers((prev) => ({ ...prev, [commentId]: users }));
        }
      } catch (err) {
        console.error("Error fetching liked users:", err);
      } finally {
        setLoadingLikedUsers(false);
      }
    }, 500);
  };

  const handleLikeLongPressEnd = () => {
    // Clear timer if user releases before long press duration
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Fetch post with comments
  useEffect(() => {
    if (!postId) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("📤 Fetching post with comments:", postId);
        const postData = await getPostWithComments(postId);
        const items = Array.isArray(postData?.comments) ? postData.comments : [];
        console.log("✅ Post fetched:", postData);
        console.log("✅ Comments fetched:", items.length);
        
        if (!cancelled) {
          // Ensure numberComment is set from API or use comments length as fallback
          const updatedPost = {
            ...postData,
            numberComment: postData.numberComment ?? items.length ?? 0,
          };
          setPost(updatedPost);
          setComments(items);
          setLikeState({
            count: postData.numberLike ?? 0,
            isLiked: parseIsLiked(postData.isLikedIt),
          });
          
          // Extract reply counts from comments (if API provides it)
          const counts = {};
          items.forEach((comment) => {
            // Check if comment has replies count or replies array
            if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
              counts[comment.id] = comment.replies.length;
              // Also set the replies if they're already loaded
              setRepliesByCommentId((prev) => ({ ...prev, [comment.id]: comment.replies }));
            } else if (comment.replyCount !== undefined && comment.replyCount > 0) {
              counts[comment.id] = comment.replyCount;
            } else if (comment.numberOfReplies !== undefined && comment.numberOfReplies > 0) {
              counts[comment.id] = comment.numberOfReplies;
            }
          });
          setReplyCounts(counts);
          
          // Fetch comment like statuses for all comments
          if (items.length > 0 && !cancelled) {
            const likePromises = items.map(async (comment) => {
              try {
                const isLiked = await checkCommentLikeStatus(comment.id);
                const users = await getCommentLikedUsers(comment.id);
                return {
                  commentId: comment.id,
                  isLiked,
                  count: users.length,
                };
              } catch (err) {
                console.error(`Error fetching like status for comment ${comment.id}:`, err);
                return {
                  commentId: comment.id,
                  isLiked: false,
                  count: 0,
                };
              }
            });
            
            const likeResults = await Promise.all(likePromises);
            if (!cancelled) {
              const likesMap = {};
              likeResults.forEach((result) => {
                likesMap[result.commentId] = {
                  isLiked: result.isLiked,
                  count: result.count,
                  pending: false,
                };
              });
              setCommentLikes(likesMap);
            }
          }
        }
      } catch (err) {
        console.error("❌ Failed to fetch:", err?.response ?? err);
        if (!cancelled) {
          const errorMessage = err?.message || "فشل جلب البيانات. افتح Console لرؤية التفاصيل.";
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    document.body.classList.add("overflow-hidden");

    return () => {
      cancelled = true;
      document.body.classList.remove("overflow-hidden");
    };
  }, [postId]);

  // Scroll to bottom when new comment is added
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [comments.length]);

  // Send comment
  const handleSendComment = async () => {
    if (!newCommentText.trim() || !post || sendingComment) return;

    const userId = getUserId();
    if (!userId) {
      alert("الرجاء تسجيل الدخول أولاً");
      return;
    }

    setSendingComment(true);
    try {
      await createComment({
        text: newCommentText.trim(),
        postId: post.id,
        userId: userId,
        parentCommentId: null,
        createdAt: new Date().toISOString(),
      });

      // Clear input first
      setNewCommentText("");

      // Reload comments from API to get full user info
      console.log("🔄 Reloading comments after sending new comment...");
      const postData = await getPostWithComments(post.id);
      const items = Array.isArray(postData?.comments) ? postData.comments : [];
      setComments(items);

      // Update comment count
      if (post) {
        setPost((prev) => ({
          ...prev,
          numberComment: items.length,
        }));
        // Notify parent component about comment count change
        if (onCommentCountChanged) {
          onCommentCountChanged(post.id, items.length);
        }
      }
    } catch (err) {
      console.error("❌ Error sending comment:", err);
      alert(err?.message || "فشل إرسال التعليق");
    } finally {
      setSendingComment(false);
    }
  };

  // Fetch replies for a comment
  const fetchReplies = async (commentId) => {
    if (loadingReplies.has(commentId)) return;
    
    // If already expanded and has replies, just toggle (hide)
    if (expandedComments.has(commentId)) {
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    // If we already have replies loaded, just show them
    if (repliesByCommentId[commentId] && repliesByCommentId[commentId].length > 0) {
      setExpandedComments((prev) => new Set(prev).add(commentId));
      return;
    }

    // Fetch replies from API
    setLoadingReplies((prev) => new Set(prev).add(commentId));
    try {
      const replies = await getCommentReplies(commentId);
      setRepliesByCommentId((prev) => ({ ...prev, [commentId]: replies }));
      setExpandedComments((prev) => new Set(prev).add(commentId));
      
      // Update reply count
      setReplyCounts((prev) => ({ ...prev, [commentId]: replies.length }));
      
      // Fetch like statuses for all replies
      if (replies.length > 0) {
        const likePromises = replies.map(async (reply) => {
          try {
            const isLiked = await checkCommentLikeStatus(reply.id);
            const users = await getCommentLikedUsers(reply.id);
            return {
              replyId: reply.id,
              isLiked,
              count: users.length,
            };
          } catch (err) {
            console.error(`Error fetching like status for reply ${reply.id}:`, err);
            return {
              replyId: reply.id,
              isLiked: false,
              count: 0,
            };
          }
        });
        
        const likeResults = await Promise.all(likePromises);
        setCommentLikes((prev) => {
          const updated = { ...prev };
          likeResults.forEach((result) => {
            updated[result.replyId] = {
              isLiked: result.isLiked,
              count: result.count,
              pending: false,
            };
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("❌ Error fetching replies:", err);
      // If error, still show button but with 0 count
      setReplyCounts((prev) => ({ ...prev, [commentId]: 0 }));
    } finally {
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  // Handle reply button click - works for both main comments and replies
  const handleReplyClick = (commentId) => {
    // If it's a reply (nested), we might need to fetch its replies first
    // But for now, just open the reply input
    setReplyingToCommentId(commentId);
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
  };

  // Send reply
  const handleSendReply = async (parentCommentId) => {
    const replyText = replyTexts[parentCommentId]?.trim();
    if (!replyText || !post || sendingReplies[parentCommentId]) return;

    const userId = getUserId();
    if (!userId) {
      alert("الرجاء تسجيل الدخول أولاً");
      return;
    }

    setSendingReplies((prev) => ({ ...prev, [parentCommentId]: true }));
    try {
      await createComment({
        text: replyText,
        postId: post.id,
        userId: userId,
        parentCommentId: parentCommentId,
        createdAt: new Date().toISOString(),
      });

      // Clear reply text first
      setReplyTexts((prev) => ({ ...prev, [parentCommentId]: "" }));
      setReplyingToCommentId(null);

      // Reload replies from API to get full user info
      console.log("🔄 Reloading replies after sending new reply...");
      const replies = await getCommentReplies(parentCommentId);
      setRepliesByCommentId((prev) => ({
        ...prev,
        [parentCommentId]: replies,
      }));

      // Update reply count
      setReplyCounts((prev) => ({
        ...prev,
        [parentCommentId]: replies.length,
      }));

      // Ensure comment is expanded to show the new reply
      setExpandedComments((prev) => new Set(prev).add(parentCommentId));

      // Reload all comments to update comment count
      const postData = await getPostWithComments(post.id);
      const items = Array.isArray(postData?.comments) ? postData.comments : [];
      setComments(items);

      // Update comment count
      if (post) {
        setPost((prev) => ({
          ...prev,
          numberComment: items.length,
        }));
        // Notify parent component about comment count change
        if (onCommentCountChanged) {
          onCommentCountChanged(post.id, items.length);
        }
      }
    } catch (err) {
      console.error("❌ Error sending reply:", err);
      alert(err?.message || "فشل إرسال الرد");
    } finally {
      setSendingReplies((prev) => ({ ...prev, [parentCommentId]: false }));
    }
  };

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0" dir="rtl">
          <h3 className="text-xl font-bold text-gray-900 text-right">التعليقات ({post?.numberComment !== undefined && post?.numberComment !== null ? post.numberComment : (Array.isArray(post?.comments) ? post.comments.length : comments.length)})</h3>
            <button
              onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"
            aria-label="إغلاق"
            >
            ✕
            </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
              <span className="mr-3 text-gray-600">جاري التحميل...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg m-4">
              {error}
            </div>
          )}

          {!loading && post && (
            <>
              {/* Post Content */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  <div
                    onClick={(e) => {
                      stop(e);
                      if (post.userId) {
                        navigate(`/Profile/${post.userId}`);
                      }
                    }}
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  >
                    {post.imageURL ? (
                      <img
                        src={post.imageURL}
                        alt={`${post.userName || "User"} avatar`}
                        className="w-12 h-12 object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                        {getInitials(post.userName)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div
                          onClick={(e) => {
                            stop(e);
                            if (post.userId) {
                              navigate(`/Profile/${post.userId}`);
                            }
                          }}
                          className="text-base font-semibold text-gray-900 cursor-pointer hover:underline"
                        >
                          {post.userName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      {post.title && (
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                      )}
                      {post.content && (
                        <div
                          className="text-gray-700 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Media */}
                {renderMediaGrid(post)}

                {/* Tags */}
                {post.postTags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.postTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700"
                      >
                        #{tag.tagName}
                      </span>
                    ))}
                  </div>
                )}

                {/* Engagement Stats - Like Facebook */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  {/* Stats Row */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      {likeState.count > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{likeState.isLiked ? "♥" : "♡"}</span>
                          <span className="text-sm text-gray-600">{likeState.count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {comments.length > 0 && (
                        <span>{comments.length} تعليق</span>
                      )}
                      <span>0 مشاركة</span>
                    </div>
                  </div>

                  {/* Action Buttons Row - Facebook Style */}
                  <div className="flex items-center justify-around border-t border-gray-200 pt-2 mt-2" dir="rtl">
                    <button
                      onClick={handleLikeToggle}
                      disabled={pendingLike}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-sm font-medium transition ${
                        likeState.isLiked
                          ? "text-pink-600 hover:bg-pink-50"
                          : "text-gray-600 hover:bg-gray-100"
                      } ${pendingLike ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-lg">{likeState.isLiked ? "♥" : "♡"}</span>
                      <span>إعجاب</span>
                    </button>

                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                      <span className="text-lg">💬</span>
                      <span>تعليق</span>
                    </button>

                    <button
                      onClick={(e) => {
                        stop(e);
                        navigator.clipboard?.writeText(
                          window.location.origin + `/react-app/Post/${post.id}`
                        );
                        alert("رابط البوست تم نسخه إلى الحافظة");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                      <span className="text-lg">↗</span>
                      <span>مشاركة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-right" dir="rtl">
                  التعليقات ({post?.numberComment !== undefined && post?.numberComment !== null ? post.numberComment : (Array.isArray(post?.comments) ? post.comments.length : comments.length)})
                </h4>

                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد تعليقات بعد. كن أول من يعلق!
                  </div>
                ) : (
                  <div className="space-y-4">
            {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 items-start" dir="rtl">
                        {/* Profile Picture */}
                <div
                  onClick={() => {
                    if (c.userId) {
                      navigate(`/Profile/${c.userId}`);
                    }
                  }}
                          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                >
                  {c.imageURL ? (
                    <img
                      src={c.imageURL}
                      alt={c.userName || "user"}
                      className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                              {getInitials(c.userName || "U")}
                    </div>
                  )}
                </div>

                        {/* Comment Content */}
                        <div className="flex-1 min-w-0" dir="rtl">
                          {/* Comment Bubble */}
                          <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-3 mb-1 text-right">
                  <div
                    onClick={() => {
                    if (c.userId) {
                      navigate(`/Profile/${c.userId}`);
                    }
                  }}
                              className="text-sm font-semibold text-gray-900 cursor-pointer hover:underline mb-1 block text-right"
                  >
                              {c.userName || "Unknown"}
                  </div>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-right">
                    {c.text || c.comment || ""}
                  </p>
                </div>

                          {/* Comment Actions - Like Facebook */}
                          <div className="flex items-center gap-4 mt-1 justify-end flex-wrap" dir="rtl">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommentLikeToggle(c.id);
                              }}
                              onMouseDown={(e) => handleLikeLongPressStart(c.id, e)}
                              onMouseUp={handleLikeLongPressEnd}
                              onMouseLeave={handleLikeLongPressEnd}
                              onTouchStart={(e) => handleLikeLongPressStart(c.id, e)}
                              onTouchEnd={handleLikeLongPressEnd}
                              disabled={commentLikes[c.id]?.pending}
                              className={`text-xs font-medium hover:underline transition ${
                                commentLikes[c.id]?.isLiked
                                  ? "text-pink-600 hover:text-pink-700"
                                  : "text-gray-600 hover:text-gray-900"
                              } ${commentLikes[c.id]?.pending ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              {commentLikes[c.id]?.pending ? (
                                "جاري..."
                              ) : (
                                <>
                                  {commentLikes[c.id]?.isLiked ? "♥" : "♡"} إعجاب
                                  {commentLikes[c.id]?.count > 0 && (
                                    <span className="mr-1">({commentLikes[c.id].count})</span>
                                  )}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReplyClick(c.id)}
                              className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                            >
                              رد
                            </button>
                            {/* Show replies count and toggle - Always show, fetch on click if needed */}
                            <button
                              onClick={() => fetchReplies(c.id)}
                              className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                            >
                              {loadingReplies.has(c.id) ? (
                                "جاري التحميل..."
                              ) : expandedComments.has(c.id) ? (
                                `إخفاء ${repliesByCommentId[c.id]?.length || replyCounts[c.id] || 0} رد`
                              ) : (
                                `عرض ${replyCounts[c.id] || repliesByCommentId[c.id]?.length || 0} رد`
                              )}
                            </button>
                            <span className="text-xs text-gray-400">
                              {formatDate(c.createdAt)}
                            </span>
                          </div>

                          {/* Replies Section */}
                          {expandedComments.has(c.id) && (
                            <div className="mt-3 mr-4 space-y-3 border-r-2 border-gray-200 pr-3">
                              {loadingReplies.has(c.id) ? (
                                <div className="text-xs text-gray-500">جاري تحميل الردود...</div>
                              ) : (
                                repliesByCommentId[c.id]?.map((reply) => (
                                  <div key={reply.id} className="space-y-2">
                                    <div className="flex gap-2 items-start" dir="rtl">
                                      <div
                                        onClick={() => {
                                          if (reply.userId) {
                                            navigate(`/Profile/${reply.userId}`);
                                          }
                                        }}
                                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                      >
                                        {reply.imageURL ? (
                                          <img
                                            src={reply.imageURL}
                                            alt={reply.userName || "user"}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none";
                                            }}
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                                            {getInitials(reply.userName || "U")}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0" dir="rtl">
                                        <div className="bg-gray-50 rounded-xl rounded-tr-sm p-2 text-right">
                                          <div
                                            onClick={() => {
                                              if (reply.userId) {
                                                navigate(`/Profile/${reply.userId}`);
                                              }
                                            }}
                                            className="text-xs font-semibold text-gray-900 cursor-pointer hover:underline mb-1 block text-right"
                                          >
                                            {reply.userName || "Unknown"}
                                          </div>
                                          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-right">
                                            {reply.text || reply.comment || ""}
                                          </p>
                                        </div>
                                        
                                        {/* Reply Actions - Like Facebook - Same as main comment */}
                                        <div className="flex items-center gap-3 mt-1 justify-end flex-wrap" dir="rtl">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCommentLikeToggle(reply.id);
                                            }}
                                            onMouseDown={(e) => handleLikeLongPressStart(reply.id, e)}
                                            onMouseUp={handleLikeLongPressEnd}
                                            onMouseLeave={handleLikeLongPressEnd}
                                            onTouchStart={(e) => handleLikeLongPressStart(reply.id, e)}
                                            onTouchEnd={handleLikeLongPressEnd}
                                            disabled={commentLikes[reply.id]?.pending}
                                            className={`text-xs font-medium hover:underline transition ${
                                              commentLikes[reply.id]?.isLiked
                                                ? "text-pink-600 hover:text-pink-700"
                                                : "text-gray-600 hover:text-gray-900"
                                            } ${commentLikes[reply.id]?.pending ? "opacity-60 cursor-not-allowed" : ""}`}
                                          >
                                            {commentLikes[reply.id]?.pending ? (
                                              "جاري..."
                                            ) : (
                                              <>
                                                {commentLikes[reply.id]?.isLiked ? "♥" : "♡"} إعجاب
                                                {commentLikes[reply.id]?.count > 0 && (
                                                  <span className="mr-1">({commentLikes[reply.id].count})</span>
                                                )}
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handleReplyClick(reply.id)}
                                            className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                          >
                                            رد
                                          </button>
                                          {/* Show nested replies count and toggle - Always show */}
                                          <button
                                            onClick={() => fetchReplies(reply.id)}
                                            className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                          >
                                            {loadingReplies.has(reply.id) ? (
                                              "جاري التحميل..."
                                            ) : expandedComments.has(reply.id) ? (
                                              `إخفاء ${repliesByCommentId[reply.id]?.length || replyCounts[reply.id] || 0} رد`
                                            ) : (
                                              `عرض ${replyCounts[reply.id] || repliesByCommentId[reply.id]?.length || 0} رد`
                                            )}
                                          </button>
                                          <span className="text-xs text-gray-400">
                                            {formatDate(reply.createdAt)}
                                          </span>
                                        </div>

                                        {/* Nested Replies (replies to replies) */}
                                        {expandedComments.has(reply.id) && (
                                          <div className="mt-2 mr-4 space-y-2 border-r-2 border-gray-300 pr-2">
                                            {loadingReplies.has(reply.id) ? (
                                              <div className="text-xs text-gray-500">جاري تحميل الردود...</div>
                                            ) : (
                                              repliesByCommentId[reply.id]?.map((nestedReply) => (
                                                <div key={nestedReply.id} className="flex gap-2 items-start" dir="rtl">
                                                  <div
                                                    onClick={() => {
                                                      if (nestedReply.userId) {
                                                        navigate(`/Profile/${nestedReply.userId}`);
                                                      }
                                                    }}
                                                    className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                                  >
                                                    {nestedReply.imageURL ? (
                                                      <img
                                                        src={nestedReply.imageURL}
                                                        alt={nestedReply.userName || "user"}
                                                        className="w-7 h-7 rounded-full object-cover"
                                                        onError={(e) => {
                                                          e.currentTarget.style.display = "none";
                                                        }}
                                                      />
                                                    ) : (
                                                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                                                        {getInitials(nestedReply.userName || "U")}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex-1 min-w-0" dir="rtl">
                                                    <div className="bg-gray-50 rounded-lg rounded-tr-sm p-2 text-right">
                                                      <div
                                                        onClick={() => {
                                                          if (nestedReply.userId) {
                                                            navigate(`/Profile/${nestedReply.userId}`);
                                                          }
                                                        }}
                                                        className="text-xs font-semibold text-gray-900 cursor-pointer hover:underline mb-1 block text-right"
                                                      >
                                                        {nestedReply.userName || "Unknown"}
                                                      </div>
                                                      <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-right">
                                                        {nestedReply.text || nestedReply.comment || ""}
                                                      </p>
                                                    </div>
                                                    {/* Nested Reply Actions - Same as main comment */}
                                                    <div className="flex items-center gap-3 mt-1 justify-end flex-wrap" dir="rtl">
                                                      <button
                                                        className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                                      >
                                                        إعجاب
                                                      </button>
                                                      <button
                                                        onClick={() => handleReplyClick(nestedReply.id)}
                                                        className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                                      >
                                                        رد
                                                      </button>
                                                      {/* Show nested replies count and toggle - Always show */}
                                                      <button
                                                        onClick={() => fetchReplies(nestedReply.id)}
                                                        className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                                      >
                                                        {loadingReplies.has(nestedReply.id) ? (
                                                          "جاري التحميل..."
                                                        ) : expandedComments.has(nestedReply.id) ? (
                                                          `إخفاء ${repliesByCommentId[nestedReply.id]?.length || replyCounts[nestedReply.id] || 0} رد`
                                                        ) : (
                                                          `عرض ${replyCounts[nestedReply.id] || repliesByCommentId[nestedReply.id]?.length || 0} رد`
                                                        )}
                                                      </button>
                                                      <span className="text-xs text-gray-400">
                                                        {formatDate(nestedReply.createdAt)}
                                                      </span>
                                                    </div>

                                                    {/* Nested Replies (replies to nested replies) */}
                                                    {expandedComments.has(nestedReply.id) && (
                                                      <div className="mt-2 mr-4 space-y-2 border-r-2 border-gray-400 pr-2">
                                                        {loadingReplies.has(nestedReply.id) ? (
                                                          <div className="text-xs text-gray-500">جاري تحميل الردود...</div>
                                                        ) : (
                                                          repliesByCommentId[nestedReply.id]?.map((deepNestedReply) => (
                                                            <div key={deepNestedReply.id} className="flex gap-2 items-start" dir="rtl">
                                                              <div
                                                                onClick={() => {
                                                                  if (deepNestedReply.userId) {
                                                                    navigate(`/Profile/${deepNestedReply.userId}`);
                                                                  }
                                                                }}
                                                                className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                                              >
                                                                {deepNestedReply.imageURL ? (
                                                                  <img
                                                                    src={deepNestedReply.imageURL}
                                                                    alt={deepNestedReply.userName || "user"}
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                      e.currentTarget.style.display = "none";
                                                                    }}
                                                                  />
                                                                ) : (
                                                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                                                                    {getInitials(deepNestedReply.userName || "U")}
                                                                  </div>
                                                                )}
                                                              </div>
                                                              <div className="flex-1 min-w-0" dir="rtl">
                                                                <div className="bg-gray-50 rounded-lg rounded-tr-sm p-1.5 text-right">
                                                                  <div
                                                                    onClick={() => {
                                                                      if (deepNestedReply.userId) {
                                                                        navigate(`/Profile/${deepNestedReply.userId}`);
                                                                      }
                                                                    }}
                                                                    className="text-xs font-semibold text-gray-900 cursor-pointer hover:underline mb-1 block text-right"
                                                                  >
                                                                    {deepNestedReply.userName || "Unknown"}
                                                                  </div>
                                                                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words text-right">
                                                                    {deepNestedReply.text || deepNestedReply.comment || ""}
                                                                  </p>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1 justify-end" dir="rtl">
                                                                  <button
                                                                    onClick={() => handleReplyClick(deepNestedReply.id)}
                                                                    className="text-xs text-gray-600 hover:text-gray-900 font-medium hover:underline transition"
                                                                  >
                                                                    رد
                                                                  </button>
                                                                  <span className="text-xs text-gray-400">
                                                                    {formatDate(deepNestedReply.createdAt)}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))
                                                        )}
                                                      </div>
                                                    )}

                                                    {/* Reply Input for nested reply */}
                                                    {replyingToCommentId === nestedReply.id && (
                                                      <div className="mt-2 mr-4 flex gap-2 items-start" dir="rtl">
                                                        {user?.imageUrl || user?.imageURL ? (
                                                          <img
                                                            src={user.imageUrl || user.imageURL}
                                                            alt={user.userName || "User"}
                                                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                              e.currentTarget.style.display = "none";
                                                            }}
                                                          />
                                                        ) : (
                                                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                                                            {getInitials(user?.userName || "U")}
                                                          </div>
                                                        )}
                                                        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1">
                                                          <input
                                                            type="text"
                                                            value={replyTexts[nestedReply.id] || ""}
                                                            onChange={(e) =>
                                                              setReplyTexts((prev) => ({
                                                                ...prev,
                                                                [nestedReply.id]: e.target.value,
                                                              }))
                                                            }
                                                            onKeyPress={(e) => {
                                                              if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSendReply(nestedReply.id);
                                                              }
                                                            }}
                                                            placeholder="اكتب رداً..."
                                                            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400"
                                                            dir="rtl"
                                                            autoFocus
                                                          />
                                                          <button
                                                            onClick={() => handleSendReply(nestedReply.id)}
                                                            disabled={
                                                              !replyTexts[nestedReply.id]?.trim() || sendingReplies[nestedReply.id]
                                                            }
                                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold transition ${
                                                              replyTexts[nestedReply.id]?.trim() && !sendingReplies[nestedReply.id]
                                                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            }`}
                                                          >
                                                            {sendingReplies[nestedReply.id] ? "جاري..." : "إرسال"}
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              setReplyingToCommentId(null);
                                                              setReplyTexts((prev) => ({ ...prev, [nestedReply.id]: "" }));
                                                            }}
                                                            className="text-gray-400 hover:text-gray-600 text-xs"
                                                          >
                                                            ✕
                                                          </button>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        )}

                                        {/* Reply Input for this reply */}
                                        {replyingToCommentId === reply.id && (
                                          <div className="mt-2 mr-4 flex gap-2 items-start" dir="rtl">
                                            {user?.imageUrl || user?.imageURL ? (
                                              <img
                                                src={user.imageUrl || user.imageURL}
                                                alt={user.userName || "User"}
                                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = "none";
                                                }}
                                              />
                                            ) : (
                                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                                                {getInitials(user?.userName || "U")}
                                              </div>
                                            )}
                                            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                                              <input
                                                type="text"
                                                value={replyTexts[reply.id] || ""}
                                                onChange={(e) =>
                                                  setReplyTexts((prev) => ({
                                                    ...prev,
                                                    [reply.id]: e.target.value,
                                                  }))
                                                }
                                                onKeyPress={(e) => {
                                                  if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(reply.id);
                                                  }
                                                }}
                                                placeholder="اكتب رداً..."
                                                className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400"
                                                dir="rtl"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => handleSendReply(reply.id)}
                                                disabled={
                                                  !replyTexts[reply.id]?.trim() || sendingReplies[reply.id]
                                                }
                                                className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                                                  replyTexts[reply.id]?.trim() && !sendingReplies[reply.id]
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                }`}
                                              >
                                                {sendingReplies[reply.id] ? "جاري..." : "إرسال"}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setReplyingToCommentId(null);
                                                  setReplyTexts((prev) => ({ ...prev, [reply.id]: "" }));
                                                }}
                                                className="text-gray-400 hover:text-gray-600 text-xs"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Reply Input */}
                          {replyingToCommentId === c.id && (
                            <div className="mt-3 mr-4 flex gap-2 items-start" dir="rtl">
                              {user?.imageUrl || user?.imageURL ? (
                                <img
                                  src={user.imageUrl || user.imageURL}
                                  alt={user.userName || "User"}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                                  {getInitials(user?.userName || "U")}
                                </div>
                              )}
                              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2">
                                <input
                                  type="text"
                                  value={replyTexts[c.id] || ""}
                                  onChange={(e) =>
                                    setReplyTexts((prev) => ({
                                      ...prev,
                                      [c.id]: e.target.value,
                                    }))
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendReply(c.id);
                                    }
                                  }}
                                  placeholder="اكتب رداً..."
                                  className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400"
                                  dir="rtl"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSendReply(c.id)}
                                  disabled={
                                    !replyTexts[c.id]?.trim() || sendingReplies[c.id]
                                  }
                                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                                    replyTexts[c.id]?.trim() && !sendingReplies[c.id]
                                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  {sendingReplies[c.id] ? "جاري..." : "إرسال"}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingToCommentId(null);
                                    setReplyTexts((prev) => ({ ...prev, [c.id]: "" }));
                                  }}
                                  className="text-gray-400 hover:text-gray-600 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Input Section - Fixed at bottom */}
        {!loading && post && (
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
            <div className="flex items-center gap-3">
              {user?.imageUrl || user?.imageURL ? (
                <img
                  src={user.imageUrl || user.imageURL}
                  alt={user.userName || "User"}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold flex-shrink-0">
                  {getInitials(user?.userName || "U")}
                </div>
              )}
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  placeholder="اكتب تعليقاً..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                  dir="rtl"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newCommentText.trim() || sendingComment}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    newCommentText.trim() && !sendingComment
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sendingComment ? "جاري الإرسال..." : "إرسال"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liked Users Modal */}
      {showLikedUsersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowLikedUsersModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} dir="rtl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">المعجبون</h3>
              <button
                onClick={() => setShowLikedUsersModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loadingLikedUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-600 border-t-transparent"></div>
                  <span className="mr-3 text-gray-600">جاري التحميل...</span>
                </div>
              ) : (
                <>
                  {commentLikedUsers[showLikedUsersModal] && commentLikedUsers[showLikedUsersModal].length > 0 ? (
                    <div className="space-y-3">
                      {commentLikedUsers[showLikedUsersModal].map((user) => (
                        <div
                          key={user.userId}
                          onClick={() => {
                            setShowLikedUsersModal(null);
                            navigate(`/Profile/${user.userId}`);
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                        >
                          {/* User Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {user.imageURL ? (
                              <img
                                src={user.imageURL}
                                alt={user.userName || "user"}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                                {getInitials(user.userName || "U")}
                              </div>
                            )}
                          </div>

                          {/* User Name */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.userName || "Unknown"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">لا يوجد معجبون</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsModal;
