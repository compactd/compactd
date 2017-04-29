import * as React from "react";
import './HelloWorld.scss';

export interface HelloProps { compiler: string; framework: string; }

// 'HelloProps' describes the shape of props.
// State is never set so we use the 'undefined' type.
export class Hello extends React.Component<HelloProps, undefined> {
  componentDidMount () {
    async function test () {
      await fetch('google.com');
    }

    test();
  }
  render() {
    const {props} = this;
    return <h1 className="hello-world">Hello, from {this.props.compiler} and {this.props.framework}!</h1>;
  }
}
