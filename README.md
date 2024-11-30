# Mirror: An LLM-powered programming-by-example programming language.

For more details, see the [blog post](https://austinhenley.com/blog/mirrorlang.html).

<img width="1080" alt="mirrorplayground" src="https://github.com/user-attachments/assets/95c21c7c-1613-4d0d-a565-54115f186e80">

In the Mirror programming language, you define functions by providing sets of input-outputs pairs and you can call those functions. That is it. The entire program behavior must be specified through those examples.

```
signature is_even(x: number) -> bool
example is_even(0) -> true
example is_even(1) -> false
example is_even(222) -> true
example is_even(-99) -> false

is_even(12345)
```

<p>Using the Mirror syntax, you give the function name, parameters and their types, and the return type as well as one or more examples with the expected result. It uses a strict syntax and supports a handful of types (including lists). You can create multiple functions and chain them.</p>

<p>After parsing, the "compiler" uses an LLM to generate JavaScript that satisfies the constraints expressed by the examples. You should review the generated code to verify it is correct, or provide more examples and recompile it. When you run it, the last value will be printed.

An example of chaining functions:

```
signature foo(x: number, y: number) -> number
example foo(10, 3) = 101010
example foo(1, 1) = 1
example foo(0, 10) = 0

signature bar(x: number) -> string
example bar(9) = "length is 1"
example bar(3210) = "length is 4"

bar(foo(123, 3))
```

Example of list and of a dictionary:

```
signature foo(x: list[number]) -> number
example foo([2,9,5]) = 9
foo([6,3])

signature bar(a: string) -> dict[string, string]
example bar("food") = {"f": "1", "o": "2", "d": "1"}
bar("tree")
bar("anakin")
```
