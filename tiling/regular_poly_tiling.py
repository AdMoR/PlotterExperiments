import random
import math
from collections import Counter
from typing import Tuple, Dict, List

from matplotlib import pyplot as plt
import numpy as np
from rtree import index
import shapely
from shapely.geometry import Point, Polygon, LineString
from tiling.helpers import plot_line_strings, plot_pts, plot_figs, get_center, generate_regular_polygon


rounder = lambda x: round(x, 8)


def find_edges_from_point(poly, p, precision):
    """
    returns (AB), (BC)
    """
    vertices = poly.simplify(10 ** -precision).exterior.coords[:-1]
    for i, vertex in enumerate(vertices):
        if not p.almost_equals(Point(vertex[0], vertex[1]), 10**-4):
            continue
        else:
            prev_edge = LineString([vertices[i - 1], vertices[i]])
            next_edge = LineString([vertices[i], vertices[(i + 1) % len(vertices)]])
            while next_edge.length < 10 ** -precision:
                i += 1
                next_edge = LineString([vertices[i], vertices[(i + 1) % len(vertices)]])
            return prev_edge, next_edge
    return None, None


def find_neighbouring_edges(p: Point, all_polys: List[Polygon]):
    precision = 0.0001
    intersections = list()
    neighbouring_edges = list()

    for i, poly in enumerate(all_polys):
        for e in find_edges_from_point(poly, p, 4):
            if e:
                neighbouring_edges.append(e)

    belonging = dict()
    for e in neighbouring_edges:
        belonging[str(e)] = 0
        for poly in all_polys:
            if poly.buffer(10**-4).contains(e):
                belonging[str(e)] += 1

    print(belonging)

    rez = list(filter(lambda e: belonging[str(e)] == 1, neighbouring_edges))

    if len(rez) > 2:
        for e in rez:
            print(e)
        print("-------")
        for e in intersections:
            print(e)
        raise Exception()

    print("total ", len(rez))

    return rez


def find_autorized_gen(poly_degrees):
    """
    Counter do not allow simple negative number to be easily used :(
    """
    authorized_combinations = {"3" * 6, "3" * 4 + "6", "3" * 3 + "4" * 2, "33434",
                               "334B", "343B", "3366", "3636", "3446", "3464", "4" * 4, "666"}
    authorized_combination_counters = [Counter(c) for c in authorized_combinations]

    poly_degrees_counter = Counter(poly_degrees)

    matching_pattern = list(
        filter(lambda combi: all(combi[k] >= poly_degrees_counter[k]
                                 for k in poly_degrees_counter.keys()), authorized_combination_counters)
    )

    if len(matching_pattern) == 0:
        return None

    selected_pattern = random.sample(matching_pattern, k=1)[0]

    authorized_degrees = {k: selected_pattern[k] - poly_degrees_counter[k]
                          for k in selected_pattern.keys()
                          if selected_pattern[k] - poly_degrees_counter[k] > 0}

    if len(authorized_degrees.keys()) == 0:
        return None
    else:
        selected_degree = random.sample(authorized_degrees.keys(), k=1)[0]
        return int(selected_degree) if selected_degree != "B" else 12


def new_find_corner(all_polys: List[Polygon], rindex: index.Index) -> Tuple[Tuple[int, int], int]:
    corner_stats = {}

    all_pts = set()
    for poly in all_polys:
        for pt in poly.exterior.coords:
            all_pts.add(pt)

    # Get polys for each pt
    for pt in all_pts:
        corner_stats[pt] = list(rindex.intersection((pt[0], pt[1])))
    print("corner stats ====>", corner_stats)
    corner_pts = list(filter(lambda x: len(x[1]) > 1, corner_stats.items()))

    # 2 - Find the authorized patterns
    for p, neighbour_polys in sorted(corner_pts, key=lambda x: sum(x[1]), reverse=True):
        poly_degrees = [len(all_polys[i].exterior.coords) - 1 for i in neighbour_polys]
        print("poly_degree : ", poly_degrees, "for point p = ", p)
        selected_degree = find_autorized_gen("".join(map(str, poly_degrees)))
        print("selected degree : ", selected_degree)
        if selected_degree:
            return p, selected_degree
    raise Exception("No completion possible")


def constrained_completion(all_polys, index, current_index):
    # 1 - Find the right corner for the next step
    p, selected_degree = new_find_corner(all_polys, index)
    print("\n")
    print("Selected point : ", p, selected_degree)

    # 2 - Generate the new poly
    edges = find_neighbouring_edges(Point(*p), all_polys)
    print("==>> ", [list(e.coords) for e in edges])
    xs, ys = edges[0].coords.xy
    ap = Point(xs[0], ys[0])
    bp = Point(xs[1], ys[1])
    c = get_center(bp, ap, selected_degree)
    _, pp = generate_regular_polygon(bp, ap, c, selected_degree)

    # 4 - update the db of polys
    all_polys.append(pp.simplify(10 ** -6))
    index.insert(current_index, pp.bounds)

    return p, pp, edges[0]
