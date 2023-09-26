Quickly add block attributes.

Configure block attribute templates defined in JSON in the settings. For example, if you configure the following JSON in the settings:


```json
{
  "Example1": {
    "attr1": "value",
    "attr2": "true"
  },
  "Example2": {
    "attr3": "value"
  }
}
```

Then clicking on the block icon， it will display two menus: "Example 1" and "Example 2". Clicking on "Example 1" will add custom attributes `attr1` and `attr2` to the block.

Note:

- Only english character, number, `-`, `_` are permitted as an attribute's name
- The default value for attributes can only be a string.

  For example, you should write "true" instead of true, and write "0" instead of 0.


