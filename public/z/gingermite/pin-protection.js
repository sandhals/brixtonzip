// PIN Protection - TEMPORARY - Easy to remove later
// Simple version - just for show, not secure

const CORRECT_PIN = '7899';

// Create and show PIN overlay immediately
const overlay = document.createElement('div');
overlay.id = 'pin-overlay';
overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #f2d479;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
`;

const pinBox = document.createElement('div');
pinBox.style.cssText = `
    background: white;
    padding: 3rem;
    border: 1px solid #2b2118;
    text-align: center;
    max-width: 400px;
`;

pinBox.innerHTML = `
    <h2 style="font-family: Georgia, serif; margin-bottom: 1.5rem; color: #2b2118;">Enter PIN</h2>
    <input type="password" id="pinInput" maxlength="4"
           style="width: 100%; padding: 0.75rem; font-size: 1.5rem; text-align: center;
                  border: 1px solid #2b2118; margin-bottom: 1rem; box-sizing: border-box;"
           placeholder="4-digit PIN">
    <button id="pinSubmit"
            style="width: 100%; padding: 0.75rem; background: #2b2118; color: white;
                   border: none; cursor: pointer; font-size: 1rem;">
        Submit
    </button>
    <p id="pinError" style="color: #6f1a07; margin-top: 1rem; display: none;">Incorrect PIN</p>
`;

overlay.appendChild(pinBox);
document.body.appendChild(overlay);

// Hide page content
document.body.style.overflow = 'hidden';

const input = document.getElementById('pinInput');
const submit = document.getElementById('pinSubmit');
const error = document.getElementById('pinError');

function checkPin() {
    if (input.value === CORRECT_PIN) {
        overlay.remove();
        document.body.style.overflow = '';
    } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
    }
}

submit.addEventListener('click', checkPin);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPin();
});

// Auto-focus input when ready
setTimeout(() => input.focus(), 100);
