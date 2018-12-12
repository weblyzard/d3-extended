(function() {

var extend = function(d3) {

if(typeof d3 === 'undefined' && typeof d3 !== 'object') {
  console.log('D3 not found.');
  return false;
}
d3.selection.prototype.addClass = function(classNames) {
  return this.classed(classNames, true);
}

d3.selection.prototype.after = function(tagName) {
  var elements = [];

  this.each(function() {
    var element = document.createElement(tagName);
    this.parentNode.insertBefore(element, this.nextSibling);
    elements.push(element);
  });

  return d3.selectAll(elements);
}
d3.selection.prototype.appendTo = function(selector) {
  var targets = d3.selectAll(selector),
    targetCount = targets.size(),
    _this = this,
    clones = [];

  targets.each(function() {
    var currTarget = this;
    _this.each(function() {
      if(targetCount > 1) {
        var clone = this.cloneNode(true);
        currTarget.appendChild(clone);
        clones.push(clone);
      }
      else {
        currTarget.appendChild(this);
      }
    });
  });

  if(targetCount > 1) {
    this.remove();
  }

  return clones.length > 0 ? d3.selectAll(clones) : this;
}

d3.selection.prototype.before = function(tagName) {
  var elements = [];

  this.each(function() {
    var element = document.createElement(tagName);
    this.parentNode.insertBefore(element, this);
    elements.push(element);
  });

  return d3.selectAll(elements);
}
d3.cast = function(other) {
	if (other instanceof d3.selection) {
		return other;
	}

	if (typeof other === 'string') {
		return d3.selectAll(other);
	}

	if (other instanceof Element) {
		return d3.selectAll(other);
	}

	if (other.jquery) {
		if (console && console.warn) {
			console.warn('Casting jQuery object to d3.selection');
		}
		return d3.selectAll(other.selector);
	}

	throw TypeError('Cannot cast arbitrary object to d3.selection');
};

d3.selection.prototype.clear = function() {
  this.selectAll('*').remove();
  return this;
}
d3.selection.prototype.css = d3.selection.prototype.style;
d3.labeler = function() {
    var lab = [],
      anc = [],
      w = 100, // box width
      h = 100, // box width
      pL = 0, // padding left
      pR = 0, // padding right
      pT = 0, // padding top
      pB = 0, // padding bottom
      labelDist = 50, // safe distance to the nearest label
      labeler = {};
  
    var max_move = 5.0,
      max_angle = 0.5,
      acc = 0,
      rej = 0;
  
    // weights
    var w_len = 0.2, // leader line length
      w_inter = 1.0, // leader line intersection
      w_lab2 = 30.0, // label-label overlap
      w_lab_anc = 30.0, // label-anchor overlap
      w_orient = 3.0; // orientation bias
  
    // booleans for user defined functions
    var user_energy = false,
      user_schedule = false;
  
    var user_defined_energy, user_defined_schedule;
  
    //energy function, tailored for label placement
    var energy = function(index) {
      var m = lab.length,
        ener = 0,
        dx = lab[index].x - anc[index].x,
        dy = anc[index].y - lab[index].y,
        dist = Math.sqrt(dx * dx + dy * dy),
        overlap = true;
      //amount = 0,
      //theta = 0;
  
      // penalty for length of leader line
      if (dist > 0) ener += dist * w_len;
  
      // label orientation bias
      dx /= dist;
      dy /= dist;
      if (dx > 0 && dy > 0) ener += 0 * w_orient;
      else if (dx < 0 && dy > 0) ener += 1 * w_orient;
      else if (dx < 0 && dy < 0) ener += 2 * w_orient;
      else ener += 3 * w_orient;
  
      var x21 = lab[index].x,
        y21 = lab[index].y - lab[index].height + 2.0,
        x22 = lab[index].x + lab[index].width,
        y22 = lab[index].y + 2.0;
  
      var x11, x12, y11, y12, x_overlap, y_overlap, overlap_area;
  
      for (var i = 0; i < m; i++) {
        if (i !== index) {
          // penalty for intersection of leader lines
          overlap = intersect(
            anc[index].x,
            lab[index].x,
            anc[i].x,
            lab[i].x,
            anc[index].y,
            lab[index].y,
            anc[i].y,
            lab[i].y
          );
  
          if (overlap) ener += w_inter;
  
          // penalty for label-label overlap
          x11 = lab[i].x;
          y11 = lab[i].y - lab[i].height + 2.0;
          x12 = lab[i].x + lab[i].width;
          y12 = lab[i].y + 2.0;
          x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
          y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
          overlap_area = x_overlap * y_overlap;
          ener += overlap_area * w_lab2;
        }
  
        // penalty for label-anchor overlap
        x11 = anc[i].x - anc[i].r;
        y11 = anc[i].y - anc[i].r;
        x12 = anc[i].x + anc[i].r;
        y12 = anc[i].y + anc[i].r;
        x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
        y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
        overlap_area = x_overlap * y_overlap;
        ener += overlap_area * w_lab_anc;
      }
      return ener;
    };
  
    // Monte Carlo translation move
    var mcmove = function(currT) {
      // select a random label
      var i = Math.floor(Math.random() * lab.length);
  
      // save old coordinates
      var x_old = lab[i].x;
      var y_old = lab[i].y;
  
      // old energy
      var old_energy;
      if (user_energy) old_energy = user_defined_energy(i, lab, anc);
      else old_energy = energy(i);
  
      // random translation
      lab[i].x += (Math.random() - 0.5) * max_move;
      lab[i].y += (Math.random() - 0.5) * max_move;
  
      // hard wall boundaries
      if (lab[i].x + lab[i].width > w - pR) lab[i].x = x_old - 100;
      if (lab[i].x < pL) lab[i].x = x_old + 1;
      if (lab[i].y > h - pB) lab[i].y = y_old - 1;
      if (lab[i].y < pT) lab[i].y = y_old + 1;
  
      // new energy
      var new_energy;
      if (user_energy) new_energy = user_defined_energy(i, lab, anc);
      else new_energy = energy(i);
  
      // delta E
      var delta_energy = new_energy - old_energy;
  
      if (Math.random() < Math.exp(-delta_energy / currT)) acc += 1;
      else {
        // move back to old coordinates
        lab[i].x = x_old;
        lab[i].y = y_old;
        rej += 1;
      }
    };
  
    // Monte Carlo rotation move
    var mcrotate = function(currT) {
      // select a random label
      var i = Math.floor(Math.random() * lab.length);
  
      // save old coordinates
      var x_old = lab[i].x;
      var y_old = lab[i].y;
  
      // old energy
      var old_energy;
      if (user_energy) old_energy = user_defined_energy(i, lab, anc);
      else old_energy = energy(i);
  
      // random angle
      var angle = (Math.random() - 0.5) * max_angle;
  
      var s = Math.sin(angle);
      var c = Math.cos(angle);
  
      // translate label (relative to anchor at origin):
      lab[i].x -= anc[i].x;
      lab[i].y -= anc[i].y;
  
      // rotate label
      var x_new = lab[i].x * c - lab[i].y * s,
        y_new = lab[i].x * s + lab[i].y * c;
  
      // translate label back
      lab[i].x = x_new + anc[i].x;
      lab[i].y = y_new + anc[i].y;
  
      // hard wall boundaries
      if (lab[i].x + lab[i].width > w - pR) lab[i].x = x_old - 100;
      if (lab[i].x < pL) lab[i].x = x_old + 1;
      if (lab[i].y > h - pB) lab[i].y = y_old - 1;
      if (lab[i].y < pT) lab[i].y = y_old + 1;
  
      // new energy
      var new_energy;
      if (user_energy) new_energy = user_defined_energy(i, lab, anc);
      else new_energy = energy(i);
  
      // delta E
      var delta_energy = new_energy - old_energy;
  
      if (Math.random() < Math.exp(-delta_energy / currT)) {
        acc += 1;
      } else {
        // move back to old coordinates
        lab[i].x = x_old;
        lab[i].y = y_old;
        rej += 1;
      }
    };
  
    // returns true if two lines intersect, else false
    // from http://paulbourke.net/geometry/lineline2d/
    var intersect = function(x1, x2, x3, x4, y1, y2, y3, y4) {
      var mua, mub;
      var denom, numera, numerb;
  
      denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
      numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
  
      // is the intersection along the the segments
      mua = numera / denom;
      mub = numerb / denom;
      if (!(mua < 0 || mua > 1 || mub < 0 || mub > 1)) return true;
      return false;
    };
  
    // linear cooling
    var cooling_schedule = function(currT, initialT, nsweeps) {
      return currT - initialT / nsweeps;
    };
  
    // main simulated annealing function
    labeler.start = function(nsweeps) {
      var m = lab.length,
        currT = 1.0,
        initialT = 1.0;
  
      for (var i = 0; i < nsweeps; i++) {
        for (var j = 0; j < m; j++) {
          if (Math.random() < 0.5) mcmove(currT);
          else mcrotate(currT);
        }
        currT = cooling_schedule(currT, initialT, nsweeps);
      }
  
      for (i = 0; i < m; i++) {
        for (j = 0; j < m; j++) {
          if (i != j) {
            checkDist(lab[i], lab[j]);
          }
        }
        if (lab[i].count === m - 1) lab[i].showLine = false;
        else lab[i].showLine = true;
      }
    };
  
    // check distance between two labels
    var checkDist = function(lab1, lab2) {
      var d11 = lineDist(lab1.x, lab1.y, lab2.x, lab2.y);
      var d12 = lineDist(lab1.x, lab1.y, lab2.x + lab2.width, lab2.y);
      var d21 = lineDist(lab1.x + lab1.width, lab1.y, lab2.x, lab2.y);
      var d22 = lineDist(lab1.x + lab1.width, lab1.y, lab2.x + lab2.width, lab2.y);
  
      if (d11 >= labelDist && d12 >= labelDist && d21 >= labelDist && d22 >= labelDist) lab1.count++;
    };
  
    // calculate distance between two points
    var lineDist = function(x, y, x0, y0) {
      return Math.sqrt((x -= x0) * x + (y -= y0) * y);
    };
  
    // users insert graph width
    labeler.width = function(x) {
      if (!arguments.length) return w;
      w = x;
      return labeler;
    };
  
    // users insert padding
    labeler.padding = function(pl, pr, pt, pb) {
      if (!arguments.length) return null;
      pL = pl;
      pR = pr;
      pT = pt;
      pB = pb;
      return labeler;
    };
  
    // users insert distance to check for neighboring labels
    labeler.displayLines = function(x) {
      if (!arguments.length) return labelDist;
      labelDist = x;
      return labeler;
    };
  
    // users insert graph height
    labeler.height = function(x) {
      if (!arguments.length) return h;
      h = x;
      return labeler;
    };
  
    // users insert label positions
    labeler.label = function(x) {
      if (!arguments.length) return lab;
      lab = x;
      return labeler;
    };
  
    // users insert anchor positions
    labeler.anchor = function(x) {
      if (!arguments.length) return anc;
      anc = x;
      return labeler;
    };
  
    // user defined energy
    labeler.alt_energy = function(x) {
      if (!arguments.length) return energy;
      user_defined_energy = x;
      user_energy = true;
      return labeler;
    };
  
    // user defined cooling_schedule
    labeler.alt_schedule = function(x) {
      if (!arguments.length) return cooling_schedule;
      user_defined_schedule = x;
      user_schedule = true;
      return labeler;
    };
  
    return labeler;
  };
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

d3.selection.prototype.eq = function(findI, findJ) {
  findJ = findJ || 0;
  return this.filter(function(d,i,j){return i == findI && j == findJ})
}

d3.selection.prototype.first = function() {
  // adapted from https://github.com/mbostock/d3/blob/master/src/selection/each.js
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) return d3.select(node);
    }
  }
}

d3.selection.prototype.hasClass = function(className) {
  return this.classed(className);
}
d3.selection.prototype.height = function() {
	return this.dimensions().height;
}

d3.selection.prototype.hide = function() {
  this.style('display', 'none');
  return this;
}
d3.selection.prototype.last = function() {
  // adapted from https://github.com/mbostock/d3/blob/master/src/selection/each.js
  for (var j = this.length - 1; j >= 0; j--) {
    for (var group = this[j], i = group.length - 1, node; i >= 0; i--) {
      if (node = group[i]) return d3.select(node);
    }
  }
}

d3.selection.prototype.moveToBack = function() { 
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  });
}
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
}
// taken from the awesome https://github.com/gka/d3-jetpack/blob/master/d3-jetpack.js#L138
// we need the original on function from d3 for selection.trigger

var d3_selection_on = d3.selection.prototype.on;
d3.selection.prototype.on = function(type, listener, capture) {
  if (typeof type === 'string' && type.indexOf(' ') > -1) {
    var types = type.split(' ');
    for (var i = 0; i < types.length; i++) {
        d3_selection_on.apply(this, [types[i], listener, capture]);
    }
  } else {
    d3_selection_on.apply(this, [type, listener, capture]);
  }
  
  return this;
};
//the same as append, but inserting the element before the first element in the container
d3.selection.prototype.prepend = function(tagName) {
  var elements = [];

  this.each(function() {
    var element = document.createElement(tagName);
    this.insertBefore(element, this.firstChild);
    elements.push(element);
  });

  return d3.selectAll(elements);
}
d3.selection.prototype.removeClass = function(classNames) {
  return this.classed(classNames, false);
}

d3.selection.prototype.show = function() {
	var element = this[0][0];
	if (!element) return this;

	var tagName = element.tagName;
  var cStyle,
      t = document.createElement(tagName),
      gcs = "getComputedStyle" in window;

  document.body.appendChild(t);
  cStyle = (gcs ? window.getComputedStyle(t, "") : t.currentStyle).display;
  document.body.removeChild(t);

  this.style('display', cStyle);
  return this;
}

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

d3.selection.prototype.toggleClass = function(classNames) {
  var classes = classNames.split(' ');

  for(var i = 0; i < classes.length;i++) {
    var c = classes[i];
    this.classed(c, !this.classed(c));
  }
  return this;
}
d3.selection.prototype.trigger = function(evtName, data) {
  d3_selection_on.apply(this, [evtName])(data);
   return this;
}
d3.selection.prototype.width = function() {
	return this.dimensions().width;
}


return d3;
}

if(typeof module === 'object' && module.exports) {
  module.exports = extend;
}
else if(typeof define === 'function' && define.amd) {
  define(['d3'], extend);
}
else {
  extend(d3);
}

})();