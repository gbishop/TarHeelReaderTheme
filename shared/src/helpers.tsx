import * as React from 'react';
import { IPromiseBasedObservable } from 'mobx-utils';

import LoadingGif from './LoadingGif.gif';

export function WaitToRender<T>(p: IPromiseBasedObservable<T>, f: (v:T) => JSX.Element) : JSX.Element {
  return p.case({
    pending: () => <img src={LoadingGif} alt=""/>,
    rejected: (err) => {
      console.log(err);
      return <p>{`${err.name}: ${err.key||''} ${err.message}`}</p>
    },
    fulfilled: f
  });
}

export function THR(name: string) {
  const v = document.cookie.match("(^|;) ?thr=([^;]*)(;|$)");
  const j = v ? v[2] : null;
  if (j) {
    const d = JSON.parse(decodeURIComponent(j));
    return d[name];
  }
}

