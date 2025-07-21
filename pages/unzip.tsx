import Head from 'next/head';

export default function UnzipPage() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <style jsx>{`
        .content-container, .header, .tree, .small, .sublink_small, .sublink_small:visited {
          margin: 0;
          padding: 0;
          font-size: 9pt;
          line-height: 12pt;
        }
        .header, .tree {
          font-family: monospace;
        }
        .content-container {
          max-width: 800px;
          margin-left: 1%;
          padding: 20px;
          word-wrap: break-word;
        }
        .header, .tree {
          white-space: pre;
          margin-top: 10px;
          margin-left: 1%;
        }
        .tree {
          line-height: 1;
        }
        a, a:visited {
          color: blue;
        }
        audio {
          display: block !important;
          margin: 2em 0;
          height: 2em;
        }
        span {
          opacity: 0.5;
        }
      `}</style>

      <div className="content-container">
        <div className="tree">
          <a href=".." className="small" target="_top">home</a>
          {'\n'}|——<a href="../archive" className="small" target="_top">archive</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../archive" className="sublink_small" target="_top">index.html</a>
          {'\n'}|——<a href="../friends" className="small" target="_top">friends</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../friends" className="sublink_small" target="_top">index.html</a>
          {'\n'}|——<a href="../language" className="small" target="_top">language</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../language" className="sublink_small" target="_top">index.html</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../files/chinese-anki.pdf" className="sublink_small" target="_top">chinese-anki.pdf</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../files/korean-anki.pdf" className="sublink_small" target="_top">korean-anki.pdf</a> <span>(retired)</span>
          {'\n'}|——<a href="../sketchbook/" className="small" target="_top">sketchbook</a>
          {'\n'}|&nbsp;&nbsp;|——<a href="../sketchbook" className="sublink_small" target="_top">index.html</a>
          {'\n'}|——<a href="fakingit.mp3" className="small" target="_top">fakingit.mp3</a>
        </div>
        
        <audio controls>
          <source src="files/fakingit.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </>
  );
}