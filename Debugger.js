import { html, Component, render } from "/reender.js";
import "/dragabilly.js";

class DebuggerButton extends Component {
  render() {
    return html`<button
      id="ree-debugger"
      className="z-[101] bg-gray-500/30 bg-backdrop-xl backdrop-blur text-gray-400 hover:text-white rounded-md p-2 w-10 h-10"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>`;
  }
}

class Debugger extends Component {
  render() {
    return html`<!-- Main modal -->
      <div class="hidden fixed z-[100]" id="ree-devtools">
        <div class="relative p-4 w-full max-w-2xl h-full md:h-auto mx-auto">
          <!-- Modal content -->
          <div
            class="relative bg-white/50 rounded-lg shadow dark:bg-gray-900/70 bg-backdrop-lg backdrop-blur"
          >
            <!-- Modal header -->
            <div
              class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600"
            >
              <h3
                class="text-xl font-semibold text-gray-900 dark:text-white px-4 select-none"
              >
                Devtools Coming Soon!
              </h3>
              <button
                type="button"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                onclick=${() => {
                  document
                    .getElementById("ree-devtools")
                    .classList.add("hidden");
                }}
              >
                <svg
                  class="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <!-- Modal body -->
            <div class="p-6 space-y-6">
              <p
                class="text-base leading-relaxed text-gray-500 dark:text-gray-200"
              >
                Why Am I Here?
              </p>
              <p
                class="text-base leading-relaxed text-gray-500 dark:text-gray-200"
              >
                Just to suffer.
              </p>
            </div>
            <!-- Modal footer -->
            <div
              class="flex items-center p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600"
            >
              <button
                data-modal-toggle="defaultModal"
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onclick=${() => {
                  document
                    .getElementById("ree-devtools")
                    .classList.add("hidden");
                }}
              >
                Yea
              </button>
              <button
                data-modal-toggle="defaultModal"
                type="button"
                className="text-gray-500 bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:text-gray-300 dark:border-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-600"
                onclick=${() => {
                  document
                    .getElementById("ree-devtools")
                    .classList.add("hidden");
                }}
              >
                Sed life
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }
}

render(
  html`<${DebuggerButton} />`,
  document.getElementById("ree-debugger-shell")
);

var debugDraggie = new Draggabilly(document.getElementById("ree-debugger"), {
  containment: "#app",
});

var div = document.createElement("div");
document.getElementById("ree-debugger-shell").appendChild(div);
div.id = "ree-debugger-shell-div";
div.classList.add("absolute");
render(html`<${Debugger} />`, div);


debugDraggie.setPosition(window.innerWidth - 50, window.innerHeight - 50);
debugDraggie.on("staticClick", function () {
  if (document.getElementById("ree-devtools").classList.contains("hidden")) {
    document.getElementById("ree-devtools").classList.remove("hidden");
  } else {
    document.getElementById("ree-devtools").classList.add("hidden");
  }
});
