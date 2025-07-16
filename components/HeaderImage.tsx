export default function HeaderImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="header-image-wrapper">
      <img src={src} alt={alt} />

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
      `}</style>
    </div>
  );
}
