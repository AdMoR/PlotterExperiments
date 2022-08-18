function setup() {
    frameRate(0.01);
    let width = 640;
    let height = 480;
    createCanvas(width, height);

    a = 1.97
    b = -1.9
    c = 1.20
    d = -1.6

    let inpa = createInput(a);
    inpa.input(aInputEvent);

    let inpb = createInput(b);
    inpb.input(bInputEvent);

    let inpc = createInput(c);
    inpc.input(cInputEvent);

    let inpd = createInput(d);
    inpd.input(dInputEvent);


}

function aInputEvent() {
    a = float(this.value());
    clear();
    draw();
  }
function bInputEvent() {
    b = float(this.value());
    clear();
    draw();
}
function cInputEvent() {
    c = float(this.value());
    clear();
    draw();
}
function dInputEvent() {
    d = float(this.value());
    clear();
    draw();
}

function def_rec(a, b, c, d){
    function rec(x_, y_){

        var xtp1 = sin(a * y_) - cos(b * x_)
        var ytp1 = sin(c * x_) - cos(d * y_)
        return {
            "x": xtp1,
            "y": ytp1
        };
    }
    return rec
}



function draw() {
    
    rec = def_rec(a, b, c, d)

    x = 0.0
    y = 0.0 

    for(i = 0; i < 100000; i++){
        if(i % 9 == 0){
            console.debug("before>", x, y)
        }
        var pt = rec(x, y)
        x = pt.x
        y = pt.y
        if(i % 9 == 0){
            console.debug("after>", x, y)
        }
        X = width / 4 * x + width / 2
        Y = height / 4 * y + height / 2
        if(i % 9 == 0){
            console.debug(">>>", X, Y)
        }
        point(X, Y)
    }
}