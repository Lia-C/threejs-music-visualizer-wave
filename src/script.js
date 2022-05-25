import SimplexNoise from 'simplex-noise';
import kiddiegoggles from './assets/audio/Kilby_Girl.mp3';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import './style.css';
import { FlatShading, Mesh, TorusKnotBufferGeometry } from 'three';

let isInited = false;
const onDocumentClicked = () => {
    // click only once
    if (isInited) {
        return;
    }
    isInited = true;

    let mouse = new THREE.Vector2()
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    //initialise simplex noise instance
    let noise = new SimplexNoise();

    // // create an AudioListener and add it to the camera
    // const listener = new THREE.AudioListener();

    // // // create an Audio source
    // const sound = new THREE.Audio( listener );

    // // load a sound and set it as the Audio object's buffer
    // const audioLoader = new THREE.AudioLoader();
    // audioLoader.load( kiddiegoggles, function( buffer ) {
    //     sound.setBuffer( buffer );
    //     sound.setLoop(true);
    //     sound.setVolume(0.5);
    // });

    function vizInit() {
        let context = new AudioContext();
        let audio = document.getElementById("audio");
        audio.src = kiddiegoggles;
        audio.load();
        audio.play();

        let src = context.createMediaElementSource(audio);  
        
        let analyser = context.createAnalyser();
        src.connect(analyser);
        analyser.connect(context.destination);
        analyser.fftSize = 512;
        let bufferLength = analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);

        //here comes the webgl
        let scene = new THREE.Scene();
        let group = new THREE.Group();
        let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0,0,200);
        camera.lookAt(scene.position);
        scene.add(camera);

        let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        let planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        let planeMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
        });
        
        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -0.5 * Math.PI;
        plane.position.set(0, 30, 0);

        scene.add(plane);
        
        let plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
        plane2.rotation.x = -0.5 * Math.PI;
        plane2.position.set(0, -30, 0);
        scene.add(plane2);

        let icosahedronGeometry = new THREE.IcosahedronGeometry(10, 10);
        // let torusGeometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
        

        let lambertMaterial = new THREE.MeshLambertMaterial({
            color: 0x76A5AF, // grey bluegreen,
            wireframe: true,
            linewidth: 0.1,
            opacity: 0.3,
            transparent: true,
        });
        let material2 = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            // wireframe: true,
            flatShading: true,
        });
        // let torusmaterial = new THREE.MeshNormalMaterial({
        //     // wireframe: true,
        //     // vertexColors : true,
        //     flatShading : true,
        // });

        // let torus = new THREE.Mesh(torusGeometry,  torusmaterial);


        // torus.position.set(0, 0, 0);
        // group.add(torus)
        // scene.add(torus);

        let ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
        ball.position.set(0, 0, 0);

        let ball2 = new THREE.Mesh(
            new THREE.IcosahedronGeometry(6, 5), 
            material2
        );
        ball2.position.set(0, 0, 0);

        let ballInitVertices = [...ball.geometry.attributes.position.array];
        let ball2InitVertices = [...ball2.geometry.attributes.position.array];
        // let torusInitVertices = [...torus.geometry.attributes.position.array];

        group.add(ball);
        group.add(ball2);

        let ambientLight = new THREE.AmbientLight(0xffffff);
        ambientLight.intensity = 0.5
        scene.add(ambientLight);

        let spotLight = new THREE.SpotLight(0x6363FF); // purple-blue
        spotLight.intensity = 1;
        spotLight.position.set(-100, 400, 400);
        spotLight.lookAt(ball);
        spotLight.castShadow = false;
        scene.add(spotLight);

        let spotLight2 = new THREE.SpotLight(0x7DE8FF); //light cyan //0xFF00FF);
        spotLight2.intensity = 1;
        spotLight2.position.set(-100, -400, -200);
        spotLight2.lookAt(ball);
        spotLight2.castShadow = false;
        scene.add(spotLight2);
        
        let spotLight3 = new THREE.SpotLight(0x46C7A5); //seafoam
        spotLight3.intensity = 1;
        spotLight3.position.set(200, 0, 0);
        spotLight3.lookAt(ball);
        spotLight3.castShadow = false;
        scene.add(spotLight3);

        let orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.autoRotate = true;
        
        scene.add(group);

        document.getElementById('out').appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);

        render();
        function render() {
        analyser.getByteFrequencyData(dataArray);

        // add thirds:
        let oneThirdI = (dataArray.length/3) - 1;
        let twoThirdsI = 2*(dataArray.length/3) - 1;
        let lowArray = dataArray.slice(0, oneThirdI);
        let midArray = dataArray.slice(oneThirdI, twoThirdsI);
        let hiArray = dataArray.slice(twoThirdsI, dataArray.length-1);

        let lowMax = max(lowArray);
        let lowAvg = avg(lowArray);
        let midMax = max(midArray);
        let midAvg = avg(midArray);
        let hiMax = max(hiArray);
        let hiAvg = avg(hiArray);

        //orig: 2 halves
        let lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
        let upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

        let overallAvg = avg(dataArray);
        let lowerMax = max(lowerHalfArray);
        let lowerAvg = avg(lowerHalfArray);
        let upperMax = max(upperHalfArray);
        let upperAvg = avg(upperHalfArray);

        let lowerMaxFr = lowerMax / lowerHalfArray.length;
        let lowerAvgFr = lowerAvg / lowerHalfArray.length;
        let upperMaxFr = upperMax / upperHalfArray.length;
        let upperAvgFr = upperAvg / upperHalfArray.length;

        let midFr = modulate(midMax, 0, 1, 0, 0.002);

        let mouseXNormalized = modulate(mouse.x, -1, 1, 0, 1);
        let mouseYNormalized = modulate(mouse.y, -1, 1, 0, 1);

        // console.log(mouseXNormalized, mouseYNormalized)

        let bassFr =  modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0.5, 8);
        let treFr = modulate(upperMaxFr, 0, 1, 0.5, 4);

        
        let amp = 7;
        let time = window.performance.now();
        let rf = 0.00001;

        // for (let i = 0; i < torusInitVertices.length ; i += 3){
        //     let offset = torus.geometry.parameters.radius;
        //     let vertex = new THREE.Vector3(torusInitVertices[i], torusInitVertices[i+1], torusInitVertices[i+2])
        //     vertex.normalize();
        //     let distance = (offset + midFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr ;
        //     vertex.multiplyScalar(midFr);

        //     torus.geometry.attributes.position.array[i] = vertex.x
        //     torus.geometry.attributes.position.array[i+1] = vertex.y
        //     torus.geometry.attributes.position.array[i+2] = vertex.z
        //     torus.geometry.attributes.position.needsUpdate = true;
        // }

        for (let i = 0; i < ball2InitVertices.length ; i += 3){
            let offset = ball2.geometry.parameters.radius;
            let vertex = new THREE.Vector3(ball2InitVertices[i], ball2InitVertices[i+1], ball2InitVertices[i+2])
            vertex.normalize();
            let distance = (offset + midFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr ;
            vertex.multiplyScalar(distance);

            ball2.geometry.attributes.position.array[i] = vertex.x
            ball2.geometry.attributes.position.array[i+1] = vertex.y
            ball2.geometry.attributes.position.array[i+2] = vertex.z
            ball2.geometry.attributes.position.needsUpdate = true;
        }

        for (let i = 0; i < ballInitVertices.length ; i += 3){
            let offset = ball.geometry.parameters.radius;
        // for (let i = 0; i < verticesArr.length; i = i + 3){
            // let x = verticesArr[i];
            // let y = verticesArr[i+1];
            // let z = verticesArr[i+2];
            // let vertex = new THREE.Vector3(x,y,z)

            // console.log(ballInitVertices);
            
            // vertex.x = ballInitVertices[i] + modulate(lowerMaxFr, 0, 1, -1, 1);
            // vertex.y = ballInitVertices[i+1] + modulate(lowerMaxFr, 0, 1, -1, 1);
            // vertex.z = ballInitVertices[i+2] + modulate(lowerMaxFr, 0, 1, -1, 1);

            // // every vertex will be scaled larger
            let scaleFactor = 1.0;
            // if (i % 100 == 0 || (i-1) % 100 == 0 || (i+1) % 100 == 0 ){
            //     scaleFactor = 1.0; //modulate(lowerMaxFr, 0, 1, 1, 1.5)
            // } else if (i % 50 == 0){
            //     scaleFactor = modulate(upperAvgFr, 0, 1, 1, 4.0)
            // } else {
            //     scaleFactor = 1.0
            // }
            
            // vertex.x = ballInitVertices[i] * scaleFactor 
            // vertex.y = ballInitVertices[i+1] * scaleFactor
            // vertex.z = ballInitVertices[i+2] * scaleFactor 

            let vertex = new THREE.Vector3(ballInitVertices[i], ballInitVertices[i+1], ballInitVertices[i+2])
            vertex.normalize();
            let distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr ;
            vertex.multiplyScalar(distance);
            vertex.multiplyScalar(scaleFactor);
        
            // vertex += noise.noise3D(vertex.x, vertex.y, vertex.z)
            // vertex.multiplyScalar(scaleFactor);

            ball.geometry.attributes.position.array[i] = vertex.x
            ball.geometry.attributes.position.array[i+1] = vertex.y
            ball.geometry.attributes.position.array[i+2] = vertex.z
            ball.geometry.attributes.position.needsUpdate = true;

            // ball.geometry.verticesNeedUpdate = true;
            // ball.geometry.normalsNeedUpdate = true;
            // ball.geometry.computeVertexNormals();
            // ball.geometry.computeFaceNormals();
          
        }


        //REMOVE THIS LATER, just inits for testing
        // let lowerMaxFr = 0.5
        // let upperAvgFr = 0.5
        // makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

        group.rotation.y += 0.003;
        // torus.rotation.z -= 0.003;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    };


    window.onload = vizInit();

    document.body.addEventListener('touchend', function(ev) { context.resume(); });


    //some helper functions here
    function fractionate(val, minVal, maxVal) {
        return (val - minVal)/(maxVal - minVal);
    }

    function modulate(val, minVal, maxVal, outMin, outMax) {
        let fr = fractionate(val, minVal, maxVal);
        let delta = outMax - outMin;
        return outMin + (fr * delta);
    }

    function avg(arr){
        let total = arr.reduce(function(sum, b) { return sum + b; });
        return (total / arr.length);
    }

    function max(arr){
        return arr.reduce(function(a, b){ return Math.max(a, b); })
    }
}

document.body.addEventListener('click', onDocumentClicked);
