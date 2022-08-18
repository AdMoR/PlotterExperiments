var LAMBDA = 200
var DISPERSION = 5
var SAMPLING = 1
var SEED = 0
let UNIQUE = false
const MAX_DEPTH = 10
const MIN_SIZE = 40


let lambda_slider
let sampling_slider
let dispersion_slider


function setup() {
    colorMode(HSB, 255);
    //createP("Ancient scribbles")

    noLoop()
    createCanvas(640, 480, "svg");

    /**
    createP("Fragmentation value")
    lambda_slider = createSlider(10.0, 1000.0, 80, 0);
    lambda_slider.mousePressed(draw)
    lambda_slider.mouseReleased(draw)
    lambda_slider.mouseMoved(draw)

    createP("Sampling variation")
    sampling_slider = createSlider(0.8, 1.0, 0.9, 0);
    sampling_slider.mousePressed(draw)
    sampling_slider.mouseReleased(draw)
    sampling_slider.mouseMoved(draw)

    createP("Dispersion variation")
    dispersion_slider = createSlider(1.0, 15.0, 5, 0);
    dispersion_slider.mousePressed(draw)
    dispersion_slider.mouseReleased(draw)
    dispersion_slider.mouseMoved(draw)

    createP("Seed value")
    let inp = createInput(SEED)
    inp.input(seed_update);

    let redraw = createButton("Redraw")
    redraw.mousePressed(seed_update_bis);
     */
}

function draw() {
    UNIQUE = false
    randomSeed(SEED);
    /** 
    LAMBDA = lambda_slider.value()
    SAMPLING = sampling_slider.value()
    DISPERSION = dispersion_slider.value()
    clear()
    */
   let width = 640;
   let height = 480;
    cut(0, 0, width, height, width, height, LAMBDA, 0)

    save();
}


function seed_update(){
    SEED = this.value()
    draw()
}

function seed_update_bis(){
    SEED = random(0, 10000)
    draw()
}

/**
 * 
 * SUBFUNCTIONS
 * 
 * 
 */

// Chaikin curves

function chaikin_curve(pt_list){

    all_pts = []

    for(var i = 0; i < pt_list.length - 1; i++){
        var p1 = pt_list[i]
        var p2 = pt_list[i + 1]

        var r = [0.75 * p1[0] + 0.25 * p2[0], 0.75 * p1[1] + 0.25 * p2[1]]
        var q = [0.25 * p1[0] + 0.75 * p2[0], 0.25 * p1[1] + 0.75 * p2[1]]

        all_pts.push(r)
        all_pts.push(q)
    }

    return all_pts
}

function apply_chaikin_smoothing(pt_list, smoothness){
    var all_points = pt_list
    for (var k=0; k < smoothness; k++){
        all_points = chaikin_curve(all_points)
    }
    return all_points
}

// Greedy point joining

function greedy_point_join(pts){
    var junctions = [pts[0]]

    while(junctions.length < pts.length){
        var head = junctions[junctions.length - 1]

        var distances = pts.map(element => {
            if(junctions.indexOf(element) > -1){
                return 100000;
            }
            else{
                return dist(element[0], element[1], head[0], head[1]);
            }
        });

        var min_dist = min(distances)
        if(min_dist > 200){
            break
        }
        var min_element = pts[distances.indexOf(min_dist)]
        
        junctions.push(min_element)
    }

    return junctions
}

// plot 

function plot_segments(all_points, color=0){
    for(var n=0; n < all_points.length - 1; n++){
        var pt1 = all_points[n]
        var pt2 = all_points[n + 1]

        stroke(color);
        line(pt1[0], pt1[1], pt2[0], pt2[1])
    }
}



// subdivision

function cut(x0, y0, x1, y1, height, width, lambda, depth){

    if(should_continue(x0, y0, x1, y1, width, height, lambda) && y1 >= y0 + MIN_SIZE && x1 >= x0 + MIN_SIZE && depth < MAX_DEPTH){
        //print("division ", depth)
        var x2, y2, x3, y3;
        [x2, y2, x3, y3] = do_cut(x0, y0, x1, y1)
        //console.log("x0, y0, x3, y3", x0, y0, x3, y3)
        cut(x0, y0, x3, y3, height, width, lambda, depth + 1)
        //console.log("x2, y2, x1, y1", x2, y2, x1, y1)
        cut(x2, y2, x1, y1, height, width, lambda, depth + 1)

        //stroke(color(0, 0, 255));
        //line(x2, y2, x3, y3)
        //stroke(color(0, 0, 0));

    }
    else{
        print("plot")
        curve_in_area(x0, y0, x1, y1)
    }
    
}

function curve_in_area(x0, y0, x1, y1){
    // Setup of vars
    var area = (y1 - y0) * (x1 - x0) 
    var ref_all_points = []

    let color_


    // Generate n points
    let sampler 
    if(random(0, 1) < SAMPLING){
        sampler = () => [random(x0, x1), random(y0, y1)];
        //strokeWeight(1)
        color_ = 0
    }
    else{
        color_ = color(4, 150, 192)
        //strokeWeight(1.5)
        var sigma = [(x1 - x0) / DISPERSION, (y1 - y0) / DISPERSION]
        var mid = [(x1 + x0) / 2, (y1 + y0) / 2]
        sampler = () => [randomGaussian(mid[0], sigma[0]), randomGaussian(mid[1], sigma[1])];
    }
    for(var n=0; n < round(0.8 * sqrt(area)); n++){
        var pt  = sampler()
        ref_all_points.push(pt)
    }
    console.log("all pts", ref_all_points.length)

    // Create the links
    var pt_list = greedy_point_join(ref_all_points)
    var smooth_pt_list = apply_chaikin_smoothing(pt_list, 3)

    // Plot all
    plot_segments(smooth_pt_list, color_)

}

function should_continue(x0, y0, x1, y1, width, height, lambda){
    return random(0, 1) < exp(- (width * height) / ((y1 - y0) * (x1 - x0)) / lambda) / exp(-1 / lambda)
}

function do_cut(x0, y0, x1, y1){
    var cut = (random(0, 1) > 0.5 ? 'H' : 'V');

    var x2, y2, x3, y3;
    if(cut == "H"){
        new_y = round(random(y0, y1))
        y2 = new_y
        y3 = new_y
        x2 = x0
        x3 = x1
    }
    else{
        new_x = random(x0, x1)
        x2 = new_x
        x3 = new_x
        y2 = y0
        y3 = y1
    }
    return [x2, y2, x3, y3]
}