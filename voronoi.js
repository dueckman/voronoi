( function() {    
    
    var MAX_N_CIRCLES = 3;
    var circles = [];               
    var connections = [];
    var upperBound = 1000;
    var boundaries = [];           
    var circlesConnected = false;

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
    
    function solveQuadratic ( a, b, c ) {
        var x1 = ( -b + Math.sqrt( Math.pow( b, 2 ) - 4 * a * c ) ) / 2
        var x2 = ( -b - Math.sqrt( Math.pow( b, 2 ) - 4 * a * c ) ) / 2
        return [ x1, x2 ]
    }

    function findLineCircleIntersections ( line, circle ) {
        // line formula: y = mx + b
        var m = ( line.y2 - line.y1 ) / ( line.x2 - line.x1 );
        var b = m * line.x1 - line.y1;
        console.log("line: y =", m, "* x +", b);
        
        // circle formula: r^2 = (x-p)^2 + (y-q)^2
        var p = circle.x;
        var q = circle.y;
        var r = circle.r;
        console.log("circle:", r, "^2 = ...");
        
        // solving the two forumlas above gives a quadratic for x with the following coefficients:
        var A = Math.pow( m, 2 ) + 1;
        var B = 2 * ( m * b - m * circle.y - circle.x );
        var C = sq( q ) - sq( r ) + sq( p ) - 2 * b * q + sq( b );
        
        var xs = solveQuadratic( A, B, C );
        return [ [ xs[0], m * xs[0] + b ], [ xs[1], m * xs[1] + b ] ];
    }

    function connectCircles() {
        for ( i = 0; i < circles.length - 1; i++ ) {
            for ( j = i + 1; j < circles.length; j++ ) {
            
                var cxn = {
                    x1: circles[i].x,
                    y1: circles[i].y,
                    x2: circles[j].x,
                    y2: circles[j].y,
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
                    id: "b" + String( boundaries.length ),
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
        d3.select( "#radiusText" ).text( radius );
        
        svg.selectAll( "circle" )
          .attr( "r", radius );   

        var testCircle = svg.select( "circle ");
        console.log ( testCircle, testCircle[0] );
        
        svg.selectAll( ".temp" ).remove();
        
        for ( i = 0; i < boundaries.length; i++ ) {
            var boundary = boundaries[i];
            
            if ( radius < boundary.parentCxn.length / 2 ) {
                if ( boundary.length > 0 ) {
                    updateLineEndpoint( boundary, boundary.x1, boundary.y1 );
                }
            } else if ( radius < boundary.maxRadius ) {
                var newLength = Math.sqrt( Math.pow( radius, 2 ) - Math.pow( boundary.parentCxn.length / 2, 2 ) );
                var newEndpoint = getLineEndpoint( boundary.x1, boundary.y1, boundary.angle, newLength );

                updateLineEndpoint( boundary, newEndpoint[0], newEndpoint[1]);

                if ( boundary.maxRadius == upperBound ) {
                    for ( j = 0; j < circles.length; j++ ) {

                        if ( circles[j] !== boundary.parentCircles[0] && circles[j] !== boundary.parentCircles[1] ) {

                            /*
                            var measurement = { 
                              x1: boundary.x2,
                              y1: boundary.y2,
                              x2: circles[j].x,
                              y2: circles[j].y,
                              type: "temp"
                            };                            
                            drawLine( measurement );
                            */
                            
                            if ( getLineLength( boundary.x2, boundary.y2, circles[j].x, circles[j].y ) <= radius ) {
                                //console.log( boundary.id, getLineLength( boundary.x2, boundary.y2, circles[j].x, circles[j].y ), radius);
                                
                                console.log( boundary.id, circles[j].id )
                                var ints = findLineCircleIntersections ( boundary, circles[j] );
                                
                                console.log( ints[0], ints[1] ); 
                                
                                var length0 = getLineLength( boundary.x1, boundary.y1, ints[0][0], ints[0][1] ); 
                                var length1 = getLineLength( boundary.x1, boundary.y1, ints[1][0], ints[1][1] ); 
                                
                                var firstInt = [];
                                if ( length0 < length1 ) {  firstInt = ints[0];  }
                                else                     {  firstInt = ints[1];  }
                                
                                boundary.maxLength = getLineLength( boundary.x1, boundary.y1, firstInt[0], firstInt[1] );
                                boundary.maxRadius = radius;
                                boundary.outerX = firstInt[0];
                                boundary.outerY = firstInt[1];
                                //console.log( boundary.id, "maxLength updated to", boundary.maxLength);
                                
                                updateLineEndpoint( boundary, boundary.outerX, boundary.outerY );
                            }
                        }
                    }
                }            
            }
            else {
                if ( boundary.length != boundary.maxLength ) {
                    updateLineEndpoint( boundary, boundary.outerX, boundary.outerY );    
                }
            }
        }
    } 
    
})();
