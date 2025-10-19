# OrionRisc-128 - Technical Specifications

## Technologies Used

### Core Technologies
- **JavaScript (ES6+)**: Primary implementation language for hardware emulation
- **Node.js**: Runtime environment for server-side emulation
- **HTML5 Canvas**: Graphics rendering and display output
- **Browser APIs**: Web-based user interface and interaction

### Emulated System Technologies
- **Custom RISC ISA**: Reduced instruction set architecture design
- **Assembly Language**: Symbolic machine code programming
- **C Programming Language**: Systems programming capability
- **BASIC Interpreter**: High-level user programming environment

## Development Setup

### Development Environment
- **Node.js**: Version 16.0 or higher
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Text Editor**: VS Code or similar with JavaScript support
- **Git**: Version control system

### Project Structure
```
orionrisc-128/
├── src/                 # Source code directory
│   ├── hardware/       # Hardware emulation layer
│   ├── assembler/      # Assembly language tools
│   ├── compiler/       # C compiler implementation
│   ├── basic/         # BASIC interpreter
│   └── os/           # Operating system kernel
├── tools/             # Development and debugging tools
├── docs/             # Documentation
└── tests/            # Test suites
```

### Build Process
- **No build step required**: JavaScript files run directly in Node.js/browser
- **Hardware emulation**: Runs in both Node.js and browser environments
- **Progressive development**: Each layer tested before implementing the next

## Technical Constraints

### Hardware Limitations (Emulated)
- **Memory**: 128KB RAM (131,072 bytes)
- **Graphics**: 640x200 monochrome display
- **Text Mode**: 80x25 character display
- **Storage**: 2x 360KB floppy disk drives
- **Processor**: Custom RISC architecture with limited instruction set

### Performance Constraints
- **Educational focus**: Code clarity prioritized over performance
- **Realistic emulation**: Authentic 1980s performance characteristics
- **Browser compatibility**: Must run efficiently in web browsers
- **Memory efficiency**: Must operate within 128KB emulated RAM

### Self-Hosting Constraints
- **No external toolchain**: All tools must be built within the system
- **Progressive complexity**: Each layer builds upon previous layers
- **Bootstrap requirement**: Machine language before assembler, assembler before C compiler

## Dependencies

### Runtime Dependencies
- **Node.js**: Server-side JavaScript runtime
- **Web Browser**: Client-side execution environment
- **HTML5 Canvas API**: Graphics rendering capability

### Development Dependencies
- **No external build tools**: Self-contained development environment
- **Git**: Version control (optional but recommended)
- **Text editor**: Code editing and project management

## Tool Usage Patterns

### Development Workflow
1. **Hardware Layer**: Implement processor, memory, graphics in JavaScript
2. **Machine Language**: Write binary programs directly for testing
3. **Assembler**: Implement assembler using machine language tools
4. **C Compiler**: Build C compiler using assembler
5. **BASIC Interpreter**: Implement BASIC using C compiler
6. **OS Integration**: Create operating system using C compiler

### Testing Strategy
- **Layer-by-layer testing**: Each component tested before integration
- **Hardware emulation testing**: Verify against expected behavior
- **Cross-compilation testing**: Test tools against known good examples
- **Integration testing**: Full system testing with complete toolchain

### Debugging Approach
- **Hardware emulation debugging**: JavaScript debugging tools
- **Machine language debugging**: Direct memory and register inspection
- **Assembly debugging**: Symbol table and source mapping
- **C debugging**: Source-level debugging with compiler integration

## Platform Requirements

### Browser Compatibility
- **Graphics**: HTML5 Canvas support required
- **JavaScript**: ES6+ features (classes, modules, async/await)
- **Memory**: Sufficient browser memory for emulation
- **Performance**: Modern JavaScript engine for adequate emulation speed

### Node.js Compatibility
- **Version**: Node.js 16.0 or higher
- **Modules**: ES6 module support
- **File system**: For loading and saving disk images
- **Network**: Optional web server for browser hosting

## Security Considerations

### Sandbox Environment
- **Emulated system isolation**: Hardware emulation runs in JavaScript sandbox
- **No external dependencies**: Self-contained system reduces attack surface
- **Browser security**: Standard web security model applies

### Educational Safety
- **No real hardware interaction**: Pure software emulation
- **Controlled environment**: Predictable execution environment
- **No system modifications**: Cannot affect host system

## Performance Targets

### Emulation Speed
- **Target**: Real-time or near real-time performance
- **Minimum**: Interactive responsiveness for educational use
- **Optimization focus**: Efficient instruction decoding and memory access

### Memory Usage
- **Host system**: Minimize browser/Node.js memory footprint
- **Emulated system**: Strict 128KB RAM limitation
- **Graphics**: Efficient canvas rendering and updates

## Compatibility Goals

### Cross-Platform Support
- **Windows**: Modern browsers and Node.js
- **macOS**: Safari, Chrome, Firefox, Node.js
- **Linux**: Chrome, Firefox, Node.js
- **Mobile**: Limited support for demonstration purposes

### Future Evolution
- **Extensibility**: Architecture designed for future enhancements
- **Documentation**: Comprehensive documentation for maintainers
- **Testing**: Test suite for regression prevention