import React from "react";
import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <div
      style={{
        backgroundColor: "#0d1117",
        color: "#00ff99",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Fira Code', monospace",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        style={{
          border: "4px solid #00ff99",
          borderTop: "4px solid transparent",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          marginBottom: "20px",
        }}
      ></motion.div>

      <motion.h2
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ fontSize: "1.5rem", textAlign: "center" }}
      >
        Running algorithm...
      </motion.h2>

      <motion.p
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        style={{ fontSize: "0.9rem", color: "#888", marginTop: "10px" }}
      >
        Compiling your code ⚙️
      </motion.p>
    </div>
  );
};

export default LoadingPage;
