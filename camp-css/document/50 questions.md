Q1：说一下 CSS 的盒模型。
CSS 有两种盒模型 —— 标准盒模型 & 怪异盒模型，两种盒模型的区别在于宽度和高度的计算上。当同时给一个标准盒模型和一个怪异盒模型设置 200 px 的宽高时，标准盒模型的实际宽度是 `200 + border*2 + padding*2`，而怪异盒模型的实际宽度就是 `200`。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      * {
        margin: 0;
        padding: 0;
      }

      div {
        border: 1px solid #000;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        width: 200px;
        padding: 10px;
        margin: 10px;
        background-color: orange;
      }

      .one {
        box-sizing: content-box;
      }
      .two {
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="one">标准盒模型</div>
    <hr />
    <div class="two">怪异盒模型</div>
  </body>
</html>
```

---

Q2：说下 `box-sizing` 属性。
`box-sizing` 用于指定盒模型的解析方式，共有两种解析方式。默认值是 `content-box`(标准盒模型)，还可以设置为 `border-box`(怪异盒模型)。

---

Q3：CSS 选择器有哪些？哪些属性可以继承？
选择器类型：
`id` 选择器、类选择器、标签选择器、兄弟选择器(h1 + p)、子选择器(ul > li)、后代选择器(li a)、通配符选择(\*)、属性选择器([rel="external"])、伪类选择器(a:hover)。

可继承的属性：
`font-size`，`font-family`，`color`。

---

Q4：说说 CSS 选择器的权重计算规则。

1. `!important` 为第一优先级，权重最高。
2. `inline style`，如 `style="color: orange"`，权重值为 `1000`。
3. `id` 选择器，如 `#app`，权重值为 `0100`。
4. 类、伪类、属性选择器，如 `.foo, :first-child, [class="one"]`，权重值是 `0010`。
5. 通配符、子类选择器、兄弟选择器，如 `*, >, +`，权重值是 `0000`。
6. 继承样式没有权重值。

> 注意，选择器权重不是 10 进制，也不是二进制，而是 256 进制。老版本的浏览器下，数量足够多的类选择器可以覆盖掉 id 选择器。

---

Q5：`:nth-child` 和 `:nth-of-type` 选择器的差异。
前者先找位置，然后判定类型；后者根据类型来查找位置：

- `x:nth-child(n)` 先寻找的是 `x` 父元素下的第 `n` 个子元素，然后判定这个元素是否为 `x` 类型。如果是，则应用样式变更；如果不是，则不应用样式变更。
- `x:nth-of-type(n)` 寻找的是 `x` 父元素下的第 `n` 个 `x` 元素。

---

Q6：如何居中 `div`？如何居中一个浮动元素？如何居中一个绝对定位元素？
