Quadtree
--------
This is a quadtree Javascript library for recursively partitioning 2-dimensional spaces into hierarchical grids. This implementation uses a `capacity` parameter to constrain the number of data-points a space can have before subdivision occurs. 

**QuadTree.js** : Library.

```javascript
// A quadtree from (0,0) to (100, 100) with capacity of 4 data points
var quadTree = new QuadTree(0, 0, 100, 100, 4);
quadTree.put( {x:12, y:15});
quadTree.put( {x:42, y:15});
quadTree.put( {x:12, y:55});
quadTree.put( {x:2,  y:0});
quadTree.put( {x:12, y:18});
quadTree.print(); // Print the internal structure
quadTree.hasData({x:0, y:80}) // Return false
quadTree.hasData({x:42, y:15}) // Return true
```


**QuadTree.html** : Interactive quadtree demo visualization with D3.

![test](https://lh5.googleusercontent.com/-vQuhkcF6x8w/VAtuv_P4k-I/AAAAAAAACIE/dS5LJ1y4PsI/w1290-h1266-no/exp_quad_tree.png)
