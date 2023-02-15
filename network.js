class NeuralNetwork {
  constructor(layerData) {
    this.layers=[]; //array of layers
    for (let i=0;i<layerData.length-1;i++) {
      this.layers.push(new Layer(
        layerData[i],
        layerData[i+1]
      ));
    }
  }

  static async birth(network,disimilarity=1) {
    network=await network;
    network.layers=await network.layers;

     network.layers.forEach(
      layer=>{
        for(let i=0;i<layer.biases.length;i++){
          layer.biases[i]=lerp(
            layer.biases[i],
            (Math.random()*2)-1,
            disimilarity
          );
        }
        for(let i=0;i<layer.weights.length;i++) {
          for (let j=0;j<layer.weights[i].length;j++) {
            layer.weights[i][j]=lerp(
              layer.weights[i][j],
              (Math.random()*2)-1,
              disimilarity
            );
          }
        }
      });
      return network;
  }

  static async feedForward(inputs,network) {
    //instantiate first output given inputs

    network=await network;

    let outputs=await Layer.feedForward(
      inputs,
      await network.layers[0]
    );

    for (let i=1;i<network.layers.length;i++) {
      //update output using previous output as input
      outputs=await Layer.feedForward(outputs,await network.layers[i]);
    }
    return outputs;
  }

  static model(desiredOutputs,sensorReadings,mind) {
    for (let i=0;i<sensorReadings.length;i++) {
      mind.layers[0].inputs[i]=sensorReadings[i];
    }

    //approximate biases
    for (let i=0;i<desiredOutputs.length;i++) {
      let sum=0;
      for (let j=0;j<sensorReadings.length;j++) {
        sum+=mind.layers[0].weights[j][i]*sensorReadings[j];
      }

      const approx=(desiredOutputs[i])?-rate:rate;
      mind.layers[mind.layers.length-1].biases[i]=approx+sum;
    }
    console.table(mind);
  }
}

class Layer {
  constructor(numInputs,numOutputs) {
    this.inputs=new Array(numInputs);
    this.outputs=new Array(numOutputs);
    
    this.biases=new Array(numOutputs);
    this.weights=[];

    for(let i=0;i<numInputs;i++) this.weights[i]=new Array(numOutputs);

    Layer.#randomize(this);
  }

  static async #randomize(layer) {
    for (let i=0;i<layer.inputs.length;i++) {
      for (let j=0;j<layer.outputs.length;j++) {
        layer.weights[i][j]=(Math.random()*100000)-50000;
        layer.biases[j]=(Math.random()*100000)-50000;
      }
    }
  }

  static async feedForward(layerInputs,layer) {
    for (let i=0;i<layer.inputs.length;i++) {layer.inputs[i]=layerInputs[i];}
    for (let i=0;i<layer.outputs.length;i++) {
      let sum=0;
      for (let j=0;j<layer.inputs.length;j++) {
        sum+=(layer.inputs[j]*layer.weights[j][i]);
      }
      //this would otherwise be replaced with a non-binary method
      //e.g [layer.outputs[i]=Math.sigmoid(sum-layer.biases[i])]
      layer.outputs[i]=sum-layer.biases[i];
    }
    return layer.outputs;
  }
}

function lerp(A,B,t) {
  return A+(B-A)*t;
}

async function J(D) {

  if (Math.abs(D)<1) {
    return (D<0)?-Math.sqrt(Math.abs(D)):Math.sqrt(D);
  }

  return D*D;

}