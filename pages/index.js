import { html, Component } from "/reender.js";
import Navbar from "./components/Navbar.js";
import { load, getData, pushData } from "../router.js";
export default class Index extends Component {
  add() {
    let { num = getData() || 0 } = this.state;
    this.setState({ num: ++num });
    pushData(num);
  }
  subtract() {
    let { num = getData() || 0 } = this.state;
    this.setState({ num: --num });
    pushData(num);
  }
  log() {
    let { num = getData() || 0 } = this.state;
    this.setState({ num: num });
    console.log(num);
    pushData(num);
  }
  render({ data }, { num = getData() || 0 }) {
    return html`<div>
      <${Navbar} />
      <p className="text-indigo-500">
        Hello <span className="text-indigo-600">${data?.query?.world || "World!"}</span>
      </p>
      <div className="mx-2 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className="btn-blurple"
          onclick=${() => {
            this.add();
          }}
        >
          Add 1
        </button>
        <button
          className="btn-green"
          onclick=${() => {
            this.subtract();
          }}
        >
          Remove 1
        </button>
        <div className="btn-red text-center">Balance: ${num}</div>
        <button
          className="btn-blurple"
          onclick=${() => {
            load("/");
          }}
        >
          Reload Site
        </button>
        <button
          className="btn-red"
          onclick=${() => {
            load("/failure");
          }}
        >
          Goto Failure Management
        </button>
        <button
          className="btn-green"
          onclick=${() => {
            let sus = prompt("Enter a number to be shown on next page");
            load(`/test/${sus}`);
          }}
        >
          Goto Test Page
        </button>
      </div>
    </div>`;
  }
}
