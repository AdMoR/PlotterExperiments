import math

from matplotlib import pyplot as plt
import numpy as np

import shapely
from shapely.geometry import Point, Polygon, LineString


PRECISION = 10


def rounder(pt):
    if type(pt) == Point:
        return Point(round(pt.x, PRECISION), round(pt.y, PRECISION))
    elif type(pt) == tuple and len(pt) == 2:
        return Point(round(pt[0], PRECISION), round(pt[1], PRECISION))
    elif type(pt) == float or type(pt) == np.float64:
        return round(pt, PRECISION)
    else:
        raise Exception(f"Unknown type : {type(pt)}")


def plot_pts(pts):
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    plt.scatter(xs, ys)
    plt.axis('equal')


def get_center(a, b, n):
    diff = np.array([b.x, b.y]) - np.array([a.x, a.y])
    middle = np.array([a.x / 2, a.y / 2]) + np.array([b.x / 2, b.y / 2])
    direction = np.cross(np.array([diff[0], diff[1], 0]), np.array([0, 0, 1]))
    norm_dir_ = (direction / np.linalg.norm(direction, 2))[:2]
    ab_dist = np.linalg.norm(diff, 2)
    dist = ab_dist / 2.0 / math.sin(math.pi / n) * math.cos(math.pi / n)
    ortho_move = dist * norm_dir_
    c = ortho_move + middle
    return Point(rounder(c[0]), rounder(c[1]))


def generate_regular_polygon(a, b, c, n):
    pts = [a, b]
    segments = list()
    in_seg = LineString([a, b])
    for _ in range(n - 2):
        out = shapely.affinity.rotate(in_seg, -360 / n, origin=c)
        segments.append(out)
        in_seg = out
        x, y = out.coords
        pts.append(rounder(x))
        pts.append(rounder(y))
    pts.append(a)
    return segments, Polygon(pts).simplify(1e-4)


def plot_figs(*fgs, color="blue"):
    plt.axis('equal')
    for f in fgs:
        xs, ys = list(), list()
        pts = list(f.exterior.coords)
        for x, y in pts:
            xs.append(x)
            ys.append(y)
        plt.plot(xs, ys, color=color)
        plt.scatter(xs, ys, color='red')


def plot_line_strings(*ln_str, color='green'):
    for ls in ln_str:
        xs, ys = list(), list()
        pts = list(ls.coords)
        for x, y in pts:
            xs.append(x)
            ys.append(y)
        plt.plot(xs, ys, color=color)
        plt.scatter(xs, ys, color='red')
