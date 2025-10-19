# OrionRisc-128 Frontend Interface

The Browser Frontend Interface provides users with a visual computer emulation experience for the OrionRisc-128 system.

## Overview

The frontend consists of several integrated components that work together to provide an authentic 1980s computer experience:

- **Main Interface** (`index.html`) - Authentic 1980s computer visual design
- **Terminal Emulator** (`terminal.js`) - BASIC interpreter interface with command history
- **Graphics Display** (`graphics.js`) - Canvas-based 640x200 monochrome graphics
- **Control Panel** (`controls.js`) - System power/reset controls and status monitoring
- **File Browser** (`filebrowser.js`) - Floppy disk management interface
- **WebSocket Layer** (`websocket.js`) - Real-time communication with backend
- **Main Application** (`main.js`) - Component coordination and initialization

## Features

### Visual Design
- Authentic 1980s computer appearance with retro styling
- Responsive design that works on different screen sizes
- Classic CRT monitor colors (amber/green on black)
- Beveled buttons and status indicators

### Terminal Interface
- 80x25 character display emulation
- Command history with arrow key navigation
- Text input with cursor management
- BASIC interpreter integration

### Graphics Display
- 640x200 monochrome graphics rendering
- Character ROM for text mode display
- Pixel-precise graphics emulation
- Real-time canvas updates

### System Controls
- Power on/off functionality
- System reset capability
- Memory and CPU status displays
- Debug information panel

### File Management
- Two floppy disk drive emulation
- File loading and saving operations
- Directory navigation and file browsing
- Support for multiple file formats (.bas, .asm, .com, etc.)

## Usage

### Starting the Interface

1. Open `index.html` in a modern web browser
2. The interface will automatically attempt to connect to the emulation server
3. Once connected, the system will be ready for use

### Basic Operations

1. **Power On**: Click the POWER button or press Ctrl+Shift+P
2. **Reset System**: Click the RESET button or press Ctrl+Shift+R
3. **Load Program**: Click LOAD button or press Ctrl+O
4. **Save Program**: Click SAVE button or press Ctrl+S
5. **Toggle Debug**: Click "Debug Info" or press Ctrl+Shift+D

### Terminal Usage

- Click on the terminal area to start typing
- Type BASIC commands and press Enter to execute
- Use arrow keys to navigate command history
- Press Tab for auto-completion (basic support)

### File Operations

1. **Mount Disk**: Click "Mount Disk" buttons to load disk images
2. **Browse Files**: Click on files in the file browser to select them
3. **Load Files**: Double-click files or use the LOAD button
4. **Save Files**: Use the SAVE button to save current program

## Keyboard Shortcuts

- **Ctrl+Shift+P**: Toggle system power
- **Ctrl+Shift+R**: Reset system
- **Ctrl+Shift+D**: Toggle debug panel
- **Ctrl+O**: Load program from disk
- **Ctrl+S**: Save program to disk

## Technical Details

### WebSocket Communication

The frontend communicates with the backend emulation server using WebSocket for real-time updates:

- Automatic connection management with reconnection
- Message queuing for offline scenarios
- Heartbeat mechanism for connection monitoring
- Component-specific message routing

### Component Architecture

Each component is designed to work independently but integrates seamlessly:

- **Modular Design**: Components can be used separately if needed
- **Event-Driven**: WebSocket messages trigger component updates
- **State Management**: Each component maintains its own state
- **Error Handling**: Comprehensive error handling and user feedback

### Browser Compatibility

- Modern browsers with WebSocket support
- HTML5 Canvas for graphics rendering
- ES2020+ JavaScript features
- Responsive CSS Grid/Flexbox layout

## Development

### File Structure

```
src/frontend/
├── index.html          # Main HTML interface
├── styles.css          # 1980s retro styling
├── main.js             # Application coordination
├── websocket.js        # WebSocket communication
├── terminal.js         # Terminal emulation
├── graphics.js         # Graphics display
├── controls.js         # System controls
├── filebrowser.js      # File management
└── README.md           # This documentation
```

### Adding New Features

1. Create new component JavaScript file
2. Add to HTML script loading order
3. Initialize in main.js
4. Add WebSocket message handlers if needed
5. Update this documentation

### Testing

The frontend includes comprehensive testing capabilities:

- Component state inspection
- System snapshot functionality
- Debug panel for real-time monitoring
- Error logging and reporting

## Troubleshooting

### Connection Issues

- Check that the backend emulation server is running
- Verify WebSocket URL configuration
- Check browser console for error messages
- Try refreshing the page to reconnect

### Display Issues

- Ensure browser supports HTML5 Canvas
- Check that JavaScript is enabled
- Verify CSS and JavaScript files are loading
- Try a different modern browser

### Performance Issues

- Close other browser tabs to free memory
- Reduce screen resolution if needed
- Check that hardware acceleration is enabled
- Update browser and graphics drivers

## Integration

The frontend is designed to integrate seamlessly with the existing OrionRisc-128 backend components:

- **CPU Emulation**: Real-time register and instruction monitoring
- **Memory Management**: Live memory usage and allocation display
- **Graphics Processing**: Direct GPU command integration
- **File System**: Floppy disk controller communication
- **Operating System**: System call and process monitoring

This creates a complete 1980s computer emulation experience that brings the OrionRisc-128 system to life in the browser.