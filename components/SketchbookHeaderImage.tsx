export default function SketchbookHeaderImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="sketchbook-header-image-wrapper">
      <img src={src} alt={alt} />
      <input type="checkbox" id="open-sketchbook" className="zip-checkbox" />

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
        .sketchbook-header-image-wrapper {
          position: relative;
          overflow: hidden;
        }

        .sketchbook-header-image-wrapper img {
          width: 100%;
          height: 75vh;
          object-fit: contain;
          object-position: center;
          background-color: #f8f8f8;
          display: block;
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

        @media (max-width: 768px) {
          .sketchbook-header-image-wrapper img {
            height: 60vh;
          }
        }

        @media (max-width: 480px) {
          .sketchbook-header-image-wrapper img {
            height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}