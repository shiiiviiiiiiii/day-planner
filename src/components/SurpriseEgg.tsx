import React, { useEffect } from "react";

interface SurpriseEggProps {
  show: boolean;
  onClose: () => void;
}

export const SurpriseEgg: React.FC<SurpriseEggProps> = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="surprise-egg font-handwritten">
      <div className="surprise-egg-body">
        <span>Psst... I'd do this all over again with you.</span>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="pencil-underline-svg">
          <path d="M0 5 Q 25 3, 50 6 T 100 4" fill="none" stroke="#5d4037" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
