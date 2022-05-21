import { html, Component} from "/reender.js";

export default class Navbar extends Component {
  render() {
    return html`<div className="bg-gradient-to-t dark:from-blush/50 from-blush/70 to-branding/70 sticky top-0 z-50 backdrop-blur-xl py-2 pl-2 mx-auto shadow-lg flex items-center rounded-b-xl">
    <div className="shrink-0">
      <a href="/"><img className="h-12 w-12 rounded-2xl" src="/img/logo.png" alt="RDL Logo" height="3rem" width="3rem" /></a>
    </div>
  </div>`
  }
}