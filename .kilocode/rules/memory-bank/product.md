# OrionRisc-128 - Product Definition

## Why This Project Exists

The OrionRisc-128 project exists to demonstrate the fundamental principles of computer system design by building a complete, self-hosted computer system from the ground up. In an era where complex abstractions hide the inner workings of computers, this project serves as both an educational tool and a testament to the beauty of simplicity in system design.

## Problems It Solves

### Educational Gap
Modern software development often occurs at high levels of abstraction, making it difficult for developers to understand the fundamental building blocks of computing systems. This project bridges that gap by providing a complete, working example of a computer system built from first principles.

### Understanding System Layers
The project addresses the challenge of understanding how different system layers (hardware, assembler, compiler, OS, interpreter) work together to create a functional computing environment.

### Self-Hosting Complexity
It demonstrates the bootstrapping problem in computer science - how to build a system using tools that don't yet exist - and provides a concrete solution through progressive development.

## How It Should Work

### System Architecture
The OrionRisc-128 is a simulated 1980s-style microcomputer featuring:

- **RISC Processor**: A custom-designed reduced instruction set processor
- **Memory**: 128KB RAM for program and data storage
- **Graphics**: 640x200 monochrome display with 80x25 text mode
- **Storage**: Two 360KB 3.5-inch floppy disk drives
- **Operating System**: Basic OS providing program loading, storage, and execution
- **Development Tools**: Assembler, C compiler, and BASIC interpreter

### Development Methodology
The system follows a unique bootstrapping approach:

1. **Hardware Emulation**: JavaScript provides the foundational hardware simulation
2. **Machine Language**: Direct processor instruction development
3. **Assembler**: Self-hosted assembler written in machine language
4. **C Compiler**: C compiler built using the assembler
5. **BASIC Interpreter**: BASIC interpreter written in C
6. **Progressive Enhancement**: Each layer builds upon and enhances the previous

### User Experience

#### For Learners
- Clear, step-by-step progression from hardware to high-level languages
- Visible intermediate representations at each compilation stage
- Interactive debugging and inspection capabilities
- Comprehensive documentation of design decisions

#### For Developers
- Working example of classic computer science concepts
- Reference implementation for custom processor design
- Study of compiler and interpreter construction techniques
- Understanding of operating system fundamentals

## User Experience Goals

### Simplicity and Clarity
- Clean, understandable code at every level
- Progressive disclosure of complexity
- Minimal but sufficient feature set

### Educational Value
- Each component serves as a learning resource
- Clear documentation of design trade-offs
- Working examples that can be modified and extended

### Authenticity
- Faithful reproduction of 1980s computing constraints
- Realistic performance characteristics
- Period-appropriate interface design

### Completeness
- Fully functional system from processor to high-level language
- Self-contained development environment
- No external toolchain dependencies

## Success Metrics

- **Educational Impact**: Clear demonstration of computer system layers
- **Technical Achievement**: Functional self-hosted development environment
- **Usability**: Intuitive interface for learning and experimentation
- **Maintainability**: Clean, well-documented codebase for future enhancements