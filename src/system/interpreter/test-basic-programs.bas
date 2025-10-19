' OrionRisc-128 BASIC Interpreter Test Programs
' These programs test various features of the BASIC interpreter

' Test Program 1: Simple arithmetic and variables
10 PRINT "=== Test Program 1: Variables and Arithmetic ==="
20 LET A = 10
30 LET B = 20
40 LET C = A + B
50 PRINT "A = "; A
60 PRINT "B = "; B
70 PRINT "C = A + B = "; C
80 PRINT

' Test Program 2: Conditional statements
90 PRINT "=== Test Program 2: Conditional Statements ==="
100 LET X = 15
110 IF X > 10 THEN PRINT "X is greater than 10"
120 IF X < 10 THEN PRINT "X is less than 10" ELSE PRINT "X is not less than 10"
130 PRINT

' Test Program 3: Loops (simplified)
140 PRINT "=== Test Program 3: Loop Demo ==="
150 LET I = 1
160 FOR I = 1 TO 5
170 PRINT "Count: "; I
180 NEXT I
190 PRINT

' Test Program 4: String handling
200 PRINT "=== Test Program 4: String Functions ==="
210 LET NAME$ = "ORIONRISC"
220 PRINT "Computer: "; NAME$
230 PRINT "Length: "; LEN(NAME$)
240 PRINT

' Test Program 5: Mathematical functions
250 PRINT "=== Test Program 5: Mathematical Functions ==="
260 LET NUM = 16
270 PRINT "Number: "; NUM
280 PRINT "Square root: "; SQR(NUM)
290 PRINT "Absolute value: "; ABS(-5)
300 PRINT "Random number: "; RND(100)
310 PRINT

' Test Program 6: Array operations
320 PRINT "=== Test Program 6: Array Operations ==="
330 DIM ARR(5)
340 LET ARR(1) = 100
350 LET ARR(2) = 200
360 PRINT "ARR(1) = "; ARR(1)
370 PRINT "ARR(2) = "; ARR(2)
380 PRINT

' Test Program 7: Subroutines
390 PRINT "=== Test Program 7: Subroutines ==="
400 GOSUB 500
410 PRINT "Back from subroutine"
420 END

' Test Program 8: Input/Output
500 PRINT "=== Test Program 8: Input/Output ==="
510 PRINT "Enter a number: "
520 INPUT NUM
530 PRINT "You entered: "; NUM
540 RETURN

' Test Program 9: Complex expressions
550 PRINT "=== Test Program 9: Complex Expressions ==="
560 LET A = 5
570 LET B = 3
580 LET C = 2
590 LET RESULT = (A + B) * C - 4
600 PRINT "Result of (A + B) * C - 4 = "; RESULT
610 PRINT

' Test Program 10: Error handling demo
620 PRINT "=== Test Program 10: Error Handling ==="
630 LET ZERO = 0
640 LET RESULT = 10 / ZERO
650 PRINT "This should not print"
660 END

' Additional test cases for specific features

' String concatenation test
1000 PRINT "=== String Test ==="
1010 LET FIRST$ = "HELLO"
1020 LET SECOND$ = "WORLD"
1030 PRINT FIRST$; " "; SECOND$
1040 PRINT

' Function test
1100 PRINT "=== Function Test ==="
1110 PRINT "SIN(0) = "; SIN(0)
1120 PRINT "COS(0) = "; COS(0)
1130 PRINT "EXP(1) = "; EXP(1)
1140 PRINT

' Character functions test
1200 PRINT "=== Character Functions Test ==="
1210 PRINT "CHR(65) = "; CHR(65)
1220 PRINT "ASC(\"A\") = "; ASC("A")
1230 PRINT

' Data reading test
1300 PRINT "=== Data Reading Test ==="
1310 READ A, B, C
1320 PRINT "Read values: "; A; ", "; B; ", "; C
1330 DATA 10, 20, 30
1340 PRINT

' Nested function calls test
1400 PRINT "=== Nested Functions Test ==="
1410 LET X = ABS(SIN(1) * 10)
1420 PRINT "ABS(SIN(1) * 10) = "; X
1430 PRINT

' Boolean logic test
1500 PRINT "=== Boolean Logic Test ==="
1510 LET A = 5
1520 LET B = 3
1530 IF A > B AND A < 10 THEN PRINT "A is between B and 10"
1540 IF A < B OR A > 0 THEN PRINT "A is either less than B or greater than 0"
1550 PRINT

' Loop with step test
1600 PRINT "=== Loop with Step Test ==="
1610 FOR I = 2 TO 10 STEP 2
1620 PRINT "I = "; I
1630 NEXT I
1640 PRINT

' Array initialization test
1700 PRINT "=== Array Initialization Test ==="
1710 DIM TESTARR(3)
1720 FOR I = 1 TO 3
1730 LET TESTARR(I) = I * I
1740 NEXT I
1750 FOR I = 1 TO 3
1760 PRINT "TESTARR("; I; ") = "; TESTARR(I)
1770 NEXT I
1780 PRINT

' String manipulation test
1800 PRINT "=== String Manipulation Test ==="
1810 LET MSG$ = "ORIONRISC-128"
1820 PRINT "Original: "; MSG$
1830 PRINT "Length: "; LEN(MSG$)
1840 PRINT "First 6 chars: "; LEFT$(MSG$, 6)
1850 PRINT "Last 5 chars: "; RIGHT$(MSG$, 5)
1860 PRINT

' Mathematical constants test
1900 PRINT "=== Mathematical Constants Test ==="
1910 PRINT "PI approximation: "; 3.14159
1920 PRINT "E approximation: "; 2.71828
1930 PRINT "Square root of 2: "; SQR(2)
1940 PRINT

' Final comprehensive test
2000 PRINT "=== Final Comprehensive Test ==="
2010 LET SUM = 0
2020 FOR I = 1 TO 10
2030 LET SUM = SUM + I
2040 NEXT I
2050 PRINT "Sum of 1 to 10 = "; SUM
2060 IF SUM = 55 THEN PRINT "Arithmetic series test PASSED"
2070 PRINT "BASIC Interpreter test complete!"
2080 END