import { html, Component } from "/reender.js";
import { load } from "/router.js";

export default class Index extends Component {
  render({ data }) {
    return html`<div className="mx-4">
      <span className="text-white text-7xl"
        ><svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-[5rem] h-[5rem] inline-flex self-center -translate-y-2">
<rect x="385.095" y="46" width="28" height="409" fill="currentColor"/>
<rect x="87.0948" y="115" width="28" height="340" fill="currentColor"/>
<rect x="87.0948" y="455" width="28" height="326" transform="rotate(-90 87.0948 455)" fill="currentColor"/>
<rect x="155.627" y="46" width="28" height="97.0532" transform="rotate(45 155.627 46)" fill="currentColor"/>
<rect x="156.095" y="46" width="28" height="76" fill="currentColor"/>
<rect x="108.095" y="143" width="28" height="76" transform="rotate(-90 108.095 143)" fill="currentColor"/>
<rect width="14" height="14" transform="matrix(0 1 1 0 161 201)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 175 188)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 148 188)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 148 215)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 175 215)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 139 340)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 348 340)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 152 327)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 335 327)" fill="currentColor"/>
<rect width="13" height="36" transform="matrix(0 1 1 0 165 314)" fill="currentColor"/>
<rect width="13" height="36" transform="matrix(0 1 1 0 299 314)" fill="currentColor"/>
<rect width="13" height="98" transform="matrix(0 1 1 0 201 301)" fill="currentColor"/>
<rect width="14" height="14" transform="matrix(0 1 1 0 326 201)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 340 188)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 313 188)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 313 215)" fill="currentColor"/>
<rect width="13" height="13" transform="matrix(0 1 1 0 340 215)" fill="currentColor"/>
<rect x="156.095" y="74" width="28" height="257" transform="rotate(-90 156.095 74)" fill="currentColor"/>
</svg>
        ${" "}Aw Snap!</span
      >
      <p className="text-white text-4xl">Page Crashed...</p>
      <p className="text-white text-2xl my-4">
        <span className="font-bold">Error:${" "}</span>${data?.message}
      </p>
      ${data?.message?.includes("Failed to fetch dynamically imported module")
        ? html`<p className="text-white text-2xl my-4">
            <span className="font-bold">Tip:${" "}</span
            >${`This usually means the page to render was not available over the network. Please check your network connection or maybe check whether this page is available over the network.`}
          </p>`
        : html``}
      <button
        classList="btn-red"
        onclick=${() => {
          load("/");
        }}
      >
        Go Home!
      </button>
    </div>`;
  }
}
