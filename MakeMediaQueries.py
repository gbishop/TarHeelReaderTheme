'''Generate media queries for Tar Heel Reader.

The base design is for a 4/3 aspect ratio at 1em = 16px. We want book pages to fit without scrolling so we need
to scale the font appropriately. Should we let the font size do something else on non-book pages?

Since everything is em based we *could* set the font-size per page instead of on the body.

If the aspect ratio is greater than 4/3 we should let height determine the font-size.

If the aspect ratio is less than 4/3 there should be two cases:
    If the width <= 640: divide by 36 because we're using a 36em width
    If the width > 640: divide by 48 because we are using 48em width
'''


mqL = '''@media only screen and (min-aspect-ratio: 4/3) and (min-height: %dpx) {
    body {
        font-size: %.2fpx;
    }
}'''
mqP = '''@media only screen and (max-aspect-ratio: 4/3) and (min-width: %dpx) {
    body {
        font-size: %.2fpx;
    }
}'''

for d in [360, 400, 440, 480, 540, 640, 768, 800, 960, 1024, 1280]:
    print mqL % (d, float(d) / 36)
    if d <= 640:
        print mqP % (d, float(d) / 36)
    else:
        print mqP % (d, float(d) / 48)

