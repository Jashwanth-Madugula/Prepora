import os
from PIL import Image

def process_logo():
    img_path = r"d:\prepora\public\rehearsa-logo.png"
    if not os.path.exists(img_path):
        print("Logo not found at", img_path)
        return
    
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    print(f"Loaded logo of size: {width}x{height}")
    
    # Let's perform a flood fill from the 4 corners to make the background transparent.
    # We will use a threshold because there might be compression artifacts.
    # Standard flood fill using PIL is available as ImageDraw.floodfill, but we can do a simple stack-based flood fill in Python.
    
    data = img.load()
    
    visited = set()
    to_visit = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    
    # Threshold for "white"
    threshold = 240
    
    def is_near_white(color):
        r, g, b, a = color
        return r >= threshold and g >= threshold and b >= threshold
    
    # Stack flood fill
    stack = [pos for pos in to_visit]
    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        # Check coordinates validity
        if 0 <= x < width and 0 <= y < height:
            current_color = data[x, y]
            if is_near_white(current_color):
                # Make it transparent
                data[x, y] = (0, 0, 0, 0)
                
                # Add neighbors
                for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        stack.append((nx, ny))
                        
    # Now let's handle the dark text at the bottom.
    # The tagline text is in black/dark gray. Let's find dark pixels in the lower third of the image and change them to white.
    # Let's check pixels in the bottom 40% of the image (y > height * 0.6)
    # The tagline text is black, so r < 100, g < 100, b < 100, and it is not transparent (a > 100)
    for y in range(int(height * 0.6), height):
        for x in range(width):
            r, g, b, a = data[x, y]
            if a > 50: # visible pixel
                # If it's a dark pixel (black/dark gray text)
                if r < 100 and g < 100 and b < 100:
                    # Invert to light gray/white (e.g. 240, 240, 240)
                    data[x, y] = (240, 240, 240, a)
                    
    output_path = r"d:\prepora\public\rehearsa-logo-dark.png"
    img.save(output_path, "PNG")
    print(f"Saved processed dark-mode logo to {output_path}")

    # Let's also save a version for light-mode where the background is transparent but text stays dark.
    img_light = Image.open(img_path).convert("RGBA")
    data_light = img_light.load()
    
    visited_light = set()
    stack_light = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    while stack_light:
        x, y = stack_light.pop()
        if (x, y) in visited_light:
            continue
        visited_light.add((x, y))
        
        if 0 <= x < width and 0 <= y < height:
            current_color = data_light[x, y]
            if is_near_white(current_color):
                data_light[x, y] = (0, 0, 0, 0)
                for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited_light:
                        stack_light.append((nx, ny))
                        
    output_path_light = r"d:\prepora\public\rehearsa-logo-light.png"
    img_light.save(output_path_light, "PNG")
    print(f"Saved processed light-mode logo to {output_path_light}")

if __name__ == "__main__":
    process_logo()
