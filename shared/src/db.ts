import { Number, String, Array, Record, Static, Runtype } from "runtypes";
import { observable, computed, action } from "mobx";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import { saveAs } from "file-saver";

export const THRURL = "https://gbserver3.cs.unc.edu/";
// export const THRURL = "https://tarheelreader.org/";

export const LevelNames = [
  "K-2",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9-10th Grade",
  "11-12th Grade"
];

export interface LogRecord {
  teacher: string;
  student: string;
  bookid: string;
  reading: number;
  page: number;
  response?: string;
}

// construct the validator for shared books
const Page = Record({
  text: String,
  url: String,
  width: Number,
  height: Number
});

const SharedBookValidator = Record({
  title: String,
  slug: String,
  status: String,
  level: String,
  author: String,
  owner: String,
  pages: Array(Page),
  comments: Array(Array(String)),
  owners: Array(String),
  cids: Array(Record({ owner: String, cid: Number }))
});

const SharedBookListItemValidator = Record({
  title: String,
  author: String,
  pages: Number,
  slug: String,
  level: String,
  image: String,
  status: String,
  owner: String
});

const SharedBookListValidator = Array(SharedBookListItemValidator);

const SharedBookResponseValidator = Record({
  books: SharedBookListValidator,
  recent: SharedBookListValidator,
  yours: SharedBookListValidator
});

const AuthValidator = Record({
  login: String,
  role: String,
  hash: String
});

const CreateResponseValidator = Record({ slug: String, cid: Number });

// construct the typescript type
export type SharedBook = Static<typeof SharedBookValidator>;
export type SharedBookListItem = Static<typeof SharedBookListItemValidator>;
export type SharedBookList = Static<typeof SharedBookListValidator>;
export type SharedBookResponse = Static<typeof SharedBookResponseValidator>;
export type CreateResponse = Static<typeof CreateResponseValidator>;
export type Auth = Static<typeof AuthValidator>;

export class DB {
  @observable login: string = "";
  @observable role: string = "";
  token: string = "";
  @computed get isAdmin() {
    return this.role === "admin";
  }
  @computed get canWrite() {
    return this.role === "admin" || this.role === "author";
  }
  @computed get authentication() {
    return `MYAUTH user:"${this.login}", role:"${this.role}", token:"${this.token}"`;
  }

  @action.bound setLoginRole(login: string, role: string, token: string) {
    this.login = login;
    this.role = role;
    this.token = token;
  }

  @observable authRetry = 0;
  @action.bound retryAuth() {
    if (this.login.length === 0) {
      this.authRetry++;
    }
  }
  // don't use fetchJson here
  @computed get authP(): IPromiseBasedObservable<Auth> {
    return fromPromise(
      new Promise((resolve, reject) => {
        const rt = this.authRetry;
        window
          .fetch(THRURL + "login/?shared=1", {
            credentials: "include"
          })
          .then(res => {
            if (res.ok) {
              res.json().then(obj => resolve(obj));
            } else {
              reject(res);
            }
          })
          .catch(reject);
      })
    );
  }

  @observable StudentListReload = 0;
  @action.bound forceReload() {
    this.StudentListReload += 1;
  }

  @computed get studentListP() {
    const url = `/api/db/students?reload=${this.StudentListReload}`;
    return this.fetchJson(url, {}, Record({ students: Array(String) }));
  }
  @computed get studentList(): string[] {
    return this.studentListP.case({
      fulfilled: v => v.students,
      pending: () => [],
      rejected: e => []
    });
  }
  @action addStudent(studentid: string) {
    if (studentid.length > 0) {
      this.fetchJson(
        "/api/db/students",
        {
          method: "POST",
          body: JSON.stringify({ teacher: this.login, student: studentid }),
          headers: {
            "Content-Type": "application/json"
          }
        },
        Record({ status: String })
      ).then(this.forceReload);
    }
  }

  log(state: LogRecord) {
    /*
    window.fetch("/api/db/log", {
      method: "POST",
      body: JSON.stringify(state),
      headers: { "Content-Type": "application/json" }
    });
    */
  }

  fetchJson<T>(
    url: string,
    init: RequestInit,
    validator: Runtype<T>
  ): IPromiseBasedObservable<T> {
    const headers = { ...init.headers, Authentication: this.authentication };
    const authInit = { ...init, headers };
    return fromPromise(
      fetch(url, authInit)
        .then(resp => {
          if (!resp.ok) {
            return Promise.reject(new Error(resp.statusText));
          }
          return resp.json();
        })
        .then(data => validator.check(data))
    );
  }

  fetchBook(slug: string, cid?: number) {
    const cparm = cid === undefined ? "" : `&cid=${cid}`;
    return this.fetchJson(
      `/shared-as-json/?slug=${slug}${cparm}`,
      {},
      SharedBookValidator
    );
  }

  fetchBookList(teacher: string) {
    return this.fetchJson(
      `/api/db/books?teacher=${encodeURIComponent(teacher)}`,
      {},
      SharedBookResponseValidator
    );
  }

  createNewBook(slug: string) {
    return this.fetchJson(
      "/api/db/books",
      {
        method: "post",
        body: JSON.stringify({ slug }),
        headers: {
          "Content-type": "application/json; charset=utf-8"
        }
      },
      CreateResponseValidator
    );
  }

  updateBook(book: SharedBook, comments: string[][], status: string) {
    const nbook = { ...book };
    nbook.comments = comments;
    nbook.status = status;
    const body = JSON.stringify(nbook);
    return this.fetchJson(
      "/shared-as-json",
      {
        method: "post",
        body,
        headers: {
          "Content-type": "application/json; charset=utf-8"
        }
      },
      CreateResponseValidator
    );
  }

  downloadLog() {
    fetch("/api/db/log", {
      headers: {
        Authentication: this.authentication
      }
    })
      .then(response => response.blob())
      .then(blob => saveAs(blob, "thsrlog.csv"));
  }
}
