import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import api from "../../../Service/api";
import { useNavigate, useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import CommentsModal from "./CommentsModal";
import CreatePostModal from "./CreatePostModal";
import { useSelector } from "react-redux";
import { selectAuthSession } from "../../../store/authSlice";
import Events from "../../Contest/Events";

/*
  نسخة JS من PostsPage مع سلوكين جديدين:
   1) عند إضافة منشور جديد: هبوط هاديء (slide-down animation) بدل "pop" السريع.
   2) إذا المستخدم نازل لتحت (ليس عند أعلى الصفحة) أثناء وصول منشور جديد،
      يتم تجميع المنشورات الجديدة في قائمة مؤقتة ويظهر شريط/زر يخبر المستخدم "منشورات جديدة".
      عند الضغط على الشريط يتم إضافة المنشورات المجمعة إلى الأعلى والتمرير للأعلى مع إبراز لطيف.
*/

const PostsPage = () => {
  // ---- state ----
  const [allPosts, setAllPosts] = useState([]); // جميع البوستات المجلوبة
  const [displayedPosts, setDisplayedPosts] = useState([]); // ما يُعرض (معاينة أو نتائج السيرفر)
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState({}); // { [postId]: { count, isLiked } }
  const [pendingLikes, setPendingLikes] = useState({}); // لمنع نقر متكرر على نفس البوست

  // animation/highlight state for newly added posts
  const [highlightedPosts, setHighlightedPosts] = useState([]); // array of post ids currently highlighted
  const highlightTimeoutsRef = useRef({}); // map postId -> timeoutId

  // buffer for new posts when user is scrolled away
  const [pendingNewPosts, setPendingNewPosts] = useState([]); // posts waiting to be shown
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);

  // detect whether user is at top (to decide immediate insert vs buffer)
  const [isAtTop, setIsAtTop] = useState(true);
  const isAtTopRef = useRef(true);
  useEffect(() => {
    isAtTopRef.current = isAtTop;
  }, [isAtTop]);

  // modal state for showing who liked a post
  const [likedUsers, setLikedUsers] = useState([]); // users for current modal
  const [likedUsersLoading, setLikedUsersLoading] = useState(false);
  const [likedUsersError, setLikedUsersError] = useState(null);
  const [modalOpenPostId, setModalOpenPostId] = useState(null);

  // delete confirmation modal
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null); // id that's currently being deleted (loading)
  const [commentsModalPostId, setCommentsModalPostId] = useState(null);

  // Filter UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterFrom, setFilterFrom] = useState(""); // datetime-local string
  const [filterTo, setFilterTo] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const [serverFilterApplied, setServerFilterApplied] = useState(false); // whether last apply was server-side

  // debounce text for preview
  const [debouncedText, setDebouncedText] = useState(filterText);
  const debounceTimerRef = useRef(null);

  // abort controller for filter API
  const filterAbortRef = useRef(null);

  // popular tags state
  const [popularTags, setPopularTags] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState(null);
  const popularAbortRef = useRef(null);

  // followers state
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersError, setFollowersError] = useState(null);
  const [followersSearchText, setFollowersSearchText] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  
  // Create Post Modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(null);
  const fileInputRef = useRef(null);
  
  // Get user from session
  const session = useSelector(selectAuthSession);
  const user = session?.responseUserDTO;
  const userAvatar = 
    user?.imageUrl ?? 
    user?.imageURL ?? 
    user?.avatarUrl ?? 
    user?.profileImage ?? 
    null;

  // SignalR related refs/state
  const connectionRef = useRef(null);
  const [connection, setConnection] = useState(null);
  const serverFilterAppliedRef = useRef(serverFilterApplied);
  useEffect(() => {
    serverFilterAppliedRef.current = serverFilterApplied;
  }, [serverFilterApplied]);

  const parseIsLiked = (val) => {
    if (val === 0 || val === "0") return true;
    if (val === true || val === "true") return true;
    return false;
  };

  const getUserId = () => {
    const v = localStorage.getItem("idUser");
    return v ? Number(v) : null;
  };

  const sortPostsDesc = (arr) => {
    return [...arr].sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta || (b.id ?? 0) - (a.id ?? 0);
    });
  };

  const buildInitialLikes = (sorted) => {
    const initialLikes = {};
    (sorted || []).forEach((p) => {
      initialLikes[p.id] = {
        count: Number(p.numberLike ?? 0),
        isLiked: parseIsLiked(p.isLikedIt),
      };
    });
    return initialLikes;
  };

  const getPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Post/GetAll");
      const fetched = res.data || [];
      const sorted = sortPostsDesc(fetched);

      setAllPosts(sorted);
      setDisplayedPosts(sorted);
      setLikes(buildInitialLikes(sorted));
      setServerFilterApplied(false);
    } catch (error) {
      console.error("Error fetching posts:", {
        message: error.message,
        response: error.response ? { status: error.response.status, data: error.response.data } : null,
      });
      alert("فشل جلب البوستات. افتح Console لرؤية التفاصيل.");
    } finally {
      setLoading(false);
    }
  };

  // helper to highlight a post for a short duration
  const highlightPost = (postId, duration = 1200) => {
    if (!postId) return;
    setHighlightedPosts((prev) => (prev.includes(postId) ? prev : [...prev, postId]));

    if (highlightTimeoutsRef.current[postId]) {
      clearTimeout(highlightTimeoutsRef.current[postId]);
    }

    const t = setTimeout(() => {
      setHighlightedPosts((prev) => prev.filter((id) => id !== postId));
      delete highlightTimeoutsRef.current[postId];
    }, duration);

    highlightTimeoutsRef.current[postId] = t;
  };

  // init
  const getFollowers = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    setFollowersLoading(true);
    setFollowersError(null);
    try {
      const response = await api.get(`/Follow/GetListFollowers`, {
        params: { idUser: userId }
      });
      setFollowers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
      setFollowersError("فشل جلب قائمة المتابعين");
    } finally {
      setFollowersLoading(false);
    }
  };

  const getPopularTags = async () => {
    setPopularLoading(true);
    setPopularError(null);
    popularAbortRef.current?.abort();
    popularAbortRef.current = new AbortController();
    try {
      const response = await api.get("/Post/MostTagUsedInPosts", {
        signal: popularAbortRef.current.signal,
      });
      console.log("Popular tags response:", response.data);
      
      // معالجة البيانات حسب شكل الاستجابة
      let tags = response.data || [];
      if (!Array.isArray(tags)) {
        if (tags.data && Array.isArray(tags.data)) {
          tags = tags.data;
        } else if (tags.tags && Array.isArray(tags.tags)) {
          tags = tags.tags;
        } else if (tags.result && Array.isArray(tags.result)) {
          tags = tags.result;
        }
      }
      
      if (Array.isArray(tags)) {
        setPopularTags(tags);
        setPopularError(null);
      } else {
        setPopularTags([]);
        setPopularError(null);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to fetch popular tags:", err);
      setPopularError(null); // لا نعرض خطأ، فقط لا توجد بيانات
      setPopularTags([]);
    } finally {
      setPopularLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
    getPopularTags();
    getFollowers();
  }, []);

  // cleanup highlight timers on unmount
  useEffect(() => {
    return () => {
      Object.values(highlightTimeoutsRef.current).forEach((t) => {
        try {
          clearTimeout(t);
        } catch {}
      });
      highlightTimeoutsRef.current = {};
    };
  }, []);

  // scroll handler to determine if user is at top
  useEffect(() => {
    let lastKnownPos = window.scrollY;
    const onScroll = () => {
      const atTop = window.scrollY <= 160; // threshold (px) to consider "at top"
      if (atTop !== isAtTopRef.current) {
        setIsAtTop(atTop);
        isAtTopRef.current = atTop;
        // if user scrolled back to top and have pending posts -> flush them automatically
        if (atTop && pendingNewPosts.length > 0) {
          flushPendingNewPosts();
        }
      }
      lastKnownPos = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // pendingNewPosts intentionally not in deps so that scroll listener isn't re-attached frequently;
    // we read pendingNewPosts inside using closure when needed (flushPendingNewPosts reads latest via ref below).
    // To ensure flushPendingNewPosts sees latest pendingNewPosts, we'll use a ref below.
  }, []);

  // keep a ref to pendingNewPosts to use from scroll callback closure safely
  const pendingNewPostsRef = useRef(pendingNewPosts);
  useEffect(() => {
    pendingNewPostsRef.current = pendingNewPosts;
    setShowNewPostsBanner(pendingNewPosts.length > 0 && !isAtTop);
  }, [pendingNewPosts, isAtTop]);

  // helper to flush pending new posts to top of list
  const flushPendingNewPosts = (opts = { scrollToTop: true }) => {
    const pending = pendingNewPostsRef.current || [];
    if (!pending || pending.length === 0) {
      setShowNewPostsBanner(false);
      return;
    }

    // prepend to lists, ensure deduplication by id
    setAllPosts((prev) => {
      const merged = sortPostsDesc([...pending, ...prev.filter((p) => !pending.some((n) => n.id === p.id))]);
      return merged;
    });
    setDisplayedPosts((prev) => {
      const merged = sortPostsDesc([...pending, ...prev.filter((p) => !pending.some((n) => n.id === p.id))]);
      return merged;
    });

    // highlight each new post, staggered a bit
    pending.forEach((p, idx) => {
      setTimeout(() => highlightPost(p.id, 1400), idx * 120);
    });

    // clear pending
    setPendingNewPosts([]);
    pendingNewPostsRef.current = [];

    setShowNewPostsBanner(false);

    if (opts.scrollToTop) {
      // smooth scroll to top so user sees new posts
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  };

  // SignalR connection & handlers
  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://arabcodetest.runasp.net/postHub")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = conn;

    conn.on("ReceivePost", (post) => {
      try {
        setAllPosts((prev) => {
          if (prev.find((p) => p.id === post.id)) return prev;
          const merged = sortPostsDesc([post, ...prev]);
          return merged;
        });

        setLikes((s) => ({
          ...s,
          [post.id]: {
            count: Number(post.numberLike ?? 0),
            isLiked: parseIsLiked(post.isLikedIt),
          },
        }));

        // if server-side filter applied, keep previous behaviour (don't show)
        if (serverFilterAppliedRef.current) {
          console.info("New post received but server-filter is applied. not adding to visible list.");
          return;
        }

        // if user is at top -> insert immediately with slide-down animation
        if (isAtTopRef.current) {
          setDisplayedPosts((prev) => {
            if (prev.find((p) => p.id === post.id)) return prev;
            const next = sortPostsDesc([post, ...prev]);
            // tiny timeout to ensure DOM insertion before highlighting (makes animation smoother)
            setTimeout(() => highlightPost(post.id, 1400), 30);
            return next;
          });
        } else {
          // user scrolled down -> buffer post and show banner
          setPendingNewPosts((prev) => {
            // avoid duplicates
            if (prev.find((p) => p.id === post.id)) return prev;
            return [...prev, post];
          });
          // banner visibility will be handled by effect on pendingNewPosts
        }
      } catch (err) {
        console.error("Error handling ReceivePost:", err);
      }
    });

    conn.on("ReceivePostUpdated", (post) => {
      try {
        setAllPosts((prev) => {
          const idx = prev.findIndex((p) => p.id === post.id);
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...post };
          return sortPostsDesc(copy);
        });

        setDisplayedPosts((prev) => {
          const idx = prev.findIndex((p) => p.id === post.id);
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...post };
          return sortPostsDesc(copy);
        });

        setLikes((s) => ({
          ...s,
          [post.id]: {
            count: Number(post.numberLike ?? s[post.id]?.count ?? 0),
            isLiked: parseIsLiked(post.isLikedIt ?? s[post.id]?.isLiked),
          },
        }));
      } catch (err) {
        console.error("Error handling ReceivePostUpdated:", err);
      }
    });

    conn.on("ReceivePostDeleted", (payload) => {
      try {
        const id = typeof payload === "number" ? payload : payload?.id;
        if (id == null) return;

        setAllPosts((s) => s.filter((p) => p.id !== id));
        setDisplayedPosts((s) => s.filter((p) => p.id !== id));
        setLikes((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });

        // also remove from pending buffer if present
        setPendingNewPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Error handling ReceivePostDeleted:", err);
      }
    });

    conn.on("ReceiveLike", (payload) => {
      try {
        const postId = payload?.postId ?? payload?.postID ?? payload?.id;
        const numberLike = payload?.numberLike ?? payload?.numberOfLikes ?? payload?.count;
        const isLikedIt = payload?.isLikedIt ?? payload?.isLiked;

        if (!postId) return;

        setLikes((s) => {
          const prev = s[postId] ?? { count: 0, isLiked: false };
          return {
            ...s,
            [postId]: {
              count: numberLike != null ? Number(numberLike) : prev.count,
              isLiked: isLikedIt != null ? parseIsLiked(isLikedIt) : prev.isLiked,
            },
          };
        });

        setAllPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, numberLike: numberLike ?? p.numberLike } : p)));
        setDisplayedPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, numberLike: numberLike ?? p.numberLike } : p)));
      } catch (err) {
        console.error("Error handling ReceiveLike:", err);
      }
    });

    conn
      .start()
      .then(() => {
        console.log("Connected to PostHub (PostsPage)");
        setConnection(conn);
      })
      .catch((err) => {
        console.error("SignalR Connection Error (PostsPage):", err);
      });

    return () => {
      try {
        conn.stop().catch(() => {});
      } finally {
        connectionRef.current = null;
        setConnection(null);
      }
    };
  }, []);

  // fetch popular tags
  useEffect(() => {
    if (popularAbortRef.current) {
      popularAbortRef.current.abort();
    }
    const controller = new AbortController();
    popularAbortRef.current = controller;

    const fetchPopular = async () => {
      setPopularLoading(true);
      setPopularError(null);
      try {
        const res = await api.get("/Post/MostTagUsedInPosts", {
          signal: controller.signal,
        });
        const data = res?.data ?? [];
        if (Array.isArray(data)) {
          setPopularTags(data);
        } else {
          setPopularTags([]);
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          console.warn("popular tags fetch aborted");
        } else {
          console.error("Failed to fetch popular tags:", err?.response ?? err);
          setPopularError("فشل جلب التاقات الشائعة. افتح Console للمزيد.");
        }
      } finally {
        setPopularLoading(false);
        popularAbortRef.current = null;
      }
    };

    fetchPopular();

    return () => {
      controller.abort();
      popularAbortRef.current = null;
    };
  }, []);

  // Debounce filterText -> debouncedText (for preview)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedText(filterText);
    }, 450);
    return () => clearTimeout(debounceTimerRef.current);
  }, [filterText]);

  const filterPostsLocally = (postsArr, { text, from, to }) => {
    if (!postsArr || postsArr.length === 0) return [];
    const t = (text || "").trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() : null;

    return postsArr.filter((p) => {
      if (fromTs || toTs) {
        const created = p.createdAt ? new Date(p.createdAt).getTime() : null;
        if (created == null) return false;
        if (fromTs && created < fromTs) return false;
        if (toTs && created > toTs) return false;
      }

      if (!t) return true;

      const inTitle = (p.title || "").toLowerCase().includes(t);
      const inContent = (p.content || "").toLowerCase().includes(t);
      const inUser = (p.userName || "").toLowerCase().includes(t);
      const inTags =
        Array.isArray(p.postTags) &&
        p.postTags.some((tg) => (tg.tagName || "").toLowerCase().includes(t));

      return inTitle || inContent || inUser || inTags;
    });
  };

  useEffect(() => {
    const preview = filterPostsLocally(allPosts, {
      text: debouncedText,
      from: filterFrom,
      to: filterTo,
    });
    setDisplayedPosts(preview);
    setServerFilterApplied(false);
  }, [debouncedText, filterFrom, filterTo, allPosts]);

  useEffect(() => {
    setFilterError(null);
    if (filterFrom && filterTo) {
      const from = new Date(filterFrom);
      const to = new Date(filterTo);
      if (isNaN(from) || isNaN(to)) {
        setFilterError("أحد التواريخ غير صالح.");
      } else if (from.getTime() > to.getTime()) {
        setFilterError("حقل 'من' يجب أن يكون قبل أو مساويًا لحقل 'إلى'.");
      }
    }
  }, [filterFrom, filterTo]);

  const applyFilter = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFilterError(null);

    const noFilters = !filterText.trim() && !filterFrom && !filterTo;
    if (noFilters) {
      setFilterOpen(false);
      setDisplayedPosts(allPosts);
      setServerFilterApplied(false);
      return;
    }

    if (filterError) {
      alert("يوجد خطأ في الفلتر: " + filterError);
      return;
    }

    if (filterAbortRef.current) {
      filterAbortRef.current.abort();
    }
    const controller = new AbortController();
    filterAbortRef.current = controller;

    setFilterLoading(true);
    setLoading(true);
    try {
      const params = {};
      if (filterText.trim()) params.text = filterText.trim();
      if (filterFrom) {
        const d = new Date(filterFrom);
        if (!isNaN(d)) params.From = d.toISOString();
      }
      if (filterTo) {
        const d = new Date(filterTo);
        if (!isNaN(d)) params.To = d.toISOString();
      }

      const res = await api.get("/Post/GetAllWithFilteration", {
        params,
        signal: controller.signal,
      });
      const fetched = res.data ?? [];

      const sorted = sortPostsDesc(Array.isArray(fetched) ? fetched : []);
      setAllPosts(sorted);
      setDisplayedPosts(sorted);
      setLikes(buildInitialLikes(sorted));
      setFilterOpen(false);
      setServerFilterApplied(true);

      const sp = new URLSearchParams();
      if (params.text) sp.set("text", params.text);
      if (params.From) sp.set("from", params.From);
      if (params.To) sp.set("to", params.To);
      const basePath = location.pathname || "/react-app";
      navigate(`${basePath}?${sp.toString()}`, { replace: true });
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") {
        console.warn("Filter request aborted");
      } else {
        console.error("Failed to fetch filtered posts:", err?.response ?? err);
        setFilterError("فشل جلب البوستات المفلترة. افتح Console لرؤية التفاصيل.");
        alert("فشل جلب البوستات المفلترة. افتح Console لرؤية التفاصيل.");
      }
    } finally {
      setFilterLoading(false);
      setLoading(false);
      filterAbortRef.current = null;
    }
  };

  const resetFilters = () => {
    setFilterText("");
    setFilterFrom("");
    setFilterTo("");
    setFilterError(null);
    getPosts();
    navigate(location.pathname, { replace: true });
  };

  const clearFiltersLocally = () => {
    setFilterText("");
    setFilterFrom("");
    setFilterTo("");
    setFilterError(null);
    setDisplayedPosts(allPosts);
    setServerFilterApplied(false);
  };

  const handleLikeToggle = async (postId) => {
    if (pendingLikes[postId]) return;

    const userId = getUserId();
    if (!userId) {
      console.warn("UserId (idUser) not found in localStorage.");
      alert("لم أجد idUser في localStorage. خزّن idUser أولاً.");
      return;
    }

    const prev = likes[postId] || { count: 0, isLiked: false };

    const newLikeState = {
      count: Math.max(prev.count + (prev.isLiked ? -1 : 1), 0),
      isLiked: !prev.isLiked,
    };
    setLikes((s) => ({ ...s, [postId]: newLikeState }));

    setPendingLikes((p) => ({ ...p, [postId]: true }));

    try {
      const willBeLiked = !prev.isLiked;

      let res;
      if (willBeLiked) {
        res = await api.post("/PostLike/Add", null, {
          params: { postID: Number(postId), UserId: Number(userId) },
        });
      } else {
        res = await api.delete("/PostLike/Remove", {
          params: { postID: Number(postId), UserId: Number(userId) },
        });
      }

      const serverIsLikedIt = res?.data?.isLikedIt;
      const serverNumberLike = res?.data?.numberLike ?? res?.data?.numberOfLikes ?? null;

      if (serverIsLikedIt !== undefined && serverIsLikedIt !== null) {
        const serverIsLiked = parseIsLiked(serverIsLikedIt);
        setLikes((s) => ({
          ...s,
          [postId]: {
            count:
              serverNumberLike != null
                ? Number(serverNumberLike)
                : Math.max(prev.count + (serverIsLiked ? 1 : 0) - (prev.isLiked && !serverIsLiked ? 1 : 0), 0),
            isLiked: serverIsLiked,
          },
        }));
      } else if (serverNumberLike != null) {
        setLikes((s) => ({
          ...s,
          [postId]: {
            ...s[postId],
            count: Number(serverNumberLike),
          },
        }));
      }
    } catch (error) {
      console.error("Like API error, rolling back:", {
        message: error.message,
        response: error.response ? { status: error.response.status, data: error.response.data } : null,
      });
      setLikes((s) => ({
        ...s,
        [postId]: { count: prev.count, isLiked: prev.isLiked },
      }));
      alert("فشل تحديث اللايك. افتح Console لرؤية التفاصيل.");
    } finally {
      setPendingLikes((p) => {
        const copy = { ...p };
        delete copy[postId];
        return copy;
      });
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  };

  const stop = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
  };

  const sanitizeHtml = (dirty) => {
    if (!dirty) return "";
    return DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
    });
  };

  const openLikedUsersModal = async (postId) => {
    setLikedUsers([]);
    setLikedUsersError(null);
    setLikedUsersLoading(true);
    setModalOpenPostId(postId);

    try {
      const res = await api.get("/PostLike/GetUserLikedPost", {
        params: { postID: Number(postId) },
      });
      const data = res?.data ?? [];
      setLikedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch liked users:", err?.response ?? err);
      setLikedUsersError("فشل جلب المستخدمين. افتح Console لرؤية التفاصيل.");
    } finally {
      setLikedUsersLoading(false);
      document.body.classList.add("overflow-hidden");
    }
  };

  const closeLikedUsersModal = () => {
    setModalOpenPostId(null);
    setLikedUsers([]);
    setLikedUsersLoading(false);
    setLikedUsersError(null);
    document.body.classList.remove("overflow-hidden");
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && modalOpenPostId != null) closeLikedUsersModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpenPostId]);

  const openDeleteModal = (e, postId) => {
    stop(e);
    setDeleteConfirmPostId(postId);
    document.body.classList.add("overflow-hidden");
  };

  const closeDeleteModal = () => {
    setDeleteConfirmPostId(null);
    document.body.classList.remove("overflow-hidden");
  };

  const confirmDeletePost = async () => {
    const postId = deleteConfirmPostId;
    if (!postId) return;
    setDeletingPostId(postId);

    try {
      await api.delete("/Post/Delete", {
        params: { id: Number(postId) },
      });

      setAllPosts((s) => s.filter((p) => p.id !== postId));
      setDisplayedPosts((s) => s.filter((p) => p.id !== postId));
      setLikes((s) => {
        const copy = { ...s };
        delete copy[postId];
        return copy;
      });

      closeDeleteModal();
      alert("تم حذف البوست بنجاح.");
    } catch (err) {
      console.error("Failed to delete post:", err?.response ?? err);
      alert("فشل حذف البوست. افتح Console للمزيد من التفاصيل.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleEditPost = (e, postId) => {
    stop(e);
    navigate(`/react-app/Post/Edit/${postId}`);
  };

  const openCommentsModal = (e, postId) => {
    stop(e);
    setCommentsModalPostId(postId);
  };

  const closeCommentsModal = () => setCommentsModalPostId(null);

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
              <img src={m.src} alt={post.title ? `${post.title} media` : `post-${post.id}-media-0`} loading="lazy" className="w-full h-full object-cover transform transition duration-300 group-hover:scale-[1.02]" onError={(e) => (e.currentTarget.style.display = "none")} />
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
                <img src={m.src} alt={`post-${post.id}-img-${i}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]" onError={(e) => (e.currentTarget.style.display = "none")} />
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

    if (total === 3) {
      return (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-2 aspect-[16/9] overflow-hidden rounded-2xl shadow-sm">
            {media[0].type === "image" ? (
              <img src={media[0].src} alt={`post-${post.id}-img-0`} className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : media[0].thumb ? (
              <img src={media[0].thumb} alt="video-thumb" className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {media.slice(1, 3).map((m, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-2xl shadow-sm">
                {m.type === "image" ? (
                  <img src={m.src} alt={`post-${post.id}-img-${i + 1}`} className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : m.thumb ? (
                  <img src={m.thumb} alt="video-thumb" className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (total === 4) {
      return (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {media.slice(0, 4).map((m, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl shadow-sm">
              {m.type === "image" ? (
                <img src={m.src} alt={`post-${post.id}-img-${i}`} className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : m.thumb ? (
                <img src={m.thumb} alt="video-thumb" className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    const showCount = Math.min(4, total);
    return (
      <div className="mt-4 grid grid-cols-2 gap-3">
        {media.slice(0, showCount).map((m, i) => {
          const isLast = i === showCount - 1;
          const remaining = total - showCount;
          return (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              {m.type === "image" ? (
                <img src={m.src} alt={`post-${post.id}-img-${i}`} className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : m.thumb ? (
                <img src={m.thumb} alt="video-thumb" className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white">Video</div>
              )}

              {isLast && remaining > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-2xl font-semibold">
                  +{remaining}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-4xl px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-200 rounded-2xl" />
              <div className="h-64 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Inline CSS for slide-down new-post animation and banner */}
      <style>{`
        /* gentle slide-down for new posts */
        @keyframes slideDownGentle {
          0% {
            transform: translateY(-14px);
            opacity: 0;
          }
          60% {
            transform: translateY(2px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .new-post-slide {
          animation: slideDownGentle 780ms cubic-bezier(.2,.9,.25,1);
          border: 1px solid rgba(59,130,246,0.12);
          box-shadow: 0 8px 22px rgba(59,130,246,0.05);
        }

        /* subtle persistent highlight for a bit after slide */
        .new-post-highlight {
          transition: box-shadow .45s ease, background-color .45s ease;
          box-shadow: 0 10px 30px rgba(59,130,246,0.08);
          background: linear-gradient(90deg, rgba(59,130,246,0.03), rgba(99,102,241,0.02));
        }

        /* new posts banner */
        .new-posts-banner {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 24px;
          z-index: 60;
          background: linear-gradient(90deg,#06b6d4,#6366f1);
          color: white;
          padding: 8px 14px;
          border-radius: 999px;
          box-shadow: 0 8px 30px rgba(2,6,23,0.12);
          display: flex;
          gap: 10px;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        .new-posts-banner small {
          opacity: .92;
          font-weight: 600;
          font-size: 13px;
        }
        .new-posts-badge {
          background: white;
          color: #0f172a;
          padding: 4px 8px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 6px 18px rgba(15,23,42,0.06);
        }
        @media (min-width: 1024px) {
          .lg\\:ml-8 {
            margin-left: -7rem;
            margin-right: 71px;
          }
        }
      `}</style>

      <div className="w-full py-10">


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:mr-4">
          <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1 lg:mr-4 lg:ml-2">
            {/* Followers List */}
            <div className="w-full">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                الأصدقاء
              </h3>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full">
                {/* Search Input */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={followersSearchText}
                      onChange={(e) => setFollowersSearchText(e.target.value)}
                      placeholder="البحث عن صديق..."
                      className="w-full bg-gray-100 rounded-full px-4 py-2.5 pr-10 text-right text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                      dir="rtl"
                    />
                    {followersSearchText ? (
                      <button
                        onClick={() => setFollowersSearchText("")}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition cursor-pointer flex items-center justify-center"
                        aria-label="مسح البحث"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>

                {followersLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                  <p className="text-xs text-slate-500 mt-2">جاري التحميل...</p>
                </div>
              )}
              
              {followersError && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{followersError}</div>
              )}
              
              {!followersLoading && !followersError && followers.length === 0 && (
                <div className="text-slate-400 text-sm text-center py-4">لا توجد قائمة متابعة حالياً.</div>
              )}
              
              {!followersLoading && followers.length > 0 && (() => {
                // Filter followers based on search text
                const filteredFollowers = followers.filter((follower) => {
                  if (!followersSearchText.trim()) return true;
                  const searchLower = followersSearchText.toLowerCase();
                  const userName = (follower.userName || "").toLowerCase();
                  const universityName = (follower.universityName || "").toLowerCase();
                  return userName.includes(searchLower) || universityName.includes(searchLower);
                });

                if (filteredFollowers.length === 0 && followersSearchText.trim()) {
                  return (
                    <div className="text-slate-400 text-sm text-center py-4">
                      لا توجد نتائج للبحث "{followersSearchText}"
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredFollowers.map((follower) => (
                    <div
                      key={follower.id}
                      onClick={() => {
                        if (follower.id) {
                          navigate(`/Profile/${follower.id}`);
                        }
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-indigo-200 hover:shadow-sm group"
                    >
                      {/* Avatar */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (follower.id && follower.id !== user?.id) {
                            navigate(`/Profile/${follower.id}`);
                          }
                        }}
                        className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 border-2 border-indigo-200 group-hover:border-indigo-400 transition cursor-pointer"
                      >
                        {follower.imageUrl ? (
                          <img 
                            src={follower.imageUrl} 
                            alt={follower.userName || "User"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                            {(follower.userName || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition">
                          {follower.userName || "مستخدم"}
                        </div>
                        {follower.universityName && (
                          <div className="text-xs text-slate-500 truncate">
                            {follower.universityName}
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow Icon */}
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    ))}
                  </div>
                );
              })()}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-5 space-y-6 order-1 lg:order-2 max-w-3xl mx-auto lg:ml-2">
            {/* Search Bar and Filter */}
            <div className="flex items-center gap-3 mb-4 max-w-3xl mx-auto">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="البحث عن المنشور"
                    className="w-full bg-gray-100 rounded-full px-4 py-2.5 pr-10 text-right text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    dir="rtl"
                  />
                  {filterText ? (
                    <button
                      onClick={() => setFilterText("")}
                      className="absolute left-4 w-5 h-5 text-gray-400 hover:text-gray-600 transition cursor-pointer flex items-center justify-center"
                      aria-label="مسح البحث"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Filter Button */}
              <button 
                onClick={() => setFilterOpen((s) => !s)} 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
                aria-expanded={filterOpen} 
                aria-controls="posts-filter-panel"
              >
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                  <path d="M3 4h18M7 8h10M11 12h2M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="18" cy="4" r="2" fill="currentColor"/>
                  <circle cx="6" cy="8" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="15" cy="16" r="2" fill="currentColor"/>
                </svg>
              </button>
            </div>

            {/* Filter panel (expanded) */}
            {filterOpen && (
              <form id="posts-filter-panel" onSubmit={applyFilter} className="mb-4 max-w-3xl mx-auto bg-white border border-slate-100 rounded-2xl p-4 shadow-sm" onClick={(e) => stop(e)}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <label className="text-xs text-slate-500 block mb-1">نص البحث</label>
                    <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="ابحث في العناوين أو المحتوى أو الإسم..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                    <div className="text-xs text-slate-400 mt-1">المعاينة تظهر فورياً. اضغط "تطبيق الفلتر" لجلب النتائج من السيرفر.</div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">من (تاريخ/وقت)</label>
                    <input type="datetime-local" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">إلى (تاريخ/وقت)</label>
                    <input type="datetime-local" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                </div>

                {filterError && <div className="text-red-500 text-sm mt-2">{filterError}</div>}

                <div className="mt-4 flex gap-2 justify-end items-center">
                  <div className="text-xs text-slate-500 mr-auto">{serverFilterApplied ? "نتائج من السيرفر" : "معاينة محلية"}</div>

                  <button type="button" onClick={resetFilters} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition" disabled={filterLoading}>إعادة ضبط</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:brightness-105 transition" disabled={filterLoading || !!filterError}>{filterLoading ? "جارٍ التطبيق..." : "تطبيق الفلتر"}</button>
                </div>
              </form>
            )}

            {/* Create Post Input (Facebook-style) - Above posts */}
            <div 
              onClick={() => setShowCreatePostModal(true)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden p-5 md:p-6 -mt-4"
              dir="rtl"
            >
              {/* Top section with profile picture and input */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    // نفس سلوك dashboard-home__profile-header - الانتقال إلى Dashboard مع فتح التاب profile
                    navigate("/dashboard", { 
                      state: { openProfile: true } 
                    });
                    setTimeout(() => {
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }, 0);
                  }}
                  className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                >
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={user?.userName || "User"} 
                      className="w-full h-full object-cover rounded-full" 
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-sm">
                      {user?.userName ? user.userName.split(" ").map(n => n[0]).slice(0, 2).join("") : "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-right text-gray-500 text-base bg-gray-50 rounded-full px-4 py-3 hover:bg-gray-100 transition">
                  {user?.userName || "مستخدم"}, ما الذي يدور في ذهنك؟
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-3"></div>

              {/* Bottom section with action buttons */}
              <div className="flex items-center justify-around">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCreatePostModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex-1 justify-center"
                >
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">بث مباشر</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setPendingFiles(files);
                      setShowCreatePostModal(true);
                    }
                    // Reset input
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex-1 justify-center"
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">صور/فيديو</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCreatePostModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex-1 justify-center"
                >
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.536a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">مشاعر/أنشطة</span>
                </button>
              </div>
            </div>

            {displayedPosts?.length === 0 && <p className="text-slate-600">No posts found.</p>}

            {displayedPosts?.map((post) => {
              const likeState = likes[post.id] || {
                count: post.numberLike ?? 0,
                isLiked: parseIsLiked(post.isLikedIt),
              };
              const disabled = !!pendingLikes[post.id];

              const isOwner = Number(post.userId) === Number(getUserId());

              // if this post is currently highlighted, add the highlight class
              const isHighlighted = highlightedPosts.includes(post.id);

              // apply slide animation when it's newly added (we consider highlighted as new)
              const entryClass = isHighlighted ? "new-post-slide new-post-highlight" : "";

              return (
                <article
                  key={post.id}
                  onClick={() => navigate(`/react-app/Post/${post.id}`)}
                  className={`group bg-white rounded-3xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1 duration-200 overflow-hidden border border-transparent ${entryClass}`}
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <div onClick={(e) => { 
                        stop(e); 
                        if (post.userId) {
                          navigate(`/Profile/${post.userId}`); 
                        }
                      }} className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                        {post.imageURL ? (
                          <img src={post.imageURL} alt={`${post.userName || "User"} avatar`} className="w-12 h-12 object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">{getInitials(post.userName)}</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate">
                            <div className="text-sm font-semibold text-slate-900 truncate">{post.userName || "Unknown"}</div>
                            <div className="text-xs text-slate-400 truncate">{formatDate(post.createdAt)}</div>
                          </div>

                          {isOwner && (
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => handleEditPost(e, post.id)} className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition">تعديل</button>
                              <button onClick={(e) => openDeleteModal(e, post.id)} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition">حذف</button>
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          {post.title && <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-tight">{post.title}</h2>}

                          {post.content && (
                            <div className="text-slate-700 text-sm md:text-base leading-relaxed max-w-none prose prose-sm" onClick={(e) => stop(e)} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">{renderMediaGrid(post)}</div>

                    {post.postTags?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.postTags.map((tag) => (
                          <button key={tag.id} onClick={(e) => { stop(e); navigate(`/react-app/Algorithms/${tag.id}`); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(e); navigate(`/react-app/Algorithms/${tag.id}`); } }} className="text-xs px-3 py-1 rounded-full border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100 transition">#{tag.tagName}</button>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => { stop(e); handleLikeToggle(post.id); }} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${likeState.isLiked ? "bg-gradient-to-r from-pink-100 to-orange-100 text-pink-600 shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`} aria-pressed={likeState.isLiked} disabled={disabled}>
                          <span className="text-lg">{likeState.isLiked ? "♥" : "♡"}</span>
                          <span>{likeState.count}</span>
                        </button>

                        <button onClick={(e) => { stop(e); openLikedUsersModal(post.id); }} className="text-sm px-3 py-2 rounded-md text-slate-700 bg-white border border-slate-100 shadow-sm hover:shadow-md transition" aria-label="عرض المعجبين">عرض المعجبين</button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={(e) => openCommentsModal(e, post.id)} className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-md transition">💬 تعليق</button>
                        <button onClick={(e) => { stop(e); navigator.clipboard?.writeText(window.location.origin + `/react-app/Post/${post.id}`); alert("رابط البوست تم نسخه إلى الحافظة"); }} className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-md transition">↗ مشاركة</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Right Sidebar - Popular Tags */}
          <aside className="lg:col-span-3 space-y-6 order-3 lg:ml-8">
            <div className="hidden md:block sticky top-4 space-y-6 lg:ml-2">
              {/* Events Component */}
              <div className="rounded-2xl border border-gray-200 shadow-sm p-5">
                <Events />
              </div>
              
              {/* Popular Tags */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" style={{ color: "#007C89" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h5 className="text-base font-bold text-slate-900">شائع الآن</h5>
                </div>
                <div className="space-y-2">
                  {popularLoading && (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-t-transparent" style={{ borderColor: "#007C89" }}></div>
                      <p className="text-xs text-slate-500 mt-2">جاري التحميل...</p>
                    </div>
                  )}
                  {popularError && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">{popularError}</div>
                  )}
                  {!popularLoading && !popularError && popularTags.length === 0 && (
                    <div className="text-slate-400 text-sm text-center py-4">لا توجد بيانات شائعة حالياً.</div>
                  )}
                  {!popularLoading && popularTags.map((t) => (
                    <div
                      key={t.tagId ?? t.tagId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/react-app/Algorithms/${t.tagId}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/react-app/Algorithms/${t.tagId}`);
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group"
                      style={{
                        background: "linear-gradient(to right, rgba(0, 124, 137, 0.1), rgba(0, 124, 137, 0.05))",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(to right, rgba(0, 124, 137, 0.15), rgba(0, 124, 137, 0.1))";
                        e.currentTarget.style.borderColor = "rgba(0, 124, 137, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(to right, rgba(0, 124, 137, 0.1), rgba(0, 124, 137, 0.05))";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <span className="text-sm font-semibold transition" style={{ color: "#007C89" }} onMouseEnter={(e) => e.currentTarget.style.color = "#005a64"} onMouseLeave={(e) => e.currentTarget.style.color = "#007C89"}>#{t.tagName}</span>
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded-full bg-white border transition"
                        style={{ 
                          color: "#007C89",
                          borderColor: "rgba(0, 124, 137, 0.3)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(0, 124, 137, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        {t.numberOfUsed ?? "0"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* New posts banner (shown when user is scrolled down and there are pending posts) */}
      {showNewPostsBanner && pendingNewPosts.length > 0 && (
        <div
          className="new-posts-banner"
          role="button"
          onClick={() => {
            // flush and scroll into view
            flushPendingNewPosts({ scrollToTop: true });
          }}
          aria-live="polite"
        >
          <div>منشورات جديدة</div>
          <div className="new-posts-badge">{pendingNewPosts.length}</div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsModalPostId != null && <CommentsModal postId={commentsModalPostId} onClose={closeCommentsModal} />}

      {/* Delete confirmation modal */}
      {deleteConfirmPostId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" onClick={closeDeleteModal}>
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 mb-4">هل أنت متأكد أنك تريد حذف هذا البوست؟ لا يمكن التراجع عن العملية.</p>

              <div className="flex justify-end gap-3">
                <button onClick={closeDeleteModal} className="px-4 py-2 bg-slate-100 rounded-md" disabled={!!deletingPostId}>إلغاء</button>
                <button onClick={confirmDeletePost} className="px-4 py-2 bg-red-600 text-white rounded-md" disabled={!!deletingPostId}>{deletingPostId ? "جارٍ الحذف..." : "حذف نهائي"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for liked users */}
      {modalOpenPostId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" onClick={closeLikedUsersModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">المعجبون</h3>
              <button onClick={closeLikedUsersModal} className="text-slate-500 hover:text-slate-700 rounded-md p-1" aria-label="إغلاق">✕</button>
            </div>

            <div className="p-4 max-h-80 overflow-auto">
              {likedUsersLoading && <p className="text-slate-600">جاري التحميل...</p>}
              {likedUsersError && <p className="text-red-500">{likedUsersError}</p>}

              {!likedUsersLoading && !likedUsersError && likedUsers.length === 0 && <p className="text-slate-600">لا يوجد معجبون بعد.</p>}

              {!likedUsersLoading && likedUsers.length > 0 && (
                <ul className="space-y-3">
                  {likedUsers.map((u) => (
                    <li key={u.userId} role="button" tabIndex={0} onClick={() => { 
                      closeLikedUsersModal(); 
                      if (u.userId) {
                        navigate(`/Profile/${u.userId}`); 
                      }
                    }} onKeyDown={(e) => { 
                      if (e.key === "Enter" || e.key === " ") { 
                        e.preventDefault(); 
                        closeLikedUsersModal(); 
                        if (u.userId) {
                          navigate(`/Profile/${u.userId}`); 
                        }
                      } 
                    }} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        {u.imageURL ? (
                          <img src={u.imageURL} alt={u.userName || "user"} className="w-12 h-12 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center text-sm font-semibold text-slate-700">{(u.userName || "U").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{u.userName || "Unknown"}</div>
                        <div className="text-xs text-slate-400">ID: {u.userId}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setPendingFiles(null);
        }}
        onPostCreated={() => {
          // Refresh posts after creation
          getPosts();
          setPendingFiles(null);
        }}
        initialFiles={pendingFiles}
      />
    </div>
  );
};

export default PostsPage;