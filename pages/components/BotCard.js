import { html, Component } from "/reender.js";

export default class Navbar extends Component {
  render() {
    return html`<div
      className="bg-gradient-to-b dark:from-blush/50 from-blush/70 to-branding/70 p-3 rounded-md transistion duration-100 transform-gpu"
    >
      <div className="relative transform transition-all duration-100">
        <div className="flex flex-col justify-between md:min-h-card max-h-card">
          <div className="flex">
            <img src="/img/face.png" className="w-24 h-24 mr-2 rounded-md" />
            <div className="flex items-center flex-1">
              <div
                className="ml-6 text-left md:leading-7"
                style="opacity: 1; transform: none;"
              >
                <a
                  className="block mb-2 text-xl font-semibold tracking-wide text-white"
                  href="/"
                  >Failure Management</a
                >
                <div className="flex">
                  <div
                    className="px-3 py-1 mr-3 text-xs font-medium rounded-full bg-blush/30"
                  >
                    <span className="text-gray-200">10 servers</span>
                  </div>
                  <div
                    className="px-3 py-1 mr-3 text-xs font-medium rounded-full bg-blush/30 md:hidden"
                  >
                    <span className="text-gray-200">10 votes</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="flex-initial hidden pt-6 sm:hidden md:block xl:block"
              style="opacity: 1;"
            >
              <a
                className="flex items-center px-3 py-1 transform rounded-full 
            cursor-pointer bg-branding/50 text-gray-200 will-change hover:scale-105 animate transistion-all ease-in-out duration-300"
                href="/sus"
                ><i className="mr-3 fas fa-angle-up"></i>3</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
}
