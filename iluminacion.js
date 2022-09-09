
var gl, program;
var myTorus;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/10;
var selectedPrimitive = exampleCone;

function getWebGLContext() {
    
  var canvas = document.getElementById("myCanvas");
    
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    
  for (var i = 0; i < names.length; ++i) {
    try {
      return canvas.getContext(names[i]);
    }
    catch(e) {
    }
  }
    
  return null;

}

function initShaders() { 
    
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
  gl.compileShader(vertexShader);
    
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
  gl.compileShader(fragmentShader);
  
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  
  gl.linkProgram(program);
    
  gl.useProgram(program);
    
  program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  program.modelViewMatrixIndex  = gl.getUniformLocation( program, "modelViewMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation( program, "projectionMatrix");
  
  // normales
  program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  // material
  program.KaIndex               = gl.getUniformLocation( program, "Material.Ka");
  program.KdIndex               = gl.getUniformLocation( program, "Material.Kd");
  program.KsIndex               = gl.getUniformLocation( program, "Material.Ks");
  program.alphaIndex            = gl.getUniformLocation( program, "Material.alpha");

  // fuente de luz
  program.LaIndex               = gl.getUniformLocation( program, "Light.La");
  program.LdIndex               = gl.getUniformLocation( program, "Light.Ld");
  program.LsIndex               = gl.getUniformLocation( program, "Light.Ls");
  program.PositionIndex         = gl.getUniformLocation( program, "Light.Position");
  
}

function initRendering() { 

  gl.clearColor(0.15,0.15,0.15,1.0);
  gl.enable(gl.DEPTH_TEST);
  
  setShaderLight();

}

function initBuffers(model) {
    
  model.idBufferVertices = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
    
  model.idBufferIndices = gl.createBuffer ();
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

}

function initPrimitives() {

  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);

  myTorus = makeTorus(0.5, 1, 100, 100);
  initBuffers(myTorus);

}


function setShaderProjectionMatrix(projectionMatrix) {
  
  gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
  
}

function setShaderModelViewMatrix(modelViewMatrix) {
  
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  
}

function setShaderNormalMatrix(normalMatrix) {
  
  gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
  
}

function getNormalMatrix(modelViewMatrix) {
  
  var normalMatrix = mat3.create();
  
  mat3.fromMat4  (normalMatrix, modelViewMatrix);
  mat3.invert    (normalMatrix, normalMatrix);
  mat3.transpose (normalMatrix, normalMatrix);
  
  return normalMatrix;
  
}

function getProjectionMatrix() {
  
  var projectionMatrix  = mat4.create();
  
  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);
  
  return projectionMatrix;
  
}

function getCameraMatrix() {
  
  var _phi  = myphi* Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;
  
  var x = 0, y = 0, z = 0;
  z = radius * Math.cos(_zeta) * Math.cos(_phi);
  x = radius * Math.cos(_zeta) * Math.sin(_phi);
  y = radius * Math.sin(_zeta);
  
  var cameraMatrix = mat4.create();
  mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);
  
  return cameraMatrix;
  
}

function setShaderMaterial(material) {

  gl.uniform3fv(program.KaIndex,    material.mat_ambient);
  gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
  gl.uniform3fv(program.KsIndex,    material.mat_specular);
  gl.uniform1f (program.alphaIndex, material.alpha);
  
}

function setShaderLight() {

  gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.PositionIndex, 10.0,10.0,0.0); // en coordenadas del ojo
  
}

function drawSolid(model) { 
    
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute, 3, gl.FLOAT, false, 2*3*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,   3, gl.FLOAT, false, 2*3*4, 3*4);
    
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

}

function drawScene() { 
    
  
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [0.4, 0.4, 0.4]);

  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);
  



  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix  = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  
  // se envia al Shader el material
  setShaderMaterial(Gold);
  
  // se dibuja la primitiva seleccionada
  drawSolid(exampleCylinder);
  drawSolid(exampleCone);
  
 



  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [0.3, 0.3, 0.3]);
  mat4.translate(modelMatrix, modelMatrix, [-1, 0, 0]); 
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);
  
  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix  = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  
  // se envia al Shader el material
  setShaderMaterial(Bronze);
  
  // se dibuja la primitiva seleccionada
  
  drawSolid(exampleSphere);





  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [0.3, 0.3, 0.3]);
  mat4.translate(modelMatrix, modelMatrix, [1, 0, 0]); 
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);
  
  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix  = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  
  // se envia al Shader el material
  setShaderMaterial(Bronze);
  
  // se dibuja la primitiva seleccionada
  drawSolid(exampleSphere);





  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [0.4, 0.4, 0.4]);
  mat4.translate(modelMatrix, modelMatrix, [0, 0, 2]); 
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);
  
  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix  = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  
  // se envia al Shader el material
  setShaderMaterial(Gold);
  
  // se dibuja la primitiva seleccionada
  
  drawSolid(exampleCone);



  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [0.4, 0.4, 0.4]);
  
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);
  
  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix  = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  
  // se envia al Shader el material
  setShaderMaterial(Esmerald);
  
  // se dibuja la primitiva seleccionada
  
  drawSolid(exampleCylinder);
  
}



function initHandlers() {
    
  var mouseDown = false;
  var lastMouseX;
  var lastMouseY;

  var canvas = document.getElementById("myCanvas");

  canvas.addEventListener("mousedown",
    function(event) {
      mouseDown  = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    },
    false);

  canvas.addEventListener("mouseup",
    function() {
      mouseDown = false;
    },
    false);

  canvas.addEventListener("mousemove",
    function (event) {
      if (!mouseDown) {
        return;
      }
      var newX = event.clientX;
      var newY = event.clientY;
      if (event.shiftKey == 1) {
        if (event.altKey == 1) {
          // fovy
          fovy -= (newY - lastMouseY) / 100.0;
          if (fovy < 0.001) {
            fovy = 0.1;
          }
        } else {
          // radius
          radius -= (newY - lastMouseY) / 10.0;
          if (radius < 0.01) {
            radius = 0.01;
          }
        }
      } else {
        // position
        myphi -= (newX - lastMouseX);
        zeta  += (newY - lastMouseY);
        if (zeta < -80) {
          zeta = -80.0;
        }
        if (zeta > 80) {
          zeta = 80;
        }
      }
      lastMouseX = newX
      lastMouseY = newY;
      requestAnimationFrame(drawScene);
    },
    false);

  var botones = document.getElementsByTagName("button");
  
  /*botones[0].addEventListener("click",
    function(){
      selectedPrimitive = examplePlane;
      requestAnimationFrame(drawScene);
    },
    false);
  
  botones[1].addEventListener("click",
    function(){
      selectedPrimitive = exampleCube;
      requestAnimationFrame(drawScene);
    },
    false);*/
  
  botones[2].addEventListener("click",
    function(){
      
      selectedPrimitive = exampleCylinder;
      selectedPrimitive = exampleCone;
      requestAnimationFrame(drawScene);
      requestAnimationFrame(drawScene2);
    },
    false);
  
  /*botones[3].addEventListener("click",
    function(){
      selectedPrimitive = exampleCylinder;
      requestAnimationFrame(drawScene);
    },
    false);
  
  botones[4].addEventListener("click",
    function(){
      selectedPrimitive = exampleSphere;
      requestAnimationFrame(drawScene);
    },
    false);
  
  botones[5].addEventListener("click",
    function(){
      selectedPrimitive = myTorus;
      requestAnimationFrame(drawScene);
    },
    false);
*/
  var colors = document.getElementsByTagName("input");
  
  colors[0].addEventListener("change",
    function(){
      setColor(program.LaIndex, colors[0].value);
      requestAnimationFrame(drawScene);
    },
    false);

  colors[1].addEventListener("change",
    function(){
      setColor(program.LdIndex, colors[1].value);
      requestAnimationFrame(drawScene);
    },
    false);

  colors[2].addEventListener("change",
    function(){
      setColor(program.LsIndex, colors[2].value);
      requestAnimationFrame(drawScene);
    },
    false);

}        

function setColor (index, value) {

  var myColor = value.substr(1); // para eliminar el # del #FCA34D
      
  var r = myColor.charAt(0) + '' + myColor.charAt(1);
  var g = myColor.charAt(2) + '' + myColor.charAt(3);
  var b = myColor.charAt(4) + '' + myColor.charAt(5);

  r = parseInt(r, 16) / 255.0;
  g = parseInt(g, 16) / 255.0;
  b = parseInt(b, 16) / 255.0;
  
  gl.uniform3f(index, r, g, b);
  
}

function initWebGL() {
    
  gl = getWebGLContext();
    
  if (!gl) {
    alert("WebGL no está disponible");
    return;
  }
    
  initShaders();
  initPrimitives();
  initRendering();
  initHandlers();
  
  requestAnimationFrame(drawScene);
  
}

initWebGL();
