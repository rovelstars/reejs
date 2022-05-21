import { html, Component } from "/reender.js";
import BotCard from "/pages/components/BotCard.js";

export default class Failure extends Component {
  render() {
    return html`<div>
      <p className="text-indigo-500">
        Welcome to <span className="text-indigo-600">Failure!</span>
      </p>
      <a className="btn-green" href="/">Go Home!</a>
      <div
        className="mx-2 mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <${BotCard} /><${BotCard} /><${BotCard} />
        <${BotCard} /><${BotCard} /><${BotCard} />
      </div>
    </div>`;
  }
}
