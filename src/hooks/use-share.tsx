import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface ShareOptions {
  url: string;
  title: string;
  description?: string;
  type: 'post' | 'project' | 'reel';
  author?: {
    username: string;
    displayName: string;
  };
  image?: string;
}

export function useShare() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOptions | null>(null);
  const { t, isRtl } = useTranslation();

  const openShareModal = (options: ShareOptions) => {
    setShareOptions(options);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setShareOptions(null);
  };

  const getShareUrl = (url: string, includeAttribution: boolean, author?: { username: string; displayName: string }) => {
    const baseUrl = new URL(url);
    if (includeAttribution && author) {
      baseUrl.searchParams.set('via', author.username);
    }
    baseUrl.searchParams.set('source', 'art-space');
    return baseUrl.toString();
  };

  const getShareLinks = (url: string, title: string, description: string, image?: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const encodedImage = image ? encodeURIComponent(image) : '';

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}${image ? `&picture=${encodedImage}` : ''}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${image ? `&via=artspace&related=artspace&hashtags=artspace` : ''}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}${image ? `&image=${encodedImage}` : ''}`,
      whatsapp: `https://wa.me/?text=${encodedTitle} ${encodedUrl}${image ? ` ${encodedImage}` : ''}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}${image ? `&image=${encodedImage}` : ''}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription} %0A%0A${encodedUrl}${image ? `%0A%0AImage: ${encodedImage}` : ''}`
    };
  };

  const handleCopyLink = async (url: string) => {
    try {
      // Try using the modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
          toast.success(t('linkCopied'));
          return true;
        } catch (err) {
          textArea.remove();
          throw err;
        }
      }
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error(t('errorCopyingLink'));
      return false;
    }
  };

  const handleEmailShare = async (email: string, subject: string, body: string) => {
    try {
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      return true;
    } catch (error) {
      toast.error(t('errorSharingEmail'));
      return false;
    }
  };

  const handleSocialShare = (platform: string, url: string) => {
    try {
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      window.open(
        url,
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      return true;
    } catch (error) {
      toast.error(t('errorSharingSocial'));
      return false;
    }
  };

  return {
    isShareModalOpen,
    shareOptions,
    openShareModal,
    closeShareModal,
    getShareUrl,
    getShareLinks,
    handleCopyLink,
    handleEmailShare,
    handleSocialShare
  };
} 