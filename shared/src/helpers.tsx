import * as React from 'react';
import { observer } from 'mobx-react';
import { IPromiseBasedObservable } from 'mobx-utils';

import LoadingGif from './LoadingGif.gif';

export function WaitToRender<T>(p: IPromiseBasedObservable<T>, f: (v:T) => JSX.Element) : JSX.Element {
  return p.case({
    pending: () => <img src={LoadingGif} />,
    rejected: (err) => {
      console.log(err);
      return <p>{`${err.name}: ${err.key||''} ${err.message}`}</p>
    },
    fulfilled: f
  });
}

