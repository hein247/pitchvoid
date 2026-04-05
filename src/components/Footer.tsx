import { Link } from 'react-router-dom';
import pitchvoidLogo from '@/assets/pitchvoid-logo.png';

export default function Footer() {
  return (
    <footer className="border-t border-accent/10 pt-10 pb-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        <Link to="/" className="flex items-center">
          <img src={pitchvoidLogo} alt="PitchVoid" className="h-10" />
        </Link>
        <p className="text-[11px] text-foreground/60 text-center">
          © 2026 PitchVoid® ·{' '}
          <Link to="/faq" className="hover:text-foreground/30 transition-colors">FAQ</Link> ·{' '}
          <Link to="/legal" className="hover:text-foreground/30 transition-colors">Legal</Link> ·{' '}
          <Link to="/legal" className="hover:text-foreground/30 transition-colors">Privacy</Link> ·{' '}
          <Link to="/feedback" className="hover:text-foreground/30 transition-colors">Feedback</Link>
        </p>
      </div>
    </footer>
  );
}
