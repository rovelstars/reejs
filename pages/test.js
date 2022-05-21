import { html, Component } from "/reender.js";
import { getData, pushData } from "/router.js";
export default class Failure extends Component {
  hack() {
    let { num = getData() || 0 } = this.state;
    this.setState({ num: 0 });
    console.log(num);
    pushData(num);
  }
  render({data},{num = getData() || 0}) {
    return html`<div>
      <p className="text-indigo-500">Whats Up with this: ${data?.params?.id}</p>
      <a className="btn-green" href="/">Go Home!</a>
    </div>`;
  }
}
