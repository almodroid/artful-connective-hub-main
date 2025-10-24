import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot?: string;
  publisherId: string;
  adFormat?: 'auto' | 'rectangle' | 'video';
  customScript?: string;
  style?: React.CSSProperties;
  className?: string;
  adSlotId?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  slot,
  publisherId,
  adFormat = 'auto',
  customScript,
  style,
  className,
  adSlotId,
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject AdSense script if not already present
    if (customScript) {
      if (!document.getElementById('custom-adsense-script')) {
        const script = document.createElement('script');
        script.id = 'custom-adsense-script';
        script.async = true;
        script.type = 'text/javascript';
        script.innerHTML = customScript;
        document.body.appendChild(script);
      }
    }
    // The original block had an 'else if' here, but the instruction implies adding adSlotId to the props and changing data-ad-slot. The 'else if' condition for script injection should remain as is.
    else if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }
    // Try to render the ad
    if ((window as any).adsbygoogle && adRef.current) {
      try {
        (window as any).adsbygoogle.push({});
      } catch (e) {
        // ignore
      }
    }
  }, [slot, publisherId, customScript]);

  // Ad format mapping
  let adStyle = style || { display: 'block' };
  let adLayout = '';
  if (adFormat === 'rectangle') {
    adStyle = { ...adStyle, width: 300, height: 250 };
  } else if (adFormat === 'video') {
    adStyle = { ...adStyle, width: '100%', height: 315 };
    adLayout = 'in-article';
  }

  return (
    <div className={className} style={{ ...adStyle, minHeight: 50 }} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={publisherId}
        data-ad-slot={adSlotId || slot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
      />
    </div>
  );
};