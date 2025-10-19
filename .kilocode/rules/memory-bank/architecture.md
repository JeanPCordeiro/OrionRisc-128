# OrionRisc-128 - System Architecture

## System Architecture Overview

The OrionRisc-128 follows a layered bootstrapping architecture that builds complexity progressively. Each layer serves as the foundation for the next, creating a self-hosting development environment.

### Layer 1: Hardware Emulation Layer
**Technology**: JavaScript/Node.js with browser rendering
**Purpose**: Provides the foundational hardware simulation
**Components**:
- Processor emulation core
- Memory management system (128KB RAM)
- Graphics subsystem (640x200 monochrome)
- Storage subsystem (2x 360KB floppy disks)
- I/O device abstraction

### Layer 2: Machine Language Foundation
**Technology**: Direct binary instruction format
**Purpose**: Bootstrap development capability
**Components**:
- RISC instruction set architecture (ISA)
- Machine code programming tools
- Basic debugging facilities
- Memory layout definitions

### Layer 3: Self-Hosted Assembler
**Technology**: Machine language (built in Layer 2)
**Purpose**: Enable symbolic assembly programming
**Components**:
- Assembly language parser
- Machine code generation
- Symbol table management
- Assembly directives support

### Layer 4: C Compiler
**Technology**: C (compiled with Layer 3 assembler)
**Purpose**: High-level systems programming capability
**Components**:
- C preprocessor
- C parser and semantic analysis
- Code generation for RISC target
- Standard library implementation

### Layer 5: BASIC Interpreter
**Technology**: BASIC (written in Layer 4 C)
**Purpose**: User-friendly programming environment
**Components**:
- BASIC language parser
- Runtime execution environment
- Program editing facilities
- Error handling and debugging

### Layer 6: Operating System
**Technology**: C (using Layer 4 compiler)
**Purpose**: System management and program execution
**Components**:
- Program loading and execution
- File system management
- Memory allocation
- Device I/O coordination

## Source Code Organization

```
orionrisc-128/
├── src/
│   ├── hardware/           # Layer 1: Hardware emulation
│   │   ├── processor.js    # RISC processor core
│   │   ├── memory.js       # Memory management (128KB)
│   │   ├── graphics.js     # 640x200 graphics system
│   │   ├── storage.js      # Floppy disk emulation
│   │   └── io.js          # I/O device abstraction
│   │
│   ├── assembler/          # Layer 3: Self-hosted assembler
│   │   ├── assembler.bin   # Machine code assembler
│   │   ├── asm_parser.js   # Assembly parser utilities
│   │   └── symbol_table.js # Symbol management
│   │
│   ├── compiler/           # Layer 4: C compiler
│   │   ├── cpp/           # C preprocessor
│   │   ├── parser/        # C language parser
│   │   ├── codegen/       # RISC code generation
│   │   └── libc/          # Standard library
│   │
│   ├── basic/             # Layer 5: BASIC interpreter
│   │   ├── parser.js      # BASIC language parser
│   │   ├── runtime.js     # Execution environment
│   │   └── editor.js      # Program editor
│   │
│   └── os/                # Layer 6: Operating system
│       ├── kernel.c       # Core OS functionality
│       ├── fs.c           # File system
│       ├── process.c      # Program management
│       └── devices.c      # Device drivers
│
├── tools/
│   ├── emulator.html      # Browser-based emulator UI
│   └── dev_tools.js       # Development utilities
│
└── docs/
    ├── isa.md            # Instruction set architecture
    ├── assembly.md       # Assembly programming guide
    └── c_guide.md        # C programming guide
```

## Key Technical Decisions

### RISC Architecture Choice
- **Decision**: Custom RISC ISA design
- **Rationale**: Simplicity for educational purposes, easier to understand and implement
- **Impact**: Reduced instruction complexity, clearer compiler targets

### Bootstrapping Methodology
- **Decision**: Progressive layer-by-layer development
- **Rationale**: Demonstrates self-hosting principles, no external toolchain dependency
- **Impact**: Each layer must be completed before the next can be developed

### JavaScript Emulation Platform
- **Decision**: Node.js with browser rendering
- **Rationale**: Cross-platform compatibility, visual output capability, existing expertise
- **Impact**: Web-based interface, easier distribution and demonstration

### Memory Constraints
- **Decision**: Strict 128KB RAM limit
- **Rationale**: Authentic 1980s computing experience, encourages efficient design
- **Impact**: Careful memory management required throughout all layers

## Design Patterns in Use

### Layered Architecture Pattern
- Clear separation between hardware abstraction and software layers
- Each layer provides services to the layer above
- Dependencies flow downward only

### Bootstrap Pattern
- Each development tool is used to build the next more sophisticated tool
- Demonstrates principles of self-hosting systems
- Requires careful sequencing of component development

### Emulator Pattern
- Hardware components are simulated in software
- Provides deterministic behavior for educational purposes
- Enables debugging and inspection at all levels

## Component Relationships

### Hardware-Software Interface
- Hardware emulation layer provides the foundation
- All upper layers depend on hardware simulation
- Clear interface boundaries between layers

### Development Tool Chain
- Assembler depends on machine language foundation
- C compiler depends on assembler capability
- BASIC interpreter depends on C compiler
- OS depends on C compiler and runtime

### Execution Flow
- Hardware emulation runs continuously
- OS manages program loading and execution
- Development tools run within the emulated environment
- User programs execute on the simulated hardware

## Critical Implementation Paths

### Phase 1: Hardware Foundation
1. Implement basic processor emulation with minimal instruction set
2. Create memory management system
3. Add graphics output capability
4. Implement storage device simulation

### Phase 2: Machine Language Tools
1. Define complete RISC instruction set
2. Create machine code programming utilities
3. Implement basic debugging facilities
4. Test processor with simple programs

### Phase 3: Assembler Development
1. Write assembler in machine language
2. Implement assembly parsing and code generation
3. Add symbol table and linking capabilities
4. Test assembler with complex programs

### Phase 4: C Compiler Construction
1. Implement C preprocessor using assembler
2. Create C parser and semantic analyzer
3. Develop RISC code generation backend
4. Build minimal standard library

### Phase 5: System Software
1. Implement BASIC interpreter in C
2. Create basic operating system kernel
3. Add file system and device management
4. Integrate all components into cohesive system

## Architecture Constraints

### Educational Focus
- Code clarity prioritized over performance
- Comprehensive documentation at each layer
- Visible intermediate representations
- Debugging capabilities at all levels

### Authenticity Requirements
- Faithful reproduction of 1980s constraints
- Realistic performance characteristics
- Period-appropriate interface design
- Hardware limitations must be respected

### Self-Hosting Requirements
- Each layer must be buildable using previous layers
- No external toolchain dependencies
- Progressive enhancement of capabilities
- Bootstrap process must be well-defined