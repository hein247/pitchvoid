import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-accent/10 pt-10 pb-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        <Link to="/" className="text-lg font-display brand-gradient-text">
          PitchVoid
        </Link>
        <p className="text-[11px] text-foreground/60 text-center">
          © 2026 PitchVoid ·{' '}
          <Link to="/faq" className="hover:text-foreground/30 transition-colors">FAQ</Link> ·{' '}
          <Link to="/legal" className="hover:text-foreground/30 transition-colors">Legal</Link> ·{' '}
          <Link to="/legal" className="hover:text-foreground/30 transition-colors">Privacy</Link> ·{' '}
          <a href="mailto:support@pitchvoid.com" className="hover:text-foreground/30 transition-colors">Contact</a>
        </p>
      </div>
    </footer>
  );
}
