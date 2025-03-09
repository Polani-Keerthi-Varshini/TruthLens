import cairosvg
import os

def convert_svg_to_png(svg_path, png_path):
    print(f"Converting {svg_path} to {png_path}")
    cairosvg.svg2png(url=svg_path, write_to=png_path)

def main():
    icon_sizes = [16, 48, 128]
    for size in icon_sizes:
        svg_path = f"icons/icon{size}.svg"
        png_path = f"icons/icon{size}.png"
        if os.path.exists(svg_path):
            convert_svg_to_png(svg_path, png_path)
            print(f"Successfully converted icon{size}")

if __name__ == "__main__":
    main()
