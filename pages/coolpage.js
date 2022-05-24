import { render, html, Component } from "/reender.js";
import { registerPostRender } from "/router.js";
let bots;

export default class CoolPage extends Component {
  render({ props }, { bots = [] }) {
    return html`<div
      className="overflow-hidden bg-gray-700/10 rounded-md absolute w-3/5 inset-y-0 right-8"
    >
    <div className="block w-full h-full">
        <div
        className="-translate-y-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-1"
      />
      <div
        className="-translate-y-8 mt-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-2"
      />
      <div
        className="-translate-y-8 mt-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-3"
      />
      <div
        className="-translate-y-8 mt-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-4"
      />
      <div
        className="-translate-y-8 mt-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-5"
      />
      <div
        className="-translate-y-8 mt-8 grid gap-8 rotate-12 overflow-show grid-cols-8"
        id="bots-list-6"
      /></div>
      
    </div>`;
  }
}

export async function postLoad() {
  bots = await fetch("/bots.json");
  bots = await bots.json();
  render(
    html`${bots.slice(0, 8).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-1")
  );
  document.getElementById("bots-list-1").id = "";
  render(
    html`${bots.slice(8, 16).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
          draggable="false"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-2")
  );
  document.getElementById("bots-list-2").id = "";
  render(
    html`${bots.slice(16, 24).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
          draggable="false"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-3")
  );
  document.getElementById("bots-list-3").id = "";
  render(
    html`${bots.slice(24, 32).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
          draggable="false"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-4")
  );
  document.getElementById("bots-list-4").id = "";
  render(
    html`${bots.slice(32, 40).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
          draggable="false"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-5")
  );
  document.getElementById("bots-list-5").id = "";
  render(
    html`${bots.slice(40, 48).map((b) => {
      return html`<div className="rounded-md">
        <img
          src=${false
            ? "https://images.discordapp.net/avatars/" +
              b.id +
              "/" +
              b.avatar +
              "/.png?size=64"
            : "/img/face.png"}
          className="h-24 w-24 rounded-md"
          draggable="false"
        />
      </div> `;
    })}`,
    document.getElementById("bots-list-6")
  );
  document.getElementById("bots-list-6").id = "";
}
