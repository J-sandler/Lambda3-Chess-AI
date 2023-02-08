const lzerA_lrate=3e-10;
const hiddenLayers=8;
const unitSize=8;
var boardinternals=[
  [-5,-3,-3.5,-9,-100,-3.5,-3,-5],
  [-1,-1,-1,-1,-1,-1,-1,-1],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1],
  [5,3,3.5,9,100,3.5,3,5]
];

const lzeroA=tf.sequential();
const lzeroB=tf.sequential();
let lzeroC= tf.sequential();
let lzeroD= tf.sequential();
forge_c();forge_d();

//lzero A:
function forge_a() {
  lzeroA.add(tf.layers.dense({
  units:64,
  inputShape:[64],
  activation:'linear'
}));

for (let i=0;i<hiddenLayers;i++) {
  lzeroA.add(tf.layers.dense({
    units:unitSize*(hiddenLayers-i),
    activation:'linear'
  }));
}

lzeroA.add(tf.layers.dense({
  units:1,
  activation:'linear'
}));
lzeroA.compile({
  optimizer:tf.train.adam(lzerA_lrate),
  loss:tf.losses.meanSquaredError
});
}

//lzero B:
function forge_b() {
  lzeroB.add(tf.layers.dense({
  units:64,
  inputShape:[64],
  activation:'linear'
}));

for (let i=0;i<hiddenLayers;i++) {
  lzeroB.add(tf.layers.dense({
    units:unitSize*(hiddenLayers-i),
    activation:'linear'
  }));
}

lzeroB.add(tf.layers.dense({
  units:1,
  activation:'linear'
}));
lzeroB.compile({
  optimizer:tf.train.adam(lzerA_lrate),
  loss:tf.losses.meanSquaredError
});
}

//lzero C:
async function forge_c(load=false) {
if (load) {
  console.log("Loading Lzero C");
  lzeroC = await tf.loadLayersModel('localstorage://lzeroC');
  console.log("Lzero C loaded");
  lzeroC.compile({
  optimizer: tf.train.adam(lzerA_lrate),
  loss: tf.losses.meanSquaredError,
  metrics: ['accuracy'],
});
  return;
}
lzeroC.add(tf.layers.conv2d({
  inputShape:[13,8,8],
  kernelSize: 3,
  filters: 32,
  strides: 1,
  activation: 'relu',
  kernelInitializer: 'varianceScaling'
}));

lzeroC.add(tf.layers.conv2d({
  kernelSize: 3,
  filters: 32,
  strides: 1,
  activation: 'relu',
  kernelInitializer: 'varianceScaling'
}));

lzeroC.add(tf.layers.maxPooling2d({
  poolSize: [1,1],
  strides: [1,1]
}));

// lzeroC.add(tf.layers.maxPooling2d({
//   poolSize: [2,2],
//   strides: [2,2]
// }));


// lzeroC.add(tf.layers.dense({
//   units: 64,
//   kernelInitializer: 'varianceScaling',
//   activation: 'linear'
// }));

//lzeroC.add(tf.layers.flatten());

for (let i=0;i<hiddenLayers;i++) {
  lzeroC.add(tf.layers.dense({
  units: 64,
  kernelInitializer: 'varianceScaling',
  activation: 'relu'
}));
}

lzeroC.add(tf.layers.flatten());

// lzeroC.add(tf.layers.dense({
//     units: 832,
//     kernelInitializer: 'varianceScaling',
//     activation: 'relu'
//   }));

lzeroC.add(tf.layers.dense({
    units: 1,
    kernelInitializer: 'varianceScaling',
    activation: 'sigmoid'
  }));

lzeroC.compile({
  optimizer: tf.train.adam(lzerA_lrate),
  loss: tf.losses.meanSquaredError,
  metrics: ['accuracy'],
});
}

//lzero D:
async function forge_d(load=false) {
if (load) {
  console.log("Loading lzero D");
  lzeroD = await tf.loadLayersModel('localstorage://lzeroD');
  console.log("Lzero D loaded");
  lzeroD.compile({
  optimizer: tf.train.adam(lzerA_lrate),
  loss: tf.losses.meanSquaredError,
  metrics: ['accuracy'],
});
  return;
}

lzeroD.add(tf.layers.conv2d({
  inputShape: [13,8,8],
  kernelSize: 3,
  filters: 32,
  strides: 1,
  activation: 'linear',
  kernelInitializer: 'varianceScaling'
}));

// lzeroD.add(tf.layers.maxPooling2d({
//   poolSize: [2,2],
//   strides: [2,2]
// }));


for (let i=0;i<hiddenLayers;i++) {
  lzeroD.add(tf.layers.dense({
  units: 64,
  kernelInitializer: 'varianceScaling',
  activation: 'relu'
}));
}


lzeroD.add(tf.layers.flatten());
lzeroD.add(tf.layers.dense({
    units: 1,
    kernelInitializer: 'varianceScaling',
    activation: 'sigmoid'
  }));


lzeroD.compile({
  optimizer: tf.train.adam(lzerA_lrate),
  loss: tf.losses.meanSquaredError,
  metrics: ['accuracy'],
});
}
