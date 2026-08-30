// The only JavaScript here, and it is opt-in: the server injects it solely for
// visitors who pick the phone option at the gate. All it does is write the same
// two custom properties the hover grid writes on desktop.
(() => {
  const field = document.querySelector('.field')
  const hint = document.querySelector('.hint-tilt')
  if (!field) return

  // Say something rather than fail silently. hold=true keeps the message up
  // until it is replaced; otherwise it fades like the normal hint.
  const say = (text, hold) => {
    if (!hint) return
    hint.textContent = text
    hint.style.animation = 'none'
    void hint.offsetHeight                 // reflow, so the animation can restart
    if (hold) hint.style.opacity = '1'
    else { hint.style.opacity = ''; hint.style.animation = 'hint 2.6s ease forwards' }
  }

  // A mouse sweeps continuously, so a 4s trailing glide reads as alive. Tilt is
  // a held pose — you lean, then wait — and at 4s that reads as broken. Shorten
  // it, and reach the full range from +-18deg so a wrist turn is enough.
  field.style.setProperty('--glide', '0.5s')
  const norm = deg => (Math.max(-18, Math.min(18, deg || 0)) + 18) / 36

  let receiving = false
  const tilt = e => {
    if (e.gamma === null && e.beta === null) return   // no sensor behind the event
    if (!receiving) { receiving = true; say('tilt to move the colours') }
    field.style.setProperty('--mx', norm(e.gamma))
    field.style.setProperty('--my', norm(e.beta))
  }

  const listen = () => {
    addEventListener('deviceorientation', tilt)
    // Events can fire with null readings, or never fire at all, on hardware or
    // browsers without the sensor. Give it a moment, then admit it.
    setTimeout(() => {
      if (!receiving) say('this device is not reporting motion', true)
    }, 3000)
  }

  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    // iOS only. Permission must be requested from inside a real user gesture,
    // so the page has to ask for a tap before anything can happen.
    say('tap anywhere to allow motion', true)
    addEventListener('click', function ask () {
      removeEventListener('click', ask)
      DeviceOrientationEvent.requestPermission()
        .then(result => {
          if (result === 'granted') listen()
          else say('motion blocked — settings › apps › safari › motion & orientation access', true)
        })
        .catch(err => say('motion request failed: ' + (err && err.message || err), true))
    })
  } else {
    listen()
  }
})()
