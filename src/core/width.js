d3.selection.prototype.width = function() {
	var node = this.node();
	return (node.getBBox ? node.getBBox() : node.getBoundingClientRect()).width;
}
