
var foldingCube;

function subrange(x,a,b) { return x<=a?0:x>=b?1:(x-a)/(b-a); } 
function smooth(x) { return x*x*(3-2*x); }

function FoldingCube(name, scene) {
    this.scene = scene;
    
    this.name = name;
    
    var mat = this.faceMaterial = new BABYLON.StandardMaterial(name + "_faceMaterial", scene);
    mat.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);
    mat.ambientColor = new BABYLON.Color3(1.0, 0.2, 0.7);

    var mainFace = this.mainFace = BABYLON.Mesh.CreateBox(name + '_f1', 2, scene);
    mainFace.bakeTransformIntoVertices(BABYLON.Matrix.Scaling(0.95, 0.01, 0.95));
    mainFace.material = mat;
    mainFace.t0 = -1;
    this.faces = [mainFace];

    for(var i=1; i<6; i++) {        
        var face = mainFace.createInstance(name + "_f" + (i+1));
        face.theta = 0;
        face.t0 = 0;
        this.faces.push(face);        
    }
    this.tmax = 1;
    this.aperture = 0;
    this.configure(0);
    // face2.parent = mainFace;
    // face2.setPivotMatrix(new BABYLON.Matrix.Translation(1,0,0));
    // face2.position.x = 1;
        
}

FoldingCube.prototype.setShadowGenerator = function(shadowGenerator) {
    this.shadowGenerator = shadowGenerator;
    var rl = shadowGenerator.getShadowMap().renderList;
    for(var i=0;i<6;i++) { rl.push(this.faces[i]); }    
}

FoldingCube.prototype.foldFaces = function() {
    var t = this.aperture * this.tmax;
    for(var i=1; i<6; i++) {
        var face = this.faces[i];
        var theta = Math.PI*0.5*smooth(subrange(t, face.t0, face.t0+1));
        face.rotateMe(theta);
    }    
}


FoldingCube.prototype.attach  = function(face, parentFace, direction) {
    var dd = [[1,0,'z',1],[0,1,'x',-1],[-1,0,'z',-1],[0,-1,'x',1]];
    var x = dd[direction][0];
    var y = dd[direction][1];
    face.parent = parentFace;
    face.setPivotMatrix(new BABYLON.Matrix.Translation(x,0,y));
    face.position.copyFromFloats(x,0,y);
    
    var sgn = dd[direction][3];
    var me = face;
    face.rotateMe = (dd[direction][2]=='x') 
        ? function(theta) { me.theta = theta; me.rotation.x = theta * sgn; }
        : function(theta) { me.theta = theta; me.rotation.z = theta * sgn; };
    me.rotation.x = me.rotation.z = 0;
    face.t0 = parentFace.t0 + 1;
    var t = face.t0 + 1;
    if(t>this.tmax) this.tmax = t;
}

FoldingCube.prototype.configure = function(index) {
    var L=2, R=0, U=1, D=3;
    var unfoldings = [
        // 1     2     3     4     5
        [[0,L],[0,R],[0,U],[0,D],[4,D]],
        [[0,L],[0,R],[2,U],[0,D],[4,D]],
        [[0,U],[1,L],[1,R],[0,D],[4,D]],
        [[0,U],[0,R],[0,D],[3,L],[3,D]],
        [[0,U],[1,L],[0,R],[0,D],[4,D]],
        [[0,U],[1,L],[0,D],[3,R],[3,D]],
        [[0,U],[1,L],[0,D],[3,D],[4,R]],
        [[0,U],[1,L],[0,D],[3,R],[4,D]],
        [[0,R],[1,U],[2,U],[0,D],[4,D]],
        [[0,U],[1,R],[1,U],[0,L],[4,D]],
        [[0,R],[1,U],[2,R],[0,D],[4,L]],
        
        
/*        [[0,],[0,1],[0,2],[0,3],[4,3]],
        
        [[0,1],[1,2],[0,3],[3,3],[4,0]],
        
        [[0,1],[1,0],[0,3],[3,3],[3,2]],
        [[0,1],[1,0],[0,3],[3,3],[0,2]],
        [[0,1],[1,0],[0,3],[3,3],[1,2]],
  */      
        
        
    ];
    if(index<0 || index>=unfoldings.length) return;
    unfolding = unfoldings[index];

    var faces = this.faces;
    /*
    for(var i=0;i<6;i++) {
        var f = faces[i];
        f.parent = undefined;
        f.position.copyFromFloats(0,0,0);
        f.setPivotMatrix(new BABYLON.Matrix.Translation(0,0,0));
    }
    */
    
    this.tmax = 1;
    var faces = this.faces;    
    for(var i=0;i<5;i++) { 
        var tup = unfolding[i]; 
        this.attach(faces[1+i], faces[tup[0]], tup[1]); 
    }
    this.foldFaces();    
}

FoldingCube.prototype.setAperture = function(t) {
    this.aperture = t;
    this.foldFaces();
    
}
 

function createFoldingCubeScene(canvas) {
    var engine = new BABYLON.Engine(canvas, true);
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera('camera1',
        -1.3, 1.1, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.upperBetaLimit = Math.PI*0.5;
    camera.lowerRadiusLimit = 10;
    camera.wheelPrecision = 10;
    camera.attachControl(canvas, false);

    scene.ambientColor = new BABYLON.Color3(0.3,0.3,0.3);
    //var light = new BABYLON.HemisphericLight('light1',
    //    new BABYLON.Vector3(0.1,1,-0.3), scene);

    var light = new BABYLON.PointLight(
        "light0", 
        new BABYLON.Vector3(0, 5, 0), scene);
    light.intensity = 0.5;
    // light.ambientColor = new BABYLON.Color3(1, 1, 1);    
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurVarianceShadowMap = true;
    shadowGenerator.blurScale = 4.0;
    // shadowGenerator.setDarkness(0.8);
    foldingCube = new FoldingCube('fc', scene);
    foldingCube.setShadowGenerator(shadowGenerator);

    var light2 = new BABYLON.PointLight('light1',
       new BABYLON.Vector3(0.0,0.4,0.0), scene);
    light2.intensity = 0.3;
    light2.parent = camera;

    // box1.position.y = 2;


    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    groundMat.ambientColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    var ground = BABYLON.Mesh.CreateGround(
        'ground1', 24, 24, 2,
        scene);
    ground.position.y = -4;
    ground.receiveShadows = true;
    ground.material = groundMat;

    engine.runRenderLoop(function() {
      scene.render();
    });

    return scene;
}

function createFoldingCubeAnimation() {
    var canvas,scene;
    canvas = document.getElementById('foldingCubeCanvas');
    scene = createFoldingCubeScene(canvas);

    $( "#foldingCubeSlider" ).slider({
        animate:"fast",
        slide: function(e,ui) {
            foldingCube.setAperture(ui.value*0.01);
        },

    });
}


function createFoldingCubeIcons(callback) {
    var canvas,scene;
    canvas = document.getElementById('foldingCubeIconsCanvas');
    var ctx = canvas.getContext("2d");
    
    var pp = [
        [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]],
        [[0,1],[1,1],[2,1],[2,0],[1,2],[1,3]],
        [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3]],
        [[1,0],[1,1],[2,1],[0,2],[1,2],[1,3]],
        [[0,0],[1,0],[1,1],[2,1],[1,2],[1,3]],
        [[0,0],[1,0],[1,1],[1,2],[2,2],[1,3]],
        [[0,0],[1,0],[1,1],[1,2],[1,3],[2,3]],
        [[0,0],[1,0],[1,1],[1,2],[2,2],[2,3]],
        [[1,0],[1,1],[1,2],[0,2],[0,3],[0,4]],
        [[1,0],[1,1],[2,1],[0,2],[1,2],[0,3]],
        [[2,0],[3,0],[1,1],[2,1],[0,2],[1,2]],        
    ];
    

    var sz = 4, u = sz+1;
    var x0 = 5, y0 = 5;
    var ys = [];
    var y = y0;
    for(var i=0; i<pp.length; i++) {
        ly = u*((i==8) ? 5 : 4) - (u-sz);
        ys.push([y,y+ly-1]);
        y += ly + 4;
    }
    
    var drawItem = function(i, hl) {
        if(hl) ctx.fillStyle = '#0000ff';
        else  ctx.fillStyle = '#000000';      
        for(var j=0; j<6;j++) {
            var x = x0 + u*pp[i][j][0], y = ys[i][0] + u*pp[i][j][1];
            ctx.fillRect(x,y,sz,sz);            
        }        
    }
    
    for(var i=0; i<pp.length; i++) drawItem(i, i==0);
    canvas.curIndex = 0;
    
    canvas.addEventListener('click', function(e) {
        var y = e.offsetY;
        var index = canvas.curIndex;
        for(var i=0;i<11;i++) {
            yr = ys[i];
            if(yr[0]<y && y<yr[1]) {index = i; break; }
        }
        if(index != canvas.curIndex) {
            drawItem(canvas.curIndex, false);
            canvas.curIndex = index;
            drawItem(canvas.curIndex, true);
        }
        callback(index);
    });
    
}
