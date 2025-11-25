import api from "./api";

const handelSubmission = async ({ code, idProblem, idUser }) => {
  const response = await api.post("/Submission/HandelSubmission", {
    code,
    idProblem,
    idUser,
  });
  return response.data; // { status: "string", isAccepted: 0 }
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

