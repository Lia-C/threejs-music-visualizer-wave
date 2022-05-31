import React, { useEffect, useRef, useState } from "react";
import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
    let camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    //// SET CAMERA ZOOM according to music
    camera.position.set(0, 0, 400); 
    camera.lookAt(scene.position);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    containerRef.current.appendChild(renderer.domElement);
    renderer.setSize(width, height);

    let icosahedronGeometry = new THREE.IcosahedronGeometry(10, 10);
    let icosahedronGeometryOuter = new THREE.IcosahedronGeometry(600, 5);

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

    // background ball
    // let bgBall = new THREE.Mesh(icosahedronGeometryOuter, lambertMaterialOuter);
    // bgBall.position.set(0, 0, 0);

    // outer mesh ball
    let outerBall = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    outerBall.position.set(0, 0, 0);

    // inner crystals
    let innerBall = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 5), phongMaterial);
    innerBall.position.set(0, 0, 0);

    let outerBallInitVertices = [...outerBall.geometry.attributes.position.array];
    let innerBallInitVertices = [...innerBall.geometry.attributes.position.array];

    group.add(outerBall);
    group.add(innerBall);

    let ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.intensity = 0.5;
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight(0x6363ff); // purple-blue
    spotLight.intensity = 1;
    spotLight.position.set(-100, 400, 400);
    spotLight.castShadow = false;
    scene.add(spotLight);

    let spotLight2 = new THREE.SpotLight(0x7de8ff); //light cyan //0xFF00FF);
    spotLight2.intensity = 1;
    spotLight2.position.set(-100, -400, -200);
    spotLight2.castShadow = false;
    scene.add(spotLight2);

    let spotLight3 = new THREE.SpotLight(0x46c7a5); //seafoam
    spotLight3.intensity = 1;
    spotLight3.position.set(200, 0, 0);
    spotLight3.castShadow = false;
    scene.add(spotLight3);

    let orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.autoRotate = true;
    // orbitControls.autoRotateSpeed = 4.0;
    orbitControls.enableZoom = userZoomControls;

    scene.add(group);
    // scene.add(bgBall);
    let hueInc = 20;
    let i = 0;
    let isHueIncrementing = true;
    // let isCamZoomingIn = true;
    const render = () => {
      i++;
      if (i === 4) {
        i = 0;
        isHueIncrementing ? hueInc++ : hueInc--;
      }
      if (hueInc === 90) {
        isHueIncrementing = false;
      }
      else if (hueInc === 20) {
        isHueIncrementing = true;
      }
      ambientLight.color.setHSL(hueInc/100,0.5,0.4);
      ambientLight.intensity = 0.6;

      analyser.getByteFrequencyData(dataArray);
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

      console.log(asciichart.plot(dataArray, { height: 10 }))

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

      // OPTIONS: edit saturation 0.1 to 0.7
      innerBall.material.color.setHSL(0.51, 0.1, 0.5 + upperHalfMaxFr/2);

      const innerBallOffset = () => {
        const maxOffset = 200;
        return innerBall.geometry.parameters.radius +
          Math.min(maxOffset, 
            midFr + 
            treFr*0.7 +
            hiFifthMaxFr*0.5
          )
      };
   
      const innerBallNoise = (vertex: THREE.Vector3) => {
        const maxSpin = 100;
        const maxOffset = 200;
        return Math.min(maxOffset, 
          noise.noise3D(
            vertex.x + time * rf * 7 * overallMax * 0.01,
            vertex.y + time * rf * 8 * Math.min(treFr * 0.01, maxSpin),
            vertex.z + time * rf * 9 * Math.min(midFr * 0.01, maxSpin),
          ) *
            amp *
            treFr*0.5
           );
      };

      let maxInnerBallExtrusion = 0;

      for (let i = 0; i < innerBallInitVertices.length; i += 3) {
        let vertex = new THREE.Vector3(
          innerBallInitVertices[i],
          innerBallInitVertices[i + 1],
          innerBallInitVertices[i + 2]
        );
        vertex.normalize();

        let innerBallNoiseForVertex = innerBallNoise(vertex);

        maxInnerBallExtrusion = Math.max(maxInnerBallExtrusion, innerBallNoiseForVertex)
        
        vertex.multiplyScalar(innerBallOffset() + innerBallNoiseForVertex);

        innerBall.geometry.attributes.position.array[i] = vertex.x;
        innerBall.geometry.attributes.position.array[i + 1] = vertex.y;
        innerBall.geometry.attributes.position.array[i + 2] = vertex.z;
        innerBall.geometry.attributes.position.needsUpdate = true;
      }

      const outerBallOffset = () => {
        return outerBall.geometry.parameters.radius + 
        maxInnerBallExtrusion*0.5 +
        bassFr*0.15 +
        midFr*0.25 
      };

      const outerBallNoise = (vertex: THREE.Vector3) => {
        return noise.noise3D(
          vertex.x + (time + 5) * rf * 20 + Math.min(2, lowThirdAvg * 0.01),
          vertex.y + (time + 5) * rf * 15 + Math.min(3, midThirdAvg * 0.01)*innerBallOffset()*0.01,
          vertex.z + (time + 5) * rf * 15 + Math.min(1, overallMax * 0.01),
        ) *
          amp * overallMax * 0.005
      };

      for (let i = 0; i < outerBallInitVertices.length; i += 3) {
        let vertex = new THREE.Vector3(
          outerBallInitVertices[i],
          outerBallInitVertices[i + 1],
          outerBallInitVertices[i + 2]
        );
        vertex.normalize();

        vertex.multiplyScalar(outerBallOffset() + outerBallNoise(vertex));

        outerBall.geometry.attributes.position.array[i] = vertex.x;
        outerBall.geometry.attributes.position.array[i + 1] = vertex.y;
        outerBall.geometry.attributes.position.array[i + 2] = vertex.z;
        outerBall.geometry.attributes.position.needsUpdate = true;
      }
      group.rotation.y += 0.003;
      outerBall.rotation.y -= 0.0015;
      outerBall.rotation.x += 0.0015;

      const MAX_ZOOM_IN_DIST = 50;
      const MAX_ZOOM_OUT_DIST = 1000;
      const CAM_ZOOM_SPEED = 1;
      
      
      // if (isCamZoomingIn){
      //   camera.position.z -= CAM_ZOOM_SPEED
      // } else{
      //   camera.position.z += CAM_ZOOM_SPEED
      // }

      // // update isCamZoomingIn if needed
      // if (camera.position.z >= MAX_ZOOM_OUT_DIST){
      //   isCamZoomingIn = true;
      // } 

      // if (camera.position.z <= MAX_ZOOM_IN_DIST){
      //   isCamZoomingIn = false;
      // }

      // console.log(isCamZoomingIn);

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
