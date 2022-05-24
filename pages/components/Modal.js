import { html, Component } from "/reender.js";
import { load, getData, pushData, removeData } from "/router.js";
export default class Modal extends Component {

  render({ handleClose, show, children }) {
    return html`<!-- Main modal -->
      <div
        class="${show?"":"hidden"} overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full"
      >
        <div class="relative p-4 w-full max-w-2xl h-full md:h-auto mx-auto">
          <!-- Modal content -->
          <div class="relative bg-white/50 rounded-lg shadow dark:bg-gray-700/50 bg-backdrop-lg backdrop-blur">
            <!-- Modal header -->
            <div
              class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600"
            >
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Terms of Service
              </h3>
              <button
                type="button"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                onclick=${handleClose}
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
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onclick=${handleClose}
                >
                Yea
              </button>
              <button
                data-modal-toggle="defaultModal"
                type="button"
                class="text-gray-500 bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:text-gray-300 dark:border-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-600"
                onclick=${handleClose}
                >
                Sed life
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }
}
