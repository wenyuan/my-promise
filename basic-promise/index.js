const MyPromise = require('./MyPromise');

let promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('success');
  }, 2000);
})

// 解决异步问题的时候, 顺便把多次调用 then 的问题也一起解决了
// 所以此处调用两个 promise.then
promise.then((value) => {
  console.log('Resolved 1:', value);
}, (reason) => {
  console.log('Rejected 1:', reason);
});

promise.then((value) => {
  console.log('Resolved 2:', value);
}, (reason) => {
  console.log('Rejected 2:', reason);
});
