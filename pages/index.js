import { html, Component } from "/reender.js";
import Navbar from "./components/Navbar.js";
import { load, getData, pushData, removeData } from "/router.js";
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
  clear() {
    removeData();
    this.setState({ num: 0 });
    console.log("Wiped out!");
  }
  render({ data }, { num = getData() || 0 }) {
    return html`<div>
      <${Navbar} />
      <h1 className="mx-4 dark:text-white text-7xl">
        Welcome To Ree.js
      </h1>
      <div
        className="mx-4 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
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
        <div
          className="btn-red text-center"
          onclick=${() => {
            this.log();
          }}
        >
          Balance: ${num}
        </div>
        <button
          className="btn-green"
          onclick=${() => {
            this.clear();
          }}
        >
          Clear Data
        </button>
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
        <button
          className="btn-red"
          onclick=${() => {
            load(`/crash`);
          }}
        >
          Goto Crashing Page
        </button>
        <button className="bg-sky-600 btn-green"
          onclick=${() => {
            load(`/coolpage`);
          }}
        >
          Goto Cool Page
        </button>
      </div>
    </div>`;
  }
}

export function postLoad(){
  console.log("Sent (Fake) Analytics: Post Load Function ran!");
}
export function _gracefulExit(){
  console.log("Sent (Fake) Analytics: User left the page :(");
}
export async function gracefulExit(){
  let sus = true;
  setTimeout(()=>{sus=false}, 15000);
}