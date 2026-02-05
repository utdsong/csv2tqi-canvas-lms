import jschardet from 'jschardet';

export interface EncodingResult {
  content: string;
  detectedEncoding: string;
  confidence: number;
}

/**
 * Reads a file, detects its encoding using jschardet, and decodes it to a UTF-8 string.
 * This is crucial for fixing messed up Khmer text from legacy encodings (like Windows-1252 interpreting UTF-8 or actual legacy formats).
 */
export async function detectAndFixEncoding(file: File): Promise<EncodingResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        
        // Convert ArrayBuffer to binary string for jschardet
        // jschardet expects a binary string or byte array
        const binaryString = new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '');
        
        const detection = jschardet.detect(binaryString);
        const encoding = detection.encoding || 'utf-8';
        
        console.log('Detected encoding:', encoding, 'Confidence:', detection.confidence);

        // Decode using the detected encoding
        const decoder = new TextDecoder(encoding);
        const decodedContent = decoder.decode(buffer);

        resolve({
          content: decodedContent,
          detectedEncoding: encoding,
          confidence: detection.confidence,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
