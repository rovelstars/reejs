import { html, Component } from "/reender.js";
import { load } from "/router.js";

export default class Index extends Component {
  render({data}) {
      return html`<div className="mx-2">
          <h1 className="text-white text-7xl">Aw Snap!</h1>
          <p className="text-white text-4xl">Page Crashed...</p>
          <button classList="btn-red" onclick=${()=>{load("/")}}>Go Home!</button>
      </div>`;
  }
}