import { html, Component } from "/reender.js";

export default class Loader extends Component {
  render({ props }, { msg }) {
    return html`<div
      className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden flex flex-col items-center justify-center
         p-5 justify-center items-center backdrop-blur-sm bg-white/30"
    >
      <img src="/img/logo.png" className="h-12 w-12 rounded-full" />
      <h2 className="text-center text-white text-xl font-semibold">
        Loading...
      </h2>
      <p className="w-1/3 text-center text-white">This may take a few seconds, please don't close this page.</p>
    </div>`;
  }
}
