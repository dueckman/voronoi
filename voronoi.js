( function() {    
    
    var MAX_N_CIRCLES = 3;  // must be an integer between 3 and 10
    var circles = [];               
    var connections = [];
    var upperBound = 1000;
    var boundaries = [];           
    var circlesConnected = false;
    var currentRadius = 2;

    var svg = d3.select( "svg" );
    input = d3.select( "#nRadius" )  

    input.on( "input", function() {
        update( +this.value );
    });

    function drawCircle( circle ) {
        svg.append( "circle" )
          .attr( "cx", circle.x )
          .attr( "cy", circle.y )
          .attr( "r",  circle.r )
          .attr( "stroke", "black" )
          .attr( "stroke-width", 2 )
          .attr( "fill", "none" )
    }

    function drawLine( line ) {
        svg.append( "line" )
          .attr( "x1", line.x1 )
          .attr( "y1", line.y1 )
          .attr( "x2", line.x2 )
          .attr( "y2", line.y2 )
          .attr( "class", line.type )
          .attr( "id", line.id )
          .attr( "stroke", "gray" )
          .attr( "stroke-width", 0.5 )
    }

    function makeAnglePositive( radians ) {
        if ( radians < 0 ) {  radians = 2 * Math.PI + radians;  }
        return radians;
    } 

    function sq( n ) {
        return Math.pow( n, 2 )
    }

    function getLineLength( x1, y1, x2, y2 ) {
        return Math.sqrt( sq( x2 - x1) + sq( y2 - y1 ) );
    }

    function getLineMidpoint( line ) {
        return [ ( line.x1 + line.x2 ) / 2, ( line.y1 + line.y2 ) / 2 ];
    }

    function getLineDirection( line ) {        
        return makeAnglePositive( Math.atan2( ( line.y1 - line.y2 ), ( line.x2 - line.x1 ) ) );
    }

    function getLineEndpoint( x1, y1, angle, length ) {
        var x2 = length * Math.cos(angle) + x1;
        var y2 = y1 - ( length * Math.sin(angle) );
        return [ x2, y2 ];
    }    

    function updateLineEndpoint ( line, x, y ) {
        line.x2 = x;
        line.y2 = y;
        line.length = getLineLength ( line.x1, line.y1, line.x2, line.y2 );
        
        svg.select( "#" + line.id )
          .attr ( "x2", x )
          .attr ( "y2", y );        
    }
    
    function isHoriz( line ) {
        if ( line.y1 == line.y2 ) { return true; }
        else { return false; }
    }
    
    function isVert( line ) {
        if ( line.x1 == line.x2 ) { return true; }
        else { return false; }
    }
    
    function findSlope( line ) {
        return ( line.y2 - line.y1 ) / ( line.x2 - line.x1 );
    }
    
    function linesIntersect( line1, line2 ) {
        if ( getLineDirection( line 1 ) == getLineDirection( line 2 ) ) {
            return false;
        } else { 
            return true; 
        }
    }

    function findIntersection ( line1, line2 ) {
        var x, y, m1, m2, b1, b2;
        
        if ( isHoriz( line1 ) ) {
            y = line1.y1;
            if ( isVert( line2 ) ) {
                x = line2.x1;
            } else {
                m2 = findSlope( line2 );
                b2 = line2.y1 - ( m * line2.x1 );
                x = ( y - b2 ) / m2;
            }
        } else if ( isVert( line1 ) ) {
            x = line1.x1;
            if ( isHoriz( line2 ) ) {
                y = line2.y1;
            } else {
                m2 = findSlope( line2 );
                b2 = line2.y1 - ( m * line2.x1 );
                y = ( m2 * x ) + b2
            }
        } else {
            var m1 = findSlope( line1 );
            var m2 = findSlope( line2 );
            var b1 = line1.y1 - ( m1 * line1.x1 );
            var b2 = line2.y1 - ( m2 * line2.x1 );
            
            console.log( m1, m2, b1, b2 );
            
            y = ( ( b1 - ( m1 / m2 ) * b2 ) ) / ( 1 - ( m1 / m2 ) );
            x = ( y - b1 ) / m1;
        }

        return [ x, y ];
    }
    
    function pointIsWithinLineRange ( point, line ) {
        var x = point[0], y = point[1];
        var xRange = [ line.x1, line.x2 ].sort();
        var yRange = [ line.y1, line.y2 ].sort();
        
        if ( x < xRange[0] || x > xRange[1] || y < yRange[0] || y > yRange[1]) {
            return false;
        } else {
            return true;
        }
    }
    
    function connectCircles() {
        for ( i = 0; i < circles.length - 1; i++ ) {
            for ( j = i + 1; j < circles.length; j++ ) {
            
                var cxn = {
                    x1: circles[i].x,
                    y1: circles[i].y,
                    x2: circles[j].x,
                    y2: circles[j].y,
                    id: "c" + circles[i].id.toString() + circles[j].id.toString(),
                    type: "connection",
                    parentCircles: [ circles[i], circles[j] ],
                };
                
                cxn.length = getLineLength( cxn.x1, cxn.y1, cxn.x2, cxn.y2 );
                
                connections.push(cxn);
                drawLine( cxn );
            }  
        }
    } 

    function findBoundaries() {
        for (i = 0; i < connections.length; i++) {

            var cxn = connections[i];
            var angle = getLineDirection(cxn);
            var perpendiculars = [ ( ( angle + ( Math.PI / 2 ) ) % ( 2 * Math.PI ) ), 
                                   makeAnglePositive( angle - ( Math.PI / 2 ) ) ];

            for (j = 0; j < perpendiculars.length; j++) {

                var boundaryAngle = perpendiculars[j];
                var startPoint = getLineMidpoint(cxn);
                var endpoint = getLineEndpoint( startPoint[0], startPoint[1], boundaryAngle, 0 );

                var boundary = {
                    x1: startPoint[0],
                    y1: startPoint[1],
                    x2: endpoint[0],
                    y2: endpoint[1],
                    angle: boundaryAngle,
                    maxRadius: upperBound,
                    id: "b" + cxn.parentCircles[0].id.toString() + cxn.parentCircles[1].id.toString() + j.toString(),
                    type: "boundary",
                    parentCxn: cxn,
                    parentCircles: cxn.parentCircles 
                };
                
                boundary.length = getLineLength( boundary.x1, boundary.y1, boundary.x2, boundary.y2 );
                
                boundaries.push( boundary );
                drawLine( boundary ); 
            } 
        } 
    }

    svg.on( 'click', function() {
        if ( circles.length < MAX_N_CIRCLES ) {        
            
            var coords = d3.mouse(this);

            var circle = { 
                id: circles.length,                
                x: coords[0],
                y: coords[1], 
                r: nRadius.value 
            };  
            
            circles.push(circle);
            drawCircle(circle);

        } else if ( !circlesConnected ) {
            connectCircles();            
            circlesConnected = true;
            findBoundaries();
        } 
    });

    function update( radius ) {  
        currentRadius = radius;
        d3.select( "#radiusText" ).text( String( radius ) );
        svg.selectAll( "circle" )
          .attr( "r", radius );   

        svg.selectAll( ".temp" ).remove();
        
        for ( i = 0; i < boundaries.length; i++ ) {
            var boundary = boundaries[i];
            
            if ( radius < boundary.parentCxn.length / 2 ) {
                if ( boundary.length > 0 ) {
                    updateLineEndpoint( boundary, boundary.x1, boundary.y1 );
                }
            } else if ( radius < boundary.maxRadius ) {
                var newLength = Math.sqrt( sq( radius ) - sq( boundary.parentCxn.length / 2 ) );
                var newEndpoint = getLineEndpoint( boundary.x1, boundary.y1, boundary.angle, newLength );
                updateLineEndpoint( boundary, newEndpoint[0], newEndpoint[1]);

                if ( boundary.maxRadius == upperBound ) {
                    for ( j = 0; j < circles.length; j++ ) {
                        if ( circles[j] !== boundary.parentCircles[0] && circles[j] !== boundary.parentCircles[1] ) {
                            if ( getLineLength( boundary.x2, boundary.y2, circles[j].x, circles[j].y ) <= radius ) {
                                
                                var int = []
                                var intBoundaryID = boundary.id.substr(0,2) + circles[j].id.toString(); // Here we need to grab the third intersecting line
                                
                                for ( k = 0; k < boundaries.length; k++ ) {
                                    if ( boundaries[k].id.substr(0,3) == intBoundaryID && linesIntersect( boundary, boundaries[k] ) ) {
                                          
                                        int = findIntersection ( boundary, boundaries[k] );
                                        console.log( boundary.id, boundaries[k].id, int[0], int[1] );
                                        
                                        if ( pointIsWithinLineRange( int, boundaries[k] ) ) {
                                            boundaries[k].maxRadius = radius;  // Could probably be more precise
                                            boundaries[k].outerX = int[0];
                                            boundaries[k].outerY = int[1];
                                            //updateLineEndpoint( boundaries[k], int[0], int[1] );
                                            //boundaries[k].maxLength = boundaries[k].length;
                                        }
                                    }
                                }
                                
                                boundary.maxRadius = radius; // Could probably be more precise
                                boundary.outerX = int[0];
                                boundary.outerY = int[1];
                                //updateLineEndpoint( boundary, int[0], int[1] );
                                //boundary.maxLength = boundary.length;
                            }
                        }
                    }
                }            
            } else {
                if ( boundary.length != boundary.maxLength ) {
                    updateLineEndpoint( boundary, boundary.outerX, boundary.outerY );    
                }
            }
        }
    } 
    
})();
