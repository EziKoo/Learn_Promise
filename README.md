## 学习Promise
  
  解决回调地狱的问题

  对于
    1、Promise.Resolve()
    2、then()
    3、async function(){}
    以上三个都是返回一个 Promise 对象，其中返回的Promise对象的状态和结果值的判断方式都是一样的
      如果是非 Promise 对象，则一律是成功状态，并且结果值就是返回的值
      如果是 Promise 对象，则返回的状态和结果值 和 你返回的Promise的状态和结果值 一致。