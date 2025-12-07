import React, { useEffect, useState } from "react";
import api from "../../../Service/api";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid as RechartsGrid,
  ResponsiveContainer,
} from "recharts";

// تسجيل Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// accessibility للمودال
Modal.setAppElement("#root");

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalLikes: 0,
    postsPerUser: {},
    downloadsPerUser: {},
  });

  const fetchPosts = async () => {
    try {
      const { data } = await api.get("/Post/GetAll");
      setPosts(data);

      // احصائيات
      const userSet = new Set();
      const postsPerUser = {};
      const downloadsPerUser = {};
      let totalLikes = 0;

      data.forEach((post) => {
        userSet.add(post.userId);
        postsPerUser[post.userName] = (postsPerUser[post.userName] || 0) + 1;
        downloadsPerUser[post.userName] =
          (downloadsPerUser[post.userName] || 0) + (post.downloadCount || 0);
        totalLikes += post.likesCount || 0; // مجموع اللايكات
      });

      setStats({
        totalPosts: data.length,
        totalUsers: userSet.size,
        totalLikes,
        postsPerUser,
        downloadsPerUser,
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleView = (postId) => {
    navigate(`/react-app/admin/AdminPostDetails/${postId}`);
  };

  const handleEdit = (postId) => {
    navigate(`/react-app/admin/AdminEditPost/${postId}`);
  };

  const confirmDelete = (postId) => {
    setPostToDelete(postId);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await api.delete(`/Post/Delete`, { params: { id: postToDelete } });
      setPosts(posts.filter((p) => p.id !== postToDelete));
      setShowConfirm(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  if (loading) return <p>جاري التحميل...</p>;

  // رسم بياني 1: عدد البوستات لكل مستخدم (Chart.js)
  const chartData = {
    labels: Object.keys(stats.postsPerUser),
    datasets: [
      {
        label: "عدد البوستات لكل مستخدم",
        data: Object.values(stats.postsPerUser),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  // رسم بياني 2: عدد البوستات الإجمالي حسب الوقت (Recharts)
  const postsOverTimeData = (() => {
    const grouped = {}; // { dateString: count }

    posts.forEach((post) => {
      const date = new Date(post.createdAt);
      const dateStr = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
      grouped[dateStr] = (grouped[dateStr] || 0) + 1;
    });

    const sortedDates = Object.keys(grouped).sort();

    return sortedDates.map((date) => ({
      date,
      totalPosts: grouped[date],
    }));
  })();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">إحصائيات البوستات</h1>

      {/* احصائيات إجمالية */}
      <div className="mb-6 flex gap-4">
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-bold">عدد البوستات</h2>
          <p>{stats.totalPosts}</p>
        </div>
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-bold">عدد المستخدمين</h2>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-bold">عدد اللايكات الإجمالي</h2>
          <p>{stats.totalLikes}</p>
        </div>
      </div>

      {/* الرسم البياني الأول - Chart.js */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">عدد البوستات لكل مستخدم</h2>
        <Bar data={chartData} />
      </div>

      {/* الرسم البياني الثاني - Recharts (عدد البوستات مع الوقت لجميع المستخدمين) */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">عدد البوستات مع الوقت</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={postsOverTimeData}>
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <RechartsGrid stroke="#eee" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="totalPosts"
              stroke="#f87171"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h1 className="text-2xl font-bold mb-4">إدارة البوستات</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 border rounded-lg shadow flex items-start gap-4"
          >
            <img
              src={post.imageURL}
              alt={post.userName}
              onClick={() => navigate(`/react-app/admin/view-user/${post.userId}`)}
              className="w-16 h-16 cursor-pointer rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{post.title}</h2>
              <h3
                onClick={() =>
                  navigate(`/react-app/admin/view-user/${post.userId}`)
                }
                className="font-semibold cursor-pointer"
              >
                {post.userName}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                تاريخ الإنشاء: {new Date(post.createdAt).toLocaleString()}
              </p>
              <p className="text-gray-700 text-sm line-clamp-1 overflow-hidden">
                {post.content.replace(/<[^>]+>/g, "")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.postTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {tag.tagName}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleView(post.id)}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                عرض
              </button>
              <button
                onClick={() => handleEdit(post.id)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                تعديل
              </button>
              <button
                onClick={() => confirmDelete(post.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التأكيد */}
      <Modal
        isOpen={showConfirm}
        onRequestClose={() => setShowConfirm(false)}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-40"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-xl font-bold mb-4">تأكيد الحذف</h2>
        <p className="mb-4">هل أنت متأكد من حذف هذا البوست؟</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            حذف
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPosts;
