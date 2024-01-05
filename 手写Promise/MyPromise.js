/* 
  手写Promise

  Promise的状态由什么决定？
  1) resolve
  2) reject
  3) throw（抛异常）
*/


// 状态常量
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  
  // 1、属性 (状态 + 结果) 需要node 14.15.4
  PromiseState = PENDING
  PromiseResult = undefined

  // 保存两组回调函数
  fulfilledCbs = []
  rejectedCbs = []
  
  // 2、构造方法(执行器函数)
  constructor (executor) {
    try {
      this.PromiseState = PENDING
      this.PromiseResult = null
      // 如果执行器函数中抛了异常，throw，直接执行reject函数
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  // 这里使用箭头函数，是为了让函数里面的this指向的是外面的this
  // 3.1、成功的方法：设置状态 + 保存结果
  resolve = (val) => {
    // 状态从pending改变后，就不能再改变了
    if(this.PromiseState !== PENDING) return
    this.PromiseState = FULFILLED
    this.PromiseResult = val
    while( this.fulfilledCbs.length ){
      this.fulfilledCbs.shift()()
    }
  }

  // 3.2、失败的方法：设置状态 + 保存结果
  reject = (reason) => {
    // 状态从pending改变后，就不能再改变了
    if(this.PromiseState !== PENDING) return
    this.PromiseState = REJECTED
    this.PromiseResult = reason
    while( this.rejectedCbs.length ){
      this.rejectedCbs.shift()()
    }
  }

  /* 
    then方法（接收两个回调）
    如果当前Promise对象为成功状态，执行第一个回调
    如果当前Promise对象为失败状态，执行第二个回调
    如果当前Promise对象为待定状态，暂时保存两个回调

    then方法本身会返回一个新的Promise对象。
    该对象的状态和结果由回调函数的返回值决定
    如果返回值是Promise对象，
      返回的Promise对象为成功，新Promise就是成功
      返回的Promise对象为失败，新Promise就是失败
    如果返回值非Promise对象
      新Promise就是成功，它的值就是返回值
  */

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason}

    const thenPromise = new MyPromise((resolve, reject) => {
      const resolvePromise = cb => {
        queueMicrotask(() => {
          // 异步代码
          try {
            let x = cb(this.PromiseResult)
            if (x === thenPromise) {
              throw new Error('不能返回自身...')
            }
            if (x instanceof MyPromise) {
              x.then(resolve, reject)
            } else {
              resolve(x)
            }
          } catch (error) {
            reject(error)
          }
        })
      }
      if (this.PromiseState === FULFILLED) {
        resolvePromise(onFulfilled)
      } else if (this.PromiseState === REJECTED) {
        resolvePromise(onRejected)
      } else if (this.PromiseState === PENDING) {
        this.fulfilledCbs.push( resolvePromise.bind(this, onFulfilled) )
        this.rejectedCbs.push( resolvePromise.bind(this, onRejected) )
      }
    })

    return thenPromise
  }

  /* 
    all是一个静态方法，需要传入一个数组作为参数
    返回一个promise
    参数数组中，如果所有promise对象都为成功，返回成功状态的promise对象
    参数数组中，只要有一个失败的promise对象，返回失败状态的promise对象
  */

  static all (arr) {
    const result = []
    let n = 0
    return new MyPromise((resolve, reject) => {
      const addData = (index, val) => {
        result[index] = val
        n++
        if(n === arr.length){
          resolve(result)
        }
      }
      arr.forEach((item, index) => {
        if(item instanceof MyPromise) {
          item.then(val => addData(index, val) ,reject)
        } else {
          addData(index, item)
        }
      });
    })
  }

  /* 
    race是一个静态方法，需要一个数组作为参数
    返回一个promise
    数组中字面量，被视为成功的promise
    promise的状态和结果，由参数数组中最快得到结果决定
  */
  static race (arr) {
    return new MyPromise((resolve, reject) => {
      arr.forEach(item => {
        if(item instanceof MyPromise) {
          item.then()
        } else {
          queueMicrotask(() => {
            resolve(item)
          })
        }
      })
    })
  }

  /* 
    resolve 是一个静态方法
    返回一个promise对象
    参数是一个promise对象，就原封不动的返回该对象
    参数是非promise对象，就返回一个成功状态的promise对象
  */
  static resolve (val) {
    if (val instanceof MyPromise) return val
    return new MyPromise((resolve, reject) => {
      resolve(val)
    })
  }

  /* 
    reject 是一个静态方法
    返回一个promise对象
    不管是什么，都会被包裹为失败的promise对象
  */
  static reject (val) {
    return new MyPromise((resolve, reject) => {
      reject(val)
    })
  }

  /* 
    finally 方法
  */
  finally (callback) {
    return this.then(callback, callback).then(() => this)
  }

  /* 
    catch 方法
  */
  catch (onRejected) {
    return this.then(null, onRejected)
  }
}