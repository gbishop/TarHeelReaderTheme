import * as React from "react";
import { observer } from "mobx-react";
import "./App.css";
import Store from "./Store";
import Reader from "./Reader";
import { THRURL } from "./db";
import Edit from "./Edit";

@observer
class App extends React.Component<{ store: Store }, {}> {
  public render() {
    const { store } = this.props;
    return store.db.authP.case({
      pending: () => <p>Checking your login credentials</p>,
      rejected: () => (
        <p>Something went wrong checking your login credentials</p>
      ),
      fulfilled: auth => {
        store.db.setLoginRole(auth.login, auth.role, auth.hash);

        if (store.editing) {
          return <Edit store={store} />;
        } else {
          return <Reader store={store} />;
        }
      }
    });
  }
}

export default App;
