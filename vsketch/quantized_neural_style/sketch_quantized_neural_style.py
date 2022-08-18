import vsketch
import pickle
from shapely.geometry import Polygon, Point, LineString
from shapely import wkt
from typing import NamedTuple, Tuple, List


class ColorPoly(NamedTuple):
    index: int
    shape: Polygon
    color: Tuple[int, int, int, int]

    @classmethod
    def from_collection_file(cls, file_path):
        chunks = list()
        with open(file_path, "r") as f:
            for line in f:
                i, wkt_str, color = line.strip().split(";")
                poly = wkt.loads(wkt_str)
                chunks.append(cls(i, poly, color))
        return chunks


#FILE_PATH = "/home/amor/Documents/code_dw/neural-styles/neural_styles/quantizer/serialized_rez.txt"


FILE_PATH = "/home/amor/Documents/code_dw/neural-styles/serialized_rez.txt"
shapes = ColorPoly.from_collection_file(FILE_PATH)


class QuantizedNeuralStyleSketch(vsketch.SketchClass):
    # Sketch parameters:
    pen_width = vsketch.Param(0.5)

    def draw(self, vsk: vsketch.Vsketch) -> None:
        vsk.size("a3", landscape=True)
        vsk.scale("mm")

        # implement your sketch here
        # vsk.circle(0, 0, self.radius, mode="radius")
        color_to_layer = list({s.color for s in shapes})
        vsk.noStroke()
        for s in shapes:
            vsk.penWidth(f"{self.pen_width}mm")
            vsk.fill(color_to_layer.index(s.color) + 2)

            vsk.geometry(s.shape.buffer(-self.pen_width / 2))

    def finalize(self, vsk: vsketch.Vsketch) -> None:
        vsk.vpype("linemerge linesimplify reloop linesort")


if __name__ == "__main__":
    QuantizedNeuralStyleSketch.display()
