export const formatTag = (tag: string): string => {
  return tag
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens, but preserve Arabic characters
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

export const formatTagForDisplay = (tag: string): string => {
  return tag
    .split('-')
    .map(word => {
      // Check if word starts with Arabic character
      const isArabic = /[\u0600-\u06FF]/.test(word[0]);
      if (isArabic) {
        return word; // Keep Arabic words as is
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}; 