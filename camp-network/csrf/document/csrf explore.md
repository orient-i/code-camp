### 前言

2007 年，北爱尔兰的一位设计师 <span style="color:#2673dd;">David Airey</span> 在出国旅游回来之后，发现他的日访问量超过 2000 次的个人网站 <a href="https://www.davidairey.com">[www.davidairey.com](http://www.davidairey.com)</a> 被重定向到了一个他从未听说过的网站 —— <a href="https://www.bebu.net">bebu.net</a>。起初 <span style="color:#2673dd;">David Airey</span> 以为是域名到期了，虽然对于域名到期和没有收到任何通知感到有些难以置信，但 <span style="color:#2673dd;">David Airey</span> 还是先发了一封邮件给域名的新拥有者，表达了将域名购买回来的意愿。同天稍后时间，对方回复让 <span style="color:#2673dd;">David Airey</span> 出高价。于是 <span style="color:#2673dd;">David Airey</span> 开始联系他的网络托管商 <a href="https://www.icdsoft.com/">ICDSoft</a> 寻求帮助，询问他为什么没有收到任何通知。在等待回复的过程中， <span style="color:#2673dd;">David Airey</span> 在网络主机支持面板里找到了一条域名转让记录。一分钟后，ICDSoft 的支持团队发来回复。在沟通过程中， <span style="color:#2673dd;">David Airey</span> 被告知域名转移已经完成，无法恢复。并且他的电子邮件账户肯定也被入侵了，因为转移需要邮箱里的验证码。

盗取过程：
![csrf\_david](https://s21.ax1x.com/2024/06/13/pkahWeH.png)

1.  <span style="color:#2673dd;">David</span> 在浏览器中打开并登陆了 Gmail，而且保持着登陆状态。
2.  黑客通过发邮件等方式引导 <span style="color:#2673dd;">David</span> 去点击链接访问他的页面。在这个页面里，黑客写了一个创建邮件转发规则的请求给 Gmail 服务。
3.  由于 <span style="color:#2673dd;">David</span> 保持着登陆状态，于是这个请求顺利通过了 Gmail 服务的鉴权等判定。至此，邮箱已被黑客入侵。

### 什么是 CSRF

CSRF(Cross-site request forgery) 全称 —— 跨站请求伪造，是一种冒充受信任用户，向服务器发送非预期请求的攻击方式。一个典型的 CSRF 攻击流程如下：

1.  受害者登陆 a.com，并保持着登陆状态。
2.  攻击者引导受害者访问 b.com。
3.  b.com 向 a.com 发送一个请求。
4.  由于登陆凭证还在，a.com 将此次操作视作受害者执行的操作，认证通过。
5.  攻击完成。

### 常见的三种攻击方式

#### 隐藏式 GET 请求

这种类型的攻击方式使用起来非常简单，一般会通过 `img` 来实现。比如，当用户访问带有下面这种 `img` 标签的页面时，浏览器会自动向 `bank` 服务发起一个转账请求。

```html
<img src="https://www.bank.com/sendmoney?user=hacker&number=100">
```

#### 隐藏式 POST 请求

这种类型的攻击方式通常是借由一个自动提交的表单来达到攻击目的。

```html
<form id='hacker-form' action="https://www.bank.com/sendmoney" method=POST>
    <input type="hidden" name="to" value="hacker" />
    <input type="hidden" name="number" value="100" />
</form>
<script>document.getElementById('hacker-form').submit();</script>
```

#### 诱骗链接

这种类型的攻击方式通常是在论坛中发布的图片里面嵌入恶意链接，或者是以广告的形式诱导用户中招。由于需要用户主动点击，这种类型的攻击通常会以比较夸张的词语诱骗用户点击。比如：

```html
<a href="https://www.bank.com/sendmoney?user=hacker&number=100" taget="_blank">重磅消息！！<a/>
```

### CSRF 防御方式

#### Header 验证

既然 CSRF 攻击来自于第三方网站，那么服务器可以设置一份白名单，并在收到请求之后对 Header 进行验证，判定请求来源是否在白名单之内。

`Origin`：大部分情况下，服务器可以通过 `Origin` 直接拿到请求来源。但是某些特殊场景下，`Origin` 会被设置成 `null`。比如：

*   跨源的图像或者媒体
*   跨源重定向

`Referer`：对于 `ajax` 请求、图片、script 等资源请求，`Referer` 记录的是发起请求的页面地址。对于页面跳转，`Referer` 记录的是跳转之前的那个页面的地址。\
![referer](https://s21.ax1x.com/2024/06/13/pkaLZAU.png)\
*Tips：有些网站不允许图片外链，只有自家的网站才能成功显示图片，外部网站加载图片就会报错。这个功能就可以基于 `Referer` 来实现，如果该字段的值是自家网址，访问就放行。*

但 `Referer` 同样也存在一些不足：

*   可以被篡改

*   可能不存在：[Referrer Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Referrer-Policy) —— 用于监管访问来源中的哪些信息应该放进 `Referer`，可以影响 `Referer` 的值，比如说攻击者可以通过设置 `no-referrer` 来移除 `Referer` 标头：

```html
<img src="https://www.bank.com/sendmoney?user=hacker&number=100" referrerpolicy="no-referrer">
```

总结：虽然头部验证这种方式不是绝对安全，但是它能作为额外的安全层来提高服务的安全程度。

#### Token 验证

针对用户的每一次会话，基于 userid、时间戳、随机数等参数，通过特定的加密方式计算得到一个 Token，并在用户登录时返回给浏览器。网站页面在每次执行敏感操作时，将此 Token 添加到请求参数(体)之中。当服务器收到请求之后，验证 Token 的存在性和有效性。如果 Token 不存在或者与再次计算得到的 Token 不匹配，则立即中断请求，重置 Token 并将此次请求记录为正在进行的潜在 CSRF 攻击。

#### SameSite Cookie

为了从源头上解决这个问题，Google 在 2016 年起草了一份草案来改进 HTTP 协议，即为 Set-Cookie 响应头新增 SameSite 属性，用于表明 Cookie 是个同站 Cookie，不能用作第三方 Cookie，目前各大主流浏览器已支持 SameSite 设置。

Cookie 的 SameSite 属性可以设置三个值：

##### Strict
最为严格的模式，表明 Cookie 不可能作为第三方 Cookie。例如：
```javascript
// b.com's cookie
Set-Cookie: foo=1; SameSite=Strict;
```
当用户在 a.com 下对 b.com 发起请求，不管是什么场景，foo 这个 Cookie 都不会被携带到请求头中。举个实际的例子就是，假如淘宝网站用来识别用户登录与否的 Cookie 被设置成了 Samesite=Strict，那么用户从百度搜索页面甚至天猫页面的链接点击进入淘宝后，淘宝都不会是登录状态，因为淘宝的服务器不会接受到那个 Cookie，其它网站发起的对淘宝的任意请求都不会带上那个 Cookie。  

##### Lax
略微宽松的模式，大多数情况下也不会发送第三方 Cookie，但是导航到目标网址的 Get 请求除外。  
```javascript
Set-Cookie: bar=1; SameSite=Lax;
```
导航到目标网址的 GET 请求，只包括三种情况：链接，预加载请求，GET 表单。详见下表。
|请求类型|示例|Lax 模式|  
|:----:|:----:|:----:|
|链接|`<a href="..."></a>`|发送 Cookie|
|预加载|`<link rel="prerender" href="..."/>`|发送 Cookie|
|GET 表单|`<form method="GET" action="...">`|发送 Cookie|
|POST 表单|`<form method="POST" action="...">`|不发送|
|iframe|`<iframe src="..."></iframe>`|不发送|
|ajax|`$.get("...")`|不发送|
|image|`<img src="..." />`|不发送|

##### None
最宽松的模式，对 Cookie 的发送不做任何限制，但在设置该模式时必须同时指定 `Secure` 属性，否则该模式会设定失败：
```javascript
Set-Cookie: baz=abc123; SameSite=None; // 无效配置
Set-Cookie: baz=abc123; SameSite=None; Secure; // 有效配置
```
> Secure Cookie 仅在使用 HTTPS 协议发送加密请求时才会被发送到服务器。非安全站点（http:）无法为 Cookie 设置 Secure 指令，因此也无法使用 SameSite=None。
