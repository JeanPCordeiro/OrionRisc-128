# OrionRisc-128 - Technology Stack

## Core Technologies

### Emulation Platform
- **JavaScript (ES2020+)** - Primary development language for all emulation code
- **Node.js** - Runtime environment for the emulation backend
- **Express.js** - Web framework for the emulation server and API endpoints
- **WebSocket** - Real-time communication between frontend and backend

### Frontend Technologies
- **HTML5 Canvas** - Graphics rendering and display emulation
- **Web Audio API** - Sound emulation (future enhancement)
- **Modern Web Standards** - Progressive enhancement for better performance

### Development Tools
- **Visual Studio Code** - Primary development environment
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Jest** - Unit testing framework for JavaScript components

## Development Setup

### Project Structure
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

### Environment Requirements
- **Node.js 16+** - Minimum runtime version
- **Modern Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Minimum RAM** - 512MB (2GB recommended for development)
- **Screen Resolution** - 1024x768 minimum (1920x1080 recommended)

## Technical Constraints

### Bootstrap Development Philosophy
- **No External Toolchains** - All development tools built within the system itself
- **Self-Hosting Progression** - Each tool enables development of the next
- **Minimal Dependencies** - Only essential runtime dependencies allowed

### Performance Constraints
- **Emulation Speed** - Target 1MHz effective emulation speed
- **Memory Usage** - Efficient memory management for 128KB emulated RAM
- **Browser Compatibility** - Support all modern browsers without polyfills

### Code Organization
- **Modular Architecture** - Clear separation between hardware and software components
- **Interface Contracts** - Well-defined APIs between system components
- **Testable Units** - Each component designed for independent testing

## Dependencies

### Runtime Dependencies
```json
{
  "express": "^4.18.0",
  "ws": "^8.13.0",
  "canvas": "^2.11.0"
}
```

### Development Dependencies
```json
{
  "jest": "^29.5.0",
  "eslint": "^8.40.0",
  "prettier": "^2.8.8",
  "@types/node": "^18.16.0",
  "@types/express": "^4.17.17",
  "@types/ws": "^8.5.5"
}
```

## Tool Usage Patterns

### Development Workflow
1. **Component Development** - Implement individual hardware/software components
2. **Unit Testing** - Test each component in isolation
3. **Integration Testing** - Verify component interactions
4. **System Testing** - Validate complete system functionality

### Code Quality
- **ESLint Configuration** - Enforce consistent code style
- **Prettier Integration** - Automated code formatting
- **Jest Testing** - Comprehensive test coverage requirements
- **Documentation** - Inline comments and API documentation

### Version Control Strategy
- **Feature Branches** - Isolate component development
- **Pull Request Reviews** - Code review before integration
- **Semantic Versioning** - Clear version progression tracking

## Build and Deployment

### Development Server
- **Express.js Server** - Hot-reload for development
- **WebSocket Integration** - Real-time debugging capabilities
- **Static File Serving** - Frontend asset management

### Production Build
- **Minification** - JavaScript and CSS optimization
- **Asset Optimization** - Image and resource compression
- **Security Headers** - Production security best practices

## Testing Strategy

### Unit Testing
- **Component Isolation** - Test each hardware/software component independently
- **Mock Interfaces** - Simulate component interactions
- **Edge Case Coverage** - Comprehensive error condition testing

### Integration Testing
- **Component Communication** - Verify API contracts between components
- **System Integration** - Test complete system functionality
- **Performance Testing** - Validate emulation speed and resource usage

### Bootstrap Validation
- **Phase Verification** - Ensure each development phase works correctly
- **Tool Chain Testing** - Validate self-hosted development tools
- **Regression Testing** - Prevent functionality breakage during development