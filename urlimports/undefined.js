export default async function denolandDownloader(url) {
    throw new Error("Could not find a valid cdn provider for esm modules for " + url + "\nConsider Making a PR to add one if this domain exists! Or use esm.sh or esm.run");
}