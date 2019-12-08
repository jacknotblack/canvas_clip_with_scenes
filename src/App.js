import React, {
  Component,
  memo,
  createRef,
  useRef,
  useEffect,
  useState,
  useCallback
} from "react";
import { Stage, Layer, Text, Image } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import "./App.css";

const scenes = [
  {
    index: 0,
    sentence: "This is a simple Javascript test",
    media: "https://via.placeholder.com/640x360.jpg",
    duration: 3
  },
  {
    index: 1,
    sentence: "This is a simple Javascript test2",
    media: "https://via.placeholder.com/320x180.jpg",
    duration: 3
  },
  {
    index: 2,
    sentence: "Here comes the video!",
    media:
      "https://media.gettyimages.com/videos/goodlooking-young-woman-incasual-clothing-is-painting-in-workroom-video-id1069900546",
    duration: 5
  },
  {
    index: 3,
    sentence: "This is a simple Javascript test",
    media: "https://via.placeholder.com/640x360.jpg",
    duration: 3
  },
  {
    index: 4,
    sentence: "Here comes the video2!",
    media:
      "https://media.gettyimages.com/videos/goodlooking-young-woman-incasual-clothing-is-painting-in-workroom-video-id1069900546",
    duration: 5
  }
];

const config = {
  startingPoint: [0, 5, 0, 5]
};

class CanvasVideo extends React.Component {
  constructor(props) {
    super(props);
    const video = document.createElement("video");
    video.src = props.src;
    video.muted = true;
    this.state = {
      video: video
    };
    this.video = video;
    this.videoRef = createRef();
  }

  startVideo = () => {
    const { startingPoint, onReady, setRef } = this.props;
    if (this.video.currentTime === 0 && startingPoint) {
      this.video.currentTime = startingPoint;
      return;
    }
    setRef(this.videoRef);
    onReady(true);
    this.video.play();
    this.videoRef.current.getLayer().batchDraw();
    this.requestUpdate();
  };

  componentDidUpdate(prevProps) {
    const { playState, active } = this.props;
    if (!active) return;
    if (!prevProps.active) {
      if (this.video.readyState === 4) {
        this.startVideo();
      } else {
        this.video.addEventListener("canplay", () => {
          this.startVideo();
        });
      }
    }
    if (
      prevProps.playState === "play" &&
      (playState === "stop" || playState === "pause")
    ) {
      this.video.pause();
      return;
    }
    if (prevProps.playState === "pause" && playState === "play") {
      this.video.play();
    }
  }

  requestUpdate = () => {
    if (this.videoRef.current === null) return;
    this.videoRef.current.getLayer().batchDraw();
    requestAnimationFrame(this.requestUpdate);
  };
  render() {
    const { width, height, opacity } = this.props;
    return (
      <Image
        ref={this.videoRef}
        x={0}
        y={0}
        width={width}
        height={height}
        opacity={opacity}
        image={this.state.video}
      />
    );
  }
}

const CanvasImage = memo(
  ({ src, width, height, opacity, onReady, setRef, active }) => {
    const [image] = useImage(src);
    const imageRef = useRef(null);

    useEffect(() => {
      if (active && image !== undefined) {
        setRef(imageRef);
        onReady(true);
      }
    }, [image, onReady, active, setRef]);

    return (
      <Image
        image={image}
        width={width}
        height={height}
        opacity={opacity}
        ref={imageRef}
      />
    );
  }
);
class CanvasContainer extends Component {
  state = {
    sceneIdx: 0,
    timer: null,
    elapsed: null,
    playState: null
  };

  audioRef = createRef();

  startTick = () => {
    const { playState, elapsed, sceneIdx } = this.state;
    setTimeout(() => {
      if (playState === "play") {
        this.setState(state => ({ elapsed: state.elapsed + 1 }));
        console.log(elapsed + 1);
        if (elapsed + 1 >= scenes[sceneIdx].duration) {
          if (sceneIdx === scenes.length - 1) {
            this.setState({ playState: "stop" });
            this.audioRef.current.pause();
          } else {
            console.log("changeScene");
            this.tweenFadeIn.reverse();
            this.setState(state => ({
              sceneIdx: state.sceneIdx + 1,
              elapsed: 0
            }));
          }
          return;
        }
        this.startTick();
      }
    }, 1000);
  };

  startTimer = nodeRef => {
    if (!nodeRef) return;
    this.setState({ elapsed: 0, playState: "play" });
    this.startTick();
    // if (!nodeRef) return;
    this.tweenFadeIn = new Konva.Tween({
      node: nodeRef.current,
      duration: 0.7,
      opacity: 1
    });
    this.tweenFadeIn.play();
  };

  playPause = () => {
    if (this.state.playState === "stop") return;
    if (this.state.playState === "play") {
      this.audioRef.current.pause();
      this.setState({ playState: "pause" });
    } else {
      this.setState({ playState: "play" });
      this.audioRef.current.play();
      this.startTick();
    }
  };

  emptyFunc = () => {};

  render() {
    const { sceneIdx, playState, elapsed } = this.state;
    return (
      <div className="App">
        <Stage width={320} height={180} onClick={this.playPause}>
          <Layer>
            {scenes.map((scene, idx) => {
              const isImage = scene.media.includes(".jpg");
              return isImage ? (
                <CanvasImage
                  key={scene.index}
                  src={scene.media}
                  width={320}
                  height={180}
                  setRef={this.startTimer}
                  onReady={this.emptyFunc}
                  opacity={0}
                  active={sceneIdx === idx}
                />
              ) : (
                <CanvasVideo
                  key={scene.index}
                  src={scene.media}
                  width={320}
                  height={180}
                  setRef={this.startTimer}
                  onReady={this.emptyFunc}
                  opacity={0}
                  active={sceneIdx === idx}
                  playState={playState}
                  startingPoint={config.startingPoint[sceneIdx]}
                />
              );
            })}
          </Layer>

          <Layer>
            <Text
              text={`${scenes[sceneIdx].sentence} Elapsed: ${elapsed} sec`}
              fontSize={20}
              fill="white"
              align="center"
              verticalAlign="bottom"
              width={320}
              height={180}
            />
          </Layer>
        </Stage>
        <iframe
          src="silence.mp3"
          allow="autoplay"
          id="audio"
          style={{ display: "none" }}
        ></iframe>
        <audio id="player" autoPlay ref={this.audioRef}>
          <source src="bgm.mp3" type="audio/mp3" />
        </audio>
      </div>
    );
  }
}

const CanvasHookContainer = () => {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playState, setPlayState] = useState(null);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [currentMediaRef, setCurrentMediaRef] = useState(null);
  const [tweenFadeIn, setTweenFadeIn] = useState(null);

  const audioRef = useRef(null);
  const elapsedRef = useRef(null);
  const playStateRef = useRef(null);

  const startTick = useCallback(
    tweenFadeIn => {
      if (playState !== "play") return;
      setTimeout(() => {
        const elapsed = elapsedRef.current;
        const playState = playStateRef.current;
        if (playState === "play") {
          setElapsed(elapsed => elapsed + 1);
          elapsedRef.current += 1;
          console.log(elapsed + 1);
          if (elapsed + 1 >= scenes[sceneIdx].duration) {
            if (sceneIdx === scenes.length - 1) {
              setPlayState("stop");
              audioRef.current.pause();
            } else {
              console.log("changeScene");
              tweenFadeIn.reverse();
              setIsMediaReady(false);
              setSceneIdx(sceneIdx => sceneIdx + 1);
              setElapsed(0);
            }
            return;
          } else startTick(tweenFadeIn);
        }
      }, 1000);
    },
    [sceneIdx, playState]
  );

  const startTimer = useCallback(() => {
    if (!currentMediaRef.current || playState !== "play") return;
    setElapsed(0);
    elapsedRef.current = 0;
    const tweenFadeIn = new Konva.Tween({
      node: currentMediaRef.current,
      duration: 0.7,
      opacity: 1
    });
    setTweenFadeIn(tweenFadeIn);
    tweenFadeIn.play();
    startTick(tweenFadeIn);
  }, [playState, startTick, currentMediaRef]);

  useEffect(() => {
    if (
      isMediaReady &&
      playState !== "stop" &&
      playState !== "pause" &&
      playStateRef.current !== "pause"
    ) {
      setPlayState("play");
      startTimer(currentMediaRef);
    }
  }, [isMediaReady, currentMediaRef, playState, playStateRef, startTimer]);

  useEffect(() => {
    if (playStateRef.current === "pause" && playState === "play") {
      audioRef.current.play();
      startTick(tweenFadeIn);
    }
    if (playStateRef.current === "play" && playState === "pause") {
      audioRef.current.pause();
    }
  }, [playState, playStateRef, startTick, tweenFadeIn]);

  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

  const playPause = () => {
    if (playState === "stop") return;
    if (playState === "play") {
      setPlayState("pause");
    } else {
      setPlayState("play");
    }
  };
  return (
    <div className="App">
      <Stage width={320} height={180} onClick={playPause}>
        <Layer>
          {scenes.map((scene, idx) => {
            const isImage = scene.media.includes(".jpg");
            return isImage ? (
              <CanvasImage
                key={scene.index}
                src={scene.media}
                width={320}
                height={180}
                onReady={setIsMediaReady}
                setRef={setCurrentMediaRef}
                opacity={0}
                active={sceneIdx === idx}
              />
            ) : (
              <CanvasVideo
                key={scene.index}
                src={scene.media}
                width={320}
                height={180}
                onReady={setIsMediaReady}
                setRef={setCurrentMediaRef}
                opacity={0}
                active={sceneIdx === idx}
                playState={playState}
                startingPoint={config.startingPoint[sceneIdx]}
              />
            );
          })}
        </Layer>

        <Layer>
          <Text
            text={`${scenes[sceneIdx].sentence} Elapsed: ${elapsed} sec`}
            fontSize={16}
            fill="white"
            align="center"
            verticalAlign="bottom"
            width={320}
            height={180}
          />
        </Layer>
      </Stage>
      <iframe
        src="silence.mp3"
        allow="autoplay"
        id="audio"
        style={{ display: "none" }}
      ></iframe>
      <audio id="player" autoPlay ref={audioRef}>
        <source src="bgm.mp3" type="audio/mp3" />
      </audio>
    </div>
  );
};

const App = () => {
  return (
    <div>
      {/* <CanvasContainer /> */}
      <CanvasHookContainer />
    </div>
  );
};

export default App;
