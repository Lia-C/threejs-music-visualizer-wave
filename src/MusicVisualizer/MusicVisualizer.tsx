import React, { useEffect, useRef, useState } from "react";
import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import styles from "./MusicVisualizer.module.scss";
import { avg, max, modulate } from "./MusicVisualizerHelpers";

interface Props {
  width: number;
  height: number;
  audioUrl: string;
  isPlayerVisible?: boolean;
  autoplay?: boolean;
}

const FFTSize = 512;

const MusicVisualizer: React.FC<Props> = ({
  width,
  height,
  audioUrl,
  isPlayerVisible,
  autoplay,
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>();
  const audioRef = useRef<HTMLAudioElement>();

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

    camera.position.set(0, 0, 350);
    camera.lookAt(scene.position);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    containerRef.current.appendChild(renderer.domElement);
    renderer.setSize(width, height);

    let icosahedronGeometry = new THREE.IcosahedronGeometry(10, 10);

    let lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0x76a5af, // grey bluegreen,
      wireframe: true,
      opacity: 0.3,
      transparent: true,
    });

    let material2 = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
    });

    let ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);

    let ball2 = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 5), material2);
    ball2.position.set(0, 0, 0);

    let ballInitVertices = [...ball.geometry.attributes.position.array];
    let ball2InitVertices = [...ball2.geometry.attributes.position.array];

    group.add(ball);
    group.add(ball2);

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

    scene.add(group);
    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      // add thirds:
      let oneThirdI = dataArray.length / 3 - 1;
      let twoThirdsI = 2 * (dataArray.length / 3) - 1;
      let lowArray = dataArray.slice(0, oneThirdI);
      let midArray = dataArray.slice(oneThirdI, twoThirdsI);
      let hiArray = dataArray.slice(twoThirdsI, dataArray.length - 1);

      let lowMax = max(lowArray);
      let lowAvg = avg(lowArray);
      let midMax = max(midArray);
      let midAvg = avg(midArray);
      let hiMax = max(hiArray);
      let hiAvg = avg(hiArray);

      //orig: 2 halves
      let lowerHalfArray = dataArray.slice(0, dataArray.length / 2 - 1);
      let upperHalfArray = dataArray.slice(
        dataArray.length / 2 - 1,
        dataArray.length - 1
      );

      let overallAvg = avg(dataArray);
      let overallMax = max(dataArray);
      let lowerMax = max(lowerHalfArray);
      let lowerAvg = avg(lowerHalfArray);
      let upperMax = max(upperHalfArray);
      let upperAvg = avg(upperHalfArray);

      let lowerMaxFr = lowerMax / lowerHalfArray.length;
      let lowerAvgFr = lowerAvg / lowerHalfArray.length;
      let upperMaxFr = upperMax / upperHalfArray.length;
      let upperAvgFr = upperAvg / upperHalfArray.length;

      let midFr = modulate(midMax, 0, 1, 0, 0.002);

      let bassFr = modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0.5, 8);
      let treFr = modulate(upperMaxFr, 0, 1, 0.5, 4);

      let amp = 7;
      let time = window.performance.now();
      let rf = 0.00001;

      for (let i = 0; i < ball2InitVertices.length; i += 3) {
        let offset = ball2.geometry.parameters.radius;
        let vertex = new THREE.Vector3(
          ball2InitVertices[i],
          ball2InitVertices[i + 1],
          ball2InitVertices[i + 2]
        );
        vertex.normalize();
        let distance =
          offset +
          midFr +
          noise.noise3D(
            vertex.x + time * rf * 7 * overallMax * 0.01,
            vertex.y + time * rf * 8 * bassFr * 0.01,
            vertex.z + time * rf * 9 * treFr * 0.01,
          ) *
            amp *
            treFr;
        vertex.multiplyScalar(distance);

        ball2.geometry.attributes.position.array[i] = vertex.x;
        ball2.geometry.attributes.position.array[i + 1] = vertex.y;
        ball2.geometry.attributes.position.array[i + 2] = vertex.z;
        ball2.geometry.attributes.position.needsUpdate = true;
      }

      for (let i = 0; i < ballInitVertices.length; i += 3) {
        let offset = ball.geometry.parameters.radius;
        let vertex = new THREE.Vector3(
          ballInitVertices[i],
          ballInitVertices[i + 1],
          ballInitVertices[i + 2]
        );
        vertex.normalize();
        let distance =
          overallAvg * 0.5 +
          offset +
          bassFr*2 +
          treFr*1.5 +
          noise.noise3D(
            vertex.x + (time + 5) * rf * 7 + Math.min(2, midAvg * 0.01),
            vertex.y + (time + 5) * rf * 8 + Math.min(3, midAvg * 0.01),
            vertex.z + (time + 5) * rf * 9 + Math.min(1, midAvg * 0.01)
          ) *
            amp * overallMax * 0.01;
        vertex.multiplyScalar(distance);

        ball.geometry.attributes.position.array[i] = vertex.x;
        ball.geometry.attributes.position.array[i + 1] = vertex.y;
        ball.geometry.attributes.position.array[i + 2] = vertex.z;
        ball.geometry.attributes.position.needsUpdate = true;
      }
      group.rotation.y += 0.003;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();
  }, [containerRef]);

  return (
    <div className={styles.container} style={{ height: height, width: width }}>
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
