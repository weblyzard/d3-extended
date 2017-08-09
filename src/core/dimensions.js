// Emulation of PrototypeJS’ Element.getDimensions() method
d3.selection.prototype.dimensions = function() {
	var dim;
	var element = this.node();
	var display = this.style('display');

	var getDimensions = function(e) {
		if (e.getBBox) {
			var box = e.getBBox();
			return [box.width, box.height];
		}

		return [e.offsetWidth, e.offsetHeight];
	};

	if (display && display !== 'none') {
		dim = getDimensions(element);
		return { width: dim[0], height: dim[1] };
	}

	var style = element.style;

	var originalStyles = {
		visibility: style.visibility,
		position:   style.position,
		display:    style.display
	};

	var newStyles = {
		visibility: 'hidden',
		display:    'block'
	};

	if (originalStyles.position !== 'fixed') {
		newStyles.position = 'absolute';
	}

	this.style(newStyles);

	dim = getDimensions(element);

	var dimensions = {
		width:  dim[0],
		height: dim[1]
	};

	this.style(originalStyles);

	return dimensions;
}
