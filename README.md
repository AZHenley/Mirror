# Mirror: An LLM-powered programming-by-example programming language.

For more details, see the [blog post](https:austinhenley.com/blog/mirrorlang.html).

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
