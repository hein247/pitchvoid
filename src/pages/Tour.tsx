import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const tourSteps = [
  { 
    title: 'Create a Project', 
    description: "Start by naming your pitch—whether it's for a job interview, client proposal, or investor meeting.", 
    icon: '📁' 
  },
  { 
    title: 'Attach Your Files', 
    description: 'Upload your resume, case studies, portfolio pieces, or any context that tells your story.', 
    icon: '📎' 
  },
  { 
    title: 'Generate Your Pitch', 
    description: 'Describe your scenario, and AI will craft a tailored, beautiful presentation in seconds.', 
    icon: '⚡' 
  }
];

const Tour = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen grain-bg hero-gradient flex flex-col" style={{ backgroundColor: '#0F0518' }}>
      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button 
          onClick={() => navigate('/')}
          className="text-xl font-semibold font-display"
          style={{ 
            background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}
        >
          PitchVoid
        </button>
        <div className="w-16" /> {/* Spacer for centering */}
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="glassmorphism-dark rounded-2xl p-8 w-full max-w-2xl animate-slideUp">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">Step {currentStep + 1}/3</p>
            <div className="flex gap-2">
              {tourSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${
                    i <= currentStep ? 'w-8 magenta-gradient' : 'w-4 bg-accent/20'
                  }`} 
                />
              ))}
            </div>
            <button 
              onClick={handleComplete}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Visual */}
            <div className="tour-visual rounded-2xl p-8 h-64 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl magenta-gradient flex items-center justify-center">
                <span className="text-white text-2xl">{tourSteps[currentStep].icon}</span>
              </div>
            </div>

            {/* Text */}
            <div>
              <h3 className="text-2xl text-foreground mb-4 font-display">
                {tourSteps[currentStep].title}
              </h3>
              <p className="text-muted-foreground mb-8">
                {tourSteps[currentStep].description}
              </p>
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button 
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl text-muted-foreground border border-border hover:bg-accent/10 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 rounded-xl text-white font-medium magenta-gradient hover:opacity-90 transition-opacity"
                >
                  {currentStep < 2 ? 'Next' : 'Start Creating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour;
