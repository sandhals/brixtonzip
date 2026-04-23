import UnzipToggle from './UnzipToggle';

interface Props {
  src: string;
  alt: string;
  placeholder?: string;
  loaded?: boolean;
  onLoad?: () => void;
}

export default function SketchbookHeaderImage({ src, alt, placeholder, loaded, onLoad }: Props) {
  return (
    <div className="sketchbook-header-image-wrapper">
      {placeholder && !loaded && (
        <img src={placeholder} alt="" className="placeholder" />
      )}
      <img
        src={src}
        alt={alt}
        className={`main-image ${loaded ? 'visible' : placeholder ? 'hidden' : 'visible'}`}
        onLoad={onLoad}
      />
      <UnzipToggle checkboxId="open-sketchbook" />

      <style jsx>{`
        .sketchbook-header-image-wrapper {
          position: relative;
          overflow: hidden;
        }

        .sketchbook-header-image-wrapper .placeholder {
          width: 100%;
          height: 75vh;
          object-fit: contain;
          object-position: center;
          background-color: #f8f8f8;
          display: block;
          filter: blur(8px);
          transform: scale(1.02);
        }

        .sketchbook-header-image-wrapper .main-image {
          width: 100%;
          height: 75vh;
          object-fit: contain;
          object-position: center;
          background-color: #f8f8f8;
          display: block;
        }

        .sketchbook-header-image-wrapper .main-image.hidden {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
        }

        .sketchbook-header-image-wrapper .main-image.visible {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .sketchbook-header-image-wrapper .placeholder,
          .sketchbook-header-image-wrapper .main-image {
            height: 60vh;
          }
        }

        @media (max-width: 480px) {
          .sketchbook-header-image-wrapper .placeholder,
          .sketchbook-header-image-wrapper .main-image {
            height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}
