// Helper function to create API paths with /api prefix
const createApiPath = (path) => `/api${path}`;

export const API_PATHS = {
    AUTH: {
        REGISTER: createApiPath("/auth/register"),
        LOGIN: createApiPath("/auth/login"),
        REFRESH: createApiPath("/auth/refresh-token"),
        GET_PROFILE: createApiPath("/auth/profile"),
        UPLOAD_IMAGE: createApiPath("/auth/upload-image")
    },
    
    IMAGE: {
        UPLOAD_IMAGE: createApiPath("/auth/upload-image"),
    },

    AI: {
        GENERATE_QUESTIONS: createApiPath("/ai/generate-questions"),
        GENERATE_EXPLANATION: createApiPath("/ai/generate-explanation"),
    },
    
    SESSION: {
        CREATE: createApiPath("/sessions/create"),
        GET_ALL: createApiPath("/sessions/my-sessions"),
        GET_ONE: (id) => createApiPath(`/sessions/${id}`),
        DELETE: (id) => createApiPath(`/sessions/${id}`),
    },

    QUESTION: {
        ADD_TO_SESSION: createApiPath("/questions/add"),
        PIN: (id) => createApiPath(`/questions/${id}/pin`),
        UPDATE_NOTE: (id) => createApiPath(`/questions/${id}/note`),
    },
};