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
    baseUrl.searchParams.set('source', 'artful-connective-hub');
    return baseUrl.toString();
  };

  const getShareLinks = (url: string, title: string, description: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const artSpaceBranding = 'via Artful Connective Hub';

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle} ${artSpaceBranding}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle} ${artSpaceBranding}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription} ${artSpaceBranding}`,
      whatsapp: `https://wa.me/?text=${encodedTitle} ${artSpaceBranding} ${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle} ${artSpaceBranding}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription} ${artSpaceBranding}%0A%0A${encodedUrl}`
    };
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
      return true;
    } catch (error) {
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
      window.open(url, '_blank', 'width=600,height=400');
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