# MyPromise

手写实现符合 Promise/A+ 规范的 Promise，通过了 Promises/A+ 官方 872 个测试用例。

仓库中包含的几个版本：

* **[MyPromise.js](https://github.com/wenyuan/my-promise/blob/main/MyPromise.js)**（Promise 核心原理的实现，通过了 Promises/A+ 官方 872 个测试用例）
* **[basic-promise/MyPromise.js](https://github.com/wenyuan/my-promise/blob/main/basic-promise/MyPromise.js)**（一个基本的 Promise，支持异步与多次调用 then，不支持链式调用）
* **[fully-promise/MyPromise.js](https://github.com/wenyuan/my-promise/blob/main/fully-promise/MyPromise.js)** (在 MyPromise.js 基础上，根据规范实现了 Promise ES6+ 的全部 API) 
  * Promise.resolve
  * Promise.reject
  * Promise.prototype.catch
  * Promise.prototype.finally
  * Promise.all 
  * Promise.allSettled
  * Promise.any
  * Promise.race

## 一步步手写实现 Promise 过程记录

手写 Promise 详细的过程记录在这里：

* [实现符合 Promises/A+ 规范的 Promise](https://www.fedbook.cn/frontend-knowledge/javascript-handwritten/my-promise/)

## Promises/A+ 测试

如何证明写的这个 MyPromise 就符合 Promises/A+ 规范呢？

跑一下 Promise A+ 测试就好啦。

### 安装官方测试工具

我们使用 Promises/A+ 官方的测试工具 promises-aplus-tests 来对我们的 MyPromise 进行测试。

```bash
# 安装 promises-aplus-tests
npm install promises-aplus-tests -D
```

### 使用 ES6 Module 对外暴露 MyPromise 类

```javascript
class MyPromise {
  // ...
}

function resolvePromise(promise2, x, resolve, reject) { 
  // ...
}

module.exports = MyPromise;
```

### 实现静态方法 deferred

要使用 promises-aplus-tests 这个工具测试，必须实现一个静态方法 `deferred()`，通过查看[官方](https://github.com/promises-aplus/promises-tests)对这个方法的定义可知：

我们要给自己手写的 MyPromise 上实现一个静态方法 `deferred()`，该方法要返回一个包含 `{ promise, resolve, reject }` 的对象：

* promise 是一个处于 pending 状态的 Promsie 对象。
* resolve(value) 用 value「解决」上面那个 promise。
* reject(reason) 用 reason「拒绝」上面那个 promise。

`deferred()` 的实现如下：

```javascript
class MyPromise {
  // ...
}

function resolvePromise(promise2, x, resolve, reject) { 
  // ...
}

MyPromise.deferred = function () {
  let result = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
}

module.exports = MyPromise;
```

### 配置 package.json

我们实现了 deferred 方法，也通过 ES6 Module 对外暴露了 MyPromise，最后配置一下 package.json 就可以跑测试了：

```javascript
// package.json
{
  "devDependencies": {
    "promises-aplus-tests": "^2.1.2"
  },
  "scripts": {
    "test": "promises-aplus-tests MyPromise"
  }
}
```

### 执行测试命令

```bash
npm run test
```

发现结果是：

```bash
872 passing (49s)
```

就说明官方的 872 个测试用例全部通过了。

如果有部分测试用例没有通过，也会有具体哪一条规范没有通过的信息给出来，到时候针对性修改即可。

## 待办（TODO LIST）

* 整理代码中的注释，方便日后复习。【√】
* 定期复习。

## 交流探讨

Promise 的手写还是很复杂很庞大的，如果有人恰好路过这个仓库，并且 pull 下来作为了自己学习手写 Promise 时的参考，还产生了一些疑问，可以在 Issues 一起交流讨论下。
