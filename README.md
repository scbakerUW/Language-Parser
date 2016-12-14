# ee590 hw9 problem 5

Language-Parser

This is a custom Just-In-Time complier or Parser for a simple programming language.  The programming language is called 'My Custom Language' or MCL. All code files are written with the .mcl suffix.

This project was done for my University of Washington Graduate EE590 class as a final homework assignment. This assignment was to extend a previously created JSON parser to support a simple custom programming language capable of variable assignments, expressions, numbers, strings, arrays and JSONable objects and simple print function. This project could be written in C++ or Javascript (my choice).

For this assignment I chose to write this code in Javascript. Given our time constraint, the flexibility and forgiving nature of Javascript made it a reasonable choice. I believe that any additional improvements to this parser, it should be ported to a more strict language, such as C or C++.

Requirements:
* NodeJS --> https://nodejs.org/en/
* Any OS that can run NodeJS will work.

How to Use:
* Clone this repository to your computer.
* Navigate to the 'js_parser' subfolder.
* From there you can run the sample 'test.mcl' code file. This file will test and show all the available syntax this parser currently supports.

To Execute (depending on your OS):
> node run_mcl.js test.mcl
>
> or
>
> nodejs run_mcl.js test.mcl
