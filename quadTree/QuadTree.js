var QuadTree = function(x1, y1, x2, y2, capacity) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.capacity = capacity;  

  this.topLeft  = null;
  this.topRight = null;
  this.bottomLeft  = null;
  this.bottomRight = null;
  this.ancestor = null;
  this.isSplit = false;

  this.area = Math.abs( (x2 - x1) * (y2 - y1));
  this.data = [];
};

QuadTree.prototype.split = function() {
  if (this.isSplit) return;

  var midx = Math.abs(this.x2 - this.x1) * 0.5;
  var midy = Math.abs(this.y2 - this.y1) * 0.5;

  this.topLeft      = new QuadTree(this.x1,      this.y1 + midy, this.x1 + midx, this.y2,        this.capacity);
  this.topRight     = new QuadTree(this.x1+midx, this.y1 + midy, this.x2,        this.y2,        this.capacity);
  this.bottomLeft   = new QuadTree(this.x1,      this.y1,        this.x1 + midx, this.y1 + midy, this.capacity);
  this.bottomRight  = new QuadTree(this.x1+midx, this.y1,        this.x2,        this.y1 + midy, this.capacity);

  this.topLeft.ancestor = this;
  this.topRight.ancestor = this;
  this.bottomLeft.ancestor = this;
  this.bottomRight.ancestor = this;
  this.isSplit = true;
};



QuadTree.prototype.findQ = function( d ) {
  var midx = Math.abs(this.x2 - this.x1) * 0.5;
  var midy = Math.abs(this.y2 - this.y1) * 0.5;
  if (! this.isSplit) return this;

  if (d.x <= this.x1 + midx && d.y > this.y1 + midy) return this.topLeft.findQ(d);
  if (d.x  > this.x1 + midx && d.y > this.y1 + midy) return this.topRight.findQ(d);
  if (d.x <= this.x1 + midx && d.y <= this.y1 + midy) return this.bottomLeft.findQ(d);
  if (d.x  > this.x1 + midx && d.y <= this.y1 + midy) return this.bottomRight.findQ(d);
};


QuadTree.prototype.hasData = function( d ) {
  var midx = Math.abs(this.x2 - this.x1) * 0.5;
  var midy = Math.abs(this.y2 - this.y1) * 0.5;

  if (! this.isSplit) {
    var found = false;
    this.data.forEach(function(elem) {
      console.log(elem, d);
      if (elem.x === d.x && elem.y === d.y) found = true;
    });
    return found;
  }

  if (d.x <= this.x1 + midx && d.y > this.y1 + midy) return this.topLeft.hasData(d);
  if (d.x  > this.x1 + midx && d.y > this.y1 + midy) return this.topRight.hasData(d);
  if (d.x <= this.x1 + midx && d.y <= this.y1 + midy) return this.bottomLeft.hasData(d);
  if (d.x  > this.x1 + midx && d.y <= this.y1 + midy) return this.bottomRight.hasData(d);
};

QuadTree.prototype.put = function( d ) {
  var midx = Math.abs(this.x2 - this.x1) * 0.5;
  var midy = Math.abs(this.y2 - this.y1) * 0.5;

  if (! this.isSplit) {
    this.data.push(d);

    if (this.data.length > this.capacity && this.area > 2500) {
      this.split();
      for (var i=0; i < this.data.length; i++) {
        this.put(this.data[i]);
      }
      this.data = [];
    }
    return;
  }

  if (d.y <= this.y1 + midy) {
    if (d.x <= this.x1 + midx) {
      this.bottomLeft.put( d );
    } else {
      this.bottomRight.put( d );
    }
  } else {
    if (d.x <= this.x1 + midx) {
      this.topLeft.put( d );
    } else {
      this.topRight.put( d );
    }
  }
};

QuadTree.prototype.size = function() {
  if (! this.isSplit) {
    return this.data.length;
  }

  return this.topLeft.size() +
    this.topRight.size() +
    this.bottomLeft.size() + 
    this.bottomRight.size();
};

QuadTree.prototype.print = function(lvl) {
  if (! lvl) lvl = 1;
  console.log(new Array(lvl).join(' '), '('+this.x1, this.y1+') - (' + this.x2, this.y2 +') -> ', this.data );
  lvl += 2;

  if (this.topLeft) this.topLeft.print(lvl);
  if (this.topRight) this.topRight.print(lvl);
  if (this.bottomLeft) this.bottomLeft.print(lvl);
  if (this.bottomRight) this.bottomRight.print(lvl);
};

