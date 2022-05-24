import { html, Component } from "/reender.js";
import { getData, pushData } from "/router.js";
import Loader from "/pages/components/Loader.js";
export default class Failure extends Component {
  hack() {
    let { num = getData() || 0 } = this.state;
    this.setState({ num: 0 });
    console.log(num);
    pushData(num);
  }
  render({props},{num = getData() || 0}) {
    return html`<div>
      <${Loader} />
      <p className="text-indigo-500">
        Welcome to  <span className="text-indigo-600">Management!</span>
      </p>
      <a className="btn-green" href="/">Go Home!</a>
      <button className="btn-green" onclick=${()=>{this.hack()}}>Hack Balance: ${num}</button>
    </div>`;
  }
}
