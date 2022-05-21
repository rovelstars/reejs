import { html, Component } from "/reender.js";
import { load } from "/router.js";

export default class Index extends Component {
  render() {
      return html`<div className="justify-center">
          <p className="text-white text-4xl">404 Not Found!</p>
          <button classList="btn-red" onclick=${()=>{load("/")}}>Go Home!</button>
      </div>`;
  }
}