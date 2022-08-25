export default function ({ hash, html, reeact, ...others }) {
    return {
        IS_BROWSER: false,
        hash,
        html,
        reeact,
        mode: "ssr",
        init: async()=>{},
        ...others
    }
}