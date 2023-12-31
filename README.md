Quickly add block attributes.

### Basic Usage

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


### Setting built-in attributes

Normal user defined attributes will be set to custom attributes, e.g. `attr` will be set to `custom-attr`.

If you don't want attributes to be prefixed with `custom-`, as is the case with some built-in attributes, you can prefix the attribute name with the `@` symbol, for example: `@name`: Sets the name of the block to be named.

- `@name`: sets the block name
- `@alias`: sets the block alias.
- `@memo`: sets the block memo.
- `@bookmark`: set the bookmark of the block
- `@style`: sets the inline style of the block.

For example:

```json

{
  "Test block attr": {
    "@name": "test",
    "@alias": "Alias",
    "@memo": "Memo",
    "@bookmark": "Test",
    "@style": "font-size: 1.5em; background-color: red;"
  }
}
```


### Block Attribute Filtering

The above usage will take effect on all blocks. If you only want it to apply to specific types of blocks, you can use the filtering syntax:

```json
{
  "Example 1": {
    "attr1": "value",
    "attr2": "true"
  },
  "@type/d": {
    "Example 2": {
      "attr1": "value"
    }
  }
}
```

As shown above, the template defined under `@type/d` will only appear in the menu of document blocks. The supported block types are as follows:

| prompt | Block Type |
| -------- | ---------- |
| `@type/d`       | Document Block |
| `@type/h`       | Heading Block |
| `@type/p`    | Paragraph Block |
| `@type/l`       | List Block |
| `@type/li`       | List Item Block |
| `@type/q`    | Quote Block |
| `@type/c`       | Code Block |
| `@type/t`       | Table Block |
| `@type/s`       | Super Block |

```
