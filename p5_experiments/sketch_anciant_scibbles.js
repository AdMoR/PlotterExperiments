var LAMBDA = 200
var DISPERSION = 5
var SAMPLING = 0
var SEED = -11
var POINT_RATIO = 1
var MODE = "OTHER"
var LINE_SEP = false
var CANVAS = null


let UNIQUE = false
const MAX_DEPTH = 9
const MIN_SIZE = 40


let sampling_slider

function reset(){
    SEED = seed_slider.value()
    randomSeed(SEED);
    loop()
    clear()
    draw()
}

function mousePressed(){
    SEED = SEED + 1
    randomSeed(SEED)
}

function keyPressed() { 
  if(key == "s"){
    saveCanvas(CANVAS, 'myScribble', 'png');
  }
  else if(key == "r"){
    MODE = "RECTANGLE"
  }
} 

function setup() {
    colorMode(HSB, 255);

    //noLoop()
    frameRate(10)
    CANVAS = createCanvas(640, 480);

    //createP("Sampling variation")
    //sampling_slider = createSlider(0.8, 1.0, 0.9, 0);
    //sampling_slider.mousePressed(draw)
    //sampling_slider.mouseReleased(draw)
    //sampling_slider.mouseMoved(draw)


    //createP("Seed value")
    //let inp = createInput("10")
    //inp.input(seed_update);

    radio = createRadio();
    radio.option('rectangle', "RECTANGLE");
    radio.option('quadrilateral', "quadrilateral");

}

function draw() {
    UNIQUE = false
    randomSeed(SEED);

    MODE = radio.value()
    LAMBDA = 500 * mouseX / 640
    POINT_RATIO = 3 * mouseY / 480
    //DISPERSION = 15 * mouseY / 480

    //SAMPLING = sampling_slider.value()

    clear()

   let width = 640;
   let height = 480;

   if(MODE == "RECTANGLE"){
    cut(0, 0, width, height, width, height, LAMBDA, 0)
   }
   else{
    cutb(0, 0, width, 0, 0, height, width, height, width, height, LAMBDA, 0)
   }

    //save();
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
        if(min_dist > 1200){
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

function color_picker() {

    var range = max => Array.from(new Array(max), (_, i) => i)
    let NB_COLORS = 5
    var COLORS = range(NB_COLORS).map(x => color(5, 255, 255 * x / (NB_COLORS + 1)))
    let value = random(0, 1)

    for(var i=0; i < COLORS.length; i++){
        if(value < (i + 1) / COLORS.length){
            return COLORS[i]
        }
    }
}

function plot_next_given_past(pt_m1, pt, x_intensity, y_intensity){
    var direction = [pt[0] - pt_m1[0], pt[1] - pt_m1[1]]
    var direction_normlaised = [direction[0] / sqrt(sq(direction[0]) + sq(direction[1])), direction[1] / sqrt(sq(direction[0]) + sq(direction[1]))]
    var new_point = [pt_m1[0] + direction_normlaised[0] * x_intensity, pt_m1[1] + direction_normlaised[1] * y_intensity]
    return new_point
}


// **************************
// subdivision in rectangles
// **************************


function cut(x0, y0, x1, y1, height, width, lambda, depth){

    if(should_continue(x1 - x0, y1 - y0, width, height, lambda, depth)){
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
    if(random(0, 1) < 0){
        sampler = () => [random(x0, x1), random(y0, y1)];
        //strokeWeight(1)
        color_ = 0
    }
    else{
        color_ = color_picker()
        
        //strokeWeight(1.5)
        var sigma = [(x1 - x0) / DISPERSION, (y1 - y0) / DISPERSION]
        var mid = [(x1 + x0) / 2, (y1 + y0) / 2]
        sampler = () => [randomGaussian(mid[0], sigma[0]), randomGaussian(mid[1], sigma[1])];
    }

    var pt  = sampler()
    ref_all_points.push(pt)
    for(var n=0; n < round(0.8 * POINT_RATIO * sqrt(area)); n++){
        var pt_m1 = ref_all_points[ref_all_points.length - 1]
        var pt  = sampler()

        let norm = random(0.05, 0.25)
        let new_point = plot_next_given_past(pt_m1, pt, norm * (x1 - x0), norm * (y1 - y0))
        ref_all_points.push(new_point) 
    }
    //console.log("all pts", ref_all_points.length)

    // Create the links
    var pt_list = greedy_point_join(ref_all_points)
    var smooth_pt_list = apply_chaikin_smoothing(pt_list, 3)

    // Plot all
    plot_segments(smooth_pt_list, color_)

}

function should_continue(delta_x, delta_y, width, height, lambda, depth){
    var area_condition = random(0, 1) < exp(- (width * height) / ((delta_y) * (delta_x)) / lambda) / exp(-1 / lambda)
    var other_conditions = delta_y >= MIN_SIZE && delta_x >= MIN_SIZE && depth < MAX_DEPTH
    return area_condition && other_conditions
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


// *************************************
// subdivision in convex quadrilaterals
// *************************************

function sample_between_two_points(x1, y1, x2, y2, min_l=0.15, max_l=0.85){
    var lambda = random(min_l, max_l)
    return [lambda * x1 + (1 - lambda) * x2, lambda * y1 + (1 - lambda) * y2]
}

function cutb(xa, ya, xb, yb, xc, yc, xd, yd, width, height, lambda, depth){

    var dist_x = 0.5 * ((xd - xa) + (xb - xc))
    var dist_y = 0.5 * ((yd - ya) + (yc - yb))

    if(should_continue(dist_x, dist_y, width, height, lambda, depth)){

        var cut = (random(0, 1) > 0.5 ? 'H' : 'V');
        if(dist_x > 2 * dist_y){
            cut = "V"
        }
        else{
            if(dist_y > 2 * dist_x){
                cut = "H"
            }
        }

        if(cut == 'H'){
            var [x_m1, y_m1] = sample_between_two_points(xa, ya, xc, yc)
            var [x_m2, y_m2] = sample_between_two_points(xb, yb, xd, yd)
            if(LINE_SEP){
                line(x_m1, y_m1, x_m2, y_m2)
            }
            cutb(xa, ya, xb, yb, x_m1, y_m1, x_m2, y_m2, width, height, lambda, depth + 1)
            cutb(x_m1, y_m1, x_m2, y_m2, xc, yc, xd, yd, width, height, lambda, depth + 1)
        }
        else{
            var m1 = sample_between_two_points(xa, ya, xb, yb)
            var m2 = sample_between_two_points(xc, yc, xd, yd)
            if(LINE_SEP){
                line(m1[0], m1[1], m2[0], m2[1])
            }
            cutb(xa, ya, m1[0], m1[1], xc, yc, m2[0], m2[1], width, height, lambda, depth + 1)
            cutb(m1[0], m1[1],  xb, yb, m2[0], m2[1], xd, yd, width, height, lambda, depth + 1)
        }
    }
    else{
        //console.log("plot", xa, ya, xb, yb, xc, yc, xd, yd)
        plot_in_quadrilateral(xa, ya, xb, yb, xc, yc, xd, yd)
    }
}

function area_triangle(x1, y1, x2, y2, x3, y3){
    // Find largest side, can be 12, 13 or 23
    var dist_12 = dist(x1, y1, x2, y2)
    var dist_13 = dist(x1, y1, x3, y3)
    var dist_23 = dist(x3, y3, x2, y2)
    var max_dist = max([dist_12, dist_13, dist_23])

    // Find height given by the remaining point on largest side
    var height = -1
    if(max_dist == dist_12){
        var P = [x3, y3]
        var v1 = [x3 - x1, y3 - y1]
        var v2 = [x2 - x1, y2 - y1]

        var angle = acos(p5.Vector.dot(v1, v2) / 1)

    }
    else if(max_dist == dist_13){
        var P = [x2, y2]
    }
    else{
        var P = [x1, y1]
    }
}


function plot_in_quadrilateral(xa, ya, xb, yb, xc, yc, xd, yd){

    var dist_x = 0.5 * ((xd - xa) + (xb - xc))
    var dist_y = 0.5 * ((yd - ya) + (yc - yb))
    var approx_area = dist_x * dist_y
    var all_points = []
    //console.log("approx area : ", approx_area)

    // Define the sampler
    let sampler = () => {
        var cut = (random(0, 1) > 0.5 ? 'H' : 'V');
        var xm, ym;
        if(cut == "H"){
            [xm, ym] = sample_between_two_points(xb, yb, xd, yd, 0, 1)
        }
        else{
            [xm, ym] = sample_between_two_points(xc, yc, xd, yd, 0, 1)
        }
        return sample_between_two_points(xa, ya, xm, ym)
    }

    all_points.push(sampler())
    for(var n = 0; n < round(1.2 * POINT_RATIO * sqrt(approx_area)); n++){
        let pt_m1 = all_points[all_points.length - 1]
        let intensity = 0.4 * random(0, 1) + 0.1
        let new_point = plot_next_given_past(pt_m1, sampler(), intensity  * sqrt(approx_area), intensity * sqrt(approx_area))
        all_points.push(new_point)
    }

    // Create the links
    var pt_list = greedy_point_join(all_points)
    var smooth_pt_list = apply_chaikin_smoothing(pt_list, 3)

    // Plot all
    color_ = color(255, 0, 0)
    plot_segments(smooth_pt_list, color_)

}