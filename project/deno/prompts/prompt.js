import readline from "./readline.cjs";

export default function (question){
    return readline.question(question+" ");
}