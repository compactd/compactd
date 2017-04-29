import * as React from "react";
import * as ReactDOM from "react-dom";

import { Hello } from "./components/HelloWorld";

ReactDOM.render(
  <Hello compiler="TypeScript" framework="React" />,
  document.getElementById("example")
);
