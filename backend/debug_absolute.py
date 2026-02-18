
import os
import sys

path = r'c:\Users\USER\Documents\Projects\vemrehr\backend\absolute_debug.txt'
try:
    with open(path, 'w') as f:
        f.write("Absolute hello\n")
    print("Written to", path)
except Exception as e:
    print("Error:", e)
