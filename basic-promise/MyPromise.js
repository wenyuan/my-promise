/**
 * @desc 一个基本的 Promise, 支持异步与多次调用 then, 不支持链式调用
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor (executor) {
    // 初始状态为 pending
    this.status = PENDING;
    // resolve 的参数
    this.value = undefined;
    // reject 的参数
    this.reason = undefined;

    // 收集所有成功的回调函数, 即 resolve(value) 后触发的 onFulfilled
    this.onFulfilledCallbacks = [];
    // 收集所有失败的回调函数
    this.onRejectedCallbacks = [];

    // 每次实例化时重新声明 resolve
    const resolve = (value) => {
      // 只有 pending 状态才能变成 fulfilled
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        // 发布
        // 处理异步里的 resolve()
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    }

    // 每次实例化时重新声明 reject
    const reject = (reason) => {
      // 只有 pending 状态才能变成 rejected
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        // 发布
        // 处理异步里的 reject()
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    }

    // 捕获 executor 里面抛出的异常
    try {
      executor(resolve, reject);
    } catch(e) {
      reject(e);
    }

  }

  // 定义 then 方法
  then (onFulfilled, onRejected) {
    if (this.status === FULFILLED) {
      onFulfilled(this.value);
    }

    if (this.status === REJECTED) {
      onRejected(this.reason);
    }

    // 对 pending 状态的处理(异步时会进来)
    if (this.status === PENDING) {
      // 订阅过程
      // 为什么 push 的内容是 ()=>{onFulfilled(this.value);}
      // 而不是 onFulfilled 呢
      // 因为这样在后面发布时, 只需要遍历数组并直接执行每个元素就可以了
      this.onFulfilledCallbacks.push(() => {
        onFulfilled(this.value);
      });
      // 同上
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason);
      });
    }
  }

}

// 我是在 Node 环境下测试的
// 所以遵循 CommonJS 的规范进行模块导出
module.exports = MyPromise;
