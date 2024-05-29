// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =    `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_GlobalRotateMatrixY;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_GlobalRotateMatrixY * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    // mat4 NormalMatrix = transpose(inverse(u_ModelMatrix));
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    // v_Normal = normalize(vec3(u_ModelMatrix * vec4(a_Normal, 1)));
    // v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  uniform vec4 u_FragColor;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightPos2;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  uniform bool u_spotOn;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  void main() {

    if (u_whichTexture == -3) {
        gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0); // Use normal
    }
    else if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor; // use color
    }
    else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0); // use uv debug color
    }
    else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV); // use texture0
    }
    else if (u_whichTexture == 1) {
        gl_FragColor = texture2D(u_Sampler1, v_UV); // use texture1
    }
    else if (u_whichTexture == 2) {
        gl_FragColor = texture2D(u_Sampler2, v_UV); // use texture2
    }
    else {
        gl_FragColor = vec4(1, 0.2, 0.2, 1); // error put a reddish color
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    vec3 spotVector = u_lightPos2 - vec3(v_VertPos);

    float r = length(lightVector);
    float r2 = length(spotVector);

    // Distance vis
    // if (r < 1.0) {
    //     gl_FragColor = vec4(1, 0, 0, 1);
    // }
    // else if (r < 2.0) {
    //     gl_FragColor = vec4(0, 1, 0, 1);
    // }
    // else if (r < 3.0) {
    //     gl_FragColor = vec4(0, 0, 1, 1);
    // }
    
    // Light falloff vis 1/r^2
    // gl_FragColor = vec4( vec3(gl_FragColor) / (r * r), 1);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    // N dot L Spotlight
    vec3 L2 = normalize(spotVector);
    vec3 N2 = normalize(v_Normal);
    float nDotL2 = max(dot(-N2, L2), 0.0);

    vec3 H = normalize(vec3(spotVector - u_lightPos2));
    // float theta = acos(dot(H, vec3(0, 1, 0))) - 3.1415926538 / 2;

    // R
    vec3 R = reflect(-L, N);
    //vec3 R2 = reflect(-L2, N2);

    // eye
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // Spec
    float specular = pow(max(dot(E, R), 0.0), 32.0);
    //float specular2 = pow(max(dot(E, R2), 0.0), 10.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
    vec3 diffuse2 = vec3(gl_FragColor) * nDotL2 * 0.7;

    vec3 ambient = vec3(gl_FragColor) * 0.5;
    vec3 ambient2 = vec3(gl_FragColor) * 0.7;

    if(u_lightOn) {
        if(u_spotOn) { // removed && abs(theta) < 0.5;
            if(u_whichTexture == 0 || u_whichTexture == 1 || u_whichTexture == 2) { // Specular for textured objects only
                // gl_FragColor = vec4(specular + specular2 + diffuse + diffuse2 + ambient + ambient2, 1);
                gl_FragColor = vec4(specular + diffuse + diffuse2 + ambient + ambient2, 1);
            }
            else {
                gl_FragColor = vec4(diffuse + diffuse2 + ambient, 1.0); // no spec on no tex
            }
        }
        else {
            if(u_whichTexture == 0 || u_whichTexture == 1 || u_whichTexture == 2) { // Specular for textured objects only
                gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
            }
            else {
                gl_FragColor = vec4(diffuse + ambient, 1.0);
            }
        }
    }
    else if (u_spotOn) {
        // if(abs(theta) < 0.5) {
        //     gl_FragColor = vec4(diffuse2 + ambient2, 1);
        // }
        // else {
        //     gl_FragColor = vec4(diffuse2 + ambient, 1);
        // }
    }

  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_cameraPos;
let u_lightPos;
let u_lightPos2;
let u_lightOn;
let u_spotOn;
let u_NormalMatrix;
let u_ModelMatrix;
let u_ProjectionMatrix; // eventually set by glPerspective()
let u_ViewMatrix; // eventually set by lookAt()

let u_GlobalRotateMatrix;
let u_GlobalRotateMatrixY;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let identityM;

let inventory = 0;
let mapX = 0;
let mapZ = 0;
let playerX = 0;
let playerZ = 0;

let cursorPosition = [0, 0];

// elephant
let idleAnimate = false;
let flapAnimate = false;
let spinAnimate = false;
let g_legAngle = -10;
let g_earAngle = 40;
let g_trunkAngle = -35;

let g_trunk1Angle = -3;
let g_trunk2Angle = -3;
let g_trunk3Angle = -3;

let g_tailAngle = 0;
let g_headAngle = 0;
let g_testAngle = 0;

// camera rotation
let g_globalAngle = 0;
let g_globalAngleY = 0;
let g_globalRot = 0;

// perspective
let g_camera;
let g_currentAt;

// rendering / lighting
let g_normalOn = false;
let g_lightOn = true;
let g_lightAnimateOn = false;
let g_lightPos = [0, 1, 2];

let g_spotOn = false;
let g_lightPos2 = [0, 4, 2];


var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    // no lag fix
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true})
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    // Get storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_NormalMatrix) {
        console.log('Failed to get the storage location of u_NormalMatrix');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_GlobalRotateMatrixY = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrixY');
    if (!u_GlobalRotateMatrixY) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrixY');
        return;
    } 

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
        console.log('Failed to get the storage location of u_Sampler2');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log ('Failed to get the storage location of u_lightPos');
        return;
    }

    u_lightPos2 = gl.getUniformLocation(gl.program, 'u_lightPos2');
    if (!u_lightPos2) {
        console.log ('Failed to get the storage location of u_lightPos2');
        return;
    }

    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
        console.log ('Failed to get the storage location of u_cameraPos');
        return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log ('Failed to get the storage location of u_lightOn');
        return;
    }

    u_spotOn = gl.getUniformLocation(gl.program, 'u_spotOn');
    if (!u_spotOn) {
        console.log ('Failed to get the storage location of u_spotOn');
        return;
    }

    identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActions() {
    var downFlag = false;
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // pointerLock() 
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    });

    function lockChange() {
        if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
            document.addEventListener("mousemove", mouseMove, false);
        }
        else {
            //downFlag = false;
            document.removeEventListener("mousemove", mouseMove, false);
        }
    }

    document.addEventListener('pointerlockchange', lockChange, false);
    document.addEventListener('mozpointerlockchange', lockChange, false);
    

    function mouseMove(e) {
        let deltaX = e.movementX || e.mozMovementX || 0;
        // let deltaY = e.movementY || e.mozMovementY || 0;
        newpos = convertCoordinatesEventToGL(e);

        if(Math.sign(deltaX) == -1) {
            g_camera.m_panRight(deltaX * 0.8);
        }
        else if (Math.sign(deltaX) == 1 && deltaX != 0) {
            g_camera.m_panLeft(deltaX * 0.8);
        }
    }

    // Shift detection
    canvas.addEventListener("click", function (e) {
        if (e.shiftKey) {
            spinAnimate = true;
            document.getElementById('currentAnimation').innerText = "You Can't See Me"
            document.getElementById('elephName').innerText = "JOHNNNNN CENAAAAAAA"
        }
        let coords = convertCoordinatesEventToGL(e);
        console.log(coords);
        console.log(g_camera.at.elements);
        // normalize the cam.eye and cam.at distances and take a block at the space in front of you

        
    })

    var currpos = {
        x: 0,
        y: 0,
    }

    delta = 100;
    var dx, dy = 0;

    canvas.onmousedown = function (down) {
        //console.log('Mouse Down')
        if(down.button == 2) {
            downFlag = true;
            let omd = convertCoordinatesEventToGL(down)
            currpos.x = omd[0];
            currpos.y = omd[1];
        }
        //console.log('x: ' + currpos.x + ' y: ' + currpos.y);
    }
    canvas.onmouseup = function (up) {
        //console.log('Mouse Up')
        downFlag = false;
        // newpos = convertCoordinatesEventToGL(up);
        // dx = newpos[0] - currpos.x;
        // dy = newpos[1] - currpos.y;
        // g_globalAngle += (dx * delta);
        // console.log('New Angle' + g_globalAngle);
    }
    canvas.onmousemove = function (move) {
        //console.log('Angle' + g_globalAngle);
        if (!downFlag) {
            return;
        }
        else {
            newpos = convertCoordinatesEventToGL(move);
            dx = newpos[0] - currpos.x;
            dy = newpos[1] - currpos.y;
            g_globalAngle += (dx * delta);
            g_globalAngleY += (dy * delta);
            currpos.x = newpos[0];
            currpos.y = newpos[1];
            dx = 0;
            dy = 0;
        }
    }

    // Button Events
    resetCamera = document.getElementById('resetCamButton');
    resetCamera.onclick = function() {
        g_camera.reset();
        g_globalAngle = 0;
        g_globalAngleY = 0;
        renderScene();
    }
    resetLight = document.getElementById('resetLightButton');
    resetLight.onclick = function() {
        g_lightPos = [0, 1, 2];
        document.getElementById('lightForm').reset();
        renderScene();
    }
    animateLight = document.getElementById('animateLightButton');
    animateLight.onclick = function() {
        g_lightAnimateOn = !g_lightAnimateOn;
    }
    spotLight = document.getElementById('spotOn');
    spotLight.onclick = function () {
        g_spotOn = !g_spotOn;
    }
    document.getElementById('normalOn').onclick = function() {
        g_normalOn = true;
    }
    document.getElementById('normalOff').onclick = function() {
        g_normalOn = false;
    }
    document.getElementById('lightOn').onclick = function() {
        g_lightOn = true;
    }
    document.getElementById('lightOff').onclick = function() {
        g_lightOn = false;
    }
    document.getElementById('lightSlideX').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[0] = this.value / 100;
            renderScene();
        }
    })
    document.getElementById('lightSlideY').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[1] = this.value / 100;
            document.getElementById('lightY').innerText = this.value / 100;
            renderScene();
        }
    })
    document.getElementById('lightSlideZ').addEventListener('mousemove', function (ev) {
        if (ev.buttons == 1) {
            g_lightPos[2] = this.value / 100;
            renderScene();
        }
    })

    // elephant
    idleAnimation = document.getElementById('idleButton');
    idleAnimation.addEventListener('click', function (e) {
        idleAnimate = true;
        if(flapAnimate) {
            flapAnimate = false;
        }
        if(spinAnimate) {
            spinAnimate = false;
        }
    })
    // flapButton
    flapAnimation = document.getElementById('flapButton');
    flapAnimation.addEventListener('click', function (e) {
        flapAnimate = true;
        if(idleAnimate) {
            idleAnimate = false
        }
        if(spinAnimate) {
            spinAnimate = false;
        }
    })
    // clearAnimations
    clearAnimations = document.getElementById('clearButton').addEventListener('click', function (e) {
        flapAnimate = false;
        idleAnimate = false;
        spinAnimate = false;

        g_legAngle = -10;
        g_earAngle = 15;
        g_trunkAngle = -20;
        g_tailAngle = 0;
        g_headAngle = 0;
        g_testAngle = 0;
        g_trunk1Angle = -3;
        g_trunk2Angle = -3;
        g_trunk3Angle = -3;
            // leg, ear trunk, t1, t2, t3, tail, head, 
        document.getElementById('sliderForm').reset();
    });
}

function mapIndex() {
    let range = new Vector3();
    range.set(g_camera.at);
    range.sub(g_camera.eye);
    range = range.normalize();
    range.mul(3);
    let x = Math.floor(range.elements[0]);
    let z = Math.floor(range.elements[2]);
    return [ x, z ];
    
}

function keydown(ev) {

    switch (ev.keyCode) {
        case 87: // W
        case 38: // Up-arrow
            g_camera.m_forward();
            console.log('forward');
            break;
        case 65: // A
        case 37: // Left-arrow
            g_camera.m_left();
            console.log('left');
            break;
        case 83: // S
        case 40: // Down-arrow
            g_camera.m_backward();
            console.log('back');
            break;
        case 68: // D
        case 39: // Right-arrow
            g_camera.m_right();
            console.log('right');
            break;
        case 81: // Q
            g_camera.m_panLeft(-10);
            console.log('l-pan');
            break;
        case 69: // E
            g_camera.m_panRight(10);
            console.log('r-pan');
            break;
        case 70: // F
            [mapX, mapZ] = mapIndex();
            [playerX, playerZ] = [Math.floor(g_camera.eye.elements[0]) + 16, Math.floor(g_camera.eye.elements[2]) + 16];
            console.log(mapX, mapZ); // the vector length away from person.
            console.log('Player map Index: ');
            console.log(playerX, playerZ);
            console.log('Removal Index: ');
            console.log(playerX + mapX, playerZ + mapZ);
            changeMap(playerX + mapX, playerZ + mapZ, 0);
            document.getElementById('inventoryValue').innerText = inventory;
            document.getElementById('reachIndex').innerText = [playerX + mapX, playerZ + mapZ];
            mapX = 0;
            mapZ = 0;
            playerX = 0;
            playerZ = 0;
            break;
        case 71: // G
            // if player is on [14-16][10-12] and presses G with inventory 4, player wins, trigger dance
            [playerX, playerZ] = [Math.floor(g_camera.eye.elements[0]) + 16, Math.floor(g_camera.eye.elements[2]) + 16];
            if (inventory == 0) {
                break;
            }
            else if ((playerX >= 14 && playerX <= 16) && (playerZ >= 10 && playerZ <= 12) && inventory == 4) {
                //within boundaries and inventory 4
                // Victory spin
                spinAnimate = true;
            }
            else {
                console.log('Not in victory zone, dropping inventory')
                changeMap(playerX, playerZ, 2);
                document.getElementById('inventoryValue').innerText = inventory;
            }
            break;
        default:
            break;

    }
    renderScene();
}

function initTextures() {
    // initTextures + sendTextoGLSL takes a gl context, creates a texture, gets location...
    // of uniform variable, initializes the image object...
    // sets up an event handler on image load for texture generation (runs after load)

    var skybox = new Image();
    if (!skybox) {
        console.log('Failed to create the skybox object');
        return false;
    }
    // Register the event handler to be called on loading an image
    // 'whenever done loading image, run sendTextureToGLSL to be rendered
    skybox.onload = function() { sendImageToTEXTURE0(skybox); };
    // Tell the browser to load image
    skybox.src = '../res/img/sky.jpg';

    var grass = new Image();
    if (!grass) {
        console.log('Failed to create the grass object');
        return false;
    }
    grass.onload = function() { sendImageToTEXTURE1(grass); };
    grass.src = '../res/img/grass.jpg';
    
    var diamond = new Image();
    if (!diamond) {
        console.log('Failed to create the diamodn object');
        return false;
    }
    diamond.onload = function() { sendImageToTEXTURE2(diamond); };
    diamond.src = '../res/img/diamond.jpg';


    return true;
}

function sendImageToTEXTURE0(image) {
    // creates texture that connects to GL object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Flip image's y axis to align with canvas
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);


    console.log('complete');
}

function sendImageToTEXTURE1(image) {
    // creates texture that connects to GL object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Flip image's y axis to align with canvas
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE1);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 1 to the sampler
    gl.uniform1i(u_Sampler1, 1);


    console.log('complete');
}

function sendImageToTEXTURE2(image) {
    // creates texture that connects to GL object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Flip image's y axis to align with canvas
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE2);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 2 to the sampler
    gl.uniform1i(u_Sampler2, 2);


    console.log('complete');
}

function main() {
    // Set up canvas and gl variables
    setupWebGL();
    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();
    addActions();

    g_camera = new Camera();
    document.onkeydown = keydown;
    // Initialize and load textures
    initTextures();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //renderScene();
    
    requestAnimationFrame(tick);
}

function click(ev) {
    // Extract the event click and return it in WebGL coords
    [x, y] = convertCoordinatesEventToGL(ev);
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function tick() {
    // Update
    g_seconds = performance.now()/1000.0 - g_startTime;

    renderScene();
    requestAnimationFrame(tick);
    animate();
}

function renderScene() {
    // Pass rotation matrices
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    var globalRotMatY = new Matrix4().rotate(g_globalAngleY, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrixY, false, globalRotMatY.elements);
    
    // Pass view matrix and projection matrix
    var projMat = g_camera.projMat;
    // Setting perspective as 90deg wide, near 0.1, far 100
    // could be cool to set keybind to optical zoom w/ setPerspective
    // projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
    var viewMat = g_camera.viewMat;
    // (eye, pointing to, where is up)
    // viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2], 
    //                   g_at[0],  g_at[1],  g_at[2], 
    //                   g_up[0],  g_up[1],  g_up[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // gl.uniformMatrix4fv(u_NormalMatrix, false, ...)

    // Clear depth buffer bit to prevent depth being leftover from prev. frames
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var startTime = performance.now();

    renderMap();
    renderAllShapes();
    renderTesting();

    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) +
                    " fps: " + Math.floor(1000/duration),
                    "numdot");
}

function animate() {
    if(g_lightAnimateOn) {
        g_lightPos[0] = Math.cos(g_seconds);
    }

    if(idleAnimate) {
        idle();
    }
    if(flapAnimate) {
        flap();
    }
    if(spinAnimate) {
        spin();
    }
}

function idle() {
    g_headAngle = 10 * Math.cos(g_seconds);
    g_trunkAngle = 5 * Math.sin(g_seconds);
    g_tailAngle = 30 * Math.sin(g_seconds);
    g_legAngle = 5 * Math.sin(g_seconds / 2);
}

function flap() {
    g_earAngle = 30 * Math.cos(g_seconds * 2.1);
    g_headAngle = 10 * Math.cos(g_seconds * 2);
    g_trunkAngle = 10 * Math.sin(g_seconds * 2);
    g_legAngle = -10 * Math.abs(Math.sin(g_seconds));
    g_tailAngle = 1080 * Math.sin(g_seconds) * 2.5;
}

function spin() {
    g_trunkAngle = 45;
    g_legAngle = -50 * - Math.abs(Math.sin(g_seconds * 5));
    setTimeout(() => {
        spinAnimate = false;
        let reset = document.getElementById('clearButton');
        if(idleAnimate) {
            setTimeout(() => {
                document.getElementById('idleButton').click();
            }, 130)
        }
        else if (flapAnimate) {
            setTimeout(() => {
                document.getElementById('flapButton').click();
            }, 130)
        }
        else {
            reset.click();
        }
        document.getElementById('elephName').innerText = "Bluey the Elephant.";
    }, 1500);
}

function sendTextToHTML(text, htmlID) {
    var htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}
