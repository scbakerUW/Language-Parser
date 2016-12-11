#!/bin/bash

if command -v nodejs >/dev/null; then
  nodejs test_parser.js "1.0 + 5.4/2"
  nodejs test_parser.js "-1e5 - -2.5"
  nodejs test_parser.js "(1+2)/((-3- -4 + 4)*5.8)"
  nodejs test_parser.js "(2*3)+(4e2)*4/3"
  nodejs test_parser.js "(2-4)/(4-(2*2))"
  nodejs test_parser.js "(1e-3)*(2e3) + 5.7"
  nodejs test_parser.js "3 ++ 5"
  nodejs test_parser.js "3 - +6"
  nodejs test_parser.js "(3 + 5 *(6/4)"
else
  node test_parser.js "1.0 + 5.4/2"
  node test_parser.js "-1e5 - -2.5"
  node test_parser.js "(1+2)/((-3- -4 + 4)*5.8)"
  node test_parser.js "(2*3)+(4e2)*4/3"
  node test_parser.js "(2-4)/(4-(2*2))"
  node test_parser.js "(1e-3)*(2e3) + 5.7"
  node test_parser.js "3 ++ 5"
  node test_parser.js "3 - +6"
  node test_parser.js "(3 + 5 *(6/4)"
fi
