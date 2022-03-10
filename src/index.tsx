import React from "react";
import { render } from "react-dom";
import MusicVisualizer from "./MusicVisualizer/MusicVisualizer";
import audioUrl from "./assets/audio/kilby_girl.mp3";
import "./style.css";

const root = document.getElementById("root");

const onDocumentClicked = () => {
  render(
    <>{new Array(16).fill(0).map(() => 
        <MusicVisualizer
        width={300}
        height={300}
        audioUrl={audioUrl}
        isPlayerVisible={true}
        autoplay={false}
      />
    )}
    </>,
    root
  );
};

render(<div id="continue">{"CLICK TO CONTINUE"}</div>, root);

document.body.addEventListener("click", onDocumentClicked);
