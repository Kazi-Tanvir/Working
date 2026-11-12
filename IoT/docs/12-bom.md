# Bill of Materials

> [!IMPORTANT]
> All prices marked **[quote locally]**. Check Dhaka electronics markets (Elephant Road, Stadium Market) or online (Daraz.com.bd, Techshop.com.bd, Robolab BD). **Buy in person if possible** — faster than delivery when time is tight.

---

## Core Electronics (Buy Immediately — Day 1)

| # | Item | Qty | Est. Range (BDT) | Notes |
|---|------|-----|-------------------|-------|
| 1 | ESP32 DevKit V1 (WROOM-32, 30-pin) | 2 (1 spare) | [quote locally] | Check USB connector type: Micro-B or USB-C. Test BOTH boards on Day 1 |
| 2 | DHT22 sensor module (breakout board with pull-up) | 1 | [quote locally] | Breakout board version has built-in 10 kΩ pull-up. If bare sensor: buy extra 10 kΩ resistor |
| 3 | MQ-135 air quality sensor module | 1 | [quote locally] | Has both analog (AOUT) and digital (DOUT) outputs. We use AOUT. Needs 24 h burn-in on first use |
| 4 | 0.96" OLED display (SSD1306, I2C, 128×64, 4-pin) | 1 | [quote locally] | Check I2C address printed on back: usually 0x3C. Some modules are 0x3D |
| 5 | Single-channel 5V relay module (with optocoupler) | 1 | [quote locally] | Optocoupler-isolated is safer. Check: active LOW or active HIGH logic |
| 6 | RGB LED, 5 mm, common cathode | 2 (1 spare) | [quote locally] | Common cathode = longest pin is GND. Common ANODE won't work with our code without changes |
| 7 | Active buzzer, 5V | 1 | [quote locally] | Active buzzer = makes sound with just DC voltage. Passive buzzer needs PWM signal |
| 8 | Tactile push buttons, 6 mm | 4 (2 spare) | [quote locally] | 4-pin through-hole type |
| 9 | Resistor assortment | 1 set | [quote locally] | Need: 1 kΩ ×3, 1.5 kΩ ×2, 220 Ω ×5, 10 kΩ ×2. Buy a small assortment pack if cheaper |
| 10 | Breadboard, 830-point (full size) | 1 | [quote locally] | For prototyping before perfboard |
| 11 | Perfboard, 7×9 cm (or larger) | 2 (1 spare) | [quote locally] | Universal PCB with through-holes |
| 12 | Jumper wire assortment (M-M, M-F, F-F) | 1 pack (~40+ wires) | [quote locally] | Mixed pack is best |
| 13 | Header pins (male, 40-pin strip) | 2 strips | [quote locally] | For soldering ESP32 to perfboard |

## Actuator (Buy Immediately)

| # | Item | Qty | Est. Range (BDT) | Notes |
|---|------|-----|-------------------|-------|
| 14 | 5V DC fan, 40-80 mm | 1 | [quote locally] | Switched by relay. Any small 5V fan works. **OR use item 15** |
| 15 | 12V LED strip (30 cm) + 12V DC adapter | 1 | [quote locally] | Alternative to fan. More visually impressive. Needs 12V supply |

> [!TIP]
> **Choose fan OR LED strip**, not both. The fan is simpler (just 5V through relay). The LED strip is more visually impressive but needs a separate 12V supply. For a demo, the LED strip catches judges' eyes better.

## Power & Cables (Check at Home First)

| # | Item | Qty | Cost | Notes |
|---|------|-----|------|-------|
| 16 | USB cable (Micro-B or USB-C, matches ESP32) | 2 | Check at home | For programming + power. Most people have spare phone cables |
| 17 | 5V 2A USB power supply (phone charger) | 1 | Check at home | Any 2A+ phone charger. Powers the whole circuit via ESP32 VIN |
| 18 | Extension cord / power strip | 1 | Check at home | For the venue — outlets may be far from your table |

## Tools (Check at Home / University Lab)

| # | Item | Qty | Cost | Notes |
|---|------|-----|------|-------|
| 19 | Soldering iron (30-40W) | 1 | Check lab | University EEE or CSE lab likely has one. Ask early |
| 20 | Solder wire (lead-free, 0.8 mm) | 1 roll | [quote locally] if needed | ~20g roll is enough |
| 21 | Multimeter (basic digital) | 1 | Check at home / lab | **Essential** for testing voltage divider and continuity. Non-negotiable |
| 22 | Wire stripper / cutter | 1 | Check at home | Scissors work in a pinch |
| 23 | Helping hands / third hand (clip holder) | 1 | Optional | Makes soldering much easier. Not essential |

## Enclosure & Finishing (Buy Later — Week 3)

| # | Item | Qty | Est. Range (BDT) | Notes |
|---|------|-----|-------------------|-------|
| 24 | Small cardboard box or plastic enclosure | 1 | [quote locally] or free | Find a suitable box at home. ~20×15×10 cm |
| 25 | Hot glue gun + glue sticks | 1 | [quote locally] | For mounting components in enclosure |
| 26 | Zip ties (small pack) | 1 pack | [quote locally] | Cable management |
| 27 | Double-sided tape | 1 roll | [quote locally] | Mounting |
| 28 | Labels / stickers / marker | 1 | [quote locally] | Label components for judges |
| 29 | Coloured paper / spray paint | Optional | [quote locally] | Make enclosure look professional |

---

## Budget Summary

| Category | Items | Est. Range (BDT) |
|----------|-------|-------------------|
| Core Electronics (#1-13) | ESP32 ×2, sensors, OLED, relay, LEDs, buzzer, buttons, resistors, breadboard, perfboard, jumpers, headers | [quote locally — est. 2500-4000] |
| Actuator (#14 or 15) | Fan or LED strip | [quote locally — est. 200-500] |
| Power & Cables (#16-18) | USB cables, charger, extension | Likely FREE (check at home) |
| Tools (#19-23) | Soldering iron, solder, multimeter | Likely FREE (university lab) or [quote locally — est. 500-1000] |
| Enclosure (#24-29) | Box, glue, zip ties, tape, labels | [quote locally — est. 300-500] |
| **Total Estimate** | | **~3000-5500 BDT** |

> [!NOTE]
> The core electronics should fit within the 2-3k BDT judge budget. Team contribution covers tools (if needed) and enclosure materials. Buy core electronics on Day 1. Buy enclosure materials in Week 3 when you know what size enclosure you need.

---

## Shopping Strategy

1. **Day 1 (Nov 12 evening):** Make a shopping list from Core Electronics + Actuator columns. Assign one person to buy in person from Elephant Road or order on Daraz (if 1-2 day delivery)
2. **Day 2-3 (Nov 13-14):** Confirm all components arrived and tested. Flash both ESP32 boards to verify they work
3. **Week 3 (Dec 1-2):** Buy enclosure materials based on actual perfboard size and layout
4. **Emergency spares:** If a component dies during development, the spare ESP32 and spare LEDs/buttons are ready. For other components, plan a 1-day emergency shopping trip budget

