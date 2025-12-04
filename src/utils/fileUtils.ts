/**
 * Gets the MIME type based on file extension
 * @param fileName - The file name or path
 * @returns The MIME type string (defaults to 'image/jpeg')
 */
export const getMimeTypeFromExtension = (fileName: string): string => {
  if (!fileName) return 'image/jpeg';
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'image/jpeg';
  }
};

