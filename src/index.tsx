import React from "react";
import { render } from "react-dom";
import MusicVisualizer from "./MusicVisualizer/MusicVisualizer";
import audioUrl1 from "./assets/audio/mark_37k_feet.mp3";
import audioUrl2 from "./assets/audio/kilby_girl.mp3";
import audioUrl3 from "./assets/audio/audiotest2/5000-9800Hz-presence.mp3";
import audioUrl4 from "./assets/audio/everwave-homepage-track.mp3";
import "./style.css";

const root = document.getElementById("root");

const size = 610;
const isAutoplayOn = false;

const onDocumentClicked = () => {
  render(
    <>

    <h1>|-------------- homepage track ----------- | ------------ mark 37,000feet -----------| -------------- kilby girl --------------|</h1>
    <MusicVisualizer
        width={size}
        height={size}
        audioUrl={audioUrl4}
        isPlayerVisible={true}
        autoplay={isAutoplayOn}
        userZoomControls={true}
    />

    <MusicVisualizer
            width={size}
            height={size}
            audioUrl={audioUrl1}
            isPlayerVisible={true}
            autoplay={isAutoplayOn}
            userZoomControls={true}
        />

    <MusicVisualizer
            width={size}
            height={size}
            audioUrl={audioUrl2}
            isPlayerVisible={true}
            autoplay={isAutoplayOn}
            userZoomControls={true}
        />

    </>,
    root
  );
};

render(<div id="continue">{"CLICK TO CONTINUE"}</div>, root);

document.body.addEventListener("click", onDocumentClicked);
