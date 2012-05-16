/*
Name: Engine Core
Version: 1.0
Author: Ashton Blue
Author URL: http://blueashes.com
Publisher: Manning
Credits: Based on Mozilla's WebGL (https://developer.mozilla.org/en/WebGL)
and Giles Thomas' Learning WebGL (http://learningwebgl.com/blog) tutorials.

Desc: Contains all the components that handle setup and object generation.
Important, shouldn't contain any functions run during a game. Those should
be stored in game.js. All classes are stored in template.js.
*/

var gd = gd || {};

/*---------
 Core game logic
---------*/
var Engine = Class.extend({
    /* ----- Default Values -----*/
    canvas: document.getElementById("canvas"),
    size: {
        width: 400,
        height: 400
    },
    storage: [],
    typeA: [],
    typeB: [],
    
    /*
    storage: {
        main: [],
        a: [],
        b: []
    }
    */
    
    /* ----- Utilities -----*/
    // Note: delete this
    spawnEntity: function(name, x, y, z) {
        // temporarily store item
        var entity = (new name);
        
        // window[] allows you to process its contents and treat it as a variable
        //window['id' + this.id] = (new name);
        // Pushes your new variable into an array and runs its spawn function
        this.storage.push(entity.spawn(x, y, z));
        
        // Push into type storage for quicker collision detection
        switch (entity.type) {
            case 'a':
                this.typeA.push(entity);
                break;
            case 'b':
                this.typeB.push(entity);
                break;
            default:
                break;
        }
        
        // Runs the buffers for your object to create the proper shape data
        if (entity.bufVert || entity.bufDim) {
            this.initBuffers(entity);
        }
    },
    screen: function() {
        // Apply Engine's width to the Canvas
        this.canvas.width = this.size.width;
        this.canvas.height = this.size.height;
        
        // Set WebGL viewport ratio to prevent distortion
        this.horizAspect = this.size.width / this.size.height;
    },
    // Note: delete
    entityGetVal: function(name, val) {
        // Setup stack for storage
        var stack = new Array;
        
        // Loop through objects and get matched value
        if (typeof val != 'undefined') { // Incase no val was passed
            for (var j in this.storage) {
                if (this.storage[j][(name)] == val) stack.push(this.storage[j]);
            }
        }
        else {
            for (var j in this.storage) {
                if (this.storage[j][(name)]) stack.push(this.storage[j]);
            }
        }
        
        // Return value or false
        if (stack.length > 0) {
            return stack;
        }
        else {
            return false;
        }
    },
    
    
    /* ----- Game Engine Functions -----*/
    // All necessary code to get WebGL running
    setup: function() {
        this.initGL();
        this.initShaders();
    },
    
    init: function() {
        try {
            // Canvas width must be set before gl initializes to prevent the Canvas size from distorting WebGL view
            this.screen();
            
            // Current name for WebGL, will be webgl once accepted as a web standard
            this.gl = this.canvas.getContext("experimental-webgl");
        }
        catch(e) {}
        
        // No WebGL context? RUN AWAY!
        if (!this.gl) {
            alert("Uhhh, your browser doesn't support WebGL. Your options are build a large wooden badger or download Google Chrome.");
        }
    },
    
    // Configures WebGL after verifying it's okay to do so
    initGL: function() {
        if (this.gl) {
            this.gl.clearColor(0.05, 0.05, 0.05, 1.0); // Clear color = black and opaque via (r, g, b, a)
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.depthFunc(this.gl.LEQUAL); // Near things near, far things far
            this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer
        }
    },
    
    // Sets up shaders
    initShaders: function() {
        // Literally pulls shader programs from the DOM
        this.fragmentShader = this.getShader('shader-fragment');
        this.vertexShader = this.getShader('shader-vertex');
        
        // Attaches both elements to a 'program'
        // Each program can hold one fragment and one vertex shader
        this.shaderProgram = this.gl.createProgram();
        // Attaches shaders to webGL
        this.gl.attachShader(this.shaderProgram, this.vertexShader);
        this.gl.attachShader(this.shaderProgram, this.fragmentShader);
        // Attach the new program we created
        this.gl.linkProgram(this.shaderProgram);
        
        // Failsafe incase shaders fail and backfire
        // Great for catching errors in your setup scripting
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert("Shaders have FAILED to load.");
        }
        this.gl.useProgram(this.shaderProgram);
        
        // Store the shader's attribute in an object so you can use it again later
        this.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        
        // Allow usage of color data with shaders
        this.vertexColorAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.gl.enableVertexAttribArray(this.vertexColorAttribute);
    },
    
    // Goes into the DOM to get shaders via variable id
    getShader: function(id) {
        this.shaderScript = document.getElementById(id);
        
        // No shader script in the DOM? Return nothing!
        if (!this.shaderScript) {
            return null;
        }
        
        this.theSource = "";
        this.currentChild = this.shaderScript.firstChild;
        
        // Return compiled shader program
        while (this.currentChild) {
            if (this.currentChild.nodeType == this.currentChild.TEXT_NODE) {
                this.theSource += this.currentChild.textContent; // Dump shader data here
            }
            this.currentChild = this.currentChild.nextSibling;
        }
        
        // Get shader MIME type to test for vertex or fragment shader
        // Create shader based upon return value
        this.shader;
        if (this.shaderScript.type == 'x-shader/x-fragment') {
            this.shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        } else if (this.shaderScript.type == 'x-shader/x-vertex') {
            this.shader = this.gl.createShader(this.gl.VERTEX_SHADER);
        } else {
                return null; // Type of current shader is unknown
        }
        
        // Get data and compile it together
        this.gl.shaderSource(this.shader, this.theSource);
        this.gl.compileShader(this.shader);
        
        // Compile success? If not fire an error.
        if (!this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS)) {
            alert('Shader compiling error: ' + this.gl.getShaderInfoLog(this.shader));
            return null;
        }
        
        // Give back the shader so it can be used
        return this.shader;
    },
    
    // Prepare WebGL graphics to be drawn by storing them
    // Occurs right before an object is created
    initBuffers: function(object) {
        // Create shape        
        object.buffer = this.gl.createBuffer(); // Buffer creation
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.buffer); // Graphic storage
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.bufVert), this.gl.STATIC_DRAW); // Uses float32 to change the array into a webGL edible format.
        
        // Create color
        object.colorBuffer = this.gl.createBuffer();  
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.colorBuffer);  
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(object.colOutput()), this.gl.STATIC_DRAW);
        
        if (object.bufDim) {
            // Define each piece as a triangle to create 3D shapes from flat objects
            // Think of it as folding a gigantic piece of cardboard into a cube
            object.dimBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.dimBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.bufDim), this.gl.STATIC_DRAW);
        }
    },
    
    draw: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Field of view in degress, width/height, only get objects between 1, 100 units in distance
        this.perspectiveMatrix = makePerspective(45, this.horizAspect, 0.1, 300.0);
        
        // Loop through every object in storage
        for (var i in this.storage) {
            // Resets and creates a matrix that has 1s diagnolly and 0s everywhere else, crazy math stuff
            // Essential in processing your matrices for object creation
            // If you are a math nut and really want to understand this read http://mathworld.wolfram.com/IdentityMatrix.html
            /* Basic idea/example of this matrix
            [ 1, 0, 0
              0, 1, 0
              0, 0, 1 ]
            */
            this.loadIdentity();
            
            // Run update functions before drawing anything to prevent screen pops for recently spawned items
            this.storage[i].update();
            
            // Draw at location x, y, z
            // Other objects drawn before refreshing will be drawn relative to this position
            this.mvTranslate(this.storage[i].posVert());
            this.mvPushMatrix();
            
            // Pass rotate data
            if (this.storage[i].rotate) this.mvRotate(this.storage[i].rotateInit, this.storage[i].rotate);
            
            // Pass shape data
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.storage[i].buffer); 
            this.gl.vertexAttribPointer(this.vertexPositionAttribute, this.storage[i].bufCols, this.gl.FLOAT, false, 0, 0); // Pass position data
            
            // Pass color data
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.storage[i].colorBuffer);  
            this.gl.vertexAttribPointer(this.vertexColorAttribute, 4, this.gl.FLOAT, false, 0, 0);
            
            // Create
            this.setMatrixUniforms();
            // Take the matrix vertex positions and go through all of the elements from 0 to the .numItems object
            if (this.storage[i].bufDim) {
                // Creation of 3D shape
                this.gl.drawElements(this.gl.TRIANGLES, this.storage[i].bufRows, this.gl.UNSIGNED_SHORT, 0);
            } else {
                // Creation of 2D shape
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.storage[i].bufRows); 
            }
        
            // Restore original matrix to prevent objects from inheriting properties
            this.mvPopMatrix();
            
            // Collision detection
            if (this.storage[i].type === 'a') {
                // Check all items in the b type array only since its an a type item
                for (var en = this.typeB.length; en--;) {
                    // Test for overlap between the two
                    if (this.overlap(
                    this.storage[i].x,
                    this.storage[i].y,
                    this.storage[i].width,
                    this.storage[i].height,
                    this.typeB[en].x,
                    this.typeB[en].y,
                    this.typeB[en].width,
                    this.typeB[en].height)) {
                        // If they have collided, run the collision logic for both entities
                        this.storage[i].collide(this.typeB[en]);
                        this.typeB[en].collide(this.storage[i]);
                    }
                }
            }
            
            // Clean out killed items
            this.graveyardPurge();
        }
    },
    
    // Used to destroy entities when necessary instead of doing it during the loop and potentially blowing
    // everything up by accident.
    graveyard: [],
    
    // Permanently erases all graveyard items at the end of a loop
    graveyardPurge: function() {
        if (this.graveyard) {
            for (var obj = this.graveyard.length; obj--;) {
                this.remove(this.graveyard[obj]);
            }
            this.graveyard = [];
        }
    },
    
    // Note: delete
    random: function(max, min) {
        if (!min) min = 1;
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    randomPosNeg: function() {
        return Math.random() < 0.5 ? -1 : 1;
    },
    
    // Cleans the killed object completely out of memory permanently
    remove: function(object) {
        // Remove from main storage
        for (var i = this.storage.length; i--;) {
            if (this.storage[i] == object)
                this.storage.splice(i,1);
        }
        
        // Remove from type storage
        switch (object.type) {
            case 'a':
                for (var i = this.typeA.length; i--;) {
                    if(this.typeA[i] == object)
                        this.typeA.splice(i,1);
                }
                break;
            case 'b':
                for (var i = this.typeB.length; i--;) {
                    if(this.typeB[i] == object)
                        this.typeB.splice(i,1);
                }
                break;
            default:
                break;
        }
        
        // Remove from main storage
        for (var i = this.storage.length; i--;) {
            if(this.storage[i] == object)
                this.storage.splice(i,1);
        }
        
        // Clean out of browser's memory permanently
        delete object;
    },
    
    overlap: function(x1,y1,width1,height1,x2,y2,width2,height2) {
        // Modify x and y values to take into account center offset
        x1 = x1 - (width1 / 2);
        y1 = y1 - (height1 / 2);
        x2 = x2 - (width2 / 2);
        y2 = y2 - (height2 / 2);
        
        // Test for collision
        if ( x1 < x2 + width2 &&
            x1 + width1 > x2 &&
            y1 < y2 + width2 &&
            y1 + height1 > y2 ) {
            return true;
        } else {
            return false;
        }
    },
    
    /* ----- Utilities | Pre-Written w/ credits -----*/
    // Matrix functions modified from Mozilla's WebGL tutorial https://developer.mozilla.org/en/WebGL/Adding_2D_content_to_a_WebGL_context
    // From Mozilla's tutorial "Nobody seems entirely clear on where it came from, but it does simplify the use of Sylvester even further by adding methods for building special types of matrices, as well as outputting HTML for displaying them."
    loadIdentity: function() {
        mvMatrix = Matrix.I(4);  
    },
    multMatrix: function(m) {
        mvMatrix = mvMatrix.x(m);
    },
    mvTranslate: function(v) {
        this.multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4()); 
    },
    setMatrixUniforms: function() {
        var pUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");  
        this.gl.uniformMatrix4fv(pUniform, false, new Float32Array(this.perspectiveMatrix.flatten()));  
        
        var mvUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");  
        this.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten())); 
    },
    
    // Additional functions by Vlad Vukicevic at http://blog.vlad1.com/
    mvMatrixStack: [],
  
    mvPushMatrix: function(m) {  
        if (m) {  
            this.mvMatrixStack.push(m.dup());  
            mvMatrix = m.dup();  
        } else {  
            this.mvMatrixStack.push(mvMatrix.dup());  
        }  
    },  
      
    mvPopMatrix: function() {  
        if (!this.mvMatrixStack.length) {  
            throw("Can't pop from an empty matrix stack.");  
        }  
        
        mvMatrix = this.mvMatrixStack.pop();  
        return mvMatrix;  
    },
      
    mvRotate: function(angle, v) {  
      this.inRadians = angle * Math.PI / 180.0;  
        
      this.m = Matrix.Rotation(this.inRadians, $V([v[0], v[1], v[2]])).ensure4x4();  
      this.multMatrix(this.m);  
    }  
});


/*-----------
 Entity Pallete
-----------*/
var Entity = Class.extend({
    type: 0,
    
    // Determines position
    x: 0,
    y: 0,
    z: 0,
    zoom: -80,
    posVert: function() {
        return [ this.x, this.y, this.z + this.zoom ];
    },
    
    kill: function() {
        World.graveyard.push(this);
    },
    
    // Buffer data for drawing
    bufCols: 0,
    bufRows: 0,
    bufVert: null,
    
    // Buffer data for creating dimension (practically folds the object)
    bufDim: null,
    
    // Passes an object on collide
    collide: function(obj) {
        this.kill();
    },
    
    // Buffer data for color
    col: [],
    colRows: 0,
    colCols: 0,
    colVert: null,
    colOutput: function() {
        if (this.colVert) {
            // Reset color incase something is already present
            this.col = [];
            // Generating colors for the cube by setting them along proper vertices
            for (i=0; i<this.colRows; i++) {
                var c = this.colVert[i];
                for (var k=0; k<this.colCols; k++) {
                    this.col = this.col.concat(c);
                }
            }
        }
        return this.col;
    },
    
    update: function() {
        // place code before each draw sequence here
    },
    
    spawn: function(x,y,z) {
        if (x !== undefined) this.x = x;
        if (y !== undefined) this.y = y;
        if (z !== undefined) this.z = z;

         return this;
    }
});