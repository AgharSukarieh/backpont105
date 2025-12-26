import api from "./api";

const handelSubmission = async ({ code, idProblem, idUser }) => {
  try {
    console.log("📤 Sending submission to API:", {
      codeLength: code?.length,
      idProblem,
      idUser,
    });
    
    const response = await api.post("/api/submissions", {
    code,
    idProblem,
    idUser,
  });
    
    console.log("✅ Submission response:", response.data);
  return response.data; // { status: "string", isAccepted: 0 }
  } catch (err) {
    console.error("❌ Submission error:", err.response?.data || err.message);
    throw err;
  }
};

export const getUserSubmissions = async (userId, page = 1, perPage = 12) => {
  try {
    const res = await api.get(`/Submission/User/${userId}`, {
      params: {
        numberPage: page,
        perPage: perPage,
      },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching user submissions:", err);
    throw err;
  }
};

export const getSubmissionById = async (submissionId) => {
  try {
    const res = await api.get(`/Submission/${submissionId}`);
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching submission:", err);
    throw err;
  }
};

export { handelSubmission };

