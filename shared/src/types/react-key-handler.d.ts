type KeyHandlerProps = {
  keyEventName: string,
  keyValue: string,
  onKeyHandle: (e: Event) => void
};

declare module 'react-key-handler' {
  class KeyHandler extends React.Component<KeyHandlerProps, {}> {
  }

  export default KeyHandler;
}

