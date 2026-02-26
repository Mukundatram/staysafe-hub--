import { useState, useEffect } from 'react';
import documentService from '../services/documentService';

/**
 * Custom hook to fetch an authenticated document preview as a blob URL.
 * Uses the /api/documents/download/:id endpoint which requires authentication.
 *
 * @param {string|null} documentId - The document's _id
 * @returns {{ previewUrl: string|null, loading: boolean, error: string|null }}
 */
const useDocumentPreview = (documentId) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!documentId) {
            setPreviewUrl(null);
            return;
        }

        let objectUrl = null;
        let cancelled = false;

        const fetchPreview = async () => {
            try {
                setLoading(true);
                setError(null);
                const blob = await documentService.downloadDocument(documentId);
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setPreviewUrl(objectUrl);
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load document preview:', err);
                    setError('Unable to load document preview');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPreview();

        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [documentId]);

    return { previewUrl, loading, error };
};

export default useDocumentPreview;
