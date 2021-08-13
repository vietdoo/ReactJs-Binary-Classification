import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from'@tensorflow-models/knn-classifier';
import soundURL from './assets/warning.mp3';
import { useEffect, useRef } from 'react';
import '@tensorflow/tfjs-backend-webgl';


const labels = {'0' : 'OK', '1': 'Wear Mask Now !!!'}
const notTouch_Label = '0';
const touch_Label = '1';
const trainingTimes = 150;

function App() { 

  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();

  const init = async () => {
    console.log('init...s')
    await setupCamera();
    console.log('setup camera sucessfully');
    classifier.current = knnClassifier.create();
    mobilenetModule.current = await mobilenet.load();

    console.log("Setup done");

  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia
      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          {video: true},
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata', resolve);
          },
          error => reject(error)
        );
      } else {
        reject();
      }
    });
  };

  const changeRate = rate => {
    document.getElementById('nr').innerHTML = rate + '%';
  }

  const train = async label => {
    document.getElementById('nt').innerHTML = 'In process';
    console.log('Training: ', label);
    for (let i = 0; i < trainingTimes; i++) {
      let rate = parseInt((i+1)/trainingTimes*100)
      console.log('Rate: ', rate, '%');
      changeRate(rate);
      await training(label);
    }
    document.getElementById('nt').innerHTML = 'Completed';
    document.getElementById('nr').innerHTML = '';
  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModule.current.infer(video.current, true);
      
      classifier.current.addExample(embedding, label);
      
      await sleep(100);
      resolve();
    });
  }

  const predicting = async () => {
    const embedding = mobilenetModule.current.infer(video.current, true);
    const result = await classifier.current.predictClass(embedding);
    document.getElementById('nr').innerHTML = labels[result.label];
    await sleep(1000);
    predicting();
  }

  const run = async () => {
    document.getElementById('nt').innerHTML = '[Status]';
    predicting();
  }

  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  useEffect (() => {
    init();

    return () => {

    }
  }, []);

  return (
    <div className="main">
      <video
        ref={video}
        class="video"
        autoPlay
      />

      <div className="nofis">
        <div id="nt"></div>
        <div id="nr"></div>
      </div>

      <div className="control">
         <button className="btn" id = "b1" onClick={() => train(notTouch_Label)}>Train 1</button>
         <button className="btn" id = "b2" onClick={() => train(touch_Label)}>Train 2</button>
         <button className="btn" id = "br" onClick={() => run()}>Run AI Prediction</button>
      </div>
    </div>

  );
}

export default App;
