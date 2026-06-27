import React from "react";

const Paperclip: React.FC = () => (
  <svg
    className="paperclip z-20 pointer-events-none select-none"
    viewBox="0 0 40 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 92 C32 92, 34 80, 34 68 L34 22 C34 10, 27 4, 20 4 C13 4, 6 10, 6 22 L6 74 C6 86, 12 92, 20 92 Z"
      stroke="#b5b0aa"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M20 80 C26 80, 26 72, 26 62 L26 22 C26 15, 23 11, 20 11 C17 11, 14 15, 14 22 L14 62 C14 68, 17 72, 20 72"
      stroke="#8e8983"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const CoffeeStain: React.FC = () => (
  <div className="coffee-stain pointer-events-none z-10 select-none">
    <svg viewBox="0 0 200 200" className="w-full h-full text-[#5d4037]" fill="currentColor">
      <path d="M 100 20 C 50 20, 20 50, 20 100 C 20 120, 25 140, 35 155 C 38 160, 42 165, 48 172 C 55 178, 65 182, 80 185 C 90 187, 110 187, 125 183 C 145 178, 165 160, 175 140 C 185 120, 185 90, 175 65 C 165 45, 145 28, 120 22 C 110 20, 105 20, 100 20 Z M 100 26 C 104 26, 108 26, 115 27 C 138 32, 155 48, 163 66 C 172 86, 172 113, 163 131 C 153 149, 137 165, 118 170 C 105 173, 88 173, 76 170 C 63 167, 53 161, 46 154 C 41 149, 38 145, 35 140 C 28 126, 26 110, 27 94 C 29 68, 44 44, 68 32 C 78 27, 88 26, 100 26 Z" />
      <circle cx="150" cy="165" r="2.5" />
      <circle cx="162" cy="155" r="1.5" />
      <circle cx="50" cy="45" r="2" />
      <circle cx="38" cy="58" r="1" />
    </svg>
  </div>
);

interface PaperPageProps {
  children: React.ReactNode;
  isCompleted?: boolean;
}

export const PaperPage: React.FC<PaperPageProps> = ({ children, isCompleted = false }) => {
  return (
    <div className="paper-wrapper">
      <div 
        className="paper-sheet"
        style={{
          backgroundColor: isCompleted ? "#FAF3E3" : "#F7F1E8",
        }}
      >
        {/* Paper texture overlay */}
        <div 
          className="paper-noise-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        <Paperclip />
        <CoffeeStain />

        {/* Vintage red margin line */}
        <div className="red-margin-line" />

        {/* Page contents (shifted to avoid red margin line) */}
        <div className="paper-content">
          {children}
        </div>
      </div>
    </div>
  );
};
