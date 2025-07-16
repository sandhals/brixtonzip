export default function SketchbookHeaderImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="sketchbook-header-image-wrapper">
      <img src={src} alt={alt} />

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