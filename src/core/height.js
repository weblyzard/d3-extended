d3.selection.prototype.height = function() {
	var node = this.node();
	return (node.getBBox ? node.getBBox() : node.getBoundingClientRect()).height;
}
