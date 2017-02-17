// Folding cube 
// by gmt(todesco@toonz.com); feb2017 

var foldingCube;


function subrange(x,a,b) { return x<=a?0:x>=b?1:(x-a)/(b-a); } 
function smooth(x) { return x*x*(3-2*x); }

//
// class FoldingCube
//
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
    ];
    
    if(index<0 || index>=unfoldings.length) return;
    unfolding = unfoldings[index];

    var faces = this.faces;    
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
 
// end of FoldingCube class

function enableGuiBehaviour(ent, camera, renderCanvas) {
    ent.mouseDown = false;
    
    ent.pointerEventObservable.add(function (d, s) {
        if((s.mask&BABYLON.PrimitivePointerInfo.PointerDown)!=0) {
            ent.mouseDown = true;
            ent.setPointerEventCapture(d.pointerId);
            setTimeout(function () {camera.detachControl(renderCanvas);}, 0);
            // console.log(d,s);
        } else if(ent.mouseDown) {
            ent.mouseDown = false;
            ent.releasePointerEventsCapture(d.pointerId);
            camera.attachControl(renderCanvas, true);
            if(ent.onButtonUp) ent.onButtonUp(ent, s);
        }        
    }, BABYLON.PrimitivePointerInfo.PointerDown | BABYLON.PrimitivePointerInfo.PointerUp);   
}

/*
function createGuiCanvas(scene, name, renderCanvas, x, y, width, height, config) {
    var myConfig = {
        id:name, 
        size:new BABYLON.Size(width, height),        
        x:x, y:y,
    };
    config = config || {};
    for(var field in config) { myConfig[field] = config[field]; }
    var canvas2d = new BABYLON.ScreenSpaceCanvas2D(scene, myConfig);
    
    return canvas2d;
}
*/


/*
function createUnfoldingButtons(index, parent, x, y) {
    var rect = new BABYLON.Rectangle2D({
        id: "ub"+index, parent: canvas2d, x: x, y: 10, width: 40, height: 40, 
        fill: "#404080FF", 
        });
        rect.index = i;
        enableGuiBehaviour(rect, scene.activeCamera, foldingCube.canvas);
        rect.onButtonUp = cb;

}
*/

function UnfoldingButton(index, parent, x, y) {
    var L = 6, D = 8;
    var width = D * (index==10 ? 4 : 3) + 2;
    BABYLON.Rectangle2D.call(this, {
        id: "ub"+index,
        parent: parent, 
        x:x, y:y, width:width, height:40,
        fill: "#CCCCCC66", 
    });
    this.index = index;
    this.checked = false;
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
    var x1 = 0;
    for(var i=0;i<6;i++) {
        var x = 1+D*pp[index][i][0], y = 1+(D*(5-pp[index][i][1]));
        new BABYLON.Rectangle2D({
            parent:this,
            fill:UnfoldingButton.UncheckedColor,
            x:x,y:y,width:L,height:L
        });
        x+=L;
        if(x>x1)x1=x;
    }
    this.innerWidth = width;
}

UnfoldingButton.prototype = Object.create(BABYLON.Rectangle2D.prototype); 
UnfoldingButton.prototype.constructor = UnfoldingButton;

UnfoldingButton.prototype.setFill = function(fillColor) {
    this.children.forEach(function(rect) { rect.fill = fillColor; });
}

UnfoldingButton.prototype.setChecked = function(checked) {
    this.checked = checked;
    if(this.checked) this.setFill(UnfoldingButton.CheckedColor);
    else this.setFill(UnfoldingButton.UncheckedColor);
}

UnfoldingButton.CheckedColor = BABYLON.Canvas2D.GetSolidColorBrush(new BABYLON.Color4(0.00,0.20,1.00,1));
UnfoldingButton.UncheckedColor = BABYLON.Canvas2D.GetSolidColorBrush(new BABYLON.Color4(0.10,0.10,0.10,1));



function createUnfoldingButtonsBar(scene, x, y) {
    var canvas2d = new BABYLON.ScreenSpaceCanvas2D(scene, {
        id:"unfoldingButtonsBar",
        size:new BABYLON.Size(540, 50),
        x:x,y:y,
        backgroundFill: "#40408088"
    });        
    
    /*
    var cb = function(me) { 
        console.log("index=",me.index); 
    }
    */
    canvas2d.currentIndex = 0;
    canvas2d.buttons = [];
    
    var cb = function(btn, e) {
        var index = btn.index;
        canvas2d.buttons[canvas2d.currentIndex].setChecked(false);
        btn.setChecked(true);
        canvas2d.currentIndex = index;        
        console.log("index=", index);
        foldingCube.configure(index);
    }
        
    var x = 1;
    for(var i=0;i<11;i++) {
        /*
        var rect = new BABYLON.Rectangle2D({
            id: "ub"+i, parent: canvas2d, x: 10 + 50*i, y: 10, width: 40, height: 40, 
            fill: "#404080FF", 
        });
        rect.index = i;
        enableGuiBehaviour(rect, scene.activeCamera, foldingCube.canvas);
        rect.onButtonUp = cb;
        */
        var btn = new UnfoldingButton(i, canvas2d, x, 1);
        x += btn.innerWidth + 4;
        enableGuiBehaviour(btn, scene.activeCamera, foldingCube.canvas);
        btn.onButtonUp = cb;
        canvas2d.buttons.push(btn);
    } 
    canvas2d.buttons[0].setChecked(true);
    return canvas2d;
}
 
var unfoldingButtonsBar;
function createGui(scene) {
    unfoldingButtonsBar = createUnfoldingButtonsBar(scene, 10,300);
    
    
    
    
    /*
    var canvas2d = new BABYLON.ScreenSpaceCanvas2D(scene, {
        id: "ScreenCanvas",
        size: new BABYLON.Size(600, 50),
        backgroundFill: "#4040408F",
        x:10, y:300,
        children: [
            new BABYLON.Text2D("Hello World!", {
                id: "text",
                marginAlignment: "h: center, v:center",
                fontName: "20pt Arial",
            })
        ]
    });
    */
    
    
}
 
 
//
// create the babylon scene, engine etc.
//
function createFoldingCubeScene(canvas) {
    var engine = new BABYLON.Engine(canvas, true);
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera('camera1',
        -1.3, 1.1, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.upperBetaLimit = Math.PI*0.5;
    camera.lowerRadiusLimit = 10;
    camera.wheelPrecision = 10;
    camera.attachControl(canvas, true);

    scene.ambientColor = new BABYLON.Color3(0.3,0.3,0.3);

    var light = new BABYLON.PointLight(
        "light0", 
        new BABYLON.Vector3(0, 5, 0), scene);
    light.intensity = 0.5;
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurVarianceShadowMap = true;
    shadowGenerator.blurScale = 4.0;
    // shadowGenerator.setDarkness(0.8);
    foldingCube = new FoldingCube('fc', scene);
    foldingCube.setShadowGenerator(shadowGenerator);
    foldingCube.canvas = canvas;

    var light2 = new BABYLON.PointLight('light1',
       new BABYLON.Vector3(0.0,0.4,0.0), scene);
    light2.intensity = 0.3;
    light2.parent = camera;

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    groundMat.ambientColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    var ground = BABYLON.Mesh.CreateGround(
        'ground1', 24, 24, 2,
        scene);
    ground.position.y = -4;
    ground.receiveShadows = true;
    ground.material = groundMat;
    
    createGui(scene);

    engine.runRenderLoop(function() {
      scene.render();
    });

    return scene;
}

/*
function createHud(scene) {
    var c2d = new BABYLON.ScreenSpaceCanvas2D(scene, 
    { 
        id: "c2d_1", size: new BABYLON.Size(400, 200), 
        x:100, y:600,
        backgroundFill: "#C0C0C040", 
        backgroundRoundRadius: 20 
    });

    var rect = new BABYLON.Rectangle2D({
        id: "mainRect", parent: c2d, x: 2, y: 2, width: 100, height: 100, 
        fill: "#404080FF", border: "#A040A0D0, #FFFFFFFF", borderThickness: 10, 
        roundRadius: 10, 
        children: 
        [
            new BABYLON.Rectangle2D(
            { 
                id: "insideRect", marginAlignment: "v: center, h: center", 
                width: 40, height: 40, fill: "#FAFF75FF", roundRadius: 10 
            })
        ]});
}
*/

// 
// create the Babylon scene and attach the open/close slider
function createFoldingCubeAnimation() {
    var canvas;
    canvas = document.getElementById('foldingCubeCanvas');
    scene = createFoldingCubeScene(canvas);

    // createHud(scene);
    /*
    hud.pointerEventObservable.add(function (d, s) {
        console.log(d,s);
    }, BABYLON.PrimitivePointerInfo.PointerDown);
    
    hud.pointerEventObservable.add(function (d, s) {
        console.log("ok");
    }, BABYLON.PrimitivePointerInfo.PointerUp);
    */
    

    
    $( "#foldingCubeSlider" ).slider({
        animate:"fast",
        slide: function(e,ui) {
            foldingCube.setAperture(1.0-ui.value*0.01);
        },
        value:100

    });
}

// draw the 11 icons representing different cube unfoldings
// when the user click the index-th icon then calls callback(index)

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
    

    var sz = 6, u = sz+1;
    var mrg = sz - 1;
    var x0 = 5, y0 = 5;
    var positions = [];
    var sizes = [];
    var x = x0, y = y0;
    var tlx = [3,3,3,3,3,3,3,3,2,3,4];
    var tly = [4,4,4,4,4,4,4,4,5,4,3];
    
    for(var i=0; i<pp.length; i++) {
        lx = u*tlx[i];
        ly = u*tly[i];
        positions.push(x,y);
        sizes.push(lx,ly);
        if(canvas.width>canvas.height) x += lx + mrg;
        else y += ly + mrg;
    }
    var drawItem = function(i, hl) {
        if(hl) ctx.fillStyle = '#0000ff';
        else  ctx.fillStyle = '#000000';      
        var x1 = x0 + positions[i*2];
        var y1 = y0 + positions[i*2+1];        
        for(var j=0; j<6;j++) {
            var x = x1 + u*pp[i][j][0], y = y1 + u*pp[i][j][1];
            ctx.fillRect(x,y,sz,sz);            
        }        
    }
    
    for(var i=0; i<pp.length; i++) drawItem(i, i==0);
    canvas.curIndex = 0;
    
    canvas.addEventListener('click', function(e) {
        var x = e.offsetX;
        var y = e.offsetY;
        var index = canvas.curIndex;
        for(var i=0;i<11;i++) {
            var xa = x0 + positions[i*2], ya = y0 + positions[i*2+1];
            var xb = xa + sizes[i*2], yb = ya + sizes[i*2+1];
            
            if(xa<=x && x<=xb && ya<=y && y<=yb) {index = i; break; }
        }
        if(index != canvas.curIndex) {
            drawItem(canvas.curIndex, false);
            canvas.curIndex = index;
            drawItem(canvas.curIndex, true);
        }
        callback(index);
    });
    
}
