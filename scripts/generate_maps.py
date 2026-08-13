import os
from PIL import Image, ImageDraw, ImageFont

# Set up paths
OUTPUT_DIR = "public/images/map"
FONT_PATH = "public/fonts/VCR.ttf"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Dimensions
WIDTH = 800
HEIGHT = 500

# Color Palette matching user images
COLOR_VOID = (56, 32, 25)        # #382019
COLOR_FLOOR = (251, 240, 203)    # #fbf0cb
COLOR_WALL = (56, 32, 25)       # #382019
COLOR_DOOR = (198, 168, 123)     # #c6a87b
COLOR_TEXT = (56, 32, 25)       # #382019

font_lg = ImageFont.truetype(FONT_PATH, 24)
font_md = ImageFont.truetype(FONT_PATH, 18)
font_sm = ImageFont.truetype(FONT_PATH, 14)
font_xs = ImageFont.truetype(FONT_PATH, 12)

def draw_vertical_text(text, font, fill, center_x, center_y):
    """Draw text rotated 90 degrees vertically."""
    bbox = font.getbbox(text)
    w = bbox[2] - bbox[0] + 6
    h = bbox[3] - bbox[1] + 6
    txt_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((3 - bbox[0], 3 - bbox[1]), text, font=font, fill=fill)
    txt_img = txt_img.rotate(270, expand=True)
    
    pos_x = int(center_x - txt_img.width / 2)
    pos_y = int(center_y - txt_img.height / 2)
    return txt_img, (pos_x, pos_y)

# --- 1. GROUND FLOOR ---
def create_ground_floor():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLOR_VOID)
    draw = ImageDraw.Draw(img)
    
    floor_coords = [
        (20, 20), (780, 20), (780, 420), (300, 420), (300, 480), (20, 480)
    ]
    draw.polygon(floor_coords, fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    draw.line([(300, 20), (300, 350)], fill=COLOR_WALL, width=8)
    draw.line([(300, 350), (20, 350)], fill=COLOR_WALL, width=8)
    
    draw.line([(140, 350), (140, 420)], fill=COLOR_WALL, width=8)
    draw.line([(20, 420), (300, 420)], fill=COLOR_WALL, width=8)
    
    draw.rectangle([300, 70, 640, 360], outline=COLOR_WALL, width=8)
    draw.line([(380, 70), (380, 360)], fill=COLOR_WALL, width=8)
    draw.line([(460, 70), (460, 360)], fill=COLOR_WALL, width=8)
    draw.line([(460, 230), (640, 230)], fill=COLOR_WALL, width=8)
    draw.rectangle([490, 110, 640, 230], fill=COLOR_VOID, outline=COLOR_WALL, width=8)
    
    draw.rectangle([490, 20, 780, 70], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    doors = [
        (390, 66, 430, 74),
        (560, 66, 600, 74),
        (636, 130, 644, 160),
        (346, 356, 354, 390),
        (76, 416, 84, 424),
    ]
    for d in doors:
        draw.rectangle(d, fill=COLOR_DOOR)

    draw.text((160, 185), "LIBRARY", font=font_lg, fill=COLOR_TEXT, anchor="mm")
    
    txt_lift, pos_lift = draw_vertical_text("LIFT", font_lg, COLOR_TEXT, 340, 215)
    img.paste(txt_lift, pos_lift, txt_lift)
    
    txt_toilet, pos_toilet = draw_vertical_text("TOILET", font_lg, COLOR_TEXT, 420, 215)
    img.paste(txt_toilet, pos_toilet, txt_toilet)
    
    draw.text((635, 45), "OFFICE/TEACHERS\nAREA", font=font_md, fill=COLOR_TEXT, anchor="mm")
    draw.text((80, 385), "SAA\nOFFICE", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((220, 385), "LOUNGE", font=font_md, fill=COLOR_TEXT, anchor="mm")
    draw.text((160, 450), "STUDENT\nRECRUITMENT", font=font_md, fill=COLOR_TEXT, anchor="mm")
    
    img.save(os.path.join(OUTPUT_DIR, "floor-ground.png"))

# --- 2. 2ND FLOOR ---
def create_2nd_floor():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLOR_VOID)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([20, 20, 780, 480], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    draw.rectangle([240, 80, 520, 340], fill=COLOR_VOID, outline=COLOR_WALL, width=8)
    
    draw.line([(100, 20), (100, 340)], fill=COLOR_WALL, width=8)
    draw.line([(100, 140), (180, 140)], fill=COLOR_WALL, width=8)
    draw.line([(180, 140), (180, 340)], fill=COLOR_WALL, width=8)
    draw.line([(20, 340), (120, 340)], fill=COLOR_WALL, width=8)
    draw.line([(120, 340), (120, 480)], fill=COLOR_WALL, width=8)
    
    draw.line([(120, 390), (550, 390)], fill=COLOR_WALL, width=8)
    draw.line([(290, 390), (290, 480)], fill=COLOR_WALL, width=8)
    draw.line([(550, 390), (550, 480)], fill=COLOR_WALL, width=8)
    
    draw.rectangle([515, 80, 600, 200], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    draw.rectangle([515, 200, 600, 340], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    draw.line([(660, 80), (780, 80)], fill=COLOR_WALL, width=8)
    draw.line([(660, 80), (660, 480)], fill=COLOR_WALL, width=8)
    draw.line([(660, 160), (780, 160)], fill=COLOR_WALL, width=8)
    
    doors = [
        (96, 110, 104, 130),
        (176, 175, 184, 205),
        (116, 350, 124, 380),
        (155, 386, 185, 394),
        (485, 386, 515, 394),
        (596, 110, 604, 135),
        (596, 230, 604, 255),
        (656, 180, 664, 210),
        (656, 350, 664, 380),
    ]
    for d in doors:
        draw.rectangle(d, fill=COLOR_DOOR)

    txt_mfg, pos_mfg = draw_vertical_text("MANUFACTURING\nLAB", font_md, COLOR_TEXT, 60, 210)
    img.paste(txt_mfg, pos_mfg, txt_mfg)
    
    txt_chem, pos_chem = draw_vertical_text("CHEMISTRY\nLAB", font_md, COLOR_TEXT, 70, 410)
    img.paste(txt_chem, pos_chem, txt_chem)
    
    draw.text((205, 435), "COMPUTER\nLAB", font=font_md, fill=COLOR_TEXT, anchor="mm")
    draw.text((420, 435), "MECHATRONICS\nLAB", font=font_md, fill=COLOR_TEXT, anchor="mm")
    
    draw.text((557, 140), "CS IS\nLAB", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    
    txt_toil, pos_toil = draw_vertical_text("TOILET", font_md, COLOR_TEXT, 557, 270)
    img.paste(txt_toil, pos_toil, txt_toil)
    
    draw.text((720, 120), "IS LAB", font=font_md, fill=COLOR_TEXT, anchor="mm")
    
    txt_mech, pos_mech = draw_vertical_text("MECHANICAL\nENGINEERING LAB", font_md, COLOR_TEXT, 720, 320)
    img.paste(txt_mech, pos_mech, txt_mech)

    img.save(os.path.join(OUTPUT_DIR, "floor-2.png"))

# --- 3. 19TH FLOOR ---
def create_19th_floor():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLOR_VOID)
    draw = ImageDraw.Draw(img)
    
    draw.polygon([(20, 20), (780, 20), (780, 440), (520, 440), (520, 480), (20, 480)], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    draw.line([(100, 20), (100, 440)], fill=COLOR_WALL, width=8)
    draw.line([(20, 125), (100, 125)], fill=COLOR_WALL, width=8)
    draw.line([(20, 230), (100, 230)], fill=COLOR_WALL, width=8)
    draw.line([(20, 335), (100, 335)], fill=COLOR_WALL, width=8)
    
    draw.line([(100, 85), (250, 85)], fill=COLOR_WALL, width=8)
    draw.line([(160, 20), (160, 85)], fill=COLOR_WALL, width=8)
    draw.line([(250, 20), (250, 60)], fill=COLOR_WALL, width=8)
    draw.line([(250, 60), (580, 60)], fill=COLOR_WALL, width=8)
    draw.line([(580, 60), (580, 85)], fill=COLOR_WALL, width=8)
    draw.line([(580, 85), (730, 85)], fill=COLOR_WALL, width=8)
    draw.line([(730, 85), (730, 20)], fill=COLOR_WALL, width=8)
    
    draw.rectangle([140, 110, 610, 330], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    draw.line([(140, 220), (280, 220)], fill=COLOR_WALL, width=8)
    draw.line([(280, 110), (280, 330)], fill=COLOR_WALL, width=8)
    draw.line([(140, 280), (210, 280)], fill=COLOR_WALL, width=8)
    draw.line([(210, 280), (210, 330)], fill=COLOR_WALL, width=8)
    
    draw.line([(340, 110), (340, 330)], fill=COLOR_WALL, width=8)
    draw.line([(400, 110), (400, 330)], fill=COLOR_WALL, width=8)
    draw.line([(470, 110), (470, 330)], fill=COLOR_WALL, width=8)
    draw.line([(470, 240), (610, 240)], fill=COLOR_WALL, width=8)
    draw.line([(520, 110), (520, 240)], fill=COLOR_WALL, width=8)
    
    draw.line([(740, 85), (740, 440)], fill=COLOR_WALL, width=8)
    
    draw.line([(20, 370), (740, 370)], fill=COLOR_WALL, width=8)
    draw.line([(100, 370), (100, 480)], fill=COLOR_WALL, width=8)
    draw.line([(240, 370), (240, 480)], fill=COLOR_WALL, width=8)
    draw.line([(530, 370), (530, 440)], fill=COLOR_WALL, width=8)
    draw.line([(600, 370), (600, 440)], fill=COLOR_WALL, width=8)
    
    doors = [
        (96, 70, 104, 90),
        (96, 170, 104, 190),
        (96, 270, 104, 290),
        (96, 390, 104, 410),
        (156, 50, 164, 70),
        (170, 81, 190, 89),
        (220, 81, 240, 89),
        (300, 106, 330, 114),
        (350, 106, 380, 114),
        (300, 326, 330, 334),
        (350, 326, 380, 334),
        (480, 130, 488, 150),
        (490, 236, 510, 244),
        (736, 240, 744, 270),
        (160, 366, 180, 374),
        (330, 366, 350, 374),
        (550, 366, 570, 374),
        (650, 366, 670, 374),
    ]
    for d in doors:
        draw.rectangle(d, fill=COLOR_DOOR)

    draw.text((60, 70), "CLASS\n19F-04", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((60, 175), "CLASS\n19F-03", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((60, 280), "CLASS\n19F-02", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((60, 420), "CLASS\n19F-01", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    
    draw.text((205, 35), "COUNSELING", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    draw.text((142, 60), "CLINIC", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    draw.text((500, 42), "OFFICE/TEACHERS AREA", font=font_md, fill=COLOR_TEXT, anchor="mm")
    
    draw.text((210, 160), "TUTORING\nCENTRE", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((210, 250), "ACADEMIC\nREGISTRY", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    draw.text((175, 305), "LOUNGE", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    
    txt_l, pos_l = draw_vertical_text("LIFT", font_md, COLOR_TEXT, 310, 220)
    img.paste(txt_l, pos_l, txt_l)
    
    txt_t, pos_t = draw_vertical_text("TOILET", font_md, COLOR_TEXT, 370, 220)
    img.paste(txt_t, pos_t, txt_t)
    
    txt_s, pos_s = draw_vertical_text("STORAGE", font_xs, COLOR_TEXT, 495, 175)
    img.paste(txt_s, pos_s, txt_s)
    
    draw.text((540, 285), "MUSHOLLA", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    draw.text((670, 200), "STUDENT\nLOUNGE", font=font_md, fill=COLOR_TEXT, anchor="mm")
    
    txt_b, pos_b = draw_vertical_text("BALCONY", font_lg, COLOR_TEXT, 760, 260)
    img.paste(txt_b, pos_b, txt_b)
    
    draw.text((170, 425), "CLASS\n19F-20", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((385, 425), "CLASS 19F-19, 19F-18, 19F-17\n(AUDITORIUM 19F)", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((565, 405), "BEM\nROOM", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    draw.text((670, 405), "CLASS\n19F-15", font=font_sm, fill=COLOR_TEXT, anchor="mm")

    img.save(os.path.join(OUTPUT_DIR, "floor-19.png"))

# --- 4. 7TH FLOOR ---
def create_7th_floor():
    img = Image.new('RGB', (WIDTH, HEIGHT), COLOR_VOID)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([20, 20, 780, 480], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    draw.line([(20, 80), (780, 80)], fill=COLOR_WALL, width=8)
    draw.line([(200, 20), (200, 80)], fill=COLOR_WALL, width=8)
    draw.line([(390, 20), (390, 80)], fill=COLOR_WALL, width=8)
    draw.line([(680, 20), (680, 80)], fill=COLOR_WALL, width=8)
    
    draw.line([(100, 80), (100, 400)], fill=COLOR_WALL, width=8)
    draw.line([(20, 260), (100, 260)], fill=COLOR_WALL, width=8)
    draw.line([(20, 370), (100, 370)], fill=COLOR_WALL, width=8)
    
    draw.rectangle([290, 120, 640, 360], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    draw.line([(360, 120), (360, 360)], fill=COLOR_WALL, width=8)
    draw.line([(430, 120), (430, 360)], fill=COLOR_WALL, width=8)
    draw.line([(430, 230), (640, 230)], fill=COLOR_WALL, width=8)
    draw.rectangle([490, 150, 640, 230], fill=COLOR_VOID, outline=COLOR_WALL, width=8)
    
    draw.line([(680, 80), (680, 480)], fill=COLOR_WALL, width=8)
    draw.rectangle([676, 140, 740, 240], fill=COLOR_FLOOR, outline=COLOR_WALL, width=8)
    
    draw.line([(100, 400), (780, 400)], fill=COLOR_WALL, width=8)
    draw.line([(240, 400), (240, 480)], fill=COLOR_WALL, width=8)
    draw.line([(400, 400), (400, 480)], fill=COLOR_WALL, width=8)
    
    doors = [
        (110, 76, 130, 84),
        (280, 76, 300, 84),
        (540, 76, 560, 84),
        (676, 40, 684, 60),
        (96, 180, 104, 200),
        (96, 310, 104, 330),
        (96, 376, 104, 394),
        (150, 396, 170, 404),
        (300, 396, 320, 404),
        (560, 396, 580, 404),
        (310, 116, 340, 124),
        (370, 116, 400, 124),
        (310, 356, 340, 364),
        (370, 356, 400, 364),
        (636, 160, 644, 180),
        (676, 320, 684, 340),
    ]
    for d in doors:
        draw.rectangle(d, fill=COLOR_DOOR)

    draw.text((110, 50), "CLASS\n7F-02", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((295, 50), "CLASS\n7F-03", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((535, 50), "OFFICE/TEACHERS\nAREA", font=font_md, fill=COLOR_TEXT, anchor="mm")
    draw.text((730, 50), "GED\nTEST\nROOM", font=font_xs, fill=COLOR_TEXT, anchor="mm")
    
    txt_off, pos_off = draw_vertical_text("OFFICE", font_md, COLOR_TEXT, 60, 170)
    img.paste(txt_off, pos_off, txt_off)
    
    draw.text((60, 315), "IOT\nLAB", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    
    txt_phy, pos_phy = draw_vertical_text("PHYSICS\nLAB", font_sm, COLOR_TEXT, 60, 425)
    img.paste(txt_phy, pos_phy, txt_phy)
    
    draw.text((195, 230), "STUDENT\nLOUNGE", font=font_lg, fill=COLOR_TEXT, anchor="mm")
    
    txt_l7, pos_l7 = draw_vertical_text("LIFT", font_lg, COLOR_TEXT, 325, 240)
    img.paste(txt_l7, pos_l7, txt_l7)
    
    txt_t7, pos_t7 = draw_vertical_text("TOILET", font_lg, COLOR_TEXT, 395, 240)
    img.paste(txt_t7, pos_t7, txt_t7)
    
    draw.text((535, 175), "STAIRS", font=font_lg, fill=COLOR_TEXT, anchor="mm")
    
    txt_off2, pos_off2 = draw_vertical_text("OFFICE/TEACHERS AREA", font_md, COLOR_TEXT, 740, 280)
    img.paste(txt_off2, pos_off2, txt_off2)
    
    txt_mush, pos_mush = draw_vertical_text("OLLA\nMUSH", font_xs, COLOR_TEXT, 700, 190)
    img.paste(txt_mush, pos_mush, txt_mush)
    
    draw.text((170, 440), "CREATIVE\nCENTRE 1", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((320, 440), "CREATIVE\nCENTRE 2", font=font_sm, fill=COLOR_TEXT, anchor="mm")
    draw.text((590, 440), "GREEN SCREEN &\nMOTION CAPTURE", font=font_md, fill=COLOR_TEXT, anchor="mm")

    img.save(os.path.join(OUTPUT_DIR, "floor-7.png"))

if __name__ == "__main__":
    create_ground_floor()
    create_2nd_floor()
    create_19th_floor()
    create_7th_floor()
    print("Map floor images generated successfully!")
