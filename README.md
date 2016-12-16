# My Custom Language-Parser

##  EE590 Homework 9 Problem 5
This is a custom Just-In-Time complier or Parser for a simple programming language.  The programming language is called 'My Custom Language' or MCL. All code files are written with the *.mcl* suffix.

This project was done for my University of Washington Graduate EE590 class as a final homework assignment. This assignment was to extend a previously created JSON parser to support a simple custom programming language capable of variable assignments, expressions, numbers, strings, arrays and JSONable objects and simple print function. This project could be written in C++ or Javascript (my choice).

For this assignment I chose to write this code in Javascript. Given our time constraint for the assignment, the flexibility and forgiving nature of Javascript made it a reasonable choice. I believe that any additional improvements made to this parser, it should be ported to a more strict language, such as C or C++. Also, had I additional time would have liked to include other programming blocks such as while loops and function declarations and calls. I had started to add those functionalities to my MCL, but unfortunately was unable to get it work properly or ran out of time.

The use of Javascript offered a simple way to tokenize the code using Regular Expressions. Once the code file was tokenized I was able to parse it into useful commands. By using the concept of a recursive descent parser, I was able to read and interpret the code file.  By using this method, my code accomplishes the task of creating a simple programming language and parser tool. It can currently store variables of type Number, Array, String, and Hash. I can assign values to each type of variable, edit them and recall them to use in simple expressions and statements. I decided to use a custom Hash module to store the variables and their respective values. This Hash module was developed from a previous assignment. All Parser errors will report the cause of error and at which line number in the mcl file the error occurred. The syntax error reporting will state what instruction or character is was expecting and what is actually received.

*For example:*
```
var x;
x.key = "value"   /* <-- missing ';'*/

print(x);
```
*(This will return a syntax error at line number 2: expecting a ';')*

It can also read print statements from code files to print variable values and plain text to the console screen.

**SYNTAX:**

Code file extension:      
  \*.mcl

Program Block:
```
start
  ...
  ...
finish
```
Declare variables:
```
var x; /*single declaration*/
var a, b, c, d; /*multiple declaration*/
```
Comments :
```
/* Current only supports single line comments */
/* Here's another comment */
/* <-- Surround comments in blocks --> */
```
Variable Assignment:
```
x = 1;              /* number */
a = 1 + 4;          /* expression */
b = [5,6,7,8];      /* array */

/* hash assignment */
c.key1 = "value1";  /* value is a string */
c.key2 = 5;         /* value is a number */
c.key3 = [1,2,3,4]; /* value is an array */
c.key4 = b;         /* value is a variable */

d = "Hello";        /* string */
d = d + " World";   /* string concatenation */
```
Print:
```
print("Hello");     /* print string */
print(a);           /* print variable */
print(2);           /* print number */
print(c.key1);      /* print hash value at key */
print("b = " + b);  /* print string concatenation */
print(b[2]);        /* print array value at index */
```
Example:
```
start
  var x, y, z; /*comment*/
  var str;
  var a;
  x = 1 + 4;
  a = 7;
  y = [5,6,7,8];

  z.user = "name";
  z.password = "pass1234"; /* not super secure :) */

  str = "foo";
  str = str + "foo";

  print(x);
  print(str + "bar");
  print("Hello World");
  print("x");
  print("y[0] = " + y[0]);
  print(y[1]);
  print(y);
  print("Number " + x);
  print(z.user + ", " + z.password);
  print(z);
  print(0.5*(-1+2/3.0));

  if(a > x) then
    print("a > x");
  end

finish
```

**Requirements:**
* NodeJS --> https://nodejs.org/en/
* Any OS that can run NodeJS will work.

How to Use:
* Clone this repository to your computer.
* Navigate to the 'js_parser' subfolder.
* From there you can run the sample 'test.mcl' code file. This file will test and show all the available syntax this parser currently supports.

**To Execute** (depending on your OS):
> node run_mcl.js test.mcl
>
> or
>
> nodejs run_mcl.js test.mcl
