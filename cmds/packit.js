cli.command("pack-it")
    .describe(`Pack your project for serverless deployment!`)
    .option("-o, --output <output>", "The output file name")
    .action(() => {
        function getFiles(dir, files_) {
            files_ = files_ || [];
            var files = fs.readdirSync(dir);
            for (var i in files) {
                var name = dir + "/" + files[i];
                if (fs.statSync(name).isDirectory()) {
                    getFiles(name, files_);
                }
                else {
                    files_.push(name);
                }
            }
            return files_;
        }
        //get the filenames of all the files in the ".packit" directory
        let filenames = getFiles(".packit/src");
        let data = {};
        //for each filename, read the file and add it to the data object
        for (let filename of filenames) {
            data[filename] = fs.readFileSync(filename, "utf8");
        }
        //write the data object to a file called "data.json"
        fs.writeFileSync("reedata.json", JSON.stringify(data));
    })