import { useState } from 'react';

interface UnzipToggleProps {
  checkboxId?: string;
}

export default function UnzipToggle({ checkboxId = 'unzip-toggle' }: UnzipToggleProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <>
      <input
        type="checkbox"
        id={checkboxId}
        className="zip-checkbox"
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
      />

      <div className={`iframe-container ${isChecked ? 'visible' : 'hidden'}`}>
        <iframe
          src="/unzip"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.932)'
          }}
          frameBorder={0}
        />
      </div>

      <style jsx>{`
        .zip-checkbox {
          z-index: 9999;
          filter: opacity(0.8);
          accent-color: blue;
          font-family: monospace;
          position: absolute;
          bottom: 0.6em;
          right: 0.4em;
          display: inline;
          opacity: 0.8;
          color: black;
        }

        .zip-checkbox:hover:after {
          content: ' UNZIP? ';
          background: white;
          margin-left: calc(-3rem - 2px);
          margin-bottom: 6px;
        }

        .zip-checkbox:checked:hover:after {
          content: 'ZIP?';
          color: blue;
          margin-left: calc(-2rem - 2px);
          margin-bottom: 6px;
        }

        .iframe-container {
          display: block;
        }

        .iframe-container.hidden {
          display: none;
        }

        .iframe-container.visible {
          display: block;
        }
      `}</style>
    </>
  );
}
