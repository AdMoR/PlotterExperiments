var SEED = -11;
var pos = [250, 250, 150]
let MAX_POINTS = 100

var point_count = 0

var SPEED = 20

function setup() {
    colorMode(HSB, 255);
    frameRate(100)
    createCanvas(640, 480);

    if(SEED == -11){
        seed_slider = createSlider(-10, 10, 1, 0);
        seed_slider.mouseReleased(reset)
    }


    beginShape();
}

function reset(){
    SEED = seed_slider.value()
    randomSeed(SEED);
    point_count = 0
    loop()
    clear()
    pos = [250, 250, 150]
    setup();
    draw()
}


function draw() {

    background(255);
    
    translate(width / 2, height / 2);
    
    var circleResolution = map(mouseY, 0, height, 2, 80);
    
    var radius = mouseX - width / 2 + 0.5;
    
    var angle = TWO_PI / circleResolution;
    
    strokeWeight(mouseY / 20);
    
    beginShape();
    
    for (var i = 0; i <= circleResolution; i++) {
        var x = cos(angle * i) * radius;
        var y = sin(angle * i) * radius;
        line(0, 0, x, y);
        vertex(x, y)
    }
    
    endShape(CLOSE);
    
    }


function other_draw() {

    rw = random_walk(dim=3)
    pos = vec_add(pos, rw)

    pos_proj = projector_3_to_2(pos)
    vertex(pos_proj[0], pos_proj[1]);

    point_count++;
    if(point_count > MAX_POINTS){
        noLoop()
        endShape(CLOSE);
    }

}


function projector_3_to_2(vec) {
    x = vec[0]
    y = vec[1]
    p_noise = noise(x, y, vec[2])
    return [vec[0] , vec[1] + p_noise * vec[2]]
}




function random_walk(dim=3) {

    var random_fn = (rng_) => {
        return map(rng_, 0, 1, -SPEED/2, SPEED/2)
    }

    var vec = []
    for(i=0; i<dim; i++){
        var r = random()
        vec.push(random_fn(r))
    }

    return vec

}


function vec_add(a, b) {

    var result = []
    for(i=0; i<dim; i++){
        result.push(a[i] + b[i])
    }
    return result
}