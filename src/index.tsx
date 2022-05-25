import React from "react";
import { render } from "react-dom";
import MusicVisualizer from "./MusicVisualizer/MusicVisualizer";
import audioUrl1 from "./assets/audio/mark_37k_feet.mp3";
import audioUrl2 from "./assets/audio/kilby_girl.mp3";
import audioUrl3 from "./assets/audio/audiotest2/5000-9800Hz-presence.mp3";
import "./style.css";

const root = document.getElementById("root");

const onDocumentClicked = () => {
  render(
    <>
    <MusicVisualizer
        width={900}
        height={900}
        audioUrl={audioUrl1}
        isPlayerVisible={true}
        autoplay={true}
    />
    </>,
    root
  );
};

render(<div id="continue">{"CLICK TO CONTINUE"}</div>, root);

document.body.addEventListener("click", onDocumentClicked);
