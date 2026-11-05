'use strict';
// Interactive example follows the least-significant-trit-first packing in the TK Integers report.
const trits = [-1, 0, 1, 0, -1];
const tritNames = { '-1': 'minus one', '0': 'zero', '1': 'plus one' };
const tritSymbols = { '-1': '−1', '0': '0', '1': '+1' };
document.querySelectorAll('[data-trit]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.trit);
    trits[index] = trits[index] === 1 ? -1 : trits[index] + 1;
    button.textContent = tritSymbols[trits[index]];
    button.className = 'trit ' + (trits[index] < 0 ? 'minus' : trits[index] > 0 ? 'plus' : 'zero');
    button.setAttribute('aria-label', `Trit ${index + 1}: ${tritNames[trits[index]]}. Activate to change.`);
    const byte = trits.reduce((total, digit, i) => total + (digit + 1) * 3 ** i, 0);
    document.getElementById('packed-binary').textContent = byte.toString(2).padStart(8, '0');
    document.getElementById('packed-decimal').textContent = `${byte} / 242`;
  });
});

