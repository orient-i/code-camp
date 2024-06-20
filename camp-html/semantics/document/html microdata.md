### 前言

微数据，即在原有的 HTML 元素基础上，通过设置若干专门给机器识别的 HTML 属性，让搜索引擎可以更好地理解这一块的数据。

### 示例

```html
<h1>对象</h1>
```

不同的人看到“对象”有可能会有不同的理解：恋人、数据类型、象棋。但如果有上下文，这种歧义将会被消除：

```html
<h1>对象</h1>
<p>名字：影心</p>
<p>身高：165cm</p>
<p>体重：55kg</p>
```

但对于搜索引擎来说，即使有上下文存在，依旧没有足够的智能推断出这里“对象”的真实意义。这时，<span style="color: #2673dd">微数据</span>可以帮助搜索引擎确认代码的真实意图：

```html
<div itemscope itemtype="https://schema.org/Person">
  <h1>对象</h1>
  <p>名字：<span itemprop="name">影心</span></p>
  <p>身高：<span itemprop="height">165 cm</span></p>
  <p>体重：<span itemprop="weight">55 kg</span></p>
</div>
```

对于上面的 HTML 片段，搜索引擎可以提取出以下的数据：

```javascript
{
  "@type": "Person",
  "name": "影心",
  "height": "165cm",
  "weight": "55kg"
}
```

搜索引擎会根据结构化数据了解网页上的内容，并使这些内容以更丰富的形式显示搜索结果，即“富媒体搜索结果”。比如下面这是一个包含有效结构化数据的食谱网页和它在 `Google` 搜索结果中的呈现效果：

<img src="https://developers.google.com/static/search/docs/images/recipe02.png?hl=zh-cn" />

```html
<!-- 这是另一种结构化数据方式：JSON-LD -->
<html>
  <head>
    <title>Apple Pie by Grandma</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": "Apple Pie by Grandma",
        "author": "Elaine Smith",
        "image": "https://images.edge-generalmills.com/56459281-6fe6-4d9d-984f-385c9488d824.jpg",
        "description": "A classic apple pie.",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "7462",
          "bestRating": "5",
          "worstRating": "1"
        },
        "prepTime": "PT30M",
        "totalTime": "PT1H30M",
        "recipeYield": "8",
        "nutrition": {
          "@type": "NutritionInformation",
          "calories": "512 calories"
        },
        "recipeIngredient": [
          "1 box refrigerated pie crusts, softened as directed on box",
          "6 cups thinly sliced, peeled apples (6 medium)"
        ]
      }
    </script>
  </head>
  <body></body>
</html>
```

> 基于结构化数据的更多特殊呈现，可以在这份<a href="https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn">谷歌开发文档</a>中找到。

### 语法

和微数据相关的所有 HTML 属性如下：

- `itemscope`：创建 `Item` 并定义与之关联的 `itemType` 的范围。
- `itemtype`：指定将用于在数据结构中定义 `itemprop` 的词汇表的 URL。
- `itemprop`：向 `Item` 里添加属性。
- `itemid`：`Item` 的唯一全局标识符。
- `itemref`：关联不在 `itemscope` 定义范围内的属性。

##### itemtype

由于结构化数据是给机器阅读的，所以必须要使用机器能够理解的“词汇”。前面例子中用到的 `https://schema.org` 是一个由谷歌、微软、雅虎、Yandex 创建的开源社区组织，致力于在互联网、网页、电子邮件等平台上创建、维护和推广结构化数据的模式。由于大厂的支持和社区的推送，这个网站所共享的词汇表已经成为某种实时标准，目前已经有超过 1000 万个网站使用 `schema.org` 定义的微数据结构来开发网页、发送邮件等。

一张词汇表通常会带有下面这些信息：

- 词汇表所描述内容的范围。比如有的词汇表用于描述人（Person、ProfilePage），有的词汇表用于描述物（Place、Event、Music、WebSite）。
- 词汇表的权威 URL，这个 URL 将会用在 `itemtype` 上。
- 词汇表的属性列表，包括每一个属性的命名、预期类型、具体含义，这些属性会用在 `itemprop` 上。
- 词汇表的唯一全局标识符（不是词汇表的必带内容，只有部分词汇表才有）

前面例子用的 <a href="https://schema.org/Person">Person</a> 词汇表的信息如下：

> Person
> A person (alive, dead, undead, or fictional).
> | Property | Expected Type | Description |
> | :-------: | :----------------------------------: | :---------: |
> | name | Text | The name of the item. |
> | height | Distance or QuantitativeValue | The height of the item. |
> | weight | QuantitativeValue | The weight of the product or person. |
> | birthDate | Date | Date of birth. |
> | birthPlace | Place | The place where the person was born. |
> | ... | ... | ... |

此外，<a href="https://schema.org">Schema.org</a> 还提供了一个<a href="https://validator.schema.org/">语法检查工具</a>来检查代码中的微数据语法是否正确：
<img src="">

##### itemprop

一般来说，微数据属性会提取 HTML 标签的文本内容作为它的值，比如前面的例子里，`name` 的值就是文本内容“影心”，但也有些特殊标签的取值逻辑略微有些差别：

```html
<!-- src 的内容将作为 image 属性的值 -->
<p><img itemprop="image" src="https://xxx.com/profilepage" alt="个人主页" /></p>
<!-- href 的内容将作为 url 属性的值 -->
<p><a itemprop="url" href="https://xxx.com/music">音乐</a></p>
```

所有的特殊情况如下表所示：

> |                  Element                  |           Value            |
> | :---------------------------------------: | :------------------------: |
> |                   meta                    | content attribute's value  |
> | audio/embed/iframe/img/source/track/video |   src attribute's value    |
> |                a/area/link                |   href attribute's value   |
> |                  object                   |   data attribute's value   |
> |                data/meter                 |  value attribute's value   |
> |                   time                    | datetime attribute's value |
>
> 更多处理细节请看<a href="https://html.spec.whatwg.org/multipage/microdata.html#values">微数据值的处理模型。</a>

##### itemid

有些东西是独一无二的，比如说每一本正规出版的书，都会有独属于它自己的 isbn 码（国际标准书号），这个 isbn 码就能代表它。如果一张词汇表描述的内容也有类似的唯一编码，那么这张词汇表就能支持全局标识符。在微数据中，全局标识符使用 `itemid` 表示。

```html
<dl
  itemscope
  itemtype="https://www.example.com"
  itemid="urn:isbn:9788432127335"
>
  <dt>标题</dt>
  <dd itemprop="name">神秘岛</dd>
  <dt>作者</dt>
  <dd itemprop="author">儒勒·凡尔纳</dd>
</dl>
```

##### itemref

有些属性不在 `itemscope` 定义的范围内，此时可以使用 `itemref` 来关联外部的属性：

```html
<div id="x">
  <p itemprop="a">1</p>
</div>
<div itemscope itemref="x">
  <p itemprop="b">2</p>
</div>
```

上面这种情况下，`a` 属性会被添加到 `Item` 中：
<img src="">

### 结构化数据的其他格式

除了微数据之外，还有一些别的格式可用于帮助搜索引擎提取页面中的结构化数据：

- JSON-LD：<b>最推荐使用的方式</b>。在一个 `type="application/ld+json"` 的 `script` 标签下使用 JSON 直接表示页面里的结构化数据。

  ```html
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "影心",
      "height": "165cm",
      "weight": "55kg"
    }
  </script>
  ```

- RDFa：使用 XML 相关属性表示页面中的结构化数据。

  ```html
  <div vocab="https://schema.org/" typeof="Person">
    <h1 property="identifier">对象</h1>
    <p>名字：<span property="height">影心</span></p>
    <p>身高：<span property="height">165 cm</span></p>
    <p>体重：<span property="weight">55 kg</span></p>
  </div>
  ```

- Microformat：<a href="https://developer.mozilla.org/zh-CN/docs/Web/HTML/microformats">微格式</a>，通过操作 HTML 属性 —— `class` 来表示页面中的结构化数据。

谷歌搜索引擎支持上述所有格式，<a href="https://schema.org/">Schema.org</a> 的每张词汇表都支持微数据、JSON-LD、RDFa 这三种格式。

> 微数据适用于对 SEO 非常重视的产品，而且主要针对的是谷歌、微软、雅虎等外国的搜索引擎。

### 参考资料

<a href="https://juejin.cn/post/7170149532502589476">一文读懂 HTML 微数据</a>
