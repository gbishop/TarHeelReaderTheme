import * as React from "react";
import { observer } from "mobx-react";
import { IPromiseBasedObservable } from "mobx-utils";
import Store from "./Store";
import { observable, action, computed } from "mobx";
import {
  THRURL,
  SharedBook,
  SharedBookList,
  CreateResponse,
  LevelNames
} from "./db";
import { WaitToRender, THR } from "./helpers";
import "./Edit.css";

interface SingleCommentEditorProps {
  comments: string[][];
  pageno: number;
  reading: number;
}

@observer
class SingleCommentEditor extends React.Component<
  SingleCommentEditorProps,
  {}
> {
  @action.bound updateComment(e: React.ChangeEvent<HTMLInputElement>) {
    const { comments, pageno, reading } = this.props;
    comments[reading][pageno] = e.target.value;
    // if they add to the last reading, create another one
    // we'll delete fully empty readings on save
    // if (reading === comments.length - 1) {
    //   this.addReading();
    // }
  }
  @action.bound addReading() {
    const comments = this.props.comments;
    comments.push(new Array(comments[0].length).fill(""));
  }
  render() {
    const { comments, pageno, reading } = this.props;
    const npages = comments[0].length;
    return (
      <input
        type="text"
        value={comments[reading][pageno]}
        onChange={this.updateComment}
        tabIndex={reading * npages + pageno + 1}
      />
    );
  }
}

interface CommentEditorProps {
  book: SharedBook;
  store: Store;
}

@observer
class CommentEditor extends React.Component<CommentEditorProps, {}> {
  @observable comments: string[][];
  @observable owners: string[];
  @observable level: string;
  @action.bound setLevel(s: string) {
    this.level = s;
  }
  @action.bound addReading() {
    const { book, store } = this.props;
    this.comments.push(new Array(this.comments[0].length).fill(""));
    this.owners.push(store.db.login);
  }
  constructor(props: any) {
    super(props);
    this.comments = this.props.book.comments;
    this.owners = this.props.book.owners;
    this.level = this.props.book.level;
  }
  @action.bound save(status: string) {
    const { book, store } = this.props;
    store.db
      .updateBook(book, this.comments, status)
      .then(
        resp => store.setEditPath(book.slug, resp.cid),
        error => console.log("error", error)
      );
  }
  render() {
    const { book, store } = this.props;
    const nreadings = this.comments.length;
    return (
      <div>
        <button title="Go back" onClick={() => store.setPath(book.slug, 1)}>
          <img src="/theme/images/well.png" />
        </button>
        <table className="editor">
          <caption>
            Enter comments for each page. The TAB key will move your cursor to
            the next page. You may add additional readings by clicking
            here&nbsp;
            <button onClick={this.addReading}>Add a reading</button>. Readings
            with comments that are empty on every page will be deleted when you
            save.
          </caption>
          <thead>
            <tr>
              <th>Page</th>
              <th>Content</th>
              <th>Reading:&nbsp;Comment</th>
            </tr>
          </thead>
          <tbody>
            {book.pages.map((page, pn) =>
              this.comments.map((comment, rn) => (
                <tr key={`${pn}:${rn}`}>
                  {rn === 0 && <td rowSpan={nreadings}>{pn + 1}</td>}
                  {rn === 0 && (
                    <td rowSpan={nreadings}>
                      <figure>
                        <img src={THRURL + page.url} />
                        <figcaption>{page.text}</figcaption>
                      </figure>
                    </td>
                  )}
                  <td>
                    {rn + 1}:&nbsp;
                    <SingleCommentEditor
                      comments={this.comments}
                      pageno={pn}
                      reading={rn}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p>
          <label>
            Set the level:&nbsp;
            <select
              value={this.level}
              onChange={e => this.setLevel(e.target.value)}
            >
              <option value="">All levels</option>
              {LevelNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </p>
        <p>
          Books saved as draft are available only to you. You'll find them
          listed in the <b>Your books</b> section.
          <br />
          <button onClick={e => this.save("draft")}>Save as draft</button>
        </p>
        <p>
          Books that are published are available for everyone.
          <br />
          <button onClick={e => this.save("published")}>Publish</button>
        </p>
      </div>
    );
  }
}

@observer
class Edit extends React.Component<{ store: Store }, {}> {
  @action.bound createBook(slug: string) {
    const store = this.props.store;
    store.setEditPath(slug, 0);
  }
  @computed get bookP() {
    const store = this.props.store;
    return store.db.fetchBook(store.editSlug, store.editCID);
  }
  render() {
    const store = this.props.store;
    return WaitToRender(this.bookP, book => (
      <CommentEditor book={book} store={store} />
    ));
  }
}

export default Edit;
