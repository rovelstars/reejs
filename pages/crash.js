import { html, Component } from "/reender.js";
import { load } from "/router.js";

export default class Index extends Component {
  render({ data }) {
    return html`<div className="mx-4">
      <span className="text-white text-7xl"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          xmlns:svgjs="http://svgjs.com/svgjs"
          x="0"
          y="0"
          viewBox="0 0 450 450"
          style="enable-background:new 0 0 512 512;"
          xml:space="preserve"
          class="w-[5rem] h-[5rem] inline-flex self-center -translate-y-2"
        >
          <g>
            <g xmlns="http://www.w3.org/2000/svg">
              <path
                d="m330.297 435h-210.594c-41.281 0-74.865-33.584-74.865-74.865v-270.27c0-41.281 33.584-74.865 74.865-74.865h168.043c2.652 0 5.195 1.054 7.071 2.929l107.416 107.416c1.875 1.875 2.929 4.419 2.929 7.071v227.719c0 41.281-33.584 74.865-74.865 74.865zm-210.594-400c-30.252 0-54.865 24.612-54.865 54.865v270.27c0 30.253 24.612 54.865 54.865 54.865h210.594c30.253 0 54.865-24.612 54.865-54.865v-223.577l-101.558-101.558z"
                fill="#ffffff"
                data-original="#000000"
                class=""
              ></path>
              <path
                d="m395.162 142.416h-74.983c-23.397 0-42.433-19.035-42.433-42.432v-74.984c0-5.523 4.478-10 10-10s10 4.477 10 10v74.984c0 12.369 10.063 22.432 22.433 22.432h74.983c5.522 0 10 4.477 10 10s-4.477 10-10 10z"
                fill="#ffffff"
                data-original="#000000"
                class=""
              ></path>
              <g>
                <path
                  d="m189.989 270.012c-2.559 0-5.119-.977-7.071-2.929-3.905-3.905-3.905-10.237 0-14.143l70.023-70.023c3.906-3.905 10.236-3.905 14.143 0 3.905 3.905 3.905 10.237 0 14.143l-70.023 70.023c-1.954 1.952-4.513 2.929-7.072 2.929z"
                  fill="#ffffff"
                  data-original="#000000"
                  class=""
                ></path>
                <path
                  d="m260.012 270.012c-2.56 0-5.118-.977-7.071-2.929l-70.023-70.023c-3.905-3.905-3.905-10.237 0-14.143 3.905-3.905 10.237-3.905 14.143 0l70.023 70.023c3.905 3.905 3.905 10.237 0 14.143-1.954 1.952-4.513 2.929-7.072 2.929z"
                  fill="#ffffff"
                  data-original="#000000"
                  class=""
                ></path>
              </g>
            </g>
          </g>
        </svg>
        ${" "}Aw Snap!</span
      >
      <p className="text-white text-4xl">Page Crashed...</p>
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
