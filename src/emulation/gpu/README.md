# Graphics Processing Unit (GPU) - OrionRisc-128

Complete graphics emulation system providing 640x200 monochrome display capabilities with 80x25 text mode support.

## Overview

The GPU module implements a complete graphics processing system for the OrionRisc-128 computer emulation. It provides:

- **640x200 monochrome frame buffer** - High-resolution graphics display
- **80x25 text mode** - Character-based display with full ASCII support
- **Memory-mapped I/O interface** - Direct hardware access for CPU
- **Real-time rendering** - 60 FPS display updates
- **WebSocket integration** - Live display to frontend interface

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  GraphicsProcessingUnit                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │              FrameBuffer                        │    │
│  │  • 640x200 pixel memory management              │    │
│  │  • Double buffering for smooth updates          │    │
│  │  • Memory-mapped I/O registers                  │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │             CharacterROM                        │    │
│  │  • 8x8 pixel character definitions              │    │
│  │  • Complete ASCII character set (0-255)         │    │
│  │  • Character attribute support                  │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │          GraphicsPrimitives                     │    │
│  │  • Pixel plotting and line drawing              │    │
│  │  • Circle, ellipse, and polygon rendering       │    │
│  │  • Bitmap/sprite support                        │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │            TextModeEngine                       │    │
│  │  • 80x25 character display emulation            │    │
│  │  • Text scrolling and cursor management         │    │
│  │  • Character attribute handling                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Components

### FrameBuffer (`frame-buffer.js`)

Manages the 640x200 pixel memory space with efficient bit-packed storage:

```javascript
const FrameBuffer = require('./frame-buffer');
const fb = new FrameBuffer();

// Pixel operations
fb.setPixel(100, 100, true);     // Set pixel (x, y, value)
fb.getPixel(100, 100);          // Get pixel value

// Graphics operations
fb.drawHorizontalLine(0, 100, 50, true);
fb.drawVerticalLine(50, 0, 100, true);
fb.fillRectangle(10, 10, 50, 30, true);

// Buffer management
fb.swapBuffers();               // Double buffering
fb.scrollUp(5);                 // Scroll display
```

**Key Features:**
- 640x200 monochrome pixels (80 bytes per row)
- Double buffering for smooth updates
- Memory-mapped I/O register interface
- Efficient bit-packed memory layout

### CharacterROM (`character-rom.js`)

Provides 8x8 pixel character definitions for the complete ASCII character set:

```javascript
const CharacterROM = require('./character-rom');
const charRom = new CharacterROM();

// Get character bitmap
const bitmap = charRom.getCharacterBitmap(65); // 'A'

// Render character to frame buffer
charRom.renderCharacter(frameBuffer, x, y, charCode, foreground, background, attributes);
```

**Key Features:**
- Complete ASCII character set (0-255)
- 8x8 pixel character definitions
- Character attribute support (bold, reverse, underline, blink)
- Extended character set for graphics and international characters

### GraphicsPrimitives (`graphics-primitives.js`)

Low-level graphics functions optimized for the frame buffer:

```javascript
const GraphicsPrimitives = require('./graphics-primitives');
const gp = new GraphicsPrimitives(frameBuffer);

// Drawing operations
gp.drawLine(0, 0, 100, 100, true);           // Bresenham line algorithm
gp.drawCircle(50, 50, 20, true);             // Circle drawing
gp.fillRectangle(10, 10, 50, 30, true);      // Filled rectangle
gp.drawTriangle(0, 0, 50, 0, 25, 50, true); // Triangle outline
gp.fillTriangle(0, 0, 50, 0, 25, 50, true); // Filled triangle
```

**Key Features:**
- Bresenham line and circle algorithms
- Polygon filling with barycentric coordinates
- Ellipse drawing support
- Bitmap/sprite rendering
- Region copying and manipulation

### TextModeEngine (`text-mode.js`)

Manages 80x25 character display with full terminal emulation:

```javascript
const TextModeEngine = require('./text-mode');
const textMode = new TextModeEngine(frameBuffer, characterRom);

// Text operations
textMode.writeString("Hello, World!", 0);
textMode.putCharacter(13); // Carriage return
textMode.putCharacter(10); // Line feed

// Cursor control
textMode.setCursorPosition(10, 5);
textMode.cursorRight(5);

// Scrolling
textMode.scrollUp(5);
textMode.setScrollRegion(0, 20);
```

**Key Features:**
- 80x25 character display (640x200 pixels)
- Full VT-style terminal emulation
- Character insertion/deletion
- Line insertion/deletion
- Scrolling regions
- Tab stop support

### GraphicsProcessingUnit (`GraphicsProcessingUnit.js`)

Main GPU class providing the complete graphics interface:

```javascript
const GraphicsProcessingUnit = require('./GraphicsProcessingUnit');
const gpu = new GraphicsProcessingUnit();

// Memory-mapped I/O
gpu.writeRegister(0x0020, 0x03); // Execute SET_PIXEL command
gpu.writeRegister(0x0024, 100);  // X coordinate
gpu.writeRegister(0x0028, 100);  // Y coordinate

// Component access
const fb = gpu.getFrameBuffer();
const tm = gpu.getTextModeEngine();
const gp = gpu.getGraphicsPrimitives();
```

**Key Features:**
- Complete memory-mapped I/O interface
- Command-driven graphics operations
- Real-time frame updates
- WebSocket frontend integration
- Interrupt handling
- Performance optimization modes

## Memory-Mapped I/O Interface

The GPU is accessed through memory-mapped I/O registers in the range `0xF000-0xF100`:

| Address | Register | Description |
|---------|----------|-------------|
| 0xF000 | GPU_CONTROL | Control register |
| 0xF004 | GPU_STATUS | Status register |
| 0xF008 | FRAME_BUFFER_START | Frame buffer start address |
| 0xF00C | FRAME_BUFFER_END | Frame buffer end address |
| 0xF010 | SCAN_LINE | Current scan line |
| 0xF014 | DISPLAY_MODE | Display mode (0=graphics, 1=text) |
| 0xF018 | CURSOR_POSITION | Text cursor position |
| 0xF01C | TEXT_MODE_CONTROL | Text mode control |
| 0xF020 | GRAPHICS_COMMAND | Graphics command register |
| 0xF024 | COMMAND_PARAM0 | Command parameter 0 |
| 0xF028 | COMMAND_PARAM1 | Command parameter 1 |
| 0xF02C | COMMAND_PARAM2 | Command parameter 2 |
| 0xF030 | COMMAND_PARAM3 | Command parameter 3 |
| 0xF034 | PALETTE_0 | Color palette 0 |
| 0xF038 | PALETTE_1 | Color palette 1 |
| 0xF03C | BORDER_COLOR | Border color |
| 0xF040 | INTERRUPT_CONTROL | Interrupt control |
| 0xF044 | INTERRUPT_STATUS | Interrupt status |

## Graphics Commands

The GPU supports the following graphics commands written to the `GRAPHICS_COMMAND` register:

| Command | Code | Description |
|---------|------|-------------|
| NO_OP | 0x00 | No operation |
| CLEAR_SCREEN | 0x01 | Clear screen |
| SWAP_BUFFERS | 0x02 | Swap front/back buffers |
| SET_PIXEL | 0x03 | Set pixel at (param0, param1) |
| DRAW_LINE | 0x04 | Draw line from (param0, param1) to (param2, param3) |
| DRAW_RECTANGLE | 0x05 | Draw rectangle |
| FILL_RECTANGLE | 0x06 | Fill rectangle |
| DRAW_CIRCLE | 0x07 | Draw circle |
| FILL_CIRCLE | 0x08 | Fill circle |
| COPY_REGION | 0x09 | Copy rectangular region |
| TEXT_WRITE_CHAR | 0x0A | Write character in text mode |
| TEXT_SET_CURSOR | 0x0B | Set cursor position |
| TEXT_CLEAR_SCREEN | 0x0C | Clear text screen |
| TEXT_SCROLL_UP | 0x0D | Scroll text up |
| TEXT_SCROLL_DOWN | 0x0E | Scroll text down |

## Usage Examples

### Basic Graphics Operations

```javascript
const { GraphicsProcessingUnit } = require('./gpu');
const gpu = new GraphicsProcessingUnit();

// Clear screen
gpu.writeRegister(0xF020, 0x01);

// Draw a line
gpu.writeRegister(0xF024, 0);   // x1
gpu.writeRegister(0xF028, 0);   // y1
gpu.writeRegister(0xF02C, 100); // x2
gpu.writeRegister(0xF030, 100); // y2
gpu.writeRegister(0xF020, 0x04); // DRAW_LINE command

// Fill a rectangle
gpu.writeRegister(0xF024, 50);  // x
gpu.writeRegister(0xF028, 50);  // y
gpu.writeRegister(0xF02C, 80);  // width
gpu.writeRegister(0xF030, 60);  // height
gpu.writeRegister(0xF020, 0x06); // FILL_RECTANGLE command
```

### Text Mode Operations

```javascript
// Set cursor position
gpu.writeRegister(0xF018, (5 << 8) | 10); // x=10, y=5

// Write text
gpu.writeRegister(0xF024, 72);  // 'H'
gpu.writeRegister(0xF020, 0x0A); // TEXT_WRITE_CHAR

// Scroll screen
gpu.writeRegister(0xF024, 5);   // 5 lines
gpu.writeRegister(0xF020, 0x0D); // TEXT_SCROLL_UP
```

### Direct Component Access

```javascript
// Access frame buffer directly
const fb = gpu.getFrameBuffer();
fb.setPixel(100, 100, true);

// Use graphics primitives
const gp = gpu.getGraphicsPrimitives();
gp.drawCircle(200, 150, 25, true);

// Text mode operations
const tm = gpu.getTextModeEngine();
tm.writeString("Hello, OrionRisc-128!", 0);
```

## Integration with System

The GPU integrates seamlessly with the existing OrionRisc-128 system:

```javascript
const EmulationLayer = require('../emulation');
const emulation = new EmulationLayer();

// GPU is automatically available through memory-mapped I/O
// Access GPU registers: 0xF000-0xF100
emulation.writeByte(0xF020, 0x03); // Execute graphics command
```

## Testing

Comprehensive test suite validates all GPU functionality:

```bash
node src/emulation/gpu/test-runner.js
```

Individual component tests:
- `test-frame-buffer.js` - Frame buffer operations
- `test-character-rom.js` - Character rendering
- `test-graphics-primitives.js` - Graphics functions
- `test-text-mode.js` - Text mode operations
- `test-gpu.js` - GPU integration

## Performance

The GPU is optimized for real-time performance:

- **60 FPS rendering** - Smooth display updates
- **Efficient memory layout** - Bit-packed frame buffer
- **Optimized algorithms** - Bresenham line/circle drawing
- **Double buffering** - Tear-free display updates
- **Performance modes** - Optional reduced frame rate for better performance

## Frontend Integration

The GPU automatically integrates with the frontend display system:

```javascript
// Connect to frontend WebSocket
gpu.connectToFrontend(websocket);

// Frame buffer updates are sent automatically
// Real-time display synchronization
```

## File Structure

```
src/emulation/gpu/
├── index.js                    # Module exports and constants
├── README.md                   # This documentation
├── GraphicsProcessingUnit.js   # Main GPU class
├── frame-buffer.js             # Frame buffer management
├── character-rom.js            # Character definitions
├── graphics-primitives.js      # Graphics functions
├── text-mode.js                # Text mode engine
├── test-runner.js              # Test suite runner
├── test-frame-buffer.js        # Frame buffer tests
├── test-character-rom.js       # Character ROM tests
├── test-graphics-primitives.js # Graphics primitives tests
├── test-text-mode.js           # Text mode tests
└── test-gpu.js                 # GPU integration tests
```

## Specifications

- **Resolution:** 640x200 monochrome pixels
- **Text Mode:** 80 columns × 25 rows
- **Memory:** 16,000 bytes frame buffer (640×200/8)
- **Colors:** Monochrome (expandable to amber/green)
- **Performance:** 60 FPS target
- **Interface:** Memory-mapped I/O (0xF000-0xF100)
- **Commands:** 15 graphics and text operations

## Future Enhancements

- Color palette expansion (amber/green monochrome)
- Hardware-accelerated sprite rendering
- Advanced text formatting (proportional fonts)
- 3D graphics primitives
- Audio integration for retro computing experience

---

*Part of the OrionRisc-128 educational computer system emulation project*