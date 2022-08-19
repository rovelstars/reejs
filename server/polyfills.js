export default function ({ hash, html, reeact, ...others }) {
    return {
        IS_BROWSER: false,
        hash,
        html,
        reeact,
        init: async()=>{},
        ...others
    }
}