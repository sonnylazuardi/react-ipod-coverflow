import * as React from "react";
import ReactDOM from "react-dom";

import "./styles.css";

import ZingTouch from "zingtouch/src/ZingTouch";

import NextIcon from "./next.png";
import PrevIcon from "./prev.png";
import PlayIcon from "./play.png";

import Coverflow from "react-coverflow";
let currentAngle;
let imageLength = 0;
let lastRoundAngle = 0;

const RotateWheel = props => {
  const target = React.useRef(null);
  const hiddenInput = React.useRef(null);
  const rotatable = React.useRef(null);
  const [figmaUrl, setFigmaUrl] = React.useState("");
  const [images, setImages] = React.useState([]);
  const [urls, setUrls] = React.useState([]);
  const [active, setActive] = React.useState(-1);
  const [showDialog, setShowDialog] = React.useState(true);

  const increaseActive = () => {
    setActive(active => {
      console.log(active);
      let nextActive = active + 1;
      if (nextActive >= imageLength) nextActive = 0;
      console.log(nextActive);
      return nextActive;
    });
  };

  const decreaseActive = () => {
    setActive(active => {
      let nextActive = active - 1;
      if (nextActive < 0) nextActive = imageLength - 1;
      return nextActive;
    });
  };

  const closeDialog = () => {
    localStorage.setItem("hideDialog", "true");
    setShowDialog(false);
  };

  React.useEffect(() => {
    if (localStorage.getItem("hideDialog") === "true") {
      setShowDialog(false);
    }

    var region = new ZingTouch.Region(target.current);
    var customTap = new ZingTouch.Tap({ maxDelay: 200 });
    currentAngle = 0;

    region.bind(target.current, "rotate", e => {
      currentAngle += e.detail.distanceFromLast;
      const myAngle = Math.round(currentAngle % 360);

      if (Math.abs(lastRoundAngle - myAngle) >= 15) {
        if (e.detail.distanceFromLast > 0) {
          increaseActive();
        } else {
          decreaseActive();
        }
        lastRoundAngle = myAngle;
      }

      rotatable.current.style.transform = "rotate(" + currentAngle + "deg)";
    });
    region.bind(target.current, customTap, e => {
      setShowDialog(show => {
        if (show) {
          localStorage.setItem("hideDialog", "true");
          return false;
        } else {
          localStorage.setItem("hideDialog", "false");
          return true;
        }
      });
    });

    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get("query") || "";
    if (query !== "") {
      setFigmaUrl(`https://www.figma.com/file/${query}/podcast-ipod`);
    } else {
      setFigmaUrl(
        `https://www.figma.com/file/eehgZNrMVeKZ48OcHyb5A1/podcast-ipod`
      );
    }
  }, []);

  React.useEffect(() => {
    const splitUrl = figmaUrl.split("/");
    const figmaId = splitUrl[4];
    fetch(`https://api.figma.com/v1/files/${figmaId}`, {
      method: "get",
      headers: {
        "X-FIGMA-TOKEN": "28243-14f9dd9c-e111-4243-b375-caca1171b18c",
      },
    })
      .then(res => res.json())
      .then(result => {
        if (result.err) {
          console.log("ERROR");
          setImages([]);
          return;
        }

        const resultMap = result.document.children[0].children.sort((a, b) => {
          return a.absoluteBoundingBox.x - b.absoluteBoundingBox.x;
        });
        const imageMap = resultMap.map(item => {
          return item.id;
        });

        const urlMap = resultMap.map(item => {
          return item.name;
        });

        setUrls(urlMap);
        const imagesUrl = `https://api.figma.com/v1/images/${figmaId}?ids=${imageMap.join(
          ","
        )}`;

        console.log("MAP", imagesUrl);

        fetch(imagesUrl, {
          method: "get",
          headers: {
            "X-FIGMA-TOKEN": "28243-14f9dd9c-e111-4243-b375-caca1171b18c",
          },
        })
          .then(res => res.json())
          .then(result => {
            let myImages = [];
            Object.keys(result.images).forEach(key => {
              myImages.push(result.images[key]);
            });
            console.log("RES", myImages);
            setImages(myImages);
            imageLength = myImages.length;
            setActive(0);
          });
      });
  }, [figmaUrl]);
  return (
    <div className="bg">
      <div className="wrapper">
        <Coverflow
          displayQuantityOfSide={1}
          height={300}
          width={300}
          infiniteScroll
          active={active}
          enableHeading={false}
          currentFigureScale={1.8}
          otherFigureScale={1.5}
        >
          {images.map((image, i) => {
            return <img key={i} src={image} alt="" />;
          })}
        </Coverflow>
      </div>
      <div
        style={{
          width: 300,
          height: 300,
          margin: "0 auto",
          marginTop: 30,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 150,
            background:
              "linear-gradient(0deg, rgba(56,56,56,1) 0%, rgba(19,19,19,1) 35%, rgba(0,0,0,1) 100%)",
            marginTop: 30,
          }}
          ref={target}
        />
        <a
          href="#/"
          style={{
            width: 125,
            height: 125,
            position: "absolute",
            left: 86,
            top: 86,
            borderRadius: 65,
            background: "linear-gradient(90deg, #6B778E 0%, #B4C4E0 100%)",
          }}
          className="btn-go"
          ref={rotatable}
          onClick={e => {
            window.location.href = urls[active];
          }}
        >
          {" "}
        </a>
        <div className="menu">MENU</div>
        <div className="next">
          <img src={NextIcon} className="icon" alt="next" />
        </div>
        <div className="prev">
          <img src={PrevIcon} className="icon" alt="prev" />
        </div>
        <div className="plays">
          <img src={PlayIcon} className="icon" alt="prev" />
        </div>
      </div>

      {showDialog ? (
        <div className="settings">
          <div className="settings-box">
            <div className="title">Figma iPod Coverflow</div>
            <div className="desc">
              Create iPod playlist coverflow using figma. Arrange and design
              your own cover in Figma, then paste the figma URL below. This
              webapp is created by{" "}
              <a href="https://twitter.com/sonnylazuardi">@sonnylazuardi</a>
            </div>
            <div className="label">Figma URL</div>
            <input
              onFocus={e => e.target.select()}
              placeholder="Figma URL"
              value={figmaUrl}
              onChange={e => setFigmaUrl(e.target.value)}
              className="url-input"
            />
            <input ref={hiddenInput} className="hidden" />
            <div className="actions">
              <button
                className="btn-share"
                onClick={() => {
                  const splitUrl = figmaUrl.split("/");
                  const figmaId = splitUrl[4];
                  const myUrl = `https://figma-ipod-coverflow.now.sh/?query=${figmaId}`;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: "WebShare API Demo",
                        url: myUrl,
                      })
                      .then(() => {
                        console.log("Thanks for sharing!");
                      })
                      .catch(console.error);
                  } else {
                    hiddenInput.current.value = myUrl;
                    hiddenInput.current.select();
                    document.execCommand("copy");
                    alert("Share URL copied!");
                  }
                }}
              >
                Share Playlist
              </button>
              <button className="btn-create" onClick={() => closeDialog()}>
                Create Now!
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<RotateWheel />, rootElement);
