import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import SketchbookHeaderImage from '@/components/SketchbookHeaderImage';

export default function SketchbookPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Auto-detect available pages by checking for files
  useEffect(() => {
    const detectPages = async () => {
      let pageCount = 0;
      let checking = true;
      
      while (checking) {
        const pageNumber = pageCount.toString().padStart(2, '0');
        const imagePath = `/images/sketchbook/pg${pageNumber}.jpg`;
        
        try {
          const response = await fetch(imagePath, { method: 'HEAD' });
          if (response.ok) {
            pageCount++;
          } else {
            checking = false;
          }
        } catch (error) {
          checking = false;
        }
      }
      
      setTotalPages(pageCount);
      setLoading(false);
    };

    detectPages();
  }, []);

  const getImagePath = (pageIndex: number) => {
    const pageNumber = pageIndex.toString().padStart(2, '0');
    return `/images/sketchbook/pg${pageNumber}.jpg`;
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? thumbnailsRef.current.scrollLeft - scrollAmount
        : thumbnailsRef.current.scrollLeft + scrollAmount;
      
      thumbnailsRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <Layout variant="home" title="✏️ sketchbook">
        <div className="loading">Loading sketchbook... This can take a minute, so please hang tight!</div>
      </Layout>
    );
  }

  if (totalPages === 0) {
    return (
      <Layout variant="home" title="✏️ sketchbook">
        <div className="box">
          <p>No sketchbook pages found. Add some images to /images/sketchbook/ (pg00.jpg, pg01.jpg, etc.)</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="home" title="✏️ sketchbook">
      <SketchbookHeaderImage 
        src={getImagePath(currentPage)} 
        alt={`Sketchbook page ${currentPage + 1}`}
      />
      
      <div className="box">
        <div className="sketchbook-controls">
          <p>
          <span className="navigation-controls">
            <div className="nav-buttons">
              <button 
                onClick={prevPage}
                className="nav-btn"
              >
                &lt;
              </button>

            <div className="page-selector">
              <select 
                id="page-dropdown"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className="page-dropdown"
              >
                {Array.from({ length: totalPages }, (_, index) => (
                  <option key={index} value={index}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>

              
              <button 
                onClick={nextPage}
                className="nav-btn"
              >
                &gt;
              </button>
            </div>
          </span>
Welcome to my sketchbook! As a child, I used to spend a lot of time drawing with my brother, but I promptly fell out of the habit after I graduated from high school. In 2022, I bought this sketchbook in hopes of regularly sketching again, and so far I've been somewhat successful! Occasionally, I make open calls for doodle ideas (as on pages 11, 12, 13, 16, and 24) on <a href="http://instagram.com/ydalir">Instagram</a> which anyone is welcome to submit to!

          </p>


          <div className="thumbnail-section">
            <button 
              onClick={() => scrollThumbnails('left')}
              className="scroll-btn left"
            >
              &lt;
            </button>
            
            <div className="thumbnail-container" ref={thumbnailsRef}>
              <div className="thumbnail-row">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className={`thumbnail ${index === currentPage ? 'active' : ''}`}
                  >
                    <img src={getImagePath(index)} alt={`Page ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => scrollThumbnails('right')}
              className="scroll-btn right"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .sketchbook-controls {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .page-info {
          text-align: center;
        }

        .navigation-controls {
          display: inline-flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-right:0.5em;
        }

        .nav-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .nav-btn {
          color: #aaa;
          border: none;
          width: 1.35rem;
          height: 1.2rem;
          border-radius: 30%;
          border: solid 1px #aaa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Roboto';
          font-weight:100;
          font-size: 1rem;
          flex-shrink: 0;
          transition: background 0.2s;
        }

            .nav-btn:hover{
            color:black;
            border-color:black;
        }


        .page-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-selector label {
          font-size: 0.9rem;
          color: #666;
        }

        .page-dropdown {
          padding: 0.25rem 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: 'OCR';
          font-size: 0.5rem;
          background: #fff;
        }

        .thumbnail-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .scroll-btn {
          color: #aaa;
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 30%;
          border: solid 1px #aaa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Roboto';
          font-weight:100;
          font-size: 1rem;
          flex-shrink: 0;
          transition: color 0.2s;
        }

        .scroll-btn:hover {
          color: #000;
          border-color: #000;
        }

        .thumbnail-container {
          flex: 1;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .thumbnail-container::-webkit-scrollbar {
          display: none;
        }

        .thumbnail-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 0;
        }

        .thumbnail {
          width: 60px;
          height: 80px;
          border: 1px solid transparent;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s;
          background: none;
          padding: 0;
          flex-shrink: 0;
        }

        .thumbnail:hover {
          border-color: #666;
        }

        .thumbnail.active {
          border-color: #000;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .navigation-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .nav-buttons {
            justify-content: center;
          }

          .page-selector {
            justify-content: center;
          }

          .thumbnail-section {
            gap: 0.5rem;
          }

          .scroll-btn {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }

          .thumbnail {
            width: 45px;
            height: 60px;
          }
        }

        button{
        background:none;
        }
      `}</style>
    </Layout>
  );
}