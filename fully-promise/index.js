const MyPromise = require('./MyPromise');

let promise1 = new MyPromise((resolve, reject) => {
  resolve('promise 1')
})

let promise2 = promise1.then(() => {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve(new MyPromise((resolve, reject) => {
        resolve(new MyPromise((resolve, reject) => {
          resolve('new Promise resolve');
        }))
      }))
    }, 2000)
  })
}, (reason) => {
  return reason;
})

promise2.then().then().then((value) => {
  throw Error('Error');
}, (reason) => {
  console.log(reason);
})
.catch((e) => {
  console.log(e);
})
