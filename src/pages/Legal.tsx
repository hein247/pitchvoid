import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import LegalSection from '@/components/pricing/LegalSection';

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_hsl(25_75%_65%/0.08)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_hsl(260_60%_55%/0.06)_0%,_transparent_50%)] flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <button onClick={() => navigate('/')} className="font-bold text-xl font-display brand-gradient-text">
            PitchVoid
          </button>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full py-14 sm:py-20">
        <LegalSection />
      </main>

      <Footer />
    </div>
  );
}
