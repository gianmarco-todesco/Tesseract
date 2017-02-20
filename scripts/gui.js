function Gui(canvas, scene) {
    this.canvas = canvas;
    this.scene = scene;
}

Gui.prototype.enableGuiBehaviour = function(ent) {
    ent.mouseDown = false;
    
    var camera = this.camera;
    var canvas = this.canvas;
    
    ent.pointerEventObservable.add(function (d, s) {
        if(s.mask == BABYLON.PrimitivePointerInfo.PointerDown) {
            ent.mouseDown = true;
            ent.setPointerEventCapture(d.pointerId);
            setTimeout(function () {camera.detachControl(canvas);}, 0);
            var x = d.primitivePointerPos.x;
            var y = d.primitivePointerPos.x;            
            ent.offx = x - d.canvasPointerPos.x;
            ent.offy = y - d.canvasPointerPos.y;
            ent.lastx = x;
            ent.lasty = y;            
            if(ent.onButtonDown) ent.onButtonDown(ent,{x:x,y:y,e:d});            
        } else {
            var x = d.canvasPointerPos.x + ent.offx;
            var y = d.canvasPointerPos.x + ent.offy;            
            if(s.mask == BABYLON.PrimitivePointerInfo.PointerMove) {    
                var dx = x - ent.lastx; ent.lastx = x;
                var dy = y - ent.lasty; ent.lasty = y;
                if(ent.mouseDown && ent.onButtonDrag) {                    
                    ent.onButtonDrag(ent, {x:x,y:y,dx:dx,dy:dy,e:d});                    
                }
            } else if(s.mask == BABYLON.PrimitivePointerInfo.PointerUp) {
                ent.mouseDown = false;
                ent.releasePointerEventsCapture(d.pointerId);
                camera.attachControl(canvas, true);
                if(ent.onButtonUp) ent.onButtonUp(ent, {x:x, y:y, e:d});
            }
        }        
    }, BABYLON.PrimitivePointerInfo.PointerDown 
     | BABYLON.PrimitivePointerInfo.PointerUp
     | BABYLON.PrimitivePointerInfo.PointerMove);       
}



var click_drag_icon, zoom_icon;

function createStaticIcons() {
    var texture;
    
    texture = new BABYLON.Texture(
        "images/click_drag_icon.png", 
        scene, 
        false);
    texture.hasAlpha = true;
    click_drag_icon = new BABYLON.ScreenSpaceCanvas2D(scene, {
        id:"click_drag_icon",
        size:new BABYLON.Size(32, 32),
        x:500,y:300,
        backgroundFill: "#40408088",
        children:[new BABYLON.Sprite2D(texture)]
    }); 
    
    texture = new BABYLON.Texture(
        "images/zoom_icon.png", 
        scene, 
        false);
    texture.hasAlpha = true;
    zoom_icon = new BABYLON.ScreenSpaceCanvas2D(scene, {
        id:"zoom_icon",
        size:new BABYLON.Size(32, 32),
        x:500,y:350,
        backgroundFill: "#40408088",
        children:[new BABYLON.Sprite2D(texture)]
    });  
    return [click_drag_icon, zoom_icon];   
}

function placeStaticIcons(w,h) {
    var x = w - 70;
    var y = h - 40;
    zoom_icon.x = x;
    zoom_icon.y = y;
    y -= 50;
    click_drag_icon.x = x;
    click_drag_icon.y = y;    
}



function createControlSlider(scene) {
    var x0 = 80, x1 = 260;
    var canvas2d = new BABYLON.ScreenSpaceCanvas2D(scene, {
        id:"icons",
        size:new BABYLON.Size(400, 66),
        x:30,y:100,
        backgroundFill: "#40408088",
        children:[
            new BABYLON.Rectangle2D({
                id:"slideBar",
                fill:"#33333388",
                x:x0,y:20,width:x1-x0,height:10,
                roundRadius:5,            
            }),
            new BABYLON.Text2D("Chiuso", { 
                fontName: "14pt Verdana", 
                x:10,y:10,
                defaultFontColor: new BABYLON.Color4(1,1,1,1), 
            }),
            new BABYLON.Text2D("Aperto", { 
                fontName: "14pt Verdana", 
                x:x1+30,y:10,
                defaultFontColor: new BABYLON.Color4(1,1,1,1), 
            })
        ]
    }); 
    slideCursor = new BABYLON.Rectangle2D({
            id:"slideCursor",
            parent:canvas2d,
            fill:"#361446FF",
            x:100,y:15,width:20,height:20,
            roundRadius:10,
            
        });
    canvas2d.xmin = x0;
    canvas2d.xmax = x1;
    
        
    enableGuiBehaviour(canvas2d, scene.activeCamera, foldingCube.canvas);
    canvas2d.onButtonDown = function(c,e) { 
        canvas2d.lastx = e.x;
        canvas2d.lasty = e.y;
    };
    canvas2d.onButtonDrag = function(c,e) { 
        slideCursor.x += e.dx;
        if(slideCursor.x < c.xmin) slideCursor.x = c.xmin;
        else if(slideCursor.x > c.xmax) slideCursor.x = c.xmax;
        canvas2d.value = 100.0 * (slideCursor.x - canvas2d.xmin)
                                 /(canvas2d.xmax - canvas2d.xmin);
        console.log(canvas2d.value);
        foldingCube.setAperture(1-canvas2d.value*0.01);
    };
    canvas2d.onButtonUp = function(c,e) { 
        console.log("up");
    };
    
    
    
}

