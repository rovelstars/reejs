cli.command("failure")
    .describe(`Manage your failure!`)
    .action(() => {
        console.log(color("Welcome to Failure Management", "green"));
    })