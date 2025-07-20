import * as fs from "fs";
import * as path from "path";

function imageToBase64(imagePath: string): { base64: string; mimeType: string } {
    const fullPath = path.resolve(imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    
    const extension = path.extname(imagePath).toLowerCase();
    let mimeType: string;
    
    switch (extension) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/png';
    }
    
    return { base64, mimeType };
  }

export { imageToBase64 };