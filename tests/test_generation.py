from shapely.geometry import Point, Polygon, LineString
from unittest import TestCase
import random

from rtree import index
from matplotlib import pyplot as plt

from tiling.regular_poly_tiling import get_center, plot_pts, generate_regular_polygon, find_autorized_gen, \
    constrained_completion, plot_figs, plot_line_strings, find_edges_from_point, new_find_corner


class TestGeneration(TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        random.seed(42)
        a = Point(0, 0)
        b = Point(0, 1)
        n = 6
        c = get_center(a, b, n)
        lines, poly = generate_regular_polygon(a, b, c, n)

        polys = [poly.simplify(0.0001)]

        index = 0

        selected_poly = polys[index].simplify(1e-6)

        # condition on intersection of edges with other polys

        vertices = selected_poly.exterior.coords

        selected_edge_index = random.randint(0, len(vertices) - 2)

        a = vertices[selected_edge_index]
        b = vertices[selected_edge_index + 1]
        a = Point(a[0], a[1])
        b = Point(b[0], b[1])

        n = 6
        c = get_center(b, a, n)
        lines, new_poly = generate_regular_polygon(b, a, c, n)

        cls.polys = [poly, new_poly]

    def test1(self):
        a = Point(10, 10)
        b = Point(12, 10)
        c = get_center(a, b, 6)
        plot_pts([a, b, c])
        assert round(c.distance(a), 2) == round(c.distance(b), 2)

    def test_auth_gen(self):
        rez = find_autorized_gen("33")
        self.assertIn(rez, {3, 4, 6})

    def test_find_edges_from_point(self):
        poly = self.polys[0]
        p = Point(*poly.exterior.coords[0])
        e1, e2 = find_edges_from_point(poly, p, 4)
        print(e1, "\n", e2)
        self.assertIsNotNone(e1)

    def test_find_corner(self):
        """
        """
        all_polys = [
            Polygon([(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)]),
            Polygon([(0, 0), (0, -1), (-1, -1), (-1, 0), (0, 0)]),
            Polygon([(0, 0), (0, 1), (-1, 1), (-1, 0), (0, 0)])
        ]
        poly_db = index.Index()

        for i, p in enumerate(all_polys):
            poly_db.insert(i, p.bounds)
        p, selected_degree = new_find_corner(all_polys, poly_db)

        self.assertEqual(p, (0, 0))
        self.assertEqual(selected_degree, 4)

    def test_find_corner_2(self):
        """
        """
        all_polys = [
            Polygon([(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)]),
            Polygon([(0, 0), (0, 1), (-1, 1), (-1, 0), (0, 0)]),
            Polygon([(0, 0), (-1, 0), (-1, -1), (0, 0)]),
            Polygon([(0, 0), (1, 0), (1, 1), (0, 0)]),
            Polygon([(1, 0), (1, 1), (2, 1), (1, 0)])
        ]
        poly_db = index.Index()

        for i, p in enumerate(all_polys):
            poly_db.insert(i, p.bounds)
        p, selected_degree = new_find_corner(all_polys, poly_db)

        self.assertEqual(p, (0, 0))
        self.assertEqual(selected_degree, 3)

    def test_index_search(self):
        p = Polygon([(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)])
        poly_db = index.Index()
        poly_db.insert(0, p.buffer(0.0001).bounds)
        rez = poly_db.intersection((-10**-12, 0.5))
        print(list(rez), p.buffer(0.0001).bounds)

    def test_constrained_completion(self):
        random.seed(42)
        poly_db = index.Index()

        for i, p in enumerate(self.polys):
            poly_db.insert(i, p.buffer(0.001).bounds)
        all_polys = self.polys

        for i in range(2, 30):
            print("\n Iteration : ", i)
            p, pp, edge = constrained_completion(all_polys, poly_db, i)
            plt.figure()
            plot_figs(*all_polys)
            plot_figs(pp, color="orange")
            plot_line_strings(edge, color="green")
            plt.scatter([p[0]], [p[1]], color="black")
            plt.savefig(f"iter_{i}.png")
