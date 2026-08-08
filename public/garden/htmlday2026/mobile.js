(() => {
  const field = document.querySelector('.field')
  if (!field) return
  const norm = deg => (Math.max(-30, Math.min(30, deg || 0)) + 30) / 60
  const tilt = e => {
    field.style.setProperty('--mx', norm(e.gamma))
    field.style.setProperty('--my', norm(e.beta))
  }
  const listen = () => addEventListener('deviceorientation', tilt)
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    addEventListener('click', function ask () {
      removeEventListener('click', ask)
      DeviceOrientationEvent.requestPermission()
        .then(result => { if (result === 'granted') listen() })
        .catch(() => {})
    }, { once: true })
  } else {
    listen()
  }
})()