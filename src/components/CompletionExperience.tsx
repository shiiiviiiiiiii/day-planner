import React, { useState, useEffect } from "react";
import { type Activity } from "../lib/storage";

interface CompletionExperienceProps {
  activities: Activity[];
  photoBase64: string | null;
  show: boolean;
}

export const CompletionExperience: React.FC<CompletionExperienceProps> = ({
  activities,
  photoBase64,
  show,
}) => {
  const [delayedShow, setDelayedShow] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [dustParticles, setDustParticles] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setDelayedShow(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setDelayedShow(false);
      setEnvelopeOpen(false);
    }
  }, [show]);

  useEffect(() => {
    if (delayedShow) {
      const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 8,
        size: 2 + Math.random() * 3,
      }));
      setDustParticles(particles);
    }
  }, [delayedShow]);

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setFormattedDate(new Date().toLocaleDateString("en-US", options));
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!delayedShow) return null;

  return (
    <div className="completion-experience select-none">
      {/* Floating Dust Particles */}
      <div className="dust-container pointer-events-none">
        {dustParticles.map((p) => (
          <div
            key={p.id}
            className="dust-particle pointer-events-none"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              bottom: "-20px",
            }}
          />
        ))}
      </div>

      <div className="completion-content flex flex-col items-center">
        {/* Decorative Divider */}
        <div className="completion-divider" />

        {/* Polaroid Card */}
        <div className="polaroid-card shadow-polaroid">
          {/* Masking tape */}
          <div className="masking-tape" />

          {/* Polaroid Image Area */}
          <div className="polaroid-image-frame select-none">
            {photoBase64 ? (
              <img 
                src={photoBase64} 
                alt="Memory of Today" 
                className="polaroid-image"
              />
            ) : (
              <div className="polaroid-placeholder font-typewriter">
                <svg viewBox="0 0 24 24" className="polaroid-placeholder-svg" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="polaroid-placeholder-text italic">
                  A memory will live here someday.
                </span>
              </div>
            )}
          </div>

          {/* Polaroid Caption */}
          <div className="polaroid-caption font-header">
            <h3 className="polaroid-title">Day Complete ✨</h3>
            <p className="polaroid-message italic font-typewriter">
              "If you're reading this, we did it. Every little stop, every laugh, every random conversation became part of today. I hope years from now this day still makes you smile. Until the next adventure."
            </p>
            <div className="polaroid-sign font-typewriter">
              — End of Today's Story
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="completion-actions flex flex-col items-center">
          
          {/* Memory Box Envelope */}
          <div className="envelope-container flex flex-col items-center">
            {!envelopeOpen ? (
              <button
                onClick={() => setEnvelopeOpen(true)}
                className="btn btn-secondary font-typewriter font-semibold"
              >
                ✉ Open Memory Box
              </button>
            ) : (
              <div className="envelope-wrapper">
                <div className="envelope shadow-lg">
                  {/* Sliding Letter */}
                  <div className="envelope-letter font-handwritten italic text-center">
                    <p>
                      "Thank you for spending this day with me. Every little stop, every laugh, and every random conversation made it special. I'm glad we got to create these memories together. Here's to more adventures ahead! ☕"
                    </p>
                  </div>

                  {/* Envelope Flaps */}
                  <div className="envelope-flaps pointer-events-none">
                    <div className="envelope-flap-left" />
                    <div className="envelope-flap-right" />
                    <div className="envelope-flap-bottom" />
                  </div>

                  {/* Close button */}
                  <button 
                    onClick={() => setEnvelopeOpen(false)}
                    className="envelope-close font-typewriter"
                  >
                    [ Close ]
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Keepsake Button */}
          <button
            onClick={handlePrint}
            className="btn btn-primary font-typewriter font-semibold"
          >
            ⎙ Save This Memory
          </button>
        </div>
      </div>

      {/* Printable template */}
      <div className="print-layout font-typewriter">
        <div className="print-keepsake-container">
          <div className="print-header">
            <h1 className="print-title font-header">The Day Out</h1>
            <p className="print-date">{formattedDate}</p>
          </div>
          
          <div className="print-divider" />
          
          <div className="print-content">
            <div className="print-checklist">
              <h2 className="print-section-title font-header">Today's Completed Checklist:</h2>
              <ul>
                {activities.filter(a => !a.hidden).map((act) => (
                  <li key={act.id} className="print-item">
                    <span className="print-checkbox">[X]</span>
                    <span className={`print-item-title ${act.completed ? "completed" : ""}`}>
                      {act.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="print-polaroid-side">
              {photoBase64 ? (
                <img src={photoBase64} alt="Keepsake Photo" className="print-keepsake-photo" />
              ) : (
                <div className="print-photo-placeholder">
                  [ A memory lives here ]
                </div>
              )}
              <p className="print-polaroid-caption font-header">Day Complete ✨</p>
            </div>
          </div>

          <div className="print-divider" />
          
          <div className="print-footer">
            <p className="print-closing font-header">
              "Keep smiling, keep exploring, and keep making beautiful memories."
            </p>
            <p className="print-letter-text font-handwritten">
              Thank you for spending this day with me. Every little stop, every laugh, and every random conversation made it special. I'm glad we got to create these memories together. Here's to more adventures ahead! ☕
            </p>
            <div className="print-signature">— Today's Keepsake</div>
          </div>
        </div>
      </div>
    </div>
  );
};
