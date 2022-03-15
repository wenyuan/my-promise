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
      }

      // 发布
      // 处理异步里的 resolve()
      this.onFulfilledCallbacks.forEach(fn => fn());
    }

    // 每次实例化时重新声明 reject
    const reject = (reason) => {
      // 只有 pending 状态才能变成 rejected
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
      }

      // 发布
      // 处理异步里的 reject()
      this.onRejectedCallbacks.forEach(fn => fn());
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
    // 设置默认值, 如果是函数就赋值给它本身, 如果不是就将成功的回调的参数 value 返给它
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    // 设置默认值, 如果是函数就赋值给它本身, 如果不是就将失败的回调的参数 reason 作为错误原因抛出去
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason};
    // 定义一个 promise2
    let promise2 = new MyPromise((resolve, reject) => {
      // 将之前写的代码都放到 promise2 里面
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            // 四个参数
            // promise2: 携带成功或失败的信息
            // x: 待处理值
            // resolve: 外部需要使用该方法
            // reject: 外部需要使用该方法
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
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
        // 订阅过程
        // 为什么 push 的内容是 ()=>{onFulfilled(this.value);}
        // 而不是 onFulfilled 呢
        // 因为这样在后面发布时, 只需要遍历数组并直接执行每个元素就可以了
        this.onFulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
        // 订阅过程(同上)
        this.onRejectedCallbacks.push(() => {
          try {
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
 * @param {promise} promise2: promise1.then 方法返回的新的 promise 对象
 * @param {[type]} x: promise1 中 onFulfilled 或 onRejected 的返回值
 * @param {[type]} resolve: promise2 的 resolve 方法
 * @param {[type]} reject: promise2 的 reject 方法
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 如果 promise 和 x 指向同一对象，以 TypeError 为拒因拒绝执行 promise
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<MyPromise>'))
  }

  // 2.3.3.3.3 避免多次调用
  let called = false;

  // 2.3.3 注意 null 也是 object, 需要排除
  if ((typeof x === 'object' && x !== null) || (typeof x === 'function')) {
    // 2.3.3.2 捕获错误异常
    try {
      // 2.3.3.1 如果 x 是 Promise 对象, 它一定有 then 方法
      let then = x.then;
      // 2.3.3.3 这样暂且就可以认定 x 是个 Promise 对象(但不能绝对排除人为给 x 设置了一个 then 方法的情况)
      if (typeof then === 'function') {
        then.call(x, (y) => {
          if (called) return;
          called = true;
          // 2.3.3.3.1 注意这里是一个新的 promise, 需要递归调用
          // 就是支持处理 resolve(new Promise(()=>{}) 这种在 resolve() 里无限嵌套 new Promise() 的场景
          resolvePromise(promise2, y, resolve, reject);
        }, (r) => {
          if (called) return;
          called = true;
          // 2.3.3.3.2
          reject(r);
        })
      } else {
        // 2.3.3.4 如果 x 不是个 Promise 对象
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      // 2.3.3.2
      reject(e);
    }
  } else {
    // 2.3.4
    resolve(x);
  }
}

// 我是在 Node 环境下测试的
// 所以遵循 CommonJS 的规范进行模块导出
module.exports = MyPromise;
