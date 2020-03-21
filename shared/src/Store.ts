import { observable, computed, action, ObservableMap } from "mobx";
import { DB, LogRecord } from "./db";

export const allResponses: string[] = [
  "like",
  "want",
  "not",
  "go",
  "get",
  "make",
  "look",
  "turn",
  "good",
  "more",
  "help",
  "different",
  "I",
  "he",
  "you",
  "she",
  "open",
  "do",
  "that",
  "up",
  "put",
  "same",
  "all",
  "some",
  "it",
  "here",
  "where",
  "what",
  "in",
  "on",
  "why",
  "who",
  "can",
  "finished",
  "when",
  "stop"
];

// allow changing persistence data
const PERSISTVERSION = 1;

class Store {
  public db!: DB;

  // does user have admin privileges
  @computed get isAdmin() {
    return this.db.isAdmin;
  }

  // thr login name
  @computed get teacherid() {
    return this.db.login;
  }

  // editing state
  @observable editing = false;
  @observable editSlug = "";
  @observable editCID = 0;

  @observable studentid: string = "";
  // set student's id
  @action.bound setstudentid(id: string) {
    this.studentid = id;
  }
  // list of books to display
  @computed({ keepAlive: true }) get sharedBookListP() {
    return this.db.fetchBookList("");
  }
  // state of booklist display
  @observable bookListOpen: ObservableMap<string, boolean> = observable.map();
  @action.bound bookListToggle(level: string) {
    this.bookListOpen.set(level, !this.bookListOpen.get(level));
  }
  // list of recent books for this teacher
  @computed get teacherBookListP() {
    return this.db.fetchBookList(this.teacherid);
  }

  // the id of the book to read or '' for the landing page
  @observable bookid: string = "";
  @action.bound setBookid(s: string) {
    this.bookid = s;
    this.pageno = 1;
  }

  // an observable promise for the book associated with bookid
  @computed get bookP() {
    return this.db.fetchBook(this.bookid);
  }
  // the page number we're reading
  @observable pageno: number = 1;
  // number of pages in the book
  @computed get npages() {
    return this.bookP.case({
      rejected: () => 0,
      pending: () => 0,
      fulfilled: book => book.pages.length
    });
  }
  // update the state typically from a URL
  @action.bound setPath(bookid: string, page: number) {
    this.bookid = bookid;
    this.pageno = bookid ? page : 1;
    this.editing = false;
  }
  @action.bound setEditPath(slug: string, cid: number) {
    this.editing = true;
    this.editSlug = slug;
    this.editCID = cid;
  }

  // map the state to a url
  @computed get currentPath() {
    if (this.editing) {
      const p = "/edit/" + this.editSlug + "/" + this.editCID;
      return p;
    }
    return `/read/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : "");
  }
  // set the page number
  @action.bound public setPage(i: number) {
    this.pageno = i;
    if (this.bookP.state === "fulfilled") {
      this.pageno = Math.max(
        1,
        Math.min(this.bookP.value.pages.length + 1, this.pageno)
      );
    }
  }
  // index to the readings array
  @observable public reading: number = 1;
  @action.bound public setReading(n: number) {
    this.reading = Math.max(1, Math.min(n, this.nreadings));
    // this.responseIndex = 0;
  }
  @computed get nreadings() {
    return this.bookP.case({
      rejected: () => 0,
      pending: () => 0,
      fulfilled: book => book.comments.length
    });
  }
  // allow excluding responses from the list
  @observable public responsesExcluded = new Map<string, boolean>();
  @action.bound public setExcluded(word: string, value: boolean) {
    this.responsesExcluded.set(word, value);
  }

  @observable public responseOffset = 0;
  @observable public responsesPerPage = 4;
  @action.bound setResponsesPerPage(n: number) {
    this.responsesPerPage = n;
    this.responseOffset = 0;
    this.responseIndex = -1;
  }

  @computed get allowedResponses() {
    const a = allResponses.filter(r => !this.responsesExcluded.get(r));
    return a;
  }
  // get responses for this reading
  @computed get responses() {
    const r = this.allowedResponses.slice(
      this.responseOffset,
      this.responseOffset + this.responsesPerPage
    );
    return r;
  }
  @action.bound public stepResponsePage(direction: number) {
    const N = this.allowedResponses.length,
      rpp = Math.min(N, this.responsesPerPage),
      pageNo = Math.floor(this.responseOffset / rpp);
    this.responseOffset = ((((pageNo + direction) * rpp) % N) + N) % N;
    this.responseIndex = -1;
  }

  // placement of the response symbols
  @observable public layout: string = "bottom";
  @action.bound public setLayout(side: string) {
    this.layout = side;
  }

  // size of the response symbols
  @observable public responseSize: number = 30;
  @action.bound public setResponseSize(i: number) {
    this.responseSize = i;
  }

  // currently selected response symbol
  @observable public responseIndex: number = -1;
  @computed get nresponses() {
    return this.responses.length;
  }
  @action.bound public nextResponseIndex() {
    this.responseIndex = (this.responseIndex + 1) % this.nresponses;
  }
  @action.bound public setResponseIndex(i: number) {
    this.responseIndex = i;
  }
  // current response
  @computed get word() {
    return this.responses[this.responseIndex];
  }

  // visibility of the controls modal
  @observable public controlsVisible: boolean = false;
  @action.bound public toggleControlsVisible() {
    this.controlsVisible = !this.controlsVisible;
  }
  // visibility of page turn buttons on book page
  @observable public pageTurnVisible: boolean = true;
  @action.bound public togglePageTurnVisible() {
    this.pageTurnVisible = !this.pageTurnVisible;
  }
  // screen dimensions updated on resize
  @observable public screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  @action.bound public resize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }
  // json string to persist the state
  @computed get persist(): string {
    const obj = {
      version: PERSISTVERSION,
      layout: this.layout,
      responsesPerPage: this.responsesPerPage,
      responses: this.allowedResponses,
      responseSize: this.responseSize,
      pageTurnVisible: this.pageTurnVisible,
      bookListOpen: this.bookListOpen.toJSON()
    };
    const r = JSON.stringify(obj);
    return r;
  }
  // restore the state from json
  @action.bound public setPersist(js: string) {
    const v = JSON.parse(js);
    if (v && "version" in v && v.version === PERSISTVERSION) {
      this.layout = v.layout;
      this.responsesPerPage = v.responsesPerPage;
      allResponses.map(r => this.setExcluded(r, v.responses.indexOf(r) < 0));
      this.responseSize = v.responseSize;
      this.pageTurnVisible = v.pageTurnVisible;
      Object.keys(v.bookListOpen).forEach(key =>
        this.bookListOpen.set(key, v.bookListOpen[key])
      );
    }
  }

  // log state changes
  public log(response?: string) {
    const lr: LogRecord = {
      teacher: this.teacherid,
      student: this.studentid,
      bookid: this.bookid,
      page: this.pageno,
      reading: this.reading
    };
    if (response) {
      lr.response = response;
    }
    this.db.log(lr);
  }
}

export default Store;
