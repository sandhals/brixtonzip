export default function DappledLight() {
  return (
    <>
      {/* Ambient glow — sits behind content */}
      <div id="sunlit-glow" aria-hidden="true">
        <div id="glow" />
        <div id="glow-bounce" />
      </div>

      {/* Shadow structure — sits above content, no blur, very low opacity */}
      <div id="sunlit-shadows" aria-hidden="true">
        <div className="sunlit-perspective">
          <div id="leaves" />
          <div id="blinds">
            <div className="shutters">
              {Array.from({ length: 23 }).map((_, i) => (
                <div key={i} className="shutter" />
              ))}
            </div>
            <div className="vertical">
              <div className="bar" />
              <div className="bar" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
