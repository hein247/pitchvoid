import { useState, useEffect } from 'react';
import { X, Copy, Check, Lock, Calendar, Link2, QrCode, MessageCircle, Linkedin, Mail, Twitter } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  publicUrl: string;
}

const ShareModal = ({ isOpen, onClose, projectTitle, publicUrl }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [showQR, setShowQR] = useState(true);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  // Set default expiry date to 7 days from now
  useEffect(() => {
    if (expiryEnabled && !expiryDate) {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setExpiryDate(date.toISOString().split('T')[0]);
    }
  }, [expiryEnabled, expiryDate]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate teaser text for social sharing
  const teaserText = `Check out my pitch: "${projectTitle}" 🎯\n\n`;
  const encodedText = encodeURIComponent(teaserText);
  const encodedUrl = encodeURIComponent(publicUrl);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:bg-green-500/20 hover:border-green-500/50',
      url: `https://wa.me/?text=${encodedText}${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-500/20 hover:border-blue-500/50',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'hover:bg-purple-500/20 hover:border-purple-500/50',
      url: `mailto:?subject=${encodeURIComponent(`My Pitch: ${projectTitle}`)}&body=${encodedText}${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-sky-500/20 hover:border-sky-500/50',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" 
      onClick={onClose}
    >
      <div 
        className="glassmorphism-dark rounded-2xl p-4 sm:p-6 w-full max-w-lg animate-scaleIn max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl text-foreground font-display">Share Pitch</h3>
            <p className="text-xs text-muted-foreground mt-1">Share "{projectTitle}" with anyone</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* QR Code + Link Section */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          {/* QR Code */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-xl flex items-center justify-center p-2 border border-accent/20">
              {showQR ? (
                <QRCodeSVG 
                  value={publicUrl} 
                  size={112}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0F0518"
                />
              ) : (
                <QrCode className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
          
          {/* Link Copy Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">Share link</p>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-accent/10 border border-accent/20">
              <input 
                type="text" 
                value={publicUrl} 
                readOnly 
                className="flex-1 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none min-w-0 truncate" 
              />
              <button 
                onClick={handleCopyLink} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 flex-shrink-0 transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'magenta-gradient text-white hover:opacity-90'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Social Sharing */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Quick share</p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {socialLinks.map(platform => (
              <a 
                key={platform.name} 
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl border border-accent/20 transition-all ${platform.color}`}
              >
                <platform.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">{platform.name}</span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Privacy Settings */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Privacy settings</p>
          
          {/* Password Protection */}
          <div className="p-3 sm:p-4 rounded-xl border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-xs sm:text-sm text-foreground">Password protect</span>
              </div>
              <button 
                onClick={() => setPasswordEnabled(!passwordEnabled)} 
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors ${
                  passwordEnabled ? 'magenta-gradient' : 'bg-muted'
                }`}
              >
                <div 
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    passwordEnabled ? 'right-0.5' : 'left-0.5'
                  }`} 
                />
              </button>
            </div>
            {passwordEnabled && (
              <div className="mt-3 pt-3 border-t border-accent/10">
                <Label htmlFor="password" className="text-xs text-muted-foreground mb-1.5 block">
                  Set password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="h-9 text-sm bg-background/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Viewers will need this password to access your pitch
                </p>
              </div>
            )}
          </div>
          
          {/* Expiry Date */}
          <div className="p-3 sm:p-4 rounded-xl border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-xs sm:text-sm text-foreground">Set expiry date</span>
              </div>
              <button 
                onClick={() => setExpiryEnabled(!expiryEnabled)} 
                className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors ${
                  expiryEnabled ? 'magenta-gradient' : 'bg-muted'
                }`}
              >
                <div 
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    expiryEnabled ? 'right-0.5' : 'left-0.5'
                  }`} 
                />
              </button>
            </div>
            {expiryEnabled && (
              <div className="mt-3 pt-3 border-t border-accent/10">
                <Label htmlFor="expiry" className="text-xs text-muted-foreground mb-1.5 block">
                  Link expires on
                </Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-9 text-sm bg-background/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  After this date, the link will no longer work
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Done Button */}
        <button 
          onClick={onClose} 
          className="w-full py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
