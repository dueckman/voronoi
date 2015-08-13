( function() {    
    
    var MAX_N_CIRCLES = 5;
    var circles = [];               
    var connections = [];
    //var shortestCxnL = 1000;
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

    function getLineLength( line ) {
        return Math.sqrt( Math.pow( line.x2 - line.x1, 2 ) + Math.pow( line.y2 - line.y1, 2 ) );
    }

    function getLineMidpoint( line ) {
        return [ ( line.x1 + line.x2 ) / 2, ( line.y1 + line.y2 ) / 2 ];
    }

    function getLineDirection( line ) {        
        return makeAnglePositive( Math.atan2( ( line.y1 - line.y2 ), ( line.x2 - line.x1 ) ) );
    }

    function getLineEndpoint(x1,y1,angle,length) {
        var x2 = length * Math.cos(angle) + x1;
        var y2 = y1 - ( length * Math.sin(angle) );
        return [ x2, y2 ];
    }    

    function connectCircles( circlesArray ) {
        var tempCxns = [];
        
        for (i = 0; i < circlesArray.length - 1; i++) {
            for (j = i + 1; j < circlesArray.length; j++) {
            
                var cxn = {
                    x1: circlesArray[i].x,
                    y1: circlesArray[i].y,
                    x2: circlesArray[j].x,
                    y2: circlesArray[j].y,
                    type: "connection",
                    parentCircles: [ circlesArray[i], circlesArray[j] ],
                };
                
                cxn.length = getLineLength( cxn );
                
                tempCxns.push(cxn);
            }  
        }
        
        return tempCxns;
    } 

    function findBoundaries() {
        for (i = 0; i < connections.length; i++) {

            var cxn = connections[i];
            var angle = getLineDirection(cxn);
            var perpendiculars = [ ( ( angle + ( Math.PI / 2 ) ) % ( 2 * Math.PI ) ), 
                                   makeAnglePositive( angle - ( Math.PI / 2 ) ) ];

            for (j = 0; j < perpendiculars.length; j++) {

                var boundaryAngle = perpendiculars[j];
                var length = 10;
                var startPoint = getLineMidpoint(cxn);
                var endpoint = getLineEndpoint( startPoint[0], startPoint[1], boundaryAngle, length );

                var boundary = {
                    x1: startPoint[0],
                    y1: startPoint[1],
                    x2: endpoint[0],
                    y2: endpoint[1],
                    id: "b" + String( boundaries.length ),
                    type: "boundary",
                    parentCxn: cxn,
                    parentCircles: cxn.parentCircles 
                };
                
                console.log( boundary.id );
                
                boundaries.push(boundary);
                drawLine(boundary); 
            } 
        } 
    }

    svg.on('click', function() {
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
            connections = connectCircles(circles);
            for (i = 0; i < connections.length; i++) {
                drawLine(connections[i]);
            }
            
            findBoundaries();
            circlesConnected = true;
        } 
    });

    function update( radius ) {  
        svg.selectAll("circle")
          .attr("r", radius);   

        for (i = 0; i < boundaries.length; i++) {
            var boundary = boundaries[i];
            
            if ( radius > boundary.parentCxn.length / 2 ) {
                console.log("Hey!");
                svg.select( "#" + boundary.id )
                  .attr ( "stroke-width", 5 )
                
                //var endpoint = getLineEndpoint( startPoint[0], startPoint[1], boundaryAngle, length );
            //select SVG object
            
            }
        }
    } 
    
})();
