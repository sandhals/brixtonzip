export default function HeaderImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="header-image-wrapper">
      <img src={src} alt={alt} />
      <input type="checkbox" id="open-header" className="zip-checkbox" />

      <div className="iframe-container">
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
        .header-image-wrapper {
          position: relative;
        }

        .header-image-wrapper img {
          width: 100%;
          height: 45vh;
          object-fit: cover;
          object-position: 50% 35%;
          mix-blend-mode: multiply;
          background-color: var(--black);
        }

        .iframe-container {
          display: none;
        }

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

        .zip-checkbox:checked + .iframe-container {
          display: block;
        }
      `}</style>
    </div>
  );
}
