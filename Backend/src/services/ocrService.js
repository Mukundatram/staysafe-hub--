const Tesseract = require('tesseract.js');
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
        // Ensure path is absolute
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(__dirname, '../../', filePath);

        if (!fs.existsSync(absolutePath)) {
            console.error('OCR Error: File not found at path:', absolutePath);
            return '';
        }

        console.log(`Starting OCR on file: ${absolutePath}`);

        // Use Tesseract to recognize text
        // we use English by default. For student IDs, this is usually sufficient.
        const { data: { text } } = await Tesseract.recognize(
            absolutePath,
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
