import os
from PIL import Image, ImageDraw

ui_dir = r"d:\Client\Dinesh Sadangi\Skyrostore\UI"
out_products = r"d:\Client\Dinesh Sadangi\Skyrostore\apps\storefront\public\images\products"
out_hero = r"d:\Client\Dinesh Sadangi\Skyrostore\apps\storefront\public\images\hero"

os.makedirs(out_products, exist_ok=True)
os.makedirs(out_hero, exist_ok=True)

# 1. Storefront (1024 x 1536)
sf = Image.open(os.path.join(ui_dir, "Skyrostore Professional UAV Storefront.png"))

# Hero Drone
hero_drone = sf.crop((520, 60, 990, 310))
hero_drone.save(os.path.join(out_hero, "storefront-hero-drone.png"))

# Build CTA Blueprint Drone
blueprint = sf.crop((600, 1180, 970, 1330))
blueprint.save(os.path.join(out_hero, "blueprint-drone.png"))

# Helper to remove heart icon from top-right corner of card image crop
def clean_card_crop(crop_img):
    # heart is at top right: replace top-right 32x32 area with border background color
    bg_pixel = crop_img.getpixel((5, 5))
    draw = ImageDraw.Draw(crop_img)
    w, h = crop_img.size
    draw.rectangle([w - 40, 0, w, 40], fill=bg_pixel)
    return crop_img

# Row 1 cards in Storefront
# Coordinates for image boxes inside cards:
# Card 1: Holybro Pixhawk 6X: (46, 468, 265, 582)
p1 = clean_card_crop(sf.crop((52, 470, 260, 580)))
p1.save(os.path.join(out_products, "pixhawk-6x.png"))

# Card 2: T-Motor MN5212: (288, 468, 507, 582)
p2 = clean_card_crop(sf.crop((294, 470, 502, 580)))
p2.save(os.path.join(out_products, "t-motor-mn5212.png"))

# Card 3: Hobbywing 60A ESC: (530, 468, 749, 582)
p3 = clean_card_crop(sf.crop((536, 470, 744, 580)))
p3.save(os.path.join(out_products, "hobbywing-60a-esc.png"))

# Card 4: Carbon Fiber Prop: (772, 468, 991, 582)
p4 = clean_card_crop(sf.crop((778, 470, 986, 580)))
p4.save(os.path.join(out_products, "carbon-fiber-prop-15in.png"))

# Row 2 cards in Storefront (y ~ 690 to 805)
# Card 5: LiPo 6S 5000mAh
p5 = clean_card_crop(sf.crop((52, 692, 260, 802)))
p5.save(os.path.join(out_products, "lipo-6s-5000mah.png"))

# Card 6: Here3+ RTK GPS
p6 = clean_card_crop(sf.crop((294, 692, 502, 802)))
p6.save(os.path.join(out_products, "here3-rtk-gps.png"))

# Card 7: CUAV Telemetry Radio
p7 = clean_card_crop(sf.crop((536, 692, 744, 802)))
p7.save(os.path.join(out_products, "cuav-telemetry-radio.png"))

# Card 8: X450 Carbon Frame Kit
p8 = clean_card_crop(sf.crop((778, 692, 986, 802)))
p8.save(os.path.join(out_products, "x450-carbon-frame.png"))

# Category thumbnails from Storefront
c1 = sf.crop((58, 1060, 114, 1093))
c1.save(os.path.join(out_products, "cat-complete-uavs.png"))

c2 = sf.crop((290, 1060, 346, 1093))
c2.save(os.path.join(out_products, "cat-flight-controllers.png"))

c3 = sf.crop((522, 1060, 578, 1093))
c3.save(os.path.join(out_products, "cat-escs.png"))

c4 = sf.crop((754, 1060, 810, 1093))
c4.save(os.path.join(out_products, "cat-motors.png"))

c5 = sf.crop((58, 1115, 114, 1148))
c5.save(os.path.join(out_products, "cat-propellers.png"))

c6 = sf.crop((290, 1115, 346, 1148))
c6.save(os.path.join(out_products, "cat-gps.png"))

c7 = sf.crop((522, 1115, 578, 1148))
c7.save(os.path.join(out_products, "cat-batteries.png"))

c8 = sf.crop((754, 1115, 810, 1148))
c8.save(os.path.join(out_products, "cat-frames.png"))


# 2. T-Motor Product Page (1312 x 1199)
pdp = Image.open(os.path.join(ui_dir, "Skyrostore T-Motor Product Page.png"))
# Main image (remove top right expand icon)
main_motor = pdp.crop((146, 96, 584, 450))
bg_color = main_motor.getpixel((10, 10))
draw = ImageDraw.Draw(main_motor)
draw.rectangle([main_motor.width - 50, 0, main_motor.width, 50], fill=bg_color)
main_motor.save(os.path.join(out_products, "t-motor-mn5212-large.png"))

# Thumbnails
pdp.crop((54, 98, 134, 160)).save(os.path.join(out_products, "t-motor-thumb-1.png"))
pdp.crop((54, 172, 134, 234)).save(os.path.join(out_products, "t-motor-thumb-2.png"))
pdp.crop((54, 246, 134, 308)).save(os.path.join(out_products, "t-motor-thumb-3.png"))
pdp.crop((54, 320, 134, 382)).save(os.path.join(out_products, "t-motor-thumb-4.png"))


# 3. UAV Parts Catalog (1226 x 1283)
cat = Image.open(os.path.join(ui_dir, "Skyrostore UAV Parts Catalog.png"))
# Banner
cat.crop((0, 40, 1226, 170)).save(os.path.join(out_hero, "catalog-banner.png"))

# Row 3 cards in catalog:
# Card 9: RunCam Phoenix 2 SE
runcam = clean_card_crop(cat.crop((260, 680, 480, 785)))
runcam.save(os.path.join(out_products, "runcam-phoenix-2.png"))

# Card 10: Holybro PM02 Power Module
pm02 = clean_card_crop(cat.crop((505, 680, 725, 785)))
pm02.save(os.path.join(out_products, "holybro-pm02.png"))

# Card 11: uBlox M10 GPS Module
m10 = clean_card_crop(cat.crop((750, 680, 970, 785)))
m10.save(os.path.join(out_products, "ublox-m10.png"))

# Card 12: CUAV V7+ Flight Controller
v7 = clean_card_crop(cat.crop((995, 680, 1215, 785)))
v7.save(os.path.join(out_products, "cuav-v7-fc.png"))


# 4. UAV Builder Dashboard (1312 x 1199)
builder = Image.open(os.path.join(ui_dir, "Skyrostore UAV Builder Dashboard.png"))
# Builder top banner
builder.crop((580, 45, 1290, 225)).save(os.path.join(out_hero, "builder-drone-frame.png"))

# Frames from builder:
# Row 1 Frame 2: X550 Carbon Frame Kit
x550 = builder.crop((416, 405, 574, 505))
x550.save(os.path.join(out_products, "x550-carbon-frame.png"))

# Row 1 Frame 3: H680 Hexa Frame
h680 = builder.crop((600, 405, 758, 505))
h680.save(os.path.join(out_products, "h680-hexa-frame.png"))

# Row 2 Frame 1: S900 Heavy Lift Frame
s900 = builder.crop((232, 735, 390, 835))
s900.save(os.path.join(out_products, "s900-heavy-frame.png"))

# Row 2 Frame 2: T650 VTOL Frame
t650 = builder.crop((416, 735, 574, 835))
t650.save(os.path.join(out_products, "t650-vtol-frame.png"))

# Row 2 Frame 3: Custom Research Frame
custom_frame = builder.crop((600, 735, 758, 835))
custom_frame.save(os.path.join(out_products, "custom-research-frame.png"))


# 5. Cart Interface (1312 x 1199)
cart = Image.open(os.path.join(ui_dir, "Skyrostore UAV Cart Checkout Interface.png"))
cart.crop((580, 45, 1290, 225)).save(os.path.join(out_hero, "cart-hero-drone.png"))

# Accessories from Frequently Bought Together:
# Card 3: BN-880 GPS Module
bn880 = cart.crop((375, 715, 500, 785))
bn880.save(os.path.join(out_products, "bn-880-gps.png"))

# Card 4: SiK Telemetry Radio
sik = cart.crop((530, 715, 655, 785))
sik.save(os.path.join(out_products, "sik-telemetry-radio.png"))


# 6. Bulk Orders (1312 x 1199)
bulk = Image.open(os.path.join(ui_dir, "Skyrostore Bulk UAV Orders Dashboard.png"))
bulk.crop((580, 45, 1290, 245)).save(os.path.join(out_hero, "bulk-hero-drone.png"))


# 7. Support Center (1312 x 1199)
support = Image.open(os.path.join(ui_dir, "Skyrostore UAV Support Center.png"))
support.crop((580, 45, 1290, 245)).save(os.path.join(out_hero, "support-hero-drone.png"))

# Recommended articles thumbnails:
support.crop((52, 545, 120, 595)).save(os.path.join(out_products, "art-motor.png"))
support.crop((52, 610, 120, 660)).save(os.path.join(out_products, "art-battery.png"))
support.crop((52, 675, 120, 725)).save(os.path.join(out_products, "art-fc.png"))
support.crop((52, 740, 120, 790)).save(os.path.join(out_products, "art-builder.png"))
support.crop((52, 805, 120, 855)).save(os.path.join(out_products, "art-shipping.png"))

print("Successfully extracted all 35+ UI assets from mockups!")
