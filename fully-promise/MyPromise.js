/**
 * @desc 一个完整的 Promise, 根据规范实现了 Promise ES6+ 的全部 API
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
        setTimeout(() => {
          this.status = FULFILLED;
          this.value = value;
          // 发布
          // 处理异步里的 resolve()
          this.onFulfilledCallbacks.forEach(fn => fn());
        }, 0)
      }
    }

    // 每次实例化时重新声明 reject
    const reject = (reason) => {
      // 只有 pending 状态才能变成 rejected
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

  /**
   * Promise.resolve()
   * @param {[type]} value 要解析为 Promise 对象的值
   */
  static resolve(value) {
    // 如果这个值是一个 promise, 那么将返回这个 promise
    if (value instanceof MyPromise) {
      return value;
    } else if (value instanceof Object && 'then' in value) {
      // 如果这个值是 thenable(即带有 then 方法), 返回的 promise 会跟随这个 thenable 的对象, 采用它的最终状态
      return new MyPromise((resolve, reject) => {
        value.then(resolve, reject);
      })
    }

    // 否则返回的 promise 将以此值完成, 即以此值执行 resolve() 方法(状态为 fulfilled)
    return new MyPromise((resolve) => {
      resolve(value)
    })
  }

  /**
   * Promise.reject()
   * @param {*} reason 表示 Promise 被拒绝的原因
   * @returns
   */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    })
  }

  /**
   * finally
   * @param {*} callBack 无论结果是 fulfilled 或者是 rejected, 都会执行的回调函数
   * @returns
   */
  finally(callBack) {
    return this.then(callBack, callBack)
  }

  /**
   * Promise.all()
   * @param {iterable} promises 一个 promise 的 iterable 类型(注: Array, Map, Set 都属于 ES6 的 iterable 类型)的输入
   * @returns
   */
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        let result = []; // 存储结果
        let count = 0; // 计数器

        // 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
        if (promises.length === 0) {
          return resolve(promises);
        }

        promises.forEach((item, index) => {
          // myPromise.resolve方法中已经判断了参数是否为promise与thenable对象，所以无需在该方法中再次判断
          MyPromise.resolve(item).then(
            value => {
              count++;
              // 每个promise执行的结果存储在result中
              result[index] = value;
              // Promise.all 等待所有都完成（或第一个失败）
              count === promises.length && resolve(result);
            },
            reason => {
              /**
               * 如果传入的 promise 中有一个失败(rejected),
               * Promise.all 异步地将失败的那个结果给失败状态的回调函数，而不管其它 promise 是否完成
               */
              reject(reason);
            }
          )
        })
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }

  /**
   * Promise.allSettled()
   * @param {iterable} promises 一个 promise 的 iterable 类型(注: Array, Map, Set 都属于 ES6 的 iterable 类型)的输入
   * @returns
   */
  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        let result = []; // 存储结果
        let count = 0;   // 计数器

        // 如果传入的是一个空数组, 那么就直接返回一个 resolved 的空数组 promise 对象
        if (promises.length === 0) return resolve(promises);

        promises.forEach((item, index) => {
          // 非 promise 值, 通过 Promise.resolve 转换为 promise 进行统一处理
          MyPromise.resolve(item).then(
            value => {
              count++;
              // 对于每个结果对象, 都有一个 status 字符串. 如果它的值为 fulfilled, 则结果对象上存在一个 value
              result[index] = {
                status: 'fulfilled',
                value
              }
              // 所有给定的 promise 都已经 fulfilled 或 rejected 后, 返回这个 promise
              count === promises.length && resolve(result);
            },
            reason => {
              count++;
              /**
               * 对于每个结果对象, 都有一个 status 字符串. 如果值为 rejected, 则存在一个 reason
               * value(或 reason)反映了每个 promise 决议(或拒绝)的值
               */
              result[index] = {
                status: 'rejected',
                reason
              }
              // 所有给定的promise都已经fulfilled或rejected后,返回这个promise
              count === promises.length && resolve(result);
            }
          )
        })
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }

  /**
   * Promise.any()
   * @param {iterable} promises 一个 promise 的 iterable 类型(注: Array, Map, Set 都属于 ES6 的 iterable 类型)的输入
   * @returns
   */
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        let errors = []; //
        let count = 0; // 计数器

        // 如果传入的参数是一个空的可迭代对象, 则返回一个已失败(already rejected)状态的 Promise
        if (promises.length === 0) return reject(new AggregateError([], 'All promises were rejected'));

        promises.forEach(item => {
          // 非 Promise 值, 通过 Promise.resolve 转换为 Promise
          MyPromise.resolve(item).then(
            value => {
              // 只要其中的一个 promise 成功, 就返回那个已经成功的 promise
              resolve(value);
            },
            reason => {
              count++;
              errors.push(reason);
              /**
               * 如果可迭代对象中没有一个 promise 成功，就返回一个失败的 promise 和 AggregateError类型的实例,
               * AggregateError是 Error 的一个子类, 用于把单一的错误集合在一起
               */
              count === promises.length && reject(new AggregateError(errors, 'All promises were rejected'));
            }
          )
        })
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }

  /**
   * Promise.race()
   * @param {iterable} promises 可迭代对象, 类似 Array. 详见 iterable
   * @returns
   */
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        // 如果传入的迭代 promises 是空的, 则返回的 promise 将永远等待
        if (promises.length > 0) {
          promises.forEach(item => {
            /**
             * 如果迭代包含一个或多个非承诺值和/或已解决/拒绝的承诺,
             * 则 Promise.race 将解析为迭代中找到的第一个值
             */
            MyPromise.resolve(item).then(resolve, reject);
          })
        }
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
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
