d3.selection.prototype.toggle = function() {
	var element = this[0][0];
	if (!element) return this;

  var tagName = element.tagName;
  var cStyle,
      t = document.createElement(tagName),
      gcs = "getComputedStyle" in window;

  document.body.appendChild(t);
  cStyle = (gcs ? window.getComputedStyle(t, "") : t.currentStyle).display;
  document.body.removeChild(t);

  var isHidden = this.style('display') == 'none';
  return this.style('display', isHidden ? cStyle : 'none');
}
