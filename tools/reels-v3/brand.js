// Fills every <span class="mark" data-color=".." data-variant="full|icon"> with the Ecoraum logo mark,
// recreated from the profile picture: open house outline, ECORAUM wordmark, bar underneath.
(function () {
  function svg(color, variant) {
    const house = `<polyline points="35,372 35,175 280,48 525,175 525,372" fill="none" stroke="${color}" stroke-width="78" stroke-linejoin="miter" stroke-miterlimit="10"/>`;
    if (variant === "icon") {
      return `<svg viewBox="0 0 560 470" xmlns="http://www.w3.org/2000/svg">${house}<rect x="0" y="404" width="560" height="62" fill="${color}"/></svg>`;
    }
    return `<svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg">${house}
      <text x="280" y="474" text-anchor="middle" textLength="552" lengthAdjust="spacing" fill="${color}" stroke="${color}" stroke-width="3"
        style="font-family:Archivo;font-weight:900;font-stretch:100%;font-size:84px">ECORAUM</text>
      <rect x="2" y="494" width="556" height="62" fill="${color}"/></svg>`;
  }
  for (const el of document.querySelectorAll(".mark")) {
    el.innerHTML = svg(el.dataset.color || "#0f0f0f", el.dataset.variant || "full");
  }
})();
