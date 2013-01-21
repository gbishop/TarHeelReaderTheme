'''Generate media queries for Tar Heel Reader.

The base design is for a 4/3 aspect ratio at 1em = 16px. We want book pages to fit without scrolling so we need
to scale the font appropriately. Should we let the font size do something else on non-book pages?

Since everything is em based we *could* set the font-size per page instead of on the body.

If the aspect ratio is greater than 4/3 we should let height determine the font-size.

If the aspect ratio is less than 4/3 there should be two cases:
    If the width <= 640: divide by 36 because we're using a 36em width
    If the width > 640: divide by 48 because we are using 48em width
'''


mqL = '''@media only screen and (min-aspect-ratio: 4/3) and (min-height: %dpx) and (max-height: %dpx) {
    body {
        font-size: %.2fpx;
    }
}'''
mqP = '''@media only screen and (max-aspect-ratio: 4/3) and (min-width: %dpx) and (max-width: %dpx) {
    body {
        font-size: %.2fpx;
    }
}'''

sizes = [320, 360, 400, 420, 440, 460, 480, 512, 540, 600, 624, 640, 720, 768, 800, 960, 1024, 1080, 1280, 1600, 1920]

for i in range(0, len(sizes) - 1):
    f = float(sizes[i])
    t = float(sizes[i + 1])
    print mqL % (f, t - 1, f / 36)
    if t <= 624:
        print mqP % (f, t - 1, f / 38)
    else:
        print mqP % (f, t - 1, f / 50)

# write a final pair for huge displays
print '@media only screen and (min-aspect-ratio: 4/3) and (min-height: %dpx) { body { font-size: %.2fpx; } }' % (sizes[-1], sizes[-1] / 36)
print '@media only screen and (max-aspect-ratio: 4/3) and (min-width: %dpx) { body { font-size: %.2fpx; } }' % (sizes[-1], sizes[-1] / 48)
