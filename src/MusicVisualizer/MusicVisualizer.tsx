import React, { useEffect, useRef, useState } from "react";
import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import Nebula from "three-nebula";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import spriteAsset from '../assets/sprites/sprite.png';
import styles from "./MusicVisualizer.module.scss";
import { avg, max, modulate } from "./MusicVisualizerHelpers";

// for debugging, can remove later
import * as asciichart from "asciichart";

interface Props {
  width: number;
  height: number;
  audioUrl: string;
  isPlayerVisible?: boolean;
  autoplay?: boolean;
  userZoomControls?: boolean;
}

const FFTSize = 256;//512;

const MusicVisualizer: React.FC<Props> = ({
  width,
  height,
  audioUrl,
  isPlayerVisible,
  autoplay,
  userZoomControls,
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>();
  const audioRef = useRef<HTMLAudioElement>();
  const [isLoaded, setIsLoaded] = useState(false);

  let noise = new SimplexNoise();

  useEffect(() => {
    if (!containerRef) {
      return;
    }

    let context = new AudioContext();
    audioRef.current.src = audioUrl;
    audioRef.current.load();
    if (autoplay) {
        audioRef.current.play();
    }

    let src = context.createMediaElementSource(audioRef.current);

    let analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = FFTSize;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    let scene = new THREE.Scene();
    let group = new THREE.Group();
    let camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);

    //// SET CAMERA ZOOM according to music
    camera.position.set(500, 500, 500); 
    camera.lookAt(scene.position);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    containerRef.current.appendChild(renderer.domElement);
    renderer.setSize(width, height);

    let lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff, // grey bluegreen,
      wireframe: true,
      opacity: 0.3,
      transparent: true,
    });

    let lambertMaterialOuter = new THREE.MeshLambertMaterial({
      color: 0xffffff, // grey bluegreen,
      wireframe: true,
    });

    let phongMaterial = new THREE.MeshPhongMaterial({
      flatShading: true,
    });


    const WAVESPEED = 1;
    const WAVEWIDTH = 200;
    const WAVEHEIGHT = 100;
    const OBJECTS_MARGIN = 20;
  
    let waveobjects = new Array();
    const clock = new THREE.Clock();

    
    // ---------------- PARTICLES ----------------
    const loader = new THREE.TextureLoader();
    var particleTexture = loader.load(spriteAsset);
    var spriteMaterial = new THREE.SpriteMaterial( { map: particleTexture, transparent : true, opacity :1, color: 0xffffff } );
                      
    const dataArraySize = FFTSize / 2;
    const skipInterval = 5;
    const X_NUM_PARTICLES = dataArraySize / skipInterval; //100
    const Y_NUM_PARTICLES = dataArraySize / skipInterval;

  
    for ( var x = 0; x < X_NUM_PARTICLES; x ++ )
    { 
          for ( var y = 0; y < Y_NUM_PARTICLES; y ++ )
          {            
                // Sprite creation
                var mesh = new THREE.Sprite( spriteMaterial );
                
                mesh.scale.set(4,4,4);                 // scale
                mesh.position.x = x * OBJECTS_MARGIN;    // POSITION X
                mesh.position.y = 0;
                mesh.position.z = y * OBJECTS_MARGIN;    //POSITION Y
                scene.add( mesh );
                waveobjects.push(mesh); 
          }
    }

    let ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.intensity = 1.0;
    scene.add(ambientLight);

    // let spotLight = new THREE.SpotLight(0x6363ff); // purple-blue
    // spotLight.intensity = 1;
    // spotLight.position.set(-100, 400, 400);
    // spotLight.castShadow = false;
    // scene.add(spotLight);

    // let spotLight2 = new THREE.SpotLight(0x7de8ff); //light cyan //0xFF00FF);
    // spotLight2.intensity = 1;
    // spotLight2.position.set(-100, -400, -200);
    // spotLight2.castShadow = false;
    // scene.add(spotLight2);

    // let spotLight3 = new THREE.SpotLight(0x46c7a5); //seafoam
    // spotLight3.intensity = 1;
    // spotLight3.position.set(200, 0, 0);
    // spotLight3.castShadow = false;
    // scene.add(spotLight3);

    let orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.autoRotate = false;
    // orbitControls.autoRotateSpeed = 4.0;
    orbitControls.enableZoom = userZoomControls;
    orbitControls.enablePan = true;

    orbitControls.target.set(256, 256, 256);

    scene.add(group);

    // let hueInc = 20;
    // let i = 0;
    // let isHueIncrementing = true;

    const render = () => {
      // i++;
      // if (i === 4) {
      //   i = 0;
      //   isHueIncrementing ? hueInc++ : hueInc--;
      // }
      // if (hueInc === 90) {
      //   isHueIncrementing = false;
      // }
      // else if (hueInc === 20) {
      //   isHueIncrementing = true;
      // }
      // ambientLight.color.setHSL(hueInc/100,0.5,0.4);
      // ambientLight.intensity = 0.6;

      analyser.getByteFrequencyData(dataArray); //len FFTSize / 2 = 128

      // add thirds:
      let oneThirdI = dataArray.length / 3 - 1;
      let twoThirdsI = 2 * (dataArray.length / 3) - 1;

      let floor = 1;
      let lowThirdArray = dataArray.slice(floor, oneThirdI);
      let midThirdArray = dataArray.slice(oneThirdI, twoThirdsI);
      let hiThirdArray = dataArray.slice(twoThirdsI, dataArray.length - 1);

      let fourFifthsI = 4 * (dataArray.length / 5) - 1;
      let hiFifthArray = dataArray.slice(fourFifthsI, dataArray.length - 1);

      //orig: 2 halves
      let lowerHalfArray = dataArray.slice(0, dataArray.length / 2 - 1);
      let upperHalfArray = dataArray.slice(
        dataArray.length / 2 - 1,
        dataArray.length - 1
      );

      // LOGGING AUDIO FREQ IN CONSOLE, for debugging
      // console.log(asciichart.plot(dataArray, { height: 10 }))

      let overallAvg = avg(dataArray);
      let overallMax = max(dataArray);
      let lowerHalfMax = max(lowerHalfArray);
      let upperHalfMax = max(upperHalfArray);

      let lowThirdMax = max(lowThirdArray);
      let midThirdMax = max(midThirdArray);
      let hiThirdMax = max(hiThirdArray);

      let hiFifthMax = max(hiFifthArray);


      /// KNOBS
      //  halves
      let lowerHalfMaxFr = lowerHalfMax / lowerHalfArray.length;
      let upperHalfMaxFr = upperHalfMax / upperHalfArray.length;
  
      let lowerHalfAvg = avg(lowerHalfArray);
      let upperHalfAvg = avg(upperHalfArray);

      //  thirds
      let lowThirdMaxFr = lowThirdMax / lowThirdArray.length;
      let midThirdMaxFr = midThirdMax / midThirdArray.length;
      let hiThirdMaxFr = hiThirdMax / hiThirdArray.length;

      let lowThirdAvg = avg(lowThirdArray);
      let midThirdAvg = avg(midThirdArray);
      let hiThirdAvg = avg(hiThirdArray);

      // highest fifth
      let hiFifthMaxFr = hiFifthMax / hiFifthArray.length;
      let hiFifthAvgFr = avg(hiFifthArray);

      ////

      let midFr = modulate(midThirdMaxFr, 0, 1, 0, 0.002);

      let bassFr = modulate(Math.pow(lowThirdAvg, 0.8), 0, 1, 0.5, 8);
      let treFr = modulate(hiThirdMaxFr, 0, 1, 0.5, 4);

      let amp = 7;
      let time = window.performance.now();
      let rf = 0.00001;


      var delta = clock.getDelta();
      var elapsed = clock.elapsedTime;
          
      for(var i = 0 ; i < waveobjects.length ; i++){
        waveobjects[i].position.y =  WAVEHEIGHT * Math.cos(  
          WAVESPEED*(
            elapsed +
            (waveobjects[i].position.x /WAVEWIDTH) +
            (waveobjects[i].position.z /WAVEWIDTH))
        );
      }

      let j = 0;
      for ( var x = 0; x < X_NUM_PARTICLES; x ++ ){ 
        for ( var y = 0; y < Y_NUM_PARTICLES; y ++ ){            
          waveobjects[j].position.y *= Math.max(0.01*dataArray[x*skipInterval], 0.5); 
          j++;
      }
      }

      orbitControls.update();

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();
    setIsLoaded(true);
  }, [containerRef, setIsLoaded]);

  return (
    <div className={isLoaded ? styles.container : styles.containerNotLoaded} style={{ height: height, width: width }}>
      <div ref={containerRef}></div>
      <audio
        ref={audioRef}
        className={styles.audioPlayer}
        style={{ width: width, display: isPlayerVisible ? "default" : "none" }}
        controls
      ></audio>
    </div>
  );
};

export default MusicVisualizer;
