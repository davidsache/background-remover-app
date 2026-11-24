export interface ImageMetadata {
  sizeFormatted: string;
  sizeBytes: string;
  format: string;
  mimeType: string;
  width: string;
  height: string;
}

/**
 * Returns the formatted bytes e.g: 182000 bytes would return as 182 KB.
 * @param bytes Number of bytes.
 * @returns String with the formatted bytes.
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Returns the metadata of the passed image blob.
 * @param blob Image blob.
 * @returns Object with the metadata of the image.
 */
export const getBlobMetadata = async (blob: Blob): Promise<ImageMetadata> => {
  // Decode image header in memory to read pixel dimensions
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width.toString();
  const height = bitmap.height.toString();
  bitmap.close();

  // Extract uppercase extension from MIME type (e.g., 'image/png' -> 'PNG')
  const format = blob.type.split('/')[1]?.toUpperCase() || 'UNKNOWN';

  return {
    sizeBytes: blob.size.toString(),
    sizeFormatted: formatBytes(blob.size),
    format,
    mimeType: blob.type,
    width,
    height
  };
};