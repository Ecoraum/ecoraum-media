import sys, glob
from PIL import Image
prefix, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(prefix + '-*.png'), key=lambda f: float(f.rsplit('-', 1)[1][:-4]))
s = 0.22; w, h = int(1080 * s), int(1920 * s)
cols = min(6, len(fs)); rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (10 + cols * (w + 8), 10 + rows * (h + 8)), '#777')
for k, f in enumerate(fs):
    sh.paste(Image.open(f).convert('RGB').resize((w, h)), (10 + (k % cols) * (w + 8), 10 + (k // cols) * (h + 8)))
sh.save(out)
