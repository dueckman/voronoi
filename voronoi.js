( function() {    
    
    var MAX_N_CIRCLES = 5;
    var circles = [];               
    var connections = [];
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
          .attr( "stroke", "gray" )
          .attr( "stroke-width", 0.5 )
    }


    function getLineLength(lineObject) {
        return Math.sqrt( Math.pow( lineObject.x2 - lineObject.x1, 2 ) + Math.pow( lineObject.y2 - lineObject.y1, 2 ) );
    }


    function getLineMidpoint(lineObject) {
        return [ ( lineObject.x1 + lineObject.x2 ) / 2, ( lineObject.y1 + lineObject.y2 ) / 2 ];
    }


    function makeAnglePositive(radians) {
        if ( radians < 0 ) {  radians = 2 * Math.PI + radians;  }
        return radians;
    } 
   

    function getLineDirection(lineObject) {        
        return makeAnglePositive( Math.atan2( ( lineObject.y1 - lineObject.y2 ), ( lineObject.x2 - lineObject.x1 ) ) );
    }


    function getLineEndpoint(x1,y1,angle,length) {
        var x2 = length * Math.cos(angle) + x1;
        var y2 = y1 - ( length * Math.sin(angle) );
        return [ x2, y2 ];
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
            connectCircles();
            findBoundaries();
            circlesConnected = true;
        } 
    });


    function connectCircles() {
        for (i = 0; i < circles.length - 1; i++) {
            for (j = i + 1; j < circles.length; j++) {
            
                var cxn = {
                    x1: circles[i].x,
                    y1: circles[i].y,
                    x2: circles[j].x,
                    y2: circles[j].y,
                    type: "connection",
                    parentCircles: [ circles[i], circles[j] ]  // or do we just want IDs here?
                };
            
                connections.push(cxn);
                drawLine(cxn);
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
                var length = 10;
                var startPoint = getLineMidpoint(cxn);
                var endpoint = getLineEndpoint( startPoint[0], startPoint[1], boundaryAngle, length );

                var boundary = {
                    x1: startPoint[0],
                    y1: startPoint[1],
                    x2: endpoint[0],
                    y2: endpoint[1],
                    type: "boundary",
                    parentCircles: cxn.parentCircles 
                };
            
                boundaries.push(boundary);
                drawLine(boundary); 
            } 
        } 
    }

    
    function update(radius) {  
        svg.selectAll("circle")
          .attr("r", radius);   
    } 

        
})();
