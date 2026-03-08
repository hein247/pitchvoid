import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';

const CATEGORIES = [
  { label: 'General', value: 'general' },
  { label: 'Bug Report', value: 'bug' },
  { label: 'Feature Request', value: 'feature' },
  { label: 'Billing', value: 'billing' },
  { label: 'Other', value: 'other' },
];

const Feedback = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (message.trim().length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('site_feedback' as any)
        .insert({ name: name.trim(), email: email.trim(), category, message: message.trim() } as any);

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <h1 className="font-heading text-3xl sm:text-4xl font-semibold mb-3">
            Send us feedback
          </h1>
          <p className="text-sm text-muted-foreground mb-10 max-w-md">
            Found a bug? Have a feature idea? We'd love to hear from you.
          </p>

          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-16 animate-fadeIn">
              <CheckCircle className="w-10 h-10 text-primary" />
              <p className="text-lg font-heading font-medium">Thanks for your feedback!</p>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                We read every message. If your feedback needs a response, we'll get back to you via email.
              </p>
              <Link
                to="/"
                className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 100))}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border transition-all ${
                        category === cat.value
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground/70'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">
                  Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
                <span className="block text-right text-[10px] text-muted-foreground/30 mt-1">
                  {message.length}/2000
                </span>
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          )}
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Feedback;
