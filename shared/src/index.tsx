import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";
import Store from "./Store";
import { DB } from "./db";
// import registerServiceWorker from './registerServiceWorker';
import "./index.css";

// https://github.com/flatiron/director/issues/349 explains
// why I need the strange path.
import { Router } from "director/build/director";
import { autorun, configure } from "mobx";
configure({
  enforceActions: true
});

// unregister the service worker if we installed it.
navigator.serviceWorker
  .getRegistrations()
  .then(registrations =>
    registrations.map(registration => registration.unregister())
  );

function startRouter(store: Store) {
  const baseUrl = process.env.PUBLIC_URL;

  // update state on url change
  const router = new Router();
  // I bet there is a cooler nested way to do this.
  router.on(baseUrl + "/read/([-a-z0-9]*)", bookid => store.setPath(bookid, 1));
  router.on(baseUrl + "/read/([-a-z0-9]+)/(\\d+)", (bookid, pageno) =>
    store.setPath(bookid, +pageno)
  );
  router.on(baseUrl + "/edit/([-a-zA-Z0-9]+)/([0-9]+)", (slug, cid) =>
    store.setEditPath(slug, +cid)
  );
  router.on(baseUrl + "/edit/([-a-zA-Z0-9]+)/-1", slug =>
    store.setEditPath(slug, -1)
  );
  router.configure({
    notfound: () => store.setPath("", 1),
    html5history: true
  });
  router.init();

  // update url on state changes
  // TODO
  autorun(() => {
    const path = baseUrl + store.currentPath;
    if (path !== window.location.pathname) {
      window.history.pushState(null, "", path);
    }
  });
}

function startPersist(store: Store) {
  const persist = window.localStorage.getItem("THSR-settings");
  if (persist) {
    store.setPersist(persist);
  }
  autorun(() => {
    window.localStorage.setItem("THSR-settings", store.persist);
  });
}

const db = new DB();
const theStore = new Store();
theStore.db = db;
// theStore.authUser();
startRouter(theStore);
startPersist(theStore);
autorun(() => theStore.log());
window.addEventListener("resize", theStore.resize);

ReactDOM.render(<App store={theStore} />, document.getElementById(
  "root"
) as HTMLElement);
// registerServiceWorker();

// THR will signal us here that the user has logged in
window.addEventListener("message", e => {
  if (e.data === "shared") {
    db.retryAuth();
  }
});
