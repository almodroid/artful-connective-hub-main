import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Send
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useShare } from "@/hooks/use-share";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  type: 'post' | 'project' | 'reel';
  author?: {
    username: string;
    displayName: string;
  };
}

export function ShareModal({ isOpen, onClose, url, title, description, type, author }: ShareModalProps) {
  const { t, isRtl } = useTranslation();
  const { theme } = useTheme();
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [copied, setCopied] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const {
    getShareUrl,
    getShareLinks,
    handleCopyLink,
    handleEmailShare,
    handleSocialShare
  } = useShare();

  const getTypeLabel = () => {
    switch (type) {
      case 'post':
        return isRtl ? 'منشور' : 'Post';
      case 'project':
        return isRtl ? 'مشروع' : 'Project';
      case 'reel':
        return isRtl ? 'ريل' : 'Reel';
      default:
        return '';
    }
  };

  const getShareText = () => {
    const typeLabel = getTypeLabel();
    const authorText = author ? `by ${author.displayName}` : '';
    const artSpaceText = 'on Artful Connective Hub';
    return `${title} ${authorText} ${artSpaceText}`;
  };

  const getShareDescription = () => {
    const typeLabel = getTypeLabel();
    const authorText = author ? `by ${author.displayName}` : '';
    const artSpaceText = 'on Artful Connective Hub';
    return `${description || ''}\n\n${authorText} ${artSpaceText}`;
  };

  const shareUrl = getShareUrl(url, includeAttribution, author);
  const shareLinks = getShareLinks(shareUrl, getShareText(), getShareDescription());

  const handleCopy = async () => {
    const success = await handleCopyLink(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = async () => {
    const success = await handleEmailShare(
      emailAddress,
      emailSubject || getShareText(),
      emailBody || getShareDescription()
    );
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={theme === 'light' ? '/assets/logolight.png' : '/assets/logo.png'}
              alt="Artful Connective Hub Logo" 
              className="h-8 w-auto object-contain"
            />
            <DialogTitle>
              {isRtl ? `مشاركة ${getTypeLabel()}` : `Share ${getTypeLabel()}`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare('facebook', shareLinks.facebook)}
              className="h-10 w-10"
              title="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare('twitter', shareLinks.twitter)}
              className="h-10 w-10"
              title="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare('linkedin', shareLinks.linkedin)}
              className="h-10 w-10"
              title="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare('whatsapp', shareLinks.whatsapp)}
              className="h-10 w-10"
              title="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSocialShare('telegram', shareLinks.telegram)}
              className="h-10 w-10"
              title="Telegram"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label>{isRtl ? "رابط المشاركة" : "Share Link"}</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Attribution Checkbox */}
          {author && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attribution"
                checked={includeAttribution}
                onCheckedChange={(checked) => setIncludeAttribution(checked as boolean)}
              />
              <Label htmlFor="attribution">
                {isRtl 
                  ? `إضافة إشارة إلى ${author.displayName}`
                  : `Add attribution to ${author.displayName}`
                }
              </Label>
            </div>
          )}

          {/* Email Share Section */}
          <div className="space-y-2">
            <Label>{isRtl ? "مشاركة عبر البريد الإلكتروني" : "Share via Email"}</Label>
            <Input
              type="email"
              placeholder={isRtl ? "عنوان البريد الإلكتروني" : "Email address"}
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
            <Input
              placeholder={isRtl ? "الموضوع" : "Subject"}
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              defaultValue={getShareText()}
            />
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder={isRtl ? "رسالة" : "Message"}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              defaultValue={getShareDescription()}
            />
            <Button
              className="w-full"
              onClick={handleEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isRtl ? "إرسال" : "Send"}
            </Button>
          </div>

          {/* Art Space Branding */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
            <img 
              src={theme === 'light' ? '/assets/logolight.png' : '/assets/logo.png'}
              alt="Artful Connective Hub Logo" 
              className="h-4 w-auto object-contain"
            />
            <span>Shared via Artful Connective Hub</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 