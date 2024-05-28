const { default: chalk } = require("chalk");
const { program, Option } = require("commander");

class ServeCommand {
  async apply(cli) {
    const loadDevServerOptions = () => {
      return [
        {
          name: "-p, --port <number>",
          description: "specify port number",
        },
      ];
    };
    await cli.makeCommand(
      {
        name: "serve [entries...]",
        description:
          "Run the webpack dev server and watch for source file changes while serving.",
      },
      async () => {
        return loadDevServerOptions();
      },
      async (options) => {
        console.log("\n");
        console.log(
          chalk.yellow(`webpack-dev-sever start and port is ${options.port}!!!`)
        );
        console.log("\n");
      }
    );
  }
}

class WebpackCLI {
  constructor() {
    this.program = program;
    this.program.name("webpack");
  }

  makeOption(command, option) {
    const optionForCommand = new Option(option.name, option.description);
    command.addOption(optionForCommand);
  }

  async makeCommand(commandOptions, options, action) {
    const command = this.program.command(commandOptions.name);
    if (options) {
      options = await options();
      for (const option of options) {
        this.makeOption(command, option);
      }
    }
    command.action(action);
  }

  async loadCommandByName(commandName) {
    if (commandName === "serve") {
      const command = new ServeCommand();
      await command.apply(this);
    }
  }

  async run(args, parseOptions) {
    // 避免使用未定义的 option 时报错
    this.program.allowUnknownOption(true);
    const isKnownCommand = (commandToRun) => commandToRun === "serve";
    this.program.action(async (options, program) => {
      const { operands, unknown } = this.program.parseOptions(program.args);
      const commandToRun = operands[0];
      if (isKnownCommand(commandToRun)) {
        await this.loadCommandByName(commandToRun, true);
      }
      await this.program.parseAsync([commandToRun, ...unknown], {
        from: "user",
      });
    });
    await this.program.parseAsync(args, parseOptions);
  }
}
// node index serve
new WebpackCLI().run(process.argv);
