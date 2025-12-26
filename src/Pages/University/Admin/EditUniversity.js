import React from "react";
import { useParams } from "react-router-dom";

export default function EditUniversity() {
  const { id } = useParams();
  
  console.log("🔍 EditUniversity component rendered!");
  console.log("🔍 ID:", id);
  console.log("🔍 Full URL:", window.location.href);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
      padding: "40px 20px",
      direction: "rtl",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: "#111827",
          marginBottom: "10px"
        }}>
          ✅ صفحة تعديل الجامعة تعمل!
        </h1>
        
        <p style={{
          fontSize: "18px",
          color: "#6b7280",
          marginBottom: "30px"
        }}>
          معرف الجامعة: <strong style={{ color: "#2563eb" }}>{id || "غير محدد"}</strong>
        </p>

        <div style={{
          backgroundColor: "#f0f9ff",
          border: "2px solid #2563eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1e40af",
            marginBottom: "15px"
          }}>
            معلومات الصفحة:
          </h2>
          <ul style={{
            listStyle: "none",
            padding: 0,
            margin: 0
          }}>
            <li style={{ marginBottom: "10px", color: "#374151" }}>
              <strong>URL:</strong> {window.location.href}
            </li>
            <li style={{ marginBottom: "10px", color: "#374151" }}>
              <strong>Path:</strong> {window.location.pathname}
            </li>
            <li style={{ marginBottom: "10px", color: "#374151" }}>
              <strong>ID Parameter:</strong> {id || "غير موجود"}
            </li>
          </ul>
        </div>

        <div style={{
          backgroundColor: "#fef3c7",
          border: "2px solid #f59e0b",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}>
          <p style={{
            fontSize: "16px",
            color: "#92400e",
            margin: 0
          }}>
            ⚠️ هذه صفحة اختبار. إذا رأيت هذه الرسالة، فالصفحة تعمل بشكل صحيح!
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => {
              console.log("🔍 Button clicked!");
              alert("الصفحة تعمل بشكل صحيح! ID: " + id);
            }}
            style={{
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            اختبار الزر
          </button>

          <button
            onClick={() => window.location.href = "/react-app/admin/Universities"}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            العودة للقائمة
            </button>
          </div>

        <div style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "15px"
          }}>
            خطوات التحقق:
          </h3>
          <ol style={{
            paddingRight: "20px",
            color: "#374151",
            lineHeight: "1.8"
          }}>
            <li>افتح Console (F12) وتحقق من وجود رسائل تبدأ بـ 🔍</li>
            <li>إذا رأيت هذه الصفحة، فالمشكلة ليست في الـ routing</li>
            <li>إذا كانت الصفحة لا تزال بيضاء، فالمشكلة في الـ component نفسه</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
