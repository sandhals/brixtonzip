import Layout from '@/components/Layout'
import GardenHeaderImage from '@/components/GardenHeaderImage'

export default function GardenPage() {
  return (
    <Layout variant="home" title="🌱 digital garden">
      <GardenHeaderImage
        src="/images/flowersbw.png"
        colorSrc="/images/flowers.png"
        alt="Garden header"
      />

      <div className="box">
        <h1>Digital Garden</h1>
        <p>A place to keep the small tools, sites, and games I build. Some are more or less finished, others I'm still working on!</p>
        <h2>🌸 Blooming</h2>

        <table className="garden-table">
          <tbody>
            <tr>
              <td className="link-cell">
                <a href="/garden/cyclic">Cyclic Calendar</a>
              </td>
              <td className="desc-cell">
                A simple calendar tool for visualizing and customizing <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc">cyclic calendar</a> years.
              </td>
            </tr>
            <tr>
              <td className="link-cell">
                <a href="/garden/spectris">Spectris</a>
              </td>
              <td className="desc-cell">
                My very own tetris variant! Multicoloured tetrimos fill the space, but you can only clear the blocks by aligning four or more of the same colour.
              </td>
            </tr>
            <tr>
              <td className="link-cell">
                <a href="/garden/ratio">Ratio Ruler</a>
              </td>
              <td className="desc-cell">
                A simple line drawing tool for measuring objects in an image relative to each other.
              </td>
            </tr>
            <tr>
              <td className="link-cell">
                <a href="/garden/sortbylength">Sort by Length</a>
              </td>
              <td className="desc-cell">
                Sometimes at work, we need to sort lines of text by their precise pixel length. I couldn't find a reliable tool that did this so I made one!
              </td>
            </tr>
            <tr>
              <td className="link-cell">
                <a href="/garden/sortbyvote">Sort by Vote</a>
              </td>
              <td className="desc-cell">
                Also at work, we often use ball emojis to cast votes on copy in Google Docs. I built this tool to organize those votes. Probably not useful to many others, but I keep it hosted on my site for easy access!
              </td>
            </tr>
          </tbody>
        </table>

        <h2>☕ Brewing</h2>

        <table className="garden-table brewing-table">
          <tbody>
            <tr>
              <td className="link-cell">
                <span className="brewing-cell">Autobiographer</span>
              </td>
              <td className="desc-cell">
                An applet I'm building for recording memories as they come to you, automatically compiling them into a detailed timeline of your whole life.
              </td>
            </tr>
            <tr>
              <td className="link-cell">
                <span className="brewing-cell">HanTyLe</span>
              </td>
              <td className="desc-cell">
                I'm trying to build a Korean lemmatizer that is built from Typescript as an alternative to similar libraries that use Python.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .garden-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Roboto', sans-serif;
          font-weight: 300;
          margin-bottom: 2em;
        }

        .garden-table tr {
          border-bottom: solid 1px gray;
        }

        .garden-table tr:last-child {
          border-bottom: none;
        }

        .link-cell {
          padding: 0.75em 0;
          vertical-align: top;
          width: 30%;
          font-weight: 300;
        }

        .desc-cell {
          padding: 0.75em 0 0.75em 1em;
          font-size: 0.7em;
          opacity: 1;
          vertical-align: top;
          font-weight: 300;
        }

        .desc-cell > a{
        font-size: 1em!important;
        }

        h2 {
          margin-bottom: 0.5em;
          font-family: 'Roboto', sans-serif;
          font-weight: 400;
          font-size:1.1em;
        }

        .brewing-desc {
          margin-bottom: 1em;
          font-size: 1em;
          font-weight: 300;
        }

        .brewing-cell{
          font-size:0.8em;}
      `}</style>
    </Layout>
  )
}
