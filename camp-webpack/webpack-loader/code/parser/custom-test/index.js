/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-console */
/*
 * 测试步骤
 * 1. 安装 acorn、acorn-import-assertions
 * 2. 将本文件夹移动到根目录下
 */
const { Parser } = require("acorn");
const { importAssertions } = require("acorn-import-assertions");
const JavaScriptParser = Parser.extend(importAssertions);
console.log(JavaScriptParser.parse("msg")); // ok. acorn 将 "msg" 视作字符串字面量
console.log(JavaScriptParser.parse("msg from")); // error. 由于空格的存在，acorn 将 msg 和 from 视作两个标识符，而它们两无法构成合法的 Js 表达式
console.log(JavaScriptParser.parse("'msg from'")); // ok. 由于单引号的存在，acorn 将 'msg from' 视作一个整体，当作字符串字面量
