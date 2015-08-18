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

    function getLineLength( x1, y1, x2, y2 ) {
        return Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) );
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
                    maxLength: upperBound,
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
        svg.selectAll("circle")
          .attr("r", radius);   
        
        svg.selectAll( ".temp" ).remove();
        
        for ( i = 0; i < boundaries.length; i++ ) {
            var boundary = boundaries[i];
            
            if ( ( radius > boundary.parentCxn.length / 2 ) && ( radius < boundary.maxLength ) ) {
                console.log( "Updating", boundary.id, "- Max boundary length =", boundary.maxLength);
                var newLength = Math.sqrt( Math.pow( radius, 2 ) - Math.pow( boundary.parentCxn.length / 2, 2 ) );
                var newEndpoint = getLineEndpoint( boundary.x1, boundary.y1, boundary.angle, newLength );

                boundary.x2 = newEndpoint[0];
                boundary.y2 = newEndpoint[1];

                svg.select( "#" + boundary.id )
                  .attr ( "x2", newEndpoint[0] )
                  .attr ( "y2", newEndpoint[1] );
                  
                if ( boundary.maxLength == upperBound ) {
                    console.log( "Checking upper bound" );
                    for ( j = 0; j < circles.length; j++ ) {

                        if ( circles[j] !== boundary.parentCircles[0] && circles[j] !== boundary.parentCircles[1] ) {
                            console.log( circles[j].id, boundary.parentCircles[0].id, boundary.parentCircles[1].id );

                            var measurement = { 
                              x1: boundary.x2,
                              y1: boundary.y2,
                              x2: circles[j].x,
                              y2: circles[j].y,
                              type: "temp"
                            };                            
                            
                            drawLine( measurement );
                        
                            if ( getLineLength( boundary.x2, boundary.y2, circles[j].x, circles[j].y ) <= radius ) {
                                console.log( boundary.id, getLineLength( boundary.x2, boundary.y2, circles[j].x, circles[j].y ), radius);
                                
                                boundary.maxLength = getLineLength( boundary.x1, boundary.y1, boundary.x2, boundary.y2 );
                                console.log( boundary.id, "maxLength updated to", boundary.maxLength);
                            }
                        }
                    }
                }

            } else {
                boundary.x2 = boundary.x1;
                boundary.y2 = boundary.y1;
                
                svg.select( "#" + boundary.id )
                  .attr ( "x2", boundary.x1 )
                  .attr ( "y2", boundary.y1 )
            }
        }
    } 
    
})();
