/**
 * @desc 一个符合规范的 Promise 核心实现, 通过了 Promises/A+ 官方 872 个测试用例测试
 * 附代码注释以及对应的规范条目
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  // 构造函数: 通过 new 命令生成对象实例时, 自动调用类的构造函数
  constructor (executor) {
    // 初始状态为 pending
    this.status = PENDING;
    // resolve 的参数
    this.value = undefined;
    // reject 的参数
    this.reason = undefined;

    // 收集所有成功的回调函数, 即 resolve(value) 后触发的 onFulfilled
    this.onFulfilledCallbacks = [];
    // 收集所有失败的回调函数, 即 reject(reason) 后触发的 onRejected
    this.onRejectedCallbacks = [];

    // 写在这个位置, 每次实例化时会重新声明 resolve
    const resolve = (value) => {
      // 规定只有 pending 状态才能变成 fulfilled
      if (this.status === PENDING) {
        /**
         * 为什么 resolve 和 reject 要加 setTimeout?
         * 2.2.4 onFulfilled 和 onRejected 只允许在 execution context 栈仅包含平台代码时运行.
         * 注1 这里的平台代码指的是引擎、环境以及 promise 的实施代码。实践中要确保 onFulfilled 和 onRejected 方法异步执行，且应该在 then 方法被调用的那一轮事件循环之后的新执行栈中执行.
         * 这个事件队列可以采用宏任务机制，比如 setTimeout 或者 setImmediate; 也可以采用微任务机制来实现, 比如 MutationObserver 或者 process.nextTick
         */
        setTimeout(() => {
          this.status = FULFILLED;
          this.value = value;
          /**
           * 发布过程: 处理异步里的 resolve()
           * 在执行 resolve 或者 reject 的时候，遍历自身的 callbacks 数组
           * 看看数组里面有没有 then 那边保留过来的待执行函数，
           * 然后逐个执行数组里面的函数
           */
          this.onFulfilledCallbacks.forEach(fn => fn());
        }, 0)
      }
    }

    // 同上, 每次实例化时会重新声明 reject
    const reject = (reason) => {
      // 规定只有 pending 状态才能变成 rejected
      if (this.status === PENDING) {
        setTimeout(() => {
          this.status = REJECTED;
          this.reason = reason;
          // 发布
          // 处理异步里的 reject()
          this.onRejectedCallbacks.forEach(fn => fn());
        }, 0)
      }
    }

    // 捕获 executor 里面抛出的异常
    try {
      // executor() 传入 resolve 和 reject
      // new 对象实例时, 自动执行func()
      executor(resolve, reject);
    } catch(e) {
      // 生成实例时(执行 resolve 和 reject)如果报错, 就把错误信息传入给 reject() 方法, 并且直接执行 reject() 方法
      reject(e);
    }

  }

  /**
   * 注册 fulfilled 状态 / rejected 状态对应的回调函数
   * @param {function} onFulfilled: fulfilled 状态时 执行的函数
   * @param {function} onRejected: rejected 状态时 执行的函数
   * @return {object} newPromise: 返回一个新的 promise 对象
   */
  then (onFulfilled, onRejected) {
    /**
     * 参数校验
     * Promise 规定:
     * 对于 onFulfilled, 如果是函数就赋值给它本身, 如果不是就将 value 原封不动的返回
     * 对于 onRejected, 如果是函数就赋值给它本身, 如果不是就将 reason 作为错误原因抛(throw)出去
     */
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason};
    // 2.2.7 then 方法必须返回一个 promise 对象
    // 故此处定义一个 promise2
    let promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        /**
         * 为什么 resolve 和 reject 要加 setTimeout?
         * 2.2.4 onFulfilled 和 onRejected 只允许在 execution context 栈仅包含平台代码时运行.
         * 注1 这里的平台代码指的是引擎、环境以及 promise 的实施代码。实践中要确保 onFulfilled 和 onRejected 方法异步执行，且应该在 then 方法被调用的那一轮事件循环之后的新执行栈中执行.
         * 这个事件队列可以采用宏任务机制，比如 setTimeout 或者 setImmediate; 也可以采用微任务机制来实现, 比如 MutationObserver 或者 process.nextTick
         */
        setTimeout(() => {
          try {
            // 2.2.7.1 如果 onFulfilled 或者 onRejected 返回一个值 x, 即运行resolvePromise()
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2 如果 onFulfilled 或者 onRejected 抛出一个异常, 则 promise2 必须拒绝执行并返回异常原因(e)
            reject(e); // 捕获前面 onFulfilled 中抛出的异常
          }
        }, 0);
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      // 对 pending 状态的处理(异步时会进来)
      if (this.status === PENDING) {
        /**
         * 订阅过程
         * 为什么 push 的内容是 ()=>{onFulfilled(this.value);}
         * 而不是 onFulfilled 呢
         * 因为这样在后面发布时, 只需要遍历数组并直接执行每个元素就可以了
         */
        this.onFulfilledCallbacks.push(() => {
          try {
            // 也要符合 2.2.7.1
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
        // 订阅过程(同上)
        this.onRejectedCallbacks.push(() => {
          try {
            // 也要符合 2.2.7.2
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }
    });

    // 返回 promise2
    return promise2;
  }

  // 用 then 模拟 catch
  // catch 本身是 then 的一个语法糖
  catch (errorCallback) {
    return this.then(null, errorCallback);
  }

}

/**
 * Promise 解决过程, 即规范所说的 [[Resolve]](promise2, x)
 * 对 resolve()、reject() 中的返回值 x 进行处理
 * @param {object} promise2: promise1.then 方法返回的新的 promise 对象
 * @param {*} x: promise1 中 onFulfilled 或 onRejected 的返回值
 * @param {function} resolve: promise2 的 resolve 方法
 * @param {function} reject: promise2 的 reject 方法
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 如果 promise 和 x 指向同一对象，以 TypeError 为拒因拒绝执行 promise
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<MyPromise>'))
  }

  // 2.3.3.3.3 避免多次调用
  let called = false;

  // 2.3.3 如果 x 为对象或函数(注意 null 也是 object, 需要排除)
  if ((typeof x === 'object' && x !== null) || (typeof x === 'function')) {
    // 2.3.3.2 捕获错误异常
    try {
      // 2.3.3.1 如果 x 是 promise 对象, 它一定有 then 方法
      let then = x.then;
      /**
       * 2.3.3.3
       * 如果 then 是函数, 就可以认定 x 是个 promise 对象(但不能绝对排除人为给 x 设置了一个 then 方法的情况)
       * 将 x 作为函数的作用域 this 调用之
       * 传递两个回调函数作为参数
       * 第一个参数叫做 resolvePromise, 第二个参数叫做 rejectPromise
       */
      if (typeof then === 'function') {
        then.call(x, (y) => {
          if (called) return;
          called = true;
          // 2.3.3.3.1 如果 resolvePromise 以值 y 为参数被调用, 则运行 [[Resolve]](promise, y)
          // 注意这里是一个新的 promise, 需要递归调用
          // 就是支持处理 resolve(new Promise(()=>{}) 这种在 resolve() 里无限嵌套 new Promise() 的场景
          resolvePromise(promise2, y, resolve, reject);
        }, (r) => {
          if (called) return;
          // 2.3.3.3.2 如果 rejectPromise 以据因 r 为参数被调用, 则以据因 r 拒绝 promise
          called = true;
          reject(r);
        })
      } else {
        // 2.3.3.4 如果 x 不是个 promise 对象, 以 x 为参数执行 promise
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      // 2.3.3.2 如果取 x.then 的值时抛出错误 e, 则以 e 为据因拒绝 promise
      reject(e);
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数，以 x 为参数执行 promise
    resolve(x);
  }
}

// 用于进行 Promises/A+ 官方用例测试(共 872 个测试用例)
MyPromise.deferred = function () {
  let result = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
}


// 我是在 Node 环境下测试的
// 所以遵循 CommonJS 的规范进行模块导出
module.exports = MyPromise;
