### 前言

微数据，即在原有的 HTML 元素基础上，通过设置若干专门给机器识别的 HTML 属性，让搜索引擎可以更好地理解这一块的数据。

### 示例

```html
<h1>对象</h1>
```

不同的人看到“对象”有可能会有不同的理解：恋人、数据类型、象棋。但如果有上下文，这种歧义将会被消除：

```html
<h1>对象</h1>
<p>姓名：影心</p>
<p>身高：165cm</p>
<p>体重：55kg</p>
```

但对于搜索引擎来说，即使有上下文存在，依旧没有足够的智能推断出这里“对象”的真实意义。这时，<span style="color: #2673dd">微数据</span>可以帮助搜索引擎确认代码的真实意图：

```html
<div itemscope itemtype="https://schema.org/Person">
  <h1>对象</h1>
  <p>姓名：<span itemprop="name">影心</span></p>
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

有了这种结构化数据之后，搜索引擎就可以更准确地理解页面内容，给页面建立更加精细的分类，提供更加准确的搜索结果。

> 基于结构化数据的特殊呈现，可以在这份<a href="https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn">谷歌开发文档</a>中找到。

### 使用

和微数据相关的所有 HTML 属性如下：

- `itemscope`：创建 `Item` 并定义与之关联的 `itemType` 的范围。
- `itemtype`：指定将用于在数据结构中定义 `itemprop` 的词汇表的 URL。
- `itemprop`：向 `Item` 里添加属性。
- `itemid`：`Item` 的唯一全局标识符。
- `itemref`：xxx

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

此外，<a href="https://schema.org">Schema.org</a> 还提供了一个<a href="https://validator.schema.org/">语法检查工具</a>来检查代码中的微数据语法是否正确。

##### itemprop

一般来说，微数据属性会提取元素后代的文本内容作为它的值，比如前面的例子里，`name` 的值就是文本内容“影心”。
https://juejin.cn/post/7170149532502589476#heading-4
