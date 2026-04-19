(let hyphen 45)
(let backslash 92)
(let double_quote 34)
(let single_quote 39)
(let backtick 96)
(let open_paren 40)
(let close_paren 41)
(let open_bracket 91)
(let close_bracket 93)
(let open_brace 123)
(let close_brace 125)
(let tilde 126)
(let exclamation 33)
(let at 64)
(let hash 35)
(let dollar 36)
(let percent 37)
(let caret 94)
(let ampersand 38)
(let asterisk 42)
(let equals 61)
(let plus 43)
(let slash 47)
(let pipe 124)
(let colon 58)
(let semicolon 59)
(let less_than 60)
(let greater_than 62)
(let question 63)
(let space 32)
(let tab 9)
(let form_feed 12)
(let num_0 48)
(let num_1 49)
(let num_2 50)
(let num_3 51)
(let num_4 52)
(let num_5 53)
(let num_6 54)
(let num_7 55)
(let num_8 56)
(let num_9 57)

(grammar sexp)

(let keywords
  (union 
    (match keyword.other
      (choice "let" "nominal" "module"))
    (match keyword.other.type
      (choice "pi" "sigma" "inductive" "type"))
    (match keyword.other.expr
      (choice "lambda" "record" "ffi"))
    (match variable.other.constant
      (choice "true" "false"))
    (match keyword.comment.unobtrusive
      "comment")
    (match keyword.control
      (choice "match" "if" "loop" "break" "continue"))
    (match keyword.control.unobtrusive
      (choice "scope"))))

(let identifier 
  (match variable.name
    (negative
      (choice space hyphen backslash double_quote single_quote backtick open_paren close_paren open_bracket close_bracket open_brace close_brace tilde exclamation at hash dollar percent caret ampersand asterisk equals plus slash pipe colon semicolon less_than greater_than question tab form_feed))))

(let delimiter.unobtrusive
  (match unobtrusive
    (choice open_paren close_paren open_brace close_brace open_bracket close_bracket)))

(let interpolation
  (surround scope.sexp
    open_brace delimiter.unobtrusive
    close_brace delimiter.unobtrusive
    sexp))


(let string
  (surround string.interpolated
    double_quote (union)
    double_quote (union)
    interpolation))


(let digit (choice num_0 num_1 num_2 num_3 num_4 num_5 num_6 num_7 num_8 num_9))

(let integer
  (match constant.numeric 
    (concat digit (repeat digit))))