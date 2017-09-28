d3.cast = function(other) {
	if (other instanceof d3.selection) {
		return other;
	}

	if (typeof other === 'string') {
		return d3.select(other);
	}

	if (other instanceof Element) {
		return d3.select(other);
	}

	if (other.jquery) {
		console.warn('Casting jQuery object to d3.selection'); // eslint-disable-line no-console
		return d3.select(other.selector);
	}

	throw TypeError('Cannot cast arbitrary object to d3.selection');
};
