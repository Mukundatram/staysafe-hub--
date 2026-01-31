import api from './api';

const documentService = {
  // Upload a document
  uploadDocument: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get my documents
  getMyDocuments: async () => {
    const response = await api.get('/documents/my-documents');
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await api.get('/documents/verification-status');
    return response.data;
  },

  // Get document by ID
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Download document file (returns blob)
  downloadDocument: async (id) => {
    const response = await api.get(`/documents/download/${id}`, { responseType: 'blob' });
    return response.data;
  },

  // Delete document
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Admin: Get pending documents
  getPendingDocuments: async (page = 1, limit = 10) => {
    const response = await api.get(`/documents/admin/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Admin: Get user documents
  getUserDocuments: async (userId) => {
    const response = await api.get(`/documents/admin/user/${userId}`);
    return response.data;
  },

  // Admin: Verify document
  verifyDocument: async (id, status, rejectionReason = '') => {
    const response = await api.patch(`/documents/admin/verify/${id}`, {
      status,
      rejectionReason
    });
    return response.data;
  },

  // Admin: Mark as under review
  markUnderReview: async (id) => {
    const response = await api.patch(`/documents/admin/review/${id}`);
    return response.data;
  }
};

export default documentService;
