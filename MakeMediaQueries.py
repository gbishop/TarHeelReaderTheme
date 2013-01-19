mqL = '''@media only screen and (min-height: %dpx) and (min-width: %dpx) {
    body {
        font-size: %dpx;
    }
}'''
mqP = '''@media only screen and (min-height: %dpx) and (min-width: %dpx) and (max-width: %dpx) {
    body {
        font-size: %dpx;
    }
    .thr-pic-box {
        width: %dem;
        height: %dem;
    }
}'''

for i in range(10,33):
    print mqL % (i*37.5, i*48, i-1)

for i in range(10,33):
    print mqP % (i*64, i*48, i*64, i-1, 48, 48)
