const train_size=50000;// number of positions trained on (0 to 4.4M);
const buffer=0;// number of positions skipped in data set;
const epochs=4;
const batch_size=4096;

// const data=[];  
// const data2=[]; 
// const evals=[];

const wpos=new Array(parseInt(train_size));
const bpos=new Array(parseInt(train_size));
const wevals=new Array(parseInt(train_size));
const bevals=new Array(parseInt(train_size));

const test_data=[];

function readFile(input) {
  console.log("INPUT PROCESSING");
  return helper(input);
  
}

async function train() {
  //A training:

  //white training:
  console.log("TRAINING");
  for (let i=0;i<epochs;i++) {
    let r=await lzeroC.fit(
    tf.tensor(wpos,[wpos.length,13,8,8]),
    tf.tensor(wevals,[wpos.length,1]),
    {
      epochs:1,
      kernel_size:3,
      shuffle:true,
      batch_size:batch_size,
      num_workers:2,
    });
    console.log("Loss: ", Math.sqrt(r.history.loss[0]), "Acc: ", r.history.acc[0]);
  }
  //black training:
  // console.log("BLACK TRAINING");
  // for (let i=0;i<epochs;i++) {
  //   let r=await lzeroD.fit(
  //   tf.tensor(bpos,[bpos.length,13,8,8]),
  //   tf.tensor(bevals,[bpos.length,1]),
  //   {
  //     epochs:1,
  //     kernel_size:3,
  //     shuffle:true,
  //     batch_size:batch_size,
  //     num_workers:2
  //   });
  //   console.log("Loss: ", Math.sqrt(r.history.loss[0]), "Acc: ", r.history.acc[0]);
  // }
  console.log("TRAINING COMPLETE");

  //B training:
  // for (let i=0;i<data.length;i++) {
  //   console.log("gs");
  //   let a=await lzeroA.predict(tf.tensor2d([data[i]]));
  //   let z=await a.array();
  //   data2.push([z[0][0],sum(data[i])]);
  // }
  // for (let i=0;i<epochs;i++) {
  //   let r=await lzeroB.fit(
  //   tf.tensor2d(data2),
  //   tf.tensor(evals,[data.length,1]),
  //   {
  //     epochs:1,
  //     kernel_size:3,
  //     shuffle:true,
  //     batch_size:512
  //   });
  //   console.log(r.history.loss[0]);
  // }
  // console.log("Lzero-B training complete");

  await lzeroC.save('localstorage://lzeroC');
  await lzeroD.save('localstorage://lzeroD');

}

