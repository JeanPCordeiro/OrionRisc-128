# OrionRisc-128 Instruction Set Architecture (ISA)

## Overview

The OrionRisc-128 processor implements a custom 16-bit RISC architecture designed for educational purposes. The ISA emphasizes simplicity, orthogonality, and clear binary encoding while maintaining sufficient capability for self-hosting development tools.

## Architecture Characteristics

- **Word Size**: 16 bits
- **Memory**: 128KB addressable (17-bit address space)
- **Registers**: 8 general-purpose registers (R0-R7)
- **Instruction Format**: Fixed 16-bit instructions
- **Addressing Modes**: Immediate, direct, register, register-indirect

## Register Set

| Register | Usage | Description |
|----------|-------|-------------|
| R0 | Zero/Stack Pointer | Always reads as 0, writes ignored |
| R1 | Stack Pointer | Stack pointer for function calls |
| R2 | Frame Pointer | Frame pointer for local variables |
| R3 | Return Address | Return address for function calls |
| R4-R7 | General Purpose | General purpose registers |

## Instruction Format

All instructions are 16 bits wide with the following format:

```
15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
+-----+-----+-----+-----+-----+-----+-----+-----+
|   Opcode  |   Rd  |   Rs  |         Imm       |  Register Format
+-----+-----+-----+-----+-----+-----+-----+-----+

15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
+-----+-----+-----+-----+-----+-----+-----+-----+
|   Opcode  |   Rd  |   Rs  |     Immediate     |  Immediate Format
+-----+-----+-----+-----+-----+-----+-----+-----+
```

## Opcode Map

### Arithmetic Operations (Opcode 0x0-0x3)

| Opcode | Mnemonic | Format | Description |
|--------|----------|--------|-------------|
| 0x00 | ADD Rd, Rs, Imm | Register | Rd = Rs + Imm |
| 0x01 | SUB Rd, Rs, Imm | Register | Rd = Rs - Imm |
| 0x02 | MUL Rd, Rs, Imm | Register | Rd = Rs * Imm |
| 0x03 | DIV Rd, Rs, Imm | Register | Rd = Rs / Imm |

### Logical Operations (Opcode 0x4-0x7)

| Opcode | Mnemonic | Format | Description |
|--------|----------|--------|-------------|
| 0x04 | AND Rd, Rs, Imm | Register | Rd = Rs & Imm |
| 0x05 | OR Rd, Rs, Imm | Register | Rd = Rs \| Imm |
| 0x06 | XOR Rd, Rs, Imm | Register | Rd = Rs ^ Imm |
| 0x07 | NOT Rd, Rs | Register | Rd = ~Rs |

### Memory Operations (Opcode 0x8-0xB)

| Opcode | Mnemonic | Format | Description |
|--------|----------|--------|-------------|
| 0x08 | LD Rd, [Rs+Imm] | Register | Rd = Memory[Rs + Imm] |
| 0x09 | ST [Rd+Imm], Rs | Register | Memory[Rd + Imm] = Rs |
| 0x0A | LDI Rd, Imm | Immediate | Rd = Imm (sign extended) |
| 0x0B | LDA Rd, Imm | Immediate | Rd = Imm (address load) |

## Control Flow Operations (Opcode 0xC-0xF)

| Opcode | Mnemonic | Format | Description |
|--------|----------|--------|-------------|
| 0x0C | JMP Imm | Immediate | PC = Imm |
| 0x0D | JZ Rd, Imm | Register | if Rd == 0: PC = Imm |
| 0x0E | JNZ Rd, Imm | Register | if Rd != 0: PC = Imm |
| 0x0F | CALL Rd | Register | R3 = PC, PC = Rd |

## I/O Operations (Opcode 0x10-0x13)

| Opcode | Mnemonic | Format | Description |
|--------|----------|--------|-------------|
| 0x10 | IN Rd, Imm | Register | Rd = Device[Imm] |
| 0x11 | OUT Imm, Rs | Register | Device[Imm] = Rs |
| 0x12 | HALT | - | Halt processor |
| 0x13 | NOP | - | No operation |

## Detailed Instruction Specifications

### ADD - Add Immediate
- **Opcode**: 0x00
- **Format**: Register (Rd = Rs + Imm)
- **Operation**: Rd ← Rs + Imm (16-bit signed)
- **Flags**: Carry, Overflow, Zero, Negative

### SUB - Subtract Immediate
- **Opcode**: 0x01
- **Format**: Register (Rd = Rs - Imm)
- **Operation**: Rd ← Rs - Imm (16-bit signed)
- **Flags**: Carry, Overflow, Zero, Negative

### MUL - Multiply
- **Opcode**: 0x02
- **Format**: Register (Rd = Rs * Imm)
- **Operation**: Rd ← Rs * Imm (16-bit signed, 32-bit result truncated)
- **Flags**: Overflow, Zero

### DIV - Divide
- **Opcode**: 0x03
- **Format**: Register (Rd = Rs / Imm)
- **Operation**: Rd ← Rs / Imm (16-bit signed division)
- **Flags**: Overflow, Zero

### LD - Load Memory
- **Opcode**: 0x08
- **Format**: Register (Rd = [Rs + Imm])
- **Operation**: Rd ← Memory[Rs + Imm]
- **Addressing**: 16-bit address calculation

### ST - Store Memory
- **Opcode**: 0x09
- **Format**: Register ([Rd + Imm] = Rs)
- **Operation**: Memory[Rd + Imm] ← Rs

### LDI - Load Immediate
- **Opcode**: 0x0A
- **Format**: Immediate (Rd = Imm)
- **Operation**: Rd ← SignExtend(Imm)
- **Range**: -128 to 127

### LDA - Load Address
- **Opcode**: 0x0B
- **Format**: Immediate (Rd = Imm)
- **Operation**: Rd ← ZeroExtend(Imm)
- **Range**: 0 to 65535

### JMP - Jump Unconditional
- **Opcode**: 0x0C
- **Format**: Immediate
- **Operation**: PC ← Imm

### JZ - Jump if Zero
- **Opcode**: 0x0D
- **Format**: Register
- **Operation**: if Rd == 0: PC ← Imm

### JNZ - Jump if Not Zero
- **Opcode**: 0x0E
- **Format**: Register
- **Operation**: if Rd != 0: PC ← Imm

### CALL - Call Subroutine
- **Opcode**: 0x0F
- **Format**: Register
- **Operation**: R3 ← PC, PC ← Rd

### IN - Input from Device
- **Opcode**: 0x10
- **Format**: Register
- **Operation**: Rd ← Device[Imm]
- **Devices**:
  - 0x00: Keyboard input
  - 0x01: Timer value
  - 0x02: Random number

### OUT - Output to Device
- **Opcode**: 0x11
- **Format**: Register
- **Operation**: Device[Imm] ← Rs
- **Devices**:
  - 0x00: Console output
  - 0x01: Graphics control
  - 0x02: Disk control

## Memory Layout

```
0x0000 - 0x1FFFF: 128KB RAM
+-----------------+
| Program Code    | 0x0000
|                 |
| Data Section    |
|                 |
| Stack (grows)   | 0x1FFFF
+-----------------+
```

## Assembly Syntax

```
; Arithmetic
ADD R1, R2, 10    ; R1 = R2 + 10
SUB R3, R4, 5     ; R3 = R4 - 5

; Memory
LD R1, [R2+100]   ; R1 = Memory[R2 + 100]
ST [R0+200], R1   ; Memory[R0 + 200] = R1

; Control Flow
JZ R1, label      ; if R1 == 0 jump to label
CALL R5           ; call subroutine at R5

; I/O
IN R1, 0          ; read from keyboard
OUT 0, R1         ; write to console
```

## Binary Encoding Examples

### Register Format Instructions
```
15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
+-----+-----+-----+-----+-----+-----+-----+-----+
|  Opcode   |   Rd  |   Rs  |   Immediate       |
+-----+-----+-----+-----+-----+-----+-----+-----+
  0  0  0  0    0  1    1  0      0  0  0  0 1 0 1 0
  |     |     |     |     |     |     |     |     |
  |     |     |     |     |     |     |     |     +-- 0x0A
  |     |     |     |     |     |     |     +-------- 0x05
  |     |     |     |     |     |     +-------------- R2 (0x2)
  |     |     |     |     |     +-------------------- R1 (0x1)
  +----------------------------------------------- Opcode 0x00 (ADD)

ADD R1, R2, 0x05
```

### Immediate Format Instructions
```
15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
+-----+-----+-----+-----+-----+-----+-----+-----+
|  Opcode   |   Rd  |         Immediate         |
+-----+-----+-----+-----+-----+-----+-----+-----+
  0  0  0  0    0  1          0  0  0  0 0 0 0 1
  |     |     |     |          |     |     |     |
  |     |     |     |          |     |     |     +-- 0x01
  |     |     |     |          |     |     +-------- 0x00
  |     |     |     |          |     +-------------- 0x00
  |     |     |     |          +-------------------- 0x00
  |     |     |     +----------------------------- 0x00
  |     |     +----------------------------------- R1 (0x1)
  +----------------------------------------------- Opcode 0x00 (ADD)

LDI R1, 0x01
```

## Design Rationale

### Educational Focus
- Simple, consistent instruction format
- Clear binary encoding for easy understanding
- Sufficient capability for self-hosting
- Orthogonal instruction set

### 1980s Constraints
- 16-bit architecture fits memory limitations
- Simple addressing modes for easy implementation
- No complex features that would obscure fundamentals

### Self-Hosting Requirements
- Sufficient instruction set for compiler development
- Stack-based calling convention for function support
- I/O operations for system interaction
- Memory management capabilities

## Implementation Notes

- All arithmetic operations are 16-bit signed integers
- Division by zero triggers hardware exception
- Memory access is byte-addressable
- I/O operations may block on device availability
- Stack grows downward from 0x1FFFF