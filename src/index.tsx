import React from "react";
import { render } from "react-dom";
import MusicVisualizer from "./MusicVisualizer/MusicVisualizer";
import audioUrl from "./assets/audio/mark_37k_feet.mp3";
//import audioUrl2 from "./assets/audio/kilby_girl.mp3";
import "./style.css";

const root = document.getElementById("root");

const onDocumentClicked = () => {
  render(
    <>
    <MusicVisualizer
        width={900}
        height={900}
        audioUrl={audioUrl}
        isPlayerVisible={true}
        autoplay={true}
    />
    </>,
    root
  );
};

render(<div id="continue">{"CLICK TO CONTINUE"}</div>, root);

document.body.addEventListener("click", onDocumentClicked);
