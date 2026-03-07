const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Extracts text from an image file using Tesseract.js
 * 
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(filePath) {
    try {
        let targetBuffer = filePath;

        // If it's a Cloudinary URL, fetch the image array buffer first
        if (filePath.startsWith('http')) {
            console.log(`Fetching remote image for OCR: ${filePath}`);
            const response = await axios.get(filePath, { responseType: 'arraybuffer' });
            targetBuffer = Buffer.from(response.data, 'binary');
        } else {
            // Fallback for local testing if path is still relative
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(__dirname, '../../', filePath);

            if (!fs.existsSync(absolutePath)) {
                console.error('OCR Error: File not found locally:', absolutePath);
                return '';
            }
            targetBuffer = absolutePath;
        }

        console.log(`Starting OCR Analysis...`);

        // Use Tesseract to recognize text
        // we use English by default. For student IDs, this is usually sufficient.
        const { data: { text } } = await Tesseract.recognize(
            targetBuffer,
            'eng',
            { logger: m => console.log(`OCR Progress: ${m.status} - ${(m.progress * 100).toFixed(2)}%`) }
        );

        console.log('OCR Extraction complete length:', text.length);
        return text;
    } catch (error) {
        console.error('OCR Extraction failed:', error);
        return '';
    }
}

module.exports = {
    extractTextFromImage
};
