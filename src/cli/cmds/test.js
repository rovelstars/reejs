export default async function (prog) {
  prog
    .command("test")
    .describe("test")
    .action(async function () {
      console.log("Ree.js is alive!");
    });
}
