import { useState } from 'react'
import Layout from '@/components/Layout'
import GardenHeaderImage from '@/components/GardenHeaderImage'

const ITEMS = [
  { name: 'Creatine', href: '/garden/creatine', cat: 'life',
    desc: 'A creatine saturation calculator. Enter when you were last saturated and your dosing plan, and it tells you how many days until you\'re fully loaded — with a day-by-day tracker.' },
  { name: 'Living Daylight', href: '/garden/daylight', cat: 'life',
    desc: 'I\'m constantly checking weather websites in the winter to countdown how many days until the sun rises before I have to, or how may days until the sun will still be up when I\'m off work, so I made a website to just figure it out for me.' },
  { name: 'Bookshot', href: '/garden/bookshot', cat: 'life',
    desc: 'Generate a phone-sized graphic of your monthly reading. Search books by ISBN, title or author, customize the message, and screenshot to upload!' },
  { name: 'Sit With Me', href: '/garden/hi', cat: 'play',
    desc: 'A hyperminimal game coded with only 777 characters. Come find me in the forest and sit with me. View the source!' },
  { name: 'Omikuji', href: '/garden/omikuji/index.html', cat: 'play',
    desc: 'A digital omikuji for 2026 for those who can\'t visit a shrine.' },
  { name: 'Cyclic Calendar', href: '/garden/cyclic', cat: 'life',
    desc: <>A simple calendar tool for visualizing and customizing <a href="https://www.youtube.com/watch?v=BiY2yUwTgQc" style={{ fontSize: 'inherit' }}>cyclic calendar</a> years.</> },
  { name: 'Spectris', href: '/garden/spectris', cat: 'play',
    desc: 'My very own tetris variant! Multicoloured tetrimos fill the space, but you can only clear the blocks by aligning four or more of the same colour.' },
  { name: 'Ratio Ruler', href: '/garden/ratio', cat: 'tools',
    desc: 'A simple line drawing tool for measuring objects in an image relative to each other.' },
  { name: 'Polyglot Score', href: '/garden/polyglot', cat: 'tools',
    desc: 'A calculator that scores your language repertoire based on how linguistically distant each language is from the ones you already know.' },
  { name: 'Sort by Length', href: '/garden/sortbylength', cat: 'tools',
    desc: 'Sometimes at work, we need to sort lines of text by their precise pixel length. I couldn\'t find a reliable tool that did this so I made one!' },
  { name: 'Sort by Vote', href: '/garden/sortbyvote', cat: 'tools',
    desc: 'Also at work, we often use ball emojis to cast votes on copy in Google Docs. I built this tool to organize those votes. Probably not useful to many others, but I keep it hosted on my site for easy access!' },
  { name: 'Rivers', href: '/garden/rivers', cat: 'life',
    desc: 'Three coordinates.' },
  { name: 'The Arc', href: '/garden/rivers/arc', cat: 'life',
    desc: 'Pacific crossing.' },
  { name: 'Flow Direction', href: '/garden/rivers/flow', cat: 'life',
    desc: 'Three rivers flowing.' },
]

const BREWING = [
  { name: 'Autobiographer',
    desc: 'An applet I\'m building for recording memories as they come to you, automatically compiling them into a detailed timeline of your whole life.' },
  { name: 'HanTyLe',
    desc: 'I\'m trying to build a Korean lemmatizer that is built from Typescript as an alternative to similar libraries that use Python.' },
]

const CATS = [
  { id: 'all', label: 'All', emoji: '🌸' },
  { id: 'tools', label: 'Tools', emoji: '🔧' },
  { id: 'play', label: 'Play', emoji: '🎮' },
  { id: 'life', label: 'Life', emoji: '🌿' },
]

export default function GardenPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? ITEMS : ITEMS.filter(i => i.cat === filter)
  const activeEmoji = CATS.find(c => c.id === filter)?.emoji

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
        <div className="blooming-row">
          <h2>{activeEmoji} Blooming</h2>
          <div className="filter-row">
            {CATS.map(c => (
              <button
                key={c.id}
                className={`filter-btn${filter === c.id ? ' active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <table className="garden-table">
          <tbody>
            {filtered.map(item => (
              <tr key={item.name}>
                <td className="link-cell">
                  <a href={item.href}>{item.name}</a>
                </td>
                <td className="desc-cell">
                  {item.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>☕ Brewing</h2>

        <table className="garden-table brewing-table">
          <tbody>
            {BREWING.map(item => (
              <tr key={item.name}>
                <td className="link-cell">
                  <span className="brewing-cell">{item.name}</span>
                </td>
                <td className="desc-cell">
                  {item.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .blooming-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 0.5em;
        }

        .blooming-row h2 {
          margin-bottom: 0;
        }

        .blooming-row .filter-row {
          margin-bottom: 0;
        }
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

        .desc-cell a {
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

        .filter-row {
          display: flex;
          gap: 6px;
          margin-bottom: 1em;
        }

        .filter-btn {
          font-family: 'Roboto', sans-serif;
          font-size: 0.7em;
          font-weight: 300;
          padding: 3px 10px;
          border: 1px solid #ccc;
          background: #fff;
          color: #888;
          cursor: pointer;
          letter-spacing: 0.03em;
        }

        .filter-btn:hover {
          border-color: #000;
          color: #000;
        }

        .filter-btn.active {
          border-color: #000;
          background: #000;
          color: #fff;
        }
      `}</style>
    </Layout>
  )
}
