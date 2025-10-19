# OrionRisc-128

An educational project to design and implement a complete 1980s-style computer system from scratch, demonstrating low-level systems architecture, compiler construction, and operating system design principles.

## Project Overview

OrionRisc-128 is a comprehensive learning platform that recreates the experience of building a vintage computer system from the ground up. This project serves as a hands-on educational tool for understanding:

- **Low-level systems architecture** - How processors, memory, and I/O systems work together
- **Compiler construction** - Building programming language tools from scratch
- **Operating system design** - Creating system software that manages hardware resources
- **Bootstrap development** - Building complex systems incrementally without external toolchains
- **Computer history** - Recreating the experience of 1980s computing technology

## System Architecture

The OrionRisc-128 operates as a complete computer system with:

### Hardware Components
- **RISC Processor** - Custom 32-bit RISC CPU with 16 registers
- **Memory System** - 128KB RAM with memory-mapped I/O
- **Graphics** - 640x200 monochrome display with 80x25 text mode
- **Storage** - Two 360KB floppy disk drives for program and data storage

### Software Components
- **Operating System Kernel** - Program loading, basic I/O, system initialization
- **Assembler** - Written in machine language (self-hosting)
- **C Compiler** - Written in assembly language
- **BASIC Interpreter** - Written in C (compiled)

## Development Philosophy

### Bootstrap Development Approach
The system is built progressively without external toolchains:

1. **Phase 1**: Direct machine language programming of the RISC processor
2. **Phase 2**: Machine language assembler for assembly development
3. **Phase 3**: Assembly-based C compiler for high-level language development
4. **Phase 4**: C-based BASIC interpreter for user programming

### Key Technical Decisions
- **No External Toolchains** - All development tools built within the system itself
- **JavaScript Emulation** - Complete system emulation using JavaScript and web technologies
- **Express.js Backend** - Hardware emulation server with WebSocket communication
- **Browser Frontend** - Canvas-based graphics using the authentic OrionRisc-128 frame
- **Modular Architecture** - Clear separation between hardware and software components

## Technology Stack

### Core Technologies
- **JavaScript (ES2020+)** - Primary development language for all emulation code
- **Node.js** - Runtime environment for the emulation backend
- **Express.js** - Web framework for the emulation server and API endpoints
- **WebSocket** - Real-time communication between frontend and backend
- **HTML5 Canvas** - Graphics rendering and display emulation

### Development Tools
- **Visual Studio Code** - Primary development environment
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Jest** - Unit testing framework

## Project Structure

```
orionrisc-128/
├── src/
│   ├── emulation/          # Hardware component emulation
│   │   ├── cpu/           # RISC processor implementation
│   │   ├── memory/        # Memory management unit
│   │   ├── gpu/           # Graphics processing unit
│   │   └── storage/       # Floppy disk controller
│   ├── system/            # System software
│   │   ├── os/           # Operating system kernel
│   │   ├── assembler/     # Assembly language translator
│   │   ├── compiler/      # C compiler
│   │   └── interpreter/   # BASIC interpreter
│   ├── frontend/          # Browser-based user interface
│   └── communication/     # WebSocket communication layer
├── tests/                 # Test suites for all components
├── docs/                  # Documentation and specifications
└── tools/                 # Development and build tools
```

## User Experience Goals

### For Learners
- **Interactive Learning** - See code running in real-time on emulated hardware
- **Progressive Complexity** - Start with simple programs, build to complex systems
- **Visual Feedback** - Watch the computer execute instructions step by step
- **Historical Context** - Experience computing as it was in the 1980s

### For Developers
- **Complete System View** - Understand how all components interconnect
- **Debugging Tools** - Inspect processor state, memory contents, and I/O operations
- **Performance Analysis** - Measure instruction timing and system performance
- **Extensibility** - Add new instructions, peripherals, or capabilities

## Current Status

**Pre-Implementation Phase** - Project planning and architecture design complete. Ready to begin implementation with RISC processor emulation in JavaScript.

## Educational Value

This project bridges the gap between modern programming education and low-level systems programming by providing:

- **Zero-cost entry** - Runs in any modern web browser
- **Safe experimentation** - No risk of damaging physical hardware
- **Step-by-step progression** - Build complexity gradually with clear milestones
- **Hands-on experience** - Real understanding of computer systems architecture

## Implementation Approach

- **Step-by-step development** - Each component tested before integration
- **Well-structured codebase** - Distinct files for each component
- **Comprehensive testing** - Unit tests, integration tests, and system validation
- **Progressive enhancement** - Each development phase enables the next

---

*Experience the dawn of personal computing - build your own 1980s computer system from the ground up.*
