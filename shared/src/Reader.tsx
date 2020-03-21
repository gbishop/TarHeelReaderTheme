import * as React from "react";
import { observer } from "mobx-react";
import KeyHandler from "react-key-handler";
import Modal from "react-modal";
import NextArrow from "./NextArrow.png";
import BackArrow from "./BackArrow.png";
import NextResponsePage from "./NextResponsePage.png";
import BackResponsePage from "./BackResponsePage.png";
import Store, { allResponses } from "./Store";
import { SharedBook } from "./db";
import { WaitToRender, THR } from "./helpers";

import "./Reader.css";

@observer
class Reader extends React.Component<{ store: Store }, {}> {
  public render() {
    const { store } = this.props;
    return WaitToRender(store.bookP, book => {
      const commentHeight = 30;
      const containerHeight = store.screen.height - commentHeight;
      const sc = store.screen;
      const rs =
        Math.hypot(sc.width, sc.height) *
        (0.04 + (0.1 * store.responseSize) / 100);
      const cbox: Box = {
        width: sc.width,
        height: containerHeight,
        left: 0,
        top: 0,
        align: "v"
      };

      const rboxes: Box[] = []; // boxes for responses
      if (store.layout === "left" && rboxes.length < store.nresponses) {
        cbox.width -= rs;
        cbox.left = rs;
        rboxes.push({
          top: 0,
          left: 0,
          height: cbox.height,
          width: rs,
          align: "v"
        });
      }
      if (store.layout === "right" && rboxes.length < store.nresponses) {
        cbox.width -= rs;
        rboxes.push({
          top: 0,
          left: sc.width - rs,
          height: cbox.height,
          width: rs,
          align: "v"
        });
      }
      if (store.layout === "top" && rboxes.length < store.nresponses) {
        cbox.height -= rs;
        cbox.top = rs;
        rboxes.push({
          top: 0,
          left: cbox.left,
          height: rs,
          width: cbox.width,
          align: "h"
        });
      }
      if (store.layout === "bottom" && rboxes.length < store.nresponses) {
        cbox.height -= rs;
        rboxes.push({
          top: containerHeight - rs,
          left: cbox.left,
          height: rs,
          width: cbox.width,
          align: "h"
        });
      }

      const containerStyle = {
        width: store.screen.width,
        height: store.screen.height - 30,
        top: commentHeight
      };

      function saySelectedWord() {
        if (
          store.responseIndex >= 0 &&
          store.responseIndex < store.nresponses
        ) {
          sayWord(store.word);
        }
      }

      function sayWord(word: string) {
        // response event
        if (word === "I") {
          word = "eye"; // hack for iOS
        }
        const msg = new SpeechSynthesisUtterance(word);
        msg.lang = "en-US";
        speechSynthesis.speak(msg);
        store.log(word);
      }

      const npages = book.pages.length;
      const pageno = store.pageno;
      const comment =
        store.pageno <= npages
          ? book.comments[store.reading - 1][pageno - 1]
          : "";

      return (
        <div>
          <button
            onClick={store.toggleControlsVisible}
            style={{ border: "none", backgroundColor: "inherit" }}
          >
            <img src="/theme/images/comments_t.png" />
          </button>
          <input
            type="number"
            value={store.reading}
            min={1}
            max={store.nreadings}
            pattern="\d*"
            inputMode="numeric"
            onFocus={e => e.target.select()}
            onChange={e => {
              if (
                e.target &&
                e.target.value &&
                e.target.value.match(/[0-9]+/)
              ) {
                store.setReading(+e.target.value);
              }
              e.target.select();
            }}
            style={{ width: "2em" }}
          />
          <div className="comment">{comment}</div>
          <div className="reading-container" style={containerStyle}>
            <ReaderContent
              box={cbox}
              book={book}
              pageno={store.pageno}
              store={store}
            />
            <Responses
              boxes={rboxes}
              responses={store.responses}
              store={store}
              doResponse={sayWord}
            />
            <Controls store={store} book={book} doResponse={saySelectedWord} />
          </div>
        </div>
      );
    });
  }
}

// Reader component
interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  align: string;
}

interface ReaderContentProps {
  book: SharedBook;
  box: Box;
  pageno: number;
  store: Store;
}

function updateRating(book: SharedBook) {
  const ratingInput = document.querySelector(".rating input:checked");
  if (ratingInput) {
    const rating = (ratingInput as HTMLInputElement).value;
    fetch(`/rateajax/?id=${book.ID}&rating=${rating}`);
  }
}

@observer
class ReaderContent extends React.Component<ReaderContentProps, {}> {
  public render() {
    const { book, box, pageno, store } = this.props;
    const { width, height, top, left } = box;
    const fontSize = width / height < 4 / 3 ? width / 36 : height / 36;
    const pageStyle = {
      width,
      height,
      top,
      left,
      fontSize
    };
    if (pageno > book.pages.length) {
      return (
        <div className="book-page" style={pageStyle}>
          <h1 className="title">What would you like to do now?</h1>
          <div className="choices">
            <button
              onClick={() => {
                updateRating(book);
                store.setPage(1);
              }}
            >
              Read this book again
            </button>
            <button
              onClick={() => {
                updateRating(book);
                window.location.href = THR("findAnotherLink");
              }}
            >
              Read another book
            </button>
          </div>
          <div className="rating">
            <h2>How do you rate this book?</h2>
            <input type="radio" id="onestar" name="rating" value="1" />
            <label htmlFor="onestar">
              <img src="/theme/images/1stars.png" />1 star
            </label>
            <input type="radio" id="twostar" name="rating" value="2" />
            <label htmlFor="twostar">
              <img src="/theme/images/2stars.png" />2 stars
            </label>
            <input type="radio" id="threestar" name="rating" value="3" />
            <label htmlFor="threestar">
              <img src="/theme/images/3stars.png" />3 stars
            </label>
          </div>
        </div>
      );
    }

    const page = book.pages[pageno - 1];
    const textHeight = pageno === 1 ? 4 * fontSize + 8 : 6.5 * fontSize;
    const maxPicHeight = height - textHeight;
    const maxPicWidth = width;
    const verticalScale = maxPicHeight / page.height;
    const horizontalScale = maxPicWidth / page.width;
    let picStyle = {};
    if (verticalScale < horizontalScale) {
      picStyle = {
        height: maxPicHeight
      };
    } else {
      picStyle = {
        width: maxPicWidth,
        marginTop:
          pageno === 1 ? 0 : maxPicHeight - horizontalScale * page.height
      };
    }

    if (pageno === 1) {
      const titleStyle = {
        height: 4 * fontSize,
        fontSize: 2 * fontSize,
        padding: 0,
        margin: 0,
        display: "block"
      };
      return (
        <div className="book-page" style={pageStyle}>
          <h1 className="title" style={titleStyle}>
            {book.title}
          </h1>
          <img
            src={"https://tarheelreader.org" + book.pages[0].url}
            className="pic"
            style={picStyle}
            alt=""
          />
          <PageNavButtons store={store} />
        </div>
      );
    } else {
      return (
        <div className="book-page" style={pageStyle}>
          <p className="page-number">{pageno}</p>
          <img
            src={"https://tarheelreader.org" + page.url}
            className="pic"
            style={picStyle}
            alt=""
          />
          <div className="caption-box">
            <p className="caption">{page.text}</p>
          </div>
          <PageNavButtons store={store} />
        </div>
      );
    }
  }
}

interface PageNavButtonsProps {
  store: Store;
}

@observer
class PageNavButtons extends React.Component<PageNavButtonsProps, {}> {
  public render() {
    const store = this.props.store;
    if (store.pageTurnVisible) {
      return (
        <div>
          <button
            className="next-link"
            onClick={() => store.setPage(store.pageno + 1)}
          >
            <img src={NextArrow} alt="next" />
            Next
          </button>
          <button
            className="back-link"
            onClick={() => {
              if (store.pageno > 1) {
                store.setPage(store.pageno - 1);
              } else {
                window.location.href = THR("findAnotherLink");
              }
            }}
          >
            <img src={BackArrow} alt="back" />
            Back
          </button>
        </div>
      );
    } else {
      // This strange return value is keeping typescript happy
      // https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#non-null-assertion-operator
      // We're asking it to ignore the possibility of returning null
      return null!;
    }
  }
}

interface ResponsesProps {
  store: Store;
  boxes: Box[];
  responses: string[];
  doResponse: (word: string) => void;
}

@observer
class Responses extends React.Component<ResponsesProps, {}> {
  public render() {
    const { store, boxes, responses, doResponse } = this.props;
    let words = responses;
    let index = 0;
    const responseGroups = boxes.map((box, i) => {
      const nchunk = Math.max(1, Math.floor(words.length / (boxes.length - i)));
      const chunk = words.slice(0, nchunk);
      words = words.slice(nchunk);
      const { pax, sax } = {
        v: { pax: "height", sax: "width" },
        h: { pax: "width", sax: "height" }
      }[box.align];
      const bstyle = {};
      bstyle[pax] = box[pax] / (nchunk + 1);
      bstyle[sax] = box[sax];
      const nbstyle = {};
      nbstyle[pax] = bstyle[pax] / 2;
      nbstyle[sax] = bstyle[sax];
      const dstyle = {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height
      };
      const responseGroup = chunk.map((w, j) => (
        <ResponseButton
          key={w}
          word={w}
          index={index++}
          style={bstyle}
          store={store}
          doResponse={doResponse}
        />
      ));
      return (
        <div key={i} style={dstyle} className="response-container">
          <button style={nbstyle} onClick={() => store.stepResponsePage(-1)}>
            <img src={BackResponsePage} style={{ width: "50%" }} />
          </button>
          {responseGroup}
          <button style={nbstyle} onClick={() => store.stepResponsePage(1)}>
            <img src={NextResponsePage} style={{ width: "50%" }} />
          </button>
        </div>
      );
    });
    return <div>{responseGroups}</div>;
  }
}

interface ResponseButtonProps {
  word: string;
  index: number;
  style: React.CSSProperties;
  store: Store;
  doResponse: (word: string) => void;
}

@observer
class ResponseButton extends React.Component<ResponseButtonProps, {}> {
  public render() {
    const { word, index, style, store, doResponse } = this.props;
    const maxSize = Math.min(style.width as number, style.height as number);
    const fontSize = maxSize / 5;
    const iconSize = maxSize - fontSize - 10;
    const iStyle = {
      width: iconSize
    };
    const cStyle = {
      fontSize,
      marginTop: -fontSize / 4
    };
    const isFocused = store.responseIndex === index;
    return (
      <button
        className={`${isFocused ? "selected" : ""}`}
        onClick={() => doResponse(word)}
        style={style}
      >
        <figure>
          <img
            src={process.env.PUBLIC_URL + "/symbols/" + word + ".png"}
            alt={word}
            style={iStyle}
          />
          <figcaption style={cStyle}>{word}</figcaption>
        </figure>
      </button>
    );
  }
}

interface ControlsProps {
  store: Store;
  book: SharedBook;
  doResponse: () => void;
}

@observer
class Controls extends React.Component<ControlsProps, {}> {
  public render() {
    const { store, book, doResponse } = this.props;
    const customStyles = {
      content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)"
      },
      overlay: {
        backgroundColor: "rgba(255, 255, 255, 0.0)"
      }
    };

    return (
      <div>
        <NRKeyHandler
          keyValue={"ArrowRight"}
          onKeyHandle={() => store.setPage(store.pageno + 1)}
        />
        <NRKeyHandler
          keyValue={"ArrowLeft"}
          onKeyHandle={() => store.setPage(store.pageno - 1)}
        />
        <NRKeyHandler keyValue={" "} onKeyHandle={store.nextResponseIndex} />
        <NRKeyHandler keyValue={"Enter"} onKeyHandle={doResponse} />
        <NRKeyHandler
          keyValue="Escape"
          onKeyHandle={store.toggleControlsVisible}
        />
        <Modal
          isOpen={store.controlsVisible}
          contentLabel="Reading controls"
          style={customStyles}
          ariaHideApp={false}
        >
          <div className="controls">
            <h1>Reading controls</h1>
            <label>
              Reading:&nbsp;
              <input
                type="number"
                value={store.reading}
                min={1}
                max={store.nreadings}
                pattern="\d*"
                onFocus={e => e.target.select()}
                onChange={e => {
                  if (
                    e.target &&
                    e.target.value &&
                    e.target.value.match(/[0-9]+/)
                  ) {
                    store.setReading(+e.target.value);
                  }
                  e.target.select();
                }}
              />
            </label>
            <label>
              Side:&nbsp;
              <Layout store={store} />
            </label>
            <label>
              Word Size:&nbsp;
              <input
                type="range"
                min="0"
                max="100"
                value={store.responseSize}
                onChange={e => store.setResponseSize(+e.target.value)}
              />
            </label>
            <label>
              Words per page:&nbsp;
              <select
                value={store.responsesPerPage}
                onChange={e => store.setResponsesPerPage(+e.target.value)}
              >
                {[4, 6, 9, 12, 18].map(n => (
                  <option value={n} key={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Page Navigation:&nbsp;
              <input
                type="checkbox"
                checked={store.pageTurnVisible}
                onChange={store.togglePageTurnVisible}
              />
            </label>
            <h2>Words</h2>
            <div id="responseWords">
              {allResponses.map(w => (
                <label key={w}>
                  <input
                    type="checkbox"
                    name={w}
                    checked={!store.responsesExcluded.get(w)}
                    onChange={event =>
                      store.setExcluded(
                        event.target.name,
                        !event.target.checked
                      )
                    }
                  />
                  {w}
                </label>
              ))}
              <h2>Comments</h2>
              <ul>
                {book.cids.map(c => (
                  <li key={c.cid}>
                    {c.owner}
                    {(c.owner === store.db.login ||
                      store.db.role === "admin") && (
                      <button
                        onClick={() => store.setEditPath(book.slug, c.cid)}
                        title="Edit comments"
                        style={{ display: "inline" }}
                      >
                        &#x270D;
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {(store.db.role === "admin" || store.db.role === "author") && (
                <button onClick={() => store.setEditPath(book.slug, -1)}>
                  Add comments
                </button>
              )}
            </div>

            <button onClick={store.toggleControlsVisible}>Done</button>
          </div>
        </Modal>
      </div>
    );
  }
}

interface NRKeyHandlerProps {
  keyValue: string;
  onKeyHandle: (e: Event) => void;
}

@observer
class NRKeyHandler extends React.Component<NRKeyHandlerProps, {}> {
  public isDown = false;
  public keyDown = (e: Event) => {
    e.preventDefault();
    if (!this.isDown) {
      this.isDown = true;
      this.props.onKeyHandle(e);
    }
  };
  public keyUp = (e: Event) => {
    this.isDown = false;
  };
  public render() {
    const keyValue = this.props.keyValue;
    return (
      <div>
        <KeyHandler
          keyEventName={"keydown"}
          keyValue={keyValue}
          onKeyHandle={this.keyDown}
        />
        <KeyHandler
          keyEventName={"keyup"}
          keyValue={keyValue}
          onKeyHandle={this.keyUp}
        />
      </div>
    );
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

@observer
class Layout extends React.Component<{ store: Store }, {}> {
  public render() {
    const store = this.props.store;
    const sides = ["left", "right", "top", "bottom", "none"];
    return (
      <select
        value={store.layout}
        onChange={e => store.setLayout(e.target.value)}
      >
        {sides.map(side => (
          <option key={side} value={side}>
            {capitalize(side)}
          </option>
        ))}
      </select>
    );
  }
}

export default Reader;
