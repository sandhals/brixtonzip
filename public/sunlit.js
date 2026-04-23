(function () {
    const glow = document.createElement('div');
    glow.id = 'sunlit-glow';
    glow.setAttribute('aria-hidden', 'true');
    glow.innerHTML = '<div id="glow"></div><div id="glow-bounce"></div>';

    const shutterHTML = Array.from({ length: 23 }, () => '<div class="shutter"></div>').join('');
    const shadows = document.createElement('div');
    shadows.id = 'sunlit-shadows';
    shadows.setAttribute('aria-hidden', 'true');
    shadows.innerHTML = `
        <div class="sunlit-perspective">
            <div id="leaves"></div>
            <div id="blinds">
                <div class="shutters">${shutterHTML}</div>
                <div class="vertical">
                    <div class="bar"></div>
                    <div class="bar"></div>
                </div>
            </div>
        </div>`;

    document.body.prepend(shadows);
    document.body.prepend(glow);
})();
