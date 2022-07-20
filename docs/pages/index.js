import { render, html, Component } from "/ree.react.js";
export default class CoolPage extends Component {
  render() {
    setInterval(() => {
      if (document.body.scrollTop > 200) {
        $("#navbar").classList.remove("hidden");
      } else {
        $("#navbar").classList.add("hidden");
      }
    }, 10);
    return html`<div
        className="min-h-screen bg-gradient-to-b from-red-500 to-purple-800"
      >
        <div
          id="navbar"
          className="hidden sticky top-0 z-50 rounded-b-2xl bg-purple-800"
        >
          <div className="container mx-auto px-4 py-4 lg:py-6">
            <div className="flex">
              <p
                id="nav-title"
                className="text-white text-2xl lg:text-4xl font-bold text-center"
              >
                Ree.js
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-60 pt-8 align-middle">
          <div className="text-white text-center pt-32 lg:pt-48">
            <h1 className="font-bold text-5xl lg:text-8xl">
              Level Up Your Site
            </h1>
            <p className="mt-4 font-bold lg:text-6xl">With Ree.js</p>
          </div>
        </div>
      </div>
      <div className="px-4 lg:px-16 pt-8">
        <div className="text-white">
          <h1 className="font-bold text-3xl lg:text-6xl">
            Forget About Building
          </h1>
          <div className="grid lg:grid-cols-3">
            <p className="lg:col-span-2 mt-4 font-light lg:mr-32 lg:text-2xl">
              With Ree.js, you don't waste time building the optimized site.
            </p>
          </div>
          <h1 className="mt-8 font-bold text-3xl lg:text-6xl">
            Bundled with Hybrid Web Server
          </h1>
          <div className="grid lg:grid-cols-3">
            <p className="lg:col-span-2 mt-4 font-light lg:mr-32 lg:text-2xl">
              Ree.js measures Lighthouse performance and decides which method
              will perform faster and will cost less resources.
            </p>
          </div>
          <h1 className="mt-8 font-bold text-3xl lg:text-6xl">
            A Powerful Toolkit that is just fast enough
          </h1>
          <div className="grid lg:grid-cols-3">
            <p className="lg:col-span-2 mt-4 font-light lg:mr-32 lg:text-2xl">
              Ree.js Toolkit bundles your frontend project to be used inside a
              non-nodejs project! Now enjoy building frontends with other
              languages like python, rust, C++ and much more!
            </p>
          </div>
          <!-- footer -->
          <div className="mt-8">
            <div className="flex justify-center">
              <span className="text-white font-medium">Work In Progress! <a href="https://dscrdly.com/server" className="text-pink-500 underline-pink-500">Join our server to keep yourself updated!</a></span>
            </div>
            </div>
        </div>
      </div>`;
  }
}
