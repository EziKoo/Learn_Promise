const promise = new Promise((resolve, reject) => {
  resolve("成功");
});

promise
  .then((res) => {
    console.log(res, "成功");
    return new Promise((resolve,reject) => {
      reject('第二个失败')
    })
  })
  .catch((err) => {
    console.log(err, "失败");
  });
