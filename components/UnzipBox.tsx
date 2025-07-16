export default function UnzipBox() {
  return (
    <div style={{ position: 'relative' }}>
      <img src="/images/me.png" alt="dithered gym selfie" />

      <input type="checkbox" id="open" />

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
        .iframe-container {
          display: none;
        }

        #open {
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

        #open:hover:after {
          content: 'UNZIP?';
          margin-left: calc(-3rem - 2px);
          margin-bottom: 6px;
        }

        #open:checked:hover:after {
          content: 'ZIP?';
          color: blue;
          margin-left: calc(-2rem - 2px);
          margin-bottom: 6px;
        }

        #open:checked + .iframe-container {
          display: block;
        }
      `}</style>
    </div>
  )
}
